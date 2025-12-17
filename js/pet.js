// Mascota virtual con Lottie
const Pet = (() => {
    let containers = {};
    let instances = {};
    let dialogTimeout = null;

    const ANIMS = {
        idle: '../../assets/animaciones/pixel.json',
        happy: '../../assets/animaciones/pixel.json',
        sad: '../../assets/animaciones/pixel.json',
        talk: '../../assets/animaciones/pixel.json'
    };

    function createContainer(id) {
        const c = document.createElement('div');
        c.className = 'pet-anim-container';
        c.id = id;
        c.style.display = 'none';
        return c;
    }

    function load() {
        const root = document.getElementById('pixel-animation');
        if (!root || typeof lottie === 'undefined') return;

        // create containers for each anim
        Object.keys(ANIMS).forEach(key => {
            const cont = createContainer('pet-' + key);
            root.appendChild(cont);
            containers[key] = cont;

            instances[key] = lottie.loadAnimation({
                container: cont,
                renderer: 'svg',
                loop: key === 'idle' || key === 'talk',
                autoplay: true,
                path: ANIMS[key]
            });

            // ensure play paused until shown
            instances[key].stop();
        });
    }

    function show(key) {
        Object.keys(containers).forEach(k => {
            containers[k].style.display = k === key ? 'block' : 'none';
            try {
                if (k === key) {
                    instances[k].goToAndPlay(0, true);
                } else {
                    instances[k].stop();
                }
            } catch (e) {}
        });
    }

    function speak(text, duration = 2200) {
        const dialog = document.getElementById('pixel-dialog');
        const tnode = document.getElementById('pixel-text');
        if (!dialog || !tnode) return;

        if (dialogTimeout) clearTimeout(dialogTimeout);

        tnode.textContent = text;
        dialog.classList.add('visible');
        show('talk');

        dialogTimeout = setTimeout(() => {
            dialog.classList.remove('visible');
            show('idle');
        }, duration);
    }

    function init() {
        load();
        // small delay to ensure lottie instances ready
        setTimeout(() => show('idle'), 200);
    }

    function setHappy() { show('happy'); }
    function setSad() { show('sad'); }
    function setIdle() { show('idle'); }

    return { init, speak, setHappy, setSad, setIdle };
})();

export default Pet;
