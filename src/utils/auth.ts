import { Request, Response, NextFunction } from "express";
import pool from "../db";
import dotenv from "dotenv";

dotenv.config();

declare global {
    namespace Express {
        interface Request {
            bank?: { id: number; name: string; balance: number };
            isAdmin?: boolean;
        }
    }
}

// Middleware to validate API key
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
        return res.status(401).json({ error: "API key missing" });
    }

    // Check if it's the admin (Central Bank) API key
    if (apiKey === process.env.ADMIN_API_KEY) {
        req.isAdmin = true;
        return next();
    }

    // Otherwise, validate as a bank API key
    try {
        const result = await pool.query("SELECT * FROM banks WHERE api_key = $1", [apiKey]);
        if (result.rows.length === 0) {
            return res.status(403).json({ error: "Invalid API key" });
        }

        req.bank = result.rows[0]; // Attach bank details to the request
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
