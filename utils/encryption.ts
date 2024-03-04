import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config();

export const encrypt = (text: string) => {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY!).toString();
}

export const decrypt = (encrypted: string) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, process.env.ENCRYPTION_KEY!);
  return bytes.toString(CryptoJS.enc.Utf8);
}