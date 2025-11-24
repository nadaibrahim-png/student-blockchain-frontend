Student Document Verification - Deploy & Use (Remix)

1) Open Remix in your browser: https://remix.ethereum.org
2) Create a new file named StudentDocumentVerification.sol and paste the contract code.
3) Select the Solidity compiler tab (left) -> Compiler version 0.8.17 (or compatible) -> Compile StudentDocumentVerification.sol
4) In the 'Deploy & Run Transactions' tab:
   - Environment: JavaScript VM (for local testing) OR Injected Provider - MetaMask (to deploy to testnet/mainnet)
   - Make sure MetaMask is connected to the desired network (e.g., Sepolia)
   - Deploy the contract
5) After deployment, copy the contract address and the ABI (from the compiled contract -> ABI)
6) In the frontend (.env), set VITE_VERIFICATION_ADDRESS to the deployed address and paste ABI into src/abi/Verification.json
7) Open the frontend (StackBlitz or local) and use the student verification UI to add and verify records.
