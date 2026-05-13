<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  // อ่าน token จาก URL เช่น /auth/callback?token=xxxxx
  const token = route.query.token as string
  if (token) {
    authStore.setToken(token)
    await authStore.fetchMe()
    router.push('/products')
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <p>กำลัง Login...</p>
</template>