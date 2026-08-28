/**
 * LokVani AI — End-to-End API & ML Model Feature Verification Script
 * Tests live HTTP API calls to:
 * 1. POST /api/query (Full AI Orchestrator & Gemini Pipeline)
 * 2. POST /api/soil/predict (Soil ML Model)
 * 3. POST /api/crop/predict (Crop Recommendation ML Model)
 * 4. POST /api/distress/check (Farmer Distress Risk Engine)
 */

import http from 'http';

function makePostRequest(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

async function runApiVerification() {
  console.log('=== STARTING LOKVANI AI MODEL API FEATURE VERIFICATION ===\n');

  // Test 1: Soil ML Model Prediction Endpoint
  try {
    console.log('1. Testing POST /api/soil/predict (Soil Health ML Model)...');
    const res1 = await makePostRequest('/api/soil/predict', {
      nitrogen: 60,
      phosphorus: 35,
      potassium: 45,
      ph: 6.5,
      soilType: 'loamy'
    });
    console.log('Status:', res1.status);
    console.log('Response:', JSON.stringify(res1.data, null, 2));
    if (res1.status === 200 && res1.data.success) {
      console.log('✅ Soil Model API Passed!\n');
    } else {
      console.error('❌ Soil Model API Failed!\n');
    }
  } catch (err) {
    console.error('❌ Soil Model API Request Error:', err.message, '\n');
  }

  // Test 2: Crop ML Model Recommendation Endpoint
  try {
    console.log('2. Testing POST /api/crop/predict (Crop Recommendation ML Model)...');
    const res2 = await makePostRequest('/api/crop/predict', {
      soilType: 'clayey',
      temperature: 28,
      ph: 6.2
    });
    console.log('Status:', res2.status);
    console.log('Response:', JSON.stringify(res2.data, null, 2));
    if (res2.status === 200 && res2.data.success) {
      console.log('✅ Crop Model API Passed!\n');
    } else {
      console.error('❌ Crop Model API Failed!\n');
    }
  } catch (err) {
    console.error('❌ Crop Model API Request Error:', err.message, '\n');
  }

  // Test 3: Distress Engine Endpoint
  try {
    console.log('3. Testing POST /api/distress/check (Farmer Distress Risk Engine)...');
    const res3 = await makePostRequest('/api/distress/check', {
      rainfallDeviationPct: -35,
      priceDropPct: -20,
      daysToLoanDue: 12,
      cropType: 'wheat'
    });
    console.log('Status:', res3.status);
    console.log('Response:', JSON.stringify(res3.data, null, 2));
    if (res3.status === 200 && res3.data.success) {
      console.log('✅ Distress Risk Engine API Passed!\n');
    } else {
      console.error('❌ Distress Risk Engine API Failed!\n');
    }
  } catch (err) {
    console.error('❌ Distress Risk Engine API Request Error:', err.message, '\n');
  }

  // Test 4: AI Voice Query Pipeline Endpoint
  try {
    console.log('4. Testing POST /api/query (AI Voice Query Pipeline)...');
    const res4 = await makePostRequest('/api/query', {
      transcribedText: 'Mujhe gehun ki kheti me urea kitna daalna chahiye?',
      user_location: 'Azamgarh, UP',
      dialect: 'hi'
    });
    console.log('Status:', res4.status);
    console.log('Response:', JSON.stringify(res4.data, null, 2));
    if (res4.status === 200 && res4.data.success) {
      console.log('✅ Voice Query AI Pipeline API Passed!\n');
    } else {
      console.error('❌ Voice Query AI Pipeline API Failed!\n');
    }
  } catch (err) {
    console.error('❌ Voice Query AI Pipeline API Request Error:', err.message, '\n');
  }

  console.log('=== VERIFICATION COMPLETED ===');
}

runApiVerification();
