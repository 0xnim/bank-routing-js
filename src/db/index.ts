import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Use DATABASE_URL from .env for connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export default pool;
