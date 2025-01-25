import express from "express";
import centralBankRoutes from "./routes/centralBank";
import transactionRoutes from "./routes/transactions";

const app = express();

app.use(express.json());
app.use("/central-bank", centralBankRoutes);
app.use("/transactions", transactionRoutes);

export default app;
