import { WebSocket } from "ws";

import {
  ClassicCommand,
  Classic,
  ClassicStates,
} from "../core/classic/Classic.js";
import { NemeinCommand, Nemein, NemeinStates } from "../core/nemein/Nemein.js";

const DEFAULT_HEARTBEAT_INTERVAL_MS = 5000;
const SPACE_KEY = " ";

enum Opcodes {
  /* Base socket events */
  SOCKET_OPEN,
  SOCKET_READY,
  SOCKET_PING,
  SOCKET_HEARTBEAT,

  /* Game events */
  GAME_KEYDOWN,
  GAME_STATES,
  GAME_TOGGLE,
}

type GameInstance =
  | {
      type: "classic";
      game: Classic;
      states: ClassicStates | null;
      interval: NodeJS.Timer | null;
    }
  | {
      type: "nemein";
      game: Nemein;
      states: NemeinStates | null;
      interval: NodeJS.Timer | null;
    };

type SocketOpen = {
  op: Opcodes.SOCKET_OPEN;
  data: number;
};

type SocketReady = {
  op: Opcodes.SOCKET_READY;
  data: "classic" | "nemein";
};

type SocketPing = {
  op: Opcodes.SOCKET_PING;
  data: number;
};

type SocketHeartbeat = {
  op: Opcodes.SOCKET_HEARTBEAT;
  data: number;
};

type SocketGameKeydown = {
  op: Opcodes.GAME_KEYDOWN;
  data: string;
};

type SocketGameStates = {
  op: Opcodes.GAME_STATES;
  data: ClassicStates | NemeinStates;
};

type SocketGameToggle = {
  op: Opcodes.GAME_TOGGLE;
  data: boolean;
};

type SocketData =
  | SocketOpen
  | SocketReady
  | SocketPing
  | SocketHeartbeat
  | SocketGameKeydown
  | SocketGameStates
  | SocketGameToggle;

export class Socket {
  private socket: WebSocket;

  private active: boolean;

  private instance: GameInstance;

  id: string;

  timestamp: number;

  constructor(id: string, socket: WebSocket) {
    this.socket = socket;

    this.active = false;

    this.instance = {
      type: "nemein",
      game: new Nemein(),
      states: null,
      interval: null,
    };

    this.id = id;

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
      op: Opcodes.SOCKET_OPEN,
      data: DEFAULT_HEARTBEAT_INTERVAL_MS,
    });

    /* Sends updated game states after an interval */
    const gameUpdateInterval = () => {
      if (!this.active || !this.instance.game) return;

      const { type, game } = this.instance;

      this.instance.states =
        type === "nemein"
          ? game.updateNemeinStates(NemeinCommand.TickDown)
          : game.updateClassicStates(ClassicCommand.Down);

      this.send({
        op: Opcodes.GAME_STATES,
        data: this.instance.states,
      });

      if (!this.instance.states.gameOver) return;

      this.active = false;

      if (!this.instance.interval) return;

      clearInterval(this.instance.interval);

      this.instance.interval = null;
    };

    this.socket.on("message", (message) => {
      const { op, data }: SocketData = JSON.parse(message.toString());

      switch (op) {
        case Opcodes.SOCKET_READY: {
          this.active = true;

          this.instance =
            data === "nemein"
              ? {
                  type: data,
                  game: new Nemein(),
                  states: null,
                  interval: null,
                }
              : {
                  type: data,
                  game: new Classic(),
                  states: null,
                  interval: null,
                };

          this.send({
            op: Opcodes.SOCKET_READY,
            data: this.instance.type,
          });

          const { type, game } = this.instance;

          this.instance.states =
            type === "nemein"
              ? game.updateNemeinStates()
              : game.updateClassicStates();

          this.send({
            op: Opcodes.GAME_STATES,
            data: this.instance.states,
          });

          this.instance.interval = setInterval(
            gameUpdateInterval,
            this.instance.states.gameInterval
          );

          break;
        }

        case Opcodes.SOCKET_PING: {
          this.send({
            op: Opcodes.SOCKET_PING,
            data,
          });

          break;
        }

        case Opcodes.SOCKET_HEARTBEAT: {
          /* Updates the last seen timestamp */
          const clientTimestamp = data;

          this.timestamp = clientTimestamp;

          this.send({
            op: Opcodes.SOCKET_HEARTBEAT,
            data: this.timestamp,
          });

          break;
        }

        case Opcodes.GAME_KEYDOWN: {
          if (!this.instance.game) return;

          /* Updates and sends the game state after registering an input */
          const key = data;

          this.instance.states = this.instance.game.inputHandle(key);

          this.send({
            op: Opcodes.GAME_STATES,
            data: this.instance.states,
          });

          if (key !== SPACE_KEY || !this.instance.interval) return;

          clearInterval(this.instance.interval);

          this.instance.interval = setInterval(
            gameUpdateInterval,
            this.instance.states.gameInterval
          );

          break;
        }

        case Opcodes.GAME_TOGGLE: {
          this.active = data;

          this.send({
            op: Opcodes.GAME_TOGGLE,
            data: this.active,
          });

          break;
        }

        default:
      }
    });
  }

  /**
   * @brief: destroy: This function cleans up the current Tetris server socket
   * by clearing the game interval and closing the connection.
   */
  destroy() {
    if (this.instance.interval) clearInterval(this.instance.interval);

    if (!this.socket) return;

    this.socket.removeAllListeners();

    this.socket.terminate();
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
