(function () {
  'use strict';

  const isTouchDevice = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // ===================================================================
  // 1. SMART ASSETS LOADER
  // ===================================================================
  const CANDIDATES = {
    hero: ["hero_azzumie_spritesheet.png"],
    goblin: ["goblin_spritesheet.png"],
    boss2: ["boss2_spritesheet.png"],
    fireball: ["fireball_sprite.png"],
    pillar: ["larva_pillar_sprite.png"],
    orbs: ["power_orbs_spritesheet.png"],
    scroll: ["career_scroll_spritesheet.png"],
    page1: ["stage2_bg_page1.jpg"],
    page2: ["stage2_bg_page2.jpg"]
  };

  const Loaded = {
    images: {},
    init(onComplete) {
      const keys = Object.keys(CANDIDATES);
      let count = 0;
      let completed = false;

      const doneCheck = () => {
        if (!completed) {
          completed = true;
          onComplete();
        }
      };

      setTimeout(doneCheck, 2200);

      keys.forEach((k) => {
        const list = CANDIDATES[k];
        let idx = 0;
        const tryNext = () => {
          if (idx >= list.length) {
            count++;
            if (count === keys.length) doneCheck();
            return;
          }
          const src = list[idx++];
          const img = new Image();
          img.onload = () => {
            Loaded.images[k] = img;
            count++;
            if (count === keys.length) doneCheck();
          };
          img.onerror = () => tryNext();
          img.src = src;
        };
        tryNext();
      });
    },
    get(k) {
      const img = this.images[k];
      return (img && img.complete && img.naturalWidth > 0) ? img : null;
    }
  };

  // ===================================================================
  // 2. RETRO AUDIO ENGINE
  // ===================================================================
  const AudioEngine = {
    ctx: null,
    muted: false,
    mode: 'stage',
    tracks: { stage: null, boss: null },

    setupTracks() {
      if (!this.tracks.stage) {
        this.tracks.stage = new Audio('stage2_bgm.mp3');
        this.tracks.stage.loop = true;
        this.tracks.stage.volume = 0.55;
      }
      if (!this.tracks.boss) {
        this.tracks.boss = new Audio('boss_bgm.mp3');
        this.tracks.boss.loop = true;
        this.tracks.boss.volume = 0.65;
      }
    },

    init() {
      this.setupTracks();
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.muted) {
        this.playBgm(this.mode || 'stage');
      }
    },

    playBgm(targetMode) {
      this.setupTracks();
      this.mode = targetMode;
      if (this.muted) return;

      const targetTrack = this.tracks[this.mode];
      const otherMode = this.mode === 'stage' ? 'boss' : 'stage';
      const otherTrack = this.tracks[otherMode];

      if (otherTrack) {
        otherTrack.pause();
        otherTrack.currentTime = 0;
      }

      if (targetTrack && targetTrack.paused) {
        targetTrack.play().catch(() => {});
      }
    },

    pauseBgm() {
      try {
        if (this.tracks.stage) this.tracks.stage.pause();
        if (this.tracks.boss) this.tracks.boss.pause();
      } catch (e) {}
    },

    resumeBgm() {
      if (!this.muted) {
        this.playBgm(this.mode || 'stage');
      }
    },

    playTone(freq, duration, type = 'sine', slideTo = null, vol = 0.18) {
      if (!this.ctx || this.muted) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + duration);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      } catch(e){}
    },

    jump() { this.playTone(200, 0.12, 'square', 480, 0.1); },
    slash() { this.playTone(600, 0.09, 'sawtooth', 120, 0.14); },
    hit() { this.playTone(140, 0.14, 'square', 45, 0.22); },
    goblinDie() { this.playTone(160, 0.25, 'sawtooth', 30, 0.16); },
    orb() {
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 0.22, 'triangle', null, 0.14), i * 50);
      });
    },
    fireShoot() { this.playTone(450, 0.24, 'sawtooth', 80, 0.26); },
    eruption() {
      this.playTone(110, 0.65, 'sawtooth', 25, 0.35);
      this.playTone(65, 0.70, 'square', 18, 0.30);
    },
    sealCrack() { this.playTone(340, 0.18, 'square', 70, 0.22); },
    victory() {
      [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 0.45, 'triangle', null, 0.18), i * 85);
      });
    },

    toggle() {
      this.muted = !this.muted;
      const btn = document.getElementById('btnAudioToggle');
      if (btn) btn.textContent = this.muted ? '🔇' : '🎵';
      if (this.muted) {
        this.pauseBgm();
      } else {
        this.init();
        this.resumeBgm();
      }
    }
  };

  const btnAudio = document.getElementById('btnAudioToggle');
  if (btnAudio) btnAudio.addEventListener('click', () => AudioEngine.toggle());

  // ===================================================================
  // 3. CANVAS, CAMERA, PLATFORMS, WALLS & LADDERS
  // ===================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const VIEW_W = 960;
  const VIEW_H = 540;
  const WORLD_W = 1920;
  const GRAVITY = 0.52;

  const camera = { x: 0, targetX: 0, shakeFrames: 0, shakeMag: 0 };
  let showDebugRoute = false;
  let isGamePaused = false;

  // Platform, cerun & dinding pepejal
  const platforms = [
    { id: 'p1_ground', type: 'flat', x: 0, y: 470, w: 900, h: 90 },
    { id: 'p1_plank_left', type: 'flat', x: 90, y: 310, w: 170, h: 18 },
    { id: 'p1_cross_beam', type: 'flat', x: 400, y: 240, w: 100, h: 16 },
    { id: 'p1_stone_ledge', type: 'flat', x: 500, y: 210, w: 80, h: 20 },
    { id: 'p1_connect_ramp', type: 'ramp', x1: 260, y1: 310, x2: 400, y2: 240 },
    { id: 'p2_stone_ledge', type: 'flat', x: 580, y: 180, w: 130, h: 20 },
    { id: 'p1_exit_plank', type: 'flat', x: 710, y: 300, w: 115, h: 16 },
    { id: 'p1_wall1', type: 'wall', x: 500, y: 210, w: 10, h: 50 },
    { id: 'p1_wall2', type: 'wall', x: 580, y: 180, w: 10, h: 50 },
    { id: 'p1_wall3', type: 'wall', x: 720, y: 30, w: 10, h: 150 },
    { id: 'p2_connect_ramp', type: 'ramp', x1: 900, y1: 470, x2: 1040, y2: 430 },
    { id: 'p2_lava_bridge', type: 'flat', x: 1040, y: 430, w: 590, h: 130 },
    { id: 'p2_stepping_a', type: 'flat', x: 1170, y: 280, w: 100, h: 18 },
    { id: 'p2_stepping_b', type: 'flat', x: 1300, y: 270, w: 70, h: 18 },
    { id: 'p2_stepping_c', type: 'flat', x: 1380, y: 240, w: 70, h: 18 },
    { id: 'p2_stepping_top', type: 'flat', x: 1530, y: 170, w: 120, h: 20 },
    { id: 'p2_throne_ramp', type: 'ramp', x1: 1630, y1: 450, x2: 1800, y2: 250 },
    { id: 'p2_altar_throne', type: 'flat', x: 1800, y: 250, w: 130, h: 290 }
  ];

  const ladders = [
    { id: 'ladder_1', x: 100, w: 34, topY: 310, bottomY: 470 },
    { id: 'ladder_2', x: 675, w: 38, topY: 180, bottomY: 470 }
  ];

  const pillars = [
    { id: 'p1_center_stalactite', x: 290, y: 210, w: 110, h: 100, alpha: 0.88 },
    { id: 'p2_center_stalactite', x: 310, y: 400, w: 80, h: 90, alpha: 0.88 },
    { id: 'p3_center_stalactite', x: 340, y: 20, w: 30, h: 500, alpha: 0.88 },
    { id: 'p4_center_stalactite', x: 260, y: 270, w: 130, h: 40, alpha: 0.88 },
    { id: 'p5_center_stalactite', x: 340, y: 20, w: 60, h: 90, alpha: 0.88 },
    { id: 'p1_right_exit_wall', x: 920, y: 350, w: 80, h: 180, alpha: 0.88 }
  ];

  // ===================================================================
  // 4. KONFIGURASI HERO & BOS 2
  // ===================================================================
  const HERO_CONFIG = {
    rows: 5,
    renderSize: 120,
    offsetX: -60,
    offsetY: -100,
    actions: {
      idle:    { row: 0, cols: 10, startCol: 0, count: 5, fps: 6,  loop: true },
      climb:   { row: 0, cols: 10, startCol: 7, count: 3, fps: 7,  loop: true },
      run:     { row: 1, cols: 8,  startCol: 0, count: 6, fps: 14, loop: true },
      jump:    { row: 2, cols: 10, startCol: 1, count: 1, fps: 1,  loop: false },
      fall:    { row: 2, cols: 10, startCol: 2, count: 1, fps: 1,  loop: false },
      slash:   { row: 3, cols: 9,  startCol: 0, count: 6, fps: 17, loop: false },
      victory: { row: 4, cols: 10, startCol: 0, count: 2, fps: 6,  loop: true },
      hurt:    { row: 4, count: 2, fps: 7, loop: false, customSx: [728, 862], cellW: 128 },
      // 4 frame penuh: terundur -> menahan sakit -> melutut -> rebah tersungkur
      defeat:  { row: 4, count: 4, fps: 5, loop: false, customSx: [728, 862, 980, 1134], cellW: 128 }
    }
  };

  const GOBLIN_CONFIG = {
    rows: 4,
    cols: 6,
    renderSize: 92,
    offsetX: -46,
    offsetY: -90,
    actions: {
      idle:   { row: 0, startCol: 0, count: 4, fps: 6,  loop: true },
      walk:   { row: 1, startCol: 0, count: 6, fps: 10, loop: true },
      attack: { row: 2, startCol: 0, count: 4, fps: 10, loop: false },
      death:  { row: 3, startCol: 0, count: 6, fps: 8,  loop: false }
    }
  };

  const BOSS2_CONFIG = {
    rows: 4,
    cols: 7,
    renderSize: 190,
    offsetX: -95,
    offsetY: -190,
    actions: {
      idle:     { row: 0, startCol: 0, count: 4, fps: 5, loop: true },
      breathe:  { row: 1, startCol: 0, count: 4, fps: 6, loop: false },
      summon:   { row: 2, startCol: 0, count: 4, fps: 6, loop: false },
      defeat:   { row: 3, startCol: 0, count: 6, fps: 5, loop: false }
    }
  };

  const SCROLL_CONFIG = {
    cols: 8,
    rows: 1,
    renderH: 110,
    actions: {
      floating:  { frames: [0, 1], fps: 3, loop: true },
      unsealing: { frames: [2, 3, 4, 5], fps: 6, loop: false },
      opened:    { frames: [4, 5], fps: 4, loop: true }
    }
  };

  // ===================================================================
  // 5. STATUS ENTITAS
  // ===================================================================
  const hero = {
    x: 80,
    y: 380,
    w: 48,
    h: 76,
    vx: 0,
    vy: 0,
    speed: 4.5,
    facing: 1,
    hp: 100,
    grounded: false,
    climbing: false,
    activeLadder: null,
    state: 'idle',
    animFrame: 0,
    animTimer: 0,
    actionLock: false,
    invulnFrames: 0,
    coyoteTimer: 0,
    jumpBuffer: 0,
    autoVictoryTimer: 0,
    isRespawning: false
  };

  const goblins = [
    { id: 1, x: 300,  y: 410, vx: 1.1, w: 42, h: 58, facing: 1,  minX: 200,  maxX: 420,  hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 2, x: 500,  y: 150, vx: 1.0, w: 42, h: 58, facing: 1,  minX: 500,  maxX: 580,  hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 3, x: 800,  y: 240, vx: 1.0, w: 42, h: 58, facing: 1,  minX: 720,  maxX: 840,  hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 4, x: 1220, y: 370, vx: 1.2, w: 42, h: 58, facing: -1, minX: 1100, maxX: 1400, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true }
  ];

  const orbs = [
    { id: 0, name: 'CRIMSON ORB', subtitle: 'Refinery Ops',  x: 160,  y: 240, row: 0, color: '#ef4444', collected: false },
    { id: 1, name: 'AZURE ORB',   subtitle: 'Pipeline Data', x: 460,  y: 180, row: 1, color: '#0ea5e9', collected: false },
    { id: 2, name: 'EMERALD ORB', subtitle: 'Governance',    x: 600,  y: 110, row: 2, color: '#10b981', collected: false },
    { id: 3, name: 'VIOLET ORB',  subtitle: 'Megaprojects',  x: 1240, y: 200, row: 3, color: '#8b5cf6', collected: false },
    { id: 4, name: 'GOLDEN ORB',  subtitle: 'Sovereign Core',x: 1400, y: 340, row: 4, color: '#f59e0b', collected: false }
  ];

  const boss = {
    spawned: false,
    alive: true,
    x: 1480,
    y: 430,
    w: 100,
    h: 150,
    facing: -1,
    hp: 450,
    maxHp: 450,
    state: 'idle',
    stateTimer: 80,
    animFrame: 0,
    animTimer: 0,
    actionLock: false
  };

  const careerScroll = {
    unlocked: false,
    x: 1810,
    y: 190,
    state: 'floating',
    frameIdx: 0,
    animTimer: 0,
    opened: false
  };

  let fireballs = [];
  let lavaPillars = [];
  const floatingPopups = [];

  function addFloatingPopup(text, x, y, color = '#f59e0b') {
    floatingPopups.push({ text, x, y, color, life: 60, maxLife: 60 });
  }

  function spawnFireball(x, y, vx) {
    fireballs.push({
      x: x || (boss.x - 45),
      y: y || (boss.y - 45),
      vx: vx || (boss.facing * 5.8),
      radius: 30,
      frame: 0,
      animTimer: 0
    });
    AudioEngine.fireShoot();
  }

  function spawnLavaPillar(targetX) {
    lavaPillars.push({
      x: targetX || (hero.x + hero.w * 0.5),
      y: 430,
      stage: 'warning',
      warningTimer: 0.75,
      frame: 0,
      animTimer: 0
    });
  }

  // ===================================================================
  // 6. INPUT HANDLER
  // ===================================================================
  const input = {
    left: false, right: false, up: false, down: false,
    jumpPressed: false, jumpHeld: false, attackPressed: false, interactPressed: false
  };

  function triggerJump() {
    AudioEngine.init();
    input.jumpPressed = true;
    input.jumpHeld = true;
    hero.jumpBuffer = 8;
    if (hero.climbing) {
      hero.climbing = false;
      hero.vy = -10.5;
    }
  }

  function triggerAttack() {
    AudioEngine.init();
    input.attackPressed = true;
  }

  function triggerInteract() {
    AudioEngine.init();
    input.interactPressed = true;
  }

  function setPause(state) {
    isGamePaused = state;
    const modal = document.getElementById('pauseModal');
    const btn = document.getElementById('btnPauseGame');
    if (isGamePaused) {
      if (modal) modal.classList.remove('hidden');
      if (btn) btn.textContent = '▶️';
      AudioEngine.pauseBgm();
    } else {
      if (modal) modal.classList.add('hidden');
      if (btn) btn.textContent = '⏸️';
      AudioEngine.resumeBgm();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    AudioEngine.init();

    if (e.code === 'KeyP' || e.code === 'Escape') {
      setPause(!isGamePaused);
      return;
    }

    if (isGamePaused || hero.autoVictoryTimer > 0 || hero.isRespawning) return;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = true;
    
    if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      input.up = true;
      if (!hero.climbing) triggerJump();
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') input.down = true;

    if (e.code === 'Space') {
      if (!input.jumpHeld) triggerJump();
    }

    if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'KeyZ' || e.key === 'j' || e.key === 'k' || e.key === 'z') triggerAttack();
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') triggerInteract();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') input.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') input.down = false;
    if (e.code === 'Space') input.jumpHeld = false;
  });

  function bindTouch(id, onDown, onUp) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const downHandler = (e) => {
      e.preventDefault();
      AudioEngine.init();
      onDown();
    };
    const upHandler = (e) => {
      e.preventDefault();
      if (onUp) onUp();
    };

    btn.addEventListener('pointerdown', downHandler);
    btn.addEventListener('pointerup', upHandler);
    btn.addEventListener('touchstart', downHandler, { passive: false });
    btn.addEventListener('touchend', upHandler, { passive: false });
  }

  bindTouch('btnLeft', () => { if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) input.left = true; }, () => input.left = false);
  bindTouch('btnRight', () => { if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) input.right = true; }, () => input.right = false);
  bindTouch('btnUp', () => { 
    if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) {
      input.up = true;
      if (!hero.climbing) triggerJump();
    }
  }, () => input.up = false);
  bindTouch('btnDown', () => { if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) input.down = true; }, () => input.down = false);
  bindTouch('btnJump', () => { if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) triggerJump(); }, () => input.jumpHeld = false);
  bindTouch('btnAttack', () => { if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) triggerAttack(); });
  bindTouch('btnInteract', () => { if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) triggerInteract(); });

  function executeQuit() {
    if (confirm("Are you sure you want to return to the Main Menu?")) {
      window.location.href = 'index.html?skipIntro=true';
    }
  }

  const btnQuit = document.getElementById('btnQuitGame');
  if (btnQuit) btnQuit.addEventListener('click', executeQuit);
  const btnPauseQ = document.getElementById('btnPauseQuit');
  if (btnPauseQ) btnPauseQ.addEventListener('click', executeQuit);
  const btnPauseG = document.getElementById('btnPauseGame');
  if (btnPauseG) btnPauseG.addEventListener('click', () => setPause(!isGamePaused));
  const btnResumeG = document.getElementById('btnResumeGame');
  if (btnResumeG) btnResumeG.addEventListener('click', () => setPause(false));
  const btnRestart = document.getElementById('btnRestartStage');
  if (btnRestart) btnRestart.addEventListener('click', () => window.location.reload());
  const btnNextStg = document.getElementById('btnNextStage');
  if (btnNextStg) btnNextStg.addEventListener('click', () => window.location.href = 'stage3.html');
  const btnCloseScr = document.getElementById('btnCloseScroll');
  if (btnCloseScr) btnCloseScr.addEventListener('click', () => window.location.reload());
  const btnSkipEnd = document.getElementById('btnSkipToEnd');
  if (btnSkipEnd) btnSkipEnd.addEventListener('click', () => {
    if (confirm("Skip directly to the Career Epilogue & Credits?")) {
      window.location.href = 'credits.html';
    }
  });

  // ===================================================================
  // 7. DAMAGE & LOGIK FIZIK LENGKAP (RESPAWN BERSIH)
  // ===================================================================
  function inflictDamage(amount, dir) {
    if (hero.invulnFrames > 0 || hero.autoVictoryTimer > 0 || hero.isRespawning) return;

    hero.hp = Math.max(0, hero.hp - amount);
    hero.climbing = false;
    updateHud();

    // 1. JIKA HP MENCECAH 0 -> MAINKAN ANIMASI REBAH & RESPAWN
    if (hero.hp <= 0) {
      hero.isRespawning = true;
      hero.invulnFrames = 0; // Pastikan sprite defeat sentiasa kelihatan jelas tanpa kelip-kelip
      hero.actionLock = true;
      hero.state = 'defeat';
      hero.vx = 0;
      hero.vy = 0;
      hero.animFrame = 0;
      hero.animTimer = 0;
      input.left = false;
      input.right = false;
      input.jumpHeld = false;
      input.attackPressed = false;

      // Cari platform di bawah tapak kaki hero dan daratkan hero serta-merta (termasuk ramp)
      let candidatePlatY = null;
      let minDy = Infinity;
      const heroCenterX = hero.x + hero.w * 0.5;
      const heroFoot = hero.y + hero.h;
      for (const p of platforms) {
        if (p.type === 'flat') {
          if (heroCenterX >= p.x && heroCenterX <= p.x + p.w) {
            const dy = p.y - heroFoot;
            if (dy >= -50 && dy < minDy) {
              minDy = dy;
              candidatePlatY = p.y;
            }
          }
        } else if (p.type === 'ramp') {
          if (heroCenterX >= p.x1 && heroCenterX <= p.x2) {
            const t = (heroCenterX - p.x1) / (p.x2 - p.x1);
            const rampY = p.y1 + t * (p.y2 - p.y1);
            const dy = rampY - heroFoot;
            if (dy >= -50 && dy < minDy) {
              minDy = dy;
              candidatePlatY = rampY;
            }
          }
        }
      }
      if (candidatePlatY !== null) {
        hero.y = candidatePlatY - hero.h;
      } else {
        hero.y = (hero.x > 960 ? 430 : 470) - hero.h;
      }
      hero.grounded = true;
      hero.vy = 0;

      AudioEngine.hit();
      camera.shakeFrames = 15;
      camera.shakeMag = 8;
      addFloatingPopup('FALLEN! RESPAWNING...', hero.x + 20, hero.y - 15, '#ef4444');

      setTimeout(() => {
        hero.x = 80;
        hero.y = 470 - hero.h;
        hero.vx = 0;
        hero.vy = 0;
        hero.hp = 100;
        hero.state = 'idle';
        hero.facing = 1;
        hero.actionLock = false;
        hero.isRespawning = false;
        hero.autoVictoryTimer = 0;
        hero.invulnFrames = 60;

        if (typeof camera !== 'undefined') {
          camera.x = 0;
          camera.targetX = 0;
        }

        updateHud();
        addFloatingPopup('REVIVED!', hero.x + 20, hero.y - 15, '#38bdf8');
      }, 1300);

      return;
    }

    // 2. JIKA MASIH HIDUP (HP > 0) -> IMPAK KEROSAKAN BIASA
    hero.invulnFrames = 180; // Kebal 3 saat selepas kena damage
    hero.vx = dir * 4.5;
    hero.vy = -4.0;
    hero.state = 'hurt';
    hero.animFrame = 0;
    hero.animTimer = 0;
    hero.actionLock = true;
    AudioEngine.hit();
    camera.shakeFrames = 10;
    camera.shakeMag = 5;
    addFloatingPopup(`-${amount} HP`, hero.x + 20, hero.y - 10, '#ef4444');
  }

  function updateGame(dt) {
    // Kunci kawalan hero sepenuhnya semasa fasa respawn
    if (hero.isRespawning) {
      hero.vx = 0;
      hero.vy = 0;
      hero.grounded = true;
      hero.state = 'defeat';
      const dAct = HERO_CONFIG.actions.defeat;
      hero.animTimer += dt;
      if (hero.animTimer >= 1 / dAct.fps) {
        hero.animTimer = 0;
        if (hero.animFrame < dAct.count - 1) {
          hero.animFrame++;
        }
      }
      return;
    }
    if (isGamePaused) return;

    if (camera.shakeFrames > 0) camera.shakeFrames--;
    if (hero.invulnFrames > 0) hero.invulnFrames--;

    for (let i = floatingPopups.length - 1; i >= 0; i--) {
      const pop = floatingPopups[i];
      pop.y -= 0.6;
      pop.life--;
      if (pop.life <= 0) floatingPopups.splice(i, 1);
    }

    // PEMASA KEMENANGAN HERO (2.2 SAAT)
    if (hero.autoVictoryTimer > 0) {
      hero.autoVictoryTimer -= dt;
      hero.vx = 0;
      hero.state = 'victory';

      if (hero.autoVictoryTimer <= 0) {
        hero.autoVictoryTimer = 0;
        hero.actionLock = false;
        hero.state = 'idle';
        hero.animFrame = 0;
        hero.animTimer = 0;
      }
    }

    // ========================================================
    // KEMAS KINI PELURU API (FIREBALLS) BOS STAGE 2
    // ========================================================
    for (let i = fireballs.length - 1; i >= 0; i--) {
      const fb = fireballs[i];
      fb.x += fb.vx;
      fb.y += (fb.vy || 0);

      if (typeof fb.animTimer !== 'undefined') {
        fb.animTimer += dt;
        if (fb.animTimer >= 0.08) {
          fb.animTimer = 0;
          fb.frame = ((fb.frame || 0) + 1) % 4;
        }
      }

      // Titik tengah hero
      const heroMidX = hero.x + hero.w * 0.5;
      const heroMidY = hero.y + hero.h * 0.5;

      // Hitbox deteksi adil dan akurat
      const dist = Math.hypot(heroMidX - fb.x, heroMidY - fb.y);
      const hitRadius = (fb.radius || 28) + (hero.w * 0.45);

      if (dist < hitRadius && hero.invulnFrames <= 0 && !hero.isRespawning) {
        const knockbackDir = fb.vx > 0 ? 1 : -1;
        inflictDamage(25, knockbackDir);
        
        AudioEngine.hit();
        addFloatingPopup('🔥 BURN!', fb.x, fb.y - 20, '#f97316');

        fireballs.splice(i, 1);
        continue;
      }

      if (fb.x < -100 || fb.x > WORLD_W + 100 || fb.y > VIEW_H + 50) {
        fireballs.splice(i, 1);
      }
    }

    // B. Tiang Lahar (8-Frame Statik Tegak)
    for (let i = lavaPillars.length - 1; i >= 0; i--) {
      const lp = lavaPillars[i];
      lp.animTimer += dt;

      if (lp.stage === 'warning') {
        lp.warningTimer -= dt;
        if (lp.warningTimer <= 0) {
          lp.stage = 'erupt';
          lp.frame = 0;
          lp.animTimer = 0;
          AudioEngine.eruption();
          camera.shakeFrames = 15;
          camera.shakeMag = 6;
        }
      } else if (lp.stage === 'erupt') {
        if (lp.animTimer >= 0.075) {
          lp.animTimer = 0;
          lp.frame++;
          if (lp.frame >= 8) {
            lavaPillars.splice(i, 1);
            continue;
          }
        }

        if (lp.frame >= 2 && lp.frame <= 5 && hero.invulnFrames <= 0 && !hero.isRespawning) {
          const hMidX = hero.x + hero.w * 0.5;
          const hFoot = hero.y + hero.h;
          if (Math.abs(hMidX - lp.x) < 36 && hFoot >= lp.y - 190 && hero.y <= lp.y) {
            inflictDamage(28, hero.x < lp.x ? -1 : 1);
          }
        }
      }
    }

    // C. Pengesanan Tangga (Ladder Climbing)
    const hMidX = hero.x + hero.w * 0.5;
    const hFootY = hero.y + hero.h;
    let nearLadder = null;

    for (const l of ladders) {
      if (hMidX >= l.x - 12 && hMidX <= l.x + l.w + 12 && hFootY >= l.topY - 14 && hero.y <= l.bottomY + 14) {
        nearLadder = l;
        break;
      }
    }

    const climbPrompt = document.getElementById('climbPrompt');
    if (climbPrompt) {
      if (nearLadder && !hero.climbing) {
        climbPrompt.classList.remove('hidden');
      } else {
        climbPrompt.classList.add('hidden');
      }
    }

    if (nearLadder && (input.up || input.down) && !hero.actionLock) {
      hero.climbing = true;
      hero.activeLadder = nearLadder;
      hero.vx = 0;
      hero.x = nearLadder.x + (nearLadder.w - hero.w) * 0.5;
    }

    if (hero.climbing) {
      hero.grounded = true;
      hero.vy = 0;
      if (input.up) hero.y -= 3.2;
      else if (input.down) hero.y += 3.2;

      if (hero.y + hero.h < hero.activeLadder.topY - 4) {
        hero.y = hero.activeLadder.topY - hero.h;
        hero.climbing = false;
      } else if (hero.y + hero.h > hero.activeLadder.bottomY) {
        hero.y = hero.activeLadder.bottomY - hero.h;
        hero.climbing = false;
      }
      if (input.left || input.right) hero.climbing = false;
    } else {
      if (!hero.actionLock && hero.autoVictoryTimer <= 0) {
        if (input.left) { hero.vx = -hero.speed; hero.facing = -1; }
        else if (input.right) { hero.vx = hero.speed; hero.facing = 1; }
        else { hero.vx *= 0.78; if (Math.abs(hero.vx) < 0.1) hero.vx = 0; }

        if (hero.grounded) hero.coyoteTimer = 7;
        else if (hero.coyoteTimer > 0) hero.coyoteTimer--;

        if (hero.jumpBuffer > 0) hero.jumpBuffer--;
        if (hero.jumpBuffer > 0 && hero.coyoteTimer > 0) {
          hero.vy = -12.4;
          hero.grounded = false;
          hero.coyoteTimer = 0;
          hero.jumpBuffer = 0;
          AudioEngine.jump();
        }
      } else {
        hero.vx *= 0.82;
      }

      hero.vy += GRAVITY;
      if (hero.vy > 12) hero.vy = 12;
      input.jumpPressed = false;

      const prevFoot = hero.y + hero.h;
      hero.x += hero.vx;

      // Perlanggaran Dinding Pepejal
      for (const p of platforms) {
        if (p.type === 'wall') {
          if (hero.y + hero.h > p.y && hero.y < p.y + p.h) {
            if (hero.vx > 0 && hero.x + hero.w >= p.x && hero.x < p.x) {
              hero.x = p.x - hero.w;
              hero.vx = 0;
            } else if (hero.vx < 0 && hero.x <= p.x + p.w && hero.x + hero.w > p.x + p.w) {
              hero.x = p.x + p.w;
              hero.vx = 0;
            }
          }
        }
      }

      hero.y += hero.vy;
      if (hero.x < 20) hero.x = 20;
      if (hero.x > WORLD_W - hero.w - 20) hero.x = WORLD_W - hero.w - 20;

      hero.grounded = false;

      // Perlanggaran Lantai Flat & Cerun Ramp
      for (const p of platforms) {
        if (p.type === 'flat') {
          if (hero.x + hero.w > p.x && hero.x < p.x + p.w && hero.vy >= 0) {
            if (prevFoot <= p.y + 14 && hero.y + hero.h >= p.y) {
              hero.y = p.y - hero.h;
              hero.vy = 0;
              hero.grounded = true;
              break;
            }
          }
        } else if (p.type === 'ramp') {
          const minX = Math.min(p.x1, p.x2);
          const maxX = Math.max(p.x1, p.x2);
          if (hMidX >= minX && hMidX <= maxX) {
            const progress = (hMidX - p.x1) / (p.x2 - p.x1);
            const targetY = p.y1 + progress * (p.y2 - p.y1);
            if (prevFoot <= targetY + 16 && hero.y + hero.h >= targetY - 4) {
              hero.y = targetY - hero.h;
              hero.vy = 0;
              hero.grounded = true;
              break;
            }
          }
        }
      }
    }

    // Jatuh ke dalam lahar
    if (hero.y > VIEW_H + 50) {
      hero.x = 1000;
      hero.y = 280;
      hero.vy = 0;
      hero.climbing = false;
      inflictDamage(20, 1);
      addFloatingPopup('BURNING MAGMA HAZARD!', hero.x, hero.y - 30, '#ef4444');
    }

    // Penetapan Keadaan Animasi Hero
    if (!hero.actionLock && hero.autoVictoryTimer <= 0 && !hero.isRespawning) {
      if (hero.climbing) {
        hero.state = 'climb';
      } else if (!hero.grounded) {
        hero.state = hero.vy < 0 ? 'jump' : 'fall';
      } else if (Math.abs(hero.vx) > 0.2) {
        hero.state = 'run';
      } else {
        hero.state = 'idle';
      }
    }

    const hAct = HERO_CONFIG.actions[hero.state] || HERO_CONFIG.actions.idle;
    if (!hero.climbing || (input.up || input.down)) {
      hero.animTimer += dt;
      if (hero.animTimer >= 1 / hAct.fps) {
        hero.animTimer = 0;
        hero.animFrame++;
        if (hero.animFrame >= hAct.count) {
          if (hAct.loop) {
            hero.animFrame = 0;
          } else {
            hero.animFrame = hAct.count - 1;
            if (hero.actionLock && hero.autoVictoryTimer <= 0 && !hero.isRespawning) {
              hero.actionLock = false;
              hero.state = hero.grounded ? 'idle' : 'fall';
              hero.animFrame = 0;
            }
          }
        }
      }
    }
    if (hero.animFrame >= hAct.count) hero.animFrame = hAct.count - 1;

    // Serangan Tetakan Hero
    if (input.attackPressed && !hero.actionLock && hero.autoVictoryTimer <= 0 && !hero.isRespawning) {
      input.attackPressed = false;
      hero.actionLock = true;
      hero.state = 'slash';
      hero.animFrame = 0;
      hero.animTimer = 0;
      AudioEngine.slash();

      const slashBox = {
        x: hero.facing === 1 ? hero.x : hero.x - 70,
        y: hero.y - 10,
        w: hero.w + 70,
        h: hero.h + 20
      };

      for (const g of goblins) {
        if (g.alive && slashBox.x + slashBox.w > g.x && slashBox.x < g.x + g.w &&
            slashBox.y + slashBox.h > g.y && slashBox.y < g.y + g.h) {
          g.hp -= 40;
          g.hurtTimer = 12;
          g.vx = hero.facing * 3.5;
          AudioEngine.hit();
          camera.shakeFrames = 6;
          camera.shakeMag = 3;
          addFloatingPopup('-40', g.x + 20, g.y, '#f59e0b');

          if (g.hp <= 0) {
            g.alive = false;
            g.state = 'death';
            g.animFrame = 0;
            g.animTimer = 0;
            AudioEngine.goblinDie();
          }
        }
      }

      if (boss.spawned && boss.alive) {
        if (slashBox.x + slashBox.w > boss.x - 60 && slashBox.x < boss.x + 90 &&
            slashBox.y + slashBox.h > boss.y - 160 && slashBox.y < boss.y + 40) {
          boss.hp = Math.max(0, boss.hp - 35);
          AudioEngine.hit();
          camera.shakeFrames = 8;
          camera.shakeMag = 4;
          addFloatingPopup('-35', boss.x, boss.y - 80, '#fde047');
          updateHud();

          if (boss.hp <= 0) {
            boss.alive = false;
            boss.state = 'defeat';
            boss.animFrame = 0;
            boss.animTimer = 0;
            AudioEngine.playBgm('stage');
            AudioEngine.victory();
            updateHud();

            hero.autoVictoryTimer = 2.2;
            hero.actionLock = true;
            hero.state = 'victory';
            hero.animFrame = 0;
            hero.animTimer = 0;

            careerScroll.unlocked = true;
            addFloatingPopup('CHAPTER II UNSEALED!', boss.x - 20, boss.y - 80, '#38bdf8');
          }
        }
      }
    }
    input.attackPressed = false;

    // Kutip Power Orbs
    for (const orb of orbs) {
      if (!orb.collected) {
        const hx = hero.x + hero.w * 0.5;
        const hy = hero.y + hero.h * 0.5;
        if (Math.abs(hx - orb.x) < 45 && (hy - orb.y > -50 && hy - orb.y < 95)) {
          orb.collected = true;
          AudioEngine.orb();
          addFloatingPopup(`+${orb.name}`, orb.x - 10, orb.y - 30, orb.color);
          updateHud();
        }
      }
    }

    // AI Goblins
    for (const g of goblins) {
      if (!g.alive) {
        if (g.state === 'death') {
          const gAct = GOBLIN_CONFIG.actions.death;
          g.animTimer += dt;
          if (g.animTimer >= 1 / gAct.fps) {
            g.animTimer = 0;
            g.animFrame++;
            if (g.animFrame >= gAct.count) {
              g.state = 'dead_poof';
            }
          }
        }
        continue;
      }

      const hCenterX = hero.x + hero.w * 0.5;
      const gCenterX = g.x + g.w * 0.5;
      const distX = Math.abs(hCenterX - gCenterX);
      const distY = Math.abs((hero.y + hero.h) - (g.y + g.h));

      // Jarak pengesanan & jangkauan libasan senjata goblin berdepan
      const inAttackRange = distX < 78 && distY < 50;

      if (inAttackRange) {
        if (g.state !== 'attack') {
          g.state = 'attack';
          g.animFrame = 0;
          g.animTimer = 0;
          g.hasHit = false;
        }
        g.facing = hCenterX < gCenterX ? -1 : 1;
      }

      if (g.state === 'attack') {
        g.animTimer += dt;
        const gAct = GOBLIN_CONFIG.actions.attack;
        if (g.animTimer >= 1 / gAct.fps) {
          g.animTimer = 0;
          g.animFrame++;
          if (g.animFrame >= gAct.count) {
            g.animFrame = 0;
            g.hasHit = false;
            if (!inAttackRange) {
              g.state = 'walk';
            }
          }
        }

        // Libasan senjata goblin mengena pada frame aktif (frame 1 atau 2) semasa berdepan
        const isStrikeFrame = (g.animFrame === 1 || g.animFrame === 2);
        const facingHero = (hCenterX - gCenterX) * g.facing > -15;
        if (hero.invulnFrames <= 0 && !hero.isRespawning) {
          if (isStrikeFrame && facingHero && inAttackRange && !g.hasHit) {
            inflictDamage(10, g.facing);
            g.hasHit = true;
          } else if (distX < 42 && distY < 40) {
            // Sentuhan fizikal terus (body collision)
            inflictDamage(10, g.facing || (hCenterX < gCenterX ? 1 : -1));
          }
        }
      } else {
        // Goblin sedang meronda / berjalan
        g.state = 'walk';
        g.x += g.vx;
        if (g.x <= g.minX) { g.vx = Math.abs(g.vx); g.facing = 1; }
        if (g.x + g.w >= g.maxX) { g.vx = -Math.abs(g.vx); g.facing = -1; }

        g.animTimer += dt;
        const gAct = GOBLIN_CONFIG.actions.walk;
        if (g.animTimer >= 1 / gAct.fps) {
          g.animTimer = 0;
          g.animFrame = (g.animFrame + 1) % gAct.count;
        }

        if (distX < 42 && distY < 40 && hero.invulnFrames <= 0 && !hero.isRespawning) {
          inflictDamage(10, g.facing || (hCenterX < gCenterX ? 1 : -1));
        }
      }
    }

    // KEBANGKITAN BOS MAGMA WARDEN
    const orbsCount = orbs.filter(o => o.collected).length;
    if (orbsCount >= 5 && hero.x >= 960 && !boss.spawned) {
      boss.spawned = true;
      boss.alive = true;
      boss.state = 'idle';
      boss.stateTimer = 60;
      AudioEngine.playBgm('boss');
      camera.shakeFrames = 25;
      camera.shakeMag = 8;
      addFloatingPopup('⚠️ MAGMA WARDEN AWAKENS!', boss.x - 70, boss.y - 80, '#ef4444');
      updateHud();
    }

    // AI Bos Magma Warden
    if (boss.spawned && boss.alive) {
      boss.facing = (hero.x < boss.x) ? -1 : 1;
      const bAct = BOSS2_CONFIG.actions[boss.state] || BOSS2_CONFIG.actions.idle;
      boss.animTimer += dt;

      if (boss.animTimer >= 1 / bAct.fps) {
        boss.animTimer = 0;
        boss.animFrame++;

        if (boss.state === 'breathe' && boss.animFrame === 2) {
          spawnFireball(boss.x + (boss.facing === -1 ? -45 : 45), boss.y - 45, boss.facing * 5.8);
        }

        if (boss.state === 'summon' && boss.animFrame === 2) {
          spawnLavaPillar(hero.x + hero.w * 0.5);
          const extraCount = Math.random() > 0.4 ? 2 : 1;
          for (let k = 0; k < extraCount; k++) {
            lavaPillars.push({
              x: 1080 + Math.random() * 460,
              y: 430,
              stage: 'warning',
              warningTimer: 0.8 + (k * 0.2),
              frame: 0,
              animTimer: 0
            });
          }
          addFloatingPopup('MAGMA SURGE!', boss.x - 40, boss.y - 120, '#f97316');
        }

        if (boss.animFrame >= bAct.count) {
          if (bAct.loop) {
            boss.animFrame = 0;
          } else {
            boss.state = 'idle';
            boss.animFrame = 0;
            boss.stateTimer = 75 + Math.random() * 40;
          }
        }
      }

      if (boss.state === 'idle') {
        boss.stateTimer -= dt * 60;
        if (boss.stateTimer <= 0) {
          const isBreathe = Math.random() > 0.5;
          boss.state = isBreathe ? 'breathe' : 'summon';
          boss.animFrame = 0;
          boss.animTimer = 0;
        }
      }
    } else if (boss.spawned && !boss.alive && boss.state === 'defeat') {
      const bAct = BOSS2_CONFIG.actions[boss.state] || BOSS2_CONFIG.actions.idle;
      boss.animTimer += dt;
      if (boss.animTimer >= 1 / bAct.fps) {
        boss.animTimer = 0;
        boss.animFrame++;
        if (boss.animFrame >= bAct.count) {
          boss.animFrame = bAct.count - 1;
          boss.state = 'gone';
        }
      }
    }

    // Interaksi Skrol Kerjaya (Pillar 7: Strict [E] Interaction, No Auto-Opening)
    if (careerScroll.unlocked && !careerScroll.opened && hero.autoVictoryTimer <= 0) {
      const dist = Math.hypot((hero.x + hero.w * 0.5) - careerScroll.x, (hero.y + hero.h * 0.5) - careerScroll.y);
      const prompt = document.getElementById('interactPrompt');

      if (dist < 85) {
        if (prompt) {
          const promptInner = prompt.querySelector('div') || prompt;
          promptInner.textContent = isTouchDevice ? '📜 TAP [INTERACT] TO UNSEAL CHAPTER' : '📜 PRESS [E] TO UNSEAL CHAPTER';
          prompt.classList.remove('hidden');
        }
        if (input.interactPressed && careerScroll.state === 'floating') {
          careerScroll.state = 'unsealing';
          careerScroll.frameIdx = 0;
          careerScroll.animTimer = 0;
          AudioEngine.sealCrack();
        }
      } else {
        if (prompt) prompt.classList.add('hidden');
      }

      if (careerScroll.state === 'unsealing') {
        const scAct = SCROLL_CONFIG.actions.unsealing;
        careerScroll.animTimer += dt;
        if (careerScroll.animTimer >= 1 / scAct.fps) {
          careerScroll.animTimer = 0;
          careerScroll.frameIdx++;
          if (careerScroll.frameIdx >= scAct.frames.length) {
            careerScroll.opened = true;
            careerScroll.state = 'opened';
            careerScroll.frameIdx = 0;
            const sModal = document.getElementById('scrollModal');
            if (sModal) {
              sModal.style.setProperty('display', 'flex', 'important');
              sModal.classList.remove('hidden');
            }
            if (prompt) prompt.classList.add('hidden');
            AudioEngine.victory();
          }
        }
      } else if (careerScroll.state === 'floating') {
        const scAct = SCROLL_CONFIG.actions.floating;
        careerScroll.animTimer += dt;
        if (careerScroll.animTimer >= 1 / scAct.fps) {
          careerScroll.animTimer = 0;
          careerScroll.frameIdx = (careerScroll.frameIdx + 1) % scAct.frames.length;
        }
      }
    }
    input.interactPressed = false;
    input.interactPressed = false;

    camera.targetX = Math.max(0, Math.min(WORLD_W - VIEW_W, hero.x - VIEW_W * 0.42));
    camera.x += (camera.targetX - camera.x) * 0.08;
  }

  // ========================================================
  // 8. UPDATE HUD
  // ========================================================
  function updateHud() {
    const hpFill = document.getElementById('heroHpFill');
    if (hpFill) hpFill.style.width = `${Math.max(0, hero.hp)}%`;
    const hpTxt = document.getElementById('heroHpText');
    if (hpTxt) hpTxt.textContent = `${Math.ceil(hero.hp)} / 100`;

    const collected = orbs.filter(o => o.collected).length;
    const orbTxt = document.getElementById('orbCountText');
    if (orbTxt) orbTxt.textContent = `${collected} / 5`;

    const orbSheet = Loaded.get('orbs');
    if (orbSheet && orbSheet.naturalWidth > 0) {
      const frameW = Math.floor(orbSheet.naturalWidth / 7);
      const frameH = Math.floor(orbSheet.naturalHeight / 5);

      orbs.forEach((o, i) => {
        const c = document.getElementById(`hudOrb${i}`);
        if (!c) return;
        const hctx = c.getContext('2d');
        hctx.imageSmoothingEnabled = false;
        hctx.clearRect(0, 0, c.width, c.height);

        const sx = 0;
        const sy = o.row * frameH;

        hctx.save();
        if (o.collected) {
          hctx.drawImage(orbSheet, sx, sy, frameW, frameH, 0, 0, c.width, c.height);
          c.style.filter = `drop-shadow(0 0 6px ${o.color}) drop-shadow(0 0 12px ${o.color})`;
          c.style.transform = 'scale(1.15)';
          c.style.opacity = '1.0';
        } else {
          hctx.globalAlpha = 0.35;
          hctx.drawImage(orbSheet, sx, sy, frameW, frameH, 0, 0, c.width, c.height);
          hctx.globalCompositeOperation = 'source-atop';
          hctx.fillStyle = '#0f172a';
          hctx.fillRect(0, 0, c.width, c.height);
          c.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))';
          c.style.transform = 'scale(1.0)';
          c.style.opacity = '0.5';
        }
        hctx.restore();
      });
    }

    const bossHud = document.getElementById('bossHud');
    if (bossHud) {
      if (boss.spawned && boss.alive) {
        bossHud.classList.remove('hidden');
        const bFill = document.getElementById('bossHpFill');
        if (bFill) bFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
        const bTxt = document.getElementById('bossHpText');
        if (bTxt) bTxt.textContent = `${Math.ceil(boss.hp)} / ${boss.maxHp}`;
      } else {
        bossHud.classList.add('hidden');
      }
    }
  }

  // ========================================================
  // 9. RENDER LOOP
  // ========================================================
  function render() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    let sx = 0, sy = 0;
    if (camera.shakeFrames > 0 && !isGamePaused) {
      sx = (Math.random() - 0.5) * camera.shakeMag * 2;
      sy = (Math.random() - 0.5) * camera.shakeMag * 2;
    }

    ctx.translate(-Math.round(camera.x + sx), sy);

    // A. Backgrounds
    const bg1 = Loaded.get('page1');
    const bg2 = Loaded.get('page2');
    if (bg1) ctx.drawImage(bg1, 0, 0, 960, VIEW_H);
    if (bg2) ctx.drawImage(bg2, 960, 0, 960, VIEW_H);

    // B. Power Orbs
    const orbSheet = Loaded.get('orbs');
    orbs.forEach((o, idx) => {
      if (!o.collected) {
        const bob = Math.sin(performance.now() * 0.005 + idx * 1.5) * 6;
        const oy = Math.round(o.y + bob);

        ctx.save();
        ctx.fillStyle = o.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(o.x, oy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (orbSheet && orbSheet.naturalWidth > 0) {
          const cW = Math.floor(orbSheet.naturalWidth / 7);
          const cH = Math.floor(orbSheet.naturalHeight / 5);
          const f = Math.floor(performance.now() * 0.008 + idx) % 7;
          ctx.drawImage(orbSheet, f * cW, o.row * cH, cW, cH, o.x - 42, oy - 42, 84, 84);
        } else {
          ctx.fillStyle = o.color;
          ctx.beginPath();
          ctx.arc(o.x, oy, 18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });

    // C. Goblins
    const gobSheet = Loaded.get('goblin');
    goblins.forEach(g => {
      if (g.state === 'dead_poof') return;
      if (gobSheet) {
        const act = GOBLIN_CONFIG.actions[g.state] || GOBLIN_CONFIG.actions.idle;
        const cellW = gobSheet.naturalWidth / GOBLIN_CONFIG.cols;
        const cellH = gobSheet.naturalHeight / GOBLIN_CONFIG.rows;
        const srcX = Math.floor((act.startCol + g.animFrame) * cellW);
        const srcY = Math.floor(act.row * cellH);

        ctx.save();
        ctx.translate(Math.round(g.x + g.w * 0.5), Math.round(g.y + g.h));
        ctx.scale(g.facing, 1);
        ctx.drawImage(
          gobSheet,
          srcX, srcY, cellW, cellH,
          GOBLIN_CONFIG.offsetX, GOBLIN_CONFIG.offsetY, GOBLIN_CONFIG.renderSize, GOBLIN_CONFIG.renderSize
        );
        ctx.restore();
      }
    });

    // D. Boss 2 (Magma Warden)
    const bossSheet = Loaded.get('boss2');
    if (boss.spawned && boss.state !== 'gone' && bossSheet) {
      const act = BOSS2_CONFIG.actions[boss.state] || BOSS2_CONFIG.actions.idle;
      const cellW = bossSheet.naturalWidth / BOSS2_CONFIG.cols;
      const cellH = bossSheet.naturalHeight / BOSS2_CONFIG.rows;
      const srcX = Math.floor((act.startCol + boss.animFrame) * cellW);
      const srcY = Math.floor(act.row * cellH);

      ctx.save();
      ctx.translate(Math.round(boss.x), boss.y);
      ctx.scale(boss.facing, 1);
      ctx.drawImage(
        bossSheet,
        srcX, srcY, cellW, cellH,
        BOSS2_CONFIG.offsetX, BOSS2_CONFIG.offsetY, BOSS2_CONFIG.renderSize, BOSS2_CONFIG.renderSize
      );
      ctx.restore();
    }

    // E. Peluru Bola Api
    const fbSheet = Loaded.get('fireball');
    fireballs.forEach(fb => {
      ctx.save();
      ctx.translate(Math.round(fb.x), Math.round(fb.y));
      if (fb.vx < 0) ctx.scale(-1, 1);

      if (fbSheet && fbSheet.naturalWidth > 0) {
        const fW = fbSheet.naturalWidth / 5;
        const fH = fbSheet.naturalHeight;
        ctx.drawImage(fbSheet, fb.frame * fW, 0, fW, fH, -38, -130, 70, 200);
      } else {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // F. Tiang Lahar
    const lpSheet = Loaded.get('pillar');
    lavaPillars.forEach(lp => {
      ctx.save();
      if (lp.stage === 'warning') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
        ctx.fillRect(lp.x - 28, lp.y - 6, 56, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lp.x - 14, lp.y - 8, 28, 3);
      } else if (lp.stage === 'erupt' && lpSheet && lpSheet.naturalWidth > 0) {
        const pW = lpSheet.naturalWidth / 8;
        const pH = lpSheet.naturalHeight;
        const renderH = 220;
        const renderW = Math.round(renderH * (pW / pH));

        ctx.drawImage(
          lpSheet,
          lp.frame * pW, 0, pW, pH,
          Math.round(lp.x - renderW * 0.5), lp.y - renderH, renderW, renderH
        );
      }
      ctx.restore();
    });

    // G. Career Scroll
    const scrollSheet = Loaded.get('scroll');
    if (careerScroll.unlocked && scrollSheet) {
      const sx = careerScroll.x;
      const bob = (careerScroll.opened) ? 0 : Math.sin(performance.now() * 0.004) * 6;
      const sy = careerScroll.y + bob;

      const scAct = SCROLL_CONFIG.actions[careerScroll.state] || SCROLL_CONFIG.actions.floating;
      const targetFrame = (scAct && scAct.frames && scAct.frames[careerScroll.frameIdx] !== undefined)
        ? scAct.frames[careerScroll.frameIdx]
        : 0;

      const cellW = Math.floor(scrollSheet.naturalWidth / SCROLL_CONFIG.cols);
      const cellH = Math.floor(scrollSheet.naturalHeight / SCROLL_CONFIG.rows);
      const aspect = cellW / cellH;
      const renderH = SCROLL_CONFIG.renderH;
      const renderW = Math.round(renderH * aspect);

      ctx.drawImage(
        scrollSheet,
        targetFrame * cellW, 0, cellW, cellH,
        Math.round(sx - renderW * 0.5), Math.round(sy - renderH * 0.5), renderW, renderH
      );
    }

    // H. Hero Ksatria
    const heroSheet = Loaded.get('hero');
    if (heroSheet) {
      if (!(hero.invulnFrames > 0 && !hero.isRespawning && Math.floor(hero.invulnFrames / 4) % 2 === 1)) {
        const act = HERO_CONFIG.actions[hero.state] || HERO_CONFIG.actions.idle;
        const safeFrame = Math.min(hero.animFrame, (act.count || 1) - 1);
        const colsInRow = act.cols || 10;
        const cellW = act.cellW || Math.floor(heroSheet.naturalWidth / colsInRow);
        const cellH = Math.floor(heroSheet.naturalHeight / HERO_CONFIG.rows);
        const srcX = act.customSx ? act.customSx[safeFrame] : Math.floor((act.startCol + safeFrame) * cellW);
        const srcY = Math.floor(act.row * cellH);

        ctx.save();
        ctx.translate(Math.round(hero.x + hero.w * 0.5), Math.round(hero.y + hero.h));
        ctx.scale(hero.facing, 1);
        ctx.drawImage(
          heroSheet,
          srcX, srcY, cellW, cellH,
          HERO_CONFIG.offsetX, HERO_CONFIG.offsetY, HERO_CONFIG.renderSize, HERO_CONFIG.renderSize
        );
        ctx.restore();
      }
    }

    // I. Tiang Batu Lutsinar
    if (bg1 && bg1.complete) {
      pillars.forEach(pil => {
        if (hero.x + hero.w > pil.x && hero.x < pil.x + pil.w) {
          ctx.save();
          ctx.globalAlpha = pil.alpha;
          const scaleX = bg1.naturalWidth / 960;
          const scaleY = bg1.naturalHeight / 540;
          ctx.drawImage(
            bg1,
            pil.x * scaleX, pil.y * scaleY, pil.w * scaleX, pil.h * scaleY,
            pil.x, pil.y, pil.w, pil.h
          );
          ctx.restore();
        }
      });
    }

    // J. Pop-up Terapung
    floatingPopups.forEach(pop => {
      ctx.save();
      ctx.font = '7px "Press Start 2P"';
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = Math.max(0.1, pop.life / pop.maxLife);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    // K. Hamparan Garis Debug [G]
    if (showDebugRoute) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.font = '7px "Press Start 2P"';

      ladders.forEach((l, idx) => {
        ctx.strokeStyle = '#06b6d4';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.strokeRect(l.x, l.topY, l.w, l.bottomY - l.topY);
        ctx.fillRect(l.x, l.topY, l.w, l.bottomY - l.topY);
        ctx.fillStyle = '#22d3ee';
        ctx.fillText(`Ladder ${idx+1}`, l.x - 10, l.topY - 8);
      });

      platforms.forEach((p, idx) => {
        if (p.type === 'flat') {
          ctx.strokeStyle = '#22c55e';
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.w, p.y);
          ctx.stroke();
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = '#4ade80';
          ctx.fillText(`[${idx}] ${p.id}`, p.x + 4, p.y - 6);
        } else if (p.type === 'ramp') {
          ctx.strokeStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(p.x1, p.y1);
          ctx.lineTo(p.x2, p.y2);
          ctx.stroke();
          const midX = (p.x1 + p.x2) * 0.5;
          const midY = (p.y1 + p.y2) * 0.5;
          ctx.fillStyle = '#fde047';
          ctx.fillText(`[${idx}] Ramp`, midX - 25, midY - 8);
        } else if (p.type === 'wall') {
          ctx.strokeStyle = '#ef4444';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = '#fca5a5';
          ctx.fillText(`[${idx}] Wall`, p.x - 12, p.y - 6);
        }
      });

      pillars.forEach(pil => {
        ctx.strokeStyle = '#c084fc';
        ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
        ctx.strokeRect(pil.x, pil.y, pil.w, pil.h);
        ctx.fillRect(pil.x, pil.y, pil.w, pil.h);
        ctx.fillStyle = '#e9d5ff';
        ctx.fillText(pil.id, pil.x + 4, pil.y + 16);
      });

      ctx.restore();
    }

    ctx.restore();
  }

  function renderPortrait() {
    const c = document.getElementById('portraitCanvas');
    if (!c) return;
    const pctx = c.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, c.width, c.height);

    pctx.fillStyle = '#0f172a';
    pctx.fillRect(0, 0, c.width, c.height);

    const sheet = Loaded.get('hero');
    if (sheet && sheet.naturalWidth > 0) {
      const cellW = sheet.naturalWidth / 10;
      const cellH = sheet.naturalHeight / 5;

      const srcX = cellW * 0.28;
      const srcY = cellH * 0.04;
      const srcW = cellW * 0.52;
      const srcH = cellH * 0.52;

      pctx.drawImage(sheet, srcX, srcY, srcW, srcH, 0, 0, c.width, c.height);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    updateGame(dt);
    render();
    requestAnimationFrame(loop);
  }

  function startGame() {
    Loaded.init(() => {
      renderPortrait();
      updateHud();
      AudioEngine.init();

      const unlockAudio = () => {
        AudioEngine.init();
        AudioEngine.playBgm(AudioEngine.mode || 'stage');
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });

      requestAnimationFrame(loop);
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startGame();
  } else {
    window.addEventListener('DOMContentLoaded', startGame);
  }
})();