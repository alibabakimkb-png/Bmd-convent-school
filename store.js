const KEY = "pathshala_desk_v1";

async function apiLoad(fallback) {
  try {
    const r = await fetch("/api/data");
    if (r.ok) return await r.json();
  } catch (e) {}
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const d = typeof fallback === "function" ? fallback() : fallback;
  localStorage.setItem(KEY, JSON.stringify(d));
  return d;
}

async function apiSave(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(db)
    });
  } catch (e) {}
}

async function apiLogin(user, pass) {
  try {
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass })
    });
    return await r.json();
  } catch (e) {
    if ((user === "admin" && pass === "admin123") || (user === "teacher" && pass === "teach123")) {
      return { ok: true, name: user === "admin" ? "Office Admin" : "Anita Verma", role: user === "admin" ? "Admin" : "Teacher", user };
    }
    return { ok: false, error: "Galat ID / password" };
  }
}
