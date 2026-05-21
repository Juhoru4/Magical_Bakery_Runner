const initGameOverModal = () => {
	const gameOverModal = document.getElementById('game-over-modal');
	const scoreValue = document.getElementById('game-over-score');
	const gameOverAudio = new Audio('../src/sounds/gameOver.mp3');
	gameOverAudio.preload = 'auto';

	if (!gameOverModal) {
		if (!scoreValue) {
			return;
		}

		window.addEventListener('message', (event) => {
			if (!event.data || event.data.type !== 'game-over-data') {
				return;
			}

			scoreValue.textContent = event.data.scoreText || '00000';
		});
		return;
	}

	const gameOverFrame = document.getElementById('game-over-frame');

	const openGameOver = (scoreText) => {
		gameOverModal.hidden = false;
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

		const volumenGeneral = getStoredVolume('volumenGeneral', 0.5);
		const volumenEfectos = getStoredVolume('volumenEfectos', 0.5);
		gameOverAudio.volume = volumenGeneral * volumenEfectos;
		gameOverAudio.currentTime = 0;
		gameOverAudio.play().catch(() => {});
		if (gameOverFrame && gameOverFrame.contentWindow) {
			gameOverFrame.contentWindow.postMessage({
				type: 'game-over-data',
				scoreText,
			}, '*');
		}
	};

	window.addEventListener('game-over-state', (event) => {
		if (event.detail && event.detail.gameOver) {
			openGameOver(event.detail.scoreText || '00000');
		}
	});
};

document.addEventListener('DOMContentLoaded', initGameOverModal);
