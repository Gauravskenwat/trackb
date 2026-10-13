require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const { z } = require("zod");
const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("Set JWT_SECRET in .env to a random string of at least 32 characters.");
  process.exit(1);
}

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(",").map(s => s.trim())
    : "http://localhost:8000"
}));
app.use(express.json({ limit: "20kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use("/api/newsletter", rateLimit({ windowMs: 60 * 60 * 1000, limit: 20 }));

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const tokenFor = user => jwt.sign(
  { sub: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: "2h", issuer: "trackb-api", audience: "trackb-client" }
);

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [kind, token] = header.split(" ");
  if (kind !== "Bearer" || !token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.user = jwt.verify(token, JWT_SECRET, { issuer: "trackb-api", audience: "trackb-client" });
    next();
  } catch {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72)
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72)
});
const bookingSchema = z.object({
  routeId: z.coerce.number().int().positive(),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seats: z.coerce.number().int().min(1).max(6),
  passengerName: z.string().trim().min(2).max(100)
});

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "TrackB API" }));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid registration details.", details: parsed.error.flatten() });
  const { name, email, password } = parsed.data;
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });
  const passwordHash = await bcrypt.hash(password, 12);
  const result = db.prepare("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)")
    .run(name, email.toLowerCase(), passwordHash);
  const user = { id: Number(result.lastInsertRowid), name, email: email.toLowerCase() };
  res.status(201).json({ message: "Account created.", token: tokenFor(user), user });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and password." });
  const email = parsed.data.email.toLowerCase();
  const userRow = db.prepare("SELECT id,name,email,password_hash FROM users WHERE email = ?").get(email);
  if (!userRow || !(await bcrypt.compare(parsed.data.password, userRow.password_hash))) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  const user = { id: userRow.id, name: userRow.name, email: userRow.email };
  res.json({ message: "Login successful.", token: tokenFor(user), user });
}));

app.get("/api/auth/me", auth, (req, res) => {
  const user = db.prepare("SELECT id,name,email,created_at AS createdAt FROM users WHERE id = ?").get(req.user.sub);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

app.get("/api/routes", (req, res) => {
  const schema = z.object({
    from: z.string().trim().min(1).max(80).optional(),
    to: z.string().trim().min(1).max(80).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid route search." });
  const { from, to } = parsed.data;
  if (from && to && from.toLowerCase() === to.toLowerCase()) {
    return res.status(400).json({ error: "Departure and destination must be different." });
  }
  let sql = `SELECT id,from_city AS fromCity,to_city AS toCity,operator,bus_name AS busName,
    departure_time AS departureTime,arrival_time AS arrivalTime,price_paise AS pricePaise,
    seats_total AS seatsTotal FROM routes WHERE active = 1`;
  const args = [];
  if (from) { sql += " AND from_city LIKE ?"; args.push(`%${from}%`); }
  if (to) { sql += " AND to_city LIKE ?"; args.push(`%${to}%`); }
  const rows = db.prepare(sql + " ORDER BY departure_time").all(...args);
  const available = rows.map(route => {
    const booked = db.prepare(`SELECT COALESCE(SUM(seats),0) AS n FROM bookings
      WHERE route_id = ? AND status = 'UPCOMING' AND (? IS NULL OR travel_date = ?)`)
      .get(route.id, parsed.data.date || null, parsed.data.date || null).n;
    return { ...route, price: route.pricePaise / 100, seatsAvailable: Math.max(0, route.seatsTotal - booked) };
  }).filter(r => r.seatsAvailable > 0);
  res.json({ results: available });
});

app.post("/api/bookings", auth, (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid booking details.", details: parsed.error.flatten() });
  const { routeId, travelDate, seats, passengerName } = parsed.data;
  const date = new Date(`${travelDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== travelDate) {
    return res.status(400).json({ error: "Invalid travel date." });
  }
  if (travelDate < new Date().toISOString().slice(0,10)) return res.status(400).json({ error: "Travel date cannot be in the past." });
  const createBooking = db.transaction(() => {
    const route = db.prepare("SELECT * FROM routes WHERE id = ? AND active = 1").get(routeId);
    if (!route) throw Object.assign(new Error("Route not found."), { status: 404 });
    const booked = db.prepare("SELECT COALESCE(SUM(seats),0) AS n FROM bookings WHERE route_id=? AND travel_date=? AND status='UPCOMING'")
      .get(routeId, travelDate).n;
    if (route.seats_total - booked < seats) throw Object.assign(new Error("Not enough seats available."), { status: 409 });
    const bookingRef = "TB" + crypto.randomBytes(5).toString("hex").toUpperCase();
    const totalPaise = route.price_paise * seats;
    const result = db.prepare(`INSERT INTO bookings
      (booking_ref,user_id,route_id,travel_date,seats,passenger_name,total_paise)
      VALUES(?,?,?,?,?,?,?)`).run(bookingRef, req.user.sub, routeId, travelDate, seats, passengerName, totalPaise);
    return { id: Number(result.lastInsertRowid), bookingRef, totalPaise };
  });
  try {
    const booking = createBooking();
    res.status(201).json({ message: "Booking created. Payment is not processed by this demo API.", booking: { ...booking, total: booking.totalPaise / 100, currency: "INR", status: "UPCOMING" } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

app.get("/api/bookings", auth, (req, res) => {
  const rows = db.prepare(`SELECT b.id,b.booking_ref AS bookingRef,b.travel_date AS travelDate,
    b.seats,b.passenger_name AS passengerName,b.status,b.total_paise AS totalPaise,
    r.from_city AS fromCity,r.to_city AS toCity,r.operator,r.bus_name AS busName,
    r.departure_time AS departureTime,r.arrival_time AS arrivalTime
    FROM bookings b JOIN routes r ON r.id=b.route_id WHERE b.user_id=?
    ORDER BY b.created_at DESC`).all(req.user.sub);
  res.json({ bookings: rows.map(b => ({ ...b, total: b.totalPaise / 100, currency: "INR" })) });
});

app.post("/api/bookings/:id/cancel", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid booking id." });
  const booking = db.prepare("SELECT id,status FROM bookings WHERE id=? AND user_id=?").get(id, req.user.sub);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (booking.status !== "UPCOMING") return res.status(409).json({ error: "Only upcoming bookings can be cancelled." });
  db.prepare("UPDATE bookings SET status='CANCELLED' WHERE id=?").run(id);
  res.json({ message: "Booking cancelled. Any refund must be handled by your payment provider.", id });
});

app.get("/api/tracking/:routeId", (req, res) => {
  const routeId = Number(req.params.routeId);
  const route = db.prepare("SELECT id,from_city AS fromCity,to_city AS toCity,bus_name AS busName FROM routes WHERE id=? AND active=1").get(routeId);
  if (!route) return res.status(404).json({ error: "Route not found." });
  const position = db.prepare("SELECT latitude,longitude,speed_kph AS speedKph,updated_at AS updatedAt FROM bus_positions WHERE route_id=?").get(routeId);
  if (!position) return res.status(404).json({ error: "No GPS position has been registered for this route yet." });
  res.json({ route, position, source: "stored GPS feed" });
});

// Device/server integration point: protect this endpoint with device credentials before production use.
app.put("/api/tracking/:routeId/position", (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(404).json({ error: "Not found." });
  const routeId = Number(req.params.routeId);
  const schema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speedKph: z.number().min(0).max(200).default(0)
  });
  const parsed = schema.safeParse(req.body);
  if (!Number.isInteger(routeId) || routeId < 1 || !parsed.success) return res.status(400).json({ error: "Invalid route or GPS coordinates." });
  const exists = db.prepare("SELECT id FROM routes WHERE id=?").get(routeId);
  if (!exists) return res.status(404).json({ error: "Route not found." });
  db.prepare(`INSERT INTO bus_positions(route_id,latitude,longitude,speed_kph,updated_at)
    VALUES(?,?,?,?,datetime('now')) ON CONFLICT(route_id) DO UPDATE SET
    latitude=excluded.latitude,longitude=excluded.longitude,speed_kph=excluded.speed_kph,updated_at=datetime('now')`)
    .run(routeId, parsed.data.latitude, parsed.data.longitude, parsed.data.speedKph);
  res.json({ message: "GPS position updated." });
});

app.post("/api/newsletter", (req, res) => {
  const parsed = z.object({ email: z.string().trim().email().max(254) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid email address." });
  try {
    db.prepare("INSERT INTO newsletter_subscribers(email) VALUES(?)").run(parsed.data.email.toLowerCase());
    res.status(201).json({ message: "Subscription saved." });
  } catch (err) {
    if (String(err.code).startsWith("SQLITE_CONSTRAINT")) return res.status(409).json({ error: "This email is already subscribed." });
    throw err;
  }
});

app.use((req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => console.log(`TrackB API running at http://localhost:${PORT}`));
