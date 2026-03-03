export type GameMode = 'classic' | 'time';

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  isSelected: boolean;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const TARGET_MIN = 10;
export const TARGET_MAX = 25;
export const TIME_MODE_INTERVAL = 5000; // 5 seconds per row in time mode
