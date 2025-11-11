// Premium Space Fabric (2D Canvas, no WebGL)
// - 3 parallax star layers (twinkle, streaks, heartbeat & mouse parallax)
// - Flow-field dust for depth
// - Chromatic glow for the Core (perfectly round at any DPI)
// - "Droplet in space": ripple rings + subtle local refraction (background warp)
// - Sparkle bursts, bloom, warm tint, cursor halo

const CFG = {
    // star field
    starDensityDiv: 5200,
    starBright: [0.55, 0.95, 1.25],
    starDrift:  [0.34, 0.78, 1.32],
    // dust
    dustCountDiv: 2000, dustAlpha:.16, dustSpeed:.30, dustOrbitPull:.010,
    // interaction
    mousePull:.006, cursorHalo:.18,
    // core
    coreBase:.23, coreInnerAlpha:.86, coreOuterAlpha:.24, chromDisp:1.9,
    // effects
    rippleLife:110, sparkleLife:54, breathSpeed:.008
};

/* --------------------------- State --------------------------- */
const S = {
    ctx:null, w:0, h:0, dpr:1, t:0, raf:0,
    breath:0, tintWarm:0, bloom:0, starBoost:0,
    starsA:[], starsB:[], starsC:[], streaks:[], dust:[],
    sparkles:[], ripples:[],
    mouse:{x:.5,y:.5, px:.5, py:.5},
    // offscreen for refraction
    off:null, offCtx:null
};

/* ------------------------- Bootstrap ------------------------- */
export function startVisuals(canvas){
    S.ctx = canvas.getContext('2d', { alpha:true, desynchronized:true });
    S.off = document.createElement('canvas');
    S.offCtx = S.off.getContext('2d', { alpha:true });

    resize(canvas);
    addEventListener('resize', ()=>resize(canvas));
    addEventListener('mousemove', (e)=>{
        const r = canvas.getBoundingClientRect();
        S.mouse.px = S.mouse.x; S.mouse.py = S.mouse.y;
        S.mouse.x = (e.clientX - r.left) / r.width;
        S.mouse.y = (e.clientY - r.top)  / r.height;
    });

    const loop = () => { draw(canvas); S.t++; S.raf = requestAnimationFrame(loop); };
    loop();
}
export function stopVisuals(){ cancelAnimationFrame(S.raf); }

/* ---------------------------- API ---------------------------- */
export function heartbeatPulse(str=1){ S.breath = Math.min(1, S.breath + 0.30*str); }
export function sparkleBurst(n=16){ for(let i=0;i<n;i++) S.sparkles.push({age:0}); }
export function setWarmTint(v){ S.tintWarm = Math.max(0, Math.min(1, v)); }
export function triggerBloom(){ S.bloom = Math.max(0.001, S.bloom); }

/** User click -> ripple + star boost + sparkle + local refraction */
export function clickImpulse(nx=S.mouse.x, ny=S.mouse.y){
    S.ripples.push({ x:nx, y:ny, age:0, life:CFG.rippleLife });
    S.starBoost = Math.min(1, S.starBoost + 0.38);
    sparkleBurst(22);
    heartbeatPulse(0.9);
}

/* ---------------------- Internal helpers --------------------- */
function resize(c){
    const dpr = window.devicePixelRatio || 1;
    S.dpr = dpr;
    const cssW = c.clientWidth, cssH = c.clientHeight;
    const w = Math.floor(cssW*dpr), h = Math.floor(cssH*dpr);
    if (c.width !== w || c.height !== h){ c.width=w; c.height=h; }
    S.w=w; S.h=h;

    S.off.width = w; S.off.height = h;

    const base = Math.max(700, Math.floor((w*h)/CFG.starDensityDiv));
    S.starsA = seedStars(base*.60);
    S.starsB = seedStars(base*.30);
    S.starsC = seedStars(base*.12);
    S.streaks.length = 0;

    const dustN = Math.max(900, Math.floor((w*h)/CFG.dustCountDiv));
    S.dust = Array.from({length:dustN}, ()=>({
        x:Math.random(), y:Math.random(),
        a:Math.random()*6.283, s:Math.random()*0.9+0.35, v:Math.random()*0.5+0.5
    }));
}
const seedStars = n => Array.from({length:n}, () => ({
    x: Math.random(), y: Math.random(),
    s: Math.random()*1.6 + 0.4, ph: Math.random()*6.283
}));
function hash(n){ return Math.sin(n*78.233)*43758.5453 % 1; }
function snoise(x,y,t){
    const i=Math.floor(x), j=Math.floor(y), fx=x-i, fy=y-j;
    const a=hash(i*12.99+j*78.23+t*.015), b=hash((i+1)*12.99+j*78.23+t*.015),
        c=hash(i*12.99+(j+1)*78.23+t*.015), d=hash((i+1)*12.99+(j+1)*78.23+t*.015);
    const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
    return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+d*u*v;
}

/* --------------------------- Render -------------------------- */
function draw(canvas){
    const {ctx,offCtx,w,h,t}=S; if(!ctx||!offCtx) return;
    ctx.setTransform(1,0,0,1,0,0);

    S.breath *= .94; S.tintWarm *= .993; S.starBoost *= .95;

    // 1) DRAW SPACE LAYERS TO OFFSCREEN (for refraction)
    // ------------------------------------------------
    offCtx.setTransform(1,0,0,1,0,0);
    offCtx.clearRect(0,0,w,h);

    const k = 16 + Math.floor(34*S.tintWarm);
    const bg = offCtx.createRadialGradient(w*.5,h*.5,10, w*.5,h*.5, Math.max(w,h)*.72);
    bg.addColorStop(0, `rgba(${k}, ${k+44}, 96, .22)`); bg.addColorStop(1, '#0b0e14');
    offCtx.fillStyle = bg; offCtx.fillRect(0,0,w,h);

    const parx = (S.mouse.x-.5), pary = (S.mouse.y-.5);
    const hbBoost = 1 + .6*S.breath; // heartbeat influence

    drawStars(offCtx, S.starsA, CFG.starDrift[0]*hbBoost, .07*hbBoost, parx*.03,  pary*.03,  CFG.starBright[0]);
    drawStars(offCtx, S.starsB, CFG.starDrift[1]*hbBoost, .11*hbBoost, parx*.03,  pary*.03,  CFG.starBright[1]);
    drawStars(offCtx, S.starsC, CFG.starDrift[2]*hbBoost, .16*hbBoost, parx*.03,  pary*.03,  CFG.starBright[2]);
    drawStreaks(offCtx);

    drawDust(offCtx, parx, pary);

    // 2) COPY OFFSCREEN TO MAIN, THEN APPLY LOCAL REFRACTION PATCHES
    // --------------------------------------------------------------
    ctx.drawImage(S.off, 0, 0);

    // local refraction (per ripple): clip a circle and re-draw that area with tiny offset/scale
    for(let i=S.ripples.length-1;i>=0;i--){
        const rp=S.ripples[i]; rp.age++;
        const a=1-rp.age/rp.life; if(a<=0){ S.ripples.splice(i,1); continue; }
        const rr=(rp.age/rp.life)*Math.max(w,h)*.55;
        const x=rp.x*w, y=rp.y*h;

        // phase displacement
        const phase = Math.sin((rp.age/rp.life)*Math.PI);
        const shift = (2 + rr*0.002) * a * phase;  // pixel shift
        const scale = 1 + 0.015 * a * phase;

        // clip circle
        ctx.save();
        ctx.beginPath(); ctx.arc(x,y, rr, 0, Math.PI*2); ctx.clip();

        // re-draw the offscreen region, slightly shifted and scaled → refraction illusion
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.translate(-x, -y);
        ctx.drawImage(S.off, shift*-0.6, shift*0.6); // subtle diagonal shift
        ctx.restore();

        // ring line
        ctx.lineWidth = Math.max(1,(1-a)*3);
        ctx.strokeStyle = `rgba(200,220,255,${.28*a})`;
        ctx.beginPath(); ctx.arc(x,y,rr,0,Math.PI*2); ctx.stroke();
    }

    // 3) CORE + EFFECTS ON TOP
    // ------------------------
    const breath = .55 + .45*Math.sin(t*CFG.breathSpeed) + S.breath*.8;
    const R = (Math.min(w,h)*CFG.coreBase) * (.8 + .22*breath);
    const cx = w*.5 + parx*36, cy = h*.5 + pary*22;

    drawChromaticGlow(ctx, cx, cy, R*1.38, CFG.chromDisp, CFG.coreOuterAlpha);
    ctx.fillStyle = `rgba(180,220,255,${CFG.coreInnerAlpha})`;
    ctx.beginPath(); ctx.arc(cx,cy,R*.36,0,Math.PI*2); ctx.fill();

    // sparkles
    for (let i=S.sparkles.length-1;i>=0;i--){
        const sp=S.sparkles[i]; sp.age++; const life=CFG.sparkleLife, a=1-sp.age/life;
        if(a<=0){ S.sparkles.splice(i,1); continue; }
        const r=(sp.age/life)*150, ang=i*.5 + sp.age*.12;
        const x=cx+Math.cos(ang)*r, y=cy+Math.sin(ang)*r;
        ctx.globalAlpha=.92*a; ctx.fillStyle='rgba(235,248,255,.98)'; ctx.fillRect(x,y,2.3,2.3);
    }
    ctx.globalAlpha=1;

    // cursor halo
    if (CFG.cursorHalo>0){
        const gh = ctx.createRadialGradient(S.mouse.x*w, S.mouse.y*h, 0, S.mouse.x*w, S.mouse.y*h, Math.min(w,h)*.15);
        gh.addColorStop(0, `rgba(180,210,255,${.2*CFG.cursorHalo})`);
        gh.addColorStop(1, `rgba(0,0,0,0)`); ctx.fillStyle = gh; ctx.fillRect(0,0,w,h);
    }

    // bloom
    if(S.bloom>0){
        S.bloom = Math.min(1, S.bloom + .013);
        ctx.fillStyle = `rgba(255,255,255, ${1-(1-S.bloom)*(1-S.bloom)})`;
        ctx.fillRect(0,0,w,h);
    }
}

/* ----------------------- Layer renderers ---------------------- */
function drawStars(g, arr, dx, dy, parx, pary, bright){
    const w=S.w, h=S.h, t=S.t;
    g.save(); g.fillStyle='#e8f1ff';
    const boost = 1 + S.starBoost*1.6;
    for(const s of arr){
        const tw = bright*(.65 + .35*(.5+.5*Math.sin(t*.03+s.ph)));
        g.globalAlpha = tw;
        const x = (s.x + parx) * w, y = (s.y + pary) * h;
        g.fillRect(x, y, s.s, s.s);
        if (Math.random() < 0.00009) S.streaks.push({x, y, life: 60, age: 0, dir: (Math.random()<0.5?1:-1)});
        s.x -= (dx*boost)/(w*.55); if(s.x<0) s.x += 1;
        s.y += (dy*boost)/(h*.55); if(s.y>1) s.y -= 1;
    }
    g.restore();
}
function drawStreaks(g){
    for(let i=S.streaks.length-1;i>=0;i--){
        const s=S.streaks[i]; s.age++; const a=1 - s.age/s.life; if(a<=0){ S.streaks.splice(i,1); continue; }
        const len = 56*(1-a);
        g.globalAlpha = .6*a; g.strokeStyle='rgba(230,245,255,.95)'; g.lineWidth=1;
        g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x+len*s.dir, s.y-len*.16); g.stroke(); g.globalAlpha=1;
    }
}
function drawDust(g, parx, pary){
    const w=S.w, h=S.h, t=S.t;
    g.save(); g.fillStyle = `rgba(215,235,255,${CFG.dustAlpha})`;
    const cx = w*.5 + parx*36, cy = h*.5 + pary*22;

    for(const p of S.dust){
        const fx = snoise(p.x*6.2, p.y*6.2, t) - .5;
        const fy = snoise(p.y*6.2, p.x*6.2, t) - .5;

        let vx = fx*CFG.dustSpeed*p.v, vy = fy*CFG.dustSpeed*p.v;

        const sx=p.x*w, sy=p.y*h, dx=cx-sx, dy=cy-sy, dist=Math.hypot(dx,dy)+1;
        vx += (-dy/dist)*CFG.dustOrbitPull; vy += (dx/dist)*CFG.dustOrbitPull;
        vx += (S.mouse.x*w - sx) * CFG.mousePull * 0.0005;
        vy += (S.mouse.y*h - sy) * CFG.mousePull * 0.0005;

        p.x += vx / w; p.y += vy / h;
        if (p.x<0) p.x+=1; else if(p.x>1) p.x-=1;
        if (p.y<0) p.y+=1; else if(p.y>1) p.y-=1;

        g.globalAlpha = CFG.dustAlpha * (0.4 + 0.6*Math.min(1, 220/dist));
        g.fillRect(p.x*w, p.y*h, p.s, p.s);
    }
    g.restore();
}
function drawChromaticGlow(g, x, y, R, disp=1.9, baseAlpha=.24){
    const Ls = [
        {dx:-disp, dy:0,    col:`rgba(135,195,255,${baseAlpha})`},
        {dx: disp, dy:0,    col:`rgba(200,230,255,${baseAlpha})`},
        {dx: 0,    dy:disp, col:`rgba(160,210,255,${baseAlpha})`},
    ];
    for(const L of Ls){
        const grd = g.createRadialGradient(x+L.dx,y+L.dy,R*.18, x+L.dx,y+L.dy,R);
        grd.addColorStop(0, L.col); grd.addColorStop(1, 'rgba(20,40,80,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(x+L.dx,y+L.dy,R,0,Math.PI*2); g.fill();
    }
}
