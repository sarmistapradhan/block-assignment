const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());

class Block {
    constructor(index, transactions, previousHash, difficulty = 4) {
        this.index = index;
        this.timestamp = Date.now();
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.difficulty = difficulty;
        this.hash = this.computeHash();
    }

    computeHash() {
        const data = `${this.index}${this.timestamp}${JSON.stringify(this.transactions)}${this.previousHash}${this.nonce}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }

    mineBlock() {
        while (!this.hash.startsWith("0".repeat(this.difficulty))) {
            this.nonce++;
            this.hash = this.computeHash();
        }
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
    }

    createGenesisBlock() {
        return new Block(0, "Genesis Block", "0");
    }

    addBlock(transactions) {
        const previousBlock = this.chain[this.chain.length - 1];
        const newBlock = new Block(this.chain.length, transactions, previousBlock.hash, this.difficulty);
        newBlock.mineBlock();
        this.chain.push(newBlock);
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            if (currentBlock.hash !== currentBlock.computeHash()) {
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}

const blockchain = new Blockchain();

app.get("/blockchain", (req, res) => {
    res.json(blockchain.chain);
});

app.post("/add-block", (req, res) => {
    const { transactions } = req.body;
    if (!transactions) return res.status(400).json({ error: "Transaction data is required" });
    blockchain.addBlock(transactions);
    res.json({ message: "Block added successfully", blockchain: blockchain.chain });
});

app.get("/validate", (req, res) => {
    res.json({ valid: blockchain.isChainValid() });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
