import { Router } from "express";
import pool from "../db";
import { authenticate } from "../utils/auth";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Central Bank actions require admin API key
router.use(authenticate);


// Create a new bank (Admin Only)
router.post("/create-bank", async (req, res) => {
    if (!req.isAdmin) {
        return res.status(403).json({ error: "Unauthorized: Central Bank API key required" });
    }

    const { name, initialBalance = 0, webhookUrl } = req.body;

    try {
        const apiKey = uuidv4(); // Generate a unique API key for the new bank
        const result = await pool.query(
            "INSERT INTO banks (name, balance, api_key, webhook_url) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, initialBalance, apiKey, webhookUrl]
        );

        res.json({ message: "Bank created successfully", bank: result.rows[0], apiKey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Deposit funds (Central Bank only)
router.post("/deposit", async (req, res) => {
    if (!req.isAdmin) {
        return res.status(403).json({ error: "Unauthorized: Central Bank API key required" });
    }

    const { bankId, amount } = req.body;

    try {
        const result = await pool.query(
            "UPDATE banks SET balance = balance + $1 WHERE id = $2 RETURNING *",
            [amount, bankId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Bank not found" });
        }

        res.json({ message: "Funds deposited successfully", bank: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Withdraw funds (Central Bank only)
router.post("/withdraw", async (req, res) => {
    if (!req.isAdmin) {
        return res.status(403).json({ error: "Unauthorized: Central Bank API key required" });
    }

    const { bankId, amount } = req.body;

    try {
        const result = await pool.query(
            "UPDATE banks SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING *",
            [amount, bankId]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ error: "Insufficient funds or bank not found" });
        }

        res.json({ message: "Funds withdrawn successfully", bank: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
