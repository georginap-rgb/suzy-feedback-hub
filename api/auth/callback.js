import { createToken, parseCookies, getBaseUrl, cookieFlags } from '../_lib/auth.js'

export default async function handler(req, res) {
  const { code, state, error } = req.query

  if (error) return res.redirect('/?auth_error=denied')

  const cookies = parseCookies(req)
  if (!state || state !== cookies['oauth-state']) {
    return res.redirect('/?auth_error=invalid_state')
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ALLOWED_EMAIL_DOMAIN } = process.env
  const redirectUri = `${getBaseUrl(req)}/api/auth/callback`

  // Exchange code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return res.redirect('/?auth_error=token_exchange')

  const { access_token } = await tokenRes.json()

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userRes.ok) return res.redirect('/?auth_error=userinfo')

  const user = await userRes.json()

  // Check email domain
  if (ALLOWED_EMAIL_DOMAIN) {
    const domain = user.email.split('@')[1]
    if (domain !== ALLOWED_EMAIL_DOMAIN) {
      return res.redirect('/?auth_error=unauthorized_domain')
    }
  }

  console.log(`[AUTH] Login: ${user.email}`)

  const token = await createToken({ email: user.email, name: user.name, picture: user.picture })
  const maxAge = 7 * 24 * 3600

  res.setHeader('Set-Cookie', [
    `fq-session=${token}; ${cookieFlags()}; Max-Age=${maxAge}`,
    `oauth-state=; ${cookieFlags()}; Max-Age=0`,
  ])
  res.redirect('/')
}
