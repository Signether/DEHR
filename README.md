# 🚀 DEHR - Decentralized Hash Registry

## 🔍 What is DEHR?

DEHR (Decentralized Hash Registry) is a **smart contract** deployed on the **Optimism** network that allows you to **register SHA-256 hashes** of files in a decentralized, immutable, and transparent way.

Think of it as a digital fingerprint vault 🔐 - proving the existence and ownership of your files at a specific date with verified registrant identities.

---

## ✨ Features

- ✅ **Registrant wallet registration** - Users must register their wallets with a name before registering hashes
- ✅ Store SHA-256 file hashes on-chain with registrant attribution
- ✅ Immutable and censorship-resistant registry
- ✅ Timestamped proof of registration
- ✅ Publicly verifiable by anyone
- ✅ Lightweight and gas-efficient on Optimism L2
- ✅ Emits events for easy off-chain indexing
- ✅ Links registered hashes to verified registrant identities

---

## 🛠️ How It Works

1. **Register your wallet** with a unique registrant name first.
2. **Hash your file off-chain** using SHA-256 (32 bytes output).
3. **Call the smart contract** to register the hash on Optimism.
4. **Get a timestamped, on-chain proof** of your file's existence linked to your identity.
5. **Verify any hash** by querying the contract anytime to see who registered it and when.

---

## 📦 Contract Interface

```solidity
// Wallet Registration
function registerWallet(string calldata registrantName) external;
function isWalletRegistered(address wallet) external view returns (bool);
function getRegistrant(address wallet) external view returns (string memory name, uint256 registrationTimestamp, bool isActive);

// Hash Registration  
function registerHash(bytes32 fileHash) external;
function isRegistered(bytes32 fileHash) external view returns (bool);
function getRegistration(bytes32 fileHash) external view returns (address registrant, string memory registrantName, uint256 timestamp);
```

---

## 🚀 Getting Started

### Prerequisites

- Bun  
- [Hardhat](https://hardhat.org/) or your favorite Ethereum development environment  
- MetaMask or another Optimism-compatible wallet  
- SHA-256 hash generator (CLI or library)

### Step 1: Register Your Wallet

Before registering any hashes, you must first register your wallet with a registrant name:

```bash
# Example using ethers.js
await dehrContract.registerWallet("John Doe");
```

### Step 2: Register a File Hash

Once your wallet is registered, you can register file hashes:

```bash
# Example using ethers.js
const fileHash = "0x..."; // 32 bytes SHA-256 hash hex string
await dehrContract.registerHash(fileHash);
```

### Check if a Hash is Registered

```bash
const isRegistered = await dehrContract.isRegistered(fileHash);
console.log("Registered?", isRegistered);
```

### Get Registration Details

```bash
const { registrant, registrantName, timestamp } = await dehrContract.getRegistration(fileHash);
console.log(`Registrant: ${registrant} (${registrantName}), Timestamp: ${new Date(timestamp * 1000)}`);
```

### Check Wallet Registration Status

```bash
const isWalletRegistered = await dehrContract.isWalletRegistered(walletAddress);
const { name, registrationTimestamp, isActive } = await dehrContract.getRegistrant(walletAddress);
console.log(`Registrant: ${name}, Registered: ${new Date(registrationTimestamp * 1000)}`);
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

## 🔒 Security Features

- **Wallet Registration Required**: Only registered wallets can register hashes
- **Reentrancy Protection**: All state-changing functions are protected against reentrancy attacks
- **Input Validation**: Comprehensive validation of registrant names and hash values
- **Duplicate Prevention**: Prevents duplicate wallet registrations and hash registrations

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check [issues page](https://github.com/Signether/DEHR/issues).

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Thanks to the Ethereum and Optimism communities for the amazing tooling and support  
- Inspired by decentralized identity and attestation projects  

---

> "Proof of existence with verified identity, trustlessly secured on-chain." 🔗