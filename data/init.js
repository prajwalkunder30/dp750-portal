window.QB = [];
window.FACTS = [];
window.CASES = [];

// addQ(domain, topic, question, options, answerIndex | [indexes], explanation, resourceKey)
window.addQ = (d, topic, q, opts, ans, exp, ref) =>
  QB.push({ d, topic, q, opts, ans: Array.isArray(ans) ? ans : [ans], exp, ref, src: 'scenario' });

// addGoal(domain, topic, scenario, [[solution, meetsGoal, explanation], ...], resourceKey) - "meets the goal" series
window.addGoal = (d, topic, scenario, solutions, ref) => solutions.forEach(([sol, yes, exp]) => QB.push({
  d, topic, ref, src: 'goal', noShuffle: true, opts: ['Yes', 'No'], ans: [yes ? 0 : 1], exp,
  q: `This question is part of a series that presents the same scenario. Each question in the series contains a unique solution. Determine whether the solution meets the stated goal.\n\n${scenario}\n\n**Solution:** ${sol}\n\nDoes this meet the goal?`
}));

// addOrder(domain, topic, question, stepsInCorrectOrder, distractors, explanation, resourceKey)
window.addOrder = (d, topic, q, steps, distractors, exp, ref) =>
  QB.push({ d, topic, q, type: 'order', opts: [...steps, ...distractors], ans: steps.map((_, i) => i), exp, ref, src: 'order' });

// addHot(domain, topic, question, code with {0},{1}.. blanks, [[blank options]...], [correct index per blank], explanation, resourceKey)
window.addHot = (d, topic, q, code, blanks, ans, exp, ref) =>
  QB.push({ d, topic, q, type: 'hotspot', code, blanks, ans, exp, ref, src: 'hotspot' });

// addF(domain, topic, term, description) - description must not name the term; used to generate questions
window.addF = (d, topic, term, desc, ref) => FACTS.push({ d, topic, term, desc, ref });

const ML = 'https://learn.microsoft.com/en-us/azure/databricks/';
window.R = {
  compute: ML + 'compute/',
  pools: ML + 'compute/pool-index',
  photon: ML + 'compute/photon',
  serverless: ML + 'compute/serverless/',
  sqlwh: ML + 'compute/sql-warehouse/',
  policies: ML + 'admin/clusters/policies',
  libs: ML + 'libraries/',
  uc: ML + 'data-governance/unity-catalog/',
  privs: ML + 'data-governance/unity-catalog/manage-privileges/',
  volumes: ML + 'volumes/',
  tables: ML + 'tables/',
  views: ML + 'views/',
  mv: ML + 'views/materialized',
  federation: ML + 'query-federation/',
  genie: ML + 'genie/',
  secrets: ML + 'security/secrets/',
  abac: ML + 'data-governance/unity-catalog/abac/',
  filters: ML + 'tables/row-and-column-filters',
  lineage: ML + 'data-governance/unity-catalog/data-lineage',
  audit: ML + 'admin/account-settings/audit-logs',
  systables: ML + 'admin/system-tables/',
  sharing: ML + 'delta-sharing/',
  delta: ML + 'delta/',
  history: ML + 'delta/history',
  vacuum: ML + 'delta/vacuum',
  optimize: ML + 'delta/optimize',
  clustering: ML + 'delta/clustering',
  partitions: ML + 'tables/partitions',
  cdf: ML + 'delta/delta-change-data-feed',
  merge: ML + 'delta/merge',
  schema: ML + 'delta/update-schema',
  constraints: ML + 'tables/constraints',
  ingestion: ML + 'ingestion/',
  autoloader: ML + 'ingestion/cloud-object-storage/auto-loader/',
  copyinto: ML + 'ingestion/cloud-object-storage/copy-into/',
  connect: ML + 'ingestion/lakeflow-connect/',
  streaming: ML + 'structured-streaming/',
  eventhubs: ML + 'connect/streaming/kafka',
  ldp: ML + 'ldp/',
  expectations: ML + 'ldp/expectations',
  autocdc: ML + 'ldp/cdc',
  jobs: ML + 'jobs/',
  repos: ML + 'repos/',
  bundles: ML + 'dev-tools/bundles/',
  cli: ML + 'dev-tools/cli/',
  testing: ML + 'notebooks/testing',
  optim: ML + 'optimizations/',
  sparkui: ML + 'compute/troubleshooting/',
  monitor: 'https://learn.microsoft.com/en-us/azure/azure-monitor/',
  adf: 'https://learn.microsoft.com/en-us/azure/data-factory/transform-data-databricks-notebook',
  kv: 'https://learn.microsoft.com/en-us/azure/key-vault/general/overview',
  dbutils: ML + 'dev-tools/databricks-utils',
  profile: ML + 'lakehouse-monitoring/'
};
