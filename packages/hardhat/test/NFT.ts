import { expect } from "chai";
import { ethers } from "hardhat";
import type { NFT, Signer } from "../typechain-types"; // Путь к сгенерированным типам

describe("NFT Contract", function () {
  let nft: NFT;
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
  });

  it("Should mint an NFT and update owner's list", async function () {
    await nft.mint(await addr1.getAddress(), URI);
    expect(await nft.ownerOf(0)).to.equal(await addr1.getAddress());
    expect(await nft.tokenURI(0)).to.equal(URI);
    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([0]);
  });

  it("Should update owner lists on transfer", async function () {
    await nft.mint(await addr1.getAddress(), URI);
    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([0]);

    // addr1 approves marketplace and lists the NFT, then addr2 buys it
    // Для простоты теста используем safeTransferFrom
    await nft.connect(addr1).approve(await addr2.getAddress(), 0);
    await nft.connect(addr1)["safeTransferFrom(address,address,uint256)"](await addr1.getAddress(), await addr2.getAddress(), 0);

    // addr2 now owns the NFT
    expect(await nft.ownerOf(0)).to.equal(await addr2.getAddress());
    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([]);
    expect((await nft.getTokensByOwner(await addr2.getAddress())).map(Number)).to.deep.equal([0]);
  });

  it("Should handle multiple tokens correctly", async function () {
    await nft.mint(await addr1.getAddress(), URI);
    await nft.mint(await addr1.getAddress(), URI);
    await nft.mint(await addr2.getAddress(), URI);

    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([0, 1]);
    expect((await nft.getTokensByOwner(await addr2.getAddress())).map(Number)).to.deep.equal([2]);

    // addr1 sends token 1 to addr3
    await nft.connect(addr1).approve(await addr3.getAddress(), 1);
    await nft.connect(addr1)["safeTransferFrom(address,address,uint256)"](await addr1.getAddress(), await addr3.getAddress(), 1);

    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([0]);
    expect((await nft.getTokensByOwner(await addr2.getAddress())).map(Number)).to.deep.equal([2]);
    expect((await nft.getTokensByOwner(await addr3.getAddress())).map(Number)).to.deep.equal([1]);
  });

  it("Should correctly manage token enumeration on multiple transfers", async function () {
    await nft.mint(await addr1.getAddress(), URI); // tokenId 0
    await nft.mint(await addr1.getAddress(), URI); // tokenId 1
    await nft.mint(await addr1.getAddress(), URI); // tokenId 2

    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([0, 1, 2]);

    // addr1 sends token 1 to addr2
    await nft.connect(addr1).approve(await addr2.getAddress(), 1);
    await nft.connect(addr1)["safeTransferFrom(address,address,uint256)"](await addr1.getAddress(), await addr2.getAddress(), 1);

    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([0, 2]);
    expect((await nft.getTokensByOwner(await addr2.getAddress())).map(Number)).to.deep.equal([1]);

    // addr2 sends token 1 to addr3
    await nft.connect(addr2).approve(await addr3.getAddress(), 1);
    await nft.connect(addr2)["safeTransferFrom(address,address,uint256)"](await addr2.getAddress(), await addr3.getAddress(), 1);

    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([0, 2]);
    expect((await nft.getTokensByOwner(await addr2.getAddress())).map(Number)).to.deep.equal([]);
    expect((await nft.getTokensByOwner(await addr3.getAddress())).map(Number)).to.deep.equal([1]);

    // addr1 sends token 0 to addr2
    await nft.connect(addr1).approve(await addr2.getAddress(), 0);
    await nft.connect(addr1)["safeTransferFrom(address,address,uint256)"](await addr1.getAddress(), await addr2.getAddress(), 0);

    expect((await nft.getTokensByOwner(await addr1.getAddress())).map(Number)).to.deep.equal([2]);
    expect((await nft.getTokensByOwner(await addr2.getAddress())).map(Number)).to.deep.equal([0]);
    expect((await nft.getTokensByOwner(await addr3.getAddress())).map(Number)).to.deep.equal([1]);
  });
});