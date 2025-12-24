#ifndef TENSOR_H
#define TENSOR_H

#include <vector>
#include <iostream>
#include <cmath>
#include <cassert>
#include <algorithm>
#include <numeric>

// 4D Tensor class (N, C, H, W) or (N, C) or (N)
class Tensor {
public:
    std::vector<float> data;
    std::vector<int> shape;

    Tensor() {}
    Tensor(std::vector<int> shape) : shape(shape) {
        int size = 1;
        for (int s : shape) size *= s;
        data.resize(size, 0.0f);
    }
    Tensor(std::vector<int> shape, const std::vector<float>& init_data) : shape(shape), data(init_data) {
        int size = 1;
        for (int s : shape) size *= s;
        assert(data.size() == size);
    }

    int size() const {
        return data.size();
    }

    float& operator[](int index) {
        return data[index];
    }

    const float& operator[](int index) const {
        return data[index];
    }
    
    void fill(float value) {
        std::fill(data.begin(), data.end(), value);
    }

    // Helper to get linear index from 4D coordinates
    int index(int n, int c, int h, int w) const {
        // shape: [N, C, H, W]
        assert(shape.size() == 4);
        int stride_n = shape[1] * shape[2] * shape[3];
        int stride_c = shape[2] * shape[3];
        int stride_h = shape[3];
        return n * stride_n + c * stride_c + h * stride_h + w;
    }
    
    // Check if tensor is contiguous (always true for this simple implementation)
    bool is_contiguous() const { return true; }

    void print_shape() {
        std::cout << "Shape: [";
        for (size_t i = 0; i < shape.size(); ++i) {
            std::cout << shape[i] << (i < shape.size() - 1 ? ", " : "");
        }
        std::cout << "]" << std::endl;
    }
};

#endif // TENSOR_H
