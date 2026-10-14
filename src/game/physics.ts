import { Fighter, Platform, Projectile, HazardArea, Particle, FloatingText, ArenaMap, PlayerInput, CHARACTERS } from '../types/game';
import { sounds } from '../audio/soundManager';
export const GRAVITY = 0.16;
export const MAX_FALL_SPEED = 5.8;
export const MOVE_SPEED = 3.2;
export const JUMP_FORCE = -6.8;
export const FIGHTER_WIDTH = 26;
export const FIGHTER_HEIGHT = 58;
let damageSlot: 1 | 2 | 'all' = 'all';
export function setDamageSlot(s: 1 | 2 | 'all') {
  damageSlot = s;
}
function canDamage(slot: 1 | 2) {
  return damageSlot === 'all' || damageSlot === slot;
}
export function createFighter(
  slot: 1 | 2,
  characterId: 'arthur' | 'lucas',
  name: string,
  spawn: { x: number; y: number }
): Fighter {
  const charConfig = CHARACTERS[characterId];
  const maxCooldowns: [number, number, number, number] = [
    charConfig.powers[0].cooldown,
    charConfig.powers[1].cooldown,
    charConfig.powers[2].cooldown,
    charConfig.powers[3].cooldown,
  ];
  const baseHealth = characterId === 'arthur' ? 90 : 105;
  return {
    slot,
    name,
    character: characterId,
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    bodyAngle: 0,
    angularVelocity: 0,
    ragdollIntensity: 0,
    facing: slot === 1 ? 1 : -1,
    aimAngle: slot === 1 ? 0 : Math.PI,
    health: baseHealth,
    maxHealth: baseHealth,
    isGrounded: true,
    canDoubleJump: true,
    jumpLatch: false,
    isStunned: false,
    stunTimer: 0,
    cooldowns: [0, 0, 0, 0],
    maxCooldowns,
    state: 'idle',
    activeAttack: null,
    attackTimer: 0,
    runCycle: 0,
    limbs: {
      headAngle: 0,
      torsoAngle: 0,
      leftArmAngle: 0.5,
      rightArmAngle: -0.5,
      leftForearmAngle: 0.4,
      rightForearmAngle: -0.4,
      leftLegAngle: 0.2,
      rightLegAngle: -0.2,
      leftCalfAngle: 0.1,
      rightCalfAngle: -0.1,
      limbVelocities: {
        lArm: 0,
        rArm: 0,
        lLeg: 0,
        rLeg: 0,
      },
    },
    status: {
      radioactiveTimer: 0,
      burnTimer: 0,
      slowTimer: 0,
    },
  };
}
export function updateFighter(
  fighter: Fighter,
  input: PlayerInput,
  platforms: Platform[],
  otherFighter: Fighter,
  projectiles: Projectile[],
  hazardAreas: HazardArea[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  addScreenShake: (amount: number) => void
) {
  if (fighter.state === 'dead') {
    fighter.vy = Math.min(MAX_FALL_SPEED, fighter.vy + GRAVITY);
    fighter.x += fighter.vx;
    fighter.y += fighter.vy;
    fighter.bodyAngle += fighter.angularVelocity;
    fighter.angularVelocity *= 0.98;
    fighter.vx *= 0.97;
    animateRagdollLimbs(fighter);
    return;
  }
  if (fighter.status.radioactiveTimer > 0) {
    fighter.status.radioactiveTimer -= 1 / 60;
    if (Math.random() < 0.2) {
      if (canDamage(fighter.slot)) {
        fighter.health = Math.max(0, fighter.health - 0.4);
      }
      spawnParticle(particles, fighter.x + (Math.random() - 0.5) * 20, fighter.y - 30 + (Math.random() - 0.5) * 30, 0, -1, 4, '#22c55e', 0.8, 25);
    }
  }
  if (fighter.status.burnTimer > 0) {
    fighter.status.burnTimer -= 1 / 60;
    if (Math.random() < 0.2) {
      if (canDamage(fighter.slot)) {
        fighter.health = Math.max(0, fighter.health - 0.5);
      }
      spawnParticle(particles, fighter.x + (Math.random() - 0.5) * 20, fighter.y - 30 + (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 2, -2, 5, '#f97316', 0.8, 20);
    }
  }
  if (fighter.status.slowTimer > 0) {
    fighter.status.slowTimer -= 1 / 60;
  }
  for (let i = 0; i < 4; i++) {
    if (fighter.cooldowns[i] > 0) {
      fighter.cooldowns[i] = Math.max(0, fighter.cooldowns[i] - 1 / 60);
    }
  }
  if (fighter.stunTimer > 0) {
    fighter.stunTimer -= 1 / 60;
    if (fighter.stunTimer <= 0) {
      fighter.isStunned = false;
    }
  }
  if (fighter.attackTimer > 0) {
    fighter.attackTimer -= 1 / 60;
    if (fighter.attackTimer <= 0) {
      fighter.activeAttack = null;
    }
  }
  let speedMultiplier = fighter.character === 'arthur' ? 1.0 : 1.1;
  if (fighter.status.slowTimer > 0) speedMultiplier *= 0.65;
  if (!fighter.isStunned) {
    if (Math.abs(input.aimX) > 0.05 || Math.abs(input.aimY) > 0.05) {
      fighter.aimAngle = Math.atan2(input.aimY, input.aimX);
      fighter.facing = input.aimX >= 0 ? 1 : -1;
    } else if (Math.abs(input.moveX) > 0.1) {
      fighter.facing = input.moveX > 0 ? 1 : -1;
      fighter.aimAngle = fighter.facing === 1 ? 0 : Math.PI;
    }
    if (Math.abs(input.moveX) > 0.05) {
      const targetVx = input.moveX * MOVE_SPEED * speedMultiplier;
      fighter.vx += (targetVx - fighter.vx) * (fighter.isGrounded ? 0.35 : 0.16);
      fighter.runCycle += 0.25;
      if (fighter.isGrounded) {
        fighter.state = 'walk';
        if (Math.random() < 0.2) {
          spawnParticle(particles, fighter.x, fighter.y, -fighter.facing * (1 + Math.random()), -0.5, 3, '#a3a3a3', 0.5, 15);
        }
      }
    } else {
      fighter.vx *= fighter.isGrounded ? 0.70 : 0.96;
      if (fighter.isGrounded && fighter.activeAttack === null) {
        fighter.state = 'idle';
      }
    }
    if (input.moveY > 0.45 && !fighter.isGrounded && fighter.vy > -1) {
      fighter.vy = Math.min(MAX_FALL_SPEED * 1.3, fighter.vy + 0.4);
    }
    const wantsJump = input.jump || input.moveY < -0.45;
    if (wantsJump) {
      if (!fighter.jumpLatch) {
        fighter.jumpLatch = true;
        if (fighter.isGrounded) {
          fighter.vy = JUMP_FORCE;
          fighter.isGrounded = false;
          fighter.canDoubleJump = true;
          fighter.state = 'jump';
          fighter.angularVelocity = fighter.facing * (0.12 + Math.random() * 0.08);
          sounds.playJump();
          spawnJumpDust(particles, fighter.x, fighter.y);
        } else if (fighter.canDoubleJump) {
          fighter.vy = JUMP_FORCE * 0.9;
          fighter.canDoubleJump = false;
          fighter.state = 'jump';
          fighter.angularVelocity = fighter.facing * 0.28;
          sounds.playJump();
          spawnJumpDust(particles, fighter.x, fighter.y);
        }
      }
    } else {
      fighter.jumpLatch = false;
    }
    if (input.power1 && fighter.cooldowns[0] <= 0) {
      triggerPower(0, fighter, otherFighter, projectiles, hazardAreas, particles, floatingTexts, addScreenShake);
    }
    if (input.power2 && fighter.cooldowns[1] <= 0) {
      triggerPower(1, fighter, otherFighter, projectiles, hazardAreas, particles, floatingTexts, addScreenShake);
    }
    if (input.power3 && fighter.cooldowns[2] <= 0) {
      triggerPower(2, fighter, otherFighter, projectiles, hazardAreas, particles, floatingTexts, addScreenShake);
    }
    if (input.power4 && fighter.cooldowns[3] <= 0) {
      triggerPower(3, fighter, otherFighter, projectiles, hazardAreas, particles, floatingTexts, addScreenShake);
    }
  }
  if (!fighter.isGrounded) {
    fighter.vy *= 0.99;
    fighter.vx *= 0.985;
    const effectiveGravity = (input.jump && fighter.vy < 0) ? GRAVITY * 0.55 : GRAVITY;
    fighter.vy = Math.min(MAX_FALL_SPEED, fighter.vy + effectiveGravity);
  } else {
    fighter.vy = Math.min(MAX_FALL_SPEED, fighter.vy + GRAVITY);
  }
  const prevX = fighter.x;
  const prevY = fighter.y;
  const prevFeetY = prevY;
  const prevHeadY = prevY - FIGHTER_HEIGHT;
  fighter.x += fighter.vx;
  fighter.y += fighter.vy;
  fighter.bodyAngle += fighter.angularVelocity;
  if (fighter.isGrounded && !fighter.isStunned) {
    fighter.bodyAngle *= 0.65;
    fighter.angularVelocity *= 0.4;
    fighter.ragdollIntensity = Math.max(0, fighter.ragdollIntensity - 0.08);
  } else {
    fighter.angularVelocity *= 0.97;
    const speed = Math.hypot(fighter.vx, fighter.vy);
    if (speed > 8 || fighter.isStunned) {
      fighter.ragdollIntensity = Math.min(1.0, fighter.ragdollIntensity + 0.1);
    } else {
      fighter.ragdollIntensity = Math.max(0, fighter.ragdollIntensity - 0.03);
    }
  }
  if (otherFighter.state !== 'dead') {
    const distFighters = Math.hypot(fighter.x - otherFighter.x, fighter.y - otherFighter.y);
    const minDist = 22;
    if (distFighters < minDist && distFighters > 0) {
      const overlap = (minDist - distFighters) * 0.5;
      const pushDirX = (fighter.x - otherFighter.x) / distFighters || (fighter.slot === 1 ? -1 : 1);
      fighter.x += pushDirX * overlap;
      fighter.vx += pushDirX * 0.3;
    }
  }
  if (fighter.x < 25) {
    fighter.x = 25;
    if (Math.abs(fighter.vx) > 4) {
      fighter.vx = -fighter.vx * 0.75;
      fighter.angularVelocity += -0.3;
      sounds.playHit(0.6);
      addScreenShake(3);
    }
  } else if (fighter.x > 1175) {
    fighter.x = 1175;
    if (Math.abs(fighter.vx) > 4) {
      fighter.vx = -fighter.vx * 0.75;
      fighter.angularVelocity += 0.3;
      sounds.playHit(0.6);
      addScreenShake(3);
    }
  }
  fighter.isGrounded = false;
  const halfW = FIGHTER_WIDTH * 0.46;
  let fLeft = fighter.x - halfW;
  let fRight = fighter.x + halfW;
  let fTop = fighter.y - FIGHTER_HEIGHT;
  let fBottom = fighter.y;
  for (const plat of platforms) {
    const pLeft = plat.x;
    const pRight = plat.x + plat.width;
    const pTop = plat.y;
    const pBottom = plat.y + plat.height;
    if (plat.type === 'bounce') {
      const isVertical = plat.height > plat.width;
      if (isVertical) {
        const inY = fBottom > pTop + 4 && fTop < pBottom - 4;
        if (inY) {
          const prevFLeft = prevX - halfW;
          if (prevFLeft >= pRight - 6 && fLeft <= pRight) {
            fighter.x = pRight + halfW;
            const incoming = Math.abs(fighter.vx);
            fighter.vx = Math.max(13, incoming * 1.3);
            fighter.angularVelocity = 0.4;
            fighter.ragdollIntensity = 0.85;
            sounds.playJump();
            sounds.playHit(0.8);
            addScreenShake(6);
            spawnParticle(particles, pRight, fighter.y - 28, 7, -2, 8, '#ec4899', 0.95, 25);
            spawnFloatingText(floatingTexts, fighter.x + 25, fighter.y - 50, 'BOING! ⚡', '#ec4899');
            fLeft = fighter.x - halfW;
            fRight = fighter.x + halfW;
          }
          const prevFRight = prevX + halfW;
          if (prevFRight <= pLeft + 6 && fRight >= pLeft) {
            fighter.x = pLeft - halfW;
            const incoming = Math.abs(fighter.vx);
            fighter.vx = -Math.max(13, incoming * 1.3);
            fighter.angularVelocity = -0.4;
            fighter.ragdollIntensity = 0.85;
            sounds.playJump();
            sounds.playHit(0.8);
            addScreenShake(6);
            spawnParticle(particles, pLeft, fighter.y - 28, -7, -2, 8, '#ec4899', 0.95, 25);
            spawnFloatingText(floatingTexts, fighter.x - 25, fighter.y - 50, 'BOING! ⚡', '#ec4899');
            fLeft = fighter.x - halfW;
            fRight = fighter.x + halfW;
          }
        }
      } else {
        const inX = fRight > pLeft && fLeft < pRight;
        if (inX) {
          if (prevFeetY <= pTop + 16 && fBottom >= pTop && fighter.vy >= 0) {
            fighter.y = pTop;
            fighter.vy = -14.5;
            fighter.angularVelocity = (Math.random() - 0.5) * 0.5;
            fighter.ragdollIntensity = 0.85;
            fighter.isGrounded = false;
            sounds.playJump();
            addScreenShake(5);
            spawnParticle(particles, fighter.x, fighter.y, 0, -5, 8, '#ec4899', 0.9, 25);
            spawnFloatingText(floatingTexts, fighter.x, fighter.y - 50, 'BOING! 🚀', '#ec4899');
            fBottom = fighter.y;
            fTop = fighter.y - FIGHTER_HEIGHT;
          }
          else if (prevHeadY >= pBottom - 14 && fTop <= pBottom && fighter.vy < 0) {
            fighter.y = pBottom + FIGHTER_HEIGHT;
            fighter.vy = Math.max(11, Math.abs(fighter.vy) * 1.25);
            fighter.angularVelocity = (Math.random() - 0.5) * 0.4;
            fighter.ragdollIntensity = 0.8;
            sounds.playHit(0.8);
            addScreenShake(5);
            spawnParticle(particles, fighter.x, pBottom, 0, 5, 8, '#ec4899', 0.9, 25);
            spawnFloatingText(floatingTexts, fighter.x, fighter.y - 50, 'BOING! 💥', '#ec4899');
            fBottom = fighter.y;
            fTop = fighter.y - FIGHTER_HEIGHT;
          }
        }
      }
      continue;
    }
    if (plat.type === 'bridge') {
      const inX = fRight > pLeft + 2 && fLeft < pRight - 2;
      if (inX && fighter.vy >= 0) {
        if (prevFeetY <= pTop + 14 && fBottom >= pTop && fBottom <= pBottom + 12) {
          fighter.y = pTop;
          fighter.vy = 0;
          fighter.isGrounded = true;
          fighter.canDoubleJump = true;
          fBottom = fighter.y;
          fTop = fighter.y - FIGHTER_HEIGHT;
        }
      }
      continue;
    }
    if (fRight > pLeft && fLeft < pRight && fBottom > pTop && fTop < pBottom) {
      const overlapTop = fBottom - pTop;
      const overlapBottom = pBottom - fTop;
      const overlapLeft = fRight - pLeft;
      const overlapRight = pRight - fLeft;
      const wasAbove = prevFeetY <= pTop + 12 || (fighter.isGrounded && prevFeetY <= pTop + 14);
      if (wasAbove && fighter.vy >= 0 && (prevX + halfW > pLeft + 3 && prevX - halfW < pRight - 3)) {
        if (Math.abs(fighter.vy) > 10 && fighter.ragdollIntensity > 0.4) {
          fighter.vy = -fighter.vy * 0.35;
          fighter.angularVelocity *= 0.5;
          sounds.playHit(0.7);
        } else {
          fighter.y = pTop;
          fighter.vy = 0;
          fighter.isGrounded = true;
          fighter.canDoubleJump = true;
        }
        fBottom = fighter.y;
        fTop = fighter.y - FIGHTER_HEIGHT;
        continue;
      }
      const wasBelow = prevHeadY >= pBottom - 12;
      if (wasBelow && fighter.vy < 0 && (prevX + halfW > pLeft + 3 && prevX - halfW < pRight - 3)) {
        fighter.y = pBottom + FIGHTER_HEIGHT;
        fighter.vy = Math.max(0, -fighter.vy * 0.25);
        sounds.playHit(0.4);
        spawnJumpDust(particles, fighter.x, pBottom);
        fBottom = fighter.y;
        fTop = fighter.y - FIGHTER_HEIGHT;
        continue;
      }
      const wasToLeft = (prevX + halfW) <= pLeft + 8;
      if (wasToLeft && fighter.vx >= 0) {
        fighter.x = pLeft - halfW;
        if (Math.abs(fighter.vx) > 3) {
          fighter.vx = -fighter.vx * 0.25;
          sounds.playHit(0.5);
        } else {
          fighter.vx = 0;
        }
        fLeft = fighter.x - halfW;
        fRight = fighter.x + halfW;
        continue;
      }
      const wasToRight = (prevX - halfW) >= pRight - 8;
      if (wasToRight && fighter.vx <= 0) {
        fighter.x = pRight + halfW;
        if (Math.abs(fighter.vx) > 3) {
          fighter.vx = -fighter.vx * 0.25;
          sounds.playHit(0.5);
        } else {
          fighter.vx = 0;
        }
        fLeft = fighter.x - halfW;
        fRight = fighter.x + halfW;
        continue;
      }
      const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
      if (minOverlap === overlapTop && fighter.vy >= 0) {
        fighter.y = pTop;
        fighter.vy = 0;
        fighter.isGrounded = true;
        fighter.canDoubleJump = true;
        fBottom = fighter.y;
        fTop = fighter.y - FIGHTER_HEIGHT;
      } else if (minOverlap === overlapBottom && fighter.vy < 0) {
        fighter.y = pBottom + FIGHTER_HEIGHT;
        fighter.vy = 0;
        fBottom = fighter.y;
        fTop = fighter.y - FIGHTER_HEIGHT;
      } else if (minOverlap === overlapLeft) {
        fighter.x = pLeft - halfW;
        fighter.vx = Math.min(0, fighter.vx);
        fLeft = fighter.x - halfW;
        fRight = fighter.x + halfW;
      } else if (minOverlap === overlapRight) {
        fighter.x = pRight + halfW;
        fighter.vx = Math.max(0, fighter.vx);
        fLeft = fighter.x - halfW;
        fRight = fighter.x + halfW;
      }
    }
  }
  if (!fighter.isGrounded && fighter.activeAttack === null && !fighter.isStunned) {
    fighter.state = fighter.vy < 0 ? 'jump' : 'fall';
  }
  animateRagdollLimbs(fighter);
}
function animateRagdollLimbs(fighter: Fighter) {
  const { state, vx, vy, facing, runCycle, aimAngle, ragdollIntensity, isStunned } = fighter;
  const limbs = fighter.limbs;
  const aimRelAngle = aimAngle - (facing === 1 ? 0 : Math.PI);
  if (ragdollIntensity > 0.3 || isStunned || state === 'dead') {
    const velAngle = Math.atan2(vy, vx);
    const velSpeed = Math.hypot(vx, vy);
    limbs.torsoAngle = Math.sin(Date.now() * 0.02) * 0.2 + (vx * -0.05);
    limbs.headAngle = Math.sin(Date.now() * 0.025) * 0.3 + (vy * -0.04);
    limbs.leftArmAngle = velAngle + Math.PI * 0.5 + Math.sin(Date.now() * 0.015) * 0.6;
    limbs.leftForearmAngle = limbs.leftArmAngle + Math.sin(Date.now() * 0.02) * 0.8;
    limbs.rightArmAngle = aimRelAngle * (1 - ragdollIntensity * 0.7) + (velAngle - Math.PI * 0.5) * (ragdollIntensity * 0.7);
    limbs.rightForearmAngle = limbs.rightArmAngle + (velSpeed * 0.05);
    limbs.leftLegAngle = -velAngle + Math.sin(Date.now() * 0.018) * 0.8;
    limbs.leftCalfAngle = limbs.leftLegAngle + 0.6;
    limbs.rightLegAngle = -velAngle - Math.sin(Date.now() * 0.018) * 0.8;
    limbs.rightCalfAngle = limbs.rightLegAngle - 0.6;
  } else if (state === 'walk') {
    const swing = Math.sin(runCycle) * 0.85;
    limbs.leftLegAngle = swing;
    limbs.leftCalfAngle = swing > 0 ? swing * 0.6 : 0.1;
    limbs.rightLegAngle = -swing;
    limbs.rightCalfAngle = -swing > 0 ? -swing * 0.6 : 0.1;
    limbs.torsoAngle = facing * 0.18;
    limbs.headAngle = facing * 0.12;
    limbs.leftArmAngle = -swing * 0.8;
    limbs.leftForearmAngle = -swing * 0.6;
    limbs.rightArmAngle = aimRelAngle;
    limbs.rightForearmAngle = 0;
  } else if (state === 'jump' || state === 'fall') {
    limbs.leftLegAngle = 0.6 + Math.sin(vy * 0.12) * 0.4;
    limbs.leftCalfAngle = 0.8;
    limbs.rightLegAngle = -0.5;
    limbs.rightCalfAngle = 0.3;
    limbs.torsoAngle = facing * (vy * 0.05);
    limbs.headAngle = -vy * 0.06;
    limbs.leftArmAngle = -1.4 + Math.sin(Date.now() * 0.01) * 0.3;
    limbs.leftForearmAngle = -0.5;
    limbs.rightArmAngle = aimRelAngle;
    limbs.rightForearmAngle = 0;
  } else {
    const breath = Math.sin(Date.now() * 0.005) * 0.08;
    limbs.leftLegAngle = 0.18;
    limbs.leftCalfAngle = 0.1;
    limbs.rightLegAngle = -0.18;
    limbs.rightCalfAngle = -0.1;
    limbs.torsoAngle = breath;
    limbs.headAngle = -breath;
    limbs.leftArmAngle = 0.35 + breath;
    limbs.leftForearmAngle = 0.2;
    limbs.rightArmAngle = aimRelAngle;
    limbs.rightForearmAngle = 0;
  }
}
export function triggerPower(
  powerIndex: number,
  fighter: Fighter,
  target: Fighter,
  projectiles: Projectile[],
  hazardAreas: HazardArea[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  addScreenShake: (amount: number) => void
) {
  fighter.cooldowns[powerIndex] = fighter.maxCooldowns[powerIndex];
  fighter.activeAttack = `power_${powerIndex}`;
  fighter.attackTimer = 0.45;
  const aimCos = Math.cos(fighter.aimAngle);
  const aimSin = Math.sin(fighter.aimAngle);
  const castX = fighter.x + aimCos * 26;
  const castY = fighter.y - 28 + aimSin * 26;
  if (fighter.character === 'arthur') {
    switch (powerIndex) {
      case 0: {
        sounds.playFatSquirt();
        addScreenShake(3);
        for (let i = -1.5; i <= 1.5; i += 1) {
          const spread = fighter.aimAngle + (i * 0.14);
          const speed = 9.0 + Math.random() * 2;
          projectiles.push({
            id: `fat_${Date.now()}_${i}`,
            type: 'fat_glob',
            x: castX,
            y: castY,
            vx: Math.cos(spread) * speed,
            vy: Math.sin(spread) * speed,
            radius: 9,
            damage: 6,
            knockback: 14,
            ownerSlot: fighter.slot,
            lifetime: 1.6,
            maxLifetime: 1.6,
            color: '#facc15',
          });
        }
        spawnFloatingText(floatingTexts, fighter.x, fighter.y - 65, 'BANHA!', '#facc15');
        break;
      }
      case 1: {
        sounds.playHotFart();
        addScreenShake(7);
        fighter.vx = aimCos * 13;
        fighter.vy = Math.min(-9, aimSin * 11 - 6);
        fighter.isGrounded = false;
        fighter.angularVelocity = fighter.facing * 0.3;
        fighter.ragdollIntensity = 0.6;
        hazardAreas.push({
          id: `fart_${Date.now()}`,
          x: fighter.x - aimCos * 45 - 35,
          y: fighter.y - 45,
          width: 80,
          height: 70,
          damagePerSec: 12,
          color: '#f97316',
          lifetime: 2.5,
          ownerSlot: fighter.slot,
          type: 'fart_cloud',
        });
        const blastDist = Math.hypot(target.x - (fighter.x - aimCos * 40), target.y - fighter.y);
        if (blastDist < 95) {
          applyDamage(target, 15, -aimCos * 16, -10, addScreenShake, floatingTexts, particles);
          spawnFloatingText(floatingTexts, target.x, target.y - 65, 'EXPLODIDO PELO PEIDO!', '#f97316');
        }
        for (let i = 0; i < 24; i++) {
          spawnParticle(
            particles,
            fighter.x - aimCos * 25,
            fighter.y - 25,
            -aimCos * (6 + Math.random() * 6) + (Math.random() - 0.5) * 4,
            -aimSin * (6 + Math.random() * 6) + (Math.random() - 0.5) * 4,
            8 + Math.random() * 6,
            Math.random() > 0.5 ? '#f97316' : '#84cc16',
            0.85,
            38,
            'smoke'
          );
        }
        spawnFloatingText(floatingTexts, fighter.x, fighter.y - 65, 'PEIDO QUENTE! 🔥', '#f97316');
        break;
      }
      case 2: {
        sounds.playRadioactiveSplat();
        addScreenShake(4);
        const speed = 8.0;
        projectiles.push({
          id: `radio_${Date.now()}`,
          type: 'radioactive_bomb',
          x: castX,
          y: castY,
          vx: aimCos * speed,
          vy: aimSin * speed - 2.5,
          radius: 12,
          damage: 12,
          knockback: 14,
          ownerSlot: fighter.slot,
          lifetime: 3.2,
          maxLifetime: 3.2,
          color: '#22c55e',
        });
        spawnFloatingText(floatingTexts, fighter.x, fighter.y - 65, 'RADIAÇÃO ☢️', '#22c55e');
        break;
      }
      case 3: {
        sounds.playTortureSpin();
        addScreenShake(8);
        fighter.vx = fighter.facing * 11;
        fighter.vy = -3.5;
        fighter.attackTimer = 0.65;
        fighter.angularVelocity = fighter.facing * 0.4;
        const dist = Math.hypot(fighter.x - target.x, fighter.y - target.y);
        if (dist < 115) {
          applyDamage(target, 22, fighter.facing * 16, -11, addScreenShake, floatingTexts, particles);
          target.isStunned = true;
          target.stunTimer = 0.5;
          target.status.slowTimer = 1.5;
          spawnFloatingText(floatingTexts, target.x, target.y - 65, 'TORTURADO! ⛓️', '#ef4444');
          for (let p = 0; p < 20; p++) {
            spawnParticle(particles, target.x, target.y - 30, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, 6, '#ef4444', 0.9, 35);
          }
        }
        break;
      }
    }
  } else {
    switch (powerIndex) {
      case 0: {
        sounds.playHeavyArmPunch();
        addScreenShake(10);
        fighter.vx = aimCos * 13;
        fighter.attackTimer = 0.5;
        const punchX = fighter.x + aimCos * 70;
        const punchY = fighter.y - 28 + aimSin * 40;
        const dist = Math.hypot(punchX - target.x, punchY - target.y);
        if (dist < 105) {
          applyDamage(target, 24, aimCos * 26, aimSin * 16 - 8, addScreenShake, floatingTexts, particles);
          target.isStunned = true;
          target.stunTimer = 0.4;
          spawnFloatingText(floatingTexts, target.x, target.y - 65, 'SUPER SOCO! 💪', '#ef4444');
        }
        for (let i = 0; i < 22; i++) {
          spawnParticle(particles, punchX, punchY, aimCos * 12 + (Math.random() - 0.5) * 8, aimSin * 12 + (Math.random() - 0.5) * 8, 7, '#f59e0b', 0.9, 28);
        }
        break;
      }
      case 1: {
        sounds.playAtomicChips();
        addScreenShake(4);
        for (let i = 0; i < 4; i++) {
          const spread = fighter.aimAngle + (Math.random() - 0.5) * 0.45;
          const speed = 10 + Math.random() * 5;
          projectiles.push({
            id: `chip_${Date.now()}_${i}`,
            type: 'atomic_chip',
            x: castX,
            y: castY,
            vx: Math.cos(spread) * speed,
            vy: Math.sin(spread) * speed - 2.5,
            radius: 8,
            damage: 6,
            knockback: 13,
            ownerSlot: fighter.slot,
            lifetime: 2.0,
            maxLifetime: 2.0,
            color: '#ea580c',
            bounces: 1,
          });
        }
        spawnFloatingText(floatingTexts, fighter.x, fighter.y - 65, 'CHIPS ATÔMICOS 🍟', '#ea580c');
        break;
      }
      case 2: {
        sounds.playWaterStream();
        addScreenShake(3);
        for (let i = 0; i < 6; i++) {
          const spread = fighter.aimAngle + (Math.random() - 0.5) * 0.20;
          const speed = 15 + Math.random() * 4;
          projectiles.push({
            id: `water_${Date.now()}_${i}`,
            type: 'water_jet',
            x: castX,
            y: castY,
            vx: Math.cos(spread) * speed,
            vy: Math.sin(spread) * speed,
            radius: 7,
            damage: 3,
            knockback: 18,
            ownerSlot: fighter.slot,
            lifetime: 0.95,
            maxLifetime: 0.95,
            color: '#06b6d4',
          });
        }
        spawnFloatingText(floatingTexts, fighter.x, fighter.y - 65, 'ÁGUA! 💧', '#06b6d4');
        break;
      }
      case 3: {
        sounds.playRiceShotgun();
        addScreenShake(11);
        fighter.vx -= aimCos * 13;
        fighter.vy -= aimSin * 8;
        fighter.angularVelocity += -aimCos * 0.3;
        fighter.ragdollIntensity = 0.45;
        for (let i = 0; i < 7; i++) {
          const spread = fighter.aimAngle + (Math.random() - 0.5) * 0.44;
          const speed = 19 + Math.random() * 6;
          projectiles.push({
            id: `rice_${Date.now()}_${i}`,
            type: 'rice_pellet',
            x: castX,
            y: castY,
            vx: Math.cos(spread) * speed,
            vy: Math.sin(spread) * speed,
            radius: 5,
            damage: 4,
            knockback: 20,
            ownerSlot: fighter.slot,
            lifetime: 0.8,
            maxLifetime: 0.8,
            color: '#f8fafc',
          });
        }
        spawnFloatingText(floatingTexts, fighter.x, fighter.y - 65, 'BOOOM! 🌾', '#a855f7');
        break;
      }
    }
  }
}
export function updateProjectiles(
  projectiles: Projectile[],
  platforms: Platform[],
  p1: Fighter,
  p2: Fighter,
  hazardAreas: HazardArea[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  addScreenShake: (amount: number) => void
) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.lifetime -= 1 / 60;
    if (proj.type === 'radioactive_bomb' || proj.type === 'atomic_chip') {
      proj.vy += GRAVITY * 0.7;
    }
    proj.x += proj.vx;
    proj.y += proj.vy;
    const target = proj.ownerSlot === 1 ? p2 : p1;
    const distToTarget = Math.hypot(proj.x - target.x, proj.y - (target.y - 28));
    if (distToTarget < proj.radius + FIGHTER_WIDTH * 0.6) {
      const kx = proj.vx * 0.6 + (proj.vx > 0 ? 1 : -1) * proj.knockback * 0.7;
      const ky = proj.vy * 0.4 - 4;
      applyDamage(target, proj.damage, kx, ky, addScreenShake, floatingTexts, particles);
      if (proj.type === 'radioactive_bomb') {
        target.status.radioactiveTimer = 2.5;
        sounds.playRadioactiveSplat();
      } else if (proj.type === 'fat_glob') {
        target.status.slowTimer = 1.8;
      } else if (proj.type === 'atomic_chip') {
        sounds.playAtomicChips();
        addScreenShake(6);
        for (let p = 0; p < 14; p++) {
          spawnParticle(particles, proj.x, proj.y, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 6, '#ea580c', 0.85, 25);
        }
      }
      projectiles.splice(i, 1);
      continue;
    }
    let hitPlatform = false;
    for (const plat of platforms) {
      if (
        proj.x + proj.radius > plat.x &&
        proj.x - proj.radius < plat.x + plat.width &&
        proj.y + proj.radius > plat.y &&
        proj.y - proj.radius < plat.y + plat.height
      ) {
        hitPlatform = true;
        if (plat.type === 'bounce') {
          const isVertical = plat.height > plat.width;
          if (isVertical) {
            proj.vx = -proj.vx * 0.9;
            proj.x += proj.vx > 0 ? 6 : -6;
          } else {
            proj.vy = -proj.vy * 0.9;
            proj.y += proj.vy > 0 ? 6 : -6;
          }
          sounds.playHit(0.4);
          spawnParticle(particles, proj.x, proj.y, (Math.random() - 0.5) * 6, -3, 5, '#ec4899', 0.8, 15);
          if (proj.type === 'atomic_chip' && proj.bounces !== undefined) {
            proj.bounces = Math.max(0, proj.bounces - 1);
            if (proj.bounces <= 0) {
              sounds.playAtomicChips();
              addScreenShake(4);
              projectiles.splice(i, 1);
            }
          }
          break;
        }
        if (proj.type === 'radioactive_bomb') {
          const isVertical = plat.height > plat.width;
          hazardAreas.push({
            id: `puddle_${Date.now()}`,
            x: proj.x - 45,
            y: isVertical ? proj.y - 10 : plat.y - 12,
            width: 90,
            height: 22,
            damagePerSec: 12,
            color: '#22c55e',
            lifetime: 3.5,
            ownerSlot: proj.ownerSlot,
            type: 'radioactive_pool',
          });
          sounds.playRadioactiveSplat();
          addScreenShake(3);
          for (let p = 0; p < 18; p++) {
            spawnParticle(particles, proj.x, isVertical ? proj.y : plat.y, (Math.random() - 0.5) * 8, -Math.random() * 6, 6, '#22c55e', 0.9, 32);
          }
          projectiles.splice(i, 1);
          break;
        } else if (proj.type === 'atomic_chip') {
          if (proj.bounces && proj.bounces > 0) {
            proj.bounces -= 1;
            const isVertical = plat.height > plat.width;
            if (isVertical) {
              proj.vx = -proj.vx * 0.8;
            } else {
              proj.vy = -proj.vy * 0.65;
              proj.vx *= 0.8;
            }
            sounds.playHit(0.5);
          } else {
            sounds.playAtomicChips();
            addScreenShake(5);
            projectiles.splice(i, 1);
            break;
          }
        } else {
          projectiles.splice(i, 1);
          break;
        }
      }
    }
    if (!hitPlatform && proj.lifetime <= 0) {
      projectiles.splice(i, 1);
    }
  }
}
export function updateHazards(
  hazards: HazardArea[],
  p1: Fighter,
  p2: Fighter,
  floatingTexts: FloatingText[],
  particles: Particle[]
) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const haz = hazards[i];
    haz.lifetime -= 1 / 60;
    [p1, p2].forEach((f) => {
      if (f.state === 'dead') return;
      if (
        f.x > haz.x &&
        f.x < haz.x + haz.width &&
        f.y > haz.y &&
        f.y - 50 < haz.y + haz.height
      ) {
        if (canDamage(f.slot)) {
          const dmg = haz.damagePerSec / 60;
          f.health = Math.max(0, f.health - dmg);
        }
        if (haz.type === 'fart_cloud') {
          f.status.burnTimer = 1.0;
        } else if (haz.type === 'radioactive_pool') {
          f.status.radioactiveTimer = 2.0;
        }
        if (Math.random() < 0.1) {
          spawnParticle(particles, f.x, f.y - 25, (Math.random() - 0.5) * 3, -2, 4, haz.color, 0.7, 15);
        }
      }
    });
    if (haz.lifetime <= 0) {
      hazards.splice(i, 1);
    }
  }
}
export function spawnParticle(
  particles: Particle[],
  x: number,
  y: number,
  vx: number,
  vy: number,
  size: number,
  color: string,
  alpha: number,
  maxLife: number,
  shape: 'circle' | 'square' | 'spark' | 'smoke' | 'rice' = 'circle'
) {
  particles.push({
    x,
    y,
    vx,
    vy,
    size,
    color,
    alpha,
    life: maxLife,
    maxLife,
    shape,
  });
}
export function spawnJumpDust(particles: Particle[], x: number, y: number) {
  for (let i = 0; i < 7; i++) {
    spawnParticle(particles, x + (Math.random() - 0.5) * 20, y, (Math.random() - 0.5) * 5, -Math.random() * 3, 5, '#e5e5e5', 0.6, 20);
  }
}
export function spawnFloatingText(
  floatingTexts: FloatingText[],
  x: number,
  y: number,
  text: string,
  color: string
) {
  floatingTexts.push({
    id: `text_${Date.now()}_${Math.random()}`,
    x,
    y,
    text,
    color,
    alpha: 1,
    scale: 1.25,
    vy: -1.4,
    life: 52,
  });
}
export function applyDamage(
  victim: Fighter,
  amount: number,
  knockX: number,
  knockY: number,
  addScreenShake: (amount: number) => void,
  floatingTexts: FloatingText[],
  particles: Particle[]
) {
  const knockMod = victim.character === 'arthur' ? 0.92 : 1.0;
  if (canDamage(victim.slot)) {
    victim.health = Math.max(0, victim.health - amount);
  }
  victim.vx = knockX * knockMod;
  victim.vy = knockY * knockMod;
  victim.state = 'hit';
  victim.isGrounded = false;
  victim.ragdollIntensity = 1.0;
  victim.angularVelocity = (knockX > 0 ? 0.35 : -0.35) * (Math.min(2.5, Math.abs(knockX) / 8 + 0.5));
  sounds.playHit(amount > 20 ? 1.8 : 1.1);
  addScreenShake(Math.min(16, amount * 0.5));
  spawnFloatingText(floatingTexts, victim.x, victim.y - 45, `-${Math.round(amount)}`, '#ef4444');
  for (let i = 0; i < 10; i++) {
    spawnParticle(particles, victim.x, victim.y - 25, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 5, '#fbbf24', 0.9, 22);
  }
  if (victim.health <= 0 && canDamage(victim.slot)) {
    victim.state = 'dead';
    victim.ragdollIntensity = 1.0;
    victim.angularVelocity *= 1.5;
    spawnFloatingText(floatingTexts, victim.x, victim.y - 65, 'K.O.!', '#dc2626');
  }
}
export function checkFallAndBoundaries(
  fighter: Fighter,
  arena: ArenaMap,
  addScreenShake: (amount: number) => void,
  floatingTexts: FloatingText[]
): boolean {
  if (fighter.state === 'dead') return true;
  if (!canDamage(fighter.slot)) return false;
  if (arena.hasLavaBottom && fighter.y > arena.lavaY) {
    fighter.health = 0;
    fighter.state = 'dead';
    fighter.ragdollIntensity = 1.0;
    fighter.angularVelocity = (Math.random() - 0.5) * 0.8;
    addScreenShake(10);
    sounds.playHit(2);
    spawnFloatingText(floatingTexts, fighter.x, arena.lavaY - 30, 'CAIU NO ABISMO!', '#ef4444');
    return true;
  }
  if (!arena.hasLavaBottom && fighter.y > arena.lavaY + 80) {
    fighter.health = 0;
    fighter.state = 'dead';
    fighter.ragdollIntensity = 1.0;
    addScreenShake(8);
    sounds.playHit(1.5);
    spawnFloatingText(floatingTexts, fighter.x, arena.lavaY - 20, 'FORA DA JAULA!', '#ef4444');
    return true;
  }
  return false;
}
