#!/usr/bin/env python3
"""
Script to add enhanced v3 coaching endpoints to main.py
"""

# Read the main.py file
with open("apps/api/app/main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Find the insertion point after the v2 endpoints
insertion_point = content.find("def get_daily_challenge_feedback_v2(req: ClassifyRequest):")
if insertion_point == -1:
    print("Could not find v2 endpoint to insert after")
    exit(1)

# Find the end of the v2 function
next_function_start = content.find("\n@app.post(", insertion_point + 1)
if next_function_start == -1:
    # If no next function, find end of file patterns
    next_function_start = content.find("\nif __name__ ==", insertion_point)
    if next_function_start == -1:
        next_function_start = len(content)

# V3 endpoints to insert
v3_endpoints = '''

# Enhanced v3 coaching endpoint with comprehensive 6-part framework
@app.post("/coach/v3", response_model=DailyChallengeCoachFeedbackV3)
def coach_question_v3(req: CoachRequest):
    """Generate v3 enhanced coaching feedback with comprehensive skill-specific feedback"""
    if not req.user_question or not req.user_question.strip():
        raise HTTPException(status_code=400, detail="Missing user question")

    # Apply enhanced strict scoring and validation
    validated_scores = validate_and_cap_scores_v3(
        req.classification.scores.dict(),
        req.classification.issues
    )

    # Determine primary skill and performance tier
    skills = req.classification.detected_skills or ["clarifying"]
    primary_skill = skills[0] if skills else "clarifying"
    tier = "good" if validated_scores["overall"] >= 4 else "needs_work"

    # Retrieve coaching assets
    assets = retrieve_assets_v3(primary_skill, tier)

    # Generate enhanced skill feedback with specific guidance
    enhanced_skill_feedback = get_enhanced_skill_feedback(validated_scores)

    # Build skill_detected with quality rating
    quality_rating = get_quality_rating(validated_scores["overall"])
    skill_detected = f"{primary_skill.title()} ({quality_rating})"

    # Generate 6-part framework content
    try:
        # Use template-based generation for consistency
        strengths = generate_strengths(req.user_question, primary_skill, assets)
        improvement_area = generate_improvement_area(req.classification.issues, primary_skill, assets)
        coaching_nugget = assets["nuggets"][0] if assets["nuggets"] else get_default_nugget(primary_skill)
        example_upgrades = assets["examples"][:3] if assets["examples"] else get_default_examples(primary_skill)
        progress_note = assets["progress_notes"][0] if assets["progress_notes"] else get_default_progress_note(primary_skill)

        return DailyChallengeCoachFeedbackV3(
            qi_score=Scores(**validated_scores),
            skill_feedback=EnhancedSkillFeedback(**enhanced_skill_feedback),
            skill_detected=skill_detected,
            strengths=strengths,
            improvement_area=improvement_area,
            coaching_nugget=coaching_nugget,
            example_upgrades=example_upgrades,
            progress_note=progress_note
        )

    except Exception as e:
        print(f"v3 Coaching generation failed: {e}")
        # Enhanced fallback with all required fields
        return create_v3_fallback_response(primary_skill, validated_scores, assets)

# Enhanced v3 complete pipeline
@app.post("/daily-challenge-feedback/v3", response_model=DailyChallengeFeedbackResponseV3)
def get_daily_challenge_feedback_v3(req: ClassifyRequest):
    """Complete Daily Challenge v3 enhanced feedback pipeline"""
    try:
        # Step 1: Classify with enhanced validation
        classification = classify_question_v3(req)

        # Step 2: Generate v3 enhanced coaching feedback
        coach_req = CoachRequest(
            scenario_text=req.scenario_text,
            user_question=req.user_question,
            classification=classification
        )
        feedback = coach_question_v3(coach_req)

        # Enhanced metadata generation
        feedback_content = f"{feedback.strengths} {feedback.improvement_area} {feedback.coaching_nugget}"
        content_hash = hashlib.sha256(feedback_content.encode()).hexdigest()[:16]

        # Check content and length with v3 standards
        word_count = len(feedback_content.split())
        length_ok = word_count <= ROGA_FEEDBACK_MAX_WORDS
        banned_content = check_content_filters(feedback_content)

        meta = CoachMeta(
            brand_check=len(banned_content) == 0,
            length_ok=length_ok,
            banned_content=banned_content,
            hash=content_hash
        )

        return DailyChallengeFeedbackResponseV3(
            schema="roga.daily_challenge.v3_enhanced",
            scenario_id=None,
            user_question=req.user_question.strip(),
            feedback=feedback,
            meta=meta
        )

    except Exception as e:
        print(f"Daily challenge v3 enhanced feedback pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"v3 Enhanced feedback generation failed: {e}")

'''

# Insert the v3 endpoints
new_content = content[:next_function_start] + v3_endpoints + content[next_function_start:]

# Write the updated file
with open("apps/api/app/main.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Enhanced v3 coaching endpoints added successfully!")