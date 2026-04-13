"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Category = "indoor" | "garden";
type GardenType = "seedling_batch" | "nursery_start" | "propagation" | "other";

const GARDEN_TYPES: { value: GardenType; label: string; description: string }[] = [
  { value: "seedling_batch", label: "Seedling Batch", description: "Multiple seeds started together" },
  { value: "nursery_start", label: "Nursery Start", description: "Purchased from a nursery" },
  { value: "propagation", label: "Propagation", description: "Cutting, division, or offset" },
  { value: "other", label: "Other", description: "Any other garden plant" },
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
    garden_type: "seedling_batch" as GardenType,
    batch_size: 1,
    species: "",
    variety: "",
    location: "",
    date_started: "",
    notes: "",
  });

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const type = category === "indoor" ? "indoor" : form.garden_type;
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

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
          ← All plants
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Add a plant</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Category toggle */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Category</label>
          <div className="flex rounded-lg border border-stone-200 overflow-hidden">
            {(["indoor", "garden"] as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-green-700 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {cat === "indoor" ? "🏠 Indoor Plants" : "🌱 Garden Plants"}
              </button>
            ))}
          </div>
        </div>

        {/* Garden sub-type */}
        {category === "garden" && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {GARDEN_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("garden_type", opt.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    form.garden_type === opt.value
                      ? "border-green-500 bg-green-50 text-green-900"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

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
              category === "indoor"
                ? "e.g. Monstera, Snake Plant"
                : form.garden_type === "seedling_batch"
                ? "e.g. Tomatoes — Roma"
                : "e.g. Lavender"
            }
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        {/* Species + Variety */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Species</label>
            <input
              type="text"
              value={form.species}
              onChange={(e) => set("species", e.target.value)}
              placeholder="e.g. Monstera deliciosa"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Variety</label>
            <input
              type="text"
              value={form.variety}
              onChange={(e) => set("variety", e.target.value)}
              placeholder="e.g. Thai Constellation"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Batch size — seedling batches only */}
        {category === "garden" && form.garden_type === "seedling_batch" && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Number of seedlings</label>
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

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
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
          <label className="block text-sm font-medium text-stone-700 mb-1">Date started</label>
          <input
            type="date"
            value={form.date_started}
            onChange={(e) => set("date_started", e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
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
            className="px-5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
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
