

## Revised Plan: 5 New Features for Drift Orchestrator

Incorporating all architectural feedback.

---

### 1. Orchestration Topology Selector

Extract a pure function `getTopologyLayout(topology, nodes)` at the top of `AgentDecisionGraph.tsx` that returns `{ positions, edges }` for each mode:

- **Sequential**: Linear left-to-right chain
- **Supervisor**: Hub-and-spoke (default, matches current layout)
- **Swarm**: Circular mesh — edges rendered at **0.15 opacity** by default, bumped to full opacity only on active/drifting connections to avoid visual noise from 21 lines

Internal `topology` state with a `ToggleGroup` in the card header.

**Files**: `AgentDecisionGraph.tsx`

---

### 2. Kill Switch with Latch + Reset

New guardrail entry in `SafetyGuardrails.tsx`: type `"termination"`, badge `🛑 Kill Switch`. When enabled, show a `Slider` (0–50, default 25) below the toggle.

**Latch behavior**: Once average drift drops below threshold, set a `killSwitchTriggered` state in `AgentDecisionGraph` that **stays true** regardless of score recovery. All nodes go gray/terminated, edges stop animating, red SVG banner overlays, toast fires, feed logs "KILL SWITCH ACTIVATED".

A **"Reset System"** button appears only in terminated state — clicking it clears the latch and resumes live simulation.

Props wired through `Index.tsx`: `onKillSwitchChange`, `onKillThresholdChange` → `killSwitchEnabled`, `killThreshold` on graph.

**Files**: `SafetyGuardrails.tsx`, `AgentDecisionGraph.tsx`, `Index.tsx`, `index.css`

---

### 3. A2A Agent Card Inspector

Add "Agent Card" button per agent row in `MCPHub.tsx`. Dialog shows syntax-highlighted JSON (`<pre>` with monospace) for each agent's A2A-MCP-v1.2 manifest. "Copy JSON" button with toast.

**Files**: `MCPHub.tsx`

---

### 4. LLM-as-Judge Evaluator Panel

New `EvaluatorPanel.tsx` — self-contained card with:
- Aggregate stats bar (pass rate, avg faithfulness, flagged count)
- Table of 8 transactions auto-refreshing every 4s with jitter
- Color-coded scores, PASS/FAIL/REVIEW verdict badges

Placed in monitoring grid between MCPHub and DriftTimeline.

**Files**: `src/components/dashboard/EvaluatorPanel.tsx` (new), `Index.tsx`

---

### 5. Guided Scenario Replay — Extracted Hook

Create **`src/hooks/useScenarioReplay.ts`** that encapsulates the replay state machine and returns:
- `replayActive`, `replayStep`, `replayData` (current step narrative)
- `startReplay()`, `resumeLive()`
- Manages its own `setTimeout` chain internally

`AgentDecisionGraph.tsx` consumes the hook — the JSX just reads `replayStep` to highlight nodes, show the step indicator bar + progress, and render the summary card on completion. "Open Root Cause Analysis" triggers existing `onEscalationClick` prop.

**Files**: `src/hooks/useScenarioReplay.ts` (new), `AgentDecisionGraph.tsx`

---

### Summary of Changes

| File | Changes |
|---|---|
| `AgentDecisionGraph.tsx` | Topology layout function, topology toggle, kill switch latch + reset, replay hook consumption |
| `SafetyGuardrails.tsx` | Kill switch guardrail + slider |
| `MCPHub.tsx` | Agent Card dialog |
| `EvaluatorPanel.tsx` (new) | Transaction evaluator table |
| `useScenarioReplay.ts` (new) | Replay state machine hook |
| `Index.tsx` | Wire kill switch props, add EvaluatorPanel to grid |
| `index.css` | Terminated node styling |

