<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const token = route.query.token as string
  const refreshToken = route.query.refresh as string

  if (token) {
    authStore.setToken(token, refreshToken)
    await authStore.fetchMe()
    router.push('/shops')
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:#888">
    กำลังเข้าสู่ระบบ...
  </div>
</template>
