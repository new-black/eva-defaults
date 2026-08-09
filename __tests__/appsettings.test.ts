import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

interface AppSetting {
  Name: string;
  Description: string;
  DataType: string;
  Tickets: string[];
  Default: string | null;
  Options: any[];
  Converted?: boolean;
}

describe("appsettings.json validation", () => {
  const appSettingsPath = path.join(process.cwd(), "appsettings.json");
  const appSettings = JSON.parse(
    fs.readFileSync(appSettingsPath, "utf8")
  ) as AppSetting[];

  const INTEGER_PATTERN = /^-?\d+$/;
  const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;
  const GUID_PATTERN =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  // These rules are deliberately stricter than EVA's runtime, which is lenient
  // (bool accepts "True" and "1", int.TryParse tolerates surrounding spaces) and
  // only converts at all when an entry is not marked Converted. Most entries here
  // are Converted and reach clients as raw strings, so one canonical spelling per
  // type is the only form every consumer can be relied on to read.

  // Where conversion does run, int and int[] go through int.TryParse: a value
  // outside this range becomes null and the setting silently never reaches the client.
  function isWithinInt32Range(value: string): boolean {
    const parsed = Number(value);
    return parsed >= -2147483648 && parsed <= 2147483647;
  }

  // Returns a reason when the default cannot be read as its declared type, or null when it can.
  // null and "" both mean "no default" and are valid for every type.
  function describeInvalidDefault(
    dataType: string,
    value: string | null
  ): string | null {
    if (value === null || value === "") return null;

    switch (dataType) {
      case "bool":
        return value === "true" || value === "false"
          ? null
          : "expected true or false";
      case "int":
        if (!INTEGER_PATTERN.test(value)) return "expected an integer";
        return isWithinInt32Range(value) ? null : "expected a 32-bit integer";
      case "decimal":
        return DECIMAL_PATTERN.test(value) ? null : "expected a decimal";
      case "guid":
        return GUID_PATTERN.test(value) ? null : "expected a guid";
      case "int[]": {
        const invalidPart = value
          .split(",")
          .find((part) => !INTEGER_PATTERN.test(part) || !isWithinInt32Range(part));

        return invalidPart === undefined
          ? null
          : `expected comma-separated integers, got ${JSON.stringify(invalidPart)}`;
      }
      case "object":
        try {
          const parsed = JSON.parse(value);
          return parsed !== null &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
            ? null
            : "expected a json object";
        } catch {
          return "expected a json object";
        }
      default:
        // string, string[] and "" carry free-form defaults
        return null;
    }
  }

  it("should have a Default that can be read as its DataType", () => {
    expect(appSettings.length).toBeGreaterThan(200);

    const invalid = appSettings
      .map((setting) => ({
        setting,
        reason: describeInvalidDefault(setting.DataType, setting.Default),
      }))
      .filter(({ reason }) => reason !== null)
      .map(
        ({ setting, reason }) =>
          `${setting.Name} (DataType=${setting.DataType}, Default=${JSON.stringify(setting.Default)}): ${reason}`
      );

    expect(invalid).toEqual([]);
  });

  const TICKET_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;

  it("should reference tickets by key rather than by url", () => {
    const invalid = appSettings.flatMap((setting) =>
      setting.Tickets.filter((ticket) => !TICKET_PATTERN.test(ticket)).map(
        (ticket) => `${setting.Name}: ${JSON.stringify(ticket)}`
      )
    );

    expect(invalid).toEqual([]);
  });

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
