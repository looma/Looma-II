const base = process.env.OSD_URL || "http://localhost:45601";
const headers = { "content-type": "application/json", "osd-xsrf": "true" };

async function get(type, id) {
  const res = await fetch(`${base}/api/saved_objects/${type}/${id}`, { headers });
  if (!res.ok) throw new Error(`GET ${type}/${id}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function put(type, id, attributes, references = []) {
  const res = await fetch(`${base}/api/saved_objects/${type}/${id}?overwrite=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({ attributes, references }),
  });
  if (!res.ok) throw new Error(`PUT ${type}/${id}: ${res.status} ${await res.text()}`);
  return res.json();
}

const dashboards = {
  "b26b19dc-3211-4c0b-8dba-a60b741b63c9": {
    title: "Looma - Telemetry Ingestion Overview",
    description: "High-level ingestion rates for OpenTelemetry spans, metrics and events.",
    timeFrom: "now-24h",
    timeTo: "now",
    refreshInterval: { pause: false, value: 30000 },
  },
  "fa4e30fd-54b5-4a6a-b6b0-d24023e324ce": {
    title: "Looma - Service Observability",
    description: "Service topology, request rates, trace groups, latency and trace waterfalls.",
    timeFrom: "now-24h",
    timeTo: "now",
    refreshInterval: { pause: false, value: 30000 },
  },
  "7c834b90-6db0-4eed-9f38-b0199168e07a": {
    title: "Looma - Service Drilldown",
    description: "Correlated service-level metrics, traces, latency and waterfall analysis.",
    timeFrom: "now-24h",
    timeTo: "now",
    refreshInterval: { pause: false, value: 30000 },
  },
};

const visualizations = {
  "f5b67c11-79d6-434a-a4ba-dba60889d142": "Trace Span Throughput",
  "15b4ff19-56a8-4fe0-a4db-04f1b6d840c4": "Metric Ingestion Rate",
  "0bb6575b-6437-49cb-95f4-277667ad4455": "Event Ingestion Rate",
  "db27cfa2-8032-4917-b0af-72ea66a9f609": "Signal Volume by Service",
  "45ef1d5a-1bb5-4caa-804b-f1939666c9c1": "Interactive Span Throughput",
  "d8b1b7f1-56a8-4fe0-a4db-04f1b6d840c4": undefined,
  "d8b1b7f1-b60a-4907-91ae-5513ff14e04a": "Trace Explorer Controls",
  "6c426b6b-0c0a-43d3-b2c6-09042ea3c1dc": "Service Dependency Map",
  "541799f1-3574-4741-a28a-774f39a7863f": "Trace Group Distribution",
  "d814f961-33d8-4a11-b2c8-fe1e9ba0cf23": "Service Health Summary",
  "352a5c8b-babc-4812-b608-490b72b7e629": "Service Request Rate Over Time",
  "5255c68f-9781-448d-95a7-6461515f540d": "Slow Traces by Duration",
  "1967f1fd-5757-4dd9-82ac-292b733dd9d1": "Trace Waterfall Timeline",
  "2f904fb6-ca1b-428b-bf85-b1e2d69916aa": "Service Metric Taxonomy",
};

function updateVisStateTitle(visState, title) {
  let state;
  try {
    state = JSON.parse(visState);
  } catch {
    return visState;
  }

  state.title = title;

  if (state.params?.spec) {
    try {
      const spec = JSON.parse(state.params.spec);
      if (spec.title !== undefined) {
        if (typeof spec.title === "string") spec.title = title;
        else if (typeof spec.title === "object") spec.title.text = title;
      }
      state.params.spec = JSON.stringify(spec, null, 2);
    } catch {
      // Some older Vega specs are not strict JSON; keep their body untouched.
    }
  }

  return JSON.stringify(state);
}

function cleanPanelTitles(panelsJSON) {
  let panels;
  try {
    panels = JSON.parse(panelsJSON);
  } catch {
    return panelsJSON;
  }

  for (const panel of panels) {
    if (panel.title && /-|_|chart|dashboard|rate|count/i.test(panel.title)) {
      delete panel.title;
    }
  }
  return JSON.stringify(panels);
}

for (const [id, title] of Object.entries(visualizations)) {
  if (!title) continue;
  const vis = await get("visualization", id);
  await put(
    "visualization",
    id,
    {
      ...vis.attributes,
      title,
      description: vis.attributes.description || "",
      visState: updateVisStateTitle(vis.attributes.visState, title),
    },
    vis.references || []
  );
}

for (const [id, config] of Object.entries(dashboards)) {
  const dash = await get("dashboard", id);
  await put(
    "dashboard",
    id,
    {
      ...dash.attributes,
      title: config.title,
      description: config.description,
      panelsJSON: cleanPanelTitles(dash.attributes.panelsJSON),
      timeRestore: true,
      timeFrom: config.timeFrom,
      timeTo: config.timeTo,
      refreshInterval: config.refreshInterval,
    },
    dash.references || []
  );
}

console.log("Professionalized core dashboards and visualization titles.");
