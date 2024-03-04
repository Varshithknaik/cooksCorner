"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Please Enter Your Name'],
        minlength: [3, 'Atleast   3 Characters are required'],
        maxlength: [20, 'Atmost 20 Characters are allowed'],
    },
    email: {
        type: String,
        required: [true, 'Please Enter Your Email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please Enter Your Password'],
        minlength: [6, 'Atleast   6 Characters are required'],
    },
    role: {
        type: String,
        required: true,
        default: 'user',
    },
    avatar: {
        public_id: String,
        url: String,
    },
    recipes: [{
            recipeId: {
                type: String,
                required: true,
            }
        }]
}, { timestamps: true });
// Hash Password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});
// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
// signAccess Token
userSchema.methods.signAccessToken = function () {
    const payload = {
        id: this._id,
    };
    return jsonwebtoken_1.default.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
};
// signRefresh Token
userSchema.methods.signRefreshToken = function () {
    const payload = {
        id: this._id,
    };
    return jsonwebtoken_1.default.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};
const userModel = mongoose_1.default.model('User', userSchema);
exports.default = userModel;
