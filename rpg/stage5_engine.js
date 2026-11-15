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
  // 1. ASSETS LOADER (STAGE 5 COMPLETE ROSTER)
  // ===================================================================
  const CANDIDATES = {
    hero: ["hero_azzumie_spritesheet.png"],
    goblin: ["goblin_spritesheet.png"],
    orbs: ["power_orbs_spritesheet.png"],
    scroll: ["career_scroll_spritesheet.png"],
    drawbridge: ["drawbridge_plank.png"],
    bg1: ["stage5_bg_page1.jpg"],
    bg2: ["stage5_bg_page2.jpg"],
    bg3: ["stage5_bg_page3.jpg"],
    bg4: ["stage5_bg_page4.jpg"],
    bg5: ["stage5_bg_page5.jpg"],
    bg6: ["stage5_bg_page6.jpg"],
    mb1: ["stage5_miniboss1_malboro.png"],
    mb2: ["stage5_miniboss2_gargoyle.png"],
    mb3: ["stage5_miniboss3_templar.png"],
    boss: ["stage5_finalboss_diablos.png"],
    boss_atk: ["diablos_attacks_sprite.png"]
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
  // 2. RETRO AUDIO SYNTHESIZER ENGINE (MULTI-TRACK BGM MANAGER)
  // ===================================================================
  const AudioEngine = {
    ctx: null,
    muted: false,
    mode: 'stage',
    tracks: { stage: null, miniboss: null, diablos: null },

    setupTracks() {
      try {
        if (!this.tracks.stage) {
          this.tracks.stage = new Audio('stage5_bgm.mp3');
          this.tracks.stage.loop = true;
          this.tracks.stage.volume = 0.50;
        }
        if (!this.tracks.miniboss) {
          this.tracks.miniboss = new Audio('boss_bgm.mp3');
          this.tracks.miniboss.loop = true;
          this.tracks.miniboss.volume = 0.60;
        }
        if (!this.tracks.diablos) {
          this.tracks.diablos = new Audio('final_boss_bgm.mp3');
          this.tracks.diablos.loop = true;
          this.tracks.diablos.volume = 0.75;
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

      Object.keys(this.tracks).forEach(k => {
        if (k !== this.mode && this.tracks[k]) {
          try {
            this.tracks[k].pause();
            this.tracks[k].currentTime = 0;
          } catch (e) {}
        }
      });

      const targetTrack = this.tracks[this.mode];
      if (targetTrack && targetTrack.paused) {
        targetTrack.play().catch(() => {});
      }
    },

    pauseBgm() {
      Object.keys(this.tracks).forEach(k => {
        if (this.tracks[k]) {
          try { this.tracks[k].pause(); } catch (e) {}
        }
      });
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
    chainCreak() { this.playTone(320, 0.2, 'square', 180, 0.12); },
    bridgeThud() { this.playTone(85, 0.6, 'sawtooth', 25, 0.4); },
    elevatorHum() { this.playTone(110, 0.15, 'triangle', 115, 0.08); },
    runeFlash() { this.playTone(440, 0.4, 'sine', 880, 0.25); },
    portalWhoosh() { this.playTone(90, 1.2, 'sawtooth', 380, 0.35); },
    batBurst() { this.playTone(60, 1.0, 'sawtooth', 20, 0.5); },
    toxicBreath() { this.playTone(180, 0.45, 'sawtooth', 60, 0.2); },
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
  // 3. CANVAS, CAMERA & 6-ROOM WORLD MATRIX
  // ===================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const VIEW_W = 960;
  const VIEW_H = 540;
  const GRAVITY = 0.52;

  const camera = { x: 0, y: 540, targetX: 0, targetY: 540, shakeFrames: 0, shakeMag: 0 };
  let currentRoom = 1;
  let maxRoomReached = 1;
  let isGamePaused = false;
  let showDebug = false; // Guide platform kekal aktif untuk rujukan abang (tekan G untuk toggle)

  const roomMinX = {
    1: 15,
    2: 960,
    3: 1940,
    4: 1950,
    5: 2880,
    6: 3840
  };

  const platforms = [
    // --- ROOM 1: DARK FOREST & CLIFF (Y: 540, Paras Tanah & Tebing pada Y: 865 Selari Gerbang Pintu) ---
    { id: 'r1_left_path', type: 'flat', x: 0, y: 865, w: 260, h: 215 },
    { id: 'r1_plateau', type: 'flat', x: 260, y: 865, w: 355, h: 215 },
    { id: 'r1_gatehouse_floor', type: 'flat', x: 825, y: 865, w: 90, h: 215 },

    // --- ROOM 2: CASTLE COURTYARD (Y: 540, Platform Rata Selaras Tengah Pintu Gerbang) ---
    { id: 'r2_ground', type: 'flat', x: 960, y: 970, w: 960, h: 110 },

    // --- ROOM 3: CASTLE FOYER & ELEVATOR SHAFT (Y: 540, Selaras Karpet Merah Bawah Y: 1000) ---
    { id: 'r3_ground', type: 'flat', x: 1920, y: 1000, w: 820, h: 80 },
    { id: 'r3_shaft_bottom', type: 'flat', x: 2740, y: 1005, w: 140, h: 75 },

    // --- ROOM 4: UPPER BATTLEMENTS (Y: 0, Platform Rata Selaras Y: 410 Mengelakkan Jatuh Lif) ---
    { id: 'r4_landing', type: 'flat', x: 1920, y: 410, w: 160, h: 130 },
    { id: 'r4_walkway', type: 'flat', x: 2070, y: 410, w: 810, h: 130 },

    // --- ROOM 5: THRONE ROOM & PORTAL SANCTUM (Y: 0, Platform Selaras Karpet Ungu Y: 460 & Pentas Sihir Y: 365) ---
    { id: 'r5_carpet_floor', type: 'flat', x: 2880, y: 460, w: 960, h: 80 },
    { id: 'r5_dais_ramp_left', type: 'ramp', x1: 3383, y1: 460, x2: 3473, y2: 365 },
    { id: 'r5_dais_top', type: 'flat', x: 3473, y: 365, w: 160, h: 35 },
    { id: 'r5_dais_ramp_right', type: 'ramp', x1: 3633, y1: 365, x2: 3723, y2: 460 },
    // (r5_carpet_floor sudah meliputi x: 2880..3840)

    // --- ROOM 6: THE ABYSSAL VOID LAIR (Y: 0, Platform Rata Selaras Tengah Magic Circle Y: 450) ---
    { id: 'r6_obsidian_arena', type: 'flat', x: 3840, y: 450, w: 960, h: 90 }
  ];

  const solidWalls = [
    { id: 'w_r1_cliff', x: 615, y: 540, w: 25, h: 540 },
    { id: 'w_r1_drawbridge_up', x: 825, y: 640, w: 25, h: 225 },
    { id: 'w_r1_inner_wall', x: 900, y: 640, w: 30, h: 225 },
    { id: 'w_r2_entrance_pillar', x: 970, y: 700, w: 25, h: 300 },
    { id: 'w_r2_exit_pillar', x: 1820, y: 700, w: 30, h: 300 },
    { id: 'w_r3_entrance_block', x: 1910, y: 700, w: 25, h: 350 },
    { id: 'w_r3_end_wall', x: 2850, y: 700, w: 30, h: 350 },
    { id: 'w_r4_left_wall', x: 1920, y: 0, w: 30, h: 450 },
    { id: 'w_r4_grand_door', x: 2733, y: 135, w: 91, h: 275 },
    { id: 'w_r5_chamber_end', x: 3820, y: 0, w: 25, h: 540 }
  ];

  const drawbridge = {
    x: 825, y: 865, angle: -90, falling: false, down: false
  };

  const lift = {
    x: 2740, y: 1000, w: 110, h: 18, targetY: 385, vy: 0, active: false, moving: false, completed: false, phase: 1
  };

  const grandDoor = {
    x: 2736,
    y: 404,
    w: 88,
    h: 275,
    archY: 230,
    apexY: 154, floorYLeft: 386, floorYRight: 422,
    open: false,
    opening: false,
    openProgress: 0,
    runeGlow: 0
  };

  const portal = {
    x: 3553, y: 262, radius: 75, active: false, completed: false, activationTimer: 0, vortexAngle: 0,
    sealWarningTimer: 0
  };

  const screenFade = {
    alpha: 0,
    state: 'none', // 'none' | 'fadeOut' | 'fadeIn'
    speed: 2.2,
    onMidpoint: null
  };

  function triggerRoomFade(onMidpoint) {
    if (screenFade.state !== 'none') return;
    screenFade.state = 'fadeOut';
    screenFade.alpha = 0;
    screenFade.onMidpoint = onMidpoint;
    hero.actionLock = true;
    hero.vx = 0;
  }

  // ===================================================================
  // 4. SISTEM PARTIKEL KELAWAR DIABLOS (FF8 HOMAGE)
  // ===================================================================
  class BatParticle {
    constructor(x, y) {
      this.x = x + (Math.random() - 0.5) * 50;
      this.y = y - 70 + (Math.random() - 0.5) * 70;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 7.0;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1.8;
      this.size = 3.5 + Math.random() * 5.5;
      this.wingSpeed = 0.28 + Math.random() * 0.25;
      this.wingTimer = Math.random() * 10;
      this.alpha = 1.0;
      this.decay = 0.007 + Math.random() * 0.009;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.wingTimer += this.wingSpeed;
      this.alpha -= this.decay;
    }

    draw(c) {
      if (this.alpha <= 0) return;
      c.save();
      c.globalAlpha = Math.max(0, this.alpha);
      c.fillStyle = '#0a0512';
      const wingFlap = Math.sin(this.wingTimer) * this.size;

      c.beginPath();
      c.fillRect(this.x - 1, this.y - 1, 3, 4);
      c.moveTo(this.x, this.y);
      c.lineTo(this.x - this.size * 1.8, this.y - wingFlap);
      c.lineTo(this.x - this.size * 0.8, this.y + 2);
      c.moveTo(this.x, this.y);
      c.lineTo(this.x + this.size * 1.8, this.y - wingFlap);
      c.lineTo(this.x + this.size * 0.8, this.y + 2);
      c.fill();
      c.restore();
    }
  }

  const batSwarm = [];

  function triggerDiablosBatExplosion(bx, by) {
    AudioEngine.batBurst();
    camera.shakeFrames = 50;
    camera.shakeMag = 9;
    for (let i = 0; i < 140; i++) {
      batSwarm.push(new BatParticle(bx, by));
    }
  }

  // ===================================================================
  // 4B. SISTEM PARTIKEL ASAP BERBISA MALBORO (TOXIC BREATH SMOKE)
  // ===================================================================
  class MalboroSmokeParticle {
    constructor(x, y, dir) {
      this.x = x + (Math.random() - 0.5) * 14;
      this.y = y + (Math.random() - 0.5) * 14;
      this.dir = dir; // 1 (kanan) atau -1 (kiri)
      // Halaju terapung ke hadapan
      const speed = 3.2 + Math.random() * 2.6;
      this.vx = dir * speed;
      this.vy = (Math.random() - 0.5) * 0.7 - 0.12; // sedikit terapung ke atas
      this.radius = 16 + Math.random() * 12;
      this.targetRadius = this.radius * (2.4 + Math.random() * 0.8);
      this.growth = (this.targetRadius - this.radius) / (65 + Math.random() * 25);
      this.alpha = 0.82 + Math.random() * 0.15;
      this.decay = 0.007 + Math.random() * 0.004;
      this.life = 0;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.04;
      this.colorType = Math.random() < 0.65 ? 'green' : (Math.random() < 0.5 ? 'purple' : 'yellow');
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
      // Perlahankan pergerakan mendatar sedikit demi sedikit (air resistance)
      this.vx *= 0.99;
      // Kepulan asap mengembang (billowing cloud)
      if (this.radius < this.targetRadius) {
        this.radius += this.growth;
      }
      this.rotation += this.rotSpeed;
      this.alpha -= this.decay;
    }

    draw(c) {
      if (this.alpha <= 0) return;
      c.save();
      c.translate(this.x, this.y);
      c.rotate(this.rotation);

      const a = Math.max(0, this.alpha);
      const grad = c.createRadialGradient(0, 0, 0, 0, 0, this.radius);

      // 👈 DIBAIKI: Warna asap ungu pekat serasi dengan nafas racun asal sprite Malboro
      grad.addColorStop(0, `rgba(233, 213, 255, ${a * 0.9})`);      // pusat lavender bercahaya
      grad.addColorStop(0.35, `rgba(192, 132, 252, ${a * 0.7})`);   // ungu terang
      grad.addColorStop(0.7, `rgba(126, 34, 206, ${a * 0.45})`);    // ungu toksik pekat
      grad.addColorStop(1, 'rgba(88, 28, 135, 0)');                // tepi lutsinar

      c.fillStyle = grad;
      c.beginPath();
      c.arc(0, 0, this.radius, 0, Math.PI * 2);
      c.fill();

      // Gelembung spora gas berbisa terapung dalam kepulan asap
      c.fillStyle = `rgba(245, 208, 254, ${a * 0.8})`;
      c.beginPath();
      c.arc(Math.cos(this.life * 0.1) * (this.radius * 0.35), Math.sin(this.life * 0.1) * (this.radius * 0.35), Math.max(2, this.radius * 0.14), 0, Math.PI * 2);
      c.fill();

      c.restore();
    }
  }

  const malboroSmoke = [];

  // ===================================================================
  // 5. STATUS ENTITI PERMAINAN
  // ===================================================================
  const hero = {
    x: 80, y: 789, w: 48, h: 76, vx: 0, vy: 0, speed: 4.5, facing: 1,
    hp: 100, grounded: false, state: 'idle', prevState: 'idle', animFrame: 0, animTimer: 0,
    actionLock: false, invulnFrames: 0, coyoteTimer: 0, jumpBuffer: 0,
    autoVictoryTimer: 0, isRespawning: false
  };

  const HERO_CONFIG = {
    rows: 5, renderSize: 120, offsetX: -60, offsetY: -100,
    actions: {
      idle:    { row: 0, cols: 10, startCol: 0, count: 5, fps: 6,  loop: true },
      climb:   { row: 0, cols: 10, startCol: 7, count: 3, fps: 7,  loop: true },
      run:     { row: 1, cols: 8,  startCol: 0, count: 6, fps: 14, loop: true },
      jump:    { row: 2, cols: 10, startCol: 1, count: 1, fps: 1,  loop: false },
      fall:    { row: 2, cols: 10, startCol: 2, count: 1, fps: 1,  loop: false },
      slash:   { row: 3, cols: 9,  startCol: 0, count: 6, fps: 17, loop: false },
      victory: { row: 4, cols: 10, startCol: 0, count: 2, fps: 6,  loop: true },
      // 👈 DIBAIKI: Frame hurt & defeat menggunakan koordinat piksel tengah tepat (tidak terbelah/terhiris)
      hurt:    { row: 4, count: 2, fps: 7, loop: false, customSx: [728, 862], cellW: 128 },
      defeat:  { row: 4, count: 4, fps: 5, loop: false, customSx: [728, 862, 980, 1134], cellW: 128 }
    }
  };

  const goblins = [
    // Room 2: platform Y = 970 -> g.y = 970 - 58 = 912 (mendarat rapat atas platform)
    { id: 1, room: 2, x: 1240, y: 912, vx: 1.1, w: 42, h: 58, facing: -1, minX: 1050, maxX: 1400, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, alive: true },
    { id: 2, room: 2, x: 1580, y: 912, vx: -1.0, w: 42, h: 58, facing: -1, minX: 1450, maxX: 1780, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, alive: true },
    // Room 3: platform karpet merah Y = 1000 -> g.y = 1000 - 58 = 942
    { id: 3, room: 3, x: 2100, y: 942, vx: 1.2, w: 42, h: 58, facing: 1,  minX: 1980, maxX: 2280, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, alive: true },
    { id: 4, room: 3, x: 2540, y: 942, vx: -1.1, w: 42, h: 58, facing: -1, minX: 2380, maxX: 2680, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, alive: true },
    { id: 5, room: 4, x: 2200, y: 352, vx: 1.1, w: 42, h: 58, facing: 1,  minX: 2120, maxX: 2380, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, alive: true },
    { id: 6, room: 4, x: 2650, y: 352, vx: -1.2, w: 42, h: 58, facing: -1, minX: 2450, maxX: 2750, hp: 60, state: 'walk', animFrame: 0, animTimer: 0, alive: true }
  ];

  // 👈 DIBAIKI: offsetY diselaraskan ke -89 agar tapak kaki goblin mendarat tepat atas garisan platform
  const GOBLIN_CONFIG = {
    rows: 4, cols: 6, renderSize: 92, offsetX: -46, offsetY: -89,
    actions: {
      idle:   { row: 0, startCol: 0, count: 4, fps: 6,  loop: true },
      walk:   { row: 1, startCol: 0, count: 6, fps: 10, loop: true },
      attack: { row: 2, startCol: 0, count: 4, fps: 10, loop: false },
      death:  { row: 3, startCol: 0, count: 6, fps: 8,  loop: false }
    }
  };

  const orbs = [
    { id: 0, name: 'CRIMSON ORB', room: 1, x: 320,  y: 780, row: 0, color: '#ef4444', collected: false },
    { id: 1, name: 'AZURE ORB',   room: 2, x: 1420, y: 880, row: 1, color: '#0ea5e9', collected: false },
    { id: 2, name: 'EMERALD ORB', room: 3, x: 2150, y: 910, row: 2, color: '#10b981', collected: false },
    { id: 3, name: 'VIOLET ORB',  room: 3, x: 2450, y: 910, row: 3, color: '#8b5cf6', collected: false },
    { id: 4, name: 'GOLDEN ORB',  room: 4, x: 2360, y: 320, row: 4, color: '#f59e0b', collected: false }
  ];

  // MINI-BOSS 1: MALBORO (Spritesheet 6-Frame Baharu: Rows 4, Cols 6)
  const malboro = {
    x: 450, y: 865, w: 140, h: 125, hp: 350, maxHp: 350, facing: -1,
    state: 'idle', stateTimer: 60, animFrame: 0, animTimer: 0, alive: true, active: false, spawned: false
  };

  const MALBORO_CONFIG = {
    rows: 4, cols: 6,
    renderW: 230, renderH: 160,
    offsetX: -115, offsetY: -150,
    actions: {
      idle:      { row: 0, startCol: 0, count: 6, fps: 7, loop: true },
      lash:      { row: 1, startCol: 0, count: 6, fps: 9, loop: false },
      badBreath: { row: 2, startCol: 0, count: 6, fps: 8, loop: false },
      defeat:    { row: 3, startCol: 0, count: 6, fps: 5, loop: false }
    }
  };

  // MINI-BOSS 2: STONE GARGOYLE (Spritesheet 6-Frame Baharu: Rows 4, Cols 6)
  const gargoyle = {
    x: 2360, y: 1000, w: 160, h: 130, hp: 400, maxHp: 400, facing: -1,
    state: 'idle', stateTimer: 80, animFrame: 0, animTimer: 0, alive: true, active: false, spawned: false
  };

  const GARGOYLE_CONFIG = {
    rows: 4, cols: 6,
    renderW: 300, renderH: 155,
    offsetX: -150, offsetY: -145,
    actions: {
      idle:    { row: 0, startCol: 0, count: 6, fps: 7, loop: true },
      slash:   { row: 1, startCol: 0, count: 6, fps: 9, loop: false },
      roar:    { row: 2, startCol: 0, count: 6, fps: 8, loop: false },
      defeat:  { row: 3, startCol: 0, count: 6, fps: 5, loop: false }
    }
  };

  // MINI-BOSS 3: SHADOW TEMPLAR NAZGÛL (Spritesheet 6-Frame Baharu: Rows 4, Cols 6)
  const templar = {
    x: 2520, y: 410, w: 170, h: 140, hp: 450, maxHp: 450, facing: -1,
    state: 'idle', stateTimer: 75, animFrame: 0, animTimer: 0, alive: true, active: false, spawned: false
  };

  const TEMPLAR_CONFIG = {
    rows: 4, cols: 6,
    renderW: 315, renderH: 175,
    offsetX: -158, offsetY: -168,
    actions: {
      idle:    { row: 0, startCol: 0, count: 6, fps: 7,  loop: true },
      charge:  { row: 1, startCol: 0, count: 6, fps: 11, loop: false },
      stomp:   { row: 2, startCol: 0, count: 6, fps: 8,  loop: false },
      defeat:  { row: 3, startCol: 0, count: 6, fps: 5,  loop: false }
    }
  };

  // FINAL BOSS: THE SOVEREIGN DIABLOS (Spritesheet 6-Frame: Rows 4, Cols 6, renderSize: 289)
  const diablos = {
    x: 4320, y: 402, baseY: 402, w: 200, h: 180, hp: 1200, maxHp: 1200, facing: -1,
    state: 'emerging',
    stateTimer: 600, // Fasa ritual bangkit perlahan dari kedalaman gaung
    emergeY: 675,    // 👈 TENGGELAM 100% DI BAWAH LANTAI (Y: 675)
    animFrame: 0, animTimer: 0, alive: true, active: false, visible: true,
    batExplosionTriggered: false
  };

  const DIABLOS_CONFIG = {
    rows: 4,
    cols: 6,
    sliceOffset: 0,
    trimRight: 0,
    renderSize: 289,
    actions: {
      idle:        { row: 0, count: 4, fps: 7, loop: true, customBoxes: [{ sx: 458, sw: 132 }, { sx: 590, sw: 145 }, { sx: 735, sw: 142 }, { sx: 590, sw: 145 }] },
      voidOrb:     { row: 1, count: 6, fps: 9, loop: false },
      voidPillars: { row: 2, count: 6, fps: 8, loop: false },
      defeat:      { row: 3, count: 6, fps: 5, loop: false }
    }
  };

  // Animasi idle/jalan berulang untuk semua boss (sebelum ini frame beku di 0)
  function tickBossIdle(b, act, dt) {
    if (b.animTimer >= 1 / act.fps) {
      b.animTimer = 0;
      b.animFrame = (b.animFrame + 1) % act.count;
    }
  }

  const voidProjectiles = [];
  const independentPillars = [];

  function spawnEruptingPillars() {
    AudioEngine.playTone(120, 0.5, 'sawtooth', 40, 0.4);
    const positions = [hero.x + hero.w * 0.5, diablos.x - 180, diablos.x + 180];
    positions.forEach(px => {
      independentPillars.push({
        x: Math.max(3920, Math.min(4720, px)),
        stage: 'warning',
        timer: 0.55,
        frame: 0,
        animTimer: 0,
        width: 80
      });
    });
  }

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

  const masterScroll = {
    x: 4320, y: 140, unlocked: false, hoverOffset: 0, opened: false,
    state: 'floating', frameIdx: 0, animTimer: 0
  };

  const floatingPopups = [];
  function addFloatingPopup(text, x, y, color = '#f59e0b') {
    floatingPopups.push({ text, x, y, color, life: 60, maxLife: 60 });
  }

  // ===================================================================
  // 6. INPUT HANDLER (LOMPAT GUNA W & SPACE)
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
      addFloatingPopup(showDebug ? 'GUIDE: ON' : 'GUIDE: OFF', hero.x + 20, hero.y - 20, '#fde047');
      return;
    }

    if (isGamePaused || hero.autoVictoryTimer > 0 || hero.isRespawning) return;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = true;

    // 👈 DIBAIKI: 'W', 'Space', atau 'ArrowUp' semuanya boleh melompat!
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
    const downHandler = (e) => { e.preventDefault(); AudioEngine.init(); requestWakeLock(); onDown(); };
    const upHandler = (e) => { e.preventDefault(); if (onUp) onUp(); };
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

  const btnPauseG = document.getElementById('btnPauseGame');
  if (btnPauseG) btnPauseG.addEventListener('click', () => setPause(!isGamePaused));
  const btnResumeG = document.getElementById('btnResumeGame');
  if (btnResumeG) btnResumeG.addEventListener('click', () => setPause(false));
  const btnRestart = document.getElementById('btnRestartStage');
  if (btnRestart) btnRestart.addEventListener('click', () => window.location.reload());
  const btnViewCred = document.getElementById('btnViewCredits');
  if (btnViewCred) btnViewCred.addEventListener('click', () => window.location.href = 'credits.html');
  const btnReplayAll = document.getElementById('btnReplayAll');
  if (btnReplayAll) btnReplayAll.addEventListener('click', () => window.location.href = 'stage1.html');

  // ===================================================================
  // 7. DAMAGE, FIZIK & LOGIK 6-BILIK (updateGame)
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

      // 👈 DIBAIKI: Cari platform di bawah tapak kaki hero mengikut aras tingkat semasa (mengelakkan hero jatuh ke gaung bilik bawah)
      let foundPlat = false;
      const isUpper = hero.y < 540;
      let candidatePlat = null;
      let minDy = Infinity;
      const heroCenterX = hero.x + hero.w * 0.5;
      const heroFoot = hero.y + hero.h;

      for (const p of platforms) {
        if (p.type === 'flat') {
          // Asingkan platform mengikut aras tingkat atas (Room 4-6) dan tingkat bawah (Room 1-3)
          if (isUpper && p.y >= 540) continue;
          if (!isUpper && p.y < 540) continue;

          if (heroCenterX >= p.x && heroCenterX <= p.x + p.w) {
            const dy = p.y - heroFoot;
            if (dy >= -50 && dy < minDy) {
              minDy = dy;
              candidatePlat = p;
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
              candidatePlat = { y: rampY };
            }
          }
        }
      }

      if (candidatePlat) {
        hero.y = candidatePlat.y - hero.h;
        hero.grounded = true;
        hero.vy = 0;
        foundPlat = true;
      }

      // Jika tiada platform tepat di bawah (cth: hero terpelanting melepasi tebing/gaung), daratkan di platform selamat bilik semasa
      if (!foundPlat) {
        if (currentRoom === 1) {
          hero.x = Math.min(hero.x, 560);
          hero.y = 865 - hero.h;
        } else if (currentRoom === 2) {
          hero.y = 970 - hero.h;
        } else if (currentRoom === 3) {
          hero.y = 1000 - hero.h;
        } else if (currentRoom === 4) {
          hero.x = Math.max(hero.x, 1980);
          hero.y = 410 - hero.h;
        } else if (currentRoom === 5) {
          hero.y = 460 - hero.h;
        } else {
          hero.y = 450 - hero.h;
        }
        hero.grounded = true;
        hero.vy = 0;
      }

      AudioEngine.hit();
      camera.shakeFrames = 15;
      camera.shakeMag = 8;
      addFloatingPopup('FALLEN! RESPAWNING...', hero.x + 20, hero.y - 15, '#ef4444');

      setTimeout(() => {
        if (currentRoom === 1) { hero.x = 80; hero.y = 789; hero.facing = 1; }
        else if (currentRoom === 2) { hero.x = 1020; hero.y = 894; hero.facing = 1; }
        else if (currentRoom === 3) { hero.x = 1980; hero.y = 924; hero.facing = 1; }
        else if (currentRoom === 4) { hero.x = 2100; hero.y = 334; hero.facing = 1; }
        else if (currentRoom === 5) { hero.x = 2940; hero.y = 460 - hero.h; hero.facing = 1; }
        else { hero.x = 3920; hero.y = 450 - hero.h; hero.facing = 1; }

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

    // 👈 DIBAIKI: Semakan Terjatuh Jurang Maut Page 1
    if (currentRoom === 1 && hero.y > 1050) {
      inflictDamage(100, 0);
      return;
    }

    // Kemas kini Transisi Layar Gelap (Fade to Black)
    if (screenFade.state === 'fadeOut') {
      screenFade.alpha += dt * screenFade.speed;
      if (screenFade.alpha >= 1) {
        screenFade.alpha = 1;
        screenFade.state = 'fadeIn';
        if (typeof screenFade.onMidpoint === 'function') {
          screenFade.onMidpoint();
          screenFade.onMidpoint = null;
        }
      }
    } else if (screenFade.state === 'fadeIn') {
      screenFade.alpha -= dt * screenFade.speed;
      if (screenFade.alpha <= 0) {
        screenFade.alpha = 0;
        screenFade.state = 'none';
        hero.actionLock = false;
      }
    }

    for (let i = floatingPopups.length - 1; i >= 0; i--) {
      const pop = floatingPopups[i];
      pop.y -= 0.6;
      pop.life--;
      if (pop.life <= 0) floatingPopups.splice(i, 1);
    }

    for (let i = batSwarm.length - 1; i >= 0; i--) {
      const bat = batSwarm[i];
      bat.update();
      if (bat.alpha <= 0) batSwarm.splice(i, 1);
    }

    // Kemas kini & Sentuhan Asap Berbisa Malboro (Room 1)
    for (let i = malboroSmoke.length - 1; i >= 0; i--) {
      const p = malboroSmoke[i];
      p.update();
      if (p.alpha > 0.25 && currentRoom === 1 && malboro.active && hero.hp > 0 && hero.invulnFrames <= 0) {
        const hx = hero.x + hero.w * 0.5;
        const hy = hero.y + hero.h * 0.5;
        const distToHero = Math.hypot(p.x - hx, p.y - hy);
        if (distToHero < p.radius + 16) {
          inflictDamage(12, p.dir || malboro.facing);
          addFloatingPopup('POISON!', hero.x + 10, hero.y - 20, '#86efac');
        }
      }
      if (p.alpha <= 0 || p.x < -100 || p.x > 1060) {
        malboroSmoke.splice(i, 1);
      }
    }
    if (hero.isRespawning) return;

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

    // Kawalan & Fizik Hero
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

    // Kunci sempadan anti-backtrack mengikut halaman terkunci (maxRoomReached)
    const minAllowedX = roomMinX[maxRoomReached] || 15;
    if (hero.x < minAllowedX) {
      hero.x = minAllowedX;
      if (hero.vx < 0) hero.vx = 0;
    }

    if (hero.x > 4800 - hero.w - 15) hero.x = 4800 - hero.w - 15;

    // Dinding Halangan
    for (const w of solidWalls) {
      if (w.id === 'w_r1_cliff' && drawbridge.down) continue;
      if (w.id === 'w_r1_drawbridge_up' && drawbridge.down) continue;
      if (w.id === 'w_r4_grand_door' && grandDoor.open) continue;

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
        if (hero.x + hero.w * 0.5 >= p.x1 && hero.x + hero.w * 0.5 <= p.x2 && hero.vy >= 0) {
          const t = (hero.x + hero.w * 0.5 - p.x1) / (p.x2 - p.x1);
          const rampY = p.y1 + t * (p.y2 - p.y1);
          if (prevFoot <= rampY + 22 && hero.y + hero.h >= rampY - 10) {
            hero.y = rampY - hero.h;
            hero.vy = 0;
            hero.grounded = true;
            break;
          }
        }
      }
    }

    // 👈 DIBAIKI: AI PERONDAAN GOBLIN (KEMATIAN HAPUS DENGAN ANIMASI PENUH & SERANGAN SENJATA BERDEPAN)
    for (const g of goblins) {
      if (g.room !== currentRoom) continue;
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
            if (hero.isRespawning) return;
          } else if (distX < 42 && distY < 40) {
            // Sentuhan fizikal terus (body collision)
            inflictDamage(10, g.facing || (hCenterX < gCenterX ? 1 : -1));
            if (hero.isRespawning) return;
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
          if (hero.isRespawning) return;
        }
      }
    }
    if (hero.isRespawning) return;

    // C. Mekanik Lif Rahsia (Page 3 -> Page 4 Bersambung Lancar)
    if (lift.active && !lift.completed) {
      if (!lift.moving) {
        if (hero.x + hero.w > lift.x && hero.x < lift.x + lift.w && Math.abs((hero.y + hero.h) - lift.y) < 18) {
          hero.y = lift.y - hero.h;
          hero.vy = 0;
          hero.grounded = true;
          lift.moving = true;
          lift.phase = 1;
          hero.actionLock = true;
          hero.state = 'idle';
          hero.animFrame = 0;
          hero.vx = 0;
        }
      }

      if (lift.moving) {
        // Page 3: Lif naik ke siling bilik 3 dengan hero berdiri tegak (idle sprite)
        lift.y -= 3.0;
        hero.y = lift.y - hero.h;
        hero.x = lift.x + 30;
        hero.actionLock = true;
        hero.state = 'idle';
        hero.animFrame = 0;
        hero.grounded = true;
        hero.vx = 0;
        hero.vy = 0;
        AudioEngine.elevatorHum();
        camera.targetY = Math.max(540, lift.y - 300);

        if (lift.y <= 550 && screenFade.state === 'none') {
          // Capai siling Page 3 -> Fade to black terus transition ke Page 4!
          triggerRoomFade(() => {
            currentRoom = 4;
            maxRoomReached = Math.max(maxRoomReached, 4);
            camera.targetX = 1920;
            camera.targetY = 0;
            camera.x = 1920;
            camera.y = 0;

            lift.moving = false;
            lift.completed = true;
            lift.y = 385;

            // Muncul terus di atas walkway balkoni Page 4
            hero.x = 2100;
            hero.y = 334; // 410 - 76 = 334
            hero.actionLock = false;
            hero.grounded = true;
            hero.vx = 0;
            hero.vy = 0;
            hero.state = 'idle';
            hero.animFrame = 0;

            AudioEngine.bridgeThud();
            camera.shakeFrames = 12;
            camera.shakeMag = 4;
            addFloatingPopup('HIGH BATTLEMENTS REACHED!', hero.x + 20, hero.y - 20, '#38bdf8');
          });
        }
      }
    }

    // D. Animasi Drawbridge Drop (Page 1)
    if (drawbridge.falling && !drawbridge.down) {
      drawbridge.angle += 3.2;
      AudioEngine.chainCreak();
      if (drawbridge.angle >= 0) {
        drawbridge.angle = 0;
        drawbridge.down = true;
        drawbridge.falling = false;
        AudioEngine.bridgeThud();
        camera.shakeFrames = 18;
        camera.shakeMag = 6;
        addFloatingPopup('DRAWBRIDGE LOWERED!', drawbridge.x - 120, drawbridge.y - 20, '#f59e0b');

        platforms.push({
          id: 'r1_bridge_plank',
          type: 'flat',
          x: 615,
          y: 865,
          w: 215,
          h: 20
        });
      }
    }

    // D2. Transisi Masuk Pintu Gerbang Masuk Istana (Page 1 -> Page 2 Fade to Black)
    if (currentRoom === 1 && hero.x >= 840 && drawbridge.down && screenFade.state === 'none') {
      triggerRoomFade(() => {
        currentRoom = 2;
        maxRoomReached = Math.max(maxRoomReached, 2);
        camera.x = 960;
        camera.targetX = 960;
        camera.y = 540;
        camera.targetY = 540;
        // Hero muncul terus di atas platform halaman Room 2 secara mendatar (tanpa ramp menurun)
        hero.x = 1010;
        hero.y = 894; // 970 - 76 = 894
        hero.vx = 0;
        hero.vy = 0;
        hero.facing = 1;
        hero.grounded = true;
        AudioEngine.bridgeThud();
        addFloatingPopup('OUTER GATES SEALED! (NO RETURN)', hero.x + 20, hero.y - 30, '#ef4444');
      });
    }

    // D3. Transisi Masuk Pintu Gerbang Halaman ke Foyer (Page 2 -> Page 3 Fade to Black)
    if (currentRoom === 2 && hero.x >= 1760 && screenFade.state === 'none') {
      if (!orbs[1].collected) {
        hero.x = 1750;
        if (hero.vx > 0) hero.vx = 0;
        if (!hero.gateWarningTimer || hero.gateWarningTimer <= 0) {
          hero.gateWarningTimer = 60;
          AudioEngine.playTone(150, 0.2, 'sawtooth', 80, 0.2);
          addFloatingPopup('⚠️ GATE SEALED! COLLECT AZURE ORB FIRST', hero.x, hero.y - 30, '#0ea5e9');
        }
      } else {
        triggerRoomFade(() => {
          currentRoom = 3;
          maxRoomReached = Math.max(maxRoomReached, 3);
          camera.x = 1920;
          camera.targetX = 1920;
          camera.y = 540;
          camera.targetY = 540;
          // Hero muncul di atas platform Room 3 (Paras karpet merah Y: 1000)
          hero.x = 1970;
          hero.y = 924; // 1000 - 76 = 924
          hero.vx = 0;
          hero.vy = 0;
          hero.facing = 1;
          hero.grounded = true;
          AudioEngine.bridgeThud();
          addFloatingPopup('CATHEDRAL FOYER ENTERED! (NO RETURN)', hero.x + 20, hero.y - 30, '#ef4444');
        });
      }
    }
    if (hero.gateWarningTimer > 0) hero.gateWarningTimer -= dt * 60;

    // Kemas kini animasi pembukaan pintu kayu besar Bilik 4 -> Bilik 5
    if (grandDoor.opening && !grandDoor.open) {
      grandDoor.openProgress += dt * 0.75;
      if (Math.floor(grandDoor.openProgress * 20) % 4 === 0) {
        camera.shakeFrames = 2;
        camera.shakeMag = 1.5;
      }
      if (grandDoor.openProgress >= 1) {
        grandDoor.openProgress = 1;
        grandDoor.open = true;
        grandDoor.opening = false;
        AudioEngine.bridgeThud();
        camera.shakeFrames = 15;
        camera.shakeMag = 5;
        addFloatingPopup('PATH TO THRONE ROOM OPEN!', grandDoor.x - 40, grandDoor.y - 100, '#38bdf8');
      }
    }

    // D4. Transisi Masuk Pintu Gerbang Kayu Besar ke Throne Room (Page 4 -> Page 5 Fade to Black)
    if (currentRoom === 4 && hero.x >= 2780 && grandDoor.open && screenFade.state === 'none') {
      triggerRoomFade(() => {
        currentRoom = 5;
        maxRoomReached = Math.max(maxRoomReached, 5);
        camera.x = 2880;
        camera.targetX = 2880;
        camera.y = 0;
        camera.targetY = 0;
        hero.x = 2940;
        hero.y = 460 - hero.h; // 👈 460 - 76 = 384 (Mendarat kemas atas karpet purple Room 5)
        hero.vx = 0;
        hero.vy = 0;
        hero.facing = 1;
        hero.grounded = true;
        AudioEngine.bridgeThud();
        addFloatingPopup('THRONE ROOM ENTERED! (NO RETURN)', hero.x + 20, hero.y - 30, '#ef4444');
      });
    }

    // E. Ritual 5 Orbs Membuka Portal (Page 5: SYARAT WAJIB 5 ORBS)
    if (currentRoom === 5 && !portal.active && !portal.completed) {
      if (hero.x > 3483 && hero.x < 3623 && hero.grounded && (hero.y + hero.h) <= 380) {
        const collectedCount = orbs.filter(o => o.collected).length;
        if (collectedCount >= 5) {
          portal.active = true;
          hero.actionLock = true;
          hero.vx = 0;
          hero.vy = 0;
          hero.x = 3553 - hero.w * 0.5;
          hero.y = 365 - hero.h;
          hero.state = 'idle';
          hero.animFrame = 0;
          AudioEngine.runeFlash();
          addFloatingPopup('✨ ALL 5 POWER ORBS AWAKENED! OPENING VOID PORTAL...', hero.x, hero.y - 40, '#f59e0b');
        } else {
          if (!portal.sealWarningTimer || portal.sealWarningTimer <= 0) {
            portal.sealWarningTimer = 70;
            AudioEngine.playTone(150, 0.25, 'sawtooth', 80, 0.25);
            addFloatingPopup(`⚠️ PORTAL SEALED! ALL 5 POWER ORBS REQUIRED (${collectedCount}/5)`, hero.x, hero.y - 40, '#ef4444');
          }
        }
      }
    }
    if (portal.sealWarningTimer > 0) portal.sealWarningTimer -= dt * 60;

    if (portal.active && !portal.completed) {
      portal.activationTimer += dt;
      portal.vortexAngle += 0.05;
      hero.actionLock = true;
      hero.vx = 0;
      hero.vy = 0;
      hero.x = 3553 - hero.w * 0.5;
      hero.y = 365 - hero.h;
      hero.state = 'idle';

      if (portal.activationTimer > 1.8 && portal.activationTimer < 2.0) {
        AudioEngine.portalWhoosh();
        camera.shakeFrames = 25;
        camera.shakeMag = 5;
      }

      if (portal.activationTimer >= 2.5) {
        portal.active = false;
        portal.completed = true;
        currentRoom = 6;

        hero.x = 3920;
        hero.y = 450 - hero.h; // 450 - 76 = 374 (paras tengah magic circle)
        hero.facing = 1;
        hero.actionLock = false;
        hero.vx = 0;
        hero.vy = 0;

        diablos.active = true;
        AudioEngine.playBgm('diablos');
        AudioEngine.portalWhoosh();
        addFloatingPopup('THE ABYSSAL VOID LAIR!', 3940, 260, '#a855f7');
        updateHud();
      }
    }

    // Status Animasi Hero
    if (!hero.actionLock && hero.autoVictoryTimer <= 0) {
      if (!hero.grounded) hero.state = hero.vy < 0 ? 'jump' : 'fall';
      else if (Math.abs(hero.vx) > 0.2) hero.state = 'run';
      else hero.state = 'idle';
    }

    // 👈 DIBAIKI: Reset animFrame sebaik sahaja status animasi berubah (elak hero "hilang" ketika melompat!)
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
        if (g.alive && g.room === currentRoom &&
            slashBox.x + slashBox.w > g.x && slashBox.x < g.x + g.w &&
            slashBox.y + slashBox.h > g.y && slashBox.y < g.y + g.h) {
          g.hp -= 40;
          g.vx = hero.facing * 3.5;
          AudioEngine.hit();
          addFloatingPopup('-40', g.x + 20, g.y, '#f59e0b');
          if (g.hp <= 0) {
            g.alive = false;
            g.state = 'death';
            AudioEngine.goblinDie();
          }
        }
      }

      // Malboro (Page 1)
      if (currentRoom === 1 && malboro.alive && malboro.active) {
        if (slashBox.x + slashBox.w > malboro.x - 70 && slashBox.x < malboro.x + malboro.w + 70 &&
            slashBox.y + slashBox.h > malboro.y - 160 && slashBox.y < malboro.y + 20) {
          malboro.hp = Math.max(0, malboro.hp - 35);
          AudioEngine.hit();
          camera.shakeFrames = 7;
          camera.shakeMag = 4;
          addFloatingPopup('-35', malboro.x, malboro.y - 80, '#22c55e');
          updateHud();

          if (malboro.hp <= 0) {
            malboro.alive = false;
            malboro.state = 'defeat';
            malboro.animFrame = 0;
            drawbridge.falling = true;
            AudioEngine.playBgm('stage');
            updateHud();
          }
        }
      }

      // Gargoyle (Page 3)
      if (currentRoom === 3 && gargoyle.alive && gargoyle.active) {
        if (slashBox.x + slashBox.w > gargoyle.x - 80 && slashBox.x < gargoyle.x + gargoyle.w + 80 &&
            slashBox.y + slashBox.h > gargoyle.y - 155 && slashBox.y < gargoyle.y + 20) {
          gargoyle.hp = Math.max(0, gargoyle.hp - 35);
          AudioEngine.hit();
          camera.shakeFrames = 7;
          camera.shakeMag = 4;
          addFloatingPopup('-35', gargoyle.x, gargoyle.y - 80, '#94a3b8');
          updateHud();

          if (gargoyle.hp <= 0) {
            gargoyle.alive = false;
            gargoyle.state = 'defeat';
            gargoyle.animFrame = 0;
            lift.active = true;
            AudioEngine.playBgm('stage');
            addFloatingPopup('LIFT UNLOCKED! STEP ON LIFT', lift.x, lift.y - 30, '#f59e0b');
            updateHud();
          }
        }
      }

      // Shadow Templar (Page 4)
      if (currentRoom === 4 && templar.alive && templar.active) {
        if (slashBox.x + slashBox.w > templar.x - 80 && slashBox.x < templar.x + templar.w + 80 &&
            slashBox.y + slashBox.h > templar.y - 175 && slashBox.y < templar.y + 20) {
          templar.hp = Math.max(0, templar.hp - 35);
          AudioEngine.hit();
          camera.shakeFrames = 8;
          camera.shakeMag = 4;
          addFloatingPopup('-35', templar.x, templar.y - 90, '#dc2626');
          updateHud();

          if (templar.hp <= 0) {
            templar.alive = false;
            templar.state = 'defeat';
            templar.animFrame = 0;
            grandDoor.opening = true; // 👈 Mula animasi buka pintu gerbang kayu besar
            AudioEngine.playBgm('stage');
            AudioEngine.chainCreak();
            AudioEngine.runeFlash();
            camera.shakeFrames = 25;
            camera.shakeMag = 6;
            addFloatingPopup('GRAND DOORS UNSEALING...', grandDoor.x - 40, grandDoor.y - 120, '#a855f7');
            updateHud();
          }
        }
      }

      // The Sovereign Diablos (Page 6)
      if (currentRoom === 6 && diablos.alive && diablos.active && diablos.state !== 'emerging') {
        if (slashBox.x + slashBox.w > diablos.x - 120 && slashBox.x < diablos.x + diablos.w + 60 &&
            slashBox.y + slashBox.h > diablos.y - 235 && slashBox.y < diablos.y + 30) {
          diablos.hp = Math.max(0, diablos.hp - 30);
          AudioEngine.hit();
          camera.shakeFrames = 10;
          camera.shakeMag = 5;
          addFloatingPopup('-30', diablos.x, diablos.y - 120, '#fbbf24');
          updateHud();

          if (diablos.hp <= 0) {
            diablos.alive = false;
            diablos.state = 'defeat';
            diablos.animFrame = 0;
            diablos.animTimer = 0;
            updateHud();
          }
        }
      }
    }
    input.attackPressed = false;

    // Kutip Orbs
    for (const orb of orbs) {
      if (!orb.collected && orb.room === currentRoom) {
        const hx = hero.x + hero.w * 0.5;
        const hy = hero.y + hero.h * 0.5;
        if (Math.abs(hx - orb.x) < 45 && Math.abs(hy - orb.y) < 65) {
          orb.collected = true;
          AudioEngine.orb();
          addFloatingPopup(`+${orb.name}`, orb.x - 10, orb.y - 20, orb.color);
          updateHud();

          // 👈 SYARAT WAJIB: Bos mini muncul HANYA SELEPAS hero kutip orbs untuk halaman tersebut!
          if (currentRoom === 1 && orb.id === 0 && !malboro.spawned) {
            malboro.spawned = true;
            malboro.active = true;
            AudioEngine.playBgm('miniboss');
            camera.shakeFrames = 25;
            camera.shakeMag = 6;
            addFloatingPopup('⚠️ MINI-BOSS AWAKENED: MALBORO!', malboro.x, malboro.y - 70, '#a855f7');
          } else if (currentRoom === 3 && orbs[2].collected && orbs[3].collected && !gargoyle.spawned) {
            gargoyle.spawned = true;
            gargoyle.active = true;
            AudioEngine.playBgm('miniboss');
            camera.shakeFrames = 25;
            camera.shakeMag = 6;
            addFloatingPopup('⚠️ MINI-BOSS AWAKENED: STONE GARGOYLE!', gargoyle.x, gargoyle.y - 70, '#94a3b8');
          } else if (currentRoom === 4 && orb.id === 4 && !templar.spawned) {
            templar.spawned = true;
            templar.active = true;
            AudioEngine.playBgm('miniboss');
            camera.shakeFrames = 25;
            camera.shakeMag = 6;
            addFloatingPopup('⚠️ MINI-BOSS AWAKENED: SHADOW TEMPLAR!', templar.x, templar.y - 70, '#dc2626');
          }
        }
      }
    }

    // 👈 DIBAIKI: AI BOS DENGAN GERAKAN & PUSING ARAH MENGIKUT HERO
    // 1. Malboro (Room 1)
    if (currentRoom === 1) {
      if (!malboro.spawned && malboro.alive && hero.x > 380) {
        if (!malboro.hintTimer || malboro.hintTimer <= 0) {
          malboro.hintTimer = 120;
          addFloatingPopup('⚠️ COLLECT CRIMSON ORB TO AWAKEN MALBORO!', hero.x, hero.y - 30, '#ef4444');
        }
      }
      if (malboro.hintTimer > 0) malboro.hintTimer -= dt * 60;
    }
    if (currentRoom === 1 && malboro.active) {
      // 👈 Serangan nafas racun Malboro boleh capai hero serta-merta, mainkan BGM bos terus
      if (malboro.alive && malboro.active && AudioEngine.mode !== 'miniboss') {
        AudioEngine.playBgm('miniboss');
      }

      // Pusing menghadap hero HANYA semasa Malboro masih hidup (mayat kekal arah kematian)
      if (malboro.alive) {
        malboro.facing = hero.x < malboro.x ? -1 : 1;
      }

      if (!malboro.alive) {
        const mAct = MALBORO_CONFIG.actions.defeat;
        malboro.animTimer += dt;
        if (malboro.animTimer >= 1 / mAct.fps) {
          malboro.animTimer = 0;
          if (malboro.animFrame < mAct.count - 1) malboro.animFrame++;
        }
      } else {
        const dist = Math.abs(hero.x - malboro.x);
        malboro.stateTimer -= dt * 60;
        malboro.animTimer += dt;

        // Malboro bergerak perlahan menghampiri hero
        if (malboro.state === 'idle') {
          tickBossIdle(malboro, MALBORO_CONFIG.actions.idle, dt);
          if (dist > 100) malboro.x += malboro.facing * 0.7;
          malboro.x = Math.max(260, Math.min(580, malboro.x));

          if (malboro.stateTimer <= 0) {
            malboro.state = dist < 120 ? 'lash' : 'badBreath';
            malboro.animFrame = 0;
            malboro.animTimer = 0;
            if (malboro.state === 'badBreath') {
              AudioEngine.toxicBreath();
              addFloatingPopup('TOXIC BREATH!', malboro.x + malboro.w * 0.5, malboro.y - 120, '#86efac');
            }
          }
        } else if (malboro.state === 'lash' || malboro.state === 'badBreath') {
          // Pancutan kepulan asap terapung ke hadapan apabila Malboro meniup nafas beracun
          if (malboro.state === 'badBreath' && malboro.animFrame >= 1 && malboro.animFrame <= 5) {
            const mouthX = malboro.x + malboro.w * 0.5 + malboro.facing * 45;
            const mouthY = malboro.y - 65;
            for (let s = 0; s < 2; s++) {
              malboroSmoke.push(new MalboroSmokeParticle(mouthX, mouthY, malboro.facing));
            }
          }

          const act = MALBORO_CONFIG.actions[malboro.state];
          if (malboro.animTimer >= 1 / act.fps) {
            malboro.animTimer = 0;
            malboro.animFrame++;
            if (malboro.animFrame === 3 || malboro.animFrame === 4) {
              if (malboro.state === 'lash' && dist < 125) inflictDamage(18, malboro.facing);
              if (malboro.state === 'badBreath' && dist < 90 && Math.abs((hero.y + hero.h) - malboro.y) < 35) {
                inflictDamage(18, malboro.facing);
              }
              if (hero.isRespawning) return;
            }
            if (malboro.animFrame >= act.count) {
              malboro.state = 'idle';
              malboro.animFrame = 0;
              malboro.stateTimer = 75;
            }
          }
        }
      }
    }

    // 2. Gargoyle (Room 3)
    if (currentRoom === 3) {
      if (!gargoyle.spawned && gargoyle.alive && hero.x > 2300) {
        if (!gargoyle.hintTimer || gargoyle.hintTimer <= 0) {
          gargoyle.hintTimer = 120;
          addFloatingPopup('⚠️ COLLECT BOTH ORBS (EMERALD & VIOLET) TO AWAKEN GARGOYLE!', hero.x, hero.y - 30, '#10b981');
        }
      }
      if (gargoyle.hintTimer > 0) gargoyle.hintTimer -= dt * 60;

      if (gargoyle.active) {
        // Pusing menghadap hero HANYA semasa gargoyle masih hidup (serpihan batu mati tidak pusing ikut hero!)
        if (gargoyle.alive) {
          gargoyle.facing = hero.x < gargoyle.x ? -1 : 1;
        }

        if (!gargoyle.alive) {
          const gAct = GARGOYLE_CONFIG.actions.defeat;
          gargoyle.animTimer += dt;
          if (gargoyle.animTimer >= 1 / gAct.fps) {
            gargoyle.animTimer = 0;
            if (gargoyle.animFrame < gAct.count - 1) gargoyle.animFrame++;
          }
        } else {
          const dist = Math.abs(hero.x - gargoyle.x);
          gargoyle.stateTimer -= dt * 60;
          gargoyle.animTimer += dt;

          // Gargoyle mengintai dan mendekati hero
          if (gargoyle.state === 'idle') {
            tickBossIdle(gargoyle, GARGOYLE_CONFIG.actions.idle, dt);
            if (dist > 90) gargoyle.x += gargoyle.facing * 1.3;
            gargoyle.x = Math.max(2020, Math.min(2650, gargoyle.x));

            if (gargoyle.stateTimer <= 0) {
              gargoyle.state = dist < 110 ? 'slash' : 'roar';
              gargoyle.animFrame = 0;
              gargoyle.animTimer = 0;
            }
          } else if (gargoyle.state === 'slash' || gargoyle.state === 'roar') {
            if (gargoyle.state === 'slash') gargoyle.x += gargoyle.facing * 2.2;
            const act = GARGOYLE_CONFIG.actions[gargoyle.state];
            if (gargoyle.animTimer >= 1 / act.fps) {
              gargoyle.animTimer = 0;
              gargoyle.animFrame++;
              if ((gargoyle.animFrame === 2 || gargoyle.animFrame === 3) && dist < 115) {
                inflictDamage(20, gargoyle.facing);
                if (hero.isRespawning) return;
              }
              if (gargoyle.animFrame >= act.count) {
                gargoyle.state = 'idle';
                gargoyle.animFrame = 0;
                gargoyle.stateTimer = 80;
              }
            }
          }
        }
      }
    }

    // 3. Shadow Templar Nazgûl (Room 4)
    if (currentRoom === 4) {
      if (!templar.spawned && templar.alive && hero.x > 2400) {
        if (!templar.hintTimer || templar.hintTimer <= 0) {
          templar.hintTimer = 120;
          addFloatingPopup('⚠️ COLLECT GOLDEN ORB TO AWAKEN SHADOW TEMPLAR!', hero.x, hero.y - 30, '#f59e0b');
        }
      }
      if (templar.hintTimer > 0) templar.hintTimer -= dt * 60;

      if (templar.active) {
        if (!templar.alive) {
          const tAct = TEMPLAR_CONFIG.actions.defeat;
          templar.animTimer += dt;
          if (templar.animTimer >= 1 / tAct.fps) {
            templar.animTimer = 0;
            if (templar.animFrame < tAct.count - 1) templar.animFrame++;
          }
        } else {
          // Pusing kuda menghadap hero
          if (templar.state !== 'charge') {
            templar.facing = hero.x < templar.x ? -1 : 1;
          }

          const dist = Math.abs(hero.x - templar.x);
          templar.stateTimer -= dt * 60;
          templar.animTimer += dt;

          if (templar.state === 'idle') {
            tickBossIdle(templar, TEMPLAR_CONFIG.actions.idle, dt);
            // Kuda melangkah perlahan menghampiri hero
            templar.x += templar.facing * 1.1;
            templar.x = Math.max(2120, Math.min(2750, templar.x));

            if (templar.stateTimer <= 0) {
              templar.state = dist > 140 ? 'charge' : 'stomp';
              templar.animFrame = 0;
              templar.animTimer = 0;
            }
          } else if (templar.state === 'charge') {
            // Memecut kuda mengikut arah hadapan
            templar.x += templar.facing * 4.2;
            const act = TEMPLAR_CONFIG.actions.charge;
            if (templar.animTimer >= 1 / act.fps) {
              templar.animTimer = 0;
              templar.animFrame++;
              if (dist < 95) {
                inflictDamage(22, templar.facing);
                if (hero.isRespawning) return;
              }
              if (templar.animFrame >= act.count || templar.x < 2100 || templar.x > 2760) {
                templar.state = 'idle';
                templar.animFrame = 0;
                templar.stateTimer = 70;
                templar.x = Math.max(2120, Math.min(2750, templar.x));
              }
            }
          } else if (templar.state === 'stomp') {
            const act = TEMPLAR_CONFIG.actions.stomp;
            if (templar.animTimer >= 1 / act.fps) {
              templar.animTimer = 0;
              templar.animFrame++;
              if ((templar.animFrame === 2 || templar.animFrame === 3) && dist < 120) {
                inflictDamage(26, templar.facing);
                camera.shakeFrames = 14;
                camera.shakeMag = 5;
                if (hero.isRespawning) return;
              }
              if (templar.animFrame >= act.count) {
                templar.state = 'idle';
                templar.animFrame = 0;
                templar.stateTimer = 75;
              }
            }
          }
        }
      }
    }

    // 4. The Sovereign Diablos (Room 6)
    if (currentRoom === 6 && diablos.active) {
      if (diablos.state === 'emerging') { diablos.animTimer += dt; tickBossIdle(diablos, DIABLOS_CONFIG.actions.idle, dt); }
      if (diablos.state === 'emerging') {
        // 👈 Deep emerge ritual: bermula dari Y: 620 naik perlahan ke paras lantai Y: 380
        diablos.stateTimer -= dt * 60;
        diablos.emergeY -= 0.48; // Naik perlahan dari kedalaman bawah lantai
        if (Math.floor(performance.now() / 200) % 2 === 0) {
          camera.shakeFrames = 4;
          camera.shakeMag = 2;
        }

        if (diablos.emergeY <= diablos.baseY || diablos.stateTimer <= 0) {
          diablos.emergeY = diablos.baseY;
          diablos.y = diablos.baseY;
          diablos.state = 'idle';
          diablos.stateTimer = 70;
          camera.shakeFrames = 35;
          camera.shakeMag = 8;
          addFloatingPopup('THE SOVEREIGN AWAKENS!', diablos.x, diablos.y - 180, '#fbbf24');
          updateHud();
        }
      } else if (!diablos.alive) {
        const dAct = DIABLOS_CONFIG.actions.defeat;
        diablos.animTimer += dt;
        if (diablos.animTimer >= 1 / dAct.fps) {
          diablos.animTimer = 0;
          if (diablos.animFrame < dAct.count - 1) {
            diablos.animFrame++;
          } else if (!diablos.batExplosionTriggered) {
            diablos.batExplosionTriggered = true;
            diablos.visible = false;
            triggerDiablosBatExplosion(diablos.x, diablos.y);

            setTimeout(() => {
              masterScroll.unlocked = true;
              AudioEngine.victory();
              addFloatingPopup('MASTER CAREER SCROLL DESCENDS!', masterScroll.x, 380, '#f59e0b');
            }, 1800);
          }
        }
      } else {
        // Pusing menghadap hero
        diablos.facing = hero.x < diablos.x ? -1 : 1;

        const dist = Math.abs(hero.x - diablos.x);
        diablos.stateTimer -= dt * 60;
        diablos.animTimer += dt;

        // Terapung melayang menghampiri hero
        if (diablos.state === 'idle') {
          tickBossIdle(diablos, DIABLOS_CONFIG.actions.idle, dt);
          diablos.y = diablos.baseY + Math.sin(performance.now() * 0.0035) * 14;
          if (dist > 130) diablos.x += diablos.facing * 1.2;
          diablos.x = Math.max(3980, Math.min(4680, diablos.x));

          if (diablos.stateTimer <= 0) {
            diablos.state = Math.random() > 0.45 ? 'voidOrb' : 'voidPillars';
            diablos.animFrame = 0;
            diablos.animTimer = 0;
            if (diablos.state === 'voidPillars') {
              spawnEruptingPillars();
            }
          }
        } else if (diablos.state === 'voidOrb') {
          const act = DIABLOS_CONFIG.actions.voidOrb;
          if (diablos.animTimer >= 1 / act.fps) {
            diablos.animTimer = 0;
            diablos.animFrame++;
            if (diablos.animFrame === 4) {
              voidProjectiles.push({
                x: diablos.x + (diablos.facing === 1 ? 70 : -70),
                y: diablos.y + 8, // 👈 Dilaraskan agar sejajar dengan paras dada hero (Y ~ 410) pada baseY baharu
                vx: diablos.facing * 5.8, // 👈 Tembak ikut arah hadapan
                frame: 0,
                animTimer: 0,
                radius: 30,
                life: 100
              });
              AudioEngine.playTone(180, 0.4, 'sawtooth', 60, 0.25);
            }
            if (diablos.animFrame >= act.count) {
              diablos.state = 'idle';
              diablos.animFrame = 0;
              diablos.stateTimer = 65;
            }
          }
        } else if (diablos.state === 'voidPillars') {
          const act = DIABLOS_CONFIG.actions.voidPillars;
          if (diablos.animTimer >= 1 / act.fps) {
            diablos.animTimer = 0;
            diablos.animFrame++;
            if (diablos.animFrame === 2) {
              camera.shakeFrames = 20;
              camera.shakeMag = 6;
            }
            if (diablos.animFrame >= act.count) {
              diablos.state = 'idle';
              diablos.animFrame = 0;
              diablos.stateTimer = 70;
            }
          }
        }
      }
    }

    // Tiang Lohong Erupting Pillars (Page 6)
    for (let i = independentPillars.length - 1; i >= 0; i--) {
      const pil = independentPillars[i];
      if (pil.stage === 'warning') {
        pil.timer -= dt;
        if (pil.timer <= 0) {
          pil.stage = 'erupt';
          pil.frame = 1;
          camera.shakeFrames = 18;
          camera.shakeMag = 6;
        }
      } else if (pil.stage === 'erupt') {
        pil.animTimer += dt;
        if (pil.animTimer >= 0.08) {
          pil.animTimer = 0;
          pil.frame++;
          if (pil.frame >= 6) {
            independentPillars.splice(i, 1);
            continue;
          }
        }

        const hMidX = hero.x + hero.w * 0.5;
        if (Math.abs(hMidX - pil.x) < pil.width * 0.5 && hero.grounded && hero.invulnFrames <= 0) {
          inflictDamage(28, hero.x < pil.x ? -1 : 1);
          if (hero.isRespawning) return;
        }
      }
    }

    // Bebola Gravija / Void Projectiles (Page 6)
    for (let i = voidProjectiles.length - 1; i >= 0; i--) {
      const p = voidProjectiles[i];
      p.x += p.vx;
      p.animTimer = (p.animTimer || 0) + dt;
      if (p.animTimer >= 0.07) {
        p.animTimer = 0;
        p.frame = ((p.frame || 0) + 1) % 6;
      }
      p.life--;
      if (hero.invulnFrames <= 0 && Math.hypot((hero.x + hero.w * 0.5) - p.x, (hero.y + hero.h * 0.5) - p.y) < p.radius + 25) {
        inflictDamage(26, p.vx > 0 ? 1 : -1);
        p.life = 0;
        if (hero.isRespawning) return;
      }
      if (p.life <= 0) voidProjectiles.splice(i, 1);
    }

    // Interaksi Master Career Scroll AXWORLD (Pillar 7: Strict [E] Interaction, No Auto-Opening)
    if (masterScroll.unlocked && !masterScroll.opened) {
      masterScroll.hoverOffset = Math.sin(performance.now() * 0.005) * 6;
      const scrollY = 380 + masterScroll.hoverOffset;
      const dist = Math.hypot((hero.x + hero.w * 0.5) - masterScroll.x, (hero.y + hero.h * 0.5) - scrollY);
      const prompt = document.getElementById('interactPrompt');

      if (dist < 85) {
        if (prompt) {
          const promptInner = document.getElementById('interactPromptText') || prompt.querySelector('div') || prompt;
          promptInner.textContent = isTouchDevice ? '📜 TAP [INTERACT] TO UNSEAL MASTER SCROLL' : '📜 PRESS [E] TO UNSEAL MASTER SCROLL';
          prompt.classList.remove('hidden');
        }
        if (input.interactPressed && masterScroll.state === 'floating') {
          masterScroll.state = 'unsealing';
          masterScroll.frameIdx = 0;
          masterScroll.animTimer = 0;
          AudioEngine.sealCrack();
        }
      } else {
        if (prompt) prompt.classList.add('hidden');
      }

      if (masterScroll.state === 'unsealing') {
        const scAct = SCROLL_CONFIG.actions.unsealing;
        masterScroll.animTimer += dt;
        if (masterScroll.animTimer >= 1 / scAct.fps) {
          masterScroll.animTimer = 0;
          masterScroll.frameIdx++;
          if (masterScroll.frameIdx >= scAct.frames.length) {
            masterScroll.opened = true;
            masterScroll.state = 'opened';
            masterScroll.frameIdx = 0;
            const modal = document.getElementById('scrollModal');
            if (modal) {
              modal.style.setProperty('display', 'flex', 'important');
              modal.classList.remove('hidden');
            }
            if (prompt) prompt.classList.add('hidden');
            AudioEngine.victory();
          }
        }
      } else if (masterScroll.state === 'floating') {
        const scAct = SCROLL_CONFIG.actions.floating;
        masterScroll.animTimer += dt;
        if (masterScroll.animTimer >= 1 / scAct.fps) {
          masterScroll.animTimer = 0;
          masterScroll.frameIdx = (masterScroll.frameIdx + 1) % scAct.frames.length;
        }
      }
    }
    input.interactPressed = false;

    // Logik Transisi Bilik & Kunci Sempadan (Blockage Anti-Backtrack Setiap Halaman)
    if (!lift.moving) {
      if (hero.y > 500) {
        if (maxRoomReached < 2 && hero.x < 960) {
          currentRoom = 1;
        } else if (maxRoomReached < 3 && hero.x < 1920) {
          if (currentRoom === 1 && maxRoomReached < 2) {
            maxRoomReached = 2;
            AudioEngine.bridgeThud();
            camera.shakeFrames = 10;
            camera.shakeMag = 4;
            addFloatingPopup('OUTER GATES SEALED! (NO RETURN)', hero.x + 20, hero.y - 30, '#ef4444');
          }
          currentRoom = 2;
        } else {
          if (currentRoom === 2 && maxRoomReached < 3) {
            maxRoomReached = 3;
            AudioEngine.bridgeThud();
            camera.shakeFrames = 10;
            camera.shakeMag = 4;
            addFloatingPopup('PORTCULLIS DROPPED! (NO RETURN)', hero.x + 20, hero.y - 30, '#ef4444');
          }
          currentRoom = 3;
        }
      } else {
        if (maxRoomReached < 5 && hero.x < 2880) {
          currentRoom = 4;
          maxRoomReached = Math.max(maxRoomReached, 4);
        } else if (maxRoomReached < 6 && hero.x < 3840) {
          if (currentRoom === 4 && maxRoomReached < 5) {
            maxRoomReached = 5;
            grandDoor.open = false; // Pintu gerbang terkunci rapat di belakang hero
            AudioEngine.runeFlash();
            camera.shakeFrames = 10;
            camera.shakeMag = 4;
            addFloatingPopup('GRAND DOORS SEALED! (NO RETURN)', hero.x + 20, hero.y - 30, '#ef4444');
          }
          currentRoom = 5;
        } else {
          if (currentRoom === 5 && maxRoomReached < 6) {
            maxRoomReached = 6;
            AudioEngine.portalWhoosh();
            camera.shakeFrames = 14;
            camera.shakeMag = 5;
            addFloatingPopup('VOID CHAMBER SEALED! (NO RETURN)', hero.x + 20, hero.y - 30, '#ef4444');
          }
          currentRoom = 6;
        }
      }
    }

    // Sekat pergerakan hero agar sama sekali tidak boleh menembus ke belakang melepasi halaman terkunci
    if (hero.x < minAllowedX) {
      hero.x = minAllowedX;
      if (hero.vx < 0) hero.vx = 0;
    }

    // Sekat tingkat jika sudah berada di Tingkat Atas (Room 4 & seterusnya)
    if (maxRoomReached >= 4 && hero.y > 510) {
      hero.y = 410 - hero.h;
      hero.vy = 0;
    }

    const roomCameraBounds = {
      1: { x: 0,    y: 540 },
      2: { x: 960,  y: 540 },
      3: { x: 1920, y: 540 },
      4: { x: 1920, y: 0 },
      5: { x: 2880, y: 0 },
      6: { x: 3840, y: 0 }
    };

    const targetCam = roomCameraBounds[currentRoom] || { x: 0, y: 540 };
    if (!lift.moving) {
      camera.targetX = targetCam.x;
      camera.targetY = targetCam.y;
    }

    camera.x += (camera.targetX - camera.x) * 0.09;
    camera.y += (camera.targetY - camera.y) * 0.09;
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
    const bFill = document.getElementById('bossHpFill');
    const bTxt = document.getElementById('bossHpText');
    const bName = document.getElementById('bossNameText');

    let curBoss = null;
    let bTitle = '';
    if (currentRoom === 1 && malboro.alive && malboro.active) { curBoss = malboro; bTitle = '👾 MALBORO: POISON MAW'; }
    else if (currentRoom === 3 && gargoyle.alive && gargoyle.active) { curBoss = gargoyle; bTitle = '🗿 STONE GARGOYLE'; }
    else if (currentRoom === 4 && templar.alive && templar.active) { curBoss = templar; bTitle = '🐎 SHADOW TEMPLAR NAZGÛL'; }
    else if (currentRoom === 6 && diablos.alive && diablos.active && diablos.state !== 'emerging') {
      curBoss = diablos; bTitle = '👑 THE SOVEREIGN DIABLOS';
    }

    if (bossHud && curBoss) {
      bossHud.classList.remove('hidden');
      if (bName) bName.innerHTML = bTitle;
      if (bFill) bFill.style.width = `${Math.max(0, (curBoss.hp / curBoss.maxHp) * 100)}%`;
      if (bTxt) bTxt.textContent = `${Math.ceil(curBoss.hp)} / ${curBoss.maxHp}`;
    } else if (bossHud) {
      bossHud.classList.add('hidden');
    }
  }

  // ===================================================================
  // 9. RENDER LOOP
  // ===================================================================
  function render() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    let sx = 0, sy = 0;
    if (camera.shakeFrames > 0 && !isGamePaused) {
      sx = (Math.random() - 0.5) * camera.shakeMag * 2;
      sy = (Math.random() - 0.5) * camera.shakeMag * 2;
    }

    ctx.translate(sx - Math.round(camera.x), -Math.round(camera.y + sy));

    const bgs = {
      1: { img: Loaded.get('bg1'), x: 0,    y: 540 },
      2: { img: Loaded.get('bg2'), x: 960,  y: 540 },
      3: { img: Loaded.get('bg3'), x: 1920, y: 540 },
      4: { img: Loaded.get('bg4'), x: 1920, y: 0 },
      5: { img: Loaded.get('bg5'), x: 2880, y: 0 },
      6: { img: Loaded.get('bg6'), x: 3840, y: 0 }
    };

    for (let r = 1; r <= 6; r++) {
      const b = bgs[r];
      if (b.img) {
        ctx.drawImage(b.img, b.x, b.y, 960, 540);
      } else {
        ctx.fillStyle = r >= 4 ? '#160824' : '#0c0b18';
        ctx.fillRect(b.x, b.y, 960, 540);
      }
    }

    // Drawbridge (Page 1)
    const bridgeImg = Loaded.get('drawbridge');
    if (bridgeImg) {
      ctx.save();
      ctx.translate(drawbridge.x, drawbridge.y);
      ctx.rotate((drawbridge.angle * Math.PI) / 180);
      ctx.drawImage(bridgeImg, -220, -12, 220, 24);
      ctx.restore();
    }

    // Lif Rahsia (Page 3 & Page 4)
    if ((currentRoom === 3 && lift.phase === 1) || (currentRoom === 4 && (!lift.completed || lift.phase === 2))) {
      ctx.save();
      ctx.fillStyle = '#1e1b2e';
      ctx.fillRect(lift.x, lift.y, lift.w, lift.h);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(lift.x + 4, lift.y + 4, lift.w - 8, 4);
      // Kabel lif tegak ke siling
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lift.x + 16, currentRoom === 4 ? 0 : 540);
      ctx.lineTo(lift.x + 16, lift.y);
      ctx.moveTo(lift.x + lift.w - 16, currentRoom === 4 ? 0 : 540);
      ctx.lineTo(lift.x + lift.w - 16, lift.y);
      ctx.stroke();
      ctx.restore();
    }

    // Portal Vortex & Magic Circle Ascension Beam (Page 5)
    if (portal.active) {
      // 1. Tiang Cahaya Sihir Memancar ke Langit (Vertical Arcane Beam dari Y: 365)
      ctx.save();
      const beamGrad = ctx.createLinearGradient(portal.x - 70, 0, portal.x + 70, 0);
      beamGrad.addColorStop(0, 'rgba(147, 51, 234, 0)');
      beamGrad.addColorStop(0.2, 'rgba(192, 132, 252, 0.45)');
      beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
      beamGrad.addColorStop(0.8, 'rgba(192, 132, 252, 0.45)');
      beamGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(portal.x - 65, 0, 130, 365);

      // 2. Lingkaran Sihir & Pusaran Portal (Magic Circle Vortex)
      ctx.translate(portal.x, portal.y);
      ctx.rotate(portal.vortexAngle);

      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, portal.radius);
      grad.addColorStop(0, '#020108');
      grad.addColorStop(0.5, '#7e22ce');
      grad.addColorStop(0.8, '#c084fc');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Orbs
    const orbSheet = Loaded.get('orbs');
    orbs.forEach((o, idx) => {
      if (!o.collected && o.room === currentRoom) {
        const bob = Math.sin(performance.now() * 0.005 + idx * 1.5) * 6;
        const oy = Math.round(o.y + bob);

        ctx.save();
        ctx.fillStyle = o.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(o.x, oy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (orbSheet && orbSheet.naturalWidth > 0) {
          const cW = Math.floor(orbSheet.naturalWidth / 7);
          const cH = Math.floor(orbSheet.naturalHeight / 5);
          const f = Math.floor(performance.now() * 0.008 + idx) % 7;
          ctx.drawImage(orbSheet, f * cW, o.row * cH, cW, cH, o.x - 36, oy - 36, 72, 72);
        } else {
          ctx.fillStyle = o.color;
          ctx.beginPath();
          ctx.arc(o.x, oy, 16, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });

    // Goblins
    const gobSheet = Loaded.get('goblin');
    goblins.forEach(g => {
      if (g.state === 'dead_poof' || g.room !== currentRoom) return;
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

    // Malboro (Page 1) - Saiz Proporsional Penuh
    const mb1Sheet = Loaded.get('mb1');
    if (currentRoom === 1 && malboro.active && mb1Sheet) {
      const act = MALBORO_CONFIG.actions[malboro.state] || MALBORO_CONFIG.actions.idle;
      const cellW = mb1Sheet.naturalWidth / MALBORO_CONFIG.cols;
      const cellH = mb1Sheet.naturalHeight / MALBORO_CONFIG.rows;
      const sx = Math.floor((act.startCol + malboro.animFrame) * cellW);
      const sy = Math.floor(act.row * cellH);

      ctx.save();
      ctx.translate(Math.round(malboro.x + malboro.w * 0.5), Math.round(malboro.y));
      ctx.scale(malboro.facing, 1);
      ctx.drawImage(
        mb1Sheet,
        sx, sy, cellW, cellH,
        MALBORO_CONFIG.offsetX, MALBORO_CONFIG.offsetY, MALBORO_CONFIG.renderW, MALBORO_CONFIG.renderH
      );
      ctx.restore();
    }

    // Gargoyle (Page 3) - Saiz Proporsional Penuh
    const mb2Sheet = Loaded.get('mb2');
    if (currentRoom === 3 && gargoyle.active && mb2Sheet) {
      const act = GARGOYLE_CONFIG.actions[gargoyle.state] || GARGOYLE_CONFIG.actions.idle;
      const cellW = mb2Sheet.naturalWidth / GARGOYLE_CONFIG.cols;
      const cellH = mb2Sheet.naturalHeight / GARGOYLE_CONFIG.rows;
      const sx = Math.floor((act.startCol + gargoyle.animFrame) * cellW);
      const sy = Math.floor(act.row * cellH);

      ctx.save();
      ctx.translate(Math.round(gargoyle.x + gargoyle.w * 0.5), Math.round(gargoyle.y));
      ctx.scale(gargoyle.facing, 1);
      ctx.drawImage(
        mb2Sheet,
        sx, sy, cellW, cellH,
        GARGOYLE_CONFIG.offsetX, GARGOYLE_CONFIG.offsetY, GARGOYLE_CONFIG.renderW, GARGOYLE_CONFIG.renderH
      );
      ctx.restore();
    }

    // Shadow Templar (Page 4) - Saiz Proporsional Penuh
    const mb3Sheet = Loaded.get('mb3');
    if (currentRoom === 4 && templar.active && mb3Sheet) {
      const act = TEMPLAR_CONFIG.actions[templar.state] || TEMPLAR_CONFIG.actions.idle;
      const cellW = mb3Sheet.naturalWidth / TEMPLAR_CONFIG.cols;
      const cellH = mb3Sheet.naturalHeight / TEMPLAR_CONFIG.rows;
      const sx = Math.floor((act.startCol + templar.animFrame) * cellW);
      const sy = Math.floor(act.row * cellH);

      ctx.save();
      ctx.translate(Math.round(templar.x + templar.w * 0.5), Math.round(templar.y));
      ctx.scale(templar.facing, 1);
      ctx.drawImage(
        mb3Sheet,
        sx, sy, cellW, cellH,
        TEMPLAR_CONFIG.offsetX, TEMPLAR_CONFIG.offsetY, TEMPLAR_CONFIG.renderW, TEMPLAR_CONFIG.renderH
      );
      ctx.restore();
    }

    // Pintu Gerbang Kayu Besar Room 4 (Grand Citadel Doors) & Laluan Lif Selamat
    if (currentRoom === 4) {
      // 1. Laluan Lif & Safety Cage di hujung kiri (X = 1920..2020)
      ctx.save();
      // Platform lif stationed di aras Y: 410
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(1920, 410, 110, 14);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(1920, 410, 110, 14);
      // Palang besi keselamatan (Safety barrier/cage) di sebelah kiri lif
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(1940, 410); ctx.lineTo(1940, 310);
      ctx.moveTo(1965, 410); ctx.lineTo(1965, 310);
      ctx.moveTo(1990, 410); ctx.lineTo(1990, 310);
      ctx.moveTo(1935, 320); ctx.lineTo(1995, 320);
      ctx.moveTo(1935, 360); ctx.lineTo(1995, 360);
      ctx.stroke();
      // Lampu amaran lif
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(1965, 310, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Pintu Gerbang Kayu Besar Berkembar (Grand Citadel Arched Double Doors)
      // Selaras tepat dengan grafik latar belakang Page 4: X: 2733..2824, Y: 135..410
      const gd = grandDoor;
      const prog = gd.openProgress || (gd.open ? 1 : 0);
      const doorX = gd.x || 2736;
      const doorW = gd.w || 88;
      const floorYLeft = gd.floorYLeft || 386; const floorYRight = gd.floorYRight || 422; const floorY = (floorYLeft + floorYRight) * 0.5;
      const archY = gd.archY || 230;
      const apexY = gd.apexY || 154;
      const centerX = doorX + doorW * 0.5;

      if (prog > 0) {
        ctx.save();

        // Helper path untuk bentuk gerbang gothik melengkung tepat
        function drawGothicArchPath(c) {
          c.beginPath();
          c.moveTo(doorX, floorYLeft);
          c.lineTo(doorX, archY);
          c.quadraticCurveTo(doorX + 4, apexY + 26, centerX, apexY);
          c.quadraticCurveTo(doorX + doorW - 4, apexY + 26, doorX + doorW, archY + 8);
          c.lineTo(doorX + doorW, floorYRight);
          c.closePath();
        }

        // A. Limpahan Cahaya Bilik Takhta ke Atas Lantai Benteng (Floor Light Spill)
        // (Dibuang atas permintaan: tiada lampu/cahaya di lantai depan pintu)

        // B. Ruang Dalam Pintu Masuk ke Bilik Takhta (Throne Room Interior Corridor)
        ctx.save();
        drawGothicArchPath(ctx);
        ctx.clip();

        // Latar gelap koridor dalam istana
        const hallGrad = ctx.createLinearGradient(doorX, apexY, doorX, floorY);
        hallGrad.addColorStop(0, '#090312');
        hallGrad.addColorStop(0.6, '#180728');
        hallGrad.addColorStop(1, '#2c0b46');
        ctx.fillStyle = hallGrad;
        ctx.fillRect(doorX - 5, apexY - 5, doorW + 10, floorYRight - apexY + 10);

        // Karpet ungu bilik takhta terbentang ke dalam
        ctx.save();
        ctx.fillStyle = '#6b21a8';
        ctx.beginPath();
        ctx.moveTo(centerX - 24, floorY);
        ctx.lineTo(centerX - 12, floorY - 90);
        ctx.lineTo(centerX + 12, floorY - 90);
        ctx.lineTo(centerX + 24, floorY);
        ctx.closePath();
        ctx.fill();

        // Jalur emas sisi karpet
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 24, floorY); ctx.lineTo(centerX - 12, floorY - 90);
        ctx.moveTo(centerX + 24, floorY); ctx.lineTo(centerX + 12, floorY - 90);
        ctx.stroke();
        ctx.restore();

        // Cahaya keemasan lilin/chandalier bilik takhta bersinar dari dalam
        // (Tiada lampu/glow di dalam pintu atas permintaan)
        // innerGlow removed
        // innerGlow removed
        // innerGlow removed
        // innerGlow removed
        // innerGlow removed
        // innerGlow removed

        // C. Daun Pintu Kayu Berkembar Berayun Buka (3D Perspective Oak Door Leaves)
        const halfW = doorW * 0.5;
        const swingAngle = prog * (Math.PI * 0.48);
        const leafW = Math.max(3.5, halfW * Math.cos(swingAngle));

        // 1. Daun Pintu Kiri
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(doorX, floorYLeft);
        ctx.lineTo(doorX, archY);
        ctx.quadraticCurveTo(doorX + 2, apexY + 26, centerX, apexY);
        ctx.lineTo(centerX, floorY);
        ctx.closePath();
        ctx.clip();

        // Tekstur kayu oak gelap
        ctx.fillStyle = '#321c10';
        ctx.fillRect(doorX, apexY, leafW, floorYRight - apexY);
        ctx.strokeStyle = '#1d0f08';
        ctx.lineWidth = 1.5;
        for (let p = 0; p < leafW; p += Math.max(4, leafW * 0.32)) {
          ctx.beginPath(); ctx.moveTo(doorX + p, apexY); ctx.lineTo(doorX + p, floorY); ctx.stroke();
        }

        // Engsel besi hiasan (3 wrought-iron strap hinges)
        const hingeYs = [apexY + 50, (apexY + floorY) * 0.5, floorY - 50];
        ctx.fillStyle = '#1e293b';
        hingeYs.forEach(hy => {
          ctx.fillRect(doorX, hy - 4, leafW * 0.85, 8);
          ctx.fillStyle = '#475569';
          ctx.fillRect(doorX + leafW * 0.85 - 3, hy - 5, 4, 10);
          ctx.fillStyle = '#1e293b';
        });

        // Pemegang gelang besi (iron ring knocker)
        if (prog < 0.75) {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(doorX + leafW - 6, (apexY + floorY) * 0.5 + 4, 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Bevel bayang 3D tebal pintu
        ctx.fillStyle = 'rgba(10, 5, 2, 0.75)';
        ctx.fillRect(doorX + leafW - 2.5, apexY, 2.5, floorY - apexY);
        ctx.restore();

        // 2. Daun Pintu Kanan
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, floorY);
        ctx.lineTo(centerX, apexY);
        ctx.quadraticCurveTo(doorX + doorW - 2, apexY + 26, doorX + doorW, archY + 8);
        ctx.lineTo(doorX + doorW, floorYRight);
        ctx.closePath();
        ctx.clip();

        const rightDoorX = doorX + doorW - leafW;
        ctx.fillStyle = '#321c10';
        ctx.fillRect(rightDoorX, apexY, leafW, floorYRight - apexY);
        ctx.strokeStyle = '#1d0f08';
        ctx.lineWidth = 1.5;
        for (let p = 0; p < leafW; p += Math.max(4, leafW * 0.32)) {
          ctx.beginPath(); ctx.moveTo(rightDoorX + p, apexY); ctx.lineTo(rightDoorX + p, floorY); ctx.stroke();
        }

        // Engsel besi kanan
        ctx.fillStyle = '#1e293b';
        hingeYs.forEach(hy => {
          ctx.fillRect(rightDoorX + leafW * 0.15, hy - 4, leafW * 0.85, 8);
          ctx.fillStyle = '#475569';
          ctx.fillRect(rightDoorX + leafW * 0.15 - 1, hy - 5, 4, 10);
          ctx.fillStyle = '#1e293b';
        });

        // Pemegang gelang besi kanan
        if (prog < 0.75) {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rightDoorX + 6, (apexY + floorY) * 0.5 + 4, 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Bevel bayang 3D tebal pintu
        ctx.fillStyle = 'rgba(10, 5, 2, 0.75)';
        ctx.fillRect(rightDoorX, apexY, 2.5, floorY - apexY);
        ctx.restore();

        ctx.restore(); // Tutup clip arch

        // D. Garisan Bayang Luaran Pintu Terbuka & Cahaya Sisi
        // D. Tiada garisan cahaya/glow luaran di sekeliling pintu
        // (arch glow removed)

        ctx.restore();
      }
    }

    // Tiang Lohong Erupting Pillars (Page 6)
    const atkSheet = Loaded.get('boss_atk');
    if (currentRoom === 6) {
      independentPillars.forEach(pil => {
        ctx.save();
        if (pil.stage === 'warning') {
          const pulse = Math.sin(performance.now() * 0.03) > 0;
          ctx.fillStyle = pulse ? 'rgba(239, 68, 68, 0.85)' : 'rgba(168, 85, 247, 0.85)';
          ctx.fillRect(pil.x - pil.width * 0.5, 448, pil.width, 6);
        } else if (atkSheet && atkSheet.naturalWidth > 0) {
          const fW = atkSheet.naturalWidth / 6;
          const fH = atkSheet.naturalHeight / 3;
          const sy = 1 * fH; // Row 1: Void Pillar
          const sx = (pil.frame || 0) * fW;
          const renderH = 340;
          const renderW = 110;
          ctx.drawImage(atkSheet, sx, sy, fW, fH, Math.round(pil.x - renderW * 0.5), 450 - renderH, renderW, renderH);
        }
        ctx.restore();
      });
    }

    // The Sovereign Diablos (Page 6) - Saiz Proporsional Penuh & Topeng Lantai
    const bossSheet = Loaded.get('boss');
    if (currentRoom === 6 && diablos.active && diablos.visible && bossSheet) {
      const act = DIABLOS_CONFIG.actions[diablos.state] || DIABLOS_CONFIG.actions.idle;
      const cellW = bossSheet.naturalWidth / DIABLOS_CONFIG.cols;
      const cellH = bossSheet.naturalHeight / DIABLOS_CONFIG.rows;

      // Kalibrasi bersih: gunakan customBoxes untuk idle supaya sayap tidak terpotong & tiada bleed sprite sebelah
      const box = act.customBoxes && act.customBoxes[diablos.animFrame % act.customBoxes.length];
      const cropX = box ? box.sx : Math.floor(diablos.animFrame * cellW); const cropW = box ? box.sw : cellW;
      const cropY = Math.floor(act.row * cellH);

      const drawY = diablos.state === 'emerging' ? diablos.emergeY : diablos.y;
      const renderW = box ? Math.round(DIABLOS_CONFIG.renderSize * (cropW / cellW)) : DIABLOS_CONFIG.renderSize;
      const renderH = Math.round(DIABLOS_CONFIG.renderSize * (cellH / cellW));

      ctx.save();

      // 👈 Deep emerge ritual floor clipping mask at Y: 450
      // Hanya bahagian tubuh yang dah naik melepasi paras lantai Y: 450 sahaja yang nampak!
      if (diablos.state === 'emerging') {
        ctx.beginPath();
        ctx.rect(3840, 0, VIEW_W, 450); // Topeng sempadan lantai Room 6 (Y: 450)
        ctx.clip();
      }

      ctx.translate(Math.round(diablos.x), Math.round(drawY));
      ctx.scale(diablos.facing, 1);
      ctx.drawImage(
        bossSheet,
        cropX, cropY, cropW, cellH,
        -Math.round(renderW * 0.5), -Math.round(renderH * 0.85),
        renderW, renderH
      );
      ctx.restore();
    }

    // Bebola Gravija / Void Projectiles (Page 6)
    if (currentRoom === 6) {
      voidProjectiles.forEach(p => {
        ctx.save();
        if (atkSheet && atkSheet.naturalWidth > 0) {
          const fW = atkSheet.naturalWidth / 6;
          const fH = atkSheet.naturalHeight / 3;
          const sx = (p.frame || 0) * fW;
          const sy = 0 * fH; // Row 0: Gravija Orb
          ctx.drawImage(atkSheet, sx, sy, fW, fH, Math.round(p.x - 45), Math.round(p.y - 45), 90, 90);
        } else {
          const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.radius);
          grad.addColorStop(0, '#f5d0fe');
          grad.addColorStop(0.4, '#a855f7');
          grad.addColorStop(0.8, '#581c87');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // Kelawar Swarm Diablos
    batSwarm.forEach(bat => bat.draw(ctx));

    // Kepulan Asap Berbisa Malboro (Room 1)
    if (currentRoom === 1) {
      malboroSmoke.forEach(s => s.draw(ctx));
    }

    // MASTER CAREER SCROLL DILUKIS MENGIKUT ASPECT RATIO ASAL & FRAME ANIMASI
    const scrollSheet = Loaded.get('scroll');
    if (currentRoom === 6 && masterScroll.unlocked && scrollSheet) {
      const sy = 380 + masterScroll.hoverOffset;
      const scAct = SCROLL_CONFIG.actions[masterScroll.state] || SCROLL_CONFIG.actions.floating;
      const targetFrame = (scAct && scAct.frames && scAct.frames[masterScroll.frameIdx] !== undefined)
        ? scAct.frames[masterScroll.frameIdx]
        : 0;

      const cellW = Math.floor(scrollSheet.naturalWidth / SCROLL_CONFIG.cols);
      const cellH = Math.floor(scrollSheet.naturalHeight / SCROLL_CONFIG.rows);
      const aspect = cellW / cellH;
      const renderH = SCROLL_CONFIG.renderH;
      const renderW = Math.round(renderH * aspect); // Nisbah tepat

      ctx.save();
      ctx.drawImage(
        scrollSheet,
        targetFrame * cellW, 0, cellW, cellH,
        Math.round(masterScroll.x - renderW * 0.5), Math.round(sy - renderH * 0.5), renderW, renderH
      );
      ctx.restore();
    }

    // Hero Azzumie
    const heroSheet = Loaded.get('hero');
    if (heroSheet) {
      if (!(hero.invulnFrames > 0 && !hero.isRespawning && Math.floor(hero.invulnFrames / 4) % 2 === 1)) {
        const act = HERO_CONFIG.actions[hero.state] || HERO_CONFIG.actions.idle;
        // 👈 DIBAIKI: safeFrame menjamin frame sentiasa sah (elak hero hilang ketika lompat / bertukar aksi)
        const safeFrame = Math.min(hero.animFrame, (act.count || 1) - 1);
        const colsInRow = act.cols || 10;
        const cellW = act.cellW || Math.floor(heroSheet.naturalWidth / colsInRow);
        const cellH = Math.floor(heroSheet.naturalHeight / HERO_CONFIG.rows);
        // 👈 DIBAIKI: customSx untuk hurt & defeat mengekstrak tengah watak tepat (tiada belahan/hirisan)
        const sx = act.customSx ? act.customSx[safeFrame] : Math.floor((act.startCol + safeFrame) * cellW);
        const sy = Math.floor(act.row * cellH);

        ctx.save();
        if (currentRoom === 5 && portal.active) {
          const fadeProg = Math.min(1.0, Math.max(0, portal.activationTimer / 2.0));
          ctx.globalAlpha = Math.max(0, 1.0 - fadeProg);
        }
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

    // Debug Hitbox [G]
    if (showDebug) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.font = '7px "Press Start 2P"';

      platforms.forEach(p => {
        ctx.strokeStyle = '#22c55e';
        if (p.type === 'ramp') {
          ctx.beginPath();
          ctx.moveTo(p.x1, p.y1);
          ctx.lineTo(p.x2, p.y2);
          ctx.stroke();
        } else {
          ctx.strokeRect(p.x, p.y, p.w, p.h);
        }
      });

      solidWalls.forEach(w => {
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      });

      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(hero.x, hero.y, hero.w, hero.h);
      ctx.restore();
    }

    ctx.restore();

    // Lapisan Skrin Gelap Transisi (Fade to Black)
    if (screenFade.alpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, Math.max(0, screenFade.alpha))})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.restore();
    }
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
    if (ctx) {
      ctx.fillStyle = '#080c18';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CITADEL LOADING...', VIEW_W / 2, VIEW_H / 2 - 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('STAGE 5: THE DARK IMPERIAL CITADEL', VIEW_W / 2, VIEW_H / 2 + 18);
    }

    Loaded.init(() => {
      renderPortrait();
      updateHud();
      AudioEngine.init();

      const unlockAudio = () => {
        AudioEngine.init();
        const startBgm = (currentRoom === 1 && malboro.active && malboro.alive) ? 'miniboss' : (AudioEngine.mode || 'stage');
        AudioEngine.playBgm(startBgm);
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