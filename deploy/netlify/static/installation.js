const form = document.querySelector('#setup');
const result = document.querySelector('#result');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  result.textContent = '';
  const data = new FormData(form);
  if (data.get('password') !== data.get('confirm')) { result.textContent = 'Les mots de passe ne correspondent pas.'; return; }
  const button = form.querySelector('button'); button.disabled = true;
  try {
    const response = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key:data.get('key'),email:data.get('email'),password:data.get('password')}) });
    const body = await response.json();
    if (!response.ok) { result.textContent = body.error?.message || 'Installation impossible. Vérifiez la configuration et les journaux privés.'; return; }
    form.reset(); form.hidden = true;
    result.textContent = 'Installation terminée. Supprimez la variable de clé dans Netlify et redéployez. Vous pouvez ensuite ouvrir l’administration du site.';
  } catch { result.textContent = 'Connexion impossible. Réessayez ou consultez les journaux privés.'; }
  finally { button.disabled = false; }
});
