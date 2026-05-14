import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shop, ShopDocument } from './schema/shop.schema';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Order, OrderDocument } from '../order/schema/order.schema';

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Shop.name) private shopModel: Model<ShopDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // สร้างร้านค้า — กำหนด owner จาก userId ที่ล็อกอิน
  async create(dto: CreateShopDto, ownerId: string): Promise<Shop> {
    const shop = new this.shopModel({ ...dto, owner: new Types.ObjectId(ownerId) });
    return shop.save();
  }

  // ดึงเฉพาะร้านของ owner นั้น
  async findAll(ownerId: string, search?: string) {
    const query: any = { owner: new Types.ObjectId(ownerId) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    return this.shopModel.find(query).exec();
  }

  // ดูร้านค้าชิ้นเดียว
  async findOne(id: string): Promise<Shop> {
    const shop = await this.shopModel.findById(id).exec();
    if (!shop) throw new NotFoundException('ไม่พบร้านค้า');
    return shop;
  }

  // แก้ไข — ตรวจ owner
  async update(id: string, dto: UpdateShopDto, ownerId: string): Promise<Shop> {
    const shop = await this.shopModel.findOneAndUpdate(
      { _id: id, owner: new Types.ObjectId(ownerId) },
      dto,
      { new: true },
    ).exec();
    if (!shop) throw new NotFoundException('ไม่พบร้านค้า หรือไม่มีสิทธิ์แก้ไข');
    return shop;
  }

  // ลบ — ตรวจ owner
  async delete(id: string, ownerId: string) {
    const shop = await this.shopModel.findOneAndDelete({
      _id: id,
      owner: new Types.ObjectId(ownerId),
    }).exec();
    if (!shop) throw new NotFoundException('ไม่พบร้านค้า หรือไม่มีสิทธิ์ลบ');
    return { message: 'ลบร้านค้าสำเร็จ' };
  }

  // ลูกค้าของร้าน — ดึงจาก shippingAddress แทน user account
  async getCustomers(shopId: string) {
    const shop = await this.shopModel.findById(shopId).select('name');
    const orders = await this.orderModel
      .find({ shop: new Types.ObjectId(shopId) })
      .sort({ createdAt: -1 });

    const map = new Map<string, any>();

    for (const order of orders) {
      const addr = order.shippingAddress || '';
      const parts = addr.split(' | ');
      const name = parts[0] ? parts[0].replace('ผู้รับ: ', '') : 'ไม่ระบุ';
      const phone = parts[1] ? parts[1].replace('โทร: ', '') : '';
      const address = parts[2] ? parts[2].replace('ที่อยู่: ', '') : '';

      const key = `${name}|${phone}`;

      if (!map.has(key)) {
        map.set(key, {
          receiver: { name, phone, address },
          orderCount: 0,
          totalSpent: 0,
          orders: [],
        });
      }

      const entry = map.get(key);
      entry.orderCount += 1;
      entry.totalSpent += order.totalAmount;
      entry.orders.push({
        _id: order._id,
        shopName: shop?.name,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      });
    }

    return Array.from(map.values());
  }
}
