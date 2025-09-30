#!/usr/bin/env python3
"""
Script to update QI knowledge base with enhanced coaching templates
"""
import json

# Read the existing QI knowledge base
with open("apps/api/app/qi_kb_seed.json", "r", encoding="utf-8") as f:
    qi_kb = json.load(f)

# Add enhanced coaching templates
qi_kb["enhanced_coaching_templates"] = {
    "6_part_framework": {
        "skill_detected_formats": {
            "clarifying": "Clarifying ({quality_rating})",
            "probing": "Probing ({quality_rating})",
            "follow_up": "Follow-up ({quality_rating})",
            "comparative": "Comparative ({quality_rating})",
            "open_question": "Open Question ({quality_rating})",
            "closed_question": "Closed Question ({quality_rating})"
        },
        "quality_ratings": {
            "5": "excellent execution",
            "4": "strong attempt",
            "3": "decent effort",
            "2": "attempted, but needs work",
            "1": "attempted, but very basic"
        },
        "strengths_starters": [
            "You showed curiosity by",
            "You demonstrated",
            "You attempted to",
            "You recognized that",
            "You tried to"
        ],
        "improvement_starters": [
            "To strengthen this",
            "The main gap is",
            "Your question needs",
            "To improve clarity",
            "The key missing piece is"
        ]
    }
}

# Add enhanced scoring rules
qi_kb["scoring_rules_v2"] = {
    "strict_caps": {
        "too_vague": {"overall_max": 2, "clarity_max": 2},
        "closed_question": {"overall_max": 2, "depth_max": 2},
        "too_broad": {"overall_max": 2, "clarity_max": 2},
        "no_context": {"relevance_max": 2}
    },
    "score_meanings": {
        "1": "Weak (vague, closed, trivial)",
        "2": "Below average (has issues but some merit)",
        "3": "Okay (surface-level but workable)",
        "4": "Strong (clear, specific, open-ended)",
        "5": "Excellent (precise, layered, invites deep insight)"
    }
}

# Write the updated QI knowledge base
with open("apps/api/app/qi_kb_seed.json", "w", encoding="utf-8") as f:
    json.dump(qi_kb, f, indent=2, ensure_ascii=False)

print("QI knowledge base updated successfully!")