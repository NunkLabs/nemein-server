import { WebSocket } from "ws";

import { Command, Tetris } from "../core/Tetris.js";

const DEFAULT_WS_CLOSURE = 1000;
const DEFAULT_HEARTBEAT_INTERVAL = 5000;
const SPACE = " ";

const Opcodes = {
  OPEN: 0, // Socketed is opened
  READY: 1, // Socket is ready
  DATA: 2, // Socket received data
  INPUT: 3, // Socket received game input
  TOGGLE: 4, // Socket received a game state toggle command
  RESTART: 5, // Socket received a restart command
  PING: 9, // Socket received a ping command
  HEARTBEAT: 10, // Socket received a heartbeat
};

type SocketData = {
  op: number;
  timestamp: number;
  data?: object | string;
  heartbeat?: number;
};

export class TetrisSocket {
  private socket: WebSocket;

  private active: boolean;

  private timeout: NodeJS.Timeout | null;

  id: string;

  timestamp: number;

  constructor(id: string, socket: WebSocket) {
    this.id = id;
    this.socket = socket;
    this.active = false;
    this.timeout = null;
    this.timestamp = Date.now();

    this.init();
  }

  /**
   * @brief: init: This function initializes a new Tetris server socket by
   * providing the client with the initial game data as well as setting up game
   * intervals and socket events.
   */
  init() {
    /* Sends the initial game  and specify client's heartbeat */
    this.send({
      op: Opcodes.OPEN,
      timestamp: Date.now(),
      heartbeat: DEFAULT_HEARTBEAT_INTERVAL,
    });

    this.active = true;

    let gameInstance = new Tetris();
    let gameState = gameInstance.updateGameStates();

    this.send({
      op: Opcodes.READY,
      timestamp: Date.now(),
      data: gameState,
    });

    /* Sends updated game states after an interval */
    const timeout = () => {
      if (this.active) {
        gameState = gameInstance.updateGameStates(Command.Down);

        this.send({
          op: Opcodes.DATA,
          timestamp: Date.now(),
          data: gameState,
        });

        if (gameState.gameOver) {
          this.active = false;
        }
      }

      this.timeout = setTimeout(timeout, gameState.gameInterval);
    };

    this.timeout = setTimeout(timeout, gameState.gameInterval);

    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      switch (message.op) {
        case Opcodes.TOGGLE: {
          this.active = !this.active;

          break;
        }

        case Opcodes.RESTART: {
          gameInstance = new Tetris();

          gameState = gameInstance.updateGameStates();

          this.send({
            op: Opcodes.DATA,
            timestamp: Date.now(),
            data: gameState,
          });

          break;
        }

        case Opcodes.INPUT: {
          if (gameState.gameOver) return;

          /* Sends the updated game state after registering an input */
          this.send({
            op: Opcodes.DATA,
            timestamp: Date.now(),
            data: gameInstance.inputHandle(message.data),
          });

          if (message.data !== SPACE || !this.timeout) return;

          clearTimeout(this.timeout);

          this.timeout = setTimeout(timeout, gameState.gameInterval);

          break;
        }

        case Opcodes.HEARTBEAT: {
          /* Updates the last seen timestamp */
          this.timestamp = Date.now();

          this.send({
            op: Opcodes.HEARTBEAT,
            timestamp: message.timestamp,
          });

          break;
        }

        case Opcodes.PING: {
          this.send({
            op: Opcodes.PING,
            timestamp: message.timestamp,
          });

          break;
        }

        default:
      }
    });
  }

  /**
   * @brief: destroy: This function cleans up the current Tetris server socket
   * by clearing the game timeout and closing the connection.
   */
  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    this.socket.close(DEFAULT_WS_CLOSURE);
  }

  /**
   * @brief: send: This function handles outgoing communications with the client
   * @param:   {SocketData}   data   Data to send to the client
   */
  send(data: SocketData) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    this.socket.send(JSON.stringify(data));
  }
}

export default TetrisSocket;
