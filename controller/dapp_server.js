const express=require("express");
const dapp_server=new express.Router();
const { Web3 } = require('web3');
const generateWallet=require('../wallet/wallet_utils')
const { ethers } = require('ethers');
const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 15;


const infuraApiKey = 'd9b9137d0f3a498bbd9561ed4c65237b';
const selkadiaEndpoint = `https://sepolia.infura.io/v3/${infuraApiKey}`;
const web3 = new Web3(new Web3.providers.HttpProvider(selkadiaEndpoint));

const provider = new ethers.providers.InfuraProvider('sepolia', infuraApiKey);
const relayerprivateKey = '0xc52796f8cc4819dc9a0ea264985c8acf6d73f1ee1a2fb2db2656dba4034af983'; 
const relayerAddress = '0x3A83b78581c682813fd206af7fFD8c90d7ae81bE';

const contractAddress = '0xBdF3eA27fC353f85C88BE5c6878843Ac186a5149';
const contractABI = [
	{
		"inputs": [],
		"name": "ECDSAInvalidSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "ECDSAInvalidSignatureLength",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "ECDSAInvalidSignatureS",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "dappAddress",
				"type": "address"
			}
		],
		"name": "initiateMFA",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "dappAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "transactionId",
				"type": "bytes32"
			}
		],
		"name": "MFANotification",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isVerified",
				"type": "bool"
			}
		],
		"name": "MFAVerified",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "registerUserWithWallet",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "walletAddress",
				"type": "address"
			}
		],
		"name": "UserRegistered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "transactionId",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			}
		],
		"name": "verifyMFA",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isRegistered",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "mfaRequests",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "relayer",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "walletAddresses",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const contract = new web3.eth.Contract(contractABI, contractAddress);



function registerEventListener(userAddress, res) {
    const wallet = new ethers.Wallet(relayerprivateKey, provider);
    const contract1 = new ethers.Contract(contractAddress, contractABI, wallet);

    // Event listener
    contract1.on('MFANotification', async (user, dappAddress, transactionId, event) => {
        if (dappAddress === userAddress) {
            // Store data in variables
            const eventData = {
                user,
                dappAddress,
                transactionId
            };
            // Send response
            res.status(200).json({
                message: 'MFA request processed successfully',
                ...eventData
            });

            // Remove the event listener to prevent memory leaks
            contract1.removeAllListeners('MFANotification');
        }
    });
}





dapp_server.get("/home", (req, res) => {
    res.send("hello server");
});
dapp_server.get('/register-user', async (req, res) => {
	const newWallet = await generateWallet();
	const userAddress = newWallet.address;
	const privateKey = newWallet.privateKey;
    try {
        // Check if the user is already registered
        const isUserRegistered = await contract.methods.isRegistered(userAddress).call({ from: userAddress });

        if (isUserRegistered) {
            return res.status(200).json({ message: 'User is already registered.', userAddress, privateKey });
        } else {
			// Build the transaction
			const txNonce = await web3.eth.getTransactionCount(relayerAddress);
			const transactionObject = contract.methods.registerUserWithWallet(userAddress);
            const transactionData = transactionObject.encodeABI();
			const gas =await contract.methods.registerUserWithWallet(userAddress).estimateGas({ from: relayerAddress });
            const gasPrice = await web3.eth.getGasPrice();
            const rawTransaction = {
                from: relayerAddress,
                to: contractAddress,
                gas,
                gasPrice,
                data: transactionData,
                nonce:txNonce,
            };
            // Sign the transaction
            const signedTransaction = await web3.eth.accounts.signTransaction(rawTransaction,relayerprivateKey);
            // Send the signed transaction
            const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
            return res.status(200).json({ message: 'User registered.',  userAddress, privateKey});
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'An error occurred.' });
    }
});


// dapp_server.post("/MFANotification", async (req, res) => {
//     try {
//         const { userAddress} = req.body;
//         const wallet = new ethers.Wallet(relayerprivateKey, provider);
//         const contract1 = new ethers.Contract(contractAddress, contractABI, wallet);

//         // Event listener
//        	 contract1.on('MFANotification', async (user, dappAddress, transactionId, event) => {
//             if (dappAddress === userAddress) {
//                 // Store data in variables
//                 eventData = {
//                     user,
//                     dappAddress,
//                     transactionId
//                 };
// 				res.status(200).json({
//                     message: 'MFA request processed successfully',
//                     ...eventData
//                 });
//             }
//             // // Handle disconnection
//             // contract.removeAllListeners('MFANotification');
//         });
//     } catch (error) {
//         console.error('Error listening for MFANotification event:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });
dapp_server.post("/MFANotification", async (req, res) => {
    try {
        const { userAddress } = req.body;

        // Move the event listener registration outside of the route handler
        registerEventListener(userAddress, res);

    } catch (error) {
        console.error('Error listening for MFANotification event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

dapp_server.post("/MFAVerification",async(req,res)=>{
	try{
		const { userAddress ,privateKey, transactionId  } = req.body;
		const wallet = new ethers.Wallet(relayerprivateKey, provider);
		const wallet_user = new ethers.Wallet(privateKey, provider);
        const contract2 = new ethers.Contract(contractAddress, contractABI, wallet);
		const signature = await wallet_user.signMessage(ethers.utils.arrayify(transactionId));
		const gasLimit = await contract2.estimateGas.verifyMFA(userAddress,transactionId, signature, { from: relayerAddress});
        const gasPrice = await provider.getGasPrice();
		const transactionResponse = await contract2.verifyMFA(userAddress,transactionId, signature, { gasLimit, gasPrice });
		await transactionResponse.wait();
		res.status(200).json({message:"MFA verification transaction confirmed in block:" + transactionResponse.blockNumber});
	}catch(error){
		console.error("Error verifying the MFA request!!"+error);
		res.status(500).json({error:'Internal Server Error'});
	}
});
module.exports = dapp_server;