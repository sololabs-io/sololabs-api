import { AirdropItem } from "../entities/airdrop/AirdropItem";
import { Status } from "../models/types";
import { AirdropManager } from "./managers/AirdropManager";
import fs from "fs";
import { SolanaManager } from "./solana/SolanaManager";
import { Airdrop } from "../entities/airdrop/Airdrop";

export class MigrationManager {

    static async migrate() {

        // const airdropId = '65aed1eb005a56d7cf309e36';
        // // const res = await AirdropItem.updateMany({ 'fund.status': Status.PROCESSING, airdropId: airdropId }, { $set: { 'fund.status': Status.CREATED } });

        // // await this.createStakeShitAirdrop();
        // await this.test(airdropId, Status.COMPLETED);
        // await this.test(airdropId, Status.PROCESSING);
        // await this.test(airdropId, Status.CREATED);
        // await this.test(airdropId, Status.ERROR);
        // await AirdropManager.checkAirdropItems(airdropId);
        // await this.createAirdropWallets(airdropId);

        // await AirdropManager.processFundedAirdrops();
        // await AirdropManager.processProcessingTransactions();

        // await AirdropManager.checkAirdropItems(airdropId);

        console.log('MigrationManager', 'migrate', 'done');
    }

    // static async createShitAirdrop() {
    //     const airdrop = await AirdropManager.createAirdrop('Shit Airdrop #1', 'DQLLBAuoL8LCTo1JaHC9hmFG4iJtLFEy6Ryg9qb1YFXn', 5);
    //     console.log(airdrop.title, 'created!', 'Airdrop ID:', airdrop.id, 'Airdrop wallet:', airdrop.sender.publicKey);
    // }

    static async createStakeShitAirdrop() {
        const airdrop = await AirdropManager.createAirdrop('stakeSHIT Airdrop', 'BDvAL46gXuZHVY7RWyYTEiqJyQZ7DqpmLjTSkepWeG9s', 5);
        console.log(airdrop.title, 'created!', 'Airdrop ID:', airdrop.id, 'Airdrop wallet:', airdrop.sender.publicKey);
    }

    static async createAirdropWallets(airdropId: string) {
        const data = fs.readFileSync(`json/airdrop-${airdropId}.json`, 'utf-8');
        const wallets: {walletAddress: string, amount: number}[] = JSON.parse(data);
        console.log('createAirdropWallets wallets:', wallets);
        let totalTokensAmount = 0;
        for (const wallet of wallets) {
            const newAmount = Math.floor(wallet.amount * 100000) / 100000;
            totalTokensAmount += newAmount;
            await AirdropManager.addWalletToAirdrop(airdropId, wallet.walletAddress, newAmount);            
        }
        console.log('totalTokensAmount:', totalTokensAmount);
    }

    static async test(airdropId: string, status: Status){
        const items = await AirdropItem.find({airdropId: airdropId, "fund.status": status}).exec();
        let total = 0;
        for (const item of items) {
            total += item.amount;
        }
        console.log('total left (', status, '):', total);
    }

}