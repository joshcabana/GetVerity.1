import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Bundle Optimization", () => {
  const viteConfig = readFileSync(
    join(__dirname, "../../vite.config.ts"),
    "utf-8"
  );

  it("has manual chunks for large vendor libraries", () => {
    const expectedChunks = [
      "vendor-agora",
      "vendor-motion",
      "vendor-charts",
      "vendor-router",
      "vendor-query",
      "vendor-radix",
      "vendor-supabase",
    ];

    for (const chunk of expectedChunks) {
      expect(viteConfig, `Missing chunk: ${chunk}`).toContain(chunk);
    }
  });

  it("does not use static manualChunks object (uses function for flexibility)", () => {
    expect(viteConfig).toContain("manualChunks(id)");
  });
});

describe("Capacitor Removal", () => {
  it("no Capacitor dependencies in package.json", () => {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "../../package.json"), "utf-8")
    );
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const capacitorDeps = Object.keys(allDeps).filter((dep) =>
      dep.includes("capacitor")
    );
    expect(capacitorDeps, "Capacitor dependencies should be removed").toEqual(
      []
    );
  });
});
