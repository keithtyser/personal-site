# Tech Stack & Setup — WIP

A living document of the hardware, software, and workflows that power my day‑to‑day as an AI/ML engineer.

status: draft  
last_updated: 2025‑04‑19

> **Note:** This post is a work‑in‑progress. I’ll keep refining it as my stack evolves.

## 1 · Hardware

| Component | Current Gear | Notes |
|-----------|--------------|-------|
| **Primary laptop/desktop** | Custom desktop – Ryzen 9 7950X · 64 GB DDR5 · 2×2 TB NVMe · RTX 4090 | AM5 upgradable, near‑silent, dual‑boot |
| **GPU(s)** | RTX 4090 24 GB · Radeon RX 7700S 8 GB | CUDA 12 + ROCm 6; eGPU via TB4 |
| **Monitors** | 2×27″ 4K IPS (LG 27UP850) + 27″ QHD vertical | 200 % scaling, coding/PDF side‑by‑side |
| **Peripherals** | Ergodox EZ, Logitech MX Master 3S, Shure MV7, Elgato Facecam | Ergonomic, quiet, plug‑and‑play |

---

## 2 · Operating Systems & Shell

- **OS**: Ubuntu 24.04 LTS (primary) / Windows 11 Pro 24H1
- **Shell**: zsh + Starship prompt
- **Terminal emulator**: WezTerm · Gruvbox theme
- **Dotfiles**: <https://github.com/keithtyser/dotfiles>

---

## 3 · IDE & Editor Stack

| Tool | Purpose | Must‑have plugins / settings |
|------|---------|------------------------------|
| **Cursor** | daily coding | Cursor AI, Copilot Chat, Rainbow CSV, Prettier |
| Neovim | quick edits & SSH | Telescope, Treesitter, LSP‑zero, copilot.lua |

> **Snippet:** `"editor.formatOnSave": true`

---

## 4 · Languages & Frameworks

- **Primary languages**: Python, TypeScript, SQL
- **Web / API frameworks**: Next.js 14, FastAPI, Gradio
- **ML / data**: PyTorch 2.2, Lightning, Transformers, Sklearn, Polars

---

## 5 · Package & Environment Management

- Python: mamba (conda) + Poetry
- JS/TS: pnpm workspaces – fast, disk‑light
- System‑wide: Homebrew + nix flakes for reproducibility

---

## 6 · Containerization & Orchestration

- **Docker**: CLI + Compose v2; devcontainers.json
- **Kubernetes**: k3s homelab, AWS EKS for prod
- **Notes / gotchas**: use kind in CI; tilt for live‑reload

---

## 7 · Data & Storage

| Data layer | Usage | Reason |
|------------|-------|--------|
| **PostgreSQL / Supabase** | project metadata & auth | managed, SQL, row‑level security |
| **Vector DB (Pinecone, Qdrant, etc.)** | LanceDB v2 local; Pinecone prod | fast HNSW; serverless dev |
| **Warehouse (Snowflake, BigQuery, etc.)** | Snowflake | zero‑copy clone, time‑travel |
| Local toys (DuckDB, SQLite) | ad‑hoc analytics & tests | no server, tiny footprint |

---

## 8 · Cloud & Deployment

- **Primary cloud**: AWS (p5e GPUs) + Vercel for frontends
- **CI/CD**: GitHub Actions – matrix build, push to ECR
- **IaC**: Terraform + Terragrunt
- **Runtime monitoring**: Grafana Loki, Prometheus, Sentry, CloudWatch

---

## 9 · AI‑First Tooling

| Tool | Role in workflow |
|------|------------------|
| GPT o3 | planning, refactor, multimodal debugging |
| Deep Research | for research duh |
| Gemini 2.5 Pro | daily coding |
| Ollama + GGUF | offline LLMs; rapid local RAG tests |
| GitHub Copilot | inline completion, unit tests |
---

## 10 · Productivity & Knowledge Management

- **Notes**: Obsidian · Dataview, Calendar, GPT‑4 summarizer plugin
- **Task tracking**: `todo.md` for daily log
- **Keyboard shortcuts / hotkeys**:
  1. `Ctrl‑Shift‑Space` ⇒ AI explain selection
  2. `Alt‑.` ⇒ jump to definition
  3. `Ctrl‑K Ctrl‑O` ⇒ open recent repo
  4. `Cmd‑Shift‑P` ⇒ command palette
  5. `Ctrl‑Alt‑T` ⇒ new tmux session

---

## 11 · Desk Setup & Ergonomics

- Autonomous SmartDesk Pro XL (sit‑stand)
- Herman Miller Embody chair
- 5000 K LED bias lighting
- Elgato Stream Deck for macros
- Logitech Brio overhead cam for hardware demos

---

## 12 · Wishlist & Future Experiments

- Build homelab cluster (Proxmox VE 9 + used GPUs)
- Migrate primary workstation to NixOS
- Test streaming LLM inference with FlexGen & FT‑Server
- Evaluate Intel Gaudi2 DL2 instances for training
- Implement air‑gapped, auditable ML pipeline

---

## Changelog

| Date | Update |
|------|--------|
| 2025‑04‑19 | Initial skeleton populated |

---

_Readers: tweet [@keithtyser](https://twitter.com/keithtyser) with suggestions or questions._

