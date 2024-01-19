import express, { Request, Response } from "express";
import { HeliusManager } from "../../services/solana/HeliusManager";
import { validateRequest } from "../../middlewares/ValidateRequest";
import { body } from "express-validator";
import { newConnection } from "../../lib/solana";
import { SolanaManager } from "../../services/solana/SolanaManager";

const router = express.Router();

router.get(
    '/api/v1/clean/:walletAddress/assets',
    async (req: Request, res: Response) => {
		const walletAddress = req.params.walletAddress;
        const onChainAssets = await HeliusManager.getAssetsByOwner(walletAddress);

        // console.log(onChainAssets);

        const interfaces: string[] = [];
        for (const asset of onChainAssets) {
          if (interfaces.includes(asset.interface) == false){
            interfaces.push(asset.interface);
          }
        }

        const assets = HeliusManager.parseAssets(onChainAssets);

        //TODO: split into categories
        //TODO: add empty tokens accounts
        //TODO: add Tokens category

        const response = {
          interfaces,
            // assets: onChainAssets
        };
      
        res.status(200).send(response);
    }
);

router.post(
    '/api/v1/clean/:walletAddress',
    [
        body('ids').isArray().withMessage('ids must be valid')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
    const walletAddress = req.params.walletAddress;
        const ids: string[] = req.body.ids;

        console.log('ids:', ids);

        const onChainAssets = await HeliusManager.getAssetBatch(ids);
        // const assets = HeliusManager.parseAssets(onChainAssets);
        const web3Conn = newConnection();
        const blockhash = await web3Conn.getLatestBlockhash();
        const transactions: string[] = [];

        for (const asset of onChainAssets) {
          console.log(asset);
          const txData = await SolanaManager.createBurnAssetTransaction(web3Conn, asset, blockhash);
          if (txData){
              let encodedTransction = txData.tx.serialize({
                  requireAllSignatures: false,
                  verifySignatures: false,
              });
              const encodedTransctionString = JSON.stringify(encodedTransction.toJSON());
              transactions.push(encodedTransctionString);
          }
        }

        const response = {
          transactions
        };
      
        res.status(200).send(response);
    }
);

export { router as cleanRouter };
