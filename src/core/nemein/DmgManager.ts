import { ChallengeLine, NemeinCol } from "./Board.js";
import { TetrominoType } from "./TetrominoManager.js";

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

export class DmgManager {
  private field: NemeinCol[];

  private boardWidth: number;

  private boardHeight: number;

  private challengeLine: ChallengeLine;

  constructor(
    field: NemeinCol[],
    boardWidth: number,
    boardHeight: number,
    challengeLine: ChallengeLine
  ) {
    this.field = field;
    this.boardHeight = boardHeight;
    this.boardWidth = boardWidth;
    this.challengeLine = challengeLine;
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
          row === this.challengeLine.idx || row === this.challengeLine.idx - 1;

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
   * @brief Attempt to deal dmg to the current challenge line
   * @param info - Info containing dmg pool info
   * @returns true if dmg pool is enough to clear the current challenge line. False otw
   */
  public dealDmgToChallengeLine(info: LineClearInfo): boolean {
    let ret = false;

    if (this.challengeLine.idx < this.boardHeight) {
      const dmgCompPerCell: DmgComposition = {
        physical: Math.floor(info.dmg.physical / this.boardWidth),
        fire: Math.floor(info.dmg.fire / this.boardWidth),
        cold: Math.floor(info.dmg.cold / this.boardWidth),
        lightning: Math.floor(info.dmg.lightning / this.boardWidth),
      };

      ret =
        this.dealDmgToLine(this.challengeLine.idx, dmgCompPerCell) ===
        this.boardWidth;
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
  public dealDmgToLine(
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
}

export default DmgManager;
