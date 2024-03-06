"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const userRouter = express_1.default.Router();
userRouter.post('/register', (0, catchAsyncError_1.catchAsyncError)(user_controller_1.registration));
exports.default = userRouter;
