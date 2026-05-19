const initGameOverModal = () => {
	const gameOverModal = document.getElementById('game-over-modal');
	const scoreValue = document.getElementById('game-over-score');

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
