import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

describe("json syntax", () => {
  const root = process.cwd();
  const files = execFileSync("git", ["ls-files", "-z", "*.json"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);

  // Guards against the discovery itself silently breaking and the suite passing vacuously.
  it("should discover the json files in the repository", () => {
    expect(files).toContain("appsettings.json");
    expect(files).toContain("app_rules.json");
    expect(files).toContain("translation/en-US.json");
  });

  it.each(files)("%s should be parseable", (file) => {
    const raw = fs.readFileSync(path.join(root, file), "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
