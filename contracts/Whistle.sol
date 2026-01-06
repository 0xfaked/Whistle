// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Whistle {
    struct Report {
        string cid;         // IPFS Content Identifier
        address author;     // Wallet address of the whistleblower
        uint256 timestamp;  // Block timestamp
    }

    Report[] public reports;

    event ReportPublished(uint256 indexed id, string cid, address indexed author);

    // Publish a new report by storing its IPFS CID
    function publishReport(string memory _cid) public {
        reports.push(Report({
            cid: _cid,
            author: msg.sender,
            timestamp: block.timestamp
        }));

        emit ReportPublished(reports.length - 1, _cid, msg.sender);
    }

    // Get total number of reports
    function getReportsCount() public view returns (uint256) {
        return reports.length;
    }

    // Fetch all reports (Pagination can be done on frontend)
    function getAllReports() public view returns (Report[] memory) {
        return reports;
    }
}
