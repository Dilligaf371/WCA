# Assumptions & Limitations

This document outlines assumptions made during implementation and known limitations.

## D&D Beyond Integration

### Assumption
**D&D Beyond does not have a public API.**

### Current Implementation
- Accepts manual JSON upload via API endpoint
- Supports character ID-based import if API proxy service is configured
- Stores raw import snapshot for audit and re-processing

### Alternatives Considered
1. **Authenticated Scraping Service**: External service that handles D&D Beyond authentication and provides normalized JSON
2. **User Manual Upload**: Users paste/copy character JSON from browser DevTools
3. **Future Official API**: Structure supports official API integration if released

### Impact
- Import process may require manual steps
- Sync checks require API proxy if automated
- Character data format may vary based on source

## IPFS Pinning

### Assumption
**Using Pinata or compatible pinning service for reliable IPFS storage.**

### Current Implementation
- Primary: Pinata API (JWT authentication)
- Fallback: Direct IPFS node connection
- Gateway: Configurable IPFS gateway URL

### Limitations
- Free IPFS nodes may not guarantee persistence
- Pinata free tier has limitations (size, pins)
- Direct IPFS nodes require manual pinning management

### Production Recommendation
- Use paid Pinata service for guaranteed pinning
- Consider IPFS Cluster for redundancy
- Implement backup strategy for critical metadata

## Polygon Blockchain

### Assumption
**Polygon mainnet for production, Mumbai testnet for development.**

### Current Implementation
- Contract deployable to Polygon mainnet
- Mumbai testnet support for development
- Gas costs paid by backend wallet (for minting)

### Limitations
- Gas costs can fluctuate
- Network congestion may delay transactions
- Single contract address per deployment

### Considerations
- Monitor gas prices before minting
- Implement retry logic for failed transactions
- Consider layer 2 alternatives for lower costs

## NFC Tag Format

### Assumption
**NFC UIDs are alphanumeric strings (no standardized format enforced).**

### Current Implementation
- Validates alphanumeric + dashes/underscores
- Stores as string in database
- Immutable once bound

### Limitations
- No validation of actual NFC tag compatibility
- Format may vary by manufacturer
- Physical tag corruption not detectable

### Production Considerations
- Test with actual NFC tags before launch
- Consider NFC Forum standards
- Implement tag verification process

## Ownership Model

### Assumption
**NFT ownership on-chain is the source of truth for authorization.**

### Current Implementation
- Database ownership can be overridden by on-chain verification
- NFC scans verify on-chain ownership
- Database syncs when NFT is transferred

### Edge Cases
- NFT transferred outside platform: Ownership syncs on next verification
- Database and blockchain out of sync: Blockchain wins
- NFT transferred but figurine still bound: Next NFC scan will reject

## Security Model

### Assumption
**Backend controls NFT minting via single signer wallet.**

### Current Implementation
- Only configured minter address can mint
- Private key stored in environment variables
- Contract owner can update minter address

### Security Considerations
- **Private Key Management**: Must use secure secret management in production (AWS Secrets Manager, HashiCorp Vault)
- **Multi-Sig**: Consider multi-sig wallet for production
- **Key Rotation**: Implement key rotation strategy
- **Access Control**: Limit access to minting endpoints

## Data Storage

### Assumption
**Character progression is off-chain for performance and cost reasons.**

### Current Implementation
- Character stats, equipment, spells stored in PostgreSQL
- Only ownership and metadata hash on-chain
- Hash-based integrity verification

### Trade-offs
- **Pros**: Fast updates, low gas costs, rich data
- **Cons**: Reliance on centralized database, less decentralized

### Future Considerations
- Periodically anchor character state hash to blockchain
- Implement decentralized storage (IPFS) for character data
- Consider layer 2 solutions for on-chain character storage

## Authentication

### Assumption
**JWT tokens with email/password authentication is sufficient for MVP.**

### Current Implementation
- Stateless JWT authentication
- Password hashing with bcrypt
- Optional wallet address linking

### Limitations
- No 2FA support
- No OAuth integration
- Password reset not implemented
- No session management

### Production Additions Needed
- Two-factor authentication
- OAuth providers (Google, Discord)
- Password reset flow
- Session refresh mechanism
- Account recovery

## Rate Limiting

### Assumption
**Per-IP rate limiting is sufficient for initial launch.**

### Current Implementation
- Express rate limiter
- 15-minute windows
- 100 requests per window

### Limitations
- Distributed systems may bypass (single Redis instance needed)
- No per-user rate limiting
- No API key-based limits

### Production Enhancements
- Redis-based distributed rate limiting
- Per-user rate limits
- Tiered API access (free, paid, enterprise)
- DDoS protection (Cloudflare, AWS Shield)

## Error Handling

### Assumption
**Explicit error messages help with debugging without exposing internals.**

### Current Implementation
- Detailed errors in development
- Generic messages in production
- Stack traces only in dev mode

### Limitations
- May not capture all edge cases
- Transaction failures need better handling
- Blockchain errors could be more descriptive

## Database Schema

### Assumption
**PostgreSQL with Prisma ORM provides sufficient flexibility and performance.**

### Current Implementation
- Relational schema with foreign keys
- JSON fields for flexible character data
- Indexed on frequently queried fields

### Limitations
- JSON queries less performant than normalized tables
- Complex queries may require raw SQL
- Migrations must be tested carefully

## Testing

### Assumption
**Manual testing is acceptable for MVP, automated tests are post-MVP.**

### Current State
- No automated test suite
- Manual testing required
- Integration tests needed

### Production Requirements
- Unit tests for services
- Integration tests for API
- End-to-end tests for critical flows
- Load testing
- Security testing

## Monitoring

### Assumption
**Console logging is sufficient for MVP, structured logging is post-MVP.**

### Current Implementation
- Console.log for debugging
- Error logging to console
- No structured logging

### Production Requirements
- Structured logging (Winston/Pino)
- Log aggregation (ELK, Datadog)
- Error tracking (Sentry)
- Application performance monitoring
- Blockchain transaction monitoring

## Deployment

### Assumption
**Single-node deployment is acceptable for MVP, scaling comes later.**

### Current Implementation
- Designed for horizontal scaling (stateless API)
- Single database instance
- Single Redis instance (optional)

### Production Deployment
- Container orchestration (Kubernetes)
- Database replication
- Redis cluster
- Load balancing
- CDN for static assets

## Known Limitations

1. **No WebSocket Support**: Real-time updates require polling
2. **No Batch Operations**: Bulk imports/minting not implemented
3. **Limited Admin Tools**: No admin dashboard
4. **No Marketplace Integration**: Secondary sales not tracked
5. **No Multi-Chain**: Only Polygon supported
6. **No Character Progression API**: Stat updates not implemented yet
7. **No Webhooks**: External integrations require polling
8. **Limited Documentation**: API docs need OpenAPI spec

## Migration Path

As the platform evolves, these assumptions may need revisiting:

1. **Scale**: Add caching layers, read replicas, CDN
2. **Security**: Multi-sig, 2FA, OAuth, API keys
3. **Features**: Character progression, marketplace, multi-chain
4. **Observability**: Structured logging, APM, alerts
5. **Testing**: Comprehensive test suite
6. **Automation**: CI/CD, automated deployments
