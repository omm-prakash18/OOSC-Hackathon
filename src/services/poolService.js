/**
 * poolService.js
 * ──────────────────────────────────────────────────────────────────────────
 * High-performance Multi-User Synchronization Engine for FPO Crop Pools.
 * 
 * Features:
 *  1. Firebase Firestore Real-Time Stream (Instant cross-device sync on Vercel & local)
 *  2. REST API / MongoDB Atlas Persistence (/api/pools)
 *  3. Resilient Local Offline Fallback Cache
 */

import { db } from '../firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const API_BASE = '/api/pools';
const FIRESTORE_COLLECTION = 'crop_pools';

/**
 * Get or create a persistent unique user ID for creator authorization.
 */
export function getOrCreateUserId() {
  try {
    let id = localStorage.getItem('lokvani_creator_user_id');
    if (!id) {
      id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('lokvani_creator_user_id', id);
    }
    return id;
  } catch (_) {
    return 'usr_guest_farmer';
  }
}

/**
 * Subscribe to real-time crop pools stream.
 * Automatically synchronizes across all logged-in users on Vercel, mobile, & desktop.
 * @param {Function} onUpdate Callback invoked whenever pools update in real-time
 * @returns {Function} Unsubscribe function
 */
export function subscribeCropPools(onUpdate) {
  let isSubscribed = true;

  // 1. Try Firebase Firestore Real-Time Snapshot Listener
  try {
    if (db) {
      const poolsQuery = query(collection(db, FIRESTORE_COLLECTION));
      const unsubscribe = onSnapshot(poolsQuery, (snapshot) => {
        if (!isSubscribed) return;
        if (!snapshot.empty) {
          const pools = snapshot.docs.map(d => normalizePool({ id: d.id, ...d.data() }));
          // Sort newest first
          pools.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          onUpdate(pools);
        } else {
          // If Firestore collection is empty, trigger fetch from MongoDB / REST API
          fetchCropPools().then(pools => {
            if (isSubscribed && pools.length > 0) onUpdate(pools);
          });
        }
      }, (err) => {
        console.warn('[poolService] Firestore onSnapshot warning:', err.message);
        // Fall back to polling /api/pools
        fetchCropPools().then(pools => {
          if (isSubscribed && pools.length > 0) onUpdate(pools);
        });
      });

      return () => {
        isSubscribed = false;
        try { unsubscribe(); } catch (_) {}
      };
    }
  } catch (err) {
    console.warn('[poolService] Firestore subscription init failed:', err.message);
  }

  // 2. Fallback polling for MongoDB / Express API
  const interval = setInterval(async () => {
    if (!isSubscribed) return;
    const pools = await fetchCropPools();
    if (pools && pools.length > 0) onUpdate(pools);
  }, 4000);

  fetchCropPools().then(pools => {
    if (isSubscribed && pools.length > 0) onUpdate(pools);
  });

  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
}

/**
 * Fetch all active crop selling pools.
 * Queries Firestore first, then falls back to /api/pools and localStorage.
 */
export async function fetchCropPools(state = '', district = '', category = 'All') {
  // 1. Try Firestore
  try {
    if (db) {
      const snap = await getDocs(collection(db, FIRESTORE_COLLECTION));
      if (!snap.empty) {
        let pools = snap.docs.map(d => normalizePool({ id: d.id, ...d.data() }));
        if (category && category !== 'All') {
          pools = pools.filter(p => 
            p.category_en?.toLowerCase() === category.toLowerCase() ||
            p.category_hi?.toLowerCase() === category.toLowerCase()
          );
        }
        pools.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return pools;
      }
    }
  } catch (err) {
    // Firestore error, fallback to REST API
  }

  // 2. Try REST API (/api/pools)
  try {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (district) params.append('district', district);
    if (category && category !== 'All') params.append('category', category);

    const url = params.toString() ? `${API_BASE}?${params.toString()}` : API_BASE;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map(normalizePool);
      }
    }
  } catch (err) {
    // REST API failed, fallback to local storage
  }

  // 3. Fallback Local Storage
  try {
    const saved = localStorage.getItem('lokvani_fpo_pools');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizePool);
    }
  } catch (_) {}

  return [];
}

/**
 * Create a new FPO Crop Selling Pool.
 * Persists to Firestore AND MongoDB API.
 */
export async function createCropPool(poolData) {
  const userId = getOrCreateUserId();
  const poolId = poolData.poolId || poolData.id || `pool_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  
  const payload = {
    ...poolData,
    poolId,
    id: poolId,
    createdByUserId: poolData.createdByUserId || userId,
    createdAt: poolData.createdAt || new Date().toISOString()
  };

  const normalized = normalizePool(payload);

  // 1. Save to Firestore
  try {
    if (db) {
      await setDoc(doc(db, FIRESTORE_COLLECTION, poolId), normalized);
    }
  } catch (err) {
    console.warn('[poolService] Firestore create warning:', err.message);
  }

  // 2. Save to REST API / MongoDB in background
  try {
    fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    }).catch(() => {});
  } catch (_) {}

  return normalized;
}

/**
 * Update an existing Crop Pool.
 */
export async function updateCropPool(poolId, updatedData) {
  const userId = getOrCreateUserId();
  const payload = {
    ...updatedData,
    createdByUserId: updatedData.createdByUserId || userId
  };
  const normalized = normalizePool(payload);

  // 1. Update in Firestore
  try {
    if (db) {
      await setDoc(doc(db, FIRESTORE_COLLECTION, poolId), normalized, { merge: true });
    }
  } catch (err) {
    console.warn('[poolService] Firestore update warning:', err.message);
  }

  // 2. Update in REST API / MongoDB
  try {
    fetch(`${API_BASE}/${encodeURIComponent(poolId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    }).catch(() => {});
  } catch (_) {}

  return normalized;
}

/**
 * Delete a Crop Pool.
 */
export async function deleteCropPool(poolId) {
  const userId = getOrCreateUserId();

  // 1. Delete from Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, FIRESTORE_COLLECTION, poolId));
    }
  } catch (err) {
    console.warn('[poolService] Firestore delete warning:', err.message);
  }

  // 2. Delete from REST API / MongoDB
  try {
    fetch(`${API_BASE}/${encodeURIComponent(poolId)}?creatorId=${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch (_) {}

  return true;
}

/**
 * Join an existing crop pool by committing quantity.
 */
export async function joinCropPool(poolId, commitData) {
  const { farmerName, phone, village, qtl } = commitData;
  const commitQtl = Number(qtl) || 0;

  // 1. Join in Firestore
  try {
    if (db) {
      const snap = await getDocs(collection(db, FIRESTORE_COLLECTION));
      const targetDoc = snap.docs.find(d => d.id === poolId || d.data().poolId === poolId);
      if (targetDoc) {
        const data = targetDoc.data();
        const newFilled = (data.filledQtl || 0) + commitQtl;
        const newStatus = newFilled >= data.targetQtl ? 'CLOSED' : 'FILLING';
        const members = data.members || [];
        members.push({
          farmerName,
          phone,
          village: village || '',
          qtl: commitQtl,
          joinedAt: new Date().toISOString()
        });

        const updatePayload = {
          filledQtl: newFilled,
          participants: (data.participants || 1) + 1,
          status: newStatus,
          members
        };

        await updateDoc(doc(db, FIRESTORE_COLLECTION, targetDoc.id), updatePayload);
        return normalizePool({ ...data, ...updatePayload, id: targetDoc.id });
      }
    }
  } catch (err) {
    console.warn('[poolService] Firestore join warning:', err.message);
  }

  // 2. Join via REST API / MongoDB
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(poolId)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commitData)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return normalizePool(json.data);
    }
  } catch (_) {}

  return null;
}

export function normalizePool(p) {
  if (!p) return null;
  return {
    id: p.poolId || p._id || p.id,
    poolId: p.poolId || p._id || p.id,
    commodity_hi: p.commodity_hi || p.commodity || 'फसल',
    commodity_en: p.commodity_en || p.commodity || 'Crop',
    category_hi: p.category_hi || 'सब्ज़ी',
    category_en: p.category_en || 'Vegetable',
    targetQtl: Number(p.targetQtl) || 100,
    filledQtl: Number(p.filledQtl) || 0,
    buyerName: p.buyerName || 'Verified Procurement Partner',
    buyerLocation: p.buyerLocation || 'APMC Mandi Hub',
    offerPrice: Number(p.offerPrice) || 2500,
    deadline: p.deadline || new Date().toISOString().split('T')[0],
    qualityRequired: p.qualityRequired || 'Grade A',
    status: p.status || 'OPEN',
    coordinatorName_hi: p.coordinatorName_hi || 'किराना ट्रस्ट नोड (सत्यापित)',
    coordinatorName_en: p.coordinatorName_en || 'Kirana Trust Node (Verified)',
    participants: Number(p.participants) || 1,
    members: Array.isArray(p.members) ? p.members : [],
    createdBy: p.createdBy || 'Community Farmer',
    createdByUserId: p.createdByUserId || '',
    createdAt: p.createdAt || new Date().toISOString()
  };
}
