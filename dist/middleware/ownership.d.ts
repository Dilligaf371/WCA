import { Request, Response, NextFunction } from 'express';
/**
 * Ownership validation middleware
 * Verifies that the authenticated user owns the requested resource
 */
/**
 * Verify user owns a character
 */
export declare function verifyCharacterOwnership(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Verify user owns a figurine
 */
export declare function verifyFigurineOwnership(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Verify NFT ownership on-chain
 * For operations that require current NFT ownership (not just database ownership)
 */
export declare function verifyNFTOwnership(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Verify NFC scan authorization
 * For NFC scan operations - requires NFT ownership if NFT exists
 */
export declare function verifyNFCScanAuthorization(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=ownership.d.ts.map