#!/usr/bin/env python3
"""
Simple test script for Enhanced Daily Challenge Coaching v3
"""

import json
import requests
import sys

# Configuration
API_BASE_URL = "https://roga-api.fly.dev"
TEST_SCENARIO = "Your teacher explains a project, but you're still not sure what to do. The teacher is about to move on to the next part of class. What question could you ask to make the directions clearer before it's too late?"
TEST_QUESTION = "Wait, what?"

def test_v3_pipeline():
    """Test the V3 enhanced pipeline"""
    url = f"{API_BASE_URL}/daily-challenge-feedback/v3"
    payload = {
        "scenario_text": TEST_SCENARIO,
        "user_question": TEST_QUESTION
    }

    print("Testing Enhanced Daily Challenge Coaching v3")
    print("=" * 60)
    print(f"Question: '{TEST_QUESTION}'")
    print(f"API URL: {url}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("\\nV3 Enhanced Response:")
            print(json.dumps(result, indent=2))

            # Quick validation
            feedback = result.get("feedback", {})

            print("\\nQuick Validation:")
            print(f"- Overall Score: {feedback.get('qi_score', {}).get('overall', 'N/A')}/5")
            print(f"- Skill Detected: {feedback.get('skill_detected', 'N/A')}")
            print(f"- Has Skill Feedback: {'Yes' if feedback.get('skill_feedback') else 'No'}")
            print(f"- Example Upgrades Count: {len(feedback.get('example_upgrades', []))}")
            print(f"- Progress Note: {feedback.get('progress_note', 'N/A')[:50]}...")

            return True
        else:
            print(f"Error: {response.text}")
            return False

    except Exception as e:
        print(f"Request failed: {e}")
        return False

def test_fallback_v2():
    """Test V2 as fallback if V3 fails"""
    url = f"{API_BASE_URL}/daily-challenge-feedback/v2"
    payload = {
        "scenario_text": TEST_SCENARIO,
        "user_question": TEST_QUESTION
    }

    print("\\nTesting V2 fallback:")
    print(f"API URL: {url}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("V2 Response received successfully")
            return True
        else:
            print(f"V2 Error: {response.text}")
            return False

    except Exception as e:
        print(f"V2 Request failed: {e}")
        return False

def main():
    print("Enhanced Daily Challenge Coaching Test")
    print("=" * 50)

    # Test V3 first
    v3_success = test_v3_pipeline()

    if not v3_success:
        print("\\nV3 failed, testing V2 fallback...")
        v2_success = test_fallback_v2()
        if v2_success:
            print("\\nV2 works - V3 needs debugging")
            return 1
        else:
            print("\\nBoth V3 and V2 failed")
            return 1
    else:
        print("\\nV3 Enhanced Coaching is working!")
        return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)