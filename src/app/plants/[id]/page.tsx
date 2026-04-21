"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Plant = {
  id: number;
  name: string;
  type: string;
  species: string | null;
  variety: string | null;
  batch_size: number;
  location: string | null;
  date_started: string | null;
  notes: string | null;
  created_at: string;
};

type CareLog = {
  id: number;
  care_type: string;
  notes: string | null;
  logged_at: string;
};

const CARE_TYPES = ["water", "fertilize", "repot", "prune", "treat", "observe", "other"] as const;

const CARE_ICONS: Record<string, string> = {
  water: "💧",
  fertilize: "🌿",
  repot: "🪴",
  prune: "✂️",
  treat: "🩹",
  observe: "👁️",
  other: "📝",
};

const TYPE_LABELS: Record<string, string> = {
  seedling_batch: "Seedling Batch",
  nursery_start: "Nursery Start",
  propagation: "Propagation",
  indoor: "Indoor Plant",
};

export default function PlantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<{ plant: Plant; logs: CareLog[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [careNote, setCareNote] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch(`/api/plants/${id}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function logCare(care_type: string) {
    setLogging(true);
    await fetch(`/api/plants/${id}/care`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ care_type, notes: careNote || null }),
    });
    setCareNote("");
    await load();
    setLogging(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this plant? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/plants/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) return <div className="text-stone-700 text-sm">Loading...</div>;
  if (!data) return <div className="text-stone-700">Plant not found. <Link href="/" className="underline">Go back</Link></div>;

  const { plant, logs } = data;

  const daysSinceStarted = plant.date_started
    ? Math.floor((Date.now() - new Date(plant.date_started).getTime()) / 86400000)
    : null;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-stone-700 hover:text-stone-800 transition-colors">
          ← All plants
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{plant.name}</h1>
            {(plant.species || plant.variety) && (
              <p className="text-sm text-stone-700 italic mt-0.5">
                {[plant.species, plant.variety].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/plants/${id}/edit`}
              className="text-sm px-3 py-1.5 border border-stone-200 rounded-lg text-stone-800 hover:bg-stone-50 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-stone-700">Type</span>
          <p className="font-medium mt-0.5">{TYPE_LABELS[plant.type] ?? plant.type}</p>
        </div>
        {plant.type === "seedling_batch" && (
          <div>
            <span className="text-stone-700">Batch size</span>
            <p className="font-medium mt-0.5">{plant.batch_size} seedlings</p>
          </div>
        )}
        {plant.location && (
          <div>
            <span className="text-stone-700">Location</span>
            <p className="font-medium mt-0.5">{plant.location}</p>
          </div>
        )}
        {plant.date_started && (
          <div>
            <span className="text-stone-700">Started</span>
            <p className="font-medium mt-0.5">
              {new Date(plant.date_started).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {daysSinceStarted !== null && (
                <span className="text-stone-700 font-normal ml-1">({daysSinceStarted}d ago)</span>
              )}
            </p>
          </div>
        )}
        {plant.notes && (
          <div className="col-span-2">
            <span className="text-stone-700">Notes</span>
            <p className="mt-0.5 text-stone-700">{plant.notes}</p>
          </div>
        )}
      </div>

      {/* Log care */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
        <h2 className="font-medium text-sm mb-3">Log care</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {CARE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => logCare(type)}
              disabled={logging}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-stone-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-50"
            >
              {CARE_ICONS[type]} {type}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={careNote}
          onChange={(e) => setCareNote(e.target.value)}
          placeholder="Optional note..."
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
      </div>

      {/* Care history */}
      <div>
        <h2 className="font-medium text-sm text-stone-700 uppercase tracking-wider mb-3">Care history</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-stone-700">No care logged yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3 text-sm">
                <span className="text-lg leading-none mt-0.5">{CARE_ICONS[log.care_type] ?? "📝"}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium capitalize">{log.care_type}</span>
                  {log.notes && <span className="text-stone-700 ml-2">{log.notes}</span>}
                </div>
                <span className="text-stone-700 shrink-0">
                  {new Date(log.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
