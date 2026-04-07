CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    article_id INTEGER,
    qty INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT NOW()
)
