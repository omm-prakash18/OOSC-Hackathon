/**
 * logisticsService.js
 * Location-Optimized Transport & Storage Board Service
 * 
 * Dynamically provides real APMC mandi freight routes, State Warehousing Corporation (SWC),
 * Central Warehousing Corporation (CWC), and Cold Storage facilities tailored to the user's
 * specific district and state.
 */

import { fetchLocationOptimizedLogistics } from './realDataService.js';

/**
 * Fetch storage facilities dynamically tailored to district & state
 */
export async function fetchStorage(state = 'Uttar Pradesh', district = '') {
  const { storage } = fetchLocationOptimizedLogistics(district, state);
  return storage;
}

/**
 * Fetch transport listings dynamically tailored to district & state APMC routes
 */
export async function fetchTransport(state = 'Uttar Pradesh', district = '') {
  const { transport } = fetchLocationOptimizedLogistics(district, state);
  return transport;
}
