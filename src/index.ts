import { WebSocketServer } from "ws";

import { Command, Tetris } from "./core/tetris";

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {
  const game = new Tetris();

  /* Sends the initial game state on open */
  let gameState = game.updateGameStates();

  socket.send(JSON.stringify(gameState));

  /* Sends the updated game state after an interval */
  const gameTimeout = () => {
    if (gameState.gameOver) return;

    gameState = game.updateGameStates(Command.Down);

    socket.send(JSON.stringify(gameState));

    /* We use setTimeout recursively to simulate a dynamic interval */
    setTimeout(gameTimeout, gameState.gameInterval);
  };

  setTimeout(gameTimeout, gameState.gameInterval)

  /* Sends the updated game state after registering an input */
  socket.on("message", (data) => {
    if (gameState.gameOver) return;

    socket.send(JSON.stringify(game.inputHandle(data.toString())));
  });
});
