"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type SpaceType = "window" | "surface" | "shelf" | "hanging";
type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
type Obstruction = "open" | "partial" | "shaded" | "overhanging";
type Humidity = "high" | "medium" | "low";

type IndoorSpace = {
  id: number;
  name: string;
  space_type: SpaceType;
  direction: Direction | null;
  obstruction: Obstruction | null;
  humidity: Humidity | null;
  near_vent: number;
  near_radiator: number;
  notes: string | null;
};

type LightProfile = {
  day_length_hours: number;
  estimated_direct_hours: number;
  light_label: string;
  sunrise: string;
  sunset: string;
};

type Plot = {
  id: number;
  name: string;
  plot_type: "seeding_tray" | "raised_bed" | "in_ground";
  length_ft: number | null;
  width_ft: number | null;
  height_in: number | null;
  tray_rows: number | null;
  tray_cols: number | null;
};

const SPACE_TYPES: { value: SpaceType; label: string; icon: string }[] = [
  { value: "window", label: "Window", icon: "🪟" },
  { value: "surface", label: "Surface / counter", icon: "🪴" },
  { value: "shelf", label: "Shelf", icon: "📚" },
  { value: "hanging", label: "Hanging area", icon: "🪝" },
];

const DIRECTIONS: Direction[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const OBSTRUCTIONS: { value: Obstruction; label: string; desc: string }[] = [
  { value: "open", label: "Open", desc: "Unobstructed sky view" },
  { value: "partial", label: "Partial", desc: "Trees, neighboring buildings" },
  { value: "shaded", label: "Shaded", desc: "Heavily blocked, little direct sky" },
  { value: "overhanging", label: "Overhang", desc: "Roof, balcony, or eave above" },
];

const HUMIDITY_OPTIONS: { value: Humidity; label: string; desc: string }[] = [
  { value: "high", label: "High", desc: "Bathroom, laundry, kitchen" },
  { value: "medium", label: "Medium", desc: "Most living spaces" },
  { value: "low", label: "Low", desc: "AC-heavy rooms, desert climate" },
];

const PLOT_ICONS = { seeding_tray: "🌱", raised_bed: "🪵", in_ground: "🌍" };
const PLOT_LABELS = { seeding_tray: "Seeding tray", raised_bed: "Raised bed", in_ground: "In ground" };

const emptyForm = {
  name: "",
  space_type: "window" as SpaceType,
  direction: "" as Direction | "",
  obstruction: "" as Obstruction | "",
  humidity: "" as Humidity | "",
  near_vent: false,
  near_radiator: false,
  notes: "",
};

export default function SetupPage() {
  const [tab, setTab] = useState<"indoor" | "garden">("indoor");
  const [spaces, setSpaces] = useState<IndoorSpace[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [lightPreview, setLightPreview] = useState<LightProfile | null>(null);
  const [lightLoading, setLightLoading] = useState(false);

  const load = useCallback(async () => {
    const [spacesRes, plotsRes] = await Promise.all([
      fetch("/api/spaces"),
      fetch("/api/plots"),
    ]);
    if (spacesRes.ok) setSpaces(await spacesRes.json());
    if (plotsRes.ok) setPlots(await plotsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setField(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "direction" || field === "obstruction") {
      setLightPreview(null);
    }
  }

  async function previewLight() {
    if (!form.direction || !form.obstruction) return;
    setLightLoading(true);
    const res = await fetch(`/api/spaces/light-profile?direction=${form.direction}&obstruction=${form.obstruction}`);
    if (res.ok) setLightPreview(await res.json());
    setLightLoading(false);
  }

  async function saveSpace(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        space_type: form.space_type,
        direction: form.direction || null,
        obstruction: form.obstruction || null,
        humidity: form.humidity || null,
        near_vent: form.near_vent,
        near_radiator: form.near_radiator,
        notes: form.notes || null,
      }),
    });
    setForm(emptyForm);
    setLightPreview(null);
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function deleteSpace(id: number) {
    if (!confirm("Remove this space?")) return;
    await fetch(`/api/spaces/${id}`, { method: "DELETE" });
    await load();
  }

  const lightColor = (label: string) => {
    if (label === "Bright direct") return "text-amber-600 bg-amber-50 border-amber-200";
    if (label === "Bright indirect") return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (label === "Medium indirect") return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-stone-700 bg-stone-100 border-stone-200";
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-stone-700 hover:text-stone-900 transition-colors">← Home</Link>
        <h1 className="text-2xl font-semibold mt-2">Physical Setup</h1>
        <p className="text-sm text-stone-700 mt-1">Define your spaces so the AI can recommend the best spot for each plant.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6">
        {(["indoor", "garden"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? "border-green-600 text-green-700" : "border-transparent text-stone-700 hover:text-stone-900"
            }`}
          >
            {t === "indoor" ? "🏠 Indoor" : "🌱 Garden"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-stone-700 text-sm">Loading...</div>
      ) : tab === "indoor" ? (
        <div>
          {/* Indoor spaces list */}
          {spaces.length > 0 && (
            <div className="space-y-3 mb-5">
              {spaces.map((s) => (
                <div key={s.id} className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                          {SPACE_TYPES.find((t) => t.value === s.space_type)?.icon} {s.space_type}
                        </span>
                        {s.direction && s.obstruction && (
                          <LightBadge direction={s.direction} obstruction={s.obstruction} />
                        )}
                      </div>
                      <div className="flex gap-3 mt-2 flex-wrap text-xs text-stone-700">
                        {s.direction && <span>↗ {s.direction}-facing</span>}
                        {s.obstruction && <span className="capitalize">{s.obstruction}</span>}
                        {s.humidity && <span className="capitalize">{s.humidity} humidity</span>}
                        {s.near_vent ? <span className="text-amber-700">Near vent</span> : null}
                        {s.near_radiator ? <span className="text-amber-700">Near radiator</span> : null}
                      </div>
                      {s.notes && <p className="text-xs text-stone-700 mt-1 italic">{s.notes}</p>}
                    </div>
                    <button
                      onClick={() => deleteSpace(s.id)}
                      className="text-xs text-stone-700 hover:text-red-600 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {spaces.length === 0 && !showForm && (
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center text-stone-700 mb-5">
              <p className="text-3xl mb-2">🪟</p>
              <p className="text-sm">No spaces defined yet.</p>
              <p className="text-xs mt-1">Add your windows and surfaces to get location recommendations.</p>
            </div>
          )}

          {/* Add space form */}
          {showForm ? (
            <form onSubmit={saveSpace} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h3 className="font-medium">Add a space</h3>

              <div>
                <label className="block text-sm font-medium text-stone-900 mb-1">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder='e.g. "Living room south window" or "Bathroom shelf"'
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {SPACE_TYPES.map((t) => (
                    <button key={t.value} type="button"
                      onClick={() => setField("space_type", t.value)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        form.space_type === t.value
                          ? "border-green-500 bg-green-50 text-green-900 font-medium"
                          : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">Direction it faces</label>
                <div className="grid grid-cols-4 gap-2">
                  {DIRECTIONS.map((d) => (
                    <button key={d} type="button"
                      onClick={() => setField("direction", d)}
                      className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.direction === d
                          ? "border-green-500 bg-green-50 text-green-900"
                          : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Obstruction */}
              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">How open is it?</label>
                <div className="grid grid-cols-2 gap-2">
                  {OBSTRUCTIONS.map((o) => (
                    <button key={o.value} type="button"
                      onClick={() => setField("obstruction", o.value)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        form.obstruction === o.value
                          ? "border-green-500 bg-green-50 text-green-900 font-medium"
                          : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                      }`}
                    >
                      <div className="font-medium">{o.label}</div>
                      <div className="text-xs text-stone-700">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Light preview */}
              {form.direction && form.obstruction && (
                <div>
                  {lightPreview ? (
                    <div className={`rounded-lg border px-4 py-3 text-sm ${lightColor(lightPreview.light_label)}`}>
                      <div className="font-semibold">{lightPreview.light_label}</div>
                      <div className="mt-1 text-xs space-y-0.5">
                        <div>~{lightPreview.estimated_direct_hours}h direct sun today · {lightPreview.day_length_hours}h daylight</div>
                        <div>Sunrise {lightPreview.sunrise} · Sunset {lightPreview.sunset}</div>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={previewLight} disabled={lightLoading}
                      className="text-sm text-green-700 hover:underline disabled:opacity-50"
                    >
                      {lightLoading ? "Calculating..." : "☀️ Preview light hours for today"}
                    </button>
                  )}
                </div>
              )}

              {/* Humidity */}
              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">Humidity level</label>
                <div className="grid grid-cols-3 gap-2">
                  {HUMIDITY_OPTIONS.map((h) => (
                    <button key={h.value} type="button"
                      onClick={() => setField("humidity", h.value)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        form.humidity === h.value
                          ? "border-green-500 bg-green-50 text-green-900 font-medium"
                          : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                      }`}
                    >
                      <div className="font-medium">{h.label}</div>
                      <div className="text-xs text-stone-700">{h.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vent / radiator */}
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.near_vent} onChange={(e) => setField("near_vent", e.target.checked)}
                    className="rounded border-stone-300 text-green-600 focus:ring-green-400" />
                  <span className="text-sm text-stone-900">Near heating/AC vent</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.near_radiator} onChange={(e) => setField("near_radiator", e.target.checked)}
                    className="rounded border-stone-300 text-green-600 focus:ring-green-400" />
                  <span className="text-sm text-stone-900">Near radiator</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-900 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setField("notes", e.target.value)}
                  placeholder='e.g. "Large oak tree outside blocks afternoon sun"'
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save space"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setLightPreview(null); setForm(emptyForm); }}
                  className="px-4 py-2 rounded-lg text-sm text-stone-800 hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl py-3 text-sm text-stone-700 hover:border-green-400 hover:text-green-700 transition-colors"
            >
              + Add a window or surface
            </button>
          )}
        </div>
      ) : (
        /* Garden tab */
        <div>
          {plots.length > 0 && (
            <div className="space-y-3 mb-5">
              {plots.map((p) => (
                <Link key={p.id} href={`/plots/${p.id}`}
                  className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-green-400 transition-colors group"
                >
                  <span className="text-2xl">{PLOT_ICONS[p.plot_type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium group-hover:text-green-800">{p.name}</p>
                    <p className="text-xs text-stone-700 mt-0.5">
                      {PLOT_LABELS[p.plot_type]}
                      {p.plot_type === "seeding_tray" && p.tray_rows && p.tray_cols && ` · ${p.tray_rows * p.tray_cols} cells`}
                      {(p.plot_type === "raised_bed" || p.plot_type === "in_ground") && p.length_ft && p.width_ft && ` · ${p.length_ft} × ${p.width_ft} ft`}
                      {p.height_in ? ` · ${p.height_in}" tall` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-stone-700 group-hover:text-green-700">View →</span>
                </Link>
              ))}
            </div>
          )}

          {plots.length === 0 && (
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center text-stone-700 mb-5">
              <p className="text-3xl mb-2">🌍</p>
              <p className="text-sm">No garden spaces yet.</p>
            </div>
          )}

          <Link href="/plots/new"
            className="flex items-center justify-center w-full border-2 border-dashed border-stone-200 rounded-xl py-3 text-sm text-stone-700 hover:border-green-400 hover:text-green-700 transition-colors"
          >
            + Add a plot or tray
          </Link>
        </div>
      )}
    </div>
  );
}

function LightBadge({ direction, obstruction }: { direction: string; obstruction: string }) {
  const label = getBadgeLabel(direction, obstruction);
  const color = label === "Bright direct"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : label === "Bright indirect"
    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
    : label === "Medium indirect"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-stone-100 text-stone-700 border-stone-200";

  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full ${color}`}>☀️ {label}</span>
  );
}

function getBadgeLabel(direction: string, obstruction: string): string {
  const southFacing = ["S", "SE", "SW"].includes(direction);
  const eastWest = ["E", "W"].includes(direction);
  const obFactor = obstruction === "open" ? 1 : obstruction === "partial" ? 0.6 : obstruction === "overhanging" ? 0.5 : 0.25;
  if (southFacing && obFactor >= 0.8) return "Bright direct";
  if ((southFacing && obFactor >= 0.5) || (eastWest && obFactor >= 0.8)) return "Bright indirect";
  if (direction === "N" || obFactor < 0.3) return "Low light";
  return "Medium indirect";
}
