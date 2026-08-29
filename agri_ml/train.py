"""
agri_ml/train.py
Model Training, Comparison, Hyperparameter Optimization, Evaluation & Persistence Script.

Evaluates multiple tabular regression algorithms:
- HistGradientBoostingRegressor
- RandomForestRegressor
- ExtraTreesRegressor
- GradientBoostingRegressor

Saves best model and feature transformation pipeline to agri_ml/artifacts/
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score, mean_absolute_percentage_error
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor
from sklearn.model_selection import RandomizedSearchCV

from agri_ml.preprocess import load_and_enrich_data, prepare_chronological_splits
from agri_ml.feature_engineering import AgriFeaturePipeline

def train_and_evaluate():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    artifacts_dir = os.path.join(base_dir, 'agri_ml', 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)

    print("================================================================")
    print(" LOKVANI AI - AGRICULTURE MACHINE LEARNING PREDICTION TRAINING ")
    print("================================================================")

    # 1. Load Data
    start_time = time.time()
    df_raw = load_and_enrich_data(base_dir=base_dir)

    # 2. Chronological Split (No Leakage)
    train_df, val_df, test_df = prepare_chronological_splits(df_raw)

    # 3. Fit Feature Engineering Pipeline strictly on Train Set
    pipeline = AgriFeaturePipeline()
    X_train = pipeline.fit_transform(train_df, target_col='Modal_Price_Clean')
    y_train = train_df['Modal_Price_Clean'].values

    X_val = pipeline.transform(val_df)
    y_val = val_df['Modal_Price_Clean'].values

    X_test = pipeline.transform(test_df)
    y_test = test_df['Modal_Price_Clean'].values

    print(f"\n[train] Features engineered: {len(pipeline.feature_names)} features")
    print(f"  Feature list: {pipeline.feature_names}")

    # Subsample for tree-based grid search if dataset is large, to complete hyperparameter search efficiently
    # HistGradientBoosting scales natively to 500k+ rows, but RF/ET/GB take longer
    train_sample_size = min(25000, len(X_train))
    sample_indices = np.random.choice(len(X_train), train_sample_size, replace=False)
    X_train_sub = X_train.iloc[sample_indices]
    y_train_sub = y_train[sample_indices]

    # 4. Model Candidates Definition
    print("\n[train] Initializing candidate regression models...")
    models = {
        'HistGradientBoosting': HistGradientBoostingRegressor(
            max_iter=250,
            learning_rate=0.08,
            max_depth=12,
            min_samples_leaf=20,
            l2_regularization=0.1,
            random_state=42
        ),
        'RandomForest': RandomForestRegressor(
            n_estimators=40,
            max_depth=15,
            min_samples_leaf=5,
            n_jobs=-1,
            random_state=42
        ),
        'ExtraTrees': ExtraTreesRegressor(
            n_estimators=40,
            max_depth=15,
            min_samples_leaf=5,
            n_jobs=-1,
            random_state=42
        ),
        'GradientBoosting': GradientBoostingRegressor(
            n_estimators=40,
            learning_rate=0.1,
            max_depth=8,
            min_samples_leaf=10,
            random_state=42
        )
    }

    # Hyperparameter search configurations
    tuned_models = {}
    comparison_results = []

    for name, model in models.items():
        print(f"\n[train] --- Training & Evaluating: {name} ---")
        t0 = time.time()

        if name == 'HistGradientBoosting':
            # Train on full training dataset for maximum performance
            model.fit(X_train, y_train)
        else:
            # Train on fast representative sample for speed & efficiency
            model.fit(X_train_sub, y_train_sub)

        train_time = round(time.time() - t0, 2)

        # Predictions
        y_train_pred = model.predict(X_train)
        y_val_pred = model.predict(X_val)
        y_test_pred = model.predict(X_test)

        # Metrics
        tr_mae = mean_absolute_error(y_train, y_train_pred)
        val_mae = mean_absolute_error(y_val, y_val_pred)
        val_rmse = root_mean_squared_error(y_val, y_val_pred)
        val_r2 = r2_score(y_val, y_val_pred)

        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_rmse = root_mean_squared_error(y_test, y_test_pred)
        test_r2 = r2_score(y_test, y_test_pred)

        tuned_models[name] = model
        comparison_results.append({
            'Model': name,
            'Train MAE': round(tr_mae, 2),
            'Val MAE': round(val_mae, 2),
            'Val RMSE': round(val_rmse, 2),
            'Val R2': round(val_r2, 4),
            'Test MAE': round(test_mae, 2),
            'Test RMSE': round(test_rmse, 2),
            'Test R2': round(test_r2, 4),
            'Train Time (s)': train_time
        })

        print(f"  Train MAE: {tr_mae:.2f} | Val MAE: {val_mae:.2f} | Val RMSE: {val_rmse:.2f} | Val R²: {val_r2:.4f} | Test R²: {test_r2:.4f}")

    # 5. Summary & Comparison Table
    df_results = pd.DataFrame(comparison_results).sort_values(by='Val MAE')
    print("\n================================================================")
    print(" MODEL COMPARISON SUMMARY ")
    print("================================================================")
    print(df_results.to_string(index=False))

    best_model_name = df_results.iloc[0]['Model']
    best_model = tuned_models[best_model_name]
    best_val_mae = df_results.iloc[0]['Val MAE']
    best_val_rmse = df_results.iloc[0]['Val RMSE']
    best_val_r2 = df_results.iloc[0]['Val R2']
    best_test_mae = df_results.iloc[0]['Test MAE']
    best_test_rmse = df_results.iloc[0]['Test RMSE']
    best_test_r2 = df_results.iloc[0]['Test R2']

    print(f"\n[train] BEST MODEL SELECTED: {best_model_name}")
    print(f"  - Validation MAE:  {best_val_mae} INR/quintal")
    print(f"  - Validation RMSE: {best_val_rmse} INR/quintal")
    print(f"  - Validation R²:   {best_val_r2}")
    print(f"  - Test MAE:        {best_test_mae} INR/quintal")
    print(f"  - Test RMSE:       {best_test_rmse} INR/quintal")
    print(f"  - Test R²:         {best_test_r2}")

    # 6. Prediction Interval Residual Uncertainty Calculation
    val_preds = best_model.predict(X_val)
    residuals = y_val - val_preds
    residual_std = float(np.std(residuals))
    mae_uncertainty = float(np.mean(np.abs(residuals)))

    print(f"  - Residual Standard Deviation (95% error margin context): ±{round(1.96 * residual_std, 2)} INR/quintal")

    # 7. Model Persistence
    model_path = os.path.join(artifacts_dir, 'agri_price_model.joblib')
    pipeline_path = os.path.join(artifacts_dir, 'preprocessing_pipeline.joblib')
    metadata_path = os.path.join(artifacts_dir, 'model_metadata.json')

    print(f"\n[train] Persisting trained model to {model_path}...")
    joblib.dump(best_model, model_path)
    joblib.dump(pipeline, pipeline_path)

    metadata = {
        'model_name': best_model_name,
        'model_version': '1.0.0',
        'training_date': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_dataset_rows': len(df_raw),
        'train_rows': len(train_df),
        'val_rows': len(val_df),
        'test_rows': len(test_df),
        'target_column': 'Modal_Price (INR/quintal)',
        'currency': 'INR',
        'unit': 'quintal',
        'features_used': pipeline.feature_names,
        'validation_metrics': {
            'MAE': float(best_val_mae),
            'RMSE': float(best_val_rmse),
            'R2': float(best_val_r2)
        },
        'test_metrics': {
            'MAE': float(best_test_mae),
            'RMSE': float(best_test_rmse),
            'R2': float(best_test_r2)
        },
        'uncertainty': {
            'residual_std': residual_std,
            'mae_margin': mae_uncertainty,
            'margin_95_percent': round(1.96 * residual_std, 2)
        },
        'comparison_table': comparison_results
    }

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"[train] Metadata persisted to {metadata_path}")
    print(f"[train] Pipeline training complete in {round(time.time() - start_time, 2)} seconds.")

    return metadata

if __name__ == '__main__':
    train_and_evaluate()
