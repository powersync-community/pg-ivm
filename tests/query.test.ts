import { afterAll, beforeAll, expect, test } from "vitest";
import {
  initPowerSync,
  powerSyncDatabase,
  waitForSync,
} from "../src/powersync.js";
import { ensureSourceDbSynced } from "./util.js";

// let customerId: string = "75f89104-d95a-4f16-8309-5363f1bb377a";
// let orderId: string = randomUUID();

beforeAll(async () => {
  await initPowerSync(powerSyncDatabase);
  // await waitForSync(powerSyncDatabase);
});
afterAll(async () => {
  await powerSyncDatabase.disconnectAndClear();
});

const orderId = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";

test("simple select from line_items", async () => {
  const result = await powerSyncDatabase.getAll(
    "SELECT id, reference FROM orders",
    []
  );

  expect(result).toEqual([
    {
      id: orderId,
      reference: "ORD-1001",
    },
  ]);
});

test("select from list_items_ivm", async () => {
  const result = await powerSyncDatabase.getAll(
    "SELECT customer_name, order_reference, product_name FROM line_items_ivm WHERE order_id = ? ORDER BY product_name",
    [orderId]
  );

  expect(result).toEqual([
    {
      customer_name: "John Doe",
      order_reference: "ORD-1001",
      product_name: "Product A",
    },
    {
      customer_name: "John Doe",
      order_reference: "ORD-1001",
      product_name: "Product B",
    },
  ]);
});
