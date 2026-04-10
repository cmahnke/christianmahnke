import os
import json
import argparse
import logging
import math
from streetlevel import streetview
import yaml
import requests
from PIL import Image, ImageDraw
from io import BytesIO

# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def get_xyz_tiles(lat_min, lon_min, lat_max, lon_max, zoom=17):
    def deg2num(lat, lon, z):
        lat_rad = math.radians(lat)
        n = 2.0 ** z
        xtile = int((lon + 180.0) / 360.0 * n)
        ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
        return xtile, ytile

    x_min, y_max = deg2num(lat_min, lon_min, zoom)
    x_max, y_min = deg2num(lat_max, lon_max, zoom)

    tiles = []
    for x in range(x_min, x_max + 1):
        for y in range(y_min, y_max + 1):
            tiles.append([x, y])
    return tiles

def get_bbox_center_and_radius(lat_min, lon_min, lat_max, lon_max):
    center_lat = (lat_min + lat_max) / 2
    center_lon = (lon_min + lon_max) / 2

    # Haversine formula to find distance from center to corner (lat_max, lon_max)
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(center_lat), math.radians(lat_max)
    d_phi = math.radians(lat_max - center_lat)
    d_lambda = math.radians(lon_max - center_lon)

    a = math.sin(d_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    radius = R * c

    return center_lat, center_lon, radius

def get_panos_in_area(lat_min, lon_min, lat_max, lon_max, filter=True):
    tiles = get_xyz_tiles(lat_min, lon_min, lat_max, lon_max)
    panos = []
    for tile in tiles:
        logger.info(f"Searching tile {tile}...")
        tile_panos = streetview.get_coverage_tile(tile[0], tile[1])
        panos.extend(tile_panos)

    if filter:
      panos = [p for p in panos if (lat_min <= p.lat <= lat_max and lon_min <= p.lon <= lon_max)]
    return panos

def create_map_image(panos, lat_min, lon_min, lat_max, lon_max, output_path, zoom=17):
    # Calculate the total area covered by both the requested bounding box and all found panoramas
    all_lats = [p.lat for p in panos] + [lat_min, lat_max]
    all_lons = [p.lon for p in panos] + [lon_min, lon_max]
    
    # Add a small buffer (approx 10m) to ensure markers at the edges aren't clipped
    buffer = 0.0001
    m_lat_min, m_lat_max = min(all_lats) - buffer, max(all_lats) + buffer
    m_lon_min, m_lon_max = min(all_lons) - buffer, max(all_lons) + buffer

    def deg2num_float(lat, lon, z):
        lat_rad = math.radians(lat)
        n = 2.0 ** z
        x = (lon + 180.0) / 360.0 * n
        y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
        return x, y

    x_min_f, y_min_f = deg2num_float(m_lat_max, m_lon_min, zoom)
    x_max_f, y_max_f = deg2num_float(m_lat_min, m_lon_max, zoom)
    
    x_min, y_min = int(x_min_f), int(y_min_f)
    x_max, y_max = int(x_max_f), int(y_max_f)

    canvas_w = (x_max - x_min + 1) * 256
    canvas_h = (y_max - y_min + 1) * 256
    map_img = Image.new("RGB", (canvas_w, canvas_h))
    
    headers = {"User-Agent": "StreetViewDownloader/1.0"}
    
    logger.info("Downloading map tiles for overview image...")
    for x in range(x_min, x_max + 1):
        for y in range(y_min, y_max + 1):
            url = f"https://tile.openstreetmap.org/{zoom}/{x}/{y}.png"
            try:
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    tile = Image.open(BytesIO(response.content))
                    map_img.paste(tile, ((x - x_min) * 256, (y - y_min) * 256))
            except Exception as e:
                logger.warning(f"Could not download tile {x}/{y}: {e}")

    crop_left = int((x_min_f - x_min) * 256)
    crop_top = int((y_min_f - y_min) * 256)
    crop_right = int((x_max_f - x_min) * 256)
    crop_bottom = int((y_max_f - y_min) * 256)
    
    map_img = map_img.crop((crop_left, crop_top, crop_right, crop_bottom))
    draw = ImageDraw.Draw(map_img)
    for p in panos:
        p_x, p_y = deg2num_float(p.lat, p.lon, zoom)
        ix = int((p_x - x_min_f) * 256)
        iy = int((p_y - y_min_f) * 256)
        r = 4
        draw.ellipse((ix - r, iy - r, ix + r, iy + r), fill=(255, 0, 0), outline=(255, 255, 255))

    map_img.save(output_path)
    logger.info(f"Map image saved to {output_path}")

def download_area(lat_min, lon_min, lat_max, lon_max, output_dir, create_map):
    logger.info(f"Searching for panoramas in area: ({lat_min}, {lon_min}) to ({lat_max}, {lon_max})")
    os.makedirs(output_dir, exist_ok=True)
    panos = get_panos_in_area(lat_min, lon_min, lat_max, lon_max)
    #(center_lat, center_lon, radius) = get_bbox_center_and_radius(lat_min, lon_min, lat_max, lon_max)
    #panos = streetview.find_panorama(center_lat, center_lon, radius=radius, search_third_party=True)
    logger.info(f"{len(panos)} panoramas found.")

    if panos and create_map:
        create_map_image(panos, lat_min, lon_min, lat_max, lon_max, os.path.join(output_dir, "map.png"))

    for p in panos:
        # if not (lat_min <= p.lat <= lat_max and lon_min <= p.lon <= lon_max):
        #     logger.warning(f"Skipping panorama {p.id} at ({p.lat}, {p.lon}) as it is outside the specified bounding box.")
        #     continue

        folder = os.path.join(output_dir, p.id)
        os.makedirs(folder, exist_ok=True)

        # Download and assemble the 360° image (Equirectangular)
        img_path = os.path.join(folder, f"{p.id}.jpg")
        metadata_path = os.path.join(folder, f"{p.id}.yaml")
            
        # Save navigation metadata (links)
        meta = {
            "id": p.id,
            "lat": p.lat,
            "lon": p.lon,
            "date": str(p.date),
            #"links": [{"id": link.id, "heading": link.angle} for link in p.links]
        }

        with open(metadata_path, "w") as f:
            yaml.dump(p, f, sort_keys=False)
        if not os.path.exists(img_path):
            logger.info(f"Downloading image: {p.id}...")
            #image = streetview.get_panorama(p)
            image = None
            if image is not None:
                image.save(img_path)
            else:
                logger.warning(f"Failed to download image for panorama {p.id}")
            #streetview.download_panorama(p, img_path)


def parse_bbox(value):
    try:
        coords = [float(x) for x in value.split(',')]
        if len(coords) != 4:
            raise argparse.ArgumentTypeError("BBox must have 4 comma-separated values: min_lat,min_lon,max_lat,max_lon")
        return coords
    except ValueError:
        raise argparse.ArgumentTypeError("BBox coordinates must be numbers")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download Google Street View panoramas in a specific area.")
    parser.add_argument("--bbox", type=parse_bbox, default=[51.536091,9.933577,51.536876,9.934626], help="Bounding box: min_lat,min_lon,max_lat,max_lon")
    parser.add_argument("--output", "-o", default="photospheres", help="Output directory")
    parser.add_argument("--map", "-m", action="store_true", help="Create an overview map image showing panorama positions.")

    args = parser.parse_args()
    download_area(*args.bbox, args.output, args.map)
