import * as TetrisConsts from "../constants/tetris";

export type TetrisCol = {
  colArr: number[];
  lowestY: number;
};

export class TetrisBoard {
  private boardWidth: number;

  private boardHeight: number;

  private field: TetrisCol[];

  constructor (boardWidth: number = TetrisConsts.DEFAULT_BOARD_WIDTH,
    boardHeight: number = TetrisConsts.DEFAULT_BOARD_HEIGHT) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.field = [];

    this.initField();
  }

  private initField(): void {
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
   * @brief: getField: Get the current play field of the game board
   * @return Current play field of the game board
   */
  public getField(): TetrisCol[] {
    return this.field;
  }

  /**
   * @brief: clearLines: Check for complete lines and clear those from the
   * current field
   * @return Number of cleared/complete lines
   */
  public clearLines(): number {
    /* Check for complete lines and clear if there are any */
    let retNumLinesCompleted = 0;
    for (let row = this.boardHeight - 1; row >= 0; row -= 1) {
      let isLineComplete = true;

      for (let col = 0; col < this.boardWidth; col += 1) {
        if (this.field[col].colArr[row] === 0) {
          isLineComplete = false;
          break;
        }
      }

      if (isLineComplete) {
        retNumLinesCompleted += 1;

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

    return retNumLinesCompleted;
  }

  /**
   * @brief:updateColLowestY: Set the lowest Y value of a column
   * @param x: Column index in the field
   * @param y: Lowest Y to set
   */
  public updateColLowestY(x: number, y: number): void {
    if (y >= 0) {
      const xCol = this.field[x];

      if (xCol.lowestY > y) {
        this.field[x].lowestY = y;
      }
    }
  }

  /**
   * @brief: renderTetromino: Render the desired tetromino
   * @param: corX - Center of rotation's x
   * @param: corY - Center of rotation's y
   * @param: tetromino - Type of tetromino
   * @param: tetrominoRotate - Rotation of tetromino
   * @param: renderValue - Render value (color of tetromino)
   */
  public renderTetromino(
    corX: number,
    corY: number,
    tetromino: TetrisConsts.Tetromino,
    tetrominoRotate: TetrisConsts.Rotation,
    renderValue: number
  ): void {
    const tetrominos = TetrisConsts.TETROMINOS_COORDS_ARR;

    for (
      let pixelIter = 0;
      pixelIter < TetrisConsts.MAX_PIXEL;
      pixelIter += 1
    ) {
      const coord = tetrominos[tetromino][tetrominoRotate][pixelIter];
      const xToRender = corX + coord[TetrisConsts.X_INDEX];
      const yToRender = corY + coord[TetrisConsts.Y_INDEX];

      if (yToRender >= 0) {
        this.field[xToRender].colArr[yToRender] = renderValue;
      }
    }
  }

  /**
   * @brief: isTetrominoRenderable: Check if this Tetromino is renderable:
   *  Does the current tetromino go out of the board?
   *  Is is blocked by other tetrominos?
   * @param: newlySpawned: If the Tetromino is newly spawned
   * @param: corX - Center of rotation's x
   * @param: corY - Center of rotation's y
   * @param: tetromino: Type of tetromino
   * @param: tetrominoRotate: Rotation of tetromino
   * @return: True if renderable, false otw
   */
  public isTetrominoRenderable(
    newlySpawned: boolean,
    corX: number,
    corY: number,
    tetromino: TetrisConsts.Tetromino,
    tetrominoRotate: TetrisConsts.Rotation
  ): boolean {
    const tetrominos = TetrisConsts.TETROMINOS_COORDS_ARR;

    let ret = true;

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
        /**
         * If Tetromino is newly spawned, we only check if the renderable parts
         * are overlapped cause we only want to know in this case if the game's
         * over
         */
        if (newlySpawned) {
          if (this.field[xToCheck].colArr[yToCheck] !== 0) {
            ret = false;
            break;
          }
        } else {
          const yValid = yToCheck < this.boardHeight;

          if (xValid && yValid) {
            /* Check for any overlap */
            const pixelOverlapped = this.field[xToCheck].colArr[yToCheck] !== 0;

            if (pixelOverlapped) {
              ret = false;
              break;
            }
          } else {
            ret = false;
            break;
          }
        }
      } else if (!xValid) {
        ret = false;
        break;
      }
    }

    return ret;
  }

  /**
   * @brief: findGhostTetrominoY: Find the optimal Y for the ghost tetromino
   * @param: corX - Center of rotation's x
   * @param: corY - Center of rotation's y
   * @param: tetromino: Type of tetromino
   * @param: tetrominoRotate: Rotation of tetromino
   * @return: Optimal Y for the ghost tetromino
   */
  public findGhostTetrominoY(
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

      while (this.isTetrominoRenderable(false, corX, corY + iterY, tetromino,
        tetrominoRotate)) {
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
      this.isTetrominoRenderable(false, corX, retGhostCorY + 1, tetromino,
        tetrominoRotate)
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
    while (!this.isTetrominoRenderable(false, corX, retGhostCorY, tetromino,
      tetrominoRotate)) {
      retGhostCorY -= 1;
    }

    return retGhostCorY;
  }
}

export default TetrisBoard;
