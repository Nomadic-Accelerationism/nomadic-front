"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Lightweight tester feedback surface for Lisbon / World bounty testing.
 * Does not invent results — local notes only unless a future backend endpoint exists.
 */
export default function LisbonFeedbackPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    completionMinutes: "",
    hesitatedWhere: "",
    understoodAge: "",
    understoodData: "",
    feltDistinct: "",
    wouldContinue: "",
    notes: "",
  });

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function onSaveLocal(event: React.FormEvent) {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        "nomadic.lisbon.testerFeedback",
        JSON.stringify(payload),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 text-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        Testing only
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Lisbon World feedback</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Optional notes for bounty / user testing. Not shown to normal applicants.
        Values stay in this browser unless you copy them out.
      </p>

      <form onSubmit={onSaveLocal} className="mt-6 space-y-4">
        <label className="block text-sm">
          Completion time (minutes)
          <input
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            value={form.completionMinutes}
            onChange={(e) => update("completionMinutes", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Where did you hesitate?
          <textarea
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            rows={3}
            value={form.hesitatedWhere}
            onChange={(e) => update("hesitatedWhere", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Understood the 18+ requirement?
          <select
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            value={form.understoodAge}
            onChange={(e) => update("understoodAge", e.target.value)}
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="partial">Partially</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="block text-sm">
          Understood what data Nomadic received?
          <select
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            value={form.understoodData}
            onChange={(e) => update("understoodData", e.target.value)}
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="partial">Partially</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="block text-sm">
          Identity Check and Selfie Check felt distinct?
          <select
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            value={form.feltDistinct}
            onChange={(e) => update("feltDistinct", e.target.value)}
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="partial">Partially</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="block text-sm">
          Would continue in a real application?
          <select
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            value={form.wouldContinue}
            onChange={(e) => update("wouldContinue", e.target.value)}
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="block text-sm">
          Open notes
          <textarea
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            rows={4}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="w-full bg-zinc-900 px-4 py-3 text-sm text-white"
        >
          Save locally
        </button>
        {saved ? (
          <p className="text-sm text-emerald-700">Saved in this browser.</p>
        ) : null}
      </form>

      <p className="mt-8 text-sm">
        <Link className="underline" href="/journeys/lisbon-house/apply">
          Back to apply
        </Link>
      </p>
    </main>
  );
}
