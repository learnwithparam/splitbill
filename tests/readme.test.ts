import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { initSchema } from "../src/db.ts";
import { seedDemoData } from "../src/seed.ts";
import { run } from "../src/cli.ts";

const root = new URL("..", import.meta.url);

async function readText(path: string): Promise<string> {
  return Bun.file(new URL(path, root)).text();
}

async function runItSection(): Promise<string> {
  const readme = await readText("README.md");
  const start = readme.indexOf("\n## Run it\n");
  if (start === -1) return "";
  const next = readme.indexOf("\n## ", start + 1);
  return next === -1 ? readme.slice(start) : readme.slice(start, next);
}

describe("README Run it section", () => {
  test("README has a Run it section with bun install", async () => {
    const section = await runItSection();
    expect(section).not.toBe("");
    expect(section).toContain("bun install");
  });

  test("README dev command and URL match package.json and server default port", async () => {
    const section = await runItSection();
    expect(section).toContain("bun run dev");
    expect(section).toContain("http://localhost:3200");

    const pkg = JSON.parse(await readText("package.json"));
    expect(pkg.scripts.dev).toBeDefined();

    const server = await readText("src/server.ts");
    expect(server).toContain("process.env.PORT ?? 3200");
  });

  test("README CLI example points at a real CLI command", async () => {
    const section = await runItSection();
    expect(section).toContain("bun run src/cli.ts groups");
    expect(section).toContain("balances <group-id>");
    expect(section).toContain("export <group-id>");

    const db = new Database(":memory:");
    initSchema(db);
    seedDemoData(db);
    expect(run(["groups"], db)).toContain("goa-trip");
  });
});
