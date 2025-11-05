#!/bin/bash

echo "🧪 Running MockOracle Integration Tests..."
echo "==========================================="

export BASE_SEPOLIA_RPC="https://base-sepolia.g.alchemy.com/v2/LLyZTy4qCwgzsKzLL6qDC"
export VITE_MOCK_ORACLE_ADDRESS="0x24f4294D2422a3bD33e187eEe0c89823Fe77970B"
export VITE_AFRICOIN_ADDRESS="0x3f2f327cF9D276A81D5f16297a5866B99fCFD772"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "📡 Backend MockOracle Tests:"
cd "$ROOT_DIR/apps/backend" || exit 1
pnpm test -- src/__tests__/mockOracle.test.ts
BACKEND_RESULT=$?

echo ""
echo "🎨 Frontend MockOracle Hook Tests:"
cd "$ROOT_DIR/apps/frontend" || exit 1

if [ -f "src/__tests__/useMockOracle.test.ts" ]; then
  pnpm test -- "src/__tests__/useMockOracle.test.ts" --run
  FRONTEND_RESULT=$?  pnpm test -- "src/__tests__/useMockOracle.test.ts" --run

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