-- Create tables
CREATE TABLE public.customers(
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

CREATE TABLE public.orders(
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reference text NOT NULL,
  customer_id uuid NOT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE public.line_items(
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  order_id uuid NOT NULL,
  product_name text NOT NULL,
  CONSTRAINT line_items_pkey PRIMARY KEY (id),
  CONSTRAINT line_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Creates some initial data to be synced
INSERT INTO customers(
  id,
  name)
VALUES (
  '75f89104-d95a-4f16-8309-5363f1bb377a',
  'John Doe');

INSERT INTO orders(
  id,
  reference,
  customer_id)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'ORD-1001',
  '75f89104-d95a-4f16-8309-5363f1bb377a');

INSERT INTO line_items(
  order_id,
  product_name)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Product A');

INSERT INTO line_items(
  order_id,
  product_name)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Product B');

------- IVM ----------
CREATE EXTENSION pg_ivm;

SELECT
  pgivm.create_immv('line_items_ivm', 'SELECT li.id, 
            c.id AS customer_id, 
            c.name AS customer_name, 
            o.id AS order_id, 
            o.reference AS order_reference, 
            li.product_name
     FROM customers AS c 
     JOIN orders AS o ON c.id = o.customer_id 
     JOIN line_items AS li ON o.id = li.order_id');

ALTER TABLE line_items_ivm REPLICA IDENTITY
  FULL;

--------------------
CREATE PUBLICATION powersync FOR ALL TABLES;
