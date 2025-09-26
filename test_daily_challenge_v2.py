#!/usr/bin/env python3
"""
Test script for Daily Challenge Coaching Upgrade v.2
Tests the new 6-part framework and stricter scoring requirements.
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

def test_coaching_v2(scenario: str, question: str, classification: Dict[str, Any]) -> Dict[str, Any]:
    """Test the new /coach/v2 endpoint with 6-part framework"""
    url = f"{API_BASE_URL}/coach/v2"
    payload = {
        "scenario_text": scenario,
        "user_question": question,
        "classification": classification
    }

    print(f"\nTesting v.2 coaching endpoint: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"v.2 Coaching Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def test_full_pipeline_v2(scenario: str, question: str) -> Dict[str, Any]:
    """Test the full /daily-challenge-feedback/v2 pipeline"""
    url = f"{API_BASE_URL}/daily-challenge-feedback/v2"
    payload = {
        "scenario_text": scenario,
        "user_question": question
    }

    print(f"\nTesting v.2 full pipeline endpoint: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"v.2 Full Pipeline Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def validate_v2_requirements(classification: Dict[str, Any], coaching: Dict[str, Any]):
    """Validate the v.2 test results against requirements"""
    print("\n" + "="*60)
    print("V.2 VALIDATION RESULTS")
    print("="*60)

    validation_results = []

    if classification:
        issues = classification.get("issues", [])
        scores = classification.get("scores", {})
        overall = scores.get("overall", 0)

        # V.2 Requirement: Cap vague or closed questions at ≤2/5 overall
        if "too_vague" in issues or "closed_question" in issues:
            if overall <= 2:
                validation_results.append(f"✅ Stricter scoring: Overall score {overall}/5 properly capped (≤2 for vague/closed)")
            else:
                validation_results.append(f"❌ Stricter scoring failed: Overall score {overall}/5 should be ≤2 for vague/closed questions")

        # Check for expected issues
        if "too_vague" in issues:
            validation_results.append("✅ Classification correctly identified 'too_vague'")
        else:
            validation_results.append("❌ Classification missed 'too_vague' issue")

        if "closed_question" in issues:
            validation_results.append("✅ Classification correctly identified 'closed_question'")
        else:
            validation_results.append("❌ Classification missed 'closed_question' issue")

    if coaching:
        # V.2 Requirement: 6-part framework validation
        required_fields = ["skill_detected", "strengths", "improvement_area", "coaching_nugget", "example_upgrades", "progress_note"]

        for field in required_fields:
            if field in coaching:
                validation_results.append(f"✅ 6-part framework: '{field}' field present")
            else:
                validation_results.append(f"❌ 6-part framework: Missing '{field}' field")

        # V.2 Requirement: skill_detected format
        skill_detected = coaching.get("skill_detected", "")
        if "(" in skill_detected and ")" in skill_detected:
            validation_results.append("✅ skill_detected follows format 'Skill (quality rating)'")
        else:
            validation_results.append("❌ skill_detected should follow format 'Skill (quality rating)'")

        # V.2 Requirement: Direct, encouraging, instructional voice
        strengths = coaching.get("strengths", "").lower()
        improvement_area = coaching.get("improvement_area", "").lower()

        if strengths and any(word in strengths for word in ["curiosity", "curious", "showed", "attempted"]):
            validation_results.append("✅ Strengths acknowledge positive elements")
        else:
            validation_results.append("❌ Strengths should acknowledge positive elements")

        # V.2 Requirement: coaching_nugget from QI Library
        coaching_nugget = coaching.get("coaching_nugget", "")
        if coaching_nugget and len(coaching_nugget) > 20:  # Reasonable length check
            validation_results.append("✅ Coaching nugget provided with substance")
        else:
            validation_results.append("❌ Coaching nugget should be substantive teaching content")

        # V.2 Requirement: example_upgrades count
        examples = coaching.get("example_upgrades", [])
        if len(examples) >= 2:
            validation_results.append(f"✅ Provided {len(examples)} example upgrades (≥2 required)")

            # Check if examples are questions
            question_count = sum(1 for ex in examples if ex.strip().endswith("?"))
            if question_count >= 2:
                validation_results.append(f"✅ {question_count} examples are properly formatted as questions")
            else:
                validation_results.append(f"❌ Examples should be phrased as questions")
        else:
            validation_results.append("❌ Should provide at least 2 example upgrades")

        # V.2 Requirement: progress_note gamification
        progress_note = coaching.get("progress_note", "")
        if progress_note and any(char in progress_note for char in ["🌟", "🎯", "🚀", "Level", "→"]):
            validation_results.append("✅ Progress note includes gamified elements")
        else:
            validation_results.append("❌ Progress note should include gamified/motivational elements")

        # V.2 Requirement: Word count constraint (≤120 words)
        all_feedback_text = f"{coaching.get('strengths', '')} {coaching.get('improvement_area', '')} {coaching.get('coaching_nugget', '')}"
        word_count = len(all_feedback_text.split())
        if word_count <= 120:
            validation_results.append(f"✅ Word count {word_count} within limit (≤120)")
        else:
            validation_results.append(f"❌ Word count {word_count} exceeds limit (≤120)")

    for result in validation_results:
        print(result)

    # Summary
    passed = sum(1 for r in validation_results if r.startswith("✅"))
    total = len(validation_results)
    print(f"\nV.2 Validation Summary: {passed}/{total} checks passed")

    return passed == total

def main():
    print("Daily Challenge Coaching Upgrade v.2 - Test Suite")
    print("=" * 70)
    print(f"Testing with scenario: {TEST_SCENARIO}")
    print(f"Testing with question: '{TEST_QUESTION}'")
    print("=" * 70)

    # Test individual endpoints
    classification = test_classification(TEST_SCENARIO, TEST_QUESTION)

    if classification:
        coaching_v2 = test_coaching_v2(TEST_SCENARIO, TEST_QUESTION, classification)
    else:
        coaching_v2 = {}

    # Test full v.2 pipeline
    full_result_v2 = test_full_pipeline_v2(TEST_SCENARIO, TEST_QUESTION)

    # Validate v.2 results
    if classification and coaching_v2:
        all_passed = validate_v2_requirements(classification, coaching_v2)
        print(f"\n{'🎉 ALL V.2 TESTS PASSED!' if all_passed else '⚠️  SOME V.2 TESTS FAILED'}")
        return 0 if all_passed else 1
    else:
        print("\n❌ v.2 API endpoints not accessible - cannot validate")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)