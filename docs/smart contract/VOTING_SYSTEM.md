# AfriVoting System Documentation

## Overview

The **AfriVoting** contract is a custom voting system designed specifically for AfriCoin governance. It complements the OpenZeppelin Governor contract and provides additional voting features tailored to the AfriCoin protocol.

---

## Features

### 1. **Vote Creation**
- Create proposals with title, description, and voting period
- Requires minimum token balance (proposal threshold)
- IPFS hash support for storing full proposal details

```solidity
function createVote(
    string memory _title,
    string memory _description,
    uint256 _votingPeriod,
    string memory _ipfsHash
) external returns (uint256)
```

### 2. **Voting Mechanisms**

#### Simple Voting (3-option)
- **For (1)**: Support the proposal
- **Against (0)**: Oppose the proposal
- **Abstain (2)**: Neutral stance

```solidity
function castVote(
    uint256 _voteId,
    uint8 _support,
    string memory _reason
) external
```

#### Weighted Voting
- Voting power based on token balance
- Each token = 1 vote
- Balance checked at voting time

### 3. **Vote Delegation**
- Delegate voting rights to another address
- Temporary or permanent delegation
- Revoke delegation at any time

```solidity
function delegateVote(address _delegate) external
function revokeDelegation() external
```

### 4. **Vote Results Tracking**

Get comprehensive vote statistics:
```solidity
function getVoteResults(uint256 _voteId)
    external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool passed
    )
```

### 5. **Governance Parameters**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `proposalThreshold` | 1 token | Minimum tokens to create proposal |
| `quorumPercentage` | 4% | Minimum participation required |
| `MIN_VOTING_PERIOD` | 1 block | Minimum voting duration |
| `MAX_VOTING_PERIOD` | 50400 blocks | Maximum voting duration (~1 week) |

---

## Usage Examples

### Creating a Vote

```typescript
import { ethers } from "hardhat";

const afriVoting = await ethers.getContractAt("AfriVoting", votingAddress);

// Create a new proposal
const tx = await afriVoting.createVote(
    "Emergency Pause Protocol",
    "Propose emergency pause due to security concern",
    28800, // 2 days of voting (12s blocks)
    "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // IPFS hash
);

const receipt = await tx.wait();
console.log("Vote created with ID:", voteId);
```

### Casting a Vote

```typescript
// Vote FOR a proposal (1 = for)
const voteTx = await afriVoting.castVote(
    1, // Vote ID
    1, // Support: 1 = for
    "I believe this proposal will benefit the protocol"
);

await voteTx.wait();
```

### Delegating Voting Power

```typescript
// Delegate your voting power to another address
const delegateTx = await afriVoting.delegateVote(delegateAddress);

await delegateTx.wait();

// Later, revoke the delegation
const revokeTx = await afriVoting.revokeDelegation();
await revokeTx.wait();
```

### Checking Vote Results

```typescript
const results = await afriVoting.getVoteResults(voteId);

console.log(`For: ${ethers.formatEther(results.forVotes)} votes`);
console.log(`Against: ${ethers.formatEther(results.againstVotes)} votes`);
console.log(`Abstain: ${ethers.formatEther(results.abstainVotes)} votes`);
console.log(`Passed: ${results.passed}`);
```

---

## Integration with AfriDAO

AfriVoting can be integrated with AfriDAO for a hybrid governance approach:

```solidity
contract AfriDAO is Governor, ... {
    AfriVoting public afriVoting;

    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _afriVoting
    ) {
        afriVoting = AfriVoting(_afriVoting);
    }
}
```

---

## Admin Functions

### Setting Proposal Threshold

```solidity
// Require 10 tokens to create a proposal
await afriVoting.setProposalThreshold(ethers.parseEther("10"));
```

### Adjusting Quorum

```solidity
// Set quorum to 5%
await afriVoting.setQuorumPercentage(5);
```

### Emergency Pause

```solidity
// Pause all voting during emergency
await afriVoting.toggleVotingPause();

// Resume voting
await afriVoting.toggleVotingPause();
```

### Vote Execution and Cancellation

```solidity
// Mark vote as executed
await afriVoting.executeVote(voteId);

// Cancel a vote
await afriVoting.cancelVote(voteId);
```

---

## Events

| Event | Description |
|-------|-------------|
| `VoteCreated` | New vote proposal created |
| `VoteCast` | Vote cast by address |
| `VoteExecuted` | Vote marked as executed |
| `VoteCancelled` | Vote cancelled |
| `VoteDelegated` | Voting power delegated |
| `ProposalThresholdChanged` | Proposal threshold updated |
| `QuorumPercentageChanged` | Quorum percentage updated |
| `VotingPausedToggled` | Voting pause status changed |

---

## Security Considerations

1. **Reentrancy Protection**: Uses `ReentrancyGuard` for vote casting
2. **Access Control**: Admin functions restricted to contract owner
3. **Vote Validation**: Checks for double voting, voting while paused, etc.
4. **Balance Verification**: Voting power verified at vote cast time

---

## Gas Optimization Tips

1. **Batch Voting**: Consider batching multiple votes in a single transaction
2. **Lazy Evaluation**: Vote results computed on-demand, not stored
3. **Snapshot Voting**: Can implement block-height snapshots for better accuracy

---

## Future Enhancements

- [ ] Weighted voting per token holder
- [ ] Multi-signature execution
- [ ] Vote timelocks
- [ ] Proposal escrow system
- [ ] Off-chain voting with on-chain settlement (Snapshot integration)
- [ ] Vote rewards system

---

## Deployment Checklist

- [ ] Deploy AfriCoin (ERC20 token)
- [ ] Deploy AfriVoting with token address
- [ ] Deploy TimelockController
- [ ] Deploy AfriDAO (optional)
- [ ] Set proposal threshold
- [ ] Set quorum percentage
- [ ] Grant necessary roles
- [ ] Test voting flow in testnet

---

## Contract Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Base Sepolia | AfriCoin | `0x...` |
| Base Sepolia | AfriVoting | `0x...` |
| Base Sepolia | AfriDAO | `0x...` |

---

## Support & Questions

For issues or questions about the voting system, refer to:
- [OpenZeppelin Governor Docs](https://docs.openzeppelin.com/contracts/4.x/governance)
- [AfriCoin GitHub](https://github.com/africoin/africon)

---

*Last Updated: October 20, 2025*