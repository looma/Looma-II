const DASHBOARDS_URL = process.env.OPENSEARCH_DASHBOARDS_URL || "http://localhost:45601";

const SPAN_INDEX_PATTERN_ID = "4bea83a0-4595-11f1-95b0-cb6bad4e57f8";
const SPAN_INDEX_REFERENCE = {
  name: "kibanaSavedObjectMeta.searchSourceJSON.index",
  type: "index-pattern",
  id: SPAN_INDEX_PATTERN_ID
};

const SPAN_VISUALIZATIONS = [
  "db27cfa2-8032-4917-b0af-72ea66a9f609",
  "541799f1-3574-4741-a28a-774f39a7863f",
  "d814f961-33d8-4a11-b2c8-fe1e9ba0cf23",
  "5255c68f-9781-448d-95a7-6461515f540d"
];

const TRACE_CONTROLS_ID = "d8b1b7f1-b60a-4907-91ae-5513ff14e04a";

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

function updateSearchSource(attributes) {
  const meta = attributes.kibanaSavedObjectMeta || {};
  const searchSource = meta.searchSourceJSON ? JSON.parse(meta.searchSourceJSON) : {};
  searchSource.indexRefName = SPAN_INDEX_REFERENCE.name;
  attributes.kibanaSavedObjectMeta = {
    ...meta,
    searchSourceJSON: JSON.stringify(searchSource)
  };
}

function updateMainReference(references) {
  const otherReferences = (references || []).filter((reference) => reference.name !== SPAN_INDEX_REFERENCE.name);
  return [SPAN_INDEX_REFERENCE, ...otherReferences];
}

async function updateSavedObject(id, mutate) {
  const savedObject = await request(`/api/saved_objects/visualization/${id}`);
  const attributes = structuredClone(savedObject.attributes);
  let references = structuredClone(savedObject.references || []);
  mutate(attributes, references);

  const updated = await request(`/api/saved_objects/visualization/${id}`, {
    method: "PUT",
    body: JSON.stringify({ attributes, references })
  });

  console.log(`updated ${id}: ${updated.attributes.title}`);
}

for (const id of SPAN_VISUALIZATIONS) {
  await updateSavedObject(id, (attributes, references) => {
    updateSearchSource(attributes);
    const visState = JSON.parse(attributes.visState);

    if (visState.title === "Signal Volume by Service") {
      visState.title = "Span Volume by Service";
      attributes.title = "Span Volume by Service";
      for (const agg of visState.aggs || []) {
        if (agg.params?.customLabel === "amount") agg.params.customLabel = "spans";
        if (agg.params?.customLabel === "services") agg.params.customLabel = "service";
      }
    }

    attributes.visState = JSON.stringify(visState);
    references.splice(0, references.length, ...updateMainReference(references));
  });
}

await updateSavedObject(TRACE_CONTROLS_ID, (attributes, references) => {
  const visState = JSON.parse(attributes.visState);
  for (const control of visState.params?.controls || []) {
    if (control.fieldName === "serviceName.keyword") {
      control.fieldName = "serviceName";
    }
  }
  attributes.visState = JSON.stringify(visState);

  for (const reference of references) {
    if (reference.name.startsWith("control_")) {
      reference.id = SPAN_INDEX_PATTERN_ID;
      reference.type = "index-pattern";
    }
  }
});

console.log("done");
