import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

interface Tip {
  id: string;
  title: string;
  message: string;
}

interface TipKitDefinition {
  id: string;
  category: string;
  title: string;
  description: string;
  tips: Tip[];
}

describe("tipkit.json validation", () => {
  const tipkitPath = path.join(process.cwd(), "tipkit", "tipkit.json");
  const definitions = JSON.parse(
    fs.readFileSync(tipkitPath, "utf8")
  ) as TipKitDefinition[];

  it("should not have duplicate definition ids", () => {
    const idSet = new Set<string>();
    const duplicates: string[] = [];

    definitions.forEach((def) => {
      if (idSet.has(def.id)) {
        duplicates.push(def.id);
      } else {
        idSet.add(def.id);
      }
    });

    if (duplicates.length > 0) {
      console.error("Found duplicate definition ids:", duplicates);
    }

    expect(duplicates).toEqual([]);
  });

  it("should not have duplicate tip ids within a definition", () => {
    definitions.forEach((def) => {
      const idSet = new Set<string>();
      const duplicates: string[] = [];

      def.tips.forEach((tip) => {
        if (idSet.has(tip.id)) {
          duplicates.push(tip.id);
        } else {
          idSet.add(tip.id);
        }
      });

      if (duplicates.length > 0) {
        console.error(
          `Found duplicate tip ids in "${def.id}":`,
          duplicates
        );
      }

      expect(duplicates).toEqual([]);
    });
  });
});
