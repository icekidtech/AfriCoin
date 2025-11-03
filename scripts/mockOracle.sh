#!/bin/bash
# filepath: /home/icekid/Projects/AfriCoin/scripts/test-mockoracle.sh

echo "🧪 Running MockOracle Integration Tests..."
echo "==========================================="

# Set environment variables
export BASE_SEPOLIA_RPC="https://sepolia.base.org"
export VITE_MOCK_ORACLE_ADDRESS="0x23eE4Cf902129A527Ad93Da8813d16693591F776"
export VITE_AFRICOIN_ADDRESS="0x82f3cb249b91523b48FFE531DB55FcdfA931AD92"

# Run backend tests
echo ""
echo "📡 Backend MockOracle Tests:"
cd apps/backend
pnpm test -- src/__tests__/mockOracle.test.ts

# Run frontend tests
echo ""
echo "🎨 Frontend MockOracle Hook Tests:"
cd ../../apps/frontend
pnpm test -- src/__tests__/useMockOracle.test.ts

echo ""
echo "✅ All MockOracle tests completed!"