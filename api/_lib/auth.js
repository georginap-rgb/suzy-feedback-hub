import { SignJWT, jwtVerify } from 'jose'

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET)

export async function createToken(user) {
  return new SignJWT({ email: user.email, name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload
  } catch {
    return null
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie ?? ''
  const out = {}
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k) out[k.trim()] = decodeURIComponent(v.join('='))
  }
  return out
}

export async function getUser(req) {
  const cookies = parseCookies(req)
  if (!cookies['fq-session']) return null
  return verifyToken(cookies['fq-session'])
}

export function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}

export function cookieFlags() {
  const secure = process.env.VERCEL_ENV ? '; Secure' : ''
  return `HttpOnly; Path=/; SameSite=Lax${secure}`
}
