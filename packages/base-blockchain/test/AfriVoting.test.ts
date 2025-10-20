import { expect } from "chai";
import hre from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AfriCoin, AfriVoting } from "../typechain-types";

const { ethers, network } = hre;

describe("AfriVoting", function () {
  let afriCoin: AfriCoin;
  let afriVoting: AfriVoting;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy AfriCoin
    const AfriCoinFactory = await ethers.getContractFactory("AfriCoin");
    afriCoin = (await AfriCoinFactory.deploy()) as unknown as AfriCoin;
    await afriCoin.waitForDeployment();

    // Mint tokens
    await afriCoin.mint(owner.address, ethers.parseEther("1000"));
    await afriCoin.mint(addr1.address, ethers.parseEther("1000"));
    await afriCoin.mint(addr2.address, ethers.parseEther("100"));

    // Deploy AfriVoting
    const AfriVotingFactory = await ethers.getContractFactory("AfriVoting");
    afriVoting = (await AfriVotingFactory.deploy(
      await afriCoin.getAddress()
    )) as unknown as AfriVoting;
    await afriVoting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with correct token address", async function () {
      expect(await afriVoting.afriCoin()).to.equal(await afriCoin.getAddress());
    });

    it("Should have vote counter at 0", async function () {
      expect(await afriVoting.voteCounter()).to.equal(0);
    });

    it("Should have default proposal threshold", async function () {
      expect(await afriVoting.proposalThreshold()).to.equal(
        ethers.parseEther("1")
      );
    });
  });

  describe("Vote Creation", function () {
    it("Should create a new vote", async function () {
      const voteTx = await afriVoting.createVote(
        "Test Proposal",
        "This is a test proposal",
        100,
        "QmTest"
      );

      await expect(voteTx).to.emit(afriVoting, "VoteCreated");
      expect(await afriVoting.voteCounter()).to.equal(1);
    });

    it("Should reject vote creation from insufficient balance", async function () {
      await expect(
        afriVoting.connect(addr2).createVote(
          "Test Proposal",
          "This is a test proposal",
          100,
          "QmTest"
        )
      ).to.be.reverted;
    });

    it("Should reject invalid voting period", async function () {
      await expect(
        afriVoting.createVote(
          "Test Proposal",
          "This is a test proposal",
          0, // Invalid period
          "QmTest"
        )
      ).to.be.reverted;
    });
  });

  describe("Voting", function () {
    let voteId: number;

    beforeEach(async function () {
      const voteTx = await afriVoting.createVote(
        "Test Proposal",
        "This is a test proposal",
        100,
        "QmTest"
      );
      await voteTx.wait();
      voteId = 1;
    });

    it("Should allow address to vote", async function () {
      const voteTx = await afriVoting.castVote(voteId, 1, "I support");

      await expect(voteTx).to.emit(afriVoting, "VoteCast");
    });

    it("Should prevent double voting", async function () {
      await afriVoting.castVote(voteId, 1, "I support");

      await expect(
        afriVoting.castVote(voteId, 1, "I support again")
      ).to.be.revertedWith("AfriVoting: address has already voted");
    });

    it("Should track vote results", async function () {
      await afriVoting.connect(addr1).castVote(voteId, 1, "For");
      await afriVoting.connect(addr2).castVote(voteId, 0, "Against");

      const results = await afriVoting.getVoteResults(voteId);
      expect(results.forVotes).to.equal(ethers.parseEther("1000"));
      expect(results.againstVotes).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Vote Delegation", function () {
    it("Should allow vote delegation", async function () {
      const delegateTx = await afriVoting
        .connect(addr1)
        .delegateVote(owner.address);

      await expect(delegateTx).to.emit(afriVoting, "VoteDelegated");
      expect(await afriVoting.getDelegate(addr1.address)).to.equal(
        owner.address
      );
    });

    it("Should revoke delegation", async function () {
      await afriVoting
        .connect(addr1)
        .delegateVote(owner.address);

      const revokeTx = await afriVoting
        .connect(addr1)
        .revokeDelegation();

      await expect(revokeTx).to.emit(afriVoting, "VoteDelegated");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set proposal threshold", async function () {
      const newThreshold = ethers.parseEther("10");
      const setTx = await afriVoting.setProposalThreshold(newThreshold);

      await expect(setTx).to.emit(afriVoting, "ProposalThresholdChanged");
      expect(await afriVoting.proposalThreshold()).to.equal(newThreshold);
    });

    it("Should allow owner to set quorum percentage", async function () {
      const setTx = await afriVoting.setQuorumPercentage(10);

      await expect(setTx).to.emit(afriVoting, "QuorumPercentageChanged");
      expect(await afriVoting.quorumPercentage()).to.equal(10);
    });

    it("Should allow owner to pause voting", async function () {
      const pauseTx = await afriVoting.toggleVotingPause();

      await expect(pauseTx).to.emit(afriVoting, "VotingPausedToggled");
      expect(await afriVoting.votingPaused()).to.be.true;
    });
  });
});