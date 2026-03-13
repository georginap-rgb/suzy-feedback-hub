import { randomBytes } from 'crypto'
import { getBaseUrl, cookieFlags } from '../_lib/auth.js'

export default function handler(req, res) {
  const { GOOGLE_CLIENT_ID } = process.env
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).send('GOOGLE_CLIENT_ID is not configured.')
  }

  const state = randomBytes(16).toString('hex')
  const redirectUri = `${getBaseUrl(req)}/api/auth/callback`

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })

  res.setHeader('Set-Cookie', `oauth-state=${state}; ${cookieFlags()}; Max-Age=300`)
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
