import { assert } from "chai";

import {
  MAX_SPAWNED_TETROMINOS,
  JLSTZ_WALL_KICK_COR_OFFSETS,
  I_WALL_KICK_COR_OFFSETS,
  WALL_KICK_IMPOSSIBLE_CASE_T_O_INDEX,
  WALL_KICK_IMPOSSIBLE_CASE_T_Z_INDEX,
  TetrominoManager,
  Tetromino,
  TetrominoRotation,
  TetrominoType,
  TetrominoRotateDirection,
} from "../src/core/TetrominoManager.js";

describe("TetrominoManager", () => {
  describe("Test initilization", () => {
    const testTetrominoManager = new TetrominoManager();
    const testActiveTetromino = testTetrominoManager.getActiveTetromino();
    const testSpawnedTetrominos =
      testTetrominoManager.getSpawnedTetrominos(false);
    const testHeldTetromino = testTetrominoManager.getHeldTetromino();
    it("Should return a valid active Tetromino", () => {
      assert.isTrue(
        testActiveTetromino.type !== TetrominoType.Blank &&
          testActiveTetromino.type !== TetrominoType.Ghost,
        "Active Tetromino's type is invalid"
      );
      assert.strictEqual(
        testActiveTetromino.rotation,
        TetrominoRotation.O,
        "Active Tetromino's rotation is invalid"
      );
    });
    it(`Should return a spawned Tetrominos array of size MAX_SPAWNED_
      TETROMINOS`, () => {
      assert.lengthOf(
        testSpawnedTetrominos,
        MAX_SPAWNED_TETROMINOS,
        "Spawned Tetrominos array does not have correct length"
      );
    });
    it(`Should return an empty held Tetromino`, () => {
      assert.strictEqual(
        testHeldTetromino.type,
        TetrominoType.Blank,
        "Held Tetromino's type is invalid"
      );
      assert.strictEqual(
        testHeldTetromino.rotation,
        TetrominoRotation.O,
        "Held Tetromino's rotation is invalid"
      );
    });
  });

  describe("Test public methods", () => {
    describe("Test setting active Tetromino", () => {
      const testTetrominoManager = new TetrominoManager();
      const testActiveTetrominoToSet: Tetromino = {
        type: TetrominoType.T,
        rotation: TetrominoRotation.R,
      };
      testTetrominoManager.setActiveTetromino(testActiveTetrominoToSet);
      it("Should correctly set an active Tetromino", () => {
        assert.deepStrictEqual(
          testTetrominoManager.getActiveTetromino(),
          testActiveTetrominoToSet,
          "Active Tetromino set is incorrect"
        );
      });
    });

    describe("Test swapping held Tetromino", () => {
      const testTetrominoManager = new TetrominoManager();
      testTetrominoManager.swapHeldTetromino();
      const testHeldTetromino = testTetrominoManager.getHeldTetromino();
      it("Should correctly swap the held Tetromino", () => {
        assert.isTrue(
          testHeldTetromino.type !== TetrominoType.Blank &&
            testHeldTetromino.type !== TetrominoType.Ghost,
          "Held Tetromino is not correctly swapped"
        );
        assert.deepStrictEqual(
          testHeldTetromino.rotation,
          TetrominoRotation.O,
          "Held Tetromino's rotation is not correctly set"
        );
      });
    });

    describe("Test swapping held Tetromino", () => {
      const testTetrominoManager = new TetrominoManager();
      const testTetrominoToFetch = testTetrominoManager
        .getSpawnedTetrominos(false)
        .at(0);
      const testActiveTetromino = testTetrominoManager.getNewTetromino();
      it(`Should correctly get a new Tetromino and replace the current
        Active Tetromino`, () => {
        assert.deepStrictEqual(
          testActiveTetromino,
          testTetrominoToFetch,
          "Active Tetromino differs from the Tetromino to fetch"
        );
        assert.strictEqual(
          testTetrominoManager.getSpawnedTetrominos(false).length,
          MAX_SPAWNED_TETROMINOS,
          "Spawned Tetrominos length is not prevserved"
        );
      });
    });

    describe("Test Tetrominos' wall kick offsets", () => {
      it(`Should correctly get the wall kick offsets`, () => {
        for (
          let type = TetrominoType.Blank;
          type < TetrominoType.NumTetrominoTypes;
          type += 1
        ) {
          for (
            let rotation = TetrominoRotation.O;
            rotation < TetrominoRotation.NumTetrominoRotations;
            rotation += 1
          ) {
            for (
              let direction = TetrominoRotateDirection.Clockwise;
              direction < TetrominoRotateDirection.NumTetrominoDirections;
              direction += 1
            ) {
              const offsets = TetrominoManager.getTetrominoWallKickOffsets(
                type,
                rotation,
                direction
              );
              let cmpOffsets: number[][] = [];
              switch (type) {
                case TetrominoType.Blank:
                  break;
                case TetrominoType.Square:
                  cmpOffsets = [[0, 0]];
                  break;
                case TetrominoType.I:
                  cmpOffsets = I_WALL_KICK_COR_OFFSETS[rotation][direction];
                  break;
                case TetrominoType.T:
                  cmpOffsets = JLSTZ_WALL_KICK_COR_OFFSETS[rotation][direction];
                  if (rotation === TetrominoRotation.O) {
                    cmpOffsets.splice(WALL_KICK_IMPOSSIBLE_CASE_T_O_INDEX, 1);
                  } else if (rotation === TetrominoRotation.Z) {
                    cmpOffsets.splice(WALL_KICK_IMPOSSIBLE_CASE_T_Z_INDEX, 1);
                  }
                  break;
                case TetrominoType.J:
                /* Fallthrough */
                case TetrominoType.L:
                /* Fallthrough */
                case TetrominoType.Z:
                /* Fallthrough */
                case TetrominoType.S:
                  cmpOffsets = JLSTZ_WALL_KICK_COR_OFFSETS[rotation][direction];
                  break;
                case TetrominoType.Ghost:
                  break;
                default:
                  break;
              }
              assert.deepStrictEqual(
                offsets,
                cmpOffsets,
                `Offsets differ for Tetromino ${type}, rotation ${rotation},
                direction ${direction}`
              );
            }
          }
        }
      });
    });
  });
});
