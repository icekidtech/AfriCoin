import { expect } from "chai";
import hre from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AfriCoin, AfriDAO } from "../typechain-types";

const { ethers, network } = hre;

describe("AfriDAO", function () {
  let afriCoin: AfriCoin;
  let timelock: any;
  let afriDAO: AfriDAO;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const MIN_DELAY = 3600;
  const VOTING_DELAY = 1;
  const VOTING_PERIOD = 50400;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const AfriCoinFactory = await ethers.getContractFactory("AfriCoin");
    afriCoin = (await AfriCoinFactory.deploy()) as unknown as AfriCoin;
    await afriCoin.waitForDeployment();

    const mintAmount = ethers.parseEther("1000");
    await afriCoin.mint(owner.address, mintAmount);
    await afriCoin.mint(addr1.address, mintAmount);

    // ✅ ADD BACK: Delegate voting power (ERC20Votes is now back in AfriCoin)
    await (afriCoin as any).delegate(owner.address);
    await (afriCoin as any).connect(addr1).delegate(addr1.address);

    // Deploy TimelockController
    const TimelockFactory = await ethers.getContractFactory("TimelockController");
    timelock = await TimelockFactory.deploy(
      MIN_DELAY,
      [owner.address],
      [owner.address],
      owner.address
    );
    await timelock.waitForDeployment();

    // ✅ ADD: Deploy AfriVoting first
    const AfriVotingFactory = await ethers.getContractFactory("AfriVoting");
    const afriVotingInstance = await AfriVotingFactory.deploy(await afriCoin.getAddress());
    await afriVotingInstance.waitForDeployment();

    // ✅ FIX: Deploy AfriDAO with 3 arguments (token, timelock, afriVoting)
    const AfriDAOFactory = await ethers.getContractFactory("AfriDAO");
    afriDAO = (await AfriDAOFactory.deploy(
      await afriCoin.getAddress(),
      await timelock.getAddress(),
      await afriVotingInstance.getAddress()  // Add the AfriVoting address
    ) as unknown) as AfriDAO;
    await afriDAO.waitForDeployment();

    const PROPOSER_ROLE_HASH = ethers.id("PROPOSER_ROLE");
    const EXECUTOR_ROLE_HASH = ethers.id("EXECUTOR_ROLE");
    await timelock.grantRole(PROPOSER_ROLE_HASH, await afriDAO.getAddress());
    await timelock.grantRole(EXECUTOR_ROLE_HASH, ethers.ZeroAddress);
  });

  describe("Deployment", function () {
    it("Should have correct name", async function () {
      expect(await afriDAO.name()).to.equal("AfriDAO");
    });

    it("Should have correct voting parameters", async function () {
      expect(await afriDAO.votingDelay()).to.equal(VOTING_DELAY);
      expect(await afriDAO.votingPeriod()).to.equal(VOTING_PERIOD);
      expect(await afriDAO.quorum(0)).to.be.greaterThan(0);
    });

    it("Should have correct proposal threshold", async function () {
      const threshold = await afriDAO.proposalThreshold();
      expect(threshold).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Proposing", function () {
    it("Should create a proposal", async function () {
      const targets = [await afriCoin.getAddress()];
      const values = [0];
      const calldatas = [
        afriCoin.interface.encodeFunctionData("unpause"),
      ];
      const description = "Pause AfriCoin in emergency";

      const proposeTx = await afriDAO.propose(
        targets,
        values,
        calldatas,
        description
      );
      const proposeReceipt = await proposeTx.wait();

      const proposalCreatedEvent = proposeReceipt?.logs
        .map((log: any) => {
          try {
            return afriDAO.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === "ProposalCreated");

      expect(proposalCreatedEvent).to.not.be.undefined;
    });

    it("Should reject proposals from non-token holders", async function () {
      const targets = [await afriCoin.getAddress()];
      const values = [0];
      const calldatas = [
        afriCoin.interface.encodeFunctionData("unpause"),
      ];
      const description = "Test proposal";

      await expect(
        afriDAO
          .connect(addr2)
          .propose(targets, values, calldatas, description)
      ).to.be.reverted;
    });
  });

  describe("Voting", function () {
    let proposalId: any;

    beforeEach(async function () {
      const targets = [await afriCoin.getAddress()];
      const values = [0];
      const calldatas = [
        afriCoin.interface.encodeFunctionData("unpause"),
      ];
      const description = "Pause AfriCoin";

      const proposeTx = await afriDAO.propose(
        targets,
        values,
        calldatas,
        description
      );
      const proposeReceipt = await proposeTx.wait();

      const proposalCreatedEvent = proposeReceipt?.logs
        .map((log: any) => {
          try {
            return afriDAO.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === "ProposalCreated");

      proposalId = proposalCreatedEvent?.args[0];

      await network.provider.send("hardhat_mine", ["0x2"]);
    });

    it("Should allow voting on active proposals", async function () {
      const voteReason = "I support this proposal";
      const supportType = 1;

      await expect(
        afriDAO.connect(addr1).castVoteWithReason(
          proposalId,
          supportType,
          voteReason
        )
      ).to.not.be.reverted;
    });

    it("Should track vote counts", async function () {
      const supportType = 1;
      await afriDAO.connect(addr1).castVote(proposalId, supportType);

      const proposalVotes = await afriDAO.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.be.greaterThan(0);
    });
  });

  describe("State Transitions", function () {
    let proposalId: any;

    beforeEach(async function () {
      const targets = [await afriCoin.getAddress()];
      const values = [0];
      const calldatas = [
        afriCoin.interface.encodeFunctionData("unpause"),
      ];
      const description = "Test proposal";

      const proposeTx = await afriDAO.propose(
        targets,
        values,
        calldatas,
        description
      );
      const proposeReceipt = await proposeTx.wait();

      const proposalCreatedEvent = proposeReceipt?.logs
        .map((log: any) => {
          try {
            return afriDAO.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === "ProposalCreated");

      proposalId = proposalCreatedEvent?.args[0];
    });

    it("Should start in Pending state", async function () {
      const state = await afriDAO.state(proposalId);
      expect(state).to.equal(0);
    });

    it("Should move to Active after voting delay", async function () {
      await network.provider.send("hardhat_mine", ["0x2"]);
      const state = await afriDAO.state(proposalId);
      expect(state).to.equal(1);
    });
  });
});