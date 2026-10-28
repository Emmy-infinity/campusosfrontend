import { useEffect, useRef, useState } from "react";
import { getTaskStatus } from "../api/ai";

const TERMINAL = new Set(["SUCCESS", "FAILURE", "REVOKED"]);

export function usePollTask(intervalMs = 2000) {
  const [taskId, setTaskId] = useState(null);
  const [state, setState] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const data = await getTaskStatus(taskId);
        if (cancelled) return;
        setState(data.state);
        if (data.state === "SUCCESS") {
          setResult(data);
          setTaskId(null);
        } else if (data.state === "FAILURE") {
          setError(data.error || "AI processing failed.");
          setTaskId(null);
        } else {
          timer.current = setTimeout(tick, intervalMs);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e?.response?.data?.error || "Could not reach AI service.");
        setTaskId(null);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [taskId, intervalMs]);

  const reset = () => {
    setState(null);
    setResult(null);
    setError(null);
  };

  return { taskId, setTaskId, state, result, error, reset };
}