// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {AgentIdentity} from "../src/AgentIdentity.sol";

/**
 * Deploy AgentIdentity, mint The Read's identity NFT, and print the
 * resulting addresses to STDOUT for the indexer's .env.
 *
 * Usage (Mantle Sepolia):
 *   forge script script/Deploy.s.sol --rpc-url $MANTLE_SEPOLIA_RPC \
 *       --private-key $DEPLOYER_PRIVATE_KEY --broadcast
 *
 * Mainnet:
 *   forge script script/Deploy.s.sol --rpc-url $MANTLE_RPC_URL \
 *       --private-key $DEPLOYER_PRIVATE_KEY --broadcast --verify
 */
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        AgentIdentity ai = new AgentIdentity();
        uint256 tokenId = ai.mint(msg.sender, "https://theread.xyz/agent.json");
        vm.stopBroadcast();

        console.log("AgentIdentity deployed at:", address(ai));
        console.log("The Read tokenId:", tokenId);
        console.log("");
        console.log("Add to .env:");
        console.log("AGENT_IDENTITY_ADDRESS=%s", address(ai));
        console.log("AGENT_TOKEN_ID=%s", tokenId);
    }
}
