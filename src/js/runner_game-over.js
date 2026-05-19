const initGameOverModal = () => {
	const gameOverModal = document.getElementById('game-over-modal');

	if (!gameOverModal) {
		return;
	}

	const openGameOver = () => {
		gameOverModal.hidden = false;
	};

	window.addEventListener('game-over-state', (event) => {
		if (event.detail && event.detail.gameOver) {
			openGameOver();
		}
	});
};

document.addEventListener('DOMContentLoaded', initGameOverModal);
