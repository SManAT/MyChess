const mysql = require("mysql2/promise")
const logger = require("../services/logger").logger
const dotenv = require("dotenv")
dotenv.config()

const poolPHO = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USERNAME || "your_username",
  password: process.env.DB_PASSWORD || "your_password",
  database: "db_pho",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  //acquireTimeout: 30000,
  //connectTimeout: 60000,
})

const poolDisplayNET = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USERNAME || "your_username",
  password: process.env.DB_PASSWORD || "your_password",
  database: "DisplayNET",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  //acquireTimeout: 30000,
  //connectTimeout: 60000,
})

async function queryPHO(sql) {
  try {
    const [rows] = await poolPHO.query(sql)
    return rows
  } catch (err) {
    throw err
  }
}

async function queryDisplayNET(sql) {
  try {
    const [rows] = await poolDisplayNET.query(sql)
    return rows
  } catch (err) {
    throw err
  }
}

/* Example Usage
  async function run() {
    try {
      await queryPHO();
      await queryDisplayNET();
    } catch (err) {
      console.error('Error:', err);
    }
  }
*/

module.exports = {
  queryPHO,
  queryDisplayNET,
  poolDisplayNET,
}
