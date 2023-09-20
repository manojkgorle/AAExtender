//@todo actually as we are writing server, we need to use try catch methods for handling exceptions & let server not crash --> should addres in next updates, if any

const express = require('express')
const fs = require("fs")
const cookieParser = require("cookie-parser")
const hre = require("hardhat")
const EC = require("elliptic").ec
const keccak_256 = require("js-sha3").keccak_256
const crypto = require("crypto")
//ethereumjsutil for signing
const ethereumjsUtil = require("ethereumjs-util")
//default abi coder
const defaultAbicoder = hre.ethers.AbiCoder.defaultAbiCoder()
const keccak256 = hre.ethers.keccak256
const arrayify = hre.ethers.getBytes //ethers.arrayify in v5
const cors = require("cors")
async function getFactory(simpleAccountFactoryAddress) {
    return await hre.ethers.getContractAt("SimpleAccountFactory", simpleAccountFactoryAddress);
}
async function getAddress(simpleAccountFactoryAddress, publicKey, salt = 0) {
    const factory = await getFactory(simpleAccountFactoryAddress)
    const address = await factory.getAddress2(publicKey, salt);
    return address
}
async function initiateSmartAccount(simpleAccountFactoryAddress, owner, salt = 0) {
    const factory = await getFactory(simpleAccountFactoryAddress)
    const initiate = await factory.createAccount(owner, salt)
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
async function sendTestEth(smartAccAddress, amountEth) {
    const [signer] = await hre.ethers.getSigners()
    await signer.sendTransaction({ to: smartAccAddress, value: hre.ethers.parseEther(amountEth) })
}
function getPublicKeyFromPrivateKey(privateKey) {
    const wallet = new hre.ethers.Wallet(privateKey)
    return wallet.address
}
//--cryptography begin --
function generateKeyPair(password) {
    // var ec = new EC('secp256k1')
    // var privateKey = ec.genKeyPair()
    // var privateKeyHex = '0x' + privateKey.getPrivate("hex");
    const wallet = hre.ethers.Wallet.createRandom();
    const publicKey = wallet.address//getPublicKeyFromPrivateKey(privateKeyHex)
    const privateKeyHex = wallet.privateKey
    const encryptedPrivateKeyHex = encryptPrivateKey(privateKeyHex, password);
    // Derive the Ethereum address from the public key
    // (Ethereum uses the last 20 bytes of the Keccak-256 hash of the public key)
    return [privateKeyHex, encryptedPrivateKeyHex, publicKey]
}

function encryptPrivateKey(privateKey, password, salt = "0", iv = "0") {
    //@todo using salt & iv as "0" for now
    const pbkdf2Sync = crypto.pbkdf2Sync
    const createCipheriv = crypto.createCipheriv

    const key = pbkdf2Sync(password, salt, 100000, 32, "sha256")

    const cipher = createCipheriv('aes-256-gcm', key, iv)
    let encrytedPrivateKey = cipher.update(privateKey, "utf8", "hex")
    encrytedPrivateKey += cipher.final("hex")

    return encrytedPrivateKey
}

function decryptPrivateKey(encrytedPrivateKey, password, salt = "0", iv = "0") {
    const createDecipheriv = crypto.createDecipheriv
    const pbkdf2Sync = crypto.pbkdf2Sync

    const key = pbkdf2Sync(password, salt, 100000, 32, "sha256")
    const decipher = createDecipheriv("aes-256-gcm", key, iv)

    let decryptedPrivateKey = decipher.update(encrytedPrivateKey, "hex", "utf8")
    return decryptedPrivateKey
}
// -- cryptography end --

//authentication
function addUserCred(email, password) {
    fs.readFile('./scripts/cred.json', (err, cred) => {
        if (err) throw err;
        cred = JSON.parse(cred)
        var count = Object.keys(cred).length;
        count++;
        var userId = "user" + count
        cred[userId] = { "email": email, password: password }
        cred = JSON.stringify(cred)
        fs.writeFile('./scripts/cred.json', cred, (error) => {
            if (error) throw error;
            console.log("Succesfully added credentials")
        })
    })
}
function createUserFile(filename /**filename = email */, publicKey, encrytedPrivateKeyprivateKey, isInitated = false, smartAccAddress) {
    var data = {
        "publicKey": publicKey,
        "encryptedPrivateKey": encrytedPrivateKeyprivateKey,
        "isInitiated": isInitated,
        "smartAccAddress": smartAccAddress
    }
    data = JSON.stringify(data)
    filename = getFileName(filename)
    fs.appendFile(filename, data, function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}
function getFileName(filename) {
    return './scripts/accountCred/' + filename + '.json'
}

function checkUser(data, email, password = null, isSignin = false) {
    //checks if user exists previously
    var isExist = false
    var passwordMatch;

    for (const x in data) {

        if (data[x]["email"] == email) {

            isExist = true
            if (isSignin) passwordMatch = (data[x]["password"] == password) ? true : false
            return [isExist, passwordMatch]
        }
    }
    return [isExist, passwordMatch]
}


//express api
const app = express();
app.use(express.json())
app.use(cookieParser("top secret")) //sign
app.use(cors())
//@todo signup
app.post('/signup', (req, res) => {
    const email = req.query.email
    const password = req.query.password

    fs.readFile("./scripts/cred.json", async (err, data) => {
        data = JSON.parse(data)
        if (err) {
            console.log(err)
            res.statusMessage = "internal error"
            res.statusCode = 320
            return
        }

        const [isExist, pa] = checkUser(data, email)
        console.log(isExist, pa)
        if (isExist == true) {
            res.statusCode = 302 //account already exists
            res.json("Account already exists")
            res.send()
        } else {
            //try creating a neww json with their email as file name

            //@todo json parser or any alt solution
            addUserCred(email, password)
            var [privateKey, encryptedPrivateKey, publickey] = generateKeyPair(password)

            var smartAccountAddress = await getAddress("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", publickey)
            console.log(privateKey)
            //@todo setting cookie & redirection
            // console.log(smartAccountAddress)
            createUserFile(email, publickey, encryptedPrivateKey, false, smartAccountAddress)
            res.cookie("encrypted", privateKey, { maxAge: 36000000, signed: true })
            res.cookie("email", email, { maxAge: 36000000, signed: true })
            res.statusCode = 201
            res.send()
        }
    })

})
// @todo signin
app.post('/signin', (req, res) => {
    const email = req.query.email
    const password = req.query.password

    fs.readFile("./scripts/cred.json", async (err, data) => {
        data = JSON.parse(data)
        if (err) {
            console.log(err)
            res.statusMessage = "internal error"
            res.statusCode = 320
            return
        }

        const [isExist, passwordMatch] = checkUser(data, email, password, true)

        if (isExist == true & passwordMatch == true) {
            var fileAddress = getFileName(email)
            fs.readFile(fileAddress, (err, data2) => {
                if (err) {
                    console.log(err)
                    res.statusMessage = "internal error"
                    res.statusCode = 320
                    return
                }
                data2 = JSON.parse(data2)
                //set cookie

                const privateKey = decryptPrivateKey(data2['encryptedPrivateKey'], password)
                // console.log(privateKey)
                res.cookie("encrypted", privateKey, { maxAge: 36000000, signed: true })
                res.cookie("email", email, { maxAge: 36000000, signed: true })
                res.statusCode = 201
                res.send()
            })
        } else {
            if (isExist == false) {
                res.statusCode = 303
                res.json("Account doesnot exist")
            } else {
                res.json("Wrong Password")
            }
            res.send()

        }
    })
})

//@todo sendApi
app.post("/sendapi", (req, res) => {
    const cookies = req.signedCookies
    const privateKey = cookies['encrypted']
    const email = cookies['email']
    var fileAddress = getFileName(email)
    fs.readFile(fileAddress, async (err, data) => {
        if (err) {
            console.log(err)
            res.statusMessage = "internal error"
            res.statusCode = 320
            return
        }
        data = JSON.parse(data)
        var publicKey, isInitated, smartAccAddress, entryPointAddress, nonce
        publicKey = data['publicKey']
        isInitated = data['isInitiated']
        smartAccAddress = data['smartAccAddress']
        entryPointAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        await sendTestEth(smartAccAddress, '1')
        const entryPointInstance = await connectEntryPoint(entryPointAddress)
        nonce = await entryPointInstance.getNonce(smartAccAddress, 0)
        var chainId = 31337
        console.log(isInitated, !isInitated, isInitated == false)
        if (!isInitated) {
            await initiateSmartAccount("0xe7f1725e7734ce288f8367e1bb143e90bb3f0512", publicKey) // there are better alternatives to do, as compiling init code & sending with user Op, but this can be explored on later updates, if any
        }
        const testCounter = await hre.ethers.getContractAt("TestCounter", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
        const count = await testCounter.count.populateTransaction()
        const smartAccountInstance = await hre.ethers.getContractAt("SimpleAccount", smartAccAddress)
        const acc = await smartAccountInstance.execute.populateTransaction("0xa513e6e4b8f2a923d98304ec87f64353c4d5c853", 0, count.data)


        var userOp = {
            sender: smartAccAddress,//should write a function to handle initcode & sender
            nonce: nonce,
            initCode: '0x', //@todo --> need to write the function
            callData: acc.data,//acc.data, //@todo --> need to write the function
            callGasLimit: '0x' + 10e5.toString(16), //should calculate this
            verificationGasLimit: '0x' + 10e5.toString(16),
            preVerificationGas: '0x' + 10e5.toString(16),
            maxFeePerGas: 1,
            maxPriorityFeePerGas: 1,
            paymasterAndData: '0x',
            signature: "0x"
        }

        var signedOp = signUserOp(userOp, { privateKey: privateKey }, entryPointAddress, chainId)
        console.log(signedOp)
        const test = await entryPointInstance.handleOps([signedOp], "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
        console.log(test)
        res.send()
    })
})
async function getBalance(address) {
    return await hre.ethers.provider.getBalance(address);
}
app.post("/balance", async (req, res) => {
    const cookies = req.signedCookies
    const privateKey = cookies['encrypted']
    const publicKey = getPublicKeyFromPrivateKey(privateKey)
    var balanceSender = await getBalance(publicKey)

    res.send(`${balanceSender}`)
})

app.post("/count", async (req, res) => {
    const cookies = req.signedCookies
    const privateKey = cookies['encrypted']
    const publicKey = getPublicKeyFromPrivateKey(privateKey)
    const testCounter = await hre.ethers.getContractAt("TestCounter", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
    const count = await testCounter.counters(publicKey)
    res.send(count)
})
app.post("/pubkey", async (req, res) => {
    const cookies = req.signedCookies
    const privateKey = cookies['encrypted']
    const email = cookies['email']
    var fileAddress = getFileName(email)
    fs.readFile(fileAddress, (err, data) => {
        if (err) {
            console.log(err)
            res.statusMessage = "internal error"
            res.statusCode = 320
            return
        }
        data = JSON.parse(data)
        res.send(data["publicKey"])
    })
})
const port = 4000
const server = app.listen(port)//port to listen
console.log("listening on port: ", port)

// flow --> attach create 2 address now & set initiated to false
// if false while making a transaction --> create eoa
