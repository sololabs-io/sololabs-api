import { AirdropItem } from "../entities/airdrop/AirdropItem";
import { Status } from "../models/types";
import { AirdropManager } from "./managers/AirdropManager";
import fs from "fs";
import { SolanaManager } from "./solana/SolanaManager";

export class MigrationManager {

    static async migrate() {

        // await this.createShitAirdrop();
        // const airdropId = '65ab75024c0d584bfa4a33c4';
        // await AirdropManager.checkAirdropItems(airdropId);

        // await this.createAirdropWallets(airdropId);
        // for (let i = 0; i < 100; i++) {        
            // await AirdropManager.processProcessingTransactions();
        // }
        // await AirdropManager.processFundedAirdrops();

        // await AirdropItem.updateMany({airdropId: airdropId, 'fund.status': Status.PROCESSING}, { $set: {'fund.status': Status.CREATED} });
        // await AirdropItem.updateMany({airdropId: airdropId, 'fund.status': Status.ERROR}, { $set: {'fund.status': Status.CREATED} });

        // await AirdropManager.checkAirdropItems(airdropId);

        console.log('MigrationManager', 'migrate', 'done');
    }

    static async createShitAirdrop() {
        const airdrop = await AirdropManager.createAirdrop('Shit Airdrop #1', 'DQLLBAuoL8LCTo1JaHC9hmFG4iJtLFEy6Ryg9qb1YFXn', 5);
        console.log(airdrop.title, 'created!', 'Airdrop ID:', airdrop.id, 'Airdrop wallet:', airdrop.sender.publicKey);
    }

    static async createAirdropWallets(airdropId: string) {
        const data = fs.readFileSync(`json/airdrop-${airdropId}.json`, 'utf-8');
        const wallets: {walletAddress: string, amount: number}[] = JSON.parse(data);
        console.log('createAirdropWallets wallets:', wallets);
        let totalTokensAmount = 0;
        for (const wallet of wallets) {
            const newAmount = Math.floor(wallet.amount * 0.69 * 100000) / 100000;
            totalTokensAmount += newAmount;
            await AirdropManager.addWalletToAirdrop(airdropId, wallet.walletAddress, newAmount);            
        }
        console.log('totalTokensAmount:', totalTokensAmount);
    }

}