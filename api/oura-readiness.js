import fetch from "node-fetch";

export default async function handler(req, res) {
  const token = process.env.OURA_TOKEN;

  if (!token) {
    return res
      .status(500)
      .json({ error: "Missing OURA_TOKEN env var" });
  }

  // Debug-Flag: wenn du ?debug=1 an die URL hängst, bekommst du die Rohdaten von Oura zurück
  const debug = req.query.debug === "1";

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

  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await resp.text();

    if (!resp.ok) {
      console.error("Oura error:", resp.status, text);
      return res.status(resp.status).json({
        error: "Oura API error",
        status: resp.status,
        detail: text,
      });
    }

    const data = JSON.parse(text);

    // Wenn debug=1 -> rohe Antwort zurückgeben, damit du die Feldnamen siehst
    if (debug) {
      return res.status(200).json(data);
    }

    // Hier mappen wir auf genau die Felder, die deine React-App erwartet
    const simplified = (data.data || []).map((d) => ({
      day: d.day,
      readiness: d.score ?? null,
      // viele Oura-Accounts haben hier resting_heart_rate im daily_readiness-Objekt:
      rhr: d.resting_heart_rate ?? null,
      // HRV hängt von deinem Plan/Endpoint ab – wir versuchen ein paar typische Namen:
      hrv: d.hrv_balance ?? d.hrv_rmssd ?? null,
    }));

    return res.status(200).json({ data: simplified });
  } catch (err) {
    console.error("Oura fetch failed", err);
    return res.status(500).json({
      error: "Fetch to Oura failed",
      detail: String(err),
    });
  }
}
