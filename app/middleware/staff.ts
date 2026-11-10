import type { Role } from '~~/shared/types/api'
import { can } from '~~/shared/permissions'

export default defineNuxtRouteMiddleware(async (to) => {
  const { getMe } = useBackend()
  const me = await getMe()
  const allowedRoles = (to.meta.allowedRoles as Role[] | undefined) ?? ['staff', 'admin']

  if (!allowedRoles.includes(me.role) || !can(me.role, 'view_dashboard')) {
    return navigateTo('/login')
  }
})
