export const INITIAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'customer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  issue_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'user', 'agent', 'system'
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stock_level INTEGER DEFAULT 0,
  price REAL NOT NULL
);
`;
