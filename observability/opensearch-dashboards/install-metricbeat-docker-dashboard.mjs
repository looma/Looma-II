const base = process.env.OSD_URL || "http://localhost:45601";
const headers = { "content-type": "application/json", "osd-xsrf": "true" };

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, { headers, ...options });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function put(type, id, attributes, references = []) {
  return request(`/api/saved_objects/${type}/${id}?overwrite=true`, {
    method: "POST",
    body: JSON.stringify({ attributes, references }),
  });
}

function vegaState(title, spec) {
  return JSON.stringify({ title, type: "vega", aggs: [], params: { spec: JSON.stringify(spec, null, 2) } });
}

function visAttrs(title, spec, description = "") {
  return {
    title,
    description,
    uiStateJSON: "{}",
    version: 1,
    visState: vegaState(title, spec),
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify({ query: { language: "kuery", query: "" }, filter: [] }),
    },
  };
}

function nativeVisAttrs(title, type, aggs, params, indexPatternRefName = "kibanaSavedObjectMeta.searchSourceJSON.index", description = "") {
  return {
    title,
    description,
    uiStateJSON: "{}",
    version: 1,
    visState: JSON.stringify({ title, type, aggs, params }),
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify({
        query: { language: "kuery", query: "" },
        filter: [],
        indexRefName: indexPatternRefName,
      }),
    },
  };
}

const metricbeatFields = [
    { name: "@timestamp", type: "date", esTypes: ["date"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    { name: "container.name", type: "string", esTypes: ["text"], scripted: false, searchable: true, aggregatable: false, readFromDocValues: false, count: 0 },
    { name: "container.name.keyword", type: "string", esTypes: ["keyword"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0, subType: { multi: { parent: "container.name" } } },
    { name: "container.image.name", type: "string", esTypes: ["text"], scripted: false, searchable: true, aggregatable: false, readFromDocValues: false, count: 0 },
    { name: "container.image.name.keyword", type: "string", esTypes: ["keyword"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0, subType: { multi: { parent: "container.image.name" } } },
    { name: "host.name", type: "string", esTypes: ["text"], scripted: false, searchable: true, aggregatable: false, readFromDocValues: false, count: 0 },
    { name: "host.name.keyword", type: "string", esTypes: ["keyword"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0, subType: { multi: { parent: "host.name" } } },
    { name: "metricset.name", type: "string", esTypes: ["text"], scripted: false, searchable: true, aggregatable: false, readFromDocValues: false, count: 0 },
    { name: "metricset.name.keyword", type: "string", esTypes: ["keyword"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0, subType: { multi: { parent: "metricset.name" } } },
    { name: "docker.container.status", type: "string", esTypes: ["text"], scripted: false, searchable: true, aggregatable: false, readFromDocValues: false, count: 0 },
    { name: "docker.container.status.keyword", type: "string", esTypes: ["keyword"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0, subType: { multi: { parent: "docker.container.status" } } },
    { name: "docker.cpu.total.pct", type: "number", esTypes: ["float"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    { name: "docker.memory.usage.pct", type: "number", esTypes: ["float"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    { name: "docker.memory.usage.total", type: "number", esTypes: ["long"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    { name: "docker.diskio.read.bytes", type: "number", esTypes: ["long"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    { name: "docker.diskio.write.bytes", type: "number", esTypes: ["long"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    { name: "docker.network.inbound.bytes", type: "number", esTypes: ["long"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    { name: "docker.network.outbound.bytes", type: "number", esTypes: ["long"], scripted: false, searchable: true, aggregatable: true, readFromDocValues: true, count: 0 },
    {
      name: "docker_cpu_total_percent",
      type: "number",
      scripted: true,
      script: "doc.containsKey('docker.cpu.total.pct') && !doc['docker.cpu.total.pct'].empty ? doc['docker.cpu.total.pct'].value * 100 : null",
      lang: "painless",
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      count: 0,
    },
    {
      name: "docker_memory_usage_percent",
      type: "number",
      scripted: true,
      script: "doc.containsKey('docker.memory.usage.pct') && !doc['docker.memory.usage.pct'].empty ? doc['docker.memory.usage.pct'].value * 100 : null",
      lang: "painless",
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      count: 0,
    },
    {
      name: "docker_memory_usage_gib",
      type: "number",
      scripted: true,
      script: "doc.containsKey('docker.memory.usage.total') && !doc['docker.memory.usage.total'].empty ? doc['docker.memory.usage.total'].value / 1073741824.0 : null",
      lang: "painless",
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      count: 0,
    },
    {
      name: "docker_diskio_read_gib",
      type: "number",
      scripted: true,
      script: "doc.containsKey('docker.diskio.read.bytes') && !doc['docker.diskio.read.bytes'].empty ? doc['docker.diskio.read.bytes'].value / 1073741824.0 : null",
      lang: "painless",
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      count: 0,
    },
    {
      name: "docker_diskio_write_gib",
      type: "number",
      scripted: true,
      script: "doc.containsKey('docker.diskio.write.bytes') && !doc['docker.diskio.write.bytes'].empty ? doc['docker.diskio.write.bytes'].value / 1073741824.0 : null",
      lang: "painless",
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      count: 0,
    },
  ];

await put("index-pattern", "looma-metricbeat-pattern", {
  title: "metricbeat-*",
  timeFieldName: "@timestamp",
  fields: JSON.stringify(metricbeatFields),
  fieldFormatMap: JSON.stringify({
    docker_cpu_total_percent: { id: "number", params: { pattern: "0,0.00" } },
    docker_memory_usage_percent: { id: "number", params: { pattern: "0,0.00" } },
    docker_memory_usage_gib: { id: "number", params: { pattern: "0,0.00" } },
    docker_diskio_read_gib: { id: "number", params: { pattern: "0,0.00" } },
    docker_diskio_write_gib: { id: "number", params: { pattern: "0,0.00" } },
  }),
});

const overviewSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  title: "Docker containers state",
  padding: 5,
  data: [
    {
      name: "states",
      url: {
        index: "metricbeat-*",
        "%context%": true,
        "%timefield%": "@timestamp",
        body: {
          size: 0,
          query: { term: { "metricset.name.keyword": "container" } },
          aggs: {
            running: { filter: { wildcard: { "docker.container.status.keyword": "Up*" } }, aggs: { containers: { cardinality: { field: "container.name.keyword" } } } },
            paused: { filter: { wildcard: { "docker.container.status.keyword": "*Paused*" } }, aggs: { containers: { cardinality: { field: "container.name.keyword" } } } },
            stopped: { filter: { bool: { must_not: [{ wildcard: { "docker.container.status.keyword": "Up*" } }] } }, aggs: { containers: { cardinality: { field: "container.name.keyword" } } } },
          },
        },
      },
      format: { property: "aggregations" },
      transform: [
        { type: "formula", as: "running", expr: "datum.running.containers.value" },
        { type: "formula", as: "paused", expr: "datum.paused.containers.value" },
        { type: "formula", as: "stopped", expr: "datum.stopped.containers.value" },
        { type: "fold", fields: ["running", "paused", "stopped"], as: ["state", "count"] },
      ],
    },
  ],
  scales: [
    { name: "x", type: "band", domain: { data: "states", field: "state" }, range: "width", padding: 0.25 },
    { name: "color", type: "ordinal", domain: ["running", "paused", "stopped"], range: ["#54b399", "#d6bf57", "#e7664c"] },
  ],
  marks: [
    {
      type: "text",
      from: { data: "states" },
      encode: {
        update: {
          x: { scale: "x", field: "state", band: 0.5 },
          y: { value: 35 },
          text: { field: "count" },
          fontSize: { value: 38 },
          fontWeight: { value: "bold" },
          align: { value: "center" },
          fill: { scale: "color", field: "state" },
        },
      },
    },
    {
      type: "text",
      from: { data: "states" },
      encode: {
        update: {
          x: { scale: "x", field: "state", band: 0.5 },
          y: { value: 75 },
          text: { field: "state" },
          fontSize: { value: 13 },
          align: { value: "center" },
          fill: { value: "#343741" },
        },
      },
    },
  ],
};

function timeseriesSpec(title, metricset, fields, yTitle, options = {}) {
  const unitExpr = options.unit === "mb" ? "datum.value / 1048576" : yTitle == 'percent' ? "datum.value * 100" : "datum.value";
  const yAxisTitle = options.unit === "mb" ? "MB" : yTitle;
  const markType = options.area ? "area" : "line";
  return {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    title,
    padding: 5,
    data: [
      {
        name: "raw",
        url: {
          index: "metricbeat-*",
          "%context%": true,
          "%timefield%": "@timestamp",
          body: {
            size: 0,
            aggs: {
              metricset_filter: {
                filter: { term: { "metricset.name.keyword": metricset } },
                aggs: {
                  containers: {
                    terms: { field: "container.name.keyword", size: options.size || 8, order: { _count: "desc" } },
                    aggs: {
                      time_buckets: {
                        date_histogram: {
                          field: "@timestamp",
                          fixed_interval: "5m",
                          extended_bounds: { min: { "%timefilter%": "min" }, max: { "%timefilter%": "max" } },
                          min_doc_count: 0,
                        },
                        aggs: Object.fromEntries(fields.map(([name, field]) => [name, { avg: { field } }])),
                      },
                    },
                  },
                },
              },
            },
          },
        },
        format: { property: "aggregations.metricset_filter.containers.buckets" },
      },
      { name: "containerBuckets", source: "raw", transform: [{ type: "flatten", fields: ["time_buckets.buckets"], as: ["bucket"] }] },
      {
        name: "flat",
        source: "containerBuckets",
        transform: [
          { type: "formula", as: "container", expr: "datum.key" },
          { type: "formula", as: "time", expr: "toDate(datum.bucket.key)" },
          ...fields.map(([name]) => ({
            type: "formula",
            as: `${name}_value`,
            expr: `isValid(datum.bucket.${name}.value) ? datum.bucket.${name}.value : null`,
          })),
          { type: "fold", fields: fields.map(([name]) => `${name}_value`), as: ["metric", "value"] },
          { type: "formula", as: "metric_name", expr: "replace(datum.metric, '_value', '')" },
          { type: "formula", as: "series", expr: "datum.container + ' / ' + datum.metric_name" },
          { type: "filter", expr: "datum.value != null && isValid(datum.value)" },
          { type: "formula", as: "scaled", expr: unitExpr },
          { type: "collect", sort: { field: ["series", "time"], order: ["ascending", "ascending"] } },
        ],
      },
    ],
    scales: [
      { name: "x", type: "time", domain: { data: "flat", field: "time" }, range: "width", nice: true },
      { name: "y", type: "linear", domain: { data: "flat", field: "scaled" }, range: "height", nice: true, zero: true },
      { name: "color", type: "ordinal", domain: { data: "flat", field: "series" }, range: "category" },
    ],
    axes: [
      { orient: "bottom", scale: "x", title: null, labelOverlap: true },
      { orient: "left", scale: "y", title: yAxisTitle },
    ],
    legends: [{ fill: "color", orient: "bottom", title: null, labelLimit: 180, columns: options.legendColumns || 4 }],
    marks: [
      {
        type: "group",
        from: { facet: { name: "series", data: "flat", groupby: "series" } },
        marks: [
          {
            type: markType,
            from: { data: "series" },
            encode: {
              enter: {
                strokeWidth: { value: options.area ? 1 : 2 },
                fillOpacity: { value: options.area ? 0.28 : 0 },
                interpolate: { value: "monotone" },
              },
              update: {
                x: { scale: "x", field: "time" },
                y: { scale: "y", field: "scaled" },
                y2: options.area ? { scale: "y", value: 0 } : undefined,
                stroke: { scale: "color", field: "series" },
                fill: options.area ? { scale: "color", field: "series" } : undefined,
                tooltip: { signal: "{'series': datum.series, 'time': timeFormat(datum.time, '%H:%M:%S'), 'value': format(datum.scaled, '.2f')}" },
              },
            },
          },
        ],
      },
    ],
  };
}

const visualizations = [
  ["looma-metricbeat-docker-cpu", "Metricbeat Docker - CPU usage", timeseriesSpec("Docker CPU usage", "cpu", [["cpu", "docker.cpu.total.pct"]], "percent")],
  ["looma-metricbeat-docker-memory", "Metricbeat Docker - memory usage", timeseriesSpec("Docker memory usage", "memory", [["memory", "docker.memory.usage.pct"]], "percent")],
  [
    "looma-metricbeat-docker-network",
    "Metricbeat Docker - network IO",
    timeseriesSpec(
      "Docker network IO",
      "network",
      [["in", "docker.network.inbound.bytes"], ["out", "docker.network.outbound.bytes"]],
      "bytes",
      { unit: "mb", area: true, size: 6, legendColumns: 3 }
    ),
  ],
  ["looma-metricbeat-docker-states", "Metricbeat Docker - container states", overviewSpec],
];

for (const [id, title, spec] of visualizations) await put("visualization", id, visAttrs(title, spec));

const metricbeatRef = [{ name: "kibanaSavedObjectMeta.searchSourceJSON.index", type: "index-pattern", id: "looma-metricbeat-pattern" }];

await put(
  "visualization",
  "looma-metricbeat-docker-table",
  nativeVisAttrs(
    "Metricbeat Docker - containers table",
    "table",
    [
      { id: "1", enabled: true, type: "avg", schema: "metric", params: { field: "docker_cpu_total_percent", customLabel: "CPU %" } },
      { id: "2", enabled: true, type: "avg", schema: "metric", params: { field: "docker_memory_usage_percent", customLabel: "Mem %" } },
      { id: "3", enabled: true, type: "avg", schema: "metric", params: { field: "docker_memory_usage_gib", customLabel: "Mem GiB" } },
      { id: "4", enabled: true, type: "max", schema: "metric", params: { field: "docker_diskio_read_gib", customLabel: "Disk read GiB" } },
      { id: "5", enabled: true, type: "max", schema: "metric", params: { field: "docker_diskio_write_gib", customLabel: "Disk write GiB" } },
      {
        id: "6",
        enabled: true,
        type: "terms",
        schema: "bucket",
        params: {
          field: "container.name.keyword",
          orderBy: "1",
          order: "desc",
          size: 20,
          otherBucket: false,
          otherBucketLabel: "Other",
          missingBucket: false,
          missingBucketLabel: "Missing",
          customLabel: "Name",
        },
      },
    ],
    { perPage: 20, showPartialRows: false, showMetricsAtAllLevels: false, showTotal: true, totalFunc: "sum", percentageCol: "", row: true },
    "kibanaSavedObjectMeta.searchSourceJSON.index",
    "Native table over metricbeat-* Docker CPU, memory and disk fields."
  ),
  metricbeatRef
);

await put(
  "visualization",
  "looma-metricbeat-docker-images",
  nativeVisAttrs(
    "Metricbeat Docker - images",
    "pie",
    [
      { id: "1", enabled: true, type: "count", schema: "metric", params: {} },
      {
        id: "2",
        enabled: true,
        type: "terms",
        schema: "segment",
        params: {
          field: "container.image.name.keyword",
          orderBy: "1",
          order: "desc",
          size: 12,
          otherBucket: false,
          otherBucketLabel: "Other",
          missingBucket: false,
          missingBucketLabel: "Missing",
        },
      },
    ],
    { addTooltip: true, addLegend: true, legendPosition: "bottom", isDonut: true, labels: { show: false, values: true, last_level: true, truncate: 100 } },
    "kibanaSavedObjectMeta.searchSourceJSON.index",
    "Native donut chart for Docker image distribution from metricbeat-*."
  ),
  metricbeatRef
);

await put(
  "visualization",
  "looma-metricbeat-docker-hosts",
  nativeVisAttrs(
    "Docker containers per host",
    "pie",
    [
      { id: "1", enabled: true, type: "cardinality", schema: "metric", params: { field: "container.name.keyword", customLabel: "containers" } },
      {
        id: "2",
        enabled: true,
        type: "terms",
        schema: "segment",
        params: {
          field: "host.name.keyword",
          orderBy: "1",
          order: "desc",
          size: 10,
          otherBucket: false,
          otherBucketLabel: "Other",
          missingBucket: false,
          missingBucketLabel: "Missing",
        },
      },
    ],
    { addTooltip: true, addLegend: true, legendPosition: "bottom", isDonut: true, labels: { show: false, values: true, last_level: true, truncate: 100 } },
    "kibanaSavedObjectMeta.searchSourceJSON.index",
    "Docker containers per Metricbeat host."
  ),
  metricbeatRef
);

const metricbeatPanelDefs = [
  ["panel_0", "looma-metricbeat-docker-table", 0, 0, 28, 18],
  ["panel_1", "looma-metricbeat-docker-states", 28, 0, 20, 8],
  ["panel_2", "looma-metricbeat-docker-hosts", 28, 8, 10, 16],
  ["panel_3", "looma-metricbeat-docker-images", 38, 8, 10, 16],
  ["panel_4", "looma-metricbeat-docker-cpu", 0, 18, 24, 16],
  ["panel_5", "looma-metricbeat-docker-memory", 24, 22, 24, 16],
  ["panel_6", "looma-metricbeat-docker-network", 0, 38, 48, 17],
];

await put(
  "dashboard",
  "looma-metricbeat-docker",
  {
    title: "Metricbeat Docker",
    description: "Docker container metrics collected by Metricbeat into metricbeat-*.",
    hits: 0,
    panelsJSON: JSON.stringify(metricbeatPanelDefs.map(([ref, id, x, y, w, h]) => ({
      panelIndex: ref,
      panelRefName: ref,
      embeddableConfig: {},
      gridData: { x, y, w, h, i: ref },
      version: "3.6.0",
    }))),
    optionsJSON: JSON.stringify({ hidePanelTitles: false, useMargins: true }),
    version: 1,
    timeRestore: true,
    timeFrom: "now-15m",
    timeTo: "now",
    refreshInterval: { pause: false, value: 30000 },
    kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { language: "kuery", query: "" }, filter: [] }) },
  },
  metricbeatPanelDefs.map(([ref, id]) => ({ name: ref, type: "visualization", id }))
);

const apmDashboard = await request("/api/saved_objects/dashboard/5a0efa8b-2499-4cea-a49b-0e692d472536");
const panels = JSON.parse(apmDashboard.attributes.panelsJSON);
const references = [...apmDashboard.references];
const additions = [
  ["panel_11", "looma-otel-metrics-by-service", 0, 89, 48, 18],
  ["panel_12", "looma-otel-spans-service-health", 0, 107, 48, 18],
  ["panel_13", "looma-metricbeat-docker-states", 0, 125, 16, 10],
  ["panel_14", "looma-metricbeat-docker-cpu", 16, 125, 32, 16],
];

for (const [ref, id, x, y, w, h] of additions) {
  if (!panels.some((panel) => panel.panelRefName === ref || panel.panelRefName === id)) {
    panels.push({ panelIndex: ref, panelRefName: ref, embeddableConfig: {}, gridData: { x, y, w, h, i: ref }, version: "3.6.0" });
  }
  if (!references.some((r) => r.name === ref)) references.push({ name: ref, type: "visualization", id });
}

await put(
  "dashboard",
  "5a0efa8b-2499-4cea-a49b-0e692d472536",
  {
    ...apmDashboard.attributes,
    title: "Metrics - LOOMA APM Metrics",
    description: "APM, OTEL metrics and Docker runtime metrics for Looma services.",
    panelsJSON: JSON.stringify(panels),
    timeRestore: true,
    timeFrom: "now-24h",
    timeTo: "now",
    refreshInterval: { pause: false, value: 30000 },
  },
  references
);

console.log("Installed dashboards: Metricbeat Docker; improved Metrics - LOOMA APM Metrics");
