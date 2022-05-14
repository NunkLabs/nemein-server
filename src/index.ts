import { WebSocketServer } from "ws";

import { Command, Tetris } from "./core/Tetris";

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {
  /* Sends the initial game state on open */
  let active = true;
  let game = new Tetris();
  let gameState = game.updateGameStates();

  socket.send(JSON.stringify(gameState));

  /* Sends the updated game state after an interval */
  const gameTimeout = () => {
    if (active) {
      gameState = game.updateGameStates(Command.Down);

      socket.send(JSON.stringify(gameState));

      if (gameState.gameOver) {
        active = false;
      }
    }

    /* We use setTimeout recursively to simulate a dynamic interval */
    setTimeout(gameTimeout, gameState.gameInterval);
  };

  setTimeout(gameTimeout, gameState.gameInterval);

  socket.on("message", (data) => {
    const input = data.toString();

    switch (input) {
      case "ToggleGame": {
        active = !active;

        break;
      }
      case "Restart": {
        game = new Tetris();
        gameState = game.updateGameStates();

        socket.send(JSON.stringify(gameState));

        break;
      }
      default: {
        if (gameState.gameOver) return;

        /* Sends the updated game state after registering an input */
        socket.send(JSON.stringify(game.inputHandle(input)));
      }
    }
  });
});
