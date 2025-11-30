import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Получаем адрес NFT-контракта после его деплоя
  const nft = await deployments.get("NFT");

  const marketplace = await deploy("Marketplace", {
    from: deployer,
    args: [nft.address], // передаём адрес NFT
    log: true,
  });

  console.log("Marketplace deployed at:", marketplace.address);
};

deployMarketplace.tags = ["Marketplace"];
deployMarketplace.dependencies = ["NFT"]; // Указываем зависимость

export default deployMarketplace;