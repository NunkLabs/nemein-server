/* Misc consts */
export const MAX_PIXEL = 4;
export const MAX_ROTATE = 4;
export const MAX_WALL_KICK_TESTS = 5;
export const Y_START = 0;
export const X_INDEX = 0;
export const Y_INDEX = 1;
export const UPPER_Y_INDEX = 1;
export const LOWER_Y_INDEX = 0;
export const UPPER_X_INDEX = 3;
export const LOWER_X_INDEX = 2;
export const MAX_SPAWNED_TETROMINOS = 4;
export const EARLY_LEVEL_MULTIPLIER = 60;
export const LATE_LEVEL_MULTIPLIER = 0.5;
export const INTERVAL_CAP = 900;
export const LEVEL_UP_TETROMINOS_COUNT = 10;
export const DEFAULT_BOARD_WIDTH = 14;
export const DEFAULT_BOARD_HEIGHT = 23;

/* Tetrominos coords consts */
export const MAX_TETROMINO_INDEX = 7;
export const MIN_TETROMINO_INDEX = 1;
export const GHOST_TETROMINO_INDEX = 8;
export const WALL_KICK_COR_OFFSETS = [
  /* O --> R */
  [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  /* R --> Z */
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  /* Z --> L */
  [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  /* L --> O */
  [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
];
export const TETROMINOS_COORDS_ARR = [
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
export const RENDER_TETROMINOS_ARR = [
  [
    /* Blank */
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    /* 2x2 square tetromino */
    [0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    /* I tetromino */
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 2, 2, 2, 2],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    /* T tetromino */
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 3, 0, 0],
    [0, 3, 3, 3, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    /* J tetromino */
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 4, 0, 0, 0],
    [0, 4, 4, 4, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    /* L tetromino */
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 5, 0],
    [0, 5, 5, 5, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    /* Z tetromino */
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 6, 6, 0, 0],
    [0, 0, 6, 6, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    /* S tetromino */
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 7, 7, 0],
    [0, 7, 7, 0, 0],
    [0, 0, 0, 0, 0],
  ],
];

/* Keyboard event consts */
export const ARROW_DOWN = "ArrowDown";
export const ARROW_LEFT = "ArrowLeft";
export const ARROW_UP = "ArrowUp";
export const ARROW_RIGHT = "ArrowRight";
export const SPACE = " ";
export const C_KEY = "c";
export const KEYBOARD_EVENT = "keydown";

/* Timer consts */
export const DEFAULT_TIME_INTERVAL_MS = 1000;

/* Enum 'types' */
export enum Command {
  Down,
  Left,
  Right,
  Rotate,
  HardDrop,
  HoldTetromino,
}

export enum Tetromino {
  Blank,
  Square,
  I,
  T,
  J,
  L,
  Z,
  S,
}

export enum Rotation {
  O,
  R,
  Z,
  L,
}
