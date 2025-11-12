// src/ui/transcript.js
let container;
const MAX_BUBBLES = 6; // keep last six visible

export function resetTranscript() {
    container = document.getElementById('transcript');
    if (!container) return;
    container.innerHTML = '';
}

export function queueLine(tMs, who, text) {
    if (!container) container = document.getElementById('transcript');
    if (!container) return;

    setTimeout(() => {
        // create bubble
        const div = document.createElement('div');
        div.className = 'bubble ' + (who === 'Narrator' ? 'narrator' : who === 'Core' ? 'core' : 'you');
        div.textContent = text;
        container.appendChild(div);

        // remove older beyond cap (fade + remove)
        const nodes = Array.from(container.querySelectorAll('.bubble'));
        while (nodes.length > MAX_BUBBLES) {
            const first = nodes.shift();
            first.classList.add('fade-out');
            setTimeout(() => first.remove(), 350);
        }
    }, Math.max(0, tMs - performance.now()));
}
