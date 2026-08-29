"""
agri_ml/predict.py
Inference & Price Prediction Engine for LokVani AI.

Accepts input dictionaries containing crop, location, weather, and soil features.
Returns predicted market price (INR/quintal), uncertainty bounds (lower & upper estimates),
confidence level, and explicit safety disclaimer.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np

class AgriPricePredictor:
    def __init__(self, artifacts_dir=None):
        if artifacts_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            artifacts_dir = os.path.join(base_dir, 'agri_ml', 'artifacts')

        self.artifacts_dir = artifacts_dir
        self.model_path = os.path.join(artifacts_dir, 'agri_price_model.joblib')
        self.pipeline_path = os.path.join(artifacts_dir, 'preprocessing_pipeline.joblib')
        self.metadata_path = os.path.join(artifacts_dir, 'model_metadata.json')

        self.model = None
        self.pipeline = None
        self.metadata = {}

        self._load_artifacts()

    def _load_artifacts(self):
        if not os.path.exists(self.model_path) or not os.path.exists(self.pipeline_path):
            raise FileNotFoundError(
                f"[predict] Model artifacts not found at {self.artifacts_dir}. Please run 'python -m agri_ml.train' first."
            )

        self.model = joblib.load(self.model_path)
        self.pipeline = joblib.load(self.pipeline_path)

        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, 'r') as f:
                self.metadata = json.load(f)

    def predict(self, input_data):
        """
        Accepts dict with user input features.
        Returns price prediction, lower/upper estimates, confidence, and warning.
        """
        if not isinstance(input_data, dict):
            raise ValueError("[predict] Input data must be a Python dictionary or JSON object.")

        # Standardize key names
        crop = input_data.get('crop') or input_data.get('commodity') or 'Potato'
        location = input_data.get('location') or input_data.get('state') or 'Uttar Pradesh'
        district = input_data.get('district') or input_data.get('location') or 'Azamgarh'
        market = input_data.get('market') or f"{district} Mandi"
        variety = input_data.get('variety') or 'Desi'
        grade = input_data.get('grade') or 'FAQ'
        season = input_data.get('season') or 'Kharif'
        soil_type = input_data.get('soil_type') or 'Loamy'

        # Defaults for numeric parameters
        soil_ph = float(input_data.get('soil_ph', 6.5))
        soil_moisture = float(input_data.get('soil_moisture', 45.0))
        rainfall = float(input_data.get('rainfall', 85.0))
        wind_speed = float(input_data.get('wind_speed', 10.0))
        temperature = float(input_data.get('temperature', 25.0))
        humidity = float(input_data.get('humidity', 65.0))

        # Handle date parsing
        date_str = input_data.get('date')
        if date_str:
            dt = pd.to_datetime(date_str, errors='coerce')
            if pd.isna(dt):
                dt = pd.Timestamp.now()
        else:
            dt = pd.Timestamp.now()

        year = dt.year
        month = dt.month
        day_of_year = dt.dayofyear
        quarter = dt.quarter

        # Construct single-row DataFrame
        row_dict = {
            'Commodity': str(crop).title(),
            'STATE': str(location).title(),
            'District Name': str(district).title(),
            'Market Name': str(market).title(),
            'Variety': str(variety).title(),
            'Grade': str(grade).title(),
            'season': str(season).title(),
            'soil_type': str(soil_type).title(),
            'soil_ph': soil_ph,
            'soil_moisture': soil_moisture,
            'rainfall': rainfall,
            'wind_speed': wind_speed,
            'temperature': temperature,
            'humidity': humidity,
            'year': year,
            'month': month,
            'day_of_year': day_of_year,
            'quarter': quarter
        }

        df_single = pd.DataFrame([row_dict])

        # Transform using fitted pipeline
        X_feats = self.pipeline.transform(df_single)

        # Generate model point prediction
        raw_pred = self.model.predict(X_feats)[0]
        predicted_price = int(round(max(50.0, float(raw_pred))))

        # Determine confidence & out-of-distribution flags
        known_crops = set(self.pipeline.label_encoders['Commodity'].classes_)
        known_states = set(self.pipeline.label_encoders['STATE'].classes_)

        is_ood = (row_dict['Commodity'] not in known_crops) or \
                 (rainfall > 2000.0 or rainfall < 0) or \
                 (temperature > 55.0 or temperature < -5.0)

        if is_ood:
            model_confidence = "LOW (Out-of-Distribution Input)"
        elif row_dict['STATE'] not in known_states:
            model_confidence = "MEDIUM"
        else:
            model_confidence = "HIGH"

        # Calculate prediction interval
        margin_95 = self.metadata.get('uncertainty', {}).get('margin_95_percent', 350.0)
        lower_estimate = max(10, int(round(predicted_price - margin_95)))
        upper_estimate = int(round(predicted_price + margin_95))

        currency = self.metadata.get('currency', 'INR')
        unit = self.metadata.get('unit', 'quintal')

        return {
            "predicted_price": predicted_price,
            "lower_estimate": lower_estimate,
            "upper_estimate": upper_estimate,
            "currency": currency,
            "unit": unit,
            "model_confidence": model_confidence,
            "warning": "Prediction is an estimate and should not be treated as guaranteed market price."
        }

# Singleton instance helper
_predictor_instance = None

def get_predictor():
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = AgriPricePredictor()
    return _predictor_instance

def predict_crop_price(input_data):
    predictor = get_predictor()
    return predictor.predict(input_data)

if __name__ == '__main__':
    # Demonstration CLI call
    sample_input = {
        "crop": "Rice",
        "soil_type": "Alluvial",
        "soil_ph": 6.5,
        "soil_moisture": 42,
        "rainfall": 820,
        "wind_speed": 11,
        "temperature": 28,
        "humidity": 72,
        "location": "West Bengal",
        "season": "Kharif"
    }

    try:
        print("\n--- SAMPLE INFERENCE CALL ---")
        print("Input:", json.dumps(sample_input, indent=2))
        res = predict_crop_price(sample_input)
        print("Output:", json.dumps(res, indent=2))
    except Exception as e:
        print("Inference error (run training first):", e)
