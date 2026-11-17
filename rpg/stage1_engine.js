(function () {
  'use strict';

  const isTouchDevice = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  let wakeLockSentinel = null;
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        if (wakeLockSentinel && !wakeLockSentinel.released) return;
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      } catch {}
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }
  });
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((evt) => {
    window.addEventListener(evt, () => requestWakeLock(), { once: true, passive: true });
  });

  // ===================================================================
  // 1. SMART ASSETS LOADER DENGAN SAFE TIMEOUT
  // ===================================================================
  const CANDIDATES = {
    hero: ["hero_azzumie_spritesheet.png"],
    goblin: ["goblin_spritesheet.png"],
    boss: ["boss1_spritesheet.png"],
    shockwave: ["boss_shockwave_spritesheet.png"],
    orbs: ["power_orbs_spritesheet.png"],
    scroll: ["career_scroll_spritesheet.png"],
    page1: ["stage1_bg_page1.jpg"],
    page2: ["stage1_bg_page2.jpg"]
  };

  const Loaded = {
    images: {},
    init(onComplete) {
      const keys = Object.keys(CANDIDATES);
      let count = 0;
      let completed = false;

      let fallbackTimer = null;
      const doneCheck = () => {
        if (!completed) {
          completed = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          onComplete();
        }
      };

      fallbackTimer = setTimeout(doneCheck, 4500);

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
    tracks: {
      stage: null,
      boss: null
    },

    setupTracks() {
      if (!this.tracks.stage) {
        this.tracks.stage = new Audio('stage1_bgm.mp3');
        this.tracks.stage.loop = true;
        this.tracks.stage.volume = 0.55;
        this.tracks.stage.preload = 'auto';
      }
      if (!this.tracks.boss) {
        this.tracks.boss = new Audio('boss_bgm.mp3');
        this.tracks.boss.loop = true;
        this.tracks.boss.volume = 0.65;
        this.tracks.boss.preload = 'auto';
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
        const p = targetTrack.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
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
    bossSlam() {
      this.playTone(80, 0.45, 'sawtooth', 25, 0.35);
      this.playTone(55, 0.50, 'square', 20, 0.30);
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

  document.getElementById('btnAudioToggle').addEventListener('click', () => AudioEngine.toggle());

  // ===================================================================
  // 3. CANVAS, CAMERA & PLATFORM
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

  const platforms = [
    { type: 'flat', x: 0,   y: 380, w: 480, h: 145 },
    { type: 'flat', x: 480, y: 380, w: 290, h: 145 },
    { type: 'ramp', x1: 770, y1: 380, x2: 860, y2: 350 },
    { type: 'flat', x: 860, y: 350, w: 150, h: 190 },
    { type: 'ramp', x1: 1010, y1: 350, x2: 1120, y2: 380 },
    { type: 'flat', x: 1120, y: 380, w: 100, h: 105 },
    { type: 'ramp', x1: 1220, y1: 380, x2: 1320, y2: 380 },
    { type: 'flat', x: 1320, y: 380, w: 320, h: 160 },
    { type: 'ramp', x1: 1650, y1: 380, x2: 1730, y2: 345 },
    { type: 'flat', x: 1730, y: 345, w: 190, h: 195 }
  ];

  // ===================================================================
  // 4. KONFIGURASI HERO, GOBLIN, BOS, ORB, SCROLL
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

  const BOSS_CONFIG = {
    rows: 4,
    cols: 6,
    renderSize: 200,
    offsetX: -100,
    offsetY: -190,
    actions: {
      idle:   { row: 0, startCol: 0, count: 4, fps: 6, loop: true },
      windup: { row: 1, startCol: 0, count: 4, fps: 7, loop: false },
      slam:   { row: 2, startCol: 0, count: 4, fps: 8, loop: false },
      defeat: { row: 3, startCol: 0, count: 6, fps: 6, loop: false }
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
  // 5. STATUS ENTITAS GAMEPLAY
  // ===================================================================
  const hero = {
    x: 80,
    y: 300, // Untuk Stage 1 & 2 laraskan mengikut aras lantai asal masing-masing
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
    { id: 1, x: 320,  y: 340, vx: 1.2, w: 42, h: 58, facing: 1,  minX: 180,  maxX: 440,  hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 2, x: 620,  y: 340, vx: 1.2, w: 42, h: 58, facing: -1, minX: 490,  maxX: 720,  hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true },
    { id: 3, x: 1200, y: 340, vx: 1.0, w: 42, h: 58, facing: 1,  minX: 1200, maxX: 1400, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, attackTimer: 0, hurtTimer: 0, alive: true }
  ];

  const orbs = [
    { id: 0, name: 'CRIMSON ORB', subtitle: 'Courage', x: 220,  y: 300, row: 0, color: '#ef4444', collected: false },
    { id: 1, name: 'AZURE ORB',   subtitle: 'Focus',   x: 520,  y: 300, row: 1, color: '#0ea5e9', collected: false },
    { id: 2, name: 'EMERALD ORB', subtitle: 'Growth',  x: 800,  y: 290, row: 2, color: '#10b981', collected: false },
    { id: 3, name: 'VIOLET ORB',  subtitle: 'Vision',  x: 1080, y: 300, row: 3, color: '#8b5cf6', collected: false },
    { id: 4, name: 'GOLDEN ORB',  subtitle: 'Mastery', x: 1320, y: 290, row: 4, color: '#f59e0b', collected: false }
  ];

  const boss = {
    spawned: false,
    alive: true,
    x: 1480,
    y: 205,
    w: 90,
    h: 140,
    facing: -1,
    hp: 400,
    maxHp: 400,
    state: 'idle',
    stateTimer: 90,
    animFrame: 0,
    animTimer: 0,
    actionLock: false
  };

  const careerScroll = {
    unlocked: false,
    x: 1760,
    y: 295,
    state: 'floating',
    frameIdx: 0,
    animTimer: 0,
    opened: false
  };

  let shockwaves = [];
  const floatingPopups = [];

  function addFloatingPopup(text, x, y, color = '#f59e0b') {
    floatingPopups.push({ text, x, y, color, life: 60, maxLife: 60 });
  }

  // ===================================================================
  // 6. INPUT CONTROLLER & GAME STATES
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
      modal.classList.remove('hidden');
      if (btn) btn.textContent = '▶️';
      AudioEngine.pauseBgm();
    } else {
      modal.classList.add('hidden');
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
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = true;
    if (e.code === 'Space' || e.code === 'KeyW' || e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp') {
      if (e.code === 'KeyW' || e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp') input.up = true;
      if (!input.jumpHeld) triggerJump();
    }
    if (e.code === 'KeyS' || e.key === 's' || e.key === 'S' || e.code === 'ArrowDown') input.down = true;
    if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'KeyZ') triggerAttack();
    if (e.code === 'KeyE') triggerInteract();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = false;
    if (e.code === 'Space' || e.code === 'KeyW' || e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp') {
      input.up = false;
      input.jumpHeld = false;
    }
    if (e.code === 'KeyS' || e.key === 's' || e.key === 'S' || e.code === 'ArrowDown') input.down = false;
  });

  function bindTouch(id, onDown, onUp) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const downHandler = (e) => {
      requestWakeLock();
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
  document.getElementById('btnQuitGame').addEventListener('click', executeQuit);
  document.getElementById('btnPauseQuit').addEventListener('click', executeQuit);

  const btnScrollZoom = document.getElementById('btnScrollZoom');
  if (btnScrollZoom) {
    btnScrollZoom.addEventListener('click', (e) => {
      e.preventDefault();
      const wrapper = document.querySelector('.scroll-frame-wrapper');
      const inner = document.querySelector('.scroll-inner-content');
      if (!wrapper || !inner) return;
      const zoomed = inner.classList.toggle('is-zoomed');
      wrapper.classList.toggle('is-zoomed', zoomed);
      btnScrollZoom.classList.toggle('is-active', zoomed);
      btnScrollZoom.setAttribute('aria-pressed', zoomed ? 'true' : 'false');
      btnScrollZoom.textContent = zoomed ? '🔍 ZOOM 1x' : '🔍 ZOOM 1.35x';
      if (zoomed) inner.scrollTop = 0;
    });
  }

  const btnFullscreenHud = document.getElementById('btnFullscreenHud');
  if (btnFullscreenHud) {
    btnFullscreenHud.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        let targetDoc = document;
        try {
          if (window.self !== window.top && window.top && window.top.document) targetDoc = window.top.document;
        } catch {}
        if (targetDoc.fullscreenElement || targetDoc.webkitFullscreenElement) {
          const exitFn = targetDoc.exitFullscreen || targetDoc.webkitExitFullscreen;
          if (exitFn) {
            const p = exitFn.call(targetDoc);
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }
        } else {
          const root = targetDoc.documentElement;
          const reqFn = root.requestFullscreen || root.webkitRequestFullscreen;
          if (reqFn) {
            const p = reqFn.call(root);
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }
        }
      } catch {}
    });
  }

  document.getElementById('btnPauseGame').addEventListener('click', () => setPause(!isGamePaused));
  document.getElementById('btnResumeGame').addEventListener('click', () => setPause(false));
  document.getElementById('btnRestartStage').addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('btnNextStage').addEventListener('click', () => {
    window.location.href = 'stage2.html';
  });

  document.getElementById('btnCloseScroll').addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('btnSkipToEnd').addEventListener('click', () => {
    if (confirm("Skip directly to the Career Epilogue & Credits?")) {
      window.location.href = 'credits.html';
    }
  });

  // ===================================================================
  // 7. SISTEM DAMAGE & LOGIK FIZIK KEMAS
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
        hero.y = 380 - hero.h;
      }
      hero.grounded = true;
      hero.vy = 0;

      AudioEngine.hit();
      camera.shakeFrames = 15;
      camera.shakeMag = 8;
      addFloatingPopup('FALLEN! RESPAWNING...', hero.x + 20, hero.y - 15, '#ef4444');

      // Beri masa 1.3 saat untuk ksatria jatuh tersungkur sebelum kembali ke titik mula
      setTimeout(() => {
        hero.x = 80;                     // Titik mula pentas (Stage 1 & 2)
        hero.y = 380;                    // Aras lantai pentas (sesuaikan jika Stage 1 paras lain)
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
    // Kunci kawalan hero sepenuhnya semasa fasa respawn
    if (hero.isRespawning) {
      hero.vx = 0;
      hero.vy = 0;
      hero.grounded = true;
      hero.state = 'defeat';

      // Jalankan pemasa animasi rebah supaya ksatria melutut dan terbaring
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

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.x += sw.vx;
      sw.timer += dt;
      if (sw.timer >= 1 / sw.fps) {
        sw.timer = 0;
        sw.frame++;
        if (sw.frame >= 6) {
          sw.alive = false;
        }
      }

      if (hero.invulnFrames <= 0 && Math.abs((hero.x + hero.w * 0.5) - sw.x) < 36 && Math.abs((hero.y + hero.h) - sw.y) < 40) {
        inflictDamage(22, sw.facing);
      }

      if (!sw.alive || sw.x < -100 || sw.x > WORLD_W + 100) {
        shockwaves.splice(i, 1);
      }
    }

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

    if (!hero.actionLock && hero.autoVictoryTimer <= 0) {
      if (input.left) {
        hero.vx = -hero.speed;
        hero.facing = -1;
      } else if (input.right) {
        hero.vx = hero.speed;
        hero.facing = 1;
      } else {
        hero.vx *= 0.78;
        if (Math.abs(hero.vx) < 0.1) hero.vx = 0;
      }

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
    hero.y += hero.vy;

    if (hero.x < 20) hero.x = 20;
    if (hero.x > WORLD_W - hero.w - 20) hero.x = WORLD_W - hero.w - 20;

    hero.grounded = false;
    const hMidX = hero.x + hero.w * 0.5;

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

    if (hero.y > VIEW_H + 50) {
      hero.x = 80;
      hero.y = 280;
      hero.vy = 0;
      inflictDamage(15, 1);
    }

    if (!hero.actionLock && hero.autoVictoryTimer <= 0) {
      if (!hero.grounded) {
        const airState = hero.vy < 0 ? 'jump' : 'fall';
        if (hero.state !== airState) {
          hero.state = airState;
          hero.animFrame = 0;
          hero.animTimer = 0;
        }
      } else if (Math.abs(hero.vx) > 0.2) {
        if (hero.state !== 'run') {
          hero.state = 'run';
          hero.animFrame = 0;
          hero.animTimer = 0;
        }
      } else {
        if (hero.state !== 'idle') {
          hero.state = 'idle';
          hero.animFrame = 0;
          hero.animTimer = 0;
        }
      }
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
        if (slashBox.x + slashBox.w > boss.x - 50 && slashBox.x < boss.x + 90 &&
            slashBox.y + slashBox.h > boss.y && slashBox.y < boss.y + boss.h + 20) {
          boss.hp = Math.max(0, boss.hp - 35);
          AudioEngine.hit();
          camera.shakeFrames = 8;
          camera.shakeMag = 4;
          addFloatingPopup('-35', boss.x, boss.y + 20, '#fde047');
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
            addFloatingPopup('CHAPTER I UNSEALED!', boss.x - 20, boss.y - 40, '#38bdf8');
          }
        }
      }
    }
    input.attackPressed = false;

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

    const orbsCount = orbs.filter(o => o.collected).length;
    if (orbsCount >= 5 && hero.x >= 1100 && !boss.spawned) {
      boss.spawned = true;
      boss.alive = true;
      boss.state = 'idle';
      boss.stateTimer = 80;
      AudioEngine.playBgm('boss');
      addFloatingPopup('⚠️ LEVIATHAN AWAKENS!', boss.x - 70, boss.y - 50, '#ef4444');
      updateHud();
    }

    if (boss.spawned && boss.alive) {
      boss.facing = (hero.x < boss.x) ? -1 : 1;
      const bAct = BOSS_CONFIG.actions[boss.state] || BOSS_CONFIG.actions.idle;
      boss.animTimer += dt;

      if (boss.animTimer >= 1 / bAct.fps) {
        boss.animTimer = 0;
        boss.animFrame++;

        if (boss.state === 'slam' && boss.animFrame === 3) {
          AudioEngine.bossSlam();
          camera.shakeFrames = 18;
          camera.shakeMag = 7;

          shockwaves.push({
            x: boss.x + (boss.facing === 1 ? 40 : -40),
            y: 380,
            vx: boss.facing * 5.5,
            facing: boss.facing,
            frame: 0,
            timer: 0,
            fps: 10,
            alive: true
          });

          if (Math.abs((hero.x + hero.w * 0.5) - boss.x) < 85 && Math.abs((hero.y + hero.h) - 380) < 50) {
            inflictDamage(26, boss.facing);
          }
        }

        if (boss.animFrame >= bAct.count) {
          if (bAct.loop) {
            boss.animFrame = 0;
          } else {
            boss.animFrame = actEndFix(boss);
          }
        }
      }

      if (boss.state === 'idle') {
        boss.stateTimer -= dt * 60;
        if (boss.stateTimer <= 0) {
          boss.state = 'windup';
          boss.animFrame = 0;
          boss.animTimer = 0;
          setTimeout(() => {
            if (boss.alive) {
              boss.state = 'slam';
              boss.animFrame = 0;
              boss.animTimer = 0;
            }
          }, 700);
        }
      }
    } else if (boss.spawned && !boss.alive && boss.state === 'defeat') {
      const bAct = BOSS_CONFIG.actions.defeat;
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

    if (careerScroll.unlocked && !careerScroll.opened && hero.autoVictoryTimer <= 0) {
      const dist = Math.hypot((hero.x + hero.w*0.5) - careerScroll.x, (hero.y + hero.h*0.5) - careerScroll.y);
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
        prompt.classList.add('hidden');
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
      }
    }
    input.interactPressed = false;

    camera.targetX = Math.max(0, Math.min(WORLD_W - VIEW_W, hero.x - VIEW_W * 0.42));
    camera.x += (camera.targetX - camera.x) * 0.08;
  }

  function actEndFix(b) {
    if (b.state === 'slam') {
      b.state = 'idle';
      b.animFrame = 0;
      b.stateTimer = 90;
      return 0;
    }
    return b.animFrame - 1;
  }

  // ========================================================
  // 8. UPDATE HUD
  // ========================================================
  function updateHud() {
    document.getElementById('heroHpFill').style.width = `${Math.max(0, hero.hp)}%`;
    document.getElementById('heroHpText').textContent = `${Math.ceil(hero.hp)} / 100`;

    const collected = orbs.filter(o => o.collected).length;
    document.getElementById('orbCountText').textContent = `${collected} / 5`;

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
    if (boss.spawned && boss.alive) {
      bossHud.classList.remove('hidden');
      document.getElementById('bossHpFill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
      document.getElementById('bossHpText').textContent = `${Math.ceil(boss.hp)} / 400`;
    } else {
      bossHud.classList.add('hidden');
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

    // A. Background Terhubung
    const bg1 = Loaded.get('page1');
    const bg2 = Loaded.get('page2');
    if (bg1) ctx.drawImage(bg1, 0, 0, 960, VIEW_H);
    if (bg2) ctx.drawImage(bg2, 960, 0, 960, VIEW_H);

    // B. 5 Power Orbs
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

    // D. Bos Leviathan
    const bossSheet = Loaded.get('boss');
    if (boss.spawned && boss.state !== 'gone' && bossSheet) {
      const act = BOSS_CONFIG.actions[boss.state] || BOSS_CONFIG.actions.idle;
      const cellW = bossSheet.naturalWidth / BOSS_CONFIG.cols;
      const cellH = bossSheet.naturalHeight / BOSS_CONFIG.rows;
      const sx = Math.floor((act.startCol + boss.animFrame) * cellW);
      const sy = Math.floor(act.row * cellH);

      ctx.save();
      ctx.translate(Math.round(boss.x), 380);
      ctx.scale(boss.facing, 1);
      ctx.drawImage(
        bossSheet,
        sx, sy, cellW, cellH,
        BOSS_CONFIG.offsetX, BOSS_CONFIG.offsetY, BOSS_CONFIG.renderSize, BOSS_CONFIG.renderSize
      );
      ctx.restore();
    }

    // E. Gelombang Api
    const shockSheet = Loaded.get('shockwave');
    if (shockSheet) {
      const sCellW = shockSheet.naturalWidth / 6;
      const sCellH = shockSheet.naturalHeight;
      const sRenderH = 95;
      const sAspect = sCellW / sCellH;
      const sRenderW = Math.round(sRenderH * sAspect);

      shockwaves.forEach(sw => {
        ctx.save();
        ctx.translate(Math.round(sw.x), sw.y);
        ctx.scale(sw.facing, 1);

        const glowGrad = ctx.createRadialGradient(0, -6, 2, 0, -6, 40);
        glowGrad.addColorStop(0, 'rgba(251, 146, 60, 0.5)');
        glowGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.2)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(0, -4, 45, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        const sSx = Math.floor(sw.frame * sCellW);
        ctx.drawImage(
          shockSheet,
          sSx, 0, sCellW, sCellH,
          -Math.round(sRenderW * 0.5), -sRenderH + 17, sRenderW, sRenderH
        );
        ctx.restore();
      });
    }

    // F. Career Scroll
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

    // G. Hero Ksatria
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

    // H. Tiang Foreground (Page 1)
    if (bg1 && bg1.complete && hero.x > 800 && hero.x < 1100) {
      ctx.save();
      ctx.globalAlpha = 0.9; 
      const scaleX = bg1.naturalWidth / 960;
      const scaleY = bg1.naturalHeight / 540;
      ctx.drawImage(bg1, 900 * scaleX, 120 * scaleY, 120 * scaleX, 360 * scaleY, 900, 120, 120, 360);
      ctx.restore();
    }

    // H2. Tiang Foreground (Page 2)
    if (bg2 && bg2.complete && hero.x > 800 && hero.x < 1100) {
      ctx.save();
      ctx.globalAlpha = 0.9; 
      const scale2X = bg2.naturalWidth / 960;
      const scale2Y = bg2.naturalHeight / 540;
      ctx.drawImage(bg2, 0, 120 * scale2Y, 60 * scale2X, 360 * scale2Y, 960, 120, 60, 360);
      ctx.restore();
    }

    // I. Pop-up Terapung
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
    if (ctx) {
      ctx.save();
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('REALM LOADING...', VIEW_W / 2, VIEW_H / 2 - 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('STAGE 1: THE SUNKEN RUINS', VIEW_W / 2, VIEW_H / 2 + 18);
      ctx.restore();
    }

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