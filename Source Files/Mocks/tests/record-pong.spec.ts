import { test, expect } from "@playwright/test";

test("test startup", async ({ page }) => {
  await page.goto(".");
  test
    .info()
    .annotations.push({ type: "url", description: `URL '${page.url()}'` });
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Pong/);
});

test("start recording", async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

  async function download() {
    //await page.click("#play");

    // See https://github.com/microsoft/playwright/issues/15408
    const [download] = await Promise.all([
      page.click("#play"),
      // It is important to call waitForEvent before click to set up waiting.
      page.waitForEvent("download"),
      // Triggers the download.
      page.click("#download", { timeout: 10000 }),
    ]);
    download
      .then((download) => {
        var fileName = download.suggestedFilename();
        fileName = fileName.replace(/(.*)(\..*)/g, `$1-${counter}$2`);
        download.saveAs(fileName);
        return download;
      })
      .then((download) => {
        var downloadPath = download.path();
        test
          .info()
          .annotations.push({
            type: "download",
            description: `Downlaoded to '${downloadPath}'`,
          });
      });
  }

  let counter = 0;

  page.on("console", (msg) => {
    if (msg.type() === "log" && msg.text() == "(Re-)starting demo.") {
      console.log(`Restarted ${counter}`);
      /*
      if (counter > 1) {

      }
      */
      counter++;
    }
  });

  await page.goto(".");
  await page.click("#game-stop");
  await page.click("#game-start");
  await page.click("#record");

  const stoppedCanvas = page.locator("canvas.stopped");
  stoppedCanvas.waitFor({ timeout: 2 * 60 * 1000 }).then(() => {
    console.log("Game stopped");
    download();
  });

  //const download = await page.waitForEvent("download");
  //console.log(`File downloaded to ${downloadPath}`);
});
