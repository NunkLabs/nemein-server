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

export enum CellStatus {
  None,
  Impaled,
  Shocked,
  Ignited,
  Chilled,
  Frozen,
}

export enum DmgType {
  Physical,
  Fire,
  Cold,
  Lightning,
}

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
  criticalHit: boolean;
};

export type LineClearInfoPostMitigation = {
  info: LineClearInfo;
  isLineCleared: boolean;
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
          criticalHit: isLineValidForCrit,
        });
      }
    }

    return ret;
  }

  /**
   * @brief: Deals dmg to all available cells in a line
   * @param info - Info containing index of line to deal dmg + dmg pool
   * @param isHittingChallengeLine - Bool indicating whether or not we're
   * hitting a challenge line
   * @returns object containing post-mitigation dmg pool + whether or not the
   * line is actually cleared
   */
  public dealDmgToLine(
    info: LineClearInfo,
    isHittingChallengeLine: boolean
  ): LineClearInfoPostMitigation {
    const ret: LineClearInfoPostMitigation = { info, isLineCleared: false };
    let numCellsCleared = 0;
    const lineIdx = isHittingChallengeLine
      ? this.challengeLine.idx
      : info.lineIdx;

    const dmgCompPerCell: DmgComposition = {
      physical: Math.floor(info.dmg.physical / this.boardWidth),
      fire: Math.floor(info.dmg.fire / this.boardWidth),
      cold: Math.floor(info.dmg.cold / this.boardWidth),
      lightning: Math.floor(info.dmg.lightning / this.boardWidth),
    };

    let totalPhysDmgDealt = 0;
    let totalFireDmgDealt = 0;
    let totalColdDmgDealt = 0;
    let totalLightningDmgDealt = 0;

    if (lineIdx >= 0 && lineIdx < this.boardHeight) {
      for (let col = 0; col < this.boardWidth; col += 1) {
        const cell = this.field[col].colArr[lineIdx];

        const physDmgDealtToCell =
          dmgCompPerCell.physical *
          ((DEFAULT_MAX_PHYS_REDUC - cell.def.physReduc) /
            DEFAULT_MAX_PHYS_REDUC);
        totalPhysDmgDealt += physDmgDealtToCell;

        const fireDmgDealtToCell =
          dmgCompPerCell.fire *
          ((DEFAULT_MAX_ELE_RES - cell.def.fireRes) / DEFAULT_MAX_ELE_RES);
        totalFireDmgDealt += fireDmgDealtToCell;

        const coldDmgDealtToCell =
          dmgCompPerCell.cold *
          ((DEFAULT_MAX_ELE_RES - cell.def.coldRes) / DEFAULT_MAX_ELE_RES);
        totalColdDmgDealt += coldDmgDealtToCell;

        const lightningDmgDealtToCell =
          dmgCompPerCell.lightning *
          ((DEFAULT_MAX_ELE_RES - cell.def.lightningRes) / DEFAULT_MAX_ELE_RES);
        totalLightningDmgDealt += lightningDmgDealtToCell;
        /* TODO: Handle more dmg + def types later */

        cell.hp -=
          physDmgDealtToCell +
          fireDmgDealtToCell +
          coldDmgDealtToCell +
          lightningDmgDealtToCell;

        if (cell.hp <= 0) {
          numCellsCleared += 1;
          cell.type = TetrominoType.Blank;
        }
      }

      if (isHittingChallengeLine) {
        ret.info.dmg = {
          physical: totalPhysDmgDealt,
          fire: totalFireDmgDealt,
          cold: totalColdDmgDealt,
          lightning: totalLightningDmgDealt,
        };
      }

      ret.isLineCleared = numCellsCleared === this.boardWidth;
    }

    return ret;
  }
}

export default DmgManager;
