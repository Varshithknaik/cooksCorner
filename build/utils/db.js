"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbUrl = process.env.DB_URL ?? '';
const connectDb = async () => {
    try {
        await mongoose_1.default.connect(dbUrl, {}).then((data) => {
            console.log(`Database connected with ${data.connection.host}`);
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (error) {
        console.log(error.message);
        setTimeout(() => {
            connectDb();
        }, 5000);
    }
};
exports.default = connectDb;
