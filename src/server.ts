import { Hono } from "hono";
import { openDb } from "./db.ts";
import { seedDemoData } from "./seed.ts";
import { groupsRoutes } from "./routes/groups.ts";
import { expensesRoutes } from "./routes/expenses.ts";
import { balancesRoutes } from "./routes/balances.ts";
import { exportRoutes } from "./routes/export.ts";

export function createApp(db: ReturnType<typeof openDb>) {
  const app = new Hono();

  app.route("/api", groupsRoutes(db));
  app.route("/api", expensesRoutes(db));
  app.route("/api", balancesRoutes(db));
  app.route("/api", exportRoutes(db));

  app.get("/", async (c) => {
    const file = Bun.file(new URL("../public/index.html", import.meta.url));
    return c.html(await file.text());
  });

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: { code: "internal_error", message: "something went wrong" } }, 500);
  });

  return app;
}

if (import.meta.main) {
  const db = openDb(process.env.SPLITBILL_DB ?? "splitbill.sqlite");
  seedDemoData(db);
  const app = createApp(db);
  const port = Number(process.env.PORT ?? 3200);
  console.log(`splitbill listening on http://localhost:${port}`);
  Bun.serve({ port, fetch: app.fetch });
}
