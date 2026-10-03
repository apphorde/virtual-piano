import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 15_000,
  use: {
    baseURL: process.env.PIANO_URL || "https://piano.lab.apphor.de",
    ...devices["Desktop Chrome"],
  },
});
