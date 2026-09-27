import { resetAndSeedE2eDatabase } from "./support/test-database";

export default async function globalSetup() {
  await resetAndSeedE2eDatabase();
}
