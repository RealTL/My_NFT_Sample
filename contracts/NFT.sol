// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Ownable.sol";

contract NFT is ERC721Enumerable, Ownable {
    using Strings for uint256;
    
    string public baseURI;
    string public baseExtension = '.json';
    uint256 public cost;
    uint256 public maxSupply;
    uint256 public allowMintingOn; 


    event Mint(uint256 amount, address minter);

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint256 _cost, 
        uint256 _maxSupply,
        uint256 _allowMintingOn,
        string memory _baseURI
    ) ERC721(_name, _symbol) {
        cost = _cost;
        maxSupply = _maxSupply;
        allowMintingOn = _allowMintingOn;
        baseURI = _baseURI;
    }

    function mint(uint256 _mintAmount) public payable { //_mintAmount is the number of NFTs to be minted
        // Only allow minting after specified time
        require((block.timestamp >= allowMintingOn));
        // Must mint atleast 1 NFT
        require(_mintAmount > 0);
        // Require enough payment
        require(msg.value >= cost * _mintAmount);
        
        uint256 supply = totalSupply();
        
        // Can't mint more tokens than are available
        require(supply + _mintAmount <= maxSupply);       
        
        // Create a token (reference _safeMint(...) function in ERC721.sol)
        for(uint256 i = 1; i <= _mintAmount; i++) {
           _safeMint(msg.sender, supply + i); 
        }

        emit Mint(_mintAmount, msg.sender);
    }

    // Return metadata IPFS URI/URL
    // e.g. 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/1.json'
    function tokenURI(uint256 _tokenId) 
        public 
        view 
        virtual 
        override 
        returns(string memory)
    { 
        return (string(abi.encodePacked(baseURI, _tokenId.toString(), baseExtension)));
    }

}
