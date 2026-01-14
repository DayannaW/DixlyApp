// Animación de cofre con Lottie: cerrado -> animación apertura -> abierto loop
document.addEventListener('DOMContentLoaded', function() {
	const cofreDiv = document.getElementById('cofre');
	if (!cofreDiv) return;
	cofreDiv.innerHTML = '';
	cofreDiv.style.background = 'none';
	cofreDiv.style.animation = 'none';

	// Crear dos contenedores superpuestos para el fade
	const lottieContainer1 = document.createElement('div');
	const lottieContainer2 = document.createElement('div');
	[lottieContainer1, lottieContainer2].forEach(c => {
		c.style.position = 'absolute';
		c.style.left = '0';
		c.style.top = '0';
		c.style.width = '100%';
		c.style.height = '100%';
		c.style.pointerEvents = 'none';
		c.style.transition = 'opacity 0.35s';
		c.style.opacity = '0';
	});
	lottieContainer1.style.zIndex = '1';
	lottieContainer2.style.zIndex = '2';
	cofreDiv.style.position = 'relative';
	cofreDiv.appendChild(lottieContainer1);
	cofreDiv.appendChild(lottieContainer2);

	let current = 0; // 0 o 1
	let lottieInstances = [null, null];
	let abierto = false;

	function fadeTo(nextAnim, nextPath, loop, onComplete) {
		const prev = current;
		const next = 1 - current;
		// Cargar la nueva animación en el contenedor superior
		if (lottieInstances[next]) {
			lottieInstances[next].destroy();
		}
		lottieContainer2.style.opacity = '0';
		lottieContainer1.style.opacity = '0';
		lottieInstances[next] = window.lottie.loadAnimation({
			container: [lottieContainer1, lottieContainer2][next],
			renderer: 'svg',
			loop: loop,
			autoplay: true,
			path: nextPath
		});
		// Fade in la nueva animación
		setTimeout(() => {
			[lottieContainer1, lottieContainer2][next].style.opacity = '1';
			[lottieContainer1, lottieContainer2][prev].style.opacity = '0';
		}, 10);
		// Cuando termina, ejecutar callback y limpiar la anterior
		if (!loop && onComplete) {
			   // Lanzar evento a la mitad de la animación de apertura
			   const anim = lottieInstances[next];
			   let mitadLanzada = false;
			   anim.addEventListener('enterFrame', function mitadFrame(e) {
				   if (!mitadLanzada && anim.totalFrames && e.currentTime >= anim.totalFrames / 2) {
					   mitadLanzada = true;
					   cofreDiv.dispatchEvent(new CustomEvent('cofreMitadAbierto'));
					   anim.removeEventListener('enterFrame', mitadFrame);
				   }
			   });
			   anim.addEventListener('complete', () => {
				   // Precargar la animación abierta antes de hacer el fade
				   const openPath = '../assets/animaciones/cofre_abierto.json';
				   const openNext = prev; // Usar el contenedor que queda libre
				   // Cargar la animación abierta en el contenedor oculto
				   if (lottieInstances[openNext]) lottieInstances[openNext].destroy();
				   lottieInstances[openNext] = window.lottie.loadAnimation({
					   container: [lottieContainer1, lottieContainer2][openNext],
					   renderer: 'svg',
					   loop: true,
					   autoplay: false,
					   path: openPath
				   });
				   lottieInstances[openNext].addEventListener('DOMLoaded', () => {
					   // Cuando esté lista, hacer fade-in y reproducir
					   lottieInstances[openNext].goToAndPlay(0, true);
					   [lottieContainer1, lottieContainer2][openNext].style.opacity = '1';
					   [lottieContainer1, lottieContainer2][next].style.opacity = '0';
					   // Esperar a que termine el fade antes de destruir la anterior
					   setTimeout(() => {
						   if (lottieInstances[next]) lottieInstances[next].destroy();
						   current = openNext;
						   // Lanzar evento personalizado para avisar que el cofre está abierto completamente
						   cofreDiv.dispatchEvent(new CustomEvent('cofreAbierto'));
					   }, 350);
				   });
			   });
		} else if (loop) {
			if (lottieInstances[prev]) lottieInstances[prev].destroy();
		}
		current = next;
	}

	// Mostrar cofre cerrado al inicio
	lottieInstances[0] = window.lottie.loadAnimation({
		container: lottieContainer1,
		renderer: 'svg',
		loop: true,
		autoplay: true,
		path: '../assets/animaciones/cofre_cerrado.json'
	});
	lottieContainer1.style.opacity = '1';

	cofreDiv.style.cursor = 'pointer';
	cofreDiv.onclick = function() {
		if (abierto) return;
		abierto = true;
		   fadeTo(lottieInstances[1], '../assets/animaciones/cofre.json', false, function() {
			   // La transición a abierto ahora se maneja dentro del callback de 'complete' para evitar frames vacíos
		   });
	};
});
