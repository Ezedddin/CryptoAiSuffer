import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import CoinDetail from '../views/CoinDetail.vue'
import WalletProfile from '../views/WalletProfile.vue'
import Settings from '../views/Settings.vue'
import History from '../views/History.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/coin/:id',
      name: 'coin-detail',
      component: CoinDetail,
    },
    {
      path: '/wallet/:address',
      name: 'wallet-profile',
      component: WalletProfile,
    },
    {
      path: '/history',
      name: 'history',
      component: History,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
  ],
})

export default router
