# Solana Token Kit

## Overview

Solana Token Kit used for creating and managing Solana SPL Tokens. Functionality includes

- creating SPL Token
- create Openbook Market
- create, seed and snipe liquidity pool
- airdrop tokens
- transfer solana to/from wallets
- monitor multiple wallets to sell
- start volume bot
- snipe tokens prelaunch
- create multiple wallets

## Requirements

- [Node](https://nodejs.org/en)
- [Jito API access](https://jito-labs.gitbook.io/mev/searcher-resources/getting-started)
- RPC Node

## Installation

```bash
npm run install
```

## Run commands

All commands are stored as scripts in `package.json`.

```bash
npm run createToken
```

## Configuration

Configuration is currently stored within the `config/` directory as well as defined as constants within each script.
