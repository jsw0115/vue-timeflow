<!-- omd:start v=1 hash=2227e45bb056 -->
## Design System (oh-my-design)

**Before any UI, styling, copy, or motion change, open and read `./DESIGN.md` in full.** It is the standalone design contract. If an exact valid adopted Core v2 manifest exists, its hash-bound System Graph is machine authority and DESIGN.md is the projection. A migration candidate remains non-authoritative.

If present, read `./.omd/preferences.md` — pending explicit corrections override the current contract until atomically folded into the graph/projection. Apply them and flag conflicts.

# AGENTS.md

Behavioral guidelines for Codex and other coding agents. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## Codex Notes

Codex reads `AGENTS.md` before doing work. Put this file at the project root for repository-wide guidance, or in a nested directory for narrower rules.

Keep this file short and concrete. Codex combines global and project instructions, and large instruction files can crowd out useful task context.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Workspace Evidence Before Edits

**Inspect the actual files you will touch. Don't rely on memory or stale summaries.**

Before changing code:
- Use `rg` or project tools to find the relevant implementation.
- Read the exact files and nearby call sites before editing them.
- Treat open editor tabs, filenames, READMEs, and prior conversation summaries as hints, not proof.
- If local code disagrees with your assumption, trust the code and update the plan.

This is not a new "small change" rule. It exists to prevent confident edits based on imagined code.

## 6. Respect The Worktree

**Assume uncommitted changes belong to the user unless you made them.**

When the worktree is dirty:
- Do not revert, overwrite, or reformat unrelated changes.
- If user changes touch the same files, read them and adapt.
- If unrelated files are dirty, ignore them.
- Never run destructive git commands unless the user explicitly asked for them.

## 7. No Closing Colons (Korean Output)

**End Korean sentences with a period, not a colon.**

When the user writes in Korean, your output is also Korean:
- Don't end Korean sentences with `:` even if the next line is a list or example.
- LLMs trained on English docs leak the colon habit into Korean. Catch it.
- The test: every Korean sentence terminator should be `.`, `?`, or `!`, not `:`.
- Colons are fine inside code, key-value pairs, timestamps, or labels. Not as Korean sentence enders.

## 8. File Header Comments in Korean

**First line of every new source file: a one-line Korean comment stating its role.**

When creating a new source file:
- TypeScript/JavaScript: `// 사용자 인증 상태를 관리하는 Context Provider`
- Python: `# KIS API 호출을 비동기로 래핑하는 클라이언트`
- SQL: `-- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰`
- Place it directly under required directives (`'use client'`, `'use server'`, shebang).
- Skip config files (`*.config.ts`, `package.json`, lockfiles, generated files).

Why: agents read files selectively, not whole codebases. A one-line Korean header gives instant context so the next session can navigate without re-reading everything.

## 9. Plan + Checklist + Context Notes

**Before any non-trivial task, produce three artifacts. Don't start coding without them.**

- **Plan** - what we're building and why.
- **Checklist** (`checklist.md`) - concrete tasks as checkboxes. Tick as you go.
- **Context Notes** (`context-notes.md`) - decisions made during the work and the reasoning behind them. Append continuously.

If the user gives only a plan and asks you to start coding, stop and ask: "Should I create the checklist and context notes first?" The next session needs the notes to pick up without re-deriving every decision.

## 10. Run Tests Before Marking Complete

**If you touched code, run the relevant tests before saying "done".**

- `npm test`, `pytest`, `cargo test`, or whatever the project uses - run the smallest relevant check first, then broader checks when risk is high.
- If tests pass, report the exact command.
- If tests fail, read the actual error, fix it, and re-run.
- If no test setup exists, verify the project builds or typechecks.
- If you cannot run verification, say exactly why.

This is the step coding agents skip most often. Treat it as non-negotiable.

## 11. Verification Evidence In The Final Reply

**Report what you actually verified, not what you intended to verify.**

Final responses should include:
- The command or check that ran, such as `npm test` or `npx tsc --noEmit`.
- The result, such as "passed", "failed with X", or "not run because Y".
- Any remaining risk the user should know about.

Do not write "done", "fixed", or "works" unless that claim is backed by a concrete check.

## 12. Semantic Commits

**Commit when one logical change is complete. Don't wait for the user to ask.**

- The test: "Can I describe this commit in one sentence?" If yes, commit. If no, the changes are still mixed - split them.
- Good: "auth 미들웨어 추가". Bad: "auth 추가하고 UI도 고치고 버그도 수정" (split into 3).
- Don't accumulate unrelated edits and lose the ability to roll back individually.
- Don't commit just to commit - meaningful units only.
- If the environment or user workflow does not allow commits, keep changes uncommitted and clearly summarize them.

Note: For solo prototypes or throwaway scripts, group commits loosely if it slows you down. The point is reversibility, not ceremony.

## 13. Read Errors, Don't Guess

**Read the actual error/log line. Don't pattern-match from memory.**

When something fails:
- Read the full error message and stack trace.
- Check the actual log output, not what you assume it should say.
- Don't apply a "common fix" before confirming the cause.
- If unclear, add a print/log to verify state - then fix.

This is the step coding agents skip most often after "run tests". They guess from error keywords and apply the most recent pattern. That's how a one-line bug becomes a three-file refactor.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, verification is reported with exact checks, and clarifying questions come before implementation rather than after mistakes.

## 14. Timebar Diary Codex 작업 안내

- 프로젝트 사실·실행 명령은 [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)에서 시작하고 실제 소스와 대조한다. 관련 문서만 읽고 기존 `docs/` 명세를 복제하지 않는다.
- 변경 범위의 입력·출력·인증·소유권·비밀값·파일·쿼리는 [보안 정책](security/SECURITY_POLICY.md)에 따라 점검한다. SW 49개·웹 28개·OWASP 목록에서 해당 항목만 선택한다.
- UI 변경은 상단 디자인 계약을 먼저 읽고 [DESIGN_GUIDE.md](DESIGN_GUIDE.md)와 KWCAG 점검표를 참고한다. 보조 가이드가 디자인 계약을 대체하지 않는다.
- 새 비단순 작업은 `python scripts/start_task.py --task 작업명`으로 계획·체크리스트·메모·검증 양식을 생성할 수 있다. 기존 작업 폴더가 있으면 그 기록을 이어 쓴다.
- 재사용 스킬은 `.agents/skills/`에 있다. [적용 안내](README_적용가이드.md)에서 작업에 맞는 스킬을 선택한다. JSP 전용 스킬은 JSP 소스나 해당 진단 보고서가 있을 때만 사용한다.
- 결과는 `PASS / FAIL / REVIEW / NOT_RUN / N/A`와 증거로 남긴다. 구조 검사 성공을 앱 보안·접근성 합격으로 표현하지 않는다. 오탐 제외는 개별 증빙과 유효한 승인을 요구한다.
- 기존 사용자 변경을 보존하고 검증한 자체 변경만 12절에 따라 커밋한다. 압축파일 예시의 추가 커밋 승인 절차는 채택하지 않는다. 푸시·배포·운영 DB 변경·외부 스캔은 요청의 허용 범위를 확인한다.
- 세션 중단 전 완료 항목, 마지막 검증, 미해결 원인, 다음 명령을 작업 기록에 남긴다. 토큰 충전 감지·자동 재개가 설정되어 있다고 가정하지 않는다.
