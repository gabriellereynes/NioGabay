// Who is logged in, for any page or component.
//
//   const { me, login, logout } = useAuth()
//   me.value   -> the logged-in person (type Me), null when nobody is logged in,
//                 or undefined before the app has asked the server yet
//
// It only talks to the three routes in docs/api-contract.md section 5.2.
import type { LoginInput, Me } from '~~/shared/types/api'
 
export const useAuth = () => {
  const me = useState<Me | null | undefined>('auth-me', () => undefined)
 
  // While the server renders a page, $fetch does not forward the visitor's cookies by itself.
  // useRequestFetch() does, so "who am I" is also correct on the first page load.
  const serverAwareFetch = import.meta.server ? useRequestFetch() : $fetch
 
  /** Ask the server who is logged in (401 means nobody). */
  const refresh = async (): Promise<Me | null> => {
    try {
      me.value = await serverAwareFetch<Me>('/api/auth/me')
    } catch {
      me.value = null
    }
    return me.value
  }
 
  /** Throws the server's error when the login fails. error.data.statusMessage is the text to show. */
  const login = async (input: LoginInput): Promise<Me> => {
    const person = await $fetch<Me>('/api/auth/login', { method: 'POST', body: input })
    me.value = person
    return person
  }
 
  const logout = async (): Promise<void> => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    me.value = null
  }
 
  return { me, refresh, login, logout }
}