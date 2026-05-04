// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AgentIdentity} from "../src/AgentIdentity.sol";

contract AgentIdentityTest is Test {
    AgentIdentity ai;
    address operator = address(0xBEEF);
    address attacker = address(0xDEAD);

    function setUp() public {
        ai = new AgentIdentity();
    }

    function test_mint() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        assertEq(id, 1);
        assertEq(ai.ownerOf(id), operator);
        assertEq(ai.tokenURI(id), "ipfs://meta");
        assertEq(ai.agentOperator(id), operator);
    }

    function test_recordAlert_byOperator() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        bytes32 h = keccak256("alert-1");
        vm.prank(operator);
        ai.recordAlert(id, h, "https://theread.xyz/alert/1");
        assertEq(ai.attestationsOf(id), 1);
        assertTrue(ai.hasAlert(id, h));
    }

    function test_recordAlert_byOwner() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        bytes32 h = keccak256("alert-2");
        ai.recordAlert(id, h, "https://theread.xyz/alert/2");
        assertEq(ai.attestationsOf(id), 1);
    }

    function test_recordAlert_revertsForStranger() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        bytes32 h = keccak256("alert-3");
        vm.prank(attacker);
        vm.expectRevert(bytes("not authorized"));
        ai.recordAlert(id, h, "https://x");
    }

    function test_recordAlert_dedupesSameHash() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        bytes32 h = keccak256("alert-4");
        ai.recordAlert(id, h, "uri-1");
        vm.expectRevert(bytes("duplicate alert"));
        ai.recordAlert(id, h, "uri-2");
    }

    function test_alertsBetween_paginates() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        for (uint256 i = 0; i < 25; i++) {
            ai.recordAlert(id, keccak256(abi.encode(i)), "u");
        }
        AgentIdentity.Alert[] memory page = ai.alertsBetween(id, 10, 20);
        assertEq(page.length, 10);
    }

    function test_setOperator_byTokenOwner() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        vm.prank(operator);
        ai.setOperator(id, attacker);
        assertEq(ai.agentOperator(id), attacker);
        // attacker can now record
        vm.prank(attacker);
        ai.recordAlert(id, keccak256("h"), "u");
        assertEq(ai.attestationsOf(id), 1);
    }

    function test_setOperator_revertsForStranger() public {
        uint256 id = ai.mint(operator, "ipfs://meta");
        vm.prank(attacker);
        vm.expectRevert(bytes("only token owner"));
        ai.setOperator(id, attacker);
    }

    function test_mint_onlyOwner() public {
        vm.prank(attacker);
        vm.expectRevert(bytes("not owner"));
        ai.mint(attacker, "x");
    }

    function testFuzz_recordManyAlerts(bytes32 h1, bytes32 h2, bytes32 h3) public {
        vm.assume(h1 != h2 && h2 != h3 && h1 != h3);
        uint256 id = ai.mint(operator, "m");
        ai.recordAlert(id, h1, "a");
        ai.recordAlert(id, h2, "b");
        ai.recordAlert(id, h3, "c");
        assertEq(ai.attestationsOf(id), 3);
        assertTrue(ai.hasAlert(id, h2));
    }
}
