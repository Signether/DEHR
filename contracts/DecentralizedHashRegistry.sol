// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Decentralized Hash Registry
 * @notice A contract for registering cryptographic hashes on-chain
 * @dev Designed for timestamped proof of existence & hash verification
 */
contract DecentralizedHashRegistry is ReentrancyGuard {
    event HashRegistered(
        bytes32 indexed fileHash,
        address indexed registrant,
        string indexed registrantName,
        uint256 timestamp
    );

    event RegistrantRegistered(
        address indexed wallet,
        string indexed registrantName,
        uint256 timestamp
    );

    struct Registration {
        address registrant;
        string registrantName;
        uint256 timestamp;
    }

    struct Registrant {
        string name;
        uint256 registrationTimestamp;
        bool isActive;
    }

    mapping(bytes32 => Registration) private registry;
    mapping(address => Registrant) private registrants;

    modifier onlyRegisteredWallet() {
        require(registrants[msg.sender].isActive, "Wallet not registered");
        _;
    }

    function registerWallet(
        string calldata registrantName
    ) external nonReentrant {
        require(bytes(registrantName).length > 0, "Invalid registrant name");
        require(!registrants[msg.sender].isActive, "Wallet already registered");

        registrants[msg.sender] = Registrant({
            name: registrantName,
            registrationTimestamp: block.timestamp,
            isActive: true
        });

        emit RegistrantRegistered(msg.sender, registrantName, block.timestamp);
    }

    function registerHash(
        bytes32 fileHash
    ) external nonReentrant onlyRegisteredWallet {
        require(fileHash != bytes32(0), "Invalid hash");
        require(registry[fileHash].timestamp == 0, "Hash already registered");

        string memory registrantName = registrants[msg.sender].name;

        registry[fileHash] = Registration({
            registrant: msg.sender,
            registrantName: registrantName,
            timestamp: block.timestamp
        });

        emit HashRegistered(
            fileHash,
            msg.sender,
            registrantName,
            block.timestamp
        );
    }

    function isRegistered(
        bytes32 fileHash
    ) external view returns (bool registered) {
        return registry[fileHash].timestamp != 0;
    }

    function getRegistration(
        bytes32 fileHash
    )
        external
        view
        returns (
            address registrant,
            string memory registrantName,
            uint256 timestamp
        )
    {
        Registration memory reg = registry[fileHash];
        require(reg.timestamp != 0, "Hash not registered");
        return (reg.registrant, reg.registrantName, reg.timestamp);
    }

    function getRegistrant(
        address wallet
    )
        external
        view
        returns (
            string memory name,
            uint256 registrationTimestamp,
            bool isActive
        )
    {
        Registrant memory reg = registrants[wallet];
        require(reg.isActive, "Registrant not found");
        return (reg.name, reg.registrationTimestamp, reg.isActive);
    }

    function isWalletRegistered(address wallet) external view returns (bool) {
        return registrants[wallet].isActive;
    }
}
