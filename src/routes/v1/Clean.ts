import express, { Request, Response } from "express";
import { SolanaManager } from "../../services/solana/SolanaManager";
import { HeliusManager } from "../../services/solana/HeliusManager";

const router = express.Router();

router.get(
    '/api/v1/clean/:walletAddress/assets',
    async (req: Request, res: Response) => {
		const walletAddress = req.params.walletAddress;

        const assets = await HeliusManager.getAssetsByOwner(walletAddress);

        console.log(assets);

		const response = {
			// assets: assets
		};
	
		res.status(200).send(response);
    }
);

export { router as cleanRouter };
