const hre = require("hardhat");
require("dotenv").config();

const {
  output: { abi },
} = require("../../xtransfers_ink/target/ink/xtransfers.json");
const CONTRACT_ADDRESS =
  process.env.INK_LIBRARY_ADDRESS ||
  "0xfD200CacEd3484beaA5DCb673927e649EAd13E56";

const SYSTEM_CHAINS_PASEO = {
  1000: "Asset Hub",
  1002: "Bridge Hub",
  1004: "People Chain",
  1005: "Coretime Chain",
};

const CHAINS_PASEO = [
  ...Object.entries(SYSTEM_CHAINS_PASEO).map(([id, name]) => ({
    id: Number(id),
    name,
  })),
  { id: 2034, name: "Hydration" },
  { id: 4000, name: "Frequency" },
];

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

async function getChainsInfo(contract) {
  console.log("Chains:");

  for (const chain of CHAINS_PASEO) {
    const isSystem = await contract.is_system_chain(chain.id);
    const status = isSystem ? "System" : "Non-system";
    console.log(
      `Chain ${chain.id.toString().padEnd(4)} │ ${chain.name.padEnd(20)} │ ${status}`,
    );
  }
}

async function getXcmMessage(contract, paraId, amount) {
  const chainName = CHAINS_PASEO.find(c => c.id === paraId)?.name ?? `Parachain ${paraId}`;
  const isSystem = await contract.is_system_chain(paraId);
  const transferType = isSystem ? "TELEPORT" : "RESERVE-BASED";
  const beneficiary = "0x" + "0".repeat(64);
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

    await getChainsInfo(contract);

    console.log("\n========================");
    console.log("        TRANSFERS");
    console.log("========================");

    await getXcmMessage(contract, 1000, "10"); // System chain
    await getXcmMessage(contract, 2034, "10"); // Non-system chain
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
