import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { postId, price, caption } = req.body

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: caption || 'Contenu exclusif',
          description: 'Victoria Babolat — contenu exclusif',
        },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${req.headers.origin}/?success=1&post=${postId}`,
    cancel_url: `${req.headers.origin}/`,
  })

  res.json({ url: session.url })
}
