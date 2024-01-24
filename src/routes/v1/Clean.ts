import express, { Request, Response } from "express";
import { HeliusManager } from "../../services/solana/HeliusManager";
import { validateRequest } from "../../middlewares/ValidateRequest";
import { body } from "express-validator";
import { newConnection } from "../../lib/solana";
import { SolanaManager } from "../../services/solana/SolanaManager";
import { Asset, InfoModel, Status, TransactionStatusResponse } from "../../models/types";
import { Clean, IClean } from "../../entities/Clean";
import * as web3 from '@solana/web3.js';
import { BadRequestError } from "../../errors/BadRequestError";

const router = express.Router();

router.get(
    '/api/v1/clean',
    async (req: Request, res: Response) => {
        const items: InfoModel[] = [];
        items.push({ title: '123', subtitle: 'NFTs', color: '#1AFB9C' });
        items.push({ title: '1,402', subtitle: 'cNFTs', color: '#FFEB3B' });
        items.push({ title: '1,234', subtitle: 'Token Accounts', color: '#D85252' });
        items.push({ title: '0.002 SOL', subtitle: 'Already paid', color: '#F087FF' });

        const message = `Let's clean this up!`

        const response = {
            message,
            items
        };
      
        res.status(200).send(response);

    }
);

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

        const sections: {
            id: string,
            title: string,
            assets: Asset[],
        }[] = [];

        const collectionIds: string[] = [];
        for (const asset of assets) {
            if (asset.collection?.id && collectionIds.includes(asset.collection.id) == false){
                collectionIds.push(asset.collection.id);
            }
        }


        // fetch collections and fill assets with collection names
        const collectionsAssets = await HeliusManager.getAssetBatch(collectionIds);
        for (const asset of assets) {
            if (asset.collection){
                const collection = collectionsAssets.find(a => a.id == asset.collection?.id);
                if (collection){
                    asset.collection.title = collection.content.metadata.name;
                }
            }
        }

        for (const asset of assets) {
            const assetCollectionId = asset.collection?.id || 'other';
            const assetCollectionTitle = asset.collection?.title || 'Other';

            const section = sections.find(s => s.id == assetCollectionId);
            if (section){
                section.assets.push(asset);
            }
            else {
                sections.push({
                    id: assetCollectionId,
                    title: assetCollectionTitle,
                    assets: [asset],
                });
            }
        }

        //TODO: add empty tokens accounts
        //TODO: add "Tokens" category and add all SPL tokens there

        const response = {
            // interfaces,
            assets: sections
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
        const assets: Asset[] = HeliusManager.parseAssets(onChainAssets);

        const cleanRequests: IClean[] = [];
        for (const asset of assets) {
            const cleanRequest = new Clean();
            cleanRequest.walletAddress = walletAddress;
            cleanRequest.mintToken = asset.id;
            cleanRequest.assetType = asset.type;
            cleanRequest.fund = { status: Status.CREATED };
            cleanRequest.signerWallet = SolanaManager.createWallet();
            cleanRequest.createdAt = new Date();
            await cleanRequest.save();

            cleanRequests.push(cleanRequest);
        }

        // const assets = HeliusManager.parseAssets(onChainAssets);
        const web3Conn = newConnection();
        const blockhash = await web3Conn.getLatestBlockhash();
        const transactions: string[] = [];

        for (let index = 0; index < onChainAssets.length; index++) {
            const onChainAsset = onChainAssets[index];
            const asset = assets[index];
            const cleanRequest = cleanRequests[index];
            
            console.log(onChainAsset);
            const signerPrivateKey = web3.Keypair.fromSecretKey(new Uint8Array(cleanRequest.signerWallet.privateKey));
            const memo = undefined;// cleanRequest.id;
            const txData = await SolanaManager.createBurnAssetTransaction(web3Conn, onChainAsset, signerPrivateKey, memo, blockhash);
            if (txData){
                let encodedTransction = txData.tx.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false,
                });
                const encodedTransctionString = JSON.stringify(encodedTransction.toJSON());
                transactions.push(encodedTransctionString);
            }
        }

        const cleanRequestsIds = cleanRequests.map(r => r.id);

        const response = {
            id: cleanRequestsIds.join(','),
            transactions
        };
      
        res.status(200).send(response);
    }
);

router.post(
    '/api/v1/clean/:ids/claim',
    [
		body("transactions").isArray().notEmpty().withMessage("transactions are required"),
    ],
    validateRequest,
	async (req: Request, res: Response) => {
		const ids = req.params.ids;
		const encodedTransctions: string[] = req.body.transactions;

        const entityIds = ids.split(',');
        const entities = await Clean.find({ _id: { $in: entityIds } }).exec();

        if (entities.length != encodedTransctions.length){
            throw new BadRequestError('Counts mismatch');
        }

        for (const entity of entities) {
            if (entity.fund?.status != Status.CREATED){
                throw new BadRequestError('Entity not found');
            }            
        }

        const statusses: TransactionStatusResponse[] = [];

        for (const encodedTransction of encodedTransctions) {
            const transaction = web3.Transaction.from(Buffer.from(JSON.parse(encodedTransction)));

            let entity: IClean | undefined;
            for (const item of entities) {
                if (item.signerWallet){
                    const isTransactionContainSigner = await SolanaManager.isTransactionContainSigner(transaction, item.signerWallet.publicKey, true);
                    if (isTransactionContainSigner){
                        entity = item;
                        break;
                    }    
                }
            }

            if (!entity){
                continue;
            }

            // Sign tx
            // const signerPrivateKey = web3.Keypair.fromSecretKey(new Uint8Array(entity.signerWallet.privateKey));
    
            const web3Conn = newConnection();
            let signature: string | undefined;
            try {
                signature = await SolanaManager.partialSignAndSend(web3Conn, transaction, undefined);			
            }
            catch(err: any){
                if (err instanceof web3.SendTransactionError){
                    console.log('SendTransactionError');
                    console.log('err.message', err.message);
    
                    //LogManager.logPayment(`Deposit SendTransactionError: ${err.message}`, deposit.id, 'deposit_error_2');
    
                    await Clean.findByIdAndUpdate(entity.id, { $set: {'fund.status': Status.ERROR} });
                    // throw new BadRequestError('Try again');
                }
            }
    
            if (signature != undefined){
                await Clean.findByIdAndUpdate(entity.id, { $set: {'fund.status': Status.PROCESSING, 'fund.blockhash': transaction.recentBlockhash, 'fund.signature': signature} });
            }
             
            statusses.push({
                id: entity.id,
                signature: signature,
            });
        }

		const response = {
			statusses: statusses,
		};
	
		res.status(200).send(response);
    }
);

router.get(
    '/api/v1/clean/:ids/status',
    async (req: Request, res: Response) => {
		const entityIds = req.params.ids;
        const ids = entityIds.split(',');

        const entities = await Clean.find({ _id: { $in: ids } }).exec();
        if (!entities || entities.length == 0){
            throw new BadRequestError('Entities not found');
        }

        const statusses: TransactionStatusResponse[] = [];
        for (const entity of entities) {
            statusses.push({
                id: entity.id,
                status: entity.fund?.status,
            });
        }

		const response = {
			statusses: statusses
		};
	
		res.status(200).send(response);
    }
);

export { router as cleanRouter };
