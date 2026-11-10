import type { Role } from '~~/shared/types/api'
import { can } from '~~/shared/permissions'

export default defineNuxtRouteMiddleware(async (to) => {
  const { me, refresh } = useAuth()
  if (me.value === undefined) await refresh()
  if (!me.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })

  const allowedRoles = to.meta.allowedRoles as Role[] | undefined

  if (!can(me.value.role, 'view_dashboard') || (allowedRoles && !allowedRoles.includes(me.value.role))) {
    return navigateTo('/staff')
  }
})
