// Original case studies (fictional companies)
CASES.push({
  id: 'contoso',
  title: 'Contoso Retail',
  sections: {
    Overview: '<p>Contoso Retail operates 400 stores in Europe and North America. It is migrating on-premises SQL Server data warehouses to Azure Databricks. Workspaces exist in West Europe (dev, prod) and East US (prod).</p>',
    'Existing environment': '<ul><li>Point-of-sale (POS) systems drop JSON files every minute into ADLS Gen2 container <code>landing</code> (~2 million files per day).</li><li>Customer master data resides in an Azure SQL Database that changes rarely.</li><li>Finance analysts use Power BI.</li><li>Engineers currently store a storage account key in notebook code.</li></ul>',
    Requirements: '<ul><li>Ingest POS files incrementally with schema evolution; malformed values must not be lost.</li><li>Customer address history must be retained.</li><li>Analysts in a region can see only that region\'s sales rows.</li><li>The <code>card_number</code> column must be masked except for the fraud team.</li><li>No secrets may be stored in code.</li><li>Production jobs must not run as a named user.</li><li>Minimize compute cost for scheduled workloads.</li></ul>'
  },
  questions: [
    { d: 3, q: 'Which ingestion approach should you use for the POS files?', opts: ['Auto Loader with cloudFiles.schemaLocation and rescued data', 'COPY INTO run every minute', 'Lakehouse Federation', 'A daily spark.read.json of the whole container'], ans: [0], exp: 'Auto Loader scales to millions of files, tracks schema evolution, and keeps malformed values in _rescued_data.', ref: 'autoloader' },
    { d: 1, q: 'How should Unity Catalog access the landing container?', opts: ['Access Connector managed identity -> storage credential -> external location', 'Storage account key in a cluster Spark config', 'A mount point created with dbutils.fs.mount', 'A SAS token in a widget'], ans: [0], exp: 'Managed identity-based storage credentials avoid secrets and are governed by Unity Catalog.', ref: 'uc' },
    { d: 1, q: 'How many Unity Catalog metastores are needed?', opts: ['1', '2', '3', '4'], ans: [1], exp: 'One metastore per region: West Europe and East US.', ref: 'uc' },
    { d: 3, q: 'Which approach meets the customer address requirement?', opts: ['AUTO CDC with STORED AS SCD TYPE 2', 'INSERT OVERWRITE nightly', 'SCD Type 1 MERGE', 'Delta time travel only'], ans: [0], exp: 'SCD Type 2 retains history. Time travel is limited by retention and is not a modeling technique.', ref: 'autocdc' },
    { d: 2, q: 'Which TWO features meet the regional and card_number requirements? (Choose two.)', opts: ['Row filter on the sales table', 'Column mask on card_number', 'Delta Sharing', 'Workspace-catalog binding'], ans: [0, 1], exp: 'Row filters restrict rows; column masks obfuscate column values per user/group.', ref: 'filters' },
    { d: 4, q: 'How should production jobs be configured?', opts: ['Run as a service principal on jobs compute', 'Run as the workspace admin on all-purpose compute', 'Run as the job creator on a SQL warehouse', 'Run manually from notebooks'], ans: [0], exp: 'Service principals decouple jobs from people; jobs compute is cheaper than all-purpose compute.', ref: 'jobs' }
  ]
});

CASES.push({
  id: 'fabrikam',
  title: 'Fabrikam Logistics',
  sections: {
    Overview: '<p>Fabrikam Logistics tracks 20,000 delivery vehicles. Telemetry is streamed through Azure Event Hubs. A data engineering team of 12 develops pipelines and releases them through GitHub.</p>',
    'Existing environment': '<ul><li>A Structured Streaming job aggregates telemetry by 5-minute window; state size grows daily.</li><li>A gold table <code>trips_daily</code> (4 TB) is filtered by <code>vehicle_id</code> and later possibly by <code>region</code>.</li><li>Developers manually copy notebooks between workspaces.</li><li>One stage of the nightly job has one task running for an hour while others finish in minutes.</li></ul>',
    Requirements: '<ul><li>Telemetry arriving more than 15 minutes late can be discarded.</li><li>Layout keys of <code>trips_daily</code> must be changeable without rewriting data.</li><li>Deployments to dev/test/prod must be defined as code and automated from GitHub without long-lived secrets.</li><li>Pipeline data quality: records with missing <code>vehicle_id</code> must be dropped and counted.</li><li>Partner company Northwind (also on Azure Databricks with Unity Catalog) must read <code>trips_daily</code>.</li></ul>'
  },
  questions: [
    { d: 3, q: 'What should you add to the streaming aggregation?', opts: ['withWatermark("eventTime", "15 minutes")', 'trigger(availableNow=True)', 'outputMode("complete")', 'A larger driver'], ans: [0], exp: 'A watermark bounds lateness and allows state cleanup.', ref: 'streaming' },
    { d: 3, q: 'How should trips_daily be laid out?', opts: ['Liquid clustering on vehicle_id', 'Partition by vehicle_id', 'Z-ORDER by vehicle_id weekly', 'No layout optimization'], ans: [0], exp: 'Liquid clustering keys can be changed later (e.g. to add region) without rewriting existing data.', ref: 'clustering' },
    { d: 4, q: 'Which TWO items should you use for deployments? (Choose two.)', opts: ['Databricks Asset Bundles with dev/test/prod targets', 'GitHub Actions authenticating as a service principal via workload identity federation', 'Personal access token of a developer stored in the repo', 'Exporting DBC archives manually'], ans: [0, 1], exp: 'Bundles define resources as code; workload identity federation avoids long-lived secrets.', ref: 'bundles' },
    { d: 3, q: 'Which expectation meets the data quality requirement?', opts: ['EXPECT (vehicle_id IS NOT NULL) ON VIOLATION DROP ROW', 'EXPECT (vehicle_id IS NOT NULL)', 'EXPECT (vehicle_id IS NOT NULL) ON VIOLATION FAIL UPDATE', 'A NOT NULL constraint on the target'], ans: [0], exp: 'DROP ROW drops invalid records and records metrics.', ref: 'expectations' },
    { d: 4, q: 'What is the likely cause of the slow nightly stage?', opts: ['Data skew', 'Insufficient driver memory', 'Too many small files', 'Photon disabled'], ans: [0], exp: 'One straggler task among many fast tasks indicates skew.', ref: 'sparkui' },
    { d: 2, q: 'How should you share trips_daily with Northwind?', opts: ['Databricks-to-Databricks Delta Sharing', 'Open sharing with a credential file', 'Copy the table to Northwind storage nightly', 'Create a foreign catalog'], ans: [0], exp: 'Both parties use Unity Catalog, so Databricks-to-Databricks sharing is simplest and secure.', ref: 'sharing' }
  ]
});

CASES.push({
  id: 'woodgrove',
  title: 'Woodgrove Bank',
  sections: {
    Overview: '<p>Woodgrove Bank is building a regulated lakehouse on Azure Databricks for card transactions. Regulators audit data access quarterly.</p>',
    'Existing environment': '<ul><li>Card transactions arrive in Azure Event Hubs (about 20,000 events per second).</li><li>A nightly CDC export from the core banking SQL Server provides customer changes with an operation column (INSERT/UPDATE/DELETE) and a commit timestamp.</li><li>Several hundred tables contain columns tagged as PII by the governance team.</li><li>Data engineers deploy notebooks by copying them between workspaces.</li></ul>',
    Requirements: '<ul><li>Transactions must be available for fraud analytics within one minute.</li><li>The customer dimension must keep full history and handle out-of-order CDC records.</li><li>PII columns must be masked for everyone except the compliance group, including on tables created in the future, with minimal administration.</li><li>Auditors must be able to query who read which tables during the quarter.</li><li>Invalid transactions (NULL card_id) must not reach silver but must be counted.</li><li>Deployments must be repeatable across dev, test and prod and run under non-human identities.</li></ul>'
  },
  questions: [
    { d: 3, q: 'How should transactions be ingested to meet the latency requirement?', opts: ['Structured Streaming from the Event Hubs Kafka endpoint into a streaming table, running continuously', 'A nightly COPY INTO job', 'Lakehouse Federation to Event Hubs', 'An hourly availableNow job'], ans: [0], exp: 'Sub-minute latency requires a continuously running stream; Event Hubs exposes a Kafka endpoint.', ref: 'eventhubs' },
    { d: 3, q: 'How should you build the customer dimension?', opts: ['AUTO CDC with SEQUENCE BY commit timestamp and STORED AS SCD TYPE 2', 'MERGE INTO with SCD Type 1', 'INSERT OVERWRITE nightly', 'A materialized view over the CDC export'], ans: [0], exp: 'AUTO CDC handles ordering via SEQUENCE BY and SCD Type 2 keeps history.', ref: 'autocdc' },
    { d: 2, q: 'How should you meet the PII masking requirement?', opts: ['ABAC policies using governed tags, defined at catalog level', 'A column mask on every PII column, added manually', 'Dynamic views for each table', 'Remove PII columns from all tables'], ans: [0], exp: 'ABAC applies masks to all objects with matching governed tags, including future ones, with central administration.', ref: 'abac' },
    { d: 2, q: 'Which source should auditors query?', opts: ['system.access.audit', 'system.billing.usage', 'DESCRIBE HISTORY on each table', 'The Spark UI'], ans: [0], exp: 'The audit system table records data access events.', ref: 'systables' },
    { d: 3, q: 'Which expectation should the silver transactions table use?', opts: ['EXPECT (card_id IS NOT NULL) ON VIOLATION DROP ROW', 'EXPECT (card_id IS NOT NULL)', 'EXPECT (card_id IS NOT NULL) ON VIOLATION FAIL UPDATE', 'A NOT NULL column constraint'], ans: [0], exp: 'DROP ROW removes invalid rows and records the count in metrics.', ref: 'expectations' },
    { d: 4, q: 'Which TWO items meet the deployment requirement? (Choose two.)', opts: ['Databricks Asset Bundles with dev, test and prod targets', 'run_as set to a service principal in the test and prod targets', 'Copying notebooks with workspace export/import', 'Running jobs as the lead engineer'], ans: [0, 1], exp: 'Bundles give repeatable deployments; service principals remove dependency on people.', ref: 'bundles' }
  ]
});

CASES.push({
  id: 'tailspin',
  title: 'Tailspin Toys',
  sections: {
    Overview: '<p>Tailspin Toys sells online and in 60 stores. A small data team of four engineers manages all analytics on Azure Databricks.</p>',
    'Existing environment': '<ul><li>E-commerce orders land as CSV files in a Unity Catalog volume every 5 minutes.</li><li>A gold table <code>sales_summary</code> is rebuilt nightly with a full overwrite that takes 3 hours.</li><li>All workloads run on one large all-purpose cluster that runs 24/7.</li><li>Analysts use a classic SQL warehouse and complain about slow startup in the morning.</li><li>Last month an engineer ran an UPDATE without a WHERE clause on <code>silver.orders</code>.</li></ul>',
    Requirements: '<ul><li>Reduce compute cost significantly.</li><li>The gold summary must refresh incrementally when possible.</li><li>Analysts must get instant warehouse startup without managing infrastructure.</li><li>Accidental changes must be recoverable for at least 30 days.</li><li>Table maintenance must be automated with minimal effort.</li></ul>'
  },
  questions: [
    { d: 1, q: 'What should you do with the 24/7 all-purpose cluster to reduce cost?', opts: ['Move scheduled workloads to jobs or serverless compute and set auto termination on interactive compute', 'Increase its size', 'Disable autoscaling', 'Create an instance pool with 50 idle instances'], ans: [0], exp: 'Jobs/serverless compute is cheaper for scheduled work; auto termination stops idle interactive compute.', ref: 'compute' },
    { d: 1, q: 'How should you implement the gold summary?', opts: ['A materialized view', 'A standard view', 'A temporary view', 'An external table rebuilt nightly'], ans: [0], exp: 'Materialized views refresh incrementally when possible.', ref: 'mv' },
    { d: 1, q: 'What should analysts use?', opts: ['A serverless SQL warehouse', 'A larger classic SQL warehouse', 'An all-purpose cluster', 'Jobs compute'], ans: [0], exp: 'Serverless SQL warehouses start in seconds and are fully managed.', ref: 'sqlwh' },
    { d: 3, q: 'Which TWO table properties support recovery for 30 days? (Choose two.)', opts: ['delta.logRetentionDuration = \'interval 30 days\'', 'delta.deletedFileRetentionDuration = \'interval 30 days\'', 'delta.enableChangeDataFeed = true', 'delta.appendOnly = true'], ans: [0, 1], exp: 'Time travel and RESTORE need both the log and the data files to be retained.', ref: 'history' },
    { d: 4, q: 'How should table maintenance be automated?', opts: ['Use Unity Catalog managed tables with predictive optimization', 'Schedule OPTIMIZE and VACUUM manually for every table', 'Run VACUUM RETAIN 0 HOURS daily', 'Disable maintenance'], ans: [0], exp: 'Predictive optimization runs maintenance automatically on managed tables.', ref: 'optimize' },
    { d: 3, q: 'How should the CSV orders be ingested from the volume?', opts: ['Auto Loader (or a streaming table with read_files) on a frequent schedule', 'A full reload of all files every 5 minutes', 'Lakehouse Federation', 'Delta Sharing'], ans: [0], exp: 'Auto Loader ingests only new files incrementally.', ref: 'autoloader' }
  ]
});
