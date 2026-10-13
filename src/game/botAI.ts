import { Fighter, PlayerInput, Platform, AiDifficulty } from '../types/game';
export class BotAI {
  private lastJumpTime = 0;
  private actionCooldown = 0;
  private idleTimer = 0;
  private currentAimError = 0;
  public update(bot: Fighter, target: Fighter, platforms: Platform[], difficulty: AiDifficulty): PlayerInput {
    const input: PlayerInput = {
      moveX: 0,
      moveY: 0,
      aimX: 1,
      aimY: 0,
      jump: false,
      power1: false,
      power2: false,
      power3: false,
      power4: false,
    };
    if (bot.state === 'dead' || bot.isStunned) return input;
    const dx = target.x - bot.x;
    const dy = target.y - bot.y;
    const dist = Math.hypot(dx, dy);
    if (Math.random() < 0.05) {
      const maxError = difficulty === 'facil' ? 0.8 : difficulty === 'medio' ? 0.35 : 0.1;
      this.currentAimError = (Math.random() - 0.5) * maxError;
    }
    const baseAngle = Math.atan2(dy - 10, dx);
    const aimedAngle = baseAngle + this.currentAimError;
    input.aimX = Math.cos(aimedAngle);
    input.aimY = Math.sin(aimedAngle);
    if (this.idleTimer > 0) {
      this.idleTimer--;
      input.moveX = (Math.random() - 0.5) * 0.4;
      return input;
    }
    const idleChance = difficulty === 'facil' ? 0.04 : difficulty === 'medio' ? 0.015 : 0.002;
    if (Math.random() < idleChance) {
      this.idleTimer = difficulty === 'facil' ? 45 + Math.floor(Math.random() * 40) : 20;
      return input;
    }
    const now = Date.now();
    let isNearEdge = true;
    for (const p of platforms) {
      if (bot.x >= p.x && bot.x <= p.x + p.width && Math.abs(bot.y - p.y) < 18) {
        if (bot.x > p.x + 40 && bot.x < p.x + p.width - 40) {
          isNearEdge = false;
        }
        break;
      }
    }
    if (Math.abs(dx) > (difficulty === 'facil' ? 120 : 60)) {
      input.moveX = dx > 0 ? 0.8 : -0.8;
    } else {
      input.moveX = Math.sin(Date.now() * 0.003) * 0.5;
    }
    const jumpCooldown = difficulty === 'facil' ? 1200 : difficulty === 'medio' ? 700 : 400;
    if (isNearEdge && now - this.lastJumpTime > jumpCooldown) {
      if (Math.random() < (difficulty === 'facil' ? 0.6 : 0.95)) {
        input.jump = true;
        this.lastJumpTime = now;
      }
    }
    if (bot.isGrounded && Math.abs(input.moveX) > 0.4 && Math.abs(bot.vx) < 0.6 && now - this.lastJumpTime > 500) {
      input.jump = true;
      this.lastJumpTime = now;
    }
    if (dy < -60 && now - this.lastJumpTime > jumpCooldown) {
      input.jump = true;
      this.lastJumpTime = now;
    }
    if (bot.y > 550 && now - this.lastJumpTime > 350) {
      input.jump = true;
      this.lastJumpTime = now;
      if (bot.character === 'arthur' && bot.cooldowns[1] <= 0) {
        input.aimY = 1;
        input.power2 = true;
      }
    }
    const triggerChance = difficulty === 'insano' ? 0.25 : difficulty === 'medio' ? 0.1 : 0.035;
    this.actionCooldown--;
    if (this.actionCooldown <= 0 && Math.random() < triggerChance) {
      this.actionCooldown = difficulty === 'insano' ? 25 : difficulty === 'medio' ? 55 : 110;
      if (bot.character === 'arthur') {
        if (dist < 120 && bot.cooldowns[3] <= 0) {
          input.power4 = true;
        } else if (dist < 190 && bot.cooldowns[1] <= 0 && Math.random() < 0.5) {
          input.power2 = true;
        } else if (dist < 340 && bot.cooldowns[0] <= 0) {
          input.power1 = true;
        } else if (bot.cooldowns[2] <= 0) {
          input.power3 = true;
        }
      } else {
        if (dist < 110 && bot.cooldowns[0] <= 0) {
          input.power1 = true;
        } else if (dist < 200 && bot.cooldowns[3] <= 0) {
          input.power4 = true;
        } else if (dist < 280 && bot.cooldowns[2] <= 0) {
          input.power3 = true;
        } else if (bot.cooldowns[1] <= 0) {
          input.power2 = true;
        }
      }
    }
    return input;
  }
}
