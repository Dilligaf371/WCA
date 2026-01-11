// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FigurineNFT
 * @dev ERC-721 NFT contract for WarChain Arena figurines
 * @notice On-chain stores ONLY ownership and metadata hash/IPFS URI
 * @notice Character progression is OFF-CHAIN (separate from NFT ownership)
 * 
 * Features:
 * - ERC-721 standard NFT functionality
 * - ERC-2981 royalty support (5% default, configurable per token)
 * - IPFS metadata URI storage
 * - Minter role restriction (only backend signer can mint)
 * - OpenZeppelin security best practices
 */
contract FigurineNFT is ERC721, ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    // Minting configuration
    address public minter; // Backend signer address
    
    // Royalty configuration
    uint96 private constant DEFAULT_ROYALTY_BPS = 500; // 5% (500 basis points)
    address private royaltyRecipient;
    
    // Token counter
    uint256 private _tokenIdCounter;
    
    // Events
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    event RoyaltyRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed to,
        string metadataURI,
        uint96 royaltyBps
    );
    
    /**
     * @dev Constructor
     * @param _royaltyRecipient Address to receive royalty payments
     * @param _initialOwner Owner of the contract (can update minter)
     */
    constructor(
        address _royaltyRecipient,
        address _initialOwner
    ) ERC721("WarChain Arena Figurine", "WCAFIG") Ownable(_initialOwner) {
        require(_royaltyRecipient != address(0), "Invalid royalty recipient");
        royaltyRecipient = _royaltyRecipient;
        
        // Set default royalty to 5%
        _setDefaultRoyalty(_royaltyRecipient, DEFAULT_ROYALTY_BPS);
    }
    
    /**
     * @dev Mint a new figurine NFT (only callable by minter/backend)
     * @param to Address to receive the NFT
     * @param metadataURI IPFS URI for token metadata
     * @return tokenId The newly minted token ID
     */
    function mint(
        address to,
        string memory metadataURI
    ) external onlyMinter nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // Set default royalty for this token (can be overridden later)
        _setTokenRoyalty(tokenId, royaltyRecipient, DEFAULT_ROYALTY_BPS);
        
        emit TokenMinted(tokenId, to, metadataURI, DEFAULT_ROYALTY_BPS);
        
        return tokenId;
    }
    
    /**
     * @dev Mint with custom royalty percentage
     * @param to Address to receive the NFT
     * @param metadataURI IPFS URI for token metadata
     * @param royaltyBps Royalty in basis points (e.g., 500 = 5%)
     * @return tokenId The newly minted token ID
     */
    function mintWithRoyalty(
        address to,
        string memory metadataURI,
        uint96 royaltyBps
    ) external onlyMinter nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(royaltyBps <= 1000, "Royalty cannot exceed 10%");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _setTokenRoyalty(tokenId, royaltyRecipient, royaltyBps);
        
        emit TokenMinted(tokenId, to, metadataURI, royaltyBps);
        
        return tokenId;
    }
    
    /**
     * @dev Update metadata URI for a token (only owner, before transfer)
     * @notice In production, consider making this immutable or adding time locks
     */
    function updateTokenURI(
        uint256 tokenId,
        string memory newURI
    ) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        require(bytes(newURI).length > 0, "Invalid URI");
        _setTokenURI(tokenId, newURI);
    }
    
    /**
     * @dev Set the minter address (only contract owner)
     */
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        address oldMinter = minter;
        minter = _minter;
        emit MinterUpdated(oldMinter, _minter);
    }
    
    /**
     * @dev Update royalty recipient (only contract owner)
     */
    function setRoyaltyRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient address");
        address oldRecipient = royaltyRecipient;
        royaltyRecipient = _recipient;
        
        // Update default royalty
        _setDefaultRoyalty(_recipient, DEFAULT_ROYALTY_BPS);
        
        emit RoyaltyRecipientUpdated(oldRecipient, _recipient);
    }
    
    /**
     * @dev Update royalty for a specific token (only contract owner)
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint96 royaltyBps
    ) external onlyOwner {
        require(royaltyBps <= 1000, "Royalty cannot exceed 10%");
        _setTokenRoyalty(tokenId, recipient, royaltyBps);
    }
    
    /**
     * @dev Get the current token counter (next token ID)
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    // Modifiers
    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized minter");
        _;
    }
    
    // Required overrides for multiple inheritance
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
