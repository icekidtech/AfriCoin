```
Expected output:

AfriCoin
  ✓ Deployment
    ✓ Should have correct name and symbol
    ✓ Should have 18 decimals
    ✓ Should set the owner
    ✓ Should have zero initial supply
    ✓ Should not be paused initially
  ✓ Minting
    ✓ Should mint tokens to an address
    ✓ Should emit TokensMinted event on mint
    ✓ Should only allow owner to mint
    ✓ Should not mint to zero address
    ✓ Should not mint zero amount
  ✓ Burning
    ✓ Should burn tokens from sender
    ✓ Should emit TokensBurned event on burn
    ✓ Should not burn zero amount
    ✓ Should not burn more than balance
  ✓ Pause/Unpause
  ✓ Transfers
  ✓ Permit (Gasless Approvals)

AfriDAO
  ✓ Deployment
  ✓ Proposing
  ✓ Voting
  ✓ State Transitions

✅ AfriCoin (21 passing)
✅ AfriDAO (6 passing)

27 passing (8s) ✅
```