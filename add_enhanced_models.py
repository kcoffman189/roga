#!/usr/bin/env python3
"""
Script to add enhanced v3 coaching models to main.py
"""

# Read the main.py file
with open("apps/api/app/main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Find the insertion point after MVPScoreCardResponse
insertion_point = content.find("class MVPScoreCardResponse(BaseModel):")
if insertion_point == -1:
    print("Could not find insertion point")
    exit(1)

# Find the end of the MVPScoreCardResponse class
next_class_start = content.find("\nSCHEMA = {", insertion_point)
if next_class_start == -1:
    print("Could not find end of MVPScoreCardResponse")
    exit(1)

# Enhanced models to insert
enhanced_models = '''
# Enhanced Daily Challenge Coaching v3 - Complete 6-part framework with skill-specific feedback
class EnhancedSkillFeedback(BaseModel):
    clarity: str = Field(description="Detailed explanation for clarity score with specific guidance")
    depth: str = Field(description="Detailed explanation for depth score with specific guidance")
    relevance: str = Field(description="Detailed explanation for relevance score with specific guidance")
    empathy: str = Field(description="Detailed explanation for empathy score with specific guidance")

class DailyChallengeCoachFeedbackV3(BaseModel):
    qi_score: Scores = Field(description="1-5 scores for each QI dimension")
    skill_feedback: EnhancedSkillFeedback = Field(description="Detailed skill-specific explanations")
    skill_detected: str = Field(description="QI skill name + quality rating (e.g., 'Clarifying (attempted, but vague)')")
    strengths: str = Field(max_length=120, description="One positive element from the question")
    improvement_area: str = Field(max_length=120, description="Name the gap, tied to QI taxonomy")
    coaching_nugget: str = Field(max_length=120, description="1-2 sentences of mini-teaching from QI Library")
    example_upgrades: List[str] = Field(min_length=2, max_length=3, description="2-3 better alternatives, always as questions")
    progress_note: str = Field(max_length=150, description="Motivational + gamified hook with emojis")

class DailyChallengeFeedbackResponseV3(BaseModel):
    schema: str = "roga.daily_challenge.v3"
    scenario_id: Optional[int]
    user_question: str
    feedback: DailyChallengeCoachFeedbackV3
    meta: CoachMeta

'''

# Insert the enhanced models
new_content = content[:next_class_start] + enhanced_models + content[next_class_start:]

# Write the updated file
with open("apps/api/app/main.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Enhanced v3 coaching models added successfully!")