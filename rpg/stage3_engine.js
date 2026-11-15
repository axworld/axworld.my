(function () {
  'use strict';

  const isTouchDevice = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // ===================================================================
  // 1. SMART ASSETS LOADER DENGAN SAFE TIMEOUT
  // ===================================================================
  const CANDIDATES = {
    hero: ["hero_azzumie_spritesheet.png"],
    goblin: ["goblin_spritesheet.png"],
    boss3: ["boss3_spritesheet.png"],
    tornado: ["tornado_sprite.png"],
    lightning: ["lightning_sprite.png"],
    orbs: ["power_orbs_spritesheet.png"],
    scroll: ["career_scroll_spritesheet.png"],
    page1: ["stage3_bg_page1.jpg"],
    page2: ["stage3_bg_page2.jpg"]
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
        this.tracks.stage = new Audio('stage3_bgm.mp3');
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
      } catch (e) {}
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
    windWhirl() { this.playTone(320, 0.45, 'sine', 140, 0.25); },
    thunderStrike() {
      this.playTone(110, 0.65, 'sawtooth', 25, 0.4);
      this.playTone(60, 0.70, 'square', 18, 0.35);
    },
    gearClank() {
      this.playTone(120, 0.35, 'sawtooth', 40, 0.3);
      this.playTone(85, 0.4, 'square', 30, 0.25);
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

  const btnToggleAudio = document.getElementById('btnAudioToggle');
  if (btnToggleAudio) {
    btnToggleAudio.addEventListener('click', () => AudioEngine.toggle());
  }

  // ===================================================================
  // 3. CANVAS, CAMERA & PLATFORM KESELURUHAN (PAGE 1 & PAGE 2)
  // ===================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const VIEW_W = 960;
  const VIEW_H = 540;
  const WORLD_W = 1920;
  const GRAVITY = 0.52;

  const camera = { x: 0, targetX: 0, shakeFrames: 0, shakeMag: 0 };
  let isGamePaused = false;
  let showDebug = false;

  const platforms = [
    // --- PAGE 1: THE SCRIPTORIUM (X: 0 -> 960) ---
    { id: 'p1_ground', type: 'flat', x: 0, y: 530, w: 960, h: 70 },
    { id: 'p1_mez_mid_left', type: 'flat', x: 0, y: 355, w: 230, h: 18 },
    { id: 'p1_mez_top_left', type: 'flat', x: 0, y: 205, w: 240, h: 18 },
    { id: 'p1_shelf_mid', type: 'flat', x: 230, y: 355, w: 290, h: 20 },
    { id: 'p1_shelf_top', type: 'flat', x: 290, y: 255, w: 160, h: 18 },
    { id: 'p1_center_stairs_ramp', type: 'ramp', x1: 230, y1: 200, x2: 300, y2: 270 },
    { id: 'p1_bridge_beam', type: 'flat', x: 520, y: 250, w: 240, h: 18 },
    // 👈 DIBAIKI: Sekatan tiang di platform atas menghalang hero tembus ke Page 2
    { id: 'p1_upper_pillar_block', type: 'wall', x: 760, y: 0, w: 35, h: 390 },
    { id: 'p1_upper_arch_block', type: 'wall', x: 915, y: 0, w: 55, h: 390 },
    { id: 'secret_door_wall', type: 'wall', x: 790, y: 70, w: 25, h: 500 },

    // --- PAGE 2: THE ROYAL BELFRY (X: 960 -> 1920) ---
    { id: 'p2_belfry_floor', type: 'flat', x: 1040, y: 490, w: 660, h: 95 },
    { id: 'p2_altar_ramp', type: 'ramp', x1: 1650, y1: 540, x2: 1810, y2: 420 },
    { id: 'p2_altar_ramp2', type: 'ramp', x1: 900, y1: 550, x2: 1040, y2: 490 },
    { id: 'p2_altar_platform', type: 'flat', x: 1800, y: 420, w: 100, h: 155 }
  ];

  const ladders = [
    { id: 'ladder_p1_left', x: 78, w: 32, topY: 205, bottomY: 530 }
  ];

  const pillars = [
    { page: 1, id: 'p1_pillar_arch_mid',      x: 915, y: 0, w: 55, h: 600, alpha: 0.88 },
    { page: 2, id: 'p2_pillar_entrance_arch', x: 960, y: 0, w: 90, h: 600, alpha: 0.88 }
  ];

  // ===================================================================
  // 4. MEKANIK PINTU RAHASIA GEAR SLIDING DROP (PAGE 1)
  // ===================================================================
  const secretMechanism = {
    tomeX: 560,
    tomeY: 440,
    tomeW: 60,
    tomeH: 40,
    doorX: 800,
    doorY: 200,
    doorW: 200,
    doorH: 350,
    doorOffsetY: 0,
    maxDropY: 400,
    isOpening: false,
    isOpen: false,
    gearRotation: 0,
    doorWallRef: platforms.find(p => p.id === 'secret_door_wall')
  };

  // ===================================================================
  // 5. KONFIGURASI HERO, GOBLIN, CHIMERA, ORBS & SCROLL
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
    offsetY: -110,
    actions: {
      idle:   { row: 0, startCol: 0, count: 4, fps: 6,  loop: true },
      walk:   { row: 1, startCol: 0, count: 6, fps: 10, loop: true },
      attack: { row: 2, startCol: 0, count: 4, fps: 10, loop: false },
      death:  { row: 3, startCol: 0, count: 6, fps: 8,  loop: false }
    }
  };

  const CHIMERA_CONFIG = {
    rows: 4,
    cols: 6,
    renderSize: 220,
    offsetX: -110,
    offsetY: -130,
    actions: {
      hover:   { row: 0, startCol: 0, count: 4, fps: 6, loop: true },
      tornado: { row: 1, startCol: 0, count: 5, fps: 7, loop: false },
      thunder: { row: 2, startCol: 0, count: 3, fps: 7, loop: false },
      defeat:  { row: 3, startCol: 0, count: 6, fps: 6, loop: false }
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
  // 6. STATUS ENTITAS
  // ===================================================================
  const hero = {
    x: 80,
    y: 380, // Untuk Stage 1 & 2 laraskan mengikut aras lantai asal masing-masing
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
    isRespawning: false // <-- Tambah ini
  };

  const goblins = [
    { id: 1, x: 260,  y: 490, vx: 1.1, w: 42, h: 58, facing: 1,  minX: 160,  maxX: 440,  hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 2, x: 380,  y: 320, vx: 1.0, w: 42, h: 58, facing: -1, minX: 250,  maxX: 500,  hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 3, x: 1220, y: 455, vx: 1.2, w: 42, h: 58, facing: 1,  minX: 1100, maxX: 1400, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true }
  ];

  const orbs = [
    { id: 0, name: 'CRIMSON ORB', subtitle: 'Broadcast Ops', x: 90,   y: 130, row: 0, color: '#ef4444', collected: false },
    { id: 1, name: 'AZURE ORB',   subtitle: 'Content Media', x: 380,  y: 280, row: 1, color: '#0ea5e9', collected: false },
    { id: 2, name: 'EMERALD ORB', subtitle: 'Nation Reach',  x: 640,  y: 140, row: 2, color: '#10b981', collected: false },
    { id: 3, name: 'VIOLET ORB',  subtitle: 'Creative Flow', x: 1300, y: 380, row: 3, color: '#8b5cf6', collected: false },
    { id: 4, name: 'GOLDEN ORB',  subtitle: 'Royal Herald',  x: 1830, y: 310, row: 4, color: '#f59e0b', collected: false }
  ];

  const boss = {
    spawned: false,
    alive: true,
    crashed: false,
    x: 1480,
    baseY: 210,
    y: 210,
    w: 120,
    h: 90,
    vx: 1.6,
    facing: -1,
    minX: 1140,
    maxX: 1680,
    hp: 500,
    maxHp: 500,
    state: 'hover',
    animFrame: 0,
    animTimer: 0,
    tiltAngle: 0,
    attackCooldown: 120
  };

  const careerScroll = {
    unlocked: false,
    x: 1850,
    y: 380,
    state: 'floating',
    frameIdx: 0,
    animTimer: 0,
    opened: false
  };

  let tornadoes = [];
  let lightningStrikes = [];
  const floatingPopups = [];

  function addFloatingPopup(text, x, y, color = '#f59e0b') {
    floatingPopups.push({ text, x, y, color, life: 60, maxLife: 60 });
  }

  function spawnTornado(startX, startY, dir) {
    tornadoes.push({
      x: startX,
      y: 600,
      vx: dir * 3.2,
      frame: 0,
      animTimer: 0
    });
    AudioEngine.windWhirl();
  }

  function spawnLightning(targetX) {
    lightningStrikes.push({
      x: targetX,
      stage: 'warning',
      timer: 0.75,
      frame: 0,
      animTimer: 0
    });
  }

  // ===================================================================
  // 7. INPUT CONTROLLER & GAME STATES
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

  function triggerSecretDoor() {
    if (secretMechanism.isOpen || secretMechanism.isOpening) return;
    secretMechanism.isOpening = true;
    AudioEngine.gearClank();
    camera.shakeFrames = 30;
    camera.shakeMag = 5;
    addFloatingPopup('⚙️ SECRET GEARS ACTIVATED!', secretMechanism.tomeX - 30, secretMechanism.tomeY - 40, '#fde047');
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
    if (e.altKey && e.code === 'KeyG') {
      showDebug = !showDebug;
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
  if (btnNextStg) btnNextStg.addEventListener('click', () => window.location.href = 'stage4.html');
  const btnCloseScr = document.getElementById('btnCloseScroll');
  if (btnCloseScr) btnCloseScr.addEventListener('click', () => window.location.reload());
  const btnSkipEnd = document.getElementById('btnSkipToEnd');
  if (btnSkipEnd) btnSkipEnd.addEventListener('click', () => {
    if (confirm("Skip directly to the Career Epilogue & Credits?")) {
      window.location.href = 'credits.html';
    }
  });

  // ===================================================================
  // 8. SISTEM DAMAGE & LOGIK FIZIK KEMAS (DENGAN AUTO-RESPAWN BERSIH)
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
        hero.y = (hero.x > 960 ? 490 : 530) - hero.h;
      }
      hero.grounded = true;
      hero.vy = 0;

      AudioEngine.hit();
      camera.shakeFrames = 15;
      camera.shakeMag = 8;
      addFloatingPopup('FALLEN! RESPAWNING...', hero.x + 20, hero.y - 15, '#ef4444');

      // Beri masa 1.3 saat untuk ksatria jatuh tersungkur sebelum kembali ke titik mula
      setTimeout(() => {
        hero.x = 80;                     // Titik mula pentas
        hero.y = 530 - hero.h;           // Aras lantai pentas
        hero.vx = 0;
        hero.vy = 0;
        hero.hp = 100;                   // Darah penuh semula
        hero.state = 'idle';
        hero.facing = 1;
        hero.actionLock = false;
        hero.isRespawning = false;
        hero.autoVictoryTimer = 0;
        hero.invulnFrames = 60;          // Kebal 1 saat

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
    // Kunci penuh jika hero sedang rebah/respawn
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
      return; // Menghentikan input keyboard dan sentuhan
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

    // A. Keraian Kemenangan Hero (2.2 Saat)
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

    // B. Animasi Pintu Rahsia Sliding Gear Drop (Page 1)
    if (secretMechanism.isOpening) {
      secretMechanism.gearRotation += 0.12;
      secretMechanism.doorOffsetY += 2.2;

      if (secretMechanism.doorOffsetY >= secretMechanism.maxDropY) {
        secretMechanism.doorOffsetY = secretMechanism.maxDropY;
        secretMechanism.isOpening = false;
        secretMechanism.isOpen = true;

        if (secretMechanism.doorWallRef) {
          secretMechanism.doorWallRef.y = 9999;
        }

        AudioEngine.victory();
        addFloatingPopup('PASSAGE TO BELFRY OPENED! ➔', secretMechanism.doorX - 20, 360, '#38bdf8');
      }
    }

    // C. Puting Beliung
    for (let i = tornadoes.length - 1; i >= 0; i--) {
      const tor = tornadoes[i];
      tor.x += tor.vx;
      tor.animTimer += dt;
      if (tor.animTimer >= 0.08) {
        tor.animTimer = 0;
        tor.frame = (tor.frame + 1) % 6;
      }

      const hMidX = hero.x + hero.w * 0.5;
      const hFoot = hero.y + hero.h;
      if (hero.invulnFrames <= 0 && Math.abs(hMidX - tor.x) < 35 && hFoot >= 410) {
        inflictDamage(22, Math.sign(tor.vx));
        tornadoes.splice(i, 1);
        continue;
      }

      if (tor.x < 900 || tor.x > WORLD_W + 80) tornadoes.splice(i, 1);
    }

    // D. Sambaran Kilat
    for (let i = lightningStrikes.length - 1; i >= 0; i--) {
      const lgt = lightningStrikes[i];
      lgt.animTimer += dt;

      if (lgt.stage === 'warning') {
        lgt.timer -= dt;
        if (lgt.timer <= 0) {
          lgt.stage = 'strike';
          lgt.frame = 0;
          lgt.animTimer = 0;
          AudioEngine.thunderStrike();
          camera.shakeFrames = 18;
          camera.shakeMag = 6;
        }
      } else if (lgt.stage === 'strike') {
        if (lgt.animTimer >= 0.07) {
          lgt.animTimer = 0;
          lgt.frame++;
          if (lgt.frame >= 5) {
            lightningStrikes.splice(i, 1);
            continue;
          }
        }

        const hMidX = hero.x + hero.w * 0.5;
        const hFoot = hero.y + hero.h;
        if (lgt.frame >= 1 && lgt.frame <= 2 && hero.invulnFrames <= 0) {
          if (Math.abs(hMidX - lgt.x) < 40 && hFoot >= 420) {
            inflictDamage(30, hero.x < lgt.x ? -1 : 1);
          }
        }
      }
    }

    // E. Pengesanan Tangga Memanjat (Page 1)
    const hMidX = hero.x + hero.w * 0.5;
    const hFootY = hero.y + hero.h;
    let nearLadder = null;

    for (const l of ladders) {
      if (hMidX >= l.x - 12 && hMidX <= l.x + l.w + 12 && hFootY >= l.topY - 14 && hero.y <= l.bottomY + 14) {
        nearLadder = l;
        break;
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

      const prevFoot = hero.y + hero.h;
      hero.x += hero.vx;

      // Sekatan Dinding Pepejal
      for (const p of platforms) {
        if (p.type === 'wall' && p.y < 9000) {
          if (hero.y + hero.h > p.y && hero.y < p.y + p.h) {
            if (hero.x + hero.w > p.x && hero.x < p.x + p.w) {
              if (hero.vx > 0) {
                hero.x = p.x - hero.w;
                hero.vx = 0;
              } else if (hero.vx < 0) {
                hero.x = p.x + p.w;
                hero.vx = 0;
              }
            }
          }
        }
      }

      hero.y += hero.vy;
      if (hero.x < 20) hero.x = 20;
      if (hero.x > WORLD_W - hero.w - 20) hero.x = WORLD_W - hero.w - 20;

      hero.grounded = false;

      // Semakan Platform Lantai Rata & Cerun Ramp
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

          if (hMidX >= minX - 4 && hMidX <= maxX + 4) {
            const progress = (hMidX - p.x1) / (p.x2 - p.x1);
            const targetY = p.y1 + progress * (p.y2 - p.y1);

            if (prevFoot <= targetY + 22 && hero.y + hero.h >= targetY - 12 && hero.vy >= 0) {
              hero.y = targetY - hero.h;
              hero.vy = 0;
              hero.grounded = true;
              break;
            }
          }
        }
      }
    }

    // Jatuh ke bawah (Pencegahan Kejatuhan)
    if (hero.y > VIEW_H + 50) {
      hero.x = hero.x > 960 ? 1000 : 80;
      hero.y = 350;
      hero.vy = 0;
      hero.climbing = false;
      inflictDamage(20, 1);
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

    // Serangan Tetakan Hero (Menyerang Goblins & Chimera)
    if (input.attackPressed && !hero.actionLock && hero.autoVictoryTimer <= 0 && !hero.isRespawning) {
      input.attackPressed = false;
      hero.actionLock = true;
      hero.state = 'slash';
      hero.animFrame = 0;
      hero.animTimer = 0;
      AudioEngine.slash();

      const slashBox = {
        x: hero.facing === 1 ? hero.x : hero.x - 70,
        y: hero.y - 25,
        w: hero.w + 70,
        h: hero.h + 35
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
        if (slashBox.x + slashBox.w > boss.x - 60 && slashBox.x < boss.x + 60 &&
            slashBox.y + slashBox.h > boss.y - 60 && slashBox.y < boss.y + 60) {
          boss.hp = Math.max(0, boss.hp - 45);
          AudioEngine.hit();
          camera.shakeFrames = 8;
          camera.shakeMag = 4;
          addFloatingPopup('-45', boss.x, boss.y - 40, '#fde047');
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
            addFloatingPopup('CHAPTER III UNSEALED!', 1845, 300, '#38bdf8');
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
        if (Math.abs(hx - orb.x) < 45 && (hy - orb.y > -50 && hy - orb.y < 85)) {
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

    // ===================================================================
    // INTERAKSI [E] & SENTUHAN (STANDARD HUD PROMPT)
    // ===================================================================
    const promptEl = document.getElementById('interactPrompt');
    const promptTextEl = document.getElementById('interactPromptText');
    let activePromptMsg = null;

    // A. Interaksi Meja Kitab Rahsia (Page 1 SAHAJA: X < 960)
    if (hero.x < 960) {
      const distToTome = Math.abs(hMidX - (secretMechanism.tomeX + secretMechanism.tomeW * 0.5));
      const nearTome = distToTome < 80 && Math.abs((hero.y + hero.h) - (secretMechanism.tomeY + secretMechanism.tomeH)) < 55;

      if (nearTome && !secretMechanism.isOpen && !secretMechanism.isOpening) {
        activePromptMsg = isTouchDevice ? '📖 TAP [INTERACT] TO ACTIVATE' : '📖 PRESS [E] TO ACTIVATE';
        if (input.interactPressed) {
          triggerSecretDoor();
        }
      }
    }

    // B. Interaksi Skrol Kerjaya di Atas Altar (Pillar 7: Strict [E] Interaction, No Auto-Opening)
    if (careerScroll.unlocked && !careerScroll.opened && hero.autoVictoryTimer <= 0) {
      const heroMidX = hero.x + hero.w * 0.5;
      const heroMidY = hero.y + hero.h * 0.5;
      const distToScroll = Math.hypot(heroMidX - careerScroll.x, heroMidY - careerScroll.y);

      if (distToScroll < 85) {
        activePromptMsg = isTouchDevice ? '📜 TAP [INTERACT] TO UNSEAL CHAPTER' : '📜 PRESS [E] TO UNSEAL CHAPTER';
        if (input.interactPressed && careerScroll.state === 'floating') {
          careerScroll.state = 'unsealing';
          careerScroll.frameIdx = 0;
          careerScroll.animTimer = 0;
          AudioEngine.sealCrack();
        }
      }
    }

    if (promptEl) {
      if (activePromptMsg) {
        if (promptTextEl) promptTextEl.textContent = activePromptMsg;
        promptEl.classList.remove('hidden');
      } else {
        promptEl.classList.add('hidden');
      }
    }

    if (careerScroll.unlocked && !careerScroll.opened && hero.autoVictoryTimer <= 0) {
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
            if (promptEl) promptEl.classList.add('hidden');
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

    // Kebangkitan Automatik Storm Chimera (Wajib 5 Orb & Masuk Page 2)
    const orbsCount = orbs.filter(o => o.collected).length;
    if (orbsCount >= 5 && hero.x >= 1050 && !boss.spawned) {
      boss.spawned = true;
      boss.alive = true;
      boss.state = 'hover';
      boss.attackCooldown = 90;
      AudioEngine.playBgm('boss');
      camera.shakeFrames = 25;
      camera.shakeMag = 8;
      addFloatingPopup('⚠️ STORM CHIMERA AWAKENS!', boss.x - 70, boss.y - 80, '#38bdf8');
      updateHud();
    }

    // AI Bos Storm Chimera
    if (boss.spawned && boss.alive) {
      if (boss.state === 'hover') {
        boss.x += boss.vx;
        boss.facing = boss.vx > 0 ? 1 : -1;
        boss.y = boss.baseY + Math.sin(performance.now() * 0.0035) * 22;
        boss.tiltAngle = (boss.vx > 0 ? 0.08 : -0.08);

        if (boss.x >= boss.maxX) boss.vx = -Math.abs(boss.vx);
        if (boss.x <= boss.minX) boss.vx = Math.abs(boss.vx);

        boss.attackCooldown -= dt * 60;
        if (boss.attackCooldown <= 0) {
          boss.attackCooldown = 110 + Math.random() * 50;
          boss.state = Math.random() > 0.5 ? 'tornado' : 'thunder';
          boss.animFrame = 0;
          boss.animTimer = 0;
        }
      } else {
        boss.tiltAngle *= 0.85;
      }

      const bAct = CHIMERA_CONFIG.actions[boss.state] || CHIMERA_CONFIG.actions.hover;
      boss.animTimer += dt;
      if (boss.animTimer >= 1 / bAct.fps) {
        boss.animTimer = 0;
        boss.animFrame++;

        if (boss.state === 'tornado' && boss.animFrame === 3) {
          spawnTornado(boss.x + (boss.facing === 1 ? 50 : -50), boss.y + 40, boss.facing);
        }

        if (boss.state === 'thunder' && boss.animFrame === 3) {
          spawnLightning(hero.x + hero.w * 0.5);
        }

        if (boss.animFrame >= bAct.count) {
          if (bAct.loop) {
            boss.animFrame = 0;
          } else {
            boss.state = 'hover';
            boss.animFrame = 0;
          }
        }
      }
    } else if (boss.spawned && !boss.alive) {
      if (!boss.crashed) {
        boss.baseY += 5.5;
        boss.y = boss.baseY;
        boss.tiltAngle = 0.25;

        if (boss.y >= 385) {
          boss.y = 385;
          boss.crashed = true;
          boss.tiltAngle = 0;
          AudioEngine.thunderStrike();
          camera.shakeFrames = 25;
          camera.shakeMag = 8;
        }
      }

      const bAct = CHIMERA_CONFIG.actions.defeat;
      boss.animTimer += dt;
      if (boss.animTimer >= 1 / bAct.fps) {
        boss.animTimer = 0;
        boss.animFrame++;
        if (boss.animFrame >= bAct.count) {
          boss.animFrame = bAct.count - 1;
        }
      }
    }

    input.interactPressed = false;

    // Kamera Mengikut Hero merentasi World 1920
    camera.targetX = Math.max(0, Math.min(WORLD_W - VIEW_W, hero.x - VIEW_W * 0.42));
    camera.x += (camera.targetX - camera.x) * 0.08;
  }

  // ========================================================
  // 9. UPDATE HUD
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
  // 10. RENDER LOOP (BERSIH DARI BULATAN KUNING KELAKAR)
  // ========================================================
  function render() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    let shakeX = 0, shakeY = 0;
    if (camera.shakeFrames > 0 && !isGamePaused) {
      shakeX = (Math.random() - 0.5) * camera.shakeMag * 2;
      shakeY = (Math.random() - 0.5) * camera.shakeMag * 2;
    }

    ctx.translate(-Math.round(camera.x + shakeX), shakeY);

    // A. Latar Belakang Terhubung
    const bg1 = Loaded.get('page1');
    const bg2 = Loaded.get('page2');
    if (bg1) ctx.drawImage(bg1, 0, 0, 960, VIEW_H);
    if (bg2) ctx.drawImage(bg2, 960, 0, 960, VIEW_H);

    // B. Pintu Rahsia Sliding Gear Drop (Tekstur Gerbang Page 2 Mirrored)
    if (bg1 && secretMechanism.doorOffsetY > 0) {
      const scaleX = bg1.naturalWidth / 960;
      const scaleY = bg1.naturalHeight / VIEW_H;

      ctx.save();
      if (bg2 && bg2.complete) {
        const scale2X = bg2.naturalWidth / 960;
        const scale2Y = bg2.naturalHeight / VIEW_H;

        ctx.save();
        ctx.translate(secretMechanism.doorX + secretMechanism.doorW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          bg2,
          0, secretMechanism.doorY * scale2Y,
          secretMechanism.doorW * scale2X, secretMechanism.doorH * scale2Y,
          0, secretMechanism.doorY,
          secretMechanism.doorW, secretMechanism.doorH
        );
        ctx.fillStyle = 'rgba(9, 8, 20, 0.45)';
        ctx.fillRect(0, secretMechanism.doorY, secretMechanism.doorW, secretMechanism.doorH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#11121a';
        ctx.fillRect(secretMechanism.doorX, secretMechanism.doorY, secretMechanism.doorW, secretMechanism.doorH);
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(secretMechanism.doorX, secretMechanism.doorY, secretMechanism.doorW, secretMechanism.doorH);
      ctx.clip();

      ctx.drawImage(
        bg1,
        secretMechanism.doorX * scaleX, secretMechanism.doorY * scaleY,
        secretMechanism.doorW * scaleX, secretMechanism.doorH * scaleY,
        secretMechanism.doorX, secretMechanism.doorY + secretMechanism.doorOffsetY,
        secretMechanism.doorW, secretMechanism.doorH
      );
      ctx.restore();
    }

// ========================================================
    // BINTANG-BINTANG EMAS (GLOWING STARS) MEJA KITAB (PAGE 1)
    // ========================================================
    if (!secretMechanism.isOpen) {
      const tx = secretMechanism.tomeX + secretMechanism.tomeW * 0.5;
      const ty = secretMechanism.tomeY + secretMechanism.tomeH * 0.5 - 8;
      const isNear = Math.abs((hero.x + hero.w * 0.5) - tx) < 80;
      const now = performance.now();

      ctx.save();

      // 1. KILAUAN AURA EMAS LEMBUT ATAS HELAIAN BUKU (TANPA GELUNG)
      const glowGrad = ctx.createRadialGradient(tx, ty, 1, tx, ty, 22);
      glowGrad.addColorStop(0, isNear ? 'rgba(254, 240, 138, 0.50)' : 'rgba(253, 224, 71, 0.30)');
      glowGrad.addColorStop(0.6, isNear ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.08)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(tx, ty, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. BINTANG-BINTANG EMAS (GLOWING PIXEL STARS ✨) TERAPUNG NAIK
      const starColors = ['#ffffff', '#fef08a', '#fde047', '#f59e0b'];

      for (let i = 0; i < 8; i++) {
        const seed = i * 1.618;
        const progress = ((now * 0.0012 * (isNear ? 1.4 : 1.0)) + seed) % 1;
        const starX = tx + Math.sin(seed * 7 + now * 0.003) * 18;
        const starY = ty - (progress * 42) - 2;

        const starSize = Math.sin(progress * Math.PI) * (i % 2 === 0 ? 3.5 : 2.5);
        const starAlpha = Math.sin(progress * Math.PI) * (isNear ? 1.0 : 0.85);

        if (starSize > 0.5) {
          ctx.save();
          ctx.globalAlpha = starAlpha;
          const col = starColors[i % starColors.length];

          // Lukis bintang 4-bucu pixel emas ✨
          ctx.fillStyle = col;
          ctx.fillRect(starX - starSize, starY - 0.5, starSize * 2, 1);
          ctx.fillRect(starX - 0.5, starY - starSize, 1, starSize * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(starX - 0.5, starY - starSize * 0.3, 1, starSize * 0.6);

          ctx.restore();
        }
      }

      ctx.restore();
    }

    // C. Power Orbs
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

    // D. Goblins
    const gobSheet = Loaded.get('goblin');
    goblins.forEach(g => {
      if (g.state === 'dead_poof') return;
      if (gobSheet) {
        const act = GOBLIN_CONFIG.actions[g.state] || GOBLIN_CONFIG.actions.idle;
        const cellW = gobSheet.naturalWidth / GOBLIN_CONFIG.cols;
        const cellH = gobSheet.naturalHeight / GOBLIN_CONFIG.rows;
        const sx = Math.floor((act.startCol + g.animFrame) * cellW);
        const sy = Math.floor(act.row * cellH);

        ctx.save();
        ctx.translate(Math.round(g.x + g.w * 0.5), Math.round(g.y + g.h));
        ctx.scale(g.facing, 1);
        ctx.drawImage(
          gobSheet,
          sx, sy, cellW, cellH,
          GOBLIN_CONFIG.offsetX, GOBLIN_CONFIG.offsetY, GOBLIN_CONFIG.renderSize, GOBLIN_CONFIG.renderSize
        );
        ctx.restore();
      }
    });

    // E. Puting Beliung (Page 2)
    const torSheet = Loaded.get('tornado');
    tornadoes.forEach(tor => {
      ctx.save();
      ctx.translate(Math.round(tor.x), tor.y);
      if (torSheet && torSheet.naturalWidth > 0) {
        const fW = torSheet.naturalWidth / 6;
        const fH = torSheet.naturalHeight;
        const renderH = 400;
        const renderW = Math.round(renderH * (fW / fH));
        ctx.drawImage(torSheet, tor.frame * fW, 0, fW, fH, -Math.round(renderW * 0.5), -renderH, renderW, renderH);
      }
      ctx.restore();
    });

    // F. Sambaran Kilat (Page 2)
    const lgtSheet = Loaded.get('lightning');
    lightningStrikes.forEach(lgt => {
      ctx.save();
      if (lgt.stage === 'warning') {
        const flash = Math.sin(performance.now() * 0.04) > 0;
        ctx.fillStyle = flash ? 'rgba(56, 189, 248, 0.85)' : 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(lgt.x - 30, 488, 60, 4);
      } else if (lgt.stage === 'strike') {
        if (lgtSheet && lgtSheet.naturalWidth > 0) {
          const fW = lgtSheet.naturalWidth / 5;
          const fH = lgtSheet.naturalHeight;
          const renderH = 600;
          const renderW = Math.round(renderH * (fW / fH));
          ctx.drawImage(lgtSheet, lgt.frame * fW, 0, fW, fH, Math.round(lgt.x - renderW * 0.5), 0, renderW, renderH);
        }
      }
      ctx.restore();
    });

    // G. Bos Storm Chimera (Page 2)
    const bossSheet = Loaded.get('boss3');
    if (boss.spawned && bossSheet) {
      const act = CHIMERA_CONFIG.actions[boss.state] || CHIMERA_CONFIG.actions.hover;
      const cellW = bossSheet.naturalWidth / CHIMERA_CONFIG.cols;
      const cellH = bossSheet.naturalHeight / CHIMERA_CONFIG.rows;
      const sx = Math.floor((act.startCol + boss.animFrame) * cellW);
      const sy = Math.floor(act.row * cellH);

      ctx.save();
      ctx.translate(Math.round(boss.x), Math.round(boss.y));
      ctx.scale(boss.facing, 1);
      ctx.rotate(boss.tiltAngle);

      ctx.drawImage(
        bossSheet,
        sx, sy, cellW, cellH,
        CHIMERA_CONFIG.offsetX, CHIMERA_CONFIG.offsetY,
        CHIMERA_CONFIG.renderSize, CHIMERA_CONFIG.renderSize
      );
      ctx.restore();
    }

    // H. Career Scroll (Terapung Tanpa Bayang Bulat Kuning)
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

    // I. Hero Ksatria
    const heroSheet = Loaded.get('hero');
    if (heroSheet) {
      // Kesan berkelip semasa kebal
      if (!(hero.invulnFrames > 0 && !hero.isRespawning && Math.floor(hero.invulnFrames / 4) % 2 === 1)) {
        const act = HERO_CONFIG.actions[hero.state] || HERO_CONFIG.actions.idle;
        const safeFrame = Math.min(hero.animFrame, (act.count || 1) - 1);
        const colsInRow = act.cols || 10;
        const cellW = act.cellW || Math.floor(heroSheet.naturalWidth / colsInRow);
        const cellH = Math.floor(heroSheet.naturalHeight / HERO_CONFIG.rows);
        const sx = act.customSx ? act.customSx[safeFrame] : Math.floor((act.startCol + safeFrame) * cellW);
        const sy = Math.floor(act.row * cellH);

        ctx.save();
        ctx.translate(Math.round(hero.x + hero.w * 0.5), Math.round(hero.y + hero.h));
        ctx.scale(hero.facing, 1);
        ctx.drawImage(
          heroSheet,
          sx, sy, cellW, cellH,
          HERO_CONFIG.offsetX, HERO_CONFIG.offsetY, HERO_CONFIG.renderSize, HERO_CONFIG.renderSize
        );
        ctx.restore();
      }
    }

    // J. Tiang Batu Lutsinar (Foreground Overlay)
    if (typeof pillars !== 'undefined' && Array.isArray(pillars)) {
      pillars.forEach(pil => {
        const isDoorOpened = secretMechanism.isOpen || secretMechanism.doorOffsetY > 10;
        const shouldDrawTransparent = isDoorOpened || (hero.x + hero.w > pil.x && hero.x < pil.x + pil.w);

        if (shouldDrawTransparent) {
          ctx.save();
          ctx.globalAlpha = (typeof pil.alpha === 'number') ? pil.alpha : 0.35;

          if (pil.page === 1 && bg1 && bg1.complete) {
            const scaleX = bg1.naturalWidth / 920;
            const scaleY = bg1.naturalHeight / VIEW_H;
            ctx.drawImage(
              bg1,
              pil.x * scaleX, pil.y * scaleY, pil.w * scaleX, pil.h * scaleY,
              pil.x, pil.y, pil.w, pil.h
            );
          } else if (pil.page === 2 && bg2 && bg2.complete) {
            const localX = pil.x - 960;
            const scaleX = bg2.naturalWidth / 960;
            const scaleY = bg2.naturalHeight / VIEW_H;
            ctx.drawImage(
              bg2,
              localX * scaleX, pil.y * scaleY, pil.w * scaleX, pil.h * scaleY,
              pil.x, pil.y, pil.w, pil.h
            );
          }
          ctx.restore();
        }
      });
    }

    // K. Pop-up Terapung
    floatingPopups.forEach(pop => {
      ctx.save();
      ctx.font = '7px "Press Start 2P"';
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = Math.max(0.1, pop.life / pop.maxLife);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    // L. Hamparan Garis Debug [G]
    if (showDebug) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.font = '7px "Press Start 2P"';

      if (camera.x < 500) {
        ladders.forEach((l, idx) => {
          ctx.strokeStyle = '#06b6d4';
          ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
          ctx.strokeRect(l.x, l.topY, l.w, l.bottomY - l.topY);
          ctx.fillRect(l.x, l.topY, l.w, l.bottomY - l.topY);
          ctx.fillStyle = '#22d3ee';
          ctx.fillText(`Ladder ${idx + 1}`, l.x - 10, l.topY - 8);
        });
      }

      platforms.forEach((p, idx) => {
        if (p.type === 'flat') {
          ctx.strokeStyle = '#22c55e';
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          ctx.strokeRect(p.x, p.y, p.w, p.h);
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
        } else if (p.type === 'wall' && p.y < 9000) {
          ctx.strokeStyle = '#ef4444';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = '#fca5a5';
          ctx.fillText(p.id, p.x - 20, p.y - 8);
        }
      });

      if (boss.spawned && boss.alive) {
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(boss.x - 50, boss.y - 50, 100, 100);
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(hero.x, hero.y, hero.w, hero.h);

      pillars.forEach(pil => {
        ctx.strokeStyle = '#c084fc';
        ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
        ctx.strokeRect(pil.x, pil.y, pil.w, pil.h);
        ctx.fillRect(pil.x, pil.y, pil.w, pil.h);
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
    const dt = Math.min((now - lastTime) / 1000, 0.1);
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