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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    res.cookie('refreshToken', refreshToken, exports.refreshTokenCookieOptions);
    await redis_1.redis.set(user._id, JSON.stringify(userWithoutPassword), "EX", 7 * 24 * 60 * 60);
    const encryptedBody = (0, encryption_1.encrypt)(JSON.stringify({
        accessToken,
        user: userWithoutPassword
    }));
    console.log(encryptedBody);
    res.status(status).json(encryptedBody);
};
exports.sendToken = sendToken;
