import { io } from "socket.io-client";

class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    this.socket = io("http://localhost:3001");

    this.socket.on("connect", () => {
      this.connected = true;
      console.log("Connected to server");
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      console.log("Disconnected from server");
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
