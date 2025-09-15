#!/usr/bin/env python3
"""
Test script for Daily Challenge Coaching Upgrade v3
Tests the "Wait, what?" test vector as specified in the upgrade document.
"""

import json
import requests
import sys
from typing import Dict, Any

# Configuration
API_BASE_URL = "https://roga-api.fly.dev"  # or "http://localhost:8000" for local testing
TEST_SCENARIO = "Your teacher explains a project, but you're still not sure what to do. The teacher is about to move on to the next part of class. What question could you ask to make the directions clearer before it's too late?"
TEST_QUESTION = "Wait, what?"

def test_classification(scenario: str, question: str) -> Dict[str, Any]:
    """Test the /classify endpoint"""
    url = f"{API_BASE_URL}/classify"
    payload = {
        "scenario_text": scenario,
        "user_question": question
    }

    print(f"Testing classification endpoint: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Classification Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def test_coaching(scenario: str, question: str, classification: Dict[str, Any]) -> Dict[str, Any]:
    """Test the /coach endpoint"""
    url = f"{API_BASE_URL}/coach"
    payload = {
        "scenario_text": scenario,
        "user_question": question,
        "classification": classification
    }

    print(f"\nTesting coaching endpoint: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Coaching Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def test_full_pipeline(scenario: str, question: str) -> Dict[str, Any]:
    """Test the full /daily-challenge-feedback pipeline"""
    url = f"{API_BASE_URL}/daily-challenge-feedback"
    payload = {
        "scenario_text": scenario,
        "user_question": question
    }

    print(f"\nTesting full pipeline endpoint: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Full Pipeline Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def validate_test_vector(classification: Dict[str, Any], coaching: Dict[str, Any]):
    """Validate the test results against expected behavior"""
    print("\n" + "="*50)
    print("VALIDATION RESULTS")
    print("="*50)

    # Expected behavior for "Wait, what?":
    # - issues should include ["too_vague","closed_question"]
    # - overall score should be ≤ 2
    # - strengths should acknowledge curiosity only
    # - improvement should point to "exact unclear part"
    # - examples should be clarifying questions

    validation_results = []

    if classification:
        issues = classification.get("issues", [])
        scores = classification.get("scores", {})
        overall = scores.get("overall", 0)

        # Check for expected issues
        if "too_vague" in issues:
            validation_results.append("✅ Classification correctly identified 'too_vague'")
        else:
            validation_results.append("❌ Classification missed 'too_vague' issue")

        if "closed_question" in issues:
            validation_results.append("✅ Classification correctly identified 'closed_question'")
        else:
            validation_results.append("❌ Classification missed 'closed_question' issue")

        # Check overall score cap
        if overall <= 2:
            validation_results.append(f"✅ Overall score properly capped at {overall}/5")
        else:
            validation_results.append(f"❌ Overall score {overall}/5 should be ≤ 2 for vague/closed questions")

    if coaching:
        strengths = coaching.get("strengths", "").lower()
        improvement = coaching.get("improvement", "").lower()
        examples = coaching.get("example_upgrades", [])

        # Check strengths (should acknowledge curiosity)
        if "curiosity" in strengths or "curious" in strengths:
            validation_results.append("✅ Strengths acknowledge curiosity")
        else:
            validation_results.append("❌ Strengths should acknowledge curiosity for basic questions")

        # Check improvement advice
        if "specific" in improvement or "exact" in improvement or "unclear" in improvement:
            validation_results.append("✅ Improvement advice focuses on specificity")
        else:
            validation_results.append("❌ Improvement should guide toward being more specific")

        # Check example upgrades
        if len(examples) >= 2:
            validation_results.append(f"✅ Provided {len(examples)} example upgrades")

            clarifying_count = 0
            for example in examples:
                example_lower = example.lower()
                if any(word in example_lower for word in ["which", "what exactly", "what specific", "what part"]):
                    clarifying_count += 1

            if clarifying_count >= 1:
                validation_results.append(f"✅ Examples include {clarifying_count} clarifying questions")
            else:
                validation_results.append("❌ Examples should include clarifying question patterns")
        else:
            validation_results.append("❌ Should provide at least 2 example upgrades")

    for result in validation_results:
        print(result)

    # Summary
    passed = sum(1 for r in validation_results if r.startswith("✅"))
    total = len(validation_results)
    print(f"\nValidation Summary: {passed}/{total} checks passed")

    return passed == total

def main():
    print("Daily Challenge Coaching Upgrade v3 - Test Suite")
    print("=" * 60)
    print(f"Testing with scenario: {TEST_SCENARIO}")
    print(f"Testing with question: '{TEST_QUESTION}'")
    print("=" * 60)

    # Test individual endpoints
    classification = test_classification(TEST_SCENARIO, TEST_QUESTION)

    if classification:
        coaching = test_coaching(TEST_SCENARIO, TEST_QUESTION, classification)
    else:
        coaching = {}

    # Test full pipeline
    full_result = test_full_pipeline(TEST_SCENARIO, TEST_QUESTION)

    # Validate results
    if classification and coaching:
        all_passed = validate_test_vector(classification, coaching)
        print(f"\n{'🎉 ALL TESTS PASSED!' if all_passed else '⚠️  SOME TESTS FAILED'}")
        return 0 if all_passed else 1
    else:
        print("\n❌ API endpoints not accessible - cannot validate")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)