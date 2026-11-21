// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SognatoriCards} from "../src/SognatoriCards.sol";

contract DeploySognatori is Script {
    function run() external returns (SognatoriCards deployed) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address admin = vm.envAddress("SOGNATORI_ADMIN");
        address minter = vm.envAddress("SOGNATORI_MINTER");
        string memory metadataBaseURI = vm.envString("SOGNATORI_METADATA_BASE_URI");

        require(admin != address(0) && minter != address(0), "ZERO_ROLE_ADDRESS");
        require(bytes(metadataBaseURI).length > 0, "METADATA_URI_REQUIRED");

        vm.startBroadcast(deployerKey);
        deployed = new SognatoriCards(admin, minter, metadataBaseURI);
        vm.stopBroadcast();

        console2.log("SognatoriCards deployed:", address(deployed));
        console2.log("Admin:", admin);
        console2.log("Minter:", minter);
    }
}
