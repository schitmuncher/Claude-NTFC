// scripts/build-station-urns.js
// One-time script to resolve Trainline station IDs and URNs for Nantwich Town and all 21 NPL league opponents.

const https = require("https");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const STATIONS_CSV_URL = "https://raw.githubusercontent.com/trainline-eu/stations/master/stations.csv";
const CSV_CACHE_PATH = path.join(__dirname, "stations.csv");

// Helper to download the file if not cached
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000000) {
      console.log(`Using cached CSV: ${dest} (${fs.statSync(dest).size} bytes)`);
      return resolve(dest);
    }
    console.log(`Downloading stations CSV from ${url}...`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          console.log("Download complete.");
          resolve(dest);
        });
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// 21 League opponents + Nantwich ground specifications and intended station codes
const TARGET_CLUBS = [
  { club: "Nantwich Town", crs: "NAN", ground: "The Swansway Stadium", postcode: "CW5 5BS", preferredStation: "Nantwich" },
  { club: "Bootle", crs: "AIN", ground: "Berry Street Garage Stadium (Vesty Road)", postcode: "L30 1NY", preferredStation: "Aintree", altCrs: "OPK" }, // Aintree is ~0.8 miles from Vesty Rd; Orrell Park is also close
  { club: "Shifnal Town", crs: "SFN", ground: "Acoustafoam Stadium (Coppice Green Lane)", postcode: "TF11 8PD", preferredStation: "Shifnal" },
  { club: "Wythenshawe", crs: "GTY", ground: "Hollyhedge Park (Sharston)", postcode: "M22 4NZ", preferredStation: "Gatley" }, // Gatley is the closest National Rail station to Hollyhedge Park (~1.2 mi)
  { club: "Witton Albion", crs: "LTG", ground: "The U Lock It Stadium (Wincham)", postcode: "CW9 6DA", preferredStation: "Lostock Gralam", altCrs: "NWI" }, // Lostock Gralam is ~0.8 mi walking distance to Wincham Park; Northwich is 1.5 mi
  { club: "Stafford Rangers", crs: "STA", ground: "Stan Robinson Stadium (Marston Road)", postcode: "ST16 3UF", preferredStation: "Stafford" },
  { club: "Prescot Cables", crs: "PSC", ground: "Valerie Park (Hope Street)", postcode: "L34 6HD", preferredStation: "Prescot" },
  { club: "Runcorn Linnets", crs: "RUE", ground: "The APEC Taxis Stadium (Murdishaw Avenue)", postcode: "WA7 6GJ", preferredStation: "Runcorn East" }, // Murdishaw is right next to Runcorn East station (~0.8 mi)
  { club: "Hanley Town", crs: "SOT", ground: "Potteries Park (Abbey Lane, Bucknall)", postcode: "ST2 8AU", preferredStation: "Stoke-on-Trent" }, // Hanley has no station; Stoke-on-Trent is the primary rail hub
  { club: "Vauxhall Motors", crs: "OVE", ground: "The VanEupen Arena (Rivacre Road)", postcode: "CH66 1NJ", preferredStation: "Overpool", altCrs: "ELP" }, // Overpool is 0.5 miles from Rivacre Road ground
  { club: "Stalybridge Celtic", crs: "SYB", ground: "Bower Fold (Mottram Road)", postcode: "SK15 2RT", preferredStation: "Stalybridge" },
  { club: "Atherton Collieries", crs: "ATN", ground: "The Skuna Stadium (Alder Street)", postcode: "M46 9EY", preferredStation: "Atherton", altCrs: "HGF" }, // Atherton station is 0.6 miles
  { club: "Clitheroe", crs: "CLH", ground: "EcoGiants Stadium (Shawbridge)", postcode: "BB7 1LZ", preferredStation: "Clitheroe" },
  { club: "Lower Breck", crs: "KKD", ground: "Anfield Sports & Community Centre (Lower Breck Road)", postcode: "L6 0AG", preferredStation: "Kirkdale", altCrs: "LIV" }, // Kirkdale is 1.4 miles from ASCC; Liverpool Lime Street is main hub
  { club: "Chasetown", crs: "CAO", ground: "The Scholars Ground (Church Street)", postcode: "WS7 3QL", preferredStation: "Cannock", altCrs: "LIC" }, // Cannock is closest operational station; Lichfield City is also direct bus
  { club: "Padiham", crs: "RSG", ground: "The Arbories (Well Street)", postcode: "BB12 8LE", preferredStation: "Rose Grove", altCrs: "HPN" }, // Rose Grove is 1.8 mi; Hapton is 2 mi
  { club: "1874 Northwich", crs: "GBK", ground: "The Townfield Ground (Barnton)", postcode: "CW8 4LH", preferredStation: "Greenbank", altCrs: "NWI" }, // Greenbank is closest to Barnton (~1.8 mi)
  { club: "Newcastle Town", crs: "SOT", ground: "The Lyme Valley Stadium (Clayton)", postcode: "ST5 3BX", preferredStation: "Stoke-on-Trent" }, // Newcastle-under-Lyme has no station; Stoke-on-Trent is closest
  { club: "Mossley", crs: "MSL", ground: "Seel Park (Market Street)", postcode: "OL5 0ES", preferredStation: "Mossley" },
  { club: "Kidsgrove Athletic", crs: "KDG", ground: "Autonet Insurance Stadium (Hollinwood Road)", postcode: "ST7 1DQ", preferredStation: "Kidsgrove" },
  { club: "Congleton Town", crs: "CNG", ground: "The Cleric Stadium (Booth Street)", postcode: "CW12 4DG", preferredStation: "Congleton" },
  { club: "Lichfield City", crs: "LIC", ground: "Trade Tyre Community Stadium (Brownsfield Park)", postcode: "WS13 7HQ", preferredStation: "Lichfield City", altCrs: "LTV" },
];

async function main() {
  const filePath = await downloadFile(STATIONS_CSV_URL, CSV_CACHE_PATH);

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let header = null;
  const gbStationsByCrs = new Map();
  const gbStationsByName = new Map();
  const gbStationsById = new Map();

  for await (const line of rl) {
    if (!header) {
      header = line.split(";");
      continue;
    }
    const cols = line.split(";");
    const country = cols[9]; // country column
    if (country !== "GB") continue;

    const id = cols[0];
    const name = cols[1];
    const slug = cols[2];
    const lat = cols[5];
    const lon = cols[6];
    const atoc_id = cols[46]; // atoc_id CRS code

    const stationObj = { id, name, slug, lat, lon, atoc_id };

    if (atoc_id) {
      gbStationsByCrs.set(atoc_id.toUpperCase(), stationObj);
    }
    gbStationsByName.set(name.toLowerCase(), stationObj);
    gbStationsById.set(id, stationObj);
  }

  console.log(`Loaded ${gbStationsByCrs.size} GB stations with CRS codes.`);

  console.log("\nResolving stations for Nantwich Town and 21 League opponents...\n");

  const results = {};

  for (const t of TARGET_CLUBS) {
    let match = gbStationsByCrs.get(t.crs);
    if (!match && t.altCrs) {
      match = gbStationsByCrs.get(t.altCrs);
    }
    if (!match) {
      match = gbStationsByName.get(t.preferredStation.toLowerCase());
    }

    if (!match) {
      console.error(`❌ Could not resolve station for ${t.club} (CRS: ${t.crs})`);
      continue;
    }

    const urn = `urn:trainline:generic:loc:${match.id}`;
    results[t.club] = {
      club: t.club,
      stationName: match.name,
      crs: match.atoc_id || t.crs,
      stationId: match.id,
      urn: urn,
      ground: t.ground,
      postcode: t.postcode,
    };

    console.log(`✓ ${t.club.padEnd(20)} -> ${match.name} (${match.atoc_id || "—"}) [ID: ${match.id}] URN: ${urn}`);
  }

  // Generate output dictionary
  const dictionaryFileContent = `// Verified Station Mappings and Trainline URNs
// Origin: Nantwich (NAN) -> urn:trainline:generic:loc:25844
const NANTWICH_STATION = {
  name: "Nantwich",
  crs: "NAN",
  stationId: "25844",
  urn: "urn:trainline:generic:loc:25844"
};

const AWAY_GROUND_STATIONS = ${JSON.stringify(results, null, 2)};

module.exports = { NANTWICH_STATION, AWAY_GROUND_STATIONS };
`;

  fs.writeFileSync(path.join(__dirname, "resolved-stations.json"), JSON.stringify(results, null, 2));
  console.log("\nSaved resolved stations to scripts/resolved-stations.json");
}

main().catch(console.error);
