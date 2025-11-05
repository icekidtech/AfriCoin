import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import api from '@/lib/api';

const SUPPORTED_TOKENS: Record<string, { address?: string; decimals: number }> = {
  ETH: { decimals: 18 },
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
  },
  USDT: {
    address: '0xfA9343C3897324496A05fC75abeAD6dd30C5cf36',
    decimals: 6,
  },
  DAI: {
    address: '0x50c5725949A6F68dEfdeC694C0FFA86aB57FD7B1',
    decimals: 18,
  },
  WETH: {
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
  },
  CBETH: {
    address: '0x2Ae3F1Ec7F1F5012CFEab0411dafAC2D7d47dd3a',
    decimals: 18,
  },
  EURC: {
    address: '0x60a3E35Cc302bDA186D53d013C2271F3B81ceb70',
    decimals: 6,
  },
};

const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const useCryptoDeposit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depositCrypto = useCallback(
    async (
      cryptoSymbol: string,
      amount: string,
      signer: ethers.Signer,
      recipientAddress: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Starting ${cryptoSymbol} deposit: ${amount} to ${recipientAddress}`);

        const userAddress = await signer.getAddress();
        const tokenConfig = SUPPORTED_TOKENS[cryptoSymbol];

        if (!tokenConfig) {
          throw new Error(`Unsupported token: ${cryptoSymbol}`);
        }

        if (cryptoSymbol === 'ETH') {
          // Send native ETH directly to receive() function
          console.log(`Sending native ETH: ${amount} ETH`);
          console.log(`To address: ${recipientAddress}`);
          const amountWei = ethers.parseEther(amount);
          console.log(`Amount in Wei: ${amountWei.toString()}`);

          try {
            console.log('Sending transaction...');
            const tx = await signer.sendTransaction({
              to: recipientAddress,  // ← Explicit address string
              value: amountWei,
            });

            console.log(`✅ Transaction sent. Hash: ${tx.hash}`);
            const receipt = await tx.wait();

            if (!receipt) throw new Error('Transaction failed - no receipt');

            console.log(`✅ ETH deposit confirmed: ${receipt.hash}`);

            return {
              txHash: receipt.hash,
              amount,
              symbol: 'ETH',
              fromAddress: userAddress,
              toAddress: recipientAddress,
            };
          } catch (txError) {
            const errorMsg = txError instanceof Error ? txError.message : 'Transaction failed';
            console.error('❌ Transaction failed:', errorMsg);
            throw new Error(`ETH deposit failed: ${errorMsg}`);
          }
        } else {
          // Send ERC20 token
          if (!tokenConfig.address) {
            throw new Error(`No contract address for ${cryptoSymbol}`);
          }

          console.log(`Sending ERC20 ${cryptoSymbol}: ${amount}`);

          const contract = new ethers.Contract(
            tokenConfig.address,
            ERC20_ABI,
            signer
          );

          const amountWei = ethers.parseUnits(amount, tokenConfig.decimals);

          // Send transfer transaction
          const tx = await contract.transfer(recipientAddress, amountWei);
          console.log(`Transaction sent. Hash: ${tx.hash}`);
          
          const receipt = await tx.wait();

          if (!receipt) throw new Error('Transaction failed - no receipt');

          console.log(`✅ ${cryptoSymbol} transfer confirmed: ${receipt.hash}`);

          return {
            txHash: receipt.hash,
            amount,
            symbol: cryptoSymbol,
            tokenAddress: tokenConfig.address,
            fromAddress: userAddress,
            toAddress: recipientAddress,
          };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Deposit failed';
        setError(errorMsg);
        console.error(`❌ Deposit error: ${errorMsg}`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { depositCrypto, loading, error };
};