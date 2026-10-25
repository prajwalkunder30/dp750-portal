// Domain 3: Prepare and process data
addQ(3, 'Ingestion', 'JSON files land continuously in ADLS Gen2 (millions of files per day). You need to ingest only new files incrementally with schema inference and evolution. What should you use?',
  ['Auto Loader (cloudFiles)', 'spark.read.json on the whole folder each run', 'COPY INTO on a single file', 'Lakehouse Federation'],
  0, 'Auto Loader incrementally detects new files, scales to millions of files, and supports schema inference and evolution.', 'autoloader');

addQ(3, 'Ingestion', 'Auto Loader must infer schema and keep it stable across restarts. Which option is required?',
  ['cloudFiles.schemaLocation', 'cloudFiles.useNotifications', 'mergeSchema', 'maxFilesPerTrigger'],
  0, 'cloudFiles.schemaLocation stores the inferred schema and its evolution history.', 'autoloader');

addQ(3, 'Ingestion', 'Some records do not match the expected schema (wrong type). You must not lose them. Where does Auto Loader put such values by default when inferring the schema?',
  ['In the _rescued_data column', 'In a dead-letter queue', 'They are dropped silently', 'In the checkpoint folder'],
  0, 'The rescued data column captures data that does not match the schema so it is not lost.', 'autoloader');

addQ(3, 'Ingestion', 'A SQL analyst must load a few thousand CSV files idempotently into a Delta table; rerunning must not duplicate data. What should be used?',
  ['COPY INTO', 'INSERT INTO ... SELECT * FROM csv.`path`', 'CREATE OR REPLACE TABLE every time', 'CONVERT TO DELTA'],
  0, 'COPY INTO is idempotent and skips files that were already loaded.', 'copyinto');

addQ(3, 'Ingestion', 'You need a managed, low-code way to ingest data from Salesforce and SQL Server into Unity Catalog. What should you use?',
  ['Lakeflow Connect managed connectors', 'Auto Loader', 'Delta Sharing', 'COPY INTO'],
  0, 'Lakeflow Connect provides managed connectors for SaaS applications and databases.', 'connect');

addQ(3, 'Streaming', 'A streaming job should run once per hour, process all data available, and then stop to save cost. Which trigger should you use?',
  ['trigger(availableNow=True)', 'trigger(processingTime="1 hour") on an always-on cluster', 'trigger(continuous="1 second")', 'No trigger'],
  0, 'availableNow processes all available data (possibly in multiple batches) then stops; schedule it hourly with a job.', 'streaming');

addQ(3, 'Streaming', 'After a cluster restart a Structured Streaming query must resume where it stopped without reprocessing data. What must be configured?',
  ['A checkpointLocation', 'A watermark', 'outputMode("complete")', 'spark.sql.shuffle.partitions'],
  0, 'The checkpoint stores offsets and state that let a query resume exactly where it stopped.', 'streaming');

addQ(3, 'Streaming', 'A streaming aggregation on event time keeps growing state. Late data older than 10 minutes can be ignored. What should you add?',
  ['withWatermark("eventTime", "10 minutes")', 'trigger(availableNow=True)', 'dropDuplicates()', 'repartition(10)'],
  0, 'A watermark bounds how late data can be and allows old state to be dropped.', 'streaming');

addQ(3, 'Streaming', 'You must upsert each micro-batch of a stream into a Delta table using MERGE. What should you use?',
  ['foreachBatch with a MERGE inside the function', 'outputMode("update") directly to the table', 'COPY INTO', 'trigger(once=True) with append mode'],
  0, 'foreachBatch gives access to each micro-batch as a DataFrame so you can run MERGE.', 'merge');

addQ(3, 'Streaming', 'Applications send telemetry to Azure Event Hubs. Which approach lets Structured Streaming read the events using the built-in Kafka source?',
  ['Use the Event Hubs Kafka-compatible endpoint with the kafka format', 'Use COPY INTO on the event hub', 'Use Lakehouse Federation', 'Use Auto Loader with format eventhubs'],
  0, 'Event Hubs exposes a Kafka endpoint; Spark can read it with format("kafka").', 'eventhubs');

addQ(3, 'Transform', 'You need to upsert customer changes: update existing customers, insert new ones, and delete customers that no longer exist in the source. Which statement supports all three?',
  ['MERGE INTO with WHEN MATCHED, WHEN NOT MATCHED, and WHEN NOT MATCHED BY SOURCE clauses', 'INSERT OVERWRITE', 'UPDATE ... FROM', 'COPY INTO with mergeSchema'],
  0, 'MERGE supports update/insert and, with WHEN NOT MATCHED BY SOURCE, delete of target rows missing from the source.', 'merge');

addQ(3, 'Transform', 'You must keep full history of customer address changes with start and end dates. Which slowly changing dimension type should you implement?',
  ['Type 1', 'Type 2', 'Type 0', 'Type 3 with only the previous value'],
  1, 'SCD Type 2 adds a new row per change and tracks validity periods.', 'autocdc');

addQ(3, 'Transform', 'In Lakeflow Declarative Pipelines, which API implements SCD Type 2 from a CDC feed with out-of-order events?',
  ['AUTO CDC (formerly APPLY CHANGES) with SEQUENCE BY and STORED AS SCD TYPE 2', 'MERGE INTO in a materialized view', 'COPY INTO', 'CREATE STREAMING TABLE AS SELECT * with dropDuplicates'],
  0, 'AUTO CDC handles ordering via SEQUENCE BY and can store SCD type 1 or 2.', 'autocdc');

addQ(3, 'Transform', 'A DataFrame contains duplicate orders on order_id. You need to keep one row per order_id. Which method should you use?',
  ['df.dropDuplicates(["order_id"])', 'df.distinct("order_id")', 'df.dropna("order_id")', 'df.groupBy("order_id")'],
  0, 'dropDuplicates with a subset of columns removes duplicates based on those columns.', 'delta');

addQ(3, 'Transform', 'A column items contains an array of structs. You need one row per array element. Which function should you use?',
  ['explode()', 'flatten()', 'collect_list()', 'pivot()'],
  0, 'explode() returns a new row for each element of an array or map.', 'delta');

addQ(3, 'Transform', 'A string column contains JSON. You need to convert it to a struct using a known schema. Which function should you use?',
  ['from_json()', 'to_json()', 'get_json_object() for every field', 'schema_of_json() only'],
  0, 'from_json parses a JSON string into a struct using the provided schema.', 'delta');

addQ(3, 'Transform', 'A large fact table is joined with a 20 MB dimension table, causing a large shuffle. What should you do?',
  ['Use a broadcast join hint on the dimension table', 'Increase spark.sql.shuffle.partitions to 10000', 'Repartition the dimension table to 1000 partitions', 'Disable Adaptive Query Execution'],
  0, 'Broadcasting the small table avoids shuffling the large table.', 'optim');

addQ(3, 'Data quality', 'In a pipeline, rows with a NULL order_id must be removed from the target, but the pipeline must keep running and report the count. Which expectation should you use?',
  ['CONSTRAINT valid_id EXPECT (order_id IS NOT NULL) ON VIOLATION DROP ROW', 'CONSTRAINT valid_id EXPECT (order_id IS NOT NULL)', 'CONSTRAINT valid_id EXPECT (order_id IS NOT NULL) ON VIOLATION FAIL UPDATE', 'A CHECK constraint on the table'],
  0, 'DROP ROW discards invalid records and records metrics. No action keeps records; FAIL UPDATE stops the update.', 'expectations');

addQ(3, 'Data quality', 'A Delta table must reject inserts where quantity is negative. What should you add?',
  ['ALTER TABLE t ADD CONSTRAINT qty_pos CHECK (quantity >= 0)', 'A column mask', 'A row filter', 'An informational primary key'],
  0, 'CHECK constraints are enforced on write; violating transactions fail.', 'constraints');

addQ(3, 'Data quality', 'Which statement about PRIMARY KEY constraints on Unity Catalog tables is correct?',
  ['They are informational and not enforced', 'They are enforced on every insert', 'They automatically deduplicate data', 'They are required for MERGE'],
  0, 'Primary and foreign keys in Unity Catalog are informational; they are not enforced.', 'constraints');

addQ(3, 'Delta Lake', 'An incorrect UPDATE ran 2 hours ago. You must return the table to its previous state. What should you run?',
  ['DESCRIBE HISTORY then RESTORE TABLE t TO VERSION AS OF <version>', 'VACUUM t RETAIN 0 HOURS', 'OPTIMIZE t', 'REFRESH TABLE t'],
  0, 'Use history to find the version before the bad change and RESTORE to it.', 'history');

addQ(3, 'Delta Lake', 'After running VACUUM with default settings, how far back can you time travel?',
  ['About 7 days (default retention of 168 hours)', '30 days', 'Unlimited', '0 hours'],
  0, 'VACUUM removes files no longer referenced and older than the retention threshold, which defaults to 7 days.', 'vacuum');

addQ(3, 'Delta Lake', 'A table has thousands of small files that slow queries. What should you run?',
  ['OPTIMIZE', 'VACUUM', 'ANALYZE TABLE', 'MSCK REPAIR TABLE'],
  0, 'OPTIMIZE compacts small files into larger ones.', 'optimize');

addQ(3, 'Delta Lake', 'Query filters change over time and you want to be able to change data layout keys without rewriting the table. What should you use?',
  ['Liquid clustering (CLUSTER BY)', 'Hive-style partitioning', 'Z-ORDER', 'Bucketing'],
  0, 'Liquid clustering keys can be changed with ALTER TABLE ... CLUSTER BY without rewriting existing data.', 'clustering');

addQ(3, 'Delta Lake', 'Downstream consumers need only row-level changes (inserts, updates, deletes) from a silver table. What should you enable?',
  ['Change data feed (delta.enableChangeDataFeed = true)', 'Deletion vectors', 'Column mapping', 'Auto compaction'],
  0, 'Change data feed records row-level changes, readable with table_changes() or readChangeFeed.', 'cdf');

addQ(3, 'Delta Lake', 'A new column appears in the source DataFrame and the append fails with a schema mismatch. You want to add the column to the target. What should you do?',
  ['Write with .option("mergeSchema", "true")', 'Write with .option("overwriteSchema", "true") in append mode', 'Disable schema enforcement globally', 'Run VACUUM'],
  0, 'mergeSchema enables schema evolution so new columns are added on append.', 'schema');

addQ(3, 'Delta Lake', 'When is Hive-style partitioning generally recommended for Delta tables in Databricks?',
  ['For very large tables (around 1 TB or more) with a low-cardinality partition column', 'For every table with a date column', 'For tables smaller than 1 GB', 'For high-cardinality columns such as customer_id'],
  0, 'Databricks recommends avoiding partitioning for most tables under ~1 TB and preferring liquid clustering.', 'partitions');

addQ(3, 'Pipelines', 'In Lakeflow Declarative Pipelines, which dataset type should ingest append-only data incrementally from Auto Loader?',
  ['Streaming table', 'Materialized view', 'Temporary view', 'External table'],
  0, 'Streaming tables process each input record once and suit append-only incremental ingestion.', 'ldp');

addQ(3, 'Pipelines', 'Which layer of the medallion architecture contains cleaned, conformed, deduplicated data?',
  ['Bronze', 'Silver', 'Gold', 'Landing'],
  1, 'Bronze is raw, silver is cleansed/conformed, gold is business-level aggregates.', 'ldp');

addQ(3, 'Data profiling', 'You need to quickly view count, mean, stddev, min and max for numeric columns of a DataFrame. Which TWO options work? (Choose two.)',
  ['df.summary()', 'df.describe()', 'df.explain()', 'df.printSchema()'],
  [0, 1], 'describe() and summary() return statistics. explain() shows the query plan; printSchema() shows the schema.', 'profile');
