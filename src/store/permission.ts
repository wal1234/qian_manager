import { defineStore } from 'pinia'
import { routes } from '../router'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: routes.filter(route => !route.meta?.hidden)
  }),
  getters: {
    getRoutes: state => state.routes
  }
})