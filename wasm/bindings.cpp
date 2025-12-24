#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "game.h"
#include "mcts.h"
#include "model.h"

using namespace emscripten;

// Global instances
// Global instances
ContrastDualPolicyNet* global_net = nullptr;
ContrastGame* global_game = nullptr;
MCTS* global_mcts = nullptr;
std::vector<ContrastGame> game_history; // For Undo

// Init function
void init_game(std::string model_path) {
    if (global_net) delete global_net;
    if (global_game) delete global_game;
    if (global_mcts) delete global_mcts;
    
    global_net = new ContrastDualPolicyNet();
    global_net->load_from_file(model_path);
    
    global_game = new ContrastGame();
    global_mcts = new MCTS(global_net);
    game_history.clear();
}

void reset_game(int human_player_id) {
    if (global_game) global_game->reset();
    game_history.clear();
}

// ... (get_state same as before) ...

val get_state() {
    if (!global_game) return val::null();
    
    val state = val::object();
    
    // Pieces (flat array)
    val pieces_arr = val::array();
    for(int i=0; i<25; ++i) pieces_arr.call<void>("push", global_game->pieces[i/5][i%5]);
    state.set("pieces", pieces_arr);
    
    // Tiles (flat array)
    val tiles_arr = val::array();
    for(int i=0; i<25; ++i) tiles_arr.call<void>("push", global_game->tiles[i/5][i%5]);
    state.set("tiles", tiles_arr);
    
    // Tile Counts
    val counts = val::array(); // [P1_B, P1_G, P2_B, P2_G]
    counts.call<void>("push", global_game->tile_counts[0][0]);
    counts.call<void>("push", global_game->tile_counts[0][1]);
    counts.call<void>("push", global_game->tile_counts[1][0]);
    counts.call<void>("push", global_game->tile_counts[1][1]);
    state.set("tile_counts", counts);
    
    state.set("current_player", global_game->current_player);
    state.set("game_over", global_game->game_over);
    state.set("winner", global_game->winner);
    state.set("move_count", global_game->move_count);
    
    return state;
}

val get_valid_moves(int x, int y) {
    if (!global_game) return val::array();
    auto moves = global_game->get_valid_moves(x, y);
    val arr = val::array();
    for(int m : moves) arr.call<void>("push", m);
    return arr;
}

// Step function wrapped
val step(int action_hash) {
    if (!global_game) return val::object();
    
    auto legal = global_game->get_all_legal_actions();
    bool is_legal = false;
    for(int a : legal) if(a == action_hash) is_legal = true;
    
    if(!is_legal) {
        val res = val::object();
        res.set("success", false);
        res.set("error", "Illegal move");
        return res;
    }
    
    // Push to history before modifying
    game_history.push_back(global_game->copy());
    
    global_game->step(action_hash);
    
    val res = val::object();
    res.set("success", true);
    res.set("game_over", global_game->game_over);
    res.set("winner", global_game->winner);
    return res;
}

// Undo function
bool undo() {
    if (!global_game || game_history.empty()) return false;
    
    *global_game = game_history.back();
    game_history.pop_back();
    
    // Also likely want to clear future history or relevant MCTS nodes?
    // MCTS nodes are hashed by state, so they are valid valid.
    return true;
}

val ai_think(int simulations) {
    if (!global_game || !global_mcts) return val::null();
    
    global_mcts->search(*global_game, simulations);
    int action = global_mcts->get_best_action(*global_game);
    float value = global_mcts->get_root_value(*global_game);
    
    val res = val::object();
    res.set("action", action);
    res.set("value", value);
    return res;
}

// Helper to decode action hash for JS
val decode_action_js(int action_hash) {
    val res = val::object();
    int move_idx = action_hash / 51;
    int tile_idx = action_hash % 51;
    
    int from_idx = move_idx / 25;
    int to_idx = move_idx % 25;
    
    res.set("from_x", from_idx % 5);
    res.set("from_y", from_idx / 5);
    res.set("to_x", to_idx % 5);
    res.set("to_y", to_idx / 5);
    
    if (tile_idx > 0) {
        int t_color = (tile_idx <= 25) ? 1 : 2; // Black=1, Gray=2
        int t_loc = (tile_idx <= 25) ? (tile_idx-1) : (tile_idx-26);
        res.set("tile_type", t_color);
        res.set("tile_x", t_loc % 5);
        res.set("tile_y", t_loc / 5);
    } else {
        res.set("tile_type", 0);
    }
    
    return res;
}

EMSCRIPTEN_BINDINGS(contrast_module) {
    function("init_game", &init_game);
    function("reset_game", &reset_game);
    function("get_state", &get_state);
    function("get_valid_moves", &get_valid_moves);
    function("step", &step);
    function("undo", &undo);
    function("ai_think", &ai_think);
    function("decode_action", &decode_action_js);
}
