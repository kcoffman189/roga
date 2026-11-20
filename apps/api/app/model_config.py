"""Central model configuration for Cephos.

Every Anthropic call site reads its model ID, effort level and token ceiling
from here. Nothing else in the codebase should name a model.

Verified against platform.claude.com on 2026-11-20:

  claude-opus-5-5    $4 / $20 per MTok   1M ctx   128K max out   default: medium
  claude-sonnet-5-5  $2 / $10 per MTok   1M ctx   128K max out   default: high

Three things that bite when migrating onto these models:

1. max_tokens is a hard ceiling on TOTAL output - thinking plus visible text.
   Adaptive thinking is on by default on both models, and on Opus 5.5 it
   cannot be turned off at all. Every ceiling in main.py was sized for a
   model that did not think, so each one needs headroom or the visible reply
   gets truncated - or never starts. The 20-token utility calls are the
   dangerous ones: a single thinking token exhausts them.

2. Effort is pinned explicitly rather than inherited. Opus 5 defaulted to
   `high`; Opus 5.5 defaults to `medium`. Omitting effort would quietly
   change the model AND the thinking depth in the same commit, making the
   result impossible to attribute.

3. temperature, top_p and top_k return a 400 error on these models. main.py
   does not pass any of them - keep it that way.
"""

# --- Model IDs -------------------------------------------------------------

MODEL_CONVERSATION = "claude-opus-5-5"
MODEL_UTILITY = "claude-sonnet-5-5"


# --- Effort ----------------------------------------------------------------
# Valid values: "low", "medium", "high", "xhigh", "max".
# Sent as output_config={"effort": ...}.
#
# MIGRATION NOTE: EFFORT_CONVERSATION is deliberately "high" to match the old
# Opus 5 default, so this commit changes exactly one variable - the model.
# Once a baseline exists, step it down to "medium" and then "low" as separate
# deploys, spot-checking connection quality at each level.
#
# Once prompt caching is live, changing effort between requests invalidates
# the cache. Freeze this value before adding cache_control breakpoints.

EFFORT_CONVERSATION = "high"
EFFORT_UTILITY = "low"


# --- Token ceilings --------------------------------------------------------
# Conversation path: 2000 was the old ceiling and is unsafe under adaptive
# thinking at high effort. 8000 leaves room to think and still write a full
# TMSI response.

MAX_TOKENS_CONVERSATION = 8000

# Utility path: each call site keeps its own ceiling, because the number
# carries intent - 20 means "a short title", and that should stay visible at
# the call site. This constant is added on top to cover thinking.
#
# If measurement shows low effort produces little or no thinking on these
# short prompts, drop this toward 0 here rather than at 9 call sites.

UTILITY_THINKING_HEADROOM = 400


# --- Prompt caching --------------------------------------------------------
# Minimum cacheable prefix is 512 tokens on both models. Max 4 breakpoints
# per request. 1h write costs 2x input; reads cost 5% of input.
# Not wired in yet - here so Workstream 2 has one place to change.

CACHE_TTL = "1h"
CACHE_MIN_TOKENS = 512


# --- Helpers ---------------------------------------------------------------

def conversation_kwargs(max_tokens: int = MAX_TOKENS_CONVERSATION) -> dict:
    """Keyword arguments for a conversation-path (TMSI) call."""
    return {
        "model": MODEL_CONVERSATION,
        "max_tokens": max_tokens,
        "output_config": {"effort": EFFORT_CONVERSATION},
    }


def utility_kwargs(max_tokens: int) -> dict:
    """Keyword arguments for a utility call: titles, quotes, summaries.

    Pass the ceiling the visible output needs; thinking headroom is added
    here so the intent stays readable at the call site.
    """
    return {
        "model": MODEL_UTILITY,
        "max_tokens": max_tokens + UTILITY_THINKING_HEADROOM,
        "output_config": {"effort": EFFORT_UTILITY},
    }
