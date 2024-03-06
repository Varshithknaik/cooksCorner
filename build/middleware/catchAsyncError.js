"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsyncError = void 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catchAsyncError = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsyncError = catchAsyncError;
