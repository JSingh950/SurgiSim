# SurgiSim — Claude Code Rules

## Project
Vite + React + TypeScript frontend. Express + Mongoose backend.
Auth0 auth. Snowflake → Gemini → ElevenLabs AI pipeline.
Solana Devnet certificates. Hackathon: Healthcare track.

## Team split
- Person A: Auth0, MongoDB, Solana (Mac)
- Person B (current user): AI pipeline — Snowflake, Gemini,
  ElevenLabs routes and services
- Person C: 3D engine, Surgery UI, anime.js, Solana frontend

## DO NOT
- Read, modify, print, or echo .env or .env.example
- Push to main directly
- Use git --force, git reset --hard, or rewrite history
- Install packages without listing them first in your response
- Create MintCelebration.jsx (Person C owns it)
- Modify files owned by Person A: models/, middleware/auth.js,
  any Auth0 config
- Refactor existing code while implementing new features
- Bundle multiple features into one branch or PR

## Branch rules
One feature = one branch = one PR. Branch naming:
feature/<short-description>. Always branch off main.

## Code style
Match existing patterns in backend/src/routes/mentor.js and
backend/src/services/gemini.js. Same import style, same error
shape, same async/await pattern. No new libraries unless
explicitly required by the task.

## Commit style
feat: for new features
chore: for config/setup
fix: for bug fixes
Never commit .env, .env.*, setup-env.ps1

## Reference docs (load only when needed)
- API contracts: /docs/api-contracts.md (if exists)
- DB schema: /docs/schema.md (if exists)
- Phase specs: /PROJECT_SPECS.md

## Model configuration
- claude-opus-4-7: architecture decisions, multi-file refactors, debugging complex issues, milestone planning
- claude-sonnet-4-5: standard coding tasks (default)
- claude-haiku-4-5: simple edits, renaming, single-line fixes, reading files

## Environment
Windows + PowerShell. Use Windows-compatible commands.
Backend port: 4000. Frontend port: 5173.
