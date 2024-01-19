import { AirdropItem } from "../entities/airdrop/AirdropItem";
import { Status } from "../models/types";
import { AirdropManager } from "./managers/AirdropManager";
import fs from "fs";
import { SolanaManager } from "./solana/SolanaManager";

export class MigrationManager {

    static async migrate() {

        // await this.createBeakAirdrop();
        // const airdropId = '65aadb0de3faf5f9c4d74c3b';
        // await AirdropManager.checkAirdropItems(airdropId);

        // await this.createAirdropWallets(airdropId);
        // for (let i = 0; i < 100; i++) {        
            // await AirdropManager.processProcessingTransactions();
        // }
        // await AirdropManager.processFundedAirdrops();

        // await AirdropItem.updateMany({airdropId: airdropId, 'fund.status': Status.PROCESSING}, { $set: {'fund.status': Status.CREATED} });
        // await AirdropItem.updateMany({airdropId: airdropId, 'fund.status': Status.ERROR}, { $set: {'fund.status': Status.CREATED} });

        // await AirdropManager.checkAirdropItems(airdropId);

        
    }

    static async createBeakAirdrop() {
        const airdrop = await AirdropManager.createAirdrop('Beak Airdrop #2', '5zrskpWuxLzumWtUGDPcAMwTrGuZbP45iig6QBZ1DTaM', 9);
        console.log(airdrop.title, 'created!', 'Airdrop ID:', airdrop.id, 'Airdrop wallet:', airdrop.sender.publicKey);
    }

    static async createAirdropWallets(airdropId: string) {
        const data = fs.readFileSync(`json/airdrop-${airdropId}.json`, 'utf-8');
        const wallets: {walletAddress: string, amount: number}[] = JSON.parse(data);
        console.log('createAirdropWallets wallets:', wallets);
        for (const wallet of wallets) {
            await AirdropManager.addWalletToAirdrop(airdropId, wallet.walletAddress, wallet.amount);            
        }
    }

}