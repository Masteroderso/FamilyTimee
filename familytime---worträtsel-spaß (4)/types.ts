
export enum Role {
  CIVILIAN = 'Bürger',
  IMPOSTOR = 'Impostor',
  SPY = 'Spion'
}

export enum GameType {
  IMPOSTOR = 'IMPOSTOR',
  WORD_SPY = 'WORD_SPY',
  FRAGEN_MIX = 'FRAGEN_MIX'
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  word: string;
  isEliminated: boolean;
  hasSeenWord: boolean;
  avatarId: number;
  answer?: string;
}

export enum GameStatus {
  SETUP = 'SETUP',
  REVEALING = 'REVEALING',
  INPUT_PHASE = 'INPUT_PHASE',
  SHOWDOWN = 'SHOWDOWN',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
  REVEAL_VOTE = 'REVEAL_VOTE',
  SPY_GUESSING = 'SPY_GUESSING',
  GAME_OVER = 'GAME_OVER'
}

export interface WordPair {
  secretWord: string;
  hintWord: string;
  category: string;
}

export interface GameState {
  gameType: GameType;
  players: Player[];
  status: GameStatus;
  currentRevealingIndex: number;
  currentInputIndex: number;
  wordPair: WordPair | null;
  winner: Role | null;
  round: number;
  lastVotedId: string | null;
  useHintWord: boolean;
  useTimer: boolean;
}
