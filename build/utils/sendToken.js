"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenCookieOptions = void 0;
const redis_1 = require("./redis");
const encryption_1 = require("./encryption");
exports.refreshTokenCookieOptions = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: "none",
    secure: true
};
const sendToken = async (user, status, res) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();
    res.cookie('refreshToken', refreshToken, exports.refreshTokenCookieOptions);
    await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 7 * 24 * 60 * 60);
    const encryptedBody = (0, encryption_1.encrypt)(JSON.stringify({
        accessToken,
        user
    }));
    res.status(status).json({ status: 'success', data: encryptedBody });
};
exports.sendToken = sendToken;
