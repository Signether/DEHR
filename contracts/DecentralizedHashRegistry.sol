// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DecentralizedHashRegistry {
    event HashRegistered(
        bytes32 indexed fileHash,
        address indexed registrant,
        uint256 timestamp
    );

    struct Registration {
        address registrant;
        uint256 timestamp;
    }

    mapping(bytes32 => Registration) private registry;

    function registerHash(bytes32 fileHash) external {
        require(fileHash != bytes32(0), "Invalid hash");
        require(registry[fileHash].timestamp == 0, "Hash already registered");

        registry[fileHash] = Registration({
            registrant: msg.sender,
            timestamp: block.timestamp
        });

        emit HashRegistered(fileHash, msg.sender, block.timestamp);
    }

    function isRegistered(
        bytes32 fileHash
    ) external view returns (bool registered) {
        return registry[fileHash].timestamp != 0;
    }

    function getRegistration(
        bytes32 fileHash
    ) external view returns (address registrant, uint256 timestamp) {
        Registration memory reg = registry[fileHash];
        require(reg.timestamp != 0, "Hash not registered");
        return (reg.registrant, reg.timestamp);
    }
}
