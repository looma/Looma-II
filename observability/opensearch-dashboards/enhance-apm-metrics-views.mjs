const DASHBOARDS_URL = process.env.OPENSEARCH_DASHBOARDS_URL || "http://localhost:45601";

const SERVICE_RESOURCE_ID = "bc98c2f2-da9d-4baf-aa59-36751edf8183";
const SERVICE_TOPOLOGY_ID = "9b941a65-372f-4388-878d-c5227a5a6f02";

async function request(path, options = {}) {
  const response = await fetch(`${DASHBOARDS_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "osd-xsrf": "true",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return body;
}

async function updateVisualization(id, title, spec) {
  const savedObject = await request(`/api/saved_objects/visualization/${id}`);
  const attributes = structuredClone(savedObject.attributes);
  const visState = JSON.parse(attributes.visState);

  attributes.title = title;
  visState.title = title;
  visState.params.spec = JSON.stringify(spec, null, 2);
  attributes.visState = JSON.stringify(visState);

  await request(`/api/saved_objects/visualization/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      attributes,
      references: savedObject.references || []
    })
  });

  console.log(`updated ${title}`);
}

const serviceResourceSpec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "padding": 5,
  "background": "#f8fafc",
  "title": {
    "text": "Service Resource Metrics",
    "anchor": "start",
    "fontSize": 14,
    "fontWeight": "600",
    "color": "#1f2937"
  },
  "signals": [
    {
      "name": "labels",
      "value": true,
      "bind": { "input": "checkbox" }
    },
    {
      "name": "zoom",
      "value": 1,
      "on": [
        {
          "events": { "type": "wheel", "source": "view", "consume": true, "preventDefault": true },
          "update": "clamp(zoom * pow(1.001, -event.deltaY * pow(16, event.deltaMode)), 0.45, 4)"
        }
      ]
    },
    {
      "name": "panAnchor",
      "value": null,
      "on": [
        {
          "events": { "type": "pointerdown", "source": "view", "consume": true },
          "update": "{x:x(), y:y(), panX:panX, panY:panY}"
        },
        {
          "events": { "type": "pointerup", "source": "window", "consume": true },
          "update": "null"
        }
      ]
    },
    {
      "name": "panX",
      "value": 0,
      "on": [
        {
          "events": {
            "type": "pointermove",
            "source": "window",
            "consume": true,
            "between": [
              { "type": "pointerdown", "source": "view", "consume": true },
              { "type": "pointerup", "source": "window", "consume": true }
            ]
          },
          "update": "panAnchor ? panAnchor.panX + (x() - panAnchor.x) : panX"
        }
      ]
    },
    {
      "name": "panY",
      "value": 0,
      "on": [
        {
          "events": {
            "type": "pointermove",
            "source": "window",
            "consume": true,
            "between": [
              { "type": "pointerdown", "source": "view", "consume": true },
              { "type": "pointerup", "source": "window", "consume": true }
            ]
          },
          "update": "panAnchor ? panAnchor.panY + (y() - panAnchor.y) : panY"
        }
      ]
    }
  ],
  "data": [
    {
      "name": "source_0",
      "url": {
        "index": "otel-v1-apm-service-map",
        "body": {
          "size": 5000,
          "fields": [
            "serviceName",
            "serviceName.keyword",
            "destination.domain",
            "destination.domain.keyword",
            "target.domain",
            "target.domain.keyword",
            "resource.attributes.service.name",
            "resource.attributes.service.name.keyword"
          ],
          "_source": true,
          "stored_fields": ["*"],
          "query": {
            "bool": {
              "must": ["%dashboard_context-must_clause%"],
              "must_not": ["%dashboard_context-must_not_clause%"],
              "filter": ["%dashboard_context-filter_clause%"]
            }
          }
        }
      },
      "format": { "property": "hits.hits" },
      "transform": [
        { "type": "formula", "as": "serviceName_src", "expr": "datum._source && datum._source.serviceName ? datum._source.serviceName : null" },
        { "type": "formula", "as": "serviceName_resource", "expr": "datum._source && datum._source.resource && datum._source.resource.attributes && datum._source.resource.attributes['service.name'] ? datum._source.resource.attributes['service.name'] : null" },
        { "type": "formula", "as": "serviceName_field", "expr": "datum.fields && datum.fields['serviceName'] && length(datum.fields['serviceName']) ? datum.fields['serviceName'][0] : null" },
        { "type": "formula", "as": "serviceName_field_kw", "expr": "datum.fields && datum.fields['serviceName.keyword'] && length(datum.fields['serviceName.keyword']) ? datum.fields['serviceName.keyword'][0] : null" },
        { "type": "formula", "as": "serviceName_res_field", "expr": "datum.fields && datum.fields['resource.attributes.service.name'] && length(datum.fields['resource.attributes.service.name']) ? datum.fields['resource.attributes.service.name'][0] : null" },
        { "type": "formula", "as": "serviceName_res_field_kw", "expr": "datum.fields && datum.fields['resource.attributes.service.name.keyword'] && length(datum.fields['resource.attributes.service.name.keyword']) ? datum.fields['resource.attributes.service.name.keyword'][0] : null" },
        { "type": "formula", "as": "serviceName", "expr": "isValid(datum.serviceName_src) ? datum.serviceName_src : (isValid(datum.serviceName_resource) ? datum.serviceName_resource : (isValid(datum.serviceName_field) ? datum.serviceName_field : (isValid(datum.serviceName_field_kw) ? datum.serviceName_field_kw : (isValid(datum.serviceName_res_field) ? datum.serviceName_res_field : (isValid(datum.serviceName_res_field_kw) ? datum.serviceName_res_field_kw : null)))))" },
        { "type": "formula", "as": "destinationDomain", "expr": "datum._source && datum._source.destination && datum._source.destination.domain ? datum._source.destination.domain : (datum.fields && datum.fields['destination.domain'] && length(datum.fields['destination.domain']) ? datum.fields['destination.domain'][0] : (datum.fields && datum.fields['destination.domain.keyword'] && length(datum.fields['destination.domain.keyword']) ? datum.fields['destination.domain.keyword'][0] : null))" },
        { "type": "formula", "as": "targetDomain", "expr": "datum._source && datum._source.target && datum._source.target.domain ? datum._source.target.domain : (datum.fields && datum.fields['target.domain'] && length(datum.fields['target.domain']) ? datum.fields['target.domain'][0] : (datum.fields && datum.fields['target.domain.keyword'] && length(datum.fields['target.domain.keyword']) ? datum.fields['target.domain.keyword'][0] : null))" },
        { "type": "formula", "as": "peerService", "expr": "isValid(datum.destinationDomain) ? datum.destinationDomain : (isValid(datum.targetDomain) ? datum.targetDomain : null)" },
        { "type": "filter", "expr": "isValid(datum.serviceName)" }
      ]
    },
    {
      "name": "service_stats",
      "url": {
        "index": "otel-v1-apm-span-*",
        "%context%": true,
        "%timefield%": "startTime",
        "body": {
          "size": 0,
          "aggs": {
            "services": {
              "terms": {
                "field": "serviceName",
                "size": 100
              },
              "aggs": {
                "errors": {
                  "filter": {
                    "term": { "status.code": 2 }
                  }
                },
                "avg_duration": {
                  "avg": { "field": "durationInNanos" }
                }
              }
            }
          }
        }
      },
      "format": { "property": "aggregations.services.buckets" },
      "transform": [
        { "type": "formula", "as": "name", "expr": "datum.key" },
        { "type": "formula", "as": "requests", "expr": "datum.doc_count" },
        { "type": "formula", "as": "errors", "expr": "datum.errors ? datum.errors.doc_count : 0" },
        { "type": "formula", "as": "avgDurationMs", "expr": "datum.avg_duration && isValid(datum.avg_duration.value) ? datum.avg_duration.value / 1000000 : 0" }
      ]
    },
    {
      "name": "links_services",
      "source": "source_0",
      "transform": [
        { "type": "filter", "expr": "isValid(datum.peerService) && datum.peerService !== datum.serviceName" },
        { "type": "aggregate", "groupby": ["serviceName", "peerService"] },
        { "type": "formula", "as": "source", "expr": "datum.serviceName" },
        { "type": "formula", "as": "target", "expr": "datum.peerService" }
      ]
    },
    {
      "name": "links",
      "source": ["links_services"]
    },
    {
      "name": "service_nodes",
      "source": "source_0",
      "transform": [
        { "type": "fold", "fields": ["serviceName", "peerService"], "as": ["role", "name"] },
        { "type": "filter", "expr": "isValid(datum.name)" },
        { "type": "aggregate", "groupby": ["name"] },
        {
          "type": "lookup",
          "from": "service_stats",
          "key": "name",
          "fields": ["name"],
          "values": ["requests", "errors", "avgDurationMs"],
          "as": ["requests", "errors", "avgDurationMs"],
          "default": 0
        },
        { "type": "formula", "as": "id", "expr": "datum.name" },
        { "type": "formula", "as": "nodeType", "expr": "'service'" },
        { "type": "formula", "as": "errorRate", "expr": "datum.requests > 0 ? datum.errors / datum.requests : 0" }
      ]
    },
    {
      "name": "nodes",
      "source": "service_nodes",
      "transform": [
        {
          "type": "force",
          "static": true,
          "iterations": 400,
          "forces": [
            { "force": "center", "x": { "signal": "width / 2" }, "y": { "signal": "height / 2" } },
            { "force": "collide", "radius": 34 },
            { "force": "nbody", "strength": -90 },
            { "force": "link", "links": "links", "distance": 150, "id": "id" }
          ]
        }
      ]
    }
  ],
  "scales": [
    {
      "name": "errorColor",
      "type": "linear",
      "domain": { "data": "nodes", "field": "errors" },
      "range": ["#dbeafe", "#fbbf24", "#dc2626"],
      "zero": true,
      "nice": true
    },
    {
      "name": "requestSize",
      "type": "sqrt",
      "domain": { "data": "nodes", "field": "requests" },
      "range": [220, 620],
      "zero": true
    }
  ],
  "legends": [
    {
      "fill": "errorColor",
      "title": "Span errors",
      "orient": "right",
      "gradientLength": 120
    }
  ],
  "marks": [
    {
      "type": "group",
      "encode": {
        "update": {
          "x": { "signal": "panX" },
          "y": { "signal": "panY" },
          "scaleX": { "signal": "zoom" },
          "scaleY": { "signal": "zoom" }
        }
      },
      "marks": [
        {
          "type": "rule",
          "from": { "data": "links" },
          "encode": {
            "update": {
              "x": { "field": "source.x" },
              "y": { "field": "source.y" },
              "x2": { "field": "target.x" },
              "y2": { "field": "target.y" },
              "stroke": { "value": "#94a3b8" },
              "strokeWidth": { "value": 1 },
              "strokeOpacity": { "value": 0.55 }
            }
          }
        },
        {
          "type": "symbol",
          "from": { "data": "nodes" },
          "encode": {
            "enter": {
              "stroke": { "value": "#0f172a" }
            },
            "update": {
              "x": { "field": "x" },
              "y": { "field": "y" },
              "size": { "scale": "requestSize", "field": "requests" },
              "fill": { "scale": "errorColor", "field": "errors" },
              "strokeWidth": { "signal": "datum.errors > 0 ? 2 : 1" },
              "tooltip": {
                "signal": "{'service': datum.name, 'requests': datum.requests, 'errors': datum.errors, 'error_rate': format(datum.errorRate, '.2%'), 'avg_duration_ms': format(datum.avgDurationMs, '.1f')}"
              }
            },
            "hover": {
              "size": { "signal": "max(scale('requestSize', datum.requests), 520)" },
              "strokeWidth": { "value": 3 }
            }
          }
        },
        {
          "type": "text",
          "from": { "data": "nodes" },
          "encode": {
            "enter": {
              "fill": { "value": "#111827" },
              "text": { "field": "name" },
              "fontSize": { "value": 12 },
              "baseline": { "value": "middle" }
            },
            "update": {
              "x": { "field": "x" },
              "y": { "field": "y" },
              "dx": { "value": 10 },
              "align": { "value": "left" },
              "opacity": { "signal": "labels ? 1 : 0" }
            }
          }
        }
      ]
    }
  ]
};

const topologyHeatmapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.6.0.json",
  "title": {
    "text": "Trace Latency Heatmap by Service",
    "anchor": "start",
    "fontSize": 14,
    "fontWeight": "600",
    "color": "#1f2937"
  },
  "config": {
    "view": {
      "continuousWidth": 320,
      "continuousHeight": 320,
      "strokeWidth": 0
    },
    "axis": {
      "labelColor": "#334155",
      "titleColor": "#334155",
      "gridColor": "#e2e8f0"
    }
  },
  "data": {
    "url": {
      "index": "otel-v1-apm-span-*",
      "%context%": true,
      "%timefield%": "startTime",
      "body": {
        "size": 0,
        "aggs": {
          "by_time": {
            "date_histogram": {
              "field": "startTime",
              "interval": { "%autointerval%": true },
              "min_doc_count": 1
            },
            "aggs": {
              "by_service": {
                "terms": {
                  "field": "serviceName",
                  "size": 30,
                  "order": { "_count": "desc" }
                },
                "aggs": {
                  "errors": {
                    "filter": {
                      "term": { "status.code": 2 }
                    }
                  },
                  "avg_duration": {
                    "avg": { "field": "durationInNanos" }
                  },
                  "p95_duration": {
                    "percentiles": {
                      "field": "durationInNanos",
                      "percents": [95]
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "format": { "property": "aggregations.by_time.buckets" }
  },
  "transform": [
    { "calculate": "toDate(datum.key)", "as": "time" },
    { "flatten": ["by_service.buckets"], "as": ["service_bucket"] },
    { "calculate": "datum.service_bucket.key", "as": "service" },
    { "calculate": "datum.service_bucket.doc_count", "as": "requests" },
    { "calculate": "datum.service_bucket.errors.doc_count", "as": "errors" },
    { "calculate": "datum.requests > 0 ? datum.errors / datum.requests : 0", "as": "error_rate" },
    { "calculate": "isValid(datum.service_bucket.avg_duration.value) ? datum.service_bucket.avg_duration.value / 1000000 : 0", "as": "avg_ms" },
    { "calculate": "isValid(datum.service_bucket.p95_duration.values['95.0']) ? datum.service_bucket.p95_duration.values['95.0'] / 1000000 : 0", "as": "p95_ms" },
    { "calculate": "datum.errors > 0 ? 'errors' : 'ok'", "as": "state" }
  ],
  "layer": [
    {
      "mark": {
        "type": "rect",
        "cornerRadius": 2,
        "stroke": "#ffffff",
        "strokeWidth": 0.5
      },
      "encoding": {
        "x": {
          "field": "time",
          "type": "temporal",
          "title": "Time",
          "axis": {
            "domainOpacity": 0,
            "grid": true,
            "tickOpacity": 0,
            "labelOverlap": true
          }
        },
        "y": {
          "field": "service",
          "type": "nominal",
          "title": null,
          "sort": "-x",
          "axis": {
            "domainOpacity": 0,
            "labelPadding": 10,
            "tickOpacity": 0
          }
        },
        "color": {
          "field": "p95_ms",
          "type": "quantitative",
          "title": "p95 duration (ms)",
          "scale": {
            "scheme": "yelloworangered",
            "zero": true
          }
        },
        "opacity": {
          "field": "requests",
          "type": "quantitative",
          "title": "Requests",
          "scale": {
            "domain": [0, 200],
            "range": [0.35, 1],
            "clamp": true
          },
          "legend": null
        },
        "tooltip": [
          { "field": "service", "type": "nominal", "title": "Service" },
          { "field": "time", "type": "temporal", "title": "Time" },
          { "field": "requests", "type": "quantitative", "title": "Requests" },
          { "field": "errors", "type": "quantitative", "title": "Errors" },
          { "field": "error_rate", "type": "quantitative", "format": ".2%", "title": "Error rate" },
          { "field": "avg_ms", "type": "quantitative", "format": ".1f", "title": "Avg duration (ms)" },
          { "field": "p95_ms", "type": "quantitative", "format": ".1f", "title": "p95 duration (ms)" }
        ]
      }
    },
    {
      "transform": [
        { "filter": "datum.errors > 0" }
      ],
      "mark": {
        "type": "point",
        "filled": true,
        "color": "#7f1d1d",
        "size": 38
      },
      "encoding": {
        "x": { "field": "time", "type": "temporal" },
        "y": { "field": "service", "type": "nominal" },
        "tooltip": [
          { "field": "service", "type": "nominal", "title": "Service" },
          { "field": "errors", "type": "quantitative", "title": "Errors" },
          { "field": "error_rate", "type": "quantitative", "format": ".2%", "title": "Error rate" }
        ]
      }
    }
  ]
};

await updateVisualization(SERVICE_RESOURCE_ID, "Service Resource Metrics", serviceResourceSpec);
await updateVisualization(SERVICE_TOPOLOGY_ID, "Trace Latency Heatmap", topologyHeatmapSpec);
console.log("done");
