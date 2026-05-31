"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Dashboard, Task } from "@/types";

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size * 0.35;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const center = size / 2;
  const sw = size * 0.07;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={sw}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span
        className="absolute font-bold text-white"
        style={{ fontSize: size * 0.2 }}
      >
        {score}%
      </span>
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchDashboard = useCallback(() => api.dashboard.get(), []);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  async function handleComplete(task: Task) {
    if (completing) return;
    setCompleting(task.id);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        active_goals: prev.active_goals.map((s) => ({
          ...s,
          sprint_tasks: s.sprint_tasks.map((t) =>
            t.id === task.id
              ? { ...t, is_completed: true, status: "done" as const }
              : t,
          ),
        })),
      };
    });
    try {
      await api.sprint.complete(task.cycle_id, task.id);
      setData(await fetchDashboard());
    } finally {
      setCompleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-[#888] text-sm">Loading…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-[#888] text-sm">Failed to load.</span>
      </div>
    );
  }

  const allSprint = data.active_goals.flatMap((s) => s.sprint_tasks);
  const completedCount = allSprint.filter((t) => t.is_completed).length;
  const score =
    allSprint.length > 0
      ? Math.round((completedCount / allSprint.length) * 100)
      : 0;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Dashboard</h1>
          <p className="text-[#888] text-sm">12-Week Year overview</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ScoreRing score={score} />
          <span className="text-xs text-[#888]">execution score</span>
          <span className="text-xs text-[#555]">
            {completedCount}/{allSprint.length} tasks
          </span>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xs font-medium text-[#888] uppercase tracking-widest mb-4">
          Active Goals
        </h2>
        {data.active_goals.length === 0 ? (
          <p className="text-[#555] text-sm">
            No active goals.{" "}
            <Link
              href="/life-areas"
              className="text-white underline underline-offset-2"
            >
              Activate one
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <div className="grid gap-3">
            {data.active_goals.map((summary) => {
              const { life_area, big_goal, cycle, sprint_tasks, current_week } =
                summary;
              const color = life_area.color ?? "#888";
              return (
                <div
                  key={cycle.id}
                  className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#333] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <span className="text-xs text-[#888] uppercase tracking-wider">
                          {life_area.name}
                        </span>
                        <h3 className="text-white text-sm font-medium mt-0.5">
                          {big_goal.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-[#555]">
                        Week {current_week}/12
                      </span>
                      <Link
                        href={`/goals/${cycle.id}`}
                        className="text-xs text-[#888] hover:text-white transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  </div>

                  <ProgressBar value={current_week} max={12} color={color} />

                  {cycle.key_results.length > 0 && (
                    <div className="mt-4 space-y-2.5">
                      {cycle.key_results.map((kr) => {
                        const cur = kr.current ?? 0;
                        const tgt = kr.target ?? 0;
                        return (
                          <div key={kr.id}>
                            <div className="flex justify-between text-xs text-[#888] mb-1">
                              <span className="truncate pr-4">{kr.title}</span>
                              <span className="shrink-0">
                                {cur}/{tgt}
                                {kr.unit ? ` ${kr.unit}` : ""}
                              </span>
                            </div>
                            <ProgressBar
                              value={cur}
                              max={tgt || 1}
                              color={color}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {sprint_tasks.length > 0 && (
                    <div className="mt-4 space-y-1.5 pt-4 border-t border-[#1a1a1a]">
                      <p className="text-xs text-[#888] uppercase tracking-wider mb-2">
                        Sprint tasks
                      </p>
                      {sprint_tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0a] rounded-lg"
                        >
                          <button
                            onClick={() =>
                              !task.is_completed && handleComplete(task)
                            }
                            disabled={
                              task.is_completed || completing === task.id
                            }
                            className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors disabled:cursor-default"
                            style={
                              task.is_completed
                                ? {
                                    backgroundColor: color,
                                    borderColor: "transparent",
                                  }
                                : { borderColor: "#333" }
                            }
                          >
                            {task.is_completed && (
                              <svg
                                width="9"
                                height="7"
                                viewBox="0 0 9 7"
                                fill="none"
                              >
                                <path
                                  d="M1 3.5L3 5.5L8 1"
                                  stroke="#000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                          <span
                            className={`text-sm flex-1 ${task.is_completed ? "line-through text-[#555]" : "text-white"}`}
                          >
                            {task.title}
                          </span>
                          {task.kr_value && !task.is_completed && (
                            <span className="text-xs text-[#555] shrink-0">
                              +{task.kr_value}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {data.active_goals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-[#888] uppercase tracking-widest">
              Sprint
            </h2>
            <Link
              href="/sprint"
              className="text-xs text-[#888] hover:text-white transition-colors"
            >
              Manage →
            </Link>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
            <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${score}%`,
                  backgroundColor:
                    score >= 80
                      ? "#10b981"
                      : score >= 50
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#555]">
              <span>{completedCount} completed</span>
              <span>{allSprint.length - completedCount} remaining</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
