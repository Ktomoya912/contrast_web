import torch
import torch.nn as nn
import numpy as np
import sys
import os

# Add parent directory to path to import model
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model import ContrastDualPolicyNet
from config import game_config, network_config

def fuse_conv_bn_relu(conv, bn):
    """
    Fuses Conv2d and BatchNorm2d into a single Conv2d
    w_fused = w_conv * (gamma / sqrt(var + eps))
    b_fused = (b_conv - mean) * (gamma / sqrt(var + eps)) + beta
    """
    with torch.no_grad():
        # Get conv weights
        w_conv = conv.weight.clone()
        if conv.bias is not None:
            b_conv = conv.bias.clone()
        else:
            b_conv = torch.zeros_like(bn.running_mean)

        # Get BN parameters
        gamma = bn.weight
        beta = bn.bias
        mean = bn.running_mean
        var = bn.running_var
        eps = bn.eps

        # Compute scaling factor
        scale = gamma / torch.sqrt(var + eps)
        
        # Reshape scale for broadcasting: [Out_Channels, 1, 1, 1]
        scale_shape = [1] * len(w_conv.shape)
        scale_shape[0] = -1
        scale_view = scale.view(scale_shape)

        # Fuse weights
        w_fused = w_conv * scale_view
        
        # Fuse bias
        b_fused = (b_conv - mean) * scale + beta

    return w_fused, b_fused

def export_to_binary(model, output_path):
    print(f"Exporting model to {output_path}...")
    
    with open(output_path, 'wb') as f:
        # Helper to write tensor
        def write_tensor(name, tensor):
            data = tensor.cpu().numpy().astype(np.float32)
            print(f"Writing {name}: shape={data.shape}, size={data.size}")
            # Write dims count
            f.write(np.array([len(data.shape)], dtype=np.int32).tobytes())
            # Write dims
            f.write(np.array(data.shape, dtype=np.int32).tobytes())
            # Write data
            f.write(data.tobytes())

        # 1. Input Block
        w, b = fuse_conv_bn_relu(model.conv_input, model.bn_input)
        write_tensor("input_conv_w", w)
        write_tensor("input_conv_b", b)

        # 2. ResBlocks
        for i, block in enumerate(model.res_blocks):
            # Conv1
            w1, b1 = fuse_conv_bn_relu(block.conv1, block.bn1)
            write_tensor(f"res{i}_conv1_w", w1)
            write_tensor(f"res{i}_conv1_b", b1)
            
            # Conv2
            w2, b2 = fuse_conv_bn_relu(block.conv2, block.bn2)
            write_tensor(f"res{i}_conv2_w", w2)
            write_tensor(f"res{i}_conv2_b", b2)

        # 3. Move Head
        w_move, b_move = fuse_conv_bn_relu(model.move_conv, model.move_bn)
        write_tensor("move_head_conv_w", w_move)
        write_tensor("move_head_conv_b", b_move)
        
        write_tensor("move_head_fc_w", model.move_fc.weight.detach())
        write_tensor("move_head_fc_b", model.move_fc.bias.detach())

        # 4. Tile Head
        w_tile, b_tile = fuse_conv_bn_relu(model.tile_conv, model.tile_bn)
        write_tensor("tile_head_conv_w", w_tile)
        write_tensor("tile_head_conv_b", b_tile)
        
        write_tensor("tile_head_fc_w", model.tile_fc.weight.detach())
        write_tensor("tile_head_fc_b", model.tile_fc.bias.detach())

        # 5. Value Head
        w_val, b_val = fuse_conv_bn_relu(model.value_conv, model.value_bn)
        write_tensor("val_head_conv_w", w_val)
        write_tensor("val_head_conv_b", b_val)
        
        write_tensor("val_head_fc1_w", model.value_fc1.weight.detach())
        write_tensor("val_head_fc1_b", model.value_fc1.bias.detach())
        
        write_tensor("val_head_fc2_w", model.value_fc2.weight.detach())
        write_tensor("val_head_fc2_b", model.value_fc2.bias.detach())

    print("Export complete.")

if __name__ == "__main__":
    device = torch.device('cpu')
    
    # Load Model
    model_path = "models/contrast_model_final.pth"
    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found")
        sys.exit(1)
        
    print(f"Loading {model_path}...")
    model = ContrastDualPolicyNet().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    # Create output directory
    os.makedirs("wasm", exist_ok=True)
    
    # Export
    export_to_binary(model, "wasm/model.bin")
