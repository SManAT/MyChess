/**
 * Browser-compatible logger
 */

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Get log level from localStorage or default to 'info'
const getLogLevel = () => {
  const stored = localStorage.getItem("LOG_LEVEL") || "info";
  return LOG_LEVELS[stored] !== undefined ? stored : "info";
};

class BrowserLogger {
  constructor() {
    this.level = getLogLevel();
  }

  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.level = level;
      localStorage.setItem("LOG_LEVEL", level);
    }
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  error(message, ...args) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message), ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message), ...args);
    }
  }

  debug(message, ...args) {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message), ...args);
    }
  }
}

// Create and export logger instance
export const logger = new BrowserLogger();
