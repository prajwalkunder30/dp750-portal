// Study guide - Domain 3: Prepare and process data
addChapter(3, '3.1', 'Delta Lake fundamentals', `
<p>Delta Lake is the default table format in Azure Databricks. Nearly every Domain 3 question assumes you understand how it stores data, how it guarantees consistency, and what history it keeps.</p>

<h2>How a Delta table is stored</h2>
<ul>
<li><b>Data files</b>: Parquet files in the table directory.</li>
<li><b>Transaction log</b>: the <code>_delta_log</code> folder with one JSON file per commit (<code>00000000000000000012.json</code>) listing files added and removed, plus periodic Parquet <b>checkpoint</b> files that summarise the log.</li>
<li>A reader builds the current snapshot by reading the latest checkpoint and later commits; files not in the snapshot are ignored even if they still exist on disk.</li>
</ul>

<h2>ACID guarantees</h2>
<table>
<tr><th>Property</th><th>How Delta provides it</th></tr>
<tr><td>Atomicity</td><td>A commit file is written atomically; either all files of a write are visible or none.</td></tr>
<tr><td>Consistency</td><td>Schema enforcement and constraints reject invalid writes.</td></tr>
<tr><td>Isolation</td><td>Optimistic concurrency: writers check for conflicting commits before committing (default WriteSerializable isolation). Readers see a consistent snapshot.</td></tr>
<tr><td>Durability</td><td>Data and log live in cloud object storage.</td></tr>
</table>
<p>Concurrent appends rarely conflict. Concurrent UPDATE/DELETE/MERGE on the same files can raise <code>ConcurrentModificationException</code>-type errors; liquid clustering, row-level concurrency and deletion vectors reduce such conflicts.</p>

<h2>Schema enforcement and evolution</h2>
<ul>
<li><b>Enforcement</b>: writes with extra columns or incompatible types fail by default.</li>
<li><b>Evolution on write</b>: <code>.option("mergeSchema", "true")</code> adds new columns.</li>
<li><b>Replace schema</b>: <code>.mode("overwrite").option("overwriteSchema", "true")</code> replaces the schema and data.</li>
<li><b>DDL</b>: <code>ALTER TABLE t ADD COLUMNS (c STRING)</code>; renaming or dropping columns requires <b>column mapping</b> (<code>'delta.columnMapping.mode' = 'name'</code>).</li>
<li><b>Type widening</b> (when enabled) allows safe type changes such as INT &rarr; BIGINT without rewriting.</li>
<li><b>MERGE</b>: <code>MERGE WITH SCHEMA EVOLUTION INTO ...</code> adds source columns to the target.</li>
</ul>
<pre><code>(df.write.format("delta")
   .mode("append")
   .option("mergeSchema", "true")
   .saveAsTable("prod.silver.orders"))</code></pre>

<h2>Time travel and history</h2>
<pre><code>DESCRIBE HISTORY prod.silver.orders;              -- version, timestamp, user, operation, metrics

SELECT * FROM prod.silver.orders VERSION AS OF 42;
SELECT * FROM prod.silver.orders TIMESTAMP AS OF '2026-10-01T00:00:00';
SELECT * FROM prod.silver.orders@v42;

RESTORE TABLE prod.silver.orders TO VERSION AS OF 42;   -- itself a new commit</code></pre>
<pre><code>df = spark.read.option("versionAsOf", 42).table("prod.silver.orders")</code></pre>
<ul>
<li>Uses: audit, reproducing a report, recovering from a bad write, comparing versions.</li>
<li>Time travel needs both the log entries and the data files. <b>VACUUM</b> deletes old data files (default retention <b>7 days</b>), and log entries are kept for <code>delta.logRetentionDuration</code> (default <b>30 days</b>).</li>
</ul>
<div class="box trap"><b>Common trap:</b> "Restore to a version from 3 weeks ago" fails if VACUUM ran with default retention &ndash; the files are gone even though history still lists the version.</div>

<h2>Cloning</h2>
<table>
<tr><th></th><th>Shallow clone</th><th>Deep clone</th></tr>
<tr><td>Copies</td><td>Metadata only; references source files</td><td>Metadata and data</td></tr>
<tr><td>Speed / cost</td><td>Instant, cheap</td><td>Full copy</td></tr>
<tr><td>Use for</td><td>Testing changes, short-lived experiments</td><td>Backups, migration, independent copies; incremental re-sync</td></tr>
</table>
<pre><code>CREATE TABLE dev.silver.orders_test SHALLOW CLONE prod.silver.orders;
CREATE OR REPLACE TABLE backup.silver.orders DEEP CLONE prod.silver.orders;</code></pre>

<h2>Useful table features</h2>
<ul>
<li><b>Deletion vectors</b>: DELETE/UPDATE/MERGE mark rows as removed instead of rewriting files. Faster writes; files are rewritten later by OPTIMIZE/purge. On by default for new tables.</li>
<li><b>Identity columns</b>: <code>id BIGINT GENERATED ALWAYS AS IDENTITY</code> &ndash; unique, increasing (not necessarily consecutive) surrogate keys.</li>
<li><b>Generated columns</b>: <code>order_date DATE GENERATED ALWAYS AS (CAST(order_ts AS DATE))</code>.</li>
<li><b>Default values</b>: <code>status STRING DEFAULT 'new'</code> (requires the column defaults table feature).</li>
<li><b>Change data feed</b>: row-level change records (chapter 3.6).</li>
</ul>

<h2>Check yourself</h2>
<details><summary>A bad job overwrote a table an hour ago. How do you recover?</summary>
<p><code>DESCRIBE HISTORY</code> to find the version before the overwrite, then <code>RESTORE TABLE ... TO VERSION AS OF n</code>.</p></details>
<details><summary>New source data contains an extra column and the append fails. What is the minimal fix?</summary>
<p>Write with <code>mergeSchema</code> = true (or enable schema evolution in the ingestion tool).</p></details>
<details><summary>Which clone type gives an independent backup?</summary>
<p>Deep clone.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.delta}" target="_blank" rel="noopener">Delta Lake</a></li>
<li><a href="${R.history}" target="_blank" rel="noopener">Table history and time travel</a></li>
<li><a href="${R.schema}" target="_blank" rel="noopener">Update table schema</a></li></ul>
`);

addChapter(3, '3.2', 'Batch ingestion: CTAS, read_files, COPY INTO and Lakeflow Connect', `
<p>Ingestion questions usually give a source, a volume and a skill set ("SQL analysts", "millions of files", "SaaS app") and ask for the right tool. Learn the selection matrix first, then the syntax.</p>

<h2>Selection matrix</h2>
<table>
<tr><th>Source / need</th><th>Recommended tool</th></tr>
<tr><td>SaaS apps (Salesforce, Workday, ServiceNow, Google Analytics, SharePoint) or databases (SQL Server, etc.)</td><td><b>Lakeflow Connect</b> managed connectors</td></tr>
<tr><td>Files in cloud storage arriving continuously, large volume, schema drift</td><td><b>Auto Loader</b> (in pipelines, streaming tables or Structured Streaming)</td></tr>
<tr><td>Files, SQL users, thousands of files, idempotent re-runs</td><td><b>COPY INTO</b></td></tr>
<tr><td>One-off load or exploration of files in SQL</td><td><b>CTAS with read_files()</b></td></tr>
<tr><td>Incremental file ingestion in SQL with minimal code</td><td><b>Streaming table</b> over <code>STREAM read_files()</code></td></tr>
<tr><td>Event streams (Event Hubs, Kafka)</td><td><b>Structured Streaming</b> / pipelines with Kafka source</td></tr>
<tr><td>Query external DB without copying</td><td><b>Lakehouse Federation</b></td></tr>
<tr><td>Orchestrated copy from many Azure/on-prem sources</td><td><b>Azure Data Factory</b> copy activity into ADLS, then Auto Loader</td></tr>
<tr><td>Small manual file upload</td><td>Add data UI (upload to table or volume)</td></tr>
</table>

<h2>read_files() and CTAS</h2>
<pre><code>CREATE OR REPLACE TABLE prod.bronze.customers AS
SELECT *, _metadata.file_path AS source_file, current_timestamp() AS ingest_ts
FROM read_files(
  '/Volumes/prod/raw/landing/customers/',
  format =&gt; 'csv',
  header =&gt; true,
  schemaHints =&gt; 'customer_id BIGINT, signup_date DATE',
  rescuedDataColumn =&gt; '_rescued_data'
);</code></pre>
<ul>
<li>Formats: CSV, JSON, Parquet, Avro, ORC, text, binaryFile, XML.</li>
<li>Infers schema; <code>schemaHints</code> overrides specific columns.</li>
<li>The hidden <code>_metadata</code> column exposes file path, name, size and modification time.</li>
<li>CTAS reloads everything each time &ndash; not incremental.</li>
</ul>

<h2>COPY INTO</h2>
<pre><code>CREATE TABLE IF NOT EXISTS prod.bronze.sales;

COPY INTO prod.bronze.sales
FROM '/Volumes/prod/raw/landing/sales/'
FILEFORMAT = CSV
PATTERN = '*.csv'
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true');</code></pre>
<ul>
<li><b>Idempotent</b>: tracks loaded files and skips them on re-run. Use <code>'force' = 'true'</code> to reload.</li>
<li>Good for thousands of files and scheduled SQL loads; for millions of files or continuous arrival prefer Auto Loader.</li>
<li>Can create an empty schemaless table first and let <code>mergeSchema</code> define columns.</li>
</ul>

<h2>Spark batch readers</h2>
<pre><code>df = (spark.read.format("json")
        .option("multiLine", "true")
        .load("/Volumes/prod/raw/landing/events/2026/10/"))

jdbc_df = (spark.read.format("jdbc")
        .option("url", "jdbc:sqlserver://crm-sql.database.windows.net:1433;database=crm")
        .option("dbtable", "dbo.orders")
        .option("user", dbutils.secrets.get("crm", "user"))
        .option("password", dbutils.secrets.get("crm", "pwd"))
        .option("numPartitions", 8).option("partitionColumn", "order_id")
        .option("lowerBound", 1).option("upperBound", 10000000)
        .load())

df.write.mode("append").saveAsTable("prod.bronze.events")</code></pre>
<p>For JDBC, <code>partitionColumn</code>/<code>lowerBound</code>/<code>upperBound</code>/<code>numPartitions</code> parallelize reads; without them one task reads the whole table.</p>

<h2>Lakeflow Connect</h2>
<ul>
<li><b>Managed connectors</b> for SaaS applications and databases. Configured in the UI or API; Databricks handles API pagination, incremental cursors, schema evolution and retries.</li>
<li>Database connectors use an <b>ingestion gateway</b> to capture changes (CDC/change tracking) and an ingestion pipeline that writes <b>streaming tables</b> in UC.</li>
<li>Run on serverless; governed by UC <b>connections</b>.</li>
<li><b>Standard connectors</b> (e.g., cloud storage, Kafka-compatible sources) are used inside your own pipelines.</li>
</ul>
<div class="box tip"><b>Exam tip:</b> "Ingest Salesforce objects incrementally with the least development effort" &rarr; Lakeflow Connect managed connector, not a custom REST API notebook.</div>

<h2>Write modes</h2>
<table>
<tr><th>Mode</th><th>Effect</th></tr>
<tr><td><code>append</code></td><td>Add rows</td></tr>
<tr><td><code>overwrite</code></td><td>Replace all data (keeps history)</td></tr>
<tr><td><code>overwrite</code> + <code>replaceWhere</code></td><td>Replace only rows matching a predicate (e.g. one date)</td></tr>
<tr><td>Dynamic partition overwrite</td><td>Replace only partitions present in the new data</td></tr>
<tr><td><code>INSERT OVERWRITE</code> / <code>INSERT INTO ... REPLACE WHERE</code></td><td>SQL equivalents</td></tr>
</table>
<pre><code>(daily_df.write.mode("overwrite")
   .option("replaceWhere", "order_date = '2026-10-30'")
   .saveAsTable("prod.silver.orders"))</code></pre>

<h2>Check yourself</h2>
<details><summary>A SQL-only team loads a few hundred CSV files daily and must avoid duplicates if the job reruns. Which tool?</summary>
<p>COPY INTO.</p></details>
<details><summary>How do you reprocess one day of data without touching other days?</summary>
<p>Overwrite with <code>replaceWhere</code> for that date (or <code>INSERT INTO ... REPLACE WHERE</code>).</p></details>
<details><summary>A JDBC read of a 200 M row table uses one task. What fixes it?</summary>
<p>Set partitionColumn, lowerBound, upperBound and numPartitions.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.ingestion}" target="_blank" rel="noopener">Ingestion overview</a></li>
<li><a href="${R.copyinto}" target="_blank" rel="noopener">COPY INTO</a></li>
<li><a href="${R.connect}" target="_blank" rel="noopener">Lakeflow Connect</a></li></ul>
`);

addChapter(3, '3.3', 'Auto Loader in depth', `
<p>Auto Loader (<code>cloudFiles</code> source) incrementally and efficiently processes new files in cloud storage. It is the default answer for scalable file ingestion and powers streaming tables built on <code>read_files</code>.</p>

<h2>Basic pattern</h2>
<pre><code>(spark.readStream
   .format("cloudFiles")
   .option("cloudFiles.format", "json")
   .option("cloudFiles.schemaLocation", "/Volumes/prod/raw/_checkpoints/orders/schema")
   .option("cloudFiles.inferColumnTypes", "true")
   .load("/Volumes/prod/raw/landing/orders/")
   .selectExpr("*", "_metadata.file_path AS source_file", "current_timestamp() AS ingest_ts")
 .writeStream
   .option("checkpointLocation", "/Volumes/prod/raw/_checkpoints/orders/cp")
   .trigger(availableNow=True)
   .toTable("prod.bronze.orders"))</code></pre>
<p>Run this as a scheduled job with <code>availableNow</code> for incremental batch, or with a processing-time trigger for continuous ingestion. Exactly-once is guaranteed via the checkpoint (which stores discovered files in RocksDB).</p>

<h2>File discovery modes</h2>
<table>
<tr><th>Mode</th><th>How</th><th>Use when</th></tr>
<tr><td><b>Directory listing</b> (default)</td><td>Lists the input path each micro-batch (optimized incremental listing)</td><td>Most cases; no extra Azure resources</td></tr>
<tr><td><b>File notification</b></td><td>Event Grid subscription + storage queue tell Auto Loader about new files (<code>cloudFiles.useNotifications</code>)</td><td>Very large directories / high file volumes; needs permissions to create Event Grid/queue resources</td></tr>
<tr><td><b>File events</b> (managed)</td><td>Uses file events enabled on the UC external location; Databricks manages the notification resources</td><td>Recommended way to get notification-scale performance with less setup</td></tr>
</table>

<h2>Schema inference and evolution</h2>
<ul>
<li><code>cloudFiles.schemaLocation</code> stores inferred schema versions. Required for inference.</li>
<li>Without <code>inferColumnTypes</code>, JSON/CSV columns are inferred as STRING.</li>
<li><code>cloudFiles.schemaHints</code> forces types for chosen columns: <code>"amount DECIMAL(10,2), ts TIMESTAMP"</code>.</li>
<li><code>_rescued_data</code> captures values that do not fit the schema (type mismatch, case mismatch, unexpected columns in rescue mode) so nothing is silently lost.</li>
</ul>
<table>
<tr><th><code>cloudFiles.schemaEvolutionMode</code></th><th>Behaviour on new column</th></tr>
<tr><td><code>addNewColumns</code> (default)</td><td>Stream fails with an error, schema location is updated; on restart new column is included. Use with job retries.</td></tr>
<tr><td><code>rescue</code></td><td>Schema never changes; new columns go into <code>_rescued_data</code></td></tr>
<tr><td><code>failOnNewColumns</code></td><td>Stream fails until you update schema manually</td></tr>
<tr><td><code>none</code></td><td>New columns ignored (and not rescued unless rescuedDataColumn is set)</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> "New columns must be added automatically, and the job must recover without manual action" &rarr; addNewColumns plus <b>task retries</b> (or run in Lakeflow Declarative Pipelines, which restarts automatically).</div>

<h2>Rate limiting and other options</h2>
<table>
<tr><th>Option</th><th>Purpose</th></tr>
<tr><td><code>cloudFiles.maxFilesPerTrigger</code> / <code>maxBytesPerTrigger</code></td><td>Limit micro-batch size</td></tr>
<tr><td><code>cloudFiles.includeExistingFiles</code></td><td>Process files already present at first start (default true)</td></tr>
<tr><td><code>pathGlobFilter</code> / glob in path</td><td>Select files by pattern</td></tr>
<tr><td><code>cloudFiles.cleanSource</code></td><td>Archive or delete processed source files</td></tr>
<tr><td><code>modifiedAfter</code></td><td>Ignore older files</td></tr>
</table>

<h2>Auto Loader vs COPY INTO</h2>
<table>
<tr><th></th><th>Auto Loader</th><th>COPY INTO</th></tr>
<tr><td>Scale</td><td>Millions of files, continuous</td><td>Thousands of files</td></tr>
<tr><td>Interface</td><td>Python/Scala streaming, SQL via read_files in streaming tables</td><td>SQL command</td></tr>
<tr><td>Schema evolution</td><td>Rich (modes, hints, rescue)</td><td>mergeSchema</td></tr>
<tr><td>State</td><td>Checkpoint</td><td>Table metadata</td></tr>
</table>

<h2>In SQL / pipelines</h2>
<pre><code>CREATE OR REFRESH STREAMING TABLE prod.bronze.orders
AS SELECT * FROM STREAM read_files(
  '/Volumes/prod/raw/landing/orders/',
  format =&gt; 'json',
  schemaHints =&gt; 'amount DECIMAL(10,2)');</code></pre>
<p>Inside Lakeflow Declarative Pipelines, schema and checkpoint locations are managed for you.</p>

<h2>Check yourself</h2>
<details><summary>Which option is mandatory to infer and track schema with Auto Loader?</summary>
<p><code>cloudFiles.schemaLocation</code> (managed automatically in pipelines).</p></details>
<details><summary>All JSON columns arrive as STRING. Why?</summary>
<p><code>cloudFiles.inferColumnTypes</code> is not set to true.</p></details>
<details><summary>A directory receives tens of millions of files and listing is slow. What do you change?</summary>
<p>Use file notification / file events mode.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.autoloader}" target="_blank" rel="noopener">Auto Loader</a></li></ul>
`);

addChapter(3, '3.4', 'Structured Streaming', `
<p>Structured Streaming treats a stream as an unbounded table and processes it in <b>micro-batches</b>. You write ordinary DataFrame code; Spark runs it incrementally with exactly-once guarantees to Delta sinks.</p>

<h2>Anatomy of a streaming query</h2>
<pre><code>q = (spark.readStream.table("prod.bronze.orders")          # source
       .filter("amount &gt; 0")                             # transformations
     .writeStream
       .option("checkpointLocation", "/Volumes/prod/silver/_cp/orders")
       .outputMode("append")
       .trigger(processingTime="1 minute")
       .toTable("prod.silver.orders"))                    # sink</code></pre>

<h2>Sources and sinks</h2>
<ul>
<li>Sources: Delta tables, Auto Loader, Kafka / Event Hubs, Kinesis, rate (testing).</li>
<li>Sinks: Delta tables (recommended), Kafka, <code>foreachBatch</code> for anything else, memory/console for debugging.</li>
<li>A Delta source reads <b>appends</b> only. If the source has updates/deletes, use <code>skipChangeCommits</code> to ignore them, or read the change data feed.</li>
</ul>

<h2>Checkpoints</h2>
<ul>
<li>Store source offsets, committed batches and state. Required for fault tolerance and exactly-once.</li>
<li><b>One checkpoint per query.</b> Never share between queries.</li>
<li>Deleting a checkpoint restarts the query from the beginning (or from configured starting offsets) &ndash; duplicates are likely.</li>
<li>Significant query changes (different aggregation keys, adding a stateful operator) may require a new checkpoint.</li>
</ul>

<h2>Triggers</h2>
<table>
<tr><th>Trigger</th><th>Behaviour</th><th>Use for</th></tr>
<tr><td>Default (unspecified)</td><td>Next micro-batch starts as soon as previous finishes</td><td>Low latency, always-on</td></tr>
<tr><td><code>processingTime="5 minutes"</code></td><td>Micro-batch at fixed intervals</td><td>Balanced latency/cost, always-on</td></tr>
<tr><td><code>availableNow=True</code></td><td>Processes all available data (in multiple batches, respecting rate limits) then stops</td><td><b>Incremental batch</b> jobs on a schedule</td></tr>
<tr><td><code>once=True</code></td><td>Single batch then stop (deprecated in favour of availableNow)</td><td>Legacy</td></tr>
<tr><td>Real-time mode / continuous</td><td>Very low latency processing</td><td>Specialised sub-second use cases</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> "Process new data every 6 hours and shut down compute between runs" &rarr; scheduled job with <b>availableNow</b>. "Latency under a minute" &rarr; always-on stream with processing-time trigger.</div>

<h2>Output modes</h2>
<table>
<tr><th>Mode</th><th>Writes</th><th>Typical use</th></tr>
<tr><td><b>append</b></td><td>Only new rows</td><td>Non-aggregated streams; aggregations with watermark (rows emitted when window closes)</td></tr>
<tr><td><b>complete</b></td><td>Entire result table each trigger</td><td>Small aggregations, dashboards</td></tr>
<tr><td><b>update</b></td><td>Only changed rows</td><td>Aggregations into sinks that support upserts (via foreachBatch)</td></tr>
</table>

<h2>Event time, windows and watermarks</h2>
<pre><code>from pyspark.sql.functions import window, col, count

agg = (spark.readStream.table("prod.bronze.clicks")
        .withWatermark("event_time", "10 minutes")
        .groupBy(window(col("event_time"), "5 minutes"), col("page"))
        .agg(count("*").alias("clicks")))</code></pre>
<ul>
<li>A <b>watermark</b> says "events later than 10 minutes behind the max seen event time can be dropped", allowing Spark to finalise windows and purge state.</li>
<li>Without a watermark, state for aggregations, deduplication and stream-stream joins grows forever.</li>
<li>Windows: tumbling (<code>window(ts, "5 minutes")</code>), sliding (<code>window(ts, "10 minutes", "5 minutes")</code>), session windows (<code>session_window</code>).</li>
<li>Deduplicate with <code>dropDuplicatesWithinWatermark(["event_id"])</code>.</li>
<li>Stream-stream joins need watermarks on both sides and a time-range condition. Stream-static joins join each micro-batch to the latest version of a Delta table.</li>
</ul>

<h2>foreachBatch</h2>
<p>Gives you each micro-batch as a regular DataFrame &ndash; ideal for MERGE (upserts), writing to multiple sinks, or using batch-only APIs.</p>
<pre><code>from delta.tables import DeltaTable

def upsert(batch_df, batch_id):
    tgt = DeltaTable.forName(spark, "prod.silver.customers")
    (tgt.alias("t")
        .merge(batch_df.dropDuplicates(["customer_id"]).alias("s"), "t.customer_id = s.customer_id")
        .whenMatchedUpdateAll()
        .whenNotMatchedInsertAll()
        .execute())

(spark.readStream.table("prod.bronze.customers")
   .writeStream
   .foreachBatch(upsert)
   .option("checkpointLocation", "/Volumes/prod/silver/_cp/customers")
   .trigger(availableNow=True)
   .start())</code></pre>
<p>foreachBatch gives at-least-once semantics for custom sinks; make writes idempotent (MERGE is naturally idempotent; for appends use <code>txnAppId</code>/<code>txnVersion</code> options).</p>

<h2>Reading Azure Event Hubs</h2>
<p>Event Hubs exposes a Kafka-compatible endpoint, so use the built-in <code>kafka</code> source:</p>
<pre><code>conn = dbutils.secrets.get("eh", "connection-string")
eh_sasl = ('kafkashaded.org.apache.kafka.common.security.plain.PlainLoginModule required '
           'username="$ConnectionString" password="' + conn + '";')

raw = (spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", "contoso-ns.servicebus.windows.net:9093")
        .option("subscribe", "telemetry")
        .option("kafka.security.protocol", "SASL_SSL")
        .option("kafka.sasl.mechanism", "PLAIN")
        .option("kafka.sasl.jaas.config", eh_sasl)
        .option("startingOffsets", "earliest")
        .load())

events = raw.selectExpr("CAST(value AS STRING) AS body", "timestamp AS enqueued_time")</code></pre>
<p>The Kafka <code>value</code> column is binary &ndash; cast it to string, then parse JSON with <code>from_json</code>. Throughput relates to partitions; use <code>maxOffsetsPerTrigger</code> to limit batch size.</p>

<h2>Monitoring streams</h2>
<ul>
<li><code>q.lastProgress</code> / <code>q.recentProgress</code>: input rows per second, processed rows per second, batch duration, state size.</li>
<li>If <b>input rate &gt; processing rate</b> consistently, the stream falls behind: scale compute, reduce per-batch work, or tune partitions.</li>
<li>Use the Streaming tab in the Spark UI and streaming metrics/alerts in jobs.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>A streaming aggregation's state grows until the cluster runs out of memory. What is missing?</summary>
<p>A watermark on the event-time column.</p></details>
<details><summary>You need to upsert streaming changes into a Delta table. How?</summary>
<p>Use foreachBatch with MERGE (or AUTO CDC in Lakeflow Declarative Pipelines).</p></details>
<details><summary>Two streaming queries write to different tables using the same checkpoint path. What happens?</summary>
<p>Corruption/failures. Each query needs its own checkpoint.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.streaming}" target="_blank" rel="noopener">Structured Streaming</a></li>
<li><a href="${R.eventhubs}" target="_blank" rel="noopener">Kafka / Event Hubs</a></li></ul>
`);

addChapter(3, '3.5', 'Transforming data with SQL and PySpark', `
<p>The exam expects fluency in both Spark SQL and the PySpark DataFrame API for cleaning, reshaping and enriching data. This chapter is a working reference of the patterns most often tested.</p>

<h2>Selecting, casting and cleaning</h2>
<pre><code>from pyspark.sql import functions as F

clean = (df
  .select("order_id", "customer_id", F.col("amount").cast("decimal(10,2)"), "order_ts", "country")
  .withColumn("country", F.upper(F.trim("country")))
  .withColumn("order_date", F.to_date("order_ts"))
  .withColumnRenamed("customer_id", "cust_id")
  .filter(F.col("amount").isNotNull() &amp; (F.col("amount") &gt;= 0))
  .fillna({"country": "UNKNOWN"})
  .dropDuplicates(["order_id"]))</code></pre>
<pre><code>SELECT order_id,
       CAST(amount AS DECIMAL(10,2)) AS amount,
       upper(trim(country))          AS country,
       to_date(order_ts)             AS order_date,
       coalesce(channel, 'web')      AS channel,
       try_cast(qty AS INT)          AS qty        -- NULL instead of error on bad values
FROM prod.bronze.orders
WHERE amount IS NOT NULL;</code></pre>

<h2>Joins</h2>
<table>
<tr><th>Join</th><th>Returns</th></tr>
<tr><td>inner</td><td>Matching rows from both sides</td></tr>
<tr><td>left / right / full outer</td><td>All rows from one/both sides, NULLs where no match</td></tr>
<tr><td>left semi</td><td>Left rows that have a match (no right columns) &ndash; like EXISTS</td></tr>
<tr><td>left anti</td><td>Left rows with <b>no</b> match &ndash; like NOT EXISTS; great for "new records only"</td></tr>
<tr><td>cross</td><td>Cartesian product</td></tr>
</table>
<pre><code>new_customers = src.join(tgt, "customer_id", "left_anti")
enriched = orders.join(F.broadcast(countries), "country_code", "left")</code></pre>
<p><b>Broadcast joins</b> ship a small table to every executor so the large side is not shuffled. Spark broadcasts automatically below <code>spark.sql.autoBroadcastJoinThreshold</code>; AQE can switch to broadcast at runtime.</p>

<h2>Aggregations</h2>
<pre><code>SELECT country, order_date,
       count(*) AS orders, sum(amount) AS revenue,
       count(DISTINCT customer_id) AS customers,
       approx_count_distinct(customer_id) AS approx_customers
FROM prod.silver.orders
GROUP BY ALL
HAVING sum(amount) &gt; 1000;

SELECT * FROM (SELECT country, month, revenue FROM monthly)
PIVOT (sum(revenue) FOR month IN ('2026-01' AS jan, '2026-02' AS feb));</code></pre>

<h2>Window functions</h2>
<pre><code>SELECT *,
  row_number() OVER (PARTITION BY customer_id ORDER BY order_ts DESC) AS rn,
  sum(amount)  OVER (PARTITION BY customer_id ORDER BY order_ts
                     ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
  lag(amount)  OVER (PARTITION BY customer_id ORDER BY order_ts) AS prev_amount
FROM prod.silver.orders;

-- latest record per key in one step
SELECT * FROM prod.bronze.customers
QUALIFY row_number() OVER (PARTITION BY customer_id ORDER BY updated_at DESC) = 1;</code></pre>
<pre><code>from pyspark.sql.window import Window
w = Window.partitionBy("customer_id").orderBy(F.col("updated_at").desc())
latest = df.withColumn("rn", F.row_number().over(w)).filter("rn = 1").drop("rn")</code></pre>
<div class="box tip"><b>Exam tip:</b> row_number = unique sequence; rank = gaps after ties; dense_rank = no gaps. "Keep exactly one latest row per key" &rarr; row_number.</div>

<h2>Semi-structured data</h2>
<pre><code>-- JSON string column: colon path syntax
SELECT raw:customer.id::BIGINT AS customer_id, raw:items[0].sku AS first_sku
FROM prod.bronze.events_json;

-- Parse to struct with a schema
SELECT from_json(raw, 'customer STRUCT&lt;id: BIGINT, name: STRING&gt;, items ARRAY&lt;STRUCT&lt;sku: STRING, qty: INT&gt;&gt;') AS j
FROM prod.bronze.events_json;

-- VARIANT type: flexible, fast semi-structured storage
SELECT parse_json(raw) AS v FROM prod.bronze.events_json;
SELECT v:customer.id::BIGINT FROM prod.bronze.events_variant;

-- One row per array element
SELECT order_id, item.sku, item.qty
FROM prod.silver.orders_nested
LATERAL VIEW explode(items) AS item;</code></pre>
<pre><code>schema = "order_id BIGINT, items ARRAY&lt;STRUCT&lt;sku: STRING, qty: INT&gt;&gt;"
parsed = df.withColumn("j", F.from_json("body", schema)).select("j.*")
flat = parsed.select("order_id", F.explode("items").alias("item")).select("order_id", "item.*")</code></pre>
<ul>
<li><code>explode</code> drops rows with empty/NULL arrays; <code>explode_outer</code> keeps them.</li>
<li><code>posexplode</code> adds the element position.</li>
<li><code>to_json</code>, <code>schema_of_json</code>, <code>get_json_object</code> are also available.</li>
<li>Higher-order functions work on arrays without exploding: <code>transform(items, x -&gt; x.qty * 2)</code>, <code>filter(items, x -&gt; x.qty &gt; 0)</code>, <code>exists</code>, <code>aggregate</code>.</li>
</ul>

<h2>Dates and strings</h2>
<p>Commonly needed: <code>date_trunc</code>, <code>date_add</code>, <code>datediff</code>, <code>months_between</code>, <code>to_timestamp(col, 'yyyy-MM-dd HH:mm')</code>, <code>from_utc_timestamp</code>, <code>regexp_replace</code>, <code>regexp_extract</code>, <code>split</code>, <code>concat_ws</code>, <code>lpad</code>, <code>sha2</code> (hashing for pseudonymisation).</p>

<h2>UDFs: last resort</h2>
<table>
<tr><th>Option</th><th>Performance</th></tr>
<tr><td>Built-in functions</td><td>Best (optimised, Photon)</td></tr>
<tr><td>SQL UDF</td><td>Good (inlined)</td></tr>
<tr><td>pandas UDF (vectorised, Arrow)</td><td>Acceptable for Python logic</td></tr>
<tr><td>Python row-at-a-time UDF</td><td>Slowest (serialisation per row)</td></tr>
</table>

<h2>CTEs and temp views for readability</h2>
<pre><code>WITH latest AS (
  SELECT * FROM prod.bronze.customers
  QUALIFY row_number() OVER (PARTITION BY customer_id ORDER BY updated_at DESC) = 1
)
SELECT l.*, c.region
FROM latest l LEFT JOIN prod.ref.countries c USING (country_code);</code></pre>

<h2>Check yourself</h2>
<details><summary>Find orders whose customer does not exist in the customer table.</summary>
<p>Left anti join of orders to customers on customer_id.</p></details>
<details><summary>An array column may be empty, but rows must be kept after flattening. Which function?</summary>
<p><code>explode_outer</code>.</p></details>
<details><summary>A string column contains bad numeric values; casting must not fail the query.</summary>
<p><code>try_cast</code>.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}sql/language-manual/" target="_blank" rel="noopener">SQL language reference</a></li>
<li><a href="${ML}semi-structured/" target="_blank" rel="noopener">Semi-structured data</a></li></ul>
`);

addChapter(3, '3.6', 'Upserts, slowly changing dimensions and change data feed', `
<h2>MERGE INTO</h2>
<pre><code>MERGE INTO prod.silver.customers AS t
USING updates AS s
ON t.customer_id = s.customer_id
WHEN MATCHED AND s.op = 'DELETE' THEN DELETE
WHEN MATCHED AND s.updated_at &gt; t.updated_at THEN UPDATE SET *
WHEN NOT MATCHED AND s.op != 'DELETE' THEN INSERT *
WHEN NOT MATCHED BY SOURCE AND t.is_active THEN UPDATE SET t.is_active = false;</code></pre>
<ul>
<li>Clauses are evaluated in order; each can have an extra condition.</li>
<li><code>WHEN NOT MATCHED BY SOURCE</code> handles target rows absent from the source (full-snapshot syncs).</li>
<li><b>Duplicate keys in source</b> that match the same target row cause an error. Deduplicate the source first (row_number / QUALIFY).</li>
<li>Add a filter on the target in the ON clause (e.g. recent dates or clustering key) to reduce files scanned.</li>
<li><code>MERGE WITH SCHEMA EVOLUTION</code> adds new source columns.</li>
</ul>
<pre><code>from delta.tables import DeltaTable
(DeltaTable.forName(spark, "prod.silver.customers").alias("t")
   .merge(updates.alias("s"), "t.customer_id = s.customer_id")
   .whenMatchedUpdateAll(condition="s.updated_at &gt; t.updated_at")
   .whenNotMatchedInsertAll()
   .execute())</code></pre>

<h2>Slowly changing dimensions</h2>
<table>
<tr><th>Type</th><th>Behaviour</th><th>History</th></tr>
<tr><td><b>SCD Type 1</b></td><td>Overwrite attribute values</td><td>None</td></tr>
<tr><td><b>SCD Type 2</b></td><td>Close the current row (end date / is_current = false) and insert a new version</td><td>Full</td></tr>
<tr><td>Type 3 (rare)</td><td>Keep previous value in an extra column</td><td>Limited</td></tr>
</table>

<h3>SCD Type 2 with MERGE (manual pattern)</h3>
<pre><code>-- Stage: changed rows appear twice - once to close the old version (merge_key = id),
-- once to insert the new version (merge_key = NULL never matches).
MERGE INTO prod.gold.dim_customer t
USING (
  SELECT s.customer_id AS merge_key, s.* FROM updates s
  UNION ALL
  SELECT NULL AS merge_key, s.* FROM updates s
  JOIN prod.gold.dim_customer t
    ON s.customer_id = t.customer_id AND t.is_current
   AND (s.address &lt;&gt; t.address OR s.segment &lt;&gt; t.segment)
) s
ON t.customer_id = s.merge_key AND t.is_current
WHEN MATCHED AND (t.address &lt;&gt; s.address OR t.segment &lt;&gt; s.segment) THEN
  UPDATE SET is_current = false, end_date = s.effective_date
WHEN NOT MATCHED THEN
  INSERT (customer_id, address, segment, is_current, start_date, end_date)
  VALUES (s.customer_id, s.address, s.segment, true, s.effective_date, NULL);</code></pre>
<p>In Lakeflow Declarative Pipelines, <b>AUTO CDC ... STORED AS SCD TYPE 2</b> does all of this, including out-of-order events (chapter 3.7). Prefer it when possible.</p>

<h2>Change data feed (CDF)</h2>
<p>CDF records row-level changes of a Delta table so downstream consumers process only what changed.</p>
<pre><code>ALTER TABLE prod.silver.customers SET TBLPROPERTIES (delta.enableChangeDataFeed = true);

SELECT * FROM table_changes('prod.silver.customers', 12);           -- from version 12
SELECT * FROM table_changes('prod.silver.customers', '2026-10-30');  -- from timestamp</code></pre>
<pre><code>changes = (spark.readStream
  .option("readChangeFeed", "true")
  .table("prod.silver.customers"))</code></pre>
<table>
<tr><th>Metadata column</th><th>Values / meaning</th></tr>
<tr><td><code>_change_type</code></td><td><code>insert</code>, <code>update_preimage</code>, <code>update_postimage</code>, <code>delete</code></td></tr>
<tr><td><code>_commit_version</code></td><td>Delta version of the change</td></tr>
<tr><td><code>_commit_timestamp</code></td><td>Commit time</td></tr>
</table>
<ul>
<li>Only changes <b>after</b> enabling CDF are recorded.</li>
<li>Use it to propagate silver updates/deletes to gold incrementally, to feed downstream systems, or to audit changes.</li>
<li>Filter out <code>update_preimage</code> when you need only the new values.</li>
</ul>
<div class="box trap"><b>Common trap:</b> A normal streaming read of a Delta table fails when the source has updates or deletes. Options: read the change data feed, set <code>skipChangeCommits</code> to ignore them, or use a materialized view.</div>

<h2>Deletes for compliance (GDPR)</h2>
<p>Deleting rows creates a new version; old files still contain the data until <b>VACUUM</b> removes them after the retention period. With deletion vectors, run <code>REORG TABLE ... APPLY (PURGE)</code> before VACUUM to physically rewrite files. Remember downstream copies and CDF.</p>

<h2>Check yourself</h2>
<details><summary>MERGE fails with "multiple source rows matched". Fix?</summary>
<p>Deduplicate the source on the merge key (keep latest per key) before MERGE.</p></details>
<details><summary>Which CDF change types appear for an UPDATE?</summary>
<p><code>update_preimage</code> and <code>update_postimage</code>.</p></details>
<details><summary>Dimension must keep address history with valid-from/valid-to. Which SCD type?</summary>
<p>Type 2.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.merge}" target="_blank" rel="noopener">MERGE</a></li>
<li><a href="${R.cdf}" target="_blank" rel="noopener">Change data feed</a></li>
<li><a href="${R.autocdc}" target="_blank" rel="noopener">AUTO CDC</a></li></ul>
`);

addChapter(3, '3.7', 'Lakeflow Declarative Pipelines', `
<p>Lakeflow Declarative Pipelines (formerly Delta Live Tables) let you <b>declare</b> datasets and their queries; Databricks works out the dependency graph, orchestration, checkpoints, retries, scaling and data quality tracking.</p>

<h2>Dataset types</h2>
<table>
<tr><th>Type</th><th>Semantics</th><th>Use for</th></tr>
<tr><td><b>Streaming table</b></td><td>Processes each input row once (incremental, append-oriented)</td><td>Ingestion (Auto Loader, Kafka), append-only transforms, AUTO CDC targets</td></tr>
<tr><td><b>Materialized view</b></td><td>Result always reflects the query over current sources; refreshed incrementally when possible</td><td>Joins, aggregations, transformations where sources change</td></tr>
<tr><td><b>Temporary view</b></td><td>Not published; intermediate logic within the pipeline</td><td>Reusable steps, quality checks</td></tr>
<tr><td><b>Sink</b></td><td>Write to external targets (Kafka, Event Hubs, external Delta)</td><td>Publishing outside UC tables</td></tr>
</table>

<h2>SQL syntax</h2>
<pre><code>CREATE OR REFRESH STREAMING TABLE orders_bronze
COMMENT 'Raw orders'
AS SELECT *, _metadata.file_path AS source_file
FROM STREAM read_files('/Volumes/prod/raw/landing/orders/', format =&gt; 'json');

CREATE OR REFRESH STREAMING TABLE orders_silver (
  CONSTRAINT valid_id     EXPECT (order_id IS NOT NULL) ON VIOLATION DROP ROW,
  CONSTRAINT positive_amt EXPECT (amount &gt;= 0)
)
AS SELECT order_id, customer_id, CAST(amount AS DECIMAL(10,2)) AS amount, order_ts
FROM STREAM(orders_bronze);

CREATE OR REFRESH MATERIALIZED VIEW daily_sales
AS SELECT to_date(order_ts) AS order_date, sum(amount) AS revenue
FROM orders_silver GROUP BY ALL;</code></pre>

<h2>Python syntax</h2>
<pre><code>from pyspark import pipelines as dp     # older code: import dlt
from pyspark.sql import functions as F

@dp.table(comment="Raw orders")
def orders_bronze():
    return (spark.readStream.format("cloudFiles")
            .option("cloudFiles.format", "json")
            .load("/Volumes/prod/raw/landing/orders/"))

@dp.table
@dp.expect_or_drop("valid_id", "order_id IS NOT NULL")
@dp.expect("positive_amt", "amount &gt;= 0")
def orders_silver():
    return spark.readStream.table("orders_bronze").withColumn("amount", F.col("amount").cast("decimal(10,2)"))

@dp.materialized_view
def daily_sales():
    return (spark.read.table("orders_silver")
            .groupBy(F.to_date("order_ts").alias("order_date"))
            .agg(F.sum("amount").alias("revenue")))</code></pre>
<ul>
<li>A function returning a <b>streaming</b> DataFrame (<code>readStream</code>) defines a streaming table; a batch read defines a materialized view.</li>
<li>Reference other datasets by name; the pipeline infers dependencies. No checkpoints or schema locations to manage.</li>
<li>The pipeline's default catalog and schema decide where tables are published; you can also write to other schemas with fully qualified names.</li>
</ul>

<h2>AUTO CDC (formerly APPLY CHANGES)</h2>
<pre><code>CREATE OR REFRESH STREAMING TABLE customers;

CREATE FLOW customers_cdc AS AUTO CDC INTO customers
FROM STREAM(customers_cdc_feed)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY sequence_num
COLUMNS * EXCEPT (operation, sequence_num)
STORED AS SCD TYPE 2;</code></pre>
<pre><code>dp.create_streaming_table("customers")
dp.create_auto_cdc_flow(
    target="customers",
    source="customers_cdc_feed",
    keys=["customer_id"],
    sequence_by=F.col("sequence_num"),
    apply_as_deletes=F.expr("operation = 'DELETE'"),
    except_column_list=["operation", "sequence_num"],
    stored_as_scd_type=2)</code></pre>
<ul>
<li><b>SEQUENCE BY</b> orders events so out-of-order arrivals are applied correctly.</li>
<li>SCD Type 1 overwrites; Type 2 adds <code>__START_AT</code> and <code>__END_AT</code> columns.</li>
<li><code>TRACK HISTORY ON</code> limits which column changes create new SCD2 versions.</li>
<li>There is also AUTO CDC FROM SNAPSHOT for sources that provide full snapshots instead of change events.</li>
</ul>

<h2>Flows</h2>
<p>A <b>flow</b> writes into a target. Several append flows can write to one streaming table (for example combining regional Kafka topics) &ndash; and you can add a new source later without a full refresh.</p>
<pre><code>CREATE OR REFRESH STREAMING TABLE all_orders;
CREATE FLOW eu_orders AS INSERT INTO all_orders BY NAME SELECT * FROM STREAM(eu_orders_bronze);
CREATE FLOW us_orders AS INSERT INTO all_orders BY NAME SELECT * FROM STREAM(us_orders_bronze);</code></pre>

<h2>Pipeline settings (overview; operations in Domain 4)</h2>
<ul>
<li><b>Serverless</b> (recommended) or classic compute with enhanced autoscaling.</li>
<li><b>Triggered</b> (run then stop) or <b>continuous</b> mode.</li>
<li><b>Development</b> mode (reuse compute, no retries) vs <b>production</b> mode.</li>
<li>Configuration parameters (key-value) readable via <code>spark.conf.get</code> or <code>\${param}</code>-style substitution in SQL.</li>
<li>Source code as files in a folder, edited in the Lakeflow Pipelines Editor.</li>
</ul>

<h2>When to choose declarative pipelines</h2>
<table>
<tr><th>Choose declarative pipelines when</th><th>Choose notebooks + jobs when</th></tr>
<tr><td>Medallion ETL with many dependent tables</td><td>Highly custom logic, external API calls, complex control flow</td></tr>
<tr><td>You want built-in quality metrics, lineage, retries</td><td>You need full control of streaming internals</td></tr>
<tr><td>CDC / SCD2 with out-of-order data</td><td>One-off or ad-hoc processing</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>In Python, what makes a dataset a streaming table rather than a materialized view?</summary>
<p>The function returns a streaming DataFrame (spark.readStream).</p></details>
<details><summary>CDC events can arrive out of order. Which AUTO CDC clause handles that?</summary>
<p><code>SEQUENCE BY</code>.</p></details>
<details><summary>Which columns does SCD Type 2 in AUTO CDC add?</summary>
<p><code>__START_AT</code> and <code>__END_AT</code>.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.ldp}" target="_blank" rel="noopener">Lakeflow Declarative Pipelines</a></li>
<li><a href="${R.autocdc}" target="_blank" rel="noopener">AUTO CDC</a></li></ul>
`);

addChapter(3, '3.8', 'Data quality', `
<p>Bad data that reaches gold tables destroys trust. Azure Databricks gives three layers of defence: <b>constraints</b> on tables, <b>expectations</b> in pipelines, and <b>monitoring</b> of data over time.</p>

<h2>Table constraints</h2>
<pre><code>CREATE TABLE prod.silver.orders (
  order_id BIGINT NOT NULL,
  customer_id BIGINT,
  amount DECIMAL(10,2),
  CONSTRAINT pk_orders PRIMARY KEY (order_id),
  CONSTRAINT fk_cust FOREIGN KEY (customer_id) REFERENCES prod.silver.customers
);

ALTER TABLE prod.silver.orders ADD CONSTRAINT positive_amount CHECK (amount &gt;= 0);
ALTER TABLE prod.silver.orders ALTER COLUMN customer_id SET NOT NULL;
ALTER TABLE prod.silver.orders DROP CONSTRAINT positive_amount;</code></pre>
<table>
<tr><th>Constraint</th><th>Enforced?</th><th>Behaviour</th></tr>
<tr><td>NOT NULL</td><td>Yes</td><td>Write fails if a NULL is written</td></tr>
<tr><td>CHECK</td><td>Yes</td><td>Whole transaction fails on any violating row; adding it fails if existing rows violate</td></tr>
<tr><td>PRIMARY KEY / FOREIGN KEY</td><td><b>No</b> (informational)</td><td>Documentation, BI tools, and query optimisation with <code>RELY</code></td></tr>
</table>

<h2>Pipeline expectations</h2>
<table>
<tr><th>Action</th><th>SQL</th><th>Python</th><th>Result</th></tr>
<tr><td>Warn (default)</td><td><code>EXPECT (cond)</code></td><td><code>@dp.expect</code></td><td>Keep row, record metric</td></tr>
<tr><td>Drop</td><td><code>... ON VIOLATION DROP ROW</code></td><td><code>@dp.expect_or_drop</code></td><td>Discard row, record metric</td></tr>
<tr><td>Fail</td><td><code>... ON VIOLATION FAIL UPDATE</code></td><td><code>@dp.expect_or_fail</code></td><td>Stop the update; transaction rolled back</td></tr>
</table>
<p>Group several with <code>@dp.expect_all</code>, <code>expect_all_or_drop</code>, <code>expect_all_or_fail</code> using a dictionary of name &rarr; condition. Metrics appear in the pipeline UI and the <b>event log</b>.</p>

<h3>Quarantine pattern</h3>
<p>Dropping rows loses them. To keep invalid rows for review, route them to a separate table:</p>
<pre><code>rules = {"valid_id": "order_id IS NOT NULL", "valid_amt": "amount &gt;= 0"}
quarantine_rule = "NOT(" + " AND ".join(rules.values()) + ")"

@dp.table
@dp.expect_all_or_drop(rules)
def orders_clean():
    return spark.readStream.table("orders_bronze")

@dp.table
def orders_quarantine():
    return spark.readStream.table("orders_bronze").filter(quarantine_rule)</code></pre>

<h2>Validation outside pipelines</h2>
<ul>
<li>Filter and split DataFrames into valid/invalid sets and write invalid rows to an error table.</li>
<li>Use <code>_rescued_data</code> from Auto Loader to detect schema drift.</li>
<li>Row counts and reconciliation checks between layers (source vs bronze vs silver).</li>
<li>Assertions in jobs that fail the task (and alert) when thresholds are exceeded.</li>
</ul>

<h2>Data quality monitoring</h2>
<ul>
<li><b>Anomaly detection</b> at schema level checks <b>freshness</b> (table updated as expected?) and <b>completeness</b> (row volume as expected?) automatically.</li>
<li><b>Data profiling</b> (formerly Lakehouse Monitoring) computes metric tables per column over time &ndash; null counts, distinct counts, distributions &ndash; and <b>drift</b> between time windows or against a baseline. Profile types: snapshot, time series, inference.</li>
<li>Results land in metric tables and an auto-generated dashboard; add SQL alerts on them.</li>
</ul>

<h2>Choosing the tool</h2>
<table>
<tr><th>Requirement</th><th>Tool</th></tr>
<tr><td>Never allow negative amounts in the table, from any writer</td><td>CHECK constraint</td></tr>
<tr><td>Drop bad rows in a pipeline and report how many</td><td>Expectation with DROP ROW</td></tr>
<tr><td>Stop the pipeline if critical data is invalid</td><td>Expectation with FAIL UPDATE</td></tr>
<tr><td>Keep bad rows for later inspection</td><td>Quarantine table</td></tr>
<tr><td>Detect gradual drift in distributions</td><td>Data profiling</td></tr>
<tr><td>Alert when a table was not refreshed</td><td>Anomaly detection (freshness) / SQL alert</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>Are primary keys enforced on Delta tables?</summary>
<p>No, they are informational.</p></details>
<details><summary>An expectation with no ON VIOLATION clause finds 10 bad rows. What happens?</summary>
<p>Rows are written; violation metrics are recorded.</p></details>
<details><summary>Adding a CHECK constraint fails. Why?</summary>
<p>Existing rows already violate it.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.constraints}" target="_blank" rel="noopener">Constraints</a></li>
<li><a href="${R.expectations}" target="_blank" rel="noopener">Expectations</a></li>
<li><a href="${R.profile}" target="_blank" rel="noopener">Data profiling / monitoring</a></li></ul>
`);

addChapter(3, '3.9', 'Medallion architecture and data modelling', `
<h2>The medallion layers</h2>
<table>
<tr><th>Layer</th><th>Contents</th><th>Typical operations</th><th>Consumers</th></tr>
<tr><td><b>Bronze</b></td><td>Raw data as ingested, append-only, with ingestion metadata (file, time)</td><td>Auto Loader, Lakeflow Connect, Kafka ingestion; minimal parsing</td><td>Engineers; replay source</td></tr>
<tr><td><b>Silver</b></td><td>Cleaned, typed, deduplicated, conformed, joined entities</td><td>Casting, dedup, MERGE/CDC, quality rules, enrichment</td><td>Engineers, data scientists, analysts</td></tr>
<tr><td><b>Gold</b></td><td>Business-level aggregates and dimensional models</td><td>Aggregations, star schemas, KPIs, materialized views</td><td>BI, dashboards, Genie, ML features</td></tr>
</table>
<ul>
<li>Bronze keeps history so you can rebuild silver/gold after a logic bug.</li>
<li>Keep the transformation from each layer to the next idempotent and incremental.</li>
<li>Store layers in schemas (<code>prod.bronze</code>, <code>prod.silver</code>, <code>prod.gold</code>) or catalogs, and grant consumers mainly gold.</li>
</ul>

<h2>Dimensional modelling in the lakehouse</h2>
<ul>
<li><b>Fact tables</b>: events/measures (orders, clicks) with foreign keys to dimensions. Often large, append-heavy; cluster by date and frequent filter keys.</li>
<li><b>Dimension tables</b>: descriptive attributes (customer, product). SCD1 or SCD2.</li>
<li><b>Surrogate keys</b>: identity columns (<code>GENERATED ALWAYS AS IDENTITY</code>) or deterministic hashes (<code>sha2(concat_ws('|', natural_keys), 256)</code>). Hashes work well in parallel/streaming loads.</li>
<li>Declare PRIMARY KEY/FOREIGN KEY constraints (informational) to help BI tools and the optimiser.</li>
<li>Star schemas are friendly to Power BI and Genie; wide denormalised "one big table" gold views also work well with columnar storage.</li>
</ul>
<pre><code>CREATE TABLE prod.gold.dim_product (
  product_sk BIGINT GENERATED ALWAYS AS IDENTITY,
  product_id STRING NOT NULL,
  name STRING,
  category STRING,
  CONSTRAINT pk_product PRIMARY KEY (product_sk)
);

CREATE TABLE prod.gold.fact_sales (
  sale_id BIGINT,
  date_key INT,
  product_sk BIGINT,
  customer_sk BIGINT,
  qty INT,
  amount DECIMAL(12,2),
  CONSTRAINT fk_prod FOREIGN KEY (product_sk) REFERENCES prod.gold.dim_product
) CLUSTER BY (date_key);</code></pre>

<h2>Handling late and duplicate data</h2>
<ul>
<li>Bronze: accept duplicates; record ingestion metadata.</li>
<li>Silver: dedupe on business key + latest timestamp; use MERGE or AUTO CDC with SEQUENCE BY.</li>
<li>Streaming aggregations: watermarks bound lateness; materialized views recompute correctly.</li>
</ul>

<h2>Choosing object types per layer</h2>
<table>
<tr><th>Layer</th><th>Common object</th></tr>
<tr><td>Bronze</td><td>Streaming table (Auto Loader / Kafka)</td></tr>
<tr><td>Silver</td><td>Streaming table (append/AUTO CDC) or materialized view</td></tr>
<tr><td>Gold</td><td>Materialized view, or tables built by MERGE; views for light reshaping</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>A logic bug corrupted silver data for a month. How does the medallion design help?</summary>
<p>Bronze retains raw history, so silver (and gold) can be rebuilt by reprocessing (full refresh) from bronze.</p></details>
<details><summary>Which layer should analysts normally query?</summary>
<p>Gold.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}lakehouse/medallion" target="_blank" rel="noopener">Medallion architecture</a></li></ul>
`);

addChapter(3, '3.10', 'Table layout and maintenance', `
<p>Query speed on Delta tables depends mostly on <b>how many files must be read</b>. Layout features (clustering, partitioning, file sizing) and maintenance (OPTIMIZE, VACUUM, statistics) keep that number low.</p>

<h2>Data skipping</h2>
<p>Delta stores min/max and null-count statistics per file for the first 32 columns (configurable with <code>delta.dataSkippingNumIndexedCols</code> or <code>delta.dataSkippingStatsColumns</code>). Queries skip files whose ranges cannot match the filter. Layout techniques make those ranges narrow.</p>

<h2>Liquid clustering (recommended)</h2>
<pre><code>CREATE TABLE prod.silver.events (...) CLUSTER BY (event_date, customer_id);
ALTER TABLE prod.silver.events CLUSTER BY (customer_id);   -- change keys, no rewrite needed
ALTER TABLE prod.silver.events CLUSTER BY AUTO;            -- let Databricks choose keys (managed tables)
ALTER TABLE prod.silver.events CLUSTER BY NONE;
OPTIMIZE prod.silver.events;                               -- clusters new data incrementally
OPTIMIZE prod.silver.events FULL;                          -- recluster everything (e.g. after key change)</code></pre>
<ul>
<li>Up to 4 clustering keys; choose columns used most in filters (and joins).</li>
<li>Works well for high-cardinality columns, skewed data, and changing access patterns.</li>
<li>Replaces both partitioning and Z-ORDER for new tables. Cannot be combined with them.</li>
<li>Fewer write conflicts thanks to row-level concurrency.</li>
</ul>

<h2>Partitioning (legacy, still tested)</h2>
<ul>
<li><code>PARTITIONED BY (col)</code> creates a folder per value.</li>
<li>Only for very large tables (roughly over 1 TB) with a low-cardinality column used in nearly every filter, where each partition holds at least ~1 GB.</li>
<li>Over-partitioning (e.g. by customer_id or by timestamp) creates tiny files and slows everything.</li>
<li>Partition keys cannot be changed without rewriting the table.</li>
</ul>

<h2>Z-ORDER</h2>
<pre><code>OPTIMIZE prod.silver.orders ZORDER BY (customer_id);</code></pre>
<p>Co-locates similar values in the same files during OPTIMIZE. Not incremental &ndash; re-running rewrites data. Use on existing non-clustered tables; prefer liquid clustering for new ones.</p>

<h2>OPTIMIZE (compaction)</h2>
<ul>
<li>Compacts small files into larger ones (target around 1 GB, auto-tuned by table size).</li>
<li>Small files come from streaming, frequent small appends and over-partitioning.</li>
<li><b>Optimized writes</b> and <b>auto compaction</b> reduce small files at write time (enabled by default for many operations, configurable with <code>delta.autoOptimize.*</code> properties).</li>
</ul>

<h2>VACUUM</h2>
<pre><code>VACUUM prod.silver.orders;                      -- default retention 7 days
VACUUM prod.silver.orders RETAIN 240 HOURS;
VACUUM prod.silver.orders DRY RUN;              -- list files that would be deleted</code></pre>
<ul>
<li>Deletes data files no longer referenced by the table and older than retention. Saves storage cost.</li>
<li>Limits time travel to the retention window.</li>
<li>Retention below 7 days is blocked by a safety check because it can break long-running readers and streams.</li>
<li>Does not touch the transaction log (log cleanup is automatic based on <code>delta.logRetentionDuration</code>).</li>
</ul>

<h2>Statistics</h2>
<pre><code>ANALYZE TABLE prod.silver.orders COMPUTE STATISTICS FOR ALL COLUMNS;</code></pre>
<p>Collected statistics help the cost-based optimiser choose join strategies.</p>

<h2>Predictive optimization</h2>
<p>For <b>Unity Catalog managed tables</b>, predictive optimization automatically runs OPTIMIZE, VACUUM and ANALYZE when beneficial, and can pick clustering keys with CLUSTER BY AUTO. It is enabled at account, catalog or schema level (on by default for many accounts) and its history is in <code>system.storage.predictive_optimization_operations_history</code>.</p>
<div class="box tip"><b>Exam tip:</b> "Reduce maintenance effort for OPTIMIZE and VACUUM on managed tables" &rarr; predictive optimization. It does not apply to external tables.</div>

<h2>Deletion vectors and purge</h2>
<p>Deletion vectors make DELETE/UPDATE/MERGE fast by marking rows instead of rewriting files. The rows still exist physically until files are rewritten (OPTIMIZE or <code>REORG TABLE ... APPLY (PURGE)</code>) and VACUUM removes the old files.</p>

<h2>Caching</h2>
<ul>
<li><b>Disk cache</b> (automatic on storage-optimised VMs and SQL warehouses): caches remote Parquet data on local SSDs; transparent.</li>
<li><b>Spark cache</b> (<code>df.cache()</code>): stores a DataFrame in memory; useful only when reused many times in one job; remember to <code>unpersist()</code>.</li>
<li>SQL warehouses also have a query result cache.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Queries filter by customer_id (high cardinality) and event_date. New table. Which layout?</summary>
<p>Liquid clustering on (event_date, customer_id).</p></details>
<details><summary>A streaming table has millions of 50 KB files. Fix?</summary>
<p>Run OPTIMIZE (or rely on auto compaction / predictive optimization).</p></details>
<details><summary>After VACUUM, a time travel query to 10 days ago fails. Why?</summary>
<p>VACUUM removed files older than the 7-day retention.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.clustering}" target="_blank" rel="noopener">Liquid clustering</a></li>
<li><a href="${R.optimize}" target="_blank" rel="noopener">OPTIMIZE</a></li>
<li><a href="${R.vacuum}" target="_blank" rel="noopener">VACUUM</a></li>
<li><a href="${R.partitions}" target="_blank" rel="noopener">Partitions</a></li></ul>
`);

addChapter(3, '3.11', 'Domain 3 quick review', `
<h2>Ingestion</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>SaaS / database source, least code</td><td>Lakeflow Connect</td></tr>
<tr><td>Millions of files, incremental, schema drift</td><td>Auto Loader</td></tr>
<tr><td>SQL, idempotent file loads (thousands)</td><td>COPY INTO</td></tr>
<tr><td>Explore files in SQL</td><td><code>read_files()</code></td></tr>
<tr><td>Incremental SQL ingestion</td><td>Streaming table over <code>STREAM read_files()</code></td></tr>
<tr><td>Event Hubs</td><td>Kafka source on port 9093 with SASL_SSL</td></tr>
<tr><td>Track Auto Loader schema</td><td><code>cloudFiles.schemaLocation</code></td></tr>
<tr><td>Keep mismatched values</td><td><code>_rescued_data</code></td></tr>
<tr><td>Huge directory listing slow</td><td>File notification / file events</td></tr>
</table>

<h2>Streaming</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Incremental batch then stop</td><td><code>trigger(availableNow=True)</code></td></tr>
<tr><td>Fixed micro-batch interval</td><td><code>trigger(processingTime=...)</code></td></tr>
<tr><td>Resume after failure</td><td>Checkpoint location</td></tr>
<tr><td>Bound state / late data</td><td>Watermark</td></tr>
<tr><td>MERGE from a stream</td><td><code>foreachBatch</code></td></tr>
<tr><td>Only new rows to sink</td><td>Append mode</td></tr>
<tr><td>Full aggregate each trigger</td><td>Complete mode</td></tr>
<tr><td>Source table has updates</td><td>Change data feed or skipChangeCommits</td></tr>
</table>

<h2>Transformation and Delta</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Latest row per key</td><td>row_number / QUALIFY</td></tr>
<tr><td>Rows with no match</td><td>Left anti join</td></tr>
<tr><td>Small lookup table join</td><td>Broadcast join</td></tr>
<tr><td>Flatten array</td><td>explode / explode_outer</td></tr>
<tr><td>Parse JSON string</td><td>from_json / colon syntax / VARIANT</td></tr>
<tr><td>Upsert</td><td>MERGE INTO</td></tr>
<tr><td>History of attribute changes</td><td>SCD Type 2</td></tr>
<tr><td>Declarative CDC with out-of-order events</td><td>AUTO CDC with SEQUENCE BY</td></tr>
<tr><td>Read only changed rows</td><td>Change data feed</td></tr>
<tr><td>Query older version</td><td>VERSION/TIMESTAMP AS OF</td></tr>
<tr><td>Roll back</td><td>RESTORE TABLE</td></tr>
<tr><td>Add new columns on write</td><td>mergeSchema</td></tr>
<tr><td>Rename/drop columns</td><td>Column mapping</td></tr>
<tr><td>Cheap test copy</td><td>Shallow clone</td></tr>
</table>

<h2>Quality and layout</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Reject invalid writes always</td><td>CHECK / NOT NULL constraint</td></tr>
<tr><td>Track but keep bad rows</td><td>EXPECT (no action)</td></tr>
<tr><td>Drop bad rows</td><td>ON VIOLATION DROP ROW</td></tr>
<tr><td>Stop on bad rows</td><td>ON VIOLATION FAIL UPDATE</td></tr>
<tr><td>Detect drift</td><td>Data profiling</td></tr>
<tr><td>New table layout</td><td>Liquid clustering</td></tr>
<tr><td>Compact small files</td><td>OPTIMIZE</td></tr>
<tr><td>Remove old files</td><td>VACUUM</td></tr>
<tr><td>Automatic maintenance</td><td>Predictive optimization (managed tables)</td></tr>
</table>

<h2>Fifteen-question self test</h2>
<ol>
<li>Default VACUUM retention? <i>7 days.</i></li>
<li>Default log retention? <i>30 days.</i></li>
<li>Are PK constraints enforced? <i>No.</i></li>
<li>Auto Loader default schema evolution mode? <i>addNewColumns.</i></li>
<li>Which mode puts new columns into _rescued_data only? <i>rescue.</i></li>
<li>Can liquid clustering keys be changed without rewriting? <i>Yes.</i></li>
<li>Max liquid clustering keys? <i>4.</i></li>
<li>Can liquid clustering be combined with partitioning? <i>No.</i></li>
<li>Type of DataFrame defining a streaming table in pipelines? <i>Streaming (readStream).</i></li>
<li>CDF change types for update? <i>update_preimage, update_postimage.</i></li>
<li>Kafka value column type? <i>Binary.</i></li>
<li>What causes MERGE to fail with multiple matches? <i>Duplicate source keys.</i></li>
<li>Is COPY INTO idempotent? <i>Yes.</i></li>
<li>Which trigger replaced once? <i>availableNow.</i></li>
<li>Which join keeps left rows with matches but no right columns? <i>Left semi.</i></li>
</ol>
`);
