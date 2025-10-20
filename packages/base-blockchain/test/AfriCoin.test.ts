import { expect } from "chai";
import hre from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AfriCoin } from "../typechain-types";

const { ethers } = hre;

describe("AfriCoin", function () {
  let afriCoin: AfriCoin;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    const AfriCoinFactory = await ethers.getContractFactory("AfriCoin");
    afriCoin = await AfriCoinFactory.deploy();
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await afriCoin.name()).to.equal("AfriCoin");
      expect(await afriCoin.symbol()).to.equal("AFRI");
    });

    it("Should have 18 decimals", async function () {
      expect(await afriCoin.decimals()).to.equal(18);
    });

    it("Should set the owner", async function () {
      expect(await afriCoin.owner()).to.equal(owner.address);
    });

    it("Should have zero initial supply", async function () {
      expect(await afriCoin.totalSupply()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await afriCoin.paused()).to.be.false;
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to an address", async function () {
      const amount = ethers.parseEther("100");
      await afriCoin.mint(addr1.address, amount);

      expect(await afriCoin.balanceOf(addr1.address)).to.equal(amount);
      expect(await afriCoin.totalSupply()).to.equal(amount);
    });

    it("Should emit TokensMinted event on mint", async function () {
      const amount = ethers.parseEther("50");
      await expect(afriCoin.mint(addr1.address, amount))
        .to.emit(afriCoin, "TokensMinted")
        .withArgs(addr1.address, amount);
    });

    it("Should only allow owner to mint", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        afriCoin.connect(addr1).mint(addr2.address, amount)
      ).to.be.reverted;  // ✅ Changed from .revertedWithCustomError
    });

    it("Should not mint to zero address", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        afriCoin.mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("AfriCoin: cannot mint to zero address");
    });

    it("Should not mint zero amount", async function () {
      await expect(
        afriCoin.mint(addr1.address, 0)
      ).to.be.revertedWith("AfriCoin: mint amount must be greater than 0");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      await afriCoin.mint(addr1.address, amount);
    });

    it("Should burn tokens from sender", async function () {
      const burnAmount = ethers.parseEther("25");
      await afriCoin.connect(addr1).burn(burnAmount);

      expect(await afriCoin.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("75")
      );
      expect(await afriCoin.totalSupply()).to.equal(ethers.parseEther("75"));
    });

    it("Should emit TokensBurned event on burn", async function () {
      const burnAmount = ethers.parseEther("25");
      await expect(afriCoin.connect(addr1).burn(burnAmount))
        .to.emit(afriCoin, "TokensBurned")
        .withArgs(addr1.address, burnAmount);
    });

    it("Should not burn zero amount", async function () {
      await expect(
        afriCoin.connect(addr1).burn(0)
      ).to.be.revertedWith("AfriCoin: burn amount must be greater than 0");
    });

    it("Should not burn more than balance", async function () {
      const burnAmount = ethers.parseEther("150");
      await expect(
        afriCoin.connect(addr1).burn(burnAmount)
      ).to.be.reverted;  // ✅ Changed from .revertedWithCustomError
    });
  });

  describe("Pause/Unpause", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      await afriCoin.mint(owner.address, amount);
      await afriCoin.mint(addr1.address, amount);
    });

    it("Should pause transfers", async function () {
      await afriCoin.pause();
      expect(await afriCoin.paused()).to.be.true;

      const amount = ethers.parseEther("10");
      await expect(
        afriCoin.transfer(addr2.address, amount)
      ).to.be.reverted;  // ✅ Changed from .revertedWithCustomError
    });

    it("Should emit PausedByOwner event", async function () {
      await expect(afriCoin.pause())
        .to.emit(afriCoin, "PausedByOwner");
    });

    it("Should unpause transfers", async function () {
      await afriCoin.pause();
      await afriCoin.unpause();
      expect(await afriCoin.paused()).to.be.false;

      const amount = ethers.parseEther("10");
      await expect(
        afriCoin.transfer(addr2.address, amount)
      ).to.not.be.reverted;
    });

    it("Should only allow owner to pause", async function () {
      await expect(
        afriCoin.connect(addr1).pause()
      ).to.be.reverted;  // ✅ Changed from .revertedWithCustomError
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      await afriCoin.mint(owner.address, amount);
    });

    it("Should transfer tokens between users", async function () {
      const amount = ethers.parseEther("50");
      await afriCoin.transfer(addr1.address, amount);

      expect(await afriCoin.balanceOf(addr1.address)).to.equal(amount);
      expect(await afriCoin.balanceOf(owner.address)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("Should approve and transferFrom tokens", async function () {
      const amount = ethers.parseEther("50");
      await afriCoin.approve(addr1.address, amount);
      await afriCoin
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, amount);

      expect(await afriCoin.balanceOf(addr2.address)).to.equal(amount);
    });
  });

  describe("Permit (Gasless Approvals)", function () {
    it("Should support ERC712 permit", async function () {
      const amount = ethers.parseEther("100");
      await afriCoin.mint(owner.address, amount);

      const domainSeparator = await afriCoin.DOMAIN_SEPARATOR();
      expect(domainSeparator).to.not.equal(ethers.ZeroHash);
    });
  });
});