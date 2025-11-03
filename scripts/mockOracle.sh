#!/bin/bash

echo "🧪 Running MockOracle Integration Tests..."
echo "==========================================="

# Set environment variables
export BASE_SEPOLIA_RPC="https://sepolia.base.org"
export VITE_MOCK_ORACLE_ADDRESS="0x23eE4Cf902129A527Ad93Da8813d16693591F776"
export VITE_AFRICOIN_ADDRESS="0x82f3cb249b91523b48FFE531DB55FcdfA931AD92"

# Get the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Run backend tests
echo ""
echo "📡 Backend MockOracle Tests:"
cd "$ROOT_DIR/apps/backend" || exit 1
pnpm test -- src/__tests__/mockOracle.test.ts
BACKEND_RESULT=$?

# Run frontend tests
echo ""
echo "🎨 Frontend MockOracle Hook Tests:"
cd "$ROOT_DIR/apps/frontend" || exit 1

if [ -f "src/__tests__/useMockOracle.test.ts" ]; then
  pnpm test -- src/__tests__/useMockOracle.test.ts
  FRONTEND_RESULT=$?
else
  echo "⏭️  Frontend MockOracle tests not yet implemented (skipping)"
  FRONTEND_RESULT=0
fi

echo ""
if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ]; then
  echo "✅ All MockOracle tests completed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi