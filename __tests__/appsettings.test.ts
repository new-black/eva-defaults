import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

interface AppSetting {
  Name: string;
  Description: string;
  DataType: string;
  Tickets: string[];
  Default: string;
  Options: any[];
}

describe("appsettings.json validation", () => {
  const appSettingsPath = path.join(process.cwd(), "appsettings.json");
  const appSettings = JSON.parse(
    fs.readFileSync(appSettingsPath, "utf8")
  ) as AppSetting[];

  it("should not have duplicate Name entries", () => {
    const nameSet = new Set<string>();
    const duplicates: string[] = [];

    appSettings.forEach((setting) => {
      if (nameSet.has(setting.Name)) {
        duplicates.push(setting.Name);
      } else {
        nameSet.add(setting.Name);
      }
    });

    if (duplicates.length > 0) {
      console.error("Found duplicate settings:", duplicates);
    }

    expect(duplicates).toEqual([]);
  });
});
