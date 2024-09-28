# TODO

- Pong
  - Fix asset loading
  - fix dimensions
  - Check frame rate

# Notes

- Installation might need `npm i --ignore-scripts` due to building issues
- You might also need to run `--prefix ./` to avoid inclusion of parent `package.json`

# convert model

```
python ../../themes/projektemacher-base/scripts/enhance_image.py  -i webgpu/public/model/3DModel.jpg
 npm run model
npx gltf-transform optimize webgpu/public/model/uranium.glb  webgpu/public/model/uranium.optimized.glb

```
