import { io } from "socket.io-client";

const logger = require("./logger").logger;

class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    let server = import.meta.env.VITE_SERVER_URL;
    let port = import.meta.env.VITE_SERVER_PORT;
    this.socket = io(`http://${server}:${port}`);

    this.socket.on("connect", () => {
      this.connected = true;
      logger.info("Connected to server");
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      logger.info("Disconnected from server");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketManager();
