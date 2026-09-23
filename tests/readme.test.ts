import { describe, expect, test } from "bun:test";

const root = new URL("..", import.meta.url).pathname;

async function readme(): Promise<string> {
  return Bun.file(new URL("../README.md", import.meta.url)).text();
}

function runItSection(text: string): string {
  const start = text.indexOf("## Run it");
  expect(start).toBeGreaterThanOrEqual(0);
  const next = text.indexOf("\n## ", start + 1);
  return next === -1 ? text.slice(start) : text.slice(start, next);
}

describe("README Run it section", () => {
  test("README has a Run it section with install, dev and CLI commands", async () => {
    const section = runItSection(await readme());
    expect(section).toContain("bun install");
    expect(section).toContain("bun run dev");
    expect(section).toContain("http://localhost:3200");
    expect(section).toContain("bun run src/cli.ts groups");
  });

  test("README dev URL port matches the server default", async () => {
    const section = runItSection(await readme());
    const port = section.match(/http:\/\/localhost:(\d+)/)?.[1];
    expect(port).toBeDefined();
    const server = await Bun.file(new URL("../src/server.ts", import.meta.url)).text();
    expect(server).toMatch(new RegExp(`process\\.env\\.PORT\\s*\\?\\?\\s*${port}\\b`));
  });

  test("documented CLI example lists the demo groups", async () => {
    const proc = Bun.spawn([process.execPath, "run", "src/cli.ts", "groups"], {
      cwd: root,
      env: { ...process.env, SPLITBILL_DB: ":memory:" },
      stdout: "pipe",
      stderr: "pipe",
      timeout: 10_000,
    });
    const [output, errors, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect({ code, errors }).toEqual({ code: 0, errors: "" });
    expect(output).toContain("goa-trip");
    expect(output).toContain("flat-4b");
  });
});
