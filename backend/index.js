// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sql from "./db/connect.js";        // your existing working Supabase connection
import appointmentsRouter from "./routes/appointments.js";  // new routes file

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Default route (for quick test)
app.get("/", (req, res) => {
  res.send("✅ Smart Health System Backend is running...");
});

// ✅ Your existing working route
app.get("/test-db", async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.json({
      status: "Connected to Supabase DB successfully",
      time: result[0].now,
    });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Optional /api/test route (same as /test-db, just for consistency)
app.get("/api/test", async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.json({
      status: "Connected to Supabase successfully!",
      time: result[0].now,
    });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mount Appointments Routes
app.use("/api/appointments", appointmentsRouter);

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Smart Health System API running on port ${PORT}`)
);


