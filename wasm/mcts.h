#ifndef MCTS_H
#define MCTS_H

#include "game.h"
#include "model.h"
#include <unordered_map>
#include <cmath>
#include <random>
#include <iostream>

struct Node {
    std::unordered_map<int, float> P; // Action -> Prob
    std::unordered_map<int, int> N;   // Action -> Visits
    std::unordered_map<int, float> W; // Action -> Total Value
    
    // Add simple terminal flag or value if needed, but handled by expand return
};

class MCTS {
public:
    ContrastDualPolicyNet* network;
    std::unordered_map<size_t, Node> nodes;
    
    float c_puct = 2.5f; // From config
    float dirichlet_alpha = 0.3f;
    float dirichlet_epsilon = 0.25f;
    
    std::mt19937 rng;

    MCTS(ContrastDualPolicyNet* net) : network(net) {
        rng.seed(std::random_device{}());
    }
    
    // Simple key from board hash + move count
    // A collision here would be bad, but hash should be robust enough for this scale
    size_t get_key(const ContrastGame& game) {
        return game.get_board_hash() ^ (game.move_count * 987654321ULL);
    }
    
    void search(const ContrastGame& root_game, int num_simulations) {
        size_t root_key = get_key(root_game);
        
        // Expand root if needed
        if (nodes.find(root_key) == nodes.end()) {
            expand(root_game);
        }
        
        // Add noise to root
        auto& root_node = nodes[root_key];
        if (root_node.P.empty()) return;
        
        std::vector<int> actions;
        for(auto& kv : root_node.P) actions.push_back(kv.first);
        
        // Dirichlet noise (approximate)
        std::gamma_distribution<float> gamma(dirichlet_alpha, 1.0f);
        std::vector<float> noise;
        float noise_sum = 0;
        for(size_t i=0; i<actions.size(); ++i) {
            float n = gamma(rng);
            noise.push_back(n);
            noise_sum += n;
        }
        
        for(size_t i=0; i<actions.size(); ++i) {
            int a = actions[i];
            float n_val = noise[i] / noise_sum;
            root_node.P[a] = (1 - dirichlet_epsilon) * root_node.P[a] + dirichlet_epsilon * n_val;
        }
        
        // Simulations
        for(int i=0; i<num_simulations; ++i) {
            ContrastGame scratch = root_game.copy();
            evaluate(scratch);
        }
    }
    
    float evaluate(ContrastGame& game) {
        size_t key = get_key(game);
        
        // 1. Game Over
        if (game.game_over) {
            if (game.winner == 0) return 0.0f;
            return (game.winner == game.current_player) ? 1.0f : -1.0f;
        }
        
        // 2. Expand if new
        if (nodes.find(key) == nodes.end()) {
            return expand(game);
        }
        
        // 3. Selection (PUCT)
        Node& node = nodes[key];
        if (node.P.empty()) return 0.0f; // Should not happen unless no legal moves but not game over?
        
        float sqrt_sum_n = 0;
        int sum_n = 0;
        for(auto& kv : node.N) sum_n += kv.second;
        sqrt_sum_n = std::sqrt((float)sum_n);
        
        int best_a = -1;
        float best_score = -1e9f;
        
        for(auto& kv : node.P) {
            int a = kv.first;
            float p = kv.second;
            int n = node.N[a];
            float w = node.W[a];
            
            float q = (n > 0) ? (w / n) : 0.0f;
            float u = c_puct * p * sqrt_sum_n / (1.0f + n);
            
            if (q + u > best_score) {
                best_score = q + u;
                best_a = a;
            }
        }
        
        // 4. Step
        game.step(best_a);
        float v = -evaluate(game);
        
        // 5. Backup
        node.N[best_a]++;
        node.W[best_a] += v;
        
        return v;
    }
    
    float expand(const ContrastGame& game) {
        size_t key = get_key(game);
        
        // Inference
        Tensor input = game.encode_state();
        auto out = network->forward(input);
        float value = out.value;
        
        auto& node = nodes[key]; // Create node
        
        auto legal_actions = game.get_all_legal_actions();
        if (legal_actions.empty()) {
            return value; // Should be handled by game_over, but safety
        }
        
        // Softmax policy for legal actions only
        bool should_flip = (game.current_player == P2);
        
        std::vector<float> logits;
        float max_logit = -1e9f;
        
        for (int a : legal_actions) {
            // Mapping logic from Python
            int query_hash = should_flip ? flip_action(a) : a;
            int move_idx = query_hash / 51; // NUM_TILES
            int tile_idx = query_hash % 51;
            
            // Logits in tensor are flat 625 and 51
            float m_l = out.move_logits.data[move_idx];
            float t_l = out.tile_logits.data[tile_idx];
            float combined = m_l + t_l;
            
            logits.push_back(combined);
            if (combined > max_logit) max_logit = combined;
        }
        
        // Exp & Sum
        float sum_exp = 0.0f;
        for(float& l : logits) {
            l = std::exp(l - max_logit);
            sum_exp += l;
        }
        
        // Store Probs
        for(size_t i=0; i<legal_actions.size(); ++i) {
            node.P[legal_actions[i]] = logits[i] / sum_exp;
            node.N[legal_actions[i]] = 0;
            node.W[legal_actions[i]] = 0;
        }
        
        return value;
    }
    
    int get_best_action(const ContrastGame& game) {
        size_t key = get_key(game);
        if (nodes.find(key) == nodes.end()) return -1;
        
        Node& node = nodes[key];
        int best_a = -1;
        int max_n = -1;
        
        for(auto& kv : node.N) {
            if (kv.second > max_n) {
                max_n = kv.second;
                best_a = kv.first;
            }
        }
        return best_a;
    }

    float get_root_value(const ContrastGame& game) {
        size_t key = get_key(game);
        if (nodes.find(key) == nodes.end()) return 0.0f;
        
        Node& node = nodes[key];
        float total_w = 0.0f;
        int total_n = 0;
        
        for(auto& kv : node.N) {
            int a = kv.first;
            int n = kv.second;
            float w = node.W[a]; // map lookup might be unsafe if not exists?
            // in expand P is init, N/W are empty.
            // but N is map int->int. implicitly 0.
            // W is map int->float. implicitly 0.0.
            
            total_n += n;
            total_w += w;
        }
        
        if (total_n == 0) return 0.0f;
        return total_w / total_n;
    }
};

#endif // MCTS_H
