#ifndef LAYERS_H
#define LAYERS_H

#include "tensor.h"
#include <vector>
#include <cmath>
#include <cassert>
#include <iostream>

// Helper: Padding
inline Tensor pad_tensor(const Tensor& input, int pad) {
    if (pad == 0) return input;
    
    // Assumes input is [N, C, H, W]
    int N = input.shape[0];
    int C = input.shape[1];
    int H = input.shape[2];
    int W = input.shape[3];
    
    int H_out = H + 2 * pad;
    int W_out = W + 2 * pad;
    
    Tensor output({N, C, H_out, W_out});
    
    for(int n=0; n<N; ++n) {
        for(int c=0; c<C; ++c) {
            for(int h=0; h<H; ++h) {
                for(int w=0; w<W; ++w) {
                    int idx_in = input.index(n, c, h, w);
                    int idx_out = output.index(n, c, h+pad, w+pad);
                    output[idx_out] = input[idx_in];
                }
            }
        }
    }
    return output;
}

// Conv2d Layer
class Conv2d {
public:
    Tensor weight;
    Tensor bias;
    int in_channels;
    int out_channels;
    int kernel_size;
    int stride;
    int padding;
    bool has_bias;

    Conv2d(int in_c, int out_c, int k, int s, int p, bool bias=true)
        : in_channels(in_c), out_channels(out_c), kernel_size(k), stride(s), padding(p), has_bias(bias) {}

    // Load weights/bias from raw float arrays
    void load_weights(const std::vector<float>& w_data, const std::vector<float>& b_data) {
        weight = Tensor({out_channels, in_channels, kernel_size, kernel_size}, w_data);
        if (has_bias) {
            bias = Tensor({out_channels}, b_data);
        }
    }

    Tensor forward(const Tensor& input) {
        // Input: [N, C_in, H_in, W_in]
        int N = input.shape[0];
        int H_in = input.shape[2];
        int W_in = input.shape[3];

        // Padding
        Tensor padded_input = pad_tensor(input, padding);
        int H_pad = padded_input.shape[2];
        int W_pad = padded_input.shape[3];

        int H_out = (H_pad - kernel_size) / stride + 1;
        int W_out = (W_pad - kernel_size) / stride + 1;

        Tensor output({N, out_channels, H_out, W_out});

        for (int n = 0; n < N; ++n) {
            for (int oc = 0; oc < out_channels; ++oc) {
                float b_val = has_bias ? bias[oc] : 0.0f;
                for (int h_out = 0; h_out < H_out; ++h_out) {
                    for (int w_out = 0; w_out < W_out; ++w_out) {
                        float sum = 0.0f;
                        int h_start = h_out * stride;
                        int w_start = w_out * stride;

                        for (int ic = 0; ic < in_channels; ++ic) {
                            for (int kh = 0; kh < kernel_size; ++kh) {
                                for (int kw = 0; kw < kernel_size; ++kw) {
                                    int idx_in = padded_input.index(n, ic, h_start + kh, w_start + kw);
                                    int idx_w = oc * (in_channels * kernel_size * kernel_size) 
                                              + ic * (kernel_size * kernel_size) 
                                              + kh * kernel_size 
                                              + kw;
                                    sum += padded_input[idx_in] * weight[idx_w];
                                }
                            }
                        }
                        int idx_out = output.index(n, oc, h_out, w_out);
                        output[idx_out] = sum + b_val;
                    }
                }
            }
        }
        return output;
    }
};

// Linear (Fully Connected) Layer
class Linear {
public:
    Tensor weight;
    Tensor bias;
    int in_features;
    int out_features;

    Linear(int in_f, int out_f) : in_features(in_f), out_features(out_f) {}

    void load_weights(const std::vector<float>& w_data, const std::vector<float>& b_data) {
        weight = Tensor({out_features, in_features}, w_data);
        bias = Tensor({out_features}, b_data);
    }

    Tensor forward(const Tensor& input) {
        // Input: [N, in_features]
        int N = input.shape[0];
        Tensor output({N, out_features});

        for (int n = 0; n < N; ++n) {
            for (int out_f = 0; out_f < out_features; ++out_f) {
                float sum = bias[out_f];
                for (int in_f = 0; in_f < in_features; ++in_f) {
                    // Linear: y = xA^T + b => weight is [out, in]
                    // input index: n*in_features + in_f
                    // weight index: out_f*in_features + in_f
                    sum += input[n * in_features + in_f] * weight[out_f * in_features + in_f];
                }
                output[n * out_features + out_f] = sum;
            }
        }
        return output;
    }
};

// ReLU
inline Tensor relu(const Tensor& input) {
    Tensor output = input;
    for (size_t i = 0; i < output.data.size(); ++i) {
        if (output.data[i] < 0) {
            output.data[i] = 0.0f;
        }
    }
    return output; // Copy elision
}

// Global Average Pooling (not used in this model, but typically needed for standard ResNet)
// This model uses flatten -> Linear, so no pooling needed.

// Residual Block
class ResidualBlock {
public:
    Conv2d* conv1;
    Conv2d* conv2;

    ResidualBlock(int channels) {
        conv1 = new Conv2d(channels, channels, 3, 1, 1);
        conv2 = new Conv2d(channels, channels, 3, 1, 1);
    }

    ~ResidualBlock() {
        delete conv1;
        delete conv2;
    }
    
    void load_weights(const std::vector<float>& w1, const std::vector<float>& b1,
                      const std::vector<float>& w2, const std::vector<float>& b2) {
        conv1->load_weights(w1, b1);
        conv2->load_weights(w2, b2);
    }

    Tensor forward(const Tensor& x) {
        Tensor residual = x;
        Tensor out = conv1->forward(x);
        out = relu(out); // ReLU after first conv
        out = conv2->forward(out);
        
        // Add residual
        for (size_t i = 0; i < out.data.size(); ++i) {
            out.data[i] += residual.data[i];
        }
        
        return relu(out); // Final ReLU
    }
};

#endif // LAYERS_H
