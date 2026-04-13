"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Plant = {
  id: number;
  name: string;
  type: "seedling_batch" | "nursery_start" | "propagation" | "indoor";
  species: string | null;
  variety: string | null;
  batch_size: number;
  location: string | null;
  date_started: string | null;
  notes: string | null;
};

const TYPE_LABELS: Record<Plant["type"], string> = {
  seedling_batch: "Seedling Batches",
  nursery_start: "Nursery Starts",
  propagation: "Propagations",
  indoor: "Indoor Plants",
};

const TYPE_COLORS: Record<Plant["type"], string> = {
  seedling_batch: "bg-lime-100 text-lime-800",
  nursery_start: "bg-emerald-100 text-emerald-800",
  propagation: "bg-teal-100 text-teal-800",
  indoor: "bg-green-100 text-green-800",
};

const ALL_TYPES = ["seedling_batch", "nursery_start", "propagation", "indoor"] as const;

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filter, setFilter] = useState<Plant["type"] | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter === "all" ? "/api/plants" : `/api/plants?type=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setPlants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const grouped = ALL_TYPES.reduce<Record<string, Plant[]>>((acc, type) => {
    acc[type] = plants.filter((p) => p.type === type);
    return acc;
  }, {} as Record<string, Plant[]>);

  const totalCount = plants.reduce(
    (sum, p) => sum + (p.type === "seedling_batch" ? p.batch_size : 1),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">All Plants</h1>
          {!loading && (
            <p className="text-sm text-stone-500 mt-0.5">
              {plants.length} entries · {totalCount} individual plants
            </p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-stone-800 text-white"
              : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
          }`}
        >
          All
        </button>
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === type
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : plants.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-medium">No plants yet</p>
          <p className="text-sm mt-1">
            <Link href="/plants/new" className="text-green-700 hover:underline">
              Add your first plant
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {ALL_TYPES.filter((type) => filter === "all" || filter === type).map((type) => {
            const group = grouped[type];
            if (group.length === 0) return null;
            return (
              <section key={type}>
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
                  {TYPE_LABELS[type]} ({group.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.map((plant) => (
                    <Link
                      key={plant.id}
                      href={`/plants/${plant.id}`}
                      className="bg-white border border-stone-200 rounded-xl p-4 hover:border-green-400 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 truncate group-hover:text-green-800">
                            {plant.name}
                          </p>
                          {(plant.species || plant.variety) && (
                            <p className="text-xs text-stone-400 italic truncate mt-0.5">
                              {[plant.species, plant.variety].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${TYPE_COLORS[plant.type]}`}>
                          {plant.type === "seedling_batch" ? `×${plant.batch_size}` : plant.type.replace("_", " ")}
                        </span>
                      </div>
                      {plant.location && (
                        <p className="text-xs text-stone-400 mt-2">📍 {plant.location}</p>
                      )}
                      {plant.date_started && (
                        <p className="text-xs text-stone-400 mt-1">
                          Started{" "}
                          {new Date(plant.date_started).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
