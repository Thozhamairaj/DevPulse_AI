# DevPulse AI – Agentic Engineering Delivery Intelligence Platform

![DevPulse AI Platform](https://img.shields.io/badge/Status-Hackathon%20MVP-success)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/AI-Google%20GenAI%20SDK-4285F4?logo=google)
![Tests](https://img.shields.io/badge/Unit%20Tests-16%20Passed-brightgreen)

**DevPulse AI** is an Agentic Engineering Delivery Intelligence Platform designed to eliminate delivery surprises for engineering leads, scrum masters, and project managers. It automates the synthesis of project data, calculates transparent deterministic risk scores, visualizes cascading dependency bottlenecks, performs zero-side-effect "What-If" simulations, and provides Gemini-powered delivery recommendations and assistant chat.

---

## 1. System Architecture

DevPulse AI implements a true multi-agent architecture with three dedicated agents coordinated by a Central Orchestrator:

```
                          ┌────────────────────────┐
                          │   Project Telemetry    │
                          │     (JSON Seed)        │
                          └───────────┬────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │  Central Orchestrator  │
                          └─────┬──────┬─────┬─────┘
                                │      │     │
         ┌──────────────────────┘      │     └─────────────────────┐
         ▼                             ▼                           ▼
┌──────────────────┐         ┌──────────────────┐        ┌──────────────────┐
│    Risk Agent    │         │ Dependency Agent │        │Recommendation Agt│
│  (Deterministic  ├────────►│ (DAG Traversal,  ├───────►│  (Action Engine  │
│   Rules Engine)  │  tele-  │  Cycle Detection,│ tele-  │    + Gemini AI   │
│  - Overdue math  │  metry  │ Multi-tier delay)│ metry  │   Enhancements)  │
│  - Bug weighting │         │                  │        │                  │
└──────────────────┘         └──────────────────┘        └──────────────────┘
         │                             │                           │
         └──────────────────────┬──────┴───────────────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Synthesized Response │
                    │ + Agent Audit Trail   │
                    └───────────────────────┘
```

### The Agents

1. **Risk Agent (`backend/app/agents/risk_agent.py`)**
   - **Deterministic Mathematical Scoring**: Calculates transparent risk scores (0–100) and severity levels (`low`, `medium`, `high`, `critical`) without LLM hallucination.
   - Evaluates overdue status, elapsed sprint time vs. task progress, linked QA defect severities, and blocked states.
   - Returns factual, bulleted telemetry evidence for every flagged risk.

2. **Dependency Agent (`backend/app/agents/dependency_agent.py`)**
   - **Graph Traversal & Cycle Detection**: Constructs a directed acyclic graph (DAG) of project tasks with safe loop detection.
   - Traces multi-level downstream cascade paths: $A \to B \to C \to D$.
   - Identifies blocked tasks awaiting prerequisite deliverables and maps the critical release path.

3. **Recommendation Agent (`backend/app/agents/recommendation_agent.py`)**
   - Formulates targeted mitigations (resource pairing, mock API sandboxing, scope feature-flagging, schedule buffering).
   - Prioritizes by urgency (`urgent`, `high`, `medium`, `low`) and explains rationale.
   - Enriches insights using the official **Google GenAI SDK** (`gemini-2.5-flash`), with automated deterministic fallback.

4. **Central Orchestrator (`backend/app/agents/orchestrator.py`)**
   - Executes the multi-agent pipeline sequentially, aggregates data, and persists an audit log of agent execution durations, datasets analyzed, and discoveries.

---

## 2. Realistic Demonstration Scenario

The seeded demonstration project is **"E-Commerce Platform"** (Sprint 24: Core Payment & Checkout Flow):
- **10 Tasks, 4 Engineers, 4 Dependencies, 3 QA Bugs, Release Deadline: 2026-11-08**.
- **The Critical Delivery Bottleneck**:
  1. `TASK-101 (Payment API Development)` assigned to Alex Chen is **2 days overdue** (due: 2026-10-29, today: 2026-10-31) at **45% completion**, with 1 Critical QA bug (`BUG-201: Webhook signature verification failure`) and 1 High bug (`BUG-202: 3D-Secure mobile redirect failure`).
  2. `TASK-102 (Payment Integration Testing)` assigned to Sarah Jenkins is **BLOCKED** waiting on TASK-101.
  3. `TASK-103 (Order Workflow Testing)` assigned to Marcus Brody depends on TASK-102.
  4. `TASK-104 (Production Release & Deployment)` assigned to Elena Rostova depends on TASK-103.
  5. `TASK-107 (Checkout Frontend UI Flow)` is also stalled by TASK-101.
- **Result**: The critical release on **2026-11-08** is in jeopardy unless immediate mitigations are approved.

---

## 3. Frontend Pages (Dark Slate / Navy SaaS)

1. **Overview Dashboard (`/`)**:
   - Executive KPIs: Project Health (`CRITICAL`), Sprint Completion %, Overdue Tasks, Blocked Tasks, Critical Bugs, Release Countdown.
   - Interactive Recharts: Task status breakdown (Pie chart) and Risk severity distribution (Bar chart).
   - Visual Critical Path card and recent multi-agent activity stream.

2. **Risk Intelligence (`/risks`)**:
   - Filterable risk board (`All`, `Critical`, `High`, `Medium`, `Overdue`, `Blocked`).
   - Risk score meter (0–100), transparent telemetry evidence list, affected downstream task tags, and actionable recommendations.

3. **Dependency Map (`/dependencies`)**:
   - Step-by-step visual delivery pipeline: `Payment API` ➔ `Payment Testing` ➔ `Order Workflow` ➔ `Production Release`.
   - Node Inspector card displaying blockers, assignees, progress, and downstream dependents.
   - Graph validation indicators (DAG verified, 0 cycles).

4. **AI Assistant (`/assistant`)**:
   - Interactive chat interface with quick suggestion chips:
     - *"Which tasks can delay our release?"*
     - *"Why is the payment module at risk?"*
     - *"Summarize the current sprint."*
     - *"Which developer has the highest workload?"*
     - *"What should the team prioritize today?"*
   - Powered by Gemini 2.5 Flash with live sprint telemetry context and deterministic fallback engine.

5. **What-if Simulator (`/simulator`)**:
   - Interactive task selector and additional delay slider (+1 to +14 days).
   - Real-time cascading delay propagation down the dependency graph.
   - Release cutover impact assessment and AI-generated scenario mitigations.
   - **Guaranteed Immutability**: Pure simulation that never mutates live sprint data.

6. **Agent Activity (`/activities`)**:
   - Chronological execution log of all agent runs: duration (ms), dataset analyzed, discovered findings, and execution status.
   - "Trigger Agent Run" button to re-execute multi-agent pipeline in real-time.

7. **Approvals (`/approvals`)**:
   - Review and decision board for mitigation proposals.
   - Approve and Reject buttons with custom reviewer rationale notes.
   - Manages approval state in local backend state without destructive project modifications.

---

## 4. Technology Stack

### Backend
- **Language**: Python 3.14
- **Framework**: FastAPI + Uvicorn
- **Validation**: Pydantic v2
- **Environment**: python-dotenv
- **AI SDK**: `google-genai` (Official Google Gemini Python SDK)
- **Testing**: Pytest (16 automated tests)

### Frontend
- **Framework**: React 19 + TypeScript
- **Tooling**: Vite 8
- **Styling**: Tailwind CSS v4 (Dark Navy / Slate theme)
- **Routing**: React Router DOM v7
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Node.js (v18+) & npm
- Python 3.10+

### Step 1: Clone and Configure Environment

```bash
cd devpulse_AI

# Create .env from template
cp .env.example .env
```

To enable live Google Gemini responses, add your API key to `.env`:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
```
*(Note: If no API key is provided, DevPulse AI automatically activates its high-fidelity deterministic fallback engine with full feature parity).*

---

### Step 2: Backend Setup & Execution

```bash
# Create Python virtual environment
python3 -m venv backend/venv

# Activate virtual environment
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend test suite
PYTHONPATH=. pytest backend/tests

# Start FastAPI backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API documentation is available at: `http://localhost:8000/docs`

---

### Step 3: Frontend Setup & Execution

In a separate terminal:
```bash
cd devpulse_AI

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser to: **`http://localhost:5173`**

---

## 6. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and Gemini AI readiness |
| `GET` | `/api/projects` | List all engineering projects |
| `GET` | `/api/projects/{id}/dashboard` | Aggregated dashboard overview metrics |
| `GET` | `/api/projects/{id}/tasks` | Full project task list |
| `GET` | `/api/projects/{id}/risks` | Risk Agent telemetry and score breakdown |
| `GET` | `/api/projects/{id}/dependencies`| Dependency Agent DAG nodes, edges & blockers |
| `POST`| `/api/agents/analyze` | Execute complete multi-agent pipeline |
| `GET` | `/api/agents/activity` | Retrieve chronological agent audit logs |
| `POST`| `/api/assistant/chat` | AI Assistant query with grounded project context |
| `POST`| `/api/simulator/run` | Run What-If delay impact simulation |
| `GET` | `/api/approvals` | List mitigation recommendations |
| `POST`| `/api/approvals/{id}` | Approve or reject a mitigation proposal |

---

## 7. Automated Test Suite

Run the complete test suite with:
```bash
PYTHONPATH=. backend/venv/bin/pytest backend/tests
```

Test coverage includes:
- **`test_risk_agent.py`**: Validates deterministic overdue penalties, progress deficit rules, QA bug severity weighting, and completed task handling.
- **`test_dependency_agent.py`**: Validates directed graph traversal, blocked task detection, multi-tier downstream reachability, and circular dependency safety.
- **`test_simulator.py`**: Validates schedule slippage math, downstream release delay projection, and guaranteed task immutability.
- **`test_api_endpoints.py`**: Validates all 12 FastAPI endpoints with `TestClient`.

---

## 8. License

Demonstration MVP built for Hackathon delivery intelligence evaluation.
