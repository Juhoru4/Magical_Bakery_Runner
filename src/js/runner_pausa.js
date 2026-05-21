const getStoredVolume = (key, fallback) => {
	const stored = localStorage.getItem(key);
	if (stored !== null) {
		return Number(stored);
	}

	const legacy = localStorage.getItem('volumenAudio');
	if (legacy !== null) {
		return Number(legacy);
	}

	return fallback;
};

const applyRunnerMusicVolume = () => {
	const general = getStoredVolume('volumenGeneral', 0.5);
	const musica = getStoredVolume('volumenMusica', 0.5);
	const parentDoc = window.parent ? window.parent.document : document;
	const runnerAudio = parentDoc.getElementById('audioRunner');

	if (runnerAudio) {
		runnerAudio.volume = general * musica;
	}
};

const initVolumeSliders = () => {
	const sliderGeneral = document.getElementById('volumenGeneral');
	const sliderMusica = document.getElementById('volumenMusica');
	const sliderEfectos = document.getElementById('volumenEfectos');

	if (!sliderGeneral || !sliderMusica || !sliderEfectos) {
		return;
	}

	sliderGeneral.value = getStoredVolume('volumenGeneral', 0.5);
	sliderMusica.value = getStoredVolume('volumenMusica', 0.5);
	sliderEfectos.value = getStoredVolume('volumenEfectos', 0.5);

	applyRunnerMusicVolume();

	sliderGeneral.addEventListener('input', () => {
		localStorage.setItem('volumenGeneral', String(Number(sliderGeneral.value)));
		applyRunnerMusicVolume();
	});

	sliderMusica.addEventListener('input', () => {
		localStorage.setItem('volumenMusica', String(Number(sliderMusica.value)));
		applyRunnerMusicVolume();
	});

	sliderEfectos.addEventListener('input', () => {
		localStorage.setItem('volumenEfectos', String(Number(sliderEfectos.value)));
	});
};

const initPauseModal = () => {
	const pauseButton = document.getElementById('pausar');
	const pauseModal = document.getElementById('pause-modal');
	const closeButtons = document.querySelectorAll('[data-pause-close]');
	const pauseAudio = new Audio('../src/sounds/pause.mp3');
	pauseAudio.preload = 'auto';

	if (!pauseButton || !pauseModal) {
		const closeButton = document.getElementById('cerrar_pausa');
		if (closeButton) {
			closeButton.addEventListener('click', () => {
				window.parent.postMessage({ type: 'pause-close' }, '*');
			});
		}
		initVolumeSliders();
		return;
	}

	const openPause = () => {
		pauseModal.hidden = false;
		const volumenGeneral = getStoredVolume('volumenGeneral', 0.5);
		const volumenEfectos = getStoredVolume('volumenEfectos', 0.5);
		pauseAudio.volume = volumenGeneral * volumenEfectos;
		pauseAudio.currentTime = 0;
		pauseAudio.play().catch(() => {});
		window.dispatchEvent(new CustomEvent('pause-state', { detail: { paused: true } }));
	};

	const closePause = () => {
		pauseModal.hidden = true;
		window.dispatchEvent(new CustomEvent('pause-state', { detail: { paused: false } }));
	};

	pauseButton.addEventListener('click', openPause);

	for (const closeButton of closeButtons) {
		closeButton.addEventListener('click', closePause);
	}

	window.addEventListener('message', (event) => {
		if (event.data && event.data.type === 'pause-close') {
			closePause();
		}
	});

	initVolumeSliders();
};

document.addEventListener('DOMContentLoaded', initPauseModal);
