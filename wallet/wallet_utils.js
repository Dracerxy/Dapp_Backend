const {Web3} = require('web3');
const fetch = require('node-fetch');
// Set up Web3 with Selkadia (Selopia) testnet endpoint
const infuraApiKey = 'd9b9137d0f3a498bbd9561ed4c65237b';
const selkadiaEndpoint = `https://sepolia.infura.io/v3/${infuraApiKey}`;
const web3 = new Web3(new Web3.providers.HttpProvider(selkadiaEndpoint));

// Function to request test Ether from Selkadia testnet faucet
async function requestTestEther(address) {
  const faucetUrl = 'https://faucet.selopia.net/gimme-ether';
  const response = await fetch(faucetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: address,
    }),
  });
  const result = await response.json();
  return result;
};

// Function to generate a new wallet using web3.js
async function generateWallet() {
    console.log('Generating wallet...');
    const wallet = web3.eth.accounts.create();

    // try {
    //     // Request test Ether from Selkadia faucet
    //     const response = await requestTestEther(wallet.address);
    //     console.log('Faucet Response:', response);
    // } catch (error) {
    //     console.error('Error requesting test Ether:', error.message);
    // }

    return wallet;
}

module.exports = generateWallet;
// Generate a new wallet
// const newWallet = generateWallet();
// const newAddress = newWallet.address;
// const newPrivateKey = newWallet.privateKey;

// console.log('New Wallet Address:', newAddress);
// console.log('New Wallet Private Key:', newPrivateKey);


// // Check wallet balance
// web3.eth.getBalance(newAddress)
//   .then((balance) => {
//     console.log('Wallet Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
//   })
//   .catch((error) => {
//     console.error('Error checking wallet balance:', error.message);
//   });