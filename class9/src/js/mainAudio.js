window.addEventListener('load', function() {

    const audios = document.querySelectorAll("audio");

    if (audios.length === 0) return;

    let volumenGuardado = localStorage.getItem("volumenAudio");
    let volumen = volumenGuardado !== null ? volumenGuardado : 0.5;

    // aplicar volumen a todos
    audios.forEach(audio => {
        audio.volume = volumen;
    });

    // reproducir con interacción
    const reproducir = function() {
        audios.forEach(audio => {
            audio.play().catch(() => {});
        });

        document.removeEventListener('click', reproducir);
        document.removeEventListener('keydown', reproducir);
    };

    document.addEventListener('click', reproducir);
    document.addEventListener('keydown', reproducir);
});


// SETTINGS
const slider = document.getElementById("volumenControl");

if (slider) {
    let volumenGuardado = localStorage.getItem("volumenAudio");
    slider.value = volumenGuardado !== null ? volumenGuardado : 0.5;

    const audios = document.querySelectorAll("audio");

    audios.forEach(a => a.volume = slider.value);

    slider.addEventListener("input", () => {
        let nuevoVolumen = slider.value;

        localStorage.setItem("volumenAudio", nuevoVolumen);

        audios.forEach(a => a.volume = nuevoVolumen);
    });
}