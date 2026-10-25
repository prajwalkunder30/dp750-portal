// Exam-style formats: "meets the goal" series, ordering, and hotspot/code completion. All original content.

// ---------- Meets the goal series ----------
addGoal(3, 'Ingestion', 'You have an ADLS Gen2 container that receives about 500,000 new JSON files per day. You need to load only new files into a bronze Delta table incrementally. New source columns must be detected automatically, and management overhead must be minimized.', [
  ['You use Auto Loader with `cloudFiles.format` set to `json` and `cloudFiles.schemaLocation` configured, and run it with a checkpoint.', true, 'Auto Loader tracks processed files in the checkpoint and stores and evolves the schema at the schema location.'],
  ['You schedule a job that runs `spark.read.json()` on the entire container and overwrites the table.', false, 'This reprocesses every file on every run, which is not incremental and becomes slower over time.'],
  ['You create a streaming table in a Lakeflow Declarative Pipeline that reads the container with `STREAM read_files(...)`.', true, 'Streaming tables that use read_files in streaming mode use Auto Loader under the hood and process files incrementally.']
], 'autoloader');

addGoal(2, 'Row & column security', 'Table `hr.core.employees` contains a `salary` column. Only members of the account group `hr-payroll` may see salary values; all other users must see NULL. Analysts must keep querying the table by its existing name.', [
  ['You create a SQL UDF that returns `salary` when `is_account_group_member(\'hr-payroll\')` is true and NULL otherwise, and you apply it with `ALTER TABLE ... ALTER COLUMN salary SET MASK`.', true, 'A column mask is applied to the table itself, so every query against the existing table name is masked.'],
  ['You create a dynamic view that masks salary and grant analysts SELECT on the view.', false, 'Analysts must keep querying the base table name. A view introduces a new object, and analysts with SELECT on the table would still see salaries.'],
  ['You revoke SELECT on the salary column from analysts.', false, 'Unity Catalog does not support column-level GRANT/REVOKE. Use column masks or views.']
], 'filters');

addGoal(1, 'Compute', 'A job runs every 10 minutes on classic jobs compute. Each run spends about 5 minutes waiting for virtual machines to be provisioned. You need to reduce the run start latency.', [
  ['You configure the job cluster to use an instance pool that keeps a minimum number of idle instances.', true, 'Pools keep ready VMs so the cluster starts much faster.'],
  ['You enable Photon on the job cluster.', false, 'Photon speeds query execution but not VM provisioning.'],
  ['You switch the job to serverless jobs compute.', true, 'Serverless compute starts quickly because Databricks manages warm capacity.'],
  ['You increase the maximum number of autoscaling workers.', false, 'More workers do not reduce provisioning time and can increase it.']
], 'pools');

addGoal(3, 'Delta Lake', 'A 2 TB Delta table named `orders` is queried mostly with filters on `customer_id` (high cardinality) and `order_date`. The table contains many small files and queries are slow. You need to improve query performance.', [
  ['You partition the table by `customer_id`.', false, 'Partitioning on a high-cardinality column creates huge numbers of tiny partitions and files.'],
  ['You enable liquid clustering with `CLUSTER BY (customer_id, order_date)` and run `OPTIMIZE`.', true, 'Liquid clustering co-locates data on the filter columns and OPTIMIZE compacts and clusters the files.'],
  ['You run `VACUUM orders RETAIN 0 HOURS`.', false, 'VACUUM deletes unreferenced files; it does not compact files or improve data skipping, and 0 hours breaks time travel and concurrent readers.']
], 'clustering');

addGoal(4, 'Jobs', 'A job with three tasks failed in its final task because of a code defect. The first two tasks ran for 2 hours. You fixed the code. You need to complete the run while minimizing compute cost.', [
  ['You use Repair run to rerun the failed task.', true, 'Repair run reruns only failed tasks and their dependents.'],
  ['You select Run now on the job.', false, 'Run now starts a new run that repeats the two successful 2-hour tasks.'],
  ['You set retries to 3 on the final task.', false, 'Retries apply to future runs and do not complete the existing failed run.']
], 'jobs');

addGoal(2, 'Secrets', 'A notebook connects to an Azure SQL database by using a password. You must ensure the password never appears in notebook source code or cell output.', [
  ['You store the password in Azure Key Vault, create an Azure Key Vault-backed secret scope, and read it with `dbutils.secrets.get()`.', true, 'Secrets are retrieved at runtime and redacted in output.'],
  ['You pass the password through a notebook widget.', false, 'Widget values are visible in the notebook UI and in job parameters.'],
  ['You reference the secret as `{{secrets/<scope>/<key>}}` in the cluster Spark configuration and read the configuration value in the notebook.', true, 'Spark configuration and environment variables can reference secrets by using this syntax, so the value is not stored in plain text.']
], 'secrets');

addGoal(4, 'CI/CD', 'You must deploy the same job definitions to dev and prod workspaces from GitHub Actions. Cluster sizes differ per environment. Deployments must be defined as code.', [
  ['You use Databricks Asset Bundles with dev and prod targets that override cluster settings, and run `databricks bundle deploy -t <target>` in the workflow.', true, 'Bundles define resources as code and support per-target overrides.'],
  ['You export the job JSON from the dev UI and import it manually into prod.', false, 'Manual export/import is not automated deployment as code.'],
  ['You create a Git folder in the prod workspace and pull the main branch.', false, 'Pulling code into a Git folder does not create or update job definitions.']
], 'bundles');

addGoal(3, 'Streaming', 'A Structured Streaming query aggregates IoT events into 10-minute event-time windows. State size grows without bound. Events can arrive up to 30 minutes late and later events can be discarded.', [
  ['You add `withWatermark("event_time", "30 minutes")` before the windowed `groupBy`.', true, 'The watermark bounds lateness so Spark can drop old window state.'],
  ['You change the trigger to `availableNow=True`.', false, 'Triggers control when batches run, not how long state is kept.'],
  ['You increase `spark.sql.shuffle.partitions`.', false, 'This spreads the state across more partitions but does not bound it.']
], 'streaming');

addGoal(2, 'Delta Sharing', 'You need to share table `sales.gold.revenue` with a partner that uses Microsoft Power BI and pandas but has no Databricks account. The partner must read the live data without you copying it.', [
  ['You create a recipient for open sharing, add the table to a share, grant the recipient access, and send the activation link.', true, 'Open sharing works with any client that supports the Delta Sharing protocol.'],
  ['You create a Databricks-to-Databricks recipient by using the partner\'s sharing identifier.', false, 'The partner has no Unity Catalog metastore, so there is no sharing identifier.'],
  ['You grant SELECT on the table to the partner\'s email address.', false, 'External users without an identity in your account cannot be granted privileges.']
], 'sharing');

addGoal(4, 'Monitoring', 'A nightly job slowed from 20 to 90 minutes. In the Spark UI, one stage shows 199 tasks finishing in about 1 minute and 1 task running for 70 minutes. You need to reduce the run time.', [
  ['You make sure Adaptive Query Execution is enabled so skew join optimization can split the oversized partition.', true, 'AQE detects skewed partitions in sort-merge joins and splits them.'],
  ['You add more workers to the cluster.', false, 'One straggler task runs on one core; more workers do not help it.'],
  ['You salt the skewed join key so its rows are spread across multiple partitions.', true, 'Salting distributes the hot key across partitions.']
], 'sparkui');

// ---------- Ordering ----------
addOrder(1, 'Unity Catalog', 'You need to let data engineers create Unity Catalog external tables over an ADLS Gen2 container without storing any secrets. Which five actions should you perform in sequence?',
  ['Create an Access Connector for Azure Databricks', 'Assign the access connector\'s managed identity the Storage Blob Data Contributor role on the storage account', 'Create a storage credential that uses the access connector', 'Create an external location for the container path', 'Grant CREATE EXTERNAL TABLE on the external location to the engineers'],
  ['Mount the container by using dbutils.fs.mount', 'Generate a SAS token for the container'],
  'The identity must exist and have storage access before the credential is created; the external location needs the credential; privileges are granted on the location last.', 'uc');

addOrder(3, 'Delta Lake', 'An incorrect UPDATE corrupted table `main.sales.orders`. You need to return the table to its previous state. Which four actions should you perform in sequence?',
  ['Run DESCRIBE HISTORY main.sales.orders', 'Identify the version before the UPDATE operation', 'Query the table with VERSION AS OF to confirm the data is correct', 'Run RESTORE TABLE main.sales.orders TO VERSION AS OF <version>'],
  ['Run VACUUM main.sales.orders', 'Run OPTIMIZE main.sales.orders'],
  'Find the version in history, validate it with time travel, then restore. VACUUM can delete the files needed for restore.', 'history');

addOrder(3, 'Medallion', 'You are designing a medallion pipeline for point-of-sale data. Which four stages should you implement in sequence?',
  ['Ingest raw files incrementally into a bronze streaming table', 'Cleanse, validate and deduplicate records into a silver table', 'Aggregate daily sales by store into a gold materialized view', 'Serve the gold data to Power BI through a SQL warehouse'],
  ['Run VACUUM on the landing container', 'Create a Delta Sharing recipient for bronze'],
  'Bronze holds raw data, silver holds cleansed data, gold holds business aggregates that are then served.', 'ldp');

addOrder(1, 'Unity Catalog', 'Analysts must query tables in an Azure SQL database from Azure Databricks without copying data. Which four actions should you perform in sequence?',
  ['Store the database credentials in a secret scope', 'Create a connection of type sqlserver that references the secrets', 'Create a foreign catalog that uses the connection', 'Grant USE CATALOG, USE SCHEMA and SELECT on the foreign catalog to analysts'],
  ['Create a Lakeflow Connect ingestion pipeline', 'Create a Delta Sharing provider'],
  'Lakehouse Federation requires a connection, then a foreign catalog, then grants.', 'federation');

addOrder(2, 'Secrets', 'A notebook must read a database password stored in Azure Key Vault. Which four actions should you perform in sequence?',
  ['Add the password as a secret in Azure Key Vault', 'Create an Azure Key Vault-backed secret scope in Azure Databricks', 'Grant the data engineering group READ permission on the secret scope', 'Call dbutils.secrets.get(scope, key) in the notebook'],
  ['Write the password to a notebook widget', 'Run databricks secrets put-secret against the Key Vault-backed scope'],
  'The secret must exist in Key Vault before the scope can expose it. Key Vault-backed scopes are read-only from Databricks, so put-secret is not used.', 'secrets');

addOrder(3, 'Transform', 'You must implement an SCD Type 2 customer dimension from a CDC feed in a Lakeflow Declarative Pipeline. Which four actions should you perform in sequence?',
  ['Ingest the CDC feed into a bronze streaming table', 'Create the target streaming table dim_customer', 'Create an AUTO CDC flow into dim_customer with KEYS, SEQUENCE BY and STORED AS SCD TYPE 2', 'Run a pipeline update'],
  ['Create a materialized view with MERGE INTO', 'Run OPTIMIZE ZORDER BY customer_id'],
  'AUTO CDC writes into an existing target streaming table and runs when the pipeline updates.', 'autocdc');

addOrder(3, 'Delta Lake', 'Downstream consumers must read only rows that changed in `silver.orders`. Which three actions should you perform in sequence?',
  ['Set delta.enableChangeDataFeed = true on silver.orders', 'Let upstream jobs write inserts, updates and deletes to silver.orders', 'Query table_changes(\'silver.orders\', <start_version>)'],
  ['Run VACUUM on silver.orders', 'Enable deletion vectors'],
  'Change data feed only records changes made after it is enabled.', 'cdf');

addOrder(4, 'CI/CD', 'A GitHub Actions workflow deploys and tests a Databricks Asset Bundle in the test environment. Which three commands should run in sequence?',
  ['databricks bundle validate -t test', 'databricks bundle deploy -t test', 'databricks bundle run -t test integration_tests'],
  ['databricks bundle destroy -t test', 'databricks bundle init'],
  'Validate configuration, deploy the resources, then run the test job. init creates a new project; destroy removes resources.', 'bundles');

addOrder(4, 'CI/CD', 'A developer adds a feature by using Databricks Git folders. Which five actions should be performed in sequence?',
  ['Create a Git folder by cloning the remote repository', 'Create a feature branch', 'Commit and push changes to the feature branch', 'Open a pull request to the main branch and get it reviewed', 'Let the CI/CD pipeline deploy the main branch to production'],
  ['Edit notebooks directly in the production workspace', 'Export the notebooks as DBC archives'],
  'This is the standard Git-based workflow: branch, commit, review, then automated deployment.', 'repos');

addOrder(1, 'Unity Catalog', 'You need to set up a new governed area for the finance team with a dedicated managed storage location. Which four actions should you perform in sequence?',
  ['Create an external location for the finance container', 'Create the catalog finance with MANAGED LOCATION pointing to the container', 'Create the schema finance.reporting', 'Grant USE CATALOG, USE SCHEMA and CREATE TABLE to the finance engineers group'],
  ['Attach a new metastore to the workspace', 'Create a mount point for the container'],
  'The managed location must be covered by an external location before the catalog uses it; schemas live inside catalogs; grants come last.', 'uc');

addOrder(4, 'Monitoring', 'A scheduled job has become slow. Which four troubleshooting actions should you perform in sequence?',
  ['Open the job run and identify the slowest task', 'Open the Spark UI for that task and find the longest stage', 'Inspect task durations, shuffle sizes and spill for the stage', 'Apply a targeted fix such as handling skew or increasing memory, and rerun'],
  ['Delete the job and recreate it', 'Run VACUUM on all tables'],
  'Narrow down from run to task to stage to task metrics before changing anything.', 'sparkui');

// ---------- Hotspot / code completion ----------
addHot(3, 'Ingestion', 'You need to ingest new JSON files incrementally, infer and track the schema, and stop after all currently available files are processed. Complete the code.',
`df = (spark.readStream
  .format("{0}")
  .option("cloudFiles.format", "json")
  .option("{1}", "/Volumes/main/bronze/chk/pos_schema")
  .load("abfss://landing@contoso.dfs.core.windows.net/pos/"))

(df.writeStream
  .option("checkpointLocation", "/Volumes/main/bronze/chk/pos")
  .trigger({2})
  .toTable("main.bronze.pos"))`,
  [['json', 'cloudFiles', 'delta', 'autoloader'], ['cloudFiles.schemaLocation', 'cloudFiles.inferColumnTypes', 'mergeSchema', 'checkpointLocation'], ['availableNow=True', 'processingTime="0 seconds"', 'continuous="1 second"', 'once=False']],
  [1, 0, 0], 'Auto Loader uses format cloudFiles; schemaLocation stores the inferred schema; availableNow processes all available data and stops.', 'autoloader');

addHot(3, 'Transform', 'You need to update existing customers, insert new customers, and delete target customers that no longer exist in the source. Complete the statement.',
`MERGE INTO silver.customers AS t
USING staged_customers AS s
ON t.customer_id = s.customer_id
WHEN {0} THEN UPDATE SET *
WHEN {1} THEN INSERT *
WHEN {2} THEN DELETE`,
  [['MATCHED', 'NOT MATCHED', 'NOT MATCHED BY SOURCE'], ['MATCHED', 'NOT MATCHED', 'NOT MATCHED BY SOURCE'], ['MATCHED', 'NOT MATCHED', 'NOT MATCHED BY SOURCE']],
  [0, 1, 2], 'WHEN MATCHED updates, WHEN NOT MATCHED inserts source rows, WHEN NOT MATCHED BY SOURCE acts on target rows missing in the source.', 'merge');

addHot(2, 'Privileges', 'The analysts group must read all current and future tables in schema sales.gold, following least privilege. Complete the statements.',
`GRANT {0} ON CATALOG sales TO \`analysts\`;
GRANT {1} ON SCHEMA sales.gold TO \`analysts\`;
GRANT {2} ON SCHEMA sales.gold TO \`analysts\`;`,
  [['USE CATALOG', 'BROWSE', 'ALL PRIVILEGES', 'SELECT'], ['USE SCHEMA', 'CREATE TABLE', 'MODIFY', 'MANAGE'], ['SELECT', 'MODIFY', 'READ FILES', 'EXECUTE']],
  [0, 0, 0], 'USE CATALOG and USE SCHEMA are needed to traverse; SELECT on the schema is inherited by current and future tables.', 'privs');

addHot(2, 'Row & column security', 'Members of the admins group must see all rows; everyone else may see only rows where region is EU. Complete the code.',
`CREATE FUNCTION sales.sec.region_filter(region STRING)
RETURN {0}('admins') OR region = 'EU';

ALTER TABLE sales.gold.orders SET {1} sales.sec.region_filter ON ({2});`,
  [['is_account_group_member', 'current_user', 'session_user'], ['ROW FILTER', 'MASK', 'CONSTRAINT'], ['region', 'order_id', '*']],
  [0, 0, 0], 'Row filters are boolean UDFs applied with SET ROW FILTER ... ON (column list).', 'filters');

addHot(2, 'Row & column security', 'Only the payroll group may see salary values; others must see NULL. Complete the code.',
`CREATE FUNCTION hr.sec.mask_salary(salary DECIMAL(10,2))
RETURN CASE WHEN is_account_group_member('payroll') THEN salary ELSE {0} END;

ALTER TABLE hr.core.employees ALTER COLUMN salary SET {1} hr.sec.mask_salary;`,
  [['NULL', 'salary', '0 - salary'], ['MASK', 'ROW FILTER', 'TAGS']],
  [0, 0], 'A column mask returns the real or masked value; SET MASK attaches it to the column.', 'filters');

addHot(3, 'Delta Lake', 'You need to find the version before a bad update, verify its data, and restore it. Complete the statements.',
`DESCRIBE {0} main.sales.orders;

SELECT * FROM main.sales.orders {1} 41;

RESTORE TABLE main.sales.orders TO {2} 41;`,
  [['HISTORY', 'DETAIL', 'EXTENDED'], ['VERSION AS OF', 'AT VERSION', 'SNAPSHOT'], ['VERSION AS OF', 'SNAPSHOT', 'CHECKPOINT']],
  [0, 0, 0], 'DESCRIBE HISTORY lists versions; VERSION AS OF is used for both time travel queries and RESTORE.', 'history');

addHot(3, 'Data quality', 'Rows with a NULL order_id must be removed; rows with a non-positive amount must be kept but tracked in metrics. Complete the pipeline definition.',
`CREATE OR REFRESH STREAMING TABLE silver_orders (
  CONSTRAINT valid_id  EXPECT (order_id IS NOT NULL) ON VIOLATION {0},
  CONSTRAINT valid_amt EXPECT (amount > 0)
)
AS SELECT * FROM {1}(bronze_orders);`,
  [['DROP ROW', 'FAIL UPDATE', 'QUARANTINE'], ['STREAM', 'TABLE', 'LIVE']],
  [0, 0], 'DROP ROW discards invalid rows; an expectation with no action keeps rows and records metrics. Streaming tables read sources with STREAM().', 'expectations');

addHot(3, 'Transform', 'You must build an SCD Type 2 dimension from CDC events that can arrive out of order. Complete the flow.',
`CREATE OR REFRESH STREAMING TABLE dim_customer;

CREATE FLOW customer_flow AS AUTO CDC INTO dim_customer
FROM STREAM(customers_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
{0} BY event_ts
STORED AS SCD TYPE {1};`,
  [['SEQUENCE', 'ORDER', 'PARTITION'], ['2', '1', '0']],
  [0, 0], 'SEQUENCE BY orders events; SCD TYPE 2 keeps history.', 'autocdc');

addHot(3, 'Delta Lake', 'Consumers need the new values of updated rows in silver.orders since version 5. Complete the statements.',
`ALTER TABLE silver.orders SET TBLPROPERTIES (delta.{0} = true);

SELECT * FROM {1}('silver.orders', 5)
WHERE _change_type = '{2}';`,
  [['enableChangeDataFeed', 'enableDeletionVectors', 'appendOnly'], ['table_changes', 'table_history', 'read_changes'], ['update_postimage', 'update_preimage', 'insert']],
  [0, 0, 0], 'Change data feed exposes update_preimage (old) and update_postimage (new) rows through table_changes().', 'cdf');

addHot(3, 'Streaming', 'Count events per device in 10-minute windows. Data more than 30 minutes late may be dropped, and each window should be written once when it is final. Complete the code.',
`(events
  .{0}("event_time", "30 minutes")
  .groupBy({1}("event_time", "10 minutes"), "device_id")
  .count()
  .writeStream
  .outputMode("{2}")
  .option("checkpointLocation", chk)
  .toTable("gold.device_counts"))`,
  [['withWatermark', 'dropDuplicates', 'withColumn'], ['window', 'date_trunc', 'lag'], ['append', 'complete', 'update']],
  [0, 0, 0], 'With a watermark, append mode emits each window once after the watermark passes its end.', 'streaming');

addHot(4, 'CI/CD', 'Development deployments must prefix resource names with the user name and pause schedules; production must enforce production rules. Complete databricks.yml.',
`bundle:
  name: sales_etl

targets:
  dev:
    mode: {0}
    default: true
    workspace:
      host: https://adb-1111.11.azuredatabricks.net
  prod:
    mode: {1}
    workspace:
      host: https://adb-2222.22.azuredatabricks.net`,
  [['development', 'production', 'staging'], ['development', 'production', 'release']],
  [0, 1], 'Bundles support mode: development and mode: production.', 'bundles');

addHot(4, 'Jobs', 'Task ingest must pass its row count to task validate in the same job run. Complete the code.',
`# Task: ingest
dbutils.jobs.taskValues.{0}(key="row_count", value=cnt)

# Task: validate
n = dbutils.jobs.taskValues.{1}(taskKey="{2}", key="row_count", default=0)`,
  [['set', 'put', 'write'], ['get', 'read', 'fetch'], ['ingest', 'validate', 'row_count']],
  [0, 0, 0], 'taskValues.set stores a value; taskValues.get reads it by upstream task key.', 'jobs');

addHot(2, 'Secrets', 'Complete the code to read a secret in Python and in SQL.',
`# Python
pwd = dbutils.{0}.get(scope="kv-prod", key="sql-password")

-- SQL
SELECT {1}('kv-prod', 'sql-password');`,
  [['secrets', 'widgets', 'credentials'], ['secret', 'get_secret', 'read_secret']],
  [0, 0], 'Use dbutils.secrets.get in notebooks and the secret() function in SQL.', 'secrets');

addHot(3, 'Delta Lake', 'Create a table clustered by customer_id and order_date, later change the clustering key to region, then recluster the data. Complete the statements.',
`CREATE TABLE main.sales.orders (order_id BIGINT, customer_id BIGINT, order_date DATE, region STRING)
{0} (customer_id, order_date);

ALTER TABLE main.sales.orders {1} (region);

{2} main.sales.orders;`,
  [['CLUSTER BY', 'PARTITIONED BY', 'ZORDER BY'], ['CLUSTER BY', 'PARTITIONED BY', 'ZORDER BY'], ['OPTIMIZE', 'VACUUM', 'ANALYZE TABLE']],
  [0, 0, 0], 'Liquid clustering keys are set with CLUSTER BY and changed with ALTER TABLE ... CLUSTER BY; OPTIMIZE clusters data.', 'clustering');

addHot(1, 'Unity Catalog', 'Complete the statements to query an Azure SQL database through Lakehouse Federation.',
`CREATE CONNECTION sqldb_conn TYPE {0}
OPTIONS (
  host 'contoso.database.windows.net', port '1433',
  user secret('kv', 'sql-user'), password secret('kv', 'sql-password'));

CREATE {1} CATALOG sqldb USING CONNECTION sqldb_conn OPTIONS (database 'sales');`,
  [['sqlserver', 'jdbc', 'azuresql'], ['FOREIGN', 'EXTERNAL', 'SHARED']],
  [0, 0], 'Azure SQL uses connection type sqlserver; a foreign catalog mirrors the database.', 'federation');
