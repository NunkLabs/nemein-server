import { ChallengeLine, NemeinCol } from "./Board.js";
import { DEFAULT_TIME_INTERVAL_MS } from "./Nemein.js";
import { TetrominoType } from "./TetrominoManager.js";

/* Dmg consts */
export const DEFAULT_DMG_PER_LINE = 100;
export const DEFAULT_CRIT_DMG_MULTIPLIER = 1.2;

export const DEFAULT_IMPALE_HIT_PERC = 0.1;

export const DEFAULT_DAMAGING_AILMENT_DURATION_TICKS = 4;
export const DEFAULT_IGNITE_HIT_PERC = 0.8;

export const DEFAULT_CHILL_DURATION_TICKS = 2;
export const DEFAULT_CHILL_EFFECTIVENESS_PERC = 0.2;
export const DEFAULT_MIN_CHILL_EFFECTIVENESS = 0.05;
export const DEFAULT_MAX_CHILL_EFFECTIVENESS = 0.3;

export const DEFAULT_FREEZE_BASE_EFFECTIVENESS = 1;
export const DEFAULT_FREEZE_DURATION_TICKS = 1;
export const DEFAULT_FREEZE_EFFECTIVENESS_PERC = 0.05;

export const DEFAULT_SHOCK_DAMAGE_MULTI = 1;
export const DEFAULT_SHOCK_EFFECTIVENESS_PERC = 0.3;
export const DEFAULT_SHOCK_DURATION_TICKS = 3;

/* Defense consts */
export const DEFAULT_CELL_HP = 10;
export const DEFAULT_CHALLENGE_CELL_HP = 20;
export const DEFAULT_MAX_PHYS_REDUC = 90;
export const DEFAULT_CHALLENGE_CELL_PHYS_REDUC = 0;
export const DEFAULT_MAX_ELE_RES = 75;
export const DEFAULT_CHALLENGE_CELL_FIRE_RES = 0;
export const DEFAULT_CHALLENGE_CELL_COLD_RES = 0;
export const DEFAULT_CHALLENGE_CELL_LIGHTNING_RES = 0;

/* RNG consts */
export const DEFAULT_3_LINES_BASE_CHANCE_ACTIVATE_PERKS = 0.3;
export const DEFAULT_4_LINES_BASE_CHANCE_ACTIVATE_PERKS = 0.5;
export const DEFAULT_CRIT_INCREASED_CHANCE_ACTIVATE_PERKS = 1.0;

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

export enum DamagingAilment {
  Ignite,
}

export enum NonDamagingAilment {
  Chill,
  Freeze,
  Shock,
}

export type PerksInfo = {
  /* Phys */
  impale: boolean;
  impaleExtraDmgPerCell: number;
  /* Lightning */
  shock: boolean;
  shockDmgMulti: number;
  /* Fire */
  ignite: boolean;
  /* Cold */
  chill: boolean;
  freeze: boolean;
  /* TODO: Populate this later on with other types of ailments */
};

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

export type DamagingAilmentInstance = {
  dmgPerTick: number;
  durationTicks: number;
  dmgType: DmgType;
};

export type NonDamagingAilmentInstance = {
  effectiveness: number;
  durationTicks: number;
};

export type AilmentReturnInfo = {
  newGameIntervalMs: number;
  lineClearInfoArr: LineClearInfoPostMitigation[];
};

export class DmgManager {
  private field: NemeinCol[];

  private boardWidth: number;

  private boardHeight: number;

  private challengeLine: ChallengeLine;

  private perksInfo: PerksInfo;

  private damgingAilmentInstancesMap: Map<
    DamagingAilment,
    DamagingAilmentInstance[]
  >;

  private nonDamagingAilmentInstancesMap: Map<
    NonDamagingAilment,
    NonDamagingAilmentInstance[]
  >;

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
    this.perksInfo = {
      impale: false,
      impaleExtraDmgPerCell: 0,
      shock: false,
      shockDmgMulti: DEFAULT_SHOCK_DAMAGE_MULTI,
      ignite: false,
      chill: false,
      freeze: false,
    };
    this.damgingAilmentInstancesMap = new Map<
      DamagingAilment,
      DamagingAilmentInstance[]
    >([
      [DamagingAilment.Ignite, []],
      /* Add more if needed */
    ]);
    this.nonDamagingAilmentInstancesMap = new Map<
      NonDamagingAilment,
      NonDamagingAilmentInstance[]
    >([
      [NonDamagingAilment.Chill, []],
      [NonDamagingAilment.Freeze, []],
      [NonDamagingAilment.Shock, []],
      /* Add more if needed */
    ]);
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

        const lineDmgPool =
          (isLineValidForCrit
            ? DEFAULT_DMG_PER_LINE * DEFAULT_CRIT_DMG_MULTIPLIER
            : DEFAULT_DMG_PER_LINE) * this.perksInfo.shockDmgMulti;
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

    this.rollAndActivatePerks(ret);

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
              DEFAULT_MAX_PHYS_REDUC) +
          this.perksInfo.impaleExtraDmgPerCell;
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

  /**
   * @brief Deal damaging ailments to the current challenge line
   * @returns - Array of line clear info if multiple challange lines
   * are to be cleared in a single tick
   */
  public procAilments(): AilmentReturnInfo {
    const ret: AilmentReturnInfo = {
      newGameIntervalMs: DEFAULT_TIME_INTERVAL_MS,
      lineClearInfoArr: [],
    };

    ret.lineClearInfoArr = this.procDamagingAilments();
    ret.newGameIntervalMs = this.procNonDamagingAilments();

    return ret;
  }

  /**
   * @brief Check if an ailment has expired by checking if there's no pending instance of this
   * ailment type
   * @param ailmentInstances - Instances of ailment
   * @param ailmentType - Ailment type to check
   * @returns True if ailment of this type expired. False otw
   */
  private ailmentExpired(
    ailmentInstances: DamagingAilmentInstance[] | NonDamagingAilmentInstance[],
    ailmentType: DamagingAilment | NonDamagingAilment
  ): boolean {
    let ret = false;
    if (!ailmentInstances.length) {
      switch (ailmentType) {
        /* Ignite picks the instance that rolls the highest dmg per tick */
        case DamagingAilment.Ignite:
          this.perksInfo.ignite = false;
          break;
        case NonDamagingAilment.Chill:
          this.perksInfo.chill = false;
          break;
        case NonDamagingAilment.Freeze:
          this.perksInfo.freeze = false;
          break;
        case NonDamagingAilment.Shock:
          this.perksInfo.shock = false;
          this.perksInfo.shockDmgMulti = DEFAULT_SHOCK_DAMAGE_MULTI;
          break;
        default:
          break;
      }
      ret = true;
    }

    return ret;
  }

  /**
   * @brief Proc and deal damage to challenge line due to damaging ailment
   * @returns Post mitigation line clear info if challenge lines are cleared
   */
  private procDamagingAilments(): LineClearInfoPostMitigation[] {
    const ret: LineClearInfoPostMitigation[] = [];
    this.damgingAilmentInstancesMap.forEach(
      (value: DamagingAilmentInstance[], key: DamagingAilment) => {
        if (this.ailmentExpired(value, key)) {
          return;
        }

        let instanceInEffect: DamagingAilmentInstance = {
          dmgPerTick: 0,
          durationTicks: 0,
          dmgType: DmgType.Physical,
        };
        for (let i = 0; i < value.length; i += 1) {
          const ailmentInstance = value[i];
          if (!ailmentInstance.durationTicks) {
            value.splice(i, 1);
            i -= 1;
          } else {
            ailmentInstance.durationTicks -= 1;
            switch (key) {
              /* Ignite picks the instance that rolls the highest dmg per tick */
              case DamagingAilment.Ignite:
                if (ailmentInstance.dmgPerTick > instanceInEffect.dmgPerTick) {
                  instanceInEffect = ailmentInstance;
                }
                break;
              default:
                break;
            }
          }
        }

        const ailmentDmgInfo: DmgComposition = {
          physical: 0,
          fire:
            instanceInEffect.dmgType === DmgType.Fire
              ? instanceInEffect.dmgPerTick
              : 0,
          cold:
            instanceInEffect.dmgType === DmgType.Cold
              ? instanceInEffect.dmgPerTick
              : 0,
          lightning:
            instanceInEffect.dmgType === DmgType.Lightning
              ? instanceInEffect.dmgPerTick
              : 0,
        };
        const clearInfo: LineClearInfoPostMitigation = this.dealDmgToLine(
          { dmg: ailmentDmgInfo, lineIdx: 0, criticalHit: false },
          true /* isHittingChallengeLine */
        );
        if (clearInfo.isLineCleared) {
          ret.push(clearInfo);
        }
      }
    );

    return ret;
  }

  /**
   * @brief Proc and apply effect of non-damaging ailments
   * @returns New game interval being affected by the ailments
   */
  private procNonDamagingAilments(): number {
    let ret = DEFAULT_TIME_INTERVAL_MS;

    this.nonDamagingAilmentInstancesMap.forEach(
      (value: NonDamagingAilmentInstance[], key: NonDamagingAilment) => {
        if (this.ailmentExpired(value, key)) {
          return;
        }

        for (let i = 0; i < value.length; i += 1) {
          const ailmentInstance = value[i];
          if (!ailmentInstance.durationTicks) {
            value.splice(i, 1);
            i -= 1;
          } else {
            ailmentInstance.durationTicks -= 1;
            switch (key) {
              case NonDamagingAilment.Chill:
              /* Fallthrough */
              case NonDamagingAilment.Freeze: {
                const newGameIntervalMs =
                  DEFAULT_TIME_INTERVAL_MS *
                  (1 + ailmentInstance.effectiveness);
                if (newGameIntervalMs > ret) {
                  ret = newGameIntervalMs;
                }
                break;
              }
              case NonDamagingAilment.Shock: {
                const shockDmgMulti =
                  DEFAULT_SHOCK_DAMAGE_MULTI + ailmentInstance.effectiveness;
                if (shockDmgMulti > this.perksInfo.shockDmgMulti) {
                  this.perksInfo.shockDmgMulti = shockDmgMulti;
                }
                break;
              }
              default:
                break;
            }
          }
        }
      }
    );

    return ret;
  }

  /**
   * @brief: Roll and activate perks based on the lines clear info
   * @param infoArr - Array containing lines being cleared
   */
  private rollAndActivatePerks(infoArr: LineClearInfo[]) {
    const numLinesCleared = infoArr.length;
    if (numLinesCleared) {
      let totalPhysDmgPool = 0;
      let totalFireDmgPool = 0;
      let totalColdDmgPool = 0;
      let totalLightningDmgPool = 0;
      let criticalHitFound = false;

      for (let i = 0; i < numLinesCleared; i += 1) {
        const lineDmgComposition = infoArr[i].dmg;
        totalPhysDmgPool += lineDmgComposition.physical;
        totalFireDmgPool += lineDmgComposition.fire;
        totalColdDmgPool += lineDmgComposition.cold;
        totalLightningDmgPool += lineDmgComposition.lightning;
        criticalHitFound ||= infoArr[i].criticalHit;
      }

      let rollChance = 0;
      switch (numLinesCleared) {
        case 3:
          rollChance = DEFAULT_3_LINES_BASE_CHANCE_ACTIVATE_PERKS;
          break;
        case 4:
          rollChance = DEFAULT_4_LINES_BASE_CHANCE_ACTIVATE_PERKS;
          break;
        default:
          break;
      }

      if (rollChance) {
        /* Impale doesn't get any bonuses from crit */
        const impaleRollChance = rollChance;
        if (criticalHitFound) {
          const increasedCritChance =
            rollChance * DEFAULT_CRIT_INCREASED_CHANCE_ACTIVATE_PERKS;
          rollChance += increasedCritChance;
        }

        /* Each perk is rolled independently */
        if (totalPhysDmgPool) {
          this.handleImpale(
            totalPhysDmgPool,
            impaleRollChance,
            numLinesCleared
          );
        }
        const totalHpCleared =
          numLinesCleared * DEFAULT_CELL_HP * this.boardWidth;
        if (totalLightningDmgPool) {
          this.handleShock(totalLightningDmgPool, rollChance, totalHpCleared);
        }
        if (totalFireDmgPool) {
          this.handleIgnite(totalFireDmgPool, rollChance);
        }
        if (totalColdDmgPool) {
          this.handleChillFreeze(totalColdDmgPool, rollChance, totalHpCleared);
        }
      }
    }
  }

  /**
   * @brief Handler logic for impale & prepare effect
   * @param totalPhysDmgPool - Total phys damage pool dealt
   * @param impaleRollChance - Impale roll chance
   * @param numLinesCleared - Number of lines cleared in this tick
   */
  private handleImpale(
    totalPhysDmgPool: number,
    impaleRollChance: number,
    numLinesCleared: number
  ) {
    if (Math.random() < impaleRollChance) {
      this.perksInfo.impale = true;
      const currentTotalImpaleDmg =
        this.perksInfo.impaleExtraDmgPerCell *
        this.boardWidth *
        numLinesCleared;
      /* Next impale extra dmg = (current phys dmg pool + current impale extra dmg) * DEFAULT_IMPALE_HIT_PERC */
      this.perksInfo.impaleExtraDmgPerCell +=
        ((totalPhysDmgPool + currentTotalImpaleDmg) * DEFAULT_IMPALE_HIT_PERC) /
        numLinesCleared /
        this.boardWidth;
    } else {
      this.perksInfo.impale = false;
      this.perksInfo.impaleExtraDmgPerCell = 0;
    }
  }

  /**
   * @brief Handler logic for ignite & prepare effect
   * @param totalFireDmgPool - Total fire damage pool dealt
   * @param igniteRollChance - Ignite roll chance
   */
  private handleIgnite(totalFireDmgPool: number, igniteRollChance: number) {
    this.perksInfo.ignite = Math.random() < igniteRollChance;
    if (this.perksInfo.ignite) {
      const igniteInstancesArr = this.damgingAilmentInstancesMap.get(
        DamagingAilment.Ignite
      );
      if (igniteInstancesArr) {
        igniteInstancesArr.push({
          dmgPerTick:
            (totalFireDmgPool * DEFAULT_IGNITE_HIT_PERC) /
            DEFAULT_DAMAGING_AILMENT_DURATION_TICKS,
          durationTicks: DEFAULT_DAMAGING_AILMENT_DURATION_TICKS,
          dmgType: DmgType.Fire,
        });
      }
    }
  }

  /**
   * @brief Handler logic for chill & freeze
   * @param totalColdDmgPool - Total cold damage pool dealt
   * @param freezeRollChance - Freeze roll chance
   * @param totalHpCleared - Total HP of all cells cleared
   */
  private handleChillFreeze(
    totalColdDmgPool: number,
    freezeRollChance: number,
    totalHpCleared: number
  ) {
    this.perksInfo.chill = true;
    const chillInstancesArr = this.nonDamagingAilmentInstancesMap.get(
      NonDamagingAilment.Chill
    );
    const chillEffectiveness = Math.min(
      (totalColdDmgPool / totalHpCleared) * DEFAULT_CHILL_EFFECTIVENESS_PERC,
      DEFAULT_MAX_CHILL_EFFECTIVENESS
    );
    if (
      chillInstancesArr &&
      chillEffectiveness >= DEFAULT_MIN_CHILL_EFFECTIVENESS
    ) {
      chillInstancesArr.push({
        effectiveness: chillEffectiveness,
        durationTicks: DEFAULT_CHILL_DURATION_TICKS,
      });
    }

    this.perksInfo.freeze = Math.random() < freezeRollChance;
    if (this.perksInfo.freeze) {
      const freezeInstancesArr = this.nonDamagingAilmentInstancesMap.get(
        NonDamagingAilment.Freeze
      );
      const freezeEffectiveness =
        DEFAULT_FREEZE_BASE_EFFECTIVENESS +
        (totalColdDmgPool / totalHpCleared) * DEFAULT_FREEZE_EFFECTIVENESS_PERC;
      if (freezeInstancesArr) {
        freezeInstancesArr.push({
          effectiveness: freezeEffectiveness,
          durationTicks: DEFAULT_FREEZE_DURATION_TICKS,
        });
      }
    }
  }

  /**
   * @brief Handler logic for shock
   * @param totalLightningDmgPool - Total lightning damage pool dealt
   * @param shockRollChance - Shock roll chance
   * @param totalHpCleared - Total HP of all cells cleared
   */
  private handleShock(
    totalLightningDmgPool: number,
    shockRollChance: number,
    totalHpCleared: number
  ) {
    this.perksInfo.shock = Math.random() < shockRollChance;
    if (this.perksInfo.shock) {
      const shockInstancesArr = this.nonDamagingAilmentInstancesMap.get(
        NonDamagingAilment.Shock
      );
      const shockEffectiveness =
        (totalLightningDmgPool / totalHpCleared) *
        DEFAULT_SHOCK_EFFECTIVENESS_PERC;
      if (shockInstancesArr) {
        shockInstancesArr.push({
          effectiveness: shockEffectiveness,
          durationTicks: DEFAULT_SHOCK_DURATION_TICKS,
        });
      }
    }
  }
}

export default DmgManager;
