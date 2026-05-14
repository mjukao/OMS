<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const isRegister = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
async function handleSubmit() {
  error.value = ''

  const fullEmail = `${email.value}@gmail.com`

  try {
    if (isRegister.value) {
      await authStore.register(name.value, fullEmail, password.value)
    } else {
      await authStore.login(fullEmail, password.value)
    }

    router.push('/shops')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'เกิดข้อผิดพลาด'
  }
}

function loginGoogle() {
  window.location.href = 'http://localhost:3000/api/auth/google'
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <h1>{{ isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ' }}</h1>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group" v-if="isRegister">
          <label>ชื่อ</label>
          <input v-model="name" placeholder="ชื่อของคุณ" autocomplete="name" required />
        </div>

        <div class="form-group">
          <label>Email</label>
          <div class="input-group">
            <input v-model="email" type="text" placeholder="username" autocomplete="email" required />
            <span class="input-suffix">@gmail.com</span>
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="" autocomplete="current-password" required
            minlength="6" />
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%">
          {{ isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ' }}
        </button>
      </form>

      <div class="login-divider">หรือ</div>

      <button class="btn btn-google" @click="loginGoogle">
        Login ด้วย Google
      </button>

      <div class="login-switch">
        {{ isRegister ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?' }}
        <button @click="isRegister = !isRegister">
          {{ isRegister ? 'Login' : 'สมัครสมาชิก' }}
        </button>
      </div>
    </div>
  </div>
</template>