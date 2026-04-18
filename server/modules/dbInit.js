const SQLiteDatabase = require("./database")
const Database = require("better-sqlite3")

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

  createTables(db)
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
    player1_id: "INTEGER NOT NULL",
    player2_id: "INTEGER NOT NULL",
    player1_inGame: "INTEGER NOT NULL DEFAULT 0 CHECK (player1_inGame IN (0, 1))",
    player2_inGame: "INTEGER NOT NULL DEFAULT 0 CHECK (player2_inGame IN (0, 1))",
    stat: "INTEGER",
    turn: "INTEGER",
    erg: "TEXT NOT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  }

  // Use raw SQL for games table to include foreign key constraint
  const createGamesTableSQL = `
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      player1_inGame INTEGER NOT NULL DEFAULT 0 CHECK (player1_inGame IN (0, 1)),
      player2_inGame INTEGER NOT NULL DEFAULT 0 CHECK (player2_inGame IN (0, 1)),
      stat INTEGER,
      turn INTEGER,
      erg TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `

  db.getDBHandler().exec(createGamesTableSQL)

  // Create indexes for games table
  db.getDBHandler().exec("CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id)")
}

function backupSql(dbPath, backupPath, options = {}) {
  const { includeDropStatements = true, includeCreateStatements = true, includeData = true } = options

  const absoluteDbPath = path.resolve(__dirname, dbPath)
  const absoluteBackupDir = path.resolve(__dirname, backupPath)

  const timestamp = new Date().toISOString().split("T")[0]
  const dbName = path.basename(dbPath, ".db") // Gets "chessapp" from "chessapp.db"
  const backupFileName = `${dbName}_backup_${timestamp}.sql`
  const absoluteBackupFilePath = path.join(absoluteBackupDir, backupFileName)

  const db = new Database(absoluteDbPath)

  // Ensure the DB directory exists
  if (!fs.existsSync(absoluteBackupDir)) {
    fs.mkdirSync(absoluteBackupDir, { recursive: true })
  }

  try {
    let dump = "-- SQLite Database Dump\n"
    dump += `-- Generated: ${new Date().toISOString()}\n`
    dump += "PRAGMA foreign_keys=OFF;\n"
    dump += "BEGIN TRANSACTION;\n\n"

    const tables = db
      .prepare(
        `
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%'
        `,
      )
      .all()

    for (const table of tables) {
      console.log(`📦 Processing table: ${table.name}`)

      // Add DROP TABLE IF EXISTS (optional)
      if (includeDropStatements) {
        dump += `-- Drop table if exists\n`
        dump += `DROP TABLE IF EXISTS "${table.name}";\n\n`
      }

      // Get CREATE statement (optional)
      if (includeCreateStatements) {
        const createStmt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table.name)

        if (createStmt) {
          dump += `-- Create table structure\n`
          dump += createStmt.sql + ";\n\n"
        }
      }

      // Get all data (optional)
      if (includeData) {
        const rows = db.prepare(`SELECT * FROM "${table.name}"`).all()

        if (rows.length > 0) {
          dump += `-- Insert data for ${table.name}\n`

          for (const row of rows) {
            const values = Object.values(row)
              .map((val) => (val === null ? "NULL" : `'${String(val).replace(/'/g, "''")}'`))
              .join(",")

            dump += `INSERT INTO "${table.name}" VALUES(${values});\n`
          }
          dump += "\n"
        } else {
          dump += `-- No data in ${table.name}\n\n`
        }
      }
    }

    dump += "COMMIT;\n"
    fs.writeFileSync(absoluteBackupFilePath, dump)
    console.log(`✅ SQL dump created: ${absoluteBackupFilePath}`)
  } catch (error) {
    console.error("❌ Dump failed:", error)
    throw error
  } finally {
    db.close()
  }
}

function findLatestSqlDump(backupDir, pattern = "chessapp_backup_") {
  const absoluteBackupDir = path.resolve(__dirname, backupDir)

  if (!fs.existsSync(absoluteBackupDir)) {
    throw new Error(`Backup directory not found: ${absoluteBackupDir}`)
  }

  // Find all matching dump files
  const dumpFiles = fs
    .readdirSync(absoluteBackupDir)
    .filter((file) => {
      return file.startsWith(pattern) && (file.endsWith(".sql") || file.endsWith(".db"))
    })
    .map((file) => {
      const filePath = path.join(absoluteBackupDir, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        path: filePath,
        created: stats.birthtime,
        modified: stats.mtime,
        size: stats.size,
      }
    })
    .sort((a, b) => b.created - a.created) // Sort by creation time, newest first

  if (dumpFiles.length === 0) {
    return false
  }

  return dumpFiles[0] // Return the latest
}

function restoreFromSqlDump(dumpPath, targetDbPath) {
  const db = new Database(targetDbPath)

  try {
    const sqlDump = fs.readFileSync(dumpPath, "utf8")
    db.exec(sqlDump)
    console.log(`Database restored from SQL dump: ${targetDbPath}`)
  } catch (error) {
    console.error("Restore from dump failed:", error)
  } finally {
    db.close()
  }
}

function restoreFromLatestDump(backupDir, targetDbPath, pattern = "chessapp_backup_") {
  const absoluteDbPath = path.resolve(__dirname, targetDbPath)
  const absoluteBackupDir = path.resolve(__dirname, backupDir)

  const db = new Database(absoluteDbPath)

  try {
    // Find the latest dump
    const latestDump = findLatestSqlDump(backupDir, pattern)
    if (latestDump !== false) {
      console.log(`🔄 Restoring from: ${latestDump.name}`)

      return restoreFromSqlDump(latestDump.path, absoluteDbPath)
    }
  } catch (error) {
    console.error("❌ Restore failed:", error.message)
    throw error
  }
}

/**
 * DB Init
 * @param {} init ... Init Tables and use Backup File
 * @param {} backupData ... create a SQL Dump
 */
function DBInit(options = {}) {
  const { init = true, backupData = false } = options

  const dbDir = path.resolve(__dirname, "../DB/chessapp.db")

  // Create database connection (will create file if it doesn't exist)
  if (init) {
    const db = new SQLiteDatabase(dbDir)
    initializeDatabase(db)
    restoreFromLatestDump("../DBbackups/", "../DB/chessapp.db", "chessapp_backup")
  }
  if (backupData) {
    backupSql("../DB/chessapp.db", "../DBbackups/", { includeDropStatements: true, includeCreateStatements: true, includeData: true })
  }
}
module.exports = DBInit
