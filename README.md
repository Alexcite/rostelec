# Decentralized Voting System

This project is a minimal decentralized voting application built on top of **Scaffold-ETH 2**.  
It demonstrates how to build, deploy and interact with a smart contract that allows users to create proposals, vote on them, and track results on-chain.

## Features

### Smart Contract (`VotingSystem.sol`)
- Anyone can create a proposal with a description.
- Each wallet can vote once per proposal.
- Live yes/no vote counts stored on chain.
- Owner (deployer) can finish proposals.

### Frontend
- Home page explaining the app.
- /voting page:
  - Create proposals
  - Vote yes/no
  - View results
  - Finish proposal (owner only)

## Project Structure

```
my_project_nft-main/
  └── my_project_nft-main/
      ├── README.md
      ├── packages/
      │   ├── hardhat/
      │   │   ├── contracts/VotingSystem.sol
      │   │   └── deploy/03_deploy_voting.ts
      │   ├── nextjs/app/page.tsx
      │   ├── nextjs/app/voting/page.tsx
      │   └── nextjs/components/Header.tsx
```

## Installation and Running Locally

### 1. Install dependencies
```bash
yarn install
```

### 2. Start local blockchain
```bash
yarn chain
```

### 3. Deploy the contract
```bash
yarn deploy --tags VotingSystem
```

### 4. Run the frontend
```bash
yarn start
```

### 5. Use the App
Go to http://localhost:3000 and navigate to **Voting**.
