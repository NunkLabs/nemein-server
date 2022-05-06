import { WebSocketServer } from "ws";

import Tetris from "./core/tetris";

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {
  const game = new Tetris();

  /* Sends initial game state on open */
  socket.send(JSON.stringify(game));

  /* Sends game state every second */
  const interval = setInterval(async () => {
    socket.send(JSON.stringify(game.handleBoardUpdate()));
  }, 1000);

  socket.on("message", (data) => {
    /* Handles input and sends updated game state */
    socket.send(JSON.stringify(game.inputHandle(data.toString())));
  });

  socket.on("close", () => {
    clearInterval(interval);
  });
});
