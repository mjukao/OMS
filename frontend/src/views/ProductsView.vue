<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProductStore } from '../stores/product.store'
import ProductForm from '../components/ProductForm.vue'
import type { Product } from '../types/product.type'

const store = useProductStore()
const showForm = ref(false)
const editProduct = ref<Product | null>(null)
const search = ref('')

// debounce timer
let searchTimer: any = null

onMounted(() => store.fetchAll())

/*
 * watch search → เมื่อพิมพ์
 * debounce 500ms → รอให้หยุดพิมพ์ก่อนค่อยยิง API
 * ถ้าพิมพ์ต่อก่อน 500ms → reset timer
 */
watch(search, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.fetchAll(val)
  }, 500)
})

function openCreate() {
  editProduct.value = null
  showForm.value = true
}

function openEdit(product: Product) {
  editProduct.value = product
  showForm.value = true
}

async function handleSubmit(payload: any) {
  let success = false
  if (editProduct.value) {
    success = await store.updateProduct(editProduct.value._id, payload)
  } else {
    success = await store.createProduct(payload)
  }
  if (success) {
    showForm.value = false
    editProduct.value = null
  }
}

async function handleDelete(id: string) {
  if (confirm('ยืนยันการลบ?')) await store.removeProduct(id)
}
</script>

<template>
  <div class="page">

    <div class="section-header">
      <h1>จัดการสินค้า</h1>
      <button class="btn-add" @click="openCreate">+ เพิ่มสินค้า</button>
    </div>

    <!-- SEARCH -->
    <div class="search-box">
      <input
        v-model="search"
        placeholder=" ค้นหาสินค้า..."
        class="search-input"
      />
      <button v-if="search" class="btn-clear" @click="search = ''; store.fetchAll()">✕</button>
    </div>

    <div v-if="showForm" class="form-box">
      <ProductForm
        :edit-product="editProduct"
        @submit="handleSubmit"
        @cancel="showForm = false"
      />
    </div>

    <p v-if="store.loading" class="txt-gray">กำลังโหลด...</p>
    <p v-if="store.error" class="txt-error">{{ store.error }}</p>
    <p v-if="!store.loading && store.products.length === 0" class="txt-gray">
      {{ search ? `ไม่พบสินค้าที่ค้นหา "${search}"` : 'ยังไม่มีสินค้า' }}
    </p>

    <table v-if="store.products.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ชื่อสินค้า</th>
          <th>รายละเอียด</th>
          <th>ราคา</th>
          <th>สต็อก</th>
          <th>ร้านค้า</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in store.products" :key="product._id">
          <td>{{ product.name }}</td>
          <td>{{ product.description || '-' }}</td>
          <td>฿{{ product.price.toLocaleString() }}</td>
          <td>
            <span :class="product.stock > 0 ? 'stock-ok' : 'stock-out'">
              {{ product.stock }} ชิ้น
            </span>
          </td>
          <td>{{ product.shop?.name || '-' }}</td>
          <td>
            <button class="btn-edit" @click="openEdit(product)">แก้ไข</button>
            <button class="btn-del" @click="handleDelete(product._id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="search && store.products.length > 0" class="txt-gray">
      พบ {{ store.products.length }} รายการ
    </p>

  </div>
</template>