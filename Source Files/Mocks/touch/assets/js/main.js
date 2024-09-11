const image = document.querySelector("#touch-target");
const heightMapUrl = "/page031-1.json";

async function getHeights(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    //Sanity check
    if (json.height !== json.data.length || json.width !== json.data[0].length) {
      console.log("dimensions don't match!")
    }

    return json;
  } catch (error) {
    console.error(error.message);
  }
}

async function generateHandler(url) {
  const map = await getHeights(url);
  const initialScale = map.meta.scale;
  const clientScale = image.clientWidth / image.naturalWidth;
  const scale = initialScale * clientScale;
  return (e) => {
    const x = Math.floor(e.offsetX / scale);
    const y = Math.floor(e.offsetY / scale);

    if ("vibrate" in window.navigator) {
      if (map.data[y][x] > 0) {
        window.navigator.vibrate(200)
      }
    }
    //console.log(`Value at ${x} ${y}: ${map.data[y][x]}`);
  }

}



//console.log(`Loaded metadata for touch map width: ${map.width}, height: ${map.height}, scale: ${initialScale}`, map);
//console.log(`Calculated scales: ${clientScale} => ${scale}`);

image.addEventListener("mousemove", await generateHandler(heightMapUrl));
