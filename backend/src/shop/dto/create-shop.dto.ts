// src/shops/dto/create-shop.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  description: string;
}