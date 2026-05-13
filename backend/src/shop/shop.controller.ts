import {
  Controller, Get, Post, Body,
  Param, Put, Patch, Delete, Query
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopService.create(createShopDto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.shopService.findAll(search);
  }
  @Get(':id/customers')
  getCustomers(@Param('id') id: string) {
    return this.shopService.getCustomers(id);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto) {
    return this.shopService.update(id, updateShopDto);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto) {
    return this.shopService.update(id, updateShopDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shopService.delete(id);
  }


}