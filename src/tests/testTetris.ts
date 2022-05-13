import { assert } from "chai"

import { step } from "mocha-steps"

import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  SPACE,
  C_KEY,
  DEFAULT_TIME_INTERVAL_MS,
  Tetris,
  TetrisStates,
} from "../core/tetris"

import {
  TetrisBoard
} from "../core/tetrisBoard";

import {
  Tetromino, TetrominoRotation, TetrominoType
} from "../core/tetrominoManager";

const DEFAULT_TEST_BOARD_WIDTH = 6;
const DEFAULT_TEST_BOARD_HEIGHT = 10;

describe(`Tetris`, () => {
  describe(`Test initilization`, () => {
    const testTetris = new Tetris(DEFAULT_TEST_BOARD_WIDTH,
      DEFAULT_TEST_BOARD_HEIGHT);
    const testGameStates = testTetris.updateGameStates();
    /**
     * We're ignoring checking the values of corX, corY, ghostCorY, Tetrominos,
     * field, etc. here as they are already covered in the TetrisBoard &
     * TetrominoManager tests
     */
    it(`Should return default state values`, () => {
      assert.strictEqual(testGameStates.gameOver, false, `Game over value is
        incorrect`);
      assert.strictEqual(testGameStates.score, 0, `Score value is incorrect`);
      assert.strictEqual(testGameStates.level, 1, `Level value is incorrect`);
      assert.strictEqual(testGameStates.gameInterval, DEFAULT_TIME_INTERVAL_MS,
        `Game interval value is incorrect`);
    });
  });

  describe(`Test public methods`, () => {
    describe(`Test input handling`, () => {
      /**
       * FIXME: It is way too extensive for now to test all Tetromino types and
       * rotations. Hence, we're only testing 1 case of (T, O) pair Tetromino
       */
      const testOverwrittenTetromino: Tetromino = {
        type: TetrominoType.T,
        rotation: TetrominoRotation.O
      };
      const testTetris = new Tetris(DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT, testOverwrittenTetromino);
      let testGameStates: TetrisStates;
      let testBitmap: number[] = [];

      step(`Should correctly render init on first ARROW_DOWN input`, () => {
        testGameStates = testTetris.inputHandle(ARROW_DOWN);
        testBitmap = [
          0, 0, 3, 3, 3, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 8, 0, 0,
          0, 0, 8, 8, 8, 0,
        ];
        assert.deepStrictEqual(TetrisBoard.tetrisColsToBitmap(
          testGameStates.field), testBitmap, `Bitmap incorrect`);
      });


      step(`Should correctly render active Tetromino down 1 unit on the next
        ARROW_DOWN inputs`, () => {
        testGameStates = testTetris.inputHandle(ARROW_DOWN);
        testBitmap = [
          0, 0, 0, 3, 0, 0,
          0, 0, 3, 3, 3, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 8, 0, 0,
          0, 0, 8, 8, 8, 0,
        ];
        assert.deepStrictEqual(TetrisBoard.tetrisColsToBitmap(
          testGameStates.field), testBitmap, `Bitmap incorrect`);
      });

      step(`Should correctly render active Tetromino right 1 unit on the next
        ARROW_RIGHT inputs`, () => {
        testGameStates = testTetris.inputHandle(ARROW_RIGHT);
        testBitmap = [
          0, 0, 0, 0, 3, 0,
          0, 0, 0, 3, 3, 3,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 8, 0,
          0, 0, 0, 8, 8, 8,
        ];
        assert.deepStrictEqual(TetrisBoard.tetrisColsToBitmap(
          testGameStates.field), testBitmap, `Bitmap incorrect`);
      });

      step(`Should correctly render active Tetromino down 1 unit on the next
        ARROW_LEFT inputs`, () => {
        testGameStates = testTetris.inputHandle(ARROW_LEFT);
        testBitmap = [
          0, 0, 0, 3, 0, 0,
          0, 0, 3, 3, 3, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 8, 0, 0,
          0, 0, 8, 8, 8, 0,
        ];
        assert.deepStrictEqual(TetrisBoard.tetrisColsToBitmap(
          testGameStates.field), testBitmap);
      });

      step(`Should correctly render active Tetromino rotated once on
        ARROW_UP inputs`, () => {
        testGameStates = testTetris.inputHandle(ARROW_UP);
        testBitmap = [
          0, 0, 0, 3, 0, 0,
          0, 0, 0, 3, 3, 0,
          0, 0, 0, 3, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 8, 0, 0,
          0, 0, 0, 8, 8, 0,
          0, 0, 0, 8, 0, 0,
        ];
        assert.deepStrictEqual(TetrisBoard.tetrisColsToBitmap(
          testGameStates.field), testBitmap, `Bitmap incorrect`);
      });

      step(`Should correctly render active Tetromino hard-dropped on
        SPACE inputs`, () => {
        testGameStates = testTetris.inputHandle(SPACE);
        testBitmap = [
          0, 0, 0, 3, 0, 0,
          0, 0, 3, 3, 3, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 8, 0, 0,
          0, 0, 8, 8, 8, 0,
          0, 0, 0, 3, 0, 0,
          0, 0, 0, 3, 3, 0,
          0, 0, 0, 3, 0, 0,
        ];
        assert.deepStrictEqual(TetrisBoard.tetrisColsToBitmap(
          testGameStates.field), testBitmap);
      });

      step(`Should correctly hold the active Tetromino on C_KEY inputs`, () => {
        testGameStates = testTetris.inputHandle(C_KEY);
        assert.strictEqual(testGameStates.heldTetromino,
          testOverwrittenTetromino.type, `Held Tetromino incorrect`);
      });
    });
  });
});
