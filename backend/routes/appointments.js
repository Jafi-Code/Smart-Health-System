// routes/appointments.js
import express from 'express';
import sql from '../db/connect.js';  // ✅ Corrected path

const router = express.Router();

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM appointments ORDER BY id ASC;`;
    res.json(result);
  } catch (err) {
    console.error('Error fetching appointments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST new appointment
router.post('/', async (req, res) => {
  const { patient_name, contact, clinic, slot } = req.body;

  if (!patient_name || !contact || !clinic || !slot) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await sql`
      INSERT INTO appointments (patient_name, contact, clinic, slot, status)
      VALUES (${patient_name}, ${contact}, ${clinic}, ${slot}, 'booked')
      RETURNING *;
    `;

    res.status(201).json(result[0]);
  } catch (err) {
    console.error('Error adding appointment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
