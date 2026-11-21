// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SognatoriCards} from "../src/SognatoriCards.sol";

contract SognatoriCardsTest is Test {
    SognatoriCards token;
    address admin = address(0xA11CE);
    address minter = address(0xBEEF);
    address player = address(0xCAFE);

    function setUp() public {
        vm.prank(admin);
        token = new SognatoriCards(admin, minter, "ipfs://collection/");
    }

    function testProgressiveTokenIds() public view {
        assertEq(token.tokenIdFor(1, 1), 1);
        assertEq(token.tokenIdFor(1, 100), 100);
        assertEq(token.tokenIdFor(64, 1), 6301);
        assertEq(token.tokenIdFor(64, 100), 6400);
    }

    function testMinterCanMintAndEmitsOwnership() public {
        vm.prank(minter);
        uint256 id = token.mintCard(player, 3, 17);
        assertEq(id, 217);
        assertEq(token.ownerOf(id), player);
        assertEq(token.totalSupply(), 1);
        assertEq(token.mintedForDefinition(3), 1);
        assertEq(token.tokenURI(id), "ipfs://collection/217.json");
    }

    function testRejectsDuplicateSerial() public {
        vm.startPrank(minter);
        token.mintCard(player, 1, 1);
        vm.expectRevert(SognatoriCards.AlreadyMinted.selector);
        token.mintCard(player, 1, 1);
        vm.stopPrank();
    }

    function testRejectsUnauthorizedMinter() public {
        vm.prank(player);
        vm.expectRevert();
        token.mintCard(player, 1, 1);
    }

    function testRejectsInvalidDefinitionAndSerial() public {
        vm.startPrank(minter);
        vm.expectRevert(SognatoriCards.InvalidDefinition.selector);
        token.mintCard(player, 0, 1);
        vm.expectRevert(SognatoriCards.InvalidDefinition.selector);
        token.mintCard(player, 65, 1);
        vm.expectRevert(SognatoriCards.InvalidSerial.selector);
        token.mintCard(player, 1, 0);
        vm.expectRevert(SognatoriCards.InvalidSerial.selector);
        token.mintCard(player, 1, 101);
        vm.stopPrank();
    }

    function testPauseStopsMintButNotTransfers() public {
        vm.prank(minter);
        uint256 id = token.mintCard(player, 1, 1);
        vm.prank(admin);
        token.pauseMinting();
        vm.prank(minter);
        vm.expectRevert();
        token.mintCard(player, 1, 2);
        vm.prank(player);
        token.transferFrom(player, address(0xD00D), id);
        assertEq(token.ownerOf(id), address(0xD00D));
    }



    function testMetadataUriMustBeSetBeforeMint() public {
        vm.prank(admin);
        SognatoriCards unconfigured = new SognatoriCards(admin, minter, "");
        vm.prank(minter);
        vm.expectRevert(SognatoriCards.InvalidBaseURI.selector);
        unconfigured.mintCard(player, 1, 1);
        vm.prank(admin);
        unconfigured.setCollectionBaseURI("ipfs://metadata/");
        vm.prank(minter);
        unconfigured.mintCard(player, 1, 1);
        assertEq(unconfigured.tokenURI(1), "ipfs://metadata/1.json");
    }

    function testRejectsBaseUriWithoutTrailingSlash() public {
        vm.expectRevert(SognatoriCards.InvalidBaseURI.selector);
        new SognatoriCards(admin, minter, "ipfs://collection");
    }

    function testBaseUriCannotChangeAfterFirstMint() public {
        vm.prank(minter);
        token.mintCard(player, 1, 1);
        vm.prank(admin);
        vm.expectRevert(SognatoriCards.BaseURIAlreadyConfigured.selector);
        token.setCollectionBaseURI("ipfs://other/");
    }
}
