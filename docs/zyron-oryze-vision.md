# Zyron + Oryze — Vision Context (Narrative)

This is a working brief for collaborators. Treat it as the north star while we ship pragmatically.

## The Narrative

Sonny Alves is building a dual-engine ecosystem that merges artificial intelligence and finance into one sovereign, interoperable system. The journey begins with two entities: **Zyron AI** and **Oryze**. Together, they form the early architecture of a greater vision — a world where intelligence, capital, and creation operate through structured logic, ethical transparency, and user control.

**Zyron AI** is a next-generation consumer LLM — a *Visual Brain* that turns fragmented reasoning into structured understanding. It doesn’t just talk; it *thinks in graphs*. Zyron visualizes thoughts as nodes, reveals connections, and preserves context over time. Beyond general AI, Zyron acts as the cognitive copilot inside **Oryze**, guiding users and banking entities through financial operations with contextual awareness and adaptive logic.

**Oryze** is the first field of application: a premium digital bank for entrepreneurs, born in the French financial ecosystem. It integrates banking, accounting, and financial intelligence into a seamless product. Over time, Oryze evolves into an AI-driven wealth platform where Zyron is the neural engine behind risk, compliance, cash flow, and strategic decisioning.

## The Visual Brain (Zyron)

- **Core philosophy:** “Make reasoning visible.” Zyron thinks in graphs, not just text.
- **Interface:** a living 3D neural canvas. Nodes = Goals, Ideas, Tasks, Emotions, Reflections, Insights, Systems.
- **Behavior:** conversational input → structured graph → navigable clusters → exportable insights.
- **Why now:** LLMs are powerful yet linear; people lose the thread. Zyron is the cognitive layer that keeps the thread intact.

**Positioning vs. Palantir:** Palantir proved spatial AI + graph DB can change outcomes. Zyron brings that power to individuals at subscription pricing — “Palantir democratized.” Strategic reference, not feature parity.

## Product State

- **Status:** MVP development. Target public demo: Q1 2025.
- **MVP (v1):** Chat-first app with a basic 3D graph. Node activation on mention. Local persistence → migrate to DB.
- **v2 (vision demo):** Full spatial canvas (VisionOS-like), orbital menus, collaboration, bright cognitive white + dark mode.

**Initial Stack**
- Frontend: React 18, Three.js, Tailwind, Framer Motion, Lucide, React Router.
- Backend: FastAPI (Python), REST + SSE for streaming.
- AI: Anthropic Claude (Sonnet 4) initially; OSS models evaluated for future Zyron model.
- Auth: Clerk.
- Data: MongoDB Atlas for MVP (evaluate graph backends later).
- Infra: Vercel (FE), Railway (BE). Monitoring: Sentry/Vercel Analytics (planned).

## Oryze — Where Zyron Works First

- **Audience:** entrepreneurs, prosumers, small teams.
- **Scope at start:** payments + smart cash management + accounting assist.
- **Zyron inside:** copilot for KYC/KYB assistance, anomaly hints, document triage, and decision support (“what changed, why it matters, suggested action”).
- **Design principle:** premium, efficient, zero-nonsense UX.

## Roadmap (pragmatic)

**Weeks 1–2 (Track 1 — priority):**
Ship chat + graph MVP; deploy FE/BE; invite 10 early testers.
- Streaming Claude responses
- Node activation on mention
- Clerk auth
- Deployed on Vercel/Railway

**Weeks 2–4 (Track 2 — in parallel):**
Produce the Neural Canvas v2 demo for pitches (non-functional but gorgeous).
- V0-generated UI mockup
- 30s demo video
- Screenshots for deck

**Month 2–3:**
Polish UX, responsive fixes, onboarding wizard, settings; evaluate graph backend migration.

**Decision gate:** Keep MVP on Mongo; migrate to a graph backend only if we see clear leverage.

## Market & Positioning

- **Problem:** LLMs hide reasoning; knowledge stays linear; enterprise cognitive tools are gated and expensive.
- **Solution:** a cognitive OS that makes thinking visible and useful.
- **Users:** knowledge workers, founders, researchers, strategists, creators.
- **Business model:** $20–$50/month per user; team tier later.
- **North-star:** engagement (>10m sessions), nodes created per user (>5), NPS (>40).

## VC Roadmap & Strategic Applications

**Station F (Paris):** active network base. KPIs and demos route through this ecosystem.
**YC (target batch: Winter 2026):** narrative focused on (1) cognitive layer differentiation, (2) shipping speed, (3) early traction & retention.
**Sequoia + top funds:** approach only with evidence of compounding retention (users *build* their brains in Zyron) and a credible path to network effects (shared canvases, team graphs).

**Tactics**
- Ship MVP and capture 10–20 power users; record real demos (not mocks).
- Short clips: “from chaos → clarity in 30 seconds.”
- Publish a technical note: “Zyron’s Visual Brain — from text to graph nodes.”
- YC application: clear demo link, 1-minute founder video, and a blunt line on why now: “LLMs unlocked reasoning; Zyron unlocks structure.”

## Current Blockers (this week)

- P0: **Streaming path Chat → FastAPI → React** (SSE).
- P0: **Graph activation** (mention → node energy pulse).
- P0: **Claude response parser** that emits `{node_type, node_label, confidence}`.

Resolve these and the demo flies.

## Operating Principles

- Ship, then sculpt.
- No hand-holding UX for power users.
- Visual density is a feature.
- Ethics = transparency + user control.
- Hybrid pragmatism over ideology (simple now, powerful later).

## Where this file sits in the repo

Keep this at `docs/zyron-oryze-vision.md`. Open it in VS Code while coding so Codex/Claude read it as active context.
