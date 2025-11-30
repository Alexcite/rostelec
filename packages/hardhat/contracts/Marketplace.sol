// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFT.sol";

contract Marketplace {
    NFT public nft;
    address public owner;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingIdCounter;

    // НОВОЕ: маппинг для отслеживания, листится ли токен
    mapping(uint256 => bool) public isTokenListed;

    // НОВОЕ: массив для хранения ID активных листингов
    uint256[] public activeListingIds;

    event ItemListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed listingId, uint256 indexed tokenId, address buyer, uint256 price);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address nftAddress) {
        nft = NFT(nftAddress);
        owner = msg.sender;
    }

    function listItem(uint256 tokenId, uint256 price) external {
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner of NFT");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved for NFT");
        require(price > 0, "Price must be > 0");
        // НОВОЕ: проверка, что токен еще не листится
        require(!isTokenListed[tokenId], "Token is already listed");

        uint256 listingId = listingIdCounter;

        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true
        });

        isTokenListed[tokenId] = true; // Помечаем как листящийся
        activeListingIds.push(listingId);

        emit ItemListed(listingId, tokenId, msg.sender, price);
        listingIdCounter++;
    }

    function buyItem(uint256 listingId) external payable {
        Listing memory listing = listings[listingId];
        require(listing.isActive, "Item not active");
        require(msg.value >= listing.price, "Insufficient funds");

        listings[listingId].isActive = false;
        isTokenListed[listing.tokenId] = false; // Убираем пометку

        // Удаляем из списка активных (сдвигаем в конец и удаляем)
        uint256 index = 0;
        for (uint256 i = 0; i < activeListingIds.length; i++) {
            if (activeListingIds[i] == listingId) {
                index = i;
                break;
            }
        }
        if (index < activeListingIds.length) {
            activeListingIds[index] = activeListingIds[activeListingIds.length - 1];
            activeListingIds.pop();
        }

        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        payable(listing.seller).transfer(listing.price);

        emit ItemSold(listingId, listing.tokenId, msg.sender, listing.price);
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // НОВОЕ: получить все активные листинги
    function getActiveListings() external view returns (uint256[] memory) {
        return activeListingIds;
    }
}