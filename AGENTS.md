# AGENTS.md

Repository-wide instructions for coding agents. Keep this file concise; detailed visual rules belong in `DESIGN.md` and Claude-specific workflow notes belong in `CLAUDE.md`.

## 1. Read the right context first

### Design System (oh-my-design)

- Before any UI, styling, copy, or motion change, read `./DESIGN.md` in full.
- If `./.omd/preferences.md` exists, read it and flag pending corrections that conflict with `DESIGN.md`.
- If `.omd/system/manifest.json` and `graph.json` exist, verify whether they are an adopted, hash-valid authority. A migration candidate is not authoritative. Do not regenerate or overwrite OMD artifacts unless the user explicitly requests that workflow.
- The repository's documented design contract and the actual source code must both be checked; neither is proof that the other is already synchronized.


- Before a Claude Code task, also read `CLAUDE.md`.
- Read `README.md`, the relevant project-context document, and only the source files directly related to the requested change.
- Treat documentation paths and prior summaries as navigation hints. Verify that files, routes, APIs, components, and scripts exist before using them.

## 2. Think before coding

- Convert the request into a short plan and observable acceptance criteria.
- State assumptions and material trade-offs. Ask only when a missing fact blocks a safe implementation; otherwise proceed with a clearly stated, reversible assumption.
- Prefer the smallest change that solves the requested problem. Do not add speculative features, dependencies, abstractions, or visual decoration.
- Inspect the current implementation and call sites before editing. Do not infer behavior from filenames alone.

## 3. Protect the worktree and user data

- Preserve all pre-existing user changes. Do not reset, overwrite, reformat, or delete unrelated work.
- Never run destructive Git commands, production database changes, migrations, deployments, external scans, pushes, or commits unless the user explicitly authorized that action.
- Never expose secrets, credentials, personal data, or environment-specific configuration in logs, screenshots, prompts, or documentation.
- If a requested change conflicts with an existing user change, explain the conflict and preserve the existing work.

## 4. UI and design implementation

- `DESIGN.md` is the design source of truth; source code remains the implementation truth. When they differ, inspect the code, report the mismatch, and update the contract/tests only as part of an intentional change.
- Reuse existing design tokens, components, icon libraries, routing, state management, and API patterns. Do not add raw hex values or one-off spacing/radius/shadow values to components.
- Do not copy Claude/Anthropic or another vendor's logo, proprietary assets, or exact brand identity. References describe design patterns, not permission to reuse their assets.
- Keep theme modes, accent presets, semantic status colors, and user-selected category colors separate.
- Verify default, hover, focus-visible, pressed, selected, disabled, loading, error, success, and empty states as applicable.
- Do not claim that local mock data, browser storage, or a demo interaction is server-persisted or integrated unless the source confirms it.
- Check responsive layouts and keyboard/accessibility behavior for UI changes. Preserve reduced-motion preferences and meaningful accessible names.

## 5. Code and documentation quality

- Follow the conventions in the touched module. Do not refactor unrelated code.
- For new source files, add a one-line Korean header comment below required directives. Skip config, generated, and metadata files.
- Keep documentation consistent with implementation. Label proposals, target tokens, unimplemented behavior, and verified behavior distinctly.
- Do not duplicate long project specifications when linking to their canonical document is enough.

## 6. Verification

- Run the smallest relevant test first, then broader tests/builds when the change risk warrants it.
- Report exact commands and actual outcomes. If a check cannot run, say why.
- For UI changes, include the viewport sizes and interaction states actually checked. Do not claim visual or accessibility success without evidence.
- Classify unresolved checks as `NOT_RUN`, `REVIEW`, or `N/A`; do not silently count them as passing.

## 7. Final response

Summarize the files changed, user-visible behavior changed, verification performed, and remaining risks. Keep implementation facts separate from design proposals. Do not say a feature is complete unless the relevant source and checks support that statement.

## 8. Timebar Diary project workflow

- Project facts, environment details, and execution commands start from `PROJECT_CONTEXT.md`; verify them against the current source and scripts.
- For changes that affect input/output, authentication, authorization, ownership, secrets, uploads, or database queries, follow `security/SECURITY_POLICY.md` and select only the applicable SW weakness, web vulnerability, and OWASP checks.
- For UI changes, `DESIGN.md` is the primary contract. If `DESIGN_GUIDE.md` and the KWCAG checklist exist, use them as supplementary implementation/checking material; they do not override `DESIGN.md`.
- For a non-trivial task, `python scripts/start_task.py --task <task-name>` may be used to create or resume a plan, checklist, context notes, and verification record. Confirm the script exists before running it.
- Reusable skills live under `.agents/skills/`. Use the repository's skill application guide when available; apply JSP-only skills only to JSP sources or matching diagnostic reports.
- Record results as `PASS / FAIL / REVIEW / NOT_RUN / N/A` with evidence. A successful structure check is not proof that application security or accessibility passed. Exclusions for false positives require individual evidence and valid approval.
- Preserve existing user changes. Commit only a verified logical change when the repository workflow and user authorization allow it. Pushes, deployments, production database changes, and external scans require explicit authorization.
- Before ending a non-trivial task, record completed items, the last verification, unresolved causes, and the next useful command in the task notes.
