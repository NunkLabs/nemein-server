import { WebSocketServer } from "ws";

import { Command, Tetris } from "./core/Tetris";

const SPACE = " ";

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {
  /* Sends the initial game state on open */
  let active = true;
  let game = new Tetris();
  let state = game.updateGameStates();
  let timeout: NodeJS.Timeout | null = null;

  socket.send(JSON.stringify(state));

  /* Sends the updated game state after an interval */
  const gameTimeout = () => {
    if (active) {
      state = game.updateGameStates(Command.Down);

      socket.send(JSON.stringify(state));

      if (state.gameOver) {
        active = false;
      }
    }

    /* We use setTimeout recursively to simulate a dynamic interval */
    timeout = setTimeout(gameTimeout, state.gameInterval);
  };

  timeout = setTimeout(gameTimeout, state.gameInterval);

  socket.on("message", (data) => {
    const input = data.toString();

    switch (input) {
      case "ToggleGame": {
        active = !active;

        break;
      }
      case "Restart": {
        game = new Tetris();
        state = game.updateGameStates();

        socket.send(JSON.stringify(state));

        break;
      }
      default: {
        if (state.gameOver) return;

        /* Sends the updated game state after registering an input */
        socket.send(JSON.stringify(game.inputHandle(input)));

        if (input !== SPACE || !timeout) return;

        clearTimeout(timeout);

        timeout = setTimeout(gameTimeout, state.gameInterval);
      }
    }
  });
});
