async function getHeights(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    //Sanity check
    if (json.height !== json.data.length || json.width !== json.data[0].length) {
      console.log("dimensions don't match!");
    }

    return json;
  } catch (error) {
    console.error(error.message);
  }
}

async function generateHandler(url, image) {
  const map = await getHeights(url);
  const initialScale = map.meta.scale;
  const clientScale = image.clientWidth / image.naturalWidth;
  const scale = initialScale * clientScale;
  //console.log(`Calculated scales: ${clientScale} => ${scale}`);

  return (e) => {
    let x, y;
    if (e instanceof TouchEvent) {
      const bb = e.target.getBoundingClientRect();
      x = Math.floor((e.targetTouches[0].clientX - bb.x) / scale);
      y = Math.floor((e.targetTouches[0].clientY - bb.y) / scale);
    } else {
      x = Math.floor(e.offsetX / scale);
      y = Math.floor(e.offsetY / scale);
    }

    if ("vibrate" in window.navigator) {
      if (map.data[y][x] > 0) {
        window.navigator.vibrate(200);
      }
    } else {
      console.warn("Vibrate not supported!");
    }
    //console.log(`Value at ${x} ${y}: ${map.data[y][x]}`);
  };
}

export async function initTouch(element, heightMapUrl) {
  const startTouch = (e) => {
    e.preventDefault();
    const current = e.changedTouches[0];
  };

  const endTouch = (e) => {
    e.preventDefault();
    //startTouch = [];
  };

  element.addEventListener("touchstart", startTouch);
  element.addEventListener("touchend", endTouch);
  element.addEventListener("touchcancel", endTouch);
  element.addEventListener("touchmove", await generateHandler(heightMapUrl, element));
}
