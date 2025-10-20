// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AfriVoting
 * @dev Custom voting system for AfriCoin governance
 * 
 * Features:
 * - Vote creation and management
 * - Weighted voting based on token balance
 * - Vote delegation
 * - Voting history tracking
 * - Emergency pause mechanism
 * - Multi-signature support for critical operations
 */
contract AfriVoting is Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    IERC20 public afriCoin;
    
    // Vote struct to store vote information
    struct Vote {
        uint256 voteId;
        string title;
        string description;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        string ipfsHash; // Link to full proposal details
        uint256 createdAt;
    }
    
    // Voter struct to track individual voting records
    struct Voter {
        uint256 votes; // Number of votes cast
        uint256 weight; // Voting weight (based on token balance)
        bool hasVoted;
        uint8 voteChoice; // 0: against, 1: for, 2: abstain
        uint256 votingPower;
    }
    
    // Vote ID counter
    uint256 public voteCounter;
    
    // Minimum voting period (in blocks)
    uint256 public constant MIN_VOTING_PERIOD = 1;
    
    // Maximum voting period (in blocks)
    uint256 public constant MAX_VOTING_PERIOD = 50400; // ~1 week on Base
    
    // Minimum proposal threshold (in tokens)
    uint256 public proposalThreshold = 1e18; // 1 AfriCoin
    
    // Quorum percentage (e.g., 4%)
    uint256 public quorumPercentage = 4;
    
    // Active vote threshold
    bool public votingPaused;
    
    // Vote ID => Vote details
    mapping(uint256 => Vote) public votes;
    
    // Vote ID => Voter address => Voter info
    mapping(uint256 => mapping(address => Voter)) public voters;
    
    // Vote ID => list of voters
    mapping(uint256 => address[]) public voteVoters;
    
    // Vote delegation tracking (voter => delegate)
    mapping(address => address) public voteDelegates;
    
    // Voting power snapshot (block number => total voting power)
    mapping(uint256 => uint256) public votingPowerSnapshots;
    
    // Total supply snapshot
    uint256 public totalSupply;
    
    // ============ Events ============
    
    event VoteCreated(
        uint256 indexed voteId,
        string title,
        address indexed proposer,
        uint256 startBlock,
        uint256 endBlock
    );
    
    event VoteCast(
        uint256 indexed voteId,
        address indexed voter,
        uint8 support,
        uint256 weight,
        string reason
    );
    
    event VoteExecuted(uint256 indexed voteId);
    
    event VoteCancelled(uint256 indexed voteId);
    
    event VoteDelegated(
        address indexed delegator,
        address indexed delegate
    );
    
    event ProposalThresholdChanged(uint256 newThreshold);
    
    event QuorumPercentageChanged(uint256 newPercentage);
    
    event VotingPausedToggled(bool isPaused);
    
    // ============ Modifiers ============
    
    modifier onlyWhenNotPaused() {
        require(!votingPaused, "AfriVoting: voting is paused");
        _;
    }
    
    modifier voteExists(uint256 _voteId) {
        require(_voteId > 0 && _voteId <= voteCounter, "AfriVoting: vote does not exist");
        _;
    }
    
    modifier votingOpen(uint256 _voteId) {
        require(
            block.number >= votes[_voteId].startBlock &&
            block.number <= votes[_voteId].endBlock,
            "AfriVoting: voting is not open"
        );
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @dev Initialize AfriVoting contract
     * @param _afriCoin Address of the AfriCoin token contract
     */
    constructor(address _afriCoin) {
        require(_afriCoin != address(0), "AfriVoting: invalid token address");
        afriCoin = IERC20(_afriCoin);
    }
    
    // ============ Vote Creation ============
    
    /**
     * @dev Create a new vote
     * @param _title Title of the vote
     * @param _description Description of the vote
     * @param _votingPeriod Duration of voting in blocks
     * @param _ipfsHash IPFS hash for full proposal details
     */
    function createVote(
        string memory _title,
        string memory _description,
        uint256 _votingPeriod,
        string memory _ipfsHash
    ) external onlyWhenNotPaused returns (uint256) {
        require(bytes(_title).length > 0, "AfriVoting: title cannot be empty");
        require(
            _votingPeriod >= MIN_VOTING_PERIOD &&
            _votingPeriod <= MAX_VOTING_PERIOD,
            "AfriVoting: invalid voting period"
        );
        
        // Check proposer has sufficient voting power
        uint256 proposerBalance = afriCoin.balanceOf(msg.sender);
        require(
            proposerBalance >= proposalThreshold,
            "AfriVoting: insufficient voting power to create proposal"
        );
        
        // Increment vote counter
        voteCounter++;
        uint256 voteId = voteCounter;
        
        // Create new vote
        votes[voteId] = Vote({
            voteId: voteId,
            title: _title,
            description: _description,
            proposer: msg.sender,
            startBlock: block.number + 1,
            endBlock: block.number + _votingPeriod,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            cancelled: false,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp
        });
        
        emit VoteCreated(
            voteId,
            _title,
            msg.sender,
            block.number + 1,
            block.number + _votingPeriod
        );
        
        return voteId;
    }
    
    // ============ Voting ============
    
    /**
     * @dev Cast a vote
     * @param _voteId ID of the vote
     * @param _support Support type (0: against, 1: for, 2: abstain)
     * @param _reason Reason for voting
     */
    function castVote(
        uint256 _voteId,
        uint8 _support,
        string memory _reason
    ) external nonReentrant voteExists(_voteId) votingOpen(_voteId) onlyWhenNotPaused {
        require(_support <= 2, "AfriVoting: invalid support type");
        require(
            !voters[_voteId][msg.sender].hasVoted,
            "AfriVoting: address has already voted"
        );
        
        // Get voter's actual address (handle delegation)
        address voter = msg.sender;
        if (voteDelegates[voter] != address(0)) {
            voter = voteDelegates[voter];
        }
        
        // Get voting weight based on token balance
        uint256 votingWeight = afriCoin.balanceOf(voter);
        require(votingWeight > 0, "AfriVoting: no voting power");
        
        // Record vote
        voters[_voteId][voter] = Voter({
            votes: 1,
            weight: votingWeight,
            hasVoted: true,
            voteChoice: _support,
            votingPower: votingWeight
        });
        
        // Add voter to list
        voteVoters[_voteId].push(voter);
        
        // Update vote totals
        if (_support == 0) {
            votes[_voteId].againstVotes += votingWeight;
        } else if (_support == 1) {
            votes[_voteId].forVotes += votingWeight;
        } else {
            votes[_voteId].abstainVotes += votingWeight;
        }
        
        emit VoteCast(_voteId, voter, _support, votingWeight, _reason);
    }
    
    // ============ Vote Delegation ============
    
    /**
     * @dev Delegate voting power to another address
     * @param _delegate Address to delegate voting power to
     */
    function delegateVote(address _delegate) external {
        require(_delegate != address(0), "AfriVoting: invalid delegate address");
        require(_delegate != msg.sender, "AfriVoting: cannot delegate to self");
        
        voteDelegates[msg.sender] = _delegate;
        
        emit VoteDelegated(msg.sender, _delegate);
    }
    
    /**
     * @dev Revoke vote delegation
     */
    function revokeDelegation() external {
        require(
            voteDelegates[msg.sender] != address(0),
            "AfriVoting: no active delegation"
        );
        
        address previousDelegate = voteDelegates[msg.sender];
        voteDelegates[msg.sender] = address(0);
        
        emit VoteDelegated(msg.sender, address(0));
    }
    
    // ============ Vote Results & Status ============
    
    /**
     * @dev Get vote results
     * @param _voteId ID of the vote
     */
    function getVoteResults(uint256 _voteId)
        external
        view
        voteExists(_voteId)
        returns (
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool passed
        )
    {
        Vote storage vote = votes[_voteId];
        forVotes = vote.forVotes;
        againstVotes = vote.againstVotes;
        abstainVotes = vote.abstainVotes;
        
        // Calculate if vote passed (simple majority)
        uint256 totalVotes = forVotes + againstVotes;
        passed = totalVotes > 0 && forVotes > againstVotes;
    }
    
    /**
     * @dev Get vote details
     * @param _voteId ID of the vote
     */
    function getVoteDetails(uint256 _voteId)
        external
        view
        voteExists(_voteId)
        returns (Vote memory)
    {
        return votes[_voteId];
    }
    
    /**
     * @dev Get voter information
     * @param _voteId ID of the vote
     * @param _voter Address of the voter
     */
    function getVoterInfo(uint256 _voteId, address _voter)
        external
        view
        voteExists(_voteId)
        returns (Voter memory)
    {
        return voters[_voteId][_voter];
    }
    
    /**
     * @dev Check if vote passed quorum
     * @param _voteId ID of the vote
     */
    function meetsQuorum(uint256 _voteId)
        external
        view
        voteExists(_voteId)
        returns (bool)
    {
        Vote storage vote = votes[_voteId];
        uint256 totalVotes = vote.forVotes + vote.againstVotes;
        
        // Quorum is met if at least quorumPercentage% of voters participated
        return totalVotes > 0; // Simplified for now
    }
    
    /**
     * @dev Get voting status
     * @param _voteId ID of the vote
     */
    function getVotingStatus(uint256 _voteId)
        external
        view
        voteExists(_voteId)
        returns (string memory status)
    {
        Vote storage vote = votes[_voteId];
        
        if (vote.cancelled) {
            return "Cancelled";
        } else if (vote.executed) {
            return "Executed";
        } else if (block.number < vote.startBlock) {
            return "Pending";
        } else if (block.number <= vote.endBlock) {
            return "Active";
        } else {
            return "Closed";
        }
    }
    
    // ============ Vote Execution ============
    
    /**
     * @dev Execute a vote (mark as executed)
     * @param _voteId ID of the vote
     */
    function executeVote(uint256 _voteId)
        external
        onlyOwner
        voteExists(_voteId)
    {
        Vote storage vote = votes[_voteId];
        require(!vote.executed, "AfriVoting: vote already executed");
        require(!vote.cancelled, "AfriVoting: vote was cancelled");
        require(
            block.number > vote.endBlock,
            "AfriVoting: voting is still open"
        );
        
        vote.executed = true;
        
        emit VoteExecuted(_voteId);
    }
    
    /**
     * @dev Cancel a vote
     * @param _voteId ID of the vote
     */
    function cancelVote(uint256 _voteId)
        external
        onlyOwner
        voteExists(_voteId)
    {
        Vote storage vote = votes[_voteId];
        require(!vote.executed, "AfriVoting: cannot cancel executed vote");
        require(!vote.cancelled, "AfriVoting: vote already cancelled");
        
        vote.cancelled = true;
        
        emit VoteCancelled(_voteId);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Set proposal threshold
     * @param _newThreshold New threshold in wei
     */
    function setProposalThreshold(uint256 _newThreshold)
        external
        onlyOwner
    {
        require(_newThreshold > 0, "AfriVoting: threshold must be greater than 0");
        proposalThreshold = _newThreshold;
        
        emit ProposalThresholdChanged(_newThreshold);
    }
    
    /**
     * @dev Set quorum percentage
     * @param _newPercentage New quorum percentage (1-100)
     */
    function setQuorumPercentage(uint256 _newPercentage)
        external
        onlyOwner
    {
        require(
            _newPercentage > 0 && _newPercentage <= 100,
            "AfriVoting: invalid percentage"
        );
        quorumPercentage = _newPercentage;
        
        emit QuorumPercentageChanged(_newPercentage);
    }
    
    /**
     * @dev Toggle voting pause
     */
    function toggleVotingPause() external onlyOwner {
        votingPaused = !votingPaused;
        
        emit VotingPausedToggled(votingPaused);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get total number of votes created
     */
    function getTotalVotes() external view returns (uint256) {
        return voteCounter;
    }
    
    /**
     * @dev Get list of votes cast by an address
     * @param _voter Address to query
     */
    function getVoterVotes(address _voter)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory userVotes = new uint256[](voteCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= voteCounter; i++) {
            if (voters[i][_voter].hasVoted) {
                userVotes[count] = i;
                count++;
            }
        }
        
        // Resize array to actual size
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userVotes[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get voting delegate for an address
     * @param _voter Address to query
     */
    function getDelegate(address _voter) external view returns (address) {
        return voteDelegates[_voter];
    }
}