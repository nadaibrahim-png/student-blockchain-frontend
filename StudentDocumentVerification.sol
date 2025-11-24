// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract StudentDocumentVerification {
    struct Record {
        address issuer;
        string studentName;
        string documentHash; // could be IPFS hash or hex
        uint256 timestamp;
    }

    mapping(string => Record) private records;
    string[] public recordKeys;

    event DocumentAdded(address indexed issuer, string indexed documentHash, string studentName, uint256 timestamp);

    function addRecord(string calldata documentHash, string calldata studentName) external {
        require(bytes(documentHash).length > 0, "documentHash required");
        require(bytes(studentName).length > 0, "studentName required");
        Record storage r = records[documentHash];
        if (bytes(r.documentHash).length == 0) {
            recordKeys.push(documentHash);
        }
        r.issuer = msg.sender;
        r.studentName = studentName;
        r.documentHash = documentHash;
        r.timestamp = block.timestamp;
        emit DocumentAdded(msg.sender, documentHash, studentName, block.timestamp);
    }

    function verifyRecord(string calldata documentHash) external view returns (address issuer, string memory studentName, uint256 timestamp, bool exists) {
        Record storage r = records[documentHash];
        if (bytes(r.documentHash).length == 0) {
            return (address(0), "", 0, false);
        }
        return (r.issuer, r.studentName, r.timestamp, true);
    }

    function getAllDocumentHashes() external view returns (string[] memory) {
        return recordKeys;
    }
}
