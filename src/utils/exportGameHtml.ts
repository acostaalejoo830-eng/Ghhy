import { TerrainEngine } from './terrainEngine';
import { PlacedCharacter, CustomGlbExportData } from '../types/character';

/**
 * Fast & safe conversion of ArrayBuffer to base64 string
 * handles large buffers in 8KB chunks to prevent maximum call stack size exceeded.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Generates and triggers the download of a standalone full-screen 3D game file.
 * Opens with the military Hangar Base Lobby matching the reference image,
 * where the user can inspect the robot on the base, test all animations,
 * switch between different robot presets (or custom imported GLB),
 * and launch into the 3D sculpted mountain terrain by clicking the glowing Start/Jugar button!
 */
export function downloadStandaloneGame(
  terrainEngine: TerrainEngine,
  activePresetId: string = 'mecha',
  placedCharacters: PlacedCharacter[] = [],
  customGlbData?: CustomGlbExportData | null
): void {
  const heightData = terrainEngine.exportHeightArray();
  const heightJson = JSON.stringify(heightData);
  const placedJson = JSON.stringify(placedCharacters);

  // Convert custom GLB files to base64 if present
  let baseModelBase64: string | null = null;
  let idleAnimBase64: string | null = null;
  let walkAnimBase64: string | null = null;
  let jumpAnimBase64: string | null = null;
  let attackAnimBase64: string | null = null;

  if (customGlbData) {
    if (customGlbData.baseModelBuffer) {
      try {
        baseModelBase64 = arrayBufferToBase64(customGlbData.baseModelBuffer);
      } catch (e) {
        console.warn('Could not encode base model GLB:', e);
      }
    }
    if (customGlbData.animations.idle) {
      try {
        idleAnimBase64 = arrayBufferToBase64(customGlbData.animations.idle);
      } catch (e) {
        console.warn('Could not encode idle animation GLB:', e);
      }
    }
    if (customGlbData.animations.walk) {
      try {
        walkAnimBase64 = arrayBufferToBase64(customGlbData.animations.walk);
      } catch (e) {
        console.warn('Could not encode walk animation GLB:', e);
      }
    }
    if (customGlbData.animations.jump) {
      try {
        jumpAnimBase64 = arrayBufferToBase64(customGlbData.animations.jump);
      } catch (e) {
        console.warn('Could not encode jump animation GLB:', e);
      }
    }
    if (customGlbData.animations.attack) {
      try {
        attackAnimBase64 = arrayBufferToBase64(customGlbData.animations.attack);
      } catch (e) {
        console.warn('Could not encode attack animation GLB:', e);
      }
    }
  }

  if (!baseModelBase64) {
    baseModelBase64 = idleAnimBase64 || walkAnimBase64 || jumpAnimBase64 || attackAnimBase64 || null;
  }

  const hasCustomGlb = !!baseModelBase64;

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Base Militar Subterránea - Lobby y Juego 3D</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #0a0c14;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      color: #f1f5f9;
    }
    #canvas-container {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    
    /* --- LOBBY OVERLAY UI (Matches reference military hangar base image) --- */
    #lobby-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px;
      z-index: 20;
      transition: opacity 0.3s ease;
    }
    .lobby-header {
      pointer-events: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(10, 15, 26, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 10px 18px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      max-width: 1100px;
      margin: 0 auto;
      width: 100%;
    }
    .lobby-title {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #fca5a5;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .lobby-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 10px #ef4444;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    
    /* Character Switcher Card */
    .char-card {
      pointer-events: auto;
      position: absolute;
      left: 24px;
      top: 90px;
      background: rgba(13, 18, 30, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 3px solid #ef4444;
      border-radius: 14px;
      padding: 16px;
      width: 310px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.7);
    }
    .char-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 8px;
    }
    .char-card-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .char-name {
      font-size: 17px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
    }
    .char-role {
      font-size: 12px;
      color: #38bdf8;
      margin-bottom: 14px;
    }
    .nav-btn-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .nav-btn {
      flex: 1;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #e2e8f0;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .nav-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
    }
    .preset-chips {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .preset-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .preset-chip:hover {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .preset-chip.active {
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.6);
      color: #fca5a5;
      font-weight: 700;
    }
    
    /* Animation Tester Toolbar */
    .anim-toolbar {
      pointer-events: auto;
      align-self: center;
      background: rgba(13, 18, 30, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      margin-bottom: 12px;
    }
    .anim-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #94a3b8;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .anim-btn {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .anim-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #fff;
    }
    .anim-btn.active {
      background: #ef4444;
      border-color: #fca5a5;
      color: #fff;
      font-weight: 700;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
    }
    
    /* Giant Glowing Red Futuristic START Button (Matches reference image) */
    .start-btn-container {
      pointer-events: auto;
      position: absolute;
      right: 28px;
      bottom: 28px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .start-btn {
      position: relative;
      background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #991b1b 100%);
      color: #ffffff;
      font-weight: 900;
      font-size: 26px;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 20px 48px;
      border: 2px solid #fca5a5;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 0 35px rgba(220, 38, 38, 0.7), 0 10px 25px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255,255,255,0.4);
      clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .start-btn:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 0 50px rgba(239, 68, 68, 0.9), 0 15px 30px rgba(0, 0, 0, 0.7), inset 0 2px 6px rgba(255,255,255,0.6);
      border-color: #ffffff;
    }
    .start-btn:active {
      transform: scale(0.98);
    }
    .start-btn-sub {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: #fca5a5;
      text-shadow: 0 0 6px rgba(239, 68, 68, 0.8);
      text-transform: uppercase;
    }
    
    /* --- IN-GAME HUD UI --- */
    #ui-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      display: none;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
      z-index: 10;
    }
    .hud-box {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 9px 15px;
      color: #f8fafc;
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .hud-btn {
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s;
    }
    .hud-btn:hover { background: linear-gradient(135deg, #0369a1, #075985); }
    .hud-btn-lobby {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      border-color: rgba(254, 202, 202, 0.4);
    }
    .hud-btn-lobby:hover {
      background: linear-gradient(135deg, #b91c1c, #991b1b);
    }
    .badge {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-family: monospace;
    }
    #touch-controls {
      position: absolute;
      bottom: 24px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 24px;
      pointer-events: none;
    }
    .touch-btn {
      pointer-events: auto;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: rgba(30, 41, 59, 0.85);
      border: 2px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
      user-select: none;
    }
    .touch-btn:active { background: #0284c7; }
  </style>
  <!-- Three.js & GLTF Loader -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- LOBBY OVERLAY (Active on startup) -->
  <div id="lobby-overlay">
    <div class="lobby-header">
      <div class="lobby-title">
        <span class="lobby-status-dot"></span>
        <span>Base Subterránea • Hangar Sector 7</span>
        <span style="color: #64748b; font-size: 12px;">| Lobby de Despliegue</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="hud-btn" onclick="toggleFullscreen()">⛶ Pantalla Completa</button>
      </div>
    </div>

    <!-- Character Customizer / Selection Card -->
    <div class="char-card">
      <div class="char-card-header">
        <span class="char-card-title">Configuración de Robot</span>
        <span id="char-index-label" style="font-size: 11px; color: #fca5a5; font-weight: 700;">1 / 5</span>
      </div>
      <div id="char-active-name" class="char-name">Robot Vanguard</div>
      <div id="char-active-role" class="char-role">Unidad Mecha de Asalto</div>

      <div class="nav-btn-row">
        <button class="nav-btn" onclick="cycleRobot(-1)">◄ Anterior</button>
        <button class="nav-btn" onclick="cycleRobot(1)">Siguiente ►</button>
      </div>

      <div class="preset-chips" id="preset-chips-list">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- Live Animation Tester Toolbar -->
    <div class="anim-toolbar">
      <span class="anim-title">Animación:</span>
      <button class="anim-btn active" id="btn-anim-idle" onclick="selectLobbyAnimation('idle')">model__28_ (Quieto)</button>
      <button class="anim-btn" id="btn-anim-walk" onclick="selectLobbyAnimation('walk')">model__27_ (Caminar)</button>
      <button class="anim-btn" id="btn-anim-jump" onclick="selectLobbyAnimation('jump')">model__26_ (Saltar)</button>
      <button class="anim-btn" id="btn-anim-attack" onclick="selectLobbyAnimation('attack')">model__25_ (Atacar)</button>
    </div>

    <!-- Glowing Red START Button -->
    <div class="start-btn-container">
      <button class="start-btn" onclick="startMatch()">
        <span>JUGAR</span>
        <span style="font-size: 32px; line-height: 1;">›</span>
      </button>
      <div class="start-btn-sub">Iniciar Despliegue en el Terreno</div>
    </div>
  </div>

  <!-- IN-GAME HUD OVERLAY -->
  <div id="ui-overlay">
    <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
      <div class="hud-box">
        <span style="font-weight: 800; font-size: 14px;">Partida 3D</span>
        <span id="anim-badge" class="badge">model__28_ (Quieto)</span>
        <span id="game-char-badge" class="badge" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">Mecha</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="hud-btn hud-btn-lobby" onclick="returnToLobby()">🏢 Base / Lobby</button>
        <button class="hud-btn" onclick="toggleFullscreen()">⛶ Pantalla</button>
      </div>
    </div>

    <div style="display: flex; justify-content: center; pointer-events: none;">
      <div class="hud-box" style="font-size: 12px; color: #94a3b8; pointer-events: auto;">
        <span><b style="color: #fff">WASD / Flechas</b>: Moverse</span> • 
        <span><b style="color: #fff">Espacio</b>: Saltar</span> • 
        <span><b style="color: #fff">Click / F</b>: Atacar</span> • 
        <span><b style="color: #fff">Arrastre</b>: Cámara 360°</span>
      </div>
    </div>

    <div id="touch-controls">
      <div style="display: flex; gap: 10px;">
        <button class="touch-btn" id="t-left">◀</button>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="touch-btn" id="t-up">▲</button>
          <button class="touch-btn" id="t-down">▼</button>
        </div>
        <button class="touch-btn" id="t-right">▶</button>
      </div>
      <div style="display: flex; gap: 12px; align-items: flex-end;">
        <button class="touch-btn" id="t-attack" style="background: rgba(225, 29, 72, 0.85); border-color: rgba(253, 164, 175, 0.4);">Golpe</button>
        <button class="touch-btn" id="t-jump" style="background: rgba(14, 165, 233, 0.85); border-color: rgba(186, 230, 253, 0.4);">Salto</button>
      </div>
    </div>
  </div>

  <script>
    // Embedded terrain heights & characters
    const savedHeights = ${heightJson};
    const savedPlaced = ${placedJson};
    let currentPresetId = "${activePresetId || 'mecha'}";
    let currentLobbyAnim = 'idle';
    let gameState = 'lobby'; // 'lobby' | 'playing'

    // Character Presets
    const PRESETS = {
      mecha: {
        id: 'mecha',
        name: 'Robot Vanguard',
        role: 'Unidad Mecha de Asalto',
        primary: 0x18181b,
        secondary: 0xdc2626,
        glow: 0xef4444,
        cloth: 0x27272a,
      },
      robot: {
        id: 'robot',
        name: 'Androide Cyber',
        role: 'Guardián Táctico',
        primary: 0x0f172a,
        secondary: 0x06b6d4,
        glow: 0x22d3ee,
        cloth: 0x1e293b,
      },
      ninja: {
        id: 'ninja',
        name: 'Cyber Ninja',
        role: 'Centinela Sigiloso',
        primary: 0x18181b,
        secondary: 0x7c3aed,
        glow: 0xa855f7,
        cloth: 0x27272a,
      },
      explorer: {
        id: 'explorer',
        name: 'Robot Explorador',
        role: 'Unidad de Reconocimiento',
        primary: 0x262626,
        secondary: 0x10b981,
        glow: 0x34d399,
        cloth: 0x171717,
      },
      runner: {
        id: 'runner',
        name: 'Androide Atlético',
        role: 'Velocista Ligero',
        primary: 0x1e293b,
        secondary: 0xe0a93b,
        glow: 0x38bdf8,
        cloth: 0x334155,
      }
    };
    const presetKeys = Object.keys(PRESETS);

    // Embedded custom GLB assets (Base64)
    const glbData = {
      hasCustomModel: ${hasCustomGlb ? 'true' : 'false'},
      model: ${baseModelBase64 ? JSON.stringify(baseModelBase64) : 'null'},
      idle: ${idleAnimBase64 ? JSON.stringify(idleAnimBase64) : 'null'},
      walk: ${walkAnimBase64 ? JSON.stringify(walkAnimBase64) : 'null'},
      jump: ${jumpAnimBase64 ? JSON.stringify(jumpAnimBase64) : 'null'},
      attack: ${attackAnimBase64 ? JSON.stringify(attackAnimBase64) : 'null'}
    };

    function base64ToArrayBuffer(base64) {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }

    // Audio synthesizer
    let audioCtx = null;
    function initAudio() {
      if (!audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioCtor) audioCtx = new AudioCtor();
      }
    }
    function playSfx(type) {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;

      if (type === 'start') {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(140, now);
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.35);
        osc2.frequency.setValueAtTime(280, now);
        osc2.frequency.exponentialRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } else if (type === 'jump') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'attack') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.16);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }

    // --- Three.js Setup ---
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c14);

    const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 250);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(12, 22, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    const d = 25;
    dirLight.shadow.camera.left = -d; dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d; dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // --- 1. PROCEDURAL 3D HANGAR BASE (Lobby Environment) ---
    function createHangarBase() {
      const group = new THREE.Group();

      // Floor Canvas Texture with military hazard lines and base insignia
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 1024;
      const ctx = cvs.getContext('2d');
      ctx.fillStyle = '#0f141c';
      ctx.fillRect(0, 0, 1024, 1024);

      // Metal grid tiles
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      const step = 64;
      for (let x = 0; x <= 1024; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
      }

      // Yellow/Black Hazard Caution Stripes border
      const stripeW = 36;
      ctx.save();
      ctx.beginPath();
      ctx.rect(60, 60, 1024 - 120, 1024 - 120);
      ctx.lineWidth = stripeW;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();
      for (let i = 0; i < 1024 * 2; i += 40) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i + 20, 0);
        ctx.lineTo(i - 40, 1024); ctx.lineTo(i - 60, 1024);
        ctx.closePath();
        ctx.clip();
      }
      ctx.restore();

      // Central Base Insignia
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(512, 512, 220, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(512, 512, 170, 0, Math.PI * 2);
      ctx.stroke();

      // Octagonal platform marking
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let a = 0; a < 8; a++) {
        const rad = (a * Math.PI) / 4;
        const px = 512 + Math.cos(rad) * 120;
        const py = 512 + Math.sin(rad) * 120;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      const floorTex = new THREE.CanvasTexture(cvs);
      floorTex.wrapS = THREE.ClampToEdgeWrapping;
      floorTex.wrapT = THREE.ClampToEdgeWrapping;

      const floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.55,
        metalness: 0.65,
      });
      const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = true;
      group.add(floorMesh);

      // Concrete Wall Material
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x1a2130,
        roughness: 0.85,
        metalness: 0.3,
      });

      // Back Blast Wall
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 7.5, 0.6), wallMat);
      backWall.position.set(0, 3.75, -7.5);
      backWall.receiveShadow = true;
      group.add(backWall);

      // Left Wall
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, 18), wallMat);
      leftWall.position.set(-8.5, 3.75, 0);
      group.add(leftWall);

      // Right Wall
      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, 18), wallMat);
      rightWall.position.set(8.5, 3.75, 0);
      group.add(rightWall);

      // Ceiling Girders & I-Beams
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        roughness: 0.6,
        metalness: 0.8,
      });
      for (let z = -6; z <= 6; z += 3) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.4, 0.35), beamMat);
        beam.position.set(0, 6.2, z);
        group.add(beam);
      }

      // Corrugated Blast Door in Background
      const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.4, 0.3), new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 }));
      gateFrame.position.set(0, 2.2, -7.2);
      group.add(gateFrame);

      const gateSlats = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.8, 0.15), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.7 }));
      gateSlats.position.set(0, 2.2, -7.1);
      group.add(gateSlats);

      // Red Neon Light Tubes (matching the image)
      const neonMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
      const roofNeon1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 8.5, 8), neonMat);
      roofNeon1.rotation.z = Math.PI / 2;
      roofNeon1.position.set(0, 5.8, -4.5);
      group.add(roofNeon1);

      const roofNeon2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 8.5, 8), neonMat);
      roofNeon2.rotation.z = Math.PI / 2;
      roofNeon2.position.set(0, 5.8, 0.5);
      group.add(roofNeon2);

      // Floor red perimeter lights
      const fLightL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8.0, 8), neonMat);
      fLightL.rotation.x = Math.PI / 2;
      fLightL.position.set(-3.6, 0.02, 0);
      group.add(fLightL);

      const fLightR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8.0, 8), neonMat);
      fLightR.rotation.x = Math.PI / 2;
      fLightR.position.set(3.6, 0.02, 0);
      group.add(fLightR);

      // Red Point Lights for atmospheric hangar glow
      const pLight1 = new THREE.PointLight(0xef4444, 1.8, 12);
      pLight1.position.set(0, 4.5, -4.0);
      group.add(pLight1);

      const pLight2 = new THREE.PointLight(0xff2222, 1.2, 9);
      pLight2.position.set(0, 0.6, 0);
      group.add(pLight2);

      return group;
    }

    const hangarBase = createHangarBase();
    scene.add(hangarBase);

    // --- 2. 3D MOUNTAIN TERRAIN (Game Match Environment) ---
    const terrainSize = 70;
    const terrainSegments = 70;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      if (savedHeights && i < savedHeights.length) {
        posAttr.setY(i, savedHeights[i]);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.visible = false; // Hidden in lobby
    scene.add(terrainMesh);

    function getTerrainHeight(x, z) {
      const half = terrainSize / 2;
      const gx = ((x + half) / terrainSize) * terrainSegments;
      const gz = ((z + half) / terrainSize) * terrainSegments;
      if (gx < 0 || gx >= terrainSegments || gz < 0 || gz >= terrainSegments) return 0;
      const x0 = Math.floor(gx);
      const z0 = Math.floor(gz);
      const x1 = Math.min(x0 + 1, terrainSegments);
      const z1 = Math.min(z0 + 1, terrainSegments);
      const fx = gx - x0;
      const fz = gz - z0;
      const stride = terrainSegments + 1;
      const h00 = posAttr.getY(z0 * stride + x0);
      const h10 = posAttr.getY(z0 * stride + x1);
      const h01 = posAttr.getY(z1 * stride + x0);
      const h11 = posAttr.getY(z1 * stride + x1);
      const top = h00 * (1 - fx) + h10 * fx;
      const bot = h01 * (1 - fx) + h11 * fx;
      return top * (1 - fz) + bot * fz;
    }

    // --- 3. CHARACTER HIERARCHY & PROCEDURAL RIG ---
    const playerRoot = new THREE.Group();
    scene.add(playerRoot);

    let activeRig = null;

    function buildProceduralRig(presetId) {
      const p = PRESETS[presetId] || PRESETS.mecha;
      const root = new THREE.Group();

      const mainMat = new THREE.MeshStandardMaterial({ color: p.primary, roughness: 0.4, metalness: 0.65 });
      const secMat = new THREE.MeshStandardMaterial({ color: p.secondary, roughness: 0.35, metalness: 0.5 });
      const glowMat = new THREE.MeshStandardMaterial({ color: p.glow, emissive: p.glow, emissiveIntensity: 0.85 });
      const clothMat = new THREE.MeshStandardMaterial({ color: p.cloth, roughness: 0.75, metalness: 0.2 });

      const hips = new THREE.Group(); hips.position.y = 1.0; root.add(hips);
      const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.2, 8), mainMat); pelvis.castShadow = true; hips.add(pelvis);

      const chest = new THREE.Group(); chest.position.y = 0.16; hips.add(chest);
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.2, 8), clothMat); spine.position.y = 0.09; spine.castShadow = true; chest.add(spine);
      const uChest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.3, 0.26), mainMat); uChest.position.y = 0.3; uChest.castShadow = true; chest.add(uChest);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 8), glowMat); core.rotation.x = Math.PI/2; core.position.set(0, 0.3, 0.14); chest.add(core);

      const head = new THREE.Group(); head.position.y = 0.52; chest.add(head);
      const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.26), mainMat); headBox.position.y = 0.2; headBox.castShadow = true; head.add(headBox);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.06), glowMat); visor.position.set(0, 0.2, 0.13); head.add(visor);

      const leftArm = new THREE.Group(); leftArm.position.set(-0.32, 0.36, 0); chest.add(leftArm);
      const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.26, 6), clothMat); lUpper.position.y = -0.13; lUpper.castShadow = true; leftArm.add(lUpper);
      const leftForearm = new THREE.Group(); leftForearm.position.y = -0.26; leftArm.add(leftForearm);
      const lLower = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.24, 6), mainMat); lLower.position.y = -0.12; lLower.castShadow = true; leftForearm.add(lLower);
      const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), secMat); lHand.position.y = -0.25; lHand.castShadow = true; leftForearm.add(lHand);

      const rightArm = new THREE.Group(); rightArm.position.set(0.32, 0.36, 0); chest.add(rightArm);
      const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.26, 6), clothMat); rUpper.position.y = -0.13; rUpper.castShadow = true; rightArm.add(rUpper);
      const rightForearm = new THREE.Group(); rightForearm.position.y = -0.26; rightArm.add(rightForearm);
      const rLower = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.24, 6), mainMat); rLower.position.y = -0.12; rLower.castShadow = true; rightForearm.add(rLower);
      const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), secMat); rHand.position.y = -0.25; rHand.castShadow = true; rightForearm.add(rHand);

      const leftLeg = new THREE.Group(); leftLeg.position.set(-0.15, -0.06, 0); hips.add(leftLeg);
      const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 6), clothMat); lThigh.position.y = -0.21; lThigh.castShadow = true; leftLeg.add(lThigh);
      const leftShin = new THREE.Group(); leftShin.position.y = -0.42; leftLeg.add(leftShin);
      const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 6), mainMat); lCalf.position.y = -0.21; lCalf.castShadow = true; leftShin.add(lCalf);

      const rightLeg = new THREE.Group(); rightLeg.position.set(0.15, -0.06, 0); hips.add(rightLeg);
      const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 6), clothMat); rThigh.position.y = -0.21; rThigh.castShadow = true; rightLeg.add(rThigh);
      const rightShin = new THREE.Group(); rightShin.position.y = -0.42; rightLeg.add(rightShin);
      const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 6), mainMat); rCalf.position.y = -0.21; rCalf.castShadow = true; rightShin.add(rCalf);

      return { root, hips, chest, head, leftArm, leftForearm, rightArm, rightForearm, leftLeg, leftShin, rightLeg, rightShin };
    }

    function setProceduralPreset(presetId) {
      if (activeRig) {
        playerRoot.remove(activeRig.root);
      }
      activeRig = buildProceduralRig(presetId);
      playerRoot.add(activeRig.root);
    }

    setProceduralPreset(currentPresetId);

    // Custom GLB Loader & Animation Mixer
    let customModel = null;
    let customMixer = null;
    const customActions = { idle: null, walk: null, jump: null, attack: null };
    let currentCustomAction = null;
    let isUsingCustomGlb = false;

    if (glbData.hasCustomModel && glbData.model && window.THREE.GLTFLoader) {
      const loader = new THREE.GLTFLoader();
      const modelBuffer = base64ToArrayBuffer(glbData.model);

      loader.parse(modelBuffer, '', (gltf) => {
        customModel = gltf.scene;

        const box = new THREE.Box3().setFromObject(customModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0.001) {
          const scale = 2.0 / maxDim;
          customModel.scale.set(scale, scale, scale);
        }
        const updatedBox = new THREE.Box3().setFromObject(customModel);
        customModel.position.y = -updatedBox.min.y;

        customModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        customMixer = new THREE.AnimationMixer(customModel);

        function loadAnimClip(slot, base64Str, defaultClip) {
          if (base64Str) {
            try {
              const buf = base64ToArrayBuffer(base64Str);
              loader.parse(buf, '', (animGltf) => {
                if (animGltf.animations && animGltf.animations.length > 0) {
                  const clip = animGltf.animations[0];
                  const action = customMixer.clipAction(clip);
                  if (slot === 'jump' || slot === 'attack') {
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = false;
                  } else {
                    action.setLoop(THREE.LoopRepeat, Infinity);
                  }
                  customActions[slot] = action;
                  if (slot === 'idle') {
                    action.play();
                    currentCustomAction = action;
                  }
                }
              });
            } catch (err) {
              console.warn('Failed to parse anim slot ' + slot, err);
            }
          } else if (defaultClip) {
            const action = customMixer.clipAction(defaultClip);
            customActions[slot] = action;
            if (slot === 'idle') {
              action.play();
              currentCustomAction = action;
            }
          }
        }

        const baseClip = gltf.animations && gltf.animations[0];
        loadAnimClip('idle', glbData.idle, baseClip);
        loadAnimClip('walk', glbData.walk);
        loadAnimClip('jump', glbData.jump);
        loadAnimClip('attack', glbData.attack);
      }, (err) => {
        console.warn('Error parsing custom GLB model:', err);
      });
    }

    // --- UI POPULATION & EVENT HANDLERS ---
    function renderPresetChips() {
      const list = document.getElementById('preset-chips-list');
      list.innerHTML = '';

      presetKeys.forEach((key) => {
        const item = PRESETS[key];
        const chip = document.createElement('div');
        chip.className = 'preset-chip' + (currentPresetId === key && !isUsingCustomGlb ? ' active' : '');
        chip.innerHTML = '<span>' + item.name + '</span><span style="font-size: 11px; opacity: 0.8;">' + (currentPresetId === key && !isUsingCustomGlb ? '✓ Activo' : 'Elegir') + '</span>';
        chip.onclick = () => selectRobotPreset(key);
        list.appendChild(chip);
      });

      if (glbData.hasCustomModel) {
        const customChip = document.createElement('div');
        customChip.className = 'preset-chip' + (isUsingCustomGlb ? ' active' : '');
        customChip.innerHTML = '<span>Mi Robot GLB Importado</span><span style="font-size: 11px; opacity: 0.8;">' + (isUsingCustomGlb ? '✓ Activo' : 'Elegir') + '</span>';
        customChip.onclick = () => selectCustomGlb();
        list.appendChild(customChip);
      }
    }

    function updateCharCardDisplay() {
      if (isUsingCustomGlb) {
        document.getElementById('char-active-name').innerText = 'Robot GLB Importado';
        document.getElementById('char-active-role').innerText = 'Modelo 3D Personalizado';
        document.getElementById('char-index-label').innerText = 'GLB';
        document.getElementById('game-char-badge').innerText = 'Robot GLB';
      } else {
        const p = PRESETS[currentPresetId] || PRESETS.mecha;
        document.getElementById('char-active-name').innerText = p.name;
        document.getElementById('char-active-role').innerText = p.role;
        const idx = presetKeys.indexOf(currentPresetId) + 1;
        document.getElementById('char-index-label').innerText = idx + ' / ' + presetKeys.length;
        document.getElementById('game-char-badge').innerText = p.name.split(' ')[0];
      }
      renderPresetChips();
    }

    function selectRobotPreset(presetId) {
      initAudio();
      playSfx('click');
      isUsingCustomGlb = false;
      currentPresetId = presetId;
      if (customModel && playerRoot.children.includes(customModel)) {
        playerRoot.remove(customModel);
      }
      setProceduralPreset(presetId);
      updateCharCardDisplay();
    }

    function selectCustomGlb() {
      if (!customModel) return;
      initAudio();
      playSfx('click');
      isUsingCustomGlb = true;
      if (activeRig) {
        playerRoot.remove(activeRig.root);
      }
      playerRoot.add(customModel);
      if (customActions[currentLobbyAnim]) {
        switchCustomAnimation(currentLobbyAnim);
      }
      updateCharCardDisplay();
    }

    function cycleRobot(dir) {
      initAudio();
      playSfx('click');
      if (isUsingCustomGlb) {
        isUsingCustomGlb = false;
        selectRobotPreset(presetKeys[0]);
        return;
      }
      let idx = presetKeys.indexOf(currentPresetId);
      idx = (idx + dir + presetKeys.length) % presetKeys.length;
      selectRobotPreset(presetKeys[idx]);
    }

    function selectLobbyAnimation(anim) {
      initAudio();
      playSfx('click');
      currentLobbyAnim = anim;
      document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('btn-anim-' + anim);
      if (activeBtn) activeBtn.classList.add('active');

      if (isUsingCustomGlb) {
        switchCustomAnimation(anim);
      }
    }

    function startMatch() {
      initAudio();
      playSfx('start');
      gameState = 'playing';

      document.getElementById('lobby-overlay').style.display = 'none';
      document.getElementById('ui-overlay').style.display = 'flex';

      hangarBase.visible = false;
      terrainMesh.visible = true;
      scene.background = new THREE.Color(0x0f172a);

      const startH = getTerrainHeight(0, 0);
      posX = 0; posZ = 0; posY = startH;
      playerRoot.position.set(0, startH, 0);
      charRotation = 0;
      camYaw = 0; camPitch = 0.35;
    }

    function returnToLobby() {
      initAudio();
      playSfx('click');
      gameState = 'lobby';

      document.getElementById('lobby-overlay').style.display = 'flex';
      document.getElementById('ui-overlay').style.display = 'none';

      hangarBase.visible = true;
      terrainMesh.visible = false;
      scene.background = new THREE.Color(0x0a0c14);

      playerRoot.position.set(0, 0, 0);
      playerRoot.rotation.y = 0;
      camera.position.set(0, 1.45, 4.4);
      camPitch = 0.15;
      camYaw = 0;
    }

    // Initialize UI
    renderPresetChips();
    updateCharCardDisplay();

    // Camera interaction (Orbit in lobby, follow in game)
    let camPitch = 0.15;
    let camYaw = 0;
    let isMouseDown = false;
    let prevMouseX = 0, prevMouseY = 0;

    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('#lobby-overlay') || e.target.closest('#touch-controls') || e.target.closest('.hud-box') || e.target.closest('.hud-btn')) return;
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      camYaw += dx * 0.005;
      camPitch = Math.max(-0.2, Math.min(1.1, camPitch - dy * 0.005));
    });

    window.addEventListener('mouseup', () => { isMouseDown = false; });

    // Touch orbit for mobile
    let touchStartX = 0, touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !e.target.closest('#touch-controls') && !e.target.closest('#lobby-overlay') && !e.target.closest('.hud-box')) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && !e.target.closest('#touch-controls') && !e.target.closest('#lobby-overlay') && !e.target.closest('.hud-box')) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        camYaw += dx * 0.006;
        camPitch = Math.max(-0.2, Math.min(1.1, camPitch - dy * 0.006));
      }
    }, { passive: true });

    // Input handlers for game
    const keys = {};
    window.addEventListener('keydown', e => {
      initAudio();
      keys[e.code] = true;
      if (e.code === 'KeyF' && gameState === 'playing') triggerAttack();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('pointerdown', e => {
      if (gameState === 'playing' && !e.target.closest('#touch-controls') && !e.target.closest('.hud-box') && !e.target.closest('.hud-btn')) {
        initAudio();
        triggerAttack();
      }
    });

    // Touch controls setup
    function setupTouch(id, code) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', e => { e.preventDefault(); initAudio(); keys[code] = true; });
      btn.addEventListener('touchend', e => { e.preventDefault(); keys[code] = false; });
    }
    setupTouch('t-up', 'KeyW');
    setupTouch('t-down', 'KeyS');
    setupTouch('t-left', 'KeyA');
    setupTouch('t-right', 'KeyD');
    setupTouch('t-jump', 'Space');
    document.getElementById('t-attack').addEventListener('touchstart', e => {
      e.preventDefault();
      initAudio();
      triggerAttack();
    });

    let isAttacking = false;
    let attackProgress = 0;
    function triggerAttack() {
      if (isAttacking) return;
      isAttacking = true;
      attackProgress = 0;
      playSfx('attack');
      switchCustomAnimation('attack');
    }

    function switchCustomAnimation(animType) {
      if (!customMixer) return;
      const targetAction = customActions[animType];
      if (targetAction && targetAction !== currentCustomAction) {
        if (currentCustomAction) currentCustomAction.fadeOut(0.18);
        targetAction.reset().fadeIn(0.18).play();
        currentCustomAction = targetAction;
      }
    }

    // Procedural pose calculation
    function updatePose(rig, anim, time, atkProg) {
      if (!rig) return;
      const { hips, chest, leftArm, leftForearm, rightArm, rightForearm, leftLeg, leftShin, rightLeg, rightShin } = rig;
      hips.rotation.set(0,0,0);
      chest.rotation.set(0,0,0);

      if (anim === 'idle') {
        const breathe = Math.sin(time * 2.4);
        hips.position.y = 1.0 + breathe * 0.02;
        leftArm.rotation.x = 0.1; leftArm.rotation.z = -0.15;
        rightArm.rotation.x = 0.1; rightArm.rotation.z = 0.15;
        leftLeg.rotation.x = 0.02; rightLeg.rotation.x = -0.02;
      } else if (anim === 'walk') {
        const t = time * 7.5;
        const stride = Math.sin(t);
        const bounce = Math.abs(Math.cos(t));
        hips.position.y = 0.98 + bounce * 0.05;
        chest.rotation.y = stride * 0.1;
        leftLeg.rotation.x = stride * 0.65;
        leftShin.rotation.x = stride > 0 ? -stride * 0.45 : -0.08;
        rightLeg.rotation.x = -stride * 0.65;
        rightShin.rotation.x = stride < 0 ? stride * 0.45 : -0.08;
        leftArm.rotation.x = -stride * 0.55;
        rightArm.rotation.x = stride * 0.55;
      } else if (anim === 'jump') {
        leftLeg.rotation.x = -0.7; rightLeg.rotation.x = -0.6;
        leftArm.rotation.z = -0.5; rightArm.rotation.z = 0.5;
      } else if (anim === 'attack') {
        const strike = Math.sin(atkProg * Math.PI);
        chest.rotation.y = 0.8 * strike;
        rightArm.rotation.x = -0.4 + 1.8 * strike;
      }
    }

    // Spawn saved NPCs on terrain
    if (savedPlaced && savedPlaced.length > 0) {
      savedPlaced.forEach(p => {
        const npc = buildProceduralRig(p.presetId || 'robot');
        npc.root.position.set(p.x, getTerrainHeight(p.x, p.z), p.z);
        npc.root.rotation.y = p.rotation || 0;
        scene.add(npc.root);
      });
    }

    // --- MAIN GAME / ANIMATION LOOP ---
    let posX = 0, posZ = 0, posY = 0;
    let velY = 0;
    let isGrounded = true;
    let charRotation = 0;
    let animTime = 0;
    let lastTime = performance.now();
    let currentAnimState = 'idle';

    function animate(now) {
      requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      animTime += delta;

      if (customMixer) {
        customMixer.update(delta);
      }

      if (gameState === 'lobby') {
        // --- LOBBY MODE ---
        playerRoot.position.set(0, 0, 0);
        playerRoot.rotation.y = 0;

        if (!isUsingCustomGlb && activeRig) {
          updatePose(
            activeRig,
            currentLobbyAnim,
            animTime,
            currentLobbyAnim === 'attack' ? (Math.sin(animTime * 5) + 1) * 0.5 : 0
          );
        }

        // Orbit camera centered on robot in the hangar base
        const orbitDist = 4.4;
        const camX = -Math.sin(camYaw) * Math.cos(camPitch) * orbitDist;
        const camZ = Math.cos(camYaw) * Math.cos(camPitch) * orbitDist;
        const camY = 1.35 + Math.sin(camPitch) * orbitDist;

        camera.position.set(camX, camY, camZ);
        camera.lookAt(0, 1.25, 0);

        renderer.render(scene, camera);
        return;
      }

      // --- PLAYING MATCH MODE ---
      let moveX = 0, moveZ = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      const isMoving = (moveX !== 0 || moveZ !== 0);
      const moveSpeed = 6.8;

      if (isMoving && !isAttacking) {
        const len = Math.hypot(moveX, moveZ);
        moveX /= len; moveZ /= len;

        const forwardX = -Math.sin(camYaw);
        const forwardZ = -Math.cos(camYaw);
        const rightX = -forwardZ;
        const rightZ = forwardX;

        const dirX = forwardX * (-moveZ) + rightX * moveX;
        const dirZ = forwardZ * (-moveZ) + rightZ * moveX;

        posX += dirX * moveSpeed * delta;
        posZ += dirZ * moveSpeed * delta;
        charRotation = Math.atan2(dirX, dirZ);
      }

      // Jump
      if (keys['Space'] && isGrounded && !isAttacking) {
        velY = 7.5;
        isGrounded = false;
        playSfx('jump');
        switchCustomAnimation('jump');
      }

      // Gravity & Ground snap
      velY -= 19.0 * delta;
      posY += velY * delta;
      const groundH = getTerrainHeight(posX, posZ);

      if (posY <= groundH) {
        posY = groundH;
        velY = 0;
        isGrounded = true;
      }

      playerRoot.position.set(posX, posY, posZ);
      playerRoot.rotation.y = charRotation;

      // Attack Progress
      if (isAttacking) {
        attackProgress += delta * 2.2;
        if (attackProgress >= 1) {
          isAttacking = false;
          attackProgress = 0;
          switchCustomAnimation('idle');
        }
      }

      // Determine animation state
      let nextAnim = 'idle';
      let badgeText = 'model__28_ (Quieto)';
      if (isAttacking) {
        nextAnim = 'attack';
        badgeText = 'model__25_ (Atacar)';
      } else if (!isGrounded) {
        nextAnim = 'jump';
        badgeText = 'model__26_ (Saltar)';
      } else if (isMoving) {
        nextAnim = 'walk';
        badgeText = 'model__27_ (Caminar)';
      }

      if (nextAnim !== currentAnimState) {
        currentAnimState = nextAnim;
        document.getElementById('anim-badge').innerText = badgeText;
        switchCustomAnimation(nextAnim);
      }

      if (!isUsingCustomGlb && activeRig) {
        updatePose(activeRig, currentAnimState, animTime, attackProgress);
      }

      // Third-person camera follow
      const camDist = 5.6;
      const targetCamX = posX - Math.sin(camYaw) * Math.cos(camPitch) * camDist;
      const targetCamZ = posZ - Math.cos(camYaw) * Math.cos(camPitch) * camDist;
      const targetCamY = posY + Math.sin(camPitch) * camDist + 1.2;

      camera.position.x += (targetCamX - camera.position.x) * 0.12;
      camera.position.z += (targetCamZ - camera.position.z) * 0.12;
      camera.position.y += (targetCamY - camera.position.y) * 0.12;
      camera.lookAt(posX, posY + 1.2, posZ);

      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    requestAnimationFrame(animate);
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'base_militar_lobby_juego_3d.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
