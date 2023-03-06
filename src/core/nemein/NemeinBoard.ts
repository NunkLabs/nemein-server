import {
  UPPER_Y_INDEX,
  X_INDEX,
  Y_INDEX,
  TetrominoManager,
  TetrominoRotation,
  TetrominoType,
} from "./NemeinManager.js";

/* Misc consts */
export const Y_START = 0;
export const MAX_PIXEL = 4;
export const DEFAULT_BOARD_WIDTH = 10;
export const DEFAULT_BOARD_HEIGHT = 20;

/* Dmg consts */
export const DEFAULT_DMG_PER_LINE = 100;
export const DEFAULT_CRIT_DMG_MULTIPLIER = 1.2;

/* Defense consts */
export const DEFAULT_CELL_HP = 10;
export const DEFAULT_CHALLENGE_CELL_HP = 20;
export const DEFAULT_MAX_PHYS_REDUC = 90;
export const DEFAULT_CHALLENGE_CELL_PHYS_REDUC = 0;
export const DEFAULT_MAX_ELE_RES = 75;
export const DEFAULT_CHALLENGE_CELL_FIRE_RES = 0;
export const DEFAULT_CHALLENGE_CELL_COLD_RES = 0;
export const DEFAULT_CHALLENGE_CELL_LIGHTNING_RES = 0;

export type DmgComposition = {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  /* TODO: Populate this later on with other types of dmg */
};

export type DefComposition = {
  physReduc: number;
  fireRes: number;
  coldRes: number;
  lightningRes: number;
  /* TODO: Populate this later on with other types of def */
};

export type LineClearInfo = {
  dmg: DmgComposition;
  lineIdx: number;
};

export type TetrisCell = {
  type: TetrominoType;
  hp: number;
  def: DefComposition;
};

export type TetrisCol = {
  colArr: TetrisCell[];
  lowestY: number;
};

export class TetrisBoard {
  private boardWidth: number;

  private boardHeight: number;

  private field: TetrisCol[];

  private challengeLineIdx: number;

  constructor(
    boardWidth: number = DEFAULT_BOARD_WIDTH,
    boardHeight: number = DEFAULT_BOARD_HEIGHT
  ) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.field = [];
    this.challengeLineIdx = boardHeight;

    this.initField();
  }

  /**
   * @brief: initField: Initialize the play field with all blank pixels
   */
  private initField(): void {
    for (let x = 0; x < this.boardWidth; x += 1) {
      const col: TetrisCell[] = [];

      for (let y = 0; y < this.boardHeight; y += 1) {
        col.push({
          type: TetrominoType.Blank,
          hp: 0,
          def: {
            physReduc: 0,
            fireRes: 0,
            coldRes: 0,
            lightningRes: 0,
          },
        });
      }

      const initCol: TetrisCol = {
        colArr: col,
        lowestY: this.boardHeight - 1,
      };

      this.field.push(initCol);
    }
  }

  /**
   * @brief Attempt to deal dmg to the current challenge line
   * @param info - Info containing dmg pool info
   * @returns true if dmg pool is enough to clear the current challenge line. False otw
   */
  private dealDmgToChallengeLine(info: LineClearInfo): boolean {
    let ret = false;

    if (this.challengeLineIdx < this.boardHeight) {
      const dmgCompPerCell: DmgComposition = {
        physical: Math.floor(info.dmg.physical / this.boardWidth),
        fire: Math.floor(info.dmg.fire / this.boardWidth),
        cold: Math.floor(info.dmg.cold / this.boardWidth),
        lightning: Math.floor(info.dmg.lightning / this.boardWidth),
        /* TODO: This only takes into account the physical dmg atm */
      };
      if (
        this.dealDmgToLine(this.challengeLineIdx, dmgCompPerCell) ===
        this.boardWidth
      ) {
        ret = true;
        this.shiftLinesUpByOne(this.challengeLineIdx);
        this.challengeLineIdx += 1;
      }
    }

    return ret;
  }

  /**
   * @brief: Deals dmg to all available cells in a line
   * @param lineIdx - Index of line in board to clear
   * @param dmgCompPerCell - Composition of damage types & values to be dealt
   * per cell
   * @returns number of cells cleared in the line
   */
  private dealDmgToLine(
    lineIdx: number,
    dmgCompPerCell: DmgComposition
  ): number {
    let retNumCellsCleared = 0;

    if (lineIdx >= 0 && lineIdx < this.boardHeight) {
      for (let col = 0; col < this.boardWidth; col += 1) {
        const cell = this.field[col].colArr[lineIdx];

        let dmgDealToCell = 0;
        dmgDealToCell +=
          dmgCompPerCell.physical *
          ((DEFAULT_MAX_PHYS_REDUC - cell.def.physReduc) /
            DEFAULT_MAX_PHYS_REDUC);
        dmgDealToCell +=
          dmgCompPerCell.fire *
          ((DEFAULT_MAX_ELE_RES - cell.def.fireRes) / DEFAULT_MAX_ELE_RES);
        dmgDealToCell +=
          dmgCompPerCell.cold *
          ((DEFAULT_MAX_ELE_RES - cell.def.coldRes) / DEFAULT_MAX_ELE_RES);
        dmgDealToCell +=
          dmgCompPerCell.lightning *
          ((DEFAULT_MAX_ELE_RES - cell.def.lightningRes) / DEFAULT_MAX_ELE_RES);
        /* TODO: Handle more dmg + def types later */

        cell.hp -= dmgDealToCell;
        if (cell.hp <= 0) {
          retNumCellsCleared += 1;
          cell.type = TetrominoType.Blank;
        }
      }
    }

    return retNumCellsCleared;
  }

  /**
   * @brief Shift all lines up (down visually) by one
   *
   * @note Our board grows top --> bottom. Hence this shift will
   * visually indicate that we're shifting downwards. Line at index
   * startIdx will be overwritten and the first line (idx 0) will be
   * cleared
   *
   * @param startIdx - Starting index to shift all lines upwards
   */
  private shiftLinesUpByOne(startIdx: number): void {
    for (let rowToShift = startIdx; rowToShift > 0; rowToShift -= 1) {
      for (let col = 0; col < this.boardWidth; col += 1) {
        let typeToSet = TetrominoType.Blank;
        let hpToSet = 0;
        let defToSet: DefComposition = {
          physReduc: 0,
          fireRes: 0,
          coldRes: 0,
          lightningRes: 0,
        };
        if (rowToShift > 0) {
          const upperCell = this.field[col].colArr[rowToShift - 1];
          typeToSet = upperCell.type;
          hpToSet = upperCell.hp;
          defToSet = upperCell.def;
        }
        const cellToSet = this.field[col].colArr[rowToShift];
        cellToSet.type = typeToSet;
        cellToSet.hp = hpToSet;
        cellToSet.def = defToSet;
      }
    }
  }

  /**
   * @brief Shift all lines down (up visually) by one
   *
   * @note Our board grows top --> bottom. Hence this shift will
   * visually indicate that we're shifting upwards. First line (idx 0)
   * will be overwritten and the line at index endIdx will be
   * cleared
   *
   * @param endIdx - Starting index to shift all lines upwards
   */
  private shiftLinesDownByOne(endIdx: number): void {
    for (let rowToShift = 0; rowToShift < endIdx; rowToShift += 1) {
      for (let col = 0; col < this.boardWidth; col += 1) {
        let typeToSet = TetrominoType.Blank;
        let hpToSet = 0;
        let defToSet: DefComposition = {
          physReduc: 0,
          fireRes: 0,
          coldRes: 0,
          lightningRes: 0,
        };
        if (rowToShift < this.boardHeight - 1) {
          const lowerCell = this.field[col].colArr[rowToShift + 1];
          typeToSet = lowerCell.type;
          hpToSet = lowerCell.hp;
          defToSet = lowerCell.def;
        }
        const cellToSet = this.field[col].colArr[rowToShift];
        cellToSet.type = typeToSet;
        cellToSet.hp = hpToSet;
        cellToSet.def = defToSet;
      }
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
   * @param infoArr - Array containing
   * @return Number of cleared/complete lines
   */
  public clearLines(infoArr: LineClearInfo[]): number {
    /* Check for complete lines and clear if there are any */
    let retNumLinesCompleted = 0;

    for (let infoIdx = 0; infoIdx < infoArr.length; infoIdx += 1) {
      const info = infoArr[infoIdx];
      /**
       * The index of this line to be cleared might need an upward shift
       * due to potential previous lines cleared
       */
      info.lineIdx += retNumLinesCompleted;

      /**
       * Attempt to deal damage and clear lines. The following order will be executed:
       * 1. We'll first clear the line that the user formed. *This should always clear
       * successfully as the dmg pool should have already allocated enough damage for this*
       * 2. We'll then attempt to deal dmg at the challenge line
       *
       * In case the user formed line and the challenge line are the same, we'll simply
       * just deal damage to one
       */
      if (this.challengeLineIdx !== info.lineIdx) {
        this.dealDmgToLine(info.lineIdx, {
          physical: Math.floor(DEFAULT_DMG_PER_LINE / this.boardWidth),
          fire: 0,
          cold: 0,
          lightning: 0,
          /**
           * NOTE: Don't care about other types of dmg here because
           * we'll be guaranteed with the 2 facts:
           * 1. User formed lines have no armour
           * 2. Only deal phys dmg to user formed lines
           */
        });
        retNumLinesCompleted += 1;
        this.shiftLinesUpByOne(info.lineIdx);
      }
      retNumLinesCompleted += Number(this.dealDmgToChallengeLine(info));
    }

    if (retNumLinesCompleted) {
      /* Update the lowest Y value for each col */
      for (let col = 0; col < this.boardWidth; col += 1) {
        if (this.field[col].lowestY !== this.boardHeight - 1) {
          this.field[col].lowestY += retNumLinesCompleted;
        }
      }
    }

    return retNumLinesCompleted;
  }

  /**
   * @brief Calculate the potential damage pool dealt by user via
   * forming lines
   * @returns Array of objects - each containing information on the index
   * of the line to be cleared and the damage clearing the line provides
   */
  public calculateDmgPool(): LineClearInfo[] {
    const ret: LineClearInfo[] = [];

    /* Check for complete lines */
    for (let row = this.boardHeight - 1; row >= 0; row -= 1) {
      let isLineComplete = true;
      let numUserCells = 0;
      for (let col = 0; col < this.boardWidth; col += 1) {
        if (col === this.boardWidth - 1 && !numUserCells) {
          isLineComplete = false;
          break;
        }

        const cellType = this.field[col].colArr[row].type;
        if (cellType < TetrominoType.Square || cellType > TetrominoType.Grey) {
          isLineComplete = false;
          break;
        } else if (cellType < TetrominoType.Grey) {
          numUserCells += 1;
        }
      }

      if (isLineComplete) {
        const isLineValidForCrit =
          row === this.challengeLineIdx || row === this.challengeLineIdx - 1;

        const lineDmgPool = isLineValidForCrit
          ? DEFAULT_DMG_PER_LINE * DEFAULT_CRIT_DMG_MULTIPLIER
          : DEFAULT_DMG_PER_LINE;
        ret.push({
          dmg: {
            physical: lineDmgPool,
            fire: 0,
            cold: 0,
            lightning: 0 /* TODO: Handle more types of dmg */,
          },
          lineIdx: row,
        });
      }
    }

    return ret;
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
    renderValue: TetrominoType
  ): void {
    const tetrominoCoords = TetrominoManager.getTetrominoCoords(type, rotation);
    for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
      const coord = tetrominoCoords[pixelIter];
      const xToRender = corX + coord[X_INDEX];
      const yToRender = corY + coord[Y_INDEX];

      if (yToRender >= 0) {
        const cell = this.field[xToRender].colArr[yToRender];
        cell.type = renderValue;
        cell.hp =
          renderValue > TetrominoType.Blank && renderValue < TetrominoType.Grey
            ? DEFAULT_CELL_HP
            : 0;
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
          if (
            this.field[xToCheck].colArr[yToCheck].type !== TetrominoType.Blank
          ) {
            ret = false;
            break;
          }
        } else {
          const yValid = yToCheck < this.boardHeight;

          if (xValid && yValid) {
            /* Check for any overlap */
            const pixelOverlapped =
              this.field[xToCheck].colArr[yToCheck].type !==
              TetrominoType.Blank;

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
   * @brief Spawn a new challenge line (periodically called by Tetris core)
   * and update the challenge line's index
   */
  public spawnChallengeLine(): void {
    if (this.challengeLineIdx > 0) {
      this.challengeLineIdx -= 1;
    }

    /* Move all cells of each column 1 unit downwards and update lowest Y */
    this.shiftLinesDownByOne(this.boardHeight - 1);
    for (let col = 0; col < this.boardWidth; col += 1) {
      const column = this.field[col];
      if (column.lowestY !== 0) {
        column.lowestY -= 1;
      }
      const { colArr } = column;
      const challengeCell = {
        type: TetrominoType.Grey,
        hp: DEFAULT_CHALLENGE_CELL_HP,
        def: {
          physReduc: DEFAULT_CHALLENGE_CELL_PHYS_REDUC,
          fireRes: DEFAULT_CHALLENGE_CELL_FIRE_RES,
          coldRes: DEFAULT_CHALLENGE_CELL_COLD_RES,
          lightningRes: DEFAULT_CHALLENGE_CELL_LIGHTNING_RES,
        },
      };
      colArr[this.boardHeight - 1] = challengeCell;
    }
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
          col.colArr[y] = {
            type: val,
            hp: DEFAULT_CELL_HP,
            def: {
              physReduc: 0,
              fireRes: 0,
              coldRes: 0,
              lightningRes: 0,
            },
          };
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
          ret[y * boardWidth + x] = col[y].type;
        }
      }
    }
    return ret;
  }
}

export default TetrisBoard;
