"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Plant = {
  id: number;
  name: string;
  category: "indoor" | "garden";
  type: string;
  species: string | null;
  variety: string | null;
  batch_size: number;
  location: string | null;
  date_started: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  seedling_batch: "seedling",
  nursery_start: "nursery",
  propagation: "prop",
  indoor: "indoor",
  other: "other",
};

function PlantCard({ plant }: { plant: Plant }) {
  return (
    <Link
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
        {plant.category === "garden" && (
          <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium bg-lime-100 text-lime-700">
            {plant.type === "seedling_batch" ? `×${plant.batch_size}` : TYPE_LABELS[plant.type] ?? plant.type}
          </span>
        )}
      </div>
      {plant.location && (
        <p className="text-xs text-stone-400 mt-2">📍 {plant.location}</p>
      )}
      {plant.date_started && (
        <p className="text-xs text-stone-400 mt-1">
          Started{" "}
          {new Date(plant.date_started).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </p>
      )}
    </Link>
  );
}

function PlantBucket({
  title,
  emoji,
  category,
  plants,
  loading,
}: {
  title: string;
  emoji: string;
  category: "indoor" | "garden";
  plants: Plant[];
  loading: boolean;
}) {
  const totalCount =
    category === "garden"
      ? plants.reduce((sum, p) => sum + (p.type === "seedling_batch" ? p.batch_size : 1), 0)
      : plants.length;

  return (
    <section className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {emoji} {title}
          </h2>
          {!loading && (
            <p className="text-xs text-stone-400 mt-0.5">
              {plants.length} {plants.length === 1 ? "entry" : "entries"}
              {category === "garden" && totalCount !== plants.length && ` · ${totalCount} plants`}
            </p>
          )}
        </div>
        <Link
          href={`/plants/new?category=${category}`}
          className="text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
        >
          + Add
        </Link>
      </div>

      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : plants.length === 0 ? (
        <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center text-stone-400">
          <p className="text-3xl mb-2">{emoji}</p>
          <p className="text-sm">No {title.toLowerCase()} yet</p>
          <Link
            href={`/plants/new?category=${category}`}
            className="text-xs text-green-700 hover:underline mt-1 inline-block"
          >
            Add one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plants.map((p) => <PlantCard key={p.id} plant={p} />)}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plants")
      .then((r) => r.json())
      .then((data) => { setPlants(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const indoor = plants.filter((p) => p.category === "indoor");
  const garden = plants.filter((p) => p.category === "garden");

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <PlantBucket title="Indoor Plants" emoji="🏠" category="indoor" plants={indoor} loading={loading} />
      <div className="hidden lg:block w-px bg-stone-200" />
      <PlantBucket title="Garden Plants" emoji="🌱" category="garden" plants={garden} loading={loading} />
    </div>
  );
}
