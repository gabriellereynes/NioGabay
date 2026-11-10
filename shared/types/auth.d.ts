// Tells TypeScript what is stored in the login cookie (nuxt-auth-utils reads this).
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
  }
}
 
export {}
 