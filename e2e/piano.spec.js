import { expect, test } from "@playwright/test";

test("starts audio from a piano-key click", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator("#audio-status-text")).toHaveText("pending...");

  await page.locator('[data-note="C3"]').click();
  await expect(page.locator("#audio-status-text")).toHaveText("running");
  await expect(page.locator('[data-note="C3"]')).toHaveClass(/active/);

  const audioState = await page.evaluate(() => window.__pianoAudioState);
  expect(audioState).toBe("running");
  expect(errors).toEqual([]);
});

test("plays and releases a note from the computer keyboard", async ({
  page,
}) => {
  await page.goto("/");

  await page.keyboard.down("a");
  await expect(page.locator('[data-note="C3"]')).toHaveClass(/active/);
  await page.keyboard.up("a");
  await expect(page.locator('[data-note="C3"]')).not.toHaveClass(/active/);
});
