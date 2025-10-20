import {
  column,
  Schema,
  Table,
  AbstractPowerSyncDatabase,
  PowerSyncDatabase,
} from "@powersync/node";

const BACKEND_URL = "http://localhost:6060";
const POWERSYNC_URL = "http://localhost:8080";

const schema = new Schema({
  customers: new Table({
    name: column.text,
  }),
  orders: new Table({
    customer_id: column.text,
    reference: column.text,
  }),
  line_items: new Table({
    order_id: column.text,
    product_name: column.text,
  }),
  line_items_ivm: new Table({
    customer_id: column.text,
    customer_name: column.text,
    order_id: column.text,
    order_reference: column.text,
    product_name: column.text,
  }),
});

export const powerSyncDatabase = new PowerSyncDatabase({
  schema,
  database: { dbFilename: "test.sqlite" },
});

export const connector = {
  async fetchCredentials() {
    const token = await fetch(`${BACKEND_URL}/api/auth/token`)
      .then((response) => response.json())
      .then((data: any) => data.token);
    return {
      endpoint: POWERSYNC_URL,
      token,
    };
  },
  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    try {
      let batch = [];
      for (let operation of transaction.crud) {
        let payload = {
          op: operation.op,
          table: operation.table,
          id: operation.id,
          data: operation.opData,
        };
        batch.push(payload);
      }

      const response = await fetch(`${BACKEND_URL}/api/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batch }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Received ${response.status} from /api/data: ${text}`);
      }

      console.log("Uploaded batch of size ", batch.length);
      await transaction.complete();
    } catch (ex) {
      console.debug(ex);
      throw ex;
    }
  },
};

export async function initPowerSync(powerSyncDatabase: PowerSyncDatabase) {
  await powerSyncDatabase.connect(connector, {
    params: { customer_id: "75f89104-d95a-4f16-8309-5363f1bb377a" },
  });
  await powerSyncDatabase.init();
  await powerSyncDatabase.waitForFirstSync();
}

export async function waitForSync(powerSyncDatabase: PowerSyncDatabase) {
  await new Promise((resolve) => setTimeout(resolve, 1)); // wait a tick
  return new Promise<void>((resolve, reject) => {
    powerSyncDatabase.registerListener({
      statusChanged: async (status) => {
        if (status.dataFlowStatus.downloadError) {
          reject(
            new Error(
              `Download error: ${status.dataFlowStatus.downloadError.message}`
            )
          );
          return;
        }
        if (status.dataFlowStatus.uploadError) {
          reject(
            new Error(
              `Upload error: ${status.dataFlowStatus.uploadError.message}`
            )
          );
          return;
        }

        if (
          status.dataFlowStatus.downloading ||
          status.dataFlowStatus.uploading
        )
          return;

        if (!status.connected || !status.lastSyncedAt) return;

        resolve();
      },
    });
  });
}
