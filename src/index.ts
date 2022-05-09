import { WebSocketServer } from "ws";

import * as Tetris from "./core/tetris";

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {
  const game = new Tetris.Tetris();

  /* Sends the initial game state on open */
  let gameState = game.updateGameStates(undefined);

  socket.send(JSON.stringify(gameState));

  /* Sends the updated game state after an interval */
  const gameTimeout = () => {
    if (gameState.gameOver) return;

    gameState = game.updateGameStates(Tetris.Command.Down);

    socket.send(JSON.stringify(gameState));

    /* We use setTimeout recursively to simulate a dynamic interval */
    setTimeout(gameTimeout, gameState.gameInterval);
  };

  setTimeout(gameTimeout, Tetris.DEFAULT_TIME_INTERVAL_MS)

  /* Sends the updated game state after registering an input */
  socket.on("message", (data) => {
    if (gameState.gameOver) return;

    socket.send(JSON.stringify(game.inputHandle(data.toString())));
  });
});
