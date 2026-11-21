import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const manifestPath = value("--manifest", "metadata/sognatori.manifest.json");
const outputDir = value("--out", "metadata/generated");
const externalUrl = value("--external-url", "https://sognatori.game");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest) || manifest.length !== 64) {
  throw new Error("Manifest must contain exactly 64 Sognatori.");
}
const ids = new Set();
for (const item of manifest) {
  if (!item.id || !item.name || !item.description || !item.image) {
    throw new Error("Each manifest item needs id, name, description and image.");
  }
  if (ids.has(item.id)) throw new Error(`Duplicate Sognatore id: ${item.id}`);
  ids.add(item.id);
  if (!item.image.startsWith("ipfs://") || item.image.includes("REPLACE_WITH")) {
    throw new Error(`Artwork CID missing for ${item.id}`);
  }
  if (item.description.includes("REPLACE_WITH")) {
    throw new Error(`Approved lore/description missing for ${item.id}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
let count = 0;

manifest.forEach((dreamer, index) => {
  const definitionIndex = index + 1;
  for (let serial = 1; serial <= 100; serial += 1) {
    const tokenId = (definitionIndex - 1) * 100 + serial;
    const metadata = {
      name: `${dreamer.name} #${String(serial).padStart(3, "0")}`,
      description: dreamer.description,
      image: dreamer.image,
      external_url: externalUrl,
      attributes: [
        { trait_type: "Sognatore", value: dreamer.name },
        { trait_type: "Sognatore ID", value: dreamer.id },
        { trait_type: "Serial Number", value: serial },
        { trait_type: "Edition Size", value: 100 },
        { trait_type: "Collection", value: "Sognatori" }
      ]
    };
    fs.writeFileSync(path.join(outputDir, `${tokenId}.json`), JSON.stringify(metadata, null, 2) + "\n");
    count += 1;
  }
});
if (count !== 6400) throw new Error(`Expected 6400 metadata files, generated ${count}`);
console.log(`Generated ${count} metadata JSON files in ${outputDir}`);
