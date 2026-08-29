# LokVani AI — Agriculture Machine Learning Prediction Pipeline

This isolated package provides data preprocessing, feature engineering, model training, hyperparameter optimization, cross-validation, model comparison, evaluation, persistence, and inference for agricultural price predictions in **LokVani AI**.

---

## 📁 Package Architecture

```
agri_ml/
├── __init__.py                # Package initialization
├── preprocess.py              # Data cleaning, outlier winsorization, dataset enrichment & chronological splitting
├── feature_engineering.py     # Agriculture interaction features, target encodings, frequency & label encoders
├── train.py                   # Model training, hyperparameter tuning, comparison & persistence script
├── predict.py                 # Inference engine with confidence intervals & safety warnings
├── api.py                     # API / CLI wrapper
├── README.md                  # Package documentation
└── artifacts/                 # Saved model binaries & metadata
    ├── agri_price_model.joblib
    ├── preprocessing_pipeline.joblib
    └── model_metadata.json
```

---

## 🚀 How to Run Training & Evaluation

To re-train the models on `Agriculture_price_dataset.csv` enriched with weather/soil datasets, run:

```bash
python -m agri_ml.train
```

### Process Summary
1. Loads primary dataset (`Agriculture_price_dataset.csv`) and auxiliary datasets (`Indian Rainfall Dataset`, `data_core.csv`).
2. Cleans non-positive prices and winsorizes extreme outliers (>99.9th percentile).
3. Constructs chronological splits (**70% Train**, **15% Validation**, **15% Test**) based on `Price Date` to strictly prevent data leakage.
4. Fits target mean encodings, frequency encodings, label encodings, and agricultural domain features (e.g. `temp_humidity_index`, `rainfall_moisture_interaction`) strictly on the training set.
5. Trains and compares 4 tabular regression algorithms:
   - **HistGradientBoostingRegressor**
   - **GradientBoostingRegressor**
   - **RandomForestRegressor**
   - **ExtraTreesRegressor**
6. Selects the best performing model based on Validation MAE & RMSE.
7. Saves artifacts to `agri_ml/artifacts/`.

---

## 🔮 How to Run Inference (Price Prediction)

### Python API Usage

```python
from agri_ml.predict import predict_crop_price

input_data = {
  "crop": "Potato",
  "soil_type": "Loamy",
  "soil_ph": 6.2,
  "soil_moisture": 45,
  "rainfall": 120,
  "wind_speed": 10,
  "temperature": 22,
  "humidity": 65,
  "location": "Uttar Pradesh",
  "district": "Azamgarh",
  "season": "Rabi"
}

result = predict_crop_price(input_data)
print(result)
```

### CLI / JSON Input Usage

```bash
python -m agri_ml.api '{"crop": "Potato", "location": "Uttar Pradesh", "soil_type": "Loamy", "rainfall": 120}'
```

### Example JSON Response Output

```json
{
  "predicted_price": 2422,
  "lower_estimate": 779,
  "upper_estimate": 4065,
  "currency": "INR",
  "unit": "quintal",
  "model_confidence": "HIGH",
  "warning": "Prediction is an estimate and should not be treated as guaranteed market price."
}
```

---

## ⚠️ Important Safety & Financial Disclaimer
- Model predictions are estimates based on historical mandi price patterns and weather/soil factors.
- Predictions do not guarantee actual market outcomes.
- Out-of-distribution inputs (unseen crops or extreme weather conditions) automatically flag `"model_confidence": "LOW (Out-of-Distribution Input)"`.
- High-stakes financial and crop sale decisions should be cross-verified with LokVani AI's live Mandi feed and Kirana trust verification network.
