import { test, expect } from "@playwright/test";

const recordings = 3;
const canvasID = "game";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// See https://stackoverflow.com/a/58296791
const waitFor = async (f) => {
  while (!f()) await delay(1000);
  return f();
};

test("test startup", async ({ page }) => {
  await page.goto(".");
  test
    .info()
    .annotations.push({ type: "url", description: `URL '${page.url()}'` });
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Pong/);
});

test("start recording", async ({ page }) => {
  const timeout = 2 * 60 * 1000 * recordings;
  const iterationTimeout = 3 * 60 * 1000;
  test.setTimeout(timeout);
  test.slow();
  console.log(
    `Set timeout to ${timeout}, ${iterationTimeout} for a single game`,
  );
  const canvasHandle = await page.locator(`#${canvasID}`);
  expect(canvasHandle).toBeTruthy();
  let counter = 0;

  const start = async () => {
    await page.click("#game-start");
    await page.click("#record");
    console.log(`1.) Started game and recording {counter}`);
  };

  const stopAndDownload = async () => {
    await page.click("#game-stop");
    await page.click("#record");
    await page.locator("#download").isEnabled().then(page.click("#download"));
    await page.click("#game-start");
    await page.click("#record");
    console.log(`Downloaded and restarted`);
  };

  page.on("download", (download) => {
    var fileName = download.suggestedFilename();
    fileName = fileName.replace(/(.*)(\..*)/g, `$1-${counter}$2`);
    download.saveAs(fileName);
    console.log(`3a)Download triggered, saving as '${fileName}'`);
    test.info().annotations.push({
      type: "download",
      description: `Downloaded to '${fileName}'`,
    });
  });

  page.on("console", (msg) => {
    if (msg.type() === "log") {
      if (msg.text() == "(Re-)starting demo.") {
        console.log(`Restarted ${counter}`);
        counter++;
      } else if (msg.text().match(/Player . won!/)) {
        console.log("Finished round");
        stopAndDownload();
      } else {
        //console.log(`Got ${msg.text()}`);
      }
    }
  });

  await page.goto(".");
  await page.click("#game-stop");
  start();
  counter = 1;
  console.log("Started first round");

  await waitFor(() => {
    //console.log(`${counter} > ${recordings}`);
    return counter > recordings;
  });
});
