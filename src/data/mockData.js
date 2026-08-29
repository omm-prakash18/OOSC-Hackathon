/**
 * LokVani AI Mock Data Assets
 * Curated for Small Farmers & Micro-Vendors in India
 */

export const GOVT_SCHEMES = [
  {
    id: "scheme-01",
    name: "PM-Kisan Samman Nidhi",
    type: "Central",
    target: "Small & Marginal Farmers",
    eligibility: "Farmers with cultivable landholding up to 2 hectares; Aadhar-seeded bank account & e-KYC required.",
    benefits: "₹6,000 per year paid in 3 equal installments of ₹2,000 directly to bank account.",
    how_to_apply: "Online via pmkisan.gov.in or e-KYC at local Kirana Center with Aadhar Card and Khasra papers.",
    documents: ["Aadhar Card", "Bank Passbook", "Land Khasra/Khatauni Paper"]
  },
  {
    id: "scheme-02",
    name: "PM SVANidhi Scheme",
    type: "Central",
    target: "Street Vendors & Urban Micro-Vendors",
    eligibility: "Street vendors vending in urban areas on or before March 24, 2020 with Certificate of Vending.",
    benefits: "Collateral-free working capital loan up to ₹10,000 (1st tranche), ₹20,000 (2nd tranche), and ₹50,000 (3rd tranche) with 7% interest subsidy.",
    how_to_apply: "Apply on pmsvanidhi.mohua.gov.in or through local ULB/CSC operator with Vending Certificate.",
    documents: ["Vending Certificate / Letter of Recommendation", "Aadhar Card", "Bank Account"]
  },
  {
    id: "scheme-03",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    type: "Central",
    target: "Small & Tenant Farmers",
    eligibility: "Farmers growing notified crops in notified areas including sharecroppers and tenant farmers.",
    benefits: "Comprehensive insurance cover against crop loss due to non-preventable natural risks at nominal premium (1.5% - 2%).",
    how_to_apply: "Apply via pmfby.gov.in, nearest bank branch, or village CSC node within cut-off date.",
    documents: ["Land Ownership/Tenancy proof", "Aadhar Card", "Sowing Certificate"]
  },
  {
    id: "scheme-04",
    name: "Kisan Credit Card (KCC) Scheme",
    type: "Central",
    target: "Farmers, Animal Husbandry & Fishermen",
    eligibility: "All farmers, individual/joint borrowers, tenant farmers, and self-help groups.",
    benefits: "Concessional credit up to ₹3 Lakh at effective 4% interest rate (with prompt repayment incentive).",
    how_to_apply: "Fill 1-page form at local commercial bank branch or CSC center.",
    documents: ["Land Document Copy", "Aadhar Card", "PAN Card / Voter ID"]
  },
  {
    id: "scheme-05",
    name: "PM-KUSUM (Solar Pump Scheme)",
    type: "Central",
    target: "Farmers & Agricultural Groups",
    eligibility: "Individual farmers, panchayats, cooperatives having agricultural land.",
    benefits: "Up to 60% subsidy for installing standalone solar agriculture pumps.",
    how_to_apply: "Apply via state portal (e.g. upagripardarshi.gov.in in UP) or CSC kiosk.",
    documents: ["Land Records", "Aadhar Card", "Bank Account Details"]
  },
  {
    id: "scheme-06",
    name: "Soil Health Card Scheme",
    type: "Central",
    target: "All Farmers",
    eligibility: "Every farmer across rural India.",
    benefits: "Free soil testing report detailing soil nutrient status and customized fertilizer dosage advisory.",
    how_to_apply: "Contact district agriculture officer or village Kirana Agri-clinic operator.",
    documents: ["Khasra Number", "Farmer Mobile Number"]
  },
  {
    id: "scheme-07",
    name: "PM Kisan Maandhan Yojana (PM-KMY)",
    type: "Central",
    target: "Small Farmers aged 18 to 40",
    eligibility: "Small & marginal farmers owning up to 2 hectares of cultivable land.",
    benefits: "Guaranteed minimum monthly pension of ₹3,000 after attaining 60 years of age.",
    how_to_apply: "Enrollment at CSC center with monthly contribution of ₹55 to ₹200 (matched by Govt).",
    documents: ["Aadhar Card", "Savings Bank Account"]
  },
  {
    id: "scheme-08",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    type: "Central",
    target: "Small & Women Farmers",
    eligibility: "Small, marginal, SC/ST, and women farmers.",
    benefits: "40% to 50% subsidy on purchase of agricultural machinery (Tractors, Tillers, Harvesters).",
    how_to_apply: "Apply online at agrimachinery.nic.in.",
    documents: ["Land Record", "Aadhar Card", "Caste Certificate (if applicable)"]
  },
  {
    id: "scheme-09",
    name: "Paramparagat Krishi Vikas Yojana (PKVY)",
    type: "Central",
    target: "Organic Farming Clusters",
    eligibility: "Groups of 50 or more farmers taking up organic farming in 50-acre clusters.",
    benefits: "Financial assistance of ₹50,000 per hectare for organic inputs, certification, and marketing.",
    how_to_apply: "Form local farmer cluster and register via District Agriculture Office.",
    documents: ["Farmer Group Consent", "Land Ownership Papers"]
  },
  {
    id: "scheme-10",
    name: "PM Formalisation of Micro Food Processing Enterprises (PMFME)",
    type: "Central",
    target: "Micro Food Processors & Artisans",
    eligibility: "Existing micro food processing units (pickle, flour mills, fruit pulp) or SHGs.",
    benefits: "35% credit-linked capital subsidy up to ₹10 Lakh per micro-enterprise unit.",
    how_to_apply: "Apply online at pmfme.mofpi.gov.in or through District Resource Person.",
    documents: ["FSSAI License / Registration", "Aadhar Card", "Bank Statement"]
  },
  {
    id: "scheme-11",
    name: "e-NAM (National Agriculture Market)",
    type: "Central",
    target: "All Farmers & Traders",
    eligibility: "Any farmer seeking online direct sale of produce across APMC Mandis.",
    benefits: "Transparent price discovery, online payment, and access to pan-India buyers.",
    how_to_apply: "Register at enam.gov.in or local APMC Mandi helpdesk.",
    documents: ["Aadhar Card", "Bank Account Details", "Mandi Gate Pass"]
  },
  {
    id: "scheme-12",
    name: "UP Agricultural Equipment Subsidy (State)",
    type: "State (Uttar Pradesh)",
    target: "UP Small Farmers",
    eligibility: "Registered farmers on UP Agriculture Portal (upagriculture.com).",
    benefits: "Up to 50% subsidy on seed drills, rotavators, and sprayers via e-lottery.",
    how_to_apply: "Token generation on upagriculture.com using farmer ID.",
    documents: ["Farmer Registration ID", "Aadhar Card", "Bank Account"]
  },
  {
    id: "scheme-13",
    name: "Stand-Up India Scheme",
    type: "Central",
    target: "SC/ST & Women Micro-Entrepreneurs",
    eligibility: "SC/ST and/or women entrepreneurs setting up greenfield micro-enterprises.",
    benefits: "Bank loans between ₹10 Lakh and ₹1 Crore for trading, manufacturing, or service units.",
    how_to_apply: "Apply at standupmitra.in or bank branch.",
    documents: ["Business Proposal", "Caste Certificate", "Identity Proof"]
  },
  {
    id: "scheme-14",
    name: "PM Matsya Sampada Yojana (PMMSY)",
    type: "Central",
    target: "Fish Farmers & Aquaculture Vendors",
    eligibility: "Fishers, fish farmers, fish workers, micro-vendors.",
    benefits: "40% (General) to 60% (Women/SC/ST) subsidy for fish ponds, biofloc units, and motor three-wheelers.",
    how_to_apply: "Apply through District Fisheries Office or pmmsy.dof.gov.in.",
    documents: ["Land/Pond Details", "Aadhar Card", "Bank Account"]
  },
  {
    id: "scheme-15",
    name: "National Livestock Mission (NLM)",
    type: "Central",
    target: "Poultry & Goat Farming Vendors",
    eligibility: "Individual farmers, SHGs, FPOs undertaking goat, sheep, or poultry units.",
    benefits: "50% capital subsidy up to ₹50 Lakh for breed development and farm setup.",
    how_to_apply: "Submit application on nlm.udyamimitra.in.",
    documents: ["Project Report", "Land Availability Proof", "Bank Mandate"]
  }
];

export const MOCK_COMMUNITY_INTEL = [
  { id: "ci-101", item: "Tamatar (Tomato)", price: 28, unit: "kg", location: "Azamgarh Mandi", areaTag: "East UP", reporter: "Ramesh (Farmer)", timestamp: "10 mins ago", verified: true, trend: "up", type: "Mandi Price" },
  { id: "ci-102", item: "Pyaaz (Onion)", price: 34, unit: "kg", location: "Gorakhpur Market", areaTag: "East UP", reporter: "Sunil (Street Vendor)", timestamp: "25 mins ago", verified: true, trend: "flat", type: "Mandi Price" },
  { id: "ci-103", item: "Aloo (Potato)", price: 18, unit: "kg", location: "Varanasi Mandi", areaTag: "East UP", reporter: "Vijay (Vendor)", timestamp: "40 mins ago", verified: true, trend: "down", type: "Mandi Price" },
  { id: "ci-104", item: "Heavy Rain Warning", price: 0, unit: "advisory", location: "Jaunpur Belt", areaTag: "East UP", reporter: "IMD + Local KVK", timestamp: "1 hour ago", verified: true, trend: "alert", type: "Weather Alert" },
  { id: "ci-105", item: "Gehun (Wheat)", price: 24, unit: "kg", location: "Jaunpur Mandi", areaTag: "East UP", reporter: "Amit (Farmer)", timestamp: "1.5 hours ago", verified: true, trend: "up", type: "Mandi Price" },
  { id: "ci-106", item: "Tomato Blight Outbreak", price: 0, unit: "alert", location: "Basti Farms Cluster", areaTag: "Central UP", reporter: "Verma Kirana Node", timestamp: "2 hours ago", verified: true, trend: "warning", type: "Pest Warning" },
  { id: "ci-107", item: "High Demand: Green Chillies", price: 42, unit: "kg", location: "Lucknow Wholesale Mandi", areaTag: "Central UP", reporter: "Kishan (Vendor)", timestamp: "2.5 hours ago", verified: true, trend: "up", type: "Demand Alert" },
  { id: "ci-108", item: "Baingan (Brinjal)", price: 22, unit: "kg", location: "Ayodhya Mandi", areaTag: "Central UP", reporter: "Dinesh (Farmer)", timestamp: "3 hours ago", verified: true, trend: "flat", type: "Mandi Price" },
  { id: "ci-109", item: "Bhindi (Okra)", price: 32, unit: "kg", location: "Azamgarh Mandi", areaTag: "East UP", reporter: "Suresh (Vendor)", timestamp: "3.5 hours ago", verified: true, trend: "up", type: "Mandi Price" },
  { id: "ci-110", item: "DAP Fertilizer Shortage", price: 1350, unit: "bag", location: "Mau District Co-op", areaTag: "East UP", reporter: "Gupta Kirana Node", timestamp: "4 hours ago", verified: true, trend: "alert", type: "Supply Shortage" },
  { id: "ci-111", item: "Karela (Bitter Gourd)", price: 38, unit: "kg", location: "Gorakhpur Market", areaTag: "East UP", reporter: "Manish (Farmer)", timestamp: "5 hours ago", verified: true, trend: "down", type: "Mandi Price" },
  { id: "ci-112", item: "Garlic (Lahsun)", price: 140, unit: "kg", location: "Varanasi Wholesale", areaTag: "East UP", reporter: "Anand (Trader)", timestamp: "6 hours ago", verified: true, trend: "up", type: "Mandi Price" }
];

export const MOCK_USER_QUERIES = [
  {
    id: "q-demo-01",
    spokenQuery: "Mujhe PM-Kisan scheme ke liye apply karna hai aur tamatar ka mandi bhav jan-na hai.",
    queryCategory: "Govt Scheme + Mandi Price",
    is_high_stakes: true,
    risk_category: "FINANCIAL_ELIGIBILITY",
    routing: "FLAGGED_FOR_TRUST_NODE",
    ideal_ai_answer_hi: "PM-Kisan yojana ke liye Aadhar card, bank passbook, aur zameen ki Khasra nakal zaroori hai. Aaj Azamgarh Mandi me tamatar ₹28 kilo hai.",
    ideal_ai_answer_en: "PM-Kisan requires Aadhar, bank passbook, and Khasra land paper. Today tomato rate at Azamgarh Mandi is ₹28/kg.",
    trust_reason: "Scheme application involves financial eligibility verification. Needs Kirana node document check."
  },
  {
    id: "q-demo-02",
    spokenQuery: "Tamatar me keeda laga hai aur patte peele ho rahe hain, konsa spray karun?",
    queryCategory: "Agri Crop Advisory",
    is_high_stakes: true,
    risk_category: "PESTICIDE_SAFETY",
    routing: "FLAGGED_FOR_TRUST_NODE",
    ideal_ai_answer_hi: "Tamatar ke keede ke liye Copper Oxychloride 3 gram prati liter paani me milakar spray karein. Sahi matra ke liye Kirana dada se salah lein.",
    ideal_ai_answer_en: "Spray Copper Oxychloride (3g/liter water) for tomato blight. Verify exact dosage with your Kirana Trust Node.",
    trust_reason: "Chemical pesticide advice could damage crops if dosage is wrong. Requires human edge verification."
  },
  {
    id: "q-demo-03",
    spokenQuery: "Aaj Gorakhpur Mandi me pyaaz aur aloo ka rate kya chal raha hai?",
    queryCategory: "Market Price Lookup",
    is_high_stakes: false,
    risk_category: "NONE",
    routing: "AUTO_VERIFIED_DIRECT",
    ideal_ai_answer_hi: "Aaj Gorakhpur Mandi me pyaaz ₹34 prati kilo aur aloo ₹18 prati kilo bik raha hai.",
    ideal_ai_answer_en: "Today at Gorakhpur Mandi, onion is ₹34/kg and potato is ₹18/kg.",
    trust_reason: "Low-risk price inquiry auto-verified using real-time community price ticker."
  },
  {
    id: "q-demo-04",
    spokenQuery: "Main thela lagata hun, kya mujhe PM SVANidhi me 10,000 ka bina guarantee loan mil sakta hai?",
    queryCategory: "Micro-Vendor Scheme",
    is_high_stakes: true,
    risk_category: "FINANCIAL_LOAN",
    routing: "FLAGGED_FOR_TRUST_NODE",
    ideal_ai_answer_hi: "Haan, PM SVANidhi me bina kisi guarantee ke ₹10,000 ka loan milta hai. Apka Vending Certificate aur Aadhar Card zaroori hai.",
    ideal_ai_answer_en: "Yes, PM SVANidhi provides collateral-free ₹10,000 working loan. Vending certificate & Aadhar card are required.",
    trust_reason: "Financial loan scheme query: Operator needs to verify street vendor municipal recommendation letter."
  },
  {
    id: "q-demo-05",
    spokenQuery: "Agle do din me barish hogi kya? Wheat stock khule me pada hai.",
    queryCategory: "Weather Advisory",
    is_high_stakes: false,
    risk_category: "NONE",
    routing: "AUTO_VERIFIED_DIRECT",
    ideal_ai_answer_hi: "Haan, agle 48 ghante me halki se madhyam barish ki sambhavna hai. Gehun ke stock ko tarpaulin se turant dhak dein.",
    ideal_ai_answer_en: "Yes, light to moderate rain expected in next 48 hours. Cover your wheat stock with tarpaulin immediately.",
    trust_reason: "Auto-verified weather alert fetched directly from regional MET forecast."
  },
  {
    id: "q-demo-06",
    spokenQuery: "Soil Health Card me mitti ki jaanch kaise karwayein aur kitna kharcha aayega?",
    queryCategory: "Soil Testing",
    is_high_stakes: false,
    risk_category: "NONE",
    routing: "AUTO_VERIFIED_DIRECT",
    ideal_ai_answer_hi: "Mitti ki jaanch bilkul muft hoti hai. Apne khet ki mitti ka sample apne local Kirana center ya Krishi Vikas Kendra me jama karein.",
    ideal_ai_answer_en: "Soil testing under Soil Health Card is 100% free. Submit soil sample to your local Kirana node or Krishi Kendra.",
    trust_reason: "General informational query about free govt facility."
  },
  {
    id: "q-demo-07",
    spokenQuery: "Gehun ki fasal ke liye per acre kitna DAP aur Urea fertilizer daalna chahiye?",
    queryCategory: "Fertilizer Dosage Advisory",
    is_high_stakes: true,
    risk_category: "AGRICULTURAL_DOSAGE",
    routing: "FLAGGED_FOR_TRUST_NODE",
    ideal_ai_answer_hi: "Gehun me per acre 50 kg DAP aur 45 kg Urea ki sifarish hai. Apni mitti ki jaanch ke anusar Kirana operator se final dosage confirm karein.",
    ideal_ai_answer_en: "Recommended per acre is 50kg DAP and 45kg Urea. Confirm custom dosage with your Kirana Node based on soil type.",
    trust_reason: "Fertilizer dosage query: Incorrect application harms soil health and yields."
  },
  {
    id: "q-demo-08",
    spokenQuery: "Solar pump lagwane ke liye kitni subsidy milti hai aur PM-KUSUM me kaise online karein?",
    queryCategory: "Govt Subsidy Scheme",
    is_high_stakes: true,
    risk_category: "FINANCIAL_ELIGIBILITY",
    routing: "FLAGGED_FOR_TRUST_NODE",
    ideal_ai_answer_hi: "PM-KUSUM yojana me solar pump par 60% tak ki subsidy milti hai. Zameen ke papers ke sath CSC center par online token generate karein.",
    ideal_ai_answer_en: "PM-KUSUM offers up to 60% subsidy on solar pumps. Generate online token at CSC node with land ownership papers.",
    trust_reason: "Capital subsidy query involving state e-lottery token generation."
  },
  {
    id: "q-demo-09",
    spokenQuery: "Aaj Lucknow Wholesale Mandi me hari mirch aur karela ka kya bhav hai?",
    queryCategory: "Market Price Lookup",
    is_high_stakes: false,
    risk_category: "NONE",
    routing: "AUTO_VERIFIED_DIRECT",
    ideal_ai_answer_hi: "Lucknow wholesale mandi me hari mirch ₹42 prati kilo aur karela ₹38 prati kilo bik raha hai.",
    ideal_ai_answer_en: "At Lucknow wholesale mandi, green chillies are selling at ₹42/kg and bitter gourd at ₹38/kg.",
    trust_reason: "Low-risk price query auto-verified from community ticker."
  },
  {
    id: "q-demo-10",
    spokenQuery: "Kisan Credit Card (KCC) se 3 Lakh ka loan kitne interest rate par milta hai?",
    queryCategory: "Credit & Financial Loan",
    is_high_stakes: true,
    risk_category: "FINANCIAL_LOAN",
    routing: "FLAGGED_FOR_TRUST_NODE",
    ideal_ai_answer_hi: "KCC me ₹3 Lakh tak ka loan samay par chukane par sirf 4% annual interest rate par milta hai. Land paper aur Aadhar bank me jama karein.",
    ideal_ai_answer_en: "KCC provides credit up to ₹3 Lakh at an effective 4% interest rate on timely repayment. Submit land papers to bank.",
    trust_reason: "High-stakes credit policy and bank documentation process."
  }
];

export const PUBLIC_API_INTEGRATIONS_NOTE = [
  {
    name: "AGMARKNET API (Data.gov.in)",
    domain: "Real-time Mandi Market Prices",
    description: "Official Govt API providing daily wholesale & retail commodity prices across 3,000+ APMC mandis in India.",
    endpoint_example: "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
    how_it_replaces_mock: "Replaces initial Mandi price database with live official daily price feeds filtered by state, district, and crop."
  },
  {
    name: "myScheme API (Digital India / NeGD)",
    domain: "Government Scheme Discovery & Eligibility",
    description: "National platform hosting 800+ central & state schemes with structured eligibility rules.",
    endpoint_example: "https://www.myscheme.gov.in/api/v1/schemes",
    how_it_replaces_mock: "Provides automated JSON scheme criteria for RAG vector search and live eligibility verification."
  },
  {
    name: "IMD Weather & Agromet Advisory API (Mausam / IMD)",
    domain: "Hyperlocal Weather & Block-Level Agromet Advisories",
    description: "Indian Meteorological Department API providing 5-day weather forecasts and weekly crop advisories.",
    endpoint_example: "https://mausam.imd.gov.in/api/district_forecast",
    how_it_replaces_mock: "Supplies real-time rain forecasts, humidity, and official Krishi Vigyan Kendra (KVK) advisories."
  },
  {
    name: "Bhashini Indic Language API (Ministry of Electronics & IT)",
    domain: "Indic Speech-to-Text & Text-to-Speech",
    description: "National AI Language Portal supporting STT and TTS across 22 scheduled Indian languages and local dialects.",
    endpoint_example: "https://dhruva-api.bhashini.gov.in/services/inference",
    how_it_replaces_mock: "Extends browser Web Speech API to support rural dialects (e.g. Bhojpuri, Awadhi, Maithili, Marwari)."
  }
];
