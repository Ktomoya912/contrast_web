# Build Instructions

## Prerequisites
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) must be installed and active (`emcc`).
- Node.js & npm.

## 1. Compile C++ to WebAssembly
Run the following command from the project root:

```bash
emcc -O3 -std=c++17 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="ContrastModule"' \
    -s FORCE_FILESYSTEM=1 \
    -s EXPORTED_RUNTIME_METHODS='["FS"]' \
    -I. \
    --bind \
    -o web/public/contrast.js \
    wasm/bindings.cpp
```

## 2. Model Weights
The weights have been exported to `web/public/model.bin` automatically. If you retrain the model, run:
```bash
uv run python scripts/export_weights.py
cp wasm/model.bin web/public/model.bin
```

## 3. Run Web App
```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173 to play!
