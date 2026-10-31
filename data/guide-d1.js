// Study guide - Domain 1: Set up and configure an Azure Databricks environment
addChapter(1, '1.1', 'Azure Databricks architecture and workspace fundamentals', `
<p>Before you can choose compute or design a catalog, you need a clear mental model of <b>where things run</b> and <b>who owns what</b>.
Many exam questions are really architecture questions in disguise: "which plane does this live in?", "which resource group?", "which tier unlocks this feature?".</p>

<h2>The lakehouse in one paragraph</h2>
<p>A lakehouse stores data once, in open formats (primarily Delta Lake, which is Parquet files plus a transaction log), in low-cost cloud object storage
(Azure Data Lake Storage Gen2). On top of that storage it adds the things you used to need a warehouse for: ACID transactions, schema enforcement,
fine-grained governance, indexing-like optimizations and fast SQL. Azure Databricks is the managed platform that provides the compute engines
(Apache Spark, Photon, SQL warehouses), the governance layer (Unity Catalog) and the tooling (notebooks, jobs, pipelines, dashboards) on top of that storage.</p>

<h2>Account, workspace and metastore</h2>
<table>
<tr><th>Concept</th><th>What it is</th><th>Typical count</th></tr>
<tr><td><b>Databricks account</b></td><td>The top-level administrative entity, tied to your Microsoft Entra ID tenant. Managed in the account console. Holds identities (users, groups, service principals), metastores and workspace assignments.</td><td>One per Entra tenant</td></tr>
<tr><td><b>Workspace</b></td><td>The environment users log into: notebooks, jobs, compute, SQL editor, dashboards. Deployed as an Azure resource (<code>Microsoft.Databricks/workspaces</code>) in a resource group and region.</td><td>Several (per environment, team or region)</td></tr>
<tr><td><b>Unity Catalog metastore</b></td><td>The top-level container for data governance metadata. Workspaces are attached to it.</td><td>One per region</td></tr>
</table>
<p>Identities created at the account level can be assigned to many workspaces. This is called <b>identity federation</b> and is the default for Unity Catalog-enabled workspaces:
you manage users and groups once (often synchronized from Entra ID with SCIM or automatic identity management) and grant them access to workspaces and data.</p>

<h2>Control plane vs compute plane</h2>
<p>Azure Databricks splits its architecture into two planes:</p>
<ul>
<li><b>Control plane</b> &ndash; runs in the Databricks-managed Azure subscription. Hosts the web application, notebook storage metadata, job scheduler, cluster manager,
Unity Catalog service and REST APIs. You never deploy or patch it.</li>
<li><b>Compute plane</b> &ndash; where your data is actually processed. There are two kinds:
  <ul>
  <li><b>Classic compute plane</b>: VMs are created <i>in your Azure subscription</i>, inside a <b>managed resource group</b> that Databricks creates when the workspace is deployed
  (by default named something like <code>databricks-rg-&lt;workspace&gt;-&lt;suffix&gt;</code>). You pay Azure for the VMs plus Databricks Units (DBUs).</li>
  <li><b>Serverless compute plane</b>: compute runs in a Databricks-managed subscription in the same region. Databricks handles capacity, patching and start-up. You pay only DBUs (VM cost is included).</li>
  </ul></li>
</ul>
<div class="box note"><b>Remember:</b> the managed resource group has a deny assignment. You cannot modify resources in it directly; you change them through the workspace. Deleting the workspace deletes the managed resource group.</div>

<h2>Workspace storage</h2>
<p>Each workspace has a <b>workspace storage account</b> in the managed resource group. Historically it held the <b>DBFS root</b>, which was a place where people stored data, libraries and init scripts.
Current guidance is clear: <b>do not store production data, libraries or init scripts in DBFS root</b>. Use Unity Catalog managed storage, volumes and workspace files instead.
DBFS mounts (<code>dbutils.fs.mount</code>) are a legacy pattern that bypass Unity Catalog governance and are not supported on serverless or standard access mode compute.</p>

<h2>Pricing tiers</h2>
<p>Azure Databricks workspaces are deployed with a pricing tier. <b>Premium</b> is required for most governance features covered by this exam, including Unity Catalog,
role-based access control on notebooks, jobs and compute, compute policies, audit logs, SQL warehouses and serverless. If a question asks why a governance feature is unavailable,
"the workspace is on the Standard tier" is a strong candidate answer. Upgrading from Standard to Premium is supported in place.</p>

<h2>Networking options</h2>
<table>
<tr><th>Feature</th><th>What it does</th><th>When to choose it</th></tr>
<tr><td><b>VNet injection</b></td><td>Deploys classic compute into a virtual network you own (two subnets: host/public and container/private), so you control NSGs, routes and peering.</td><td>You need to reach on-premises sources, use custom DNS, firewalls or UDRs.</td></tr>
<tr><td><b>Secure cluster connectivity (No Public IP)</b></td><td>Cluster nodes have no public IP addresses; they open an outbound connection to a secure relay in the control plane.</td><td>Default and recommended for almost all deployments.</td></tr>
<tr><td><b>Azure Private Link</b></td><td>Private endpoints for front-end (user to workspace) and/or back-end (compute plane to control plane) connectivity.</td><td>Requirements to keep all traffic off the public internet.</td></tr>
<tr><td><b>IP access lists</b></td><td>Allow or block workspace access from specific IP ranges.</td><td>Restrict who can reach the UI and APIs.</td></tr>
<tr><td><b>Network connectivity configuration (NCC)</b></td><td>Account-level object that defines stable egress IPs or private endpoints for <i>serverless</i> compute to reach your resources.</td><td>Serverless needs to reach a firewalled storage account or database.</td></tr>
</table>
<div class="box trap"><b>Common trap:</b> VNet injection affects only <i>classic</i> compute. Serverless compute never runs in your VNet; to secure its access to your storage, use an NCC with storage firewall rules or private endpoints.</div>

<h2>Personas and workspace areas</h2>
<p>The workspace UI groups features by persona, but the exam expects you to know the objects regardless of UI:</p>
<ul>
<li><b>Workspace browser</b>: folders, notebooks, workspace files, Git folders, queries, dashboards.</li>
<li><b>Catalog Explorer</b>: browse and manage Unity Catalog objects, permissions, lineage and sample data.</li>
<li><b>Compute</b>: all-purpose compute, job compute, SQL warehouses, pools, policies.</li>
<li><b>Jobs &amp; Pipelines</b>: Lakeflow Jobs and Lakeflow Declarative Pipelines.</li>
<li><b>SQL editor, dashboards, Genie, alerts</b>: analytics features backed by SQL warehouses.</li>
</ul>

<h2>Key terms</h2>
<table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td>DBU</td><td>Databricks Unit: a normalized unit of processing capacity billed per second. Rates differ by compute type (jobs compute is cheaper than all-purpose).</td></tr>
<tr><td>Driver</td><td>Node that runs your notebook/application code, plans queries and coordinates tasks.</td></tr>
<tr><td>Worker / executor</td><td>Nodes that run tasks on partitions of data in parallel.</td></tr>
<tr><td>Databricks Runtime (DBR)</td><td>The versioned image (Spark + Delta + libraries + optimizations) running on classic compute.</td></tr>
<tr><td>Serverless environment version</td><td>The equivalent of a runtime version for serverless notebooks and jobs; selected in the notebook's Environment panel.</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>Your security team says no VM may have a public IP. Which feature satisfies this with the least effort?</summary>
<p>Secure cluster connectivity (No Public IP). It is enabled by default on new workspaces and requires no extra infrastructure.</p></details>
<details><summary>A serverless job must read from an ADLS Gen2 account that only allows selected networks. What do you configure?</summary>
<p>A network connectivity configuration (NCC) attached to the workspace, then allow its subnets / private endpoint on the storage account. VNet injection does not apply to serverless.</p></details>
<details><summary>Where do classic cluster VMs appear in Azure?</summary>
<p>In the workspace's managed resource group in your subscription.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}getting-started/overview" target="_blank" rel="noopener">Azure Databricks architecture overview</a></li>
<li><a href="${ML}security/network/" target="_blank" rel="noopener">Networking</a></li>
<li><a href="${R.serverless}" target="_blank" rel="noopener">Serverless compute</a></li></ul>
`);

addChapter(1, '1.2', 'Choosing the right compute', `
<p>"Which compute should you use?" is one of the most frequently tested decisions in Domain 1. The right answer depends on four things:
<b>workload type</b> (interactive, scheduled, SQL/BI), <b>language and API needs</b>, <b>sharing/isolation needs</b>, and <b>cost and start-up time</b>.</p>

<h2>The compute types</h2>
<table>
<tr><th>Compute</th><th>Best for</th><th>Key characteristics</th></tr>
<tr><td><b>Serverless compute for notebooks</b></td><td>Interactive Python and SQL development</td><td>Starts in seconds, no sizing, auto-scales, managed by Databricks. Supports Python and SQL. Dependencies managed with the Environment panel or <code>%pip</code>.</td></tr>
<tr><td><b>Serverless compute for jobs</b></td><td>Scheduled production jobs without infrastructure tuning</td><td>Fast start, automatic optimization and scaling, pay only while running. Can choose a performance-optimized or standard (cost-optimized) mode.</td></tr>
<tr><td><b>All-purpose (classic) compute</b></td><td>Interactive work that needs custom configuration, Scala/R, GPUs, init scripts or specific VM types</td><td>Created manually, shared by users, restarted manually, higher DBU rate than jobs compute.</td></tr>
<tr><td><b>Jobs (classic) compute</b></td><td>Production jobs needing custom configuration</td><td>Created when a job run starts and terminated when it ends. Lower DBU rate. Cannot be restarted or shared interactively.</td></tr>
<tr><td><b>SQL warehouse</b></td><td>SQL queries, dashboards, BI tools (Power BI), Genie, alerts, dbt SQL</td><td>Serverless, Pro or Classic. Photon on by default. Sized with T-shirt sizes and scaled by adding clusters.</td></tr>
<tr><td><b>Lakeflow Declarative Pipelines compute</b></td><td>Pipeline updates</td><td>Serverless (recommended) or classic compute managed by the pipeline; configured in the pipeline settings, not as a separate cluster.</td></tr>
</table>

<h2>Decision guide</h2>
<ol>
<li><b>Is it SQL only (queries, dashboards, BI)?</b> Use a <b>SQL warehouse</b>, preferably serverless.</li>
<li><b>Is it a scheduled job?</b> Use <b>serverless jobs compute</b> unless you need something it does not support; otherwise use a <b>classic job cluster</b>. Never run production jobs on all-purpose compute just because it is already running &ndash; it costs more and mixes workloads.</li>
<li><b>Is it interactive development in Python/SQL?</b> Use <b>serverless notebooks</b>.</li>
<li><b>Need Scala, R, RDD APIs, GPUs, init scripts, custom Spark configs, specific VM SKUs or Docker images?</b> Use <b>classic</b> compute with the appropriate access mode.</li>
<li><b>Small data or single-machine libraries (pandas, scikit-learn)?</b> Use a <b>single node</b> classic cluster or serverless.</li>
</ol>

<h2>Access modes (classic compute)</h2>
<p>Access mode controls <b>who can use the compute</b> and <b>which Unity Catalog features and languages are available</b>.</p>
<table>
<tr><th>Access mode</th><th>Formerly called</th><th>Users</th><th>Languages / APIs</th><th>Notes</th></tr>
<tr><td><b>Standard</b></td><td>Shared</td><td>Many users at once, isolated from each other</td><td>Python, SQL, Scala (recent runtimes). No R. No RDD APIs, no direct Spark context access.</td><td>Recommended default. Row filters, column masks and dynamic views are enforced directly. Init scripts and JARs must be on the <b>allowlist</b>.</td></tr>
<tr><td><b>Dedicated</b></td><td>Single user</td><td>One user, or one <b>group</b></td><td>All languages including R, RDD APIs, ML runtimes, GPUs.</td><td>Use for workloads that standard mode cannot run. Fine-grained access control is enforced via serverless filtering on supported runtimes.</td></tr>
<tr><td>No isolation shared</td><td>(legacy)</td><td>Many users, no isolation</td><td>All</td><td>Not Unity Catalog-enabled. Avoid; can be disabled by admins.</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> When a requirement says "multiple data engineers share one cluster, must be governed by Unity Catalog, and they use Python and SQL", the answer is <b>standard access mode</b>. If the same requirement adds "and an R notebook" or "uses RDDs / <code>sc.parallelize</code>", switch to <b>dedicated</b>.</div>

<h2>Serverless limitations to know</h2>
<ul>
<li>Languages: Python and SQL (no Scala or R notebooks).</li>
<li>No init scripts, no custom Spark configurations (except a small supported set), no choosing VM types.</li>
<li>No RDD APIs, no Spark Context (<code>sc</code>), no DBFS mounts, no Hive metastore-only workflows. Unity Catalog is required.</li>
<li>Libraries come from the notebook/job <b>environment</b> (PyPI packages, wheels in volumes or workspace files, requirements files) rather than cluster libraries.</li>
<li>Outbound network access to your private resources requires an NCC.</li>
</ul>

<h2>SQL warehouse types</h2>
<table>
<tr><th>Type</th><th>Compute location</th><th>Start time</th><th>Features</th></tr>
<tr><td><b>Serverless</b></td><td>Databricks serverless plane</td><td>Seconds</td><td>Intelligent workload management, Predictive I/O, Photon, fastest scaling. Recommended.</td></tr>
<tr><td><b>Pro</b></td><td>Your subscription</td><td>Minutes</td><td>Photon, Predictive I/O, supports Python UDFs, query federation and some workflow integrations. Good when serverless is unavailable or networking requires classic.</td></tr>
<tr><td><b>Classic</b></td><td>Your subscription</td><td>Minutes</td><td>Photon, entry-level performance. Fewer features.</td></tr>
</table>
<p>Warehouse sizing has two dimensions:</p>
<ul>
<li><b>Cluster size</b> (2X-Small to 4X-Large): bigger size = more compute per query = lower latency for <i>complex</i> queries.</li>
<li><b>Scaling (min/max clusters)</b>: more clusters = more <i>concurrent</i> queries without queuing.</li>
</ul>
<div class="box tip"><b>Exam tip:</b> "Queries queue when many analysts run dashboards at 9 AM" &rarr; increase <b>maximum clusters</b>. "A single complex query is slow and spills to disk" &rarr; increase <b>cluster size</b>.</div>

<h2>Single node compute</h2>
<p>A single node cluster has a driver and zero workers; Spark runs locally on the driver. It is cheap and ideal for small datasets, non-distributed libraries and learning.
It is not suitable for large-scale processing, and it cannot autoscale.</p>

<h2>Classic vs serverless at a glance</h2>
<table>
<tr><th>Need</th><th>Serverless</th><th>Classic</th></tr>
<tr><td>Start in seconds</td><td>Yes</td><td>No (minutes; pools help)</td></tr>
<tr><td>Pick VM size / GPU</td><td>No</td><td>Yes</td></tr>
<tr><td>Scala / R</td><td>No</td><td>Yes</td></tr>
<tr><td>Init scripts</td><td>No</td><td>Yes</td></tr>
<tr><td>Runs in my VNet</td><td>No (use NCC)</td><td>Yes (VNet injection)</td></tr>
<tr><td>Cost model</td><td>DBUs only</td><td>DBUs + Azure VMs</td></tr>
<tr><td>Admin effort</td><td>Minimal</td><td>Sizing, runtime upgrades, policies</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>A nightly Python job has no special dependencies. You want the least admin effort and no idle cost. Which compute?</summary>
<p>Serverless compute for jobs.</p></details>
<details><summary>A team shares a cluster and one member needs to run an R script against Unity Catalog tables. What must change?</summary>
<p>R is not supported in standard access mode. Use a dedicated access mode cluster (assigned to the user or the team's group).</p></details>
<details><summary>Power BI users report long waits only during peak hours. Individual queries are fast once they start. What do you change?</summary>
<p>Raise the SQL warehouse maximum cluster count (scale out for concurrency).</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.compute}" target="_blank" rel="noopener">Compute</a></li>
<li><a href="${R.serverless}" target="_blank" rel="noopener">Serverless compute</a></li>
<li><a href="${R.sqlwh}" target="_blank" rel="noopener">SQL warehouses</a></li></ul>
`);

addChapter(1, '1.3', 'Configuring compute: runtime, Photon, scaling, termination and pools', `
<p>Once you have chosen classic compute, you configure it. Each setting below maps to a cost, performance or reliability outcome &ndash; and exam questions usually describe the outcome and ask for the setting.</p>

<h2>Databricks Runtime versions</h2>
<ul>
<li><b>Standard runtime</b>: Spark, Delta Lake, Python/Scala/R and common libraries.</li>
<li><b>ML runtime</b>: adds popular machine learning libraries (TensorFlow, PyTorch, XGBoost, MLflow etc.). Use for ML workloads; not needed for pure data engineering.</li>
<li><b>LTS (Long Term Support)</b>: versions supported for an extended period (typically three years). Use for <b>production</b> to minimise forced upgrades.</li>
<li>Newer non-LTS versions get features sooner but have a shorter support window.</li>
</ul>
<div class="box tip"><b>Exam tip:</b> "Stable production workload, minimise changes" &rarr; latest <b>LTS</b> runtime.</div>

<h2>Photon</h2>
<p>Photon is a native vectorized engine written in C++ that executes Spark SQL and DataFrame operations faster than the JVM-based engine. It is compatible with Spark APIs, so no code changes are needed.</p>
<ul>
<li>Biggest gains: joins, aggregations, scans on Delta/Parquet, writes to Delta, MERGE and wide transformations on large data.</li>
<li>Little or no gain: Python/Scala UDFs, RDD code, very short queries (under a couple of seconds), workloads dominated by external calls.</li>
<li>On by default for SQL warehouses and serverless. A checkbox on classic compute; Photon compute has a higher DBU rate, usually offset by shorter run time.</li>
</ul>

<h2>Worker and driver types</h2>
<ul>
<li><b>General purpose</b> (balanced) &ndash; default for most ETL.</li>
<li><b>Memory optimized</b> &ndash; large joins/aggregations, caching, spill problems.</li>
<li><b>Compute optimized</b> &ndash; CPU-heavy transformations, streaming with small state.</li>
<li><b>Storage optimized</b> (local NVMe SSD) &ndash; benefits from <b>disk cache</b> for repeated reads of the same data.</li>
<li><b>GPU</b> &ndash; deep learning, some ML workloads.</li>
</ul>
<p>The driver is usually the same type as workers. Make the driver larger only when code collects lots of data to the driver (<code>collect()</code>, <code>toPandas()</code>) or many notebooks attach to one cluster.</p>

<h2>Autoscaling</h2>
<p>With autoscaling you set <b>min workers</b> and <b>max workers</b>. Databricks adds workers when tasks are pending and removes them when they are idle (optimized autoscaling on Premium scales down aggressively).</p>
<ul>
<li>Good for variable workloads and shared interactive clusters.</li>
<li>Less ideal for <b>Structured Streaming</b> on classic compute &ndash; classic autoscaling does not scale down well for streams. Use fixed size, serverless, or Lakeflow Declarative Pipelines with enhanced autoscaling.</li>
<li>Fixed-size clusters give predictable performance and cost for predictable batch jobs.</li>
</ul>

<h2>Auto termination</h2>
<p>All-purpose compute stops after N minutes of inactivity (default 120 in the UI; set lower such as 30&ndash;60 for development). Jobs compute terminates automatically when the run ends, so the setting does not apply.
A terminated cluster keeps its configuration and can be restarted; its local data and cached state are lost.</p>
<div class="box trap"><b>Common trap:</b> Auto termination does not stop a cluster that is actively running a query or a streaming job, and a notebook with a running stream counts as activity.</div>

<h2>Spot instances</h2>
<p>Azure spot VMs are discounted but can be evicted. In Databricks you can use spot for <b>workers</b> with "fall back to on-demand" so evicted capacity is replaced. Keep the <b>driver on-demand</b>: losing the driver fails the whole application.
Spot is ideal for fault-tolerant batch jobs, not for latency-critical streaming.</p>

<h2>Instance pools</h2>
<p>A pool keeps a set of idle, ready VMs. Clusters that use the pool take VMs from it instead of requesting them from Azure, which cuts start and scale-up time.</p>
<table>
<tr><th>Pool setting</th><th>Effect</th></tr>
<tr><td>Min idle instances</td><td>VMs kept warm at all times. You pay Azure VM cost for idle instances, <b>but no DBUs</b>.</td></tr>
<tr><td>Max capacity</td><td>Upper bound on idle + in-use instances.</td></tr>
<tr><td>Idle instance auto termination</td><td>Minutes before extra idle instances above the minimum are released.</td></tr>
<tr><td>Preloaded runtime</td><td>Pre-downloads a runtime version to speed up start further.</td></tr>
<tr><td>On-demand / spot</td><td>Pool instance availability type.</td></tr>
</table>
<p>The driver and workers can use different pools (for example, on-demand pool for drivers and a spot pool for workers). Serverless makes pools largely unnecessary because it starts quickly by design.</p>

<h2>Init scripts</h2>
<p>An init script is a shell script that runs on every node during start-up, before Spark starts. Use it for OS packages, agents or files that cannot be installed as libraries.</p>
<ul>
<li><b>Cluster-scoped</b>: configured on one cluster (or via a policy). Recommended.</li>
<li><b>Global</b>: runs on every cluster in the workspace; admin-only. Use sparingly.</li>
<li>Store scripts in <b>workspace files</b> or <b>Unity Catalog volumes</b>, not DBFS. Scripts in volumes used on standard access mode must be on the metastore <b>allowlist</b>.</li>
<li>Not available on serverless.</li>
<li>Logs can be delivered to a destination you configure (cluster log delivery) for troubleshooting.</li>
</ul>

<h2>Spark configuration and environment variables</h2>
<p>Under <i>Advanced options</i> you can set Spark configs (for example <code>spark.sql.shuffle.partitions</code>) and environment variables. Reference secrets safely with the
<code>{{secrets/&lt;scope&gt;/&lt;key&gt;}}</code> syntax so values are not stored in plain text.</p>

<h2>Tags</h2>
<p>Custom tags on compute are propagated to Azure VMs and to billing/usage data, enabling chargeback by team or project. Policies can force specific tags.</p>

<h2>Configuration-to-outcome cheat sheet</h2>
<table>
<tr><th>Requirement</th><th>Setting</th></tr>
<tr><td>Start interactive clusters faster</td><td>Instance pool (or serverless)</td></tr>
<tr><td>Stop paying for forgotten dev clusters</td><td>Auto termination</td></tr>
<tr><td>Cheaper fault-tolerant batch</td><td>Spot workers with on-demand fallback, jobs compute</td></tr>
<tr><td>Faster SQL/DataFrame aggregations</td><td>Photon</td></tr>
<tr><td>Fewer runtime upgrades in production</td><td>LTS runtime</td></tr>
<tr><td>Handle bursts of work</td><td>Autoscaling</td></tr>
<tr><td>Install an OS package</td><td>Init script</td></tr>
<tr><td>Track cost per department</td><td>Custom tags (enforced by policy)</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>Clusters take 6 minutes to start each morning. Which feature reduces this while keeping classic compute?</summary>
<p>An instance pool with min idle instances (optionally preloaded runtime).</p></details>
<details><summary>A job uses spot workers and occasionally fails entirely. What is the likely cause and fix?</summary>
<p>The driver is on a spot VM and is evicted. Run the driver on-demand.</p></details>
<details><summary>A Python UDF-heavy job shows no speed-up after enabling Photon. Why?</summary>
<p>Photon does not accelerate Python UDF execution; it accelerates built-in SQL/DataFrame operators. Replace UDFs with built-in functions where possible.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.compute}" target="_blank" rel="noopener">Compute configuration reference</a></li>
<li><a href="${R.photon}" target="_blank" rel="noopener">Photon</a></li>
<li><a href="${R.pools}" target="_blank" rel="noopener">Pools</a></li></ul>
`);

addChapter(1, '1.4', 'Compute policies and cost governance', `
<p>Compute policies let administrators control what users can create. They are the main tool for <b>cost control</b>, <b>standardization</b> and <b>self-service with guardrails</b>.</p>

<h2>What a policy does</h2>
<ul>
<li>Restricts or fixes attribute values (VM types, max workers, runtime, auto termination, tags).</li>
<li>Hides attributes from the UI so users see a simpler form.</li>
<li>Sets defaults.</li>
<li>Limits how many clusters each user can create with the policy (<b>max compute resources per user</b>).</li>
<li>Can install <b>libraries</b> on every cluster created from the policy.</li>
<li>Is granted with the <b>CAN USE</b> permission to users, groups or service principals.</li>
</ul>
<p>Workspace admins can create unrestricted compute; non-admin users without the "unrestricted cluster creation" entitlement can only create compute through policies they can use.</p>

<h2>Policy definition types</h2>
<table>
<tr><th>Type</th><th>Meaning</th><th>Example</th></tr>
<tr><td><code>fixed</code></td><td>Value is set and cannot be changed (add <code>"hidden": true</code> to hide it)</td><td>Force <code>autotermination_minutes</code> = 30</td></tr>
<tr><td><code>forbidden</code></td><td>Attribute cannot be set</td><td>Forbid <code>instance_pool_id</code></td></tr>
<tr><td><code>allowlist</code></td><td>Value must be one of a list</td><td>Allowed VM types</td></tr>
<tr><td><code>blocklist</code></td><td>Value must not be one of a list</td><td>Block GPU VM types</td></tr>
<tr><td><code>regex</code></td><td>Value must match a pattern</td><td>Runtime must be an LTS version</td></tr>
<tr><td><code>range</code></td><td>Numeric min/max</td><td>Max workers between 1 and 10</td></tr>
<tr><td><code>unlimited</code></td><td>No restriction, but can set a default or make it required (<code>isOptional: false</code>)</td><td>Require a cost-center tag</td></tr>
</table>

<h2>Example policy</h2>
<pre><code>{
  "autotermination_minutes": { "type": "range", "maxValue": 60, "defaultValue": 30 },
  "autoscale.max_workers":   { "type": "range", "maxValue": 8 },
  "node_type_id":            { "type": "allowlist", "values": ["Standard_D4ds_v5", "Standard_D8ds_v5"] },
  "spark_version":           { "type": "regex", "pattern": "1[4-9]\\\\.[0-9]+\\\\.x-scala.*" },
  "data_security_mode":      { "type": "fixed", "value": "USER_ISOLATION", "hidden": true },
  "custom_tags.CostCenter":  { "type": "unlimited", "isOptional": false },
  "custom_tags.Team":        { "type": "fixed", "value": "data-eng" }
}</code></pre>
<p><code>USER_ISOLATION</code> is the API value for standard access mode; <code>SINGLE_USER</code> is dedicated. Policies can reference the virtual attribute <code>dbus_per_hour</code> to cap hourly cost.</p>

<h2>Policy families</h2>
<p>Databricks provides built-in templates you can use directly or extend with overrides:</p>
<ul>
<li><b>Personal Compute</b> &ndash; single-node, dedicated access mode; often granted to all users so they can self-serve small clusters.</li>
<li><b>Shared Compute</b> &ndash; multi-node, standard access mode.</li>
<li><b>Power User Compute</b> &ndash; larger, more flexible multi-node clusters.</li>
<li><b>Job Compute</b> &ndash; for jobs clusters.</li>
<li><b>Legacy Shared Compute</b> &ndash; for no-isolation clusters (avoid).</li>
</ul>
<p>When a family's template is updated by Databricks, policies that inherit from it pick up changes automatically, while your overrides remain.</p>

<h2>Applying policies to jobs</h2>
<p>Job clusters can reference a policy with <code>policy_id</code>. Combined with the Job Compute family and enforced tags, this standardizes job cost reporting. Serverless jobs instead use <b>serverless budget policies</b>, which attach tags for cost attribution.</p>

<h2>Other cost controls</h2>
<ul>
<li><b>Budgets</b> in the account console alert when spend crosses thresholds.</li>
<li><b>System tables</b> (<code>system.billing.usage</code>, <code>system.billing.list_prices</code>) let you query usage by tag, SKU, workspace or job.</li>
<li>Prefer <b>jobs compute</b> or <b>serverless</b> over all-purpose compute for scheduled work.</li>
<li>Use auto termination, autoscaling and spot workers.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Analysts keep creating 20-node clusters. You want them limited to 4 workers with no other change in their experience. What do you do?</summary>
<p>Create a policy with <code>autoscale.max_workers</code> / <code>num_workers</code> range max 4, grant analysts CAN USE, and remove their unrestricted cluster creation entitlement.</p></details>
<details><summary>Finance needs a CostCenter tag on every cluster but values vary per team. Which policy type?</summary>
<p><code>unlimited</code> with <code>isOptional: false</code> (required, any value), or <code>allowlist</code> of valid cost centers.</p></details>
<details><summary>Which policy attribute would cap the hourly cost of a cluster regardless of VM type?</summary>
<p>The virtual attribute <code>dbus_per_hour</code> with a <code>range</code> limit.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.policies}" target="_blank" rel="noopener">Compute policies</a></li>
<li><a href="${R.systables}" target="_blank" rel="noopener">System tables</a></li></ul>
`);

addChapter(1, '1.5', 'Libraries and dependency management', `
<p>Data engineering code depends on packages: connectors, utility modules, your own wheel files. Databricks gives you several scopes for installing them. The exam tests which scope fits which requirement.</p>

<h2>Library scopes</h2>
<table>
<tr><th>Scope</th><th>How</th><th>Visible to</th><th>Use when</th></tr>
<tr><td><b>Compute-scoped</b></td><td>Compute &gt; Libraries tab, policy, or job task <code>libraries</code></td><td>All notebooks/jobs on that cluster</td><td>Team-wide dependencies, JARs, Maven packages</td></tr>
<tr><td><b>Notebook-scoped</b></td><td><code>%pip install</code> in the notebook</td><td>Current notebook session only</td><td>Per-notebook versions, experimentation, avoiding conflicts on shared compute</td></tr>
<tr><td><b>Serverless environment</b></td><td>Environment panel / job <code>environments</code> with dependencies</td><td>That notebook or job task</td><td>Any dependency on serverless</td></tr>
<tr><td><b>Workspace files / Git folders</b></td><td>Put <code>.py</code> modules next to notebooks and <code>import</code> them</td><td>Code that can read those files</td><td>Your own shared helper modules</td></tr>
</table>

<h2>Library sources</h2>
<ul>
<li><b>PyPI</b>, <b>Maven</b>, <b>CRAN</b> &ndash; public or private repositories (configure a private index URL if required).</li>
<li><b>Unity Catalog volumes</b> &ndash; recommended place for wheels and JARs. Access is governed (users need READ VOLUME). On standard access mode, JARs must be allowlisted.</li>
<li><b>Workspace files</b> &ndash; wheels, <code>requirements.txt</code> and modules stored in the workspace.</li>
<li><b>DBFS</b> &ndash; deprecated as a library source; avoid.</li>
</ul>

<h2>Notebook-scoped libraries in practice</h2>
<pre><code>%pip install /Volumes/main/tools/libs/my_utils-1.2.0-py3-none-any.whl
%pip install -r /Workspace/Shared/project/requirements.txt
%pip install great-expectations==1.1.0</code></pre>
<ul>
<li>Put <code>%pip</code> commands at the <b>top</b> of the notebook. Installing resets the Python state, so variables defined earlier are lost.</li>
<li>Call <code>dbutils.library.restartPython()</code> after upgrading a package that is already imported.</li>
<li>Notebook-scoped installs on jobs run each time the job runs; for heavy dependencies a cluster library or serverless environment may be faster and more reproducible.</li>
</ul>

<h2>Importing your own modules</h2>
<p>With workspace files and Git folders, the notebook's directory is on <code>sys.path</code>, so a file <code>utils/cleaning.py</code> beside the notebook can be imported with <code>from utils.cleaning import normalize</code>.
For larger code bases, package them as a <b>wheel</b> (built by CI or Databricks Asset Bundles) and install it.</p>

<h2>Library precedence and conflicts</h2>
<ul>
<li>Notebook-scoped libraries take precedence over compute libraries for that notebook.</li>
<li>Runtime-bundled versions can conflict with what you install; pin versions and test on the same runtime as production.</li>
<li>Libraries installed on a running cluster require a restart only when <b>uninstalling</b> or replacing JARs.</li>
</ul>

<h2>Serverless environments</h2>
<p>On serverless, choose an <b>environment version</b> (which fixes the Python and base package versions) and add dependencies such as PyPI specs, wheel paths in volumes, or a requirements file.
In jobs you define an <code>environments</code> block and reference it from tasks with <code>environment_key</code>. This makes serverless jobs reproducible without clusters.</p>

<h2>Check yourself</h2>
<details><summary>Two data scientists share a cluster and need different versions of the same package. What do you recommend?</summary>
<p>Notebook-scoped libraries with <code>%pip install</code> in each notebook.</p></details>
<details><summary>Where should a team store its internal wheel so access is governed by Unity Catalog?</summary>
<p>In a Unity Catalog volume, with READ VOLUME granted to the users or service principals that install it.</p></details>
<details><summary>A JAR from a volume fails to install on a standard access mode cluster. Why?</summary>
<p>The JAR path is not on the metastore allowlist; a metastore admin must add it.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.libs}" target="_blank" rel="noopener">Libraries</a></li>
<li><a href="${R.volumes}" target="_blank" rel="noopener">Volumes</a></li></ul>
`);

addChapter(1, '1.6', 'Setting up Unity Catalog: metastore, credentials and external locations', `
<p>Unity Catalog (UC) is the governance layer for all data and AI assets in Azure Databricks. This chapter covers the <b>plumbing</b>: how UC reaches storage securely and how workspaces connect to it.
Permissions themselves are covered in Domain 2.</p>

<h2>The object hierarchy</h2>
<pre><code>Metastore (one per region)
 |-- Catalog
 |    |-- Schema (database)
 |         |-- Table / View / Materialized view / Streaming table
 |         |-- Volume
 |         |-- Function
 |         |-- Model
 |-- Storage credential
 |-- External location
 |-- Connection (Lakehouse Federation)
 |-- Share / Recipient / Provider (Delta Sharing)</code></pre>
<p>Data objects are addressed with a <b>three-level namespace</b>: <code>catalog.schema.object</code>.</p>

<h2>Metastore</h2>
<ul>
<li>Created at the account level, <b>one per region</b>. All workspaces in that region attach to the same metastore, which makes data sharable across workspaces.</li>
<li>New workspaces are typically <b>enabled for Unity Catalog automatically</b>, with a metastore created/assigned and a <b>workspace catalog</b> provisioned.</li>
<li>The <b>metastore admin</b> role is optional and powerful; many organizations assign it to a group rather than individuals.</li>
<li>Metastore-level managed storage is optional; you can define managed storage at catalog or schema level instead.</li>
</ul>

<h2>How UC reaches storage</h2>
<p>Users never get storage keys. Instead, UC holds a credential and vends short-lived tokens to compute when a user's permissions allow access.</p>
<ol>
<li>Create an <b>Access Connector for Azure Databricks</b> (Azure resource). It has a system-assigned or user-assigned <b>managed identity</b>.</li>
<li>Grant that managed identity <b>Storage Blob Data Contributor</b> on the ADLS Gen2 storage account (or container).</li>
<li>Create a <b>storage credential</b> in UC that references the access connector's resource ID (service principals are also supported but managed identities are recommended).</li>
<li>Create an <b>external location</b> that combines an <code>abfss://</code> path with that storage credential.</li>
<li>Grant privileges on the external location (for example CREATE EXTERNAL TABLE, READ FILES, CREATE MANAGED STORAGE).</li>
</ol>
<pre><code>CREATE STORAGE CREDENTIAL ...;   -- usually done in Catalog Explorer for managed identities

CREATE EXTERNAL LOCATION sales_landing
  URL 'abfss://landing@contosodl.dfs.core.windows.net/sales'
  WITH (STORAGE CREDENTIAL contoso_mi)
  COMMENT 'Raw sales files';

GRANT READ FILES ON EXTERNAL LOCATION sales_landing TO \`data-engineers\`;</code></pre>
<div class="box tip"><b>Exam tip:</b> Order of operations questions: <b>access connector &rarr; RBAC role on storage &rarr; storage credential &rarr; external location &rarr; grants &rarr; catalog/table/volume</b>.</div>
<div class="box note"><b>Why managed identities?</b> No secrets to rotate, and with a user-assigned identity you can also reach storage accounts protected by firewalls via resource instance rules.</div>

<h2>Managed storage locations</h2>
<p>Managed tables and managed volumes need somewhere to store data. UC chooses the <b>most specific</b> managed location defined:</p>
<p><b>schema location &gt; catalog location &gt; metastore location</b></p>
<pre><code>CREATE CATALOG finance MANAGED LOCATION 'abfss://finance@contosodl.dfs.core.windows.net/';
CREATE SCHEMA finance.gl MANAGED LOCATION 'abfss://finance@contosodl.dfs.core.windows.net/gl';</code></pre>
<p>A managed location must be inside an external location, and the creator needs CREATE MANAGED STORAGE on it. Use separate storage per catalog when you need physical isolation (for example, per business unit or for regulatory reasons).</p>

<h2>Workspace-catalog binding</h2>
<p>By default a catalog is accessible from every workspace attached to the metastore (subject to permissions). With <b>workspace binding</b> you set the catalog to <i>isolated</i> and list the workspaces that may use it.
Typical use: the <code>prod</code> catalog is writable only from the production workspace, and readable (read-only binding) from dev.</p>
<p>External locations and storage credentials can be bound to workspaces in the same way.</p>

<h2>Default catalog</h2>
<p>Each workspace has a <b>default catalog</b> used when a query omits the catalog name. Change it in workspace settings, per cluster with <code>spark.databricks.sql.initial.catalog.name</code>, or per session with <code>USE CATALOG</code>.</p>
<pre><code>USE CATALOG dev;
USE SCHEMA sales;
SELECT * FROM orders;   -- resolves to dev.sales.orders</code></pre>

<h2>Legacy Hive metastore</h2>
<p>Older workspaces have a per-workspace Hive metastore exposed as the <code>hive_metastore</code> catalog. To move to UC you can upgrade tables (SYNC, CTAS, deep clone, or UCX tooling) or use <b>Hive metastore federation</b> to govern them through UC while you migrate.</p>

<h2>Check yourself</h2>
<details><summary>What Azure role does the access connector's managed identity need on ADLS Gen2 for read/write tables?</summary>
<p>Storage Blob Data Contributor.</p></details>
<details><summary>A catalog has a managed location; one schema in it has its own managed location. Where do managed tables in that schema go?</summary>
<p>To the schema's managed location (most specific wins).</p></details>
<details><summary>The prod catalog must not be visible from the dev workspace. What do you configure?</summary>
<p>Workspace-catalog binding: set the catalog to isolated and bind it only to the prod workspace.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.uc}" target="_blank" rel="noopener">Unity Catalog</a></li>
<li><a href="${ML}connect/unity-catalog/cloud-storage/" target="_blank" rel="noopener">Connect to cloud storage using Unity Catalog</a></li></ul>
`);

addChapter(1, '1.7', 'Catalogs, schemas, tables and volumes', `
<p>This chapter covers the data objects you create every day and the differences the exam loves to test: <b>managed vs external</b>, <b>table vs volume</b>, and how to organise catalogs and schemas.</p>

<h2>Designing catalogs and schemas</h2>
<p>Common patterns:</p>
<ul>
<li><b>By environment</b>: <code>dev</code>, <code>test</code>, <code>prod</code> catalogs, each with the same schemas. Simplifies promotion and isolation (combine with workspace binding).</li>
<li><b>By business unit / domain</b>: <code>sales</code>, <code>finance</code>, <code>hr</code> catalogs. Good for data mesh ownership.</li>
<li><b>By medallion layer</b>: schemas <code>bronze</code>, <code>silver</code>, <code>gold</code> inside a catalog (or separate catalogs).</li>
</ul>
<p>Combine them as needed, for example <code>prod_sales.silver.orders</code>. Grant at the highest level that is still correct; privileges are inherited downwards.</p>

<h2>Managed vs external tables</h2>
<table>
<tr><th></th><th>Managed table</th><th>External table</th></tr>
<tr><td>Where data lives</td><td>UC managed storage (catalog/schema/metastore location)</td><td>A path you specify with <code>LOCATION</code> inside an external location</td></tr>
<tr><td>DROP TABLE</td><td>Deletes metadata <b>and</b> data (files removed after a retention period; <code>UNDROP</code> possible within 7 days)</td><td>Deletes metadata only; files remain</td></tr>
<tr><td>Formats</td><td>Delta (and managed Iceberg)</td><td>Delta, Parquet, CSV, JSON, Avro, ORC, text</td></tr>
<tr><td>Optimizations</td><td>Predictive optimization, automatic liquid clustering, faster metadata</td><td>Must be managed by you</td></tr>
<tr><td>Access by path from other tools</td><td>Not supported; access through UC</td><td>Other systems can read files directly</td></tr>
<tr><td>Recommended</td><td><b>Default choice</b></td><td>When data must stay at an existing path or be written by external systems</td></tr>
</table>
<pre><code>-- Managed
CREATE TABLE prod.sales.orders (
  order_id BIGINT NOT NULL,
  customer_id BIGINT,
  amount DECIMAL(10,2),
  order_ts TIMESTAMP
) CLUSTER BY (order_ts);

-- External
CREATE TABLE prod.sales.orders_ext
LOCATION 'abfss://lake@contosodl.dfs.core.windows.net/sales/orders';

-- Create from query (CTAS)
CREATE OR REPLACE TABLE prod.sales.big_orders AS
SELECT * FROM prod.sales.orders WHERE amount > 1000;</code></pre>
<div class="box trap"><b>Common trap:</b> "Dropping the table must not delete the underlying files" &rarr; external table. "Databricks should handle file layout and maintenance automatically" &rarr; managed table.</div>

<h2>Volumes</h2>
<p>Volumes govern <b>non-tabular</b> files: CSV/JSON landing files, images, PDFs, model artifacts, wheels, init scripts. Paths have the form:</p>
<pre><code>/Volumes/&lt;catalog&gt;/&lt;schema&gt;/&lt;volume&gt;/&lt;path&gt;</code></pre>
<table>
<tr><th></th><th>Managed volume</th><th>External volume</th></tr>
<tr><td>Storage</td><td>Schema's managed location</td><td>An existing path in an external location</td></tr>
<tr><td>DROP VOLUME</td><td>Deletes files</td><td>Files remain</td></tr>
<tr><td>Use for</td><td>New file storage governed end to end</td><td>Files written by other systems (e.g. ADF, partners)</td></tr>
</table>
<pre><code>CREATE VOLUME prod.raw.landing;
CREATE EXTERNAL VOLUME prod.raw.partner_drop
  LOCATION 'abfss://partner@contosodl.dfs.core.windows.net/drop';

GRANT READ VOLUME, WRITE VOLUME ON VOLUME prod.raw.landing TO \`ingest-sp\`;</code></pre>
<p>Volumes work with Spark (<code>spark.read.csv("/Volumes/...")</code>), with Python file APIs (<code>open()</code>), <code>dbutils.fs</code>, the Databricks CLI, and SQL (<code>LIST '/Volumes/...'</code>, <code>read_files()</code>).</p>
<div class="box tip"><b>Exam tip:</b> "Govern access to raw JSON files before they become tables" &rarr; volume. "Query the data with SQL and apply row filters" &rarr; table.</div>

<h2>Table properties and comments</h2>
<p>Add documentation and metadata so data is discoverable:</p>
<pre><code>COMMENT ON TABLE prod.sales.orders IS 'One row per order, deduplicated';
ALTER TABLE prod.sales.orders ALTER COLUMN amount COMMENT 'Gross amount in EUR';
ALTER TABLE prod.sales.orders SET TAGS ('domain' = 'sales', 'pii' = 'false');
ALTER TABLE prod.sales.orders SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');</code></pre>
<p>AI-generated comments in Catalog Explorer can draft descriptions for review.</p>

<h2>Schema evolution at creation time</h2>
<ul>
<li><code>CREATE TABLE IF NOT EXISTS</code> &ndash; no error if it exists; does not change it.</li>
<li><code>CREATE OR REPLACE TABLE</code> &ndash; atomically replaces definition and data while keeping table history.</li>
<li><code>CREATE TABLE ... LIKE</code> &ndash; copies the definition without data.</li>
<li><code>SHALLOW CLONE</code> / <code>DEEP CLONE</code> &ndash; copy metadata only, or metadata and data (covered in Domain 3).</li>
</ul>

<h2>Useful commands</h2>
<pre><code>SHOW CATALOGS;
SHOW SCHEMAS IN prod;
SHOW TABLES IN prod.sales;
DESCRIBE TABLE EXTENDED prod.sales.orders;
DESCRIBE DETAIL prod.sales.orders;   -- format, location, size, numFiles, clustering
UNDROP TABLE prod.sales.orders;      -- managed tables, within retention window</code></pre>

<h2>Check yourself</h2>
<details><summary>A partner drops CSV files into a storage container daily. You must govern who can read them before ingestion. What object?</summary>
<p>An external volume over that path (inside an external location), with READ VOLUME granted to the ingestion identity.</p></details>
<details><summary>Someone dropped a managed table yesterday. Can you recover it?</summary>
<p>Yes, with <code>UNDROP TABLE</code> within the retention window (7 days).</p></details>
<details><summary>Which command shows the storage location and number of files of a Delta table?</summary>
<p><code>DESCRIBE DETAIL</code>.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.tables}" target="_blank" rel="noopener">Tables</a></li>
<li><a href="${R.volumes}" target="_blank" rel="noopener">Volumes</a></li></ul>
`);

addChapter(1, '1.8', 'Views, materialized views, streaming tables and functions', `
<p>Beyond tables, Unity Catalog hosts several derived objects. Choosing between them is about <b>freshness</b>, <b>cost</b> and <b>who maintains the refresh</b>.</p>

<h2>Comparison</h2>
<table>
<tr><th>Object</th><th>Stores data?</th><th>Freshness</th><th>Typical use</th></tr>
<tr><td><b>View</b></td><td>No</td><td>Always current (computed at query time)</td><td>Simplify or secure access to tables; light transformations</td></tr>
<tr><td><b>Temporary view</b></td><td>No</td><td>Session only</td><td>Intermediate steps inside a notebook or SQL session</td></tr>
<tr><td><b>Materialized view</b></td><td>Yes</td><td>As of last refresh (scheduled or triggered); incremental when possible</td><td>Expensive aggregations for dashboards; gold-layer tables</td></tr>
<tr><td><b>Streaming table</b></td><td>Yes</td><td>As of last update; processes only new data</td><td>Incremental ingestion from files or message buses; append-only sources</td></tr>
<tr><td><b>Metric view</b></td><td>No</td><td>Query time</td><td>Centrally defined business measures and dimensions</td></tr>
</table>

<h2>Views</h2>
<pre><code>CREATE OR REPLACE VIEW prod.sales.v_orders_eu AS
SELECT order_id, customer_id, amount
FROM prod.sales.orders
WHERE region = 'EU';

CREATE OR REPLACE TEMP VIEW tmp_recent AS
SELECT * FROM prod.sales.orders WHERE order_ts &gt; current_date() - INTERVAL 7 DAYS;</code></pre>
<p>Users of a view need SELECT on the view (plus USE CATALOG/USE SCHEMA); they do <b>not</b> need SELECT on the underlying tables, because the view owner's privileges are used. This makes views a governance tool (Domain 2 covers dynamic views).</p>

<h2>Materialized views</h2>
<pre><code>CREATE OR REPLACE MATERIALIZED VIEW prod.sales.daily_revenue
SCHEDULE EVERY 1 HOUR
AS SELECT date(order_ts) AS order_date, sum(amount) AS revenue
FROM prod.sales.orders
GROUP BY ALL;

REFRESH MATERIALIZED VIEW prod.sales.daily_revenue;</code></pre>
<ul>
<li>Created in Databricks SQL (refreshed by a serverless pipeline managed for you) or inside Lakeflow Declarative Pipelines.</li>
<li>Refresh is <b>incremental</b> when the query and sources allow it (row tracking/change data feed on sources helps); otherwise it fully recomputes.</li>
<li>Scheduling: <code>SCHEDULE</code>/<code>TRIGGER ON UPDATE</code> clauses, a job task, or pipeline triggers.</li>
</ul>

<h2>Streaming tables</h2>
<pre><code>CREATE OR REFRESH STREAMING TABLE prod.raw.orders_bronze
SCHEDULE EVERY 15 MINUTES
AS SELECT *, _metadata.file_path AS source_file
FROM STREAM read_files(
  '/Volumes/prod/raw/landing/orders/',
  format =&gt; 'json');</code></pre>
<ul>
<li>Each record from the source is processed <b>exactly once</b>; previously processed files are not reprocessed.</li>
<li>Best for <b>append-only</b> sources. For updates/deletes from CDC feeds use AUTO CDC (Domain 3).</li>
<li>Backed by Auto Loader when reading files.</li>
</ul>
<div class="box tip"><b>Exam tip:</b> "Dashboard aggregation, pre-computed, refreshed hourly" &rarr; materialized view. "Ingest new files incrementally with SQL only" &rarr; streaming table. "Always up to date, no storage" &rarr; view.</div>

<h2>User-defined functions</h2>
<p>Functions registered in UC are reusable and governed (EXECUTE privilege).</p>
<pre><code>CREATE OR REPLACE FUNCTION prod.util.mask_email(email STRING)
RETURNS STRING
RETURN concat(left(email, 1), '***@', split(email, '@')[1]);

CREATE OR REPLACE FUNCTION prod.util.clean_phone(p STRING)
RETURNS STRING
LANGUAGE PYTHON
AS $$
import re
return re.sub(r'[^0-9+]', '', p) if p else None
$$;

SELECT prod.util.mask_email(email) FROM prod.crm.customers;</code></pre>
<ul>
<li><b>SQL UDFs</b> are inlined into the query plan and perform well.</li>
<li><b>Python UDFs</b> in UC run in a secure sandbox; slower than built-ins &ndash; prefer built-in functions.</li>
<li>Functions are also used for <b>row filters</b> and <b>column masks</b> (Domain 2).</li>
<li>Table-valued functions (<code>RETURNS TABLE</code>) return a result set.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>A dashboard query over 2 billion rows runs every few minutes, but the data changes hourly. What object reduces cost?</summary>
<p>A materialized view refreshed hourly.</p></details>
<details><summary>Analysts must see only EU orders but must not have SELECT on the base table. What do you create?</summary>
<p>A view filtering to EU, with SELECT granted on the view only.</p></details>
<details><summary>What keyword makes a streaming table read a source incrementally in SQL?</summary>
<p><code>STREAM</code>, e.g. <code>FROM STREAM read_files(...)</code> or <code>FROM STREAM(table)</code>.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.views}" target="_blank" rel="noopener">Views</a></li>
<li><a href="${R.mv}" target="_blank" rel="noopener">Materialized views</a></li>
<li><a href="${R.ldp}" target="_blank" rel="noopener">Lakeflow Declarative Pipelines (streaming tables)</a></li></ul>
`);

addChapter(1, '1.9', 'Lakehouse Federation and AI/BI Genie', `
<h2>Lakehouse Federation</h2>
<p>Lakehouse Federation lets you <b>query external databases in place</b> through Unity Catalog, without first copying the data. Supported sources include Azure SQL Database, SQL Server,
Azure Synapse, PostgreSQL, MySQL, Snowflake, Oracle, Teradata, Amazon Redshift, Google BigQuery and other Databricks workspaces.</p>

<h3>Two objects</h3>
<ol>
<li><b>Connection</b> &ndash; stores host, port and credentials (use <code>secret()</code> to avoid plain text).</li>
<li><b>Foreign catalog</b> &ndash; mirrors one database from the connection as a UC catalog; its tables appear as <code>foreign_catalog.schema.table</code>.</li>
</ol>
<pre><code>CREATE CONNECTION azsql_crm TYPE sqlserver
OPTIONS (
  host 'crm-sql.database.windows.net',
  port '1433',
  user secret('crm', 'sql-user'),
  password secret('crm', 'sql-password')
);

CREATE FOREIGN CATALOG crm_live
USING CONNECTION azsql_crm
OPTIONS (database 'crm');

SELECT c.name, sum(o.amount)
FROM crm_live.dbo.customers c
JOIN prod.sales.orders o ON o.customer_id = c.id
GROUP BY c.name;</code></pre>
<ul>
<li>Queries are <b>read-only</b> and filters/projections are <b>pushed down</b> to the source where possible.</li>
<li>UC governance (grants, lineage, audit) applies to foreign catalogs.</li>
<li>Privileges: CREATE CONNECTION on the metastore; USE CONNECTION / CREATE FOREIGN CATALOG on the connection.</li>
<li>Runs on serverless, SQL warehouses (Pro/Serverless) and UC-enabled classic compute.</li>
</ul>
<div class="box tip"><b>When to federate vs ingest:</b> federate for ad-hoc exploration, proofs of concept, small lookups and occasional reports. <b>Ingest</b> (Lakeflow Connect, pipelines) when queries are frequent, large, need history, or the source system must not be loaded by analytics queries.</div>
<div class="box note"><b>Catalog federation</b> also exists for external metastores such as a legacy Hive metastore or AWS Glue, letting UC govern those tables directly while you migrate.</div>

<h2>AI/BI Genie spaces</h2>
<p>A Genie space lets business users ask questions in natural language and get answers as SQL results and charts. A data engineer or analyst curates the space so answers are accurate.</p>
<h3>Building a good Genie space</h3>
<ul>
<li>Add a <b>small, focused set of tables</b> (ideally gold-layer, well-modelled).</li>
<li>Write <b>table and column comments</b> &ndash; Genie uses UC metadata.</li>
<li>Add <b>instructions</b> (business rules, definitions like "active customer").</li>
<li>Add <b>example SQL queries</b> and trusted assets (parameterized queries / functions) for common questions.</li>
<li>Attach a <b>SQL warehouse</b> (serverless recommended).</li>
<li>Review user questions and feedback, then refine.</li>
</ul>
<p>Users need access to the space and SELECT on the underlying data &ndash; Genie respects Unity Catalog permissions, row filters and column masks.</p>

<h2>Check yourself</h2>
<details><summary>Finance wants to join a live Azure SQL table with lakehouse data once a week without building a pipeline. What do you use?</summary>
<p>Lakehouse Federation: a connection plus a foreign catalog.</p></details>
<details><summary>How do you keep the SQL password out of the CREATE CONNECTION statement?</summary>
<p>Reference a secret with <code>secret('scope','key')</code>.</p></details>
<details><summary>Genie gives wrong answers about "net revenue". What is the first fix?</summary>
<p>Add instructions/definitions and example SQL for net revenue, and improve column comments.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.federation}" target="_blank" rel="noopener">Lakehouse Federation</a></li>
<li><a href="${R.genie}" target="_blank" rel="noopener">AI/BI Genie</a></li></ul>
`);

addChapter(1, '1.10', 'Domain 1 quick review', `
<p>Use this chapter for last-minute revision. Each line is a requirement-to-answer pair.</p>

<h2>Compute</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>SQL dashboards / Power BI</td><td>Serverless SQL warehouse</td></tr>
<tr><td>Scheduled job, minimal admin</td><td>Serverless jobs compute</td></tr>
<tr><td>Scheduled job needing init script or Scala</td><td>Classic jobs compute</td></tr>
<tr><td>Shared cluster, Python + SQL, UC governance</td><td>Standard access mode</td></tr>
<tr><td>R, RDD APIs, ML runtime, GPU</td><td>Dedicated access mode</td></tr>
<tr><td>Small data, single-machine library</td><td>Single node</td></tr>
<tr><td>Faster classic start-up</td><td>Instance pool</td></tr>
<tr><td>Faster joins/aggregations, no code change</td><td>Photon</td></tr>
<tr><td>Stable production runtime</td><td>LTS</td></tr>
<tr><td>Cut idle cost</td><td>Auto termination</td></tr>
<tr><td>Cheap batch workers</td><td>Spot with fallback; driver on-demand</td></tr>
<tr><td>Peak-hour SQL queuing</td><td>Increase max clusters</td></tr>
<tr><td>Single slow complex SQL query</td><td>Increase warehouse size</td></tr>
<tr><td>Limit cluster size / enforce tags</td><td>Compute policy</td></tr>
<tr><td>Serverless reaching firewalled storage</td><td>Network connectivity configuration</td></tr>
</table>

<h2>Libraries</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Different package versions per notebook</td><td><code>%pip install</code> (notebook-scoped)</td></tr>
<tr><td>Same library for every job on a cluster</td><td>Compute-scoped library</td></tr>
<tr><td>Governed storage for wheels/JARs</td><td>UC volume</td></tr>
<tr><td>Dependencies on serverless</td><td>Environment (environment version + dependencies)</td></tr>
<tr><td>Import own .py modules</td><td>Workspace files / Git folders</td></tr>
</table>

<h2>Unity Catalog setup</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Identity UC uses for ADLS</td><td>Access Connector managed identity</td></tr>
<tr><td>Azure role for that identity</td><td>Storage Blob Data Contributor</td></tr>
<tr><td>Wrap the identity in UC</td><td>Storage credential</td></tr>
<tr><td>Path + credential</td><td>External location</td></tr>
<tr><td>Isolate a catalog to some workspaces</td><td>Workspace-catalog binding</td></tr>
<tr><td>Separate physical storage per catalog</td><td>Catalog managed location</td></tr>
<tr><td>Drop must keep files</td><td>External table / external volume</td></tr>
<tr><td>Automatic maintenance</td><td>Managed table (predictive optimization)</td></tr>
<tr><td>Govern raw files</td><td>Volume</td></tr>
<tr><td>Recover dropped managed table</td><td><code>UNDROP TABLE</code></td></tr>
</table>

<h2>Derived objects and external data</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Always-current logic, no storage</td><td>View</td></tr>
<tr><td>Precomputed aggregate, scheduled refresh</td><td>Materialized view</td></tr>
<tr><td>Incremental file ingestion in SQL</td><td>Streaming table with <code>read_files</code></td></tr>
<tr><td>Reusable governed logic</td><td>UC function</td></tr>
<tr><td>Query Azure SQL in place</td><td>Connection + foreign catalog</td></tr>
<tr><td>Natural-language Q&amp;A for business users</td><td>Genie space</td></tr>
</table>

<h2>Ten-question self test</h2>
<ol>
<li>Which access mode supports R? <i>Dedicated.</i></li>
<li>Do idle pool instances incur DBUs? <i>No, only VM cost.</i></li>
<li>Where should init scripts be stored? <i>Workspace files or UC volumes.</i></li>
<li>Which policy type makes a value required but free-form? <i>unlimited with isOptional false.</i></li>
<li>Which is more specific: catalog or schema managed location? <i>Schema.</i></li>
<li>What does dropping an external volume do to the files? <i>Nothing; files remain.</i></li>
<li>Which object processes each source record exactly once? <i>Streaming table.</i></li>
<li>Are federated queries read-write? <i>Read-only.</i></li>
<li>What is the API value for standard access mode? <i>USER_ISOLATION.</i></li>
<li>Which tier is needed for Unity Catalog? <i>Premium.</i></li>
</ol>
`);
