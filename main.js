import {
  Application,
  Text,
  Sprite,
  Assets,
  TextStyle,
  Graphics,
} from 'pixi.js';

let lanes = 5;
let boxes = [];

let colors = {
  background: '#FFEECF',
  player: '#C9A690',
  enemy: '#DB8098',
  upgrade: '#253C78',
  number: '#F2E9E3',
};
const textStyle = new TextStyle({
  fill: '#ffffff',
});

// Bullet properties
const bulletSpeed = 5;
const bulletSize = 10;
const bulletColor = colors.player;

let fallingBlocks = [];
let laneSize = 80;
let fallingBlockSize = 50;
let boxSize = 50;
let boxMargin = 40;

function getLaneX(app, laneIndex) {
  return app.screen.width / 2 + laneIndex * laneSize - (laneSize * lanes) / 2;
}

function updateValue(block, delta) {
  block.value += delta;
  block.valueText.text = block.value;
}

function spawnFallingBlock(
  app,
  laneIndex,
  rowIndex,
  color,
  value,
  onCollision,
  isDamaged,
  prefix = ''
) {
  let fallingBlock = new Graphics()
    .rect(
      -fallingBlockSize / 2,
      -fallingBlockSize / 2,
      fallingBlockSize,
      fallingBlockSize
    )
    .fill(color);
  fallingBlock.x = getLaneX(app, laneIndex);
  fallingBlock.y = 0;
  fallingBlock.lane = laneIndex;
  fallingBlock.rowIndex = rowIndex;
  fallingBlock.value = value;
  fallingBlock.onCollision = onCollision;
  fallingBlock.isDamaged = isDamaged;

  let displayValue = value;
  if (prefix === 'x') {
    displayValue = 'x' + value;
  }

  const valueText = new Text(displayValue, textStyle);
  valueText.anchor.set(0.5, 0.5);
  valueText.tint = colors.text;
  fallingBlock.addChild(valueText);
  fallingBlock.valueText = valueText;
  fallingBlocks.push(fallingBlock);
  app.stage.addChild(fallingBlock);
}

function fireBullet(app, box) {
  const bullet = new Graphics()
    .rect(-bulletSize / 2, -bulletSize / 2, bulletSize, bulletSize)
    .fill(colors.player);

  bullet.x = box.x;
  bullet.y = box.y - boxSize / 2;
  bullet.value = box.value;

  app.stage.addChild(bullet);

  box.bullets = box.bullets || [];
  box.bullets.push(bullet);
}

(async () => {
  const app = new Application();
  await app.init({ background: colors.background, resizeTo: window });
  document.body.appendChild(app.canvas);

  for (let i = 0; i < lanes; i++) {
    let box = new Graphics()
      .rect(-boxSize / 2, -boxSize / 2, boxSize, boxSize)
      .fill(colors.player);
    box.x = getLaneX(app, i);
    box.y = app.screen.height - boxSize - boxMargin;
    app.stage.addChild(box);
    let value = Math.floor(Math.random() * 4) + 1;
    const valueText = new Text(value, textStyle);
    valueText.tint = colors.text;
    valueText.anchor.set(0.5, 0.5);
    box.addChild(valueText);
    box.valueText = valueText;
    box.value = value;
    boxes.push(box);
  }

  document.addEventListener('keydown', async function (event) {
    event.preventDefault();
    if (event.keyCode == 37) {
      fallingBlocks.forEach((e) => {
        let anyFree = false;
        for (let laneIndex = 0; laneIndex < e.lane; laneIndex++) {
          let hasFreeSLot = !fallingBlocks.some(
            (x) => x.rowIndex == e.rowIndex && x.lane == laneIndex
          );
          anyFree ||= hasFreeSLot;
        }
        if (e.lane > 0 && anyFree) {
          e.lane -= 1;
          e.x = getLaneX(app, e.lane);
        }
      });
    } else if (event.keyCode == 39) {
      fallingBlocks.forEach((e) => {
        let anyFree = false;
        for (let laneIndex = e.lane; laneIndex < lanes; laneIndex++) {
          let hasFreeSLot = !fallingBlocks.some(
            (x) => x.rowIndex == e.rowIndex && x.lane == laneIndex
          );
          anyFree ||= hasFreeSLot;
        }
        if (e.lane < lanes - 1 && anyFree) {
          e.lane += 1;
          e.x = getLaneX(app, e.lane);
        }
      });
    }
  });

  let rowIndex = 0;
  setInterval(() => {
    let laneIndex = Math.floor(Math.random() * 5);
    spawnFallingBlock(
      app,
      laneIndex,
      rowIndex,
      colors.enemy,
      Math.floor(Math.random() * 5 + 1 + rowIndex * 0.5),
      (playerBox) => {
        updateValue(playerBox, playerBox.value - 1);
      },
      true
    );
    let laneIndex2 = Math.floor(Math.random() * 5);
    if (laneIndex2 != laneIndex && Math.random() < 0.9) {
      spawnFallingBlock(
        app,
        laneIndex2,
        rowIndex,
        colors.enemy,
        Math.floor(Math.random() * 5 + 1 + rowIndex * 0.5),
        (playerBox) => {
          updateValue(playerBox, playerBox.value - 1);
        },
        true
      );
    }

    if (Math.random() < 0.15) {
      let laneIndex = Math.floor(Math.random() * 5);
      spawnFallingBlock(
        app,
        laneIndex,
        rowIndex,
        colors.upgrade,
        Math.floor(Math.random() * 5 + 1),
        (playerBox) => {
          updateValue(playerBox, playerBox.value + 1);
        },
        false
      );
    }

    rowIndex++;
  }, 1000);

  setInterval(() => {
    boxes.forEach((box) => fireBullet(app, box));
  }, 500);

  app.ticker.add((time) => {
    // Handle falling blocks reaching the bottom
    var i = fallingBlocks.length;
    while (i--) {
      let fallingBlock = fallingBlocks[i];
      fallingBlock.y += 1.0 * time.deltaTime;
      if (fallingBlock.y >= app.screen.height - boxSize * 1.99 - boxMargin) {
        let playerBox = boxes[fallingBlock.lane];
        fallingBlock.onCollision(playerBox);
        app.stage.removeChild(fallingBlock);
        fallingBlocks.splice(i, 1);
      }
    }

    let fallingBlocksToRemove = new Set();

    boxes.forEach((box) => {
      if (box.bullets) {
        let bulletsToRemove = [];
        box.bullets.forEach((bullet, bulletIndex) => {
          bullet.y -= bulletSpeed * time.deltaTime;
          // Check offscreen
          if (bullet.y < 0) {
            bulletsToRemove.push(bullet);
          } else {
            // Check collision and damage falling blocks
            fallingBlocks.forEach((fallingBlock, fallingBlockIndex) => {
              if (hitTestRectangle(bullet, fallingBlock)) {
                if (fallingBlock.isDamaged) {
                  bulletsToRemove.push(bullet);
                  fallingBlock.value -= bullet.value;
                  fallingBlock.valueText.text = fallingBlock.value;
                  if (fallingBlock.value <= 0) {
                    fallingBlocksToRemove.add(fallingBlock);
                  }
                }
              }
            });
          }
        });

        // Remove bullets
        bulletsToRemove.forEach((bullet) => {
          app.stage.removeChild(bullet);
          box.bullets.splice(box.bullets.indexOf(bullet), 1);
        });
      }
    });

    // Remove falling blocks
    fallingBlocksToRemove.forEach((fallingBlock) => {
      app.stage.removeChild(fallingBlock);
      fallingBlocks.splice(fallingBlocks.indexOf(fallingBlock), 1);
    });
  });
})();

function hitTestRectangle(r1, r2) {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}
