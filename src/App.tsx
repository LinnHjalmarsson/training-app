import { useEffect, useState } from "react";
import "./App.css";

type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

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

interface OuraDaySummary {
  day: string;
  readiness: number | null;
  rhr: number | null;
  hrv: number | null;
}

interface OuraState {
  loading: boolean;
  error: string | null;
  days: OuraDaySummary[];
}

const STORAGE_KEY = "training_logs_12weeks";

/* ---------------------- 12-WEEK PLAN ---------------------- */

const WEEKS: WeekPlan[] = [
  // Phase 1 – Base / Sweet Spot (Weeks 1–4)
  {
    number: 1,
    phase: "Base 1",
    focus: "Sweet Spot & Endurance",
    workouts: {
      Monday: {
        title: "Sweet Spot 3×10min",
        details: "3×10min @ 90% FTP · 10min WU/CD · 85–95rpm",
      },
      Tuesday: {
        title: "Z2 Endurance 60min",
        details: "60min @ ~70% FTP · conversational pace",
      },
      Wednesday: {
        title: "Rest / optional easy spin",
        details: "Complete rest or 30–45min very easy Z1",
      },
      Thursday: {
        title: "Strength Climb 3×10min",
        details: "3×10min @ 85% FTP · 55–65rpm · seated climbing focus",
      },
      Friday: {
        title: "Recovery 45–60min",
        details: "Z1/Z2 · 55–65% FTP · keep it really easy",
      },
      Saturday: {
        title: "Long Ride 120+min",
        details: "2–3h @ ~70% FTP · fuel & drink well",
      },
      Sunday: {
        title: "Optional Long Ride / Rest",
        details: "2h easy endurance or full rest depending on fatigue",
      },
    },
  },
  {
    number: 2,
    phase: "Base 1",
    focus: "Sweet Spot Progression",
    workouts: {
      Monday: {
        title: "Sweet Spot 2×20min",
        details: "2×20min @ 88–92% FTP · steady, controlled",
      },
      Tuesday: {
        title: "Z2 Endurance 60–75min",
        details: "Flat to rolling, stay relaxed",
      },
      Wednesday: {
        title: "Rest",
        details: "Sleep & nutrition focus",
      },
      Thursday: {
        title: "Strength Climb 3×12min",
        details: "3×12min @ 85% FTP · 55–65rpm",
      },
      Friday: {
        title: "Recovery 45–60min",
        details: "Z1/Z2 · high cadence, very easy",
      },
      Saturday: {
        title: "Long Ride 150min",
        details:
          "2.5h @ Z2 · optionally 10min Sweet Spot towards the end",
      },
      Sunday: {
        title: "Endurance 90min",
        details: "Easy GA2 ride, small hills allowed",
      },
    },
  },
  {
    number: 3,
    phase: "Base 1",
    focus: "Fatigue Resistance",
    workouts: {
      Monday: {
        title: "Sweet Spot 3×12min",
        details: "3×12min @ 88–92% FTP",
      },
      Tuesday: {
        title: "Endurance 75min",
        details: "65–75% FTP · steady",
      },
      Wednesday: {
        title: "Rest",
        details: "Optional 30min legs-only spin",
      },
      Thursday: {
        title: "Strength Climb 3×15min",
        details: "3×15min @ 80–85% FTP · low cadence",
      },
      Friday: {
        title: "Recovery 45–60min",
        details: "Very easy, stay in Z1",
      },
      Saturday: {
        title: "Long Ride 3h",
        details: "Z2, practice fueling and pacing",
      },
      Sunday: {
        title: "Optional Tempo 60min",
        details: "60min @ 80–85% FTP or full rest",
      },
    },
  },
  {
    number: 4,
    phase: "Base 1",
    focus: "Sweet Spot → Threshold Bridge",
    workouts: {
      Monday: {
        title: "Sweet Spot 2×25min",
        details: "2×25min @ 88–92% FTP",
      },
      Tuesday: {
        title: "Endurance 60–75min",
        details: "Z2, relaxed",
      },
      Wednesday: {
        title: "Rest",
        details: "Off-bike recovery allowed (walk, mobility)",
      },
      Thursday: {
        title: "Strength Climb 3×15min",
        details: "3×15min @ 85% FTP · steady climbing",
      },
      Friday: {
        title: "Recovery 45min",
        details: "Very easy spin",
      },
      Saturday: {
        title: "Long Ride 3–3.5h",
        details: "Z2 with a few short ramps",
      },
      Sunday: {
        title: "Endurance 90min",
        details: "Light endurance, keep it fun",
      },
    },
  },

  // Phase 2 – Build / Threshold & VO2 (Weeks 5–8)
  {
    number: 5,
    phase: "Build 1",
    focus: "Threshold Introduction",
    workouts: {
      Monday: {
        title: "Threshold 3×8min",
        details: "3×8min @ 95–100% FTP · 4–6min recovery",
      },
      Tuesday: {
        title: "Endurance 60–75min",
        details: "Z2, smooth pedal stroke",
      },
      Wednesday: {
        title: "Rest",
        details: "Full rest",
      },
      Thursday: {
        title: "VO₂ 6×2:30min",
        details: "6×2:30min @ 115–120% FTP · 2–3min easy between",
      },
      Friday: {
        title: "Recovery 45–60min",
        details: "Legs only, keep HR low",
      },
      Saturday: {
        title: "Long Ride 3h",
        details: "Z2 + optional 10min Z3 near the end",
      },
      Sunday: {
        title: "Endurance 90–120min",
        details: "Rolling terrain, keep it comfortable",
      },
    },
  },
  {
    number: 6,
    phase: "Build 1",
    focus: "Threshold Progression",
    workouts: {
      Monday: {
        title: "Threshold 2×12min",
        details: "2×12min @ 95–100% FTP",
      },
      Tuesday: {
        title: "Tempo 45–60min",
        details: "80–90% FTP · steady pressure",
      },
      Wednesday: {
        title: "Rest",
        details: "Active recovery off the bike allowed",
      },
      Thursday: {
        title: "VO₂ 5×3min",
        details: "5×3min @ 115–120% FTP · 3min easy",
      },
      Friday: {
        title: "Recovery 45min",
        details: "Very easy Z1/Z2",
      },
      Saturday: {
        title: "Long Ride 3–3.5h",
        details: "Z2, group ride possible if controlled",
      },
      Sunday: {
        title: "Endurance 90min",
        details: "Add short climbs if you feel good",
      },
    },
  },
  {
    number: 7,
    phase: "Build 1",
    focus: "Sustained Climbing",
    workouts: {
      Monday: {
        title: "Threshold 3×10min",
        details: "3×10min @ 95–100% FTP on climbs",
      },
      Tuesday: {
        title: "Sustained Z3 50min",
        details: "50min @ 80–90% FTP · can be broken into 2×25min",
      },
      Wednesday: {
        title: "Rest",
        details: "Full rest",
      },
      Thursday: {
        title: "VO₂ 4×4min",
        details: "4×4min @ 115–120% FTP · 4min easy",
      },
      Friday: {
        title: "Recovery 45–60min",
        details: "Very easy, high cadence",
      },
      Saturday: {
        title: "Long Ride 3.5h",
        details: "Z2 + 2×15min Z3 in the middle",
      },
      Sunday: {
        title: "Endurance 90–120min",
        details: "Z2, no hard efforts",
      },
    },
  },
  {
    number: 8,
    phase: "Build 1",
    focus: "Threshold Peak",
    workouts: {
      Monday: {
        title: "Threshold 2×15min",
        details: "2×15min @ 95–100% FTP",
      },
      Tuesday: {
        title: "Tempo 60min",
        details: "85–90% FTP",
      },
      Wednesday: {
        title: "Rest",
        details: "Off",
      },
      Thursday: {
        title: "VO₂ 6×3min",
        details: "6×3min @ 115–120% FTP · 3min easy",
      },
      Friday: {
        title: "Recovery 45min",
        details: "Z1 only",
      },
      Saturday: {
        title: "Long Ride 3–4h",
        details: "Z2, last 20min can be Z3",
      },
      Sunday: {
        title: "Endurance 90min",
        details: "Very relaxed",
      },
    },
  },

  // Phase 3 – Race Prep (Weeks 9–12)
  {
    number: 9,
    phase: "Race Prep",
    focus: "Over/Unders Intro",
    workouts: {
      Monday: {
        title: "Over/Unders 3×8min",
        details: "1min 105–110% / 1min 85–90% FTP",
      },
      Tuesday: {
        title: "Endurance 60–75min",
        details: "Z2",
      },
      Wednesday: {
        title: "Rest",
        details: "Rest day",
      },
      Thursday: {
        title: "VO₂ 5×3min",
        details: "5×3min @ ~120% FTP",
      },
      Friday: {
        title: "Recovery 45–60min",
        details: "Very easy",
      },
      Saturday: {
        title: "Race Sim 2.5–3h",
        details: "Group ride with 20–40s surges",
      },
      Sunday: {
        title: "Endurance 90–120min",
        details: "Z2, nothing crazy",
      },
    },
  },
  {
    number: 10,
    phase: "Race Prep",
    focus: "Race Efforts & Climbing",
    workouts: {
      Monday: {
        title: "Over/Unders 4×8min",
        details: "Same pattern as W9, slightly harder",
      },
      Tuesday: {
        title: "Climb Repeats",
        details: "4–6×5min @ 100–105% FTP uphill",
      },
      Wednesday: {
        title: "Rest",
        details: "Off",
      },
      Thursday: {
        title: "VO₂ 6×3min",
        details: "6×3min @ 120% FTP",
      },
      Friday: {
        title: "Recovery 45min",
        details: "Z1",
      },
      Saturday: {
        title: "Race Sim 3h",
        details: "Include race-like hard sections on climbs",
      },
      Sunday: {
        title: "Endurance 90min",
        details: "Very easy",
      },
    },
  },
  {
    number: 11,
    phase: "Race Prep",
    focus: "Sharpening",
    workouts: {
      Monday: {
        title: "Over/Unders 3×10min",
        details: "Longer blocks with over/under structure",
      },
      Tuesday: {
        title: "Endurance 60min",
        details: "Z2 only",
      },
      Wednesday: {
        title: "Rest",
        details: "Rest",
      },
      Thursday: {
        title: "VO₂ 4×3min + Sprints",
        details: "4×3min @ 120% + 4×10s all-out sprints",
      },
      Friday: {
        title: "Recovery 45min",
        details: "Very easy spin",
      },
      Saturday: {
        title: "Race Sim 2–3h",
        details: "Key climbs at race pace",
      },
      Sunday: {
        title: "Endurance 60–90min",
        details: "Just move, nothing hard",
      },
    },
  },
  {
    number: 12,
    phase: "Race / Taper",
    focus: "Freshness",
    workouts: {
      Monday: {
        title: "Short Over/Unders",
        details: "2×6min moderate, nothing new",
      },
      Tuesday: {
        title: "Endurance 45–60min",
        details: "Very easy",
      },
      Wednesday: {
        title: "Rest",
        details: "Full rest",
      },
      Thursday: {
        title: "Openers",
        details: "3×3min Z3 + 3×30s Z6",
      },
      Friday: {
        title: "Recovery 30–45min",
        details: "Ultra easy",
      },
      Saturday: {
        title: "Race / Event",
        details: "Go full gas 🚀",
      },
      Sunday: {
        title: "Off / Recovery",
        details: "Roll easy or complete rest",
      },
    },
  },
];

/* ---------------------- HELPERS ---------------------- */

function makeLogKey(week: number, day: Day) {
  return `${week}-${day}`;
}

/* ---------------------- APP COMPONENT ---------------------- */

export default function App() {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
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

  const currentWeek = WEEKS.find((w) => w.number === selectedWeek)!;
  const currentPlan = currentWeek.workouts[selectedDay];

  // Load logs from localStorage
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

  // Save logs to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save logs", e);
    }
  }, [logs]);

  const logKey = makeLogKey(selectedWeek, selectedDay);
  const currentLog = logs[logKey];

  // Update form when week/day or logs change
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

  // Oura fetch (expects { data: [{ day, readiness, rhr, hrv }, ...] })
  useEffect(() => {
    async function loadOura() {
      try {
        setOura((prev) => ({ ...prev, loading: true, error: null }));
        const res = await fetch("/api/oura-readiness");
        if (!res.ok) {
          throw new Error("Oura API error: " + res.status);
        }
        const json = await res.json();
        setOura({
          loading: false,
          error: null,
          days: (json.data || []) as OuraDaySummary[],
        });
      } catch (err: any) {
        console.error("Failed to load Oura", err);
        setOura({
          loading: false,
          error: err?.message || "Unknown error",
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
          oura.days.reduce(
            (sum, d) => sum + (d.readiness ?? 0),
            0
          ) / oura.days.length
        )
      : null;

  // Week stats
  const keysForWeek = Object.keys(logs).filter((k) =>
    k.startsWith(`${selectedWeek}-`)
  );
  const completedDays = keysForWeek.length;
  const totalMinutes = keysForWeek.reduce(
    (sum, key) => sum + (logs[key]?.duration ?? 0),
    0
  );

  return (
    <div className="app-shell">
      <header className="top-header">
        <div>
          <h1>Climbing & Gran Fondo – 12 Week Plan</h1>
          <p className="top-subtitle">
            Week {currentWeek.number} • {currentWeek.phase} •{" "}
            {currentWeek.focus}
          </p>
        </div>
      </header>

      <main className="app-main">
        {/* LEFT COLUMN: Weeks + Oura */}
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

        <section className="card recovery-card">
          <h2>Recovery (Oura)</h2>
          {oura.loading && (
            <p className="small">Loading Oura data…</p>
          )}
          {oura.error && (
            <p className="small">
              Could not load Oura data: {oura.error}
            </p>
          )}
          {!oura.loading && !oura.error && !latestOura && (
            <p className="small">No Oura data available.</p>
          )}

          {!oura.loading && !oura.error && latestOura && (
            <>
              <div className="oura-header">
                <div>
                  <div className="oura-label">Last day</div>
                  <div className="oura-value">{latestOura.day}</div>
                </div>
                {avgReadiness !== null && (
                  <div>
                    <div className="oura-label">
                      7-day avg readiness
                    </div>
                    <div className="oura-value">
                      {avgReadiness}
                    </div>
                  </div>
                )}
              </div>

              <div className="oura-metrics">
                <div className="oura-metric">
                  <span className="oura-metric-label">
                    Today readiness
                  </span>
                  <span className="oura-metric-value">
                    {latestOura.readiness ?? "-"}
                  </span>
                </div>
                <div className="oura-metric">
                  <span className="oura-metric-label">Resting HR</span>
                  <span className="oura-metric-value">
                    {latestOura.rhr !== null
                      ? `${latestOura.rhr} bpm`
                      : "-"}
                  </span>
                </div>
                <div className="oura-metric">
                  <span className="oura-metric-label">HRV</span>
                  <span className="oura-metric-value">
                    {latestOura.hrv !== null
                      ? latestOura.hrv
                      : "-"}
                  </span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* RIGHT COLUMN: Week plan + detail/log */}
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
                    {hasLog && (
                      <span className="day-dot">✅</span>
                    )}
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
              <span className="planned-details">
                {currentPlan.details}
              </span>
            </p>

            {currentLog && (
              <div className="log-preview">
                <h3>Logged</h3>
                <p>
                  Duration:{" "}
                  <strong>{currentLog.duration} min</strong> · RPE:{" "}
                  <strong>{currentLog.rpe}/10</strong>
                </p>
                {currentLog.comment && (
                  <p>{currentLog.comment}</p>
                )}
              </div>
            )}

            <form className="log-form" onSubmit={handleSubmit}>
              <h3>
                {currentLog ? "Update log" : "Log this workout"}
              </h3>
              <div className="form-row">
                <label>
                  Duration (min)
                  <input
                    type="number"
                    min={0}
                    value={formDuration}
                    onChange={(e) =>
                      setFormDuration(e.target.value)
                    }
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
                  onChange={(e) =>
                    setFormComment(e.target.value)
                  }
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
