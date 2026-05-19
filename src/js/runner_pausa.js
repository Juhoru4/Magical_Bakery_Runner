const initPauseModal = () => {
	const pauseButton = document.getElementById('pausar');
	const pauseModal = document.getElementById('pause-modal');
	const closeButtons = document.querySelectorAll('[data-pause-close]');

	if (!pauseButton || !pauseModal) {
		const closeButton = document.getElementById('cerrar_pausa');
		if (closeButton) {
			closeButton.addEventListener('click', () => {
				window.parent.postMessage({ type: 'pause-close' }, '*');
			});
		}
		return;
	}

	const openPause = () => {
		pauseModal.hidden = false;
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
};

document.addEventListener('DOMContentLoaded', initPauseModal);
