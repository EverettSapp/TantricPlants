"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type CareItem = {
  id: number;
  plant_id: number;
  plant_name: string;
  category: string;
  health_status: string;
  care_type: string;
  interval_days: number;
  last_done_at: string | null;
  next_due_at: string | null;
  ai_care_note: string | null;
};

type SuggestedItem = {
  id: number;
  plant_id: number;
  plant_name: string;
  care_type: string;
  interval_days: number;
  ai_care_note: string | null;
};

type LogState = {
  scheduleId: number;
  observations: string[];
  notes: string;
  health_status: "thriving" | "good" | "stressed" | "dormant";
};

const CARE_ICONS: Record<string, string> = {
  water: "💧",
  fertilize: "🌿",
  mist: "💨",
  repot: "🪴",
  prune: "✂️",
};

const OBSERVATION_OPTIONS = [
  { value: "soil_wet", label: "Soil still wet" },
  { value: "soil_dry", label: "Soil bone dry" },
  { value: "new_growth", label: "New growth" },
  { value: "looking_healthy", label: "Looking healthy" },
  { value: "looking_stressed", label: "Looking stressed" },
  { value: "yellowing", label: "Yellowing" },
  { value: "wilting", label: "Wilting" },
  { value: "pests", label: "Pests spotted" },
];

const HEALTH_OPTIONS: { value: LogState["health_status"]; label: string; color: string }[] = [
  { value: "thriving", label: "Thriving", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "good", label: "Good", color: "bg-stone-100 text-stone-700 border-stone-300" },
  { value: "stressed", label: "Stressed", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "dormant", label: "Dormant", color: "bg-blue-100 text-blue-800 border-blue-300" },
];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function dueLabel(days: number | null): { text: string; color: string } {
  if (days === null) return { text: "No schedule", color: "text-stone-700" };
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: "text-red-600 font-semibold" };
  if (days === 0) return { text: "Due today", color: "text-amber-600 font-semibold" };
  if (days === 1) return { text: "Due tomorrow", color: "text-amber-500" };
  return { text: `Due in ${days}d`, color: "text-stone-700" };
}

// Group suggested items by plant
function groupByPlant(items: SuggestedItem[]): Map<number, { name: string; items: SuggestedItem[] }> {
  const map = new Map<number, { name: string; items: SuggestedItem[] }>();
  for (const item of items) {
    if (!map.has(item.plant_id)) {
      map.set(item.plant_id, { name: item.plant_name, items: [] });
    }
    map.get(item.plant_id)!.items.push(item);
  }
  return map;
}

export default function CareDashboard() {
  const [active, setActive] = useState<CareItem[]>([]);
  const [suggested, setSuggested] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logState, setLogState] = useState<LogState | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/care");
    const data = await res.json() as { active: CareItem[]; suggested: SuggestedItem[] };
    setActive(data.active);
    setSuggested(data.suggested);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function quickComplete(scheduleId: number) {
    setSubmitting(scheduleId);
    await fetch(`/api/care-schedules/${scheduleId}/complete`, { method: "POST" });
    setSubmitting(null);
    await load();
  }

  async function submitLog(scheduleId: number) {
    if (!logState) return;
    setSubmitting(scheduleId);
    await fetch(`/api/care-schedules/${scheduleId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        observations: logState.observations,
        notes: logState.notes || null,
        health_status: logState.health_status,
      }),
    });
    setLogState(null);
    setSubmitting(null);
    await load();
  }

  async function activatePlant(plantId: number) {
    setSubmitting(plantId * -1); // negative to avoid id collision
    await fetch(`/api/care-schedules/${plantId}/activate`, { method: "POST" });
    setSubmitting(null);
    await load();
  }

  function openLog(item: CareItem) {
    setLogState({
      scheduleId: item.id,
      observations: [],
      notes: "",
      health_status: (item.health_status as LogState["health_status"]) ?? "good",
    });
  }

  function toggleObs(obs: string) {
    if (!logState) return;
    setLogState((s) =>
      s
        ? {
            ...s,
            observations: s.observations.includes(obs)
              ? s.observations.filter((o) => o !== obs)
              : [...s.observations, obs],
          }
        : s
    );
  }

  if (loading) {
    return (
      <div className="text-stone-700 text-sm py-12 text-center">Loading care schedule...</div>
    );
  }

  const grouped = groupByPlant(suggested);
  const overdue = active.filter((i) => (daysUntil(i.next_due_at) ?? 0) < 0);
  const today = active.filter((i) => daysUntil(i.next_due_at) === 0);
  const upcoming = active.filter((i) => (daysUntil(i.next_due_at) ?? 0) > 0);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-stone-700 hover:text-stone-800 transition-colors">
            ← Home
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Care Dashboard</h1>
        </div>
        {active.length > 0 && (
          <span className="text-sm text-stone-700">{active.length} active schedule{active.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Log modal */}
      {logState && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-semibold text-lg">Log care</h2>

            {/* Observations */}
            <div>
              <p className="text-sm font-medium text-stone-800 mb-2">What did you notice?</p>
              <div className="flex flex-wrap gap-2">
                {OBSERVATION_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleObs(o.value)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      logState.observations.includes(o.value)
                        ? "bg-green-700 text-white border-green-700"
                        : "bg-white text-stone-800 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Plant health */}
            <div>
              <p className="text-sm font-medium text-stone-800 mb-2">Plant health</p>
              <div className="flex gap-2 flex-wrap">
                {HEALTH_OPTIONS.map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => setLogState((s) => s ? { ...s, health_status: h.value } : s)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      logState.health_status === h.value ? h.color + " font-semibold" : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <textarea
                value={logState.notes}
                onChange={(e) => setLogState((s) => s ? { ...s, notes: e.target.value } : s)}
                placeholder="Any other notes... (optional)"
                rows={2}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => submitLog(logState.scheduleId)}
                disabled={submitting === logState.scheduleId}
                className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
              >
                {submitting === logState.scheduleId ? "Saving..." : "Complete & Save"}
              </button>
              <button
                onClick={() => setLogState(null)}
                className="px-4 py-2 rounded-lg text-sm text-stone-800 hover:bg-stone-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active schedules */}
      {active.length === 0 && suggested.length === 0 && (
        <div className="text-center py-16 text-stone-700">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm">No care schedules yet.</p>
          <p className="text-sm mt-1">Add a plant to get started.</p>
          <Link href="/plants/new" className="mt-4 inline-block text-sm text-green-700 hover:underline">
            Add a plant →
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">Overdue</h2>
              <CareList items={overdue} submitting={submitting} onComplete={quickComplete} onLog={openLog} />
            </section>
          )}
          {today.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">Today</h2>
              <CareList items={today} submitting={submitting} onComplete={quickComplete} onLog={openLog} />
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">Upcoming</h2>
              <CareList items={upcoming} submitting={submitting} onComplete={quickComplete} onLog={openLog} />
            </section>
          )}
        </div>
      )}

      {/* Suggested (not yet started) */}
      {grouped.size > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-3">
            Ready to start — {grouped.size} plant{grouped.size !== 1 ? "s" : ""}
          </h2>
          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([plantId, { name, items }]) => (
              <div key={plantId} className="border border-stone-200 rounded-xl p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/plants/${plantId}`}
                      className="font-medium text-stone-800 hover:text-green-700"
                    >
                      {name}
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-800 px-2 py-1 rounded-full"
                          title={item.ai_care_note ?? ""}
                        >
                          {CARE_ICONS[item.care_type] ?? "•"} {item.care_type} every {item.interval_days}d
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => activatePlant(plantId)}
                    disabled={submitting === plantId * -1}
                    className="shrink-0 bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-800 disabled:opacity-50 whitespace-nowrap"
                  >
                    {submitting === plantId * -1 ? "Starting..." : "Start Care Clock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CareList({
  items,
  submitting,
  onComplete,
  onLog,
}: {
  items: CareItem[];
  submitting: number | null;
  onComplete: (id: number) => void;
  onLog: (item: CareItem) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const days = daysUntil(item.next_due_at);
        const due = dueLabel(days);
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3"
          >
            <span className="text-xl">{CARE_ICONS[item.care_type] ?? "•"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <Link
                  href={`/plants/${item.plant_id}`}
                  className="font-medium text-stone-800 hover:text-green-700 truncate"
                >
                  {item.plant_name}
                </Link>
                <span className="text-xs text-stone-700 capitalize">{item.care_type}</span>
              </div>
              <p className={`text-xs mt-0.5 ${due.color}`}>{due.text}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => onLog(item)}
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-800 hover:bg-stone-50"
              >
                Log
              </button>
              <button
                onClick={() => onComplete(item.id)}
                disabled={submitting === item.id}
                className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {submitting === item.id ? "..." : "Done"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
