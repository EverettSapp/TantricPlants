"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Plot = {
  id: number;
  name: string;
  plot_type: "seeding_tray" | "raised_bed" | "in_ground";
  tray_rows: number | null;
  tray_cols: number | null;
  length_ft: number | null;
  width_ft: number | null;
  height_in: number | null;
  soil_type: string | null;
  sun_exposure: string | null;
  irrigation: number;
  irrigation_type: string | null;
  notes: string | null;
};

type Cell = {
  row_idx: number;
  col_idx: number;
  plant_id: number | null;
  plant_name: string | null;
  plant_type: string | null;
  label: string | null;
};

type Plant = { id: number; name: string; type: string; variety: string | null };

const SUN_LABELS: Record<string, string> = {
  full_sun: "☀️ Full Sun",
  part_sun: "🌤️ Part Sun",
  part_shade: "⛅ Part Shade",
  full_shade: "🌥️ Full Shade",
};

const SOIL_LABELS: Record<string, string> = {
  native: "Native soil",
  amended: "Amended native",
  mix: "Garden mix",
  potting: "Potting mix",
};

// Distinct pastel colors for up to 12 different plants
const CELL_COLORS = [
  "bg-lime-200 border-lime-400 text-lime-900",
  "bg-sky-200 border-sky-400 text-sky-900",
  "bg-amber-200 border-amber-400 text-amber-900",
  "bg-pink-200 border-pink-400 text-pink-900",
  "bg-violet-200 border-violet-400 text-violet-900",
  "bg-teal-200 border-teal-400 text-teal-900",
  "bg-orange-200 border-orange-400 text-orange-900",
  "bg-cyan-200 border-cyan-400 text-cyan-900",
  "bg-rose-200 border-rose-400 text-rose-900",
  "bg-indigo-200 border-indigo-400 text-indigo-900",
  "bg-emerald-200 border-emerald-400 text-emerald-900",
  "bg-yellow-200 border-yellow-400 text-yellow-900",
];

export default function PlotPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [plot, setPlot] = useState<Plot | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [plotRes, plantsRes] = await Promise.all([
      fetch(`/api/plots/${id}`),
      fetch("/api/plants?category=garden"),
    ]);
    if (plotRes.ok) {
      const data = await plotRes.json();
      setPlot(data.plot);
      setCells(data.cells);
    }
    if (plantsRes.ok) setPlants(await plantsRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function getCell(row: number, col: number): Cell | undefined {
    return cells.find((c) => c.row_idx === row && c.col_idx === col);
  }

  // Build a stable color map: plant_id → color index
  const colorMap: Record<number, number> = {};
  let colorIdx = 0;
  cells.forEach((c) => {
    if (c.plant_id && !(c.plant_id in colorMap)) {
      colorMap[c.plant_id] = colorIdx++ % CELL_COLORS.length;
    }
  });

  async function assignCell(plant_id: number | null, label: string | null) {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/plots/${id}/cells`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row_idx: selected.row, col_idx: selected.col, plant_id, label }),
    });
    await load();
    setSaving(false);
    setSelected(null);
  }

  async function handleDelete() {
    if (!confirm("Delete this plot?")) return;
    await fetch(`/api/plots/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) return <div className="text-stone-700 text-sm">Loading...</div>;
  if (!plot) return <div>Plot not found. <Link href="/" className="underline">Go back</Link></div>;

  const isTray = plot.plot_type === "seeding_tray";
  const rows = isTray ? (plot.tray_rows ?? 6) : Math.ceil(plot.length_ft ?? 4);
  const cols = isTray ? (plot.tray_cols ?? 12) : Math.ceil(plot.width_ft ?? 4);
  const totalCells = rows * cols;
  const filledCells = cells.length;

  // Legend: unique plants in this plot
  const legend = Object.entries(colorMap).map(([pid, cidx]) => {
    const cell = cells.find((c) => c.plant_id === Number(pid));
    return { plant_id: Number(pid), name: cell?.plant_name ?? "Unknown", colorIdx: cidx };
  });

  return (
    <div>
      <div className="mb-5">
        <Link href="/" className="text-sm text-stone-700 hover:text-stone-800 transition-colors">← Garden</Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{plot.name}</h1>
            <p className="text-sm text-stone-700 mt-0.5">
              {plot.plot_type === "seeding_tray" && `Seeding tray · ${totalCells} cells · ${filledCells} planted`}
              {plot.plot_type === "raised_bed" && `Raised bed${plot.height_in ? ` · ${plot.height_in}"` : ""} · ${plot.length_ft ?? "?"}×${plot.width_ft ?? "?"} ft`}
              {plot.plot_type === "in_ground" && `In-ground · ${plot.length_ft ?? "?"}×${plot.width_ft ?? "?"} ft`}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="text-sm px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Bed details */}
      {!isTray && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5 flex flex-wrap gap-4 text-sm">
          {plot.sun_exposure && <div><span className="text-stone-700">Sun </span><span className="font-medium">{SUN_LABELS[plot.sun_exposure] ?? plot.sun_exposure}</span></div>}
          {plot.soil_type && <div><span className="text-stone-700">Soil </span><span className="font-medium">{SOIL_LABELS[plot.soil_type] ?? plot.soil_type}</span></div>}
          {plot.irrigation ? <div><span className="text-stone-700">Irrigation </span><span className="font-medium capitalize">{plot.irrigation_type ?? "yes"}</span></div> : null}
          {plot.notes && <div className="w-full text-stone-700">{plot.notes}</div>}
        </div>
      )}

      {/* Grid */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5 overflow-x-auto">
        <p className="text-xs text-stone-700 mb-3">Click a cell to assign a plant</p>
        <div
          className="grid gap-1 w-fit"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
              const cell = getCell(r, c);
              const isSelected = selected?.row === r && selected?.col === c;
              const colorClass = cell?.plant_id != null
                ? CELL_COLORS[colorMap[cell.plant_id] ?? 0]
                : "bg-stone-100 border-stone-200 text-stone-700";

              const cellLabel = cell?.plant_name
                ? cell.plant_name.length > 6 ? cell.plant_name.slice(0, 5) + "…" : cell.plant_name
                : cell?.label ?? "";

              const cellSize = isTray ? "w-8 h-8 text-[9px]" : "w-10 h-10 text-[10px]";

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => setSelected(isSelected ? null : { row: r, col: c })}
                  title={cell?.plant_name ?? cell?.label ?? `Row ${r + 1}, Col ${c + 1}`}
                  className={`${cellSize} border-2 rounded flex items-center justify-center font-medium transition-all leading-tight text-center
                    ${colorClass}
                    ${isSelected ? "ring-2 ring-green-500 ring-offset-1 scale-110 z-10 relative" : "hover:opacity-80"}`}
                >
                  {cellLabel}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Cell assignment panel */}
      {selected && (
        <div className="bg-white border border-green-300 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-stone-700">
              {isTray ? `Row ${selected.row + 1}, Cell ${selected.col + 1}` : `Square (${selected.row + 1}, ${selected.col + 1})`}
            </p>
            <button onClick={() => setSelected(null)} className="text-stone-700 hover:text-stone-800 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {plants.map((p) => (
              <button
                key={p.id}
                onClick={() => assignCell(p.id, null)}
                disabled={saving}
                className="text-left px-2.5 py-2 rounded-lg border border-stone-200 text-xs hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-50"
              >
                <div className="font-medium truncate">{p.name}</div>
                {p.variety && <div className="text-stone-700 truncate">{p.variety}</div>}
              </button>
            ))}
          </div>

          {getCell(selected.row, selected.col) && (
            <button
              onClick={() => assignCell(null, null)}
              disabled={saving}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear cell
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      {legend.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">Legend</h2>
          <div className="flex flex-wrap gap-2">
            {legend.map((l) => (
              <div key={l.plant_id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${CELL_COLORS[l.colorIdx]}`}>
                {l.name}
                <span className="text-stone-700 font-normal">
                  ×{cells.filter((c) => c.plant_id === l.plant_id).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
