// src/types/user.type.ts

export interface Address {
  _id: string
  label: string
  fullName: string
  phone: string
  address: string
  isDefault: boolean
}

export interface UserProfile {
  _id: string
  name: string
  email: string
  avatar?: string
  role: string
  firstName?: string
  lastName?: string
  phone?: string
  addresses: Address[]
  createdAt: string
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
}

export interface CreateAddressPayload {
  label: string
  fullName: string
  phone: string
  address: string
  isDefault?: boolean
}

// Customer list types
export interface CustomerOrderItem {
  productName: string
  quantity: number
  unitPrice: number
}

export interface CustomerOrder {
  _id: string
  shopName: string
  status: string
  totalAmount: number
  items: CustomerOrderItem[]
  createdAt: string
}

export interface Customer {
  user: {
    _id: string
    name: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  orderCount: number
  totalSpent: number
  orders: CustomerOrder[]
}
