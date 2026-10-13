const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const configuredPath = process.env.DATABASE_PATH || "./data/trackb.sqlite";
const dbPath = path.resolve(configuredPath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  operator TEXT NOT NULL,
  bus_name TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  price_paise INTEGER NOT NULL CHECK(price_paise >= 0),
  seats_total INTEGER NOT NULL DEFAULT 40 CHECK(seats_total > 0),
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  route_id INTEGER NOT NULL REFERENCES routes(id),
  travel_date TEXT NOT NULL,
  seats INTEGER NOT NULL CHECK(seats > 0),
  passenger_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UPCOMING'
    CHECK(status IN ('UPCOMING','COMPLETED','CANCELLED')),
  total_paise INTEGER NOT NULL CHECK(total_paise >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS bus_positions (
  route_id INTEGER PRIMARY KEY REFERENCES routes(id),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  speed_kph REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const count = db.prepare("SELECT COUNT(*) AS n FROM routes").get().n;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO routes
      (from_city,to_city,operator,bus_name,departure_time,arrival_time,price_paise,seats_total)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  const seeds = [
    ["Delhi","Manali","HRTC","HRTC Volvo","18:30","06:30",120000,40],
    ["Mumbai","Pune","MSRTC","Shivneri AC","11:15","14:45",50000,40],
    ["Bengaluru","Hyderabad","SRS Travels","SRS Sleeper","21:45","07:00",95000,36],
    ["Jaipur","Delhi","RSRTC","RSRTC Volvo","17:45","22:30",65000,40],
    ["Chennai","Bengaluru","KSRTC","Airavat AC","14:20","21:00",70000,40],
    ["Surat","Mumbai","Private Operator","Intercity AC","20:00","05:00",80000,36],
    ["Raipur","Bilaspur","Private Operator","Express AC","09:00","12:00",30000,40]
  ];
  const tx = db.transaction(rows => rows.forEach(row => insert.run(...row)));
  tx(seeds);
}

module.exports = db;
