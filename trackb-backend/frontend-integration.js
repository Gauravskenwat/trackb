/*
  Copy/adapt these helpers into your frontend JS.
  Serve the frontend from the origin configured in backend .env.
*/
const TRACKB_API = "http://localhost:4000/api";

async function trackbRequest(path, options = {}) {
  const token = localStorage.getItem("trackb_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${TRACKB_API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

async function trackbRegister({ name, email, password }) {
  const result = await trackbRequest("/auth/register", {
    method: "POST", body: JSON.stringify({ name, email, password })
  });
  localStorage.setItem("trackb_token", result.token);
  return result.user;
}

async function trackbLogin({ email, password }) {
  const result = await trackbRequest("/auth/login", {
    method: "POST", body: JSON.stringify({ email, password })
  });
  localStorage.setItem("trackb_token", result.token);
  return result.user;
}

async function trackbSearchRoutes(from, to, date) {
  const q = new URLSearchParams({ from, to });
  if (date) q.set("date", date);
  return (await trackbRequest(`/routes?${q}`)).results;
}

async function trackbCreateBooking({ routeId, travelDate, seats, passengerName }) {
  return trackbRequest("/bookings", {
    method: "POST", body: JSON.stringify({ routeId, travelDate, seats, passengerName })
  });
}

async function trackbGetBookings() {
  return (await trackbRequest("/bookings")).bookings;
}

async function trackbCancelBooking(id) {
  return trackbRequest(`/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST", body: "{}" });
}

async function trackbSubscribe(email) {
  return trackbRequest("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
}
