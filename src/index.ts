import { powerSyncDatabase, initPowerSync, connector } from "./powersync.ts";

await initPowerSync(powerSyncDatabase);

const ivmLists = await powerSyncDatabase.getAll(
  `SELECT * FROM lists_with_todos`
);
console.log("lists_with_todos: ", ivmLists.length);

console.log("Inserting new data and seeing it reflected in the IVM view...");
const newListId = crypto.randomUUID();

await powerSyncDatabase.writeTransaction(async (tx) => {
  await tx.execute(
    `INSERT INTO lists (id, name, created_at, owner_id) VALUES (?, ?, ?, ?)`,
    [newListId, "New List", new Date().toISOString(), crypto.randomUUID()]
  );
  await tx.execute(
    `INSERT INTO todos (id, description, list_id, completed) VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), "New Todo", newListId, 0]
  );
});

await connector.uploadData(powerSyncDatabase);

await powerSyncDatabase.disconnectAndClear();
await powerSyncDatabase.connect(connector);
await powerSyncDatabase.waitForFirstSync();


await powerSyncDatabase.readTransaction(async (tx) => {
  const updatedIvmLists = await tx.getAll(`SELECT * FROM lists_with_todos`);
  console.log("Updated lists_with_todos: ", updatedIvmLists.length);
});

process.exit(0);
