---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code — either a deep step-by-step plan for one feature, or a set of non-overlapping task cards (contract cards first) for parallel fan-out
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `.spec/plans/YYYY-MM-DD-<feature-name>.md`
- Start the file with frontmatter `status: pending` — the only key allowed; enum `pending / in_progress / completed` (spec-lint enforced). Execution flips it: subagent-driven-development sets `in_progress` at start, `completed` at final close.
- (User preferences for plan location override this default)

## Two Outputs: Deep Plan vs Task Cards

- **Deep plan** (the rest of this file): one feature, executed step by step with complete code in every step. Use when the work is one coherent thread.
- **Shallow mode — task cards** (section at the end): several independent cards fanned out to parallel workers. Use when the goal splits into pieces that can be built and verified separately. This is the default whenever parallel execution is possible (`rules/dispatch.md`「调度取向」).

## Scope Check

Decomposition into sub-projects is brainstorming's job (or this skill's shallow mode), not the deep plan's. If the spec still covers multiple independent subsystems, stop and send it back for splitting — one plan per subsystem, each producing working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Granularity

A task is the smallest unit that carries its own verification and is worth
a fresh implementer's brief. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where one task can be built and verified
without the other. Each task ends with an independently testable
deliverable.

## Step Granularity (Within a Task)

The failing-test-first steps below bind **large tasks** (`rules/dispatch.md`「编码约定 · 测试分级」: not pure docs / config / comments / deletions, and ≥ 50 effective added lines). A small task keeps only the implementation, run-existing-tests and commit steps — no new test per change.

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
---
status: pending
---

# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan wave by wave (hosts without subagents: its Inline Fallback section). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, hand off to execution:

> "Plan complete and saved to `.spec/plans/<filename>.md`. Executing with subagent-driven-development: contract cards first, implementation cards fanned out per wave, one review of the merged whole."

- **REQUIRED SUB-SKILL:** Use subagent-driven-development
- Hosts without subagent support execute the same plan via its Inline Fallback section.

## Shallow Mode: Task Cards (parallel fan-out)

Split one goal into cards that a worker can start without asking a question and that can be verified on their own. Card format has a single authority — the project's `.spec/tasks/README.md` (goal / 涉及范围 / 验收标准 / 依赖 / 接口) — do not restate it here.

1. **Clarify.** Read the goal plus `AGENTS.md`, `knowledge/` and the relevant source. Resolve what the code or docs can answer; list the rest explicitly as 待澄清项 — never fill a gap with a guess.
2. **Extract the shared dependencies first — the contract cards (wave 0).** Anything two or more cards would both need: data structures, type definitions, API signatures, protocols, common modules, conventions. Each becomes its own card whose deliverable is the artefact itself (a types / interface file, a schema, a `.spec/knowledge/standards/` doc). Implementation cards align only through these artefacts; if a contract turns out insufficient, the contract card changes — no implementation card widens an interface on its own.
3. **Split the rest.** One card = one thing, independently completable and verifiable. Two cards touching the same logic is a signal to merge them.
4. **Write the cards.** Every card with a neighbour dependency **must** carry the `## 接口` block (Consumes / Produces with exact signatures) — parallel workers never see each other's code, so the contract on the card is their only alignment. Mark the expected size (small / large per `rules/dispatch.md`「测试分级」); the closeout tool's verdict wins later. No placeholders (criteria in the card README).
5. **Schedule waves.** Wave 0 = contract cards; a wave contains only cards with no dependency edge between them and non-overlapping file sets; waves run serially, cards inside a wave in parallel (rules: `rules/dispatch.md`「并行边界与合入」).
6. **Self-check.** Each card starts without a follow-up question; every acceptance criterion is objectively verifiable ("no horizontal scroll at 375px", not "looks good"); the set covers the goal with no gap, no overlap, no scope creep; no wave has an internal edge or overlapping file set.

Don't over-split: work that is one step stays one card.
