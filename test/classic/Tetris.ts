import { assert } from "chai";

import { step } from "mocha-steps";

import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  SPACE,
  C_KEY,
  NUMPAD_2,
  NUMPAD_6,
  NUMPAD_4,
  NUMPAD_1,
  NUMPAD_5,
  NUMPAD_9,
  NUMPAD_8,
  SHIFT,
  NUMPAD_0,
  NUMPAD_7,
  CTRL,
  NUMPAD_3,
  Z_KEY,
  DEFAULT_TIME_INTERVAL_MS,
  LOCK_DELAY_MS,
  Classic,
} from "../../src/core/classic/Classic";

import { Y_START, TetrisBoard } from "../../src/core/classic/Board";

import {
  Tetromino,
  TetrominoRotation,
  TetrominoType,
} from "../../src/core/classic/TetrominoManager";

const DEFAULT_TEST_BOARD_WIDTH = 6;
const DEFAULT_TEST_BOARD_HEIGHT = 10;
const DEFAULT_TEST_NUM_DOWN_COMMAND_RUNS = 2;

describe("Classic", () => {
  describe(`Test initilization`, () => {
    const testTetris = new Classic(
      DEFAULT_TEST_BOARD_WIDTH,
      DEFAULT_TEST_BOARD_HEIGHT
    );
    const testGameStates = testTetris.updateClassicStates();
    /**
     * We're ignoring checking the values of corX, corY, ghostCorY, Tetrominos,
     * field, etc. here as they are already covered in the TetrisBoard &
     * TetrominoManager tests
     */
    it("Should return default state values", () => {
      assert.strictEqual(
        testGameStates.gameOver,
        false,
        "Game over value is incorrect"
      );
      assert.strictEqual(
        testGameStates.corX,
        Math.floor((DEFAULT_TEST_BOARD_WIDTH - 1) / 2),
        "Starting position corX is incorrect"
      );
      assert.strictEqual(
        testGameStates.corY,
        Y_START,
        "Starting position corY is incorrect"
      );
      assert.strictEqual(testGameStates.score, 0, "Score value is incorrect");
      assert.strictEqual(testGameStates.level, 1, "Level value is incorrect");
      assert.strictEqual(
        testGameStates.gameInterval,
        DEFAULT_TIME_INTERVAL_MS,
        "Game interval value is incorrect"
      );
    });
  });

  describe("Test public methods", () => {
    describe("Test input handling", () => {
      /**
       * FIXME: It is way too extensive for now to test all Tetromino types and
       * rotations. Hence, we're only testing 1 case of (T, O) pair Tetromino
       */
      const testOverwrittenTetromino: Tetromino = {
        type: TetrominoType.T,
        rotation: TetrominoRotation.O,
      };

      step("Should correctly render on down input", () => {
        const testCommands = [ARROW_DOWN, NUMPAD_2];
        testCommands.forEach((command) => {
          const testTetris = new Classic(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT,
            testOverwrittenTetromino
          );
          /* Init command */
          let testGameStates = testTetris.inputHandle(command);
          // prettier-ignore
          let testBitmap = [
            0, 3, 3, 3, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 8, 0, 0, 0,
            0, 8, 8, 8, 0, 0,
          ];
          assert.deepStrictEqual(
            TetrisBoard.tetrisColsToBitmap(testGameStates.field),
            testBitmap,
            `Bitmap incorrect on command ${command} (first)`
          );

          /* Actual down command */
          testGameStates = testTetris.inputHandle(command);
          // prettier-ignore
          testBitmap = [
            0, 0, 3, 0, 0, 0,
            0, 3, 3, 3, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 8, 0, 0, 0,
            0, 8, 8, 8, 0, 0,
          ];
          assert.deepStrictEqual(
            TetrisBoard.tetrisColsToBitmap(testGameStates.field),
            testBitmap,
            `Bitmap incorrect on command ${command} (second)`
          );
        });
      });

      step("Should correctly render active Tetromino right 1 unit", () => {
        const testCommands = [ARROW_RIGHT, NUMPAD_6];
        testCommands.forEach((command) => {
          const testTetris = new Classic(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT,
            testOverwrittenTetromino
          );
          for (
            let numRuns = 0;
            numRuns < DEFAULT_TEST_NUM_DOWN_COMMAND_RUNS;
            numRuns += 1
          ) {
            testTetris.inputHandle(ARROW_DOWN);
          }
          const testGameStates = testTetris.inputHandle(command);
          // prettier-ignore
          const testBitmap = [
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
          assert.deepStrictEqual(
            TetrisBoard.tetrisColsToBitmap(testGameStates.field),
            testBitmap,
            `Bitmap incorrect on command ${command}`
          );
        });
      });

      step("Should correctly render active Tetromino left 1 unit", () => {
        const testCommands = [ARROW_LEFT, NUMPAD_4];
        testCommands.forEach((command) => {
          const testTetris = new Classic(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT,
            testOverwrittenTetromino
          );
          for (
            let numRuns = 0;
            numRuns < DEFAULT_TEST_NUM_DOWN_COMMAND_RUNS;
            numRuns += 1
          ) {
            testTetris.inputHandle(ARROW_DOWN);
          }
          const testGameStates = testTetris.inputHandle(command);
          // prettier-ignore
          const testBitmap = [
              0, 3, 0, 0, 0, 0,
              3, 3, 3, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 8, 0, 0, 0, 0,
              8, 8, 8, 0, 0, 0,
            ];
          assert.deepStrictEqual(
            TetrisBoard.tetrisColsToBitmap(testGameStates.field),
            testBitmap,
            `Bitmap incorrect on command ${command}`
          );
        });
      });

      step(
        "Should correctly render active Tetromino rotated once clockwised",
        () => {
          const testCommands = [ARROW_UP, NUMPAD_1, NUMPAD_5, NUMPAD_9];
          testCommands.forEach((command) => {
            const testTetris = new Classic(
              DEFAULT_TEST_BOARD_WIDTH,
              DEFAULT_TEST_BOARD_HEIGHT,
              testOverwrittenTetromino
            );
            for (
              let numRuns = 0;
              numRuns < DEFAULT_TEST_NUM_DOWN_COMMAND_RUNS;
              numRuns += 1
            ) {
              testTetris.inputHandle(ARROW_DOWN);
            }
            const testGameStates = testTetris.inputHandle(command);
            // prettier-ignore
            const testBitmap = [
              0, 0, 3, 0, 0, 0,
              0, 0, 3, 3, 0, 0,
              0, 0, 3, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 8, 0, 0, 0,
              0, 0, 8, 8, 0, 0,
              0, 0, 8, 0, 0, 0,
            ];
            assert.deepStrictEqual(
              TetrisBoard.tetrisColsToBitmap(testGameStates.field),
              testBitmap,
              `Bitmap incorrect on command ${command}`
            );
          });
        }
      );

      step(
        "Should correctly render active Tetromino rotated once counterclockwised",
        () => {
          const testCommands = [CTRL, Z_KEY, NUMPAD_3, NUMPAD_7];
          testCommands.forEach((command) => {
            const testTetris = new Classic(
              DEFAULT_TEST_BOARD_WIDTH,
              DEFAULT_TEST_BOARD_HEIGHT,
              testOverwrittenTetromino
            );
            for (
              let numRuns = 0;
              numRuns < DEFAULT_TEST_NUM_DOWN_COMMAND_RUNS;
              numRuns += 1
            ) {
              testTetris.inputHandle(ARROW_DOWN);
            }
            const testGameStates = testTetris.inputHandle(command);
            // prettier-ignore
            const testBitmap = [
              0, 0, 3, 0, 0, 0,
              0, 3, 3, 0, 0, 0,
              0, 0, 3, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 8, 0, 0, 0,
              0, 8, 8, 0, 0, 0,
              0, 0, 8, 0, 0, 0,
            ];
            assert.deepStrictEqual(
              TetrisBoard.tetrisColsToBitmap(testGameStates.field),
              testBitmap,
              `Bitmap incorrect on command ${command}`
            );
          });
        }
      );

      step("Should correctly render active Tetromino hard-dropped", () => {
        const testCommands = [SPACE, NUMPAD_8];
        testCommands.forEach((command) => {
          const testTetris = new Classic(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT,
            testOverwrittenTetromino
          );
          for (
            let numRuns = 0;
            numRuns < DEFAULT_TEST_NUM_DOWN_COMMAND_RUNS;
            numRuns += 1
          ) {
            testTetris.inputHandle(ARROW_DOWN);
          }
          const testGameStates = testTetris.inputHandle(command);
          // prettier-ignore
          const testBitmap = [
              0, 0, 3, 0, 0, 0,
              0, 3, 3, 3, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 8, 0, 0, 0,
              0, 8, 8, 8, 0, 0,
              0, 0, 3, 0, 0, 0,
              0, 3, 3, 3, 0, 0,
            ];
          assert.deepStrictEqual(
            TetrisBoard.tetrisColsToBitmap(testGameStates.field),
            testBitmap,
            `Bitmap incorrect on command ${command}`
          );
        });
      });

      step("Should correctly hold the active Tetromino", () => {
        const testCommands = [C_KEY, NUMPAD_0, SHIFT];
        testCommands.forEach((command) => {
          const testTetris = new Classic(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT,
            testOverwrittenTetromino
          );
          for (
            let numRuns = 0;
            numRuns < DEFAULT_TEST_NUM_DOWN_COMMAND_RUNS;
            numRuns += 1
          ) {
            testTetris.inputHandle(ARROW_DOWN);
          }
          const testGameStates = testTetris.inputHandle(command);
          assert.strictEqual(
            testGameStates.heldTetromino,
            testOverwrittenTetromino.type,
            `Held Tetromino incorrect on command ${command}`
          );
        });
      });
    });

    describe("Test lock delay", () => {
      /**
       * FIXME: It is way too extensive for now to test all Tetromino types and
       * rotations. Hence, we're only testing 1 case of (T, O) pair Tetromino
       */
      const testOverwrittenTetromino: Tetromino = {
        type: TetrominoType.T,
        rotation: TetrominoRotation.O,
      };
      const testTetris = new Classic(
        DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT,
        testOverwrittenTetromino,
        true
      );
      step("Should correctly add a lock delay of 0.5s", () => {
        for (let run = 0; run < DEFAULT_TEST_BOARD_HEIGHT; run += 1) {
          const testGameStates = testTetris.inputHandle(ARROW_DOWN);
          if (run > 0 && run < DEFAULT_TEST_BOARD_HEIGHT - 1) {
            assert.strictEqual(
              testGameStates.gameInterval,
              0,
              `Game interval
              incorrect at iter ${run}/${DEFAULT_TEST_BOARD_HEIGHT - 1}`
            );
          } else if (run === DEFAULT_TEST_BOARD_HEIGHT - 1) {
            assert.strictEqual(
              testGameStates.gameInterval,
              LOCK_DELAY_MS,
              `Game interval incorrect at iter ${run}/
              ${DEFAULT_TEST_BOARD_HEIGHT - 1}`
            );
          }
        }
      });
    });
  });
});
