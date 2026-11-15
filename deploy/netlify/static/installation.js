const form = document.querySelector('#setup');
const result = document.querySelector('#result');
const words = {
  fr: { label:'Langue', title:'Installation CMCB', description:'Cette installation est réservée au propriétaire et crée le premier compte administrateur ainsi que les articles initiaux. Utilisez une base vide et dédiée. Elle se ferme après la première installation.', key:"Clé secrète d'installation", email:'E-mail administrateur', password:'Mot de passe administrateur (12 à 128 caractères)', confirm:'Confirmez le mot de passe', submit:'Installer', mismatch:'Les mots de passe ne correspondent pas.', invalidKey:'Clé d’installation invalide.', closed:'Installation fermée.', installed:'Un administrateur existe déjà.', rate:'Trop de tentatives. Réessayez plus tard.', failure:'Installation impossible. Vérifiez la configuration et les journaux privés.', network:'Connexion impossible. Réessayez ou consultez les journaux privés.', success:'Installation terminée. Supprimez la variable de clé dans Netlify et redéployez. Vous pouvez ensuite ouvrir l’administration du site.' },
  en: { label:'Language', title:'CMCB setup', description:'This setup is reserved for the owner and creates the first administrator account and initial articles. Use a new, dedicated empty database. Setup closes after the first installation.', key:'Secret installation key', email:'Administrator email', password:'Administrator password (12 to 128 characters)', confirm:'Confirm the password', submit:'Install', mismatch:'The passwords do not match.', invalidKey:'Invalid installation key.', closed:'Installation is closed.', installed:'An administrator already exists.', rate:'Too many attempts. Try again later.', failure:'Installation failed. Check the configuration and private logs.', network:'Connection failed. Try again or check the private logs.', success:'Installation complete. Remove the installation key variable from Netlify and redeploy. You can then open the site administration.' },
};
let language = 'fr';
try { if (localStorage.getItem('cmcb-lang') === 'en') language = 'en'; } catch { /* storage is optional */ }
let statusKey = '';
function renderLanguage() {
  document.documentElement.lang = language;
  document.title = words[language].title;
  document.querySelector('.languages').setAttribute('aria-label', words[language].label);
  document.querySelectorAll('[data-text]').forEach(element => { element.textContent = words[language][element.dataset.text]; });
  document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
  if (statusKey) result.textContent = words[language][statusKey];
}
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  language = button.dataset.lang;
  try { localStorage.setItem('cmcb-lang', language); } catch { /* storage is optional */ }
  renderLanguage();
}));
renderLanguage();
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusKey = ''; result.textContent = '';
  const data = new FormData(form);
  if (data.get('password') !== data.get('confirm')) { statusKey = 'mismatch'; result.textContent = words[language][statusKey]; return; }
  const button = form.querySelector('button[type="submit"]'); button.disabled = true;
  try {
    const response = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key:data.get('key'),email:data.get('email'),password:data.get('password')}) });
    const body = await response.json();
    if (!response.ok) {
      const messages = { INVALID_KEY:'invalidKey', NOT_FOUND:'closed', ALREADY_INSTALLED:'installed', RATE_LIMITED:'rate' };
      statusKey = messages[body.error?.code] || 'failure';
      result.textContent = words[language][statusKey];
      return;
    }
    form.reset(); form.hidden = true;
    statusKey = 'success'; result.textContent = words[language][statusKey];
  } catch { statusKey = 'network'; result.textContent = words[language][statusKey]; }
  finally { button.disabled = false; }
});
