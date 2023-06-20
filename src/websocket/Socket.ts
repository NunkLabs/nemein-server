import { WebSocket } from "ws";

import {
  ClassicCommand,
  Classic,
  ClassicStates,
} from "../core/classic/Classic.js";
import { NemeinCommand, Nemein, NemeinStates } from "../core/nemein/Nemein.js";

const DEFAULT_WS_CLOSURE = 1000;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 5000;
const SPACE = " ";

const Opcodes = {
  OPEN: 0, // Socketed is opened
  READY: 1, // Socket is ready
  DATA: 2, // Socket received data
  INPUT: 3, // Socket received game input
  TOGGLE: 4, // Socket received a game state toggle command
  PING: 9, // Socket received a ping command
  HEARTBEAT: 10, // Socket received a heartbeat
};

type SocketData = {
  op: number;
  timestamp?: number;
  data?: object | string;
  heartbeat?: number;
};

export class Socket {
  private socket: WebSocket;

  private active: boolean;

  private instance: Classic | Nemein | null;

  private timeout: NodeJS.Timeout | null;

  id: string;

  timestamp: number;

  constructor(id: string, socket: WebSocket) {
    this.id = id;
    this.socket = socket;
    this.active = false;
    this.instance = null;
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
    /* Specifies client's heartbeat on open */
    this.send({
      op: Opcodes.OPEN,
      heartbeat: DEFAULT_HEARTBEAT_INTERVAL_MS,
    });

    let gameStates: ClassicStates | NemeinStates;

    /* Sends updated game states after an interval */
    const timeout = () => {
      if (this.active && this.instance) {
        gameStates =
          this.instance instanceof Nemein
            ? this.instance.updateNemeinStates(NemeinCommand.TickDown)
            : this.instance.updateClassicStates(ClassicCommand.Down);

        this.send({
          op: Opcodes.DATA,
          data: gameStates,
        });

        if (gameStates.gameOver) {
          this.active = false;

          if (this.timeout) {
            clearTimeout(this.timeout);

            this.timeout = null;
          }

          return;
        }
      }

      this.timeout = setTimeout(timeout, gameStates.gameInterval);
    };

    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      switch (message.op) {
        case Opcodes.READY: {
          this.active = true;

          this.instance =
            message.data === "nemein" ? new Nemein() : new Classic();

          gameStates =
            this.instance instanceof Nemein
              ? this.instance.updateNemeinStates()
              : this.instance.updateClassicStates();

          this.send({
            op: Opcodes.READY,
            data: gameStates,
          });

          this.timeout = setTimeout(timeout, gameStates.gameInterval);

          break;
        }

        case Opcodes.INPUT: {
          if (!this.instance) return;

          /* Updates and sends the game state after registering an input */
          gameStates = this.instance.inputHandle(message.data);

          this.send({
            op: Opcodes.DATA,
            data: gameStates,
          });

          if (message.data !== SPACE || !this.timeout) return;

          clearTimeout(this.timeout);

          this.timeout = setTimeout(timeout, gameStates.gameInterval);

          break;
        }

        case Opcodes.TOGGLE: {
          this.active = !this.active;

          this.send({ op: Opcodes.TOGGLE });

          break;
        }

        case Opcodes.PING: {
          this.send({
            op: Opcodes.PING,
            timestamp: message.timestamp,
          });

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

export default Socket;
