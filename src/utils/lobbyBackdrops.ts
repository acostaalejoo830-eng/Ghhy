/**
 * Presets and helpers for 2D Lobby Backgrounds and Wallpaper modes
 */

export interface LobbyBackdropPreset {
  id: string;
  name: string;
  description: string;
  thumbnailDataUrl: string;
  dataUrl: string;
}

// Generates high-res backdrop canvas textures for immediate standalone offline use
function createMilitaryHangarImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background deep industrial bunker gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
  bgGrad.addColorStop(0, '#060a12');
  bgGrad.addColorStop(0.5, '#0d1527');
  bgGrad.addColorStop(1, '#05070c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Distant blast door frame
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 14;
  ctx.strokeRect(200, 100, 1520, 880);

  // Diagonal blast door panels
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(220, 120);
  ctx.lineTo(950, 120);
  ctx.lineTo(950, 960);
  ctx.lineTo(220, 960);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(970, 120);
  ctx.lineTo(1700, 120);
  ctx.lineTo(1700, 960);
  ctx.lineTo(970, 960);
  ctx.closePath();
  ctx.fill();

  // Red neon warning light strips
  const redGlow = ctx.createLinearGradient(0, 80, 0, 140);
  redGlow.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
  redGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = redGlow;
  ctx.fillRect(180, 80, 1560, 40);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(200, 90, 1520, 8);

  // Bottom hazard stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 980, 1920, 100);
  ctx.clip();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 980, 1920, 100);
  ctx.fillStyle = '#dc2626';
  for (let x = -200; x < 2400; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 980);
    ctx.lineTo(x + 40, 980);
    ctx.lineTo(x + 40 - 60, 1080);
    ctx.lineTo(x - 60, 1080);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Tactical HUD typography
  ctx.fillStyle = 'rgba(248, 113, 113, 0.7)';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('SECTOR 07 // AIR-DROP CARGO DOCK', 240, 180);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.font = '18px monospace';
  ctx.fillText('SYSTEM STATUS: DEPLOYMENT READY', 240, 215);

  return canvas.toDataURL('image/jpeg', 0.88);
}

function createCloudsPlaneImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dramatic aerial sunset/dusk sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 1080);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.3, '#1e1b4b');
  skyGrad.addColorStop(0.65, '#431407');
  skyGrad.addColorStop(0.85, '#ea580c');
  skyGrad.addColorStop(1, '#fde047');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Fluffy high altitude clouds
  const cloudGrad = ctx.createLinearGradient(0, 600, 0, 1080);
  cloudGrad.addColorStop(0, 'rgba(255, 237, 213, 0.3)');
  cloudGrad.addColorStop(0.5, 'rgba(154, 52, 18, 0.7)');
  cloudGrad.addColorStop(1, 'rgba(67, 20, 7, 0.95)');
  ctx.fillStyle = cloudGrad;

  for (let i = 0; i < 18; i++) {
    const cx = (i * 140) % 2100;
    const cy = 700 + Math.sin(i * 1.7) * 90;
    const r = 160 + (i % 5) * 40;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Silhouette of military transport airplane in sky
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  // Fuselage
  ctx.ellipse(960, 320, 240, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.beginPath();
  ctx.moveTo(880, 320);
  ctx.lineTo(920, 140);
  ctx.lineTo(1020, 140);
  ctx.lineTo(1040, 320);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(880, 320);
  ctx.lineTo(920, 500);
  ctx.lineTo(1020, 500);
  ctx.lineTo(1040, 320);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(1140, 320);
  ctx.lineTo(1220, 230);
  ctx.lineTo(1250, 230);
  ctx.lineTo(1220, 320);
  ctx.closePath();
  ctx.fill();

  // Jet contrails
  ctx.strokeStyle = 'rgba(254, 215, 170, 0.45)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(960, 220);
  ctx.lineTo(200, 220);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(960, 420);
  ctx.lineTo(200, 420);
  ctx.stroke();

  // Air currents wind lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  for (let j = 0; j < 12; j++) {
    const y = 200 + j * 55;
    ctx.beginPath();
    ctx.moveTo(400 + (j * 40), y);
    ctx.lineTo(1600 - (j * 30), y + 10);
    ctx.stroke();
  }

  return canvas.toDataURL('image/jpeg', 0.88);
}

function createRunwayBaseImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Night military runway
  const grad = ctx.createLinearGradient(0, 0, 0, 1080);
  grad.addColorStop(0, '#020617');
  grad.addColorStop(0.5, '#0b132b');
  grad.addColorStop(1, '#040814');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Runway perspective converging to center
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(960, 360);
  ctx.lineTo(1600, 1080);
  ctx.lineTo(320, 1080);
  ctx.closePath();
  ctx.fill();

  // Runway center stripes
  ctx.fillStyle = '#facc15';
  for (let step = 0; step < 8; step++) {
    const t = step / 8;
    const y = 380 + Math.pow(t, 1.8) * 650;
    const h = 10 + t * 45;
    const w = 4 + t * 16;
    ctx.fillRect(960 - w / 2, y, w, h);
  }

  // Cyan and amber runway beacons
  for (let step = 0; step < 12; step++) {
    const t = step / 12;
    const y = 360 + Math.pow(t, 1.5) * 720;
    const spread = 20 + t * 640;

    // Left beacon
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(960 - spread, y, 3 + t * 5, 0, Math.PI * 2);
    ctx.fill();

    // Right beacon
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(960 + spread, y, 3 + t * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.88);
}

function createCyberPlatformArt(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
  grad.addColorStop(0, '#030712');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Digital grid
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1920; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1080);
    ctx.stroke();
  }
  for (let y = 0; y < 1080; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1920, y);
    ctx.stroke();
  }

  // Giant glowing orbital ring
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(960, 540, 480, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(960, 540, 510, 0, Math.PI * 2);
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.88);
}

let cachedPresets: LobbyBackdropPreset[] | null = null;

export function getLobbyBackdropPresets(): LobbyBackdropPreset[] {
  if (cachedPresets) return cachedPresets;

  try {
    const hangar = createMilitaryHangarImage();
    const clouds = createCloudsPlaneImage();
    const runway = createRunwayBaseImage();
    const cyber = createCyberPlatformArt();

    cachedPresets = [
      {
        id: 'hangar_art',
        name: 'Hangar Militar 2D',
        description: 'Bunker subterráneo con compuertas blindadas y señalización de asalto.',
        thumbnailDataUrl: hangar,
        dataUrl: hangar,
      },
      {
        id: 'clouds_plane',
        name: 'Vuelo & Avión en Nubes',
        description: 'Atardecer en cielo alto con avión militar y estelas de viento.',
        thumbnailDataUrl: clouds,
        dataUrl: clouds,
      },
      {
        id: 'runway',
        name: 'Pista de Despegue Nocturna',
        description: 'Pista táctica con balizas luminosas y horizonte militar.',
        thumbnailDataUrl: runway,
        dataUrl: runway,
      },
      {
        id: 'cyber_platform',
        name: 'Plataforma Cyberpunk',
        description: 'Hangar orbital futurista con anillo holográfico de energía.',
        thumbnailDataUrl: cyber,
        dataUrl: cyber,
      },
    ];
  } catch (e) {
    console.warn('Failed to generate presets:', e);
    cachedPresets = [];
  }

  return cachedPresets;
}
