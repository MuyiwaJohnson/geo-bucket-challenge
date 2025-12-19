import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import {
  createProperty,
  searchPropertiesByLocation,
} from "@geoflow/db/functions.js";
import { testProperties } from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "..", ".env.local") });

async function seed() {
  console.log("🌱 Starting seed...\n");

  try {
    console.log(`📦 Inserting ${testProperties.length} properties...\n`);

    for (const property of testProperties) {
      try {
        const created = await createProperty(property);
        console.log(
          `✅ Inserted: "${created.title}" → Bucket ${created.bucket_id}`
        );
      } catch (error) {
        console.error(`❌ Error inserting "${property.title}":`, error);
      }
    }

    console.log("\n🔍 Verifying test case...\n");
    const searchResults = await searchPropertiesByLocation("sangotedo");

    console.log(`Found ${searchResults.length} properties for "sangotedo"\n`);
    console.log("Expected: 3-4 properties (including typo variations)\n");

    if (searchResults.length >= 3) {
      console.log("✅ Test case PASSED: All Sangotedo properties found!\n");
      searchResults.forEach((p) => {
        console.log(`  - ${p.title} (${p.location_name})`);
      });
    } else {
      console.log(
        `⚠️  Test case WARNING: Expected at least 3 properties, found ${searchResults.length}`
      );
    }

    console.log("\n✅ Seed complete!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
