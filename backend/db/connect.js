import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;

// ✅ Fix: accept Supabase’s self-signed SSL certificate
const sql = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certs
  },
});

export default sql;
