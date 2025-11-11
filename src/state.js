// Simple global store for this chapter
export const State = {
    started: false,
    clicks: 0,
    idleSince: performance.now(),
};

// helper to reset idle timer
export function markActivity() {
    State.idleSince = performance.now();
}
