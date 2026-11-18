import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Visit, VisitCard } from "./visit-card";
// @ts-expect-error -- no declaration file is needed for this side-effect import.
import "./styles.css";

const initialDate = "2026-10-06";
const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`))
    : "Selected day";

function App() {
  const [executive, setExecutive] = useState("EX-02 Farhan");
  const [date, setDate] = useState(initialDate);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadVisits() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/visits?executive=${encodeURIComponent(executive)}&date=${encodeURIComponent(date)}`,
      );
      const data = (await response.json()) as {
        visits?: Visit[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Unable to load visits.");
      setVisits(data.visits ?? []);
    } catch (loadError) {
      setVisits([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load visits.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadVisits();
  }, [executive, date]);

  const pending = visits.filter((visit) => !visit.outcome).length;
  const interested = visits.filter(
    (visit) => visit.outcome === "Interested",
  ).length;
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Urbanrise site visits home">
          <span className="brand-mark">U</span>
          <span>
            urbanrise<span className="brand-sub">SITE OPERATIONS</span>
          </span>
        </a>
      </header>
      <main>
        <section className="page-intro">
          <div>
            <p className="eyebrow">SALES · SITE OPERATIONS</p>
            <h1>Daily site visits</h1>
            <p className="intro-copy">
              Your schedule, the conversations, and what happens next.
            </p>
          </div>
          <div className="today-chip">
            <span className="calendar-icon">▦</span>
            <span>{formatDate(date)}</span>
          </div>
        </section>
        <section className="filters" aria-label="Visit filters">
          <label className="field">
            <span>Executive</span>
            <select
              value={executive}
              onChange={(event) => setExecutive(event.target.value)}
            >
              <option value="EX-01 Meenakshi">Meenakshi</option>
              <option value="EX-02 Farhan">Farhan</option>
              <option value="EX-03 Joseph">Joseph</option>
            </select>
          </label>
          <label className="field">
            <span>Visit date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button
            className="button button-dark"
            onClick={() => void loadVisits()}
          >
            View visits <span aria-hidden="true">→</span>
          </button>
        </section>
        <section className="summary-grid" aria-label="Daily summary">
          <article className="summary-card summary-total">
            <div className="summary-label">SCHEDULED VISITS</div>
            <div className="summary-value">{visits.length}</div>
            <div className="summary-foot">For selected executive</div>
          </article>
          <article className="summary-card">
            <div className="summary-label">AWAITING OUTCOME</div>
            <div className="summary-value">{pending}</div>
            <div className="summary-foot">Needs an update</div>
          </article>
          <article className="summary-card">
            <div className="summary-label">INTERESTED</div>
            <div className="summary-value">{interested}</div>
            <div className="summary-foot">Positive conversations</div>
          </article>
        </section>
        <section className="visits-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR DAY</p>
              <h2>
                Visit list <span className="count-pill">{visits.length}</span>
              </h2>
            </div>
            <span className="sort-label">Sorted by visit time ↑</span>
          </div>
          {loading ? (
            <div className="loading-state">Loading visits…</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : visits.length ? (
            <div className="visits-list">
              {visits.map((visit) => (
                <VisitCard
                  key={visit.visit_id}
                  visit={visit}
                  onSaved={() => void loadVisits()}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">⌁</div>
              <h3>No visits scheduled</h3>
              <p>
                There are no visits for this executive on the selected date.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
