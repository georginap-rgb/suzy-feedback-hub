import { cookieFlags } from '../_lib/auth.js'

export default function handler(req, res) {
  res.setHeader('Set-Cookie', `fq-session=; ${cookieFlags()}; Max-Age=0`)
  res.redirect('/')
}
