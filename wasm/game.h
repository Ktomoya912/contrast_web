#ifndef GAME_H
#define GAME_H

#include "tensor.h"
#include <vector>
#include <deque>
#include <set>
#include <cstring>
#include <algorithm>
#include <map>

// Constants
constexpr int BOARD_SIZE = 5;
constexpr int P1 = 1;
constexpr int P2 = 2;
constexpr int TILE_WHITE = 0;
constexpr int TILE_BLACK = 1;
constexpr int TILE_GRAY = 2;

constexpr int INITIAL_BLACK_TILES = 3;
constexpr int INITIAL_GRAY_TILES = 1;
constexpr int HISTORY_SIZE = 8;
constexpr int MAX_STEPS = 200;

// Action Size
constexpr int NUM_TILES = 51; // 1 (none) + 25 (black) + 25 (gray)

struct GameStateSnapshot {
    std::vector<int8_t> pieces; // 25
    std::vector<int8_t> tiles; // 25
    std::vector<int8_t> tile_counts; // 4 (P1_B, P1_G, P2_B, P2_G)
    
    bool operator==(const GameStateSnapshot& other) const {
        return pieces == other.pieces && tiles == other.tiles && tile_counts == other.tile_counts;
    }
};

class ContrastGame {
public:
    int8_t pieces[BOARD_SIZE][BOARD_SIZE]; // 0=Empty, 1=P1, 2=P2
    int8_t tiles[BOARD_SIZE][BOARD_SIZE]; // 0=White, 1=Black, 2=Gray
    
    // [PlayerIdx][Type] where PlayerIdx=0(P1), 1(P2); Type=0(Black), 1(Gray)
    int8_t tile_counts[2][2]; 
    
    int current_player; // 1 or 2
    bool game_over;
    int winner; // 0, 1, 2
    int move_count;
    
    std::deque<GameStateSnapshot> history;
    std::map<size_t, int> position_history; // Hash -> count

    ContrastGame() {
        reset();
    }
    
    void reset() {
        std::memset(pieces, 0, sizeof(pieces));
        std::memset(tiles, 0, sizeof(tiles));
        
        // P1 at y=4, P2 at y=0
        for(int x=0; x<5; ++x) pieces[4][x] = P1;
        for(int x=0; x<5; ++x) pieces[0][x] = P2;
        
        tile_counts[0][0] = INITIAL_BLACK_TILES;
        tile_counts[0][1] = INITIAL_GRAY_TILES;
        tile_counts[1][0] = INITIAL_BLACK_TILES;
        tile_counts[1][1] = INITIAL_GRAY_TILES;
        
        current_player = P1;
        game_over = false;
        winner = 0;
        move_count = 0;
        
        history.clear();
        position_history.clear();
        save_history();
    }
    
    void save_history() {
        GameStateSnapshot snap;
        snap.pieces.resize(25);
        snap.tiles.resize(25);
        snap.tile_counts.resize(4);
        
        std::memcpy(snap.pieces.data(), pieces, 25);
        std::memcpy(snap.tiles.data(), tiles, 25);
        snap.tile_counts[0] = tile_counts[0][0];
        snap.tile_counts[1] = tile_counts[0][1];
        snap.tile_counts[2] = tile_counts[1][0];
        snap.tile_counts[3] = tile_counts[1][1];
        
        history.push_front(snap);
        if (history.size() > HISTORY_SIZE) {
            history.pop_back();
        }
    }
    
    // Board hash for repetition check
    size_t get_board_hash() const {
        // Simple FNV-1a like hash
        size_t h = 14695981039346656037ULL;
        for(int i=0; i<5; ++i) for(int j=0; j<5; ++j) {
            h ^= pieces[i][j]; h *= 1099511628211ULL;
            h ^= tiles[i][j]; h *= 1099511628211ULL;
        }
        h ^= current_player; h *= 1099511628211ULL;
        return h;
    }
    
    ContrastGame copy() const {
        ContrastGame g;
        std::memcpy(g.pieces, pieces, sizeof(pieces));
        std::memcpy(g.tiles, tiles, sizeof(tiles));
        std::memcpy(g.tile_counts, tile_counts, sizeof(tile_counts));
        g.current_player = current_player;
        g.game_over = game_over;
        g.winner = winner;
        g.move_count = move_count;
        g.history = history; // Copy deque
        // position_history copy not strictly needed for MCTS sim but good for correctness
        return g; 
    }
    
    // --- Logic ---
    
    std::vector<int> get_valid_moves(int x, int y) const {
        std::vector<int> moves; // encoded as y*5+x
        if (pieces[y][x] != current_player) return moves;
        
        int t_type = tiles[y][x];
        
        // Directions: dx, dy
        static const int dirs_white[4][2] = {{0,-1}, {0,1}, {-1,0}, {1,0}};
        static const int dirs_black[4][2] = {{-1,-1}, {1,-1}, {-1,1}, {1,1}};
        static const int dirs_gray[8][2] = {{0,-1}, {0,1}, {-1,0}, {1,0}, {-1,-1}, {1,-1}, {-1,1}, {1,1}};
        
        const int (*dirs)[2];
        int num_dirs;
        
        if (t_type == TILE_WHITE) { dirs = dirs_white; num_dirs = 4; }
        else if (t_type == TILE_BLACK) { dirs = dirs_black; num_dirs = 4; }
        else { dirs = dirs_gray; num_dirs = 8; }
        
        for(int k=0; k<num_dirs; ++k) {
            int dx = dirs[k][0];
            int dy = dirs[k][1];
            int nx = x + dx;
            int ny = y + dy;
            
            while(nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
                int target = pieces[ny][nx];
                if (target == 0) {
                    moves.push_back(ny * 5 + nx);
                    break;
                } else if (target == current_player) {
                    // Jump over friend
                    nx += dx;
                    ny += dy;
                    continue; // Check bounds again
                } else {
                    // Enemy blocked
                    break;
                }
            }
        }
        return moves;
    }
    
    std::vector<int> get_all_legal_actions() const {
        if (game_over) return {};
        
        std::vector<int> actions;
        actions.reserve(50);
        
        std::vector<std::pair<int, int>> my_pieces;
        std::vector<std::pair<int, int>> white_spots;
        
        for(int y=0; y<5; ++y) {
            for(int x=0; x<5; ++x) {
                if (pieces[y][x] == current_player) my_pieces.push_back({x, y});
                if (tiles[y][x] == TILE_WHITE) white_spots.push_back({x, y});
            }
        }
        
        int p_idx = current_player - 1;
        bool has_black = tile_counts[p_idx][0] > 0;
        bool has_gray = tile_counts[p_idx][1] > 0;
        
        for(auto& p : my_pieces) {
            int cx = p.first;
            int cy = p.second;
            
            std::vector<int> moves = get_valid_moves(cx, cy);
            for(int m_enc : moves) {
                int mx = m_enc % 5;
                int my = m_enc / 5;
                
                int move_idx = (cy * 5 + cx) * 25 + m_enc;
                int base_hash = move_idx * NUM_TILES;
                
                // 1. Move only
                actions.push_back(base_hash);
                
                if (!has_black && !has_gray) continue;
                
                // 2. Move + Place
                for(auto& ws : white_spots) {
                    int tx = ws.first;
                    int ty = ws.second;
                    
                    if (tx == mx && ty == my) continue; // Can't place on destination
                    
                    // Check if occupied (except by self at start position, but that is impossible as tile must be white)
                    // Logic from python: `if pieces[ty, tx] != 0 and not (tx == cx and ty == cy)`
                    // But if tile is white, pieces[ty][tx] can be anything?
                    // "Tiles can only be placed on White tiles that are currently empty." -> Wait, wait.
                    // Python rule says:
                    // `if pieces[ty, tx] != 0 and not (tx == cx and ty == cy): continue`
                    // This implies we can place tile under us IF we just moved FROM there? 
                    // NO. `white_spots` are from current board. If we moved FROM (cx,cy), it becomes empty.
                    // But if (tx,ty) == (cx,cy), pieces[ty][tx] IS `current_player` before move.
                    // So `tx==cx && ty==cy` is the "moved from" spot.
                    
                    bool occupied = (pieces[ty][tx] != 0);
                    if (tx == cx && ty == cy) occupied = false; // We just left this spot
                    
                    if (occupied) continue;
                    
                    int spot_idx = ty * 5 + tx;
                    
                    if (has_black) {
                        actions.push_back(base_hash + 1 + spot_idx);
                    }
                    if (has_gray) {
                        actions.push_back(base_hash + 26 + spot_idx);
                    }
                }
            }
        }
        return actions;
    }
    
    void step(int action_hash) {
        if (game_over) return;
        
        int move_idx = action_hash / NUM_TILES;
        int tile_idx = action_hash % NUM_TILES;
        
        int from_idx = move_idx / 25;
        int to_idx = move_idx % 25;
        
        int fx = from_idx % 5; int fy = from_idx / 5;
        int tx = to_idx % 5; int ty = to_idx / 5;
        
        // Execute Move
        pieces[ty][tx] = pieces[fy][fx];
        pieces[fy][fx] = 0;
        
        // Execute Tile
        if (tile_idx > 0) {
            int t_color = 0;
            int t_loc = 0;
            if (tile_idx <= 25) {
                t_color = TILE_BLACK;
                t_loc = tile_idx - 1;
            } else {
                t_color = TILE_GRAY;
                t_loc = tile_idx - 26;
            }
            int t_x = t_loc % 5;
            int t_y = t_loc / 5;
            
            tiles[t_y][t_x] = t_color;
            
            // Decrement stock
            int p_idx = current_player - 1;
            int c_idx = (t_color == TILE_BLACK) ? 0 : 1;
            tile_counts[p_idx][c_idx]--;
        }
        
        check_win_fast();
        
        current_player = (current_player == P1) ? P2 : P1;
        
        // Check legal moves for next player
        if (!game_over) {
            auto acts = get_all_legal_actions();
            if (acts.empty()) {
                game_over = true;
                winner = (current_player == P1) ? P2 : P1;
            }
        }
        
        move_count++;
        save_history();
        
        // Repetition check (simple version)
        if (!game_over && move_count >= 50) {
            size_t h = get_board_hash();
            position_history[h]++;
            if (position_history[h] >= 5) {
               game_over = true;
               winner = 0; // Draw
            }
        }
    }
    
    void check_win_fast() {
        for(int x=0; x<5; ++x) {
            if (pieces[0][x] == P1) {
                game_over = true;
                winner = P1;
                return;
            }
        }
        for(int x=0; x<5; ++x) {
            if (pieces[4][x] == P2) {
                game_over = true;
                winner = P2;
                return;
            }
        }
    }
    
    // Encode state for NN
    // Returns Tensor(90, 5, 5) flattened ?? No, keep shape logic but stored in Tensor (N=90)
    // Actually Tensor class supports (N, C, H, W). Here batch=1, C=90, H=5, W=5.
    Tensor encode_state() const {
        Tensor t({1, 90, 5, 5});
        t.fill(0.0f);
        
        int current_pid = current_player;
        int opp_pid = (current_pid == P1) ? P2 : P1;
        bool should_flip = (current_pid == P2);
        
        int my_idx = current_pid - 1;
        int opp_idx = opp_pid - 1;
        
        int hist_len = history.size();
        
        for(int i=0; i<8; ++i) {
            const auto& snap = (i < hist_len) ? history[i] : history.back();
            // history[0] is latest
            
            for(int y=0; y<5; ++y) {
                for(int x=0; x<5; ++x) {
                    int idx = y * 5 + x; // Snap is flat vector
                    int p_val = snap.pieces[idx];
                    int t_val = snap.tiles[idx];
                    
                    int draw_x = x;
                    int draw_y = y;
                    
                    if (should_flip) {
                        // Rotate 180 means (x,y) -> (4-x, 4-y)
                        draw_x = 4 - x;
                        draw_y = 4 - y;
                    }
                    
                    // Channels 0-7: My Pieces
                    if (p_val == current_pid) {
                        t[t.index(0, i, draw_y, draw_x)] = 1.0f;
                    }
                    // Channels 8-15: Opp Pieces
                    if (p_val == opp_pid) {
                        t[t.index(0, 8+i, draw_y, draw_x)] = 1.0f;
                    }
                    // Channels 16-23: Black Tiles
                    if (t_val == TILE_BLACK) {
                        t[t.index(0, 16+i, draw_y, draw_x)] = 1.0f;
                    }
                    // Channels 24-31: Gray Tiles
                    if (t_val == TILE_GRAY) {
                        t[t.index(0, 24+i, draw_y, draw_x)] = 1.0f;
                    }
                    
                    // Counts (planes 56-87)
                    // Using loop over pixels is inefficient but consistent
                    t[t.index(0, 56+i, draw_y, draw_x)] = snap.tile_counts[my_idx*2 + 0] / 3.0f;
                    t[t.index(0, 64+i, draw_y, draw_x)] = snap.tile_counts[my_idx*2 + 1] / 1.0f;
                    t[t.index(0, 72+i, draw_y, draw_x)] = snap.tile_counts[opp_idx*2 + 0] / 3.0f;
                    t[t.index(0, 80+i, draw_y, draw_x)] = snap.tile_counts[opp_idx*2 + 1] / 1.0f;
                }
            }
        }
        
        // Channel 88: Color (Always 1 for current player since we flip)
        for(int i=0; i<25; ++i) t.data[88*25 + i] = 1.0f; // t.index(0, 88, ...)
        
        // Channel 89: Move Count
        float mc_val = (float)move_count / 200.0f; // MAX_STEPS
        for(int i=0; i<25; ++i) t.data[89*25 + i] = mc_val;
        
        return t;
    }
};

// Helpers for P2 flips
inline int flip_location(int idx) {
    return 24 - idx;
}

inline int flip_action(int action_hash) {
    int move_idx = action_hash / NUM_TILES;
    int tile_idx = action_hash % NUM_TILES;
    
    int from_idx = move_idx / 25;
    int to_idx = move_idx % 25;
    
    int new_from = flip_location(from_idx);
    int new_to = flip_location(to_idx);
    int new_move_idx = new_from * 25 + new_to;
    
    int new_tile_idx = 0;
    if (tile_idx > 0) {
        if (tile_idx <= 25) { // Black
            int pos = tile_idx - 1;
            int new_pos = flip_location(pos);
            new_tile_idx = new_pos + 1;
        } else { // Gray
            int pos = tile_idx - 26;
            int new_pos = flip_location(pos);
            new_tile_idx = new_pos + 26;
        }
    }
    return new_move_idx * NUM_TILES + new_tile_idx;
}

#endif // GAME_H
