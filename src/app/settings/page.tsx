"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [cityInput, setCityInput] = useState("");
  const [savedCity, setSavedCity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Record<string, string>) => {
        if (s.location_city) setSavedCity(s.location_city);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location_city: cityInput }),
    });

    if (res.ok) {
      const data = await res.json() as { city: string };
      setSavedCity(data.city);
      setCityInput("");
      setSuccess(true);
    } else {
      const data = await res.json() as { error: string };
      setError(data.error);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-stone-700 hover:text-stone-900 transition-colors">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Settings</h1>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium mb-1">Your location</h2>
        <p className="text-sm text-stone-700 mb-4">
          Used to pull current weather conditions when generating AI care schedules.
        </p>

        {savedCity && (
          <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            <span>📍</span>
            <span className="font-medium">{savedCity}</span>
            <span className="text-stone-700 ml-auto">current location</span>
          </div>
        )}

        <form onSubmit={save} className="flex gap-2">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder={savedCity ? "Update location..." : "e.g. Austin, TX or London"}
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            disabled={saving || !cityInput.trim()}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : savedCity ? "Update" : "Save"}
          </button>
        </form>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        {success && <p className="text-sm text-green-700 mt-2">Location saved — weather will be included in future care schedules.</p>}
      </div>
    </div>
  );
}
