// script.js (진입/장면 전환, BGM 제어)
import { Game } from './GameModule.js';

const lobby = document.getElementById('lobby');
const credit = document.getElementById('credit');
const gameScene = document.getElementById('game');
const startBtn = document.getElementById('startBtn');
const creditBtn = document.getElementById('creditBtn');
const bgm = document.getElementById('bgm');

// 캔버스 준비
const canvas = document.getElementById('gameCanvas');
let game;

function show(scene) {
  // 모두 숨기고 선택만 표시
  for (const el of [lobby, credit, gameScene]) el.hidden = true;
  scene.hidden = false;
}

function playBGM() {
  // 모바일 정책 대응: 사용자 제스처 이후 재생 시도
  const tryPlay = () => bgm.play().catch(() => {});
  bgm.volume = 1.0; // 필요 시 조절
  tryPlay();
}

// 버튼 이벤트
startBtn.addEventListener('click', () => {
  playBGM();
  show(gameScene);
  if (!game) game = new Game(canvas);
  game.start();
});

creditBtn.addEventListener('click', () => {
  playBGM();
  show(credit);
});

// 처음은 로비
show(lobby);