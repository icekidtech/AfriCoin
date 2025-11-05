// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title AfriCoin
 * @dev Pan-African digital stablecoin token on Base L2
 * 
 * Features:
 * - ERC-20 standard implementation
 * - Mint/burn functionality (owner-controlled)
 * - Pausable for emergency situations
 * - Permit functionality for gasless approvals
 * - Ownership management
 */
contract AfriCoin is
    ERC20,
    ERC20Burnable,
    ERC20Pausable,
    ERC20Permit,
    Ownable
{
    // Constants
    uint8 private constant DECIMALS = 18;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event PausedByOwner(address indexed owner, uint256 timestamp);
    event UnpausedByOwner(address indexed owner, uint256 timestamp);
    event Deposit(address indexed user, uint256 ethAmount);

    /**
     * @dev Initialize AfriCoin token
     * Sets token name as "AfriCoin", symbol as "AFRI"
     * Owner is set to the deployer
     */
    constructor() 
        ERC20("AfriCoin", "AFRI") 
        ERC20Permit("AfriCoin") 
    {}

    /**
     * @dev Returns the number of decimals for token display
     * @return uint8 Number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Total supply cap (1 billion AFRI)
     */
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18; // 1 billion with 18 decimals

    /**
     * @dev Mint new AfriCoin tokens
     * Only callable by contract owner
     * Cannot exceed MAX_SUPPLY
     * 
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in wei)
     */
    function mint(address to, uint256 amount) public payable onlyOwner {
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "AfriCoin: exceeds maximum supply"
        );
        require(to != address(0), "AfriCoin: mint to zero address");
        require(amount > 0, "AfriCoin: mint amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Pause all token transfers
     * Only callable by contract owner
     * Used in emergency situations
     */
    function pause() public onlyOwner {
        _pause();
        emit PausedByOwner(owner(), block.timestamp);
    }

    /**
     * @dev Unpause token transfers
     * Only callable by contract owner
     */
    function unpause() public onlyOwner {
        _unpause();
        emit UnpausedByOwner(owner(), block.timestamp);
    }

    /**
     * @dev Burn tokens from sender's balance
     * Can be called by any token holder
     * 
     * @param amount Amount of tokens to burn (in wei)
     */
    function burn(uint256 amount) public override(ERC20Burnable) {
        require(amount > 0, "AfriCoin: burn amount must be greater than 0");
        _burn(_msgSender(), amount);
        emit TokensBurned(_msgSender(), amount);
    }

    /**
     * @dev Burn tokens from a specific address
     * Only callable by token owner of that address or via approval
     * 
     * @param account Account to burn tokens from
     * @param amount Amount to burn
     */
    function burnFrom(address account, uint256 amount)
        public
        override(ERC20Burnable)
    {
        require(amount > 0, "AfriCoin: burn amount must be greater than 0");
        uint256 currentAllowance = allowance(account, _msgSender());
        require(
            currentAllowance >= amount,
            "AfriCoin: insufficient allowance for burn"
        );
        
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * @dev Hook that is called before any token transfer
     * Enforces pause mechanism and handles multiple inheritance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Hook for ERC20Permit support
     * Allows for offline signature-based approvals
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    /**
     * @dev Receive ETH deposits and emit event for backend processing
     * The backend will listen for Deposit events and mint equivalent AFRI tokens
     */
    receive() external payable {
        require(msg.value > 0, "AfriCoin: deposit amount must be greater than 0");
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Explicit deposit function for ETH
     * Allows users to deposit ETH and emit event for backend processing
     */
    function depositETH() external payable {
        require(msg.value > 0, "AfriCoin: deposit amount must be greater than 0");
        require(!paused(), "AfriCoin: deposits disabled when paused");
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Fallback - revert with clear message
     */
    fallback() external payable {
        revert("AfriCoin: use depositETH() to deposit funds");
    }

}