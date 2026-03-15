/* =========================================================
   1. DOM 요소
========================================================= */
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const startBtn = document.getElementById("startBtn");
const creditBtn = document.getElementById("creditBtn");
const creditModal = document.getElementById("creditModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const gameArea = document.getElementById("gameArea");
const ground = document.getElementById("ground");
const player = document.getElementById("player");
const lifeText = document.getElementById("lifeText");
const scoreText = document.getElementById("scoreText");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

/* =========================================================
   2. 파일 경로 설정
   파일명을 바꾸고 싶으면 여기만 수정하면 됨
========================================================= */
const ASSETS = {
  playerRight: "chr_R.png",     // 오른쪽 이동 / 기본 이미지
  playerLeft: "chr_L.png",      // 왼쪽 이동 이미지
  playerJump: "chr_J.png",      // 점프 이미지
  preAttack1: "pre-atk_1.png",  // 예비 공격 이미지
  attack1: "atk_1.png"          // 실제 공격 이미지
};

/* =========================================================
   3. 게임 전역 상태
========================================================= */
const gameState = {
  running: false,
  animationId: null,
  scoreInterval: null,
  score: 0,
  life: 100,
  scorePerSecond: 100,
  groundY: 0
};

/* =========================================================
   4. 플레이어 상태
========================================================= */
const playerState = {
  x: 0,
  y: 0,
  width: 72,         // 플레이어 너비 변경 가능
  height: 72,        // 플레이어 높이 변경 가능
  speed: 5,          // 이동 속도 변경 가능
  vx: 0,
  vy: 0,
  gravity: 0.4,      // 중력 변경 가능
  jumpPower: -14,    // 점프 힘 변경 가능
  jumpCount: 0,
  maxJump: 2,        // 2단 점프
  onGround: false,
  direction: "right"
};

/* =========================================================
   5. 시스템 저장소
   앞으로 새 기능은 여기에 등록해서 맨 아래 확장 가능
========================================================= */
const updateSystems = [];
const resizeSystems = [];
const startSystems = [];
const resetSystems = [];

/* =========================================================
   6. 시스템 등록 함수
   새 기능 추가 시 이 함수를 사용
========================================================= */
function registerUpdateSystem(fn) {
  updateSystems.push(fn);
}

function registerResizeSystem(fn) {
  resizeSystems.push(fn);
}

function registerStartSystem(fn) {
  startSystems.push(fn);
}

function registerResetSystem(fn) {
  resetSystems.push(fn);
}

/* =========================================================
   7. 공통 유틸 함수
========================================================= */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function checkCollisionRect(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function checkCollisionElements(el1, el2) {
  return checkCollisionRect(
    el1.getBoundingClientRect(),
    el2.getBoundingClientRect()
  );
}

/* =========================================================
   8. HUD 시스템
========================================================= */
function updateHUD() {
  lifeText.textContent = `생명력: ${gameState.life}`;
  scoreText.textContent = `점수: ${gameState.score}`;
}

/* =========================================================
   9. 레이아웃 시스템
========================================================= */
function setGameLayout() {
  const gameHeight = gameArea.clientHeight;

  // 바닥 위치 변경 가능
  gameState.groundY = gameHeight - 150;
  ground.style.top = `${gameState.groundY}px`;
}

/* =========================================================
   10. 플레이어 시스템
========================================================= */
function resetPlayer() {
  playerState.x = (gameArea.clientWidth / 2) - (playerState.width / 2);
  playerState.y = gameState.groundY - playerState.height;
  playerState.vx = 0;
  playerState.vy = 0;
  playerState.jumpCount = 0;
  playerState.onGround = true;
  playerState.direction = "right";

  // 처음 생성 이미지는 오른쪽 이미지
  player.src = ASSETS.playerRight;
  renderPlayer();
}

function renderPlayer() {
  player.style.left = `${playerState.x}px`;
  player.style.top = `${playerState.y}px`;
  player.style.width = `${playerState.width}px`;
  player.style.height = `${playerState.height}px`;
}

function jumpPlayer() {
  if (playerState.jumpCount < playerState.maxJump) {
    playerState.vy = playerState.jumpPower;
    playerState.jumpCount++;
    playerState.onGround = false;
    player.src = ASSETS.playerJump;
  }
}

function updatePlayerImage() {
  if (!playerState.onGround) {
    player.src = ASSETS.playerJump;
    return;
  }

  if (playerState.direction === "left") {
    player.src = ASSETS.playerLeft;
  } else {
    player.src = ASSETS.playerRight;
  }
}

function updatePlayerSystem() {
  playerState.x += playerState.vx;

  playerState.vy += playerState.gravity;
  playerState.y += playerState.vy;

  playerState.x = clamp(
    playerState.x,
    0,
    gameArea.clientWidth - playerState.width
  );

  const playerBottom = playerState.y + playerState.height;

  if (playerBottom >= gameState.groundY) {
    playerState.y = gameState.groundY - playerState.height;
    playerState.vy = 0;
    playerState.onGround = true;
    playerState.jumpCount = 0;
  } else {
    playerState.onGround = false;
  }

  updatePlayerImage();
  renderPlayer();
}

/* =========================================================
   11. 게임 기본 제어
========================================================= */
function clearMainTimers() {
  if (gameState.animationId) {
    cancelAnimationFrame(gameState.animationId);
    gameState.animationId = null;
  }

  if (gameState.scoreInterval) {
    clearInterval(gameState.scoreInterval);
    gameState.scoreInterval = null;
  }
}

function gameOver() {
  gameState.running = false;
  clearMainTimers();
  alert("게임 오버");
}

function resetBaseGameState() {
  gameState.score = 0;
  gameState.life = 100;
  updateHUD();
}

function startScoreSystem() {
  gameState.scoreInterval = setInterval(() => {
    if (!gameState.running) return;

    gameState.score += gameState.scorePerSecond;
    updateHUD();
  }, 1000);
}

function startGame() {
  clearMainTimers();

  gameState.running = true;
  resetBaseGameState();
  setGameLayout();
  resetPlayer();

  // 추가 기능들 시작 시 초기화
  for (const fn of resetSystems) {
    fn();
  }

  for (const fn of startSystems) {
    fn();
  }

  startScoreSystem();
  gameLoop();
}

/* =========================================================
   12. 입력 시스템
========================================================= */
function holdLeftStart() {
  playerState.vx = -playerState.speed;
  playerState.direction = "left";
}

function holdRightStart() {
  playerState.vx = playerState.speed;
  playerState.direction = "right";
}

function moveStop() {
  playerState.vx = 0;
}

function bindMobileControls() {
  leftBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    holdLeftStart();
  });

  leftBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    moveStop();
  });

  leftBtn.addEventListener("mousedown", holdLeftStart);
  leftBtn.addEventListener("mouseup", moveStop);
  leftBtn.addEventListener("mouseleave", moveStop);

  rightBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    holdRightStart();
  });

  rightBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    moveStop();
  });

  rightBtn.addEventListener("mousedown", holdRightStart);
  rightBtn.addEventListener("mouseup", moveStop);
  rightBtn.addEventListener("mouseleave", moveStop);

  jumpBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    jumpPlayer();
  });

  jumpBtn.addEventListener("mousedown", jumpPlayer);
}

function bindKeyboardControls() {
  window.addEventListener("keydown", (e) => {
    if (!gameState.running) return;

    if (e.key === "ArrowLeft") {
      playerState.vx = -playerState.speed;
      playerState.direction = "left";
    } else if (e.key === "ArrowRight") {
      playerState.vx = playerState.speed;
      playerState.direction = "right";
    } else if (e.key === "ArrowUp" || e.key === " ") {
      jumpPlayer();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (!gameState.running) return;

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      playerState.vx = 0;
    }
  });
}

/* =========================================================
   13. 메뉴 / 팝업 시스템
========================================================= */
function bindMenuEvents() {
  creditBtn.addEventListener("click", () => {
    creditModal.classList.remove("hidden");
  });

  closeModalBtn.addEventListener("click", () => {
    creditModal.classList.add("hidden");
  });

  creditModal.addEventListener("click", (event) => {
    if (event.target === creditModal) {
      creditModal.classList.add("hidden");
    }
  });

  startBtn.addEventListener("click", () => {
    menuScreen.classList.remove("active");
    gameScreen.classList.add("active");
    startGame();
  });
}

/* =========================================================
   14. 메인 게임 루프
   앞으로 새 기능은 updateSystems에 등록해서 추가
========================================================= */
function gameLoop(now = performance.now()) {
  if (!gameState.running) return;

  updatePlayerSystem();

  // 추가 기능 시스템 실행
  for (const fn of updateSystems) {
    fn(now);
  }

  gameState.animationId = requestAnimationFrame(gameLoop);
}

/* =========================================================
   15. 리사이즈 시스템
========================================================= */
function handleResize() {
  if (!gameState.running) return;

  setGameLayout();

  if (playerState.y + playerState.height > gameState.groundY) {
    playerState.y = gameState.groundY - playerState.height;
    playerState.vy = 0;
    playerState.onGround = true;
    playerState.jumpCount = 0;
  }

  if (playerState.x + playerState.width > gameArea.clientWidth) {
    playerState.x = gameArea.clientWidth - playerState.width;
  }

  renderPlayer();

  // 추가 기능들의 리사이즈 처리
  for (const fn of resizeSystems) {
    fn();
  }
}

/* =========================================================
   16. 공격 시스템 - 상태 저장소
========================================================= */
const attackSystem = {
  attacks: [],
  sequenceStep: 0
};

/* =========================================================
   17. 공격 시스템 - 기본 함수
========================================================= */
function clearAllAttacks() {
  attackSystem.attacks.forEach((attack) => {
    if (attack.warningEl && attack.warningEl.parentNode) {
      attack.warningEl.remove();
    }

    if (attack.hitEl && attack.hitEl.parentNode) {
      attack.hitEl.remove();
    }
  });

  attackSystem.attacks = [];
}

function resetAttackSystem() {
  attackSystem.sequenceStep = 0;
  clearAllAttacks();
}

function createAttack(centerX, warningWidth = 86) {
  const warningHeight = gameState.groundY;

  const hitWidth = 120;    // 공격 너비 변경 가능
  const hitHeight = 320;   // 공격 높이 변경 가능
  const hitTargetY = gameState.groundY - hitHeight + 18;

  const warningEl = document.createElement("div");
  warningEl.className = "attack-warning";
  warningEl.style.width = `${warningWidth}px`;
  warningEl.style.height = `${warningHeight}px`;
  warningEl.style.left = `${centerX - warningWidth / 2}px`;

  const hitEl = document.createElement("img");
  hitEl.className = "attack-hit";
  hitEl.src = ASSETS.attack1;
  hitEl.style.width = `${hitWidth}px`;
  hitEl.style.height = `${hitHeight}px`;
  hitEl.style.left = `${centerX - hitWidth / 2}px`;
  hitEl.style.top = `${-hitHeight}px`;
  hitEl.style.display = "none";

  gameArea.appendChild(warningEl);
  gameArea.appendChild(hitEl);

  attackSystem.attacks.push({
    centerX,
    warningWidth,
    hitWidth,
    hitHeight,
    hitTargetY,
    state: "warning",
    startTime: performance.now(),
    warningDuration: 700, // 예비모션 시간 변경 가능
    hitDuration: 650,     // 공격 유지 시간 변경 가능
    removeDuration: 180,  // 공격 종료 여유시간 변경 가능
    hitStartTime: null,
    warningEl,
    hitEl,
    damaged: false
  });
}

function spawnAttackPattern(type) {
  const gameWidth = gameArea.clientWidth;

  if (type === "singleCenter") {
    createAttack(gameWidth * 0.5, 86);
    return;
  }

  if (type === "triple") {
    createAttack(gameWidth * 0.2, 86);
    createAttack(gameWidth * 0.5, 86);
    createAttack(gameWidth * 0.8, 86);
  }
}

function updateAttackSequence() {
  if (!gameState.running) return;

  // 첫 번째 공격: 점수 300부터
  if (attackSystem.sequenceStep === 0 && gameState.score >= 300) {
    attackSystem.sequenceStep = 1;
    spawnAttackPattern("singleCenter");
    return;
  }

  // 첫 번째 공격 완전 종료 후 두 번째 공격
  if (attackSystem.sequenceStep === 1 && attackSystem.attacks.length === 0) {
    attackSystem.sequenceStep = 2;
    spawnAttackPattern("triple");
    return;
  }

  // 두 번째 공격 종료
  if (attackSystem.sequenceStep === 2 && attackSystem.attacks.length === 0) {
    attackSystem.sequenceStep = 3;
  }
}

function damagePlayer(amount) {
  gameState.life -= amount;

  if (gameState.life < 0) {
    gameState.life = 0;
  }

  updateHUD();

  if (gameState.life <= 0) {
    gameOver();
  }
}

function updateAttacks(now) {
  for (let i = attackSystem.attacks.length - 1; i >= 0; i--) {
    const attack = attackSystem.attacks[i];

    if (attack.state === "warning") {
      const elapsed = now - attack.startTime;

      // 예비모션은 데미지 없음
      if (elapsed >= attack.warningDuration) {
        attack.state = "hit";
        attack.hitStartTime = now;

        if (attack.warningEl && attack.warningEl.parentNode) {
          attack.warningEl.remove();
        }

        attack.hitEl.style.display = "block";
      }
    } else if (attack.state === "hit") {
      const hitElapsed = now - attack.hitStartTime;
      const dropDuration = 180; // 내려오는 속도 변경 가능
      let currentY;

      if (hitElapsed <= dropDuration) {
        const progress = hitElapsed / dropDuration;
        currentY = (-attack.hitHeight) + ((attack.hitTargetY + attack.hitHeight) * progress);
      } else {
        currentY = attack.hitTargetY;
      }

      attack.hitEl.style.top = `${currentY}px`;

      // 실제 공격 이미지에 닿으면 데미지
      if (!attack.damaged && checkCollisionElements(player, attack.hitEl)) {
        attack.damaged = true;
        damagePlayer(20); // 데미지 수치 변경 가능

        if (!gameState.running) {
          return;
        }
      }

      if (hitElapsed >= attack.hitDuration + attack.removeDuration) {
        if (attack.hitEl && attack.hitEl.parentNode) {
          attack.hitEl.remove();
        }

        attackSystem.attacks.splice(i, 1);
      }
    }
  }
}

function updateAttackSystem(now) {
  updateAttackSequence();
  updateAttacks(now);
}

function resizeAttackSystem() {
  attackSystem.attacks.forEach((attack) => {
    attack.hitTargetY = gameState.groundY - attack.hitHeight + 18;

    if (attack.warningEl && attack.warningEl.parentNode) {
      attack.warningEl.style.height = `${gameState.groundY}px`;
      attack.warningEl.style.left = `${attack.centerX - attack.warningWidth / 2}px`;
    }

    if (attack.hitEl && attack.hitEl.parentNode) {
      attack.hitEl.style.left = `${attack.centerX - attack.hitWidth / 2}px`;
    }
  });
}

/* =========================================================
   18. 공격 시스템 등록
   앞으로 새로운 시스템도 이런 식으로 등록하면 됨
========================================================= */
registerUpdateSystem(updateAttackSystem);
registerResizeSystem(resizeAttackSystem);
registerResetSystem(resetAttackSystem);

/* =========================================================
   19. 시작 시 1회 실행
========================================================= */
function initGame() {
  bindMenuEvents();
  bindMobileControls();
  bindKeyboardControls();
  updateHUD();
}

initGame();

window.addEventListener("resize", handleResize);

/* =========================================================
   20. 앞으로 새 기능은 이 아래에 계속 추가
========================================================= */

/* =========================================================
   추가 기능 - 2단계 쓸기 공격 이미지 경로
========================================================= */
ASSETS.preAttack2 = "pre-atk_2.png"; // 2단계 예비공격
ASSETS.attack2RightToLeft = "atk_2.png";   // 오른쪽 -> 왼쪽 쓸기 공격
ASSETS.attack2LeftToRight = "atk_2-1.png"; // 왼쪽 -> 오른쪽 쓸기 공격

/* =========================================================
   추가 기능 - 2단계 쓸기 공격 시스템
   조건:
   - 기존 1단계 공격(가운데 1개, 3개 동시)이 모두 끝난 뒤 시작
   - 1차: 오른쪽 -> 왼쪽 쓸기 공격
   - 2차: 1차 완전히 끝난 후 왼쪽 -> 오른쪽 쓸기 공격
   - 실제 공격에 닿으면 생명력 -50
   - 예비공격 빨간 사각형은 데미지 없음
========================================================= */
const sweepAttackSystem = {
  phase: 0,
  currentAttack: null
  /*
    0 = 아직 시작 안 함
    1 = 첫 번째(오른쪽->왼쪽) 진행 중
    2 = 두 번째(왼쪽->오른쪽) 진행 중
    3 = 완료
  */
};

/* =========================================================
   추가 기능 - 유틸
========================================================= */
function easeInOutQuad(t) {
  if (t < 0.5) return 2 * t * t;
  return 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/* =========================================================
   추가 기능 - 2단계 공격 제거
========================================================= */
function clearSweepAttack() {
  const atk = sweepAttackSystem.currentAttack;

  if (!atk) return;

  if (atk.warningEl && atk.warningEl.parentNode) {
    atk.warningEl.remove();
  }

  if (atk.laneEl && atk.laneEl.parentNode) {
    atk.laneEl.remove();
  }

  sweepAttackSystem.currentAttack = null;
}

/* =========================================================
   추가 기능 - 2단계 공격 리셋
========================================================= */
function resetSweepAttackSystem() {
  sweepAttackSystem.phase = 0;
  clearSweepAttack();
}

/* =========================================================
   추가 기능 - 예비공격 + 실제공격 생성
   direction:
   - "rtl" = 오른쪽 -> 왼쪽
   - "ltr" = 왼쪽 -> 오른쪽
========================================================= */
function createSweepAttack(direction) {

  const warningHeight = 120; // 🔧 예비공격 높이 조절

  const warningEl = document.createElement("div");
  warningEl.className = "sweep-warning";
  warningEl.style.height = `${warningHeight}px`;
  warningEl.style.top = `${gameState.groundY - warningHeight}px`;

  const laneEl = document.createElement("div");
  laneEl.className = "sweep-attack-lane";
  laneEl.style.height = `${warningHeight}px`;
  laneEl.style.top = `${gameState.groundY - warningHeight}px`;
  laneEl.style.display = "none";

  const hitEl = document.createElement("img");
  hitEl.className = "sweep-attack-hit";

  hitEl.src =
    direction === "rtl"
      ? ASSETS.attack2RightToLeft
      : ASSETS.attack2LeftToRight;

  /* 손 크기 설정 */
  const hitWidth = 420;
  const hitHeight = 260;

  hitEl.style.width = `${hitWidth}px`;
  hitEl.style.height = `${hitHeight}px`;

  const topY = gameState.groundY - warningHeight - 10;
  hitEl.style.top = `${topY}px`;

  laneEl.appendChild(hitEl);
  gameArea.appendChild(warningEl);
  gameArea.appendChild(laneEl);

  return {
    direction,
    state: "warning",
    startTime: performance.now(),
    warningDuration: 800,
    sweepDuration: 520,
    warningEl,
    laneEl,
    hitEl,
    hitWidth,
    hitHeight,
    damaged: false,
    activeStartTime: null
  };
}

/* =========================================================
   추가 기능 - 첫 번째 / 두 번째 쓸기 공격 시작
========================================================= */
function startSweepWarning(direction) {
  clearSweepAttack();
  sweepAttackSystem.currentAttack = createSweepAttack(direction);
}

/* =========================================================
   추가 기능 - 쓸기 공격 위치 갱신
========================================================= */
function updateSweepAttackMotion(attack, now) {
  const elapsed = now - attack.activeStartTime;
  const progress = Math.min(1, elapsed / attack.sweepDuration);
  const eased = easeInOutQuad(progress);

  let startX;
  let endX;

  if (attack.direction === "rtl") {
    // 오른쪽 바깥 -> 왼쪽 바깥
    startX = gameArea.clientWidth;
    endX = -attack.hitWidth;
  } else {
    // 왼쪽 바깥 -> 오른쪽 바깥
    startX = -attack.hitWidth;
    endX = gameArea.clientWidth;
  }

  const x = startX + (endX - startX) * eased;
  attack.hitEl.style.left = `${x}px`;

  // 실제 공격 이미지에 닿았을 때만 데미지
  if (!attack.damaged && checkCollisionElements(player, attack.hitEl)) {
    attack.damaged = true;
    damagePlayer(50);

    if (!gameState.running) {
      return true;
    }
  }

  // 공격이 완전히 끝남
  if (progress >= 1) {
    return true;
  }

  return false;
}

/* =========================================================
   추가 기능 - 2단계 쓸기 공격 업데이트
========================================================= */
function updateSweepAttackSystem(now) {
  if (!gameState.running) return;

  /* 
    기존 1단계 공격이 다 끝난 뒤에만 시작
    attackSystem.sequenceStep === 3 이면
    기존 공격 시스템이 완료된 상태
  */
  if (attackSystem.sequenceStep < 3) return;
  if (attackSystem.attacks.length > 0) return;

  // 아직 시작 안 했으면 첫 번째 쓸기 공격 예비모션 시작
  if (sweepAttackSystem.phase === 0 && !sweepAttackSystem.currentAttack) {
    sweepAttackSystem.phase = 1;
    startSweepWarning("rtl");
    return;
  }

  const attack = sweepAttackSystem.currentAttack;
  if (!attack) return;

  // 예비공격 단계
  if (attack.state === "warning") {
    const elapsed = now - attack.startTime;

    // 예비공격 중에는 데미지 없음
    if (elapsed >= attack.warningDuration) {
      attack.state = "active";
      attack.activeStartTime = now;

      if (attack.warningEl && attack.warningEl.parentNode) {
        attack.warningEl.remove();
      }

      attack.laneEl.style.display = "block";
    }

    return;
  }

  // 실제 쓸기 공격 단계
  if (attack.state === "active") {
    const finished = updateSweepAttackMotion(attack, now);

    if (!finished) return;

    // 현재 공격 완전 제거
    if (attack.laneEl && attack.laneEl.parentNode) {
      attack.laneEl.remove();
    }

    sweepAttackSystem.currentAttack = null;

    // 첫 번째 공격 끝나면 두 번째 공격 예비모션 시작
    if (sweepAttackSystem.phase === 1) {
      sweepAttackSystem.phase = 2;
      startSweepWarning("ltr");
      return;
    }

    // 두 번째 공격도 끝나면 완료
    if (sweepAttackSystem.phase === 2) {
      sweepAttackSystem.phase = 3;
    }
  }
}

/* =========================================================
   추가 기능 - 화면 크기 변경 대응
========================================================= */
function resizeSweepAttackSystem() {
  const attack = sweepAttackSystem.currentAttack;
  if (!attack) return;

  if (attack.warningEl && attack.warningEl.parentNode) {
    attack.warningEl.style.height = `${gameState.groundY}px`;
  }

  if (attack.laneEl && attack.laneEl.parentNode) {
    attack.laneEl.style.height = `${gameState.groundY}px`;
  }

  attack.hitWidth = Math.round(gameArea.clientWidth * 1.05);
  attack.hitEl.style.width = `${attack.hitWidth}px`;

  attack.topY = Math.max(10, Math.round(gameState.groundY * 0.16));
  attack.hitEl.style.top = `${attack.topY}px`;
}

/* =========================================================
   추가 기능 - 시스템 등록
========================================================= */
registerUpdateSystem(updateSweepAttackSystem);
registerResizeSystem(resizeSweepAttackSystem);
registerResetSystem(resetSweepAttackSystem);