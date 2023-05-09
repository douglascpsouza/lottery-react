const assert = require('assert');
const ganache = require('ganache');
const Web3 = require('web3');

const { abi, evm } = require('../compile');
const web3 = new Web3(ganache.provider());

let lottery;
let accounts;
 
beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
 
  lottery = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery', () => {
    it('deploy a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(1, players.length);
        assert.equal(accounts[0], players[0]);
    });

    it('allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({ from: accounts[0] });

        assert.equal(3, players.length);
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
    });

    it('requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: web3.utils.toWei('9', 'finney') // 0.009 ether
            });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('only manager can call pickWinner', async () => {
        try {
            await lottery.methods.pickWinner().send({ from: accounts[1] });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('sends money to the winner and resets the player array', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('200', 'finney') // 0.2 ether
        });

        // balance before lottery
        const preBalance = await web3.eth.getBalance(accounts[0]);
        // pick winner
        await lottery.methods.pickWinner().send({ from: accounts[0] });
        // balance after after lottery
        const postBalance = await web3.eth.getBalance(accounts[0]);

        // smart contract final balance
        const contractFinalBalance = await web3.eth.getBalance(lottery.options.address);
        // get array of players
        const players = await lottery.methods.getPlayers().call({ from: accounts[0] });

        // winner balance after winning the lottery is greater than before winning
        assert((postBalance - preBalance) > web3.utils.toWei('10', 'finney'));
        // smart contract has a balance equal to zero
        assert(contractFinalBalance == 0);
        // players array is of size zero
        assert(players.length == 0);
    });
});
