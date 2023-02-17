import * as dotenv from "dotenv";
import { nanoid } from "nanoid";

import { Tetris } from "./core/Tetris.js";
import { TetrisSocket } from "./websocket/Socket.js";
import { TetrisSocketServer } from "./websocket/Server.js";
import logger from "./utils/Logger.js";

dotenv.config();

const server = new TetrisSocketServer({ port: process.env.PORT || 8080 });

server.on("connection", (socket) => {
  const id = nanoid();

  server.sockets.set(id, new TetrisSocket(id, socket, new Tetris()));

  logger.info(`[Socket]: Connection established with client (ID: ${id})`);
});
