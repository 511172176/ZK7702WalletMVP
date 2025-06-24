require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
const path = require("path");

module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      hardfork: "cancun",
    },
  },
  paths: {
    sources: "./contracts",
  },
  resolve: {
    alias: {
      "@account-abstraction/contracts": path.resolve(
        __dirname,
        "node_modules/@account-abstraction/contracts"
      ),
    },
  },
};
