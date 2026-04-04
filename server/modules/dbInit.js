const SQLiteDatabase = require("./database")

const fs = require("fs")
const path = require("path")

/**
 * Recreate Tables with new Schemata, User Table Date is preserverd
 * @param { } db
 */
function initializeDatabase(db) {
  // Check if database is empty/new by looking for tables
  const tables = db
    .getDBHandler()
    .prepare(
      `SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
    )
    .all()

  if (tables.length === 0) {
    createTables(db)
  } else {
    // Database exists, backup users and recreate with new schema
    backupUsersAndRecreateDatabase(db)
  }
}

function backupUsersAndRecreateDatabase(db) {
  // Backup existing users data
  const existingUsers = backupUsers(db)

  // Drop existing tables
  dropExistingTables(db)

  // Create new tables with updated schema
  createTables(db)

  // Restore users data
  restoreUsers(db, existingUsers)
}

function backupUsers(db) {
  try {
    const stmt = db.getDBHandler().prepare("SELECT * FROM users")
    return stmt.all()
  } catch (error) {
    console.log("Users table does not exist or error reading:", error.message)
    return []
  }
}

function dropExistingTables(db) {
  const tables = db
    .getDBHandler()
    .prepare(
      `SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
    )
    .all()

  // Drop tables in reverse dependency order (games first, then users)
  const tableOrder = ["games", "users"]

  for (const tableName of tableOrder) {
    if (tables.some((t) => t.name === tableName)) {
      try {
        db.getDBHandler().prepare(`DROP TABLE IF EXISTS ${tableName}`).run()
      } catch (error) {
        console.error(`Error dropping table ${tableName}:`, error.message)
      }
    }
  }
}

function restoreUsers(db, users) {
  if (users.length > 0) {
    const insertUser = db.getDBHandler().prepare(`
      INSERT INTO users (id, username, password, online, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `)

    const insertManyUsers = db.getDBHandler().transaction((users) => {
      for (const user of users) {
        insertUser.run(user.id, user.username, user.password, user.online, user.created_at)
      }
    })

    try {
      insertManyUsers(users)
    } catch (error) {
      console.error("Error restoring users:", error.message)
    }
  } else {
    console.log("No users to restore.")
  }
}

function createTables(db) {
  // Create users table first (no dependencies)
  const userSchema = {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    username: "TEXT NOT NULL",
    password: "TEXT NOT NULL",
    online: "INTEGER NOT NULL DEFAULT 0 CHECK (online IN (0, 1))",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  }

  db.createTable("users", userSchema, {
    indexes: ["username"],
  })

  // Create games table with foreign key (after users table exists)
  const gameSchema = {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    name: "TEXT NOT NULL",
    number_of_players: "INTEGER NOT NULL",
    user_id: "INTEGER NOT NULL",
    closed: "BOOLEAN DEFAULT FALSE",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  }

  // Use raw SQL for games table to include foreign key constraint
  const createGamesTableSQL = `
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      number_of_players INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      closed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `

  db.getDBHandler().exec(createGamesTableSQL)

  // Create indexes for games table
  db.getDBHandler().exec("CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)")
  db.getDBHandler().exec("CREATE INDEX IF NOT EXISTS idx_games_closed ON games(closed)")
}

/**
 * DB Init
 * @param {} force ... force Recerattion
 */
function DBInit(force = false) {
  // Ensure the DB directory exists
  const dbDir = path.dirname("./DB/chessapp.db")
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Create database connection (will create file if it doesn't exist)
  const db = new SQLiteDatabase("./DB/chessapp.db")

  initializeDatabase(db)
}
module.exports = DBInit
