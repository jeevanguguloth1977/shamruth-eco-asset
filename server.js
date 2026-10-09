require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, "enquiries.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cottage TEXT NOT NULL,
  guests TEXT,
  checkin TEXT,
  checkout TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "30kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(__dirname, { extensions: ["html"] }));

const clean = (v, max = 1000) => String(v ?? "").trim().slice(0, max);
app.get("/api/config", (req, res) => {
  // WhatsApp number is supplied by the site owner through environment configuration.
  res.json({ whatsappNumber: clean(process.env.WHATSAPP_NUMBER, 20).replace(/\D/g, "") });
});

app.post("/api/enquiries", (req, res) => {
  const name = clean(req.body.name, 120);
  const phone = clean(req.body.phone, 30);
  const cottage = clean(req.body.cottage, 120);
  const guests = clean(req.body.guests, 20);
  const checkin = clean(req.body.checkin, 20);
  const checkout = clean(req.body.checkout, 20);
  const message = clean(req.body.message, 2000);

  if (!name || !phone || !cottage) return res.status(400).json({ error: "Name, phone, and preferred stay are required." });
  if (!/^[+0-9 ()-]{8,30}$/.test(phone)) return res.status(400).json({ error: "Please enter a valid phone number." });
  if (checkin && checkout && checkout <= checkin) return res.status(400).json({ error: "Check-out must be after check-in." });

  const reference = "SEA-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  try {
    db.prepare(`INSERT INTO enquiries (reference,name,phone,cottage,guests,checkin,checkout,message)
      VALUES (@reference,@name,@phone,@cottage,@guests,@checkin,@checkout,@message)`).run({
      reference, name, phone, cottage, guests, checkin, checkout, message
    });
    res.status(201).json({ ok: true, reference, message: "Enquiry saved. The property team must confirm availability." });
  } catch (err) {
    console.error("Enquiry save failed:", err.message);
    res.status(500).json({ error: "Unable to save enquiry right now." });
  }
});

// Private enquiry access is intentionally not exposed as a public endpoint.
// Connect an authenticated admin system before adding any endpoint that lists or exports guest records.
app.get("/health", (req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`Shamruth Eco Assets running on port ${PORT}`));
