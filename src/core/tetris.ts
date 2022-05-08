import * as TetrisConsts from "../constants/tetris";
import * as TetrisBoard from "./tetrisBoard";

type TetrisStates = {
  corX: number;
  corY: number;
  ghostCorY: number;
  heldTetromino: TetrisConsts.Tetromino;
  activeTetromino: TetrisConsts.Tetromino;
  activeTetrominoRotate: TetrisConsts.Rotation;
  field: TetrisBoard.TetrisCol[];
  spawnedTetrominos: TetrisConsts.Tetromino[];
  gameOver: boolean;
  score: number;
  level: number;
  gameInterval: number;
};

class Tetris {
  private boardWidth: number;

  private boardHeight: number;

  private board: TetrisBoard.TetrisBoard;

  /**
   * Might be some other elegant ways to get around this but this is only for
   * correctly typing what's returned in `const game = new Tetris();`
   */
  private field: TetrisBoard.TetrisCol[];

  private onHold: boolean;

  /* cor = Center of rotation */
  private corX: number;

  private corY: number;

  private ghostCorY: number;

  private heldTetromino: TetrisConsts.Tetromino;

  private activeTetromino: TetrisConsts.Tetromino;

  private activeTetrominoRotate: TetrisConsts.Rotation;

  private spawnedTetrominos: TetrisConsts.Tetromino[];

  private initRender: boolean;

  private gameOver: boolean;

  private score: number;

  private tetrominosCount: number;

  private level: number;

  private gameInterval: number;

  constructor (boardWidth: number = TetrisConsts.DEFAULT_BOARD_WIDTH,
    boardHeight: number = TetrisConsts.DEFAULT_BOARD_HEIGHT) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.board = new TetrisBoard.TetrisBoard(boardWidth, boardHeight);
    this.field = this.board.getField();
    this.onHold = false;
    this.corX = boardWidth / 2;
    this.corY = TetrisConsts.Y_START;
    this.ghostCorY = 0;
    this.heldTetromino = TetrisConsts.Tetromino.Blank;
    this.activeTetromino = TetrisConsts.Tetromino.Blank;
    this.activeTetrominoRotate = TetrisConsts.Rotation.O;
    this.spawnedTetrominos = [];
    this.initRender = true;
    this.gameOver = false;
    this.score = 0;
    this.tetrominosCount = 0;
    this.level = 1;
    this.gameInterval = TetrisConsts.DEFAULT_TIME_INTERVAL_MS;

    this.initNewGame();
  }

  /**
   * @brief: initNewGame: Init a new game by calculating new x value
   * and randomizing the new tetromino
   */
  private initNewGame(): void {
    /**
     * Spawning tetrominos and populating the tetrominos queue based using
     * randomization
     * We wanna add an additional tetromino so that we can immediately pop
     * as the game begins
     */
    for (
      let spawn = 0;
      spawn < TetrisConsts.MAX_SPAWNED_TETROMINOS + 1;
      spawn += 1
    ) {
      const spawnedTetromino =
        Math.floor(
          Math.random() *
          (TetrisConsts.MAX_TETROMINO_INDEX -
            TetrisConsts.MIN_TETROMINO_INDEX +
            1)
        ) + 1;

      this.spawnedTetrominos.push(spawnedTetromino);
    }

    /**
     * Popping the first tetromino and update the tetrominos queue. This is a
     * bit ugly as JS does not support pass by reference to update the queue in
     * getNewTetromino();
     */
    const getTetrominoRet = Tetris.getNewTetromino(this.spawnedTetrominos);

    this.activeTetromino = getTetrominoRet.newTetromino;
    this.spawnedTetrominos = getTetrominoRet.newTetrominos;
    this.ghostCorY = this.prepareGhostTetrominoY();
  }

  /**
   * @brief: handleBoardUpdate: Handler for each 'tick' of the game
   * or when a command is issued
   * @param: command - The command to be executed. The command is
   * always 'Down' for each tick of the game
   * @return: Updated game states
   */
  public handleBoardUpdate(
    command: TetrisConsts.Command = TetrisConsts.Command.Down
  ): TetrisStates {
    /* Handling init - We only render the newly spawned tetromino */
    if (this.initRender) {
      this.board.renderTetromino(
        this.corX,
        this.ghostCorY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        TetrisConsts.GHOST_TETROMINO_INDEX
      );
      this.board.renderTetromino(
        this.corX,
        this.corY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        this.activeTetromino
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
        this.activeTetromino,
        this.activeTetrominoRotate,
        TetrisConsts.Tetromino.Blank
      );
      this.board.renderTetromino(
        this.corX,
        this.corY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        TetrisConsts.Tetromino.Blank
      );

      let yAddValid = true;
      let testCorX = 0;
      let testCorY = 0;
      let testRotate = 0;
      let testOffset = [];

      /* Determine which value to be modified (x - y - rotate ?) */
      switch (command) {
        case TetrisConsts.Command.Left: {
          testCorX = this.corX - 1;

          if (
            this.board.isTetrominoRenderable(
              false,
              testCorX,
              this.corY,
              this.activeTetromino,
              this.activeTetrominoRotate
            )
          ) {
            this.corX = testCorX;
          }

          break;
        }
        case TetrisConsts.Command.Right: {
          testCorX = this.corX + 1;

          if (
            this.board.isTetrominoRenderable(
              false,
              testCorX,
              this.corY,
              this.activeTetromino,
              this.activeTetrominoRotate
            )
          ) {
            this.corX = testCorX;
          }

          break;
        }
        case TetrisConsts.Command.Rotate: {
          testRotate =
            (this.activeTetrominoRotate + 1) % TetrisConsts.MAX_ROTATE;

          const testOffsetArr =
            TetrisConsts.WALL_KICK_COR_OFFSETS[this.activeTetrominoRotate];

          /* SRS's wall-kick testing (https://harddrop.com/wiki/SRS) */
          for (
            let testOffsetIdx = 0;
            testOffsetIdx < TetrisConsts.MAX_WALL_KICK_TESTS;
            testOffsetIdx += 1
          ) {
            let proceedTestingOffset = true;

            if (this.activeTetromino === TetrisConsts.Tetromino.T) {
              const inImpossibleCases =
                (this.activeTetrominoRotate === TetrisConsts.Rotation.O &&
                  testOffsetIdx === 3) ||
                (this.activeTetrominoRotate === TetrisConsts.Rotation.Z &&
                  testOffsetIdx === 2);

              if (inImpossibleCases) {
                proceedTestingOffset = false;
              }
            }

            if (proceedTestingOffset) {
              testOffset = testOffsetArr[testOffsetIdx];
              testCorX = this.corX + testOffset[TetrisConsts.X_INDEX];
              testCorY = this.corY + testOffset[TetrisConsts.Y_INDEX];

              if (
                this.board.isTetrominoRenderable(
                  false,
                  testCorX,
                  testCorY,
                  this.activeTetromino,
                  testRotate
                )
              ) {
                this.corX = testCorX;
                this.corY = testCorY;
                this.activeTetrominoRotate = testRotate;

                break;
              }
            }
          }
          break;
        }
        case TetrisConsts.Command.Down: {
          testCorY = this.corY + 1;
          yAddValid = this.board.isTetrominoRenderable(
            false,
            this.corX,
            testCorY,
            this.activeTetromino,
            this.activeTetrominoRotate
          );

          if (yAddValid) {
            this.corY = testCorY;
          }

          break;
        }
        case TetrisConsts.Command.HardDrop: {
          yAddValid = false;
          this.corY = this.ghostCorY;

          break;
        }
        case TetrisConsts.Command.HoldTetromino: {
          if (!this.onHold) {
            /* If there was a previously held tetromino, we have to switch the
            held one vs the one to be held */
            if (this.heldTetromino !== TetrisConsts.Tetromino.Blank) {
              const prevTetromino = this.activeTetromino;
              this.activeTetromino = this.heldTetromino;
              this.heldTetromino = prevTetromino;
            } else {
              const getTetrominoRet = Tetris.getNewTetromino(
                this.spawnedTetrominos
              );

              this.heldTetromino = this.activeTetromino;
              this.activeTetromino = getTetrominoRet.newTetromino;
              this.spawnedTetrominos = getTetrominoRet.newTetrominos;
            }

            this.corX = Math.floor(this.boardWidth / 2);
            this.corY = TetrisConsts.Y_START;
            this.activeTetrominoRotate = TetrisConsts.Rotation.O;
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

      /* Render new tetromino after the new coords are updated */
      this.ghostCorY = this.board.findGhostTetrominoY(
        this.corX,
        this.corY,
        this.activeTetromino,
        this.activeTetrominoRotate
      );
      this.board.renderTetromino(
        this.corX,
        this.ghostCorY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        TetrisConsts.GHOST_TETROMINO_INDEX
      );
      this.board.renderTetromino(
        this.corX,
        this.corY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        this.activeTetromino
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
          return this.handleBoardUpdate(TetrisConsts.Command.Down);
        }
      }
    }

    return {
      corX: this.corX,
      corY: this.corY,
      ghostCorY: this.ghostCorY,
      heldTetromino: this.heldTetromino,
      activeTetromino: this.activeTetromino,
      activeTetrominoRotate: this.activeTetrominoRotate,
      field: this.board.getField(),
      spawnedTetrominos: this.spawnedTetrominos,
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
    switch (key) {
      case TetrisConsts.ARROW_LEFT:
        return this.handleBoardUpdate(TetrisConsts.Command.Left);
      case TetrisConsts.ARROW_UP:
        return this.handleBoardUpdate(TetrisConsts.Command.Rotate);
      case TetrisConsts.ARROW_RIGHT:
        return this.handleBoardUpdate(TetrisConsts.Command.Right);
      case TetrisConsts.SPACE:
        return this.handleBoardUpdate(TetrisConsts.Command.HardDrop);
      case TetrisConsts.C_KEY:
        return this.handleBoardUpdate(TetrisConsts.Command.HoldTetromino);
      default:
        return this.handleBoardUpdate(TetrisConsts.Command.Down);
    }
  }

  /**
   * @brief: handleBlockedMovement: Handler for blocked movements
   */
  private handleBlockedMovement(): void {
    const tetrominos = TetrisConsts.TETROMINOS_COORDS_ARR;

    /* Update the lowest pixel for each column */
    for (
      let pixelIter = 0;
      pixelIter < TetrisConsts.MAX_PIXEL;
      pixelIter += 1
    ) {
      const coord =
        tetrominos[this.activeTetromino][this.activeTetrominoRotate][pixelIter];
      const xToRender = this.corX + coord[TetrisConsts.X_INDEX];
      const yToRender = this.corY + coord[TetrisConsts.Y_INDEX];

      this.board.updateColLowestY(xToRender, yToRender);
    }

    const numLinesCompleted = this.board.clearLines();

    /* Prepare new tetromino for the next board update */
    const getTetrominoRet = Tetris.getNewTetromino(this.spawnedTetrominos);

    this.activeTetromino = getTetrominoRet.newTetromino;
    this.spawnedTetrominos = getTetrominoRet.newTetrominos;
    this.corX = Math.floor(this.boardWidth / 2);
    this.corY = TetrisConsts.Y_START;
    this.activeTetrominoRotate = TetrisConsts.Rotation.O;
    this.ghostCorY = this.board.findGhostTetrominoY(
      this.corX,
      this.corY,
      this.activeTetromino,
      this.activeTetrominoRotate
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
    this.level = 1 + Math.floor(this.tetrominosCount
      / TetrisConsts.LEVEL_UP_TETROMINOS_COUNT);
    this.score += numLinesCompleted * this.level;

    let newGameIntervalDecrease = this.level
      * TetrisConsts.EARLY_LEVEL_MULTIPLIER;
    if (newGameIntervalDecrease > TetrisConsts.INTERVAL_CAP) {
      newGameIntervalDecrease = TetrisConsts.INTERVAL_CAP + this.level
        * TetrisConsts.LATE_LEVEL_MULTIPLIER
      if (newGameIntervalDecrease >= TetrisConsts.DEFAULT_TIME_INTERVAL_MS) {
        newGameIntervalDecrease = TetrisConsts.DEFAULT_TIME_INTERVAL_MS;
      }
    }
    this.gameInterval = TetrisConsts.DEFAULT_TIME_INTERVAL_MS
      - newGameIntervalDecrease;

    /* Check if game is over */
    if (!this.board.isTetrominoRenderable(true, this.corX, this.corY,
      this.activeTetromino, this.activeTetrominoRotate)) {
      this.gameOver = true;
    }
  }

  /**
   * @brief: prepareGhostTetrominoY: Get the center of rotation's ghost Y value
   * of a newly spawned tetromino
   * @note: This is basically a quick hack - Instead of having to
   * call findGhostTetrominoY, we can simply just
   * calculate the ghost tetromino's Y coordinate as it is only
   * [the higest pixel - number of pixels to the pivot
   * (0, 0) of the init tetromino]
   * @return: Center of rotation's ghost Y value of a newly spawned tetromino
   */
  private prepareGhostTetrominoY(): number {
    const tetrominos = TetrisConsts.TETROMINOS_COORDS_ARR;

    const pixelsToPivot =
      tetrominos[this.activeTetromino][this.activeTetrominoRotate][
      TetrisConsts.UPPER_Y_INDEX
      ][TetrisConsts.Y_INDEX];

    return this.boardHeight - 1 - pixelsToPivot;
  }

  /**
   * @brief: getNewTetromino: Get a tetromino from the spawned tetrominos queue.
   * If the queue's size is less than the maximum size, we add to it
   * a new tetromino.
   * @param: tetrominos - Spawned tetrominos queue
   * @return: newTetromino - Tetromino pop from the queue
   *          newTetrominos - Updated queue
   */
  static getNewTetromino(spawnedTetrominos: TetrisConsts.Tetromino[]): {
    newTetromino: TetrisConsts.Tetromino;
    newTetrominos: TetrisConsts.Tetromino[];
  } {
    const retTetrominos = spawnedTetrominos;
    const retTetromino = retTetrominos.shift();

    /* Shift method might return undefined */
    if (retTetromino === undefined) {
      throw new Error("Cannot fetch a new tetromino from queue");
    }

    /* Add a new tetromino to spawned tetrominos queue if size is less than max
    size */
    if (retTetrominos.length < TetrisConsts.MAX_SPAWNED_TETROMINOS) {
      retTetrominos.push(
        Math.floor(
          Math.random() *
          (TetrisConsts.MAX_TETROMINO_INDEX -
            TetrisConsts.MIN_TETROMINO_INDEX +
            1)
        ) + 1
      );
    }

    return {
      newTetromino: retTetromino,
      newTetrominos: retTetrominos,
    };
  }
}

export default Tetris;
