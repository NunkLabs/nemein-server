import {
  Y_START,
  DEFAULT_BOARD_WIDTH,
  DEFAULT_BOARD_HEIGHT,
  TetrisBoard,
  TetrisCol,
} from "./TetrisBoard";

import {
  X_INDEX,
  Y_INDEX,
  DEFAULT_TEST_OVERWRITTEN_TETROMINO,
  TetrominoType,
  TetrominoRotation,
  TetrominoManager,
  Tetromino,
  TetrominoRotateDirection,
} from "./TetrominoManager";

/* Keyboard event consts */
export const ARROW_DOWN = "ArrowDown";
export const ARROW_LEFT = "ArrowLeft";
export const ARROW_UP = "ArrowUp";
export const ARROW_RIGHT = "ArrowRight";
export const SPACE = " ";
export const C_KEY = "c";
export const X_KEY = "x";
export const Z_KEY = "z";
export const SHIFT = "Shift";
export const CTRL = "Control";

/* FIXME: This is might not be correct */
export const NUMPAD_9 = "9";
export const NUMPAD_8 = "8";
export const NUMPAD_7 = "7";
export const NUMPAD_6 = "6";
export const NUMPAD_5 = "5";
export const NUMPAD_4 = "4";
export const NUMPAD_3 = "3";
export const NUMPAD_2 = "2";
export const NUMPAD_1 = "1";
export const NUMPAD_0 = "0";

export const KEYBOARD_EVENT = "keydown";

/* Timer consts */
export const DEFAULT_TIME_INTERVAL_MS = 1000;
export const EARLY_LEVEL_MULTIPLIER = 60;
export const LATE_LEVEL_MULTIPLIER = 0.5;
export const INTERVAL_CAP = 900;
export const LEVEL_UP_TETROMINOS_COUNT = 10;
export const LOCK_DELAY_MS = 500;

/* Enum types */
export enum Command {
  Left,
  Right,
  ClockwiseRotate,
  CounterclockwiseRotate,
  Down,
  HardDrop,
  HoldTetromino,
}

export type TetrisStates = {
  corX: number;
  corY: number;
  ghostCorY: number;
  heldTetromino: TetrominoType;
  activeTetromino: TetrominoType;
  activeTetrominoRotate: TetrominoRotation;
  spawnedTetrominos: TetrominoType[];
  field: TetrisCol[];
  gameOver: boolean;
  score: number;
  level: number;
  gameInterval: number;
};

export class Tetris {
  private boardWidth: number;

  private board: TetrisBoard;

  private onHold: boolean;

  /* cor = Center of rotation */
  private corX: number;

  private corY: number;

  private ghostCorY: number;

  private tetrominoManager: TetrominoManager;

  private initRender: boolean;

  private gameOver: boolean;

  private score: number;

  private tetrominosCount: number;

  private level: number;

  private gameInterval: number;

  constructor (
    boardWidth: number = DEFAULT_BOARD_WIDTH,
    boardHeight: number = DEFAULT_BOARD_HEIGHT,
    dbgOverwrittenTetromino: Tetromino = DEFAULT_TEST_OVERWRITTEN_TETROMINO,
    /* TBS-86: This is only for testing lock-delay */
    dbgOverwriteTimer: boolean = false,
  ) {
    this.boardWidth = boardWidth;
    this.board = new TetrisBoard(boardWidth, boardHeight);
    this.onHold = false;
    this.corX = boardWidth / 2;
    this.corY = Y_START;
    this.ghostCorY = Y_START;
    this.tetrominoManager = new TetrominoManager(dbgOverwrittenTetromino);
    this.initRender = true;
    this.gameOver = false;
    this.score = 0;
    this.tetrominosCount = 0;
    this.level = 1;
    this.gameInterval = (process.env.NODE_ENV === "test" && dbgOverwriteTimer) ?
      0 : DEFAULT_TIME_INTERVAL_MS;

    this.initNewGame();
  }

  /**
   * @brief: initNewGame: Init a new game by calculating new x value
   * and randomizing the new tetromino
   */
  private initNewGame(): void {
    /* Popping the first tetromino and update the tetrominos queue */
    const activeTetromino = this.tetrominoManager.getActiveTetromino();
    this.ghostCorY = this.board.prepareGhostTetrominoY(
      activeTetromino.type,
      activeTetromino.rotation
    );
  }

  /**
   * @brief: handleRotation - Handle rotation command. This function does a
   * bunchof wall kick test and renders the first one that passes
   * @param rotateDirection - Direction to rotate
   */
  private handleRotation(rotateDirection: TetrominoRotateDirection =
    TetrominoRotateDirection.Clockwise): void {
    const activeTetromino = this.tetrominoManager.getActiveTetromino();

    let testRotate = rotateDirection === TetrominoRotateDirection.Clockwise ?
      (activeTetromino.rotation + 1)
      : (activeTetromino.rotation - 1)
    if (testRotate >= TetrominoRotation.NumTetrominoRotations) {
      testRotate = TetrominoRotation.O;
    } else if (testRotate < TetrominoRotation.O) {
      testRotate = TetrominoRotation.L;
    }

    const testOffsetArr = TetrominoManager.getTetrominoWallKickOffsets(
      activeTetromino.type,
      activeTetromino.rotation,
      rotateDirection
    );

    /* SRS's wall-kick testing (https://harddrop.com/wiki/SRS) */
    for (
      let testOffsetIdx = 0;
      testOffsetIdx < testOffsetArr.length;
      testOffsetIdx += 1
    ) {
      const testOffset = testOffsetArr[testOffsetIdx];
      const testCorX = this.corX + testOffset[X_INDEX];
      const testCorY = this.corY + testOffset[Y_INDEX];

      if (
        this.board.isTetrominoRenderable(
          false,
          testCorX,
          testCorY,
          activeTetromino.type,
          testRotate
        )
      ) {
        this.corX = testCorX;
        this.corY = testCorY;
        const newActiveTetromino: Tetromino = {
          type: activeTetromino.type,
          rotation: testRotate,
        };
        this.tetrominoManager.setActiveTetromino(newActiveTetromino);
        break;
      }
    }
  }

  /**
   * @brief: handleBlockedMovement: Handler for blocked movements
   */
  private handleBlockedMovement(): void {
    /* Update the lowest pixel for each column */
    let activeTetromino = this.tetrominoManager.getActiveTetromino();
    this.board.updateColLowestY(
      this.corX,
      this.corY,
      activeTetromino.type,
      activeTetromino.rotation
    );

    const numLinesCompleted = this.board.clearLines();

    /* Prepare new tetromino for the next board update */
    activeTetromino = this.tetrominoManager.getNewTetromino();
    this.corX = Math.floor(this.boardWidth / 2);
    this.corY = Y_START;
    this.ghostCorY = this.board.findGhostTetrominoY(
      this.corX,
      this.corY,
      activeTetromino.type,
      activeTetromino.rotation
    );
    this.onHold = false;

    /**
     * Update score, tetrominos count, level and interval
     *
     * Updating scheme as follow:
     *  - Tetromino count: Increases by 1
     *  - Level: Increases by 1 after everytime the tetromino count is increased
     *      by LEVEL_UP_TETROMINOS_COUNT
     *  - Score: Increments with the current level
     *  - Game interval: We calculate the amount of time to subtract from the
     *      default game interval (DEFAULT_TIME_INTERVAL_MS) based on the
     *      current level
     */
    this.tetrominosCount += 1;
    /* TODO: Add a more complex scoring system */
    this.level =
      1 + Math.floor(this.tetrominosCount / LEVEL_UP_TETROMINOS_COUNT);
    this.score += numLinesCompleted * this.level;

    let newGameIntervalDecrease = this.level * EARLY_LEVEL_MULTIPLIER;
    if (newGameIntervalDecrease > INTERVAL_CAP) {
      newGameIntervalDecrease =
        INTERVAL_CAP + this.level * LATE_LEVEL_MULTIPLIER;
      if (newGameIntervalDecrease >= DEFAULT_TIME_INTERVAL_MS) {
        newGameIntervalDecrease = DEFAULT_TIME_INTERVAL_MS;
      }
    }
    this.gameInterval = DEFAULT_TIME_INTERVAL_MS - newGameIntervalDecrease;

    /* Check if game is over */
    if (
      !this.board.isTetrominoRenderable(
        true,
        this.corX,
        this.corY,
        activeTetromino.type,
        activeTetromino.rotation
      )
    ) {
      this.gameOver = true;
    }
  }

  /**
   * @brief: updateGameStates: Handler for each 'tick' of the game
   * or when a command is issued
   * @param: command - The command to be executed. The command is
   * always 'Down' for each tick of the game. If the command is undefined,
   * we simply return the current game states without making any changes
   * @return: Updated game states
   */
  public updateGameStates(command: Command | null = null): TetrisStates {
    let activeTetromino = this.tetrominoManager.getActiveTetromino();
    if (command !== null) {
      /* Handling init - We only render the newly spawned tetromino */
      if (this.initRender) {
        this.board.renderTetromino(
          this.corX,
          this.ghostCorY,
          activeTetromino.type,
          activeTetromino.rotation,
          TetrominoType.Ghost
        );
        this.board.renderTetromino(
          this.corX,
          this.corY,
          activeTetromino.type,
          activeTetromino.rotation,
          activeTetromino.type
        );
        this.initRender = false;
      } else {
        /**
         * Remove current tetromino from field for next logic by rendering
         * blank pixels onto the board
         */
        this.board.renderTetromino(
          this.corX,
          this.ghostCorY,
          activeTetromino.type,
          activeTetromino.rotation,
          TetrominoType.Blank
        );
        this.board.renderTetromino(
          this.corX,
          this.corY,
          activeTetromino.type,
          activeTetromino.rotation,
          TetrominoType.Blank
        );

        let yAddValid = true;
        let testCorX = 0;
        let testCorY = 0;

        /* Determine which value to be modified (x - y - rotate ?) */
        switch (command) {
          case Command.Left: {
            testCorX = this.corX - 1;

            if (
              this.board.isTetrominoRenderable(
                false,
                testCorX,
                this.corY,
                activeTetromino.type,
                activeTetromino.rotation
              )
            ) {
              this.corX = testCorX;
            }
            break;
          }
          case Command.Right: {
            testCorX = this.corX + 1;

            if (
              this.board.isTetrominoRenderable(
                false,
                testCorX,
                this.corY,
                activeTetromino.type,
                activeTetromino.rotation
              )
            ) {
              this.corX = testCorX;
            }
            break;
          }
          case Command.ClockwiseRotate: {
            this.handleRotation(TetrominoRotateDirection.Clockwise);
            break;
          }
          case Command.CounterclockwiseRotate: {
            this.handleRotation(TetrominoRotateDirection.Counterclockwise);
            break;
          }
          case Command.Down: {
            testCorY = this.corY + 1;
            yAddValid = this.board.isTetrominoRenderable(
              false,
              this.corX,
              testCorY,
              activeTetromino.type,
              activeTetromino.rotation
            );
            if (yAddValid) {
              this.corY = testCorY;
            }
            break;
          }
          case Command.HardDrop: {
            yAddValid = false;
            this.corY = this.ghostCorY;
            break;
          }
          case Command.HoldTetromino: {
            if (!this.onHold) {
              this.tetrominoManager.swapHeldTetromino();
              this.corX = Math.floor(this.boardWidth / 2);
              this.corY = Y_START;
              this.onHold = true;
            }
            break;
          }
          default: {
            /**
             * Here for supressing errors. We should never reach here as the input
             * should've been already sanitized by this point
             */
            break;
          }
        }

        /* Active Tetromino could have been changed, reread it here */
        activeTetromino = this.tetrominoManager.getActiveTetromino();
        /* Render new tetromino after the new coords are updated */
        this.ghostCorY = this.board.findGhostTetrominoY(
          this.corX,
          this.corY,
          activeTetromino.type,
          activeTetromino.rotation
        );
        this.board.renderTetromino(
          this.corX,
          this.ghostCorY,
          activeTetromino.type,
          activeTetromino.rotation,
          TetrominoType.Ghost
        );
        this.board.renderTetromino(
          this.corX,
          this.corY,
          activeTetromino.type,
          activeTetromino.rotation,
          activeTetromino.type
        );

        /* Handling blocked movement */
        if (!yAddValid) {
          this.handleBlockedMovement();
          /* Game over */
          if (!this.gameOver) {
            /**
             * TBS-36: Getting new tetromino to spawn immediately
             * This recursive call should not affect performance as we'd fall in
             * the init handling section of this function - which should return
             * anyway
             */
            return this.updateGameStates(Command.Down);
          }
        } else if (this.corY === this.ghostCorY &&
          this.gameInterval < LOCK_DELAY_MS) {
          this.gameInterval = LOCK_DELAY_MS;
        }
      }
    }

    return {
      corX: this.corX,
      corY: this.corY,
      ghostCorY: this.ghostCorY,
      heldTetromino: this.tetrominoManager.getHeldTetromino().type,
      activeTetromino: activeTetromino.type,
      activeTetrominoRotate: activeTetromino.rotation,
      field: this.board.getField(),
      spawnedTetrominos: <TetrominoType[]>(
        this.tetrominoManager.getSpawnedTetrominos(true)
      ),
      gameOver: this.gameOver,
      score: this.score,
      level: this.level,
      gameInterval: this.gameInterval,
    };
  }

  /**
   * @brief: inputHandle: Callback for the event of keyboard
   * input being received; translate the event keycode to the corresponding
   * command
   * @param: event - The keyboard event received
   * @return: Updated game states
   */
  public inputHandle(key: string): TetrisStates {
    let retCommand: Command = Command.Down;
    switch (key) {
      case NUMPAD_4:
      /* Fallthrough */
      case ARROW_LEFT:
        retCommand = Command.Left;
        break;
      case NUMPAD_6:
      /* Fallthrough */
      case ARROW_RIGHT:
        retCommand = Command.Right;
        break;
      case NUMPAD_1:
      /* Fallthrough */
      case NUMPAD_5:
      /* Fallthrough */
      case NUMPAD_9:
      /* Fallthrough */
      case X_KEY:
      /* Fallthrough */
      case ARROW_UP:
        retCommand = Command.ClockwiseRotate;
        break;
      case NUMPAD_3:
      /* Fallthrough */
      case NUMPAD_7:
      /* Fallthrough */
      case Z_KEY:
      /* Fallthrough */
      case CTRL:
        retCommand = Command.CounterclockwiseRotate;
        break;
      case NUMPAD_8:
      /* Fallthrough */
      case SPACE:
        retCommand = Command.HardDrop;
        break;
      case NUMPAD_0:
      /* Fallthrough */
      case C_KEY:
      /* Fallthrough */
      case SHIFT:
        retCommand = Command.HoldTetromino;
        break;
      default:
        break;
    }

    return this.updateGameStates(retCommand);
  }
}

export default Tetris;
