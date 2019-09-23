require('./client/node_modules/chai/register-should');
const path = require("path");
const PrivateKeyProvider = require("./client/node_modules/truffle-privatekey-provider");

require('./client/node_modules/dotenv').config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    rinkeby: {
      provider: process.env.RINKEBY_DEV_PKEY ?
        new PrivateKeyProvider(
          process.env.RINKEBY_DEV_PKEY,
          "https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY) :
        null,
      network_id: 4
    },
  },
  compilers: {
    solc: {
      version: '0.5.2',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
};
