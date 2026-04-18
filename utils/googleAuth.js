import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { logger } from './logger'

export function useCompleteAuthSession() {
  WebBrowser.maybeCompleteAuthSession()
}

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

export function useGoogleAuth() {
  const inDev = __DEV__
  // makeRedirectUri with useProxy generates the Expo proxy URL including session token
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: inDev, native: 'vouch://' })

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: WEB_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false, // backend uses client_secret for exchange, not PKCE
    },
    discovery
  )

  const signIn = async () => {
    logger.action('[GOOGLE]', 'Sign-in prompt', { redirectUri })
    const result = await promptAsync({ useProxy: inDev })

    if (result?.type !== 'success') {
      logger.warn('[GOOGLE]', `Cancelled or failed: ${result?.type}`)
      return null
    }

    logger.info('[GOOGLE]', 'Auth code received')
    return {
      code: result.params.code,
      redirect_uri: redirectUri,
    }
  }

  return { request, signIn }
}
