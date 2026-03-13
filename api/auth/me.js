import { getUser } from '../_lib/auth.js'

export default async function handler(req, res) {
  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  res.json({ email: user.email, name: user.name, picture: user.picture })
}
