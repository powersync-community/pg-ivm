# Postgres IVM Extension Playground
This repository is a playground for experimenting with the [pg_ivm](https://github.com/sraoss/pg_ivm) extension for PostgreSQL. The pg_ivm extension provides Incremental View Maintenance (IVM) capabilities, allowing materialized views to be updated incrementally as the underlying data changes.

We are using [PowerSync](https://www.powersync.dev/) to connect to the PostgreSQL database and demonstrate the implementation of `JOIN` queries without [denormalization](https://docs.powersync.com/usage/sync-rules/guide-many-to-many-and-join-tables).

## Usage
1. Copy the example environment file:

   ```shell
   cp .env.template .env
   ```
2. Run `pnpm backend:up` to start the Postgres database with the `pg_ivm` extension and the Node.js application.
3. Run `pnpm dev` to execute some simple mutations and queries against the database.

## Notes
**Updates need to be uploaded to the source database and synced down before they are reflected in the local IVM table**

You must set `REPLICA IDENTITY FULL` on the IVM table to ensure that updates and deletes are properly tracked by Postgres logical replication.

If it is not set, you may encounter errors like:
```
cannot delete from table \"table\" because it does not have a replica identity and publishes deletes
HINT: Set REPLICA IDENTITY to FULL to enable deleting rows from the table.
```
