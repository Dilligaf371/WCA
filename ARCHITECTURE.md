# WarChain Arena Platform - Architecture Documentation

## Overview

WarChain Arena (WCA) is a production-grade phygital gaming platform that bridges physical NFC-enabled figurines with blockchain-based NFT ownership and D&D character progression. The platform separates on-chain ownership from off-chain gameplay logic while maintaining data integrity and security.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  (React/React Native, Unity Mobile Game, Web3 Wallets)      │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Express.js)                  │
│  - Authentication (JWT)                                      │
│  - Rate Limiting                                            │
│  - Request Validation                                        │
│  - Ownership Verification                                    │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ D&D Beyond   │  │   Figurine   │  │   NFT Mint   │      │
│  │  Importer    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │     IPFS     │  │ Blockchain   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────┬───────────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐      ┌──────────────┐
│PostgreSQL│      │    Redis     │
│ (Prisma) │      │ (Cache/Locks)│
└─────────┘      └──────────────┘
    │
    ▼
┌─────────────────────────────────┐
│      Polygon Blockchain         │
│  - ERC-721 NFT Contract         │
│  - Ownership Records            │
│  - Royalty Support (ERC-2981)   │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│         IPFS Network            │
│  - NFT Metadata Storage         │
│  - Character Data Snapshots     │
│  (Pinata-compatible gateway)    │
└─────────────────────────────────┘
```

## Core Domain Models

### 1. User
- **Purpose**: Platform user account with wallet address
- **Key Fields**: `id`, `email`, `passwordHash`, `walletAddress`, `roles`
- **Relationships**: Owns multiple Figurines and Characters

### 2. Figurine
- **Purpose**: Physical NFC-enabled figurine linked to user
- **Key Fields**: `id`, `nfcUid` (unique, immutable), `ownerId`, `tokenId`, `contractAddress`, `linkedCharacterId`
- **Relationships**: Belongs to User, optionally linked to Character
- **Constraints**: NFC UID is immutable once bound

### 3. Character (WCA Canonical)
- **Purpose**: Normalized character data from D&D Beyond
- **Key Fields**: `id`, `dndBeyondCharacterId`, `name`, `class`, `level`, `baseStats`, `derivedStats`, `equipment`, `spells`, `syncHash`, `lastDndBeyondHash`
- **Relationships**: Owned by User, optionally linked to Figurine
- **Data Integrity**: Hash-based sync detection

### 4. NFT (On-Chain)
- **Storage**: Polygon blockchain (ERC-721)
- **On-Chain Data**: Ownership + metadata URI (IPFS hash)
- **Off-Chain Data**: Full character stats, progression, equipment
- **Royalties**: ERC-2981 standard (5% default)

### 5. AuditLog
- **Purpose**: Track all critical operations for security/compliance
- **Actions**: Character import, NFT mint, Figurine bind, Ownership verification
- **Fields**: `action`, `userId`, `characterId`, `figurineId`, `metadata`, `ipAddress`

## Data Flow

### Character Import Flow
```
1. User submits D&D Beyond character ID or JSON
2. DndBeyondImporter fetches/normalizes data
3. Hash comparison detects changes
4. Character record created/updated in PostgreSQL
5. Raw import snapshot stored
6. Audit log entry created
```

### NFT Minting Flow
```
1. User requests NFT mint for figurine
2. Ownership verification (database + on-chain if exists)
3. Character metadata normalized for NFT
4. Metadata uploaded to IPFS
5. IPFS URI received
6. NFT minted on Polygon via smart contract
7. Transaction receipt captured
8. Database updated with tokenId and contractAddress
9. Audit log entry created
```

### NFC Scan Flow
```
1. Physical figurine NFC tag scanned
2. NFC UID extracted
3. Figurine lookup in database
4. If NFT exists: On-chain ownership verification
5. If ownership verified: Return character data
6. If ownership fails: Reject scan (NFT transferred)
```

## Security Architecture

### Authentication & Authorization
- **JWT-based**: Stateless tokens with user ID and roles
- **Password Hashing**: bcrypt with configurable rounds (default: 12)
- **Wallet Verification**: Ethereum address format validation

### Ownership Verification
- **Database Level**: Foreign key constraints, row-level checks
- **Application Level**: Middleware validates ownership before operations
- **Blockchain Level**: On-chain verification for NFT operations
- **Separation**: NFT ownership can differ from database ownership (handled via sync)

### Race Condition Prevention
- **Redis Distributed Locks**: NFC binding operations use locks
- **Database Transactions**: Atomic operations for critical updates
- **Idempotency**: Operations can be safely retried

### Data Integrity
- **Hash-based Sync**: SHA-256 hashes detect D&D Beyond changes
- **Immutable NFC UIDs**: Once bound, cannot be reused
- **Audit Trail**: All critical operations logged
- **On-Chain Verification**: NFT ownership verified from blockchain

## API Design Principles

1. **RESTful Structure**: Clear resource-based endpoints
2. **Consistent Responses**: `{ success: boolean, data?: any, error?: string }`
3. **Authentication Required**: Most endpoints require JWT (except public NFC scan)
4. **Ownership Validation**: Middleware ensures users can only access their resources
5. **Error Handling**: Explicit error messages without exposing internals

## Blockchain Integration

### Smart Contract Features
- **ERC-721 Standard**: Full NFT compatibility
- **ERC-2981 Royalties**: 5% default, configurable per token
- **Minter Restriction**: Only backend signer can mint
- **Metadata URI**: IPFS links stored on-chain
- **Ownership Tracking**: On-chain owner is source of truth

### Off-Chain vs On-Chain Separation
- **On-Chain**: Ownership, metadata hash, royalties
- **Off-Chain**: Character stats, progression, equipment, game state
- **Benefit**: Lower gas costs, faster updates, richer data

## Assumptions & Limitations

### D&D Beyond Integration
**ASSUMPTION**: D&D Beyond does not have a public API.
- **Current Implementation**: Accepts manual JSON upload or assumes proxy service
- **Future Options**:
  1. Authenticated scraping service
  2. Official API (if released)
  3. User-manual upload via UI

### IPFS Pinning
**ASSUMPTION**: Using Pinata or compatible service for reliable pinning.
- **Fallback**: Direct IPFS node (less reliable)
- **Production**: Use paid Pinata service for guaranteed availability

### Polygon Network
**ASSUMPTION**: Mainnet Polygon for production.
- **Testnet**: Mumbai supported for development
- **Gas Costs**: User responsible for gas fees (backend pays for minting)

### NFC Tag Format
**ASSUMPTION**: NFC UIDs are alphanumeric strings.
- **Format**: Validated but not standardized
- **Production**: Consider NFC Forum standards

## Scalability Considerations

1. **Database**: PostgreSQL with proper indexing
2. **Caching**: Redis for frequently accessed data
3. **Rate Limiting**: Per-IP limits on API endpoints
4. **Stateless API**: Horizontal scaling enabled
5. **Blockchain**: Decentralized, no scaling concerns for reads

## Deployment Architecture

### Production Setup
- **Backend**: Node.js on containerized environment (Docker/Kubernetes)
- **Database**: Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **Redis**: Managed Redis cluster
- **IPFS**: Pinata paid service
- **Blockchain**: Polygon mainnet via Infura/Alchemy
- **Load Balancer**: Nginx or cloud load balancer
- **Monitoring**: Application logging, error tracking (Sentry)

## Security Checklist

- [x] JWT authentication with secure secrets
- [x] Password hashing (bcrypt)
- [x] Input validation
- [x] SQL injection prevention (Prisma ORM)
- [x] Rate limiting
- [x] CORS configuration
- [x] Ownership verification middleware
- [x] Audit logging
- [x] Environment variable security
- [x] Private key management (backend wallet)
- [ ] HTTPS enforcement (production)
- [ ] API key rotation
- [ ] Database encryption at rest
- [ ] Regular security audits

## Future Enhancements (Post-MVP)

1. **Character Progression System**: Off-chain stat updates after game sessions
2. **Marketplace Integration**: Secondary NFT sales tracking
3. **Multi-Chain Support**: Ethereum, Arbitrum, etc.
4. **WebSocket API**: Real-time character updates
5. **Batch Operations**: Bulk character import, bulk NFT minting
6. **Admin Dashboard**: User management, analytics
7. **Webhook System**: Notify external services of events
8. **GraphQL API**: Alternative to REST for complex queries
9. **Character Templates**: Pre-built character archetypes
10. **Achievement System**: Track character milestones
