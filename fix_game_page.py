#!/usr/bin/env python3
"""
Script to properly fix the game page to use V3 coaching
"""

# Read the current page.tsx
with open("apps/web/src/app/game/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the broken condition line that got mangled by sed
content = content.replace(
    "{!dailyChallengeFeedback {!dailyChallengeFeedback && !mvpFeedback &&{!dailyChallengeFeedback && !mvpFeedback && !dailyChallengeV3Feedback && !mvpFeedback && (",
    "{!dailyChallengeFeedback && !dailyChallengeV3Feedback && !mvpFeedback && ("
)

# Fix the V3 component rendering (currently on one line)
v3_component_oneline = "{dailyChallengeV3Feedback && (                <DailyChallengeScoreCardV3                  scenario={{                    title: currentScenario.title,                    text: currentScenario.text || currentScenario.prompt || \"\"                  }}                  question={question}                  feedback={dailyChallengeV3Feedback}                />              )}"

v3_component_multiline = """              {dailyChallengeV3Feedback && (
                <DailyChallengeScoreCardV3
                  scenario={{
                    title: currentScenario.title,
                    text: currentScenario.text || currentScenario.prompt || ""
                  }}
                  question={question}
                  feedback={dailyChallengeV3Feedback}
                />
              )}"""

content = content.replace(v3_component_oneline, v3_component_multiline)

# Also fix the reset line to be on its own line
content = content.replace(
    "      setMvpFeedback(null);      setDailyChallengeV3Feedback(null);",
    "      setMvpFeedback(null);\n      setDailyChallengeV3Feedback(null);"
)

# Write the fixed content
with open("apps/web/src/app/game/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed game page.tsx for V3 coaching integration")