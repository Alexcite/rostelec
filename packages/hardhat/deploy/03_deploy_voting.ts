import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the VotingSystem contract. This script has no constructor args since
 * ownership is set to the deployer via Ownable(msg.sender) in the contract.
 */
const deployVotingSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  await deploy("VotingSystem", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployVotingSystem;
deployVotingSystem.tags = ["VotingSystem"]import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Деплой контракта VotingSystem.
 */
const deployVotingSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("VotingSystem", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployVotingSystem;
deployVotingSystem.tags = ["VotingSystem"];
;