# OpsPilot AI — Claude Context Pack

This package replaces the original giant 3,000+ line startup file.

## Install

Copy the contents of this folder into the root of the `opspilot-ai` repository.

The important startup files are:
- `CLAUDE.md`
- `docs/STATUS.md`

Claude should read detailed specs only on demand as directed by the current day plan.

## Why this structure exists

The full engineering detail is preserved, but it is split so irrelevant days/specifications do not consume every Claude Code session's context window.

Do not add automatic imports for all docs into `CLAUDE.md`; that would defeat the purpose of the split.

## First Claude Code prompt

```text
Read CLAUDE.md and docs/STATUS.md.
We are starting the active step shown in STATUS.
Read only the current day plan and the files listed under its Context to load section.
Inspect the repository first, then tell me the acceptance criteria, files you will change, and tests you will run.
Implement only the current step.
```
