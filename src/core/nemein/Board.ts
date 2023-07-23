import DmgManager, {
  DEFAULT_CELL_HP,
  DEFAULT_CHALLENGE_CELL_COLD_RES,
  DEFAULT_CHALLENGE_CELL_FIRE_RES,
  DEFAULT_CHALLENGE_CELL_HP,
  DEFAULT_CHALLENGE_CELL_LIGHTNING_RES,
  DEFAULT_CHALLENGE_CELL_PHYS_REDUC,
  DefComposition,
  CellStatus,
  DmgType,
  LineClearInfo,
  AilmentReturnInfo,
} from "./DmgManager.js";

import {
  UPPER_Y_INDEX,
  X_INDEX,
  Y_INDEX,
  TetrominoManager,
  TetrominoRotation,
  TetrominoType,
} from "./TetrominoManager.js";

/* Misc consts */
export const Y_START = 0;
export const MAX_PIXEL = 4;
export const DEFAULT_BOARD_WIDTH = 10;
export const DEFAULT_BOARD_HEIGHT = 20;

export type NemeinCell = {
  type: TetrominoType;
  hp: number;
  def: DefComposition;
  status: CellStatus;
};

export type NemeinCol = {
  colArr: NemeinCell[];
  lowestY: number;
};

export type ChallengeLine = {
  idx: number;
};

export type ClearRecord = {
  idx: number;
  lineTypeArr: TetrominoType[];
  wasCrit: boolean;
  dmgDealt: {
    dominantDmgType: DmgType;
    value: number;
  };
};

export class NemeinBoard {
  private boardWidth: number;

  private boardHeight: number;

  private gameField: NemeinCol[];

  private clearRecordsArr: ClearRecord[];

  private challengeLine: ChallengeLine;

  private dmgManager: DmgManager;

  constructor(
    boardWidth: number = DEFAULT_BOARD_WIDTH,
    boardHeight: number = DEFAULT_BOARD_HEIGHT,
  ) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.gameField = [];
    this.clearRecordsArr = [];
    this.challengeLine = {
      idx: boardHeight,
    };
    this.dmgManager = new DmgManager(
      this.gameField,
      boardWidth,
      boardHeight,
      this.challengeLine,
    );

    this.initFields();
  }

  /**
   * @brief: initField: Initialize the game & status fields with all blank pixels
   */
  private initFields(): void {
    for (let x = 0; x < this.boardWidth; x += 1) {
      const gameCol: NemeinCell[] = [];
      for (let y = 0; y < this.boardHeight; y += 1) {
        gameCol.push({
          type: TetrominoType.Blank,
          hp: 0,
          def: {
            physReduc: 0,
            fireRes: 0,
            coldRes: 0,
            lightningRes: 0,
          },
          status: CellStatus.None,
        });
      }

      const initCol: NemeinCol = {
        colArr: gameCol,
        lowestY: this.boardHeight - 1,
      };

      this.gameField.push(initCol);
    }
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
          const upperCell = this.gameField[col].colArr[rowToShift - 1];
          typeToSet = upperCell.type;
          hpToSet = upperCell.hp;
          defToSet = upperCell.def;
        }
        const cellToSet = this.gameField[col].colArr[rowToShift];
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
          const lowerCell = this.gameField[col].colArr[rowToShift + 1];
          typeToSet = lowerCell.type;
          hpToSet = lowerCell.hp;
          defToSet = lowerCell.def;
        }
        const cellToSet = this.gameField[col].colArr[rowToShift];
        cellToSet.type = typeToSet;
        cellToSet.hp = hpToSet;
        cellToSet.def = defToSet;
      }
    }
  }

  /**
   * @brief: setClearRecord - Push a record of line clear
   * @param lineIdx - Line index to be filled
   */
  private setClearRecord(
    info: LineClearInfo,
    isClearingChallengeLine: boolean,
  ): void {
    const lineClearedTypes: TetrominoType[] = [];
    const lineIdx = isClearingChallengeLine
      ? this.challengeLine.idx
      : info.lineIdx;
    for (let col = 0; col < this.boardWidth; col += 1) {
      /**
       * NOTE: For grey lines, we have to deal damage first
       * to see if they are eligible to be cleared. However, after
       * dealing dmg, the lines becomes blank. Unlike user-formed
       * lines, those lines are guaranteed to be cleared so we do
       * not need to deal dmg first hence the discrepancy
       */
      const cellType = isClearingChallengeLine
        ? TetrominoType.Grey
        : this.gameField[col].colArr[lineIdx].type;
      lineClearedTypes.push(cellType);
    }

    let highestDmgDealt = 0;
    let higestDmgType = DmgType.Physical;

    let dmgToCheck = info.dmg.physical;
    if (dmgToCheck > highestDmgDealt) {
      highestDmgDealt = dmgToCheck;
    }
    dmgToCheck = info.dmg.fire;
    if (dmgToCheck > highestDmgDealt) {
      highestDmgDealt = dmgToCheck;
      higestDmgType = DmgType.Fire;
    }
    dmgToCheck = info.dmg.cold;
    if (dmgToCheck > highestDmgDealt) {
      highestDmgDealt = dmgToCheck;
      higestDmgType = DmgType.Cold;
    }
    dmgToCheck = info.dmg.lightning;
    if (dmgToCheck > highestDmgDealt) {
      highestDmgDealt = dmgToCheck;
      higestDmgType = DmgType.Lightning;
    }

    this.clearRecordsArr.push({
      idx: lineIdx,
      lineTypeArr: lineClearedTypes,
      wasCrit: info.criticalHit,
      dmgDealt: {
        dominantDmgType: higestDmgType,
        value: highestDmgDealt,
      },
    });
  }

  /**
   * @brief: getGameField: Get the current game field
   * @return Current game field of the board (i.e. most up-to-date
   * field with all changes)
   */
  public getGameField(): NemeinCol[] {
    return structuredClone(this.gameField);
  }

  /**
   * @brief: getClearRecords: Get the clear records
   * @param clearStatus - Indicating whether or not we want to wipe the
   * clear records. Note that this is true by default
   * @return Current clear records of the board (i.e. indicating lines that
   * are cleared to support Client rendering)
   */
  public getClearRecords(wipeRecords: boolean = true): ClearRecord[] {
    const ret = structuredClone(this.clearRecordsArr);
    if (wipeRecords) {
      for (let row = 0; row < this.boardHeight; row += 1) {
        this.clearRecordsArr = [];
      }
    }
    return ret;
  }

  /**
   * @brief: setGameField: Set the current game field
   * @param field: Field to be set
   * @note: Only works when NODE_ENV === "test" (i.e. in a test env)
   */
  public setGameField(field: NemeinCol[]): void {
    if (process.env.NODE_ENV === "test") {
      this.gameField = field;
    }
  }

  /**
   * @brief: clearLines: Check for complete lines and clear those from the
   * current field
   * @return Number of cleared/complete lines
   */
  public clearLines(): number {
    /* We first calculate dmg (if any) dealt by the user by forming lines */
    const infoArr = this.dmgManager.calculateDmgPool();

    /* Check for complete lines and clear if there are any */
    let retNumLinesCompleted = 0;

    for (let infoIdx = 0; infoIdx < infoArr.length; infoIdx += 1) {
      const info = infoArr[infoIdx];

      /**
       * Record line cleared in status field. Note that we want the
       * raw (i.e. unshifted line indexes)
       */
      this.setClearRecord(info, false /* isClearingChallengeLine */);

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
      if (this.challengeLine.idx !== info.lineIdx) {
        this.dmgManager.dealDmgToLine(info, false /* isHittingChallengeLine */);
        retNumLinesCompleted += 1;
        this.shiftLinesUpByOne(info.lineIdx);
      }

      const challengeLineClearInfo = this.dmgManager.dealDmgToLine(
        info,
        true /* isHittingChallengeLine */,
      );
      if (challengeLineClearInfo.isLineCleared) {
        /**
         * Record challenge line cleared in status field. Note that we want
         * the raw (i.e. unshifted line indexes)
         */
        this.setClearRecord(
          challengeLineClearInfo.info,
          true /* isClearingChallengeLine */,
        );
        retNumLinesCompleted += 1;
        this.shiftLinesUpByOne(this.challengeLine.idx);
        this.challengeLine.idx += 1;
      }
    }

    if (retNumLinesCompleted) {
      /* Update the lowest Y value for each col */
      for (let col = 0; col < this.boardWidth; col += 1) {
        if (this.gameField[col].lowestY !== this.boardHeight - 1) {
          this.gameField[col].lowestY += retNumLinesCompleted;
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
    rotation: TetrominoRotation,
  ): void {
    const tetrominoCoords = TetrominoManager.getTetrominoCoords(type, rotation);

    for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
      const coord = tetrominoCoords[pixelIter];
      const xToRender = corX + coord[X_INDEX];
      const yToRender = corY + coord[Y_INDEX];

      if (yToRender >= 0) {
        const xCol = this.gameField[xToRender];

        if (xCol.lowestY > yToRender) {
          this.gameField[xToRender].lowestY = yToRender;
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
    renderValue: TetrominoType,
  ): void {
    const tetrominoCoords = TetrominoManager.getTetrominoCoords(type, rotation);
    for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
      const coord = tetrominoCoords[pixelIter];
      const xToRender = corX + coord[X_INDEX];
      const yToRender = corY + coord[Y_INDEX];

      if (yToRender >= 0) {
        const cell = this.gameField[xToRender].colArr[yToRender];
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
    rotation: TetrominoRotation,
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
            this.gameField[xToCheck].colArr[yToCheck].type !==
            TetrominoType.Blank
          ) {
            ret = false;
            break;
          }
        } else {
          const yValid = yToCheck < this.boardHeight;

          if (xValid && yValid) {
            /* Check for any overlap */
            const pixelOverlapped =
              this.gameField[xToCheck].colArr[yToCheck].type !==
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
    rotation: TetrominoRotation,
  ): number {
    let retGhostCorY = 0;
    if (type < TetrominoType.Ghost) {
      /* First we find the lowest Y among the number of cols this tetromino
      spans */
      let yHigherThanCmp = false;
      const yToCmpArr: number[] = [];

      const tetrominoCoords = TetrominoManager.getTetrominoCoords(
        type,
        rotation,
      );
      for (let pixelIter = 0; pixelIter < MAX_PIXEL; pixelIter += 1) {
        const coord = tetrominoCoords[pixelIter];
        const xToCheck = corX + coord[X_INDEX];
        const yToCheck = corY + coord[Y_INDEX];

        if (yToCheck >= 0) {
          const xValid = xToCheck >= 0 && xToCheck < this.boardWidth;
          const yValid = yToCheck < this.boardHeight;

          if (xValid && yValid) {
            const yToCmp = this.gameField[xToCheck].lowestY;

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
          rotation,
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
    rotation: TetrominoRotation,
  ): number {
    let ret = 0;
    if (type < TetrominoType.Ghost) {
      const tetrominoCoords = TetrominoManager.getTetrominoCoords(
        type,
        rotation,
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
    if (this.challengeLine.idx > 0) {
      this.challengeLine.idx -= 1;
    }

    /* Move all cells of each column 1 unit downwards and update lowest Y */
    this.shiftLinesDownByOne(this.boardHeight - 1);
    for (let col = 0; col < this.boardWidth; col += 1) {
      const column = this.gameField[col];
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
        status: CellStatus.None,
      };
      colArr[this.boardHeight - 1] = challengeCell;
    }
  }

  /**
   * @brief Handle the additional logic when a tick occurs
   */
  public notifyTick(): number {
    const ailmentRetInfo: AilmentReturnInfo = this.dmgManager.procAilments();
    const { lineClearInfoArr } = ailmentRetInfo;
    for (let i = 0; i < lineClearInfoArr.length; i += 1) {
      this.setClearRecord(
        lineClearInfoArr[i].info,
        true /* isClearingChallengeLine */,
      );
      this.shiftLinesUpByOne(this.challengeLine.idx);
      this.challengeLine.idx += 1;
    }

    return ailmentRetInfo.newGameIntervalMs;
  }

  /**
   * @brief: bitmapToNemeinCols: Convert a 1D array bitmap into an array of
   * NemeinCols
   * @param bitmap: Bitmap to be converted
   * @param boardWidth: Width of bitmap
   * @param boardHeight: Height of bitmap
   * @returns NemeinCol conversion of the bitmap
   * @note: The method assumes everything is settled, i.e. the lowest y values
   * will be different from what we expect
   */
  static bitmapToNemeinCols(
    bitmap: number[],
    boardWidth: number,
    boardHeight: number,
  ): NemeinCol[] {
    const ret: NemeinCol[] = [];
    if (bitmap.length === boardWidth * boardHeight) {
      for (let x = 0; x < boardWidth; x += 1) {
        const col: NemeinCol = {
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
            status: CellStatus.None,
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
   * @brief: NemeinColsToBitMap: Convert an array of NemeinCols into a 1D array
   * bitmap
   * @param field: NemeinCols array to convert
   * @returns 1D array bitmap conversion
   */
  static NemeinColsToBitmap(field: NemeinCol[]): number[] {
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

export default NemeinBoard;
