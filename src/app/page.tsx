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

type Plot = {
  id: number;
  name: string;
  plot_type: "seeding_tray" | "raised_bed" | "in_ground";
  tray_rows: number | null;
  tray_cols: number | null;
  length_ft: number | null;
  width_ft: number | null;
  height_in: number | null;
};

const PLOT_ICONS = { seeding_tray: "🌱", raised_bed: "🪵", in_ground: "🌍" };
const PLOT_LABELS = { seeding_tray: "Seeding tray", raised_bed: "Raised bed", in_ground: "In ground" };

function PlotSection({ plots, loading }: { plots: Plot[]; loading: boolean }) {
  return (
    <div className="mt-6 pt-6 border-t border-stone-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Plots & Trays</h3>
        <Link href="/plots/new" className="text-xs text-green-700 hover:underline">+ Add plot</Link>
      </div>
      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : plots.length === 0 ? (
        <Link href="/plots/new" className="block border-2 border-dashed border-stone-200 rounded-xl p-4 text-center text-stone-400 hover:border-green-300 transition-colors">
          <p className="text-2xl mb-1">🗺️</p>
          <p className="text-xs">Plan your garden — add a tray or bed</p>
        </Link>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {plots.map((p) => (
            <Link key={p.id} href={`/plots/${p.id}`}
              className="bg-white border border-stone-200 rounded-lg px-3 py-2.5 hover:border-green-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{PLOT_ICONS[p.plot_type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-green-800">{p.name}</p>
                  <p className="text-xs text-stone-400">
                    {PLOT_LABELS[p.plot_type]}
                    {p.plot_type === "seeding_tray" && p.tray_rows && p.tray_cols &&
                      ` · ${p.tray_rows * p.tray_cols} cells`}
                    {(p.plot_type === "raised_bed" || p.plot_type === "in_ground") && p.length_ft && p.width_ft &&
                      ` · ${p.length_ft}×${p.width_ft} ft`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/plants"), fetch("/api/plots")])
      .then(async ([plantsRes, plotsRes]) => {
        if (plantsRes.ok) setPlants(await plantsRes.json());
        if (plotsRes.ok) setPlots(await plotsRes.json());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const indoor = plants.filter((p) => p.category === "indoor");
  const garden = plants.filter((p) => p.category === "garden");

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <PlantBucket title="Indoor Plants" emoji="🏠" category="indoor" plants={indoor} loading={loading} />
      <div className="hidden lg:block w-px bg-stone-200" />
      <section className="flex-1 min-w-0">
        <PlantBucket title="Garden Plants" emoji="🌱" category="garden" plants={garden} loading={loading} />
        <PlotSection plots={plots} loading={loading} />
      </section>
    </div>
  );
}
