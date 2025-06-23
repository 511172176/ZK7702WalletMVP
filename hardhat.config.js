require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    //sepolia: {
      //url: process.env.INFURA_URL,
      //accounts: [process.env.PRIVATE_KEY]
    //}
  }
};
