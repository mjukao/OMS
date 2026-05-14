<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useShopStore } from '../stores/shop.store'

const shopStore = useShopStore()
const router = useRouter()

const showShopModal = ref(false)
const editShop = ref<any>(null)
const shopForm = ref({ name: '', address: '', description: '' })

const search = ref('')
let searchTimer: any = null

onMounted(() => shopStore.fetchAll())

watch(search, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => shopStore.fetchAll(val), 500)
})

function goToShop(shopId: string) {
  router.push(`/shops/${shopId}`)
}

function openCreateShop() {
  editShop.value = null
  shopForm.value = { name: '', address: '', description: '' }
  showShopModal.value = true
}

function openEditShop(shop: any, e: Event) {
  e.stopPropagation()
  editShop.value = shop
  shopForm.value = { name: shop.name, address: shop.address, description: shop.description }
  showShopModal.value = true
}

async function handleShopSubmit() {
  if (!shopForm.value.name) return
  if (editShop.value) {
    await shopStore.updateShop(editShop.value._id, shopForm.value)
  } else {
    await shopStore.createShop(shopForm.value)
  }
  showShopModal.value = false
}

async function handleShopDelete(id: string, e: Event) {
  e.stopPropagation()
  if (confirm('ยืนยันลบร้านค้า?')) {
    await shopStore.removeShop(id)
  }
}
</script>

<template>
  <div class="page">

    <div class="section-header">
      <h1 class="page-title">ร้านค้าของฉัน</h1>
      <button class="btn-create-shop" @click="openCreateShop">+ สร้างร้านค้า</button>
    </div>

    <!-- ค้นหา -->
    <div class="search-box">
      <input v-model="search" placeholder="ค้นหาร้านค้า..." class="search-input" />
      <button v-if="search" class="btn-clear" @click="search = ''; shopStore.fetchAll()">✕</button>
    </div>

    <p v-if="shopStore.loading" class="txt-gray">กำลังโหลด...</p>

    <p v-if="!shopStore.loading && shopStore.shops.length === 0" class="txt-gray">
      {{ search ? `ไม่พบร้านค้า "${search}"` : 'ยังไม่มีร้านค้า กด "+ สร้างร้านค้า" เพื่อเริ่มต้น' }}
    </p>

    <div v-if="!shopStore.loading && shopStore.shops.length > 0" class="shop-cards">
      <div v-for="shop in shopStore.shops" :key="shop._id" class="shop-card" @click="goToShop(shop._id)">
        <button class="card-delete" @click="handleShopDelete(shop._id, $event)">✕</button>
        <div class="card-icon"></div>
        <div class="card-name">{{ shop.name }}</div>
        <div class="card-desc">{{ shop.description || shop.address || '-' }}</div>
        <button class="card-edit-btn" @click="openEditShop(shop, $event)">แก้ไข</button>
      </div>

      <div class="shop-card card-add" @click="openCreateShop">
        <div class="card-plus">+</div>
        <div class="card-name">เพิ่มร้านค้า</div>
      </div>
    </div>

  </div>

  <!-- Modal สร้าง/แก้ไขร้านค้า -->
  <div v-if="showShopModal" class="modal-backdrop" @click.self="showShopModal = false">
    <div class="modal">
      <h2>{{ editShop ? 'แก้ไขร้านค้า' : 'สร้างร้านค้าใหม่' }}</h2>
      <div class="form-group">
        <label>ชื่อร้าน</label>
        <input v-model="shopForm.name" placeholder="ชื่อร้านค้า" required />
      </div>
      <div class="form-group">
        <label>ที่อยู่</label>
        <input v-model="shopForm.address" placeholder="ที่อยู่ร้านค้า" />
      </div>
      <div class="form-group">
        <label>รายละเอียด</label>
        <input v-model="shopForm.description" placeholder="รายละเอียด" />
      </div>
      <div class="form-actions" style="justify-content:flex-end;gap:8px">
        <button class="btn-cancel" @click="showShopModal = false">ยกเลิก</button>
        <button class="btn-save" @click="handleShopSubmit">
          {{ editShop ? 'บันทึก' : 'สร้างร้านค้า' }}
        </button>
      </div>
    </div>
  </div>
</template>
