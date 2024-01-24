import * as mongoose from 'mongoose';
import { AssetType, TransactionStatus, WalletModel } from '../models/types';

export let Schema = mongoose.Schema;
export let ObjectId = mongoose.Schema.Types.ObjectId;
export let Mixed = mongoose.Schema.Types.Mixed;

export interface IClean extends mongoose.Document {
    walletAddress: string;
    mintToken: string;
    assetType: AssetType;
    fund?: TransactionStatus;

    signerWallet: WalletModel;

    updatedAt?: Date;
    createdAt?: Date;
}

export const CleanSchema = new mongoose.Schema<IClean>({
    walletAddress: { type: String },
    mintToken: { type: String },
    assetType: { type: String },
    fund: { type: Object },

    signerWallet: { type: Object },

    updatedAt: { type: Date, default: new Date() },
    createdAt: { type: Date, default: new Date() }
});

CleanSchema.index({ walletAddress: 1 });

CleanSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    return next();
});

CleanSchema.methods.toJSON = function () {
    return {
        id: this._id,
        walletAddress: this.walletAddress,
        fund: this.fund,
        createdAt: this.createdAt,
    };
};

export const Clean = mongoose.model<IClean>('clean-requests', CleanSchema);