const Database = require("better-sqlite3")
const moment = require("moment")
const GAMESTATS = require("./gameStats")

class SQLiteDatabase {
  constructor(dbPath = "./database.db", options = {}) {
    // Ensure directory exists
    const path = require("path")
    const fs = require("fs")

    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // Fix verbose option handling
    const dbOptions = { ...options }
    if (options.verbose) {
      dbOptions.verbose = console.log
    } else {
      delete dbOptions.verbose // Remove verbose if false/undefined
    }

    this.db = new Database(dbPath, dbOptions)

    // Enable foreign keys and WAL mode for better performance
    this.db.pragma("foreign_keys = ON")
    this.db.pragma("journal_mode = WAL")

    this.preparedStatements = new Map()
  }

  getDBHandler() {
    return this.db
  }

  getUserId(username) {
    const stmt = this.db.prepare("SELECT id FROM users WHERE username = ?")
    const user = stmt.get(username)
    return user ? user.id : null
  }

  /**
   *
   * @returns Get all Users
   */
  getPlayers(userid, onlyOnline) {
    const ID = Number(userid)
    let query
    if (onlyOnline === false) {
      query = this.db.prepare("SELECT id, username,online FROM users WHERE id<>?")
    } else {
      query = this.db.prepare("SELECT id, username,online FROM users WHERE online=1 AND id<>?")
    }
    const result = query.all(ID)
    // Convert to boolean in JavaScript
    const users = result.map((user) => ({
      ...user,
      online: Boolean(user.online),
    }))
    return users
  }
  /**
   *
   * @returns Get all games of a User
   */
  getGames(userid) {
    const ID = Number(userid)
    let query = this.db.prepare(`SELECT * FROM games WHERE id=?`)
    const result = query.all(ID)
    //get Player names
    this.db.getPlayerName(1)

    return result
  }

  /**
   * Statistik to games
   * @param {*} gameid
   * @returns
   */
  getGamesStats(gameid) {
    const ID = Number(gameid)
    let query = this.db.prepare(`SELECT name, stat, turn, created_at FROM games WHERE id=?`)
    const result = query.all(ID)
    return result
  }

  /**
   * Get the opponent of the game
   * @param {*} gameId
   * @param {*} userId thats my ID
   * @returns
   */
  getOtherPlayer(gameId, userId) {
    const ID = Number(gameId)
    const UID = Number(userId)
    let query = this.db.prepare(`SELECT player1_id, player2_id FROM games WHERE id=?`)
    const result = query.all(ID)
    if (result[0].player1_id === UID) {
      return result[0].player2_id
    } else {
      return result[0].player1_id
    }
  }

  /**
   * unique name function
   * @param {*} originalName
   * @returns
   */
  ensureUniqueGameName(originalName) {
    // Check if the original name exists
    const checkStmt = this.db.prepare("SELECT COUNT(*) as count FROM games WHERE name = ?")
    let result = checkStmt.get(originalName)

    // If name doesn't exist, return it as is
    if (result.count === 0) {
      return originalName
    }

    // If name exists, find a unique variant
    let counter = 1
    let newName = `${originalName}(${counter})`

    while (true) {
      result = checkStmt.get(newName)
      if (result.count === 0) {
        return newName
      }
      counter++
      newName = `${originalName} (${counter})`
    }
  }

  createNewGame(gamename, owner, player) {
    // Create a new game
    const gameName = this.ensureUniqueGameName(gamename)
    const newGame = {
      name: gameName,
      player1_id: parseInt(owner),
      player2_id: player,
      player1_inGame: 0,
      player2_inGame: 0,
      stat: GAMESTATS.ACTIVE,
      turn: 1,
      erg: "",
      created_at: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
    }

    return this.create("games", newGame)
  }

  /**
   * Create a table with the given schema
   * @param {string} tableName - Name of the table
   * @param {Object} schema - Column definitions
   * @param {Object} options - Table options (primaryKey, indexes, etc.)
   */
  createTable(tableName, schema, options = {}) {
    const columns = Object.entries(schema).map(([name, type]) => {
      if (options.primaryKey === name) {
        return `${name} ${type} PRIMARY KEY`
      }
      return `${name} ${type}`
    })

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(", ")})`

    try {
      this.db.exec(sql)

      // Create indexes if specified
      if (options.indexes) {
        options.indexes.forEach((index) => {
          const indexName = `idx_${tableName}_${index}`
          const indexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${index})`
          this.db.exec(indexSql)
        })
      }

      return true
    } catch (error) {
      console.error("Error creating table:", error)
      return false
    }
  }

  /**
   * Get or create a prepared statement
   * @param {string} key - Unique key for the statement
   * @param {string} sql - SQL query
   */
  getStatement(key, sql) {
    if (!this.preparedStatements.has(key)) {
      this.preparedStatements.set(key, this.db.prepare(sql))
    }
    return this.preparedStatements.get(key)
  }

  /**
   * Insert a single record
   * @param {string} tableName - Name of the table
   * @param {Object} data - Data to insert
   * @returns {Object} - Insert result with lastInsertRowid
   */
  create(tableName, data) {
    const columns = Object.keys(data)
    const placeholders = columns.map(() => "?").join(", ")
    const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`

    const key = `insert_${tableName}_${columns.join("_")}`
    const stmt = this.getStatement(key, sql)

    try {
      const result = stmt.run(...Object.values(data))
      return {
        success: true,
        lastInsertRowid: result.lastInsertRowid,
        changes: result.changes,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Insert multiple records in a transaction
   * @param {string} tableName - Name of the table
   * @param {Array} dataArray - Array of objects to insert
   * @returns {Object} - Insert result
   */
  createMany(tableName, dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { success: false, error: "Data must be a non-empty array" }
    }

    const columns = Object.keys(dataArray[0])
    const placeholders = columns.map(() => "?").join(", ")
    const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`

    const stmt = this.db.prepare(sql)
    const transaction = this.db.transaction((records) => {
      const results = []
      for (const record of records) {
        results.push(stmt.run(...columns.map((col) => record[col])))
      }
      return results
    })

    try {
      const results = transaction(dataArray)
      return {
        success: true,
        insertedCount: results.length,
        lastInsertRowid: results[results.length - 1]?.lastInsertRowid,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Read records with optional conditions
   * @param {string} tableName - Name of the table
   * @param {Object} options - Query options
   * @returns {Array} - Array of records
   */
  read(tableName, options = {}) {
    const { where = {}, select = "*", orderBy, limit, offset = 0 } = options

    let sql = `SELECT ${Array.isArray(select) ? select.join(", ") : select} FROM ${tableName}`
    const values = []

    // Add WHERE clause
    if (Object.keys(where).length > 0) {
      const conditions = Object.entries(where).map(([key, value]) => {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => "?").join(", ")
          values.push(...value)
          return `${key} IN (${placeholders})`
        } else if (typeof value === "object" && value !== null) {
          // Handle operators like { $gt: 10 }, { $like: '%pattern%' }
          const operator = Object.keys(value)[0]
          const val = value[operator]
          values.push(val)

          switch (operator) {
            case "$gt":
              return `${key} > ?`
            case "$gte":
              return `${key} >= ?`
            case "$lt":
              return `${key} < ?`
            case "$lte":
              return `${key} <= ?`
            case "$like":
              return `${key} LIKE ?`
            case "$ne":
              return `${key} != ?`
            default:
              return `${key} = ?`
          }
        } else {
          values.push(value)
          return `${key} = ?`
        }
      })
      sql += ` WHERE ${conditions.join(" AND ")}`
    }

    // Add ORDER BY
    if (orderBy) {
      if (typeof orderBy === "string") {
        sql += ` ORDER BY ${orderBy}`
      } else if (Array.isArray(orderBy)) {
        sql += ` ORDER BY ${orderBy.join(", ")}`
      }
    }

    // Add LIMIT and OFFSET
    if (limit) {
      sql += ` LIMIT ${limit}`
      if (offset > 0) {
        sql += ` OFFSET ${offset}`
      }
    }

    try {
      const stmt = this.db.prepare(sql)
      return stmt.all(...values)
    } catch (error) {
      console.error("Error reading records:", error)
      return []
    }
  }

  /**
   * Read a single record
   * @param {string} tableName - Name of the table
   * @param {Object} where - Where conditions
   * @returns {Object|null} - Single record or null
   */
  readOne(tableName, where = {}) {
    const result = this.read(tableName, { where, limit: 1 })
    return result.length > 0 ? result[0] : null
  }

  /**
   * Update records
   * @param {string} tableName - Name of the table
   * @param {Object} data - Data to update
   * @param {Object} where - Where conditions
   * @returns {Object} - Update result
   */
  update(tableName, data, where = {}) {
    if (Object.keys(data).length === 0) {
      return { success: false, error: "No data to update" }
    }

    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ")
    let sql = `UPDATE ${tableName} SET ${setClause}`
    const values = Object.values(data)

    if (Object.keys(where).length > 0) {
      const conditions = Object.entries(where).map(([key, value]) => {
        values.push(value)
        return `${key} = ?`
      })
      sql += ` WHERE ${conditions.join(" AND ")}`
    }

    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.run(...values)
      return {
        success: true,
        changes: result.changes,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Delete records
   * @param {string} tableName - Name of the table
   * @param {Object} where - Where conditions (required for safety)
   * @returns {Object} - Delete result
   */
  delete(tableName, where = {}) {
    if (Object.keys(where).length === 0) {
      return { success: false, error: "WHERE condition required for delete operation" }
    }

    const conditions = Object.entries(where).map(([key, value]) => `${key} = ?`)
    const sql = `DELETE FROM ${tableName} WHERE ${conditions.join(" AND ")}`
    const values = Object.values(where)

    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.run(...values)
      return {
        success: true,
        changes: result.changes,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Count records
   * @param {string} tableName - Name of the table
   * @param {Object} where - Where conditions
   * @returns {number} - Record count
   */
  count(tableName, where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`
    const values = []

    if (Object.keys(where).length > 0) {
      const conditions = Object.entries(where).map(([key, value]) => {
        values.push(value)
        return `${key} = ?`
      })
      sql += ` WHERE ${conditions.join(" AND ")}`
    }

    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.get(...values)
      return result.count
    } catch (error) {
      console.error("Error counting records:", error)
      return 0
    }
  }

  /**
   * Execute raw SQL query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array} - Query results
   */
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql)
      return stmt.all(...params)
    } catch (error) {
      console.error("Error executing query:", error)
      return []
    }
  }

  /**
   * Execute raw SQL statement (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL statement
   * @param {Array} params - Statement parameters
   * @returns {Object} - Execution result
   */
  execute(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.run(...params)
      return {
        success: true,
        ...result,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Begin a transaction
   * @param {Function} callback - Function to execute within transaction
   * @returns {*} - Transaction result
   */
  transaction(callback) {
    const transaction = this.db.transaction(callback)
    return transaction()
  }

  /**
   * Close the database connection
   */
  close() {
    try {
      this.db.close()
      return true
    } catch (error) {
      console.error("Error closing database:", error)
      return false
    }
  }

  /**
   * Get table schema information
   * @param {string} tableName - Name of the table
   * @returns {Array} - Column information
   */
  getTableInfo(tableName) {
    try {
      const sql = `PRAGMA table_info(${tableName})`
      return this.db.prepare(sql).all()
    } catch (error) {
      console.error("Error getting table info:", error)
      return []
    }
  }

  /**
   * Check if a table exists
   * @param {string} tableName - Name of the table
   * @returns {boolean} - True if table exists
   */
  tableExists(tableName) {
    try {
      const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      const stmt = this.db.prepare(sql)
      const result = stmt.get(tableName)
      return !!result
    } catch (error) {
      console.error("Error checking if table exists:", error)
      return false
    }
  }

  /**
   * Check if a record exists in a table
   * @param {string} tableName - Name of the table
   * @param {Object} where - Where conditions
   * @returns {boolean} - True if record exists
   */
  exists(tableName, where = {}) {
    if (Object.keys(where).length === 0) {
      return false
    }

    let sql = `SELECT 1 FROM ${tableName}`
    const values = []

    const conditions = Object.entries(where).map(([key, value]) => {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => "?").join(", ")
        values.push(...value)
        return `${key} IN (${placeholders})`
      } else {
        values.push(value)
        return `${key} = ?`
      }
    })
    sql += ` WHERE ${conditions.join(" AND ")} LIMIT 1`

    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.get(...values)
      return !!result
    } catch (error) {
      console.error("Error checking if record exists:", error)
      return false
    }
  }

  /**
   * Check if a user exists (convenience method)
   * @param {string} identifier - Email, username, or ID
   * @param {string} field - Field to check against (default: 'email')
   * @returns {boolean} - True if user exists
   */
  userExists(identifier, field = "email") {
    return this.exists("users", { [field]: identifier })
  }

  setUserInGameOnline(gameId, userId) {
    //which player am I player1 or player2
    const sql1 = this.db.prepare(`SELECT player1_id, player2_id from games WHERE id=?`)
    let result = sql1.get(gameId)
    let player1 = false
    if (result.player1_id === parseInt(userId)) {
      player1 = true
    }

    let col = "player2_inGame"
    if (player1) {
      col = "player1_inGame"
    }

    const sql = this.db.prepare(`UPDATE games
                                  SET ${col} = ?
                                  WHERE id=?`)
    sql.run(1, gameId)
  }
}

module.exports = SQLiteDatabase
