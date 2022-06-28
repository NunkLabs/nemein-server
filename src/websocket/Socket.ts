import { WebSocket } from "ws";

import { Command, Tetris, TetrisStates } from "../core/Tetris";

const DEFAULT_WS_CLOSURE = 1000;
const DEFAULT_HEARTBEAT_INTERVAL = 30000;
const SPACE = " ";

const Opcodes = {
  READY: 1, // Socket is ready
  DATA: 2, // Socket received data
  INPUT: 3, // Socket received game input
  TOGGLE: 4, // Socket received a game state toggle command
  RESTART: 5, // Socket received a restart command
  HEARTBEAT: 10, // Socket received a heartbeat
};

type SocketData = {
  op: number;
  data?: object | string;
  heartbeat?: number;
};

export class TetrisSocket {
  private socket: WebSocket;

  private tetris: Tetris;

  private state: TetrisStates;

  private active: boolean;

  private timeout: NodeJS.Timeout | null;

  id: string;

  timestamp: number;

  constructor(id: string, socket: WebSocket, tetris: Tetris) {
    this.id = id;
    this.socket = socket;
    this.tetris = tetris;
    this.state = tetris.updateGameStates();
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
    this.active = true;

    /* Sends the initial game state and specify client's heartbeat */
    this.send({
      op: Opcodes.READY,
      data: this.state,
      heartbeat: DEFAULT_HEARTBEAT_INTERVAL,
    });

    /* Sends updated game states after an interval */
    const timeout = () => {
      if (this.active) {
        this.state = this.tetris.updateGameStates(Command.Down);

        this.send({
          op: Opcodes.DATA,
          data: this.state,
        });

        if (this.state.gameOver) {
          this.active = false;
        }
      }

      this.timeout = setTimeout(timeout, this.state?.gameInterval);
    };

    this.timeout = setTimeout(timeout, this.state.gameInterval);

    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      switch (message.op) {
        case Opcodes.TOGGLE: {
          this.active = !this.active;

          break;
        }

        case Opcodes.RESTART: {
          this.tetris = new Tetris();

          this.state = this.tetris.updateGameStates();

          this.send({
            op: Opcodes.DATA,
            data: this.state,
          });

          break;
        }

        case Opcodes.INPUT: {
          if (this.state.gameOver) return;

          /* Sends the updated game state after registering an input */
          this.send({
            op: Opcodes.DATA,
            data: this.tetris.inputHandle(message.data),
          });

          if (message.data !== SPACE || !this.timeout) return;

          clearTimeout(this.timeout);

          this.timeout = setTimeout(timeout, this.state.gameInterval);

          break;
        }

        case Opcodes.HEARTBEAT: {
          /* Updates the last seen timestamp */
          this.timestamp = Date.now();

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
