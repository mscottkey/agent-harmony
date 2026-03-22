import { useState, useCallback, useRef, useEffect } from "react";

export interface ReplayStep {
  nodeId: string;
  status: "success" | "warning" | "critical";
  narrative: string;
  feedMessage: string;
}

const SCENARIO_STEPS: ReplayStep[] = [
  { nodeId: "1", status: "success", narrative: "Enterprise lead ingested from webhook, score 87/100", feedMessage: "▶ [Replay] New enterprise lead ingested — score 87/100" },
  { nodeId: "2", status: "success", narrative: "Classified as enterprise tier, routing to support pipeline", feedMessage: "▶ [Replay] Lead classified as enterprise tier" },
  { nodeId: "4", status: "success", narrative: "Context payload transmitted via MCP Bridge (2.1KB)", feedMessage: "▶ [Replay] MCP payload transmitted (2.1KB)" },
  { nodeId: "3", status: "critical", narrative: "⚠ Risk score elevated to 0.89 — retention trigger needed", feedMessage: "▶ [Replay] ⚠ Churn risk spiked to 0.89" },
  { nodeId: "5", status: "critical", narrative: "❌ DRIFT: Schema mismatch — 'sentiment' field rejected by ChurnZero v1.0", feedMessage: "▶ [Replay] ❌ Schema mismatch — sentiment field rejected" },
  { nodeId: "7", status: "critical", narrative: "❌ Escalation dropped — no customer context attached. Human intervention required.", feedMessage: "▶ [Replay] ❌ Escalation failed — no context attached" },
];

export function useScenarioReplay() {
  const [replayActive, setReplayActive] = useState(false);
  const [replayStep, setReplayStep] = useState(-1);
  const [replayComplete, setReplayComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = replayStep >= 0 && replayStep < SCENARIO_STEPS.length ? SCENARIO_STEPS[replayStep] : null;
  const totalSteps = SCENARIO_STEPS.length;

  const startReplay = useCallback(() => {
    setReplayActive(true);
    setReplayComplete(false);
    setReplayStep(0);
  }, []);

  const resumeLive = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setReplayActive(false);
    setReplayStep(-1);
    setReplayComplete(false);
  }, []);

  // Advance steps on a timer
  useEffect(() => {
    if (!replayActive || replayStep < 0) return;
    if (replayStep >= SCENARIO_STEPS.length) {
      setReplayComplete(true);
      setReplayActive(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setReplayStep((s) => s + 1);
    }, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [replayActive, replayStep]);

  return {
    replayActive,
    replayStep,
    replayComplete,
    currentStep,
    totalSteps,
    allSteps: SCENARIO_STEPS,
    startReplay,
    resumeLive,
  };
}
