import { Body, Controller, Get,Param, Patch, Post,Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.orderService.create(dto, req.user.userId);}
  @Get()
  findAll(@Query('shopId') shopId?:string,
  @Query('status') status?:string,
  @Query('customerId') customerId?:string) {
    return this.orderService.findAll({shopId,status,customerId});}
    

    //Get 
    @Get(':Id')
    findOne(@Param('Id') id:string){
      return this.orderService.findOne(id);
    }
    @Patch(':Id')
    update(@Param('Id') id:string,@Body() dto:UpdateOrderDto){
      return this.orderService.update(id,dto);
    }
    @Patch(':Id/cancel')
    cancel(@Param('Id') id:string){
      return this.orderService.cancel(id);
    }
}