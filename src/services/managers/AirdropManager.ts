import { Airdrop, IAirdrop } from "../../entities/airdrop/Airdrop";
import { Status } from "../../models/types";
import { SolanaManager } from "../solana/SolanaManager";
import { AirdropItem, IAirdropItem } from "../../entities/airdrop/AirdropItem";
import { newConnection } from "../../lib/solana";
import * as web3 from "@solana/web3.js";
import { Helpers } from "../helpers/Helpers";

export class AirdropManager {

    static async createAirdrop(title: string, mintToken: string, decimals: number): Promise<IAirdrop> {
        const airdrop = new Airdrop();
        airdrop.title = title;
        airdrop.mintToken = mintToken;
        airdrop.decimals = decimals;
        airdrop.sender = SolanaManager.createWallet();
        airdrop.isFunded = false;
        airdrop.isCompleted = false;
        airdrop.createdAt = new Date();
        await airdrop.save();

        return airdrop;
    }

    static async addWalletToAirdrop(airdropId: string, walletAddress: string, amount: number): Promise<IAirdropItem | undefined> {
        try {
            const item = new AirdropItem();
            item.airdropId = airdropId;
            item.walletAddress = walletAddress;
            item.amount = amount;
            item.fund = { status: Status.CREATED };        
            item.createdAt = new Date();
            await item.save();
    
            return item;    
        }
        catch (err) {
            console.log(err);
        }

        return undefined;
    }

    static async processFundedAirdrops(){
        console.log('processFundedAirdrops');
        const web3Conn = newConnection();

        const airdrops = await Airdrop.find({isFunded: true, isCompleted: false});
        for (const airdrop of airdrops) {
            console.log('processFundedAirdrops airdrop:', airdrop.title);

            const items = await AirdropItem.find({airdropId: airdrop.id, 'fund.status': Status.CREATED}).limit(1000).exec();
            console.log('processFundedAirdrops items:', items.length);
            for (const item of items) {
                console.log('processAirdropItem 1:', item.id);
                await this.processAirdropItem(web3Conn, item.id, airdrop);
                await Helpers.sleep(0.1);
            }
        }
    }

    static async processAirdropItem(web3Conn: web3.Connection, airdropItemId: string, airdrop: IAirdrop) {
        console.log('processAirdropItem 2:', airdropItemId);

        const item = await AirdropItem.findOneAndUpdate({_id: airdropItemId, 'fund.status': Status.CREATED}, {'fund.status': Status.PROCESSING});
        if (!item) {
            console.log('Airdrop item not found:', airdropItemId);
            return;
        }
        console.log('processAirdropItem:', item.amount, 'tokens to', item.walletAddress);

        const senderKeypair = web3.Keypair.fromSecretKey(new Uint8Array(airdrop.sender.privateKey));

        const txData = await SolanaManager.createAirdropItemTransaction(web3Conn, item, airdrop);
        if (txData) {
            let signature: string | undefined;
            try {
                signature = await SolanaManager.partialSignAndSend(web3Conn, txData.tx, senderKeypair);
            }
            catch(err: any){
                if (err instanceof web3.SendTransactionError){
                    console.log('SendTransactionError');
                    console.log('err.message', err.message);

                    await AirdropItem.updateOne({_id: item.id}, { $set: {'fund.status': Status.CREATED} });
                }
                else{
                    console.log('err.message', err.message);

                    await AirdropItem.updateOne({_id: item.id}, { $set: {'fund.status': Status.ERROR} });
                }
            }

            if (signature != undefined){
                await AirdropItem.updateOne({_id: item.id}, { $set: {'fund.signature': signature, 'fund.blockhash': txData.blockhash.blockhash} });
            }
            else{
                await AirdropItem.updateOne({_id: item.id}, { $set: {'fund.blockhash': txData.blockhash.blockhash} });
            }
        }
        else {
            console.log('txData is undefined');
            await AirdropItem.updateOne({_id: item.id}, { $set: {'fund.status': Status.CREATED} });
        }
    }

    static async processProcessingTransactions(){
        const items = await AirdropItem.find({'fund.status': Status.PROCESSING, 'fund.signature': {$ne: undefined}}).limit(50).exec();
        if (items && items.length>0){
            const signatures: string[] = [];

            for (const payment of items) {
                signatures.push(payment.fund!.signature!);
            }

            console.log('AirdropManager', 'processProcessingTransactions', 'signatures', signatures);

            if (signatures.length > 0){
                const web3Conn = newConnection();

                const txs = await web3Conn.getParsedTransactions(signatures);

                for (let index = 0; index < txs.length; index++) {
                    const tx = txs[index];
                    const item = items[index];
                   
                    if (!item.fund){
                        continue;
                    }

                    if (tx == null) {
                        if (item.fund.blockhash){
                            const isBlockhashValid = await SolanaManager.isBlockhashValid(item.fund.blockhash);

                            if (isBlockhashValid == false){
                                item.fund.triesCount = (item.fund.triesCount == undefined) ? 1 : item.fund.triesCount+1;

                                if (item.fund.triesCount > 360){
                                    item.fund.status = Status.ERROR;
                                }

                                await AirdropItem.findByIdAndUpdate(item.id, { $set: {'fund.status': item.fund.status, 'fund.triesCount': item.fund.triesCount} });
                            }
                        }
                    }
                    else {
                        // all good
                        await AirdropItem.findByIdAndUpdate(item.id, { $set: {'fund.status': Status.COMPLETED} });
                    }
                }
            }
        }
    }

    static async checkAirdropItems(airdropId: string) {
        const counts = { completed: 0, created: 0, processing: 0, error: 0, other: 0 };

        const items = await AirdropItem.find({airdropId: airdropId});
        for (const item of items) {
            if (item.fund?.status == Status.CREATED) {
                counts.created++;
            }
            else if (item.fund?.status == Status.PROCESSING) {
                counts.processing++;
            }
            else if (item.fund?.status == Status.COMPLETED) {
                counts.completed++;
            }
            else if (item.fund?.status == Status.ERROR) {
                counts.error++;
            }
            else {
                counts.other++;
            }
        }

        console.log('checkAirdropItems', counts);
    }


}