import { Fighter, Platform, Projectile, HazardArea, Particle, FloatingText, ArenaMap, CHARACTERS } from '../types/game';
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
export function updateCamera(p1: Fighter, p2: Fighter, canvasWidth: number, canvasHeight: number): Camera {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2 - 30;
  const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const minZoom = 0.65;
  const maxZoom = 1.15;
  const targetZoom = Math.max(minZoom, Math.min(maxZoom, 920 / Math.max(500, dist)));
  return {
    x: midX - (canvasWidth / (2 * targetZoom)),
    y: midY - (canvasHeight / (2 * targetZoom)),
    zoom: targetZoom,
  };
}
export function renderGame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  arena: ArenaMap,
  p1: Fighter,
  p2: Fighter,
  projectiles: Projectile[],
  hazardAreas: HazardArea[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  camera: Camera,
  screenShake: number,
  showHitboxes: boolean = false
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  if (screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * screenShake * 2;
    const shakeY = (Math.random() - 0.5) * screenShake * 2;
    ctx.translate(shakeX, shakeY);
  }
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, arena.bgColorTop);
  skyGrad.addColorStop(1, arena.bgColorBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);
  drawBackgroundDeco(ctx, width, height, arena);
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  for (const plat of arena.platforms) {
    drawPlatform(ctx, plat);
  }
  if (arena.hasLavaBottom) {
    drawLavaOrAcid(ctx, arena);
  }
  for (const haz of hazardAreas) {
    drawHazardArea(ctx, haz);
  }
  for (const proj of projectiles) {
    drawProjectile(ctx, proj);
  }
  drawStickman(ctx, p1);
  drawStickman(ctx, p2);
  drawParticles(ctx, particles);
  drawFloatingTexts(ctx, floatingTexts);
  if (showHitboxes) {
    drawHitboxOverlays(ctx, arena, p1, p2, projectiles);
  }
  ctx.restore();
  ctx.restore();
}
function drawHitboxOverlays(
  ctx: CanvasRenderingContext2D,
  arena: ArenaMap,
  p1: Fighter,
  p2: Fighter,
  projectiles: Projectile[]
) {
  ctx.save();
  ctx.font = 'bold 11px sans-serif';
  for (const plat of arena.platforms) {
    ctx.lineWidth = 2;
    if (plat.type === 'bounce') {
      ctx.strokeStyle = '#ec4899';
      ctx.fillStyle = 'rgba(236, 72, 153, 0.28)';
    } else if (plat.type === 'bridge') {
      ctx.strokeStyle = '#eab308';
      ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
    } else {
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
    }
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${plat.type.toUpperCase()} [${Math.round(plat.width)}x${Math.round(plat.height)}]`, plat.x + 6, plat.y + 16);
  }
  const halfW = 12;
  const fighterH = 58;
  [p1, p2].forEach((f) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = f.slot === 1 ? '#38bdf8' : '#fb923c';
    ctx.fillStyle = f.slot === 1 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 146, 60, 0.25)';
    ctx.fillRect(f.x - halfW, f.y - fighterH, halfW * 2, fighterH);
    ctx.strokeRect(f.x - halfW, f.y - fighterH, halfW * 2, fighterH);
    ctx.fillStyle = f.isGrounded ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  for (const proj of projectiles) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
function drawBackgroundDeco(ctx: CanvasRenderingContext2D, width: number, height: number, arena: ArenaMap) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  const t = Date.now() * 0.0003;
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 350 + t * 40) % (width + 300)) - 150;
    const cy = 80 + (i % 2) * 50;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.arc(cx + 35, cy - 10, 48, 0, Math.PI * 2);
    ctx.arc(cx + 70, cy, 35, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform) {
  const { x, y, width, height, type } = plat;
  if (type === 'bridge') {
    const plankWidth = 22;
    const plankGap = 6;
    const count = Math.floor(width / (plankWidth + plankGap));
    ctx.save();
    ctx.strokeStyle = '#573312';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    ctx.fillStyle = '#854d0e';
    for (let i = 0; i < count; i++) {
      const px = x + i * (plankWidth + plankGap);
      ctx.fillRect(px, y, plankWidth, height);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(px + 2, y + 2, plankWidth - 4, 4);
      ctx.fillStyle = '#854d0e';
    }
    ctx.restore();
  } else if (type === 'grass') {
    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    const zigCount = Math.floor(width / 40);
    for (let i = 0; i < zigCount; i++) {
      const zx = x + i * 40;
      ctx.moveTo(zx, y + 30);
      ctx.lineTo(zx + 20, y + 60);
      ctx.lineTo(zx + 40, y + 30);
    }
    ctx.fill();
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(x, y, width, 24);
    const tuftCount = Math.floor(width / 16);
    ctx.beginPath();
    for (let i = 0; i < tuftCount; i++) {
      ctx.arc(x + 8 + i * 16, y + 24, 8, 0, Math.PI);
    }
    ctx.fill();
    if (width > 300) {
      ctx.fillStyle = '#4d7c0f';
      const midX = x + width / 2;
      for (let v = 0; v < 3; v++) {
        const vx = midX - 25 + v * 25;
        ctx.beginPath();
        ctx.arc(vx, y + 50, 9, 0, Math.PI * 2);
        ctx.arc(vx, y + 80, 11, 0, Math.PI * 2);
        ctx.arc(vx, y + 115, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3f1a07';
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  } else if (type === 'metal') {
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    const panels = Math.floor(width / 40);
    for (let i = 1; i < panels; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 40, y + 4);
      ctx.lineTo(x + i * 40, y + height - 4);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(x + i * 40 - 6, y + 10, 2.5, 0, Math.PI * 2);
      ctx.arc(x + i * 40 - 6, y + height - 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  } else if (type === 'bounce') {
    ctx.save();
    const isVertical = height > width;
    if (isVertical) {
      ctx.fillStyle = '#be185d';
      ctx.fillRect(x, y, width, height);
      const faceLeft = x > 600;
      ctx.fillStyle = '#f472b6';
      if (faceLeft) {
        ctx.fillRect(x, y + 4, 8, height - 8);
      } else {
        ctx.fillRect(x + width - 8, y + 4, 8, height - 8);
      }
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 3;
      const count = Math.floor(height / 45);
      for (let i = 0; i < count; i++) {
        const cy = y + 25 + i * 45;
        ctx.beginPath();
        if (faceLeft) {
          ctx.moveTo(x + width - 8, cy - 12);
          ctx.lineTo(x + 10, cy);
          ctx.lineTo(x + width - 8, cy + 12);
        } else {
          ctx.moveTo(x + 8, cy - 12);
          ctx.lineTo(x + width - 10, cy);
          ctx.lineTo(x + 8, cy + 12);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
    } else {
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(x + 4, y + 3, width - 8, Math.min(6, height - 6));
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
    }
    ctx.restore();
  }
}
function drawLavaOrAcid(ctx: CanvasRenderingContext2D, arena: ArenaMap) {
  const isToxic = arena.id === 'poco_toxico';
  const color = isToxic ? '#22c55e' : '#ea580c';
  const time = Date.now() * 0.003;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, arena.lavaY);
  for (let x = 0; x <= 1300; x += 30) {
    const wave = Math.sin(time + x * 0.02) * 8;
    ctx.lineTo(x, arena.lavaY + wave);
  }
  ctx.lineTo(1300, arena.lavaY + 150);
  ctx.lineTo(0, arena.lavaY + 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = isToxic ? '#86efac' : '#fdba74';
  for (let b = 0; b < 6; b++) {
    const bx = (b * 210 + Math.sin(time + b) * 40) % 1200;
    const by = arena.lavaY + 8 + Math.cos(time + b * 2) * 5;
    ctx.beginPath();
    ctx.arc(bx, by, 7 + (b % 4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawHazardArea(ctx: CanvasRenderingContext2D, haz: HazardArea) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  if (haz.type === 'fart_cloud') {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(haz.x + haz.width / 2, haz.y + haz.height / 2, haz.width / 2, haz.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.ellipse(haz.x + haz.width / 2, haz.y + haz.height / 2, haz.width * 0.35, haz.height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(haz.x, haz.y, haz.width, haz.height);
    ctx.fillStyle = '#86efac';
    const t = Date.now() * 0.005;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(haz.x + 15 + i * 25, haz.y + Math.sin(t + i) * 3, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawStickman(ctx: CanvasRenderingContext2D, fighter: Fighter) {
  const { x, y, facing, limbs, health, maxHealth, name, character, isStunned, bodyAngle } = fighter;
  const config = CHARACTERS[character];
  ctx.save();
  ctx.translate(x, y - 88);
  drawHealthBarAboveHead(ctx, 0, health, maxHealth, name, config.color);
  ctx.restore();
  ctx.save();
  ctx.translate(x, y - 36);
  ctx.rotate(bodyAngle);
  if (isStunned) {
    ctx.translate((Math.random() - 0.5) * 4, 0);
  }
  const stickWidth = 5.5;
  const headRadius = 14;
  const hipY = 6;
  const shoulderY = -20;
  const thighLen = 15;
  const calfLen = 15;
  const armLen = 14;
  const forearmLen = 14;
  ctx.lineWidth = stickWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = config.color;
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  const lKneeX = Math.sin(limbs.leftLegAngle) * thighLen;
  const lKneeY = hipY + Math.cos(limbs.leftLegAngle) * thighLen;
  ctx.lineTo(lKneeX, lKneeY);
  const lFootX = lKneeX + Math.sin(limbs.leftLegAngle + limbs.leftCalfAngle) * calfLen;
  const lFootY = lKneeY + Math.cos(limbs.leftLegAngle + limbs.leftCalfAngle) * calfLen;
  ctx.lineTo(lFootX, lFootY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  const rKneeX = Math.sin(limbs.rightLegAngle) * thighLen;
  const rKneeY = hipY + Math.cos(limbs.rightLegAngle) * thighLen;
  ctx.lineTo(rKneeX, rKneeY);
  const rFootX = rKneeX + Math.sin(limbs.rightLegAngle + limbs.rightCalfAngle) * calfLen;
  const rFootY = rKneeY + Math.cos(limbs.rightLegAngle + limbs.rightCalfAngle) * calfLen;
  ctx.lineTo(rFootX, rFootY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(0, shoulderY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, shoulderY);
  const lElbowX = Math.sin(limbs.leftArmAngle) * armLen;
  const lElbowY = shoulderY + Math.cos(limbs.leftArmAngle) * armLen;
  ctx.lineTo(lElbowX, lElbowY);
  const lHandX = lElbowX + Math.sin(limbs.leftArmAngle + limbs.leftForearmAngle) * forearmLen;
  const lHandY = lElbowY + Math.cos(limbs.leftArmAngle + limbs.leftForearmAngle) * forearmLen;
  ctx.lineTo(lHandX, lHandY);
  ctx.stroke();
  const relAim = fighter.aimAngle - bodyAngle;
  const aimCos = Math.cos(relAim);
  const aimSin = Math.sin(relAim);
  ctx.beginPath();
  ctx.moveTo(0, shoulderY);
  const rElbowX = aimCos * 13;
  const rElbowY = shoulderY + aimSin * 13;
  ctx.lineTo(rElbowX, rElbowY);
  const rHandX = aimCos * 26;
  const rHandY = shoulderY + aimSin * 26;
  ctx.lineTo(rHandX, rHandY);
  ctx.stroke();
  drawFighterWeapon(ctx, fighter, rHandX, rHandY, relAim);
  if (fighter.state !== 'dead' && !fighter.isStunned) {
    ctx.save();
    ctx.translate(rHandX, rHandY);
    ctx.rotate(relAim);
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(130, 0);
    ctx.stroke();
    ctx.fillStyle = config.accentColor;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(130, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const headY = shoulderY - headRadius;
  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(limbs.headAngle);
  ctx.fillStyle = config.color;
  ctx.beginPath();
  ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawHeadgearAndFace(ctx, fighter, 0, headRadius, facing);
  ctx.restore();
  ctx.restore();
}
function drawHeadgearAndFace(
  ctx: CanvasRenderingContext2D,
  fighter: Fighter,
  headY: number,
  headRadius: number,
  facing: 1 | -1
) {
  ctx.fillStyle = '#ffffff';
  const eyeX = facing * 4;
  ctx.beginPath();
  ctx.arc(eyeX, headY - 2, 3, 0, Math.PI * 2);
  ctx.arc(eyeX + facing * 5, headY - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(eyeX + facing * 1, headY - 2, 1.5, 0, Math.PI * 2);
  ctx.arc(eyeX + facing * 6, headY - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(eyeX - 3, headY - 6);
  ctx.lineTo(eyeX + 3, headY - 4);
  ctx.stroke();
  if (fighter.character === 'arthur') {
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(0, headY - 3, headRadius + 1, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.fillRect(-facing * 12, headY - 14, 14, 4);
  } else {
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-headRadius, headY - 10, headRadius * 2, 6);
    ctx.beginPath();
    ctx.moveTo(-facing * headRadius, headY - 8);
    ctx.lineTo(-facing * (headRadius + 10), headY - 14);
    ctx.lineTo(-facing * (headRadius + 8), headY - 4);
    ctx.closePath();
    ctx.fill();
  }
}
function drawFighterWeapon(
  ctx: CanvasRenderingContext2D,
  fighter: Fighter,
  handX: number,
  handY: number,
  relAimAngle: number
) {
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(relAimAngle);
  if (fighter.character === 'arthur') {
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(0, -5, 22, 10);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(22, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.fillRect(16, -2, 8, 4);
  } else {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, -3, 14, 6);
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, -4, 20, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(20, -5, 8, 10);
  }
  ctx.restore();
}
function drawHealthBarAboveHead(
  ctx: CanvasRenderingContext2D,
  barY: number,
  health: number,
  maxHealth: number,
  name: string,
  _charColor: string
) {
  const barWidth = 52;
  const barHeight = 7;
  const barX = -barWidth / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  const hpRatio = Math.max(0, health / maxHealth);
  ctx.fillStyle = hpRatio > 0.3 ? '#22c55e' : '#f59e0b';
  ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 0, barY - 5);
}
function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  ctx.save();
  ctx.translate(proj.x, proj.y);
  if (proj.type === 'fat_glob') {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-2, -2, proj.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.type === 'radioactive_bomb') {
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.type === 'atomic_chip') {
    ctx.rotate(Date.now() * 0.01);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(0, -proj.radius);
    ctx.lineTo(proj.radius, proj.radius);
    ctx.lineTo(-proj.radius, proj.radius);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.stroke();
  } else if (proj.type === 'water_jet') {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.type === 'rice_pellet') {
    ctx.rotate(Math.atan2(proj.vy, proj.vx));
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    const alpha = Math.max(0, (p.life / p.maxLife) * p.alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.shape === 'smoke') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life / p.maxLife)), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}
function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const ft = texts[i];
    ft.y += ft.vy;
    ft.life -= 1;
    ft.alpha = Math.max(0, ft.life / 50);
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.font = `900 ${Math.round(14 * ft.scale)}px "Fredoka", sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
    if (ft.life <= 0) {
      texts.splice(i, 1);
    }
  }
}
