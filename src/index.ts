import {
  powerSyncDatabase,
  initPowerSync,
  connector,
  waitForSync,
} from "./powersync.ts";

await initPowerSync(powerSyncDatabase);

const initialIvmItems = await powerSyncDatabase.getAll(
  `SELECT * FROM line_items_ivm`
);
console.log("Initial line_items_ivm: ", initialIvmItems.length);

console.log("Inserting new data and seeing it reflected in the IVM view...");

const newOrderId = crypto.randomUUID();
await powerSyncDatabase.execute(
  `INSERT INTO orders (id, reference, customer_id) VALUES (?, ?, ?)`,
  [newOrderId, "ORD-1001", "75f89104-d95a-4f16-8309-5363f1bb377a"]
);
await powerSyncDatabase.execute(
  `INSERT INTO line_items (id, order_id, product_name) VALUES (?, ?, ?)`,
  [crypto.randomUUID(), newOrderId, "Product Z"]
);

await waitForSync(powerSyncDatabase);

const updatedItemsIvm = await powerSyncDatabase.getAll(
  `SELECT * FROM line_items_ivm`
);
console.log("Line_items_ivm after insert: ", updatedItemsIvm.length);

await powerSyncDatabase.writeTransaction(async (tx) => {
  await tx.execute("DELETE FROM line_items WHERE order_id = ?", [newOrderId]);
  await tx.execute("DELETE FROM orders WHERE id = ?", [newOrderId]);
});

await waitForSync(powerSyncDatabase);

await powerSyncDatabase.disconnectAndClear();

process.exit(0);
