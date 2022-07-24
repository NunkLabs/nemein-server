import * as dotenv from "dotenv";
import { nanoid } from "nanoid";

import { Tetris } from "./core/Tetris.js";
import { TetrisSocket } from "./websocket/Socket.js";
import { TetrisSocketServer } from "./websocket/Server.js";

dotenv.config();

const server = new TetrisSocketServer({ port: process.env.PORT });

server.on("connection", (socket) => {
  const id = nanoid();

  server.sockets.set(id, new TetrisSocket(id, socket, new Tetris()));
});
