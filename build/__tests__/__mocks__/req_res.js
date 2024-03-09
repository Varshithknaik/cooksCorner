"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.res = exports.setupReq = void 0;
const setupReq = (authorization, body = {}, user) => {
    return {
        body,
        headers: {
            authorization: `Bearer ${authorization}`,
        },
        user
    };
};
exports.setupReq = setupReq;
exports.res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
};
