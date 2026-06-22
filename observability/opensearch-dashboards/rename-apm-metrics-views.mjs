const DASHBOARDS_URL = process.env.OPENSEARCH_DASHBOARDS_URL || "http://localhost:45601";

const TITLES = new Map([
  ["0fbe5c26-2489-4560-ac7e-fc5198b4e2ce", "System Metrics Taxonomy"],
  ["bc98c2f2-da9d-4baf-aa59-36751edf8183", "Service Resource Metrics"],
  ["df0ea69c-c670-4f2f-ac0d-bb0a99109859", "Runtime Metrics Breakdown"],
  ["3eb70bee-2874-47df-a103-2ace5275ecf6", "Metric Request Rate"],
  ["d8b1b7f1-b60a-4907-91ae-5513ff14e04a", "Trace Filter Controls"],
  ["9b941a65-372f-4388-878d-c5227a5a6f02", "Service Topology Map"],
  ["307e97bb-a5f9-493b-b5f2-135e67876cf2", "Client Device Distribution"],
  ["e8543b5e-5a36-463a-a160-01000737e7f4", "Read/Write Direction Split"],
  ["0ceff886-243b-4924-8d98-bc995617de99", "Span Status Distribution"],
  ["ecf65a21-9177-456a-953f-09888b5a4087", "Disk I/O Operations"],
  ["looma-otel-metrics-by-service", "OTel Metrics by Service"],
  ["looma-otel-spans-service-health", "Span Service Health"],
  ["looma-metricbeat-docker-states", "Docker Container State Summary"],
  ["looma-metricbeat-docker-cpu", "Docker CPU Utilization"]
]);

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

function maybeUpdateVegaSpecTitle(visState, title) {
  if (visState.type !== "vega" || !visState.params?.spec) return;

  try {
    const spec = JSON.parse(visState.params.spec);
    if (typeof spec.title === "string") {
      spec.title = title;
    } else if (spec.title && typeof spec.title === "object") {
      spec.title.text = title;
    }
    visState.params.spec = JSON.stringify(spec, null, 2);
  } catch {
    // Keep the saved-object title as the source of truth if the Vega spec is not strict JSON.
  }
}

for (const [id, title] of TITLES) {
  const savedObject = await request(`/api/saved_objects/visualization/${id}`);
  const attributes = structuredClone(savedObject.attributes);
  const visState = JSON.parse(attributes.visState);

  attributes.title = title;
  visState.title = title;
  maybeUpdateVegaSpecTitle(visState, title);
  attributes.visState = JSON.stringify(visState);

  await request(`/api/saved_objects/visualization/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      attributes,
      references: savedObject.references || []
    })
  });

  console.log(`renamed ${id}: ${title}`);
}

console.log("done");
