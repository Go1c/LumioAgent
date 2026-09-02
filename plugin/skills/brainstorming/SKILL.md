---
name: brainstorming
description: "Use when starting creative work - creating features, building components, adding functionality, or modifying behavior - before any implementation. Explores user intent, requirements and design."
---

# Brainstorming Ideas Into Designs

Turn an idea into an approved design before anything gets built.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it.
</HARD-GATE>

**Scope note:** Whether this skill triggers at all is decided by the dispatch layer (`rules/dispatch.md` 调度核心): small clear changes and fast-mode whitelist items are implemented directly, with no design cycle. Once dispatched here, follow the process — but if the work turns out to qualify for the fast path after all, say so and hand back. The design itself scales down: a few sentences is a valid design for a simple project.

## Process

1. **Explore project context** — files, docs, recent commits. If the request spans multiple independent subsystems, say so first and help the user split it into sub-projects; then brainstorm the first one. Each sub-project gets its own design → plan → implementation cycle.
2. **Ask clarifying questions, one at a time** — purpose, constraints, success criteria. Prefer multiple choice. On Claude Code run this inside native plan mode and ask with `AskUserQuestion`.
3. **Propose 2–3 approaches** with trade-offs; lead with your recommendation. YAGNI ruthlessly. In an existing codebase, follow existing patterns and fold in only the targeted improvements the work itself needs — no unrelated refactoring.
4. **Present the design** in sections sized to their complexity (architecture, components, data flow, error handling, testing) and get approval section by section.
5. **Write it down** (see below), self-review, then let the user review the written spec.
6. **Hand off** to `writing-plans`. That is the only skill you invoke after this one.

## Where the Design Lands

The design document **is** the feature doc's first version — no separate spec file, no later sedimentation step:

- **Feature work:** `.spec/knowledge/features/<topic>.md`, final-register voice (what it IS, not the discussion), frontmatter per the project's `_TEMPLATE.md` with `metadata.status: 设计中`, registered in `.spec/knowledge/README.md`. Status flows `设计中 → 实施中 → 已交付`; the document never moves.
- **One-off engineering efforts** (nothing long-lived to describe): fold the design into the effort's plan in `.spec/plans/` as a design section — no feature doc.
- **Trade-offs, rejected alternatives, the "why":** an ADR in `.spec/decisions/`. The feature doc keeps only the design as it stands.
- The discussion itself is not committed anywhere. User preferences for spec location override these defaults.
- Commit the design document.

**Self-review before handing it to the user:** placeholders (TBD / TODO / vague requirements) → fix; internal contradictions → fix; scope — is it one implementation plan's worth, or does it need decomposition; ambiguity — any requirement readable two ways → pick one and make it explicit. Fix inline, no re-review.

**User review gate:** "Spec written and committed to `<path>`. Please review it before we write the implementation plan." Wait; apply requested changes and re-run the self-review; proceed only on approval.
