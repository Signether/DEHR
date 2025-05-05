# 🚀 DEHR - Decentralized Hash Registry

## 🔍 What is DEHR?

DEHR (Decentralized Hash Registry) is a **smart contract** deployed on the **Optimism** network that allows you to **register SHA-256 hashes** of files in a decentralized, immutable, and transparent way.

Think of it as a digital fingerprint vault 🔐 - proving the existence and ownership of your files at a specific date.

---

## ✨ Features

- ✅ Store SHA-256 file hashes on-chain  
- ✅ Immutable and censorship-resistant registry  
- ✅ Timestamped proof of registration  
- ✅ Publicly verifiable by anyone  
- ✅ Lightweight and gas-efficient on Optimism L2  
- ✅ Emits events for easy off-chain indexing  

---

## 🛠️ How It Works

1. **Hash your file off-chain** using SHA-256 (32 bytes output).  
2. **Call the smart contract** to register the hash on Optimism.  
3. **Get a timestamped, on-chain proof** of your file’s existence.  
4. **Verify any hash** by querying the contract anytime.  

---

## 📦 Contract Interface

```solidity
function registerHash(bytes32 fileHash) external;
function isRegistered(bytes32 fileHash) external view returns (bool);
function getRegistration(bytes32 fileHash) external view returns (address registrant, uint256 timestamp);
```

---

## 🚀 Getting Started

### Prerequisites

- Bun  
- [Hardhat](https://hardhat.org/) or your favorite Ethereum development environment  
- MetaMask or another Optimism-compatible wallet  
- SHA-256 hash generator (CLI or library)

### Register a File Hash

```bash
# Example using ethers.js
const fileHash = "0x..."; // 64 bytes SHA-256 hash hex string
await dehrContract.registerHash(fileHash);
```

### Check if a Hash is Registered

```bash
const isRegistered = await dehrContract.isRegistered(fileHash);
console.log("Registered?", isRegistered);
```

### Get Registration Details

```bash
const { registrant, timestamp } = await dehrContract.getRegistration(fileHash);
console.log(`Registrant: ${registrant}, Timestamp: ${new Date(timestamp * 1000)}`);
```

---

## 🧪 Testing

Run the tests with:

```bash
bun install
bun run test
```

---

## 📡 Deployment

Deploy to Optimism testnet or mainnet using your preferred deployment scripts. Example with Hardhat:

```bash
bun run deploy --network optimism
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check [issues page](https://github.com/SystemVll/dehr/issues).

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Thanks to the Ethereum and Optimism communities for the amazing tooling and support  
- Inspired by decentralized identity and attestation projects  

---

> “Proof of existence, trustlessly secured on-chain.” 🔗