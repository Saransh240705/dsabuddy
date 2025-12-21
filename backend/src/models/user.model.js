import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    }, 
    password: {
        type: String,
        required: true,
        min: 6,
    },
    salt: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const BlacklistedTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

const User = model('user', userSchema);
export default User;
export const BlacklistedToken = model('blacklistedToken', BlacklistedTokenSchema);