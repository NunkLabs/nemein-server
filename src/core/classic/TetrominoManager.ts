/* Indexes consts */
export const X_INDEX = 0;
export const Y_INDEX = 1;
export const UPPER_Y_INDEX = 1;
export const LOWER_Y_INDEX = 0;
export const UPPER_X_INDEX = 3;
export const LOWER_X_INDEX = 2;

/* Misc consts */
export const MAX_SPAWNED_TETROMINOS = 6;
export const WALL_KICK_IMPOSSIBLE_CASE_T_O_INDEX = 3;
export const WALL_KICK_IMPOSSIBLE_CASE_T_Z_INDEX = 2;
export const JLSTZ_WALL_KICK_COR_OFFSETS = [
  [
    /* O --> R */
    [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
    /* O --> L */
    [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
  ],
  [
    /* R --> Z */
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, -2],
      [1, -2],
    ],
    /* R --> O */
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, -2],
      [1, -2],
    ],
  ],
  [
    /* Z --> L */
    [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    /* Z --> R */
    [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
  ],
  [
    /* L --> O */
    [
      [0, 0],
      [-1, 0],
      [-1, 1],
      [0, -2],
      [-1, -2],
    ],
    /* L --> Z */
    [
      [0, 0],
      [-1, 0],
      [-1, 1],
      [0, -2],
      [-1, -2],
    ],
  ],
];

export const I_WALL_KICK_COR_OFFSETS = [
  [
    /* O --> R */
    [
      [1, 0],
      [-1, 0],
      [2, 0],
      [-1, -1],
      [2, -2],
    ],
    /* O --> L */
    [
      [0, 1],
      [-1, 1],
      [2, 1],
      [-1, -1],
      [2, 2],
    ],
  ],
  [
    /* R --> Z */
    [
      [0, 1],
      [-1, 1],
      [2, 1],
      [-2, -1],
      [2, 2],
    ],
    /* R --> O */
    [
      [-1, 0],
      [1, 0],
      [-2, 0],
      [1, 1],
      [-2, 2],
    ],
  ],
  [
    /* Z --> L */
    [
      [-1, 0],
      [1, 0],
      [-2, 0],
      [1, -1],
      [-2, 2],
    ],
    /* Z --> R */
    [
      [0, -1],
      [1, -1],
      [-2, -1],
      [2, 1],
      [-2, -2],
    ],
  ],
  [
    /* L --> O */
    [
      [0, -1],
      [1, -1],
      [-2, -1],
      [1, 1],
      [-2, -2],
    ],
    /* L --> Z */
    [
      [1, 0],
      [-1, 0],
      [2, 0],
      [-1, 1],
      [2, -2],
    ],
  ],
];

/* Tetromino const arrays */
const TETROMINOS_COORDS_ARR = [
  /**
   * Each element in this array represents all 4 rotations of 1 tetromino
   * Each rotation consists of 4 pixel coordinates [x, y] of the tetromino
   *
   * NOTE: there are places where the coordinate is -1, this is to specify
   * which pixel is the center of rotation. Center of rotation is [0, 0]
   */
  [
    /* Blank */
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  ],
  [
    /* 2x2 square tetromino */
    [
      [0, -1],
      [1, 0],
      [0, 0],
      [1, -1],
    ],
    [
      [0, 0],
      [1, 1],
      [0, 1],
      [1, 0],
    ],
    [
      [-1, 0],
      [0, 1],
      [-1, 1],
      [0, 0],
    ],
    [
      [-1, -1],
      [0, 0],
      [-1, 0],
      [0, -1],
    ],
  ],
  [
    /* I tetromino */
    [
      [1, 0],
      [0, 0],
      [-1, 0],
      [2, 0],
    ],
    [
      [0, -1],
      [0, 2],
      [0, 0],
      [0, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [-2, 0],
      [1, 0],
    ],
    [
      [0, -2],
      [0, 1],
      [0, 0],
      [0, -1],
    ],
  ],
  [
    /* T tetromino */
    [
      [0, -1],
      [0, 0],
      [-1, 0],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 1],
      [0, 0],
      [1, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [-1, 0],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 1],
      [-1, 0],
      [0, 0],
    ],
  ],
  [
    /* J tetromino */
    [
      [-1, -1],
      [0, 0],
      [-1, 0],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 1],
      [0, 0],
      [1, -1],
    ],
    [
      [0, 0],
      [1, 1],
      [-1, 0],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 1],
      [-1, 1],
      [0, 0],
    ],
  ],
  [
    /* L tetromino */
    [
      [1, -1],
      [0, 0],
      [-1, 0],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 1],
      [0, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [-1, 1],
      [-1, 0],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 1],
      [-1, -1],
      [0, 0],
    ],
  ],
  [
    /* Z tetromino */
    [
      [0, -1],
      [0, 0],
      [-1, -1],
      [1, 0],
    ],
    [
      [1, -1],
      [0, 1],
      [0, 0],
      [1, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [-1, 0],
      [1, 1],
    ],
    [
      [0, -1],
      [-1, 1],
      [-1, 0],
      [0, 0],
    ],
  ],
  [
    /* S tetromino */
    [
      [0, -1],
      [0, 0],
      [-1, 0],
      [1, -1],
    ],
    [
      [0, -1],
      [1, 1],
      [0, 0],
      [1, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [-1, 1],
      [1, 0],
    ],
    [
      [-1, -1],
      [0, 1],
      [-1, 0],
      [0, 0],
    ],
  ],
];

const MAX_TETROMINO_INDEX = 7;
const MIN_TETROMINO_INDEX = 1;
const SQUARE_TETROMINO_NUM_TESTS_TO_REMOVE = 4;

/* Enum types */
export enum TetrominoType {
  Blank,
  Square,
  I,
  T,
  J,
  L,
  Z,
  S,
  Grey,
  Ghost,
  NumTetrominoTypes,
}

export enum TetrominoRotation {
  O,
  R,
  Z,
  L,
  NumTetrominoRotations,
}

export enum TetrominoRotateDirection {
  Clockwise,
  Counterclockwise,
  NumTetrominoDirections,
}

export const DEFAULT_TEST_OVERWRITTEN_TETROMINO: Tetromino = {
  type: TetrominoType.Blank,
  rotation: TetrominoRotation.O,
};

/* Tetromino types */
export type Tetromino = {
  type: TetrominoType;
  rotation: TetrominoRotation;
};

export class TetrominoManager {
  private activeTetromino: Tetromino;

  private spawnedTetrominos: Tetromino[];

  private heldTetromino: Tetromino;

  /* This only applies when we're in a test env */
  private dbgOverwrittenTetromino: Tetromino;

  constructor(
    dbgOverwrittenTetromino: Tetromino = DEFAULT_TEST_OVERWRITTEN_TETROMINO,
  ) {
    this.activeTetromino = {
      type: TetrominoType.Blank,
      rotation: TetrominoRotation.O,
    };
    this.spawnedTetrominos = [];
    this.heldTetromino = {
      type: TetrominoType.Blank,
      rotation: TetrominoRotation.O,
    };
    this.dbgOverwrittenTetromino = dbgOverwrittenTetromino;

    this.initTetrominoManager();
  }

  /**
   * @brief: initTetrominoManager: Spawning tetrominos and populating the
   * Tetrominos queue based using randomization
   */
  private initTetrominoManager(): void {
    /**
     * We wanna add an additional tetromino so that we can immediately pop
     * as the game begins
     */
    for (let spawn = 0; spawn < MAX_SPAWNED_TETROMINOS + 1; spawn += 1) {
      this.addNewTetrominoToQueue();
    }

    this.getNewTetromino();
  }

  /**
   * @brief: addNewTetrominoToQueue: Spawn and a new Tetromino to the spawned
   * Tetrominos queue
   * @note: We add in our desired overwritten Tetromino if we're overwritting
   * with a valid Tetromino AND the env is test
   */
  private addNewTetrominoToQueue(): void {
    let newTetromino: Tetromino;
    if (
      this.dbgOverwrittenTetromino !== DEFAULT_TEST_OVERWRITTEN_TETROMINO &&
      process.env.NODE_ENV === "test"
    ) {
      newTetromino = this.dbgOverwrittenTetromino;
    } else {
      const spawnedTetrominoType =
        Math.floor(
          Math.random() * (MAX_TETROMINO_INDEX - MIN_TETROMINO_INDEX + 1),
        ) + 1;
      newTetromino = {
        type: spawnedTetrominoType,
        rotation: TetrominoRotation.O,
      };
    }
    this.spawnedTetrominos.push(newTetromino);
  }

  /**
   * @brief: setActiveTetromino: Set the current active Tetromino
   * @param tetromino: Tetromino to be set as active
   */
  public setActiveTetromino(tetromino: Tetromino): void {
    this.activeTetromino = tetromino;
  }

  /**
   * @brief: swapHeldTetromino: Swap the held Tetromino with the active one
   */
  public swapHeldTetromino(): void {
    /* If there was a previously held tetromino, we have to switch the
    held one vs the one to be held */
    if (this.heldTetromino.type !== TetrominoType.Blank) {
      const prevTetromino = this.activeTetromino;
      this.activeTetromino = this.heldTetromino;
      this.heldTetromino = prevTetromino;
    } else {
      this.heldTetromino = this.activeTetromino;
      this.getNewTetromino();
    }

    /* Change the held Tetromino's rotation to the default rotation (O) */
    this.heldTetromino.rotation = TetrominoRotation.O;
  }

  /**
   * @brief: getNewTetromino: Get a tetromino from the spawned Tetrominos queue.
   * If the queue's size is less than the maximum size, we add to it
   * a new Tetromino.
   * @return: The new active Tetromino
   */
  public getNewTetromino(): Tetromino {
    const retTetromino = this.spawnedTetrominos.shift();
    if (retTetromino) {
      this.activeTetromino = retTetromino;
    } else {
      throw new Error("Cannot fetch a new tetromino from queue");
    }

    /* Add a new Tetromino to spawned tetrominos queue if size is less than max
    size */
    if (this.spawnedTetrominos.length < MAX_SPAWNED_TETROMINOS) {
      this.addNewTetrominoToQueue();
    }

    return structuredClone(this.activeTetromino);
  }

  /**
   * @brief: getActiveTetromino: Get the current active Tetromino
   * @returns Current active Tetromino
   */
  public getActiveTetromino(): Tetromino {
    return structuredClone(this.activeTetromino);
  }

  /**
   * @brief: getSpawnedTetrominos: Get the current spawned Tetrominos queue
   * @param onlyTypeNeeded: Indicate whether or not we only need the Tetromino
   * types
   * @returns Current spawned Tetrominos queue
   */
  public getSpawnedTetrominos(
    onlyTypeNeeded: boolean,
  ): Tetromino[] | TetrominoType[] {
    if (onlyTypeNeeded) {
      const ret: TetrominoType[] = [];
      for (
        let tetrominoIdx = 0;
        tetrominoIdx < MAX_SPAWNED_TETROMINOS;
        tetrominoIdx += 1
      ) {
        ret.push(this.spawnedTetrominos[tetrominoIdx].type);
      }
      return ret;
    }
    return structuredClone(this.spawnedTetrominos);
  }

  /**
   * @brief: getHeldTetromino: Get the current held Tetromino
   * @returns Current held Tetromino
   */
  public getHeldTetromino(): Tetromino {
    return structuredClone(this.heldTetromino);
  }

  /**
   * @brief: getTetrominoCoords: Get the coordinates of the input Tetromino
   * @param type: Type of Tetromino
   * @param rotation: Rotation of Tetromino
   * @returns: Array of coordinates of the input Tetromino
   */
  static getTetrominoCoords(
    type: TetrominoType,
    rotation: TetrominoRotation,
  ): number[][] {
    return TETROMINOS_COORDS_ARR[type][rotation];
  }

  /**
   * @brief: getTetrominoWallKickOffsets: Get the x and y offsets to be tested
   * in SRS's wall kick
   * @param type: Type of Tetromino
   * @param rotation: Rotation of tetromino
   * @param direction: Direction to be rotated
   * @returns: Array of coordinates of the wall kick offset to be tested
   */
  static getTetrominoWallKickOffsets(
    type: TetrominoType,
    rotation: TetrominoRotation,
    direction: TetrominoRotateDirection,
  ): number[][] {
    let ret: number[][] = [];

    if (type !== TetrominoType.Blank && type !== TetrominoType.Ghost) {
      /* I Tetromino's wall kick offsets are different */
      ret =
        type === TetrominoType.I
          ? JSON.parse(
              JSON.stringify(I_WALL_KICK_COR_OFFSETS[rotation][direction]),
            )
          : JSON.parse(
              JSON.stringify(JLSTZ_WALL_KICK_COR_OFFSETS[rotation][direction]),
            );
      if (type === TetrominoType.T) {
        if (rotation === TetrominoRotation.O) {
          ret.splice(WALL_KICK_IMPOSSIBLE_CASE_T_O_INDEX, 1);
        } else if (rotation === TetrominoRotation.Z) {
          ret.splice(WALL_KICK_IMPOSSIBLE_CASE_T_Z_INDEX, 1);
        }
      } else if (type === TetrominoType.Square) {
        /* In case of the Square Tetromino, wall kick offset is always (0,0) */
        for (
          let popIdx = 0;
          popIdx < SQUARE_TETROMINO_NUM_TESTS_TO_REMOVE;
          popIdx += 1
        ) {
          ret.pop();
        }
      }
    }
    return ret;
  }
}

export default TetrominoManager;
