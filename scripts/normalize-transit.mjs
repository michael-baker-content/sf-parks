import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const archiveUrl = new URL("../data/imports/511-regional-gtfs.zip", import.meta.url);
const importMetadataUrl = new URL("../data/imports/511-regional-gtfs.meta.json", import.meta.url);
const outputUrl = new URL("../data/normalized/transit.json", import.meta.url);
const supportedAgencies = new Map([
  ["SF", { name: "Muni", modes: new Set(["0", "3", "5", "11", "12"]) }],
  ["BA", { name: "BART", modes: new Set(["1", "2"]) }],
  ["CT", { name: "Caltrain", modes: new Set(["2"]) }]
]);

export function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function rowObject(headers, values) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
}

async function eachArchivedCsv(archivePath, filename, visit) {
  const child = spawn("tar", ["-xOf", archivePath, filename], { windowsHide: true });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let headers = null;
  for await (const line of lines) {
    if (!headers) {
      headers = parseCsvLine(line.replace(/^\uFEFF/, ""));
      continue;
    }
    if (line) await visit(rowObject(headers, parseCsvLine(line)));
  }
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  if (exitCode !== 0) throw new Error(`Unable to read ${filename} from the GTFS archive: ${stderr.trim()}`);
}

export function transitMode(agencyId, routeType) {
  if (agencyId === "SF") {
    if (routeType === "3") return "bus";
    if (routeType === "5") return "cable-car";
    return "muni-rail";
  }
  if (agencyId === "BA") return "bart";
  if (agencyId === "CT") return "caltrain";
  return null;
}

function sortText(a, b) {
  return String(a).localeCompare(String(b), "en", { numeric: true });
}

export async function normalizeTransit({
  archivePath = fileURLToPath(archiveUrl),
  metadataPath = importMetadataUrl,
  destination = outputUrl
} = {}) {
  const routes = new Map();
  await eachArchivedCsv(archivePath, "routes.txt", async (row) => {
    const agency = supportedAgencies.get(row.agency_id);
    if (!agency || !agency.modes.has(row.route_type)) return;
    routes.set(row.route_id, {
      id: row.route_id,
      agencyId: row.agency_id,
      mode: transitMode(row.agency_id, row.route_type),
      shortName: row.route_short_name || row.route_long_name,
      longName: row.route_long_name || null,
      url: row.route_url || null
    });
  });

  const tripRoutes = new Map();
  await eachArchivedCsv(archivePath, "trips.txt", async (row) => {
    if (routes.has(row.route_id)) tripRoutes.set(row.trip_id, row.route_id);
  });

  const stopRoutes = new Map();
  await eachArchivedCsv(archivePath, "stop_times.txt", async (row) => {
    const routeId = tripRoutes.get(row.trip_id);
    if (!routeId) return;
    if (!stopRoutes.has(row.stop_id)) stopRoutes.set(row.stop_id, new Set());
    stopRoutes.get(row.stop_id).add(routeId);
  });

  const rawStops = new Map();
  await eachArchivedCsv(archivePath, "stops.txt", async (row) => {
    if (!stopRoutes.has(row.stop_id) && !row.parent_station) return;
    const latitude = Number(row.stop_lat);
    const longitude = Number(row.stop_lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    rawStops.set(row.stop_id, {
      id: row.stop_id,
      name: row.stop_name,
      latitude,
      longitude,
      locationType: row.location_type || "0",
      parentStationId: row.parent_station || null,
      wheelchairBoarding: row.wheelchair_boarding || "0",
      routeIds: [...(stopRoutes.get(row.stop_id) ?? [])]
    });
  });

  // Parent stations do not always appear in stop_times, so retain those referenced by a served stop.
  const parentIds = new Set([...rawStops.values()].map((stop) => stop.parentStationId).filter(Boolean));
  if ([...parentIds].some((id) => !rawStops.has(id))) {
    await eachArchivedCsv(archivePath, "stops.txt", async (row) => {
      if (!parentIds.has(row.stop_id) || rawStops.has(row.stop_id)) return;
      const latitude = Number(row.stop_lat);
      const longitude = Number(row.stop_lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      rawStops.set(row.stop_id, {
        id: row.stop_id,
        name: row.stop_name,
        latitude,
        longitude,
        locationType: row.location_type || "1",
        parentStationId: null,
        wheelchairBoarding: row.wheelchair_boarding || "0",
        routeIds: []
      });
    });
  }

  const servedStops = [...rawStops.values()].filter((stop) => stopRoutes.has(stop.id));
  const stations = new Map();
  for (const stop of servedStops) {
    const stopRouteIds = stop.routeIds.filter((routeId) => routes.has(routeId));
    const agencies = new Set(stopRouteIds.map((routeId) => routes.get(routeId).agencyId));
    for (const agencyId of agencies) {
      const agencyRouteIds = stopRouteIds.filter((routeId) => routes.get(routeId).agencyId === agencyId);
      const modes = new Set(agencyRouteIds.map((routeId) => routes.get(routeId).mode));
      const shouldGroup = agencyId !== "SF" || [...modes].some((mode) => mode !== "bus");
      const parent = shouldGroup && stop.parentStationId ? rawStops.get(stop.parentStationId) : null;
      const id = `${agencyId}:${parent?.id ?? stop.id}`;
      if (!stations.has(id)) {
        stations.set(id, {
          id,
          agencyId,
          agencyName: supportedAgencies.get(agencyId).name,
          name: parent?.name || stop.name,
          latitude: parent?.latitude ?? stop.latitude,
          longitude: parent?.longitude ?? stop.longitude,
          wheelchairBoarding: parent?.wheelchairBoarding ?? stop.wheelchairBoarding,
          routeIds: new Set()
        });
      }
      for (const routeId of agencyRouteIds) stations.get(id).routeIds.add(routeId);
    }
  }

  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const document = {
    schemaVersion: 1,
    source: {
      id: "511-regional-gtfs",
      retrievedAt: metadata.retrievedAt,
      attributionLabel: metadata.attributionLabel,
      sourceUrl: metadata.sourceUrl
    },
    agencies: [...supportedAgencies].map(([id, agency]) => ({ id, name: agency.name })),
    routes: [...routes.values()].sort((a, b) => sortText(a.agencyId, b.agencyId) || sortText(a.shortName, b.shortName)),
    stops: [...stations.values()].map((stop) => ({
      ...stop,
      routeIds: [...stop.routeIds].sort((a, b) => sortText(routes.get(a).shortName, routes.get(b).shortName))
    })).sort((a, b) => sortText(a.agencyId, b.agencyId) || sortText(a.name, b.name))
  };

  await mkdir(new URL("./", destination), { recursive: true });
  const temporaryUrl = new URL(`${destination.pathname.split("/").pop()}.tmp`, new URL("./", destination));
  await writeFile(temporaryUrl, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, destination);
  return { destination, routeCount: document.routes.length, stopCount: document.stops.length };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const result = await normalizeTransit();
    console.log(`Normalized ${result.stopCount} transit stops and stations across ${result.routeCount} routes.`);
    console.log(`Wrote ${fileURLToPath(result.destination)}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
