// Lógica de animación de apertura de cofre eliminada para nueva implementación.
document.addEventListener('DOMContentLoaded', function() {
	const cofreDiv = document.getElementById('cofre');
	if (!cofreDiv) return;

	// Limpiar el div y agregar el video
	cofreDiv.innerHTML = '';
	cofreDiv.style.background = 'none';
	cofreDiv.style.animation = 'shakeCofre 1.2s infinite ease-in-out';

	const video = document.createElement('video');
	video.src = '../assets/imagenes/cofre.mp4';
	video.style.width = '100%';
	video.style.height = '100%';
	video.style.objectFit = 'contain';
	video.preload = 'auto';
	video.playsInline = true;
	video.muted = true;
	video.loop = false;
	video.controls = false;
	video.setAttribute('tabindex', '-1');
	cofreDiv.appendChild(video);

	let abierto = false;
	cofreDiv.addEventListener('click', function() {
		if (abierto) return;
		abierto = true;
		cofreDiv.style.animation = 'none';
		video.play();
	});
});
