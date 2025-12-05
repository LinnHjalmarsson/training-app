import { useEffect, useState } from "react";
import "./App.css";

/* -----------------------------------------
   WEEK PLAN DATA (12 WEEKS)
----------------------------------------- */

const weekPlans = [
  {
    name: "Week 1",
    workouts: {
      Monday: "Sweet Spot 3×10min @ 90% FTP",
      Tuesday: "Z2 Endurance 60min",
      Wednesday: "Rest",
      Thursday: "Strength Climb 3×10min @ 85% FTP 55–65rpm",
      Friday: "Recovery Z1/Z2 45–60min",
      Saturday: "Long Ride 120+min",
      Sunday: "Long Ride 120+min",
    },
  },
  // Du kannst hier Weeks 2–12 nach gleichem Muster einfügen
];

type Day = keyof typeof weekPlans[0]["workouts"];

interface DayLog {
  duration: number;
  rpe: number;
  comment: string;
}

type LogsState = Record<number, Partial<Record<Day, DayLog>>>;

/* -----------------------------------------
   OURA DATA TYPES
----------------------------------------- */

interface OuraDaySummary {
  day: string;
  score: number;
  resting_heart_rate: number;
}

interface OuraState {
  loading: boolean;
  error: string | null;
  days: OuraDaySummary[];
}

/* -----------------------------------------
   STORAGE KEYS
----------------------------------------- */

const STORAGE_KEY = "training_logs_12week";

/* -----------------------------------------
   MAIN APP COMPONENT
----------------------------------------- */

export default function App() {
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<Day>("Monday");
  const [logs, setLogs] = useState<LogsState>({});
  const [formDuration, setFormDuration] = useState("");
  const [formRpe, setFormRpe] = useState("");
  const [formComment, setFormComment] = useState("");

  const [oura, setOura] = useState<OuraState>({
    loading: true,
    error: null,
    days: [],
  });

  const weekPlan = weekPlans[selectedWeek].workouts;

  /* -----------------------------------------
     LOAD & SAVE LOGS (localStorage)
  ----------------------------------------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLogs(JSON.parse(raw));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  /* -----------------------------------------
     FORM SYNC WHEN DAY CHANGES
  ----------------------------------------- */

  const currentLog = logs[selectedWeek]?.[selectedDay] || null;

  useEffect(() => {
    if (currentLog) {
      setFormDuration(String(currentLog.duration));
      setFormRpe(String(currentLog.rpe));
      setFormComment(currentLog.comment);
    } else {
      setFormDuration("");
      setFormRpe("");
      setFormComment("");
    }
  }, [selectedDay, currentLog]);

  /* -----------------------------------------
     HANDLE SUBMIT
  ----------------------------------------- */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDay) return;

    const updated: DayLog = {
      duration: Number(formDuration),
      rpe: Number(formRpe),
      comment: formComment.trim(),
    };

    setLogs((prev) => ({
      ...prev,
      [selectedWeek]: {
        ...(prev[selectedWeek] || {}),
        [selectedDay]: updated,
      },
    }));
  }

  /* -----------------------------------------
     OURA FETCH (Serverless API)
  ----------------------------------------- */

  useEffect(() => {
    async function loadOura() {
      try {
        const res = await fetch("/api/oura-readiness");
        const json = await res.json();
        setOura({ loading: false, error: null, days: json.data || [] });
      } catch (e: any) {
        setOura({
          loading: false,
          error: e.message,
          days: [],
        });
      }
    }
    loadOura();
  }, []);

  const latestOura = oura.days.length
    ? oura.days[oura.days.length - 1]
    : null;

  const avgReadiness =
    oura.days.length > 0
      ? Math.round(
          oura.days.reduce((s, d) => s + d.score, 0) / oura.days.length
        )
      : null;

  /* -----------------------------------------
     WEEK STATS
  ----------------------------------------- */

  const selectedWeekLogs = logs[selectedWeek] || {};
  const completedDays = Object.keys(selectedWeekLogs) as Day[];
  const totalMinutes = completedDays.reduce(
    (sum, day) => sum + (selectedWeekLogs[day]?.duration || 0),
    0
  );

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */

  return (
    <div className="app-wrapper">
      <header className="top-header">
        <h1>Training Plan – 12 Weeks</h1>
      </header>

      <main className="app-main">
        {/* Week/Phase selector */}
        <section className="week-selector card">
          <h2>{weekPlans[selectedWeek].name}</h2>
          <div className="week-select-grid">
            {weekPlans.map((w, i) => (
              <button
                key={i}
                className={`week-btn ${
                  selectedWeek === i ? "selected" : ""
                }`}
                onClick={() => setSelectedWeek(i)}
              >
                {w.name}
              </button>
            ))}
          </div>

          <div className="week-summary">
            <span>
              Logged: <strong>{completedDays.length}</strong> / 7
            </span>
            <span>
              Minutes: <strong>{totalMinutes}</strong>
            </span>
          </div>
        </section>

        {/* Oura Recovery */}
        <section className="card recovery-card">
          <h2>Recovery (Oura)</h2>

          {oura.loading && <p>Loading…</p>}
          {oura.error && <p>Error: {oura.error}</p>}

          {!oura.loading && !oura.error && latestOura && (
            <>
              <p>Today readiness: <strong>{latestOura.score}</strong></p>
              <p>RHR: <strong>{latestOura.resting_heart_rate} bpm</strong></p>
              {avgReadiness !== null && (
                <p>7-day avg: <strong>{avgReadiness}</strong></p>
              )}
            </>
          )}
        </section>

        {/* Week Plan */}
        <section className="card week-plan">
          <div className="week-grid">
            {(Object.keys(weekPlan) as Day[]).map((day) => {
              const hasLog = Boolean(selectedWeekLogs[day]);
              return (
                <button
                  key={day}
                  className={`day-btn ${
                    selectedDay === day ? "selected" : ""
                  } ${hasLog ? "logged" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                  {hasLog && <span>✔</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Daily Detail + Log Form */}
        <section className="card detail-card">
          <h3>{selectedDay}</h3>
          <p><strong>Planned:</strong> {weekPlan[selectedDay]}</p>

          {currentLog && (
            <p>
              Logged: {currentLog.duration}min – RPE {currentLog.rpe}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              Duration (min)
              <input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                required
              />
            </label>

            <label>
              RPE
              <input
                type="number"
                min={1}
                max={10}
                value={formRpe}
                onChange={(e) => setFormRpe(e.target.value)}
                required
              />
            </label>

            <label>
              Comment
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
              />
            </label>

            <button type="submit" className="save-btn">
              Save Log
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
