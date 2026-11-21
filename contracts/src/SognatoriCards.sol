// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * Sognatori progressive-mint collection.
 * tokenId = (definitionIndex - 1) * 100 + serialNumber.
 * 64 definitions x 100 copies = 6,400 maximum NFTs.
 */
contract SognatoriCards is ERC721, ERC721URIStorage, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant MAX_SUPPLY = 6_400;
    uint8 public constant MAX_DEFINITIONS = 64;
    uint8 public constant COPIES_PER_DEFINITION = 100;

    uint256 public totalSupply;
    string private _collectionBaseURI;
    mapping(uint8 => uint8) public mintedForDefinition;
    mapping(uint256 => bool) public serialMinted;

    error InvalidDefinition();
    error InvalidSerial();
    error AlreadyMinted();
    error SupplyCapReached();
    error BaseURIAlreadyConfigured();
    error InvalidBaseURI();

    event SognatoreMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint8 indexed definitionIndex,
        uint8 serialNumber
    );

    constructor(address admin, address minter, string memory initialBaseURI)
        ERC721("Sognatori", "SOGN")
    {
        require(admin != address(0) && minter != address(0), "ZERO_ADDRESS");
        if (bytes(initialBaseURI).length != 0 && bytes(initialBaseURI)[bytes(initialBaseURI).length - 1] != bytes1("/")) {
            revert InvalidBaseURI();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
        _collectionBaseURI = initialBaseURI;
    }

    function tokenIdFor(uint8 definitionIndex, uint8 serialNumber)
        public
        pure
        returns (uint256)
    {
        if (definitionIndex == 0 || definitionIndex > MAX_DEFINITIONS) {
            revert InvalidDefinition();
        }
        if (serialNumber == 0 || serialNumber > COPIES_PER_DEFINITION) {
            revert InvalidSerial();
        }
        return (uint256(definitionIndex) - 1) * COPIES_PER_DEFINITION + serialNumber;
    }

    function mintCard(address to, uint8 definitionIndex, uint8 serialNumber)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        require(to != address(0), "ZERO_RECIPIENT");
        tokenId = tokenIdFor(definitionIndex, serialNumber);
        if (serialMinted[tokenId]) revert AlreadyMinted();
        if (totalSupply >= MAX_SUPPLY) revert SupplyCapReached();

        serialMinted[tokenId] = true;
        mintedForDefinition[definitionIndex] += 1;
        totalSupply += 1;
        _safeMint(to, tokenId);
        emit SognatoreMinted(to, tokenId, definitionIndex, serialNumber);
    }

    /// @notice Set once, before the first mint. Metadata should be pinned on IPFS.
    function setCollectionBaseURI(string calldata newBaseURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (totalSupply != 0 || bytes(_collectionBaseURI).length != 0) {
            revert BaseURIAlreadyConfigured();
        }
        if (bytes(newBaseURI).length == 0 || bytes(newBaseURI)[bytes(newBaseURI).length - 1] != bytes1("/")) {
            revert InvalidBaseURI();
        }
        _collectionBaseURI = newBaseURI;
    }

    function pauseMinting() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpauseMinting() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        _requireOwned(tokenId);
        return string.concat(_collectionBaseURI, _toString(tokenId), ".json");
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
