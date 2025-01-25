-- Banks Table
CREATE TABLE banks (
                       id SERIAL PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       balance NUMERIC(15, 2) DEFAULT 0,
                       api_key VARCHAR(255) UNIQUE NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
                              id SERIAL PRIMARY KEY,
                              sender_id INT REFERENCES banks(id),
                              receiver_id INT REFERENCES banks(id),
                              amount NUMERIC(15, 2) NOT NULL,
                              metadata JSONB,
                              created_at TIMESTAMP DEFAULT NOW()
);

 ---

-- Add webhook_url column to banks
ALTER TABLE banks ADD COLUMN webhook_url VARCHAR(500);

-- Add an index for transactions for better pagination performance
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);
