import { assert } from "chai";

import {
  DEFAULT_BOARD_WIDTH,
  DEFAULT_BOARD_HEIGHT,
  TetrisBoard,
  TetrisCol,
} from "../src/core/TetrisBoard.js";

import {
  TetrominoRotation,
  TetrominoType,
} from "../src/core/TetrominoManager.js";

const DEFAULT_TEST_BOARD_WIDTH = 6;
const DEFAULT_TEST_BOARD_HEIGHT = 10;
const DEFAULT_TEST_NUM_CLEAR_LINES = 4;
const DEFAULT_TEST_TETROMINO_TYPE = TetrominoType.T;
const DEFAULT_TEST_TETROMINO_ROTATION = TetrominoRotation.O;

describe("TetrisBoard", () => {
  describe("Test initilization", () => {
    describe("Without input arguments", () => {
      const testBoard = new TetrisBoard();
      const testField: TetrisCol[] = testBoard.getField();

      it("Should return a playfield with correct DEFAULT_BOARD_WIDTH", () => {
        assert.lengthOf(
          testField,
          DEFAULT_BOARD_WIDTH,
          `Width is not ${DEFAULT_BOARD_WIDTH}`
        );
      });

      it("Should return a playfield with correct DEFAULT_BOARD_HEIGHT", () => {
        for (let x = 0; x < DEFAULT_BOARD_WIDTH; x += 1) {
          assert.lengthOf(
            testField[x].colArr,
            DEFAULT_BOARD_HEIGHT,
            `Col ${x}'s length is not ${DEFAULT_BOARD_HEIGHT}`
          );
        }
      });

      it(`Should return a playfield with correct lowest y values for each
      column`, () => {
        for (let x = 0; x < DEFAULT_BOARD_WIDTH; x += 1) {
          assert.strictEqual(
            testField[x].lowestY,
            DEFAULT_BOARD_HEIGHT - 1,
            `Col[${x}] does not have lowest y value of
            ${DEFAULT_BOARD_HEIGHT - 1}`
          );
        }
      });

      it("Should return a playfield only blank pixels", () => {
        for (let x = 0; x < DEFAULT_BOARD_WIDTH; x += 1) {
          const col = testField[x].colArr;
          for (let y = 0; y < DEFAULT_BOARD_HEIGHT; y += 1) {
            assert.strictEqual(
              col[y].type,
              TetrominoType.Blank,
              `Pixel ${x} on row ${y} is not blank`
            );
          }
        }
      });
    });

    describe("With input arguments", () => {
      const testBoard = new TetrisBoard(
        DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT
      );
      const testField = testBoard.getField();

      it("Should return a playfield with correct input board width", () => {
        assert.lengthOf(
          testField,
          DEFAULT_TEST_BOARD_WIDTH,
          `Width is not ${DEFAULT_TEST_BOARD_WIDTH}`
        );
      });

      it("Should return a playfield with correct input board height", () => {
        for (let x = 0; x < DEFAULT_TEST_BOARD_WIDTH; x += 1) {
          assert.lengthOf(
            testField[x].colArr,
            DEFAULT_TEST_BOARD_HEIGHT,
            `Col ${x}'s length is not ${DEFAULT_TEST_BOARD_HEIGHT}`
          );
        }
      });

      it(`Should return a playfield with correct lowest y values for each
      column`, () => {
        for (let x = 0; x < DEFAULT_TEST_BOARD_WIDTH; x += 1) {
          assert.strictEqual(
            testField[x].lowestY,
            DEFAULT_TEST_BOARD_HEIGHT - 1,
            `Col[${x}] does not have lowest y value of 
            ${DEFAULT_TEST_BOARD_HEIGHT - 1}`
          );
        }
      });

      it("Should return a playfield only blank pixels", () => {
        for (let x = 0; x < DEFAULT_TEST_BOARD_WIDTH; x += 1) {
          const col = testField[x].colArr;
          for (let y = 0; y < DEFAULT_TEST_BOARD_HEIGHT; y += 1) {
            assert.strictEqual(
              col[y].type,
              TetrominoType.Blank,
              `Pixel ${x} on row ${y} is not blank`
            );
          }
        }
      });
    });
  });

  describe("Test public methods", () => {
    describe("Test clearing lines", () => {
      const testBoard = new TetrisBoard(
        DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT
      );
      // prettier-ignore
      const testBitmap = [
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1,
      ];
      /* Set and update testField */
      const fieldToUpdate = TetrisBoard.bitmapToTetrisCols(
        testBitmap,
        DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT
      );
      testBoard.setField(fieldToUpdate);

      it("Should return the correct number of cleared lines", () => {
        assert.strictEqual(
          testBoard.clearLines({ dmg: 99999, linesIdxArr: [9, 8, 7, 6] }),
          DEFAULT_TEST_NUM_CLEAR_LINES,
          `Number of cleared lines is not ${DEFAULT_TEST_NUM_CLEAR_LINES}`
        );
      });
    });

    describe("Test updating lowest y values", () => {
      /**
       * FIXME: It is way too extensive for now to test all Tetromino types and
       * rotations. Hence, we're only testing 1 case of (T, O) pair Tetromino
       *
       * We're putting the test Tetromino right in the middle of the board to
       * make sure that the lowest y values are updated. Moreover, the only use
       * case where `updateColLowestY` is called is when a movement is blocked,
       * which already guaranteed that the Tetromino must have a valid COR.
       * Hence, there's no point in testing other COR coordinates
       */
      const testBoard = new TetrisBoard(
        DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT
      );
      const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
      const testCorY = DEFAULT_TEST_BOARD_HEIGHT / 2;
      testBoard.updateColLowestY(
        testCorX,
        testCorY,
        DEFAULT_TEST_TETROMINO_TYPE,
        DEFAULT_TEST_TETROMINO_ROTATION
      );
      const testField = testBoard.getField();
      it("Should update the correct lowest y values", () => {
        assert.strictEqual(
          testField[testCorX].lowestY,
          testCorY - 1,
          `Middle lowest y value is not ${testCorY - 1}`
        );
        assert.strictEqual(
          testField[testCorX - 1].lowestY,
          testCorY,
          `Left lowest y value is not ${testCorY}`
        );
        assert.strictEqual(
          testField[testCorX + 1].lowestY,
          testCorY,
          `Right lowest y value is not ${testCorY}`
        );
      });
    });

    describe("Test rendering Tetromino", () => {
      /**
       * FIXME: It is way too extensive for now to test all Tetromino types and
       * rotations. Hence, we're only testing 1 case of (T, O) pair Tetromino
       */
      describe("Test rendering newly spawned Tetromino", () => {
        const testBoard = new TetrisBoard(
          DEFAULT_TEST_BOARD_WIDTH,
          DEFAULT_TEST_BOARD_HEIGHT
        );
        const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
        const testCorY = 0;
        // prettier-ignore
        const testBitmap = [
          0, 0, 3, 3, 3, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
        ];
        testBoard.renderTetromino(
          testCorX,
          testCorY,
          DEFAULT_TEST_TETROMINO_TYPE,
          DEFAULT_TEST_TETROMINO_ROTATION,
          DEFAULT_TEST_TETROMINO_TYPE
        );
        it("Should render correctly", () => {
          assert.deepStrictEqual(
            testBitmap,
            TetrisBoard.tetrisColsToBitmap(testBoard.getField()),
            "Returned bitmap is incorrect"
          );
        });
      });

      describe("Test rendering Tetromino on blocked movement", () => {
        const testBoard = new TetrisBoard(
          DEFAULT_TEST_BOARD_WIDTH,
          DEFAULT_TEST_BOARD_HEIGHT
        );
        const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
        const testCorY = DEFAULT_TEST_BOARD_HEIGHT - 1;
        // prettier-ignore
        const testBitmap = [
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0,
          0, 0, 0, 3, 0, 0,
          0, 0, 3, 3, 3, 0,
        ];
        testBoard.renderTetromino(
          testCorX,
          testCorY,
          DEFAULT_TEST_TETROMINO_TYPE,
          DEFAULT_TEST_TETROMINO_ROTATION,
          DEFAULT_TEST_TETROMINO_TYPE
        );
        it("Should render correctly", () => {
          assert.deepStrictEqual(
            testBitmap,
            TetrisBoard.tetrisColsToBitmap(testBoard.getField()),
            "Returned bitmap is incorrect"
          );
        });
      });
    });

    describe("Test rendering checking of Tetromino", () => {
      /**
       * FIXME: It is way too extensive for now to test all Tetromino types and
       * rotations. Hence, we're only testing 1 case of (T, O) pair Tetromino
       */
      describe("Newly spawned Tetromino", () => {
        describe("Test renderable", () => {
          const testBoard = new TetrisBoard(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT
          );
          const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
          const testCorY = 0;
          it("Should be able to render", () => {
            assert.strictEqual(
              true,
              testBoard.isTetrominoRenderable(
                true,
                testCorX,
                testCorY,
                DEFAULT_TEST_TETROMINO_TYPE,
                DEFAULT_TEST_TETROMINO_ROTATION
              ),
              "The Tetromino returned non-renderable"
            );
          });
        });

        describe("Test non-renderable", () => {
          const testBoard = new TetrisBoard(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT
          );
          const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
          const testCorY = 0;
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
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
          ];
          testBoard.setField(
            TetrisBoard.bitmapToTetrisCols(
              testBitmap,
              DEFAULT_TEST_BOARD_WIDTH,
              DEFAULT_TEST_BOARD_HEIGHT
            )
          );
          it("Should not be able to render", () => {
            assert.strictEqual(
              false,
              testBoard.isTetrominoRenderable(
                true,
                testCorX,
                testCorY,
                DEFAULT_TEST_TETROMINO_TYPE,
                DEFAULT_TEST_TETROMINO_ROTATION
              ),
              "The Tetromino returned renderable"
            );
          });
        });
      });

      describe("Non-newly spawned Tetromino", () => {
        describe("Test renderable", () => {
          const testBoard = new TetrisBoard(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT
          );
          const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
          /**
           * Value depends largely on which type of Tetromino, hence board
           * height / 2 is a safe bet here
           */
          const testCorY = DEFAULT_TEST_BOARD_HEIGHT / 2;
          it("Should be able to render", () => {
            assert.strictEqual(
              true,
              testBoard.isTetrominoRenderable(
                false,
                testCorX,
                testCorY,
                DEFAULT_TEST_TETROMINO_TYPE,
                DEFAULT_TEST_TETROMINO_ROTATION
              ),
              "The Tetromino returned non-renderable"
            );
          });
        });

        describe("Test non-renderable", () => {
          const testBoard = new TetrisBoard(
            DEFAULT_TEST_BOARD_WIDTH,
            DEFAULT_TEST_BOARD_HEIGHT
          );
          const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
          const testCorY = DEFAULT_TEST_BOARD_HEIGHT / 2;
          // prettier-ignore
          const testBitmap = [
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 3, 0, 0,
            0, 0, 3, 3, 3, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
          ];
          testBoard.setField(
            TetrisBoard.bitmapToTetrisCols(
              testBitmap,
              DEFAULT_TEST_BOARD_WIDTH,
              DEFAULT_TEST_BOARD_HEIGHT
            )
          );
          it("Should not be able to render", () => {
            assert.strictEqual(
              false,
              testBoard.isTetrominoRenderable(
                true,
                testCorX,
                testCorY,
                DEFAULT_TEST_TETROMINO_TYPE,
                DEFAULT_TEST_TETROMINO_ROTATION
              ),
              "The Tetromino returned renderable"
            );
          });
        });
      });
    });

    describe("Test ghost Tetromino coord's y value finding", () => {
      /**
       * FIXME: It is way too extensive for now to test all Tetromino types and
       * rotations. Hence, we're only testing 1 case of (T, O) pair Tetromino
       */
      const testBoard = new TetrisBoard(
        DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT
      );
      const testCorX = DEFAULT_TEST_BOARD_WIDTH / 2;
      const testCorY = 0;
      // prettier-ignore
      const testBitmap = [
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 3, 0,
        0, 0, 0, 3, 3, 3,
        0, 0, 0, 3, 0, 0,
        0, 0, 3, 3, 3, 0,
      ];
      testBoard.setField(
        TetrisBoard.bitmapToTetrisCols(
          testBitmap,
          DEFAULT_TEST_BOARD_WIDTH,
          DEFAULT_TEST_BOARD_HEIGHT
        )
      );
      it(`Should find the ghost y value that is dictated by the lowest y
        among the number of cols this tetromino spans`, () => {
        /**
         * FIXME: The value again depends largely on the setup and the input
         * Tetromino. This test setup is arbitrarily created. We should find
         * another better way to extensively test this
         */
        assert.strictEqual(
          DEFAULT_TEST_BOARD_HEIGHT / 2,
          testBoard.findGhostTetrominoY(
            testCorX,
            testCorY,
            DEFAULT_TEST_TETROMINO_TYPE,
            DEFAULT_TEST_TETROMINO_ROTATION
          ),
          "Ghost y value found is incorrect"
        );
      });
    });

    describe("Test ghost Tetromino coord's y value preparing", () => {
      const testBoard = new TetrisBoard(
        DEFAULT_TEST_BOARD_WIDTH,
        DEFAULT_TEST_BOARD_HEIGHT
      );
      it(`Should find the ghost y value that is dictated by the lowest y
      among the number of cols this tetromino spans`, () => {
        for (
          let type = TetrominoType.Blank;
          type < TetrominoType.NumTetrominoTypes;
          type += 1
        ) {
          if (type !== TetrominoType.Ghost && type !== TetrominoType.Blank) {
            const prepGhostY = testBoard.prepareGhostTetrominoY(
              type,
              DEFAULT_TEST_TETROMINO_ROTATION
            );
            assert.strictEqual(
              DEFAULT_TEST_BOARD_HEIGHT - 1,
              prepGhostY,
              "Ghost y value prepared is incorrect"
            );
          }
        }
      });
    });
  });
});
