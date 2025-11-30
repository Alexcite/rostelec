import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const nft = await deploy("NFT", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
  });

  console.log("NFT deployed at:", nft.address);
};

deployNFT.tags = ["NFT"];
export default deployNFT;