// PAGE middleware (runs in the browser app): it decides whether a page may be opened.
// (Not to be confused with server/middleware/protect-routes.ts, which protects the API routes.)
// Page protection. A page opts in with definePageMeta:
//
//   definePageMeta({ middleware: 'require-login' })                   any logged-in person (staff or admin)
//   definePageMeta({ middleware: 'require-login', role: 'admin' })    admins only
//
// Pages with no middleware (the public flood page, the login page) stay open to everyone.
// This only decides which PAGE to show. The real protection is on the server: the
// /api/staff/... and /api/admin/... routes refuse anyone who is not allowed.
import type { Role } from '~~/shared/types/api'
 
export default defineNuxtRouteMiddleware(async (to) => {
  const { me, refresh } = useAuth()
 
  if (me.value === undefined) await refresh() // ask the server once per visit
 
  if (!me.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
 
  const needed = to.meta.role as Role | undefined
  if (needed === 'admin' && me.value.role !== 'admin') {
    return abortNavigation(
      createError({ statusCode: 403, statusMessage: 'You are not allowed to open this page' })
    )
  }
})