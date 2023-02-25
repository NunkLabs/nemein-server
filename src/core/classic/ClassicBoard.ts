import {
  UPPER_Y_INDEX,
  X_INDEX,
  Y_INDEX,
  TetrominoManager,
  TetrominoRotation,
  TetrominoType,
} from "./ClassicManager.js";

/* Misc consts */
export const Y_START = 0;
export const MAX_PIXEL = 4;
export const DEFAULT_BOARD_WIDTH = 10;
export const DEFAULT_BOARD_HEIGHT = 20;

/* Enum types */
export type TetrisCol = {
  colArr: number[];
  lowestY: number;
};

export class TetrisBoard {
  private boardWidth: number;

  private boardHeight: number;

  private field: TetrisCol[];

  constructor(
    boardWidth: number = DEFAULT_BOARD_WIDTH,
    boardHeight: number = DEFAULT_BOARD_HEIGHT
  ) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.field = [];

    this.initField();
  }

  /**
   * @brief: initField: Initialize the play field with all blank pixels
   */
  private initField(): void {
    for (let x = 0; x < this.boardWidth; x += 1) {
      const col: number[] = [];

      for (let y = 0; y < this.boardHeight; y += 1) {
        col.push(TetrominoType.Blank);
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
    return JSON.parse(JSON.stringify(this.field));
  }

  /**
   * @brief: setField: Set the current play field of the game board
   * @param field: Field to be set
   * @note: Only works when NODE_ENV === "test" (i.e. in a test env)
   */
  public setField(field: TetrisCol[]): void {
    if (process.env.NODE_ENV === "test") {
      this.field = field;
    }
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
   * @brief: updateColLowestY: Set the lowest y values of all columns spanned
   * by a Tetromino at a certain center of rotation
   * @param corX: Center of rotation's x
   * @param corY: Center of rotation's y
   * @param type: Type of Tetromino
   * @param rotation: Tetromino's rotation
   */
  public updateColLowestY(
    corX: number,
    corY: number,
    type: TetrominoType,
    rotation: TetrominoRotation
  ): void {
    const tetrominoCoords = TetrominoManager.getTetrominoCoords(type, rotation);

    for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
      const coord = tetrominoCoords[pixelIter];
      const xToRender = corX + coord[X_INDEX];
      const yToRender = corY + coord[Y_INDEX];

      if (yToRender >= 0) {
        const xCol = this.field[xToRender];

        if (xCol.lowestY > yToRender) {
          this.field[xToRender].lowestY = yToRender;
        }
      }
    }
  }

  /**
   * @brief: renderTetromino: Render the desired tetromino
   * @param: corX - Center of rotation's x
   * @param: corY - Center of rotation's y
   * @param: type - Type of tetromino
   * @param: rotation - Rotation of tetromino
   * @param: renderValue - Render value (color of Tetromino)
   */
  public renderTetromino(
    corX: number,
    corY: number,
    type: TetrominoType,
    rotation: TetrominoRotation,
    renderValue: number
  ): void {
    const tetrominoCoords = TetrominoManager.getTetrominoCoords(type, rotation);
    for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
      const coord = tetrominoCoords[pixelIter];
      const xToRender = corX + coord[X_INDEX];
      const yToRender = corY + coord[Y_INDEX];

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
   * @param: type: Type of tetromino
   * @param: rotation: Rotation of tetromino
   * @return: True if renderable, false otw
   */
  public isTetrominoRenderable(
    newlySpawned: boolean,
    corX: number,
    corY: number,
    type: TetrominoType,
    rotation: TetrominoRotation
  ): boolean {
    let ret = true;

    const tetrominoCoords = TetrominoManager.getTetrominoCoords(type, rotation);
    /* We scan through each pixel of the tetromino to determine if the move is
    valid */
    for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
      /* Check to see if any pixel goes out of the board */
      /* HACK - We check pixels' y coords first to safely render tetrominos
      pixel by pixel initially */
      const coord = tetrominoCoords[pixelIter];
      const xToCheck = corX + coord[X_INDEX];
      const yToCheck = corY + coord[Y_INDEX];
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
   * @param: type: Type of tetromino
   * @param: rotation: Rotation of tetromino
   * @return: Optimal Y for the ghost tetromino
   */
  public findGhostTetrominoY(
    corX: number,
    corY: number,
    type: TetrominoType,
    rotation: TetrominoRotation
  ): number {
    let retGhostCorY = 0;
    if (type < TetrominoType.Ghost) {
      /* First we find the lowest Y among the number of cols this tetromino
      spans */
      let yHigherThanCmp = false;
      const yToCmpArr: number[] = [];

      const tetrominoCoords = TetrominoManager.getTetrominoCoords(
        type,
        rotation
      );
      for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
        const coord = tetrominoCoords[pixelIter];
        const xToCheck = corX + coord[X_INDEX];
        const yToCheck = corY + coord[Y_INDEX];

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

      /* We have to manually look for the best fit of the tetromino since the
      lowest Y doesn't help here */
      if (yHigherThanCmp) {
        let iterY = 0;

        while (
          this.isTetrominoRenderable(false, corX, corY + iterY, type, rotation)
        ) {
          iterY += 1;
        }
        retGhostCorY = corY + iterY - 1;
        return retGhostCorY;
      }

      const lowestY = Math.min.apply(null, yToCmpArr);
      /* We find the correct starting point for the pivot */
      const pixelsToPivot = tetrominoCoords[UPPER_Y_INDEX][Y_INDEX];
      retGhostCorY = lowestY - 1 - pixelsToPivot;

      /* Since we might change the pivot for the tetrominos in the future,
        it is best to try to find the best fit for the tetromino starting from
        the lowest Y we just found. We first try to go upwards (Y increases) */
      let upperBoundAttempts = 0;

      while (
        this.isTetrominoRenderable(
          false,
          corX,
          retGhostCorY + 1,
          type,
          rotation
        )
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
      while (
        !this.isTetrominoRenderable(false, corX, retGhostCorY, type, rotation)
      ) {
        retGhostCorY -= 1;
      }
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
   * @param: type: Type of tetromino
   * @param: rotation: Rotation of tetromino
   * @return: Center of rotation's ghost Y value of a newly spawned tetromino
   */
  public prepareGhostTetrominoY(
    type: TetrominoType,
    rotation: TetrominoRotation
  ): number {
    let ret = 0;
    if (type < TetrominoType.Ghost) {
      const tetrominoCoords = TetrominoManager.getTetrominoCoords(
        type,
        rotation
      );

      const pixelsToPivot = tetrominoCoords[UPPER_Y_INDEX][Y_INDEX];

      ret = this.boardHeight - 1 - pixelsToPivot;
    }
    return ret;
  }

  /**
   * @brief: bitmapToTetrisCols: Convert a 1D array bitmap into an array of
   * TetrisCols
   * @param bitmap: Bitmap to be converted
   * @param boardWidth: Width of bitmap
   * @param boardHeight: Height of bitmap
   * @returns TetrisCol conversion of the bitmap
   * @note: The method assumes everything is settled, i.e. the lowest y values
   * will be different from what we expect
   */
  static bitmapToTetrisCols(
    bitmap: number[],
    boardWidth: number,
    boardHeight: number
  ): TetrisCol[] {
    const ret: TetrisCol[] = [];
    if (bitmap.length === boardWidth * boardHeight) {
      for (let x = 0; x < boardWidth; x += 1) {
        const col: TetrisCol = {
          colArr: [],
          lowestY: boardHeight - 1,
        };
        let firstPixel = false;
        for (let y = 0; y < boardHeight; y += 1) {
          const val = bitmap[y * boardWidth + x];
          col.colArr[y] = val;
          if (val) {
            if (firstPixel) {
              firstPixel = false;
            } else {
              col.lowestY -= 1;
            }
          }
        }
        ret.push(col);
      }
    }
    return ret;
  }

  /**
   * @brief: tetrisColsToBitMap: Convert an array of TetrisCols into a 1D array
   * bitmap
   * @param field: TetrisCols array to convert
   * @returns 1D array bitmap conversion
   */
  static tetrisColsToBitmap(field: TetrisCol[]): number[] {
    const ret: number[] = [];
    const boardWidth = field.length > 0 ? field.length : 0;
    const boardHeight = field[0].colArr.length > 0 ? field[0].colArr.length : 0;

    if (boardWidth !== 0 && boardHeight !== 0) {
      for (let x = 0; x < boardWidth; x += 1) {
        const col = field[x].colArr;
        for (let y = 0; y < boardHeight; y += 1) {
          ret[y * boardWidth + x] = col[y];
        }
      }
    }
    return ret;
  }
}

export default TetrisBoard;
