<script setup lang="ts">
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <nav v-if="authStore.isLoggedIn" class="navbar">
      <div class="navbar-left">
        <span class="logo">📦 OMS</span>
        <!-- <RouterLink to="/products">สินค้า</RouterLink> -->
        <RouterLink to="/shops">ร้านค้า</RouterLink>
        <!--RouterLink to="/orders">คำสั่งซื้อ</RouterLink-->
        <RouterLink to="/customers">ลูกค้า</RouterLink>
        <RouterLink to="/profile">โปรไฟล์</RouterLink>

      </div>
      <div class="navbar-right">
        <span class="username">👤 {{ authStore.user?.name }}</span>
        <button class="btn-logout" @click="logout">ออกจากระบบ</button>
      </div>
    </nav>
    <RouterView />
  </div>
</template>