// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockOracle
 * @dev Mock price oracle for testing stability engine
 * Returns simulated FX/commodity prices
 */
contract MockOracle {
    // Mock price data (in wei)
    mapping(bytes32 => uint256) public prices;
    
    // Mock price history
    mapping(bytes32 => uint256[]) public priceHistory;
    
    // Owner
    address public owner;

    event PriceUpdated(bytes32 indexed pair, uint256 price);

    constructor() {
        owner = msg.sender;
        
        // Initialize mock prices (in wei, scaled to 18 decimals)
        // 1 AFRI = $0.0001
        // So: 1 USD = 10,000 AFRI
        prices[keccak256("USD/AFRI")] = 10000e18;
        
        // Add ETH/USD price for dynamic conversion
        // 1 ETH = $2,500 USD (you can adjust this)
        prices[keccak256("ETH/USD")] = 2500e18;
        
        // Other fiat pairs...
        prices[keccak256("EUR/AFRI")] = 11000e18;
        prices[keccak256("KES/AFRI")] = 80e18;       // 1 KES ≈ 0.008 USD
        prices[keccak256("NGN/AFRI")] = 13e18;       // 1 NGN ≈ 0.0013 USD
        prices[keccak256("GBP/AFRI")] = 12500e18;    // 1 GBP ≈ 1.25 USD
        prices[keccak256("ZAR/AFRI")] = 530e18;      // 1 ZAR ≈ 0.053 USD
        
        // Crypto conversions (1 stablecoin = 10,000 AFRI)
        prices[keccak256("USDC/AFRI")] = 10000e18;
        prices[keccak256("USDT/AFRI")] = 10000e18;
        
        // ETH conversion (1 ETH = ~$2500, so 25,000,000 AFRI)
        prices[keccak256("ETH/AFRI")] = 25000000e18;
        
        // Other Base tokens
        prices[keccak256("DAI/AFRI")] = 10000e18;     // 1 DAI ≈ 1 USD
        prices[keccak256("CBETH/AFRI")] = 25000000e18; // Coinbase wrapped ETH
        prices[keccak256("WETH/AFRI")] = 25000000e18;  // Wrapped ETH
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "MockOracle: only owner");
        _;
    }

    /**
     * @dev Get latest price for a currency pair
     * @param pair Currency pair (e.g., "USD/AFRI")
     * @return price Latest price in wei
     */
    function getLatestPrice(bytes32 pair) external view returns (uint256) {
        uint256 price = prices[pair];
        require(price > 0, "MockOracle: price not found");
        return price;
    }

    /**
     * @dev Update price for a currency pair
     * @param pair Currency pair
     * @param price New price in wei
     */
    function setPrice(bytes32 pair, uint256 price) external onlyOwner {
        require(price > 0, "MockOracle: price must be positive");
        prices[pair] = price;
        priceHistory[pair].push(price);
        emit PriceUpdated(pair, price);
    }

    /**
     * @dev Get price history for a pair
     * @param pair Currency pair
     * @return history Array of historical prices
     */
    function getPriceHistory(bytes32 pair)
        external
        view
        returns (uint256[] memory)
    {
        return priceHistory[pair];
    }

    /**
     * @dev Simulate price volatility
     * Adds random fluctuation to mock price
     * @param pair Currency pair
     * @param volatilityPercent Volatility as percentage (e.g., 5 for ±5%)
     */
    function simulateVolatility(bytes32 pair, uint256 volatilityPercent)
        external
        onlyOwner
    {
        require(volatilityPercent <= 100, "MockOracle: volatility too high");
        
        uint256 currentPrice = prices[pair];
        require(currentPrice > 0, "MockOracle: price not found");

        // Simple pseudo-random volatility
        uint256 change = (currentPrice * volatilityPercent) / 100;
        uint256 direction = (block.timestamp % 2 == 0) ? 1 : 0;

        if (direction == 1) {
            prices[pair] = currentPrice + change;
        } else {
            prices[pair] = currentPrice - change;
        }

        priceHistory[pair].push(prices[pair]);
        emit PriceUpdated(pair, prices[pair]);
    }
}