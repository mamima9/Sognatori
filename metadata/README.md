# NFT metadata

1. Copy `sognatori.manifest.example.json` to `sognatori.manifest.json`.
2. Replace every placeholder with approved display name, lore and the final IPFS artwork URI.
3. Run:

```sh
node scripts/generate-nft-metadata.mjs --manifest metadata/sognatori.manifest.json --out metadata/generated --external-url https://YOUR-OFFICIAL-GAME-DOMAIN
```

The generator validates all 64 entries and creates exactly 6,400 files named `1.json` through `6400.json`. Upload the generated directory to IPFS and pin it with at least two independent pinning providers. The contract base URI must be the resulting directory CID with a trailing slash, e.g. `ipfs://bafy.../`.

Do not upload placeholder lore or placeholder artwork CIDs. Review all metadata and rights before pinning.
