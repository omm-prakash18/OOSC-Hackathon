"""
agri_ml/api.py
API & Service Integration Interface for LokVani AI.

Exposes a clean Python JSON interface and CLI listener for LokVani AI service calls.
"""

import sys
import json
from agri_ml.predict import predict_crop_price

def handle_api_request(json_payload_str):
    try:
        data = json.loads(json_payload_str)
        result = predict_crop_price(data)
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # CLI invocation with JSON string arg
        raw_arg = sys.argv[1]
        print(handle_api_request(raw_arg))
    else:
        # Interactive stdin or demo invocation
        demo_payload = {
            "crop": "Potato",
            "soil_type": "Loamy",
            "soil_ph": 6.2,
            "soil_moisture": 45,
            "rainfall": 120,
            "wind_speed": 10,
            "temperature": 22,
            "humidity": 65,
            "location": "Uttar Pradesh",
            "season": "Rabi"
        }
        print("LokVani Agriculture ML API - Demo Request:")
        print(handle_api_request(json.dumps(demo_payload)))
