import { expect } from "chai";
import { ethers } from "hardhat";
import type { NFT, Marketplace, Signer } from "../typechain-types"; // Путь к сгенерированным типам

describe("Marketplace Contract", function () {
  let nft: NFT;
  let marketplace: Marketplace;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;

  const URI = "ipfs://QmSomeHash";

  beforeEach(async function () {
    // Получаем Signer'ы
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Деплоим NFT
    const NFTFactory = await ethers.getContractFactory("NFT");
    nft = await NFTFactory.deploy(await owner.getAddress());
    await nft.waitForDeployment();

    // Деплоим Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceFactory.deploy(await nft.getAddress());
    await marketplace.waitForDeployment();
  });

  describe("Listing", function () {
    beforeEach(async function () {
      // Mint NFT for addr1
      await nft.mint(await addr1.getAddress(), URI);
    });

    it("Should allow listing an NFT", async function () {
      await nft.connect(addr1).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(addr1).listItem(0, ethers.parseEther("1"));

      const listing = await marketplace.listings(0);
      expect(listing.tokenId).to.equal(0n);
      expect(listing.seller).to.equal(await addr1.getAddress());
      expect(listing.price).to.equal(ethers.parseEther("1"));
      expect(listing.isActive).to.be.true;
      expect(await marketplace.isTokenListed(0)).to.be.true;
      expect((await marketplace.getActiveListings()).map(Number)).to.deep.equal([0]);
    });

    it("Should fail to list an NFT if not approved", async function () {
      await expect(
        marketplace.connect(addr1).listItem(0, ethers.parseEther("1"))
      ).to.be.revertedWith("Marketplace not approved for NFT");
    });

    it("Should fail to list an NFT if already listed", async function () {
      await nft.connect(addr1).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(addr1).listItem(0, ethers.parseEther("1"));
      await expect(
        marketplace.connect(addr1).listItem(0, ethers.parseEther("2"))
      ).to.be.revertedWith("Token is already listed");
    });

    it("Should fail to list an NFT if not owner", async function () {
      await expect(
        marketplace.connect(addr2).listItem(0, ethers.parseEther("1"))
      ).to.be.revertedWith("Not owner of NFT");
    });

    it("Should fail to list an NFT with zero price", async function () {
      await nft.connect(addr1).approve(await marketplace.getAddress(), 0);
      await expect(
        marketplace.connect(addr1).listItem(0, 0)
      ).to.be.revertedWith("Price must be > 0");
    });
  });

  describe("Buying", function () {
    beforeEach(async function () {
      // Mint NFT for addr1 and list it
      await nft.mint(await addr1.getAddress(), URI);
      await nft.connect(addr1).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(addr1).listItem(0, ethers.parseEther("1"));
    });

    it("Should allow buying an NFT", async function () {
      const initialBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
      const initialBalance2 = await ethers.provider.getBalance(await addr2.getAddress());

      await marketplace.connect(addr2).buyItem(0, { value: ethers.parseEther("1") });

      expect(await nft.ownerOf(0)).to.equal(await addr2.getAddress());
      const listing = await marketplace.listings(0);
      expect(listing.isActive).to.be.false;
      expect(await marketplace.isTokenListed(0)).to.be.false;
      expect((await marketplace.getActiveListings()).map(Number)).to.deep.equal([]);

      // Check seller received funds
      const finalBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
      expect(finalBalance1).to.be.greaterThan(initialBalance1);
    });

    it("Should fail to buy if insufficient funds", async function () {
      await expect(
        marketplace.connect(addr2).buyItem(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient funds");
    });

    it("Should fail to buy if item not active", async function () {
      await marketplace.connect(addr2).buyItem(0, { value: ethers.parseEther("1") }); // Buy it

      await expect(
        marketplace.connect(addr3).buyItem(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Item not active");
    });
  });

 describe("Withdraw", function () {
    let initialBalance: bigint;
    let contractBalanceBefore: bigint;

    beforeEach(async function () {
      // Mint NFT for addr1 and list it, then buy it
      await nft.mint(await addr1.getAddress(), URI);
      await nft.connect(addr1).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(addr1).listItem(0, ethers.parseEther("1"));
      await marketplace.connect(addr2).buyItem(0, { value: ethers.parseEther("1") });

      // Get owner's balance *before* withdraw
      initialBalance = await ethers.provider.getBalance(await owner.getAddress());
      // Get contract's balance *before* withdraw
      contractBalanceBefore = await ethers.provider.getBalance(await marketplace.getAddress());
    });

    it("Should allow owner to withdraw", async function () {
      // Estimate gas for withdraw
      const gasPrice = await ethers.provider.getFeeData().then(feeData => feeData.gasPrice!);
      const withdrawTx = await marketplace.withdraw();
      const receipt = await withdrawTx.wait();
      const gasUsed = receipt!.gasUsed;
      const effectiveGasPrice = receipt!.gasPrice;

      // Calculate final balance after withdraw transaction
      const finalBalance = await ethers.provider.getBalance(await owner.getAddress());

      // The final balance should be initialBalance + contract balance - gas spent
      const expectedBalance = initialBalance + contractBalanceBefore - (gasUsed * effectiveGasPrice);

      expect(finalBalance).to.equal(expectedBalance);
    });

    it("Should fail to withdraw if not owner", async function () {
      await expect(
        marketplace.connect(addr1).withdraw()
      ).to.be.revertedWith("Not owner");
    });
  });


});