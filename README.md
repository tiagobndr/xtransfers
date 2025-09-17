# XTransfers

## ink! Library
#### Compile to PolkaVM
```sh
pop build
```

#### Reference
- [ink! docs](https://use.ink/docs/v6/getting-started/building-your-contract)

## ink! Contract Deployment & Invokation Scripts
#### Prerequisites
Get PAS tokens from the [faucet](https://faucet.polkadot.io/?parachain=1111) and then run:
```sh
npm i
npx hardhat vars set PRIVATE_KEY "INSERT_PRIVATE_KEY"
```

#### Deploy the ink! library
```sh
npm run deploy:testnet
```

#### Call XTransfers Library
```sh
npm run call:testnet
```

#### Reference
- [ink! Hardhat docs](https://use.ink/tutorials/ethereum-compatibility/hardhat-deployment/)
