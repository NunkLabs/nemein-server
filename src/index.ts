import * as dotenv from "dotenv";
import { nanoid } from "nanoid";

import { Tetris } from "./core/Tetris";
import { TetrisSocket } from "./websocket/Socket";
import { TetrisSocketServer } from "./websocket/Server";

dotenv.config({ path: `${__dirname}/.env` });

const server = new TetrisSocketServer({ port: process.env.PORT });

server.on("connection", (socket) => {
  const id = nanoid();

  server.sockets.set(id, new TetrisSocket(id, socket, new Tetris()));
});
