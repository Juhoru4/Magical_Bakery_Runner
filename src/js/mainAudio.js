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
