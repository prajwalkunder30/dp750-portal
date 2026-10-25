// Domain 4: Deploy and maintain data pipelines and workloads
addQ(4, 'Jobs', 'A job has tasks Ingest -> Transform -> Publish. Transform failed. After fixing the code, you want to rerun only the failed and dependent tasks. What should you use?',
  ['Repair run', 'Run now', 'Clone the job', 'Reset the job'],
  0, 'Repair run reruns only failed tasks and their downstream dependents, reusing successful results.', 'jobs');

addQ(4, 'Jobs', 'A cleanup task must run only if any upstream task failed. Which task setting should you configure?',
  ['Run if dependencies: At least one failed', 'Retries: 3', 'Timeout: 0', 'Max concurrent runs: 1'],
  0, 'The "Run if" condition controls when a task runs relative to its dependencies.', 'jobs');

addQ(4, 'Jobs', 'Task A computes a row count; task B must read that value. What should you use?',
  ['dbutils.jobs.taskValues.set() in A and get() in B', 'A global temp view', 'A notebook widget default value', 'spark.conf.set in A'],
  0, 'Task values pass small values between tasks of the same job run.', 'jobs');

addQ(4, 'Jobs', 'A job must start whenever new files arrive in a Unity Catalog external location. What trigger should you configure?',
  ['File arrival trigger', 'Scheduled trigger every minute', 'Continuous trigger', 'Manual'],
  0, 'File arrival triggers start a run when new files arrive in a monitored location.', 'jobs');

addQ(4, 'Jobs', 'A job must run once for each of 50 country codes using the same notebook. What should you use?',
  ['A For each task iterating over a parameter list', '50 separate jobs', 'A while loop in a notebook calling dbutils.notebook.run without limits', 'A continuous trigger'],
  0, 'For each tasks run a nested task for each input value, with configurable concurrency.', 'jobs');

addQ(4, 'Jobs', 'A job should take a branch based on whether a parameter env equals "prod". Which task type should you add?',
  ['If/else condition task', 'SQL alert', 'Pipeline task', 'Run job task'],
  0, 'If/else condition tasks evaluate a boolean expression and branch the DAG.', 'jobs');

addQ(4, 'Jobs', 'Multiple tasks in a job should share the same classic compute to avoid start-up overhead per task. What should you configure?',
  ['A shared job cluster used by those tasks', 'An all-purpose cluster per task', 'A SQL warehouse per task', 'Separate jobs'],
  0, 'Tasks within a job can share a job cluster, which is created once for the run.', 'jobs');

addQ(4, 'Jobs', 'A transient network error sometimes makes a task fail. What should you configure?',
  ['Task retries with a retry interval', 'A larger cluster', 'Max concurrent runs = 10', 'A continuous trigger'],
  0, 'Retries automatically rerun a failed task.', 'jobs');

addQ(4, 'Jobs', 'The on-call engineer must be notified when a job runs longer than expected. What should you configure?',
  ['A duration threshold (expected completion time) notification', 'A task value', 'An init script', 'A compute policy'],
  0, 'Jobs support duration warning thresholds and notifications to email or webhook destinations.', 'jobs');

addQ(4, 'Jobs', 'Azure Data Factory orchestrates the enterprise workflow and must run a Databricks notebook. What should you use?',
  ['The Azure Databricks Notebook activity with an Azure Databricks linked service', 'A Copy activity with Databricks as sink', 'A Logic App', 'An Azure Function'],
  0, 'ADF has a Databricks Notebook activity that runs notebooks on Azure Databricks.', 'adf');

addQ(4, 'CI/CD', 'You need to define jobs, pipelines and their configuration as code and deploy them to dev, test and prod workspaces. What should you use?',
  ['Databricks Asset Bundles', 'Workspace export to DBC files', 'Notebook widgets', 'Delta Sharing'],
  0, 'Asset Bundles describe resources in databricks.yml with targets per environment.', 'bundles');

addQ(4, 'CI/CD', 'Put the bundle commands in the usual CI order: 1) databricks bundle deploy -t prod 2) databricks bundle validate -t prod 3) databricks bundle run -t prod my_job',
  ['2, 1, 3', '1, 2, 3', '3, 1, 2', '1, 3, 2'],
  0, 'Validate configuration, deploy resources, then run a resource.', 'bundles');

addQ(4, 'CI/CD', 'In a bundle, the dev target uses mode: development. What is a behavior of development mode?',
  ['Deployed resources are prefixed with the user name and schedules/triggers are paused', 'Resources are deployed as the service principal only', 'Jobs are deleted after each run', 'Bundles cannot be deployed'],
  0, 'Development mode prefixes resource names with [dev username] and pauses schedules and triggers.', 'bundles');

addQ(4, 'CI/CD', 'Developers must work on feature branches of a Git repo directly from the workspace. What should you use?',
  ['Databricks Git folders', 'Workspace files without Git', 'DBFS', 'Volumes'],
  0, 'Git folders (formerly Repos) let users clone, branch, commit, push and pull from the workspace.', 'repos');

addQ(4, 'CI/CD', 'A GitHub Actions workflow deploys bundles. How should it authenticate to Azure Databricks?',
  ['As a service principal using OAuth (for example workload identity federation)', 'With a developer\'s personal access token stored in the repo', 'With the workspace admin password', 'Anonymously'],
  0, 'Use a service principal with OAuth; workload identity federation avoids long-lived secrets.', 'cli');

addQ(4, 'Testing', 'You want to unit test transformation logic with pytest. What is the best practice?',
  ['Put transformations in functions in Python modules that accept and return DataFrames, then test them with pytest', 'Test by running the full production job', 'Write tests only as notebook comments', 'Test against production tables'],
  0, 'Modular functions can be tested in isolation with small input DataFrames.', 'testing');

addQ(4, 'Monitoring', 'In the Spark UI, one task in a stage takes 40 minutes while the other 199 finish in 1 minute. What is the most likely cause?',
  ['Data skew', 'Too many executors', 'Photon is enabled', 'Broadcast join'],
  0, 'A few long-running tasks indicate skewed partitions.', 'sparkui');

addQ(4, 'Monitoring', 'Which TWO actions can mitigate join skew? (Choose two.)',
  ['Rely on Adaptive Query Execution skew join handling', 'Salt the skewed key', 'Decrease the number of workers to 1', 'Disable statistics collection'],
  [0, 1], 'AQE can split skewed partitions, and salting spreads hot keys across partitions.', 'optim');

addQ(4, 'Monitoring', 'The Spark UI shows large "spill (disk)" values for a stage. Which action is most likely to help?',
  ['Use worker types with more memory or increase the number of shuffle partitions', 'Run VACUUM', 'Enable change data feed', 'Reduce the number of retries'],
  0, 'Spill occurs when partitions do not fit in memory; more memory or smaller partitions reduce it.', 'sparkui');

addQ(4, 'Monitoring', 'A Databricks SQL query is slow. Where can you see operator-level time and rows for that query?',
  ['The query profile', 'The cluster event log', 'DESCRIBE HISTORY', 'The audit log'],
  0, 'The query profile visualizes operators with time spent and rows processed.', 'optim');

addQ(4, 'Monitoring', 'Which TWO sources provide job run history you can query with SQL or view in the UI? (Choose two.)',
  ['system.lakeflow tables (job run timeline)', 'The Jobs & Pipelines run list', 'Delta table history of the job notebook', 'Instance pool settings'],
  [0, 1], 'Job run information is available in the Jobs UI and in system.lakeflow system tables.', 'systables');

addQ(4, 'Pipelines', 'A Lakeflow Declarative Pipeline should process new data continuously with low latency. Which pipeline mode should you use?',
  ['Continuous', 'Triggered', 'Development', 'Full refresh'],
  0, 'Continuous pipelines keep running and process data as it arrives. Triggered pipelines process available data and stop.', 'ldp');

addQ(4, 'Pipelines', 'Where can you query data quality metrics and update progress for a Lakeflow Declarative Pipeline?',
  ['The pipeline event log', 'The Spark driver stdout', 'system.billing.usage', 'DESCRIBE DETAIL'],
  0, 'The event log records expectation metrics, lineage and progress events.', 'ldp');

addQ(4, 'Pipelines', 'A streaming table must reprocess all source data from scratch after a logic change. What should you run?',
  ['A full refresh of the table', 'A normal triggered update', 'VACUUM', 'OPTIMIZE'],
  0, 'Full refresh clears the table state and checkpoints and reprocesses all data.', 'ldp');

addQ(4, 'Maintenance', 'You want Databricks to automatically run OPTIMIZE and VACUUM on Unity Catalog managed tables. What should you enable?',
  ['Predictive optimization', 'Auto Loader file notifications', 'Photon', 'Deletion vectors'],
  0, 'Predictive optimization automatically runs maintenance operations on managed tables.', 'optimize');
