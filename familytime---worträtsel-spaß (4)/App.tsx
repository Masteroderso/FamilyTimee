
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameStatus, Player, Role, WordPair, GameType } from './types';
import { generateWordPair } from './services/geminiService';
import { SoundService } from './services/soundService';
import { MIN_PLAYERS, MAX_PLAYERS, WORD_CATEGORIES } from './constants';

const STORAGE_KEY_NAMES = 'familytime_player_names';
const STORAGE_KEY_SETTINGS = 'familytime_game_settings';
const STORAGE_KEY_HISTORY = 'familytime_word_history';

const PLAYER_COLORS = [
  "#ef4444", "#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", 
  "#06b6d4", "#6366f1", "#84cc16", "#a855f7", "#8b5cf6", "#f43f5e",
];

const AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Hannes",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Klaus",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Lars",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Mia",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Tom"
];

const IMPOSTOR_LOGO = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/fc/68/b9/fc68b9c6-4289-05ef-db0d-0964f7eedfc4/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x630wa.jpg";
const WORD_SPY_LOGO = "https://cdn-icons-png.flaticon.com/512/617/617034.png";
const FRAGEN_MIX_LOGO = "https://img.freepik.com/vektoren-premium/fragezeichen-symbol-frage-box-logo-vektor-blasen_152104-1133.jpg";

// --- HELPERS ---
const getDynamicFontSize = (word: string, baseClass: 'large' | 'medium' = 'large') => {
  const len = word.length;
  if (baseClass === 'large') {
    if (len > 30) return 'text-xl';
    if (len > 20) return 'text-2xl';
    if (len > 15) return 'text-3xl';
    if (len > 8) return 'text-4xl';
    return 'text-5xl';
  } else {
    if (len > 30) return 'text-lg';
    if (len > 20) return 'text-xl';
    if (len > 12) return 'text-2xl';
    if (len > 8) return 'text-3xl';
    return 'text-4xl';
  }
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- COMPONENTS ---

const MusicIndicator: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => (
  <div className="flex items-end gap-[2px] h-3 ml-2">
    {[1, 2, 3, 4].map(i => (
      <div 
        key={i} 
        className={`w-[2px] bg-red-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-1'}`}
        style={{ 
          height: isPlaying ? `${Math.random() * 100}%` : '4px',
          animationDelay: `${i * 0.15}s`
        }}
      />
    ))}
  </div>
);

const Header: React.FC<{ onBack?: () => void, showLogo?: boolean, gameType?: GameType, onSettings?: () => void, musicMuted?: boolean, title?: string }> = ({ onBack, showLogo, gameType, onSettings, musicMuted, title = "IMPOSTOR" }) => (
  <header className="flex flex-col items-center pt-6 pb-2 shrink-0 px-6 z-50">
    {onBack && (
      <button 
        onClick={() => { SoundService.playSfx('click'); onBack(); }}
        className="absolute left-6 top-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
      </button>
    )}
    {onSettings && (
      <button 
        onClick={() => { SoundService.playSfx('click'); onSettings(); }}
        className="absolute right-6 top-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.592c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        </svg>
      </button>
    )}
    {showLogo && (
      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-1 rounded-3xl flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden relative bg-white/20 backdrop-blur-md viral-pulse">
         <img 
            src={gameType === GameType.WORD_SPY ? WORD_SPY_LOGO : (gameType === GameType.FRAGEN_MIX ? FRAGEN_MIX_LOGO : IMPOSTOR_LOGO)} 
            className={`w-full h-full ${gameType === GameType.IMPOSTOR ? 'object-cover scale-[1.6]' : 'object-contain p-2'}`} 
            alt="Logo"
         />
      </div>
    )}
    <h1 className="game-font text-5xl sm:text-6xl text-white tracking-wide drop-shadow-2xl leading-none flex items-center uppercase text-center">
      {title}
      {!musicMuted && <MusicIndicator isPlaying={true} />}
    </h1>
    {(title === "IMPOSTOR" || title === "WORT-SPION" || title === "FRAGEN-MIX") && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200 mt-1">Wer ist der Lügner?</span>}
  </header>
);

const Footer: React.FC = () => (
  <div className="w-full text-center pb-8 pt-4 animate-in fade-in duration-1000">
    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 drop-shadow-sm">
      Made by <span className="text-white/70">Hezha</span> – mit <span className="text-red-400">❤️</span> gemacht
    </p>
  </div>
);

const Gallery: React.FC<{ onLaunchGame: (id: GameType) => void }> = ({ onLaunchGame }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-8 no-select pb-4">
      <div className="space-y-4">
        <h2 className="game-font text-3xl text-white uppercase tracking-tight">Angesagt</h2>
        <div className="grid grid-cols-1 gap-6">
          <button 
            onClick={() => { SoundService.playSfx('click'); onLaunchGame(GameType.IMPOSTOR); }}
            className="w-full relative aspect-[16/9] rounded-[2.5rem] overflow-hidden group shadow-2xl border-4 border-white/30 active:scale-[0.98] transition-all"
          >
            <img src={IMPOSTOR_LOGO} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Impostor" />
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-transparent to-transparent flex flex-col justify-end p-6 text-left">
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full w-fit uppercase mb-2 tracking-widest">SPIELBEREIT</span>
              <h3 className="game-font text-4xl text-white uppercase leading-none">IMPOSTOR</h3>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Der Klassiker</p>
            </div>
          </button>

          <button 
            onClick={() => { SoundService.playSfx('click'); onLaunchGame(GameType.FRAGEN_MIX); }}
            className="w-full relative aspect-[16/9] rounded-[2.5rem] overflow-hidden group shadow-2xl border-4 border-white/30 active:scale-[0.98] transition-all bg-white"
          >
            <div className="absolute inset-0 flex items-center justify-center p-8 pb-16">
              <img 
                src={FRAGEN_MIX_LOGO} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" 
                alt="Fragen-Mix Logo" 
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-transparent to-transparent flex flex-col justify-end p-6 text-left">
              <div className="flex justify-between items-end">
                <div>
                  <span className="bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full w-fit uppercase mb-2 tracking-widest">NEU!</span>
                  <h3 className="game-font text-4xl text-white uppercase leading-none">FRAGEN-MIX</h3>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Andere Frage, gleiche Antwort?</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => { SoundService.playSfx('click'); onLaunchGame(GameType.WORD_SPY); }}
            className="w-full relative aspect-[16/9] rounded-[2.5rem] overflow-hidden group shadow-2xl border-4 border-white/30 active:scale-[0.98] transition-all bg-white"
          >
            <div className="absolute inset-0 flex items-center justify-center p-8 pb-16">
              <img 
                src={WORD_SPY_LOGO} 
                className="w-32 h-32 object-contain group-hover:scale-125 transition-transform duration-700 drop-shadow-2xl" 
                alt="Word Spy Logo" 
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-transparent to-transparent flex flex-col justify-end p-6 text-left">
              <div className="flex justify-between items-end">
                <div>
                  <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full w-fit uppercase mb-2 tracking-widest">WORT-SPION</span>
                  <h3 className="game-font text-4xl text-white uppercase leading-none">WORT-SPION</h3>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Spionage-Taktik</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// --- PLAYER SETUP ---
const PlayerSetup: React.FC<{ 
  onStart: (names: string[], impostorCount: number, useHintWord: boolean, useTimer: boolean) => void, 
  initialNames: string[],
  initialUseHintWord: boolean, 
  initialUseTimer: boolean, 
  gameType: GameType,
  onNamesChange: (names: string[]) => void
}> = ({ onStart, initialNames, initialUseHintWord, initialUseTimer, gameType, onNamesChange }) => {
  const [names, setNames] = useState<string[]>(initialNames);
  const [impostorCount, setImpostorCount] = useState(1);
  const [useHintWord, setUseHintWord] = useState(initialUseHintWord);
  const [useTimer, setUseTimer] = useState(initialUseTimer);

  const addPlayer = () => { if (names.length < MAX_PLAYERS) { SoundService.playSfx('click'); const newNames = [...names, `Spieler ${names.length + 1}`]; setNames(newNames); onNamesChange(newNames); } };
  const removePlayer = (idx: number) => { if (names.length > MIN_PLAYERS) { SoundService.playSfx('click'); const newNames = names.filter((_, i) => i !== idx); setNames(newNames); onNamesChange(newNames); } };
  const updateName = (idx: number, val: string) => { const n = [...names]; n[idx] = val; setNames(n); onNamesChange(n); };
  
  const maxImpostors = names.length - 1;
  useEffect(() => { if (impostorCount > maxImpostors) setImpostorCount(maxImpostors); }, [names.length]);

  return (
    <div className="flex-1 flex flex-col px-6 space-y-4 min-h-0 no-select pb-6">
      <div className="card-white p-5 flex flex-col min-h-0 flex-1">
        <h2 className="game-font text-2xl mb-3 text-slate-800 uppercase tracking-tight">Spieler</h2>
        <div className="space-y-2.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {names.map((name, idx) => (
            <div key={idx} className="flex gap-2 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center border-2 border-white shadow-sm" style={{ backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}>
                <img src={AVATARS[idx % AVATARS.length]} className="w-10 h-10 object-cover" alt="p" />
              </div>
              <input type="text" value={name} onChange={(e) => updateName(idx, e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-700 focus:border-red-400 focus:bg-white outline-none transition-all text-sm" placeholder={`Name...`} />
              <button onClick={() => removePlayer(idx)} className="w-10 h-10 text-slate-300 hover:text-rose-500 transition-colors shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
        <button onClick={addPlayer} className="w-full mt-3 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shrink-0">+ Spieler hinzufügen</button>
      </div>
      <div className="card-white p-4 space-y-4 shrink-0">
        <div className="flex justify-between items-center">
          <div className="leading-tight">
            <span className="game-font text-xl text-slate-800 uppercase block">Spione / Impostoren</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Die Unwissenden</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { SoundService.playSfx('click'); setImpostorCount(Math.max(1, impostorCount - 1)); }} className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black active:scale-90">-</button>
            <span className="text-2xl font-black text-slate-800 w-6 text-center">{impostorCount}</span>
            <button onClick={() => { if (impostorCount < maxImpostors) { SoundService.playSfx('click'); setImpostorCount(impostorCount + 1); } }} className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black active:scale-90">+</button>
          </div>
        </div>
        
        {gameType !== GameType.FRAGEN_MIX && (
          <>
            <div className="h-[1px] bg-slate-100 w-full"></div>
            <button onClick={() => { SoundService.playSfx('click'); setUseHintWord(!useHintWord); }} className="w-full flex justify-between items-center">
              <div className="text-left leading-tight">
                <span className="game-font text-xl text-slate-800 uppercase block">Hilfswort Modus</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{useHintWord ? 'Undercover sieht ähnliche Info' : 'Undercover sieht ???'}</span>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${useHintWord ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${useHintWord ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </>
        )}

        {gameType === GameType.IMPOSTOR && (
          <>
            <div className="h-[1px] bg-slate-100 w-full"></div>
            <button onClick={() => { SoundService.playSfx('click'); setUseTimer(!useTimer); }} className="w-full flex justify-between items-center">
              <div className="text-left leading-tight">
                <span className="game-font text-xl text-slate-800 uppercase block">3-Min Timer</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{useTimer ? 'Runde endet automatisch' : 'Kein Zeitlimit'}</span>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${useTimer ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${useTimer ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </>
        )}
      </div>
      <button onClick={() => { SoundService.playSfx('click'); onStart(names, impostorCount, useHintWord, useTimer); }} className="w-full py-5 rounded-[2rem] btn-play text-red-900 game-font text-3xl uppercase tracking-wider">JETZT SPIELEN!</button>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [gameState, setGameState] = useState<GameState>({ gameType: GameType.IMPOSTOR, players: [], status: GameStatus.SETUP, currentRevealingIndex: 0, currentInputIndex: 0, wordPair: null, winner: null, round: 1, lastVotedId: null, useHintWord: true, useTimer: false });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Zufall");
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  
  // Persistent items
  const [persistentNames, setPersistentNames] = useState<string[]>(['Spieler 1', 'Spieler 2', 'Spieler 3', 'Spieler 4']);
  const [wordHistory, setWordHistory] = useState<string[]>([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(180);
  const timerIntervalRef = useRef<number | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    SoundService.init();
    SoundService.switchMusic('hub');

    const savedNames = localStorage.getItem(STORAGE_KEY_NAMES);
    if (savedNames) setPersistentNames(JSON.parse(savedNames));

    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (savedHistory) setWordHistory(JSON.parse(savedHistory));

    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setMusicMuted(settings.musicMuted ?? false);
      setSfxMuted(settings.sfxMuted ?? false);
      setSelectedCategory(settings.selectedCategory ?? "Zufall");
      setGameState(p => ({
        ...p,
        useTimer: settings.useTimer ?? false,
        useHintWord: settings.useHintWord ?? true
      }));
      SoundService.toggleMusic(settings.musicMuted ?? false);
      SoundService.toggleSfx(settings.sfxMuted ?? false);
    }
  }, []);

  const saveSettings = (newSettings: any) => {
    const currentSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ ...currentSettings, ...newSettings }));
  };

  const handleNamesChange = (names: string[]) => {
    setPersistentNames(names);
    localStorage.setItem(STORAGE_KEY_NAMES, JSON.stringify(names));
  };

  useEffect(() => {
    if (musicMuted) return;
    if (!activeGame) { SoundService.switchMusic('hub'); return; }
    switch (gameState.status) {
      case GameStatus.SETUP: SoundService.switchMusic('setup'); break;
      case GameStatus.REVEALING: SoundService.switchMusic('revealing'); break;
      case GameStatus.INPUT_PHASE: SoundService.switchMusic('tension'); break;
      case GameStatus.SPY_GUESSING: SoundService.switchMusic('tension'); break;
      case GameStatus.GAME_OVER: gameState.winner === Role.CIVILIAN ? SoundService.switchMusic('victory') : SoundService.switchMusic('defeat'); break;
      default: SoundService.switchMusic('tension'); break;
    }
  }, [gameState.status, gameState.winner, musicMuted, activeGame]);

  useEffect(() => {
    if (gameState.status === GameStatus.DISCUSSION && gameState.useTimer) {
      setTimeLeft(180);
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setGameState(p => ({ ...p, status: GameStatus.VOTING }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [gameState.status, gameState.useTimer]);

  const resetToSetup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameState(p => ({ ...p, players: [], status: GameStatus.SETUP, currentRevealingIndex: 0, currentInputIndex: 0, wordPair: null, winner: null, round: 1, lastVotedId: null }));
  };
  
  const startGame = async (names: string[], impostorCount: number, useHintWord: boolean, useTimer: boolean) => {
    setLoading(true);
    saveSettings({ useHintWord, useTimer });
    try {
      const words = await generateWordPair(selectedCategory, activeGame!, wordHistory);
      
      const newHistory = [words.secretWord, ...wordHistory].slice(0, 50);
      setWordHistory(newHistory);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));

      const roles: Role[] = Array(names.length).fill(Role.CIVILIAN);
      for (let i = 0; i < impostorCount; i++) {
        roles[i] = (activeGame === GameType.WORD_SPY) ? Role.SPY : Role.IMPOSTOR;
      }
      for (let i = roles.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [roles[i], roles[j]] = [roles[j], roles[i]]; 
      }
      
      const newPlayers: Player[] = names.map((name, idx) => ({ 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        role: roles[idx], 
        word: (roles[idx] === Role.CIVILIAN) ? words.secretWord : words.hintWord, 
        isEliminated: false, 
        hasSeenWord: false, 
        avatarId: idx 
      }));

      setGameState({ 
        gameType: activeGame!, 
        players: newPlayers, 
        status: GameStatus.REVEALING, 
        currentRevealingIndex: 0, 
        currentInputIndex: 0, 
        wordPair: words, 
        winner: null, 
        round: 1, 
        lastVotedId: null,
        useHintWord,
        useTimer
      });
    } catch (e) { resetToSetup(); } finally { setLoading(false); }
  };

  const renderGameContent = () => {
    if (loading) return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-10 animate-in fade-in">
        <div className="w-20 h-20 border-[10px] border-white/20 border-t-white rounded-full animate-spin shadow-2xl"></div>
        <div className="text-center">
          <p className="game-font text-4xl text-white tracking-widest uppercase">Mische Karten...</p>
          <p className="text-red-200 font-black text-[10px] uppercase tracking-[0.5em]">KI sucht Inhalte...</p>
        </div>
      </div>
    );
    switch (gameState.status) {
      case GameStatus.SETUP: 
        return <PlayerSetup 
          onStart={startGame} 
          initialNames={persistentNames}
          initialUseHintWord={gameState.useHintWord} 
          initialUseTimer={gameState.useTimer} 
          gameType={gameState.gameType}
          onNamesChange={handleNamesChange}
        />;
      
      case GameStatus.REVEALING: 
        const playerReveal = gameState.players[gameState.currentRevealingIndex];
        return <RoleReveal 
          key={playerReveal.id} 
          gameType={gameState.gameType} 
          player={playerReveal} 
          onSeen={() => {
            if (gameState.currentRevealingIndex < gameState.players.length - 1) {
              setGameState(p => ({ ...p, currentRevealingIndex: p.currentRevealingIndex + 1 }));
            } else {
              if (gameState.gameType === GameType.IMPOSTOR) {
                setGameState(p => ({ ...p, status: GameStatus.DISCUSSION }));
              } else {
                setGameState(p => ({ ...p, status: GameStatus.INPUT_PHASE }));
              }
            }
          }} 
          onCancel={resetToSetup} 
          isLast={gameState.currentRevealingIndex === gameState.players.length - 1} 
          color={PLAYER_COLORS[playerReveal.avatarId % PLAYER_COLORS.length]} 
          useHintWord={gameState.useHintWord} 
        />;
      
      case GameStatus.INPUT_PHASE:
        const playerInput = gameState.players[gameState.currentInputIndex];
        return <PlayerInputPhase key={playerInput.id} player={playerInput} onAnswer={(answer) => {
          const updatedPlayers = [...gameState.players];
          updatedPlayers[gameState.currentInputIndex].answer = answer;
          if (gameState.currentInputIndex < updatedPlayers.length - 1) {
            setGameState(p => ({ ...p, players: updatedPlayers, currentInputIndex: p.currentInputIndex + 1 }));
          } else {
            setGameState(p => ({ ...p, players: updatedPlayers, status: GameStatus.SHOWDOWN }));
          }
        }} gameType={gameState.gameType} />;

      case GameStatus.SHOWDOWN:
        return <ShowdownBoard gameType={gameState.gameType} players={gameState.players} onContinue={() => setGameState(p => ({ ...p, status: GameStatus.DISCUSSION }))} />;

      case GameStatus.DISCUSSION: return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-6 animate-in zoom-in no-select pb-6">
          <div className="text-center relative">
            <h2 className="game-font text-5xl text-white uppercase tracking-tight drop-shadow-lg">DISKUSSION</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-200">Analysiert die Hinweise!</p>
            {gameState.useTimer && (
              <div className="mt-2 bg-black/30 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 inline-flex items-center gap-2">
                <svg className={`w-4 h-4 ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className={`font-black text-lg ${timeLeft < 30 ? 'text-red-400' : 'text-white'}`}>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
          <div className="card-white w-full p-8 text-center relative border-4 border-white shadow-2xl overflow-hidden max-w-sm flex-1 flex flex-col justify-center">
             <div className="absolute top-0 inset-x-0 h-2 bg-red-600"></div><p className="game-font text-2xl text-slate-300 uppercase mb-4 tracking-widest">Wer fängt an?</p>
             <div className="flex flex-col items-center gap-4"><div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[6px] border-slate-50 shadow-2xl p-1" style={{ backgroundColor: PLAYER_COLORS[gameState.players.filter(p=>!p.isEliminated)[0].avatarId % PLAYER_COLORS.length] }}><img src={AVATARS[gameState.players.filter(p=>!p.isEliminated)[0].avatarId % AVATARS.length]} className="w-full h-full object-cover" alt="Start" /></div><span className="game-font text-4xl text-slate-800 uppercase mt-2">{gameState.players.filter(p=>!p.isEliminated)[0].name}</span></div>
          </div>
          <button onClick={() => { SoundService.playSfx('click'); setGameState(p => ({ ...p, status: GameStatus.VOTING })); }} className="w-full max-w-sm py-6 rounded-[2.5rem] btn-play text-red-900 game-font text-4xl uppercase tracking-widest">ABSTIMMUNG!</button>
        </div>
      );
      case GameStatus.VOTING: return <VotingBoard gameType={gameState.gameType} players={gameState.players} onVote={(id) => setGameState(p => ({ ...p, lastVotedId: id, status: GameStatus.REVEAL_VOTE }))} onEndGame={resetToSetup} />;
      case GameStatus.REVEAL_VOTE:
        const voted = gameState.players.find(p => p.id === gameState.lastVotedId);
        const isActuallySpy = voted?.role === Role.SPY;
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in zoom-in no-select pb-6">
            <h2 className="game-font text-5xl text-white uppercase drop-shadow-lg">ERGEBNIS</h2>
            <div className="w-full max-w-sm card-white p-10 space-y-6 border-4 border-white shadow-2xl flex-1 flex flex-col justify-center"><span className="text-[10px] font-black uppercase text-slate-300 block mb-2">{voted?.name} war...</span><div className="game-font text-7xl animate-bounce uppercase text-red-600">{voted?.role}!</div></div>
            <button onClick={() => { 
              SoundService.playSfx('click'); 
              if (isActuallySpy) {
                setGameState(p => ({ ...p, status: GameStatus.SPY_GUESSING }));
              } else {
                const newPlayers = gameState.players.map(p => p.id === gameState.lastVotedId ? { ...p, isEliminated: true } : p);
                const activeImpostors = newPlayers.filter(p => !p.isEliminated && (p.role === Role.IMPOSTOR || p.role === Role.SPY)).length;
                const activeCivs = newPlayers.filter(p => !p.isEliminated && p.role === Role.CIVILIAN).length;
                let winner: Role | null = null;
                if (activeImpostors === 0) winner = Role.CIVILIAN; else if (activeCivs <= 1) winner = Role.IMPOSTOR;
                setGameState(p => ({ ...p, players: newPlayers, status: winner ? GameStatus.GAME_OVER : GameStatus.DISCUSSION, winner, round: p.round + 1, lastVotedId: null }));
              }
            }} className="w-full max-w-sm py-6 bg-emerald-500 text-white game-font text-4xl rounded-[2.5rem] shadow-[0_8px_0_#059669]">{"WEITER"}</button>
          </div>
        );
      case GameStatus.SPY_GUESSING:
        const currentSpy = gameState.players.find(p => p.id === gameState.lastVotedId);
        return <SpyGuessingPhase player={currentSpy!} onGuess={(guess) => {
          const isCorrect = guess.toLowerCase().trim() === gameState.wordPair?.secretWord.toLowerCase().trim();
          setGameState(p => ({ ...p, status: GameStatus.GAME_OVER, winner: isCorrect ? Role.SPY : Role.CIVILIAN }));
        }} />;

      case GameStatus.GAME_OVER: return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in no-select pb-6">
          <div className="space-y-4"><div className="text-8xl drop-shadow-xl animate-bounce">🏆</div><h2 className="game-font text-5xl text-white uppercase drop-shadow-lg">{gameState.winner === Role.CIVILIAN ? 'DIE BÜRGER GEWINNEN!' : (gameState.winner === Role.SPY ? 'DER SPION GEWINNT!' : 'DER IMPOSTOR GEWINNT!')}</h2></div>
          <div className="card-white w-full max-w-sm p-6 space-y-4 border-4 border-white shadow-2xl flex-1 flex flex-col justify-center">
             <div className="p-4 bg-red-50 rounded-[2.5rem] border-2 border-red-100 flex flex-col items-center justify-center min-h-[80px]"><span className="text-[9px] font-black text-red-400 block mb-1 uppercase tracking-widest">{gameState.gameType === GameType.FRAGEN_MIX ? 'Frage A' : 'Geheimwort'}</span><div className={`game-font text-slate-800 uppercase leading-none break-words w-full ${getDynamicFontSize(gameState.wordPair?.secretWord || '', 'medium')}`}>{gameState.wordPair?.secretWord}</div></div>
             <div className="p-4 bg-red-50 rounded-[2.5rem] border-2 border-red-100 flex flex-col items-center justify-center min-h-[80px]"><span className="text-[9px] font-black text-red-400 block mb-1 uppercase tracking-widest">{gameState.gameType === GameType.FRAGEN_MIX ? 'Frage B' : 'Undercover-Wort'}</span><div className={`game-font text-slate-800 uppercase leading-none break-words w-full ${getDynamicFontSize(gameState.wordPair?.hintWord || '', 'medium')}`}>{gameState.wordPair?.hintWord || '---'}</div></div>
          </div>
          <button onClick={() => { SoundService.playSfx('click'); resetToSetup(); }} className="w-full max-w-sm py-7 btn-play text-red-900 game-font text-5xl rounded-[3rem]">NEUSTART</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {!activeGame ? (
        <>
          <Header title="FamilyTime" musicMuted={musicMuted} onSettings={() => setShowSettings(true)} />
          <Gallery onLaunchGame={(id) => { setActiveGame(id); setGameState(p => ({...p, gameType: id})); }} />
        </>
      ) : (
        <>
          {gameState.status !== GameStatus.REVEALING && (
            <Header 
              onBack={() => { if (gameState.status === GameStatus.SETUP) setActiveGame(null); else resetToSetup(); }} 
              showLogo={gameState.status === GameStatus.SETUP}
              gameType={gameState.gameType}
              onSettings={gameState.status === GameStatus.SETUP ? () => setShowSettings(true) : undefined}
              musicMuted={musicMuted}
              title={gameState.gameType === GameType.WORD_SPY ? "WORT-SPION" : (gameState.gameType === GameType.FRAGEN_MIX ? "FRAGEN-MIX" : "IMPOSTOR")}
            />
          )}
          <main className="flex-1 flex flex-col min-h-0 relative">{renderGameContent()}</main>
        </>
      )}

      {showSettings && (
        <SettingsModal 
          selected={selectedCategory} 
          onSelect={(c) => { setSelectedCategory(c); saveSettings({ selectedCategory: c }); }} 
          onClose={() => setShowSettings(false)} 
          musicMuted={musicMuted} 
          onToggleMusic={(m) => { setMusicMuted(m); SoundService.toggleMusic(m); saveSettings({ musicMuted: m }); }} 
          sfxMuted={sfxMuted} 
          onToggleSfx={(m) => { setSfxMuted(m); SoundService.toggleSfx(m); saveSettings({ sfxMuted: m }); }} 
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS (ROLE REVEAL, etc.) ---

const RoleReveal: React.FC<{ player: Player, onSeen: () => void, onCancel: () => void, isLast: boolean, color: string, gameType: GameType, useHintWord: boolean }> = ({ player, onSeen, onCancel, isLast, color, gameType, useHintWord }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const threshold = 140;

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => { if (hasViewed) return; isDragging.current = true; startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY; };
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startY.current;
    if (isRevealed) { if (diff > 0) setDragOffset(diff); else setDragOffset(0); }
    else { if (diff < 0) setDragOffset(diff); else setDragOffset(0); }
  };
  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (isRevealed) { if (dragOffset > threshold) { setIsRevealed(false); SoundService.playSfx('hide'); } }
    else { if (Math.abs(dragOffset) > threshold) { setIsRevealed(true); SoundService.playSfx('reveal'); } }
    setDragOffset(0);
  };
  useEffect(() => {
    const end = () => handleEnd();
    window.addEventListener('mouseup', end); window.addEventListener('touchend', end);
    return () => { window.removeEventListener('mouseup', end); window.removeEventListener('touchend', end); };
  }, [dragOffset, isRevealed]);

  const isImpostor = player.role === Role.IMPOSTOR || player.role === Role.SPY;
  const transformStyle = `translateY(calc(${isRevealed ? -90 : 0}% + ${dragOffset}px))`;
  const displayedInfo = (isImpostor && !useHintWord) ? '???' : player.word;
  const labelText = gameType === GameType.FRAGEN_MIX ? 'Geheimfrage' : (isImpostor ? (useHintWord ? 'Hilfswort' : 'Undercover') : 'Geheimwort');
  const getButtonText = () => { if (!isLast) return 'NÄCHSTER'; return (gameType === GameType.IMPOSTOR) ? 'DISKUSSION' : 'EINGABE'; };

  return (
    <div className="fixed inset-0 z-[100] bg-red-950 no-select overflow-hidden flex flex-col">
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <button onClick={() => { SoundService.playSfx('click'); onCancel(); }} className="absolute top-8 left-8 z-[110] w-12 h-12 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur-md border border-white/10"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        <div onMouseDown={handleStart} onTouchStart={handleStart} onMouseMove={handleMove} onTouchMove={handleMove} style={{ transform: transformStyle, transition: isDragging.current ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} className={`absolute inset-0 z-20 bg-gradient-to-b from-red-600 to-red-900 select-none touch-none flex flex-col items-center justify-center p-8 text-center ${hasViewed ? 'pointer-events-none' : ''}`}>
          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full border-8 border-white shadow-2xl relative overflow-hidden mb-10" style={{ backgroundColor: color }}><img src={AVATARS[player.avatarId % AVATARS.length]} alt="p" className="w-full h-full object-cover" /></div>
          <h2 className="game-font text-5xl sm:text-6xl text-white tracking-tight leading-tight uppercase mb-8 drop-shadow-lg break-words w-full px-4">{player.name}</h2>
          {!isRevealed && !hasViewed && <div className="mt-8 flex flex-col items-center gap-4 animate-bounce"><svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 11l7-7m0 0l7 7m-7-7v18" /></svg><span className="text-[12px] font-black uppercase tracking-[0.5em] text-red-300">HOCHSCHIEBEN</span></div>}
          {!isRevealed && hasViewed && <div className="absolute inset-x-8 bottom-16 space-y-4"><div className="bg-emerald-500 text-white text-[12px] font-black py-3 rounded-full uppercase tracking-widest shadow-lg">GESEHEN ✓</div><button onClick={(e) => { e.stopPropagation(); SoundService.playSfx('click'); onSeen(); }} className="w-full py-5 bg-white text-red-900 game-font text-3xl rounded-3xl shadow-xl pointer-events-auto">{getButtonText()}</button></div>}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <div className="w-full max-sm space-y-8 animate-in zoom-in-95 duration-500">
            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Deine Rolle</span>
            <div className="game-font text-6xl uppercase leading-none text-red-600">{player.role}</div>
            <div className={`bg-white p-10 rounded-[3rem] border-2 relative shadow-md min-h-[160px] flex flex-col items-center justify-center ${isImpostor ? 'border-red-200' : 'border-slate-100'}`}>
              <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] px-6 py-1.5 rounded-full font-black uppercase tracking-[0.3em] shadow-sm ${isImpostor ? 'bg-red-600 text-white' : 'bg-amber-400 text-amber-900'}`}>{labelText}</span>
              <div className={`game-font uppercase leading-tight text-slate-800 break-words w-full px-2 ${getDynamicFontSize(displayedInfo)}`}>{displayedInfo}</div>
            </div>
            <button onClick={() => { SoundService.playSfx('click'); setIsRevealed(false); setHasViewed(true); }} className={`w-full py-6 text-white game-font text-4xl rounded-[2.5rem] shadow-[0_8px_0_rgba(0,0,0,0.1)] active:translate-y-1 transition-all ${isImpostor ? 'bg-red-600' : 'bg-emerald-500'}`}>GELESEN!</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerInputPhase: React.FC<{ player: Player, onAnswer: (answer: string) => void, gameType: GameType }> = ({ player, onAnswer, gameType }) => {
  const [val, setVal] = useState("");
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const isQuestions = gameType === GameType.FRAGEN_MIX;
  const getPromptText = () => isQuestions ? 'Beantworte die Frage!' : 'Gib ein passendes Wort ein!';
  const getPlaceholderText = () => isQuestions ? 'Deine Antwort...' : 'Deine Assoziation...';
  const showQuestionButton = isQuestions && !isQuestionVisible;
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 no-select animate-in fade-in">
       <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden" style={{ backgroundColor: PLAYER_COLORS[player.avatarId % PLAYER_COLORS.length] }}><img src={AVATARS[player.avatarId % AVATARS.length]} className="w-full h-full object-cover" alt="p" /></div>
       <div className="text-center space-y-2 w-full max-w-sm"><h2 className="game-font text-4xl text-white uppercase leading-none">{player.name}</h2>
         {isQuestions && (
           <div className="relative group">{showQuestionButton ? (
               <button onClick={() => { SoundService.playSfx('reveal'); setIsQuestionVisible(true); }} className="w-full bg-white/20 hover:bg-white/30 p-5 rounded-3xl backdrop-blur-md border-2 border-dashed border-white/20 flex flex-col items-center gap-2 transition-all active:scale-95"><svg className="w-8 h-8 text-white/50 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg><span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Frage anzeigen</span></button>
             ) : (
               <div className="bg-white p-6 rounded-[2rem] border-2 border-red-100 shadow-xl animate-in zoom-in-95 duration-300"><p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Deine Frage:</p><p className="text-lg font-black text-red-600 uppercase leading-tight">{player.word}</p></div>
             )}</div>
         )}
         <p className="text-[10px] font-black uppercase text-red-200 mt-4 tracking-widest">{getPromptText()}</p>
       </div>
       <textarea autoFocus={!isQuestions} value={val} onChange={(e) => setVal(e.target.value)} className="w-full max-w-sm h-32 rounded-[2rem] p-6 text-xl font-bold bg-white text-slate-800 shadow-2xl focus:ring-4 ring-red-400 outline-none resize-none" placeholder={getPlaceholderText()} />
       <button disabled={!val.trim() || (isQuestions && !isQuestionVisible)} onClick={() => { SoundService.playSfx('click'); onAnswer(val.trim()); setVal(""); setIsQuestionVisible(false); }} className="w-full max-sm py-5 btn-play text-red-900 game-font text-3xl uppercase tracking-widest disabled:opacity-50">ABSENDEN</button>
    </div>
  );
};

const SpyGuessingPhase: React.FC<{ player: Player, onGuess: (guess: string) => void }> = ({ player, onGuess }) => {
  const [guess, setGuess] = useState("");
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-in zoom-in no-select">
      <div className="text-center space-y-2"><div className="text-6xl mb-4">🕵️‍♂️</div><h2 className="game-font text-5xl text-white uppercase leading-none">WORT RATEN</h2><p className="text-red-200 font-black text-[10px] uppercase tracking-[0.3em]">{player.name}, was war das Geheimwort?</p></div>
      <input autoFocus type="text" value={guess} onChange={(e) => setGuess(e.target.value)} className="w-full max-w-sm py-6 px-8 rounded-[2.5rem] bg-white text-slate-800 text-3xl font-black uppercase text-center outline-none focus:ring-4 ring-emerald-400 shadow-2xl" placeholder="..." />
      <button disabled={!guess.trim()} onClick={() => { SoundService.playSfx('click'); onGuess(guess.trim()); }} className="w-full max-sm py-6 btn-play text-red-900 game-font text-4xl uppercase tracking-widest disabled:opacity-50">LÖSUNG PRÜFEN</button>
    </div>
  );
};

const ShowdownBoard: React.FC<{ players: Player[], onContinue: () => void, gameType: GameType }> = ({ players, onContinue, gameType }) => (
  <div className="flex-1 flex flex-col px-6 space-y-4 no-select overflow-hidden pb-6">
    <div className="text-center"><h2 className="game-font text-5xl text-white uppercase leading-none drop-shadow-lg">SHOWDOWN</h2><span className="text-[10px] font-black uppercase text-red-300 tracking-widest">{gameType === GameType.FRAGEN_MIX ? 'Wer hat was geantwortet?' : 'Wer hat was assoziiert?'}</span></div>
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
      {players.map((p, idx) => (
        <div key={idx} className="card-white p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
           <div className="w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: PLAYER_COLORS[p.avatarId % PLAYER_COLORS.length] }}><img src={AVATARS[p.avatarId % AVATARS.length]} className="w-full h-full object-cover" alt="p" /></div>
           <div className="flex-1 overflow-hidden"><span className="text-[10px] font-black text-slate-300 uppercase leading-none block mb-1">{p.name}</span><p className="text-slate-800 font-bold leading-tight break-words">{p.answer || '???'}</p></div>
        </div>
      ))}
    </div>
    <button onClick={() => { SoundService.playSfx('click'); onContinue(); }} className="w-full py-5 rounded-[2rem] btn-play text-red-900 game-font text-4xl uppercase tracking-widest">DISKUSSION</button>
  </div>
);

const VotingBoard: React.FC<{ players: Player[], onVote: (id: string) => void, onEndGame: () => void, gameType: GameType }> = ({ players, onVote, onEndGame, gameType }) => (
  <div className="flex-1 flex flex-col px-6 space-y-6 min-h-0 no-select pb-6">
    <div className="text-center shrink-0"><h2 className="game-font text-4xl text-white uppercase tracking-tight leading-none drop-shadow-lg">ABSTIMMUNG</h2><span className="text-[10px] font-black uppercase tracking-widest text-red-300/50">Wer hatte die andere {gameType === GameType.FRAGEN_MIX ? 'Frage' : 'Info'}?</span></div>
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-2 gap-4 min-h-0">
      {players.filter(p => !p.isEliminated).map((player) => (
        <button key={player.id} onClick={() => { SoundService.playSfx('vote'); onVote(player.id); }} className="card-white p-4 rounded-[2.5rem] flex flex-col items-center gap-2 border-4 border-white active:scale-95 transition-all shadow-xl group"><div className="w-16 h-16 rounded-full border-4 border-slate-50 p-1 shadow-inner overflow-hidden shrink-0" style={{ backgroundColor: PLAYER_COLORS[player.avatarId % PLAYER_COLORS.length] }}><img src={AVATARS[player.avatarId % AVATARS.length]} alt="Av" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div><span className="game-font text-slate-800 text-lg truncate w-full text-center leading-none uppercase">{player.name}</span>{player.answer && <p className="text-[10px] text-slate-400 font-bold italic truncate w-full px-2">"{player.answer}"</p>}</button>
      ))}
    </div>
    <button onClick={() => { SoundService.playSfx('click'); onEndGame(); }} className="py-2 text-white/30 font-black text-[10px] uppercase tracking-[0.5em] shrink-0 active:text-white">SPIEL BEENDEN</button>
  </div>
);

const SettingsModal: React.FC<{ selected: string, onSelect: (c: string) => void, onClose: () => void, musicMuted: boolean, onToggleMusic: (m: boolean) => void, sfxMuted: boolean, onToggleSfx: (m: boolean) => void }> = ({ selected, onSelect, onClose, musicMuted, onToggleMusic, sfxMuted, onToggleSfx }) => (
  <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
    <div className="w-full max-w-md card-white p-8 space-y-6 animate-in slide-in-from-bottom-10 duration-300">
      <div className="flex justify-between items-center"><h2 className="game-font text-3xl text-slate-800 uppercase leading-none">Einstellungen</h2><button onClick={() => { SoundService.playSfx('click'); onClose(); }} className="p-2 text-slate-400"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
      <div className="flex gap-4">
        <button onClick={() => { onToggleMusic(!musicMuted); SoundService.playSfx('click'); }} className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${!musicMuted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg><span className="font-black text-[10px] uppercase tracking-widest">{musicMuted ? 'Musik Aus' : 'Musik An'}</span></button>
        <button onClick={() => { onToggleSfx(!sfxMuted); SoundService.playSfx('click'); }} className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${!sfxMuted ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg><span className="font-black text-[10px] uppercase tracking-widest">{sfxMuted ? 'SFX Aus' : 'SFX An'}</span></button>
      </div>
      <div className="space-y-3"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Themenbereiche</span><div className="grid grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">{WORD_CATEGORIES.map(cat => (<button key={cat} onClick={() => { SoundService.playSfx('click'); onSelect(cat); }} className={`py-3 px-4 rounded-2xl font-bold text-xs transition-all border-2 ${selected === cat ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>{cat}</button>))}</div></div>
      <button onClick={() => { SoundService.playSfx('click'); onClose(); }} className="w-full py-4 bg-emerald-500 text-white game-font text-2xl rounded-2xl shadow-[0_4px_0_#059669]">FERTIG</button>
    </div>
  </div>
);

export default App;
