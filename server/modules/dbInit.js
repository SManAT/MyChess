const Database = require("better-sqlite3")

const fs = require("fs")
const path = require("path")

function initializeDatabase(db) {
  // Check if database is empty/new by looking for tables
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
    )
    .all()

  if (tables.length === 0) {
    createTables()
  }
}

function createTables() {
  // Create a users table
  const userSchema = {
    id: "INTEGER",
    name: "TEXT NOT NULL",
    password: "TEXT UNIQUE NOT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  }

  db.createTable("users", userSchema, {
    primaryKey: "id",
    indexes: ["name"],
  })

  // Create a games table
  const gameSchema = {
    id: "INTEGER",
    name: "TEXT NOT NULL",
    number_of_players: "INTEGER NOT NULL",
    user_id: "INTEGER NOT NULL",
    closed: "BOOLEAN DEFAULT FALSE",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  }

  db.createTable("games", gameSchema, {
    primaryKey: "id",
    indexes: ["user_id", "closed"],
    foreignKeys: {
      user_id: {
        table: "users",
        column: "id",
        onDelete: "CASCADE",
      },
    },
  })
}

function DBInit() {
  // Ensure the DB directory exists
  const dbDir = path.dirname("./DB/chessapp.db")
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Create database connection (will create file if it doesn't exist)
  const db = new Database("./DB/chessapp.db")

  initializeDatabase(db)
}
module.exports = DBInit
