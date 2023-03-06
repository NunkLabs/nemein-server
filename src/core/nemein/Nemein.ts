import {
  Y_START,
  DEFAULT_BOARD_WIDTH,
  DEFAULT_BOARD_HEIGHT,
  TetrisBoard,
  NemeinCol,
} from "./Board.js";

import {
  X_INDEX,
  Y_INDEX,
  DEFAULT_TEST_OVERWRITTEN_TETROMINO,
  TetrominoType,
  TetrominoRotation,
  TetrominoManager,
  Tetromino,
  TetrominoRotateDirection,
} from "./TetrominoManager.js";

import logger from "../../utils/Logger.js";

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

/* FIXME: This might not be correct */
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
export const LOCK_DELAY_MS = 500;

/* Level consts */
export const VARIABLE_GOAL_MULTIPLIER = 10;

/* Misc const */
export const DEFAULT_NUM_TICKS_PER_GREY_LINE_SPAWNED = 10;

/* Enum types */
export enum NemeinCommand {
  Left,
  Right,
  ClockwiseRotate,
  CounterclockwiseRotate,
  TickDown,
  Down,
  HardDrop,
  HoldTetromino,
}
export enum LineValue {
  None = 0,
  Single = 1,
  Double = 2,
  Triple = 3,
  Tetris = 4,
}

export type NemeinStates = {
  corX: number;
  corY: number;
  ghostCorY: number;
  heldTetromino: TetrominoType;
  activeTetromino: TetrominoType;
  activeTetrominoRotate: TetrominoRotation;
  spawnedTetrominos: TetrominoType[];
  field: NemeinCol[];
  gameOver: boolean;
  score: number;
  level: number;
  gameInterval: number;
};

export class Nemein {
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

  /* Available for integration into TetrisStates and render on client */
  private linesCleared: number;

  private level: number;

  private gameInterval: number;

  private isTspin: boolean;

  private wasPreviouslyTetris: boolean;

  private isLockDelayEnabled: boolean;

  private prevGameInterval: number;

  private numTicks: number;

  private ticksPerGreyLineSpawned: number;

  constructor(
    boardWidth: number = DEFAULT_BOARD_WIDTH,
    boardHeight: number = DEFAULT_BOARD_HEIGHT,
    dbgOverwrittenTetromino: Tetromino = DEFAULT_TEST_OVERWRITTEN_TETROMINO,
    /* TBS-86: This is only for testing lock-delay */
    dbgOverwriteTimer: boolean = false
  ) {
    this.boardWidth = boardWidth;
    this.board = new TetrisBoard(boardWidth, boardHeight);
    this.onHold = false;
    this.corX = Math.floor((boardWidth - 1) / 2);
    this.corY = Y_START;
    this.ghostCorY = Y_START;
    this.tetrominoManager = new TetrominoManager(dbgOverwrittenTetromino);
    this.initRender = true;
    this.gameOver = false;
    this.score = 0;
    this.linesCleared = 0;
    this.level = 1;
    this.gameInterval =
      process.env.NODE_ENV === "test" && dbgOverwriteTimer
        ? 0
        : DEFAULT_TIME_INTERVAL_MS;
    this.isTspin = false;
    this.wasPreviouslyTetris = false;
    this.isLockDelayEnabled = false;
    this.prevGameInterval = DEFAULT_TIME_INTERVAL_MS;
    this.numTicks = 0;
    this.ticksPerGreyLineSpawned = DEFAULT_NUM_TICKS_PER_GREY_LINE_SPAWNED;

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
   * bunch of wall kick test and renders the first one that passes
   * @param rotateDirection - Direction to rotate
   */
  private handleRotation(
    rotateDirection: TetrominoRotateDirection = TetrominoRotateDirection.Clockwise
  ): void {
    const activeTetromino = this.tetrominoManager.getActiveTetromino();

    let testRotate =
      rotateDirection === TetrominoRotateDirection.Clockwise
        ? activeTetromino.rotation + 1
        : activeTetromino.rotation - 1;
    /* Wrap around if reaching rotations limits */
    if (testRotate >= TetrominoRotation.NumTetrominoRotations) {
      testRotate = TetrominoRotation.O;
    } else if (testRotate < TetrominoRotation.O) {
      testRotate = TetrominoRotation.L;
    }

    /**
     * We'll test to see if the rotation is valid by using
     * SRS's wall-kick testing (https://harddrop.com/wiki/SRS)
     */
    const testOffsetArr = TetrominoManager.getTetrominoWallKickOffsets(
      activeTetromino.type,
      activeTetromino.rotation,
      rotateDirection
    );
    for (
      let testOffsetIdx = 0;
      testOffsetIdx < testOffsetArr.length;
      testOffsetIdx += 1
    ) {
      const testOffset = testOffsetArr[testOffsetIdx];
      const testCorX = this.corX + testOffset[X_INDEX];
      const testCorY = this.corY + testOffset[Y_INDEX];

      /**
       * We'll evalute the first renderable tetromino and if it's valid,
       * we'll use this rotation's wall kick
       */
      if (
        this.board.isTetrominoRenderable(
          false,
          testCorX,
          testCorY,
          activeTetromino.type,
          testRotate
        )
      ) {
        /**
         * Detecting T-Spin
         * A T-Spin is valid if it satisfies the following 3 requirements:
         * 1. Current tetromino is a T
         * 2. Current tetromino is under lock-delay
         * 3. Current tetromino cannot move horizontally
         */
        if (
          this.isLockDelayEnabled &&
          activeTetromino.type === TetrominoType.T
        ) {
          const isAbleToMoveHorizontally =
            this.board.isTetrominoRenderable(
              false,
              this.corX + 1,
              this.corY,
              activeTetromino.type,
              activeTetromino.rotation
            ) ||
            this.board.isTetrominoRenderable(
              false,
              this.corX - 1,
              this.corY,
              activeTetromino.type,
              activeTetromino.rotation
            );
          this.isTspin = !isAbleToMoveHorizontally;
        }

        /* Update the current tetromino for next tick's render */
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
   *
   * @return true if game is over. False otw
   */
  private handleBlockedMovement(): boolean {
    let ret = true;

    /* Update the lowest pixel for each column */
    let activeTetromino = this.tetrominoManager.getActiveTetromino();
    this.board.updateColLowestY(
      this.corX,
      this.corY,
      activeTetromino.type,
      activeTetromino.rotation
    );

    /* Prepare new tetromino for the next board update */
    activeTetromino = this.tetrominoManager.getNewTetromino();
    this.corX = Math.floor((this.boardWidth - 1) / 2);
    this.corY = Y_START;
    this.ghostCorY = this.board.findGhostTetrominoY(
      this.corX,
      this.corY,
      activeTetromino.type,
      activeTetromino.rotation
    );
    this.onHold = false;

    /**
     * Update score, tetrominos count, level and difficulty
     *
     * Updating scheme as follow:
     *  - Score: Increments based on Tetris World's rules (see
     *      https://tetris.fandom.com/wiki/Tetris_Worlds)
     *  - Reset previously Tetris & T-spin flag if was previously enabled
     *  - Level: Increments by 1 after everytime current score reaches/exceeds
     *      the value of current level * VARIABLE_GOAL_MULTIPLIER (default is 10).
     *      By default this value is 5 but it progresses too fast
     *  -Difficulty:
     *      Spawn 1 new challenge line after every x ticks
     *      Number of ticks per spawn (x) will decrease (scaled by game level)
     */

    /* We first calculate dmg (if any) dealt by the user by forming lines */
    const info = this.board.calculateDmgPool();

    /* Then we attempt to clear these lines given the damage pool we calcuated */
    const numLinesCompleted = this.board.clearLines(info);

    this.linesCleared += numLinesCompleted;
    let currTetris = false;
    let scoreToAdd = 0;
    switch (numLinesCompleted) {
      case LineValue.None:
        scoreToAdd = this.isTspin ? 1 : 0;
        break;
      case LineValue.Single:
        scoreToAdd = this.isTspin ? 3 : 1;
        break;
      case LineValue.Double:
        scoreToAdd = this.isTspin ? 7 : 3;
        break;
      case LineValue.Triple:
        scoreToAdd = this.isTspin ? 6 : 5;
        break;
      case LineValue.Tetris:
        currTetris = true;
        scoreToAdd = this.wasPreviouslyTetris ? 12 : 8;
        break;
      default:
        break;
    }
    this.score += scoreToAdd;

    /**
     * Determine the next level. In case the user manages to scores
     * a value which passes the next level's threshold, this logic
     * is necessary to set the level correct in a single tick
     */
    let testLvl = this.level;
    for (;;) {
      if (this.score < testLvl * VARIABLE_GOAL_MULTIPLIER && testLvl !== 1) {
        const lvlToSet = testLvl - 1;
        if (lvlToSet !== this.level && this.ticksPerGreyLineSpawned !== 1) {
          this.ticksPerGreyLineSpawned -= 1;
        }
        this.level = lvlToSet;
        break;
      }
      testLvl += 1;
    }
    this.isLockDelayEnabled = false;
    this.wasPreviouslyTetris = currTetris;
    this.isTspin = false;

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
      ret = false;
    }

    return ret;
  }

  /**
   * @brief: updateNemeinStates: Handler for each 'tick' of the game
   * or when a command is issued
   * @param: command - The command to be executed. The command is
   * always 'Down' for each tick of the game. If the command is undefined,
   * we simply return the current game states without making any changes
   * @return: Updated game states
   */
  public updateNemeinStates(
    command: NemeinCommand | null = null
  ): NemeinStates {
    let activeTetromino = this.tetrominoManager.getActiveTetromino();
    if (command !== null && !this.gameOver) {
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
          case NemeinCommand.Left: {
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
          case NemeinCommand.Right: {
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
          case NemeinCommand.ClockwiseRotate: {
            this.handleRotation(TetrominoRotateDirection.Clockwise);
            break;
          }
          case NemeinCommand.CounterclockwiseRotate: {
            this.handleRotation(TetrominoRotateDirection.Counterclockwise);
            break;
          }
          case NemeinCommand.TickDown: {
            /**
             * This command is technically Command.Down but with the addition for
             * increasing the number of ticks and spawning challenge lines
             * if certain ticks conditions are met
             */
            this.numTicks = (this.numTicks + 1) % this.ticksPerGreyLineSpawned;
            if (this.numTicks === 0) {
              this.board.spawnChallengeLine();
            }
            /* Fallthrough */
          }
          case NemeinCommand.Down: {
            testCorY = this.corY + 1;
            yAddValid = this.board.isTetrominoRenderable(
              false,
              this.corX,
              testCorY,
              activeTetromino.type,
              activeTetromino.rotation
            );
            if (yAddValid) {
              /* If lock-delay was enabled, getting here means that the user
              has managed to get the current Tetromino out of the blocked state
              within the 500ms delay. We then resume the Tetromino's state to
              its normal state and restore the previous game interval */
              if (this.isLockDelayEnabled) {
                this.isLockDelayEnabled = false;
                this.gameInterval = this.prevGameInterval;
              }
              this.corY = testCorY;
            }
            break;
          }
          case NemeinCommand.HardDrop: {
            yAddValid = false;
            this.corY = this.ghostCorY;
            break;
          }
          case NemeinCommand.HoldTetromino: {
            if (!this.onHold) {
              this.tetrominoManager.swapHeldTetromino();
              this.corX = Math.floor(this.boardWidth / 2);
              this.corY = Y_START;
              this.onHold = true;
              this.isLockDelayEnabled = false;
              this.gameInterval = this.prevGameInterval;
            }
            break;
          }
          default: {
            /**
             * Here for supressing errors. We should never reach here as the input
             * should've been already sanitized by this point
             */
            logger.error(`[Tetris] Unknown command ${command}`);
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

        /**
         * We'll have to continuously store the game interval to restore it
         * correctly when corner cases happen (i.e. lock delay + tetromino hold)
         */
        if (this.gameInterval !== LOCK_DELAY_MS) {
          this.prevGameInterval = this.gameInterval;
        }

        if (!yAddValid && this.handleBlockedMovement()) {
          /**
           * Handling blocked movement
           *
           * TBS-36: Getting new tetromino to spawn immediately
           * This recursive call should not affect performance as we'd fall in
           * the init handling section of this function - which should return
           * anyway
           */
          return this.updateNemeinStates(NemeinCommand.TickDown);
        }
        if (
          this.corY === this.ghostCorY &&
          !this.isLockDelayEnabled &&
          command !== NemeinCommand.HardDrop
        ) {
          /* Lock-delay handling once Tetromino is about to be blocked */
          this.gameInterval =
            this.gameInterval < LOCK_DELAY_MS
              ? LOCK_DELAY_MS
              : this.gameInterval;
          this.isLockDelayEnabled = true;
        }
      }
    }

    logger.debug(
      `[Tetris] This tick's interval: ${this.gameInterval}ms (Level: ${this.level})`
    );

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
  public inputHandle(key: string): NemeinStates {
    let retCommand: NemeinCommand = NemeinCommand.Down;
    switch (key) {
      case NUMPAD_4:
      /* Fallthrough */
      case ARROW_LEFT:
        retCommand = NemeinCommand.Left;
        break;
      case NUMPAD_6:
      /* Fallthrough */
      case ARROW_RIGHT:
        retCommand = NemeinCommand.Right;
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
        retCommand = NemeinCommand.ClockwiseRotate;
        break;
      case NUMPAD_3:
      /* Fallthrough */
      case NUMPAD_7:
      /* Fallthrough */
      case Z_KEY:
      /* Fallthrough */
      case CTRL:
        retCommand = NemeinCommand.CounterclockwiseRotate;
        break;
      case NUMPAD_8:
      /* Fallthrough */
      case SPACE:
        retCommand = NemeinCommand.HardDrop;
        break;
      case NUMPAD_0:
      /* Fallthrough */
      case C_KEY:
      /* Fallthrough */
      case SHIFT:
        retCommand = NemeinCommand.HoldTetromino;
        break;
      case ARROW_DOWN:
        break;
      default:
        logger.error(`[Tetris] Unknown input ${key}`);
        break;
    }

    return this.updateNemeinStates(retCommand);
  }
}

export default Nemein;
