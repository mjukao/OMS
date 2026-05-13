import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string;        // ← เปลี่ยนเป็น productName

  @Prop({ required: true, min: 0 })
  unitPrice: number;         // ← เปลี่ยนเป็น unitPrice

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

export type Orderstatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true })
  shop: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], default: [] })  // ← แก้ตรงนี้ ใส่ []
  items: OrderItem[];

  @Prop({
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], // ← แก้ comfiemed → confirmed
    default: 'pending',
  })
  status: Orderstatus;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: String })
  shippingAddress: string;

  @Prop()
  note?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);