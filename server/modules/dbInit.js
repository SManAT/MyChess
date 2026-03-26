const SQLiteDatabase = require("./database")

function DBInit() {
  // Initialize database
  const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })

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
module.exports = DBInit
