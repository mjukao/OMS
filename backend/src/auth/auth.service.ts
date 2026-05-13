import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  //bcrypt.compare: ฟังก์ชันนี้จะใช้ตรวจสอบว่า รหัสผ่านที่ผู้ใช้กรอก (password)
  //ตรงกับ รหัสผ่านที่เก็บในฐานข้อมูล (hashed password) หรือไม่.
  async validateUser(email: string, password: string) {//การตรวจสอบ
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('ไม่พบ Email นี้');
    if (!user.password) throw new UnauthorizedException('ไม่มีบัญชีนี้อยู่ในระบบ');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Password ไม่ถูกต้อง');
    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }
  //bcrypt.hash: ใช้เข้ารหัสรหัสผ่านก่อนที่จะเก็บลงฐานข้อมูล
  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10); //เรียกใช้ฟังก์ชัน hash จากไลบรารี bcrypt เพื่อทำการเข้ารหัสรหัสผ่าน (password)
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
    return this.login(user);
  }

  async validateGoogleUser(googleUser: {
    googleId: string
    name: string
    email: string
    avatar: string
  }) {//findByGoogleId: ค้นหาผู้ใช้ที่มี googleId
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    if (!user) {
      user = await this.usersService.create({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.avatar,
      });
    }
    return user;
  }
}