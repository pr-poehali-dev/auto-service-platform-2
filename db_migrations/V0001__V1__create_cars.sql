CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    client_phone VARCHAR(50),
    color VARCHAR(20) DEFAULT '#888888',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)
