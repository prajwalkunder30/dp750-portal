// Study guide - Domain 2: Secure and govern Unity Catalog objects
addChapter(2, '2.1', 'Identities, roles and workspace permissions', `
<p>Every permission decision starts with an identity. This chapter covers <b>who</b> can be granted access, the <b>admin roles</b>, and the permissions on <b>workspace objects</b>
(notebooks, compute, jobs, warehouses), which are separate from Unity Catalog data permissions.</p>

<h2>Identity types</h2>
<table>
<tr><th>Identity</th><th>What it is</th><th>Use it for</th></tr>
<tr><td><b>User</b></td><td>A human, identified by email / Entra ID user principal name.</td><td>Interactive work.</td></tr>
<tr><td><b>Group</b></td><td>A collection of users, service principals and other groups.</td><td><b>All grants</b> wherever possible. Grant to groups, not individuals.</td></tr>
<tr><td><b>Service principal</b></td><td>A non-human identity (Entra ID managed or Databricks managed).</td><td>Production jobs, pipelines, CI/CD, integrations.</td></tr>
</table>
<p>In Unity Catalog-enabled workspaces identities live at the <b>account level</b> and are assigned to workspaces (identity federation). <b>Account groups</b> can be used in Unity Catalog grants;
legacy <b>workspace-local groups</b> cannot be used in UC grants and should be migrated.</p>

<h2>Synchronizing from Microsoft Entra ID</h2>
<ul>
<li><b>Automatic identity management</b>: Databricks reads users, groups (including nested groups) and service principals from Entra ID on demand. No SCIM app to maintain. Recommended for new setups.</li>
<li><b>SCIM provisioning</b>: an Entra ID enterprise application pushes users and groups to the Databricks account on a schedule.</li>
</ul>
<div class="box tip"><b>Exam tip:</b> "Group membership changes in Entra ID must be reflected in Databricks without manual work" &rarr; automatic identity management or SCIM provisioning to the <b>account</b>.</div>

<h2>Admin roles</h2>
<table>
<tr><th>Role</th><th>Scope</th><th>Can do</th></tr>
<tr><td><b>Account admin</b></td><td>Whole account</td><td>Manage identities, workspaces, metastores, billing, account settings, enable system schemas.</td></tr>
<tr><td><b>Metastore admin</b> (optional)</td><td>One metastore</td><td>Manage all UC securables, transfer ownership, create catalogs, storage credentials, external locations.</td></tr>
<tr><td><b>Workspace admin</b></td><td>One workspace</td><td>Manage workspace users, entitlements, compute, policies, workspace settings. Not data permissions in UC by default.</td></tr>
</table>
<p>Avoid making individuals metastore admins. Assign the role to a small admin <b>group</b>, and prefer delegating with ownership and the <b>MANAGE</b> privilege.</p>

<h2>Workspace entitlements</h2>
<ul>
<li><b>Workspace access</b> &ndash; can use the Data Science &amp; Engineering workspace UI.</li>
<li><b>Databricks SQL access</b> &ndash; can use SQL features.</li>
<li><b>Allow unrestricted cluster creation</b> &ndash; can create compute without a policy.</li>
<li><b>Allow pool creation</b>.</li>
</ul>

<h2>Workspace object permissions (ACLs)</h2>
<table>
<tr><th>Object</th><th>Permission levels (low &rarr; high)</th></tr>
<tr><td>Notebooks, folders, files</td><td>CAN READ &rarr; CAN RUN &rarr; CAN EDIT &rarr; CAN MANAGE</td></tr>
<tr><td>Classic compute</td><td>CAN ATTACH TO &rarr; CAN RESTART &rarr; CAN MANAGE</td></tr>
<tr><td>Jobs</td><td>CAN VIEW &rarr; CAN MANAGE RUN &rarr; IS OWNER / CAN MANAGE</td></tr>
<tr><td>Lakeflow Declarative Pipelines</td><td>CAN VIEW &rarr; CAN RUN &rarr; CAN MANAGE / IS OWNER</td></tr>
<tr><td>SQL warehouses</td><td>CAN VIEW / CAN MONITOR &rarr; CAN USE &rarr; CAN MANAGE / IS OWNER</td></tr>
<tr><td>Compute policies</td><td>CAN USE</td></tr>
<tr><td>Secret scopes</td><td>READ &rarr; WRITE &rarr; MANAGE</td></tr>
</table>
<div class="box trap"><b>Common trap:</b> Workspace object permissions and UC data permissions are independent. CAN ATTACH TO on a cluster does not grant SELECT on a table, and SELECT on a table does not let someone use a SQL warehouse they lack CAN USE on.</div>

<h2>Run-as identity for jobs and pipelines</h2>
<p>A job runs with the permissions of its <b>run as</b> identity (by default the owner). For production, set <b>run as</b> to a <b>service principal</b> so runs do not break when people leave and data permissions are not tied to a person.
Changing run-as to a service principal requires the Service Principal User role on that service principal.</p>

<h2>Personal access tokens vs OAuth</h2>
<p>Prefer <b>OAuth</b> (user-to-machine for people, machine-to-machine for service principals) and <b>workload identity federation</b> for CI/CD over long-lived personal access tokens. Admins can restrict or disable PAT usage and set maximum lifetimes.</p>

<h2>Check yourself</h2>
<details><summary>A production job fails after its creator leaves the company. How do you prevent this?</summary>
<p>Set the job's run-as identity (and ownership) to a service principal.</p></details>
<details><summary>Can a workspace-local group be granted SELECT on a UC table?</summary>
<p>No. Use account-level groups for Unity Catalog grants.</p></details>
<details><summary>A user can see a SQL warehouse but cannot run queries on it. Which permission is missing?</summary>
<p>CAN USE on the warehouse.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}admin/users-groups/" target="_blank" rel="noopener">Manage users, service principals and groups</a></li>
<li><a href="${ML}security/auth/access-control/" target="_blank" rel="noopener">Access control lists</a></li></ul>
`);

addChapter(2, '2.2', 'The Unity Catalog privilege model', `
<p>Unity Catalog uses ANSI SQL-style <code>GRANT</code>/<code>REVOKE</code> on <b>securable objects</b>. Mastering three rules answers most exam questions: <b>you need USE on every parent</b>,
<b>privileges inherit downwards</b>, and <b>owners can do everything</b>.</p>

<h2>Rule 1: the access path</h2>
<p>To read <code>prod.sales.orders</code> a principal needs all three:</p>
<pre><code>GRANT USE CATALOG ON CATALOG prod TO \`analysts\`;
GRANT USE SCHEMA  ON SCHEMA  prod.sales TO \`analysts\`;
GRANT SELECT      ON TABLE   prod.sales.orders TO \`analysts\`;</code></pre>
<p>USE CATALOG and USE SCHEMA do not expose data by themselves; they only allow traversal. Missing either gives a permission error even when SELECT is granted.</p>

<h2>Rule 2: inheritance</h2>
<p>A privilege granted on a catalog or schema applies to <b>all current and future</b> child objects.</p>
<pre><code>-- Analysts can read every table and view in every schema of prod, now and in future
GRANT USE CATALOG, USE SCHEMA, SELECT ON CATALOG prod TO \`analysts\`;</code></pre>
<p>There is no "deny". To exclude a table, grant at a lower level instead, or move the table to a different schema.</p>

<h2>Rule 3: ownership</h2>
<ul>
<li>Every securable has exactly one <b>owner</b> (user, service principal or group). The creator is the initial owner.</li>
<li>The owner has all privileges on the object and can grant privileges to others.</li>
<li>Owners of a parent (catalog/schema owner) can manage child objects.</li>
<li>Transfer: <code>ALTER TABLE prod.sales.orders OWNER TO \`data-eng-admins\`;</code> Use groups as owners for production objects.</li>
</ul>

<h2>Common privileges</h2>
<table>
<tr><th>Privilege</th><th>On</th><th>Allows</th></tr>
<tr><td>USE CATALOG / USE SCHEMA</td><td>Catalog / schema</td><td>Traverse into the container</td></tr>
<tr><td>BROWSE</td><td>Catalog (and below)</td><td>See metadata in Catalog Explorer, search, lineage &ndash; without reading data</td></tr>
<tr><td>SELECT</td><td>Table, view, MV, streaming table (or container)</td><td>Read data</td></tr>
<tr><td>MODIFY</td><td>Table</td><td>INSERT, UPDATE, DELETE, MERGE</td></tr>
<tr><td>CREATE SCHEMA</td><td>Catalog</td><td>Create schemas</td></tr>
<tr><td>CREATE TABLE / CREATE VOLUME / CREATE FUNCTION / CREATE MATERIALIZED VIEW</td><td>Schema</td><td>Create those objects</td></tr>
<tr><td>EXECUTE</td><td>Function, model</td><td>Call a UDF / load a model</td></tr>
<tr><td>READ VOLUME / WRITE VOLUME</td><td>Volume</td><td>Read / write files in the volume</td></tr>
<tr><td>READ FILES / WRITE FILES</td><td>External location</td><td>Direct path access to files</td></tr>
<tr><td>CREATE EXTERNAL TABLE / CREATE EXTERNAL VOLUME / CREATE MANAGED STORAGE</td><td>External location</td><td>Use the location for those purposes</td></tr>
<tr><td>CREATE CONNECTION, USE CONNECTION, CREATE FOREIGN CATALOG</td><td>Metastore / connection</td><td>Lakehouse Federation</td></tr>
<tr><td>APPLY TAG</td><td>Any taggable object</td><td>Add or remove tags</td></tr>
<tr><td>MANAGE</td><td>Any securable</td><td>Manage grants, rename, drop and transfer ownership without being owner</td></tr>
<tr><td>ALL PRIVILEGES</td><td>Any</td><td>All applicable privileges (not ownership; does not by itself let you grant to others)</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> "Users can discover what data exists and request access, but cannot query it" &rarr; grant <b>BROWSE</b> on the catalog (often to <code>account users</code>).</div>

<h2>Least-privilege patterns</h2>
<table>
<tr><th>Persona</th><th>Typical grants</th></tr>
<tr><td>Data engineers (dev)</td><td>USE CATALOG, CREATE SCHEMA on <code>dev</code>; full rights on their schemas</td></tr>
<tr><td>Production job service principal</td><td>USE CATALOG/SCHEMA, SELECT on sources, MODIFY + CREATE TABLE on target schemas; READ VOLUME on landing volume</td></tr>
<tr><td>Analysts</td><td>USE CATALOG/SCHEMA + SELECT on <code>gold</code> schema only</td></tr>
<tr><td>Data stewards</td><td>MANAGE or ownership on catalog; APPLY TAG</td></tr>
<tr><td>Everyone</td><td>BROWSE on catalogs for discovery</td></tr>
</table>

<h2>Inspecting and revoking</h2>
<pre><code>SHOW GRANTS ON TABLE prod.sales.orders;
SHOW GRANTS \`analysts\` ON SCHEMA prod.sales;
REVOKE SELECT ON TABLE prod.sales.orders FROM \`contractors\`;</code></pre>
<p>Revoking at table level does not remove a privilege inherited from the schema or catalog; revoke it where it was granted.</p>

<h2>Views and permissions</h2>
<p>A user querying a view needs SELECT on the view (and USE on its parents). The view's <b>owner</b> must have SELECT on the referenced tables. This lets you expose a subset of data without granting access to the base tables.</p>

<h2>Information schema</h2>
<p>Every catalog has an <code>information_schema</code> with views such as <code>tables</code>, <code>columns</code>, <code>table_privileges</code> and <code>schema_privileges</code>. Users see only rows for objects they have access to.</p>
<pre><code>SELECT grantee, privilege_type
FROM prod.information_schema.table_privileges
WHERE table_schema = 'sales' AND table_name = 'orders';</code></pre>

<h2>Check yourself</h2>
<details><summary>A user has SELECT on a table but gets "permission denied". The schema grants look correct. What else is likely missing?</summary>
<p>USE CATALOG on the parent catalog.</p></details>
<details><summary>You granted SELECT on schema <code>gold</code>. A new table is created there tomorrow. Can analysts read it?</summary>
<p>Yes. Grants on a schema apply to future objects.</p></details>
<details><summary>A steward must manage permissions on a catalog without owning it. Which privilege?</summary>
<p>MANAGE.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.privs}" target="_blank" rel="noopener">Manage privileges in Unity Catalog</a></li></ul>
`);

addChapter(2, '2.3', 'Row filters, column masks, dynamic views and ABAC', `
<p>Table-level grants answer "can this person read the table?". Fine-grained controls answer "<b>which rows</b>" and "<b>which column values</b>". There are three tools, from oldest to newest:
dynamic views, row filters/column masks on tables, and attribute-based access control (ABAC) policies driven by governed tags.</p>

<h2>Identity functions</h2>
<table>
<tr><th>Function</th><th>Returns</th></tr>
<tr><td><code>current_user()</code></td><td>Email/name of the user running the query</td></tr>
<tr><td><code>is_account_group_member('grp')</code></td><td>TRUE if the user is in the <b>account</b> group &ndash; use this with UC</td></tr>
<tr><td><code>is_member('grp')</code></td><td>Checks <b>workspace-local</b> groups (legacy) &ndash; avoid in UC</td></tr>
</table>

<h2>Dynamic views</h2>
<pre><code>CREATE OR REPLACE VIEW prod.hr.v_employees AS
SELECT
  emp_id,
  name,
  department,
  CASE WHEN is_account_group_member('hr-admins') THEN salary ELSE NULL END AS salary,
  CASE WHEN is_account_group_member('hr-admins') THEN email
       ELSE regexp_replace(email, '^[^@]+', '***') END AS email
FROM prod.hr.employees
WHERE is_account_group_member('hr-admins')
   OR department IN (SELECT department FROM prod.hr.manager_scope WHERE manager = current_user());</code></pre>
<p>Grant SELECT on the view only. Downside: users must query the view, not the table, and logic is duplicated across views.</p>

<h2>Row filters</h2>
<p>A row filter is a SQL UDF returning BOOLEAN, attached to the table. Every query on the table (by any tool) applies it.</p>
<pre><code>CREATE OR REPLACE FUNCTION prod.sec.region_filter(region STRING)
RETURNS BOOLEAN
RETURN is_account_group_member('global-sales')
    OR (region = 'EU' AND is_account_group_member('eu-sales'))
    OR (region = 'US' AND is_account_group_member('us-sales'));

ALTER TABLE prod.sales.orders SET ROW FILTER prod.sec.region_filter ON (region);

ALTER TABLE prod.sales.orders DROP ROW FILTER;</code></pre>

<h2>Column masks</h2>
<p>A column mask is a SQL UDF whose first parameter is the column value; it returns the value (or a masked version) of the same type. Extra columns can be passed with <code>USING COLUMNS</code>.</p>
<pre><code>CREATE OR REPLACE FUNCTION prod.sec.mask_ssn(ssn STRING)
RETURNS STRING
RETURN CASE WHEN is_account_group_member('pii-readers') THEN ssn
            ELSE concat('***-**-', right(ssn, 4)) END;

ALTER TABLE prod.hr.employees ALTER COLUMN ssn SET MASK prod.sec.mask_ssn;

-- mask using another column
ALTER TABLE prod.crm.customers ALTER COLUMN phone
  SET MASK prod.sec.mask_phone USING COLUMNS (country);</code></pre>
<ul>
<li>Filters and masks can also be declared in <code>CREATE TABLE</code> (<code>WITH ROW FILTER ...</code>, column <code>MASK ...</code>).</li>
<li>One row filter per table; one mask per column.</li>
<li>Users querying the table do not need EXECUTE on the function; they need only SELECT on the table. The person attaching the filter or mask needs EXECUTE on the function and ownership/MANAGE on the table.</li>
<li>Supported on SQL warehouses, serverless and standard access mode; dedicated compute on recent runtimes enforces them via serverless filtering.</li>
</ul>
<div class="box trap"><b>Common trap:</b> Filters and masks apply to <b>everyone</b>, including the table owner. Make sure your function lets the right admin/ETL groups see all data, otherwise pipelines that read the table get filtered results.</div>

<h2>Attribute-based access control (ABAC)</h2>
<p>With many tables, attaching masks one by one does not scale. ABAC lets you define a <b>policy once</b> at catalog or schema level that applies automatically to every column or table carrying a matching <b>governed tag</b>.</p>
<ol>
<li>An account admin defines a <b>governed tag</b> (e.g. <code>pii</code> with allowed values <code>ssn</code>, <code>email</code>, <code>phone</code>) and controls who may assign it.</li>
<li>Stewards tag columns: <code>ALTER TABLE ... ALTER COLUMN email SET TAGS ('pii' = 'email')</code> (data classification can suggest tags automatically).</li>
<li>Create a <b>policy</b> on a catalog or schema: "for columns tagged <code>pii=email</code>, apply mask function X to everyone except group <code>pii-readers</code>". Row filter policies work similarly using table tags.</li>
<li>New tables that receive the tag are protected immediately &ndash; no per-table ALTER statements.</li>
</ol>
<div class="box tip"><b>Choosing the tool:</b> one or two tables with special rules &rarr; row filter / column mask. Consistent rule across many tables based on data sensitivity &rarr; ABAC with governed tags. Need to expose a reshaped subset or join &rarr; dynamic view.</div>

<h2>Comparison</h2>
<table>
<tr><th></th><th>Dynamic view</th><th>Row filter / column mask</th><th>ABAC policy</th></tr>
<tr><td>Where applied</td><td>Separate view object</td><td>On the table</td><td>Catalog/schema, matched by tags</td></tr>
<tr><td>Users query</td><td>The view</td><td>The table</td><td>The table</td></tr>
<tr><td>Scales to many tables</td><td>Poorly</td><td>Moderately</td><td>Well</td></tr>
<tr><td>Can reshape / join</td><td>Yes</td><td>No</td><td>No</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>Which function should a row filter use to check membership of an Entra ID-synced group?</summary>
<p><code>is_account_group_member()</code>.</p></details>
<details><summary>Every column tagged as containing email addresses, across 300 tables, must be masked for non-privileged users. Best approach?</summary>
<p>An ABAC column mask policy on the catalog matching the governed tag.</p></details>
<details><summary>After adding a row filter, the nightly job writes fewer rows to the gold table. Why?</summary>
<p>The job's service principal is also subject to the filter. Include its group in the filter's allow condition.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.filters}" target="_blank" rel="noopener">Row filters and column masks</a></li>
<li><a href="${R.abac}" target="_blank" rel="noopener">ABAC</a></li>
<li><a href="${R.views}" target="_blank" rel="noopener">Dynamic views</a></li></ul>
`);

addChapter(2, '2.4', 'Secrets and credentials', `
<p>Pipelines connect to databases, APIs and message buses. Credentials must never appear in notebooks, job definitions or Git. Azure Databricks offers <b>secret scopes</b> and Unity Catalog <b>credentials/connections</b>.</p>

<h2>Secret scopes</h2>
<table>
<tr><th>Type</th><th>Where secrets live</th><th>Managed with</th><th>Notes</th></tr>
<tr><td><b>Azure Key Vault-backed</b></td><td>Your Azure Key Vault</td><td>Azure (portal, CLI, Key Vault RBAC/policies)</td><td>Read-only from Databricks. Central rotation and auditing in Azure. Preferred in enterprises.</td></tr>
<tr><td><b>Databricks-backed</b></td><td>Encrypted store managed by Databricks</td><td>Databricks CLI / API</td><td>Simple; no Azure resource needed.</td></tr>
</table>
<p>A Key Vault-backed scope is created from the workspace UI (<code>#secrets/createScope</code>) or API by supplying the vault's DNS name and resource ID. The Azure Databricks application must be able to read secrets in the vault.</p>

<h2>Using secrets</h2>
<pre><code># Python notebook
pwd = dbutils.secrets.get(scope="crm", key="sql-password")

jdbc = (spark.read.format("sqlserver")
  .option("host", "crm-sql.database.windows.net")
  .option("user", dbutils.secrets.get("crm", "sql-user"))
  .option("password", pwd)
  .option("database", "crm")
  .option("dbtable", "dbo.customers")
  .load())

dbutils.secrets.list("crm")       # names only, never values
dbutils.secrets.listScopes()</code></pre>
<ul>
<li>Values printed to notebook output are replaced with <code>[REDACTED]</code>. Redaction is a safeguard, not a security boundary &ndash; anyone with READ on the scope can obtain the value.</li>
<li>In compute Spark config or environment variables use <code>{{secrets/crm/sql-password}}</code>.</li>
<li>In SQL use the <code>secret('scope', 'key')</code> function (for example in CREATE CONNECTION).</li>
</ul>

<h2>Secret ACLs</h2>
<table>
<tr><th>Permission</th><th>Allows</th></tr>
<tr><td>READ</td><td>Read secrets and list keys</td></tr>
<tr><td>WRITE</td><td>READ + put and delete secrets</td></tr>
<tr><td>MANAGE</td><td>WRITE + change ACLs and delete the scope</td></tr>
</table>
<pre><code>databricks secrets create-scope crm
databricks secrets put-secret crm sql-password
databricks secrets put-acl crm data-engineers READ</code></pre>
<div class="box tip"><b>Exam tip:</b> Grant production service principals READ on only the scopes they need; keep MANAGE with a small admin group.</div>

<h2>Unity Catalog alternatives to raw secrets</h2>
<ul>
<li><b>Storage credentials + external locations</b> for ADLS &ndash; no keys at all.</li>
<li><b>Connections</b> for Lakehouse Federation and Lakeflow Connect sources &ndash; credentials stored once, governed by USE CONNECTION.</li>
<li><b>Service credentials</b> &ndash; UC-governed managed identity access to other Azure services (for example Key Vault or Event Hubs) from code.</li>
</ul>

<h2>Anti-patterns</h2>
<ul>
<li>Hard-coding passwords or storage account keys in notebooks or job parameters.</li>
<li>Putting keys in Spark config as plain text.</li>
<li>Using storage account keys / SAS for ADLS instead of UC storage credentials.</li>
<li>Sharing one personal access token for production automation.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Security requires that all secrets be rotated centrally in Azure. Which scope type?</summary>
<p>Azure Key Vault-backed secret scope.</p></details>
<details><summary>How do you pass a secret to a cluster's Spark configuration?</summary>
<p><code>{{secrets/&lt;scope&gt;/&lt;key&gt;}}</code> reference syntax.</p></details>
<details><summary>Is <code>[REDACTED]</code> output enough to prevent a user with READ on the scope from seeing the secret?</summary>
<p>No. Control access with secret ACLs.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.secrets}" target="_blank" rel="noopener">Secret management</a></li>
<li><a href="${R.kv}" target="_blank" rel="noopener">Azure Key Vault</a></li></ul>
`);

addChapter(2, '2.5', 'Lineage, auditing and system tables', `
<p>Governance is not just about blocking access; you must also <b>prove</b> who accessed what and <b>trace</b> where data came from. Unity Catalog captures lineage and audit events automatically, and exposes them through system tables.</p>

<h2>Data lineage</h2>
<ul>
<li>Captured automatically for queries run on UC-enabled compute (SQL, Python, Scala; notebooks, jobs, pipelines, dashboards).</li>
<li><b>Table-level</b> and <b>column-level</b>, upstream and downstream, including the notebooks, jobs and dashboards that read or write.</li>
<li>Visible in Catalog Explorer's <b>Lineage</b> tab and queryable via <code>system.access.table_lineage</code> and <code>system.access.column_lineage</code>.</li>
<li>Users see lineage nodes they have at least BROWSE on; others appear masked.</li>
</ul>
<pre><code>-- Who reads my silver table?
SELECT DISTINCT target_table_full_name, entity_type, entity_id
FROM system.access.table_lineage
WHERE source_table_full_name = 'prod.silver.orders'
  AND event_date &gt;= current_date() - 30;</code></pre>
<div class="box tip"><b>Exam tip:</b> "Before changing a column, find every downstream table and dashboard that uses it" &rarr; column-level lineage.</div>

<h2>System tables</h2>
<p>System tables live in the <code>system</code> catalog. An account admin enables schemas, and access is granted like any UC object.</p>
<table>
<tr><th>Table</th><th>Answers</th></tr>
<tr><td><code>system.access.audit</code></td><td>Who did what: logins, grants, table reads, secret access, job changes</td></tr>
<tr><td><code>system.access.table_lineage</code> / <code>column_lineage</code></td><td>Data flows between tables/columns</td></tr>
<tr><td><code>system.billing.usage</code></td><td>DBU consumption by SKU, workspace, job, warehouse, tags</td></tr>
<tr><td><code>system.billing.list_prices</code></td><td>Price per SKU, join with usage to estimate cost</td></tr>
<tr><td><code>system.compute.clusters</code>, <code>node_timeline</code>, <code>warehouse_events</code></td><td>Compute configuration history and utilization</td></tr>
<tr><td><code>system.lakeflow.jobs</code>, <code>job_run_timeline</code>, <code>job_task_run_timeline</code></td><td>Job definitions, run durations and outcomes</td></tr>
<tr><td><code>system.query.history</code></td><td>Queries on SQL warehouses and serverless: text, duration, user</td></tr>
<tr><td><code>system.storage.predictive_optimization_operations_history</code></td><td>Automatic OPTIMIZE/VACUUM operations</td></tr>
</table>
<pre><code>-- Who changed permissions on the prod catalog this week?
SELECT event_time, user_identity.email, action_name, request_params
FROM system.access.audit
WHERE service_name = 'unityCatalog'
  AND action_name IN ('updatePermissions')
  AND request_params.securable_full_name LIKE 'prod%'
  AND event_date &gt;= current_date() - 7;

-- Cost per job last month
SELECT usage_metadata.job_id, sum(u.usage_quantity * p.pricing.default) AS est_cost
FROM system.billing.usage u
JOIN system.billing.list_prices p
  ON u.sku_name = p.sku_name AND u.usage_start_time &gt;= p.price_start_time
 AND (p.price_end_time IS NULL OR u.usage_start_time &lt; p.price_end_time)
WHERE u.usage_date &gt;= add_months(current_date(), -1)
GROUP BY ALL ORDER BY est_cost DESC;</code></pre>

<h2>Azure diagnostic logs</h2>
<p>For integration with Azure-native tooling (SIEM, Sentinel, Log Analytics alerts), configure <b>diagnostic settings</b> on the workspace to send audit log categories to a Log Analytics workspace, Event Hubs or a storage account.
Use system tables for SQL analysis inside Databricks; use diagnostic settings when security teams work in Azure Monitor/Sentinel.</p>

<h2>Table history</h2>
<p><code>DESCRIBE HISTORY</code> on a Delta table shows each operation, user and timestamp &ndash; useful audit evidence for data changes on a single table (see Domain 3).</p>

<h2>Check yourself</h2>
<details><summary>Which system table shows who granted SELECT on a table?</summary>
<p><code>system.access.audit</code>.</p></details>
<details><summary>The SOC wants Databricks audit events in Microsoft Sentinel. What do you configure?</summary>
<p>Workspace diagnostic settings streaming to Log Analytics (used by Sentinel).</p></details>
<details><summary>Which table do you join with <code>system.billing.usage</code> to estimate cost in currency?</summary>
<p><code>system.billing.list_prices</code>.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.lineage}" target="_blank" rel="noopener">Data lineage</a></li>
<li><a href="${R.systables}" target="_blank" rel="noopener">System tables</a></li>
<li><a href="${R.audit}" target="_blank" rel="noopener">Audit logs</a></li></ul>
`);

addChapter(2, '2.6', 'Data discovery, tags and classification', `
<p>Governed data is only useful if people can find and trust it. Unity Catalog provides metadata features that make data discoverable and that feed governance policies.</p>

<h2>Comments and documentation</h2>
<ul>
<li>Table and column <b>comments</b> appear in Catalog Explorer, search results, Genie and the information schema.</li>
<li>AI-generated comments can draft descriptions; always review them.</li>
<li>Add comments in DDL so they are versioned with code: <code>CREATE TABLE ... (id BIGINT COMMENT 'Surrogate key') COMMENT 'Customer dimension'</code>.</li>
</ul>

<h2>Tags</h2>
<pre><code>ALTER CATALOG prod SET TAGS ('environment' = 'production');
ALTER TABLE prod.crm.customers SET TAGS ('domain' = 'crm', 'certified' = 'true');
ALTER TABLE prod.crm.customers ALTER COLUMN email SET TAGS ('pii' = 'email');
ALTER TABLE prod.crm.customers UNSET TAGS ('certified');

SELECT * FROM prod.information_schema.column_tags WHERE tag_name = 'pii';</code></pre>
<ul>
<li>Setting tags requires <b>APPLY TAG</b> on the object (plus USE CATALOG/SCHEMA).</li>
<li><b>Governed tags</b> are account-level tag definitions with allowed values and controlled assignment; they drive ABAC policies.</li>
<li>Tags on compute and jobs are different: they flow to billing data for chargeback.</li>
</ul>

<h2>Data classification</h2>
<p>Data classification scans tables in a catalog and detects sensitive data types (for example email, phone, credit card, national IDs). Results can be reviewed and applied as tags, which ABAC policies then use to mask data automatically.</p>

<h2>Certification and deprecation</h2>
<p>Use tags or system-defined status to mark tables as certified (trusted, for reporting) or deprecated, so consumers choose the right asset.</p>

<h2>Search and discovery</h2>
<p>Catalog Explorer search covers names, comments and tags. With <b>BROWSE</b> granted broadly, users can find assets they cannot yet query and <b>request access</b> through configured access request destinations (email, Slack/Teams or URL).</p>

<h2>Check yourself</h2>
<details><summary>Which privilege is required to set a tag on a column?</summary>
<p>APPLY TAG on the table.</p></details>
<details><summary>How can PII columns be found automatically and protected without manually listing them?</summary>
<p>Data classification to detect and tag them, plus an ABAC policy that masks columns with that governed tag.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}database-objects/tags" target="_blank" rel="noopener">Tags</a></li>
<li><a href="${R.uc}" target="_blank" rel="noopener">Unity Catalog</a></li></ul>
`);

addChapter(2, '2.7', 'Delta Sharing', `
<p>Delta Sharing is an open protocol for sharing live data <b>without copying it</b>. Providers grant read-only access to tables and other assets; recipients query the latest data directly from the provider's storage.</p>

<h2>Objects</h2>
<table>
<tr><th>Object</th><th>Side</th><th>Purpose</th></tr>
<tr><td><b>Share</b></td><td>Provider</td><td>Named collection of tables, views, volumes, models, notebooks</td></tr>
<tr><td><b>Recipient</b></td><td>Provider</td><td>Represents who receives the share</td></tr>
<tr><td><b>Provider</b></td><td>Recipient</td><td>Represents who shares with you</td></tr>
<tr><td>Catalog from share</td><td>Recipient</td><td>Mounts a share as a read-only catalog</td></tr>
</table>

<h2>Two sharing modes</h2>
<table>
<tr><th></th><th>Databricks-to-Databricks</th><th>Open sharing</th></tr>
<tr><td>Recipient platform</td><td>A Unity Catalog-enabled Databricks workspace (any cloud/region)</td><td>Any client: pandas, Spark, Power BI, Tableau, Excel, other platforms</td></tr>
<tr><td>Authentication</td><td>Recipient's metastore <b>sharing identifier</b>; no tokens</td><td>Bearer token in a credential file (activation link) or OIDC federation</td></tr>
<tr><td>Shareable assets</td><td>Tables, views, MVs, streaming tables, volumes, models, notebooks</td><td>Mainly tables (and some views)</td></tr>
<tr><td>Governance on recipient side</td><td>UC grants on the mounted catalog, lineage, audit</td><td>Handled by the recipient's tool</td></tr>
</table>

<h2>Provider workflow</h2>
<pre><code>CREATE SHARE sales_partner COMMENT 'Orders for Fabrikam';
ALTER SHARE sales_partner ADD TABLE prod.gold.orders_summary;
ALTER SHARE sales_partner ADD TABLE prod.silver.orders
  PARTITION (region = 'EU') AS sales.orders_eu;          -- share a subset
ALTER SHARE sales_partner ADD TABLE prod.silver.customers WITH HISTORY;  -- time travel / CDF / streaming

-- Databricks recipient
CREATE RECIPIENT fabrikam USING ID 'azure:westeurope:1a2b3c...';
-- Open sharing recipient (generates activation link)
CREATE RECIPIENT contoso_bi;

GRANT SELECT ON SHARE sales_partner TO RECIPIENT fabrikam;</code></pre>
<ul>
<li>Privileges: CREATE SHARE and CREATE RECIPIENT on the metastore (or metastore admin); share owner must have SELECT on shared tables.</li>
<li>Shared views and dynamic filtering based on recipient properties (<code>current_recipient('country')</code>) restrict what each recipient sees.</li>
<li>Recipients can have <b>IP access lists</b> (open sharing) and tokens with expiry.</li>
<li>Revoke with <code>REVOKE SELECT ON SHARE ... FROM RECIPIENT ...</code>, or drop the recipient.</li>
</ul>

<h2>Recipient workflow (Databricks-to-Databricks)</h2>
<pre><code>SHOW PROVIDERS;
SHOW SHARES IN PROVIDER contoso;
CREATE CATALOG contoso_sales USING SHARE contoso.sales_partner;
GRANT USE CATALOG, USE SCHEMA, SELECT ON CATALOG contoso_sales TO \`analysts\`;</code></pre>

<h2>When not to use Delta Sharing</h2>
<ul>
<li>Recipients need to <b>write</b> back &ndash; shares are read-only.</li>
<li>Multiple parties need to run joint computations on combined data without seeing each other's rows &ndash; consider <b>Clean Rooms</b>.</li>
<li>Within the same metastore &ndash; just use UC grants; no share needed.</li>
</ul>
<div class="box trap"><b>Common trap:</b> Sharing within one region and metastore does not need Delta Sharing. Across metastores (different region or different account) it does.</div>

<h2>Check yourself</h2>
<details><summary>A partner without Databricks needs to read a table from Power BI. Which mode?</summary>
<p>Open sharing (token-based credential file).</p></details>
<details><summary>What does the provider need from a Databricks recipient to create the recipient object?</summary>
<p>The recipient metastore's sharing identifier.</p></details>
<details><summary>The recipient wants to stream changes from a shared table. What must the provider do?</summary>
<p>Add the table WITH HISTORY (and enable change data feed if CDF reads are needed).</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.sharing}" target="_blank" rel="noopener">Delta Sharing</a></li></ul>
`);

addChapter(2, '2.8', 'Domain 2 quick review', `
<h2>Requirement &rarr; answer</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Grant reusable access to many people</td><td>Account group</td></tr>
<tr><td>Identity for production jobs</td><td>Service principal (run as)</td></tr>
<tr><td>Sync Entra ID groups</td><td>Automatic identity management / SCIM to the account</td></tr>
<tr><td>Minimum to read a table</td><td>USE CATALOG + USE SCHEMA + SELECT</td></tr>
<tr><td>Write data to a table</td><td>MODIFY (+ USE on parents)</td></tr>
<tr><td>Read all current and future tables in a schema</td><td>SELECT on the schema</td></tr>
<tr><td>Discover without reading</td><td>BROWSE</td></tr>
<tr><td>Delegate grant management</td><td>MANAGE or ownership</td></tr>
<tr><td>Call a UDF</td><td>EXECUTE</td></tr>
<tr><td>Read files in a volume</td><td>READ VOLUME</td></tr>
<tr><td>Read files by path in an external location</td><td>READ FILES</td></tr>
<tr><td>Different rows per user, users query the table</td><td>Row filter</td></tr>
<tr><td>Mask a column per user</td><td>Column mask</td></tr>
<tr><td>Consistent masking across many tables by sensitivity</td><td>ABAC policy + governed tags</td></tr>
<tr><td>Reshaped, secured subset</td><td>Dynamic view</td></tr>
<tr><td>Group check in filters</td><td><code>is_account_group_member()</code></td></tr>
<tr><td>Secrets managed in Azure</td><td>Key Vault-backed secret scope</td></tr>
<tr><td>Read a secret in code</td><td><code>dbutils.secrets.get</code></td></tr>
<tr><td>Secret in Spark config</td><td><code>{{secrets/scope/key}}</code></td></tr>
<tr><td>Who accessed/changed what</td><td><code>system.access.audit</code></td></tr>
<tr><td>Downstream impact of a column change</td><td>Column lineage</td></tr>
<tr><td>Cost by job/tag</td><td><code>system.billing.usage</code> + <code>list_prices</code></td></tr>
<tr><td>Logs into Sentinel/Log Analytics</td><td>Diagnostic settings</td></tr>
<tr><td>Share with another Databricks metastore</td><td>Delta Sharing, Databricks-to-Databricks</td></tr>
<tr><td>Share with non-Databricks tool</td><td>Delta Sharing, open sharing</td></tr>
<tr><td>Joint analysis without exposing rows</td><td>Clean Rooms</td></tr>
</table>

<h2>Ten-question self test</h2>
<ol>
<li>Is there a DENY privilege in Unity Catalog? <i>No.</i></li>
<li>Does ALL PRIVILEGES make you the owner? <i>No.</i></li>
<li>Does a row filter apply to the table owner? <i>Yes.</i></li>
<li>Which secret scope type is read-only from Databricks? <i>Key Vault-backed.</i></li>
<li>Highest secret ACL level? <i>MANAGE.</i></li>
<li>Where do you see lineage in the UI? <i>Catalog Explorer, Lineage tab.</i></li>
<li>Who enables system table schemas? <i>Account admin.</i></li>
<li>Are shares read-write? <i>Read-only.</i></li>
<li>Which clause shares table history for streaming/time travel? <i>WITH HISTORY.</i></li>
<li>Which job setting decouples production from a person? <i>Run as a service principal.</i></li>
</ol>
`);
