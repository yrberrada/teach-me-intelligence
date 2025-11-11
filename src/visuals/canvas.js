import { makeRipple, makeSpark } from "./particles.js";

/**
 * Renderer draws the glowing core + ripples + sparks.
 * It owns the <canvas> and runs an animation loop.
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.center = { x: innerWidth / 2, y: innerHeight / 2 };
        this.ripples = [];
        this.sparks = [];
        this.coreGlow = 0.3; // base intensity
        this.breath = 0;

        window.addEventListener("resize", () => this.resize());
        this.resize();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
        this.center.x = this.canvas.width / 2;
        this.center.y = this.canvas.height / 2;
    }

    addRipple(x, y) {
        this.ripples.push(makeRipple(x, y));
    }

    pulse() {
        this.coreGlow = Math.min(1, this.coreGlow + 0.15);
    }

    addSparks(n = 12) {
        for (let i = 0; i < n; i++) this.sparks.push(makeSpark(this.center.x, this.center.y));
    }

    loop() {
        const { ctx, canvas } = this;

        // clear + soft gradient background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = ctx.createRadialGradient(
            this.center.x, this.center.y, 0,
            this.center.x, this.center.y,
            Math.max(canvas.width, canvas.height) * 0.6
        );
        gradient.addColorStop(0, "rgba(125,211,252,0.15)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // breathing core
        this.breath += 0.02;
        const base = 40 + Math.sin(this.breath) * 5;
        const radius = base + this.coreGlow * 28;

        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(125,211,252,0.25)";
        ctx.shadowColor = "rgba(125,211,252,0.45)";
        ctx.shadowBlur = 30 + this.coreGlow * 60;
        ctx.fill();
        ctx.shadowBlur = 0;

        // ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += 5;
            r.alpha *= 0.96;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(125,211,252,${r.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            if (r.alpha < 0.02) this.ripples.splice(i, 1);
        }

        // sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += s.vx; s.y += s.vy;
            s.vx *= 0.99; s.vy *= 0.99;
            s.life -= 0.01; s.alpha *= 0.98;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(199,210,254,${s.alpha})`;
            ctx.fill();
            if (s.life <= 0) this.sparks.splice(i, 1);
        }

        // vignette
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // relax glow
        this.coreGlow = Math.max(0.3, this.coreGlow * 0.98);

        requestAnimationFrame(this.loop);
    }
}
