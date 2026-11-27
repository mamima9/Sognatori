# Sognatori ERC-721

Development only. This contract is not deployed and must not be used for real assets until the tests pass and an independent security review is complete.

## Toolchain

Install Foundry, then from this directory:

```sh
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit
forge test -vv
```

## Token IDs

`tokenId = (definitionIndex - 1) * 100 + serialNumber`

The valid ranges are definition 1–64 and serial 1–100. Token IDs are therefore stable and unique from 1 through 6400. Rarity is deliberately not encoded.

## Deployment safety

Deploy first to Base Sepolia (chain ID 84532). Use a multisig for admin and a separate backend signer for MINTER_ROLE. Do not deploy with an EOA controlled by the frontend. Verify the contract source on the Base explorer. The base metadata URI must be a pinned IPFS directory ending in `/`.

The contract constructor accepts admin, minter and initial metadata base URI. If the URI is initially empty, it can be configured once before the first mint. The contract does not implement arbitrary burns or transfer restrictions.
