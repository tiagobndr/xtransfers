const hre = require('hardhat');
const { join } = require('path');
const { readFileSync } = require('fs');

// Import the ABI of the contract from the ink_library.json file.
const abi = require("../../xtransfers_ink/target/ink/xtransfers.json").output.abi;

async function main() {
    console.log("Starting deployment...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Fetch the bytecode of the contract.
    const bytecodePath = join(__dirname, "../../xtransfers_ink/target/ink", "xtransfers.polkavm");
    const bytecode = `0x${readFileSync(bytecodePath).toString('hex')}`;

    const library = new hre.ethers.ContractFactory(abi, bytecode, deployer);

    // Deploy the contract with the constructor arguments.
    console.log("Deploying contract...");
    const contract = await library.deploy();
    await contract.waitForDeployment();
    
    // Get the address of the deployed contract.
    const address = await contract.getAddress();
    console.log(`Contract deployed at: ${address}`);
    
    return address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });