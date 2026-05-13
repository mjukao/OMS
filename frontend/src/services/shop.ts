import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/shops',  // แค่เพิ่ม path ของ shop
  headers: {
    'Content-Type': 'application/json',
  },
});

// ฟังก์ชันดึงข้อมูลร้านทั้งหมด
export const getShops = async () => {
  const response = await api.get('/');
  return response.data;
};

// ฟังก์ชันเพิ่มร้าน
export const createShop = async (shopData: any) => {
  const response = await api.post('/', shopData);
  return response.data;
};

// ฟังก์ชันลบร้าน
export const deleteShop = async (id: string) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};