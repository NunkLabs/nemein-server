import * as TetrisConsts from "../constants/tetris";

type TetrisCol = {
  colArr: number[];
  lowestY: number;
};

class Tetris {
  private boardWidth: number;

  private boardHeight: number;

  private onHold: boolean;

  /* cor = Center of rotation */
  private corX: number;

  private corY: number;

  private ghostCorY: number;

  private heldTetromino: TetrisConsts.Tetromino;

  private activeTetromino: TetrisConsts.Tetromino;

  private activeTetrominoRotate: TetrisConsts.Rotation;

  private field: TetrisCol[];

  private spawnedTetrominos: TetrisConsts.Tetromino[];

  private initRender: boolean;

  private gameOver: boolean;

  private score: number;

  private tetrominosCount: number;

  private level: number;

  private gameInterval: number;

  constructor(boardWidth: number = TetrisConsts.DEFAULT_BOARD_WIDTH,
      boardHeight: number = TetrisConsts.DEFAULT_BOARD_HEIGHT) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.onHold = false;
    this.corX = boardWidth / 2;
    this.corY = TetrisConsts.Y_START;
    this.ghostCorY = 0;
    this.heldTetromino = TetrisConsts.Tetromino.Blank;
    this.activeTetromino = TetrisConsts.Tetromino.Blank;
    this.activeTetrominoRotate = TetrisConsts.Rotation.O;
    this.field = [];
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

    for (let x = 0; x < this.boardWidth; x += 1) {
      const col: number[] = [];

      for (let y = 0; y < this.boardHeight; y += 1) {
        col.push(TetrisConsts.Tetromino.Blank);
      }

      const initCol: TetrisCol = {
        colArr: col,
        lowestY: this.boardHeight - 1,
      };

      this.field.push(initCol);
    }
  }

  /**
   * @brief: handleBoardUpdate: Handler for each 'tick' of the game
   * or when a command is issued
   * @param: command - The command to be executed. The command is
   * always 'Down' for each tick of the game
   */
  public handleBoardUpdate(
    command: TetrisConsts.Command = TetrisConsts.Command.Down
  ): {
    corX: number;
    corY: number;
    ghostCorY: number;
    heldTetromino: TetrisConsts.Tetromino;
    activeTetromino: TetrisConsts.Tetromino;
    activeTetrominoRotate: TetrisConsts.Rotation;
    field: TetrisCol[];
    spawnedTetrominos: TetrisConsts.Tetromino[];
    gameOver: boolean;
    score: number;
    level: number;
    gameInterval: number;
  } {
    /* Handling init - We only render the newly spawned tetromino */
    if (this.initRender) {
      this.renderTetromino(
        this.corX,
        this.ghostCorY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        TetrisConsts.GHOST_TETROMINO_INDEX
      );
      this.renderTetromino(
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
      this.renderTetromino(
        this.corX,
        this.ghostCorY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        TetrisConsts.Tetromino.Blank
      );
      this.renderTetromino(
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
            this.isMoveValid(
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
            this.isMoveValid(
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
              const inNotPossibleCases =
                (this.activeTetrominoRotate === TetrisConsts.Rotation.O &&
                  testOffsetIdx === 3) ||
                (this.activeTetrominoRotate === TetrisConsts.Rotation.Z &&
                  testOffsetIdx === 2);

              if (inNotPossibleCases) {
                proceedTestingOffset = false;
              }
            }

            if (proceedTestingOffset) {
              testOffset = testOffsetArr[testOffsetIdx];
              testCorX = this.corX + testOffset[TetrisConsts.X_INDEX];
              testCorY = this.corY + testOffset[TetrisConsts.Y_INDEX];

              if (
                this.isMoveValid(
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
          yAddValid = this.isMoveValid(
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
      this.ghostCorY = this.findGhostTetrominoY(
        this.corX,
        this.corY,
        this.activeTetromino,
        this.activeTetrominoRotate
      );
      this.renderTetromino(
        this.corX,
        this.ghostCorY,
        this.activeTetromino,
        this.activeTetrominoRotate,
        TetrisConsts.GHOST_TETROMINO_INDEX
      );
      this.renderTetromino(
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
      field: this.field,
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
   * @param[in]: event - The keyboard event received
   */
  public inputHandle(key: string): {
    corX: number;
    corY: number;
    ghostCorY: number;
    heldTetromino: TetrisConsts.Tetromino;
    activeTetromino: TetrisConsts.Tetromino;
    activeTetrominoRotate: TetrisConsts.Rotation;
    field: TetrisCol[];
    spawnedTetrominos: TetrisConsts.Tetromino[];
    gameOver: boolean;
  } {
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
   * @brief: isMoveValid: Check if this next move is being valid or not:
   *  Does the current tetromino go out of the board?
   *  Is is blocked by other tetrominos?
   * @param: corX - Center of rotation's x
   * @param: corY - Center of rotation's y
   * @param: tetromino: Type of tetromino
   * @param: tetrominoRotate: Rotation of tetromino
   * @return: True if the move is valid, false otw
   */
  private isMoveValid(
    corX: number,
    corY: number,
    tetromino: TetrisConsts.Tetromino,
    tetrominoRotate: TetrisConsts.Rotation
  ): boolean {
    const tetrominos = TetrisConsts.TETROMINOS_COORDS_ARR;

    /* We scan through each pixel of the tetromino to determine if the move is
    valid */
    for (
      let pixelIter = 0;
      pixelIter < TetrisConsts.MAX_PIXEL;
      pixelIter += 1
    ) {
      /* Check to see if any pixel goes out of the board */
      /* HACK - We check pixels' y coords first to safely render tetrominos
      pixel by pixel initially */
      const coord = tetrominos[tetromino][tetrominoRotate][pixelIter];
      const yToCheck = corY + coord[TetrisConsts.Y_INDEX];
      const xToCheck = corX + coord[TetrisConsts.X_INDEX];
      const xValid = xToCheck >= 0 && xToCheck < this.boardWidth;

      if (yToCheck >= 0) {
        const yValid = yToCheck < this.boardHeight;

        if (xValid && yValid) {
          /* Check for any overlap */
          const pixelOverlapped = this.field[xToCheck].colArr[yToCheck] !== 0;

          if (pixelOverlapped) {
            return false;
          }
        } else {
          return false;
        }
      } else if (!xValid) {
        return false;
      }
    }

    return true;
  }

  /**
   * @brief: handleBlockedMovement: Handle for blocked movements
   * @return: True if the game is over, false otw
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

      if (yToRender >= 0) {
        const { lowestY } = this.field[xToRender];

        if (lowestY > yToRender) {
          this.field[xToRender].lowestY = yToRender;
        }
      }
    }

    /* Check for complete lines and clear if there are any */
    let numLinesCompleted = 0;
    for (let row = this.boardHeight - 1; row >= 0; row -= 1) {
      let isLineComplete = true;

      for (let col = 0; col < this.boardWidth; col += 1) {
        if (this.field[col].colArr[row] === 0) {
          isLineComplete = false;

          break;
        }
      }

      if (isLineComplete) {
        numLinesCompleted += 1;

        for (let detectedRow = row; detectedRow > 0; detectedRow -= 1) {
          for (let col = 0; col < this.boardWidth; col += 1) {
            this.field[col].colArr[detectedRow] =
              this.field[col].colArr[detectedRow - 1];
          }
        }

        row += 1;

        /* Update the lowest row value for each col */
        for (let col = 0; col < this.boardWidth; col += 1) {
          if (this.field[col].lowestY !== this.boardHeight - 1) {
            this.field[col].lowestY += 1;
          }
        }
      }
    }

    /* Prepare new tetromino for the next board update */
    const getTetrominoRet = Tetris.getNewTetromino(this.spawnedTetrominos);

    this.activeTetromino = getTetrominoRet.newTetromino;
    this.spawnedTetrominos = getTetrominoRet.newTetrominos;
    this.corX = Math.floor(this.boardWidth / 2);
    this.corY = TetrisConsts.Y_START;
    this.activeTetrominoRotate = TetrisConsts.Rotation.O;
    this.ghostCorY = this.findGhostTetrominoY(
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
    for (
      let pixelIter = 0;
      pixelIter < TetrisConsts.MAX_PIXEL;
      pixelIter += 1
    ) {
      const coord =
        tetrominos[this.activeTetromino][this.activeTetrominoRotate][pixelIter];
      const xToCheck = this.corX + coord[TetrisConsts.X_INDEX];
      const yToCheck = this.corY + coord[TetrisConsts.Y_INDEX];

      if (yToCheck >= 0) {
        if (this.field[xToCheck].colArr[yToCheck] !== 0) {
          this.gameOver = true;
          break;
        }
      }
    }
  }

  /**
   * @brief: findGhostTetrominoY: Find the optimal Y for the ghost tetromino
   * @param: corX - Center of rotation's x
   * @param: corY - Center of rotation's y
   * @param: tetromino: Type of tetromino
   * @param: tetrominoRotate: Rotation of tetromino
   * @return: Optimal Y for the ghost tetromino
   */
  private findGhostTetrominoY(
    corX: number,
    corY: number,
    tetromino: TetrisConsts.Tetromino,
    tetrominoRotate: TetrisConsts.Rotation
  ): number {
    const tetrominos = TetrisConsts.TETROMINOS_COORDS_ARR;

    /* First we find the lowest Y among the number of cols this tetromino
    spans */
    let yHigherThanCmp = false;
    const yToCmpArr: number[] = [];

    for (
      let pixelIter = 0;
      pixelIter < TetrisConsts.MAX_PIXEL;
      pixelIter += 1
    ) {
      const coord = tetrominos[tetromino][tetrominoRotate][pixelIter];
      const xToCheck = corX + coord[TetrisConsts.X_INDEX];
      const yToCheck = corY + coord[TetrisConsts.Y_INDEX];

      if (yToCheck >= 0) {
        const xValid = xToCheck >= 0 && xToCheck < this.boardWidth;
        const yValid = yToCheck < this.boardHeight;

        if (xValid && yValid) {
          const yToCmp = this.field[xToCheck].lowestY;

          /* If the current tetromino is already higher than the lowest Y among
          the X range, we have to handle it differently */
          if (yToCheck > yToCmp) {
            yHigherThanCmp = true;
            break;
          }

          if (!yToCmpArr.includes(yToCmp)) {
            yToCmpArr.push(yToCmp);
          }
        }
      }
    }

    let retGhostCorY = 0;

    /* We have to manually look for the best fit of the tetromino since the
    lowest Y doesn't help here */
    if (yHigherThanCmp) {
      let iterY = 0;

      while (this.isMoveValid(corX, corY + iterY, tetromino, tetrominoRotate)) {
        iterY += 1;
      }

      retGhostCorY = corY + iterY - 1;

      return retGhostCorY;
    }

    const lowestY = Math.min.apply(null, yToCmpArr);
    /* We find the correct starting point for the pivot */
    const pixelsToPivot =
      tetrominos[tetromino][tetrominoRotate][TetrisConsts.UPPER_Y_INDEX][
        TetrisConsts.Y_INDEX
      ];
    retGhostCorY = lowestY - 1 - pixelsToPivot;

    /* Since we might change the pivot for the tetrominos in the future,
      it is best to try to find the best fit for the tetromino starting from
      the lowest Y we just found. We first try to go upwards (Y increases) */
    let upperBoundAttempts = 0;

    while (
      this.isMoveValid(corX, retGhostCorY + 1, tetromino, tetrominoRotate)
    ) {
      retGhostCorY += 1;
      upperBoundAttempts += 1;
    }

    /* If the number of attempts to move Y upwards is not 0, it means that the
      actual point to render the ghost tetromino is in the upper region */
    if (upperBoundAttempts !== 0) {
      return retGhostCorY;
    }

    /* Otherwise, it is in the lower region */
    while (!this.isMoveValid(corX, retGhostCorY, tetromino, tetrominoRotate)) {
      retGhostCorY -= 1;
    }

    return retGhostCorY;
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
   * @brief: renderTetromino: Render the desired tetromino
   * @note: Field state will be updated after the function returns
   * @param: corX - Center of rotation's x
   * @param: corY - Center of rotation's y
   * @param: tetromino - Type of tetromino
   * @param: tetrominoRotate - Rotation of tetromino
   * @param: renderValue - Render value (color of tetromino)
   */
  private renderTetromino(
    corX: number,
    corY: number,
    tetromino: TetrisConsts.Tetromino,
    tetrominoRotate: TetrisConsts.Rotation,
    renderValue: number
  ): TetrisCol[] {
    const tetrominos = TetrisConsts.TETROMINOS_COORDS_ARR;
    const retField = this.field;

    for (
      let pixelIter = 0;
      pixelIter < TetrisConsts.MAX_PIXEL;
      pixelIter += 1
    ) {
      const coord = tetrominos[tetromino][tetrominoRotate][pixelIter];
      const xToRender = corX + coord[TetrisConsts.X_INDEX];
      const yToRender = corY + coord[TetrisConsts.Y_INDEX];

      if (yToRender >= 0) {
        retField[xToRender].colArr[yToRender] = renderValue;
      }
    }

    return retField;
  }

  /**
   * @brief: getNewTetromino: Get a tetromino from the spawned tetrominos queue.
   * If the queue's size is less than the maximum size, we add to it
   * a new tetromino.
   * @param[in]: tetrominos - Spawned tetrominos queue
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
