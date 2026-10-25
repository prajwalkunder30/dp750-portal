// Domain 2: Secure and govern Unity Catalog objects
addQ(2, 'Privileges', 'A group has SELECT on table sales.retail.orders but receives a permission error when querying it. What is the most likely missing grant?',
  ['MODIFY on the table', 'USE CATALOG on sales and USE SCHEMA on sales.retail', 'CREATE TABLE on the schema', 'READ FILES on the external location'],
  1, 'To access an object, a principal needs USE CATALOG on the parent catalog and USE SCHEMA on the parent schema in addition to SELECT.', 'privs');

addQ(2, 'Privileges', 'Analysts must be able to read every current and future table in schema finance.reporting. What is the simplest approach?',
  ['Grant SELECT on each table and schedule a job to grant new tables', 'Grant USE CATALOG on finance, and USE SCHEMA and SELECT on finance.reporting', 'Make the analysts owners of the schema', 'Grant ALL PRIVILEGES on the metastore'],
  1, 'Privileges granted on a schema are inherited by current and future objects in that schema.', 'privs');

addQ(2, 'Privileges', 'A data steward must grant and revoke permissions on a catalog without becoming its owner. Which privilege should you grant?',
  ['MANAGE', 'BROWSE', 'USE CATALOG', 'APPLY TAG'],
  0, 'MANAGE lets a principal manage privileges (and some other operations) on an object without ownership.', 'privs');

addQ(2, 'Privileges', 'Users must be able to discover tables and see their metadata in Catalog Explorer but not read data. Which privilege should you grant on the catalog?',
  ['BROWSE', 'SELECT', 'READ VOLUME', 'EXECUTE'],
  0, 'BROWSE allows viewing object metadata without granting access to data.', 'privs');

addQ(2, 'Privileges', 'Which statement grants read access on a table to the account group data-readers?',
  ['GRANT SELECT ON TABLE main.sales.orders TO `data-readers`', 'GRANT READ ON main.sales.orders TO data-readers', 'ALTER TABLE main.sales.orders SET OWNER data-readers', 'GRANT USAGE ON TABLE main.sales.orders TO `data-readers`'],
  0, 'GRANT SELECT ON TABLE <name> TO `<principal>` is the correct syntax. Principals containing hyphens must be quoted with backticks.', 'privs');

addQ(2, 'Privileges', 'Unity Catalog permissions should be granted to which kind of group?',
  ['Workspace-local groups', 'Account-level groups (for example synced from Microsoft Entra ID)', 'Azure RBAC role assignments', 'Linux groups on the driver node'],
  1, 'Unity Catalog uses account-level identities. Workspace-local groups cannot be used in Unity Catalog grants.', 'privs');

addQ(2, 'Row & column security', 'Sales reps should see only rows for their own region in a table. The rule must apply no matter how the table is queried. What should you implement?',
  ['A row filter function applied with ALTER TABLE ... SET ROW FILTER', 'A column mask', 'A separate table per region', 'A notebook widget'],
  0, 'Row filters are SQL UDFs attached to the table that evaluate for every query.', 'filters');

addQ(2, 'Row & column security', 'Only members of the hr-admins group may see the salary column; others should see NULL. What should you implement?',
  ['A column mask using is_account_group_member(\'hr-admins\')', 'A row filter on salary', 'REVOKE SELECT on the column', 'A CHECK constraint'],
  0, 'A column mask function returns the real value or a masked value based on group membership.', 'filters');

addQ(2, 'Row & column security', 'You need to apply the same PII masking policy to every column tagged pii=email across hundreds of tables, including future tables. What should you use?',
  ['Attribute-based access control (ABAC) policies with governed tags', 'A column mask on each table', 'Dynamic views for each table', 'Delta Sharing'],
  0, 'ABAC policies are defined once at catalog/schema level and apply row filters or column masks to objects matching governed tags.', 'abac');

addQ(2, 'Row & column security', 'A view uses CASE WHEN is_account_group_member(\'auditors\') THEN ssn ELSE \'***\' END. What is this an example of?',
  ['A dynamic view', 'A materialized view', 'A streaming table', 'A temporary view'],
  0, 'Dynamic views use functions such as current_user() and is_account_group_member() to provide row/column-level security.', 'views');

addQ(2, 'Secrets', 'A notebook connects to an external database. The password is stored in Azure Key Vault. How should the notebook obtain the password?',
  ['Create an Azure Key Vault-backed secret scope and call dbutils.secrets.get(scope, key)', 'Hard-code the password and restrict notebook permissions', 'Store the password in a widget default value', 'Save the password in a Delta table'],
  0, 'Key Vault-backed secret scopes expose Key Vault secrets through dbutils.secrets.get without exposing them in code.', 'secrets');

addQ(2, 'Secrets', 'A developer prints the value returned by dbutils.secrets.get() in a notebook cell. What is displayed?',
  ['The plain text secret', '[REDACTED]', 'An error', 'The secret hashed with SHA-256'],
  1, 'Databricks redacts secret values in notebook output and shows [REDACTED].', 'secrets');

addQ(2, 'Secrets', 'Which SQL function can read a secret in a Databricks SQL query?',
  ['secret(scope, key)', 'get_secret(key)', 'dbutils.secrets.get(scope, key)', 'current_secret()'],
  0, 'The secret(scope, key) SQL function retrieves a secret value.', 'secrets');

addQ(2, 'Identity', 'A production job must not run under any individual user\'s identity. What should the job run as?',
  ['A Microsoft Entra ID service principal', 'The workspace admin account', 'The account that created the job', 'An anonymous user'],
  0, 'Run production jobs as a service principal so they do not depend on a person\'s account and permissions.', 'jobs');

addQ(2, 'Lineage & audit', 'An auditor asks which downstream tables and dashboards are affected if column customer_email in silver.customers changes. What should you use?',
  ['Unity Catalog data lineage (column-level)', 'DESCRIBE HISTORY', 'Spark UI', 'The cluster event log'],
  0, 'Unity Catalog automatically captures table- and column-level lineage, including downstream consumers.', 'lineage');

addQ(2, 'Lineage & audit', 'You need to query who accessed which tables over the last 90 days using SQL. Which system table should you query?',
  ['system.access.audit', 'system.billing.usage', 'system.compute.clusters', 'system.lakeflow.jobs'],
  0, 'system.access.audit contains audit log events, including data access events.', 'systables');

addQ(2, 'Lineage & audit', 'Security operations wants Azure Databricks audit logs in their Log Analytics workspace. What should you configure?',
  ['Azure diagnostic settings on the Azure Databricks workspace', 'A Delta Sharing recipient', 'Cluster log delivery to DBFS', 'A SQL alert'],
  0, 'Diagnostic settings stream Azure Databricks diagnostic (audit) logs to Log Analytics, Event Hubs, or storage.', 'audit');

addQ(2, 'Lineage & audit', 'Which system table helps you attribute DBU consumption to jobs and tags?',
  ['system.billing.usage', 'system.access.audit', 'system.information_schema.tables', 'system.access.table_lineage'],
  0, 'system.billing.usage records billable usage with workload metadata and custom tags.', 'systables');

addQ(2, 'Delta Sharing', 'A partner uses Azure Databricks with Unity Catalog in another account. You need to share tables with them without copying data. What should you use?',
  ['Databricks-to-Databricks Delta Sharing', 'Open sharing with a credential file', 'Export to CSV in a SAS-protected container', 'Lakehouse Federation'],
  0, 'Databricks-to-Databricks sharing uses the recipient\'s metastore identifier and needs no token management.', 'sharing');

addQ(2, 'Delta Sharing', 'A partner uses pandas and Power BI but not Databricks. How can you share live Delta tables with them?',
  ['Open sharing: create a recipient and provide the activation link / credential file', 'Databricks-to-Databricks sharing', 'Grant SELECT to the partner\'s email', 'Create a foreign catalog'],
  0, 'Open sharing allows any client that supports the Delta Sharing protocol to read shared data using a bearer-token credential.', 'sharing');

addQ(2, 'Delta Sharing', 'Put the steps to share a table with Delta Sharing in order: 1) GRANT SELECT ON SHARE to recipient 2) CREATE SHARE 3) ALTER SHARE ADD TABLE 4) CREATE RECIPIENT',
  ['2, 3, 4, 1', '4, 1, 2, 3', '3, 2, 1, 4', '2, 1, 3, 4'],
  0, 'Create the share, add assets, create the recipient, then grant the recipient access to the share.', 'sharing');

addQ(2, 'Discovery', 'You need to add a business description and searchable key-value labels to a table. Which TWO actions should you perform? (Choose two.)',
  ['COMMENT ON TABLE ... IS \'...\'', 'ALTER TABLE ... SET TAGS (\'domain\' = \'sales\')', 'ALTER TABLE ... SET TBLPROPERTIES (\'delta.appendOnly\'=\'true\')', 'OPTIMIZE ... ZORDER BY'],
  [0, 1], 'Comments document objects and tags add key-value metadata that is searchable in Catalog Explorer.', 'uc');

addQ(2, 'Network', 'Clusters must not have public IP addresses and the workspace should be deployed in your own virtual network. Which TWO features should you use? (Choose two.)',
  ['Secure cluster connectivity (No Public IP)', 'VNet injection', 'Delta Sharing', 'Instance pools'],
  [0, 1], 'VNet injection deploys the compute plane into your VNet; secure cluster connectivity removes public IPs from cluster nodes.', 'compute');

addQ(2, 'Privileges', 'Which privilege allows a user to read files directly from an external location path (not via a table)?',
  ['READ FILES', 'SELECT', 'USE SCHEMA', 'BROWSE'],
  0, 'READ FILES on an external location (or READ VOLUME on a volume) allows direct file reads.', 'privs');
