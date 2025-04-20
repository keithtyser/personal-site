# My AI-First Development Workflow in 2025
*(Last updated: April 19 2025)*

When every layer of the tool chain can reason about your code, the fastest route from idea to production is to let the models drive while you supervise.

> **My personal twist**  
> - I lean on **OpenAI o3** for deep debugging and planning only. o3 writes an instruction set that I paste into Cursor so **Gemini 2.5 Pro MAX** can generate the actual code.  
> - o3 is brilliant but starts to lose its grip on repos larger than about **25 k tokens**.  
> - Swap the first **g** in any **github.com** link with a **u** to get **uithub.com**. It provides an XML‑formatted snapshot you can quickly copy into an LLM prompt *and* a token count for the whole repo.  
> - I tap **DeepResearch** whenever I need an up‑to‑date read on the best tech stack for a new project.  
> - If ChatGPT wrecks the formatting of generated markdown, just say **“Give me a raw unrendered markdown for the file in a .txt and allow me to download it.”** You will get a clean file that is easy to copy or commit.

| Layer | Model / Tool | Why it sits here |
|-------|--------------|------------------|
| **Architecture & high‑level design** | **OpenAI o3** | long‑context reasoning and trade‑off discussions |
| **Bug fixing & step‑by‑step plans** | **OpenAI o3** | writes plain‑English task lists for the agent |
| **Tech‑stack research & feasibility** | **DeepResearch** | surfaces the latest frameworks and libraries tailored to the PRD |
| **Feature‑level implementation & big‑picture editing** | **Gemini 2.5 Pro (MAX)** inside **Cursor** | huge context window, blazing fast |
| **Hands‑on coding IDE** | **Cursor IDE** | AI‑native IDE with inline chat, test runner and git‑aware refactors |

---

## 1. Start with a Product Requirement Doc (PRD)

1. **Open `create-prd.mdc` inside Cursor.**  
2. In the Agent chat (model = Gemini 2.5 Pro MAX) prompt:

   ```text
   Use @create-prd.mdc  
   Here’s the feature: real‑time comment threading  
   Reference: docs/comments.md, ui/Comment.tsx
   ```

3. Refine until scope, metrics and constraints are crystal clear.

*Pro tip:* high‑volume PRD author? Grab **@chatprd** (from Claire Vo) – killer templates.

---

## 2. Explode the PRD into tasks

```text
Now take @<PRD-FILENAME>.md  
Create tasks using @generate-tasks-from-prd.mdc
```

Gemini returns a numbered hierarchy (1, 1.1, 1.1.1 …).

---

## 3. Lock the agent to one task at a time

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

## 4. Code comfortably in Cursor

Cursor’s inline chat fixes failing tests while you type, predicts your next command and rewrites functions across files – keeping everything in sync with your MCP rule files.

---

## 5. Field notes

- Architect once; refactor forever. Keep big‑picture discussion in o3 threads.  
- Write rules, not prompts. Reusable `.mdc` files save thousands of tokens.  
- The **uithub** trick is the fastest way to hand your entire repo to an LLM.  
- DeepResearch is my lens on new libraries and emerging patterns before committing.  
- Approve diffs at velocity: if tests pass and the diff matches the PRD, merge.  
- Budget for MAX mode – Gemini 2.5 MAX condenses feature cycles into hours.  
- Stash specialty models such as **o3, o4‑mini and DeepResearch** for niche jobs.  
- **Claude Sonnet 3.7 is banned** – it goes off the rails and writes code on its own. **Claude Sonnet 3.5** is a solid fallback if you lack Gemini 2.5 access.  
- This doc evolves quickly; check the date above before quoting it in slides.

---

## Things I want to try

- Codex CLI
- RepoPrompt for automated multi‑file patches.  
- TaskMasterAI for auto project tracking.  
- Self‑Refactoring Pull‑Request Agent

---
