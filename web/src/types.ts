export type Player = 1 | 2;
export type TileType = 0 | 1 | 2; // White, Black, Gray

export interface GameState {
  pieces: number[]; // Flat 25
  tiles: number[]; // Flat 25
  tile_counts: number[]; // [P1_B, P1_G, P2_B, P2_G]
  current_player: Player;
  game_over: boolean;
  winner: number;
  move_count: number;
}

export const INITIAL_STATE: GameState = {
  pieces: Array(25).fill(0),
  tiles: Array(25).fill(0),
  tile_counts: [3, 1, 3, 1],
  current_player: 1,
  game_over: false,
  winner: 0,
  move_count: 0
};
