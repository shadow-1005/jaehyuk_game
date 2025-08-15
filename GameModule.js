// GameModule.js
// 게임 핵심 로직 (배경, 플레이어, 입력 처리)

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;   // 1080
    this.height = canvas.height; // 1920

    // 자원
    this.bgImage = this.loadImage('road.png');
    this.playerImage = this.loadImage('player.png');

    // 플레이어 상태
    this.player = {
      x: this.width / 2,  // 중심 기준
      y: this.height - 140, // 하단 고정 (이미지 높이에 맞게 약간 위)
      speed: 12,
      halfW: 70,
      halfH: 90,
    };

    // 입력 상태 (왼쪽/오른쪽 꾹)
    this.holdLeft = false;
    this.holdRight = false;

    // 루프
    this._running = false;
    this._lastTime = 0;

    this.setupInput();
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  setupInput() {
    // 데스크톱 키보드 (옵션)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.holdLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.holdRight = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.holdLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.holdRight = false;
    });

    // 모바일/마우스: 왼쪽 영역=왼쪽, 오른쪽 영역=오른쪽
    const touchStart = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const mid = rect.width / 2;
      this.holdLeft = x < mid;
      this.holdRight = x >= mid;
    };

    const clearHold = () => { this.holdLeft = this.holdRight = false; };

    // 터치
    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      touchStart(t.clientX);
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchend', clearHold);
    this.canvas.addEventListener('touchcancel', clearHold);

    // 마우스 꾹
    this.canvas.addEventListener('mousedown', (e) => touchStart(e.clientX));
    window.addEventListener('mouseup', clearHold);
  }

  start() {
    this._running = true;
    this._lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() { this._running = false; }

  loop(now) {
    if (!this._running) return;
    const dt = Math.min(32, now - this._lastTime); // ms
    this._lastTime = now;

    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // 좌우 이동 (y는 고정)
    if (this.holdLeft) this.player.x -= this.player.speed;
    if (this.holdRight) this.player.x += this.player.speed;

    // 경계 처리
    const margin = 30;
    const minX = margin + this.player.halfW;
    const maxX = this.width - margin - this.player.halfW;
    this.player.x = Math.max(minX, Math.min(maxX, this.player.x));
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 배경: 캔버스 크기에 맞게 채우기 (작아도 확대)
    if (this.bgImage.complete) {
      // cover 방식 비율 유지 채우기
      const iw = this.bgImage.width || this.width;
      const ih = this.bgImage.height || this.height;
      const canvasRatio = this.width / this.height;
      const imgRatio = iw / ih;
      let drawW, drawH;
      if (imgRatio > canvasRatio) { // 이미지가 더 납작 -> 세로 맞추고 가로 넘침
        drawH = this.height;
        drawW = this.height * imgRatio;
      } else {
        drawW = this.width;
        drawH = this.width / imgRatio;
      }
      const dx = (this.width - drawW) / 2;
      const dy = (this.height - drawH) / 2;
      ctx.drawImage(this.bgImage, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = '#2f2f2f';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 플레이어 (중심 기준 그리기)
    const p = this.player;
    if (this.playerImage.complete) {
      const w = p.halfW * 2;
      const h = p.halfH * 2;
      ctx.drawImage(this.playerImage, p.x - p.halfW, p.y - p.halfH, w, h);
    } else {
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(p.x - p.halfW, p.y - p.halfH, p.halfW * 2, p.halfH * 2);
    }
  }
}