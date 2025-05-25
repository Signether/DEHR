import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("DecentralizedHashRegistry", function () {
    async function deployRegistryFixture() {
        const [owner, otherAccount] = await ethers.getSigners();

        const Registry = await ethers.getContractFactory("DecentralizedHashRegistry");
        const registry = await Registry.deploy();

        const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample document"));

        return { registry, owner, otherAccount, sampleHash };
    }

    describe("Wallet Registration", function () {
        it("Should register a new wallet with name", async function () {
            const { registry, owner } = await loadFixture(deployRegistryFixture);
            const registrantName = "John Doe";

            expect(await registry.isWalletRegistered(owner.address)).to.equal(false);

            const tx = await registry.registerWallet(registrantName);

            expect(await registry.isWalletRegistered(owner.address)).to.equal(true);

            await expect(tx)
                .to.emit(registry, "RegistrantRegistered")
                .withArgs(owner.address, registrantName, anyValue);
        });

        it("Should reject empty registrant name", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);

            await expect(registry.registerWallet(""))
                .to.be.revertedWith("Invalid registrant name");
        });

        it("Should reject duplicate wallet registration", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);
            const registrantName = "John Doe";

            await registry.registerWallet(registrantName);

            await expect(registry.registerWallet("Jane Doe"))
                .to.be.revertedWith("Wallet already registered");
        });

        it("Should return correct registrant details", async function () {
            const { registry, owner } = await loadFixture(deployRegistryFixture);
            const registrantName = "John Doe";

            const tx = await registry.registerWallet(registrantName);
            const receipt = await tx.wait();

            if (!receipt) {
                throw new Error("Transaction failed");
            }

            const blockAfter = await ethers.provider.getBlock(receipt.blockNumber);
            if (!blockAfter) {
                throw new Error("Block information not available");
            }
            const timestamp = blockAfter.timestamp;

            const registrant = await registry.getRegistrant(owner.address);
            expect(registrant[0]).to.equal(registrantName);
            expect(registrant[1]).to.equal(timestamp);
            expect(registrant[2]).to.equal(true);
        });

        it("Should fail when querying unregistered wallet", async function () {
            const { registry, otherAccount } = await loadFixture(deployRegistryFixture);

            await expect(registry.getRegistrant(otherAccount.address))
                .to.be.revertedWith("Registrant not found");
        });
    });

    describe("Hash Registration", function () {
        it("Should register a new hash for registered wallet", async function () {
            const { registry, owner, sampleHash } = await loadFixture(deployRegistryFixture);
            const registrantName = "John Doe";

            // First register the wallet
            await registry.registerWallet(registrantName);

            expect(await registry.isRegistered(sampleHash)).to.equal(false);

            const tx = await registry.registerHash(sampleHash);

            expect(await registry.isRegistered(sampleHash)).to.equal(true);

            await expect(tx)
                .to.emit(registry, "HashRegistered")
                .withArgs(sampleHash, owner.address, registrantName, anyValue);
        });

        it("Should reject hash registration from unregistered wallet", async function () {
            const { registry, sampleHash } = await loadFixture(deployRegistryFixture);

            await expect(registry.registerHash(sampleHash))
                .to.be.revertedWith("Wallet not registered");
        });

        it("Should reject registering the zero hash", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);
            const zeroHash = ethers.ZeroHash;

            // Register wallet first
            await registry.registerWallet("John Doe");

            await expect(registry.registerHash(zeroHash))
                .to.be.revertedWith("Invalid hash");
        });

        it("Should reject registering already registered hash", async function () {
            const { registry, sampleHash } = await loadFixture(deployRegistryFixture);

            // Register wallet first
            await registry.registerWallet("John Doe");

            await registry.registerHash(sampleHash);

            await expect(registry.registerHash(sampleHash))
                .to.be.revertedWith("Hash already registered");
        });
    });

    describe("Registration Queries", function () {
        it("Should return correct registration details", async function () {
            const { registry, owner, sampleHash } = await loadFixture(deployRegistryFixture);
            const registrantName = "John Doe";

            // Register wallet first
            await registry.registerWallet(registrantName);

            const tx = await registry.registerHash(sampleHash);
            const receipt = await tx.wait();

            if (!receipt) {
                throw new Error("Transaction failed");
            }

            const blockAfter = await ethers.provider.getBlock(receipt.blockNumber);
            if (!blockAfter) {
                throw new Error("Block information not available");
            }
            const timestamp = blockAfter.timestamp;

            const registration = await registry.getRegistration(sampleHash);
            expect(registration[0]).to.equal(owner.address);
            expect(registration[1]).to.equal(registrantName);
            expect(registration[2]).to.equal(timestamp);
        });

        it("Should fail when querying unregistered hash", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);
            const unregisteredHash = ethers.keccak256(ethers.toUtf8Bytes("unregistered document"));

            await expect(registry.getRegistration(unregisteredHash))
                .to.be.revertedWith("Hash not registered");
        });

        it("Should allow different users to register different hashes", async function () {
            const { registry, owner, otherAccount } = await loadFixture(deployRegistryFixture);

            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("document 1"));
            const hash2 = ethers.keccak256(ethers.toUtf8Bytes("document 2"));

            // Register both wallets first
            await registry.registerWallet("John Doe");
            await registry.connect(otherAccount).registerWallet("Jane Doe");

            await registry.registerHash(hash1);
            await registry.connect(otherAccount).registerHash(hash2);

            const reg1 = await registry.getRegistration(hash1);
            const reg2 = await registry.getRegistration(hash2);

            expect(reg1[0]).to.equal(owner.address);
            expect(reg1[1]).to.equal("John Doe");
            expect(reg2[0]).to.equal(otherAccount.address);
            expect(reg2[1]).to.equal("Jane Doe");
        });
    });

    describe("Multiple Users", function () {
        it("Should allow multiple users to register wallets with different names", async function () {
            const { registry, owner, otherAccount } = await loadFixture(deployRegistryFixture);

            await registry.registerWallet("John Doe");
            await registry.connect(otherAccount).registerWallet("Jane Smith");

            expect(await registry.isWalletRegistered(owner.address)).to.equal(true);
            expect(await registry.isWalletRegistered(otherAccount.address)).to.equal(true);

            const reg1 = await registry.getRegistrant(owner.address);
            const reg2 = await registry.getRegistrant(otherAccount.address);

            expect(reg1[0]).to.equal("John Doe");
            expect(reg2[0]).to.equal("Jane Smith");
        });
    });
});