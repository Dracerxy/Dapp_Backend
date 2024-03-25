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


const contractAddress = '0xf5531B5106b693158953f36AF85f5B9051Ad0F5f';
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
		"inputs": [],
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

dapp_server.get("/home", (req, res) => {
    res.send("hello server");
});
dapp_server.get('/register-user', async (req, res) => {
	// const newWallet = await generateWallet();
	// const userAddress = newWallet.address;
	// const privateKey = newWallet.privateKey;
	const userAddress = '0x5145a8426EB329D6E9bC7bAd56FC13DA22d49C97';
	const privateKey ='0xc4c11295504caa07a3abf05e2b089ef668bae8db3cb4cbbd097f052ff404be65';
    try {
        // Check if the user is already registered
        const isUserRegistered = await contract.methods.isRegistered(userAddress).call({ from: userAddress });

        if (isUserRegistered) {
            return res.status(200).json({ message: 'User is already registered.', userAddress, privateKey });
        } else {
            // User is not registered, proceed with registration
            const gas = await contract.methods.registerUserWithWallet().estimateGas({ from: userAddress });
            const gasPrice = await web3.eth.getGasPrice();

            // Build the transaction
            const transactionObject = contract.methods.registerUserWithWallet();
            const transactionData = transactionObject.encodeABI();
            const nonce = await web3.eth.getTransactionCount(userAddress);

            const rawTransaction = {
                from: userAddress,
                to: contractAddress,
                gas,
                gasPrice,
                data: transactionData,
                nonce,
            };

            // Sign the transaction
            const signedTransaction = await web3.eth.accounts.signTransaction(rawTransaction, privateKey);

            // Send the signed transaction
            const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

            return res.status(200).json({ message: 'User registered.',  userAddress, privateKey});
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'An error occurred.' });
    }
});

dapp_server.post("/MFANotification",(req, res) => {
	try {
	const { userAddress, privateKey } = req.body;
	const wallet = new ethers.Wallet(privateKey, provider);
	const contract1 = new ethers.Contract(contractAddress, contractABI, wallet);
	contract1.on('MFANotification', { dappAddress: userAddress }, async (user, dappAddress, transactionId, event) => {
		res.status(200).json({ message: 'MFA request processed successfully',user, dappAddress, transactionId });
	});
	} catch (error) {
		console.error('Error listening for MFANotification event:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
	});

module.exports = dapp_server;