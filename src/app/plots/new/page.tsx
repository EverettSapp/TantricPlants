"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PlotType = "seeding_tray" | "raised_bed" | "in_ground";

const TRAY_PRESETS = [
  { label: "50-cell", rows: 5, cols: 10 },
  { label: "72-cell", rows: 6, cols: 12 },
  { label: "128-cell", rows: 8, cols: 16 },
  { label: "200-cell", rows: 10, cols: 20 },
  { label: "Custom", rows: 0, cols: 0 },
];

const SUN_OPTIONS = [
  { value: "full_sun", label: "☀️ Full Sun", desc: "6+ hrs direct sun" },
  { value: "part_sun", label: "🌤️ Part Sun", desc: "4–6 hrs direct sun" },
  { value: "part_shade", label: "⛅ Part Shade", desc: "2–4 hrs direct sun" },
  { value: "full_shade", label: "🌥️ Full Shade", desc: "< 2 hrs direct sun" },
];

const SOIL_OPTIONS = [
  { value: "native", label: "Native soil" },
  { value: "amended", label: "Amended native" },
  { value: "mix", label: "Garden mix" },
  { value: "potting", label: "Potting mix" },
];

const IRRIGATION_OPTIONS = [
  { value: "drip", label: "Drip" },
  { value: "sprinkler", label: "Sprinkler" },
  { value: "hand", label: "Hand water" },
];

export default function NewPlotPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [plotType, setPlotType] = useState<PlotType>("seeding_tray");
  const [trayPreset, setTrayPreset] = useState("72-cell");
  const [form, setForm] = useState({
    name: "",
    tray_rows: 6,
    tray_cols: 12,
    length_ft: "",
    width_ft: "",
    height_in: "",
    soil_type: "",
    sun_exposure: "",
    irrigation: false,
    irrigation_type: "",
    notes: "",
  });

  function set(field: string, value: string | number | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectTrayPreset(label: string) {
    setTrayPreset(label);
    const preset = TRAY_PRESETS.find((p) => p.label === label);
    if (preset && preset.rows > 0) {
      set("tray_rows", preset.rows);
      set("tray_cols", preset.cols);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      plot_type: plotType,
      ...(plotType === "seeding_tray" ? {
        tray_rows: Number(form.tray_rows),
        tray_cols: Number(form.tray_cols),
      } : {
        length_ft: form.length_ft ? Number(form.length_ft) : null,
        width_ft: form.width_ft ? Number(form.width_ft) : null,
        height_in: plotType === "raised_bed" && form.height_in ? Number(form.height_in) : null,
        soil_type: form.soil_type || null,
        sun_exposure: form.sun_exposure || null,
        irrigation: form.irrigation,
        irrigation_type: form.irrigation ? form.irrigation_type || null : null,
      }),
      notes: form.notes || null,
    };

    const res = await fetch("/api/plots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/plots/${id}`);
    } else {
      setSubmitting(false);
    }
  }

  const cellCount = form.tray_rows * form.tray_cols;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">← Garden</Link>
        <h1 className="text-2xl font-semibold mt-2">Add a plot</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plot type */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Plot type</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "seeding_tray", label: "🌱 Seeding Tray", desc: "Hardware store tray" },
              { value: "raised_bed", label: "🪵 Raised Bed", desc: "Elevated bed" },
              { value: "in_ground", label: "🌍 In Ground", desc: "Ground-level plot" },
            ] as { value: PlotType; label: string; desc: string }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlotType(opt.value)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  plotType === opt.value
                    ? "border-green-500 bg-green-50 text-green-900"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-stone-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={
              plotType === "seeding_tray" ? "e.g. Spring tray #1" :
              plotType === "raised_bed" ? "e.g. Back yard raised bed" :
              "e.g. Veg garden south"
            }
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        {/* Seeding tray options */}
        {plotType === "seeding_tray" && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Tray size</label>
              <div className="flex flex-wrap gap-2">
                {TRAY_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => selectTrayPreset(p.label)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      trayPreset === p.label
                        ? "border-green-500 bg-green-50 text-green-800"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {trayPreset === "Custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Rows</label>
                  <input
                    type="number" min={1} max={30}
                    value={form.tray_rows}
                    onChange={(e) => set("tray_rows", parseInt(e.target.value) || 1)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Columns</label>
                  <input
                    type="number" min={1} max={30}
                    value={form.tray_cols}
                    onChange={(e) => set("tray_cols", parseInt(e.target.value) || 1)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-stone-400">{cellCount} cells total</p>
          </>
        )}

        {/* Garden bed options */}
        {(plotType === "raised_bed" || plotType === "in_ground") && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Dimensions (feet)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} step={0.5}
                  value={form.length_ft}
                  onChange={(e) => set("length_ft", e.target.value)}
                  placeholder="Length"
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="text-stone-400 text-sm">×</span>
                <input
                  type="number" min={0} step={0.5}
                  value={form.width_ft}
                  onChange={(e) => set("width_ft", e.target.value)}
                  placeholder="Width"
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="text-stone-400 text-sm">ft</span>
              </div>
              {form.length_ft && form.width_ft && (
                <p className="text-xs text-stone-400 mt-1">
                  {(Number(form.length_ft) * Number(form.width_ft)).toFixed(1)} sq ft
                  {" · "}{Math.round(Number(form.length_ft) * Number(form.width_ft))} planting squares
                </p>
              )}
            </div>

            {plotType === "raised_bed" && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Bed height</label>
                <div className="flex flex-wrap gap-2">
                  {[6, 8, 12, 18, 24, 36].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => set("height_in", h)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        Number(form.height_in) === h
                          ? "border-green-500 bg-green-50 text-green-800"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {h}&quot;
                    </button>
                  ))}
                  <input
                    type="number" min={1}
                    value={form.height_in}
                    onChange={(e) => set("height_in", e.target.value)}
                    placeholder="Custom"
                    className="w-24 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Sun exposure</label>
              <div className="grid grid-cols-2 gap-2">
                {SUN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("sun_exposure", opt.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                      form.sun_exposure === opt.value
                        ? "border-green-500 bg-green-50 text-green-900"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                    }`}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-stone-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Soil</label>
              <div className="flex flex-wrap gap-2">
                {SOIL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("soil_type", opt.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      form.soil_type === opt.value
                        ? "border-green-500 bg-green-50 text-green-800"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Irrigation</label>
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => set("irrigation", !form.irrigation)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.irrigation ? "bg-green-600" : "bg-stone-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.irrigation ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <span className="text-sm text-stone-600">{form.irrigation ? "Yes" : "No irrigation"}</span>
              </div>
              {form.irrigation && (
                <div className="flex flex-wrap gap-2">
                  {IRRIGATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("irrigation_type", opt.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        form.irrigation_type === opt.value
                          ? "border-green-500 bg-green-50 text-green-800"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="Anything worth noting..."
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create plot"}
          </button>
          <Link href="/" className="px-5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
