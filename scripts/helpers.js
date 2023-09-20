/*
@todo : if we set defaultNetwork : <network> when we invoke script files with node then they are deployed automtically into the network
*/

const hre = require("hardhat");

//ethereumjsutil for signing
const ethereumjsUtil = require("ethereumjs-util")
//default abi coder
const defaultAbicoder = hre.ethers.AbiCoder.defaultAbiCoder()
const keccak256 = hre.ethers.keccak256
const arrayify = hre.ethers.getBytes //ethers.arrayify in v5

async function mainD() {
    const provider = hre.ethers.provider
    // hre.ethers.deployContract("SimpleAccountFactory", ["0xf28688BF90EFF1887165Cad0C5dF8e3547E9f611"])
    const hi = await hre.ethers.deployContract("SimpleAccountFactory", ["0xf28688BF90EFF1887165Cad0C5dF8e3547E9f611"]) // contract deployments with arguments
    console.log('==entrypoint addr=', await hi.target)
    const prevD = hi.target
    // const entryPointAddress = ret.address
    const prevContract = await hre.ethers.getContractAt("SimpleAccountFactory", prevD)
    console.log(await prevContract.accountImplementation())
    await prevContract.createAccount("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 0)
    const createNewProxy = await prevContract.getAddress2("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 0) // calling a state changing function


    console.log(createNewProxy)
}

async function deployBoth() {
    // const entryPoint = await hre.ethers.deployContract("EntryPoint")
    // const entryPointAddress = entryPoint.target
    // console.log('===entrypoint addr=', entryPointAddress)
    // const simpleAccountFactory = await hre.ethers.deployContract("SimpleAccountFactory", [entryPointAddress])
    // const simpleAccountFactoryAddress = simpleAccountFactory.target
    // console.log('===simpleAccountFactory addr=', simpleAccountFactoryAddress)
    // const implementation = await simpleAccountFactory.accountImplementation()
    // console.log("===implementation=", implementation)
    const co = await hre.ethers.deployContract("TestCounter")
    console.log(co.target)
    // return [/*entryPointAddress, simpleAccountFactoryAddress,*/ implementation]
}
async function deployFactory(entryPointAddress) {
    const simpleAccountFactory = await hre.ethers.deployContract("SimpleAccountFactory", [entryPointAddress])
    const simpleAccountFactoryAddress = simpleAccountFactory.target
    console.log('===simpleAccountFactory addr=', simpleAccountFactoryAddress)
    const implementation = await simpleAccountFactory.accountImplementation()
    console.log("===implementation=", implementation)
    return [simpleAccountFactory, implementation]
}
async function createNewAccount(simpleAccountFactoryAddress, ownerAddress, salt) {
    const simpleAccountFactory = await hre.ethers.getContractAt("SimpleAccountFactory", simpleAccountFactoryAddress)
    const newAccount = await simpleAccountFactory.createAccount(ownerAddress, salt)
}
async function getAccountAddress(simpleAccountFactoryAddress, ownerAddress, salt) {
    const simpleAccountFactory = await hre.ethers.getContractAt("SimpleAccountFactory", simpleAccountFactoryAddress)
    const newAccountAddress = await simpleAccountFactory.getAddress2(ownerAddress, salt)
    console.log("===newAccount address=", newAccountAddress)
}
async function connectEntryPoint(entryPointAddress) {
    return await hre.ethers.getContractAt("EntryPoint", entryPointAddress)
}
function signUserOp(op, signer, entryPointAddress, chainId) {
    // @todo we need to pass a new signer w/ eoa s credentials or else pass the privatekey to sign 
    const message = getUserOpHash(op, entryPointAddress, chainId)
    const message1 = Buffer.concat([
        Buffer.from('\x19Ethereum Signed Message:\n32', 'ascii'),
        Buffer.from(arrayify(message))
    ])
    const sig = ethereumjsUtil.ecsign(ethereumjsUtil.keccak256(message1), Buffer.from(arrayify(signer.privateKey)))
    // that's equivalent of:  await signer.signMessage(message);
    // (but without "async"
    const signedMessage = ethereumjsUtil.toRpcSig(sig.v, sig.r, sig.s)
    return {
        ...op,
        signature: signedMessage
    }
}

function getUserOpHash(op, entryPointAddress, chainId) {
    //for signature
    const userOphash = hre.ethers.keccak256(packUserOp(op))
    const enc = defaultAbicoder.encode(['bytes32', 'address', 'uint256'], [userOphash, entryPointAddress, chainId])
    return keccak256(enc)
}
function packUserOp(op) {
    //for signature
    return defaultAbicoder.encode(['address', 'uint256', 'bytes32', 'bytes32',
        'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
        'bytes32'],
        [op.sender, op.nonce, keccak256(op.initCode), keccak256(op.callData),
        op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData)])
}
// async function prepareUserOP(senderAddress)
// main()
// deployBoth()
// deployFactory('0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9')
// createNewAccount("0x0165878A594ca255338adfa4d48449f69242Eb8F", "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", 0)
async function main() {
    //@todo for the test environment we are in => eoa: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266  
    //smartacc:0x0165878A594ca255338adfa4d48449f69242Eb8F
    /**
     *  ===entrypoint addr= 0x0165878A594ca255338adfa4d48449f69242Eb8F
        ===simpleAccountFactory addr= 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
        ===implementation= 0x9bd03768a7DCc129555dE410FF8E85528A4F88b5
        hardhat node chain id = 31337
     */
    var entryPointInstance = connectEntryPoint("0x5FbDB2315678afecb367f032d93F642f64180aa3")
    var nonce = await entryPointInstance.getNonce("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", 0)
    const userOp = {
        sender: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',//should write a function to handle initcode & sender
        nonce: nonce,
        initCode: '0x', //@todo --> need to write the function
        callData: '0x', //@todo --> need to write the function
        callGasLimit: 1e5, //should calculate this
        verificationGasLimit: 1e5,
        preVerificationGas: 1e5,
        maxFeePerGas: 1,
        maxPriorityFeePerGas: 1,
        paymasterAndData: '0x',
        signature: "k"
    }
}
async function sendTestEth(smartAccAddress, amountEth) {
    const [signer] = await hre.ethers.getSigners()
    await signer.sendTransaction({ to: smartAccAddress, value: hre.ethers.parseEther(amountEth) })
}
async function test() {
    var entryPointAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    var simpleAccountFactoryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    var chainId = 31337
    var entryPointInstance = await hre.ethers.getContractAt("EntryPoint", entryPointAddress)
    await sendTestEth("0xD759005e2C222685515a7173509112F3538A9E15", "1")
    var nonce = await entryPointInstance.getNonce("0xD759005e2C222685515a7173509112F3538A9E15", 0)
    const userOp = {
        sender: '0xD759005e2C222685515a7173509112F3538A9E15',//should write a function to handle initcode & sender
        nonce: nonce,
        initCode: '0x', //@todo --> need to write the function
        callData: '0x', //@todo --> need to write the function
        callGasLimit: '0x' + 1e5.toString(16),
        verificationGasLimit: '0x' + 1e5.toString(16),
        preVerificationGas: '0x' + 1e5.toString(16),
        maxFeePerGas: 1,
        maxPriorityFeePerGas: 1,
        paymasterAndData: '0x',
        signature: '0x' //@todo --> write a function to sign data
    }
    // console.log(nonce)
    signedOp = signUserOp(userOp, { privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" }, entryPointAddress, chainId)

    const test = await entryPointInstance.handleOps([signedOp], "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
    console.log(test) //we are failing at validate prepayment
}

// ===entrypoint addr= 0x5FbDB2315678afecb367f032d93F642f64180aa3
// ===simpleAccountFactory addr= 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// ===implementation= 0xCafac3dD18aC6c6e92c921884f9E4176737C052c
// 0xD759005e2C222685515a7173509112F3538A9E15

/**
 * bought from accountabstraction git
 *  const rcpt = await entryPoint.handleOps([op], beneficiaryAddress, {
          maxFeePerGas: 1e9,
          gasLimit: 1e7
        }).then(async t => await t.wait())
 *
 */
// deployBoth()
// createNewAccount("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 0)
async function deployCounter() {

    // await createNewAccount("0xe7f1725e7734ce288f8367e1bb143e90bb3f0512", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 0)
}
deployBoth()