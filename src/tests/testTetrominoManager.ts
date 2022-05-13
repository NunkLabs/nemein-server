import { assert } from "chai";

import {
  MAX_SPAWNED_TETROMINOS,
  TetrominoManager,
  Tetromino,
  TetrominoRotation,
  TetrominoType,
} from "../core/tetrominoManager";

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
      describe("Held Tetromino is blank", () => {
        const testTetrominoManager = new TetrominoManager();
        const testPrevActiveTetromino =
          testTetrominoManager.getActiveTetromino();
        testTetrominoManager.swapHeldTetromino();
        const testHeldTetromino = testTetrominoManager.getHeldTetromino();
        const testActiveTetromino = testTetrominoManager.getActiveTetromino();
        it("Should correctly swap the held & active Tetrominos", () => {
          assert.isTrue(
            testHeldTetromino.type !== TetrominoType.Blank &&
              testHeldTetromino.type !== TetrominoType.Ghost,
            "Held Tetromino is not correctly swapped"
          );
          assert.notDeepEqual(
            testActiveTetromino,
            testPrevActiveTetromino,
            "Active Tetromino is not correctly swapped"
          );
          assert.deepStrictEqual(
            testHeldTetromino.rotation,
            TetrominoRotation.O,
            "Held Tetromino's rotation is not correctly set"
          );
        });
      });
      describe(`Held Tetromino is not blank`, () => {
        const testTetrominoManager = new TetrominoManager();
        /* Gotta swap twice to get to this test case */
        testTetrominoManager.swapHeldTetromino();
        const testPrevActiveTetromino =
          testTetrominoManager.getActiveTetromino();
        const testPrevHeldTetromino = testTetrominoManager.getHeldTetromino();
        testTetrominoManager.swapHeldTetromino();
        const testHeldTetromino = testTetrominoManager.getHeldTetromino();
        const testActiveTetromino = testTetrominoManager.getActiveTetromino();
        it("Should correctly swap the held & active Tetrominos", () => {
          assert.deepStrictEqual(
            testHeldTetromino,
            testPrevActiveTetromino,
            "Held Tetromino is not correctly swapped"
          );
          assert.deepStrictEqual(
            testActiveTetromino,
            testPrevHeldTetromino,
            "Active Tetromino is not correctly swapped"
          );
          assert.strictEqual(
            testHeldTetromino.rotation,
            TetrominoRotation.O,
            "Held Tetromino's rotation is not correctly set"
          );
        });
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
  });
});
