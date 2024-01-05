import * as mongoose from 'mongoose';

export let Schema = mongoose.Schema;
export let ObjectId = mongoose.Schema.Types.ObjectId;
export let Mixed = mongoose.Schema.Types.Mixed;

export interface IUser extends mongoose.Document {
    email: string;
    createdAt?: Date;
}

export const UserSchema = new mongoose.Schema<IUser>({
    email: { type: String },
    createdAt: { type: Date, default: new Date() },
});

UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } });

UserSchema.methods.toJSON = function () {
    return {
        id: this._id,
        email: this.email,
    };
};

export const User = mongoose.model<IUser>('users', UserSchema);