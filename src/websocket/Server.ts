import { WebSocketServer } from "ws";

import { Socket } from "./Socket.js";
import logger from "../utils/Logger.js";

const LAST_SEEN_DURATION = 120000;
const SWEEP_INTERVAL = 60000;

export class SocketServer extends WebSocketServer {
  sockets: Map<string, Socket>;

  constructor(options = {}) {
    super(options);

    this.sockets = new Map();

    this.init();
  }

  init() {
    /* Sweeps sockets after they become inactive for too long */
    setInterval(() => {
      const currentTimestamp = Date.now();

      this.sockets.forEach((socket) => {
        if (currentTimestamp - socket.timestamp < LAST_SEEN_DURATION) return;

        socket.destroy();

        this.sockets.delete(socket.id);

        logger.info(
          `[Socket]: Connection ended with client (ID: ${socket.id})`,
        );
      });
    }, SWEEP_INTERVAL);
  }
}

export default SocketServer;
