// api/oura-readiness.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const token = process.env.OURA_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Missing OURA_TOKEN env var" });
  }

  // defaults: letzte 7 Tage
  const { start, end } = req.query;
  const today = new Date();
  const endDate = end || today.toISOString().slice(0, 10);
  const startDate =
    start ||
    new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

  const url = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    return res.status(resp.status).json({ error: "Oura API error", detail: text });
  }

  const data = await resp.json();

  // Option: auf das Wichtigste reduzieren
  const simplified = data.data.map((d) => ({
    day: d.day,
    score: d.score,
    resting_heart_rate: d.resting_heart_rate,
    // evtl. hier noch hrv_balance o.Ä. einbauen, sobald du die Struktur kennst
  }));

  return res.status(200).json({ data: simplified });
}
