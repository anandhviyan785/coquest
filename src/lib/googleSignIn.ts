/**
 * "Continue with Google" using only a Google Cloud OAuth client (no Supabase needed).
 * Google's sign-in script opens a popup, the player approves, and we read their name and email
 * from Google's userinfo endpoint. The account then lives in this browser, like any local account.
 */

export const GOOGLE_CLIENT_ID = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '').trim()
export const googleConfigured = GOOGLE_CLIENT_ID !== ''

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

export interface GoogleProfile { sub: string; email: string; name: string }

interface TokenResponse { access_token?: string; error?: string }
interface TokenClient { requestAccessToken: () => void }
interface GoogleOAuth {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback: (error: { type: string }) => void
  }) => TokenClient
}
declare global {
  interface Window { google?: { accounts: { oauth2: GoogleOAuth } } }
}

let loading: Promise<void> | null = null

const loadScript = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loading = null
      reject(new Error('Could not reach Google. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return loading
}

const requestAccessToken = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const oauth = window.google?.accounts.oauth2
    if (!oauth) {
      reject(new Error('Google sign-in did not load. Try again.'))
      return
    }
    const client = oauth.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => (response.access_token ? resolve(response.access_token) : reject(new Error('Google sign-in was not completed.'))),
      error_callback: (error) => reject(new Error(error.type === 'popup_closed' ? 'The Google window was closed before signing in.' : 'Google sign-in failed. Try again.')),
    })
    client.requestAccessToken()
  })

/** Must be called from a click, so the browser allows the Google popup. */
export const signInWithGooglePopup = async (): Promise<GoogleProfile> => {
  if (!googleConfigured) throw new Error('Google sign-in is not switched on for this copy of CoQuest yet.')
  await loadScript()
  const token = await requestAccessToken()
  const response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('Google did not share your profile. Try again.')
  const data = (await response.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string }
  if (!data.sub || !data.email || data.email_verified === false) throw new Error('Your Google account needs a verified email address.')
  return { sub: data.sub, email: data.email, name: data.name ?? data.email.split('@')[0] }
}
