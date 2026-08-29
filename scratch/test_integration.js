import { isAgriculturePredictionQuery, extractPredictionInputs, predictAgriculturePrice } from '../src/services/agriMlService.js';

console.log('====================================================');
console.log(' LOKVANI AI - INTEGRATION TEST SUITE ');
console.log('====================================================');

// Test 1: Normal AI Query
console.log('\n--- Test 1: Normal AI Query ---');
console.log('Query: "What is photosynthesis?"');
console.log('Prediction Triggered:', isAgriculturePredictionQuery('What is photosynthesis?'));

// Test 2: Existing Agriculture Information
console.log('\n--- Test 2: Existing Agriculture Information ---');
console.log('Query: "What is Kharif season?"');
console.log('Prediction Triggered:', isAgriculturePredictionQuery('What is Kharif season?'));

// Test 3: Verified Mandi Query
console.log('\n--- Test 3: Verified Mandi Query ---');
console.log('Query: "What is today\'s rice mandi price?"');
console.log('Prediction Triggered:', isAgriculturePredictionQuery("What is today's rice mandi price?"));

// Test 4: Agriculture Prediction Query
console.log('\n--- Test 4: Agriculture Prediction Query ---');
const q4 = 'Predict rice price using these conditions: soil pH 6.5, rainfall 820, temperature 28, humidity 72, West Bengal.';
console.log('Query:', q4);
console.log('Prediction Triggered:', isAgriculturePredictionQuery(q4));
const inputs4 = extractPredictionInputs(q4);
console.log('Extracted Inputs:', inputs4);
const res4 = predictAgriculturePrice(inputs4);
console.log('ML Model Output:\n', JSON.stringify(res4, null, 2));

// Test 5: Missing Information Query
console.log('\n--- Test 5: Missing Information Query ---');
const q5 = 'Predict the price of rice.';
const inputs5 = extractPredictionInputs(q5);
console.log('Extracted Inputs:', inputs5);
const res5 = predictAgriculturePrice(inputs5);
console.log('ML Model Output:\n', JSON.stringify(res5, null, 2));

// Test 6: Out-of-Distribution Query
console.log('\n--- Test 6: Out-of-Distribution Query ---');
const q6 = 'Predict price for dragonfruit with rainfall 9999mm and temperature 80C';
const inputs6 = extractPredictionInputs(q6);
console.log('Extracted Inputs:', inputs6);
const res6 = predictAgriculturePrice(inputs6);
console.log('ML Model Output:\n', JSON.stringify(res6, null, 2));

// Test 7: Graceful Model Error Isolation
console.log('\n--- Test 7: Model Error Isolation ---');
const res7 = predictAgriculturePrice({ invalid_field: 'xyz' });
console.log('Result with edge case payload:\n', JSON.stringify(res7, null, 2));
