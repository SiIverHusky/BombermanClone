function playSound(soundName) {
    //soundName without .wav

    const audio = new Audio(`sounds/${soundName}.wav`);
    if (audio) {
        audio.currentTime = 0; 
        audio.play();
    } else {
        console.error(`Sound ${soundName} not found.`);
    }
}