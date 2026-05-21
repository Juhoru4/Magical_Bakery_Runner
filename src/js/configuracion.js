const getStoredVolume = (key, fallback) => {
	const stored = localStorage.getItem(key);
	if (stored !== null) {
		return Number(stored);
	}

	const legacy = localStorage.getItem("volumenAudio");
	if (legacy !== null) {
		return Number(legacy);
	}

	return fallback;
};

window.addEventListener("load", () => {
	const audios = document.querySelectorAll("audio");

	if (audios.length === 0) return;

	const volumenGeneral = getStoredVolume("volumenGeneral", 0.5);
	const volumenMusica = getStoredVolume("volumenMusica", 0.5);

	audios.forEach((audio) => {
		audio.volume = volumenGeneral * volumenMusica;
	});

	const reproducir = () => {
		audios.forEach((audio) => {
			audio.play().catch(() => {});
		});

		document.removeEventListener("click", reproducir);
		document.removeEventListener("keydown", reproducir);
	};

	document.addEventListener("click", reproducir);
	document.addEventListener("keydown", reproducir);

	const menuAudio = document.getElementById("audioMenu");

	if (menuAudio) {
		const tiempoGuardado = localStorage.getItem("menuAudioTime");

		if (tiempoGuardado !== null) {
			menuAudio.currentTime = Number(tiempoGuardado);
		}

		const guardarTiempo = () => {
			localStorage.setItem("menuAudioTime", String(menuAudio.currentTime));
		};

		menuAudio.addEventListener("timeupdate", guardarTiempo);
		window.addEventListener("beforeunload", guardarTiempo);
	}
});

const sliderGeneral = document.getElementById("volumenGeneral");
const sliderMusica = document.getElementById("volumenMusica");
const sliderEfectos = document.getElementById("volumenEfectos");

if (sliderGeneral && sliderMusica && sliderEfectos) {
	sliderGeneral.value = getStoredVolume("volumenGeneral", 0.5);
	sliderMusica.value = getStoredVolume("volumenMusica", 0.5);
	sliderEfectos.value = getStoredVolume("volumenEfectos", 0.5);

	const audios = document.querySelectorAll("audio");
	const aplicarVolumenMusica = () => {
		const general = Number(sliderGeneral.value);
		const musica = Number(sliderMusica.value);
		audios.forEach((audio) => {
			audio.volume = general * musica;
		});
	};

	aplicarVolumenMusica();

	sliderGeneral.addEventListener("input", () => {
		localStorage.setItem("volumenGeneral", String(Number(sliderGeneral.value)));
		aplicarVolumenMusica();
	});

	sliderMusica.addEventListener("input", () => {
		localStorage.setItem("volumenMusica", String(Number(sliderMusica.value)));
		aplicarVolumenMusica();
	});

	sliderEfectos.addEventListener("input", () => {
		localStorage.setItem("volumenEfectos", String(Number(sliderEfectos.value)));
	});
}
