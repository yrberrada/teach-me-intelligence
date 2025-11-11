// Ripple expanding ring (click feedback)
export function makeRipple(x, y) {
    return { x, y, radius: 0, alpha: 0.8 };
}

// Tiny spark particles emitted from the core (reward moments)
export function makeSpark(cx, cy) {
    return {
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        alpha: 1,
        life: 1,
    };
}
