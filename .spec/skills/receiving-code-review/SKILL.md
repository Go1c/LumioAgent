---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation
---

# Receiving Code Review

## Overview

Code review requires technical evaluation, not emotional performance.

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## The Response Pattern

```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

## No Performative Agreement

**NEVER:** "You're absolutely right!", "Great point!", "Thanks for catching that!" — or any praise/gratitude filler.

**INSTEAD:** restate the requirement, ask a clarifying question, push back with technical reasoning — or just fix it and let the code show you heard. When feedback is correct: "Fixed. [what changed]." When you pushed back and were wrong: "Verified — you're correct because [reason]. Fixing." State it factually and move on; no long apology, no defending the original pushback.

## Unclear Feedback

If ANY item is unclear, stop — clarify ALL items before implementing any. Items may be related; partial understanding = wrong implementation.

```
User: "Fix 1-6" — you understand 1,2,3,6.
❌ Implement 1,2,3,6 now, ask about 4,5 later
✅ "Understand 1,2,3,6. Need clarification on 4 and 5 before implementing."
```

## Evaluating the Source

**From the user:** trusted — implement after understanding. Still ask if scope is unclear.

**From external reviewers:** be skeptical, but check carefully —

- Technically correct for THIS codebase? Does it break existing functionality? Is there a reason (legacy, compatibility) for the current implementation?
- Reviewer suggests "implementing properly"? grep for actual usage first — unused code gets removed (YAGNI), not upgraded.
- Can't verify? Say so: "I can't verify this without [X]. Investigate, ask, or proceed?"
- Conflicts with the user's prior decisions? Stop and discuss with the user first.

## Implementation Order

1. Clarify everything unclear FIRST
2. Then: blocking issues (breaks, security) → simple fixes → complex fixes
3. Test each fix individually; verify no regressions

## Pushback

Push back when the suggestion breaks functionality, the reviewer lacks context, it violates YAGNI, it's wrong for this stack, or it conflicts with the user's architectural decisions. Use technical reasoning and reference working tests/code — not defensiveness. Architectural disputes go to the user. If you're uncomfortable pushing back out loud, name that tension and tell the user what you've seen.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Performative agreement | State requirement or just act |
| Blind implementation | Verify against codebase first |
| Batch without testing | One at a time, test each |
| Assuming reviewer is right | Check if it breaks things |
| Avoiding pushback | Technical correctness > comfort |
| Partial implementation | Clarify all items first |
| Can't verify, proceed anyway | State limitation, ask for direction |

## The Bottom Line

External feedback = suggestions to evaluate, not orders to follow.

Verify. Question. Then implement. No performative agreement.
