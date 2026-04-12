import { io } from "socket.io-client";

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    const server = import.meta.env.VITE_SERVER_URL;
    const port = import.meta.env.VITE_SERVER_PORT;

    // Configuration
    this.config = {
      url: `http://${server}:${port}`,
      options: {
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
      },
    };

    this.init();
  }

  // Initialize the socket connection
  init(url = null, options = {}) {
    try {
      const socketUrl = url || this.config.url;
      const socketOptions = {
        ...this.config.options,
        ...options,
        // Send username in auth object
        auth: {
          username: localStorage.getItem("username"),
          timestamp: new Date().toISOString(),
        },
      };

      this.socket = io(socketUrl, socketOptions);
      this.setupDefaultEventHandlers();

      return this;
    } catch (error) {
      console.error("Failed to initialize SocketManager:", error);
      throw error;
    }
  }

  // Setup default event handlers
  setupDefaultEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit("socketManager:connected", { id: this.socket.id });
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("Disconnected:", reason);
      this.emit("socketManager:disconnected", { reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.emit("socketManager:error", { error: error.message });
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      console.log(`Reconnection attempt: ${attemptNumber}`);
      this.emit("socketManager:reconnecting", { attempt: attemptNumber });
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.emit("socketManager:reconnected", { attempts: attemptNumber });
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect after maximum attempts");
      this.emit("socketManager:reconnect_failed");
    });
  }

  // Register event handler
  on(event, handler) {
    if (!this.socket) {
      console.warn("Socket not initialized. Call init() first.");
      return this;
    }

    // Store handler for potential cleanup
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    this.socket.on(event, handler);
    return this;
  }

  // Remove event handler
  off(event, handler = null) {
    if (!this.socket) return this;

    if (handler) {
      this.socket.off(event, handler);
      if (this.eventHandlers.has(event)) {
        this.eventHandlers.get(event).delete(handler);
      }
    } else {
      this.socket.off(event);
      this.eventHandlers.delete(event);
    }
    return this;
  }

  // Emit event to server
  emit(event, data = null) {
    if (!this.socket) {
      console.warn("Socket not initialized. Cannot emit event:", event);
      return false;
    }

    try {
      if (data !== null) {
        this.socket.emit(event, data);
      } else {
        this.socket.emit(event);
      }
      return true;
    } catch (error) {
      console.error("Error emitting event:", error);
      return false;
    }
  }

  // Emit with acknowledgment callback
  emitWithAck(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not initialized"));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Acknowledgment timeout for event: ${event}`));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }

  // Send message (convenience method)
  sendMessage(message, data = {}) {
    return this.emit("message", {
      message,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // Join a room
  joinRoom(roomName) {
    return this.emit("join_room", { room: roomName });
  }

  // Leave a room
  leaveRoom(roomName) {
    return this.emit("leave_room", { room: roomName });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      id: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Manually connect
  connect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
    return this;
  }

  // Manually disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    return this;
  }

  // Cleanup all event handlers
  cleanup() {
    if (this.socket) {
      // Remove all custom event handlers
      for (const [event, handlers] of this.eventHandlers) {
        for (const handler of handlers) {
          this.socket.off(event, handler);
        }
      }
      this.eventHandlers.clear();
    }
  }

  // Destroy the socket manager
  destroy() {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    console.log("SocketManager destroyed");
  }

  // Get the raw socket instance (use with caution)
  getSocket() {
    return this.socket;
  }
}

export default SocketManager;
