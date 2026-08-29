"""
agri_ml/feature_engineering.py
Feature Engineering & Transformation Pipeline for LokVani AI Agriculture Model.

Creates agriculture-specific interaction features, target encodings, frequency encodings,
and numerical scaling parameters strictly fitted on the training split.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

class AgriFeaturePipeline:
    def __init__(self):
        self.label_encoders = {}
        self.target_means = {}
        self.global_target_mean = 0.0
        self.freq_encodings = {}
        self.feature_names = []
        self.categorical_cols = ['Commodity', 'STATE', 'District Name', 'Market Name', 'Variety', 'Grade', 'season', 'soil_type']
        self.numerical_cols = ['soil_ph', 'soil_moisture', 'rainfall', 'wind_speed', 'temperature', 'humidity', 'year', 'month', 'day_of_year', 'quarter']

    def fit(self, train_df, target_col='Modal_Price_Clean'):
        print("[feature_engineering] Fitting feature pipeline on training set...")
        self.global_target_mean = float(train_df[target_col].mean())

        # Fit Target Means for categorical columns (Smoothing with global mean)
        for col in self.categorical_cols:
            grp = train_df.groupby(col)[target_col].agg(['mean', 'count'])
            # Smoothing formula: (count * mean + 10 * global_mean) / (count + 10)
            smoothed_mean = (grp['count'] * grp['mean'] + 10 * self.global_target_mean) / (grp['count'] + 10)
            self.target_means[col] = smoothed_mean.to_dict()

            # Frequency encoding
            freqs = (train_df[col].value_counts() / len(train_df)).to_dict()
            self.freq_encodings[col] = freqs

            # Label Encoding (with 'Unknown' fallback handling)
            le = LabelEncoder()
            unique_vals = list(train_df[col].unique()) + ['Unknown']
            le.fit(unique_vals)
            self.label_encoders[col] = le

        return self

    def transform(self, df):
        df_out = df.copy()

        # 1. Agriculture interaction & physical domain features
        df_out['temp_humidity_index'] = df_out['temperature'] * (df_out['humidity'] / 100.0)
        df_out['rainfall_moisture_interaction'] = df_out['rainfall'] * df_out['soil_moisture']
        df_out['wind_moisture_ratio'] = df_out['wind_speed'] / (df_out['soil_moisture'] + 1e-5)
        df_out['ph_neutral_diff'] = (df_out['soil_ph'] - 6.5).abs()

        # 2. Categorical Encodings (Label, Target Mean, Frequency)
        for col in self.categorical_cols:
            # Map Target Means with fallback to global mean
            target_map = self.target_means.get(col, {})
            df_out[f'{col}_target_enc'] = df_out[col].map(target_map).fillna(self.global_target_mean)

            # Map Frequency Encodings with fallback to 0
            freq_map = self.freq_encodings.get(col, {})
            df_out[f'{col}_freq'] = df_out[col].map(freq_map).fillna(0.0)

            # Map Label Encodings
            le = self.label_encoders[col]
            known_classes = set(le.classes_)
            col_safe = df_out[col].apply(lambda x: x if x in known_classes else 'Unknown')
            df_out[f'{col}_label'] = le.transform(col_safe)

        # Build feature column list
        engineered_cols = [
            'temp_humidity_index', 'rainfall_moisture_interaction', 
            'wind_moisture_ratio', 'ph_neutral_diff'
        ]
        cat_target_cols = [f'{col}_target_enc' for col in self.categorical_cols]
        cat_freq_cols = [f'{col}_freq' for col in self.categorical_cols]
        cat_label_cols = [f'{col}_label' for col in self.categorical_cols]

        feature_cols = self.numerical_cols + engineered_cols + cat_target_cols + cat_freq_cols + cat_label_cols
        self.feature_names = feature_cols

        return df_out[feature_cols]

    def fit_transform(self, train_df, target_col='Modal_Price_Clean'):
        self.fit(train_df, target_col=target_col)
        return self.transform(train_df)
