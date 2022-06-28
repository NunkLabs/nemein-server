import { WebSocketServer } from "ws";

import { TetrisSocket } from "./Socket";

const LAST_SEEN_DURATION = 120000;
const SWEEP_INTERVAL = 60000;

export class TetrisSocketServer extends WebSocketServer {
  sockets: Map<string, TetrisSocket>;

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
      });
    }, SWEEP_INTERVAL);
  }
}

export default TetrisSocketServer;
