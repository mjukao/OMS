import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import ProductsView from '../views/ProductsView.vue'
import ShopView from '../views/ShopView.vue'
import LoginView from '../views/LoginView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'
import OrderView from '@/views/OrderView.vue'
import ProfileView from '../views/ProfileView.vue'
import CustomersView from '../views/CustumersView.vue'
import ShopProductsView from '../views/ShopProductsView.vue'
import ShopOrdersView from '../views/ShopOrdersView.vue'
import ShopCreateOrderView from '../views/ShopCreateOrderView.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/shops' },
    { path: '/login', component: LoginView },
    { path: '/auth/callback', component: AuthCallbackView },
    { path: '/products', component: ProductsView, meta: { requiresAuth: true } },
    { path: '/shops', component: ShopView, meta: { requiresAuth: true } },
    { path: '/shops/:id', component: ShopProductsView, meta: { requiresAuth: true } },
    { path: '/shops/:id/orders', component: ShopOrdersView, meta: { requiresAuth: true } },
    { path: '/shops/:id/orders/create', component: ShopCreateOrderView, meta: { requiresAuth: true } },
    { path: '/orders', component: OrderView, meta: { requiresAuth: true } },
    { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/customers', component: CustomersView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to, _from) => {
  const authStore = useAuthStore()

  if (authStore.token && !authStore.user) {
    await authStore.fetchMe()
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return '/login'
  }
})

export default router