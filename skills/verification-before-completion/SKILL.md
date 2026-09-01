---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. CLAIM: State the result WITH the evidence — or state the
   actual (failing) status with the evidence

Skip any step = lying, not verifying
```

## What Each Claim Requires

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified (fails without fix, passes with) | Test passes once |
| Agent completed | VCS diff shows the changes | Agent reports "success" |
| Requirements met | Line-by-line checklist against plan/spec | Tests passing |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit / push / PR without verification
- Trusting an agent's success report instead of checking the diff
- Relying on a partial or stale check ("linter passed" ≠ build passes)
- Thinking "just this once" or "I'm confident" — confidence ≠ evidence
- **ANY wording implying success without having run verification** — paraphrases and synonyms count; spirit over letter

## When To Apply

ALWAYS before: any success/completion claim (exact words, paraphrases, or implications), committing, PR creation, marking a task complete, moving to the next task, and accepting a delegated agent's result.

## The Bottom Line

Run the command. Read the output. THEN claim the result.

No shortcuts. Non-negotiable.
