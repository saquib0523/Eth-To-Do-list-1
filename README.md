# TODO List DApp

A simple TODO List DApp using Ethereum smart contracts in Solidity and Truffle Suite.

You could add new tasks or check out completed tasks.

## Prerequisites

* [Ganache](https://www.trufflesuite.com/ganache)
* [MetaMask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn) extension for Chrome
* Connect MetaMask to Ganache:
    1. Start up Ganache and open a workspace
    2. Log in to MetaMask
    3. Create a new `Custom RPC` with the **Ganache RPC Server** URL: `http://localhost:7545/` and connect
    4. Copy the _private key_ for the **first** account on Ganache by clicking the _key_ icon
    5. Import Account on MetaMask:
        * Select Type as Private Key and paste the private key copied previously
    6. You should now see the first account on Ganache with it's balance of 100 ETH, on MetaMask

## Deployment
* Fork this repo
```
git clone https://github.com/your-username/eth-todo-list
cd eth-todo-list
npm install -g truffle@5.0.2
npm install
truffle migrate --reset
npm run dev
```

## Built With

* [Truffle](https://www.trufflesuite.com/truffle) - Development framework for Ethereum DApps
* [Solidity](https://solidity.readthedocs.io/en/v0.5.3/) - High-level language for implementing Smart Contracts
* [Ganache](https://www.trufflesuite.com/ganache) - Personal Ethereum blockchain on your local machine
* [MetaMask](https://metamask.io/) - Allows the browser to interact with Ethereum blockchain and run DApps on the browser
* [web3.js](https://web3js.readthedocs.io/en/1.0/) - Library that allows the web app to interact with the Ethereum blockchain
