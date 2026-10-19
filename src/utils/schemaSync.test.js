import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// schema.sql is the fresh-install script; section 16 carries every migration
// verbatim. This fails when a migration is added or edited without copying
// it there, so a new project can't end up behind the live one.
const root = fileURLToPath(new URL("../../", import.meta.url));
// Git on Windows may check files out with CRLF line endings; compare as LF.
const readText = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const schema = readText(`${root}schema.sql`);
const migrations = readdirSync(`${root}migrations`).filter((f) => f.endsWith(".sql")).sort();

describe("schema.sql", () => {
  it("has at least one migration to check", () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  for (const file of migrations) {
    it(`contains migrations/${file} unchanged`, () => {
      const start = `-- >>> migrations/${file}\n`;
      const end = `\n-- <<< migrations/${file}`;
      const from = schema.indexOf(start);
      const to = schema.indexOf(end, from);
      expect(from, `migrations/${file} is missing from schema.sql section 16`).toBeGreaterThan(-1);
      const copied = schema.slice(from + start.length, to);
      const original = readText(`${root}migrations/${file}`).replace(/\n+$/, "");
      expect(copied, `schema.sql's copy of migrations/${file} is out of date`).toBe(original);
    });
  }
});
