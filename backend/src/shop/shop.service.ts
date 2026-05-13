// src/shops/shop.service.ts
import { Injectable } from '@nestjs/common';
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

  // เพิ่มร้านค้าใหม่
  async create(createShopDto: CreateShopDto): Promise<Shop> {
    const createdShop = new this.shopModel(createShopDto);
    return createdShop.save();
  }

async findAll(search?: string) {
  const query = search
    ? {
        $or: [//$or หมายถึง:ตรงอันใดอันหนึ่งก็ได้
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      }
    : {}//query ว่าง = ดึงทั้งหมด
//find(query) = ค้นหาใน MongoDB
//exec() = สั่ง query ทำงาน
  return this.shopModel.find(query).exec()
}

  // ดึงข้อมูลร้านค้าตาม ID
  async findOne(id: string): Promise<Shop> {
    return this.shopModel.findById(id).exec();
  }

  // แก้ไขข้อมูลร้านค้า
  async update(id: string, updateShopDto: UpdateShopDto): Promise<Shop> {
    return this.shopModel.findByIdAndUpdate(id, updateShopDto, { new: true }).exec();
  }

  // ลบร้านค้า
  async delete(id: string): Promise<any> {
    return this.shopModel.findByIdAndDelete(id).exec();
  }

 // ── Customer List ──────────────────────────────────────
  async getCustomers(shopId: string) {
    const shop = await this.shopModel.findById(shopId).select('name');
    const orders = await this.orderModel
      .find({ shop: new Types.ObjectId(shopId) })
      .populate('user', 'name email firstName lastName phone')
      .sort({ createdAt: -1 });

    const map = new Map<string, any>();

    for (const order of orders) {
      const user = order.user as any;
      const uid = user._id.toString();

      if (!map.has(uid)) {
        map.set(uid, {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
          },
          orderCount: 0,
          totalSpent: 0,
          orders: [],
        });
      }

      const entry = map.get(uid);
      entry.orderCount += 1;
      entry.totalSpent += order.totalAmount;
      entry.orders.push({
        _id: order._id,
        shopName: shop.name,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        createdAt: order.createdAt,
      });
    }

    return Array.from(map.values());
  }
}