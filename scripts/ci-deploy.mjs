import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const cheminClientJson = process.argv[2];

if (!cheminClientJson || !fs.existsSync(cheminClientJson)) {
  console.error(`❌ Fichier introuvable : ${cheminClientJson}`);
  process.exit(1);
}

// 1. Extraction des données et calcul du slug
const siteData = JSON.parse(fs.readFileSync(cheminClientJson, 'utf-8'));
const nomCommercial = siteData.identite?.nomCommercial || "vitrine";
const ville = siteData.contact?.ville || "";

const slugProjet = `${nomCommercial}-${ville}`
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 50);

console.log(`\n🚀 Déploiement automatique pour : ${nomCommercial} -> ${slugProjet}.pages.dev`);

// 2. Injection des données dans le template
const cible = path.resolve('src/data/site.json');
fs.mkdirSync(path.dirname(cible), { recursive: true });
fs.copyFileSync(cheminClientJson, cible);

// 3. Build Astro
console.log('⚙️ Compilation du template...');
execSync('npm run build', { stdio: 'inherit' });

// 4. Déploiement vers Cloudflare Pages
console.log('☁️ Envoi vers Cloudflare Pages...');
execSync(
  `npx wrangler pages deploy dist --project-name="${slugProjet}" --commit-dirty=true`,
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    }
  }
);

console.log(`\n✅ Déploiement réussi : https://${slugProjet}.pages.dev\n`);
