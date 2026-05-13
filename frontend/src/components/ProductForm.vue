<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Product, CreateProductPayload } from '../types/product.type'
import { useShopStore } from '../stores/shop.store'

const props = defineProps<{
  editProduct?: Product | null
}>()

const emit = defineEmits<{
  submit: [payload: CreateProductPayload]
  cancel: []
}>()

const shopStore = useShopStore()
onMounted(() => shopStore.fetchAll())

const form = ref({ name: '', description: '', price: 0, stock: 0, shopId: '' })

watch(() => props.editProduct, (val) => {
  if (val) {
    form.value = {
      name: val.name,
      description: val.description,
      price: val.price,
      stock: val.stock,
      shopId: val.shop?._id ?? '',
    }
  } else {
    form.value = { name: '', description: '', price: 0, stock: 0, shopId: '' }
  }
}, { immediate: true })

function handleSubmit() {
  if (!form.value.name) return
  const payload: CreateProductPayload = {
    name: form.value.name,
    description: form.value.description,
    price: form.value.price,
    stock: form.value.stock,
  }
  if (form.value.shopId) payload.shopId = form.value.shopId
  emit('submit', payload)
}
</script>

<template>
  <div>
    <h3>{{ editProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</h3>
    <br>

    <div class="form-group">
      <label>ชื่อสินค้า</label>
      <input v-model="form.name" placeholder="ชื่อสินค้า" required />
    </div>

    <div class="form-group">
      <label>รายละเอียด</label>
      <input v-model="form.description" placeholder="รายละเอียด" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>ราคา (บาท)</label>
        <input type="number" v-model.number="form.price" min="0" />
      </div>
      <div class="form-group">
        <label>สต็อก</label>
        <input type="number" v-model.number="form.stock" min="0" />
      </div>
    </div>

    <div class="form-group">
      <label>ร้านค้า</label>
      <select v-model="form.shopId">
        <option value="">-- ไม่ระบุร้านค้า --</option>
        <option v-for="shop in shopStore.shops" :key="shop._id" :value="shop._id">
          {{ shop.name }}
        </option>
      </select>
    </div>

    <div class="form-actions">
      <button class="btn-save" @click="handleSubmit">
        {{ editProduct ? 'บันทึก' : 'เพิ่มสินค้า' }}
      </button>
      <button class="btn-cancel" @click="emit('cancel')">ยกเลิก</button>
    </div>
  </div>
</template>