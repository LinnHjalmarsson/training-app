import { useEffect, useState } from "react";
import "./App.css";

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

interface DayPlan {
  title: string;
  details: string;
}

interface WeekPlan {
  number: number;
  phase: string;
  focus: string;
  workouts: Record<Day, DayPlan>;
}

interface DayLog {
  duration: number;
  rpe: number;
  comment: string;
}

type LogsState = Record<string, DayLog>; // key = `${week}-${day}`

const STORAGE_KEY = "training_logs_12weeks";

// ----- 12 Wochen Plan (vereinfachte Version, anpassbar von dir) -----

const WEEKS: WeekPlan[] = [
  // Phase 1 – Base / Sweet Spot (Wochen 1–4)
  {
    number: 1,
    phase: "Base 1",
    focus: "Sweet Spot & Endurance",
    workouts: {
      Monday:   { title: "Sweet Spot 3×10min", details: "3×10min @ 90% FTP · 10min WU/CD" },
      Tuesday:  { title: "Z2 Endurance 60min", details: "Durchgehend @ ~70% FTP" },
      Wednesday:{ title: "Rest / optional easy spin", details: "Komplette Pause oder 30–45min sehr locker" },
      Thursday: { title: "Strength Climb 3×10", details: "3×10min @ 85% FTP · 55–65rpm" },
      Friday:   { title: "Recovery 45–60min", details: "Z1/Z2 · 55–65% FTP" },
      Saturday: { title: "Long Ride 120+min", details: "2–3h @ ~70% FTP, möglichst outdoor" },
      Sunday:   { title: "Optional Long Ride", details: "2h locker oder komplett frei – je nach Ermüdung" },
    },
  },
  {
    number: 2,
    phase: "Base 1",
    focus: "Sweet Spot Progression",
    workouts: {
      Monday:   { title: "Sweet Spot 2×20min", details: "2×20min @ 88–92% FTP" },
      Tuesday:  { title: "Z2 Endurance 60–75min", details: "Ruhig, gleichmäßig" },
      Wednesday:{ title: "Rest", details: "Schlaf & Ernährung im Fokus" },
      Thursday: { title: "Strength Climb 3×12", details: "3×12min @ 85% FTP, 55–65rpm" },
      Friday:   { title: "Recovery 45–60min", details: "Z1/Z2, sehr entspannt" },
      Saturday: { title: "Long Ride 150min", details: "2,5h @ Z2, evtl. 10min Sweet Spot am Ende" },
      Sunday:   { title: "Endurance 90min", details: "Lockere GA2-Ausfahrt" },
    },
  },
  {
    number: 3,
    phase: "Base 1",
    focus: "Fatigue Resistance",
    workouts: {
      Monday:   { title: "Sweet Spot 3×12min", details: "3×12min @ 88–92% FTP" },
      Tuesday:  { title: "Endurance 75min", details: "Konstant @ 65–75% FTP" },
      Wednesday:{ title: "Rest", details: "Optional 30min legs-only" },
      Thursday: { title: "Strength Climb 3×15", details: "3×15min @ 80–85% FTP" },
      Friday:   { title: "Recovery 45–60min", details: "Easy spin, hohe Kadenz" },
      Saturday: { title: "Long Ride 3h", details: "GA2, ruhig essen/trinken üben" },
      Sunday:   { title: "Optional Tempo 60min", details: "60min @ 80–85% FTP oder Ruhetag" },
    },
  },
  {
    number: 4,
    phase: "Base 1",
    focus: "Sweet Spot / Threshold Bridge",
    workouts: {
      Monday:   { title: "Sweet Spot 2×25min", details: "2×25min @ 88–92% FTP" },
      Tuesday:  { title: "Endurance 60–75min", details: "Z2" },
      Wednesday:{ title: "Rest", details: "Aktive Erholung off-bike möglich" },
      Thursday: { title: "Strength Climb 3×15", details: "3×15min @ 85% FTP" },
      Friday:   { title: "Recovery 45min", details: "Sehr locker" },
      Saturday: { title: "Long Ride 3–3,5h", details: "Z2 mit paar kurzen Rampen" },
      Sunday:   { title: "Endurance 90min", details: "Locker rollen" },
    },
  },

  // Phase 2 – Threshold & VO2 (Wochen 5–8)
  {
    number: 5,
    phase: "Build 1",
    focus: "Threshold Introduction",
    workouts: {
      Monday:   { title: "Threshold 3×8min", details: "3×8min @ 95–100% FTP" },
      Tuesday:  { title: "Endurance 60–75min", details: "Z2" },
      Wednesday:{ title: "Rest", details: "Komplette Pause" },
      Thursday: { title: "VO₂ short 6×2:30min", details: "6×2:30min @ 115–120% FTP" },
      Friday:   { title: "Recovery 45–60min", details: "Beine spülen" },
      Saturday: { title: "Long Ride 3h", details: "Z2 + 10min Z3 am Ende" },
      Sunday:   { title: "Endurance 90–120min", details: "Locker, wellig" },
    },
  },
  {
    number: 6,
    phase: "Build 1",
    focus: "Threshold Progression",
    workouts: {
      Monday:   { title: "Threshold 2×12min", details: "2×12min @ 95–100% FTP" },
      Tuesday:  { title: "Tempo 45–60min", details: "80–90% FTP" },
      Wednesday:{ title: "Rest", details: "Aktiv erholen" },
      Thursday: { title: "VO₂ 5×3min", details: "5×3min @ 115–120% FTP" },
      Friday:   { title: "Recovery 45min", details: "Z1/Z2" },
      Saturday: { title: "Long Ride 3–3,5h", details: "Z2, lockere Gruppenfahrt möglich" },
      Sunday:   { title: "Endurance 90min", details: "Kurze Anstiege einbauen" },
    },
  },
  {
    number: 7,
    phase: "Build 1",
    focus: "Sustained Climbing",
    workouts: {
      Monday:   { title: "Threshold 3×10min", details: "3×10min @ 95–100% FTP" },
      Tuesday:  { title: "Sustained Z3 50min", details: "50min @ 80–90% FTP" },
      Wednesday:{ title: "Rest", details: "Ruhetag" },
      Thursday: { title: "VO₂ 4×4min", details: "4×4min @ 115–120% FTP" },
      Friday:   { title: "Recovery 45–60min", details: "Sehr locker" },
      Saturday: { title: "Long Ride 3,5h", details: "Mit 2×15min Z3 in der Mitte" },
      Sunday:   { title: "Endurance 90–120min", details: "Z2" },
    },
  },
  {
    number: 8,
    phase: "Build 1",
    focus: "Threshold Peak",
    workouts: {
      Monday:   { title: "Threshold 2×15min", details: "2×15min @ 95–100% FTP" },
      Tuesday:  { title: "Tempo 60min", details: "85–90% FTP" },
      Wednesday:{ title: "Rest", details: "Off" },
      Thursday: { title: "VO₂ 6×3min", details: "6×3min @ 115–120% FTP" },
      Friday:   { title: "Recovery 45min", details: "Spin, max Z1/Z2" },
      Saturday: { title: "Long Ride 3–4h", details: "Z2, letzte 20min Z3 möglich" },
      Sunday:   { title: "Endurance 90min", details: "Lockere Ausfahrt" },
    },
  },

  // Phase 3 – Race Specific (Wochen 9–12)
  {
    number: 9,
    phase: "Race Prep",
    focus: "Over/Unders Intro",
    workouts: {
      Monday:   { title: "Over/Unders 3×8min", details: "1min 105–110% / 1min 85–90%" },
      Tuesday:  { title: "Endurance 60–75min", details: "Z2" },
      Wednesday:{ title: "Rest", details: "Ruhetag" },
      Thursday: { title: "VO₂ 5×3min", details: "5×3min @ 120% FTP" },
      Friday:   { title: "Recovery 45–60min", details: "Locker" },
      Saturday: { title: "Race Sim 2,5–3h", details: "Gruppenfahrt mit Antritten 20–40s" },
      Sunday:   { title: "Endurance 90–120min", details: "Z2 flach/wellig" },
    },
  },
  {
    number: 10,
    phase: "Race Prep",
    focus: "Race Efforts & Climbing",
    workouts: {
      Monday:   { title: "Over/Unders 4×8min", details: "wie Woche 9, etwas härter" },
      Tuesday:  { title: "Climb Repeats", details: "4–6×5min @ 100–105% FTP bergauf" },
      Wednesday:{ title: "Rest", details: "Off" },
      Thursday: { title: "VO₂ 6×3min", details: "120% FTP, kurze Pausen" },
      Friday:   { title: "Recovery 45min", details: "Z1" },
      Saturday: { title: "Race Sim 3h", details: "Bergrennen simulieren, harte Abschnitte" },
      Sunday:   { title: "Endurance 90min", details: "Sehr locker" },
    },
  },
  {
    number: 11,
    phase: "Race Prep",
    focus: "Sharpening",
    workouts: {
      Monday:   { title: "Over/Unders 3×10min", details: "Längere Blöcke mit Wechseln" },
      Tuesday:  { title: "Endurance 60min", details: "Z2" },
      Wednesday:{ title: "Rest", details: "Ruhe" },
      Thursday: { title: "VO₂ 4×3min + Sprints", details: "4×3min @ 120% + 4×10s Sprints" },
      Friday:   { title: "Recovery 45min", details: "Sehr locker" },
      Saturday: { title: "Race Sim 2–3h", details: "Hard sections, wie im Zielrennen" },
      Sunday:   { title: "Endurance 60–90min", details: "Nur bewegen" },
    },
  },
  {
    number: 12,
    phase: "Race / Taper",
    focus: "Freshness",
    workouts: {
      Monday:   { title: "Short Over/Unders", details: "2×6min, moderat, nichts Neues" },
      Tuesday:  { title: "Endurance 45–60min", details: "Ganz locker" },
      Wednesday:{ title: "Rest", details: "Komplett frei" },
      Thursday: { title: "Openers", details: "3×3min Z3 + 3×30s @ Z6" },
      Friday:   { title: "Recovery 30–45min", details: "Super easy" },
      Saturday: { title: "Race / Event", details: "Go full gas 🚀" },
      Sunday:   { title: "Off / Recovery", details: "Nur rollen oder komplett frei" },
    },
  },
];

// Hilfsfunktionen
function makeLogKey(week: number, day: Day) {
  return `${week}-${day}`;
}

export default function App() {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<Day>("Monday");
  const [logs, setLogs] = useState<LogsState>({});
  const [formDuration, setFormDuration] = useState("");
  const [formRpe, setFormRpe] = useState("");
  const [formComment, setFormComment] = useState("");

  const currentWeek = WEEKS.find((w) => w.number === selectedWeek)!;
  const currentPlan = currentWeek.workouts[selectedDay];

  // Logs laden
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setLogs(JSON.parse(raw) as LogsState);
      }
    } catch (e) {
      console.error("Failed to load logs", e);
    }
  }, []);

  // Logs speichern
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save logs", e);
    }
  }, [logs]);

  const logKey = makeLogKey(selectedWeek, selectedDay);
  const currentLog = logs[logKey];

  // Formular befüllen, wenn Tag/ Woche wechselt
  useEffect(() => {
    const key = makeLogKey(selectedWeek, selectedDay);
    const existing = logs[key];
    if (existing) {
      setFormDuration(String(existing.duration));
      setFormRpe(String(existing.rpe));
      setFormComment(existing.comment);
    } else {
      setFormDuration("");
      setFormRpe("");
      setFormComment("");
    }
  }, [selectedWeek, selectedDay, logs]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duration = Number(formDuration);
    const rpe = Number(formRpe);

    if (!duration || !rpe) {
      alert("Please enter duration and RPE 😊");
      return;
    }

    setLogs((prev) => ({
      ...prev,
      [logKey]: {
        duration,
        rpe,
        comment: formComment.trim(),
      },
    }));
  }

  // Week-Stats nur für ausgewählte Woche:
  const keysForWeek = Object.keys(logs).filter((k) =>
    k.startsWith(`${selectedWeek}-`)
  );
  const completedDays = keysForWeek.length;
  const totalMinutes = keysForWeek.reduce(
    (sum, key) => sum + logs[key].duration,
    0
  );

  return (
    <div className="app-shell">
      <header className="top-header">
        <div>
          <h1>Climbing & Gran Fondo – 12 Week Plan</h1>
          <p className="top-subtitle">
            Week {currentWeek.number} • {currentWeek.phase} • {currentWeek.focus}
          </p>
        </div>
      </header>

      <main className="app-main">
        <section className="week-selector card">
          <h2>Weeks</h2>
          <div className="week-buttons">
            {WEEKS.map((w) => (
              <button
                key={w.number}
                className={`week-btn ${
                  w.number === selectedWeek ? "selected" : ""
                }`}
                onClick={() => setSelectedWeek(w.number)}
              >
                W{w.number}
              </button>
            ))}
          </div>
          <div className="week-info">
            <span className="badge">{currentWeek.phase}</span>
            <span className="week-focus">{currentWeek.focus}</span>
          </div>
          <div className="week-summary">
            <span>
              Logged days: <strong>{completedDays}</strong>/7
            </span>
            <span>
              Total minutes: <strong>{totalMinutes}</strong>
            </span>
          </div>
        </section>

        <section className="content-grid">
          <div className="card">
            <h2>Week {currentWeek.number} – Plan</h2>
            <div className="week-grid">
              {(Object.keys(currentWeek.workouts) as Day[]).map((day) => {
                const key = makeLogKey(selectedWeek, day);
                const hasLog = Boolean(logs[key]);
                return (
                  <button
                    key={day}
                    className={`day-btn ${
                      selectedDay === day ? "selected" : ""
                    } ${hasLog ? "logged" : ""}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className="day-label">{day}</span>
                    <span className="day-workout-short">
                      {currentWeek.workouts[day].title}
                    </span>
                    {hasLog && <span className="day-dot">✅</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card detail-card">
            <h2>
              Week {currentWeek.number} – {selectedDay}
            </h2>
            <p className="planned-text">
              <strong>Planned:</strong> {currentPlan.title}
              <br />
              <span className="planned-details">{currentPlan.details}</span>
            </p>

            {currentLog && (
              <div className="log-preview">
                <h3>Logged</h3>
                <p>
                  Duration: <strong>{currentLog.duration} min</strong> · RPE:{" "}
                  <strong>{currentLog.rpe}/10</strong>
                </p>
                {currentLog.comment && <p>{currentLog.comment}</p>}
              </div>
            )}

            <form className="log-form" onSubmit={handleSubmit}>
              <h3>{currentLog ? "Update log" : "Log this workout"}</h3>
              <div className="form-row">
                <label>
                  Duration (min)
                  <input
                    type="number"
                    min={0}
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    required
                  />
                </label>
                <label>
                  RPE (1–10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formRpe}
                    onChange={(e) => setFormRpe(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="comment-label">
                Comment
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="How did it feel? Any issues with HR, legs, breathing…"
                />
              </label>
              <button type="submit" className="save-btn">
                {currentLog ? "Save changes" : "Save log"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
