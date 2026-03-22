/**
 * Logger configuration using Winston with single file rotation by size.
 */

const winston = require("winston")
const path = require("path")

// Also Log to Debug Console
class DebugConsoleLogTransport extends winston.Transport {
  log(info, callback) {
    setImmediate(() => this.emit("logged", info))

    const { timestamp, level, message } = info
    console.log(`${message}`)

    callback() // Must call this when done
  }
}

const { combine, timestamp, printf } = winston.format

// Set default log level or use environment variable
const logLevel = process.env.LOG_LEVEL || "info"

// Define log format
const logFormat = printf((info) => {
  return `[${info.timestamp}] ${info.level}: ${info.message}`
})

// Define file transport with size-based rotation
const fileTransport = new winston.transports.File({
  filename: path.join("logs", "server.log"),
  maxsize: 1 * 1024 * 1024, // 1MB
  maxFiles: 1, // Keep only the current log file
  tailable: true, // Keep the file descriptor open
  level: logLevel,
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
})

// Define console transport
const consoleTransport = new winston.transports.Console({
  level: logLevel,
  stderrLevels: [], // Only use stdout
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
})

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  transports: [
    fileTransport,
    new DebugConsoleLogTransport(),
    consoleTransport, // Optional: include console transport if you want logs in console
  ],
})

// Export logger
module.exports = { logger }
