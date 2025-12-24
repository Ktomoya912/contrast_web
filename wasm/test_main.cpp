#include "game.h"
#include "model.h"
#include "mcts.h"
#include <iostream>
#include <vector>
#include <string>

// Simple verification runner
int main(int argc, char** argv) {
    if (argc < 2) {
        std::cerr << "Usage: ./test_main <model.bin>" << std::endl;
        return 1;
    }
    
    std::string model_path = argv[1];
    
    ContrastDualPolicyNet net;
    net.load_from_file(model_path);
    
    ContrastGame game;
    MCTS mcts(&net);
    
    // 1. Check Inference
    std::cout << "Checking Inference..." << std::endl;
    Tensor input = game.encode_state();
    auto out = net.forward(input);
    std::cout << "Value: " << out.value << std::endl;
    std::cout << "Move Logits[0]: " << out.move_logits[0] << std::endl;
    
    // 2. Play a few random moves
    std::cout << "Playing verify game..." << std::endl;
    game.reset();
    
    for(int i=0; i<10; ++i) {
        mcts.search(game, 50); // Small sim count
        int action = mcts.get_best_action(game);
        std::cout << "Step " << i << ": Action " << action << std::endl;
        game.step(action);
        if(game.game_over) break;
    }
    
    std::cout << "Test Finished. Winner: " << game.winner << std::endl;
    
    return 0;
}
