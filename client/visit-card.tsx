import { useState } from "react";

const OUTCOMES = [
  "Interested",
  "Needs time",
  "Not interested",
  "No show",
] as const;

export type Visit = {
  visit_id: string;
  lead_id: string;
  customer_name: string;
  phone: string;
  project: string;
  config: string;
  visit_at: string;
  outcome: string;
  next_action: string;
};
const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value.replace(" ", "T")));



export function VisitCard({ visit, onSaved }: { visit: Visit; onSaved: () => void }) {
  const [outcome, setOutcome] = useState(visit.outcome);
  const [nextAction, setNextAction] = useState(visit.next_action);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!outcome) {
      setError("Select an outcome before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/visits/${encodeURIComponent(visit.visit_id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outcome, next_action: nextAction.trim() }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Could not save this update.");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this update.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="visit-card">
      <div className="time-block">
        <div className="visit-time">{formatTime(visit.visit_at)}</div>
        <div className="visit-id">{visit.visit_id}</div>
      </div>
      <div className="customer-block">
        <h3 className="customer-name">{visit.customer_name}</h3>
        <div className="customer-meta">
          {visit.lead_id} · <span className="phone">{visit.phone}</span>
        </div>
        <div className="project-line">
          {visit.project} <span>·</span> {visit.config}
        </div>
      </div>
      <div className="editor">
        <div className="editor-row">
          <select
            className="outcome-select"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            aria-label={`Outcome for ${visit.customer_name}`}
          >
            <option value="">Select outcome</option>
            {OUTCOMES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input
            className="action-input"
            maxLength={240}
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            aria-label={`Next action for ${visit.customer_name}`}
            placeholder="Next action"
          />
        </div>
        <div className="editor-bottom">
          <span className={`status-chip ${outcome ? "saved" : ""}`}>
            {outcome || "Outcome pending"}
          </span>
          <button
            className="save-button"
            type="button"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving…" : "Save update →"}
          </button>
        </div>
        {error && <div className="inline-error">{error}</div>}
      </div>
    </article>
  );
}