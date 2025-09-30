#!/usr/bin/env python3
"""
Script to add enhanced v3 helper functions to main.py
"""

# Read the main.py file
with open("apps/api/app/main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Find the insertion point before the v3 endpoints
insertion_point = content.find("@app.post(\"/coach/v3\"")
if insertion_point == -1:
    print("Could not find v3 endpoint to insert helpers before")
    exit(1)

# V3 helper functions to insert
v3_helpers = '''
# Enhanced v3 helper functions
def validate_and_cap_scores_v3(scores: Dict[str, int], issues: List[str]) -> Dict[str, int]:
    """Enhanced v3 scoring validation with stricter rules"""
    result = scores.copy()

    # Load enhanced scoring rules from QI_KB
    scoring_rules = QI_KB.get("scoring_rules_v2", {})
    strict_caps = scoring_rules.get("strict_caps", {})

    if ROGA_STRICT_SCORING:
        # Apply strict caps from QI knowledge base
        for issue in issues:
            if issue in strict_caps:
                caps = strict_caps[issue]
                for dimension, max_score in caps.items():
                    if dimension in result:
                        result[dimension] = min(result[dimension], max_score)

    return result

def get_enhanced_skill_feedback(scores: Dict[str, int]) -> Dict[str, str]:
    """Generate enhanced skill-specific feedback with detailed guidance"""
    skill_feedback_templates = QI_KB.get("skill_feedback", {})

    feedback = {}
    for skill in ["clarity", "depth", "relevance", "empathy"]:
        score = scores.get(skill, 3)
        skill_templates = skill_feedback_templates.get(skill, {})

        # Get detailed feedback for the specific score level
        if str(score) in skill_templates:
            feedback_text = skill_templates[str(score)]
        else:
            # Enhanced fallback with more detailed guidance
            feedback_text = get_detailed_fallback_feedback(skill, score)

        feedback[skill] = feedback_text

    return feedback

def get_detailed_fallback_feedback(skill: str, score: int) -> str:
    """Generate detailed fallback feedback for each skill dimension"""
    fallbacks = {
        "clarity": {
            1: "Very unclear - help others understand exactly what information you need by pointing to the specific detail or concept that's confusing.",
            2: "Somewhat vague - it's unclear which part specifically needs explanation. Strong clarity requires targeting the precise gap in understanding.",
            3: "Decent clarity, but could be more specific about what you need to know. Clarity improves when you name the exact piece that needs explanation.",
            4: "Strong clarity - your question targets a specific area with minimal ambiguity. Good clarity helps others know exactly how to help you.",
            5: "Crystal clear - anyone could understand exactly what you're asking for. Excellent clarity targets the precise gap in understanding."
        },
        "depth": {
            1: "No depth - asks for simple repetition without advancing understanding. Depth in questioning means seeking underlying reasons or factors.",
            2: "Shallow - stays at surface level without exploring underlying factors. Greater depth comes from asking 'why' questions and probing causes.",
            3: "Moderate depth - touches on some important elements but could go deeper. Depth improves when you explore underlying reasons or implications.",
            4: "Good depth - goes beyond surface level to explore important aspects. Strong depth probes into the 'why' behind situations.",
            5: "Excellent depth - digs into underlying factors and invites rich exploration. Depth means exploring causes, implications, and hidden factors."
        },
        "relevance": {
            1: "Not relevant - doesn't address the actual problem or situation. Relevance means connecting directly to what matters most in the current context.",
            2: "Somewhat off-track - misses the main point or priority. Better relevance comes from identifying what would actually be most useful.",
            3: "Generally relevant but could target more critical elements. Relevance improves when you focus on the most important factors for this context.",
            4: "Highly relevant - focuses on important aspects of the situation. Strong relevance targets information that truly matters for moving forward.",
            5: "Perfectly relevant - directly addresses the core issue that matters most. Relevance means focusing on what will actually impact decisions."
        },
        "empathy": {
            1: "No empathy - completely ignores how others might be affected or feel. Empathy in questioning means showing awareness of others' viewpoints.",
            2: "Limited empathy - focuses mainly on your own needs without considering others. Greater empathy comes from recognizing others' perspectives.",
            3: "Some empathy shown, but could better consider others' viewpoints. Empathy improves when you acknowledge others' situations.",
            4: "Good empathy - considers how others might feel or be affected. Strong empathy shows awareness of others' perspectives and challenges.",
            5: "Excellent empathy awareness - shows genuine care and considers others' perspectives. Empathy means acknowledging their viewpoint and constraints."
        }
    }

    return fallbacks.get(skill, {}).get(score, f"Your {skill} shows room for improvement.")

def get_quality_rating(overall_score: int) -> str:
    """Get quality rating text for skill_detected field"""
    quality_ratings = QI_KB.get("enhanced_coaching_templates", {}).get("6_part_framework", {}).get("quality_ratings", {})
    return quality_ratings.get(str(overall_score), "attempted, needs focus")

def generate_strengths(user_question: str, primary_skill: str, assets: Dict) -> str:
    """Generate strengths feedback using QI library templates"""
    starters = QI_KB.get("enhanced_coaching_templates", {}).get("6_part_framework", {}).get("strengths_starters", [])

    # Get positive templates for the skill
    good_templates = assets.get("feedback_templates", [])

    if good_templates:
        return good_templates[0]
    elif starters:
        starter = starters[0]
        return f"{starter} asking a {primary_skill} question."
    else:
        return "You showed curiosity by asking this question."

def generate_improvement_area(issues: List[str], primary_skill: str, assets: Dict) -> str:
    """Generate improvement area feedback based on detected issues"""
    starters = QI_KB.get("enhanced_coaching_templates", {}).get("6_part_framework", {}).get("improvement_starters", [])
    needs_work_templates = assets.get("feedback_templates", [])

    if needs_work_templates:
        return needs_work_templates[0] if needs_work_templates else "Focus on being more specific."

    # Generate based on issues
    if "too_vague" in issues:
        return "Your question is too vague - point to the exact part that needs explanation."
    elif "closed_question" in issues:
        return "This limits responses - try opening it up to invite more expansive thinking."
    elif starters:
        starter = starters[0]
        return f"{starter}, add more specificity to guide a helpful response."
    else:
        return "Focus on making your question more specific and actionable."

def retrieve_assets_v3(skill: str, performance_tier: str) -> Dict:
    """Enhanced asset retrieval for v3 with better fallbacks"""
    assets = retrieve_assets(skill, performance_tier)  # Use existing function

    # Ensure we have progress notes
    if not assets.get("progress_notes"):
        progress_notes = QI_KB.get("progress_notes", {}).get(skill, [])
        assets["progress_notes"] = progress_notes

    return assets

def get_default_nugget(skill: str) -> str:
    """Get default coaching nugget for a skill"""
    nuggets = QI_KB.get("coaching_nuggets", {}).get(skill, [])
    return nuggets[0] if nuggets else f"Strong {skill} questions are specific and actionable."

def get_default_examples(skill: str) -> List[str]:
    """Get default example upgrades for a skill"""
    examples = QI_KB.get("example_upgrades", {}).get(skill, {})
    all_examples = examples.get("easy", []) + examples.get("medium", [])
    return all_examples[:3] if all_examples else ["What exactly needs clarification?", "Which step is unclear?", "What should happen first?"]

def get_default_progress_note(skill: str) -> str:
    """Get default progress note for a skill"""
    progress_notes = QI_KB.get("progress_notes", {}).get(skill, [])
    return progress_notes[0] if progress_notes else f"🌟 {skill.title()} Level 1 → Keep practicing to level up!"

def create_v3_fallback_response(primary_skill: str, scores: Dict[str, int], assets: Dict) -> 'DailyChallengeCoachFeedbackV3':
    """Create a comprehensive v3 fallback response"""
    enhanced_skill_feedback = get_enhanced_skill_feedback(scores)
    quality_rating = get_quality_rating(scores["overall"])

    return DailyChallengeCoachFeedbackV3(
        qi_score=Scores(**scores),
        skill_feedback=EnhancedSkillFeedback(**enhanced_skill_feedback),
        skill_detected=f"{primary_skill.title()} ({quality_rating})",
        strengths="You showed curiosity by asking this question.",
        improvement_area="Focus on being more specific to guide a helpful response.",
        coaching_nugget=get_default_nugget(primary_skill),
        example_upgrades=get_default_examples(primary_skill),
        progress_note=get_default_progress_note(primary_skill)
    )

def classify_question_v3(req: ClassifyRequest) -> 'ClassifyResponse':
    """Enhanced v3 classification with stricter validation"""
    # For now, use the existing classify_question function
    # Could be enhanced further with v3-specific logic
    return classify_question(req)

'''

# Insert the helper functions
new_content = content[:insertion_point] + v3_helpers + "\n" + content[insertion_point:]

# Write the updated file
with open("apps/api/app/main.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Enhanced v3 helper functions added successfully!")