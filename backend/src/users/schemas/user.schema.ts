import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// Address (embedded)
@Schema({ _id: true })
export class Address {
  _id?: Types.ObjectId;
  id?: string;

  @Prop({ required: true })
  label: string; // "บ้าน", "ที่ทำงาน"

  @Prop({ required: true })
  fullName: string; // ชื่อผู้รับ

  @Prop({ required: true })
  phone: string; // เบอร์โทร

  @Prop({ required: true })
  address: string; // ที่อยู่เต็ม

  @Prop({ default: false })
  isDefault: boolean; // ที่อยู่หลัก
}

export const AddressSchema = SchemaFactory.createForClass(Address);

//User
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true, lowercase: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: 'user' })
  role: string;

  //add .
  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  phone?: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];
}

export const UserSchema = SchemaFactory.createForClass(User);