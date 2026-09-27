import { spawn } from "node:child_process";

import { testDatabaseUrl } from "../tests/e2e/support/test-database";

function run(command: string, args: string[], environment: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { env: environment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${command} ${args.join(" ")} exited with status ${code ?? "unknown"}.`));
    });
  });
}

async function main() {
  const databaseUrl = testDatabaseUrl();
  const environment = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    APPLICANT_ID_HASH_SECRET: "e2e-test-only",
  };

  await run("pnpm", ["exec", "prisma", "migrate", "deploy"], environment);
  await run("pnpm", ["exec", "playwright", "test"], environment);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
