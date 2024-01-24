import * as mongoose from 'mongoose';
import { TransactionStatus, WalletModel } from '../../models/types';

export let Schema = mongoose.Schema;
export let ObjectId = mongoose.Schema.Types.ObjectId;
export let Mixed = mongoose.Schema.Types.Mixed;

export interface IAirdropItem extends mongoose.Document {
    airdropId: string;
    walletAddress: string;
    amount: number;
    fund?: TransactionStatus;

    updatedAt?: Date;
    createdAt?: Date;
}

export const AirdropItemSchema = new mongoose.Schema<IAirdropItem>({
    airdropId: { type: String },
    walletAddress: { type: String },
    amount: { type: Number },
    fund: { type: Object },

    updatedAt: { type: Date, default: new Date() },
    createdAt: { type: Date, default: new Date() }
});

AirdropItemSchema.index({ airdropId: 1, walletAddress: 1 }, { unique: true });
AirdropItemSchema.index({ airdropId: 1 });
AirdropItemSchema.index({ airdropId: 1, 'fund.status': 1 });
AirdropItemSchema.index({ 'fund.status': 1, 'fund.signature': 1 });
AirdropItemSchema.index({ airdropId: 1, 'fund.status': 1, 'fund.signature': 1 });

AirdropItemSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    return next();
});

AirdropItemSchema.methods.toJSON = function () {
    return {
        id: this._id,
        walletAddress: this.walletAddress,
    };
};

export const AirdropItem = mongoose.model<IAirdropItem>('airdrops-items', AirdropItemSchema);