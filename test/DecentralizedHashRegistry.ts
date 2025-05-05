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

    describe("Hash Registration", function () {
        it("Should register a new hash", async function () {
            const { registry, owner, sampleHash } = await loadFixture(deployRegistryFixture);

            expect(await registry.isRegistered(sampleHash)).to.equal(false);

            const tx = await registry.registerHash(sampleHash);

            expect(await registry.isRegistered(sampleHash)).to.equal(true);

            await expect(tx)
                .to.emit(registry, "HashRegistered")
                .withArgs(sampleHash, owner.address, anyValue);
        });

        it("Should reject registering the zero hash", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);
            const zeroHash = ethers.ZeroHash;

            await expect(registry.registerHash(zeroHash))
                .to.be.revertedWith("Invalid hash");
        });

        it("Should reject registering already registered hash", async function () {
            const { registry, sampleHash } = await loadFixture(deployRegistryFixture);

            await registry.registerHash(sampleHash);

            await expect(registry.registerHash(sampleHash))
                .to.be.revertedWith("Hash already registered");
        });
    });

    describe("Registration Queries", function () {
        it("Should return correct registration details", async function () {
            const { registry, owner, sampleHash } = await loadFixture(deployRegistryFixture);

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
            expect(registration[1]).to.equal(timestamp);
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

            await registry.registerHash(hash1);

            await registry.connect(otherAccount).registerHash(hash2);

            const reg1 = await registry.getRegistration(hash1);
            const reg2 = await registry.getRegistration(hash2);

            expect(reg1[0]).to.equal(owner.address);
            expect(reg2[0]).to.equal(otherAccount.address);
        });
    });
});