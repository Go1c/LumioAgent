---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Any technical issue: test failures, bugs, unexpected behavior, performance problems, build failures, integration issues.

ESPECIALLY when skipping is tempting: under time pressure, "just one quick fix" seems obvious, previous fixes didn't work, or the issue seems simple. Systematic debugging is faster than guess-and-check thrashing — and simple bugs have root causes too.

## The Four Phases

Complete each phase before the next.

### Phase 1: Root Cause Investigation

1. **Read error messages carefully** — full stack traces, line numbers, error codes. They often contain the exact solution.
2. **Reproduce consistently** — exact steps, reliable trigger. Not reproducible → gather more data, don't guess.
3. **Check recent changes** — git diff, recent commits, new dependencies, config, environment.
4. **Gather evidence at component boundaries** (multi-component systems: CI → build → signing, API → service → DB): before proposing fixes, log what enters and exits each component, run once, and let the evidence show WHERE it breaks — then investigate that component.
5. **Trace data flow backward** — where does the bad value originate? Keep tracing up the call stack to the source; fix at the source, not the symptom. Complete technique: `root-cause-tracing.md` in this directory.

### Phase 2: Pattern Analysis

- Find similar working code in the same codebase
- Read reference implementations COMPLETELY — skimming guarantees partial understanding
- List every difference between working and broken, however small; don't assume "that can't matter"
- Understand the dependencies, config, and assumptions involved

### Phase 3: Hypothesis and Testing

- State a single, specific hypothesis: "I think X is the root cause because Y"
- Test it with the SMALLEST possible change, one variable at a time
- Didn't work → form a NEW hypothesis; DON'T stack more fixes on top
- Don't understand something? Say "I don't understand X" and research — don't pretend

### Phase 4: Implementation

1. **Create a failing test case first** (use `test-driven-development`) — simplest reproduction; MUST exist before fixing
2. **Implement a single fix** for the root cause — ONE change, no "while I'm here" improvements, no bundled refactoring
3. **Verify:** test passes, no other tests broken, symptom actually gone
4. **Fix didn't work?** STOP. Count attempts. Fewer than 3 → back to Phase 1 with the new information. **3 or more → question the architecture.**

### If 3+ Fixes Failed: Question the Architecture

Each fix revealing a new problem elsewhere, or every fix requiring "massive refactoring", means the pattern itself may be wrong. This is not a failed hypothesis — it's a wrong architecture. STOP and discuss with the user before attempting more fixes.

## Red Flags — STOP and Return to Phase 1

- "Quick fix for now, investigate later" / "Just try changing X and see"
- Multiple changes at once; skipping the failing test
- "It's probably X" / "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- **"One more fix attempt" when you've already tried 2+**
- The user questioning your approach ("Is that verified?", "Stop guessing") — that's a redirection, not noise

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too; the process is fast for them. |
| "Emergency, no time for process" | Systematic debugging is FASTER than thrashing. |
| "I'll write the test after confirming the fix" | Untested fixes don't stick. Test first proves it. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "One more fix attempt" (after 2+) | 3+ failures = architectural problem. Stop fixing symptoms. |

## Quick Reference

| Phase | Key activities | Done when |
|-------|---------------|-----------|
| 1. Root cause | Read errors, reproduce, check changes, gather evidence | You understand WHAT and WHY |
| 2. Pattern | Find working examples, compare | Differences identified |
| 3. Hypothesis | Single theory, minimal test | Confirmed or replaced |
| 4. Implementation | Failing test, single fix, verify | Bug resolved, tests pass |

## When Investigation Finds "No Root Cause"

If the issue is truly environmental or timing-dependent: document what you investigated, implement appropriate handling (retry / timeout / clear error message), add logging for future investigation. But 95% of "no root cause" cases are incomplete investigation.

## Supporting Techniques

In this directory: `root-cause-tracing.md` (trace bugs backward through the call stack), `defense-in-depth.md` (multi-layer validation after the root cause is found), `condition-based-waiting.md` (replace arbitrary timeouts with condition polling).

Related skills: `test-driven-development` (Phase 4's failing test), `verification-before-completion` (verify before claiming fixed).
