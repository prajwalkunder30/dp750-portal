// Domain 1: Set up and configure an Azure Databricks environment
addQ(1, 'Compute', 'Data analysts run ad hoc notebook queries throughout the day and share one cluster. The cluster must shut down when nobody uses it for 30 minutes. What should you configure?',
  ['An all-purpose compute resource with auto termination set to 30 minutes', 'A jobs compute resource with a 30-minute timeout', 'An instance pool with idle instance auto termination of 30 minutes', 'A SQL warehouse with a 30-minute query timeout'],
  0, 'Auto termination on all-purpose compute stops the cluster after the specified period of inactivity. Jobs compute is ephemeral and tied to a job run; pool idle termination only affects idle pool instances.', 'compute');

addQ(1, 'Compute', 'A nightly ETL job runs a single notebook. You need to minimize cost. Which compute should the job use?',
  ['An existing all-purpose cluster', 'Jobs compute (or serverless jobs compute)', 'A pro SQL warehouse', 'A single-node all-purpose cluster that never terminates'],
  1, 'Jobs compute is created for the run and terminated afterward and is billed at a lower DBU rate than all-purpose compute.', 'compute');

addQ(1, 'Compute', 'Jobs that run every 15 minutes spend most of their run time waiting for cluster VMs to start. You need to reduce start-up time while still using classic compute. What should you use?',
  ['Photon acceleration', 'An instance pool with a minimum number of idle instances', 'A larger driver node', 'Enable autoscaling local storage'],
  1, 'Instance pools keep idle, ready-to-use VMs so clusters attached to the pool start and autoscale faster.', 'pools');

addQ(1, 'Compute', 'You need to ensure that every cluster created by the data engineering team has a "costCenter" tag and cannot exceed 10 workers. What should you implement?',
  ['A Unity Catalog governed tag', 'A compute policy assigned to the team', 'An Azure Policy on the managed resource group', 'A cluster-scoped init script'],
  1, 'Compute policies restrict the attributes users can set when creating compute and can enforce custom tags and worker limits.', 'policies');

addQ(1, 'Compute', 'Which TWO statements about Photon are correct? (Choose two.)',
  ['Photon is a vectorized query engine written in C++', 'Photon accelerates SQL and DataFrame workloads', 'Photon is required to use Unity Catalog', 'Photon only accelerates Python UDFs'],
  [0, 1], 'Photon is a native vectorized engine that speeds up SQL/DataFrame operations. It does not speed up arbitrary Python UDF code and is not a requirement for Unity Catalog.', 'photon');

addQ(1, 'Compute', 'Multiple users must share one cluster that accesses Unity Catalog data while keeping user code isolated from each other. Which access mode should you choose?',
  ['Dedicated (single user)', 'Standard (formerly shared)', 'No isolation shared', 'Custom'],
  1, 'Standard access mode supports multiple users with user isolation and Unity Catalog. Dedicated mode is assigned to a single user or group; No isolation shared does not support Unity Catalog.', 'compute');

addQ(1, 'Compute', 'A data scientist needs a cluster that runs R and low-level RDD APIs against Unity Catalog data. Only she will use it. Which access mode is most appropriate?',
  ['Standard', 'Dedicated', 'No isolation shared', 'Serverless SQL'],
  1, 'Dedicated access mode supports the broadest language and API surface (including RDD APIs and R) while still working with Unity Catalog.', 'compute');

addQ(1, 'Compute', 'Business users connect Power BI to Azure Databricks and run SQL queries. You need instant startup and no infrastructure management. What should you provision?',
  ['A serverless SQL warehouse', 'A classic SQL warehouse', 'An all-purpose cluster with Photon', 'A jobs cluster'],
  0, 'Serverless SQL warehouses start in seconds and are fully managed, which suits BI tools such as Power BI.', 'sqlwh');

addQ(1, 'Compute', 'A notebook needs a Python package for a single session without affecting other notebooks attached to the same cluster. What should you do?',
  ['Install the package as a compute-scoped library', 'Run %pip install in the notebook', 'Add the package to a global init script', 'Upload the wheel to the workspace root'],
  1, '%pip install creates a notebook-scoped library visible only to that notebook session.', 'libs');

addQ(1, 'Compute', 'All notebooks attached to a cluster must be able to import an internal wheel stored in a Unity Catalog volume. What should you configure?',
  ['A compute-scoped library that references the wheel in the volume', 'A notebook-scoped library in each notebook', 'A Databricks secret that contains the wheel', 'A Delta Sharing recipient'],
  0, 'Compute-scoped libraries are installed on all nodes and available to every notebook on the cluster. Volumes are a supported source for library files.', 'libs');

addQ(1, 'Compute', 'Interactive workloads are bursty: sometimes 2 workers suffice, sometimes 12 are required. You need to balance cost and performance. What should you configure?',
  ['A fixed-size cluster with 12 workers', 'Autoscaling with min 2 and max 12 workers', 'A single node cluster', 'An instance pool with 12 idle instances'],
  1, 'Autoscaling adds and removes workers between the configured bounds based on load.', 'compute');

addQ(1, 'Compute', 'A team runs pandas and scikit-learn on small datasets and does not need distributed processing. Which compute type is most cost-effective?',
  ['Single node compute', 'Multi-node cluster with 8 workers', 'Pro SQL warehouse', 'Instance pool without a cluster'],
  0, 'Single node compute has a driver only and is suited for small-data and single-machine libraries.', 'compute');

addQ(1, 'Unity Catalog', 'What is the correct three-level namespace used to reference a table in Unity Catalog?',
  ['metastore.schema.table', 'catalog.schema.table', 'workspace.catalog.table', 'schema.catalog.table'],
  1, 'Unity Catalog uses catalog.schema.object. The metastore is the top-level container but is not part of the name.', 'uc');

addQ(1, 'Unity Catalog', 'Your company has Azure Databricks workspaces in West Europe and East US. How many Unity Catalog metastores are typically required?',
  ['One for the whole Azure tenant', 'One per region', 'One per workspace', 'One per catalog'],
  1, 'A metastore is regional; workspaces in the same region attach to the same metastore.', 'uc');

addQ(1, 'Unity Catalog', 'You must let Unity Catalog access an ADLS Gen2 container without storing any secrets. What should you create first?',
  ['An Access Connector for Azure Databricks (managed identity) and a storage credential that uses it', 'A SAS token stored in a secret scope', 'A storage account key in the cluster Spark config', 'A Delta Sharing provider'],
  0, 'Storage credentials can wrap the managed identity of an Access Connector for Azure Databricks; no secrets need to be stored.', 'uc');

addQ(1, 'Unity Catalog', 'You created a storage credential. Users must create external tables only under abfss://raw@contoso.dfs.core.windows.net/sales. What should you create next?',
  ['An external location for that path, then grant CREATE EXTERNAL TABLE on it', 'A managed volume', 'A foreign catalog', 'A mount point using dbutils.fs.mount'],
  0, 'An external location combines a storage credential with a path and is the securable you grant CREATE EXTERNAL TABLE / READ FILES on. Mount points are legacy and not governed by Unity Catalog.', 'uc');

addQ(1, 'Unity Catalog', 'You drop a Unity Catalog external table. What happens?',
  ['The metadata and the data files are deleted', 'Only the metadata is removed; the data files remain in storage', 'The data files are deleted after 30 days', 'The drop fails because external tables are read-only'],
  1, 'Dropping an external table removes only the metadata. Dropping a managed table also removes the underlying data.', 'tables');

addQ(1, 'Unity Catalog', 'You need Unity Catalog to fully manage file layout and lifecycle and enable predictive optimization automatically. Which table type should you create?',
  ['External Delta table', 'Managed Delta table', 'Hive metastore table', 'Temporary view'],
  1, 'Managed tables are fully governed by Unity Catalog, which manages the files and can apply predictive optimization.', 'tables');

addQ(1, 'Unity Catalog', 'Data scientists need governed access to images and PDF files (non-tabular data) in Unity Catalog. What should you create?',
  ['A volume', 'A materialized view', 'An external table with format binaryFile', 'A secret scope'],
  0, 'Volumes govern non-tabular files and are accessed by paths like /Volumes/catalog/schema/volume/.', 'volumes');

addQ(1, 'Unity Catalog', 'Analysts must query an Azure SQL Database from Azure Databricks without copying the data. What should you configure?',
  ['Lakehouse Federation: a connection and a foreign catalog', 'Lakeflow Connect ingestion pipeline', 'Delta Sharing open sharing', 'COPY INTO from the database'],
  0, 'Lakehouse Federation creates a connection and a foreign catalog so external databases can be queried in place.', 'federation');

addQ(1, 'Unity Catalog', 'A dashboard aggregates a 3 TB table. The aggregate should be precomputed and refreshed incrementally when possible. What should you create?',
  ['A standard view', 'A materialized view', 'A temporary view', 'A dynamic view'],
  1, 'Materialized views store precomputed results and can refresh incrementally.', 'mv');

addQ(1, 'Unity Catalog', 'Business users want to ask natural-language questions about curated sales tables. What should you configure?',
  ['An AI/BI Genie space', 'A Delta Sharing recipient', 'A notebook widget', 'A SQL alert'],
  0, 'Genie spaces let users ask questions in natural language over the tables you curate.', 'genie');

addQ(1, 'Unity Catalog', 'A catalog that contains production data must be accessible only from the production workspace, even though dev and prod workspaces share a metastore. What should you configure?',
  ['Workspace-catalog binding', 'A compute policy', 'A row filter', 'IP access lists'],
  0, 'Binding a catalog to specific workspaces restricts which workspaces can access it.', 'uc');

addQ(1, 'Unity Catalog', 'Which Azure Databricks pricing tier is required to use Unity Catalog?',
  ['Standard', 'Premium', 'Trial only', 'Any tier'],
  1, 'Unity Catalog requires a Premium workspace.', 'uc');

addQ(1, 'Unity Catalog', 'Which statement about a Unity Catalog schema is correct?',
  ['It contains tables, views, volumes, functions, and models', 'It contains catalogs', 'It is the same as a metastore', 'It can only contain external tables'],
  0, 'A schema (database) is the second level and contains tables, views, volumes, functions and models.', 'uc');
