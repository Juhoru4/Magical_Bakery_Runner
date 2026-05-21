window.addEventListener("load", () => {
	const audios = document.querySelectorAll("audio");

	if (audios.length === 0) return;

	const volumenGuardado = localStorage.getItem("volumenAudio");
	const volumen = volumenGuardado !== null ? Number(volumenGuardado) : 0.5;

	audios.forEach((audio) => {
		audio.volume = volumen;
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

const slider = document.getElementById("volumenControl");

if (slider) {
	const volumenGuardado = localStorage.getItem("volumenAudio");
	slider.value = volumenGuardado !== null ? volumenGuardado : 0.5;

	const audios = document.querySelectorAll("audio");
	audios.forEach((audio) => {
		audio.volume = Number(slider.value);
	});

	slider.addEventListener("input", () => {
		const nuevoVolumen = Number(slider.value);

		localStorage.setItem("volumenAudio", String(nuevoVolumen));

		audios.forEach((audio) => {
			audio.volume = nuevoVolumen;
		});
	});
}
