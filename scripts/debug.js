// 0x0e64C0f3c5917d103a1482Ef7E506150eF7656c2

const hre = require("hardhat")

async function getOwner() {
    const owner = await hre.ethers.getContractAt("SimpleAccount", "0x0e64C0f3c5917d103a1482Ef7E506150eF7656c2")
    const tx = await owner.owner()
    console.log(tx)
}
getOwner()