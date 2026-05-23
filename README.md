# Victoria Babolat — Site de contenu exclusif

## Structure
- `/` — Page publique (ce que les clients voient)
- `/admin` — Panneau admin (mot de passe: victoria2024)

## Déploiement sur Vercel

1. Va sur vercel.com et connecte-toi
2. Clique "Add New Project"
3. Importe ce dossier (drag & drop ou via GitHub)
4. Dans "Environment Variables", ajoute:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY (ta clé secrète Stripe)
   - ADMIN_PASSWORD (mot de passe pour /admin)

## Variables d'environnement
Voir le fichier .env.local (ne jamais le partager !)
