import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  CharacterId,
  CHARACTERS,
  Fighter,
  Projectile,
  HazardArea,
  Particle,
  FloatingText,
  PlayerInput,
  GameMode,
  AiDifficulty,
} from './types/game';
import { ARENAS } from './game/arenas';
import {
  createFighter,
  updateFighter,
  updateProjectiles,
  updateHazards,
  checkFallAndBoundaries,
} from './game/physics';
import { renderGame, updateCamera, Camera } from './game/renderer';
import { BotAI } from './game/botAI';
import { sounds } from './audio/soundManager';
import { VirtualControls } from './components/VirtualControls';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { LobbyModal } from './components/LobbyModal';
import { ScoreBoard } from './components/ScoreBoard';
import { PauseMenu } from './components/PauseMenu';
import { MatchOverModal } from './components/MatchOverModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { RotateDeviceOverlay } from './components/RotateDeviceOverlay';
import { requestFullscreenLandscape, exitFullscreen, isFullscreenActive } from './utils/fullscreen';
export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'char_select' | 'countdown' | 'playing' | 'round_over' | 'game_over'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('facil');
  const [mapIndex, setMapIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [p1Char, setP1Char] = useState<CharacterId>('arthur');
  const [p2Char, setP2Char] = useState<CharacterId>('lucas');
  const [roundWinnerSlot, setRoundWinnerSlot] = useState<1 | 2 | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHitboxes, setShowHitboxes] = useState<boolean>(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [onlineSlot, setOnlineSlot] = useState<1 | 2>(1);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const botAiRef = useRef<BotAI>(new BotAI());
  const remoteSnapshotRef = useRef<{
    slot: 1 | 2;
    x: number;
    y: number;
    vx: number;
    vy: number;
    bodyAngle: number;
    facing: 1 | -1;
    aimAngle: number;
    health: number;
    state: Fighter['state'];
    isGrounded: boolean;
  } | null>(null);
  const lastSnapshotSentRef = useRef<number>(0);
  const physAccumRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const p1Ref = useRef<Fighter>(createFighter(1, 'arthur', 'Arthur', ARENAS[0].spawnP1));
  const p2Ref = useRef<Fighter>(createFighter(2, 'lucas', 'Lucas', ARENAS[0].spawnP2));
  const projectilesRef = useRef<Projectile[]>([]);
  const hazardsRef = useRef<HazardArea[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const screenShakeRef = useRef<number>(0);
  const p1InputRef = useRef<PlayerInput>({
    moveX: 0,
    moveY: 0,
    aimX: 1,
    aimY: 0,
    jump: false,
    power1: false,
    power2: false,
    power3: false,
    power4: false,
  });
  const p2InputRef = useRef<PlayerInput>({
    moveX: 0,
    moveY: 0,
    aimX: -1,
    aimY: 0,
    jump: false,
    power1: false,
    power2: false,
    power3: false,
    power4: false,
  });
  const addScreenShake = useCallback((amount: number) => {
    screenShakeRef.current = Math.min(20, screenShakeRef.current + amount);
  }, []);
  const lastCameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(isFullscreenActive());
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);
  const handleToggleFullscreen = async () => {
    if (isFullscreenActive()) {
      await exitFullscreen();
      setIsFullscreen(false);
    } else {
      await requestFullscreenLandscape();
      setIsFullscreen(true);
    }
  };
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setSocketId(socket.id || null);
    });
    socket.on('connect_error', () => {});
    socket.on('disconnect', () => {});
    socket.on('room_updated', (room) => {
      setRoomData(room);
      if (socket.id && room.players[socket.id]) {
        setOnlineSlot(room.players[socket.id].slot);
      }
    });
    socket.on('start_char_selection', ({ round: nextRound }) => {
      setRound(nextRound);
      setOpponentReady(false);
      setGameState('char_select');
      setIsLobbyOpen(false);
    });
    socket.on('round_start', ({ round: nextRound, mapIndex: nextMap, players }) => {
      remoteSnapshotRef.current = null;
      setRound(nextRound);
      setMapIndex(nextMap);
      const playerList = Object.values(players) as any[];
      const p1 = playerList.find((p) => p.slot === 1);
      const p2 = playerList.find((p) => p.slot === 2);
      if (p1) setP1Char(p1.character);
      if (p2) setP2Char(p2.character);
      startCountdown(nextMap, p1?.character || 'arthur', p2?.character || 'lucas');
    });
    socket.on('remote_input', (data) => {
      if (data.slot === 1) {
        p1InputRef.current = data.input;
      } else if (data.slot === 2) {
        p2InputRef.current = data.input;
      }
    });
    socket.on('remote_fighter_snapshot', (snap) => {
      remoteSnapshotRef.current = snap;
    });
    socket.on('round_end', ({ winnerSlot, room }) => {
      setRoundWinnerSlot(winnerSlot);
      setGameState('round_over');
      const p1 = Object.values(room.players).find((p: any) => p.slot === 1) as any;
      const p2 = Object.values(room.players).find((p: any) => p.slot === 2) as any;
      if (p1) setP1Wins(p1.score);
      if (p2) setP2Wins(p2.score);
    });
    socket.on('match_over', ({ winnerSlot, room }) => {
      setRoundWinnerSlot(winnerSlot);
      setGameState('game_over');
      const p1 = Object.values(room.players).find((p: any) => p.slot === 1) as any;
      const p2 = Object.values(room.players).find((p: any) => p.slot === 2) as any;
      if (p1) setP1Wins(p1.score);
      if (p2) setP2Wins(p2.score);
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  const broadcastMyInput = useCallback(() => {
    if (gameMode !== 'online' || !socketRef.current) return;
    const input = onlineSlot === 1 ? p1InputRef.current : p2InputRef.current;
    socketRef.current.emit('player_input', {
      slot: onlineSlot,
      input,
    });
  }, [gameMode, onlineSlot]);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const syncInputsFromKeys = useCallback(() => {
    const keys = pressedKeysRef.current;
    const p1 = p1InputRef.current;
    const p1Left = keys.has('KeyA');
    const p1Right = keys.has('KeyD');
    p1.moveX = (p1Right ? 1 : 0) - (p1Left ? 1 : 0);
    p1.moveY = keys.has('KeyS') ? 1 : 0;
    p1.jump = keys.has('KeyW') || keys.has('Space');
    if (keys.has('KeyJ') || keys.has('Digit1')) p1.power1 = true;
    if (keys.has('KeyK') || keys.has('Digit2')) p1.power2 = true;
    if (keys.has('KeyE') || keys.has('KeyF') || keys.has('KeyL') || keys.has('Digit3')) p1.power3 = true;
    if (keys.has('KeyQ') || keys.has('KeyR') || keys.has('ShiftLeft') || keys.has('KeyU') || keys.has('Digit4')) p1.power4 = true;
    const p2 = p2InputRef.current;
    const p2Left = keys.has('ArrowLeft');
    const p2Right = keys.has('ArrowRight');
    p2.moveX = (p2Right ? 1 : 0) - (p2Left ? 1 : 0);
    p2.moveY = keys.has('ArrowDown') ? 1 : 0;
    p2.jump = keys.has('ArrowUp');
    if (keys.has('Numpad1') || keys.has('KeyI')) p2.power1 = true;
    if (keys.has('Numpad2') || keys.has('KeyO')) p2.power2 = true;
    if (keys.has('Numpad3') || keys.has('KeyP')) p2.power3 = true;
    if (keys.has('Numpad4') || keys.has('BracketLeft') || keys.has('NumpadEnter')) p2.power4 = true;
    broadcastMyInput();
  }, [broadcastMyInput]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused((prev) => !prev);
        return;
      }
      if (e.code === 'KeyH') {
        setShowHitboxes((prev) => !prev);
        return;
      }
      pressedKeysRef.current.add(e.code);
      syncInputsFromKeys();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.code);
      const p1 = p1InputRef.current;
      if (e.code === 'KeyJ' || e.code === 'Digit1') p1.power1 = false;
      if (e.code === 'KeyK' || e.code === 'Digit2') p1.power2 = false;
      if (e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'KeyL' || e.code === 'Digit3') p1.power3 = false;
      if (e.code === 'KeyQ' || e.code === 'KeyR' || e.code === 'ShiftLeft' || e.code === 'KeyU' || e.code === 'Digit4') p1.power4 = false;
      const p2 = p2InputRef.current;
      if (e.code === 'Numpad1' || e.code === 'KeyI') p2.power1 = false;
      if (e.code === 'Numpad2' || e.code === 'KeyO') p2.power2 = false;
      if (e.code === 'Numpad3' || e.code === 'KeyP') p2.power3 = false;
      if (e.code === 'Numpad4' || e.code === 'BracketLeft' || e.code === 'NumpadEnter') p2.power4 = false;
      syncInputsFromKeys();
    };
    const handleBlur = () => {
      pressedKeysRef.current.clear();
      syncInputsFromKeys();
    };
    const handleWindowMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || (gameState !== 'playing' && gameState !== 'countdown')) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const mouseCanvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseCanvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
      const camera = lastCameraRef.current;
      const worldX = mouseCanvasX / camera.zoom + camera.x;
      const worldY = mouseCanvasY / camera.zoom + camera.y;
      const myFighter = onlineSlot === 1 || gameMode !== 'online' ? p1Ref.current : p2Ref.current;
      const input = onlineSlot === 1 || gameMode !== 'online' ? p1InputRef.current : p2InputRef.current;
      const dx = worldX - myFighter.x;
      const dy = worldY - (myFighter.y - 28);
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        input.aimX = dx / dist;
        input.aimY = dy / dist;
        broadcastMyInput();
      }
    };
    const handleWindowMouseDown = (e: MouseEvent) => {
      if (gameState !== 'playing') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) return;
      const input = onlineSlot === 1 || gameMode !== 'online' ? p1InputRef.current : p2InputRef.current;
      if (e.button === 0) {
        input.power1 = true;
        broadcastMyInput();
      } else if (e.button === 2) {
        e.preventDefault();
        input.power2 = true;
        broadcastMyInput();
      } else if (e.button === 1) {
        e.preventDefault();
        input.power3 = true;
        broadcastMyInput();
      }
    };
    const handleWindowMouseUp = (e: MouseEvent) => {
      const input = onlineSlot === 1 || gameMode !== 'online' ? p1InputRef.current : p2InputRef.current;
      if (e.button === 0) input.power1 = false;
      if (e.button === 2) input.power2 = false;
      if (e.button === 1) input.power3 = false;
      broadcastMyInput();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mousedown', handleWindowMouseDown);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mousedown', handleWindowMouseDown);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [gameState, gameMode, onlineSlot, broadcastMyInput, syncInputsFromKeys]);
  const startCountdown = (currentMapIdx: number, char1: CharacterId, char2: CharacterId) => {
    const arena = ARENAS[currentMapIdx];
    const finalChar2: CharacterId = gameMode === 'solo'
      ? (char1 === 'arthur' ? 'lucas' : 'arthur')
      : char2;
    const p1Name = char1 === 'arthur' ? 'Arthur' : 'Lucas';
    const p2Name = gameMode === 'solo'
      ? `${finalChar2 === 'arthur' ? 'Arthur' : 'Lucas'} (Bot)`
      : (finalChar2 === 'arthur' ? 'Arthur' : 'Lucas');
    remoteSnapshotRef.current = null;
    physAccumRef.current = 0;
    p1Ref.current = createFighter(1, char1, p1Name, arena.spawnP1);
    p2Ref.current = createFighter(2, finalChar2, p2Name, arena.spawnP2);
    projectilesRef.current = [];
    hazardsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    screenShakeRef.current = 0;
    setGameState('countdown');
    setCountdown(3);
    let count = 3;
    sounds.playBeep(false);
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sounds.playBeep(false);
      } else if (count === 0) {
        setCountdown(0);
        sounds.playBeep(true);
      } else {
        clearInterval(timer);
        setGameState('playing');
      }
    }, 800);
  };
  useEffect(() => {
    let animId: number;
    const FIXED_STEP = 1000 / 60;
    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
          }
          const arena = ARENAS[mapIndex];
          const p1 = p1Ref.current;
          const p2 = p2Ref.current;
          if (gameState === 'playing' && !isPaused) {
            if (screenShakeRef.current > 0) {
              screenShakeRef.current *= 0.9;
              if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
            }
            if (gameMode === 'solo') {
              const botInput = botAiRef.current.update(p2, p1, arena.platforms, aiDifficulty);
              p2InputRef.current = botInput;
            }
            if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = now;
            let frameDt = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;
            if (frameDt > 250) frameDt = 250;
            if (frameDt < 0) frameDt = 0;
            physAccumRef.current += frameDt;
            let steps = 0;
            const stepPhysics = () => {
              updateFighter(
                p1,
                p1InputRef.current,
                arena.platforms,
                p2,
                projectilesRef.current,
                hazardsRef.current,
                particlesRef.current,
                floatingTextsRef.current,
                addScreenShake
              );
              updateFighter(
                p2,
                p2InputRef.current,
                arena.platforms,
                p1,
                projectilesRef.current,
                hazardsRef.current,
                particlesRef.current,
                floatingTextsRef.current,
                addScreenShake
              );
              updateProjectiles(
                projectilesRef.current,
                arena.platforms,
                p1,
                p2,
                hazardsRef.current,
                particlesRef.current,
                floatingTextsRef.current,
                addScreenShake
              );
              updateHazards(
                hazardsRef.current,
                p1,
                p2,
                floatingTextsRef.current,
                particlesRef.current
              );
            };
            while (physAccumRef.current >= FIXED_STEP && steps < 4) {
              stepPhysics();
              physAccumRef.current -= FIXED_STEP;
              steps += 1;
            }
            if (steps === 4) physAccumRef.current = 0;
            if (gameMode === 'online') {
              const mine = onlineSlot === 1 ? p1 : p2;
              const theirs = onlineSlot === 1 ? p2 : p1;
              if (now - lastSnapshotSentRef.current > 100) {
                lastSnapshotSentRef.current = now;
                socketRef.current?.emit('fighter_snapshot', {
                  slot: onlineSlot,
                  x: mine.x,
                  y: mine.y,
                  vx: mine.vx,
                  vy: mine.vy,
                  bodyAngle: mine.bodyAngle,
                  facing: mine.facing,
                  aimAngle: mine.aimAngle,
                  health: mine.health,
                  state: mine.state,
                  isGrounded: mine.isGrounded,
                });
              }
              const snap = remoteSnapshotRef.current;
              if (snap && snap.slot !== onlineSlot) {
                const dx = snap.x - theirs.x;
                const dy = snap.y - theirs.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 220) {
                  theirs.x = snap.x;
                  theirs.y = snap.y;
                  theirs.vx = snap.vx;
                  theirs.vy = snap.vy;
                } else if (dist > 0.5) {
                  const t = Math.min(1, dist / 60);
                  theirs.x += dx * t;
                  theirs.y += dy * t;
                  theirs.vx = snap.vx;
                  theirs.vy = snap.vy;
                }
                theirs.bodyAngle = snap.bodyAngle;
                theirs.facing = snap.facing;
                theirs.aimAngle = snap.aimAngle;
                theirs.state = snap.state;
                theirs.isGrounded = snap.isGrounded;
                if (Math.abs(theirs.health - snap.health) > 0.5) {
                  theirs.health = snap.health;
                }
              }
            }
            const p1Fell = checkFallAndBoundaries(p1, arena, addScreenShake, floatingTextsRef.current);
            const p2Fell = checkFallAndBoundaries(p2, arena, addScreenShake, floatingTextsRef.current);
            if ((p1.health <= 0 || p1Fell || p2.health <= 0 || p2Fell) && gameState === 'playing') {
              handleRoundFinish(p1.health <= 0 || p1Fell ? 2 : 1);
            }
          }
          const camera = updateCamera(p1, p2, canvas.width, canvas.height);
          lastCameraRef.current = camera;
          renderGame(
            ctx,
            canvas.width,
            canvas.height,
            arena,
            p1,
            p2,
            projectilesRef.current,
            hazardsRef.current,
            particlesRef.current,
            floatingTextsRef.current,
            camera,
            screenShakeRef.current,
            showHitboxes
          );
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, isPaused, mapIndex, gameMode, onlineSlot, aiDifficulty, addScreenShake, showHitboxes]);
  const handleRoundFinish = (winnerSlot: 1 | 2) => {
    setRoundWinnerSlot(winnerSlot);
    setGameState('round_over');
    sounds.playVictory();
    const newP1Score = winnerSlot === 1 ? p1Wins + 1 : p1Wins;
    const newP2Score = winnerSlot === 2 ? p2Wins + 1 : p2Wins;
    setP1Wins(newP1Score);
    setP2Wins(newP2Score);
    if (gameMode === 'online' && socketRef.current && onlineSlot === 1) {
      socketRef.current.emit('round_finished', { winnerSlot });
      return;
    }
    const needed = Math.ceil(maxRounds / 2);
    const matchFinished = newP1Score >= needed || newP2Score >= needed;
    setTimeout(() => {
      if (matchFinished) {
        setGameState('game_over');
      } else {
        setRound((r) => r + 1);
        setMapIndex((m) => (m + 1) % ARENAS.length);
        if (gameMode === 'solo') {
          setP2Char((p) => (p1Char === 'arthur' ? 'lucas' : 'arthur'));
        }
        setGameState('char_select');
      }
    }, 2500);
  };
  const handleConfirmCharacters = (c1: CharacterId, c2: CharacterId) => {
    const finalP2 = gameMode === 'solo' ? (c1 === 'arthur' ? 'lucas' : 'arthur') : c2;
    setP1Char(c1);
    setP2Char(finalP2);
    if (gameMode === 'online') {
      const myChar = onlineSlot === 1 ? c1 : c2;
      socketRef.current?.emit('select_character', { character: myChar });
      return;
    }
    startCountdown(mapIndex, c1, finalP2);
  };
  const emitWithRetry = useCallback((event: string, payload: unknown, onAck: (res: any) => void, retries = 10) => {
    const socket = socketRef.current;
    if (!socket) return;
    let attempts = 0;
    const send = () => {
      attempts += 1;
      try {
        socket.timeout(10000).emit(event, payload, (err: unknown, res: any) => {
          if (err) {
            if (attempts < retries) setTimeout(send, 2000);
            return;
          }
          onAck(res);
        });
      } catch {
        if (attempts < retries) setTimeout(send, 2000);
      }
    };
    send();
  }, []);
  const handleCreateRoom = (playerName: string, roundsMax: number, selectedMap: number) => {
    setMaxRounds(roundsMax);
    setMapIndex(selectedMap);
    setLobbyError(null);
    emitWithRetry(
      'create_room',
      { playerName, character: p1Char },
      (res: { success: boolean; room?: any; error?: string }) => {
        if (res.success) {
          setRoomData(res.room);
          setOnlineSlot(1);
        } else {
          setLobbyError(res.error || 'Erro ao criar sala');
        }
      }
    );
  };
  const handleJoinRoom = (code: string, playerName: string) => {
    setLobbyError(null);
    emitWithRetry(
      'join_room',
      { code, playerName, character: p2Char },
      (res: { success: boolean; room?: any; error?: string }) => {
        if (res.success) {
          setRoomData(res.room);
          setOnlineSlot(2);
        } else {
          setLobbyError(res.error || 'Erro ao entrar na sala');
        }
      }
    );
  };
  const handleStartOnlineMatch = () => {
    socketRef.current?.emit('start_match', { mapIndex, maxRounds });
  };
  const handleRematch = () => {
    setP1Wins(0);
    setP2Wins(0);
    setRound(1);
    setMapIndex(0);
    if (gameMode === 'online') {
      socketRef.current?.emit('request_rematch');
      return;
    }
    if (gameMode === 'solo') {
      setP2Char(p1Char === 'arthur' ? 'lucas' : 'arthur');
    }
    setGameState('char_select');
  };
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-['Fredoka',sans-serif] select-none text-white">
      {}
      <canvas
        ref={canvasRef}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 w-full h-full block touch-none cursor-crosshair"
      />
      {}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-blue-950/85 via-neutral-950/90 to-amber-950/90 backdrop-blur-sm overflow-y-auto">
          {}
          <div className="text-center mt-4">
            <span className="px-4 py-1.5 rounded-full bg-yellow-400 text-black font-black text-xs uppercase tracking-widest shadow-lg inline-block mb-2">
              💥 SUPREME DUELIST STICKMAN EDITION
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-yellow-300 to-amber-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] tracking-tight">
              ARTHUR VS LUCAS
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 font-semibold max-w-lg mx-auto mt-2">
              Duelo de bonecos palito com física ragdoll e poderes hilários! Escolha seu personagem a cada rodada!
            </p>
          </div>
          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full my-6">
            {}
            <div className="bg-sky-950/50 border-4 border-sky-400/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-3xl flex items-center justify-center shadow-lg">
                    🧢
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-sky-400">ARTHUR</h3>
                    <span className="text-xs text-sky-200 font-bold">O Pesado Destruidor</span>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">🧈</span>
                    <div>
                      <strong className="text-yellow-300">Rajada de gordura:</strong> Disparo de banha fervente
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">💨</span>
                    <div>
                      <strong className="text-orange-400">Peido quente:</strong> Foguete flamejante e nuvem de fogo
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">☣️</span>
                    <div>
                      <strong className="text-green-400">Gordura radioativa:</strong> Poça atômica venenosa
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">⛓️</span>
                    <div>
                      <strong className="text-red-400">Tortura:</strong> Investida giratória brutal de correntes
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {}
            <div className="bg-amber-950/50 border-4 border-amber-400/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-3xl flex items-center justify-center shadow-lg">
                    🥋
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-400">LUCAS</h3>
                    <span className="text-xs text-amber-200 font-bold">O Mestre da Gambiarra</span>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">💪</span>
                    <div>
                      <strong className="text-red-400">Tortura braçal:</strong> Punho gigante marombado supersônico
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">🍟</span>
                    <div>
                      <strong className="text-orange-400">Chips atômicos:</strong> Salgadinho granada explosivo
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">🥤</span>
                    <div>
                      <strong className="text-cyan-400">Rajada de água:</strong> Canhão hidropropulsor de garrafinha
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                    <span className="text-lg">🌾</span>
                    <div>
                      <strong className="text-purple-400">Espingarda de arroz:</strong> Disparo devastador de grãos
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl pb-4">
            <button
              onClick={() => {
                setGameMode('solo');
                setP1Wins(0);
                setP2Wins(0);
                setRound(1);
                setP2Char(p1Char === 'arthur' ? 'lucas' : 'arthur');
                setGameState('char_select');
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-lg uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-3 border-2 border-sky-300"
            >
              <span className="text-2xl">🤖</span>
              <div className="text-left">
                <div className="leading-tight">SOLO VS IA</div>
                <div className="text-[10px] text-sky-200 font-bold tracking-normal opacity-90 normal-case">
                  Duelo 1v1 contra o oposto
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setGameMode('online');
                setIsLobbyOpen(true);
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-600 to-pink-600 hover:brightness-110 active:scale-95 text-white font-black text-lg uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-3 border-2 border-purple-300"
            >
              <span className="text-2xl">🌐</span>
              <div className="text-left">
                <div className="leading-tight">SALA ONLINE</div>
                <div className="text-[10px] text-purple-200 font-bold tracking-normal opacity-90 normal-case">
                  Salas privadas com amigos
                </div>
              </div>
            </button>
          </div>
          {}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mt-2">
            <button
              onClick={() => setShowControlsGuide(true)}
              className="flex-1 py-3 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border-2 border-yellow-400/80 text-yellow-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <span>🎮</span> CONTROLES
            </button>
            <button
              onClick={handleToggleFullscreen}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 border-2 border-emerald-300 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <span>{isFullscreen ? '⤦' : '⛶'}</span> {isFullscreen ? 'SAIR DA TELA CHEIA' : 'TELA CHEIA LANDSCAPE 📱'}
            </button>
          </div>
        </div>
      )}
      {}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-in zoom-in-50 duration-200">
            <span className="text-8xl sm:text-9xl font-black text-yellow-400 drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] tracking-tight">
              {countdown > 0 ? countdown : 'LUTA! ⚔️'}
            </span>
            <div className="text-xl font-bold text-white mt-2 uppercase tracking-widest drop-shadow-md">
              RODADA {round}
            </div>
          </div>
        </div>
      )}
      {}
      {(gameState === 'playing' || gameState === 'countdown' || gameState === 'round_over') && (
        <ScoreBoard
          p1={p1Ref.current}
          p2={p2Ref.current}
          p1Wins={p1Wins}
          p2Wins={p2Wins}
          maxRounds={maxRounds}
          round={round}
          gameMode={gameMode}
          arena={ARENAS[mapIndex]}
          onlineRoomCode={roomData?.code}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenPause={() => setIsPaused(true)}
          onOpenControls={() => setShowControlsGuide(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}
      {}
      {(gameState === 'playing' || gameState === 'countdown') && (
        <VirtualControls
          fighter={onlineSlot === 1 || gameMode !== 'online' ? p1Ref.current : p2Ref.current}
          enemy={onlineSlot === 1 || gameMode !== 'online' ? p2Ref.current : p1Ref.current}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onMove={(dx, dy) => {
            const input = onlineSlot === 1 || gameMode !== 'online' ? p1InputRef.current : p2InputRef.current;
            input.moveX = dx;
            input.moveY = dy;
            broadcastMyInput();
          }}
          onAim={(ax, ay) => {
            const input = onlineSlot === 1 || gameMode !== 'online' ? p1InputRef.current : p2InputRef.current;
            input.aimX = ax;
            input.aimY = ay;
            broadcastMyInput();
          }}
          onJump={() => {
            const input = onlineSlot === 1 || gameMode !== 'online' ? p1InputRef.current : p2InputRef.current;
            input.jump = true;
            broadcastMyInput();
            setTimeout(() => {
              input.jump = false;
              broadcastMyInput();
            }, 100);
          }}
          onPower={(idx) => {
            const input = onlineSlot === 1 || gameMode !== 'online' ? p1InputRef.current : p2InputRef.current;
            if (idx === 0) input.power1 = true;
            if (idx === 1) input.power2 = true;
            if (idx === 2) input.power3 = true;
            if (idx === 3) input.power4 = true;
            broadcastMyInput();
            setTimeout(() => {
              if (idx === 0) input.power1 = false;
              if (idx === 1) input.power2 = false;
              if (idx === 2) input.power3 = false;
              if (idx === 3) input.power4 = false;
              broadcastMyInput();
            }, 100);
          }}
          onPause={() => setIsPaused(true)}
        />
      )}
      {}
      {gameState === 'round_over' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-xs">
          <div className="text-center animate-in zoom-in-75 duration-200">
            <span className="text-2xl font-black text-yellow-400 uppercase tracking-widest block mb-2">
              FIM DA RODADA {round}
            </span>
            <h2 className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              {roundWinnerSlot === 1
                ? `${p1Ref.current.name} VENCEU! 🏆`
                : `${p2Ref.current.name} VENCEU! 🏆`}
            </h2>
            <span className="text-sm font-semibold text-neutral-300 mt-2 block animate-pulse">
              Preparando troca de personagens para a próxima rodada...
            </span>
          </div>
        </div>
      )}
      {}
      {gameState === 'char_select' && (
        <CharacterSelectModal
          round={round}
          gameMode={gameMode}
          initialP1Char={p1Char}
          initialP2Char={p2Char}
          onConfirm={handleConfirmCharacters}
          onlinePlayerSlot={onlineSlot}
          opponentSelected={opponentReady}
        />
      )}
      {}
      <LobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        roomData={roomData}
        currentSocketId={socketId}
        onStartOnlineMatch={handleStartOnlineMatch}
        errorMessage={lobbyError}
      />
      {}
      {showHitboxes && (gameState === 'playing' || gameState === 'countdown') && (
        <div className="absolute top-24 left-4 z-20 pointer-events-auto">
          <button
            onClick={() => setShowHitboxes(false)}
            className="px-2.5 py-1 rounded-lg bg-pink-500/80 hover:bg-pink-600 border border-pink-300 text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-xs flex items-center gap-1.5 transition-all"
            title="Clique para ocultar as hitboxes ou aperte 'H'"
          >
            <span>🎯 HITBOXES VISÍVEIS [H]</span>
            <span className="text-pink-200">✕</span>
          </button>
        </div>
      )}
      {}
      <PauseMenu
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        onRestartMatch={() => {
          setIsPaused(false);
          handleRematch();
        }}
        onSelectMode={(mode) => {
          setIsPaused(false);
          setGameMode(mode);
          handleRematch();
        }}
        currentMode={gameMode}
        aiDifficulty={aiDifficulty}
        onChangeAiDifficulty={setAiDifficulty}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenOnlineLobby={() => setIsLobbyOpen(true)}
        showHitboxes={showHitboxes}
        onToggleHitboxes={() => setShowHitboxes((p) => !p)}
      />
      {}
      {gameState === 'game_over' && (
        <MatchOverModal
          winnerSlot={roundWinnerSlot || 1}
          winnerName={roundWinnerSlot === 1 ? p1Ref.current.name : p2Ref.current.name}
          winnerCharacter={roundWinnerSlot === 1 ? p1Char : p2Char}
          p1Score={p1Wins}
          p2Score={p2Wins}
          onRematch={handleRematch}
          onBackToMenu={() => setGameState('menu')}
        />
      )}
      {}
      <ControlsGuideModal
        isOpen={showControlsGuide}
        onClose={() => setShowControlsGuide(false)}
      />
      {}
      <RotateDeviceOverlay />
    </div>
  );
}
