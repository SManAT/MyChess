const CRUDDatabase = require("./database")

function DBInit() {
  // Initialize database
  const db = new CRUDDatabase("./DB/chessapp.db", { verbose: false })

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
}
module.exports = DBInit
