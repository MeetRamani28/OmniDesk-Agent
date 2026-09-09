import Database from 'better-sqlite3';
import path from 'path';

// Define the absolute path for the SQLite database file
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'local.db');

// Initialize connection (synchronous bindings for extreme speed)
export const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
});

// Enable Write-Ahead Logging (WAL) for high-concurrency read/write
db.pragma('journal_mode = WAL');

// Enforce strict foreign key constraints at the DB level
db.pragma('foreign_keys = ON');

console.log(`[Database] SQLite connected successfully at: ${dbPath}`);
