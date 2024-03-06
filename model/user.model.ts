import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar: {
    public_id: string,
    url: string,
  },
  recipes: Array<{ recipeId: string}>,
  comparePassword : (enteredPassword: string) => Promise<boolean>,
  signAccessToken: () => Promise<string>;
  signRefreshToken: () => Promise<string>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: {
    type: String,
    required: [true , 'Please Enter Your Name'],
    minlength: [ 3 , 'Atleast   3 Characters are required'],
    maxlength: [ 20 , 'Atmost 20 Characters are allowed'],
  },
  email: {
    type: String,
    required: [true , 'Please Enter Your Email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true , 'Please Enter Your Password'],
    minlength: [ 6 , 'Atleast   6 Characters are required'],
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
}, { timestamps: true} )

// Hash Password
userSchema.pre<IUser>('save' , async function(next){
  if(!this.isModified('password')){
    next();
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
})

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean>{
  return await bcrypt.compare(enteredPassword, this.password);
}

// signAccess Token
userSchema.methods.signAccessToken = function(): string{
  const payload = {
    id: this._id,
  }
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET! , { expiresIn: '5m' });
}

// signRefresh Token
userSchema.methods.signRefreshToken = function(): string{
  const payload = {
    id: this._id,
  }
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET! , { expiresIn: '7d' });
}

const userModel: Model<IUser> = mongoose.model('User', userSchema);

export default userModel;