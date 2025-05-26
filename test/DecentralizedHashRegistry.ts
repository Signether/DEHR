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
            const filename = "sample-document.pdf";

            // First register the wallet
            await registry.registerWallet(registrantName);

            expect(await registry.isRegistered(sampleHash)).to.equal(false);

            const tx = await registry.registerHash(sampleHash, filename);

            expect(await registry.isRegistered(sampleHash)).to.equal(true);

            await expect(tx)
                .to.emit(registry, "HashRegistered")
                .withArgs(sampleHash, owner.address, registrantName, filename, anyValue);
        });

        it("Should register a hash with filename and retrieve it correctly", async function () {
            const { registry, owner, sampleHash } = await loadFixture(deployRegistryFixture);
            const registrantName = "John Doe";
            const filename = "important-contract.pdf";

            await registry.registerWallet(registrantName);
            await registry.registerHash(sampleHash, filename);

            const registration = await registry.getRegistration(sampleHash);
            expect(registration[0]).to.equal(owner.address);
            expect(registration[1]).to.equal(registrantName);
            expect(registration[2]).to.equal(filename);
            expect(registration[3]).to.be.greaterThan(0); // timestamp
        });

        it("Should reject empty filename", async function () {
            const { registry, sampleHash } = await loadFixture(deployRegistryFixture);

            await registry.registerWallet("John Doe");

            await expect(registry.registerHash(sampleHash, ""))
                .to.be.revertedWith("Invalid filename");
        });

        it("Should allow same filename for different hashes", async function () {
            const { registry, owner } = await loadFixture(deployRegistryFixture);
            const filename = "document.pdf";
            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("document version 1"));
            const hash2 = ethers.keccak256(ethers.toUtf8Bytes("document version 2"));

            await registry.registerWallet("John Doe");

            await registry.registerHash(hash1, filename);
            await registry.registerHash(hash2, filename);

            const reg1 = await registry.getRegistration(hash1);
            const reg2 = await registry.getRegistration(hash2);

            expect(reg1[2]).to.equal(filename);
            expect(reg2[2]).to.equal(filename);
        });

        it("Should store different filenames for different users", async function () {
            const { registry, owner, otherAccount } = await loadFixture(deployRegistryFixture);
            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("document 1"));
            const hash2 = ethers.keccak256(ethers.toUtf8Bytes("document 2"));
            const filename1 = "owner-document.pdf";
            const filename2 = "other-document.docx";

            await registry.registerWallet("John Doe");
            await registry.connect(otherAccount).registerWallet("Jane Doe");

            await registry.registerHash(hash1, filename1);
            await registry.connect(otherAccount).registerHash(hash2, filename2);

            const reg1 = await registry.getRegistration(hash1);
            const reg2 = await registry.getRegistration(hash2);

            expect(reg1[2]).to.equal(filename1);
            expect(reg2[2]).to.equal(filename2);
        });

        it("Should reject hash registration from unregistered wallet", async function () {
            const { registry, sampleHash } = await loadFixture(deployRegistryFixture);

            await expect(registry.registerHash(sampleHash, "document.pdf"))
                .to.be.revertedWith("Wallet not registered");
        });

        it("Should reject registering the zero hash", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);
            const zeroHash = ethers.ZeroHash;

            // Register wallet first
            await registry.registerWallet("John Doe");

            await expect(registry.registerHash(zeroHash, "document.pdf"))
                .to.be.revertedWith("Invalid hash");
        });

        it("Should reject registering already registered hash", async function () {
            const { registry, sampleHash } = await loadFixture(deployRegistryFixture);

            // Register wallet first
            await registry.registerWallet("John Doe");

            await registry.registerHash(sampleHash, "document.pdf");

            await expect(registry.registerHash(sampleHash, "another-name.pdf"))
                .to.be.revertedWith("Hash already registered");
        });
    });

    describe("Hash Enumeration", function () {
        it("Should track total hash count correctly", async function () {
            const { registry, owner, otherAccount } = await loadFixture(deployRegistryFixture);

            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("document 1"));
            const filename1 = "doc1.pdf";

            const hash2 = ethers.keccak256(ethers.toUtf8Bytes("document 2"));
            const filename2 = "doc2.docx";

            const hash3 = ethers.keccak256(ethers.toUtf8Bytes("document 3"));
            const filename3 = "doc3.txt";

            expect(await registry.getAllHashesCount()).to.equal(0);

            await registry.registerWallet("John Doe");
            await registry.connect(otherAccount).registerWallet("Jane Doe");

            await registry.registerHash(hash1, filename1);
            expect(await registry.getAllHashesCount()).to.equal(1);
            expect(await registry.getHashByIndex(0)).to.equal(hash1);

            await registry.connect(otherAccount).registerHash(hash2, filename2);
            expect(await registry.getAllHashesCount()).to.equal(2);
            expect(await registry.getHashByIndex(1)).to.equal(hash2);

            await registry.registerHash(hash3, filename3);
            expect(await registry.getAllHashesCount()).to.equal(3);
            expect(await registry.getHashByIndex(2)).to.equal(hash3);
        });

        it("Should track user-specific hash counts correctly", async function () {
            const { registry, owner, otherAccount } = await loadFixture(deployRegistryFixture);

            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("document 1"));
            const hash2 = ethers.keccak256(ethers.toUtf8Bytes("document 2"));
            const hash3 = ethers.keccak256(ethers.toUtf8Bytes("document 3"));

            await registry.registerWallet("John Doe");
            await registry.connect(otherAccount).registerWallet("Jane Doe");

            expect(await registry.getUserHashesCount(owner.address)).to.equal(0);
            expect(await registry.getUserHashesCount(otherAccount.address)).to.equal(0);

            await registry.registerHash(hash1, "document1.pdf");
            await registry.registerHash(hash3, "document3.pdf");

            expect(await registry.getUserHashesCount(owner.address)).to.equal(2);
            expect(await registry.getUserHashByIndex(owner.address, 0)).to.equal(hash1);
            expect(await registry.getUserHashByIndex(owner.address, 1)).to.equal(hash3);

            await registry.connect(otherAccount).registerHash(hash2, "document2.pdf");

            expect(await registry.getUserHashesCount(otherAccount.address)).to.equal(1);
            expect(await registry.getUserHashByIndex(otherAccount.address, 0)).to.equal(hash2);

            expect(await registry.getUserHashesCount(owner.address)).to.equal(2);
        });

        it("Should revert when accessing hash by invalid index", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);

            await expect(registry.getHashByIndex(0))
                .to.be.revertedWith("Index out of bounds");

            await registry.registerWallet("John Doe");
            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("document 1"));
            await registry.registerHash(hash1, "document1.pdf");

            expect(await registry.getHashByIndex(0)).to.equal(hash1);

            await expect(registry.getHashByIndex(1))
                .to.be.revertedWith("Index out of bounds");
        });

        it("Should revert when accessing user hash by invalid index", async function () {
            const { registry, owner } = await loadFixture(deployRegistryFixture);

            await expect(registry.getUserHashByIndex(owner.address, 0))
                .to.be.revertedWith("Index out of bounds");

            await registry.registerWallet("John Doe");
            const hash1 = ethers.keccak256(ethers.toUtf8Bytes("document 1"));
            await registry.registerHash(hash1, "document1.pdf");

            expect(await registry.getUserHashByIndex(owner.address, 0)).to.equal(hash1);

            await expect(registry.getUserHashByIndex(owner.address, 1))
                .to.be.revertedWith("Index out of bounds");
        });
    });

    describe("Registration Queries", function () {
        it("Should return correct registration details", async function () {
            const { registry, owner, sampleHash } = await loadFixture(deployRegistryFixture);
            const registrantName = "John Doe";
            const filename = "test-document.pdf";

            await registry.registerWallet(registrantName);

            const tx = await registry.registerHash(sampleHash, filename);
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
            expect(registration[2]).to.equal(filename);
            expect(registration[3]).to.equal(timestamp);
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
            const filename1 = "user1-doc.pdf";
            const filename2 = "user2-doc.docx";

            await registry.registerWallet("John Doe");
            await registry.connect(otherAccount).registerWallet("Jane Doe");

            await registry.registerHash(hash1, filename1);
            await registry.connect(otherAccount).registerHash(hash2, filename2);

            const reg1 = await registry.getRegistration(hash1);
            const reg2 = await registry.getRegistration(hash2);

            expect(reg1[0]).to.equal(owner.address);
            expect(reg1[1]).to.equal("John Doe");
            expect(reg1[2]).to.equal(filename1);
            expect(reg2[0]).to.equal(otherAccount.address);
            expect(reg2[1]).to.equal("Jane Doe");
            expect(reg2[2]).to.equal(filename2);
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

        it("Should maintain separate hash lists for different users", async function () {
            const { registry, owner, otherAccount } = await loadFixture(deployRegistryFixture);

            const ownerHash1 = ethers.keccak256(ethers.toUtf8Bytes("owner doc 1"));
            const ownerHash2 = ethers.keccak256(ethers.toUtf8Bytes("owner doc 2"));
            const otherHash1 = ethers.keccak256(ethers.toUtf8Bytes("other doc 1"));

            await registry.registerWallet("John Doe");
            await registry.connect(otherAccount).registerWallet("Jane Doe");

            await registry.registerHash(ownerHash1, "owner-file1.pdf");
            await registry.registerHash(ownerHash2, "owner-file2.pdf");

            await registry.connect(otherAccount).registerHash(otherHash1, "other-file1.pdf");

            expect(await registry.getAllHashesCount()).to.equal(3);

            expect(await registry.getUserHashesCount(owner.address)).to.equal(2);
            expect(await registry.getUserHashesCount(otherAccount.address)).to.equal(1);

            expect(await registry.getUserHashByIndex(owner.address, 0)).to.equal(ownerHash1);
            expect(await registry.getUserHashByIndex(owner.address, 1)).to.equal(ownerHash2);
            expect(await registry.getUserHashByIndex(otherAccount.address, 0)).to.equal(otherHash1);
        });
    });
});