#!/usr/bin/env python3
"""
Direct test to check if test line appears in V3 feedback
"""
import requests
import json

url = "https://roga-api.fly.dev/daily-challenge-feedback/v3"
payload = {
    "scenario_text": "Your teacher explains a project, but you are still not sure what to do.",
    "user_question": "Wait, what?"
}

print("Testing V3 endpoint directly...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print(f"\nFull Response: {json.dumps(result, indent=2)}")

        # Check specifically for the test line
        clarity_feedback = result.get("feedback", {}).get("skill_feedback", {}).get("clarity", "")
        print(f"\nClarity Feedback: {clarity_feedback}")

        if "THIS IS A TEST LINE ONLY" in clarity_feedback:
            print("\n✅ TEST LINE FOUND! Enhanced skill feedback is working.")
        else:
            print("\n❌ TEST LINE NOT FOUND! There's an issue with skill feedback.")

        # Also check the scores to see what triggered the feedback
        scores = result.get("feedback", {}).get("qi_score", {})
        print(f"\nScores: {scores}")

    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Request failed: {e}")