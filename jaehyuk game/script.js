/* =========================
   메뉴 관련
========================= */
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const startBtn = document.getElementById("startBtn");
const creditBtn = document.getElementById("creditBtn");
const creditModal = document.getElementById("creditModal");
const closeModalBtn = document.getElementById("closeModalBtn");

/* =========================
   게임 UI
========================= */
const gameArea = document.getElementById("gameArea");
const ground = document.getElementById("ground");
const player = document.getElementById("player");
const lifeText = document.getElementById("lifeText");
const scoreText = document.getElementById("scoreText");

/* =========================
   모바일 조작 버튼
========================= */
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

/* =========================
   플레이어 이미지
   파일명 변경 가능
========================= */
const PLAYER_IMG_RIGHT = "chr_R.png"; // 오른쪽 이동/기본 이미지
const PLAYER_IMG_LEFT = "chr_L.png";  // 왼쪽 이동 이미지
const PLAYER_IMG_JUMP = "chr_J.png";  // 점프 이미지

/* =========================
   게임 기본 설정
   아래 값들은 자유롭게 수정 가능
========================= */
let life = 100;             // 기본 생명력
let score = 0;              // 시작 점수
const scorePerSecond = 100; // 초당 점수 증가량

const playerState = {
  x: 0,
  y: 0,
  width: 72,      // 플레이어 너비
  height: 72,     // 플레이어 높이
  speed: 5,       // 좌우 이동 속도
  vx: 0,
  vy: 0,
  gravity: 0.4,   // 중력
  jumpPower: -14, // 점프 힘
  jumpCount: 0,   // 현재 점프 횟수
  maxJump: 2,     // 2단 점프
  onGround: false,
  direction: "right"
};

let groundY = 0;
let gameRunning = false;
let animationId = null;
let scoreInterval = null;

/* =========================
   제작진 팝업
========================= */
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

/* =========================
   게임 시작
   - 메뉴 화면 -> 게임 화면 전환
========================= */
startBtn.addEventListener("click", () => {
  menuScreen.classList.remove("active");
  gameScreen.classList.add("active");

  startGame();
});

/* =========================
   게임 초기화
========================= */
function startGame() {
  // 초기 수치 재설정
  life = 100;
  score = 0;
  gameRunning = true;

  updateHUD();
  setGameLayout();
  resetPlayer();

  // 기존 루프/인터벌 정리
  if (animationId) cancelAnimationFrame(animationId);
  if (scoreInterval) clearInterval(scoreInterval);

  // 점수: 매초 100 증가
  scoreInterval = setInterval(() => {
    if (!gameRunning) return;
    score += scorePerSecond;
    updateHUD();
  }, 1000);

  gameLoop();
}

/* =========================
   화면 크기 맞춰 레이아웃 계산
========================= */
function setGameLayout() {
  const gameHeight = gameArea.clientHeight;

  // 바닥 위치: 첫 번째 사진처럼 하단 근처
  groundY = gameHeight - 150; // 바닥 높이 조절 가능
  ground.style.top = `${groundY}px`;
}

/* =========================
   플레이어 초기 위치
   - 바닥 정중앙
   - 처음 이미지는 오른쪽 이미지
========================= */
function resetPlayer() {
  playerState.width = 72;
  playerState.height = 72;

  playerState.x = (gameArea.clientWidth / 2) - (playerState.width / 2);
  playerState.y = groundY - playerState.height;
  playerState.vx = 0;
  playerState.vy = 0;
  playerState.jumpCount = 0;
  playerState.onGround = true;
  playerState.direction = "right";

  player.src = PLAYER_IMG_RIGHT;
  renderPlayer();
}

/* =========================
   HUD 갱신
========================= */
function updateHUD() {
  lifeText.textContent = `생명력: ${life}`;
  scoreText.textContent = `점수: ${score}`;
}

/* =========================
   플레이어 위치 반영
========================= */
function renderPlayer() {
  player.style.left = `${playerState.x}px`;
  player.style.top = `${playerState.y}px`;
  player.style.width = `${playerState.width}px`;
  player.style.height = `${playerState.height}px`;
}

/* =========================
   점프 처리
   - 2단 점프 가능
   - 점프 중에는 점프 이미지 사용
========================= */
function jumpPlayer() {
  if (playerState.jumpCount < playerState.maxJump) {
    playerState.vy = playerState.jumpPower;
    playerState.jumpCount++;
    playerState.onGround = false;
    player.src = PLAYER_IMG_JUMP;
  }
}

/* =========================
   이미지 변경 로직
========================= */
function updatePlayerImage() {
  if (!playerState.onGround) {
    player.src = PLAYER_IMG_JUMP;
    return;
  }

  if (playerState.direction === "left") {
    player.src = PLAYER_IMG_LEFT;
  } else {
    player.src = PLAYER_IMG_RIGHT;
  }
}

/* =========================
   게임 루프
========================= */
function gameLoop() {
  if (!gameRunning) return;

  // 좌우 이동
  playerState.x += playerState.vx;

  // 중력 적용
  playerState.vy += playerState.gravity;
  playerState.y += playerState.vy;

  // 좌우 화면 밖 제한
  if (playerState.x < 0) {
    playerState.x = 0;
  }

  if (playerState.x + playerState.width > gameArea.clientWidth) {
    playerState.x = gameArea.clientWidth - playerState.width;
  }

  // 바닥 충돌
  const playerBottom = playerState.y + playerState.height;
  if (playerBottom >= groundY) {
    playerState.y = groundY - playerState.height;
    playerState.vy = 0;
    playerState.onGround = true;
    playerState.jumpCount = 0;
  } else {
    playerState.onGround = false;
  }

  updatePlayerImage();
  renderPlayer();

  animationId = requestAnimationFrame(gameLoop);
}

/* =========================
   모바일 버튼 입력
========================= */
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

/* 터치 + 마우스 둘 다 지원 */
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

/* =========================
   키보드 입력도 지원
   PC 테스트용
========================= */
window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") {
    playerState.vx = -playerState.speed;
    playerState.direction = "left";
  } else if (e.key === "ArrowRight") {
    playerState.vx = playerState.speed;
    playerState.direction = "right";
  } else if (e.key === "ArrowUp" || e.key === " " ) {
    jumpPlayer();
  }
});

window.addEventListener("keyup", (e) => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    playerState.vx = 0;
  }
});

/* =========================
   화면 크기 변경 대응
========================= */
window.addEventListener("resize", () => {
  if (!gameRunning) return;

  setGameLayout();

  // 바닥보다 아래로 떨어지는 것 방지
  if (playerState.y + playerState.height > groundY) {
    playerState.y = groundY - playerState.height;
    playerState.vy = 0;
    playerState.onGround = true;
    playerState.jumpCount = 0;
  }

  // 화면 밖으로 나가면 다시 안쪽으로 조정
  if (playerState.x + playerState.width > gameArea.clientWidth) {
    playerState.x = gameArea.clientWidth - playerState.width;
  }

  renderPlayer();
});