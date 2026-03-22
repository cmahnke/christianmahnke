#!/bin/bash

# Configuration
INPUT="$1"
OUTPUT="output_compressed.mp4"
TARGET_SIZE_MB=95 # Targeting 95MB to ensure we stay under 100MB
AUDIO_BITRATE_KBPS=128

if [ -z "$INPUT" ]; then
    echo "Usage: ./shrink.sh input_file.mp4"
    exit 1
fi

# 1. Get duration using ffprobe (requires ffprobe installed)
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT")

# 2. Calculate Bitrate
# (Target MB * 8192 bits / Duration) - Audio Bitrate
TOTAL_BITRATE=$(echo "($TARGET_SIZE_MB * 8192 / $DURATION)" | bc)
VIDEO_BITRATE=$(echo "$TOTAL_BITRATE - $AUDIO_BITRATE_KBPS" | bc)

echo "Duration: $DURATION seconds"
echo "Target Video Bitrate: ${VIDEO_BITRATE}k"

# 3. Pass 1: Analyze video (No audio needed here)
ffmpeg -y -i "$INPUT" -c:v libx264 -b:v "${VIDEO_BITRATE}k" -pass 1 -preset slow -maxrate "${VIDEO_BITRATE}k" -bufsize "$((VIDEO_BITRATE * 2))k" -an -f mp4 /dev/null

# 4. Pass 2: Encode video AND include audio
# Added -map 0:a? to ensure audio is pulled from source if it exists
ffmpeg -y -i "$INPUT" -c:v libx264 -b:v "${VIDEO_BITRATE}k" -pass 2 -preset slow -maxrate "${VIDEO_BITRATE}k" -bufsize "$((VIDEO_BITRATE * 2))k" -c:a aac -b:a "${AUDIO_BITRATE_KBPS}k" -map 0:v:0 -map 0:a? "$OUTPUT"

# Cleanup ffmpeg log files
rm ffmpeg2pass-0.log x264_2pass.log 2>/dev/null

echo "Process complete: $OUTPUT"
