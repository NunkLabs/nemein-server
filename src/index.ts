import * as dotenv from "dotenv";
import { nanoid } from "nanoid";

import { SocketServer } from "./websocket/Server.js";
import { Socket } from "./websocket/Socket.js";
import logger from "./utils/Logger.js";

dotenv.config();

const server = new SocketServer({ port: process.env.PORT || 8080 });

server.on("connection", (socket) => {
  const id = nanoid();

  const gameSocket = new Socket(id, socket);

  server.sockets.set(id, gameSocket);

  socket
    .on("error", (err) => {
      logger.error(err.stack);

      gameSocket.destroy();

      server.sockets.delete(id);
    })
    .on("close", () => {
      logger.info(`[Socket]: Connection ended with client (ID: ${id})`);

      gameSocket.destroy();

      server.sockets.delete(id);
    });

  logger.info(`[Socket]: Connection established with client (ID: ${id})`);
});
