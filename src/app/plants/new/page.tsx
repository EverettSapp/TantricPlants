"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PlantType = "seedling_batch" | "nursery_start" | "propagation" | "indoor";

const TYPE_OPTIONS: { value: PlantType; label: string; description: string }[] = [
  { value: "seedling_batch", label: "Seedling Batch", description: "Multiple seeds started together" },
  { value: "nursery_start", label: "Nursery Start", description: "Purchased from a nursery" },
  { value: "propagation", label: "Propagation", description: "Cutting, division, or offset" },
  { value: "indoor", label: "Indoor Plant", description: "Houseplant or container plant" },
];

export default function NewPlantPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "seedling_batch" as PlantType,
    species: "",
    variety: "",
    batch_size: 1,
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

    const payload = {
      ...form,
      species: form.species || null,
      variety: form.variety || null,
      location: form.location || null,
      date_started: form.date_started || null,
      notes: form.notes || null,
      batch_size: form.type === "seedling_batch" ? Number(form.batch_size) : 1,
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
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("type", opt.value)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  form.type === opt.value
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
            placeholder={form.type === "seedling_batch" ? "e.g. Tomatoes - Roma" : "e.g. Monstera deliciosa"}
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
              placeholder="e.g. Solanum lycopersicum"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Variety</label>
            <input
              type="text"
              value={form.variety}
              onChange={(e) => set("variety", e.target.value)}
              placeholder="e.g. Roma VF"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Batch size — only for seedling batches */}
        {form.type === "seedling_batch" && (
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
            placeholder="e.g. South window, Greenhouse, Back garden"
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
