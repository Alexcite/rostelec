// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, ERC721URIStorage, Ownable {
    uint256 public _nextTokenId;

    // Маппинг: владелец -> массив токенов
    mapping(address => uint256[]) private _tokensByOwner;

    constructor(address initialOwner) ERC721("MyNFT", "MNFT") Ownable(initialOwner) {}

    function mint(address to, string memory uri) public {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        // _addTokenToOwnerEnumeration(to, tokenId);
    }

    // НОВОЕ: переопределяем _update, чтобы отслеживать смену владельца
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        if (previousOwner != address(0)) {
            _removeTokenFromOwnerEnumeration(previousOwner, tokenId);
        }
        if (to != address(0)) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }

        return previousOwner;
    }

    // Вспомогательная функция для добавления токена в список владельца
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _tokensByOwner[to].push(tokenId);
    }

    // Вспомогательная функция для удаления токена из списка владельца
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 length = _tokensByOwner[from].length;
        for (uint256 i = 0; i < length; i++) {
            if (_tokensByOwner[from][i] == tokenId) {
                _tokensByOwner[from][i] = _tokensByOwner[from][length - 1];
                _tokensByOwner[from].pop();
                break;
            }
        }
    }

    // НОВОЕ: получить токены владельца
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        return _tokensByOwner[owner];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}