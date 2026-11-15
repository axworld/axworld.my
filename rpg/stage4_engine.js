(function () {
  'use strict';

  const isTouchDevice = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // ===================================================================
  // 1. SMART ASSETS LOADER
  // ===================================================================
  const CANDIDATES = {
    hero: ["hero_azzumie_spritesheet.png"],
    goblin: ["goblin_spritesheet.png"],
    boss4: ["boss4_spritesheet.png"],
    boss4_atk: ["boss4_attacks_sprite.png"],
    orbs: ["power_orbs_spritesheet.png"],
    scroll: ["career_scroll_spritesheet.png"],
    page1: ["stage4_bg_page1.jpg"],
    page2: ["stage4_bg_page2.jpg"]
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

      setTimeout(doneCheck, 1500);

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
      try {
        if (!this.tracks.stage) {
          this.tracks.stage = new Audio('stage4_bgm.mp3');
          this.tracks.stage.loop = true;
          this.tracks.stage.volume = 0.55;
        }
        if (!this.tracks.boss) {
          this.tracks.boss = new Audio('boss_bgm.mp3');
          this.tracks.boss.loop = true;
          this.tracks.boss.volume = 0.65;
        }
      } catch (e) {}
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
        try { otherTrack.pause(); otherTrack.currentTime = 0; } catch (e) {}
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
    sandBurst() { this.playTone(120, 0.65, 'sawtooth', 30, 0.35); },
    obeliskCrash() { this.playTone(85, 0.5, 'square', 25, 0.35); },
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
  // 3. CANVAS, CAMERA, PLATFORMS & SOLID WALLS
  // ===================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const VIEW_W = 960;
  const VIEW_H = 540;
  const WORLD_W = 960;
  const WORLD_H = 1080;
  const GRAVITY = 0.52;

  const camera = { x: 0, y: 0, targetX: 0, targetY: 0, shakeFrames: 0, shakeMag: 0 };
  let isGamePaused = false;

  const platforms = [
    // --- PAGE 1: ATAS (Y: 0 -> 540) ---
    { id: 'p1_sand_floor', type: 'flat', x: 0, y: 470, w: 180, h: 40 },
    { id: 'p1_temple_terrace', type: 'flat', x: 640, y: 280, w: 320, h: 40 },
    { id: 'p1_stone_stairs', type: 'ramp', x1: 440, y1: 410, x2: 640, y2: 280 },
    { id: 'p1_upper_wooden_deck', type: 'flat', x: 90, y: 260, w: 480, h: 18 },
    { id: 'p1_lower_wooden_deck', type: 'flat', x: 250, y: 410, w: 190, h: 18 },
    { id: 'p1_lower_deck_step', type: 'ramp', x1: 180, y1: 470, x2: 250, y2: 410 },
    { id: 'p1_stone_arch_top', type: 'flat', x: 390, y: 140, w: 280, h: 22 },

    // --- PAGE 2: MAKAM ANUBIS (Y: 540 -> 1080) ---
    { id: 'p2_tomb_base_floor', type: 'flat', x: 0, y: 990, w: 80, h: 108 },
    { id: 'p2_sand_slope_up', type: 'ramp', x1: 60, y1: 990, x2: 250, y2: 890 },
    { id: 'p2_sand_slope_down', type: 'ramp', x1: 250, y1: 890, x2: 325, y2: 960 },
    { id: 'p2_tomb_steps', type: 'flat', x: 300, y: 960, w: 80, h: 108 },
    { id: 'p2_hieroglyph_deck', type: 'flat', x: 385, y: 920, w: 125, h: 168 },
    { id: 'p2_wooden_bridge', type: 'flat', x: 510, y: 920, w: 130, h: 22 },
    { id: 'p2_floating_shelf', type: 'flat', x: 450, y: 830, w: 95, h: 20 },
    { id: 'p2_sanctum_floor', type: 'flat', x: 640, y: 920, w: 320, h: 168 }
  ];

  const solidWalls = [
    { id: 'w_deck_left_pillar', x: 390, y: 930, w: 20, h: 160 }
  ];

  const quicksandZone = {
    x: 80,
    y: 470,
    w: 70,
    h: 30,
    isSinking: false,
    sinkTimer: 0
  };

  // ===================================================================
  // 4. KONFIGURASI SPRITE
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
      defeat:  { row: 4, count: 4, fps: 5, loop: false, customSx: [728, 862, 980, 1134], cellW: 128 }
    }
  };

  const GOBLIN_CONFIG = {
    rows: 4, cols: 6, renderSize: 92, offsetX: -46, offsetY: -80,
    actions: {
      idle:   { row: 0, startCol: 0, count: 4, fps: 6,  loop: true },
      walk:   { row: 1, startCol: 0, count: 6, fps: 10, loop: true },
      attack: { row: 2, startCol: 0, count: 4, fps: 10, loop: false },
      death:  { row: 3, startCol: 0, count: 6, fps: 8,  loop: false }
    }
  };

  const ANUBIS_CONFIG = {
    rows: 4, cols: 7, renderSize: 190, offsetX: -95, offsetY: -130,
    actions: {
      idle:    { row: 0, startCol: 0, count: 7, fps: 6,  loop: true },
      walk:    { row: 1, startCol: 0, count: 3, fps: 9,  loop: true },
      slash:   { row: 1, startCol: 0, count: 7, fps: 14, loop: false },
      cast:    { row: 2, startCol: 0, count: 7, fps: 10, loop: false },
      defeat:  { row: 3, startCol: 0, count: 6, fps: 6,  loop: false }
    }
  };

  const ATTACK_VFX_CONFIG = {
    rows: 3, cols: 6, renderSize: 140,
    actions: {
      crescent: { row: 0, count: 6, fps: 12 },
      vortex:   { row: 1, count: 6, fps: 14 },
      obelisk:  { row: 2, count: 6, fps: 10 }
    }
  };

  const SCROLL_CONFIG = {
    cols: 8, rows: 1, renderH: 110,
    actions: {
      floating:  { frames: [0, 1], fps: 3, loop: true },
      unsealing: { frames: [2, 3, 4, 5], fps: 6, loop: false },
      opened:    { frames: [4, 5], fps: 4, loop: true }
    }
  };

  // ===================================================================
  // 5. STATUS ENTITI PERMAINAN
  // ===================================================================
  const hero = {
    x: 840,
    y: 190,
    w: 48,
    h: 76,
    vx: 0,
    vy: 0,
    speed: 4.5,
    facing: -1,
    hp: 100,
    grounded: false,
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
    { id: 1, x: 740, y: 222, vx: 1.1, w: 42, h: 58, facing: -1, minX: 660, maxX: 880, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 2, x: 340, y: 202, vx: 1.0, w: 42, h: 58, facing: -1, minX: 120, maxX: 460, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 3, x: 320, y: 352, vx: 1.0, w: 42, h: 58, facing: 1,  minX: 255, maxX: 398, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 4, x: 440, y: 862, vx: 1.2, w: 42, h: 58, facing: 1,  minX: 400, maxX: 500, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 5, x: 580, y: 862, vx: 1.2, w: 42, h: 58, facing: -1, minX: 540, maxX: 700, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true }
  ];

  const orbs = [
    { id: 0, name: 'CRIMSON ORB', x: 550, y: 80,  row: 0, color: '#ef4444', collected: false },
    { id: 1, name: 'AZURE ORB',   x: 300, y: 360, row: 1, color: '#0ea5e9', collected: false },
    { id: 2, name: 'EMERALD ORB', x: 150, y: 200, row: 2, color: '#10b981', collected: false },
    { id: 3, name: 'VIOLET ORB',  x: 490, y: 770, row: 3, color: '#8b5cf6', collected: false },
    { id: 4, name: 'GOLDEN ORB',  x: 860, y: 700, row: 4, color: '#f59e0b', collected: false }
  ];

  const boss = {
    spawned: false,
    alive: true,
    x: 840,
    y: 860,
    w: 96,
    h: 140,
    facing: -1,
    hp: 450,
    maxHp: 450,
    state: 'idle',
    stateTimer: 80,
    animFrame: 0,
    animTimer: 0
  };

  const careerScroll = {
    unlocked: false,
    x: 860,
    y: 860,
    state: 'floating',
    frameIdx: 0,
    animTimer: 0,
    opened: false
  };

  const bossAttacks = [];
  const floatingPopups = [];

  function addFloatingPopup(text, x, y, color = '#f59e0b') {
    floatingPopups.push({ text, x, y, color, life: 60, maxLife: 60 });
  }

  // ===================================================================
  // 6. INPUT HANDLER (BEBAS KEKUNCI G)
  // ===================================================================
  const input = {
    left: false, right: false, up: false, down: false,
    jumpPressed: false, jumpHeld: false, attackPressed: false, interactPressed: false
  };

  function triggerJump() {
    if (quicksandZone.isSinking) return;
    AudioEngine.init();
    input.jumpPressed = true;
    input.jumpHeld = true;
    hero.jumpBuffer = 8;
  }

  function triggerAttack() {
    if (quicksandZone.isSinking) return;
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
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') input.up = true;
      if (!input.jumpHeld) triggerJump();
    }
    if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'KeyZ' || e.key === 'j' || e.key === 'k' || e.key === 'z') triggerAttack();
    if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') input.down = true;
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') triggerInteract();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = false;
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') { input.up = false; input.jumpHeld = false; }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') input.down = false;
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
  bindTouch('btnUp', () => { if (!isGamePaused && hero.autoVictoryTimer <= 0 && !hero.isRespawning) { input.up = true; triggerJump(); } }, () => { input.up = false; input.jumpHeld = false; });
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
  if (btnNextStg) btnNextStg.addEventListener('click', () => window.location.href = 'stage5.html');
  const btnCloseScr = document.getElementById('btnCloseScroll');
  if (btnCloseScr) btnCloseScr.addEventListener('click', () => window.location.reload());
  const btnSkipEnd = document.getElementById('btnSkipToEnd');
  if (btnSkipEnd) btnSkipEnd.addEventListener('click', () => {
    if (confirm("Skip directly to the Career Epilogue & Credits?")) {
      window.location.href = 'credits.html';
    }
  });

  // ===================================================================
  // 7. DAMAGE & SISTEM FIZIK UTAMA
  // ===================================================================
  function inflictDamage(amount, dir) {
    if (hero.invulnFrames > 0 || hero.autoVictoryTimer > 0 || hero.isRespawning) return;

    hero.hp = Math.max(0, hero.hp - amount);
    updateHud();

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
      const isUpper = hero.y < 540;
      const heroCenterX = hero.x + hero.w * 0.5;
      const heroFoot = hero.y + hero.h;
      for (const p of platforms) {
        if (p.type === 'flat') {
          if (isUpper && p.y >= 540) continue;
          if (!isUpper && p.y < 540) continue;
          if (heroCenterX >= p.x && heroCenterX <= p.x + p.w) {
            const dy = p.y - heroFoot;
            if (dy >= -50 && dy < minDy) {
              minDy = dy;
              candidatePlatY = p.y;
            }
          }
        } else if (p.type === 'ramp') {
          if (isUpper && Math.max(p.y1, p.y2) >= 540) continue;
          if (!isUpper && Math.min(p.y1, p.y2) < 540) continue;
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
        hero.y = (isUpper ? 470 : 920) - hero.h;
      }
      hero.grounded = true;
      hero.vy = 0;

      AudioEngine.hit();
      camera.shakeFrames = 15;
      camera.shakeMag = 8;
      addFloatingPopup('FALLEN! RESPAWNING...', hero.x + 20, hero.y - 15, '#ef4444');

      setTimeout(() => {
        if (hero.y < 540) {
          hero.x = 840;
          hero.y = 190;
          hero.facing = -1;
        } else {
          hero.x = 200;
          hero.y = 830;
          hero.facing = 1;
        }
        hero.vx = 0;
        hero.vy = 0;
        hero.hp = 100;
        hero.state = 'idle';
        hero.actionLock = false;
        hero.isRespawning = false;
        hero.autoVictoryTimer = 0;
        hero.invulnFrames = 60;

        updateHud();
        addFloatingPopup('REVIVED!', hero.x + 20, hero.y - 15, '#38bdf8');
      }, 1300);

      return;
    }

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
    if (hero.isRespawning) {
      hero.vx = 0;
      hero.vy = 0;
      hero.grounded = true;
      hero.state = 'defeat';
      const dAct = HERO_CONFIG.actions.defeat;
      hero.animTimer += dt;
      if (hero.animTimer >= 1 / dAct.fps) {
        hero.animTimer = 0;
        if (hero.animFrame < dAct.count - 1) hero.animFrame++;
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

    // A. Kemenangan Hero
    if (hero.autoVictoryTimer > 0) {
      hero.autoVictoryTimer -= dt;
      hero.vx = 0;
      hero.state = 'victory';
      if (hero.autoVictoryTimer <= 0) {
        hero.autoVictoryTimer = 0;
        hero.actionLock = false;
        hero.state = 'idle';
        hero.animFrame = 0;
      }
    }

    // B. Pasir Jerlus
    const hMidX = hero.x + hero.w * 0.5;
    if (hero.y < 540 && Math.abs(hMidX - quicksandZone.x) < 32 && hero.y + hero.h >= quicksandZone.y && !quicksandZone.isSinking) {
      quicksandZone.isSinking = true;
      quicksandZone.sinkTimer = 0;
      hero.actionLock = true;
      hero.vx = 0;
      hero.vy = 0;
      AudioEngine.sandBurst();
      camera.shakeFrames = 35;
      camera.shakeMag = 6;
      addFloatingPopup('⚠️ QUICKSAND COLLAPSE!', quicksandZone.x, quicksandZone.y - 20, '#f59e0b');
    }

    if (quicksandZone.isSinking) {
      quicksandZone.sinkTimer += dt;
      hero.y += 1.8;

      if (quicksandZone.sinkTimer >= 1.2) {
        quicksandZone.isSinking = false;
        hero.x = 210;
        hero.y = 570;
        hero.vy = 4.0;
        hero.facing = 1;
        hero.actionLock = false;

        camera.targetY = 540;
        camera.y = 540;
        camera.shakeFrames = 25;
        camera.shakeMag = 6;
        AudioEngine.sandBurst();
        addFloatingPopup('INTO THE TOMB VAULT!', 210, 750, '#38bdf8');
        updateHud();
      }
      return;
    }

    // C. Kawalan Gerakan Hero
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

    if (hero.x < 15) hero.x = 15;
    if (hero.x > WORLD_W - hero.w - 15) hero.x = WORLD_W - hero.w - 15;

    // Dinding Halangan
    for (const w of solidWalls) {
      if (
        hero.x + hero.w > w.x &&
        hero.x < w.x + w.w &&
        hero.y + hero.h > w.y + 4 &&
        hero.y < w.y + w.h
      ) {
        if (hero.vx > 0) hero.x = w.x - hero.w;
        else if (hero.vx < 0) hero.x = w.x + w.w;
        hero.vx = 0;
      }
    }

    // Pendaratan Platform
    hero.y += hero.vy;
    hero.grounded = false;

    for (const p of platforms) {
      if (p.type === 'flat') {
        if (hero.x + hero.w > p.x && hero.x < p.x + p.w && hero.vy >= 0) {
          if (prevFoot <= p.y + 18 && hero.y + hero.h >= p.y) {
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
          if (prevFoot <= targetY + 24 && hero.y + hero.h >= targetY - 8) {
            hero.y = targetY - hero.h;
            hero.vy = 0;
            hero.grounded = true;
            break;
          }
        }
      }
    }

    // Status Animasi Hero
    if (!hero.actionLock && hero.autoVictoryTimer <= 0) {
      if (!hero.grounded) hero.state = hero.vy < 0 ? 'jump' : 'fall';
      else if (Math.abs(hero.vx) > 0.2) hero.state = 'run';
      else hero.state = 'idle';
    }

    if (hero.prevState !== hero.state) {
      hero.animFrame = 0;
      hero.animTimer = 0;
      hero.prevState = hero.state;
    }

    const hAct = HERO_CONFIG.actions[hero.state] || HERO_CONFIG.actions.idle;
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
    if (hero.animFrame >= hAct.count) hero.animFrame = hAct.count - 1;

    // Tetakan Pedang Hero
    if (input.attackPressed && !hero.actionLock && hero.autoVictoryTimer <= 0) {
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
        if (slashBox.x + slashBox.w > boss.x - 60 && slashBox.x < boss.x + boss.w + 30 &&
            slashBox.y + slashBox.h > boss.y - 140 && slashBox.y < boss.y + 40) {
          boss.hp = Math.max(0, boss.hp - 35);
          AudioEngine.hit();
          camera.shakeFrames = 8;
          camera.shakeMag = 4;
          addFloatingPopup('-35', boss.x, boss.y - 100, '#fbbf24');
          updateHud();

          if (boss.hp <= 0) {
            boss.alive = false;
            boss.state = 'defeat';
            boss.animFrame = 0;
            boss.animTimer = 0;
            AudioEngine.playBgm('stage');
            AudioEngine.victory();
            updateHud();

            hero.autoVictoryTimer = 2.5;
            hero.actionLock = true;
            hero.state = 'victory';
            hero.animFrame = 0;

            careerScroll.unlocked = true;
            addFloatingPopup('CHAPTER IV UNSEALED!', careerScroll.x, careerScroll.y - 40, '#38bdf8');
          }
        }
      }
    }
    input.attackPressed = false;

    // Kutip Orbs
    for (const orb of orbs) {
      if (!orb.collected) {
        const hx = hero.x + hero.w * 0.5;
        const hy = hero.y + hero.h * 0.5;
        if (Math.abs(hx - orb.x) < 45 && (hy - orb.y > -50 && hy - orb.y < 85)) {
          orb.collected = true;
          AudioEngine.orb();
          addFloatingPopup(`+${orb.name}`, orb.x - 10, orb.y - 20, orb.color);
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
            if (g.animFrame >= gAct.count) g.state = 'dead_poof';
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

    // Kebangkitan Anubis
    const orbsCollected = orbs.filter(o => o.collected).length;
    if (orbsCollected >= 5 && hero.y >= 540 && hero.x > 500 && !boss.spawned) {
      boss.spawned = true;
      boss.alive = true;
      boss.state = 'idle';
      boss.stateTimer = 70;
      AudioEngine.playBgm('boss');
      addFloatingPopup('🐺 ANUBIS HAS AWAKENED!', boss.x - 40, boss.y - 120, '#fbbf24');
      updateHud();
    }

    // AI Bos Anubis
    if (boss.spawned) {
      if (!boss.alive) {
        if (boss.state === 'defeat') {
          const bAct = ANUBIS_CONFIG.actions.defeat;
          boss.animTimer += dt;
          if (boss.animTimer >= 1 / bAct.fps) {
            boss.animTimer = 0;
            if (boss.animFrame < bAct.count - 1) {
              boss.animFrame++;
            }
          }
        }
      } else {
        const distToHero = Math.abs(hero.x - boss.x);
        if (boss.state !== 'slash') {
          boss.facing = (hero.x < boss.x) ? -1 : 1;
        }

        const bAct = ANUBIS_CONFIG.actions[boss.state] || ANUBIS_CONFIG.actions.idle;
        boss.animTimer += dt;

        if (boss.state === 'walk') {
          boss.x += boss.facing * 1.8;
          boss.stateTimer -= dt * 60;
          if (distToHero < 115 || boss.stateTimer <= 0) {
            const rand = Math.random();
            boss.state = (rand < 0.55) ? 'slash' : 'cast';
            boss.animFrame = 0;
            boss.animTimer = 0;
          }
        } else if (boss.state === 'slash') {
          boss.x += boss.facing * 2.6;
        } else if (boss.state === 'idle') {
          boss.stateTimer -= dt * 60;
          if (boss.stateTimer <= 0) {
            boss.state = 'walk';
            boss.stateTimer = 80 + Math.random() * 40;
            boss.animFrame = 0;
            boss.animTimer = 0;
          }
        }

        boss.x = Math.max(480, Math.min(890, boss.x));

        if (boss.animTimer >= 1 / bAct.fps) {
          boss.animTimer = 0;
          boss.animFrame++;

          if (boss.state === 'slash' && boss.animFrame === 4) {
            bossAttacks.push({
              type: 'crescent',
              x: boss.x + (boss.facing === 1 ? 50 : -50),
              y: boss.y - 45,
              vx: boss.facing * 5.8,
              frame: 0,
              animTimer: 0,
              life: 80
            });
            AudioEngine.slash();
          } else if (boss.state === 'cast' && boss.animFrame === 4) {
            const rand = Math.random();
            if (rand > 0.45) {
              bossAttacks.push({
                type: 'vortex',
                x: hero.x + hero.w * 0.5,
                y: 950,
                vx: 0,
                frame: 0,
                animTimer: 0,
                life: 90
              });
              AudioEngine.sandBurst();
            } else {
              bossAttacks.push({
                type: 'obelisk',
                x: hero.x + (Math.random() - 0.5) * 60,
                y: 580,
                targetY: 912,
                vy: 7.5,
                frame: 0,
                animTimer: 0,
                life: 60
              });
              AudioEngine.obeliskCrash();
              camera.shakeFrames = 18;
              camera.shakeMag = 6;
            }
          }

          if (boss.animFrame >= bAct.count) {
            if (bAct.loop) {
              boss.animFrame = 0;
            } else {
              boss.state = 'idle';
              boss.animFrame = 0;
              boss.stateTimer = 35 + Math.random() * 25;
            }
          }
        }

        if (hero.invulnFrames <= 0 && Math.hypot((hero.x + hero.w * 0.5) - boss.x, hero.y - (boss.y - 50)) < 55) {
          inflictDamage(14, boss.facing);
        }
      }
    }

    // VFX Serangan Anubis
    for (let i = bossAttacks.length - 1; i >= 0; i--) {
      const atk = bossAttacks[i];
      atk.animTimer += dt;
      if (atk.animTimer >= 0.08) {
        atk.animTimer = 0;
        atk.frame = (atk.frame + 1) % 6;
      }

      if (atk.type === 'crescent') {
        atk.x += atk.vx;
      } else if (atk.type === 'obelisk') {
        atk.y += atk.vy;
        const groundLimit = atk.targetY || 912;
        if (atk.y >= groundLimit) {
          atk.y = groundLimit;
          atk.vy = 0;
          atk.frame = Math.min(5, atk.frame + 1);
        }
      }

      atk.life--;

      const heroLeft = hero.x;
      const heroRight = hero.x + hero.w;
      const heroTop = hero.y;
      const heroBottom = hero.y + hero.h;

      let hasHitHero = false;

      if (atk.type === 'crescent') {
        const atkLeft = atk.x - 25;
        const atkRight = atk.x + 25;
        const atkTop = atk.y - 30;
        const atkBottom = atk.y + 30;

        if (heroRight > atkLeft && heroLeft < atkRight && heroBottom > atkTop && heroTop < atkBottom) {
          hasHitHero = true;
          atk.life = 0;
        }
      } else if (atk.type === 'vortex') {
        const distDistX = Math.abs((hero.x + hero.w * 0.5) - atk.x);
        if (distDistX < 45 && heroBottom >= atk.y - 140 && heroTop <= atk.y + 10) {
          hasHitHero = true;
        }
      } else if (atk.type === 'obelisk') {
        const distDistX = Math.abs((hero.x + hero.w * 0.5) - atk.x);
        if (distDistX < 32 && heroBottom >= atk.y - 50 && heroTop <= atk.y + 30) {
          hasHitHero = true;
        }
      }

      if (hasHitHero && hero.invulnFrames <= 0) {
        inflictDamage(18, atk.vx ? (atk.vx > 0 ? 1 : -1) : boss.facing);
      }

      if (atk.life <= 0) bossAttacks.splice(i, 1);
    }

    // Interaksi Skrol Kerjaya (Pillar 7: Strict [E] Interaction, No Auto-Opening)
    if (careerScroll.unlocked && !careerScroll.opened && hero.autoVictoryTimer <= 0) {
      const dist = Math.hypot((hero.x + hero.w*0.5) - careerScroll.x, (hero.y + hero.h*0.5) - careerScroll.y);
      const prompt = document.getElementById('interactPrompt');

      if (dist < 85) {
        if (prompt) {
          const promptInner = document.getElementById('interactPromptText') || prompt.querySelector('div') || prompt;
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
            const modal = document.getElementById('scrollModal');
            if (modal) {
              modal.style.setProperty('display', 'flex', 'important');
              modal.classList.remove('hidden');
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

    // Kamera Lerp Menegak
    camera.targetY = hero.y < 540 ? 0 : 540;
    camera.y += (camera.targetY - camera.y) * 0.08;
  }

  // ===================================================================
  // 8. UPDATE HUD
  // ===================================================================
  function updateHud() {
    const hpFill = document.getElementById('heroHpFill');
    if (hpFill) hpFill.style.width = `${Math.max(0, hero.hp)}%`;
    const hpTxt = document.getElementById('heroHpText');
    if (hpTxt) hpTxt.textContent = `${Math.ceil(hero.hp)}/100`;

    const count = orbs.filter(o => o.collected).length;
    const orbTxt = document.getElementById('orbCountText');
    if (orbTxt) orbTxt.textContent = `${count} / 5`;

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
        if (bTxt) bTxt.textContent = `${Math.ceil(boss.hp)} / 450`;
      } else {
        bossHud.classList.add('hidden');
      }
    }
  }

  // ===================================================================
  // 9. RENDER LOOP (BERSIH DARI PANDUAN GUIDE G)
  // ===================================================================
  function render() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    let sx = 0, sy = 0;
    if (camera.shakeFrames > 0 && !isGamePaused) {
      sx = (Math.random() - 0.5) * camera.shakeMag * 2;
      sy = (Math.random() - 0.5) * camera.shakeMag * 2;
    }

    ctx.translate(sx, -Math.round(camera.y + sy));

    const bg1 = Loaded.get('page1');
    const bg2 = Loaded.get('page2');
    
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 0, VIEW_W, 540);
    if (bg1) ctx.drawImage(bg1, 0, 0, VIEW_W, 540);

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 540, VIEW_W, 540);
    if (bg2) ctx.drawImage(bg2, 0, 540, VIEW_W, 540);

    // Partikel Pasir
    if (quicksandZone.isSinking) {
      const now = performance.now();
      const sandColors = ['#f59e0b', '#fde047', '#d97706', '#fef08a'];
      for (let i = 0; i < 14; i++) {
        const seed = i * 1.73;
        const progress = ((now * 0.002) + seed) % 1;
        const px = hero.x + 24 + Math.sin(seed * 7 + now * 0.005) * 28;
        const py = quicksandZone.y - (progress * 38) + 8;
        const pSize = Math.sin(progress * Math.PI) * 4;

        ctx.save();
        ctx.fillStyle = sandColors[i % sandColors.length];
        ctx.fillRect(px - pSize * 0.5, py - pSize * 0.5, pSize, pSize);
        ctx.restore();
      }
    }

    // Power Orbs
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

    // Goblins
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

    // VFX Serangan Anubis
    const atkSheet = Loaded.get('boss4_atk');
    bossAttacks.forEach(atk => {
      ctx.save();
      ctx.translate(Math.round(atk.x), Math.round(atk.y));
      if (atk.vx < 0) ctx.scale(-1, 1);

      if (atkSheet && atkSheet.naturalWidth > 0) {
        const act = ATTACK_VFX_CONFIG.actions[atk.type] || ATTACK_VFX_CONFIG.actions.crescent;
        const cellW = atkSheet.naturalWidth / ATTACK_VFX_CONFIG.cols;
        const cellH = atkSheet.naturalHeight / ATTACK_VFX_CONFIG.rows;
        const sx = Math.floor(atk.frame * cellW);
        const sy = Math.floor(act.row * cellH);

        if (atk.type === 'vortex') {
          const vWidth = 120;
          const vHeight = 160;
          ctx.drawImage(
            atkSheet,
            sx, sy, cellW, cellH,
            -vWidth * 0.5, -vHeight + 15, vWidth, vHeight
          );
        } else {
          ctx.drawImage(
            atkSheet,
            sx, sy, cellW, cellH,
            -50, -50, ATTACK_VFX_CONFIG.renderSize, ATTACK_VFX_CONFIG.renderSize
          );
        }
      }
      ctx.restore();
    });

    // Bos Anubis
    const bossSheet = Loaded.get('boss4');
    if (boss.spawned && bossSheet) {
      const act = ANUBIS_CONFIG.actions[boss.state] || ANUBIS_CONFIG.actions.idle;
      const cellW = bossSheet.naturalWidth / ANUBIS_CONFIG.cols;
      const cellH = bossSheet.naturalHeight / ANUBIS_CONFIG.rows;
      const sx = Math.floor((act.startCol + boss.animFrame) * cellW);
      const sy = Math.floor(act.row * cellH);

      ctx.save();
      ctx.translate(Math.round(boss.x), Math.round(boss.y));
      ctx.scale(boss.facing, 1);
      ctx.drawImage(
        bossSheet,
        sx, sy, cellW, cellH,
        ANUBIS_CONFIG.offsetX, ANUBIS_CONFIG.offsetY, ANUBIS_CONFIG.renderSize, ANUBIS_CONFIG.renderSize
      );
      ctx.restore();
    }

    // Skrol Kerjaya
    const scrollSheet = Loaded.get('scroll');
    if (careerScroll.unlocked && scrollSheet) {
      const sx = careerScroll.x;
      const bob = (careerScroll.opened) ? 0 : Math.sin(performance.now() * 0.004) * 6;
      const sy = careerScroll.y + bob;

      const scAct = SCROLL_CONFIG.actions[careerScroll.state];
      const targetFrame = scAct ? scAct.frames[careerScroll.frameIdx] : 0;
      const cellW = scrollSheet.naturalWidth / SCROLL_CONFIG.cols;
      const cellH = scrollSheet.naturalHeight / SCROLL_CONFIG.rows;
      const aspect = cellW / cellH;
      const renderH = SCROLL_CONFIG.renderH;
      const renderW = Math.round(renderH * aspect);

      ctx.drawImage(
        scrollSheet,
        targetFrame * cellW, 0, cellW, cellH,
        Math.round(sx - renderW * 0.5), Math.round(sy - renderH * 0.5), renderW, renderH
      );
    }

    // Hero Azzumie
    const heroSheet = Loaded.get('hero');
    if (heroSheet) {
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

    // Pop-up Terapung
    floatingPopups.forEach(pop => {
      ctx.save();
      ctx.font = '7px "Press Start 2P"';
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = Math.max(0.1, pop.life / pop.maxLife);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    ctx.restore();
  }

  function renderPortrait() {
    const c = document.getElementById('portraitCanvas');
    if (!c) return;
    const pctx = c.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, 32, 32);

    const sheet = Loaded.get('hero');
    if (sheet) {
      const cW = sheet.naturalWidth / 10;
      const cH = sheet.naturalHeight / 5;
      pctx.drawImage(sheet, cW * 0.28, cH * 0.04, cW * 0.52, cH * 0.52, 0, 0, 32, 32);
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