# Shipping Software the AI‑First Way in 2025

When every part of the tool‑chain can reason about your code, the fastest path from idea to production is to **let the models drive** while you supervise.

| Layer | Model / Tool | Why it sits here |
|-------|--------------|------------------|
| **Architecture & high‑level design** | **OpenAI o3** | best long‑context reasoning, perfect for trade‑off discussions |
| **Feature‑level implementation & big‑picture editing** | **Gemini 2.5 Pro (MAX)** inside **Windsurf** Agent chat | huge context window, blazing fast |
| **Large, multi‑file diffs** | **RepoPrompt** | instant patch generation on thousand‑line files |
| **Hands‑on coding IDE** | **Windsurf Editor** (Cascade agent) | AI‑native, runs terminals & tests for you |
| **Project management** | **TaskMasterAI** | auto‑prioritises, tracks, and slacks you |

---

## 1. Start with a Product Requirement Doc (PRD)

1. **Open `create-prd.mdc` inside Windsurf.**  
2. In the Agent chat (model = Gemini 2.5 Pro MAX) prompt:

   ```text
   Use @create-prd.mdc  
   Here’s the feature: real‑time comment threading  
   Reference: docs/comments.md, ui/Comment.tsx
   ```

3. Refine until scope, metrics, and constraints are crystal clear.

*Pro‑tip:* high‑volume PRD author? Grab **@chatprd** (from Claire Vo)—killer templates.

---

## 2. Explode the PRD into tasks

```text
Now take @<PRD-FILENAME>.md  
Create tasks using @generate-tasks-from-prd.mdc
```

Gemini returns a numbered hierarchy (1, 1.1, 1.1.1 …).

---

## 3. Lock the agent to one task at a time

Create `task-list.mdc`:

```md
Only work on the task id supplied in the message.  
After finishing, ask for approval before moving on.
```

Then:

```text
Start with 1.1 using @task-list.mdc
```

---

## 4. Tackle heavyweight edits with RepoPrompt

1. Select the directory.  
2. Say:  
   “Replace synchronous fetch with async/await in *utils/network/*.ts*.”  
3. Apply the streamed patch in Git—done.

---

## 5. Code comfortably in Windsurf

Cascade fixes failing tests *while you type*, predicts your next command, and shares MCP rule files with the Agent chat—so everything stays in sync.

---

## 6. Track the macro picture with TaskMasterAI

`/project sync` pulls your Git history, auto‑assigns owners, and posts burn‑down charts each morning.

---

## 7. Field notes

* **Architect once; refactor forever.** Keep big‑picture discussion in o3 threads.  
* **Write rules, not prompts.** Reusable `.mdc` files save thousands of tokens.  
* **Approve diffs at velocity.** If tests pass and the diff matches the PRD, merge.  
* **Budget for MAX mode.** Gemini 2.5 MAX condenses feature cycles into hours.  
* **Stash speciality models.** Keep GPT‑4o or Claude 3 Sonnet handy for niche jobs.

> An AI‑first workflow means **orchestrating a squad of specialist models** so you can laser‑focus on product taste. Give this stack a weekend hackathon—you’ll never go back.