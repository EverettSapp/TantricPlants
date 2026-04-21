"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Category = "indoor" | "garden";
type PlantType = "seedling_batch" | "nursery_start" | "propagation" | "seed" | "indoor" | "other";

const GARDEN_TYPES: { value: PlantType; label: string; description: string }[] = [
  { value: "seedling_batch", label: "Seedling Batch", description: "Multiple seeds started together" },
  { value: "nursery_start", label: "Nursery Start", description: "Purchased from a nursery" },
  { value: "propagation", label: "Propagation", description: "Cutting, division, or offset" },
  { value: "other", label: "Other", description: "Any other garden plant" },
];

const INDOOR_TYPES: { value: PlantType; label: string; description: string }[] = [
  { value: "indoor", label: "Houseplant", description: "Established indoor plant" },
  { value: "propagation", label: "Propagation", description: "Cutting, division, or offset" },
  { value: "seed", label: "Seed Start", description: "Started from seed indoors" },
];

const POT_TYPES = [
  { value: "terracotta", label: "Terracotta" },
  { value: "plastic", label: "Plastic / nursery pot" },
  { value: "ceramic_glazed", label: "Ceramic / glazed" },
  { value: "fabric", label: "Fabric / grow bag" },
  { value: "self_watering", label: "Self-watering" },
  { value: "hanging_basket", label: "Hanging basket" },
  { value: "wooden", label: "Wooden planter" },
  { value: "other", label: "Other (type below)" },
];

const SOIL_TYPES = [
  { value: "all_purpose", label: "All-purpose potting mix" },
  { value: "cactus_mix", label: "Cactus & succulent mix" },
  { value: "orchid_bark", label: "Orchid bark mix" },
  { value: "seed_starting", label: "Seed starting mix" },
  { value: "peat_based", label: "Peat-based mix" },
  { value: "perlite_heavy", label: "Perlite-heavy mix" },
  { value: "garden_soil", label: "Garden soil" },
  { value: "other", label: "Other (type below)" },
];

function NewPlantForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as Category) ?? "garden";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [form, setForm] = useState({
    name: "",
    garden_type: "seedling_batch" as PlantType,
    indoor_type: "indoor" as PlantType,
    batch_size: 1,
    species: "",
    variety: "",
    location: "",
    date_started: "",
    notes: "",
    pot_type: "",
    custom_pot: "",
    in_decorative_pot: false,
    inner_pot: "",
    soil_type: "",
    custom_soil: "",
  });

  function set(field: string, value: string | number | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const type = category === "indoor" ? form.indoor_type : form.garden_type;
    const potType = form.pot_type === "other" ? form.custom_pot : form.pot_type;
    const innerPot = form.in_decorative_pot ? form.inner_pot : null;
    const soilType = form.soil_type === "other" ? form.custom_soil : form.soil_type;

    const payload = {
      name: form.name,
      category,
      type,
      species: form.species || null,
      variety: form.variety || null,
      location: form.location || null,
      date_started: form.date_started || null,
      notes: form.notes || null,
      batch_size: type === "seedling_batch" ? Number(form.batch_size) : 1,
      pot_type: potType || null,
      inner_pot: innerPot || null,
      in_decorative_pot: form.in_decorative_pot,
      soil_type: soilType || null,
    };

    const res = await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/plants/${id}`);
    } else {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const showPotFields = category === "indoor" || form.garden_type !== "seedling_batch";

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-stone-700 hover:text-stone-900 transition-colors">
          ← All plants
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Add a plant</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Category toggle */}
        <div>
          <label className="block text-sm font-medium text-stone-900 mb-2">Category</label>
          <div className="flex rounded-lg border border-stone-200 overflow-hidden">
            {(["indoor", "garden"] as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-green-700 text-white"
                    : "bg-white text-stone-800 hover:bg-stone-50"
                }`}
              >
                {cat === "indoor" ? "🏠 Indoor Plants" : "🌱 Garden Plants"}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-type */}
        <div>
          <label className="block text-sm font-medium text-stone-900 mb-2">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(category === "garden" ? GARDEN_TYPES : INDOOR_TYPES).map((opt) => {
              const active = category === "garden" ? form.garden_type === opt.value : form.indoor_type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set(category === "garden" ? "garden_type" : "indoor_type", opt.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    active
                      ? "border-green-500 bg-green-50 text-green-900"
                      : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-stone-700 mt-0.5">{opt.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-stone-900 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={
              category === "indoor"
                ? form.indoor_type === "seed" ? "e.g. Chilli seeds, Lemon tree" : form.indoor_type === "propagation" ? "e.g. Pothos cutting" : "e.g. Monstera, Snake Plant"
                : form.garden_type === "seedling_batch" ? "e.g. Tomatoes — Roma" : "e.g. Lavender"
            }
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        {/* Species + Variety */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-1">Species</label>
            <input
              type="text"
              value={form.species}
              onChange={(e) => set("species", e.target.value)}
              placeholder="e.g. Monstera deliciosa"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-1">Variety</label>
            <input
              type="text"
              value={form.variety}
              onChange={(e) => set("variety", e.target.value)}
              placeholder="e.g. Thai Constellation"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Batch size */}
        {form.garden_type === "seedling_batch" && category === "garden" && (
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-1">Number of seedlings</label>
            <input
              type="number"
              min={1}
              max={9999}
              value={form.batch_size}
              onChange={(e) => set("batch_size", parseInt(e.target.value) || 1)}
              className="w-32 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
        )}

        {/* Pot type */}
        {showPotFields && (
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-2">Pot type</label>
            <div className="grid grid-cols-2 gap-2">
              {POT_TYPES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set("pot_type", p.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                    form.pot_type === p.value
                      ? "border-green-500 bg-green-50 text-green-900 font-medium"
                      : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {form.pot_type === "other" && (
              <input
                type="text"
                value={form.custom_pot}
                onChange={(e) => set("custom_pot", e.target.value)}
                placeholder="Describe your pot..."
                className="mt-2 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            )}

            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.in_decorative_pot}
                onChange={(e) => set("in_decorative_pot", e.target.checked)}
                className="rounded border-stone-300 text-green-600 focus:ring-green-400"
              />
              <span className="text-sm text-stone-900">Inside a decorative / cover pot</span>
            </label>

            {form.in_decorative_pot && (
              <div className="mt-3 pl-4 border-l-2 border-stone-200">
                <label className="block text-xs font-medium text-stone-700 mb-2">Inner (functional) pot</label>
                <div className="grid grid-cols-2 gap-2">
                  {POT_TYPES.filter((p) => p.value !== "other").map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set("inner_pot", p.value)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                        form.inner_pot === p.value
                          ? "border-green-500 bg-green-50 text-green-900 font-medium"
                          : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Soil type */}
        <div>
          <label className="block text-sm font-medium text-stone-900 mb-2">Soil type</label>
          <div className="grid grid-cols-2 gap-2">
            {SOIL_TYPES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set("soil_type", s.value)}
                className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                  form.soil_type === s.value
                    ? "border-green-500 bg-green-50 text-green-900 font-medium"
                    : "border-stone-200 bg-white text-stone-900 hover:border-stone-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {form.soil_type === "other" && (
            <input
              type="text"
              value={form.custom_soil}
              onChange={(e) => set("custom_soil", e.target.value)}
              placeholder="Describe your soil mix..."
              className="mt-2 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-stone-900 mb-1">Spot / location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder={category === "indoor" ? "e.g. South window, Living room" : "e.g. Raised bed 2, Greenhouse"}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        {/* Date started */}
        <div>
          <label className="block text-sm font-medium text-stone-900 mb-1">Date started</label>
          <input
            type="date"
            value={form.date_started}
            onChange={(e) => set("date_started", e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-stone-900 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Anything worth remembering..."
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save plant"}
          </button>
          <Link
            href="/"
            className="px-5 py-2 rounded-lg text-sm font-medium text-stone-800 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewPlantPage() {
  return (
    <Suspense>
      <NewPlantForm />
    </Suspense>
  );
}
