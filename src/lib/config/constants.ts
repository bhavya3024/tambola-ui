/**
 * Application-wide constants.
 */

export const DEFAULT_PORT = 3000;
export const DEFAULT_MONGODB_URI = "mongodb://localhost:27017/tambola";

export const DEFAULT_JWT_EXPIRY = "15m";
export const DEFAULT_REFRESH_EXPIRY = "7d";
export const DEFAULT_EXPIRY_SECONDS = 900;

export const PASSWORD_HASH = {
  ALGORITHM: "argon2id" as const,
  MEMORY_COST: 65536,
  TIME_COST: 2,
};

export const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

export const USERNAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: "^[a-zA-Z0-9_]+$",
};

export const PASSWORD = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 128,
};

export const DISPLAY_NAME = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
};

export const SMTP = {
  DEFAULT_PORT: 587,
  SECURE_PORT: 465,
  DEFAULT_FROM: "Tambola <noreply@bhavya-dhiman.dev>",
};

export const ETHEREAL = {
  HOST: "smtp.ethereal.email",
  PORT: 587,
};

export const DEFAULT_FRONTEND_URL = "http://localhost:3000";

export const GAME_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  COMPLETED: "completed",
} as const;

export const ALL_GAME_STATUSES = Object.values(GAME_STATUS);

export const WIN_PATTERN = {
  EARLY_FIVE: "earlyFive",
  TOP_LINE: "topLine",
  MIDDLE_LINE: "middleLine",
  BOTTOM_LINE: "bottomLine",
  FULL_HOUSE: "fullHouse",
} as const;

export const ALL_PATTERNS = Object.values(WIN_PATTERN);
export const EARLY_FIVE_COUNT = 5;

export const ROW_INDEX = {
  TOP: 0,
  MIDDLE: 1,
  BOTTOM: 2,
} as const;

export const WS_ACTION = {
  START_GAME: "start_game",
  PAUSE_GAME: "pause_game",
  RESUME_GAME: "resume_game",
  CLAIM: "claim",
} as const;

export const WS_EVENT = {
  GAME_STATE: "game_state",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",
  GAME_STARTED: "game_started",
  GAME_PAUSED: "game_paused",
  GAME_RESUMED: "game_resumed",
  NUMBER_CALLED: "number_called",
  CLAIM_RESULT: "claim_result",
  GAME_ENDED: "game_ended",
  ERROR: "error",
} as const;

export const TOTAL_NUMBERS = 90;

export const GAME_CODE = {
  LENGTH: 6,
  CHARSET: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  MAX_GENERATION_ATTEMPTS: 10,
};

export const PLAYERS = {
  MIN: 2,
  MAX: 200,
  DEFAULT: 50,
};

export const NUMBER_CALL_INTERVAL = {
  MIN: 3,
  MAX: 30,
  DEFAULT: 10,
};

export const TICKETS_PER_PLAYER = {
  MIN: 1,
  MAX: 6,
  DEFAULT: 1,
};

export const PAGINATION = {
  GAMES_LIST: 10,
  GAME_HISTORY: 20,
};

export const TICKET_GRID = {
  ROWS: 3,
  COLS: 9,
  NUMBERS_PER_ROW: 5,
  TOTAL_NUMBERS: 15,
  BLANKS_PER_ROW: 4,
  TOTAL_BLANKS: 12,
};

export const COLUMN_RANGES: [number, number][] = [
  [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
  [50, 59], [60, 69], [70, 79], [80, 90],
];

export const TICKET_GEN_MAX_ITERATIONS = 1000;
