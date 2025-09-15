const hre = require("hardhat");
require("dotenv").config();

const {
  output: { abi },
} = require("../../xtransfers_ink/target/ink/xtransfers.json");
const CONTRACT_ADDRESS =
  process.env.INK_LIBRARY_ADDRESS ||
  "0x0F971053b3B9360c4083Dae118B8DD7117588A03";

const SYSTEM_CHAINS = {
  1000: "Asset Hub",
  1002: "Bridge Hub",
  1004: "People Chain",
  1005: "Coretime Chain",
};

const TEST_CHAINS = [
  ...Object.entries(SYSTEM_CHAINS).map(([id, name]) => ({
    id: Number(id),
    name,
  })),
  { id: 2034, name: "Hydration" },
  { id: 4000, name: "Frequency" },
];

const createBeneficiary = (suffix = "12") =>
  "0x" + "0".repeat(64 - suffix.length) + suffix;

async function connectContract() {
  const [signer] = await hre.ethers.getSigners();

  console.log(`
===========================
  XTransfers Contract
===========================

Contract: ${CONTRACT_ADDRESS}
Account:  ${signer.address}
`);

  return hre.ethers.getContractAt(abi, CONTRACT_ADDRESS, signer);
}

async function testSystemChains(contract) {
  console.log("Chains:");

  for (const chain of TEST_CHAINS) {
    const isSystem = await contract.is_system_chain(chain.id);
    const status = isSystem ? "System" : "Non-system";
    console.log(
      `Chain ${chain.id.toString().padEnd(4)} │ ${chain.name.padEnd(20)} │ ${status}`,
    );
  }
}

async function executeTransfer(contract, paraId, amount = "0.1") {
  const chainName = SYSTEM_CHAINS[paraId] || `Parachain ${paraId}`;
  const isSystem = await contract.is_system_chain(paraId);
  const transferType = isSystem ? "TELEPORT" : "RESERVE-BASED";
  const beneficiary = createBeneficiary();
  const amountPlanck = hre.ethers.parseUnits(amount.toString(), 10);

  console.log(`
Transfer to ${chainName} (${transferType})
   Para ID:     ${paraId}
   Beneficiary: ${beneficiary}
   Amount:      ${amount} PAS`);

  try {
    const xcmBytes = await contract.transfer(paraId, beneficiary, amountPlanck);
    console.log(`XCM Generated: ${xcmBytes}`);
    return xcmBytes;
  } catch (error) {
    console.log(`Transfer Failed: ${error.message}`);
    return null;
  }
}

async function main() {
  try {
    const contract = await connectContract();

    await testSystemChains(contract);

    console.log("\n========================");
    console.log("        TRANSFERS");
    console.log("========================");

    // Execute transfers
    await executeTransfer(contract, 1000, "1"); // System chain
    await executeTransfer(contract, 2023, "1"); // Non-system chain
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
