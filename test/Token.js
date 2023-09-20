const expect = require("chai")
const hre = require("hardhat")
// describe("Token contract", function () {
//     it("Deployment should assign the total sup", async function () {
//         const [owner] = await ethers.getSigners()
//         const hardahatToken = await ethers.deployContract("")
//         const ownerbalance = await hardahatToken.balanceOf(owner.address);
//         expect(await hardahatToken.totalSupply()).to.equal(ownerbalance)

//     })
// })

describe("Test", function () {

    it("test 2", async function () {

        const hi = await hre.ethers.deployContract("SimpleAccountFactory", ["0xf28688BF90EFF1887165Cad0C5dF8e3547E9f611"]) // contract deployments with arguments

        const prevD = hi.target
        console.log(prevD)
        // const entryPointAddress = ret.address
        const prevContract = await hre.ethers.getContractAt("SimpleAccountFactory", prevD) //loading a previously deployed contract
        console.log(await prevContract.accountImplementation())
        const createNewProxy = await prevContract.createAccount("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 0) // calling a state changing function
        const getAccount = await prevContract.getAddress("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 0) // calling a view funtion
        console.log(getAccount)
        expect(await prevContract.getAddress("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 0)).to.equal(simpleAccountFactoryAddress)
    })
})