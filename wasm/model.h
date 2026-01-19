#ifndef MODEL_H
#define MODEL_H

#include "tensor.h"
#include "layers.h"
#include <fstream>
#include <vector>
#include <iostream>

class ContrastDualPolicyNet
{
public:
    // Layers
    Conv2d *conv_input;
    std::vector<ResidualBlock *> res_blocks;

    // Move Head
    Conv2d *move_conv;
    Linear *move_fc;

    // Tile Head
    Conv2d *tile_conv;
    Linear *tile_fc;

    // Value Head
    Conv2d *value_conv;
    Linear *value_fc1;
    Linear *value_fc2;

    int num_res_blocks;

    ContrastDualPolicyNet(int blocks = 8) : num_res_blocks(blocks)
    {
        // Init Layers (shapes match export script)
        // Input: 66 -> 64
        conv_input = new Conv2d(66, 64, 3, 1, 1);

        for (int i = 0; i < num_res_blocks; ++i)
        {
            res_blocks.push_back(new ResidualBlock(64));
        }

        // Move: 64 -> 32 -> Flatten(800) -> 625
        move_conv = new Conv2d(64, 32, 1, 1, 0);
        move_fc = new Linear(32 * 5 * 5, 625);

        // Tile: 64 -> 16 -> Flatten(400) -> 51
        tile_conv = new Conv2d(64, 16, 1, 1, 0);
        tile_fc = new Linear(16 * 5 * 5, 51);

        // Value: 64 -> 4 -> Flatten(100) -> 32 -> 1
        value_conv = new Conv2d(64, 4, 1, 1, 0);
        value_fc1 = new Linear(4 * 5 * 5, 32);
        value_fc2 = new Linear(32, 1);
    }

    ~ContrastDualPolicyNet()
    {
        delete conv_input;
        for (auto b : res_blocks)
            delete b;
        delete move_conv;
        delete move_fc;
        delete tile_conv;
        delete tile_fc;
        delete value_conv;
        delete value_fc1;
        delete value_fc2;
    }

    // Helper to read vector from stream
    std::vector<float> read_float_vector(std::ifstream &f)
    {
        int dims_len;
        f.read(reinterpret_cast<char *>(&dims_len), sizeof(int));
        std::vector<int> shape(dims_len);
        f.read(reinterpret_cast<char *>(shape.data()), dims_len * sizeof(int));

        int size = 1;
        for (int s : shape)
            size *= s;
        std::vector<float> data(size);
        f.read(reinterpret_cast<char *>(data.data()), size * sizeof(float));
        return data; // RVO
    }

    void load_from_file(const std::string &path)
    {
        std::ifstream f(path, std::ios::binary);
        if (!f.is_open())
        {
            std::cerr << "Failed to open model file: " << path << std::endl;
            return;
        }

        // Order matches export script
        // 1. Input
        auto w = read_float_vector(f);
        auto b = read_float_vector(f);
        conv_input->load_weights(w, b);

        // 2. ResBlocks
        for (int i = 0; i < num_res_blocks; ++i)
        {
            auto w1 = read_float_vector(f);
            auto b1 = read_float_vector(f);
            auto w2 = read_float_vector(f);
            auto b2 = read_float_vector(f);
            res_blocks[i]->load_weights(w1, b1, w2, b2);
        }

        // 3. Move Head
        auto mw = read_float_vector(f);
        auto mb = read_float_vector(f);
        move_conv->load_weights(mw, mb);

        auto mfc_w = read_float_vector(f);
        auto mfc_b = read_float_vector(f);
        move_fc->load_weights(mfc_w, mfc_b);

        // 4. Tile Head
        auto tw = read_float_vector(f);
        auto tb = read_float_vector(f);
        tile_conv->load_weights(tw, tb);

        auto tfc_w = read_float_vector(f);
        auto tfc_b = read_float_vector(f);
        tile_fc->load_weights(tfc_w, tfc_b);

        // 5. Value Head
        auto vw = read_float_vector(f);
        auto vb = read_float_vector(f);
        value_conv->load_weights(vw, vb);

        auto vfc1_w = read_float_vector(f);
        auto vfc1_b = read_float_vector(f);
        value_fc1->load_weights(vfc1_w, vfc1_b);

        auto vfc2_w = read_float_vector(f);
        auto vfc2_b = read_float_vector(f);
        value_fc2->load_weights(vfc2_w, vfc2_b);

        std::cout << "Model weights loaded." << std::endl;
    }

    // Forward Pass
    // Returns {move_logits(1, 625), tile_logits(1, 51), value(1, 1)}
    struct Output
    {
        Tensor move_logits;
        Tensor tile_logits;
        float value;
    };

    Output forward(const Tensor &input)
    {
        // Backbone
        Tensor x = conv_input->forward(input);
        x = relu(x);

        for (auto b : res_blocks)
        {
            x = b->forward(x);
        }

        // Move Head
        Tensor m = move_conv->forward(x); // (1, 32, 5, 5)
        m = relu(m);
        // Flatten handled implicitly by Linear treating input as (N, 800)
        Tensor move_logits = move_fc->forward(m);

        // Tile Head
        Tensor t = tile_conv->forward(x);
        t = relu(t);
        Tensor tile_logits = tile_fc->forward(t);

        // Value Head
        Tensor v = value_conv->forward(x); // (1, 1, 5, 5)
        v = relu(v);
        v = value_fc1->forward(v);
        v = relu(v);
        Tensor val_out = value_fc2->forward(v);
        float value = std::tanh(val_out[0]);

        return {move_logits, tile_logits, value};
    }
};

#endif // MODEL_H
