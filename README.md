# Bot Rank (Discord)

Bot Discord (Railway) qui:
- track le temps **en vocal**
- donne des rôles à **10h / 30h / 50h / 200h**
- commande `!rank` pour voir la progression
- commande `!boostrank` (1 fois, si membre depuis ≤ 5 jours) → temps vocal en **x1.5**
- **derank à 00h (UTC)** si le membre n’a pas fait **≥ 1h** de vocal dans la journée
  - exceptions: total vocal **≥ 1000h** ou membre dans la liste protégée (`!setprotect`)
- envoie une **image** (template) lors des rank/derank, avec pseudo + "level"

## Variables d’environnement (Railway)

- `DISCORD_TOKEN` : token du bot Discord
- `MONGO_URL` : Railway MongoDB (variable déjà fournie côté Railway)

Copie `.env.example` en `.env` en local (Railway utilise les variables du projet).

## Lancer en local

```bash
npm install
npm run dev
```

## Commandes

- `!rank`
- `!boostrank`
- `!setprotect @user` (admin) → toggle anti-derank
- `!setchannelrank #channel` (admin)
- `!setchannelderank #channel` (admin)

## Template image

Le bot utilise `Generated_image.png` à la racine du projet.
Si tu changes d’image, les coordonnées se règlent dans `src/image/renderRankCard.js`.

## Notes importantes

- Le derank est exécuté à **00h UTC** (stable sur Railway).
- Le bot a besoin des intents: `GuildMembers`, `MessageContent`, `GuildVoiceStates`.
