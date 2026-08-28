import os
import json
import subprocess
from pathlib import Path

# ==========================================
# Configuration
# ==========================================
# 1. The base directory to search recursively for "qrcode.json" files
BASE_DIR = "./docs"

# 2. The source image to be dithered into the QR code (configurable)
SOURCE_IMAGE_PATH = "themes/projektemacher-base/static/images/cm-solid.svg"

# 3. The command to invoke the tool.
# Use "dithered-qr" if installed globally, or ["python", "-m", "dithered_qr"] otherwise.
DITHERED_QR_CMD = "dithered-qr"
# ==========================================


def find_qrcode_json_files(base_dir: str) -> list[Path]:
    """Recursively find all files named exactly 'qrcode.json' in the base directory."""
    return list(Path(base_dir).rglob("qrcode.json"))


def process_qrcode_json(json_file_path: Path, source_image_path: str):
    """Process a single qrcode.json file and generate a dithered QR code."""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        url = data.get("url")
        if not url:
            print(f"⚠️ Warning: No 'url' key found in {json_file_path}. Skipping.")
            return

        output_dir = json_file_path.parent
        output_file = output_dir / "qrcode.png"

        image_to_use = source_image_path

        command = [
            DITHERED_QR_CMD,
            "-i", str(image_to_use),
            "-o", str(output_file),
            "--scale", "3",
            "--mirror",
            url
        ]

        print(f"🔄 Processing: {json_file_path}")
        print(f"   Command: {' '.join(command)}")

        # 4. Execute the command
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"✅ Successfully generated QR code at: {output_file}")
        else:
            print(f"❌ Error generating QR code for {json_file_path}:")
            print(result.stderr)

        # Clean up temporary mirrored image if you enabled the PIL block above
        # if os.path.exists(mirrored_img_path):
        #     os.remove(mirrored_img_path)

    except json.JSONDecodeError:
        print(f"❌ Error: {json_file_path} is not a valid JSON file.")
    except FileNotFoundError:
        print(f"❌ Error: The dithered-qr tool was not found. Ensure it is installed and in your PATH.")
    except Exception as e:
        print(f"❌ An unexpected error occurred with {json_file_path}: {e}")


def main():
    if not os.path.isdir(BASE_DIR):
        print(f"❌ Error: Base directory '{BASE_DIR}' does not exist.")
        return

    if not os.path.isfile(SOURCE_IMAGE_PATH):
        print(f"❌ Error: Source image '{SOURCE_IMAGE_PATH}' does not exist.")
        return

    json_files = find_qrcode_json_files(BASE_DIR)

    if not json_files:
        print(f"ℹ️ No 'qrcode.json' files found in '{BASE_DIR}'.")
        return

    print(f"🔍 Found {len(json_files)} 'qrcode.json' file(s). Starting processing...\n")

    for json_file in json_files:
        process_qrcode_json(json_file, SOURCE_IMAGE_PATH)

    print("\n🎉 Processing complete!")


if __name__ == "__main__":
    main()
