require("@nomicfoundation/hardhat-toolbox");
require('@typechain/hardhat')
require('@nomicfoundation/hardhat-ethers')
require('@nomicfoundation/hardhat-chai-matchers')
const optimizedComilerSettings = {
  version: '0.8.17',
  settings: {
    optimizer: { enabled: true, runs: 1000000 },
    viaIR: true
  }
}
let mnemonic = 'test '.repeat(11) + 'junk'
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [{
      version: '0.8.15',
      settings: {
        optimizer: {
          enabled: true, runs: 1000000, details: {
            yulDetails: { optimizerSteps: "u", },
          },
        },
      },
    }],
    overrides: {
      'contracts/core/EntryPoint.sol': optimizedComilerSettings,
      'contracts/samples/SimpleAccount.sol': optimizedComilerSettings
    }
  },
  defaultNetwork: "mumbai",
  networks: {
    hardhat: {
    },
    proxy: {
      url: "http://localhost:8545/",
      accounts: { mnemonic }
    },
    buildbear: {
      url: "https://rpc.buildbear.io/defensive-obi-wan-kenobi-a7f96775",
      accounts: ["0xc8daf5f53830c45f7f41dca3b180fb1fa9a9b0bd3b99688e1b9ab6eb8e962e71"]
    },
    mumbai: {
      url: "https://polygon-mumbai.g.alchemy.com/v2/BBM9SCU7LRIczuaGff2ii7MqxJpQA7Yg",
      accounts: ["0x9d99b3113d36109275077542c4b49624ba689b54cdfe17805e378f00b4e018ca"]
    }
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v6',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    dontOverrideCompile: false // defaults to false
  },
};
