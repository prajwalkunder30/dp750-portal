// Additional exam-style scenario questions - Domains 3 and 4 (original content)

// ---------- Domain 3 ----------
addQ(3, 'Ingestion', 'An Auto Loader stream reads from a directory that contains tens of millions of files. Listing the directory has become slow and expensive. What should you configure?',
  ['File notification mode', 'A larger maxFilesPerTrigger', 'cloudFiles.inferColumnTypes', 'trigger(continuous=...)'],
  0, 'File notification mode uses Azure Event Grid and queues instead of listing the directory.', 'autoloader');

addQ(3, 'Ingestion', 'An Auto Loader stream uses the default schema evolution mode. A new column appears in the source. What happens?',
  ['The stream fails; after restart it continues with the new column added to the schema', 'The column is silently dropped', 'The stream continues and writes the column to _rescued_data forever', 'The table is overwritten'],
  0, 'The default addNewColumns mode updates the schema location and stops the stream so it can restart with the evolved schema.', 'autoloader');

addQ(3, 'Ingestion', 'The bronze schema must never change. Any unexpected new columns should be kept without failing the stream. Which schema evolution mode should you use?',
  ['rescue', 'addNewColumns', 'failOnNewColumns', 'none'],
  0, 'rescue mode never evolves the schema and puts new columns into the rescued data column.', 'autoloader');

addQ(3, 'Ingestion', 'Auto Loader infers most columns correctly, but amount must be DECIMAL(18,2) instead of DOUBLE. What should you set?',
  ['cloudFiles.schemaHints = "amount DECIMAL(18,2)"', 'mergeSchema = true', 'cloudFiles.useNotifications = true', 'inferSchema = false'],
  0, 'Schema hints override inferred types for selected columns.', 'autoloader');

addQ(3, 'Ingestion', 'Auto Loader reads CSV files and all inferred columns are strings. You need typed columns. What should you set?',
  ['cloudFiles.inferColumnTypes = true', 'cloudFiles.schemaEvolutionMode = rescue', 'header = false', 'cloudFiles.allowOverwrites = true'],
  0, 'For CSV and JSON, Auto Loader infers strings unless inferColumnTypes is enabled.', 'autoloader');

addQ(3, 'Ingestion', 'COPY INTO fails because the incoming files contain a new column. You want the column added to the target table. What should you add?',
  ['COPY_OPTIONS (\'mergeSchema\' = \'true\')', 'FORMAT_OPTIONS (\'header\' = \'false\')', 'VALIDATE 10 ROWS', 'PATTERN = \'*.csv\''],
  0, 'COPY INTO supports schema evolution with COPY_OPTIONS mergeSchema.', 'copyinto');

addQ(3, 'Ingestion', 'You need to explore CSV files with headers from a volume by using SQL only. Which query should you use?',
  ['SELECT * FROM read_files(\'/Volumes/main/raw/files/\', format => \'csv\', header => true)', 'SELECT * FROM csv.load(\'/Volumes/main/raw/files/\')', 'COPY INTO SELECT ...', 'DESCRIBE VOLUME files'],
  0, 'read_files is a table-valued function that reads files in SQL.', 'ingestion');

addQ(3, 'Transform', 'A daily job must overwrite only rows for date 2026-10-01 in a Delta table, leaving other dates untouched. What should you use?',
  ['df.write.mode("overwrite").option("replaceWhere", "date = \'2026-10-01\'")', 'df.write.mode("overwrite") without options', 'df.write.mode("append")', 'TRUNCATE TABLE and append'],
  0, 'replaceWhere atomically replaces only the rows matching the predicate.', 'delta');

addQ(3, 'Transform', 'You need customers that have no orders. Which join type should you use between customers and orders?',
  ['left_anti', 'inner', 'left_semi', 'cross'],
  0, 'A left anti join returns rows from the left side with no match on the right.', 'delta');

addQ(3, 'Transform', 'A table has several rows per customer_id with different updated_at values. You need the latest row per customer. Which approach is correct?',
  ['row_number() over (partition by customer_id order by updated_at desc) and keep row 1', 'dropDuplicates(["customer_id"]) without ordering', 'groupBy(customer_id).max(updated_at) only', 'distinct()'],
  0, 'A window with row_number ordered descending reliably selects the latest row. dropDuplicates keeps an arbitrary row.', 'delta');

addQ(3, 'Transform', 'Monthly sales are stored as rows (store, month, amount). A report needs one column per month. Which operation should you use?',
  ['pivot', 'explode', 'unionByName', 'cube'],
  0, 'pivot turns distinct values of a column into separate columns.', 'delta');

addQ(3, 'Transform', 'You must apply a function to every element of an array column without exploding the rows. Which function should you use?',
  ['transform()', 'explode()', 'collect_set()', 'posexplode()'],
  0, 'transform() is a higher-order function that maps each element of an array.', 'delta');

addQ(3, 'Transform', 'You must combine two DataFrames with the same columns in a different order; one DataFrame lacks a column. Which method should you use?',
  ['unionByName(other, allowMissingColumns=True)', 'union(other)', 'join(other)', 'crossJoin(other)'],
  0, 'unionByName matches columns by name and can fill missing columns with NULL.', 'delta');

addQ(3, 'Transform', 'A column contains strings such as "25/10/2026". You need a DATE column. Which expression should you use?',
  ['to_date(col, "dd/MM/yyyy")', 'cast(col as date)', 'date_format(col, "dd/MM/yyyy")', 'current_date()'],
  0, 'to_date with an explicit pattern parses non-ISO date strings.', 'delta');

addQ(3, 'Transform', 'A Python UDF that formats strings is the bottleneck of a job. What should you try first?',
  ['Replace it with built-in Spark SQL functions', 'Add more driver memory', 'Increase shuffle partitions', 'Disable AQE'],
  0, 'Built-in functions run in the JVM/Photon and avoid Python serialization overhead.', 'optim');

addQ(3, 'Transform', 'A DataFrame is reused in several actions within an iterative notebook. What can reduce recomputation?',
  ['df.cache() and then an action to materialize it', 'df.explain()', 'df.printSchema()', 'df.coalesce(1)'],
  0, 'Caching keeps the computed DataFrame in memory for reuse.', 'optim');

addQ(3, 'Streaming', 'A stream must deduplicate events by event_id, and duplicates arrive at most 1 hour apart. State must stay bounded. What should you use?',
  ['withWatermark("ts", "1 hour").dropDuplicatesWithinWatermark(["event_id"])', 'dropDuplicates(["event_id"]) without a watermark', 'distinct()', 'MERGE with no condition'],
  0, 'Deduplication within a watermark bounds the state that must be kept.', 'streaming');

addQ(3, 'Streaming', 'A stream is joined with a static Delta dimension table that is updated daily. Which version of the dimension does each micro-batch use?',
  ['The latest version of the Delta table at the time of the micro-batch', 'The version at stream start, forever', 'A random version', 'The stream fails when the dimension changes'],
  0, 'Stream-static joins with Delta read the latest table version for each micro-batch.', 'streaming');

addQ(3, 'Streaming', 'You join two streams (impressions and clicks) on ad_id within 1 hour. What is required to keep join state bounded?',
  ['Watermarks on both streams and a time-range join condition', 'A broadcast hint', 'outputMode("complete")', 'trigger(availableNow=True)'],
  0, 'Stream-stream joins need watermarks plus event-time constraints so old state can be dropped.', 'streaming');

addQ(3, 'Streaming', 'A new Kafka stream must read all existing messages in the topic before new ones. Which option should you set?',
  ['startingOffsets = "earliest"', 'startingOffsets = "latest"', 'failOnDataLoss = false', 'maxOffsetsPerTrigger = 1'],
  0, 'earliest starts from the beginning of the retained topic data on the first run.', 'eventhubs');

addQ(3, 'Streaming', 'A stream reads from a bronze Delta table. Upstream jobs sometimes run UPDATE and DELETE on bronze, causing the stream to fail. Changes to existing rows can be ignored. What should you set?',
  ['skipChangeCommits = true', 'ignoreDeletes = false', 'readChangeFeed = false', 'mergeSchema = true'],
  0, 'skipChangeCommits ignores transactions that modify or delete existing rows.', 'streaming');

addQ(3, 'Streaming', 'The first run of a stream on a large backlog of files overwhelms the cluster. What should you configure to limit each micro-batch?',
  ['maxFilesPerTrigger or maxBytesPerTrigger', 'checkpointLocation', 'withWatermark', 'outputMode("update")'],
  0, 'Rate-limiting options bound the size of each micro-batch.', 'streaming');

addQ(3, 'Pipelines', 'A gold dataset aggregates a silver table that receives updates and deletes. The aggregate must reflect those changes. Which dataset type should you use?',
  ['Materialized view', 'Streaming table', 'Temporary view only', 'External table'],
  0, 'Materialized views recompute (incrementally where possible) and reflect updates and deletes. Streaming tables expect append-only input.', 'mv');

addQ(3, 'Pipelines', 'Invalid records must be kept for later review in a separate table instead of being lost. What should you implement?',
  ['A quarantine table that selects records violating the rules, alongside DROP ROW expectations on the main table', 'ON VIOLATION FAIL UPDATE', 'A CHECK constraint', 'VACUUM'],
  0, 'A common pattern is to route invalid records to a quarantine dataset using the inverse of the expectation rules.', 'expectations');

addQ(3, 'Pipelines', 'In Python pipeline code, which decorator drops records that violate a rule?',
  ['expect_or_drop', 'expect', 'expect_or_fail', 'table'],
  0, 'expect_or_drop drops violating records; expect only records metrics; expect_or_fail stops the update.', 'expectations');

addQ(3, 'Delta Lake', 'A table uses deletion vectors. You must physically remove deleted rows from data files for compliance. What should you run?',
  ['REORG TABLE t APPLY (PURGE), then VACUUM', 'OPTIMIZE t ZORDER BY id', 'ANALYZE TABLE t', 'RESTORE TABLE t'],
  0, 'REORG ... APPLY (PURGE) rewrites files to remove soft-deleted rows; VACUUM then removes old files.', 'vacuum');

addQ(3, 'Delta Lake', 'Running VACUUM t RETAIN 1 HOURS fails with an error. Why?',
  ['A safety check blocks retention shorter than the default 7 days', 'VACUUM does not accept RETAIN', 'The table needs liquid clustering', 'VACUUM only works on external tables'],
  0, 'spark.databricks.delta.retentionDurationCheck.enabled prevents dangerously short retention.', 'vacuum');

addQ(3, 'Delta Lake', 'Auditors require 90 days of time travel on a table that is vacuumed weekly. Which TWO properties should you set to 90 days? (Choose two.)',
  ['delta.logRetentionDuration', 'delta.deletedFileRetentionDuration', 'delta.appendOnly', 'delta.dataSkippingNumIndexedCols'],
  [0, 1], 'Time travel needs both the log entries and the data files, controlled by these two properties.', 'history');

addQ(3, 'Delta Lake', 'Developers need a writable copy of a 5 TB production table for testing, without copying data files. What should you use?',
  ['SHALLOW CLONE', 'DEEP CLONE', 'CTAS', 'COPY INTO'],
  0, 'A shallow clone references the source files and copies only metadata.', 'delta');

addQ(3, 'Delta Lake', 'You need an independent copy of a table, including data files, in another catalog for backup. What should you use?',
  ['DEEP CLONE', 'SHALLOW CLONE', 'CREATE VIEW', 'Time travel'],
  0, 'A deep clone copies data and metadata and can be refreshed incrementally.', 'delta');

addQ(3, 'Delta Lake', 'A dimension table needs a surrogate key generated automatically on insert. What should you define?',
  ['BIGINT GENERATED ALWAYS AS IDENTITY', 'A generated column using uuid()', 'An informational primary key', 'A CHECK constraint'],
  0, 'Identity columns generate unique values automatically.', 'tables');

addQ(3, 'Delta Lake', 'You must change a column type from INT to STRING in an existing Delta table and rewrite the data. What should you use?',
  ['Overwrite the table with option("overwriteSchema", "true")', 'option("mergeSchema", "true") in append mode', 'ALTER TABLE ... ADD COLUMN', 'VACUUM'],
  0, 'Incompatible type changes require rewriting the table with overwriteSchema.', 'schema');

addQ(3, 'Delta Lake', 'ALTER TABLE t RENAME COLUMN fails. What must be enabled on the table?',
  ['Column mapping (delta.columnMapping.mode = \'name\')', 'Change data feed', 'Deletion vectors', 'Auto compaction'],
  0, 'Renaming and dropping columns requires column mapping.', 'schema');

addQ(3, 'Delta Lake', 'Queries filter on column 45 of a wide table and data skipping does not help. What is the likely cause?',
  ['Statistics are collected only for the first 32 columns by default', 'Photon is disabled', 'The table is managed', 'Change data feed is enabled'],
  0, 'Delta collects stats on the first 32 columns by default; reorder columns or set delta.dataSkippingStatsColumns.', 'optim');

addQ(3, 'Data profiling', 'You need to monitor a table with a timestamp column for data drift and quality metrics over time. Which monitor profile should you choose?',
  ['Time series', 'Snapshot', 'Inference', 'None'],
  0, 'Time series profiles compute metrics over time windows based on a timestamp column.', 'profile');

addQ(3, 'Data profiling', 'You want quick column statistics and histograms of a DataFrame in a notebook without writing code. What should you use?',
  ['The Data Profile tab in display() results', 'The Spark UI', 'DESCRIBE HISTORY', 'The query profile'],
  0, 'Notebook results include a data profile with summary statistics and histograms.', 'profile');

// ---------- Domain 4 ----------
addQ(4, 'Jobs', 'A notebook task must receive the job run ID as a parameter. What should you pass as the parameter value?',
  ['{{job.run_id}}', '$RUN_ID', '${run.id}', 'spark.conf.get("runId")'],
  0, 'Dynamic value references such as {{job.run_id}} are resolved at run time.', 'jobs');

addQ(4, 'Jobs', 'How does a notebook task read a parameter named region?',
  ['dbutils.widgets.get("region")', 'dbutils.jobs.taskValues.get("region")', 'spark.conf.get("region")', 'os.environ["region"]'],
  0, 'Notebook task parameters are exposed as widgets.', 'jobs');

addQ(4, 'Jobs', 'A job must run an entry point from a Python package built as a wheel. Which task type should you use?',
  ['Python wheel task', 'Notebook task', 'SQL task', 'Pipeline task'],
  0, 'Python wheel tasks run an entry point from a wheel.', 'jobs');

addQ(4, 'Jobs', 'A job must refresh a Lakeflow Declarative Pipeline and then run a SQL query on a warehouse. Which TWO task types should you use? (Choose two.)',
  ['Pipeline task', 'SQL task', 'JAR task', 'Spark submit task'],
  [0, 1], 'Pipeline tasks trigger pipeline updates; SQL tasks run queries, dashboards or alerts on a SQL warehouse.', 'jobs');

addQ(4, 'Jobs', 'A job scheduled every 15 minutes sometimes runs 20 minutes. Max concurrent runs is 1. New runs must wait instead of being skipped. What should you enable?',
  ['Queueing for the job', 'Max concurrent runs = 0', 'A continuous trigger', 'Task retries'],
  0, 'With queueing enabled, runs that hit the concurrency limit are queued instead of skipped.', 'jobs');

addQ(4, 'Jobs', 'A task sometimes hangs indefinitely. It must be stopped after 2 hours and marked failed. What should you configure?',
  ['A task timeout', 'Retries', 'A duration warning only', 'Auto termination on the cluster'],
  0, 'A timeout stops the task after the specified duration.', 'jobs');

addQ(4, 'Jobs', 'The operations team must start and cancel runs of a job but must not edit it. Which permission should you grant?',
  ['CAN MANAGE RUN', 'CAN VIEW', 'CAN MANAGE', 'IS OWNER'],
  0, 'CAN MANAGE RUN allows triggering and canceling runs without editing the job.', 'jobs');

addQ(4, 'Jobs', 'Job failures must post a message to a Microsoft Teams channel. What should you configure?',
  ['A notification destination for Microsoft Teams and attach it to the job\'s failure notifications', 'A SQL alert', 'An init script', 'An Azure Policy'],
  0, 'Admins create notification destinations (for example Teams or webhooks) that jobs can use.', 'jobs');

addQ(4, 'Jobs', 'An external enterprise scheduler must start a Databricks job. What should it call?',
  ['The Jobs API run-now endpoint', 'The Clusters API create endpoint', 'The SQL Statement Execution API', 'The Secrets API'],
  0, 'The Jobs API run-now endpoint triggers a run of an existing job.', 'jobs');

addQ(4, 'CI/CD', 'A bundle must deploy to catalog dev_sales in dev and prod_sales in prod, using the same job YAML. What should you use?',
  ['A bundle variable such as ${var.catalog} with per-target values', 'Two separate bundles', 'Hard-coded catalog names', 'Notebook widgets with default values'],
  0, 'Bundle variables can be overridden per target.', 'bundles');

addQ(4, 'CI/CD', 'Production jobs deployed by a bundle must run as service principal sp-prod. What should you set in the prod target?',
  ['run_as with the service principal application ID', 'mode: development', 'permissions: CAN VIEW', 'presets: name_prefix'],
  0, 'The run_as mapping sets the identity used to run bundle workflows.', 'bundles');

addQ(4, 'CI/CD', 'You need to start a new bundle project from a Databricks template. Which command should you run?',
  ['databricks bundle init', 'databricks bundle deploy', 'databricks bundle run', 'databricks workspace import'],
  0, 'bundle init creates a project from a template.', 'bundles');

addQ(4, 'CI/CD', 'All resources deployed by a bundle to a test workspace must be removed. Which command should you run?',
  ['databricks bundle destroy -t test', 'databricks bundle validate -t test', 'databricks jobs delete --all', 'databricks bundle init'],
  0, 'bundle destroy deletes the resources and files previously deployed by the bundle.', 'bundles');

addQ(4, 'CI/CD', 'Where should a GitHub Actions workflow keep the credentials used by the Databricks CLI?',
  ['In environment variables populated from GitHub secrets (or use workload identity federation)', 'In databricks.yml committed to the repo', 'In a notebook cell', 'In the README'],
  0, 'Never commit credentials; the CLI reads DATABRICKS_HOST and credentials from environment variables.', 'cli');

addQ(4, 'CI/CD', 'You need to manage workspaces, metastore assignments and network settings across many Azure subscriptions as infrastructure as code. What is most appropriate?',
  ['The Databricks Terraform provider', 'Databricks Asset Bundles only', 'Git folders', 'Notebook workflows'],
  0, 'Terraform manages account and workspace infrastructure; bundles focus on code and workflow resources.', 'cli');

addQ(4, 'CI/CD', 'Which branching approach best supports promotion from dev to prod?',
  ['Feature branches merged to main through pull requests; CI deploys main to test, then prod after approval', 'Everyone commits directly to main from the prod workspace', 'Each developer keeps a personal copy in prod', 'No version control, use workspace history'],
  0, 'Pull requests and automated deployments from main provide review and repeatability.', 'repos');

addQ(4, 'Testing', 'Developers want to run pytest from VS Code against a remote Databricks cluster. What should they use?',
  ['Databricks Connect', 'The Spark UI', 'A SQL alert', 'Delta Sharing'],
  0, 'Databricks Connect runs Spark code from a local IDE on remote Databricks compute.', 'testing');

addQ(4, 'Testing', 'Transformation functions are in a .py file in the same Git folder as a notebook. How should the notebook use them for testability?',
  ['Import the module with a standard Python import', 'Copy the functions into each notebook', 'Use %run on a notebook only', 'Store the functions in a secret'],
  0, 'Workspace files can be imported as modules, which keeps code testable with pytest.', 'testing');

addQ(4, 'Monitoring', 'You need to find job runs that failed in the last 7 days across all workspaces in the region by using SQL. Which table should you query?',
  ['system.lakeflow.job_run_timeline', 'system.access.audit', 'system.compute.warehouses', 'information_schema.tables'],
  0, 'The lakeflow system schema includes job and job run timeline tables.', 'systables');

addQ(4, 'Monitoring', 'You want to find clusters with consistently low CPU utilization to reduce cost. Which system table helps?',
  ['system.compute.node_timeline', 'system.access.table_lineage', 'system.query.history', 'system.billing.list_prices'],
  0, 'node_timeline records resource utilization metrics per node over time.', 'systables');

addQ(4, 'Monitoring', 'A stage runs 50,000 tasks that each take a few milliseconds. What is the likely issue and fix?',
  ['Too many small partitions; reduce partitions (for example coalesce or rely on AQE coalescing)', 'Data skew; salt keys', 'Disk spill; add memory', 'Driver OOM; use collect()'],
  0, 'Scheduling overhead dominates when partitions are tiny.', 'sparkui');

addQ(4, 'Monitoring', 'A streaming job writes many tiny files to a Delta table. Which TWO table features reduce small files automatically? (Choose two.)',
  ['Optimized writes', 'Auto compaction', 'Change data feed', 'Column mapping'],
  [0, 1], 'Optimized writes produce larger files and auto compaction compacts small files after writes.', 'optimize');

addQ(4, 'Monitoring', 'Executors fail with out-of-memory errors during a large shuffle. Which TWO actions can help? (Choose two.)',
  ['Use worker types with more memory', 'Increase the number of shuffle partitions so each is smaller', 'Call collect() earlier', 'Disable Photon'],
  [0, 1], 'More memory or smaller partitions reduce per-task memory pressure.', 'sparkui');

addQ(4, 'Monitoring', 'Where do you see why a cluster was resized, restarted or terminated?',
  ['The compute event log', 'DESCRIBE HISTORY', 'The query profile', 'Catalog Explorer'],
  0, 'The event log records lifecycle events such as resizing, termination and driver restarts.', 'compute');

addQ(4, 'Pipelines', 'During development, you want faster iterations on a pipeline: reuse compute between updates and do not retry on failure. Which mode should you use?',
  ['Development mode', 'Production mode', 'Continuous mode', 'Full refresh'],
  0, 'Development mode reuses compute and disables automatic retries for faster debugging.', 'ldp');

addQ(4, 'Pipelines', 'You need SQL access to data quality metrics for a pipeline. Which approach should you use?',
  ['Query the pipeline event log, for example with the event_log() table-valued function', 'Query system.billing.usage', 'Read driver logs', 'DESCRIBE DETAIL on the target table'],
  0, 'The event log contains flow progress and expectation metrics and can be queried with event_log().', 'ldp');

addQ(4, 'Pipelines', 'You changed the aggregation logic of a stateful streaming query in an incompatible way. The query fails at restart. What should you do?',
  ['Start the query with a new checkpoint location (and reprocess as needed)', 'Delete the target table only', 'Increase retries', 'Run OPTIMIZE'],
  0, 'Incompatible changes to stateful operations require a new checkpoint.', 'streaming');

addQ(4, 'Pipelines', 'Which TWO statements about triggered and continuous pipelines are correct? (Choose two.)',
  ['Triggered pipelines stop compute after processing available data', 'Continuous pipelines keep compute running for low latency', 'Triggered pipelines cannot be scheduled', 'Continuous pipelines cannot use streaming tables'],
  [0, 1], 'Triggered pipelines are usually scheduled with jobs; continuous pipelines run all the time.', 'ldp');

addQ(4, 'Maintenance', 'Which TWO operations does predictive optimization run automatically on Unity Catalog managed tables? (Choose two.)',
  ['OPTIMIZE', 'VACUUM', 'RESTORE', 'DROP'],
  [0, 1], 'Predictive optimization runs maintenance such as OPTIMIZE, VACUUM and statistics collection.', 'optimize');
