// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentIdentity (ERC-8004 minimal)
 * @notice Minimal on-chain identity + attestation log for autonomous agents.
 *         Every alert "The Read" emits is recorded here, giving the agent a
 *         verifiable, on-chain track record (alert count, hashes, URIs).
 *
 *         Implements only the identity and attestation surfaces of the
 *         ERC-8004 draft. ERC-721 metadata is intentionally light — the
 *         tokenURI points to off-chain JSON describing the agent's role.
 */
contract AgentIdentity {
    /* ---------- ERC-721 minimal ---------- */
    string public name = "The Read";
    string public symbol = "READ";

    mapping(uint256 => address) private _owners;
    mapping(uint256 => string) private _tokenURIs;
    uint256 private _nextId = 1;

    /* ---------- Attestations ---------- */
    struct Alert {
        bytes32 alertHash;
        string uri;
        uint64 timestamp;
    }

    mapping(uint256 => Alert[]) private _alerts;
    mapping(uint256 => mapping(bytes32 => bool)) private _seenHash;

    /* ---------- Authorization ---------- */
    address public owner;
    mapping(uint256 => address) public agentOperator;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyOperator(uint256 tokenId) {
        require(
            msg.sender == owner ||
                msg.sender == agentOperator[tokenId] ||
                msg.sender == _owners[tokenId],
            "not authorized"
        );
        _;
    }

    /* ---------- Events ---------- */
    event AgentMinted(uint256 indexed tokenId, address indexed to, string metadataURI);
    event AlertRecorded(
        uint256 indexed tokenId,
        bytes32 indexed alertHash,
        string uri,
        uint256 timestamp
    );
    event OperatorSet(uint256 indexed tokenId, address indexed operator);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() {
        owner = msg.sender;
    }

    /* ---------- Mint ---------- */

    /// @notice Mint an agent identity. Caller becomes the operator by default.
    function mint(address to, string calldata metadataURI) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextId++;
        _owners[tokenId] = to;
        _tokenURIs[tokenId] = metadataURI;
        agentOperator[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
        emit AgentMinted(tokenId, to, metadataURI);
    }

    function setOperator(uint256 tokenId, address operator) external {
        require(_owners[tokenId] == msg.sender, "only token owner");
        agentOperator[tokenId] = operator;
        emit OperatorSet(tokenId, operator);
    }

    /* ---------- Attestations ---------- */

    /**
     * @notice Record an alert attestation. The hash should be a stable digest
     *         of the alert's structured context; the URI points to the human-
     *         readable narrative.
     *
     *         Same hash cannot be recorded twice — this is the key property
     *         that makes the on-chain record audit-able after the fact.
     */
    function recordAlert(uint256 tokenId, bytes32 alertHash, string calldata uri)
        external
        onlyOperator(tokenId)
    {
        require(_owners[tokenId] != address(0), "agent does not exist");
        require(!_seenHash[tokenId][alertHash], "duplicate alert");

        _seenHash[tokenId][alertHash] = true;
        _alerts[tokenId].push(
            Alert({alertHash: alertHash, uri: uri, timestamp: uint64(block.timestamp)})
        );

        emit AlertRecorded(tokenId, alertHash, uri, block.timestamp);
    }

    /* ---------- Views ---------- */

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _owners[tokenId];
        require(o != address(0), "no agent");
        return o;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "no agent");
        return _tokenURIs[tokenId];
    }

    function attestationsOf(uint256 tokenId) external view returns (uint256) {
        return _alerts[tokenId].length;
    }

    function alertAt(uint256 tokenId, uint256 idx) external view returns (Alert memory) {
        return _alerts[tokenId][idx];
    }

    function alertsBetween(uint256 tokenId, uint256 from, uint256 to)
        external
        view
        returns (Alert[] memory page)
    {
        uint256 len = _alerts[tokenId].length;
        if (from >= len) return new Alert[](0);
        if (to > len) to = len;
        page = new Alert[](to - from);
        for (uint256 i = from; i < to; i++) {
            page[i - from] = _alerts[tokenId][i];
        }
    }

    function hasAlert(uint256 tokenId, bytes32 alertHash) external view returns (bool) {
        return _seenHash[tokenId][alertHash];
    }
}
