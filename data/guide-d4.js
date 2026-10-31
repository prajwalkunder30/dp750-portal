// Study guide - Domain 4: Deploy and maintain data pipelines and workloads
addChapter(4, '4.1', 'Lakeflow Jobs: tasks and compute', `
<p>Lakeflow Jobs (formerly Databricks Workflows) is the built-in orchestrator. A <b>job</b> is a DAG of <b>tasks</b>, each with its own type, compute, parameters, dependencies and retry policy.</p>

<h2>Task types</h2>
<table>
<tr><th>Task type</th><th>Runs</th></tr>
<tr><td>Notebook</td><td>A notebook from the workspace or a remote Git repo</td></tr>
<tr><td>Python script</td><td>A <code>.py</code> file (workspace, volume or Git)</td></tr>
<tr><td>Python wheel</td><td>An entry point in a packaged wheel</td></tr>
<tr><td>JAR</td><td>A Scala/Java main class</td></tr>
<tr><td>SQL</td><td>A query, SQL file, dashboard refresh or alert on a SQL warehouse</td></tr>
<tr><td>Pipeline</td><td>An update of a Lakeflow Declarative Pipeline</td></tr>
<tr><td>dbt</td><td>dbt commands against a SQL warehouse</td></tr>
<tr><td>Run Job</td><td>Another job (modular orchestration)</td></tr>
<tr><td>If/else condition</td><td>Branching on a boolean expression</td></tr>
<tr><td>For each</td><td>Loops a nested task over a list of inputs</td></tr>
<tr><td>Power BI</td><td>Publishes / refreshes a Power BI semantic model from UC tables</td></tr>
</table>

<h2>Dependencies</h2>
<p>Each task lists the tasks it <b>depends on</b>. Tasks without mutual dependencies run in <b>parallel</b>. The Jobs UI shows the DAG and a timeline (Gantt) of each run.</p>

<h2>Compute for tasks</h2>
<table>
<tr><th>Option</th><th>Pros</th><th>Cons</th></tr>
<tr><td><b>Serverless jobs compute</b></td><td>Fast start, no tuning, pay per use; performance-optimized or standard mode</td><td>Python/SQL only, no init scripts</td></tr>
<tr><td><b>Shared job cluster</b> (<code>job_cluster_key</code>)</td><td>Several tasks reuse one classic cluster in a run &ndash; avoids repeated start-up; jobs DBU rate</td><td>Lives only for that run</td></tr>
<tr><td>Per-task new job cluster</td><td>Isolation and right-sizing per task</td><td>Start-up time per task</td></tr>
<tr><td>Existing all-purpose cluster</td><td>Quick for testing</td><td><b>Higher cost</b>, shared with interactive users &ndash; avoid in production</td></tr>
<tr><td>SQL warehouse</td><td>For SQL, dashboard, alert, dbt tasks</td><td>SQL only</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> "Five notebook tasks run sequentially and each spends 5 minutes starting a cluster" &rarr; use a <b>shared job cluster</b> or <b>serverless</b>.</div>

<h2>Job-level settings</h2>
<ul>
<li><b>Run as</b>: user or service principal (use a service principal in production).</li>
<li><b>Max concurrent runs</b>: default 1. New triggers while a run is active are <b>queued</b> (queueing enabled by default) or skipped.</li>
<li><b>Tags</b>: propagate to compute for cost attribution.</li>
<li><b>Permissions</b>: CAN VIEW, CAN MANAGE RUN, CAN MANAGE, IS OWNER.</li>
<li><b>Git source</b>: tasks can run code from a specific branch, tag or commit of a remote repository.</li>
<li><b>Environments</b>: dependency definitions for serverless tasks.</li>
</ul>

<h2>Job definition as JSON (excerpt)</h2>
<pre><code>{
  "name": "orders-daily",
  "run_as": { "service_principal_name": "6f0c...-sp" },
  "max_concurrent_runs": 1,
  "job_clusters": [{ "job_cluster_key": "etl",
     "new_cluster": { "spark_version": "15.4.x-scala2.12", "node_type_id": "Standard_D8ds_v5",
                      "autoscale": { "min_workers": 2, "max_workers": 8 } } }],
  "tasks": [
    { "task_key": "ingest", "job_cluster_key": "etl",
      "notebook_task": { "notebook_path": "/Workspace/etl/ingest" } },
    { "task_key": "transform", "depends_on": [{ "task_key": "ingest" }], "job_cluster_key": "etl",
      "notebook_task": { "notebook_path": "/Workspace/etl/transform" } },
    { "task_key": "refresh_gold", "depends_on": [{ "task_key": "transform" }],
      "pipeline_task": { "pipeline_id": "a1b2..." } }
  ]
}</code></pre>

<h2>Check yourself</h2>
<details><summary>Why avoid running production tasks on an all-purpose cluster?</summary>
<p>Higher DBU price and contention with interactive users; jobs compute or serverless is cheaper and isolated.</p></details>
<details><summary>A job is triggered again while the previous run is still active and max concurrent runs = 1. What happens by default?</summary>
<p>The new run is queued.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.jobs}" target="_blank" rel="noopener">Lakeflow Jobs</a></li></ul>
`);

addChapter(4, '4.2', 'Triggers, parameters and control flow', `
<h2>Triggers</h2>
<table>
<tr><th>Trigger</th><th>Starts a run when</th><th>Use for</th></tr>
<tr><td><b>Scheduled</b></td><td>A cron schedule (Quartz syntax) in a chosen time zone fires</td><td>Nightly/hourly batch</td></tr>
<tr><td><b>File arrival</b></td><td>New files appear in a UC volume or external location path</td><td>Event-driven ingestion without always-on compute</td></tr>
<tr><td><b>Table update</b></td><td>Specified UC tables are updated</td><td>Downstream processing as soon as upstream data lands</td></tr>
<tr><td><b>Continuous</b></td><td>Always: a new run starts as soon as the previous ends</td><td>Streaming jobs that must always run</td></tr>
<tr><td>Manual / API / Run Job task</td><td>On demand, external orchestrators, parent jobs</td><td>Ad hoc, ADF, modular jobs</td></tr>
</table>
<pre><code>"schedule": { "quartz_cron_expression": "0 30 2 * * ?", "timezone_id": "Europe/Amsterdam", "pause_status": "UNPAUSED" }
"trigger":  { "file_arrival": { "url": "/Volumes/prod/raw/landing/orders/", "min_time_between_triggers_seconds": 300 } }</code></pre>
<div class="box tip"><b>Exam tip:</b> "Start processing when partner files land, and do not run compute while waiting" &rarr; <b>file arrival trigger</b> (plus Auto Loader with availableNow inside the task).</div>

<h2>Job parameters</h2>
<ul>
<li>Defined at job level as key/value pairs with defaults; <b>pushed down to every task</b>.</li>
<li>Notebooks read them as widgets: <code>dbutils.widgets.get("run_date")</code>; Python scripts receive them as arguments; SQL uses <code>:param</code> markers.</li>
<li>Override at run time ("Run now with different parameters", API, or a parent Run Job task).</li>
</ul>

<h2>Dynamic value references</h2>
<table>
<tr><th>Reference</th><th>Value</th></tr>
<tr><td><code>{{job.id}}</code>, <code>{{job.run_id}}</code></td><td>Job and run identifiers</td></tr>
<tr><td><code>{{job.start_time.iso_date}}</code></td><td>Run start date</td></tr>
<tr><td><code>{{job.trigger.type}}</code>, <code>{{job.trigger.file_arrival.location}}</code></td><td>Trigger information</td></tr>
<tr><td><code>{{job.parameters.region}}</code></td><td>A job parameter</td></tr>
<tr><td><code>{{tasks.validate.values.row_count}}</code></td><td>A task value set by an upstream task</td></tr>
<tr><td><code>{{tasks.ingest.result_state}}</code></td><td>Upstream task outcome</td></tr>
</table>

<h2>Task values</h2>
<pre><code># upstream task "validate"
dbutils.jobs.taskValues.set(key="row_count", value=df.count())

# downstream task
n = dbutils.jobs.taskValues.get(taskKey="validate", key="row_count", default=0, debugValue=0)</code></pre>
<p>Task values are for <b>small</b> JSON-serialisable values (counts, flags, file lists), not datasets. Pass data through tables.</p>

<h2>If/else condition task</h2>
<pre><code>{ "task_key": "has_data",
  "depends_on": [{ "task_key": "validate" }],
  "condition_task": { "op": "GREATER_THAN", "left": "{{tasks.validate.values.row_count}}", "right": "0" } }
{ "task_key": "load", "depends_on": [{ "task_key": "has_data", "outcome": "true" }], ... }</code></pre>

<h2>For each task</h2>
<p>Runs a nested task once per element of a list (static JSON array or a task value), with configurable <b>concurrency</b>. Inside, reference the element with <code>{{input}}</code>.</p>
<pre><code>"for_each_task": {
  "inputs": "[\\"emea\\", \\"apac\\", \\"amer\\"]",
  "concurrency": 3,
  "task": { "task_key": "load_region",
            "notebook_task": { "notebook_path": "/Workspace/etl/load", "base_parameters": { "region": "{{input}}" } } } }</code></pre>

<h2>Run if dependencies</h2>
<table>
<tr><th>Run if</th><th>Task runs when</th></tr>
<tr><td>All succeeded (default)</td><td>Every upstream task succeeded</td></tr>
<tr><td>At least one succeeded</td><td>Any upstream succeeded</td></tr>
<tr><td>None failed</td><td>No upstream failed (skipped allowed)</td></tr>
<tr><td>All done</td><td>Upstream tasks finished, regardless of result &ndash; good for cleanup/notification</td></tr>
<tr><td>At least one failed</td><td>Any upstream failed &ndash; error handling path</td></tr>
<tr><td>All failed</td><td>Every upstream failed</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> "A cleanup task must run whether or not the load succeeded" &rarr; <b>All done</b>. "Send a custom alert only when something failed" &rarr; <b>At least one failed</b>.</div>

<h2>Modular jobs</h2>
<p>The <b>Run Job</b> task calls another job, passing parameters. Use it to reuse common workflows (e.g. a shared "publish to BI" job) instead of duplicating tasks.</p>

<h2>Check yourself</h2>
<details><summary>How does a notebook task read job parameter <code>run_date</code>?</summary>
<p><code>dbutils.widgets.get("run_date")</code>.</p></details>
<details><summary>A downstream task must know how many files the upstream task processed. How?</summary>
<p>Upstream sets a task value; downstream reads it with taskValues.get or <code>{{tasks.x.values.key}}</code>.</p></details>
<details><summary>Process 40 country files with the same notebook, 5 at a time. Which task type?</summary>
<p>For each task with concurrency 5.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.jobs}" target="_blank" rel="noopener">Lakeflow Jobs</a></li>
<li><a href="${ML}jobs/triggers" target="_blank" rel="noopener">Job triggers</a></li>
<li><a href="${ML}jobs/dynamic-value-references" target="_blank" rel="noopener">Dynamic value references</a></li></ul>
`);

addChapter(4, '4.3', 'Reliability: retries, timeouts, notifications and repair', `
<h2>Retries</h2>
<ul>
<li>Configured per task: <b>max retries</b>, <b>min interval between retries</b>, and whether to retry on timeout.</li>
<li>Good for transient issues: network blips, spot evictions, throttling, Auto Loader stopping to add new columns.</li>
<li>Make tasks <b>idempotent</b> so a retry does not duplicate data: MERGE instead of blind append, <code>replaceWhere</code> overwrites, streaming checkpoints, COPY INTO.</li>
<li>Continuous jobs retry automatically with exponential back-off.</li>
</ul>

<h2>Timeouts and duration thresholds</h2>
<ul>
<li><b>Timeout</b>: task or job is cancelled after N seconds &ndash; protects against hung runs.</li>
<li><b>Duration warning</b> threshold: sends a notification when a run exceeds an expected time but keeps it running.</li>
<li><b>Streaming backlog</b> thresholds alert when a streaming task falls behind (seconds, bytes, records, files).</li>
</ul>

<h2>Notifications</h2>
<table>
<tr><th>Event</th><th>Typical use</th></tr>
<tr><td>Start</td><td>Rarely; long-running jobs</td></tr>
<tr><td>Success</td><td>Inform consumers that data is ready</td></tr>
<tr><td>Failure</td><td>On-call alerting</td></tr>
<tr><td>Duration warning</td><td>SLA risk</td></tr>
<tr><td>Streaming backlog</td><td>Stream falling behind</td></tr>
</table>
<p>Destinations: email, and <b>notification destinations</b> configured by admins &ndash; Microsoft Teams, Slack, PagerDuty, generic webhooks. Options let you mute notifications for skipped or cancelled runs and only alert on the last retry.</p>

<h2>Repair and rerun</h2>
<ul>
<li><b>Repair run</b> reruns only <b>failed and skipped</b> tasks (and their dependents) in the existing run; successful tasks are not rerun. You can change parameters for the repair.</li>
<li>Saves time and cost versus running the whole job again, and keeps one run history.</li>
<li>For declarative pipelines, a failed update can be retried, or a <b>full refresh</b> of selected tables can be started if state is corrupted.</li>
</ul>
<div class="box tip"><b>Exam tip:</b> "Task 4 of 6 failed due to a bug; you fixed the notebook. Rerun without reprocessing tasks 1&ndash;3" &rarr; <b>Repair run</b>.</div>

<h2>Designing for failure</h2>
<ul>
<li>Separate ingestion, transformation and publishing tasks so failures are isolated and repairable.</li>
<li>Use <b>All done</b> cleanup and <b>At least one failed</b> handler tasks.</li>
<li>Write audit/control tables (run id, rows processed, status) from tasks for traceability.</li>
<li>Use Delta transactions: a failed write leaves the table unchanged.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>A job sometimes fails because a spot worker is evicted. Cheapest mitigation?</summary>
<p>Task retries (and on-demand fallback for spot); keep the driver on-demand.</p></details>
<details><summary>Stakeholders want to know if the nightly job runs longer than 2 hours, without killing it.</summary>
<p>Duration warning threshold with a notification.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}jobs/repair-job-failures" target="_blank" rel="noopener">Repair job failures</a></li>
<li><a href="${ML}jobs/notifications" target="_blank" rel="noopener">Job notifications</a></li></ul>
`);

addChapter(4, '4.4', 'Operating Lakeflow Declarative Pipelines', `
<h2>Pipeline modes</h2>
<table>
<tr><th>Setting</th><th>Option A</th><th>Option B</th></tr>
<tr><td>Execution</td><td><b>Triggered</b>: process available data then stop compute. Cheapest for batch/periodic.</td><td><b>Continuous</b>: keep running for low latency; compute always on.</td></tr>
<tr><td>Environment</td><td><b>Development</b>: reuses compute between updates, no automatic retries &ndash; fast iteration.</td><td><b>Production</b>: restarts compute on recoverable errors, retries automatically.</td></tr>
<tr><td>Compute</td><td><b>Serverless</b> (recommended): managed, enhanced autoscaling, incremental MV refresh. Performance-optimized or standard mode.</td><td><b>Classic</b>: you choose VM types, policies, enhanced autoscaling.</td></tr>
</table>

<h2>Updates and refreshes</h2>
<ul>
<li><b>Update</b> (default): processes new data incrementally for streaming tables and refreshes materialized views.</li>
<li><b>Refresh selection</b>: update only chosen tables.</li>
<li><b>Full refresh</b>: truncates streaming tables and reprocesses all source data; clears checkpoints. Use after logic changes requiring reprocessing &ndash; but beware sources whose old data is no longer available (e.g. Kafka retention).</li>
<li>Protect tables from accidental full refresh with table property <code>pipelines.reset.allowed = false</code>.</li>
</ul>
<div class="box trap"><b>Common trap:</b> A full refresh of a bronze streaming table reading from Event Hubs loses history if events beyond retention are gone. Set <code>pipelines.reset.allowed = false</code> on such tables.</div>

<h2>Scheduling</h2>
<p>Triggered pipelines are scheduled from the pipeline UI (which creates a job) or, better, as a <b>pipeline task</b> in a Lakeflow Job alongside other tasks. Table update and file arrival triggers can start that job.</p>

<h2>The event log</h2>
<p>Every pipeline writes an event log with progress, lineage, data quality metrics, autoscaling and errors. Publish it to a UC table in pipeline settings, or query with the <code>event_log()</code> table-valued function.</p>
<pre><code>SELECT timestamp, details:flow_progress.data_quality.expectations
FROM event_log(TABLE(prod.silver.orders_silver))
WHERE event_type = 'flow_progress'
ORDER BY timestamp DESC;</code></pre>
<p>Use it for quality dashboards, SLA tracking and alerts (e.g. SQL alert when dropped rows exceed a threshold).</p>

<h2>Parameters and environments</h2>
<ul>
<li>Pipeline <b>configuration</b> key/values (e.g. <code>source_path</code>, <code>env</code>) let one code base run in dev/test/prod.</li>
<li>Set the target <b>catalog/schema</b> per environment.</li>
<li>Define pipelines in <b>Databricks Asset Bundles</b> for repeatable deployment (chapter 4.6).</li>
</ul>

<h2>Permissions</h2>
<p>Pipeline ACLs: CAN VIEW, CAN RUN, CAN MANAGE, IS OWNER. The pipeline runs as its owner or a configured run-as service principal, which needs UC privileges on sources and targets.</p>

<h2>Troubleshooting</h2>
<ul>
<li>Graph view shows failing dataset; event log details the error.</li>
<li>Schema change errors in streaming tables may need a full refresh of that table.</li>
<li>Expectation failures with FAIL UPDATE stop the update &ndash; inspect the event log for the violating rule.</li>
<li>Slow MV refresh: check whether refresh was incremental or full in the event log (<code>planning_information</code>); enable row tracking/CDF on sources to allow incremental refresh.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>A pipeline must run every 4 hours as cheaply as possible.</summary>
<p>Triggered mode, serverless, scheduled through a job.</p></details>
<details><summary>Where do you find how many rows an expectation dropped last week?</summary>
<p>The pipeline event log (flow_progress data quality metrics).</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.ldp}" target="_blank" rel="noopener">Lakeflow Declarative Pipelines</a></li>
<li><a href="${ML}ldp/monitor-event-logs" target="_blank" rel="noopener">Pipeline event log</a></li></ul>
`);

addChapter(4, '4.5', 'Source control with Git folders', `
<p><b>Git folders</b> (formerly Repos) connect a remote Git repository to the workspace so notebooks, Python files, SQL files and pipeline code are version controlled.</p>

<h2>Supported providers</h2>
<p>GitHub, GitHub Enterprise, Azure DevOps (Azure Repos), GitLab, Bitbucket and others. Each user configures Git credentials (personal access token, or OAuth/GitHub App; Microsoft Entra ID for Azure DevOps).</p>

<h2>Operations in the UI</h2>
<ul>
<li>Clone, create branch, switch branch, pull, commit and push, merge, rebase, resolve conflicts, reset.</li>
<li>Diffs for notebooks are shown cell by cell. Notebooks are stored as source files (<code>.py</code>, <code>.sql</code>) or <code>.ipynb</code>.</li>
<li>Sparse checkout limits which folders are cloned in large monorepos.</li>
</ul>

<h2>Recommended workflow</h2>
<ol>
<li>Each developer has their own Git folder (under their user folder) and works in a feature branch.</li>
<li>Commit and push; open a pull request in the Git provider; peers review.</li>
<li>CI runs tests and validation on the PR.</li>
<li>Merge to main; CD deploys to staging/production (bundles or an automation-owned Git folder updated via API).</li>
</ol>
<div class="box trap"><b>Common trap:</b> Do not run production jobs from a developer's personal Git folder. Use bundles, a Git source on the job (branch/tag), or a production Git folder updated only by automation.</div>

<h2>Jobs with Git source</h2>
<p>A job can reference a remote repository directly (<code>git_source</code> with URL, provider and branch/tag/commit). Each run checks out that version, guaranteeing the code that runs matches Git.</p>

<h2>What not to commit</h2>
<ul>
<li>Secrets &ndash; use secret scopes.</li>
<li>Large data files &ndash; use volumes.</li>
<li>Notebook outputs (can be excluded via settings / commit outputs option).</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Two developers edit the same notebook. How do they avoid overwriting each other's work?</summary>
<p>Each works in a separate Git folder and branch, and merges via pull requests.</p></details>
<details><summary>A job must always run code from the <code>release</code> tag. How?</summary>
<p>Configure the job's Git source with that tag.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.repos}" target="_blank" rel="noopener">Git folders</a></li></ul>
`);

addChapter(4, '4.6', 'Databricks Asset Bundles and the CLI', `
<p><b>Databricks Asset Bundles</b> (DABs) describe jobs, pipelines, dashboards, schemas, volumes and other resources as YAML alongside your source code, and deploy them consistently to multiple environments with the Databricks CLI. They are the recommended infrastructure-as-code approach for Databricks workloads.</p>

<h2>Bundle structure</h2>
<pre><code>my_project/
  databricks.yml
  resources/
    orders_job.yml
    orders_pipeline.yml
  src/
    ingest.py
    transform.sql
    my_package/...
  tests/
    test_transform.py</code></pre>

<h2>databricks.yml</h2>
<pre><code>bundle:
  name: orders

include:
  - resources/*.yml

variables:
  catalog:
    description: Target catalog
    default: dev

targets:
  dev:
    mode: development
    default: true
    workspace:
      host: https://adb-1111111111111111.11.azuredatabricks.net

  prod:
    mode: production
    workspace:
      host: https://adb-2222222222222222.22.azuredatabricks.net
      root_path: /Workspace/Shared/.bundle/\${bundle.name}/\${bundle.target}
    variables:
      catalog: prod
    run_as:
      service_principal_name: 6f0c0000-aaaa-bbbb-cccc-000000000000</code></pre>

<h2>A job resource</h2>
<pre><code>resources:
  jobs:
    orders_job:
      name: orders-\${bundle.target}
      schedule:
        quartz_cron_expression: "0 0 2 * * ?"
        timezone_id: UTC
      parameters:
        - name: catalog
          default: \${var.catalog}
      tasks:
        - task_key: ingest
          notebook_task:
            notebook_path: ../src/ingest.py
        - task_key: refresh
          depends_on:
            - task_key: ingest
          pipeline_task:
            pipeline_id: \${resources.pipelines.orders_pipeline.id}</code></pre>

<h2>Targets and modes</h2>
<table>
<tr><th></th><th><code>mode: development</code></th><th><code>mode: production</code></th></tr>
<tr><td>Resource names</td><td>Prefixed with <code>[dev username]</code></td><td>As defined</td></tr>
<tr><td>Schedules/triggers</td><td>Paused</td><td>Active</td></tr>
<tr><td>Pipelines</td><td>Development mode</td><td>Production mode</td></tr>
<tr><td>Concurrency</td><td>Allows multiple devs to deploy side by side</td><td>Validates settings such as run_as and shared root path</td></tr>
</table>

<h2>CLI commands</h2>
<table>
<tr><th>Command</th><th>Does</th></tr>
<tr><td><code>databricks bundle init</code></td><td>Create a project from a template (e.g. default-python, default-sql, dbt-sql)</td></tr>
<tr><td><code>databricks bundle validate</code></td><td>Check configuration syntax and references</td></tr>
<tr><td><code>databricks bundle deploy -t prod</code></td><td>Upload files and create/update resources in the target</td></tr>
<tr><td><code>databricks bundle run -t prod orders_job</code></td><td>Run a deployed job or pipeline</td></tr>
<tr><td><code>databricks bundle summary</code></td><td>Show deployed resources and URLs</td></tr>
<tr><td><code>databricks bundle generate job --existing-job-id 123</code></td><td>Create bundle YAML from an existing job</td></tr>
<tr><td><code>databricks bundle destroy -t dev</code></td><td>Delete deployed resources</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> Order of operations: <b>init &rarr; (edit) &rarr; validate &rarr; deploy &rarr; run</b>. "Promote the same job definition to test and prod with different catalogs" &rarr; bundle <b>targets</b> with <b>variables</b>.</div>

<h2>Other CLI uses</h2>
<pre><code>databricks auth login --host https://adb-...azuredatabricks.net   # OAuth user login, creates a profile
databricks jobs list
databricks jobs run-now 123
databricks fs cp ./data.csv dbfs:/Volumes/dev/raw/landing/data.csv
databricks secrets put-secret crm sql-password
databricks workspace import-dir ./src /Workspace/Shared/src</code></pre>
<p>Authentication: OAuth (U2M for users, M2M for service principals), Azure CLI / managed identity, or workload identity federation in CI. Profiles are stored in <code>.databrickscfg</code>.</p>

<h2>Alternatives</h2>
<ul>
<li><b>Terraform</b> (Databricks provider): broad infrastructure &ndash; workspaces, UC objects, permissions. Often combined with bundles (Terraform for platform, bundles for workloads).</li>
<li><b>REST API / SDKs</b>: custom automation.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Which command catches a typo in a resource reference before anything is deployed?</summary>
<p><code>databricks bundle validate</code>.</p></details>
<details><summary>Developers deploy the same bundle to the dev workspace without clashing. What makes that possible?</summary>
<p>Development mode prefixes resource names with the user and pauses schedules.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.bundles}" target="_blank" rel="noopener">Databricks Asset Bundles</a></li>
<li><a href="${R.cli}" target="_blank" rel="noopener">Databricks CLI</a></li></ul>
`);

addChapter(4, '4.7', 'CI/CD pipelines', `
<h2>Environment strategy</h2>
<ul>
<li>Separate <b>dev</b>, <b>test/staging</b> and <b>prod</b> &ndash; as separate workspaces and/or catalogs, with workspace-catalog binding.</li>
<li>Promote <b>code</b>, not data: the same bundle deploys to each target with environment-specific variables.</li>
<li>Only automation (a service principal) deploys to production.</li>
</ul>

<h2>Typical pipeline</h2>
<ol>
<li><b>PR opened</b>: lint, unit tests (pytest), <code>bundle validate</code>.</li>
<li><b>Merge to main</b>: <code>bundle deploy -t staging</code>, run integration tests with <code>bundle run</code>.</li>
<li><b>Approval / release</b>: <code>bundle deploy -t prod</code>.</li>
</ol>

<h2>GitHub Actions example</h2>
<pre><code>name: deploy
on:
  push:
    branches: [main]
permissions:
  id-token: write      # needed for workload identity federation
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: prod
    env:
      DATABRICKS_HOST: https://adb-2222222222222222.22.azuredatabricks.net
      DATABRICKS_CLIENT_ID: 6f0c0000-aaaa-bbbb-cccc-000000000000
      DATABRICKS_AUTH_TYPE: github-oidc
    steps:
      - uses: actions/checkout@v4
      - uses: databricks/setup-cli@main
      - run: pip install -r requirements-dev.txt &amp;&amp; pytest tests/unit
      - run: databricks bundle validate -t prod
      - run: databricks bundle deploy -t prod</code></pre>

<h2>Azure DevOps</h2>
<p>Same steps in an Azure Pipelines YAML: install the CLI, authenticate as a service principal (via an Azure Resource Manager service connection with workload identity federation, or OAuth M2M secret from a variable group linked to Key Vault), then validate/deploy/run.</p>

<h2>Authentication options for automation</h2>
<table>
<tr><th>Method</th><th>Secrets to manage</th><th>Recommendation</th></tr>
<tr><td><b>Workload identity federation</b> (OIDC)</td><td>None long-lived</td><td>Best</td></tr>
<tr><td>OAuth M2M (client ID + secret of a Databricks service principal)</td><td>Client secret</td><td>Good; store secret in Key Vault/CI secrets</td></tr>
<tr><td>Entra ID service principal secret</td><td>Client secret</td><td>Acceptable</td></tr>
<tr><td>Personal access token</td><td>Long-lived token tied to a person</td><td>Avoid</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> "CI must deploy without storing long-lived secrets" &rarr; <b>workload identity federation</b> for a service principal.</div>

<h2>Promoting data objects</h2>
<ul>
<li>Schemas, volumes and grants can be defined in bundles or Terraform.</li>
<li>Table DDL lives in code (pipelines create their own tables).</li>
<li>Use parameters (catalog name) instead of hard-coded <code>dev.</code>/<code>prod.</code> prefixes.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Which identity should run <code>bundle deploy -t prod</code> in CI?</summary>
<p>A service principal with deploy permissions in the prod workspace.</p></details>
<details><summary>What GitHub Actions permission is required for OIDC federation?</summary>
<p><code>id-token: write</code>.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}dev-tools/ci-cd/" target="_blank" rel="noopener">CI/CD on Azure Databricks</a></li>
<li><a href="${ML}dev-tools/auth/oauth-federation" target="_blank" rel="noopener">Workload identity federation</a></li></ul>
`);

addChapter(4, '4.8', 'Testing data pipelines', `
<h2>The test pyramid for data</h2>
<table>
<tr><th>Level</th><th>What</th><th>Where / how</th></tr>
<tr><td><b>Unit tests</b></td><td>Single transformation functions on small in-memory DataFrames</td><td>pytest, locally (Databricks Connect or local Spark) or in CI</td></tr>
<tr><td><b>Integration tests</b></td><td>A whole job/pipeline end to end on representative data</td><td>Staging workspace/catalog, triggered by CI with <code>bundle run</code></td></tr>
<tr><td><b>Data quality tests</b></td><td>Rules on real data in every run</td><td>Expectations, constraints, assertions</td></tr>
</table>

<h2>Write testable code</h2>
<p>Move logic out of notebooks into functions in Python modules that take and return DataFrames. Notebooks become thin wrappers that read, call functions and write.</p>
<pre><code># src/my_package/transforms.py
from pyspark.sql import DataFrame, functions as F

def clean_orders(df: DataFrame) -&gt; DataFrame:
    return (df.filter(F.col("order_id").isNotNull())
              .withColumn("country", F.upper(F.trim("country")))
              .dropDuplicates(["order_id"]))</code></pre>

<h2>Unit test with pytest</h2>
<pre><code># tests/test_transforms.py
import pytest
from pyspark.sql import SparkSession
from pyspark.testing import assertDataFrameEqual
from my_package.transforms import clean_orders

@pytest.fixture(scope="session")
def spark():
    # DatabricksSession.builder.getOrCreate() when using Databricks Connect
    return SparkSession.builder.getOrCreate()

def test_clean_orders(spark):
    src = spark.createDataFrame(
        [(1, " nl "), (1, " nl "), (None, "de")], "order_id INT, country STRING")
    expected = spark.createDataFrame([(1, "NL")], "order_id INT, country STRING")
    assertDataFrameEqual(clean_orders(src), expected)</code></pre>
<ul>
<li><code>pyspark.testing.assertDataFrameEqual</code> / <code>assertSchemaEqual</code> compare DataFrames (order-insensitive by default).</li>
<li>Run pytest in a notebook with <code>pytest.main([...])</code> or from CI.</li>
<li><b>Databricks Connect</b> runs local IDE code on remote Databricks compute.</li>
</ul>

<h2>Integration testing</h2>
<ul>
<li>Deploy the bundle to a staging target pointing at a test catalog with representative (masked) data.</li>
<li>Run the job; then validate results with SQL assertions (row counts, key uniqueness, reconciliation totals).</li>
<li>Tear down or reset test data for repeatability.</li>
</ul>

<h2>Testing declarative pipelines</h2>
<ul>
<li>Point the pipeline at test sources via configuration parameters.</li>
<li>Add expectations with FAIL UPDATE in test runs to make assertions strict.</li>
<li>Test pure transformation functions separately with pytest.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Logic lives inline in notebook cells and cannot be unit tested. First refactoring step?</summary>
<p>Move transformations into functions in Python modules that accept/return DataFrames.</p></details>
<details><summary>Which built-in utility compares two DataFrames in tests?</summary>
<p><code>pyspark.testing.assertDataFrameEqual</code>.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.testing}" target="_blank" rel="noopener">Testing notebooks and code</a></li>
<li><a href="${ML}dev-tools/databricks-connect/" target="_blank" rel="noopener">Databricks Connect</a></li></ul>
`);

addChapter(4, '4.9', 'Monitoring and alerting', `
<h2>What to monitor</h2>
<table>
<tr><th>Question</th><th>Where to look</th></tr>
<tr><td>Did the job succeed? How long did it take?</td><td>Jobs UI (runs list, matrix, timeline); <code>system.lakeflow.job_run_timeline</code></td></tr>
<tr><td>Which task is slow?</td><td>Run timeline / task durations; <code>job_task_run_timeline</code></td></tr>
<tr><td>Why did a Spark task fail or run slowly?</td><td>Spark UI, driver logs, compute metrics</td></tr>
<tr><td>Why is a SQL query slow?</td><td>Query profile, query history (<code>system.query.history</code>)</td></tr>
<tr><td>Pipeline progress and data quality</td><td>Pipeline UI, event log</td></tr>
<tr><td>Streaming lag</td><td>Streaming metrics, backlog notifications, query progress</td></tr>
<tr><td>Is data fresh and complete?</td><td>Anomaly detection, data profiling, SQL alerts</td></tr>
<tr><td>Cost trends</td><td><code>system.billing.usage</code>, budgets</td></tr>
<tr><td>Cluster lifecycle events</td><td>Compute event log (start, resize, termination reasons)</td></tr>
</table>

<h2>SQL alerts</h2>
<p>A SQL alert runs a query on a schedule and notifies destinations when a condition is met.</p>
<pre><code>-- Alert when yesterday's orders are missing or unusually low
SELECT count(*) AS n
FROM prod.silver.orders
WHERE order_date = current_date() - 1;
-- Condition: n &lt; 1000  -&gt; notify Teams channel</code></pre>
<p>Alerts can also run as a task in a job, so the check happens right after the load.</p>

<h2>Job health with system tables</h2>
<pre><code>SELECT job_id, count(*) AS runs,
       sum(CASE WHEN result_state = 'FAILED' THEN 1 ELSE 0 END) AS failures,
       avg(timestampdiff(MINUTE, period_start_time, period_end_time)) AS avg_minutes
FROM system.lakeflow.job_run_timeline
WHERE period_start_time &gt;= current_date() - 30
GROUP BY job_id
ORDER BY failures DESC;</code></pre>

<h2>Azure Monitor integration</h2>
<ul>
<li><b>Diagnostic settings</b> send Databricks audit/diagnostic categories (jobs, clusters, notebooks, accounts, Unity Catalog...) to Log Analytics; build KQL queries, workbooks and Azure Monitor alerts.</li>
<li>Useful when the operations team centralises monitoring in Azure.</li>
<li>Application logs from your code can be sent with standard Python logging handlers or the Azure Monitor OpenTelemetry distro.</li>
</ul>

<h2>Logs</h2>
<ul>
<li><b>Driver logs</b>: stdout, stderr, log4j &ndash; first stop for Python errors.</li>
<li><b>Cluster log delivery</b>: persist driver/executor/init script logs to a volume for later analysis.</li>
<li><b>Compute metrics</b> UI: CPU, memory, network, disk per node over time.</li>
</ul>

<h2>Check yourself</h2>
<details><summary>Ops wants a KQL alert when any Databricks job fails. What do you configure?</summary>
<p>Diagnostic settings to Log Analytics, then an Azure Monitor log alert on job events.</p></details>
<details><summary>Notify the team if a gold table has not been updated by 07:00.</summary>
<p>A scheduled SQL alert on the table's latest timestamp (or freshness anomaly detection).</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${ML}sql/user/alerts/" target="_blank" rel="noopener">SQL alerts</a></li>
<li><a href="${R.monitor}" target="_blank" rel="noopener">Azure Monitor</a></li>
<li><a href="${R.systables}" target="_blank" rel="noopener">System tables</a></li></ul>
`);

addChapter(4, '4.10', 'Performance troubleshooting', `
<p>Performance questions describe a symptom ("one task takes 40 minutes while others take 1", "spill to disk", "thousands of tiny files") and ask for the cause or the fix. Learn the symptom &rarr; diagnosis &rarr; fix table.</p>

<h2>Reading the Spark UI</h2>
<ul>
<li><b>Jobs</b> &rarr; <b>Stages</b> &rarr; <b>Tasks</b>. A stage boundary is a <b>shuffle</b>.</li>
<li>Stage summary metrics show min / 25th / median / 75th / max for duration, input, shuffle read and spill. A max far above the median signals <b>skew</b>.</li>
<li><b>SQL / DataFrame</b> tab shows the physical plan with rows and time per operator (Exchange = shuffle, BroadcastHashJoin, SortMergeJoin, Photon operators).</li>
<li><b>Storage</b> shows cached data; <b>Executors</b> shows GC time, failed tasks, memory.</li>
<li>For SQL warehouses and serverless, use the <b>query profile</b> instead.</li>
</ul>

<h2>Symptom &rarr; fix</h2>
<table>
<tr><th>Symptom</th><th>Likely cause</th><th>Fixes</th></tr>
<tr><td>Few tasks run much longer; large shuffle read for those tasks</td><td><b>Data skew</b> on a join/group key</td><td>AQE skew join (on by default), filter or handle hot keys (e.g. NULLs) separately, <b>salting</b>, broadcast the small side</td></tr>
<tr><td>"Spill (memory/disk)" metrics high</td><td>Partitions too large for executor memory</td><td>More shuffle partitions / let AQE size them, memory-optimised VMs, reduce data earlier (filter, select columns)</td></tr>
<tr><td>Many tiny tasks, overhead dominates</td><td>Too many partitions / small files</td><td>AQE partition coalescing, OPTIMIZE, auto compaction</td></tr>
<tr><td>Full table scans on selective filters</td><td>Poor data skipping</td><td>Liquid clustering on filter columns, avoid functions on filter columns, statistics</td></tr>
<tr><td>Large SortMergeJoin with a small table</td><td>Broadcast not chosen</td><td><code>broadcast()</code> hint, update stats, raise threshold</td></tr>
<tr><td>Driver OOM</td><td><code>collect()</code>, <code>toPandas()</code>, huge broadcast</td><td>Keep data distributed, write to tables, larger driver only if necessary</td></tr>
<tr><td>Slow Python UDF stage</td><td>Row-at-a-time serialisation</td><td>Built-in functions, SQL UDFs, pandas UDFs</td></tr>
<tr><td>Cluster idle between stages</td><td>Driver-side work or sequential notebook logic</td><td>Parallelise, avoid loops of small Spark jobs</td></tr>
<tr><td>Stream falls behind</td><td>Processing rate &lt; input rate</td><td>Scale compute, tune partitions/maxFilesPerTrigger, reduce state, RocksDB state store</td></tr>
<tr><td>Long start-up time</td><td>Classic VM provisioning</td><td>Pools or serverless</td></tr>
</table>

<h2>Adaptive Query Execution (AQE)</h2>
<p>AQE (enabled by default) re-optimises plans at runtime using actual shuffle statistics:</p>
<ul>
<li>Coalesces small shuffle partitions.</li>
<li>Switches sort-merge joins to broadcast joins when one side turns out small.</li>
<li>Splits skewed partitions in joins.</li>
</ul>

<h2>Salting example</h2>
<pre><code>from pyspark.sql import functions as F
N = 16
big_salted   = big.withColumn("salt", (F.rand() * N).cast("int"))
small_salted = small.crossJoin(spark.range(N).withColumnRenamed("id", "salt"))
joined = big_salted.join(small_salted, ["customer_id", "salt"])</code></pre>
<p>The hot key's rows are spread over N partitions; the small side is replicated N times.</p>

<h2>Query profile (SQL)</h2>
<ul>
<li>Shows operators, time spent, rows, bytes read, files pruned, spill, and whether Photon ran each operator.</li>
<li>Look for: large "files read" vs "files pruned", big exchanges, non-Photon operators, spill.</li>
<li>Query history filters by user, warehouse, duration; useful to find the most expensive queries.</li>
</ul>

<h2>General performance checklist</h2>
<ol>
<li>Right compute: Photon, adequate size, serverless where suitable.</li>
<li>Good layout: liquid clustering, file compaction, predictive optimization.</li>
<li>Reduce data early: filter, select needed columns, push predicates.</li>
<li>Prefer built-in functions to UDFs.</li>
<li>Broadcast small dimensions; handle skew.</li>
<li>Avoid <code>collect()</code>; avoid unnecessary <code>cache()</code>/<code>count()</code> actions.</li>
<li>Process incrementally (streaming tables, MVs, CDF) rather than full recomputation.</li>
</ol>

<h2>Check yourself</h2>
<details><summary>In the Spark UI, median task time is 20 s but max is 25 min in a join stage. Diagnosis?</summary>
<p>Data skew on the join key.</p></details>
<details><summary>A query profile shows 98% of files read with no pruning on a date filter. Fix?</summary>
<p>Cluster the table on the date column (liquid clustering) and compact files.</p></details>
<details><summary>Which feature automatically turns a sort-merge join into a broadcast join at runtime?</summary>
<p>Adaptive Query Execution.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.optim}" target="_blank" rel="noopener">Optimization recommendations</a></li>
<li><a href="${R.sparkui}" target="_blank" rel="noopener">Troubleshooting compute / Spark UI</a></li></ul>
`);

addChapter(4, '4.11', 'External orchestration and cost optimisation', `
<h2>Azure Data Factory with Azure Databricks</h2>
<ul>
<li>ADF activities can run a Databricks <b>notebook</b>, <b>Python</b> file, <b>JAR</b>, or trigger an existing Databricks <b>job</b>.</li>
<li>The <b>Azure Databricks linked service</b> defines workspace URL, authentication (prefer ADF <b>managed identity</b>) and compute (new job cluster, existing cluster, or instance pool).</li>
<li>Pass parameters with <b>baseParameters</b> (read via widgets); return values with <code>dbutils.notebook.exit("...")</code>, available as <code>runOutput</code> in ADF.</li>
</ul>
<table>
<tr><th>Use Lakeflow Jobs when</th><th>Use ADF (or Fabric Data Factory) when</th></tr>
<tr><td>Workflow is mostly Databricks tasks</td><td>Orchestration spans many Azure services and on-premises systems</td></tr>
<tr><td>You want file arrival/table triggers, repair runs, task values, serverless</td><td>Existing enterprise ADF estate and operations</td></tr>
<tr><td>Lower latency and simpler ops</td><td>Need ADF copy connectors and self-hosted integration runtime</td></tr>
</table>
<div class="box tip"><b>Exam tip:</b> "Copy data from an on-premises SQL Server through a self-hosted IR, then run Databricks transformations" &rarr; ADF pipeline with Copy activity followed by a Databricks activity (or Lakeflow Connect if supported).</div>

<h2>Notebook orchestration inside Databricks</h2>
<ul>
<li><code>%run ./other_notebook</code> &ndash; includes another notebook's definitions in the current context (for shared functions/config).</li>
<li><code>dbutils.notebook.run("path", timeout, {"param": "x"})</code> &ndash; runs another notebook as a separate ephemeral job and returns its exit value. Useful for simple parallel patterns, but prefer job tasks for visibility and retries.</li>
</ul>

<h2>Cost optimisation checklist</h2>
<table>
<tr><th>Area</th><th>Action</th></tr>
<tr><td>Compute type</td><td>Jobs compute or serverless for scheduled work; SQL warehouses for BI; avoid all-purpose for jobs</td></tr>
<tr><td>Serverless mode</td><td>Standard (cost-optimised) mode for jobs/pipelines without tight SLAs</td></tr>
<tr><td>Idle cost</td><td>Auto termination; warehouse auto stop; triggered pipelines instead of continuous</td></tr>
<tr><td>VM cost</td><td>Spot workers, right-size VM families, autoscaling</td></tr>
<tr><td>Efficiency</td><td>Photon, incremental processing, liquid clustering, predictive optimization</td></tr>
<tr><td>Storage</td><td>VACUUM, lifecycle rules on raw landing zones</td></tr>
<tr><td>Governance</td><td>Compute policies, tags, budgets, budget policies for serverless</td></tr>
<tr><td>Visibility</td><td><code>system.billing.usage</code> dashboards by tag/job/user</td></tr>
</table>

<h2>Check yourself</h2>
<details><summary>How does an ADF pipeline receive a value computed in a Databricks notebook?</summary>
<p>The notebook calls <code>dbutils.notebook.exit(value)</code>; ADF reads <code>runOutput</code>.</p></details>
<details><summary>A continuous pipeline only needs hourly freshness. How do you cut cost?</summary>
<p>Switch to triggered mode scheduled hourly.</p></details>

<h2>Read more on Microsoft Learn</h2>
<ul><li><a href="${R.adf}" target="_blank" rel="noopener">ADF Databricks Notebook activity</a></li>
<li><a href="${ML}lakehouse-architecture/cost-optimization/" target="_blank" rel="noopener">Cost optimisation best practices</a></li></ul>
`);

addChapter(4, '4.12', 'Domain 4 quick review', `
<h2>Requirement &rarr; answer</h2>
<table>
<tr><th>Requirement</th><th>Answer</th></tr>
<tr><td>Share one cluster across tasks of a run</td><td>Shared job cluster (job_cluster_key)</td></tr>
<tr><td>Start job when files land</td><td>File arrival trigger</td></tr>
<tr><td>Start job when upstream table changes</td><td>Table update trigger</td></tr>
<tr><td>Always-running job</td><td>Continuous trigger</td></tr>
<tr><td>Pass a value between tasks</td><td>Task values</td></tr>
<tr><td>Same parameter in all tasks</td><td>Job parameters</td></tr>
<tr><td>Branch on a condition</td><td>If/else condition task</td></tr>
<tr><td>Loop over list</td><td>For each task</td></tr>
<tr><td>Cleanup regardless of outcome</td><td>Run if: All done</td></tr>
<tr><td>Rerun only failed tasks</td><td>Repair run</td></tr>
<tr><td>Transient failures</td><td>Task retries</td></tr>
<tr><td>SLA warning without killing</td><td>Duration threshold notification</td></tr>
<tr><td>Teams/Slack alerts</td><td>Notification destinations</td></tr>
<tr><td>Cheapest periodic pipeline</td><td>Triggered, serverless</td></tr>
<tr><td>Fast pipeline iteration</td><td>Development mode</td></tr>
<tr><td>Prevent full refresh of a table</td><td><code>pipelines.reset.allowed = false</code></td></tr>
<tr><td>Pipeline quality metrics</td><td>Event log</td></tr>
<tr><td>Version control in workspace</td><td>Git folders</td></tr>
<tr><td>IaC for jobs and pipelines</td><td>Databricks Asset Bundles</td></tr>
<tr><td>Different settings per environment</td><td>Bundle targets + variables</td></tr>
<tr><td>Check bundle before deploying</td><td><code>bundle validate</code></td></tr>
<tr><td>CI auth without stored secrets</td><td>Workload identity federation</td></tr>
<tr><td>Unit tests</td><td>pytest + assertDataFrameEqual</td></tr>
<tr><td>Run local IDE code on Databricks compute</td><td>Databricks Connect</td></tr>
<tr><td>Find skew / spill</td><td>Spark UI stage metrics</td></tr>
<tr><td>Slow SQL diagnosis</td><td>Query profile</td></tr>
<tr><td>Fix skew on a hot key</td><td>Salting / AQE skew join / broadcast</td></tr>
<tr><td>Fix spill</td><td>More partitions, memory-optimised VMs</td></tr>
<tr><td>Alert on data condition</td><td>SQL alert</td></tr>
<tr><td>Azure-native monitoring</td><td>Diagnostic settings &rarr; Log Analytics</td></tr>
<tr><td>Orchestrate across Azure services / on-prem</td><td>Azure Data Factory</td></tr>
<tr><td>Return value to ADF</td><td><code>dbutils.notebook.exit</code></td></tr>
</table>

<h2>Fifteen-question self test</h2>
<ol>
<li>Default max concurrent runs? <i>1.</i></li>
<li>Does repair rerun successful tasks? <i>No.</i></li>
<li>Development mode: are schedules active after bundle deploy? <i>No, paused.</i></li>
<li>Which file defines a bundle? <i>databricks.yml.</i></li>
<li>Command to run a deployed job from a bundle? <i>databricks bundle run.</i></li>
<li>Is a dev pipeline retried automatically? <i>No.</i></li>
<li>What does full refresh do to streaming tables? <i>Truncates and reprocesses all source data.</i></li>
<li>How does a notebook read a job parameter? <i>dbutils.widgets.get.</i></li>
<li>Where do you see a For each element value? <i>{{input}}.</i></li>
<li>Which Run if handles error paths? <i>At least one failed.</i></li>
<li>What signals skew in the Spark UI? <i>Max task time far above median.</i></li>
<li>Does AQE need manual enabling? <i>No, on by default.</i></li>
<li>Recommended identity for production deploys? <i>Service principal.</i></li>
<li>Where should production code run from? <i>Bundles / job Git source, not personal Git folders.</i></li>
<li>Which system table holds job run outcomes? <i>system.lakeflow.job_run_timeline.</i></li>
</ol>
`);
