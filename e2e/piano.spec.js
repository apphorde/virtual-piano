import { expect, test } from "@playwright/test";

test("starts and releases audio from a piano-key pointer press", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator("#audio-status-text")).toHaveText("pending...");

  const key = page.locator('[data-note="C3"]');
  const box = await key.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(key).toHaveClass(/active/);
  await page.mouse.up();
  await expect(page.locator("#audio-status-text")).toHaveText("running");
  await expect(key).not.toHaveClass(/active/);

  const audioState = await page.evaluate(() => window.__pianoAudioState);
  expect(audioState).toBe("running");
  expect(errors).toEqual([]);
});

test("plays and releases a note from the computer keyboard", async ({
  page,
}) => {
  await page.goto("/");

  // Initialize audio context if needed
  const audioStatus = await page.locator("#audio-status-text").textContent();
  if (audioStatus !== "running") {
    await page.click("body");
    await expect(page.locator("#audio-status-text")).toHaveText("running");
  }

  await page.keyboard.down("a");
  await expect(page.locator('[data-note="C3"]')).toHaveClass(/active/);
  await page.keyboard.up("a");
  await expect(page.locator('[data-note="C3"]')).not.toHaveClass(/active/);
});

test("keyboard auto-repeat is ignored", async ({ page }) => {
  await page.goto("/");

  // Initialize audio context if needed
  const audioStatus = await page.locator("#audio-status-text").textContent();
  if (audioStatus !== "running") {
    await page.click("body");
    await expect(page.locator("#audio-status-text")).toHaveText("running");
  }

  // Down-arrow then immediately down-arrow again should not stack notes
  await page.keyboard.down("a");
  await page.keyboard.down("a"); // auto-repeat
  await expect(page.locator('[data-note="C3"]')).toHaveClass(/active/);
  // Only one active class should be present
  const count = await page
    .locator('[data-note="C3"]')
    .evaluate(
      (el) =>
        el.classList.value.split(" ").filter((c) => c.includes("active"))
          .length,
    );
  expect(count).toBe(1);

  await page.keyboard.up("a");
  await expect(page.locator('[data-note="C3"]')).not.toHaveClass(/active/);
});

test("layout spans full viewport width", async ({ page }) => {
  await page.goto("/");

  // Body should have no max-width constraint on piano container
  const container = page.locator(".piano-container");
  const dimensions = await container.evaluate((el) => {
    return {
      width: el.getBoundingClientRect().width,
      viewport: window.innerWidth,
    };
  });
  expect(dimensions.width).toBe(dimensions.viewport);
});
