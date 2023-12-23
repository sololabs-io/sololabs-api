import express, { Request, Response } from "express";

const router = express.Router();

router.get(
    '/api/v1/earn/:walletAddress',
    async (req: Request, res: Response) => {
		const walletAddress = req.params.walletAddress;

        // const nfts = await SolanaManager.getNfts(walletAddress);

		const response = {
			// nfts: nfts
		};
	
		res.status(200).send(response);
    }
);

export { router as cleanRouter };
