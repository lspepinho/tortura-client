export type CharacterId = 'arthur' | 'lucas';
export interface PowerDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  cooldown: number;
  icon: string;
  color: string;
  hotkeyPc: string;
  hotkeyP2: string;
}
export interface CharacterConfig {
  id: CharacterId;
  name: string;
  title: string;
  color: string;
  accentColor: string;
  headgear: 'crown' | 'bandana' | 'cap' | 'hair';
  description: string;
  powers: [PowerDefinition, PowerDefinition, PowerDefinition, PowerDefinition];
}
export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  arthur: {
    id: 'arthur',
    name: 'Arthur',
    title: 'O Pesado Destruidor',
    color: '#0284c7',
    accentColor: '#38bdf8',
    headgear: 'cap',
    description: 'Lutador robusto e pesado com ataques explosivos e gordurosos!',
    powers: [
      {
        id: 'rajada_gordura',
        name: 'Rajada de gordura',
        shortName: 'Gordura',
        description: 'Dispara 4 projéteis de banha fervente que causam dano e desaceleram.',
        cooldown: 3.5,
        icon: '🧈',
        color: '#eab308',
        hotkeyPc: '1 / J',
        hotkeyP2: 'Num 1 / U',
      },
      {
        id: 'peido_quente',
        name: 'Peido quente',
        shortName: 'Peido 🔥',
        description: 'Propulsão a jato de gás tóxico em chamas que queima e arremessa!',
        cooldown: 4.5,
        icon: '💨',
        color: '#f97316',
        hotkeyPc: '2 / K',
        hotkeyP2: 'Num 2 / I',
      },
      {
        id: 'gordura_radioativa',
        name: 'Gordura radioativa',
        shortName: 'Radioativa ☢️',
        description: 'Bomba de lodo verde que espalha poça radioativa venenosa no chão.',
        cooldown: 5.5,
        icon: '☣️',
        color: '#22c55e',
        hotkeyPc: '3 / L',
        hotkeyP2: 'Num 3 / O',
      },
      {
        id: 'tortura_arthur',
        name: 'Tortura',
        shortName: 'Tortura ⛓️',
        description: 'Investida brutal giratória com correntes que agarra e espanca o inimigo!',
        cooldown: 7.0,
        icon: '⛓️',
        color: '#ef4444',
        hotkeyPc: '4 / U',
        hotkeyP2: 'Num 4 / P',
      },
    ],
  },
  lucas: {
    id: 'lucas',
    name: 'Lucas',
    title: 'O Mestre da Trapaça',
    color: '#f59e0b',
    accentColor: '#fbbf24',
    headgear: 'bandana',
    description: 'Lutador ágil e traiçoeiro armado com comidas atômicas e armas improvisadas!',
    powers: [
      {
        id: 'tortura_bracal',
        name: 'Tortura braçal',
        shortName: 'Braçal 💪',
        description: 'Braço gigante marombado que desfere um soco supersônico estrondoso!',
        cooldown: 3.8,
        icon: '💪',
        color: '#ef4444',
        hotkeyPc: '1 / J',
        hotkeyP2: 'Num 1 / U',
      },
      {
        id: 'chips_atomicos',
        name: 'Chips atômicos',
        shortName: 'Chips 💥',
        description: 'Lança salgadinhos atômicos crocantes que detonam como mini-granadas.',
        cooldown: 4.5,
        icon: '🍟',
        color: '#ea580c',
        hotkeyPc: '2 / K',
        hotkeyP2: 'Num 2 / I',
      },
      {
        id: 'rajada_agua',
        name: 'Rajada de água',
        shortName: 'Água 💧',
        description: 'Jato de alta pressão de garrafinha que empurra e levita o rival no ar.',
        cooldown: 5.0,
        icon: '🥤',
        color: '#06b6d4',
        hotkeyPc: '3 / L',
        hotkeyP2: 'Num 3 / O',
      },
      {
        id: 'espingarda_arroz',
        name: 'Espingarda de arroz',
        shortName: 'Arroz 🌾',
        description: 'Escopeta rústica com tiro em cone de grãos de arroz letais e alto recuo.',
        cooldown: 6.5,
        icon: '💥',
        color: '#a855f7',
        hotkeyPc: '4 / U',
        hotkeyP2: 'Num 4 / P',
      },
    ],
  },
};
export interface StickmanLimbs {
  headAngle: number;
  torsoAngle: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftForearmAngle: number;
  rightForearmAngle: number;
  leftLegAngle: number;
  rightLegAngle: number;
  leftCalfAngle: number;
  rightCalfAngle: number;
  limbVelocities: {
    lArm: number;
    rArm: number;
    lLeg: number;
    rLeg: number;
  };
}
export interface Fighter {
  slot: 1 | 2;
  name: string;
  character: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bodyAngle: number;
  angularVelocity: number;
  ragdollIntensity: number;
  facing: 1 | -1;
  aimAngle: number;
  health: number;
  maxHealth: number;
  isGrounded: boolean;
  canDoubleJump: boolean;
  jumpLatch?: boolean;
  isStunned: boolean;
  stunTimer: number;
  cooldowns: [number, number, number, number];
  maxCooldowns: [number, number, number, number];
  state: 'idle' | 'walk' | 'jump' | 'fall' | 'attack' | 'hit' | 'dead';
  activeAttack: string | null;
  attackTimer: number;
  runCycle: number;
  limbs: StickmanLimbs;
  status: {
    radioactiveTimer: number;
    burnTimer: number;
    slowTimer: number;
  };
}
export interface Projectile {
  id: string;
  type:
    | 'fat_glob'
    | 'toxic_puddle'
    | 'radioactive_bomb'
    | 'atomic_chip'
    | 'water_jet'
    | 'rice_pellet';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  knockback: number;
  ownerSlot: 1 | 2;
  lifetime: number;
  maxLifetime: number;
  color: string;
  bounces?: number;
}
export interface HazardArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  damagePerSec: number;
  color: string;
  lifetime: number;
  ownerSlot: 1 | 2;
  type: 'fart_cloud' | 'radioactive_pool';
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'spark' | 'smoke' | 'rice';
}
export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  life: number;
}
export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'grass' | 'metal' | 'bridge' | 'bounce' | 'hazard';
  color?: string;
}
export interface ArenaMap {
  id: string;
  name: string;
  subtitle: string;
  bgColorTop: string;
  bgColorBottom: string;
  platforms: Platform[];
  spawnP1: { x: number; y: number };
  spawnP2: { x: number; y: number };
  hasLavaBottom: boolean;
  lavaY: number;
}
export interface PlayerInput {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  jump: boolean;
  power1: boolean;
  power2: boolean;
  power3: boolean;
  power4: boolean;
}
export type GameMode = 'solo' | 'online';
export type AiDifficulty = 'facil' | 'medio' | 'insano';
