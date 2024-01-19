import * as mongoose from 'mongoose';
import { TransactionStatus, WalletModel } from '../../models/types';

export let Schema = mongoose.Schema;
export let ObjectId = mongoose.Schema.Types.ObjectId;
export let Mixed = mongoose.Schema.Types.Mixed;

export interface IAirdrop extends mongoose.Document {
    title: string;
    mintToken: string;
    decimals: number;
    sender: WalletModel;
    isFunded?: boolean;
    isCompleted?: boolean;

    updatedAt?: Date;
    createdAt?: Date;
}

export const AirdropSchema = new mongoose.Schema<IAirdrop>({
    title: { type: String },
    mintToken: { type: String },
    decimals: { type: Number },
    sender: { type: Object },
    isFunded: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },

    updatedAt: { type: Date, default: new Date() },
    createdAt: { type: Date, default: new Date() }
});

AirdropSchema.index({ isFunded: 1, isCompleted: 1 });

AirdropSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    return next();
});

AirdropSchema.methods.toJSON = function () {
    return {
        id: this._id,
        walletAddress: this.walletAddress,
    };
};

export const Airdrop = mongoose.model<IAirdrop>('airdrops', AirdropSchema);