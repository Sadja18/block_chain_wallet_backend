const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

async function test() {
    try {
        const network = await provider.getNetwork();
        console.log("Connected network:", network);
    } catch (e) {
        console.error("Failed to connect to RPC:", e);
    }
}

test().then(() => process.exit(0));
