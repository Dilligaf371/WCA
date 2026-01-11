# WarChain Arena Platform

Production-grade phygital gaming platform that bridges physical NFC-enabled figurines with blockchain-based NFT ownership and D&D character progression.

## 🎯 Core Features

- **D&D Beyond Integration**: Import and sync character sheets from D&D Beyond
- **NFC Figurine Binding**: Link physical NFC tags to user accounts with race condition prevention
- **Polygon NFT Minting**: ERC-721 NFTs with ERC-2981 royalties for figurines
- **Off-Chain Gameplay**: Character progression separated from on-chain ownership
- **Ownership Verification**: Multi-layer security (database + blockchain)
- **Data Integrity**: Hash-based change detection and audit logging

## 🏗️ Tech Stack

- **Backend**: Node.js 20+, TypeScript, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Locks**: Redis
- **Blockchain**: Polygon (ERC-721, ERC-2981)
- **Storage**: IPFS (Pinata-compatible)
- **Authentication**: JWT

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Polygon wallet with MATIC for deployment
- Pinata account (for IPFS) or alternative IPFS node

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd warchain-arena-platform
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/warchain_arena"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
POLYGON_RPC_URL="https://polygon-rpc.com"
POLYGON_PRIVATE_KEY="0x..."

# Optional (for production)
REDIS_URL="redis://localhost:6379"
IPFS_API_URL="https://api.pinata.cloud"
IPFS_JWT_TOKEN="your-pinata-jwt"

# Apple Sign In (optional, see APPLE_SIGNIN_SETUP.md)
VITE_APPLE_CLIENT_ID="com.yourcompany.yourapp"
VITE_APPLE_REDIRECT_URI="http://localhost:5173"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## 📚 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "walletAddress": "0x..." // optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Characters

#### Import Character
```http
POST /api/characters/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "dndBeyondCharacterId": "123456789",
  // OR
  "rawData": { /* D&D Beyond JSON */ }
}
```

#### Get Character Sheet
```http
GET /api/characters/:characterId
Authorization: Bearer <token>
```

### Figurines

#### Bind NFC Tag
```http
POST /api/figurines/bind
Authorization: Bearer <token>
Content-Type: application/json

{
  "nfcUid": "NFC-1234567890",
  "characterId": "char-id" // optional
}
```

#### NFC Scan (Public)
```http
GET /api/figurines/nfc/:nfcUid
```

Returns character data if NFT ownership verified.

### NFTs

#### Mint NFT
```http
POST /api/nfts/mint
Authorization: Bearer <token>
Content-Type: application/json

{
  "figurineId": "figurine-id",
  "recipientAddress": "0x..." // optional, uses linked wallet
}
```

#### Verify Ownership
```http
GET /api/nfts/verify/:figurineId
Authorization: Bearer <token>
```

## 🔧 Smart Contract Deployment

### 1. Install Hardhat (if not installed)

```bash
cd contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Deploy to Polygon

```bash
# Set environment variables
export POLYGON_PRIVATE_KEY=0x...
export ROYALTY_RECIPIENT=0x... # Address to receive royalties
export CONTRACT_OWNER=0x... # Contract owner address

# Deploy
npx hardhat run scripts/deploy.ts --network polygon
```

### 3. Set Minter Address

```bash
export CONTRACT_ADDRESS=0x... # From deployment
export MINTER_ADDRESS=0x... # Backend signer address

npx hardhat run scripts/setMinter.ts --network polygon
```

### 4. Update Backend Config

Add to `.env`:
```env
FIGURINE_CONTRACT_ADDRESS=0x...
```

## 🔐 Security Considerations

1. **JWT Secret**: Use a strong, randomly generated secret (min 32 chars)
2. **Private Key**: Store `POLYGON_PRIVATE_KEY` securely (never commit)
3. **Database**: Use strong PostgreSQL password, limit network access
4. **Redis**: If exposed, use authentication
5. **HTTPS**: Enforce in production
6. **Rate Limiting**: Configured by default, adjust as needed

## 📊 Database Schema

See `prisma/schema.prisma` for full schema. Key models:

- **User**: Platform accounts with wallet addresses
- **Character**: Normalized D&D character data
- **Figurine**: NFC-bound physical figurines
- **AuditLog**: Security and compliance logging

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npm run build
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists: `CREATE DATABASE warchain_arena;`

### Redis Connection Issues
- Redis is optional for basic operations
- NFC binding may fail without Redis (distributed locks)
- Check `REDIS_URL` or start local Redis: `redis-server`

### NFT Minting Fails
- Verify contract is deployed and address set in `.env`
- Check backend wallet has MATIC for gas
- Verify minter address is set correctly
- Check Polygon RPC URL is accessible

### IPFS Upload Fails
- Pinata: Verify JWT token is valid
- Alternative: Configure direct IPFS node
- Check network connectivity

## 📖 Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 🔮 Post-MVP TODOs

- [ ] Character progression API (off-chain stat updates)
- [ ] WebSocket support for real-time updates
- [ ] Admin dashboard and user management
- [ ] Batch operations (bulk import/mint)
- [ ] Marketplace integration tracking
- [ ] Multi-chain support
- [ ] GraphQL API alternative
- [ ] Comprehensive test suite
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Monitoring and alerting setup

## 📝 License

ISC

## 🤝 Contributing

This is a production codebase. Ensure:
- TypeScript types are correct
- Error handling is explicit
- Security best practices are followed
- Database migrations are tested
- Audit logging is maintained
