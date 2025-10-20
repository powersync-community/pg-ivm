import { expect, test, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";
import {
  connector,
  initPowerSync,
  powerSyncDatabase,
  waitForSync,
} from "../src/powersync";
import { ensureSourceDbSynced as ensureSourceDbSynced } from "./util";

let customerId: string = "75f89104-d95a-4f16-8309-5363f1bb377a";
let orderId: string = randomUUID();

// beforeAll(async () => {
//   await initPowerSync(powerSyncDatabase);

//   await powerSyncDatabase.writeTransaction(async (tx) => {
//     await tx.execute("DELETE FROM line_items");
//     await tx.execute("DELETE FROM orders");
//     await tx.execute("DELETE FROM customers");
//   });

//   await powerSyncDatabase.writeTransaction(async (tx) => {
//     await tx.execute("INSERT INTO customers (id, name) VALUES (?, ?)", [
//       customerId,
//       "John",
//     ]);

//     await tx.execute(
//       "INSERT INTO orders (id, reference, customer_id) VALUES (?, ?, ?)",
//       [orderId, "ORD-1001", customerId]
//     );

//     await tx.execute(
//       "INSERT INTO line_items (id, order_id, product_name) VALUES (?, ?, ?)",
//       [randomUUID(), orderId, "Product A"]
//     );

//     await tx.execute(
//       "INSERT INTO line_items (id, order_id, product_name) VALUES (?, ?, ?)",
//       [randomUUID(), orderId, "Product B"]
//     );
//   });

//   await waitForSync(powerSyncDatabase);
// });

// afterAll(async () => {
//   await connector.uploadData(powerSyncDatabase);
// });

test("simple insert into line_items check ivm", async () => {
  const lineItemId = randomUUID();
  await powerSyncDatabase.execute(
    "INSERT INTO line_items (id, order_id, product_name) VALUES (?, ?, ?)",
    [lineItemId, orderId, "Product B"]
  );

  await ensureSourceDbSynced(); // required to ensure the upload happens and the IVM is updated

  const selectResult = await powerSyncDatabase.getAll(
    `SELECT customer_id, customer_name, order_reference, product_name
     FROM line_items_ivm 
     WHERE order_id = ? AND product_name = ?`,
    [orderId, "Product B"]
  );

  expect(selectResult).toEqual([
    {
      customer_id: customerId,
      customer_name: "John Doe",
      order_reference: "ORD-1001",
      product_name: "Product B",
    },
  ]);
});

test("simple insert into orders check ivm", async () => {
  const newOrderId = randomUUID();
  await powerSyncDatabase.execute(
    "INSERT INTO orders (id, reference, customer_id) VALUES (?, ?, ?)",
    [newOrderId, "ORD-1002", customerId]
  );

  await waitForSync(powerSyncDatabase); // required to ensure the upload happens and the IVM is updated

  const ivmItems = await powerSyncDatabase.getAll(
    `SELECT customer_id, customer_name, order_reference, product_name 
     FROM line_items_ivm 
     WHERE order_id = ?`,
    [newOrderId]
  );

  expect(ivmItems).toEqual([]);
});
