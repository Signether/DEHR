import 'dotenv/config';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

if (!process.env.OPTIMISM_RPC_URL) {
    throw new Error("Please set your OPTIMISM_RPC_URL in a .env file");
}

if (!process.env.PRIVATE_KEY) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
}

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        optimism: {
            url: process.env.OPTIMISM_RPC_URL || "",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 10,
        },
    }
};

export default config;
