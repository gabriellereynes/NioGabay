import type { Role } from '~~/shared/types/api'
import { can } from '~~/shared/permissions'

export default defineNuxtRouteMiddleware(async (to) => {
  const { getMe } = useBackend()
  const me = await getMe()
  const allowedRoles = to.meta.allowedRoles as Role[] | undefined

  if (!can(me.role, 'view_dashboard') || (allowedRoles && !allowedRoles.includes(me.role))) {
    return navigateTo('/login')
  }
})
