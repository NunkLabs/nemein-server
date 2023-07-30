import logger from "../../utils/Logger.js";
import { DmgType } from "./DmgManager.js";

export type Perk = {
  level: number;
  effectiveness: number;
};

export const LEVEL_EFFECTIVENESS_MAPPING_ARR = [
  /* Physical */ new Map<number, number>([
    [1, 0.1],
    [2, 0.15],
    [3, 0.2],
  ]),
  /* Fire */ new Map<number, number>([
    [1, 0.6],
    [2, 0.8],
    [3, 1.0],
  ]),
  /* Cold */ new Map<number, number>([
    [1, 0.6],
    [2, 0.8],
    [3, 1.0],
  ]),
  /* Lightning */ new Map<number, number>([
    [1, 0.6],
    [2, 0.8],
    [3, 1.0],
  ]),
];

export class PerksManager {
  private perksMap: Map<DmgType, Perk>;

  constructor() {
    this.perksMap = new Map<DmgType, Perk>();

    const totalDmgTypesArr = [];
    for (let type = DmgType.Physical; type < DmgType.NumDmgType; type += 1) {
      totalDmgTypesArr.push(type);
    }
    const randomizedDmgTypes = PerksManager.getRandomSubarray(
      totalDmgTypesArr,
      DmgType.NumDmgType - 1,
    );

    for (let i = 0; i < randomizedDmgTypes.length; i += 1) {
      const dmgType = randomizedDmgTypes[i];
      const effectiveness = LEVEL_EFFECTIVENESS_MAPPING_ARR[dmgType].get(1);
      if (effectiveness !== undefined) {
        this.perksMap.set(dmgType, {
          level: 1,
          effectiveness,
        });
      }
    }

    /**
     * This logic is solely for the purpose of printing out the rolled
     * perks since we haven't yet got any indicators for these
     */
    let perksInfo = "";
    this.perksMap.forEach((value, key) => {
      switch (key) {
        case DmgType.Physical:
          perksInfo += "Physical";
          break;
        case DmgType.Fire:
          perksInfo += "Fire";
          break;
        case DmgType.Cold:
          perksInfo += "Cold";
          break;
        case DmgType.Lightning:
          perksInfo += "Lightning";
          break;
        default:
          break;
      }
      perksInfo += "; ";
    });
    logger.info(`Perks rolled: ${perksInfo}`);
  }

  /**
   * @brief Get the effectiveness from a perk of a damage type
   * @param dmgType - Damage type's effectiveness from perk
   * @returns Effectiveness (percentage) of the damage type. 0% if
   * there's no available perks related to this damage type
   */
  public getEffectiveness(dmgType: DmgType): number {
    let ret = 0;
    const perk = this.perksMap.get(dmgType);
    if (perk !== undefined) {
      ret = perk.effectiveness;
    }
    return ret;
  }

  /**
   * @brief Pick a random damage types subarray
   * @note: Ref from https://stackoverflow.com/a/11935263
   * @param arr - Input array to pick random subarray from
   * @param size - Size of desired subarray
   * @returns Subarray of damage types
   */
  private static getRandomSubarray(arr: DmgType[], size: number): DmgType[] {
    let ret: DmgType[] = [];

    if (size > arr.length) {
      logger.error(
        `Input size is larger than sample array (${size} vs ${arr.length})`,
      );
    } else {
      const shuffled = arr.slice(0);
      let i = arr.length;
      const min = i - size;
      let temp;
      let index;
      while (i > min) {
        i -= 1;
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
      }
      ret = shuffled.slice(min);
    }

    return ret;
  }
}

export default PerksManager;
