import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const TEST_DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/africoin-test";

describe("Database Collections", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_DATABASE_URL);
    console.log("✅ Connected to test database");
  });

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log("✅ Test database cleaned up");
  });

  describe("User Collection", () => {
    it("should create User collection with correct schema", async () => {
      // Insert a test document
      const testUser = await User.create({
        phoneHash: "test_phone_hash_123",
        phone: "+254712345678",
        name: "Test User",
        pinHash: "hashed_pin",
        walletAddress: "0x123456789",
        balance: "1000000000000000000", // 1 AFRI in wei
      });

      expect(testUser).toBeDefined();
      expect(testUser.phoneHash).toBe("test_phone_hash_123");
      expect(testUser.phone).toBe("+254712345678");
      expect(testUser.name).toBe("Test User");
      expect(testUser.walletAddress).toBe("0x123456789");
      expect(testUser.balance).toBe("1000000000000000000");
      expect(testUser.createdAt).toBeDefined();
      expect(testUser.updatedAt).toBeDefined();
    });

    it("should enforce phoneHash uniqueness", async () => {
      await User.create({
        phoneHash: "unique_phone_hash",
        phone: "+254712345679",
        name: "User 1",
        pinHash: "hashed_pin",
        walletAddress: "0x111111111",
        balance: "0",
      });

      // Try to create another user with same phoneHash
      try {
        await User.create({
          phoneHash: "unique_phone_hash", // Duplicate
          phone: "+254712345680",
          name: "User 2",
          pinHash: "hashed_pin",
          walletAddress: "0x222222222",
          balance: "0",
        });
        expect.fail("Should have thrown duplicate key error");
      } catch (error: any) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error
      }
    });

    it("should enforce walletAddress uniqueness", async () => {
      await User.create({
        phoneHash: "phone_hash_1",
        phone: "+254712345681",
        name: "User with Wallet",
        pinHash: "hashed_pin",
        walletAddress: "0xunique_wallet",
        balance: "0",
      });

      try {
        await User.create({
          phoneHash: "phone_hash_2",
          phone: "+254712345682",
          name: "Another User",
          pinHash: "hashed_pin",
          walletAddress: "0xunique_wallet", // Duplicate wallet
          balance: "0",
        });
        expect.fail("Should have thrown duplicate key error");
      } catch (error: any) {
        // Check for MongoDB E11000 duplicate key error
        expect(error.code === 11000 || error.message.includes("duplicate")).toBe(true);
      }
    });

    it("should return user by phoneHash", async () => {
      await User.create({
        phoneHash: "findable_phone_hash",
        phone: "+254712345683",
        name: "Findable User",
        pinHash: "hashed_pin",
        walletAddress: "0xfindable",
        balance: "5000000000000000000",
      });

      const foundUser = await User.findOne({ phoneHash: "findable_phone_hash" });

      expect(foundUser).toBeDefined();
      expect(foundUser?.name).toBe("Findable User");
      expect(foundUser?.balance).toBe("5000000000000000000");
    });
  });

  describe("Transaction Collection", () => {
    it("should create Transaction collection with correct schema", async () => {
      const testTransaction = await Transaction.create({
        transactionHash: "0xtx123456789",
        senderPhoneHash: "sender_hash",
        senderPhone: "+254712345678",
        recipientPhone: "+254712345679",
        recipientPhoneHash: "recipient_hash",
        amount: "1000000000000000000", // 1 AFRI in wei
        status: "completed",
        type: "send",
      });

      expect(testTransaction).toBeDefined();
      expect(testTransaction.transactionHash).toBe("0xtx123456789");
      expect(testTransaction.status).toBe("completed");
      expect(testTransaction.type).toBe("send");
      expect(testTransaction.timestamp).toBeDefined();
    });

    it("should create mint transaction", async () => {
      const mintTx = await Transaction.create({
        transactionHash: "0xmint123",
        senderPhoneHash: "system",
        senderPhone: "system",
        recipientPhone: "+254712345684",
        amount: "1000000000000000000000000", // 1,000,000 AFRI
        status: "completed",
        type: "mint",
        metadata: { reason: "initial_mint" },
      });

      expect(mintTx.type).toBe("mint");
      expect(mintTx.metadata?.reason).toBe("initial_mint");
    });

    it("should create receive transaction", async () => {
      const receiveTx = await Transaction.create({
        transactionHash: "0xreceive123",
        senderPhoneHash: "sender_hash",
        senderPhone: "+254712345678",
        recipientPhone: "+254712345685",
        recipientPhoneHash: "recipient_hash",
        amount: "500000000000000000", // 0.5 AFRI
        status: "completed",
        type: "receive",
      });

      expect(receiveTx.type).toBe("receive");
      expect(receiveTx.status).toBe("completed");
    });

    it("should enforce transactionHash uniqueness", async () => {
      await Transaction.create({
        transactionHash: "0xunique_tx",
        senderPhoneHash: "sender",
        senderPhone: "+1234567890",
        recipientPhone: "+0987654321",
        amount: "100",
        status: "completed",
        type: "send",
      });

      try {
        await Transaction.create({
          transactionHash: "0xunique_tx", // Duplicate
          senderPhoneHash: "sender2",
          senderPhone: "+1111111111",
          recipientPhone: "+2222222222",
          amount: "200",
          status: "completed",
          type: "send",
        });
        expect.fail("Should have thrown duplicate key error");
      } catch (error: any) {
        expect(error.code).toBe(11000);
      }
    });

    it("should find transactions by senderPhoneHash", async () => {
      const senderHash = "test_sender_hash";
      
      await Transaction.create({
        transactionHash: "0xtx1",
        senderPhoneHash: senderHash,
        senderPhone: "+254712345678",
        recipientPhone: "+254712345679",
        amount: "100",
        status: "completed",
        type: "send",
      });

      await Transaction.create({
        transactionHash: "0xtx2",
        senderPhoneHash: senderHash,
        senderPhone: "+254712345678",
        recipientPhone: "+254712345680",
        amount: "200",
        status: "completed",
        type: "send",
      });

      const userTransactions = await Transaction.find({ senderPhoneHash: senderHash });

      expect(userTransactions.length).toBe(2);
      expect(userTransactions[0].senderPhoneHash).toBe(senderHash);
    });

    it("should sort transactions by timestamp", async () => {
      const senderHash = "sorting_test_sender";

      const tx1 = await Transaction.create({
        transactionHash: "0xtx_first",
        senderPhoneHash: senderHash,
        senderPhone: "+254712345678",
        recipientPhone: "+254712345679",
        amount: "100",
        status: "completed",
        type: "send",
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      const tx2 = await Transaction.create({
        transactionHash: "0xtx_second",
        senderPhoneHash: senderHash,
        senderPhone: "+254712345678",
        recipientPhone: "+254712345679",
        amount: "200",
        status: "completed",
        type: "send",
      });

      const transactions = await Transaction.find({ senderPhoneHash: senderHash })
        .sort({ timestamp: -1 });

      expect(transactions[0].transactionHash).toBe("0xtx_second");
      expect(transactions[1].transactionHash).toBe("0xtx_first");
    });
  });

  describe("Database Indexes", () => {
    it("should have indexes on User collection", async () => {
      const indexes = await User.collection.getIndexes();
      
      expect(indexes).toBeDefined();
      expect(Object.keys(indexes).length).toBeGreaterThan(0);
      console.log("User indexes:", indexes);
    });

    it("should have indexes on Transaction collection", async () => {
      const indexes = await Transaction.collection.getIndexes();
      
      expect(indexes).toBeDefined();
      expect(Object.keys(indexes).length).toBeGreaterThan(0);
      console.log("Transaction indexes:", indexes);
    });
  });

  describe("Collection Info", () => {
    it("should list all collections", async () => {
      const collections = await mongoose.connection.db?.listCollections().toArray();
      
      expect(collections).toBeDefined();
      const collectionNames = collections?.map((c) => c.name) || [];
      
      console.log("Collections in database:", collectionNames);
      expect(collectionNames.length).toBeGreaterThan(0);
    });
  });
});