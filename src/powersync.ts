import { column, Schema, Table, PowerSyncDatabase, AbstractPowerSyncDatabase } from "@powersync/node";

const schema = new Schema({
  lists_with_todos: new Table({
    list_name: column.text,
    todo_description: column.text,
    list_id: column.text,
  }),
  lists: new Table({
    name: column.text,
    created_at: column.text,
    owner_id: column.text,
  }),
  todos: new Table({
    description: column.text,
    list_id: column.text,
    completed: column.integer,
  }),
});

const BACKEND_URL = "http://localhost:6060";
const POWERSYNC_URL = "http://localhost:8080";

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
        throw new Error(
          `Received ${response.status} from /api/data: ${text}`
        );
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
  await powerSyncDatabase.connect(connector);
  await powerSyncDatabase.init();
  await powerSyncDatabase.waitForFirstSync();
}
