# Tracing Pong

# Goal

# Research

https://emulation.gametechwiki.com/index.php/Discrete_circuitry-based_arcade_games

## AY-3-8500

Data sheet https://www.raphnet.net/divers/tvfun_repair/AY-3-8500.pdf
General information on https://en.wikipedia.org/wiki/AY-3-8500

## Signetics 2650

https://en.wikipedia.org/wiki/Signetics_2650
Emulation https://amigan.yatho.com/#software

# Implementation

- https://emulation.gametechwiki.com/index.php/Main_Page

## Record Canvas

- https://medium.com/@amatewasu/how-to-record-a-canvas-element-d4d0826d3591
- https://github.com/webrtc/samples/blob/gh-pages/src/content/capture/canvas-record/js/main.js

## Game implementations

### AY-3-8500

- http://searle.x10host.com/AVRPong/index.html

### Pong

- https://github.com/jakesgordon/javascript-pong

### Odyssey

#### Unity based

- https://pathealy.itch.io/odyssey-now-hal
- https://github.com/Vibrant-Media-Lab/OdysseyNowHAL

#### Godot dased

# Input video

```
ffmpeg -fflags +genpts -i 1.webm -r 24 1.mp4
```

```
ffmpeg -i input.webm -c copy output.mp4
```

# Postprocessing

## Image from video

- https://github.com/wq2012/video-average-frame
- https://github.com/dohliam/video-averaging

## Heatmap

- https://stackoverflow.com/questions/59478962/how-to-convert-a-grayscale-image-to-heatmap-image-with-python-opencv

# TODO

- Remove images
- Start palying automatically

# Links

- http://www.simulationsraum.de/blog/tag/pong/

# TODO

- Sharp edges: ctx.imageSmoothingEnabled = false;
