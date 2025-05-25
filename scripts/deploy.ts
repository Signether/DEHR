import { ethers } from 'hardhat';

async function main() {
    const DecentralizedHashRegistry = await ethers.getContractFactory('DecentralizedHashRegistry');
    const deployer = await DecentralizedHashRegistry.deploy();
    const transaction = await deployer.waitForDeployment();

    console.log(await transaction.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
