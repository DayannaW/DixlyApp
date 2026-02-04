let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // evita que Chrome muestre el banner automático
  deferredPrompt = e;

  // muestras tu botón
  const btn = document.getElementById('btnInstalar');
  if (btn) btn.style.display = 'block';
});

document.getElementById('btnInstalar')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;

  // opcional: ocultar el botón después
  document.getElementById('btnInstalar').style.display = 'none';
});
