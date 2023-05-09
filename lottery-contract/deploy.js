require('dotenv').config();

const fs = require('fs');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { abi, evm } = require('./compile');

const mnemonicPhrase = process.env.PHRASE;
const url = process.env.API_URL;
const provider = new HDWalletProvider({
    mnemonic: {
        phrase: mnemonicPhrase
    },
    providerOrUrl: url
});
const web3 = new Web3(provider);

// Deploy Contract
(async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account', accounts[0]);

    const result = await new web3.eth.Contract(abi)
        .deploy({ data: evm.bytecode.object })
        .send({ gas: '1000000', from: accounts[0] });

    console.log('Contract deployed to', result.options.address);
    console.log('Interface:\n', JSON.stringify(abi));
    // append data to file
    try {
        fs.appendFileSync('./deployed-contracts.txt', `Contract Address: ${result.options.address}\r\n`, 'utf8');
    } catch (error) {
        console.log(error);
    }
    // At termination, `provider.engine.stop()' should be called to finish the process elegantly.
    provider.engine.stop();
})();
