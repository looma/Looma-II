const base = process.env.OSD_URL || "http://localhost:45601";

const headers = {
  "content-type": "application/json",
  "osd-xsrf": "true",
};

async function put(type, id, attributes, references = []) {
  const res = await fetch(`${base}/api/saved_objects/${type}/${id}?overwrite=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({ attributes, references }),
  });
  if (!res.ok) {
    throw new Error(`${type}/${id}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function vegaState(title, spec) {
  return JSON.stringify({
    title,
    type: "vega",
    aggs: [],
    params: { spec: JSON.stringify(spec, null, 2) },
  });
}

function visAttrs(title, spec, description = "") {
  return {
    title,
    description,
    uiStateJSON: "{}",
    version: 1,
    visState: vegaState(title, spec),
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify({
        query: { language: "kuery", query: "" },
        filter: [],
      }),
    },
  };
}

const signalVolumeSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  title: "OTEL signal volume by index",
  padding: 5,
  data: [
    {
      name: "indices",
      url: {
        index: "otel-events*,otel-metrics*,otel-v1-apm-span-*",
        "%context%": true,
        body: {
          size: 0,
          aggs: {
            indices: {
              terms: { field: "_index", size: 80, order: { _count: "desc" } },
            },
          },
        },
      },
      format: { property: "aggregations.indices.buckets" },
      transform: [
        {
          type: "formula",
          as: "signal",
          expr: "indexof(datum.key, 'otel-events') == 0 ? 'events' : indexof(datum.key, 'otel-metrics') == 0 ? 'metrics' : 'spans'",
        },
        { type: "aggregate", groupby: ["signal"], fields: ["doc_count"], ops: ["sum"], as: ["docs"] },
      ],
    },
  ],
  scales: [
    { name: "x", type: "band", domain: { data: "indices", field: "signal" }, range: "width", padding: 0.25 },
    { name: "y", type: "linear", domain: { data: "indices", field: "docs" }, range: "height", nice: true, zero: true },
    { name: "color", type: "ordinal", domain: ["events", "metrics", "spans"], range: ["#54b399", "#6092c0", "#d36086"] },
  ],
  axes: [
    { orient: "bottom", scale: "x", title: null },
    { orient: "left", scale: "y", title: "documents" },
  ],
  marks: [
    {
      type: "rect",
      from: { data: "indices" },
      encode: {
        update: {
          x: { scale: "x", field: "signal" },
          width: { scale: "x", band: 1 },
          y: { scale: "y", field: "docs" },
          y2: { scale: "y", value: 0 },
          fill: { scale: "color", field: "signal" },
          tooltip: { signal: "{'signal': datum.signal, 'documents': datum.docs}" },
        },
      },
    },
    {
      type: "text",
      from: { data: "indices" },
      encode: {
        update: {
          x: { scale: "x", field: "signal", band: 0.5 },
          y: { scale: "y", field: "docs", offset: -6 },
          align: { value: "center" },
          baseline: { value: "bottom" },
          text: { signal: "format(datum.docs, ',')" },
          fill: { value: "#343741" },
        },
      },
    },
  ],
};

const eventsSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  title: "OTEL events by severity",
  padding: 5,
  data: [
    {
      name: "severity",
      url: {
        index: "otel-events*",
        "%context%": true,
        "%timefield%": "time",
        body: {
          size: 0,
          aggs: {
            severity: {
              terms: { field: "severityText.keyword", size: 8, order: { _count: "desc" } },
              aggs: {
                time_buckets: {
                  date_histogram: {
                    field: "time",
                    fixed_interval: "30m",
                    extended_bounds: { min: { "%timefilter%": "min" }, max: { "%timefilter%": "max" } },
                    min_doc_count: 0,
                  },
                },
              },
            },
          },
        },
      },
      format: { property: "aggregations.severity.buckets" },
    },
    {
      name: "flat",
      source: "severity",
      transform: [
        { type: "flatten", fields: ["time_buckets.buckets"], as: ["bucket"] },
        { type: "formula", as: "severity", expr: "datum.key" },
        { type: "formula", as: "time", expr: "toDate(datum.bucket.key)" },
        { type: "formula", as: "count", expr: "datum.bucket.doc_count" },
      ],
    },
  ],
  scales: [
    { name: "x", type: "time", domain: { data: "flat", field: "time" }, range: "width", nice: true },
    { name: "y", type: "linear", domain: { data: "flat", field: "count" }, range: "height", nice: true, zero: true },
    { name: "color", type: "ordinal", domain: { data: "flat", field: "severity" }, range: ["#54b399", "#e7664c", "#d6bf57", "#6092c0"] },
  ],
  axes: [
    { orient: "bottom", scale: "x", title: "time", labelOverlap: true },
    { orient: "left", scale: "y", title: "events" },
  ],
  legends: [{ fill: "color", orient: "right", title: "severity" }],
  marks: [
    {
      type: "group",
      from: { facet: { name: "series", data: "flat", groupby: "severity" } },
      marks: [
        {
          type: "line",
          from: { data: "series" },
          encode: {
            enter: { strokeWidth: { value: 2 } },
            update: {
              x: { scale: "x", field: "time" },
              y: { scale: "y", field: "count" },
              stroke: { scale: "color", field: "severity" },
              tooltip: { signal: "{'severity': datum.severity, 'events': datum.count, 'time': timeFormat(datum.time, '%Y-%m-%d %H:%M')}" },
            },
          },
        },
      ],
    },
  ],
};

const metricsSpec = JSON.parse(String.raw`{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "title": "OTEL metrics by service",
  "padding": 5,
  "autosize": {"type": "fit", "contains": "padding"},
  "data": [
    {
      "name": "rawdata",
      "url": {
        "index": "otel-metrics-*",
        "%context%": true,
        "%timefield%": "time",
        "body": {
          "size": 0,
          "aggs": {
            "values_only": {
              "filter": {"exists": {"field": "value"}},
              "aggs": {
                "services": {
                  "terms": {"field": "serviceName.keyword", "size": 6, "order": {"_count": "desc"}, "missing": "unknown"},
                  "aggs": {
                    "metrics": {
                      "terms": {"field": "name.keyword", "size": 4, "order": {"_count": "desc"}},
                      "aggs": {
                        "time_buckets": {
                          "date_histogram": {
                            "field": "time",
                            "fixed_interval": "30m",
                            "extended_bounds": {"min": {"%timefilter%": "min"}, "max": {"%timefilter%": "max"}},
                            "min_doc_count": 0
                          },
                          "aggs": {"avg_value": {"avg": {"field": "value"}}}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "format": {"property": "aggregations.values_only.services.buckets"}
    },
    {"name": "metricdata", "source": "rawdata", "transform": [{"type": "flatten", "fields": ["metrics.buckets"], "as": ["metric"]}]},
    {
      "name": "flatdata",
      "source": "metricdata",
      "transform": [
        {"type": "flatten", "fields": ["metric.time_buckets.buckets"], "as": ["bucket"]},
        {"type": "formula", "as": "service", "expr": "datum.key"},
        {"type": "formula", "as": "metric_name", "expr": "datum.metric.key"},
        {"type": "formula", "as": "series", "expr": "datum.key + ' / ' + datum.metric.key"},
        {"type": "formula", "as": "time", "expr": "toDate(datum.bucket.key)"},
        {"type": "formula", "as": "value", "expr": "isValid(datum.bucket.avg_value.value) ? datum.bucket.avg_value.value : null"},
        {"type": "filter", "expr": "datum.value != null"},
        {"type": "collect", "sort": {"field": ["series", "time"], "order": ["ascending", "ascending"]}}
      ]
    }
  ],
  "scales": [
    {"name": "x", "type": "time", "domain": {"data": "flatdata", "field": "time"}, "range": "width", "nice": true},
    {"name": "y", "type": "linear", "domain": {"data": "flatdata", "field": "value"}, "range": "height", "nice": true, "zero": true},
    {"name": "color", "type": "ordinal", "domain": {"data": "flatdata", "field": "series"}, "range": "category"}
  ],
  "axes": [
    {"orient": "bottom", "scale": "x", "format": "%H:%M", "labelOverlap": true, "title": "time"},
    {"orient": "left", "scale": "y", "labelOverlap": true, "title": "avg(value)"}
  ],
  "legends": [{"fill": "color", "orient": "right", "title": "service / metric", "labelLimit": 360, "symbolSize": 80}],
  "marks": [
    {
      "type": "group",
      "from": {"facet": {"name": "series_facet", "data": "flatdata", "groupby": "series"}},
      "marks": [
        {
          "type": "line",
          "from": {"data": "series_facet"},
          "encode": {"enter": {"strokeWidth": {"value": 2}}, "update": {"x": {"scale": "x", "field": "time"}, "y": {"scale": "y", "field": "value"}, "stroke": {"scale": "color", "field": "series"}}}
        }
      ]
    }
  ]
}`);

const spansSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  title: "OTEL spans service health",
  padding: { left: 5, top: 5, right: 170, bottom: 35 },
  data: [
    {
      name: "services",
      url: {
        index: "otel-v1-apm-span-*",
        "%context%": true,
        "%timefield%": "startTime",
        body: {
          size: 0,
          aggs: {
            services: {
              terms: { field: "serviceName", size: 12, order: { _count: "desc" } },
              aggs: {
                avg_duration_ms: { avg: { script: { source: "doc[\"durationInNanos\"].value / 1000000.0" } } },
                p95_duration_ms: { percentiles: { field: "durationInNanos", percents: [95] } },
                errors: { filter: { term: { "status.code": 2 } } },
                traces: { cardinality: { field: "traceId" } },
              },
            },
          },
        },
      },
      format: { property: "aggregations.services.buckets" },
      transform: [
        { type: "formula", as: "service", expr: "datum.key" },
        { type: "formula", as: "spans", expr: "datum.doc_count" },
        { type: "formula", as: "avg_ms", expr: "isValid(datum.avg_duration_ms.value) ? datum.avg_duration_ms.value : 0" },
        { type: "formula", as: "p95_ms", expr: "isValid(datum.p95_duration_ms.values['95.0']) ? datum.p95_duration_ms.values['95.0'] / 1000000 : 0" },
        { type: "formula", as: "errors_count", expr: "isValid(datum.errors.doc_count) ? datum.errors.doc_count : 0" },
        { type: "formula", as: "traces_count", expr: "isValid(datum.traces.value) ? datum.traces.value : 0" },
        { type: "formula", as: "error_rate", expr: "datum.spans > 0 ? datum.errors_count / datum.spans : 0" },
        { type: "collect", sort: { field: ["errors_count", "avg_ms", "spans"], order: ["descending", "descending", "descending"] } },
      ],
    },
  ],
  axes: [
    { orient: "left", scale: "y", title: null, labelLimit: 220 },
    { orient: "bottom", scale: "x", title: "spans" },
  ],
  legends: [
    {
      orient: "right",
      title: "status",
      fill: "legendColor",
      values: ["has errors", "no errors"],
    },
  ],
  scales: [
    { name: "y", type: "band", domain: { data: "services", field: "service" }, range: "height", padding: 0.15 },
    { name: "x", type: "linear", domain: { data: "services", field: "spans" }, range: "width", nice: true, zero: true },
    { name: "legendColor", type: "ordinal", domain: ["has errors", "no errors"], range: ["#e7664c", "#54b399"] },
  ],
  marks: [
    {
      type: "rect",
      from: { data: "services" },
      encode: {
        update: {
          y: { scale: "y", field: "service" },
          height: { scale: "y", band: 1 },
          x: { scale: "x", value: 0 },
          x2: { scale: "x", field: "spans" },
          fill: { signal: "datum.errors_count > 0 ? '#e7664c' : '#54b399'" },
          fillOpacity: { value: 0.85 },
          tooltip: { signal: "{'service': datum.service, 'spans': datum.spans, 'traces': datum.traces_count, 'errors': datum.errors_count, 'error_rate': format(datum.error_rate, '.2%'), 'avg_ms': format(datum.avg_ms, '.2f'), 'p95_ms': format(datum.p95_ms, '.2f')}" },
        },
      },
    },
    {
      type: "text",
      from: { data: "services" },
      encode: {
        update: {
          y: { scale: "y", field: "service", band: 0.5 },
          x: { scale: "x", field: "spans", offset: 6 },
          baseline: { value: "middle" },
          text: { signal: "format(datum.spans, ',') + ' spans | avg ' + format(datum.avg_ms, '.1f') + ' ms | p95 ' + format(datum.p95_ms, '.1f') + ' ms | errors ' + datum.errors_count" },
          fill: { value: "#343741" },
          fontSize: { value: 11 },
        },
      },
    },
  ],
};

const notesSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  title: "Index coverage",
  padding: 10,
  marks: [
    {
      type: "text",
      encode: {
        update: {
          x: { value: 0 },
          y: { value: 10 },
          align: { value: "left" },
          baseline: { value: "top" },
          fontSize: { value: 13 },
          lineBreak: { value: "\n" },
          text: {
            value:
              "otel-events* -> logs/events from Data Prepper, time field: time, key fields: serviceName, severityText, body.\n" +
              "otel-metrics* -> OTEL metrics split by service/date plus legacy metric indices, time field: time, key fields: serviceName, name, value.\n" +
              "otel-v1-apm-span-* -> Trace Analytics spans split by service and rollover, time field: startTime, key fields: serviceName, traceGroup, durationInNanos, status.code.\n" +
              "Use the global time picker; panels intentionally cap terms and use 30m buckets to avoid search.max_buckets errors.",
          },
        },
      },
    },
  ],
};

const visualizations = [
  ["looma-otel-signal-volume", "OTEL - signal volume by index", signalVolumeSpec],
  ["looma-otel-events-severity", "OTEL - events by severity", eventsSpec],
  ["looma-otel-metrics-by-service", "OTEL - metrics by service", metricsSpec],
  ["looma-otel-spans-service-health", "OTEL - spans service health", spansSpec],
  ["looma-otel-index-coverage-notes", "OTEL - index coverage notes", notesSpec],
];

for (const [id, title, spec] of visualizations) {
  await put("visualization", id, visAttrs(title, spec));
}

const panelDefs = [
  ["panel_0", "looma-otel-index-coverage-notes", 0, 0, 48, 6],
  ["panel_1", "looma-otel-signal-volume", 0, 6, 16, 16],
  ["panel_2", "looma-otel-events-severity", 16, 6, 32, 16],
  ["panel_3", "looma-otel-metrics-by-service", 0, 22, 48, 18],
  ["panel_4", "looma-otel-spans-service-health", 0, 40, 48, 18],
];

const panels = panelDefs.map(([ref, id, x, y, w, h], i) => ({
  panelIndex: ref,
  panelRefName: ref,
  embeddableConfig: {},
  gridData: { x, y, w, h, i: ref },
  version: "3.6.0",
}));

await put(
  "dashboard",
  "looma-otel-signals-correlation",
  {
    title: "Looma - OTEL Signals Correlation",
    description: "Correlated OpenTelemetry events, metrics and spans stored in OpenSearch.",
    hits: 0,
    panelsJSON: JSON.stringify(panels),
    optionsJSON: JSON.stringify({ hidePanelTitles: false, useMargins: true }),
    version: 1,
    timeRestore: true,
    timeFrom: "now-24h",
    timeTo: "now",
    refreshInterval: { pause: false, value: 30000 },
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify({
        query: { language: "kuery", query: "" },
        filter: [],
      }),
    },
  },
  panelDefs.map(([ref, id]) => ({ name: ref, type: "visualization", id }))
);

console.log("Installed dashboard: Looma - OTEL Signals Correlation");
