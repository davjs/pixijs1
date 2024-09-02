// Function to move falling blocks to the left
function moveFallingBlocksToLeft() {
  fallingBlocks.forEach((e) => {
    if (isAnyLaneToLeftFree(e)) {
      e.lane -= 1;
      e.x = getLaneX(app, e.lane);
    }
  });
}

// Function to move falling blocks to the right
function moveFallingBlocksToRight() {
  fallingBlocks.forEach((e) => {
    if (isAnyLaneToRightFree(e)) {
      e.lane += 1;
      e.x = getLaneX(app, e.lane);
    }
  });
}

// Function to check if any lane to the left is free
function isAnyLaneToLeftFree(fallingBlock) {
  for (let laneIndex = 0; laneIndex < fallingBlock.lane; laneIndex++) {
    let hasFreeSLot = !fallingBlocks.some(
      (x) => x.rowIndex == fallingBlock.rowIndex && x.lane == laneIndex
    );
    if (hasFreeSLot) return true;
  }
  return false;
}

// Function to check if any lane to the right is free
function isAnyLaneToRightFree(fallingBlock) {
  for (let laneIndex = fallingBlock.lane + 1; laneIndex < lanes; laneIndex++) {
    let hasFreeSLot = !fallingBlocks.some(
      (x) => x.rowIndex == fallingBlock.rowIndex && x.lane == laneIndex
    );
    if (hasFreeSLot) return true;
  }
  return false;
}
