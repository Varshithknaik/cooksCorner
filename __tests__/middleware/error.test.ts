import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import userModel from '../../model/user.model';
import dotenv from 'dotenv';
dotenv.config();

// Mocking bcrypt and jwt for testing
jest.mock('bcryptjs', () => ({
   genSalt: jest.fn().mockResolvedValue('salt'),
   hash: jest.fn().mockResolvedValue('hashedPassword'),
   compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
   sign: jest.fn().mockReturnValue('token'),
}));

describe('userModel Model', () => {
 beforeAll(async () => {
    await mongoose.connect(process.env.DB_URL ?? '', { });
 });

 afterAll(async () => {
    await mongoose.connection.close();
 });

 it('should hash the password before saving the userModel', async () => {
    const user = new userModel({ name: 'Test', email: 'test@example.com', password: 'testPassword' });
    await user.save();
    expect(bcrypt.hash).toHaveBeenCalledWith('testPassword', 'salt');
    expect(user.password).toBe('hashedPassword');
    await userModel.deleteOne({ _id: user._id });
 });

 it('should compare the password correctly', async () => {
    const user = new userModel({ name: 'Test', email: 'test@example.com', password: 'hashedPassword' });
    const isMatch = await user.comparePassword('testPassword');
    expect(bcrypt.compare).toHaveBeenCalledWith('testPassword', 'hashedPassword');
    expect(isMatch).toBe(true);
 });

 it('should sign the access token correctly', async () => {
    const user = new userModel({ name: 'Test', email: 'test@example.com', password: 'hashedPassword' });
    const token = user.signAccessToken();
    expect(jwt.sign).toHaveBeenCalledWith({ id: user._id }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '5m' });
    expect(token).toBe('token');
 });

 it('should sign the refresh token correctly', async () => {
    const user = new userModel({ name: 'Test', email: 'test@example.com', password: 'hashedPassword' });
    const token = user.signRefreshToken();
    expect(jwt.sign).toHaveBeenCalledWith({ id: user._id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
    expect(token).toBe('token');
 });
});
