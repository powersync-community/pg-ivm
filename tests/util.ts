import { connector, powerSyncDatabase } from "../src/powersync";

export async function ensureSourceDbSynced() {
  await connector.uploadData(powerSyncDatabase);
  await powerSyncDatabase.disconnectAndClear();
  await powerSyncDatabase.connect(connector);
  await powerSyncDatabase.waitForFirstSync();
}
