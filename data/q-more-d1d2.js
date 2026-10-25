// Additional exam-style scenario questions - Domains 1 and 2 (original content)

// ---------- Domain 1 ----------
addQ(1, 'Compute', 'Users must not create unrestricted clusters, but must still be able to create compute that follows the "DataEng" policy. What should you do?',
  ['Remove the Unrestricted cluster creation entitlement and grant CAN USE on the DataEng policy', 'Grant CAN MANAGE on all clusters', 'Remove all users from the workspace users group', 'Create an Azure Policy that denies VM creation'],
  0, 'Without the unrestricted entitlement, users can create compute only with policies they have CAN USE on.', 'policies');

addQ(1, 'Compute', 'Which built-in compute policy lets any workspace user create a single-node, dedicated compute resource by default?',
  ['Personal Compute', 'Shared Compute', 'Job Compute', 'Power User Compute'],
  0, 'The Personal Compute policy lets users create single-node compute for their own use.', 'policies');

addQ(1, 'Compute', 'A serverless SQL warehouse serves 200 dashboard users. At peak, queries wait in the queue, but each query runs quickly once started. What should you change?',
  ['Increase the maximum number of clusters (scaling)', 'Increase the cluster size (T-shirt size)', 'Enable Photon', 'Switch to a classic warehouse'],
  0, 'Queuing under concurrency is solved by scaling out with more clusters. A larger size helps individual complex queries.', 'sqlwh');

addQ(1, 'Compute', 'A single complex query on a SQL warehouse takes 20 minutes. There is no queuing. What is most likely to reduce its duration?',
  ['Increase the warehouse cluster size', 'Increase the maximum number of clusters', 'Lower the auto stop time', 'Enable query result caching only'],
  0, 'A larger cluster size provides more compute for each individual query.', 'sqlwh');

addQ(1, 'Compute', 'Which feature is NOT supported on serverless compute for notebooks and jobs?',
  ['Init scripts', 'Notebook-scoped %pip installs', 'Unity Catalog tables', 'Python and SQL'],
  0, 'Serverless compute does not support init scripts; dependencies are added through the environment or %pip.', 'serverless');

addQ(1, 'Compute', 'You need driver and executor logs from a job cluster to remain available after the cluster terminates. What should you configure?',
  ['Cluster log delivery to a storage destination', 'Auto termination', 'An instance pool', 'The Spark UI retention setting'],
  0, 'Compute log delivery writes driver, worker and event logs to a destination you choose.', 'compute');

addQ(1, 'Compute', 'Every notebook on a cluster must use spark.sql.shuffle.partitions = 64 without code changes. What should you configure?',
  ['The Spark configuration of the cluster', 'A notebook widget', 'A table property', 'The SQL warehouse configuration'],
  0, 'Spark properties set in the cluster configuration apply to all sessions on the cluster.', 'compute');

addQ(1, 'Compute', 'Your finance team needs Azure Cost Management reports per department for Azure Databricks VMs. What should you do?',
  ['Apply custom tags to compute, enforced with a compute policy', 'Create a separate metastore per department', 'Use Delta Sharing', 'Enable Photon'],
  0, 'Custom tags propagate to the Azure resources and usage records; policies can enforce them.', 'policies');

addQ(1, 'Compute', 'A notebook calls `df.toPandas()` on a 40 GB DataFrame and the driver crashes with out-of-memory. What is the best fix?',
  ['Avoid collecting large data to the driver; aggregate or write results with Spark instead', 'Add more workers', 'Enable Photon', 'Increase spark.sql.shuffle.partitions'],
  0, 'toPandas() and collect() bring all data to the driver. Keep large processing distributed.', 'compute');

addQ(1, 'Unity Catalog', 'You must upgrade an external Hive metastore table to Unity Catalog while keeping the data files in place. Which command should you use?',
  ['SYNC TABLE', 'DEEP CLONE', 'CONVERT TO DELTA', 'COPY INTO'],
  0, 'SYNC upgrades external tables from the Hive metastore to Unity Catalog external tables without moving data.', 'uc');

addQ(1, 'Unity Catalog', 'Managed tables in catalog finance must store their data in a specific ADLS Gen2 container. What should you do?',
  ['Specify MANAGED LOCATION when creating the catalog', 'Specify LOCATION on every table', 'Create a mount point', 'Set a cluster Spark configuration'],
  0, 'A catalog (or schema) managed location determines where managed table data is stored.', 'uc');

addQ(1, 'Unity Catalog', 'You need a SQL query that lists every table and its type in catalog sales. Which object should you query?',
  ['sales.information_schema.tables', 'system.billing.usage', 'DESCRIBE HISTORY sales', 'sales.default.tables'],
  0, 'Each catalog exposes an information_schema with tables, columns and privileges.', 'uc');

addQ(1, 'Unity Catalog', 'How should a notebook read file data.csv from volume landing in schema main.raw?',
  ['spark.read.csv("/Volumes/main/raw/landing/data.csv")', 'spark.read.csv("dbfs:/mnt/landing/data.csv")', 'spark.read.csv("main.raw.landing.data.csv")', 'spark.read.table("main.raw.landing")'],
  0, 'Volumes are accessed with paths of the form /Volumes/<catalog>/<schema>/<volume>/<path>.', 'volumes');

addQ(1, 'Unity Catalog', 'You run CREATE TABLE main.sales.orders (id INT) with no LOCATION clause. What type of table is created?',
  ['Managed Delta table', 'External table', 'Hive table', 'Temporary view'],
  0, 'Without LOCATION, Unity Catalog creates a managed table, Delta by default.', 'tables');

addQ(1, 'Unity Catalog', 'A materialized view must be refreshed immediately after an upstream correction. What should you run?',
  ['REFRESH MATERIALIZED VIEW <name>', 'OPTIMIZE <name>', 'MSCK REPAIR TABLE <name>', 'VACUUM <name>'],
  0, 'REFRESH MATERIALIZED VIEW triggers an on-demand refresh.', 'mv');

addQ(1, 'Unity Catalog', 'Two notebooks attached to the same cluster must share an intermediate result without writing a table. What should you create?',
  ['A global temporary view and query it from global_temp', 'A temporary view', 'A managed volume', 'A Delta Sharing share'],
  0, 'Global temporary views are visible to all sessions on the same cluster through the global_temp schema.', 'views');

addQ(1, 'Unity Catalog', 'Which TWO statements about Unity Catalog views are correct? (Choose two.)',
  ['A view can reference tables in different catalogs in the same metastore', 'Users need SELECT on the view, not necessarily on the underlying tables', 'A view stores a copy of the data', 'Views can only be created on external tables'],
  [0, 1], 'Views can span catalogs. Unity Catalog checks the view owner\'s access to the underlying tables, so readers need only SELECT on the view (plus USE CATALOG/SCHEMA).', 'views');

addQ(1, 'Compute', 'A team needs to choose an Azure Databricks Runtime for a production pipeline that must stay stable for a long period. What should they choose?',
  ['The latest LTS runtime', 'The latest beta runtime', 'Any runtime, because all are supported forever', 'The ML runtime'],
  0, 'Long Term Support runtimes receive extended support and are recommended for production.', 'compute');

addQ(1, 'Compute', 'Worker nodes of a long batch job are frequently evicted and the job slows down. The cluster uses Azure spot instances. What should you change?',
  ['Use on-demand instances, or enable fallback to on-demand for workers', 'Disable auto termination', 'Enable Photon', 'Reduce the number of shuffle partitions'],
  0, 'Spot VMs can be evicted; using on-demand capacity improves reliability.', 'compute');

addQ(1, 'Unity Catalog', 'A data engineer needs to explore table metadata, sample data, lineage and permissions in the UI. What should they use?',
  ['Catalog Explorer', 'The Spark UI', 'The cluster event log', 'Azure Storage Explorer'],
  0, 'Catalog Explorer shows schemas, details, samples, lineage and permissions for Unity Catalog objects.', 'uc');

// ---------- Domain 2 ----------
addQ(2, 'Privileges', 'The owner of table finance.gold.budget is leaving the company. Ownership must move to the finance-admins group. What should you run?',
  ['ALTER TABLE finance.gold.budget OWNER TO `finance-admins`', 'GRANT OWNERSHIP TO `finance-admins`', 'GRANT ALL PRIVILEGES ON TABLE finance.gold.budget TO `finance-admins`', 'DROP and recreate the table'],
  0, 'ALTER <object> OWNER TO transfers ownership. Making a group the owner avoids single-person dependencies.', 'privs');

addQ(2, 'Privileges', 'An auditor asks which principals have access to table sales.gold.revenue. Which statement should you run?',
  ['SHOW GRANTS ON TABLE sales.gold.revenue', 'DESCRIBE HISTORY sales.gold.revenue', 'DESCRIBE DETAIL sales.gold.revenue', 'SHOW TBLPROPERTIES sales.gold.revenue'],
  0, 'SHOW GRANTS lists privileges granted on an object.', 'privs');

addQ(2, 'Privileges', 'The analysts group has SELECT on schema sales.gold. One user in the group must not read table sales.gold.payroll. What should you do?',
  ['Restructure grants, for example grant SELECT per table or move payroll to another schema, because Unity Catalog has no DENY', 'Run DENY SELECT ON TABLE sales.gold.payroll TO the user', 'Revoke USE CATALOG from the user only', 'Add a CHECK constraint'],
  0, 'Unity Catalog privileges are additive; there is no DENY. Adjust grants or object placement.', 'privs');

addQ(2, 'Identity', 'You want to set a job to run as service principal sp-etl. What must you have on that service principal?',
  ['The Service Principal User role', 'Workspace admin rights only', 'CAN VIEW on the job', 'The Contributor role on the Azure subscription'],
  0, 'Setting Run as to a service principal requires the Service Principal User role on it (or being an admin).', 'jobs');

addQ(2, 'Identity', 'A CI pipeline must authenticate to Azure Databricks. Which method is recommended?',
  ['OAuth machine-to-machine with a service principal', 'A personal access token of an admin', 'A shared username and password', 'An anonymous token'],
  0, 'Use service principals with OAuth (or Microsoft Entra tokens) for automation.', 'cli');

addQ(2, 'Identity', 'All workspace users must use multi-factor authentication when signing in. What should you configure?',
  ['Microsoft Entra Conditional Access', 'A compute policy', 'A secret scope', 'IP access lists only'],
  0, 'Azure Databricks uses Microsoft Entra ID, so Conditional Access policies can require MFA.', 'uc');

addQ(2, 'Discovery', 'A user must add tags to tables in schema sales.gold. Which privilege is specifically required to set tags?',
  ['APPLY TAG', 'MODIFY', 'MANAGE', 'BROWSE'],
  0, 'APPLY TAG allows adding and editing tags on an object (along with USE CATALOG/USE SCHEMA).', 'privs');

addQ(2, 'Lineage & audit', 'You need to analyze column-level lineage with SQL. Which system table should you query?',
  ['system.access.column_lineage', 'system.billing.usage', 'system.compute.clusters', 'system.query.history'],
  0, 'system.access.column_lineage records column-level lineage events.', 'lineage');

addQ(2, 'Lineage & audit', 'Security requires audit logs to include the text of every notebook command that runs. What should you enable?',
  ['Verbose audit logs', 'Cluster log delivery', 'Change data feed', 'Query history only'],
  0, 'Verbose audit logs add notebook command and SQL query text events.', 'audit');

addQ(2, 'Delta Sharing', 'A Databricks recipient must be able to time travel and read the change data feed of a shared table. How should you add the table to the share?',
  ['ALTER SHARE s ADD TABLE t WITH HISTORY', 'ALTER SHARE s ADD TABLE t AS VIEW', 'GRANT SELECT ON TABLE t TO RECIPIENT r', 'Enable deletion vectors'],
  0, 'Sharing WITH HISTORY allows recipients to use time travel and read the change data feed (when enabled on the table).', 'sharing');

addQ(2, 'Delta Sharing', 'A recipient must see only EU rows of a shared table. What should you share?',
  ['A view that filters to EU rows (or a partition subset)', 'The full table and ask the recipient to filter', 'A storage SAS token', 'A secret scope'],
  0, 'Shares can include views or partition specifications to limit the data exposed.', 'sharing');

addQ(2, 'Delta Sharing', 'You are the recipient of a Databricks-to-Databricks share. How do you make the shared data queryable?',
  ['CREATE CATALOG ... USING SHARE <provider>.<share>', 'CREATE CONNECTION ... TYPE share', 'Mount the provider storage', 'COPY INTO from the provider'],
  0, 'A recipient creates a catalog from the share and grants access to it like any catalog.', 'sharing');

addQ(2, 'Secrets', 'A developer runs databricks secrets put-secret against an Azure Key Vault-backed scope and it fails. What should they do?',
  ['Add or update the secret in Azure Key Vault itself', 'Switch to a personal access token', 'Restart the cluster', 'Grant MANAGE on the catalog'],
  0, 'Key Vault-backed scopes are read-only from Databricks; manage secrets in Key Vault.', 'secrets');

addQ(2, 'Secrets', 'The data-engineers group must read secrets in scope etl-scope but not change them. Which permission should you grant on the scope?',
  ['READ', 'WRITE', 'MANAGE', 'OWNER'],
  0, 'Secret ACLs support READ, WRITE and MANAGE. READ allows reading secrets only.', 'secrets');

addQ(2, 'Row & column security', 'You apply a column mask to an INT column. Which requirement must the mask function satisfy?',
  ['Its return type must be compatible with the column type', 'It must return BOOLEAN', 'It must be written in Scala', 'It must be a Python UDF'],
  0, 'Column mask functions return the value shown for the column, so the type must match. Row filters return BOOLEAN.', 'filters');

addQ(2, 'Row & column security', 'Each salesperson should see only their own rows, identified by the email in column owner_email. Which predicate should a dynamic view use?',
  ['owner_email = current_user()', 'is_account_group_member(owner_email)', 'owner_email IS NOT NULL', 'current_catalog() = owner_email'],
  0, 'current_user() returns the email of the user running the query.', 'views');

addQ(2, 'Network', 'The ADLS Gen2 account used by Unity Catalog has its firewall enabled. Unity Catalog access through the access connector fails. What should you configure on the storage account?',
  ['A resource instance rule (or trusted access) that allows the Access Connector for Azure Databricks', 'A public IP allow rule for 0.0.0.0/0', 'A SAS token', 'Disable hierarchical namespace'],
  0, 'Allow the access connector resource instance through the storage firewall.', 'uc');

addQ(2, 'Network', 'Notebooks and query results stored in the control plane must be encrypted with your own key in Azure Key Vault. What should you configure?',
  ['Customer-managed keys for managed services', 'Customer-managed keys for DBFS root only', 'Secret scopes', 'Private Link only'],
  0, 'Customer-managed keys for managed services encrypt notebooks, secrets and query results in the control plane.', 'kv');

addQ(2, 'Privileges', 'Which TWO privileges allow a user to read files in a Unity Catalog volume? (Choose two.)',
  ['READ VOLUME on the volume', 'USE CATALOG and USE SCHEMA on the parents', 'SELECT on the volume', 'READ FILES on the metastore'],
  [0, 1], 'Reading a volume requires READ VOLUME plus USE CATALOG and USE SCHEMA.', 'volumes');

addQ(2, 'Lineage & audit', 'Which system table should you query to find who granted privileges on a table last week?',
  ['system.access.audit', 'system.access.table_lineage', 'system.billing.usage', 'system.information_schema.columns'],
  0, 'Permission changes are recorded as audit events in system.access.audit.', 'systables');
