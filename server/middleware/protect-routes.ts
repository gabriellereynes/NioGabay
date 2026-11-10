// SERVER-side middleware: it protects the /api/staff/... and /api/admin/... routes.
// (Not to be confused with app/middleware/require-login.ts, which protects PAGES in the browser.)
// Runs before every request and protects routes by their URL prefix:
//   /api/staff/...  staff or admin
//   /api/admin/...  admin only
// Everything else (/api/public/..., /api/auth/..., /api/readings, pages) is left alone.
//
// Even so, each staff/admin route should ALSO call requireUser() at its top: that gives it
// the logged-in person (for created_by) and keeps it safe if a route is ever moved.
export default defineEventHandler(async (event) => {
  // Tidy the path first so tricks like "/api//admin/users" or "/API/Admin/users" cannot slip past.
  const path = getRequestURL(event).pathname.replace(/\/+/g, '/').toLowerCase()
 
  if (path === '/api/admin' || path.startsWith('/api/admin/')) {
    await requireUser(event, ['admin'])
  } else if (path === '/api/staff' || path.startsWith('/api/staff/')) {
    await requireUser(event, ['staff', 'admin'])
  }
})
 