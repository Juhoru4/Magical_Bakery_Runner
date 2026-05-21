window.addEventListener("load", () => {
    const audios = document.querySelectorAll("audio");

    if (audios.length === 0) return;

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

    const volumenGeneral = getStoredVolume("volumenGeneral", 0.5);
    const volumenMusica = getStoredVolume("volumenMusica", 0.5);
    const volumen = volumenGeneral * volumenMusica;

    audios.forEach((audio) => {
        audio.volume = volumen;
    });

    let isRunnerPaused = false;

    const reproducir = () => {
        if (runnerAudio && isRunnerPaused) {
            return;
        }

        audios.forEach((audio) => {
            audio.play().catch(() => {});
        });

        document.removeEventListener("click", reproducir);
        document.removeEventListener("keydown", reproducir);
    };

    document.addEventListener("click", reproducir);
    document.addEventListener("keydown", reproducir);

    const menuAudio = document.getElementById("audioMenu");
    const runnerAudio = document.getElementById("audioRunner");

    if (menuAudio) {
        const referrer = document.referrer || "";
        const cameFromRunner = referrer.includes("/pages/runner.html")
            || referrer.includes("/pages/runner_pausa.html")
            || referrer.includes("/pages/runner_game-over.html");

        if (cameFromRunner) {
            localStorage.removeItem("menuAudioTime");
        }

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

    if (runnerAudio) {
        let pausedTime = 0;

        window.addEventListener("pause-state", (event) => {
            const paused = Boolean(event.detail && event.detail.paused);
            isRunnerPaused = paused;

            if (paused) {
                pausedTime = runnerAudio.currentTime;
                runnerAudio.pause();
                return;
            }

            runnerAudio.currentTime = pausedTime;
            runnerAudio.play().catch(() => {});
        });

        window.addEventListener("game-over-state", (event) => {
            if (event.detail && event.detail.gameOver) {
                runnerAudio.pause();
                runnerAudio.currentTime = 0;
            }
        });
    }
});
