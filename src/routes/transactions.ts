import { Router } from "express";
import pool from "../db";
import { authenticate } from "../utils/auth";
import { triggerWebhook } from "../utils/webhook";

const router = Router();

// Bank-to-bank transfer requires bank API key
router.post("/transfer", authenticate, async (req, res) => {
    const { bank } = req; // Bank authenticated by API key
    if (!bank) {
        return res.status(403).json({ error: "Unauthorized: Valid bank API key required" });
    }

    const { receiverId, amount, metadata } = req.body;

    try {
        // Ensure the sender has sufficient funds
        const senderResult = await pool.query("SELECT balance FROM banks WHERE id = $1", [bank.id]);
        if (senderResult.rows[0].balance < amount) {
            return res.status(400).json({ error: "Insufficient funds" });
        }

        // Update balances
        await pool.query("BEGIN");
        await pool.query("UPDATE banks SET balance = balance - $1 WHERE id = $2", [amount, bank.id]);
        await pool.query("UPDATE banks SET balance = balance + $1 WHERE id = $2", [amount, receiverId]);

        // Log the transaction
        const transaction = await pool.query(
            "INSERT INTO transactions (sender_id, receiver_id, amount, metadata) VALUES ($1, $2, $3, $4) RETURNING *",
            [bank.id, receiverId, amount, metadata || {}]
        );

        await pool.query("COMMIT");

        // Trigger webhook for the receiving bank (if webhook is set)
        const receiverResult = await pool.query("SELECT webhook_url FROM banks WHERE id = $1", [receiverId]);
        const receiver = receiverResult.rows[0];
        if (receiver && receiver.webhook_url) {
            await triggerWebhook(receiver.webhook_url, {
                transaction: transaction.rows[0],
                message: "You have received a new transaction",
            });
        }

        res.json({ message: "Transfer successful", transaction: transaction.rows[0] });
    } catch (err) {
        await pool.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get transaction history (paginated)
router.get("/history", authenticate, async (req, res) => {
    const { bank } = req; // Bank authenticated by API key
    if (!bank) {
        return res.status(403).json({ error: "Unauthorized: Valid bank API key required" });
    }

    const { page = 1, limit = 10 } = req.query;

    try {
        const offset = (Number(page) - 1) * Number(limit);

        const transactions = await pool.query(
            "SELECT * FROM transactions WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            [bank.id, Number(limit), offset]
        );

        res.json({ transactions: transactions.rows, page: Number(page), limit: Number(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
