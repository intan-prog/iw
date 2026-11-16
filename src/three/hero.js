import * as THREE from 'three';
import gsap from 'gsap';

// Hero: cup takeaway hitam + cangkir keramik (latte art) + air kopi mengorbit + uap
export function createHero(world) {
  const { quality } = world;
  const TAU = Math.PI * 2;

  // anchor = posisi/layout responsif & tilt mouse
  // group  = dianimasikan oleh scroll (GSAP di main.js)
  // pair   = isi: cup, cangkir, aliran kopi, uap
  const anchor = new THREE.Group();
  const group = new THREE.Group();
  const pair = new THREE.Group();
  anchor.add(group);
  group.add(pair);
  world.scene.add(anchor);

  // ---- Animasi masuk (0 = belum muncul, 1 = selesai) ----
  const intro = { v: world.reduced ? 1 : 0 };
  if (!world.reduced) {
    gsap.to(intro, { v: 1, duration: 2.4, delay: 1.7, ease: 'power3.out' });
  }

  const maxAniso = world.renderer.capabilities.getMaxAnisotropy();

  // ---- Tekstur noise halus (kesan kertas / glasir) ----
  function makeNoise(repeatX, repeatY) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 100 + Math.random() * 70;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    return t;
  }

  // =====================================================
  // 1) CUP TAKEAWAY HITAM
  // =====================================================
  const W = 900, H = 1024, S = 1.5;
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = W * S;
  labelCanvas.height = H * S;
  const lctx = labelCanvas.getContext('2d');
  const FONT = '"Bebas Neue", Impact, "Arial Narrow", sans-serif';
  const ORANGE = '#ff5a1f';

  function drawLabel() {
    const ctx = lctx;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `64px ${FONT}`;
    ctx.fillText('COFFEE', 60, 56);
    ctx.fillText('TO GO', 60, 118);
    ctx.textAlign = 'right';
    ctx.font = `34px ${FONT}`;
    ctx.globalAlpha = 0.8;
    ctx.fillText('FRESH · DAILY', W - 60, 64);
    ctx.globalAlpha = 1;

    // ikon cangkir garis oranye + uap
    ctx.strokeStyle = ORANGE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 14;
    [[400, 340, 250], [450, 350, 215], [500, 340, 250]].forEach(([x, y0, y1]) => {
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.bezierCurveTo(x - 32, (y0 + y1) / 2 + 20, x + 32, (y0 + y1) / 2 - 20, x, y1);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.ellipse(450, 402, 170, 26, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(280, 404);
    ctx.bezierCurveTo(285, 500, 360, 540, 450, 540);
    ctx.bezierCurveTo(540, 540, 615, 500, 620, 404);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(612, 425);
    ctx.bezierCurveTo(695, 410, 705, 495, 600, 505);
    ctx.stroke();
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.ellipse(450, 560, 235, 34, 0, 0, TAU);
    ctx.stroke();

    // tulisan besar (lebar disesuaikan otomatis)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    let size = 420;
    ctx.font = `${size}px ${FONT}`;
    while (ctx.measureText('TANSPACE').width > W - 80 && size > 60) {
      size -= 6;
      ctx.font = `${size}px ${FONT}`;
    }
    ctx.fillText('TANSPACE', W / 2, H - 70);
  }
  drawLabel();
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = maxAniso;
  if (document.fonts && document.fonts.load) {
    document.fonts.load('100px "Bebas Neue"').then(() => {
      drawLabel();
      labelTex.needsUpdate = true;
    }).catch(() => {});
  }

  const paperBump = makeNoise(10, 4);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d0d0d, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35,
    bumpMap: paperBump, bumpScale: 0.35, side: THREE.DoubleSide,
  });
  const lidMat = new THREE.MeshPhysicalMaterial({
    color: 0x151515, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide,
  });
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex, transparent: true, roughness: 0.55,
    emissive: 0xffffff, emissiveMap: labelTex, emissiveIntensity: 0.25,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });

  const BODY_H = 1.9;
  const bodyProfile = [
    [0, 0], [0.54, 0], [0.58, 0.02], [0.6, 0.07],
    [0.8, 1.86],
    [0.83, 1.89], [0.85, 1.93], [0.83, 1.97], [0.8, 1.96], // bibir tergulung
    [0.78, 1.9], [0.58, 0.12], [0, 0.12],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile, 96), bodyMat);

  const ARC = 1.95;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.792, 0.625, 1.5, 64, 1, true, -ARC / 2, ARC),
    labelMat);
  label.position.y = 0.97;

  const lidProfile = [
    [0.87, -0.02], [0.885, 0.06], [0.89, 0.14],        // rok tutup
    [0.95, 0.16], [0.97, 0.2], [0.95, 0.24],           // bibir luar
    [0.88, 0.26], [0.82, 0.23], [0.76, 0.27],          // alur
    [0.66, 0.3], [0.5, 0.31], [0, 0.31],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const lid = new THREE.Mesh(new THREE.LatheGeometry(lidProfile, 96), lidMat);
  lid.position.y = BODY_H - 0.02;

  // tab minum
  const tabRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 10, 40), lidMat);
  tabRing.scale.set(2.2, 1, 1);
  tabRing.rotation.x = -Math.PI / 2;
  tabRing.position.set(0, lid.position.y + 0.315, 0.38);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.095, 28), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  hole.scale.set(2.2, 1, 1);
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(0, lid.position.y + 0.316, 0.38);

  [body, lid, tabRing].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });

  const TC_SCALE = 1.05;
  const tc = new THREE.Group();
  tc.add(body, label, lid, tabRing, hole);
  tc.scale.setScalar(TC_SCALE);
  tc.position.set(-0.95, 0, -0.4);
  pair.add(tc);

  // =====================================================
  // 2) CANGKIR KERAMIK + LATTE ART
  // =====================================================
  function makeLatteArt() {
    const size = 768;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const mid = size / 2;

    // dasar kopi + crema
    const g = ctx.createRadialGradient(mid, mid, 10, mid, mid, mid);
    g.addColorStop(0, '#b9783f');
    g.addColorStop(0.5, '#9a5d2e');
    g.addColorStop(0.85, '#6b3d1c');
    g.addColorStop(1, '#3a2010');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // bintik crema
    for (let i = 0; i < 2400; i++) {
      const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * mid * 0.95;
      const x = mid + Math.cos(a) * r, y = mid + Math.sin(a) * r;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255, 220, 170, 0.06)' : 'rgba(40, 20, 8, 0.08)';
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 3, 0, TAU);
      ctx.fill();
    }

    function heart(cx, cy, w, h) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + h * 0.55);
      ctx.bezierCurveTo(cx + w * 0.55, cy + h * 0.15, cx + w, cy - h * 0.35, cx + w * 0.55, cy - h * 0.62);
      ctx.bezierCurveTo(cx + w * 0.3, cy - h * 0.85, cx + w * 0.05, cy - h * 0.7, cx, cy - h * 0.4);
      ctx.bezierCurveTo(cx - w * 0.05, cy - h * 0.7, cx - w * 0.3, cy - h * 0.85, cx - w * 0.55, cy - h * 0.62);
      ctx.bezierCurveTo(cx - w, cy - h * 0.35, cx - w * 0.55, cy + h * 0.15, cx, cy + h * 0.55);
      ctx.closePath();
    }

    // busa susu: hati bertumpuk (rosetta/tulip)
    ctx.filter = 'blur(1.4px)';
    ctx.lineJoin = 'round';
    for (let k = 0; k < 7; k++) {
      const w = 200 - k * 20;
      const h = 130 - k * 7;
      const y = mid + 215 - k * 62;
      heart(mid, y, w, h);
      ctx.shadowColor = 'rgba(255, 240, 215, 0.9)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#f6ead7';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(95, 52, 26, 0.55)';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // garis tarikan di tengah (stem)
    ctx.strokeStyle = 'rgba(70, 38, 18, 0.85)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mid, mid - 250);
    ctx.lineTo(mid, mid + 270);
    ctx.stroke();
    ctx.filter = 'none';

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    return tex;
  }

  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04, side: THREE.DoubleSide,
  });
  const coffeeMat = new THREE.MeshPhysicalMaterial({
    map: makeLatteArt(), roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 1, roughness: 0.22 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xff5a1f, emissive: 0xff5a1f, emissiveIntensity: 0.35, roughness: 0.4,
  });

  // badan cangkir: kaki + dinding luar + bibir membulat + dinding dalam
  const foot = [[0, 0.03], [0.36, 0.03], [0.38, 0], [0.5, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const outer = new THREE.SplineCurve([
    [0.52, 0.04], [0.6, 0.12], [0.78, 0.5], [0.94, 0.9], [0.99, 1.02],
  ].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(24);
  const lip = [[1.0, 1.05], [0.97, 1.09], [0.93, 1.08]].map(([x, y]) => new THREE.Vector2(x, y));
  const inner = new THREE.SplineCurve([
    [0.9, 1.0], [0.86, 0.9], [0.68, 0.5], [0.45, 0.22], [0.0, 0.15],
  ].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(24);
  const cup = new THREE.Mesh(new THREE.LatheGeometry([...foot, ...outer, ...lip, ...inner], 96), glazeMat);
  cup.position.y = 0.1;

  // gagang
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.92, 0.86, 0),
    new THREE.Vector3(1.2, 0.96, 0),
    new THREE.Vector3(1.46, 0.68, 0),
    new THREE.Vector3(1.3, 0.36, 0),
    new THREE.Vector3(0.66, 0.3, 0),
  ]);
  const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 48, 0.07, 16, false), glazeMat);
  handle.scale.z = 0.75;
  cup.add(handle);

  // piring
  const sOuter = new THREE.SplineCurve([
    [0.6, 0], [1.2, 0.04], [1.6, 0.13], [1.72, 0.22],
  ].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(16);
  const sInner = new THREE.SplineCurve([
    [1.66, 0.25], [1.6, 0.2], [1.2, 0.1], [0.8, 0.07], [0.5, 0.065],
  ].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(16);
  const saucer = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(0, 0), ...sOuter, new THREE.Vector2(1.74, 0.25), ...sInner, new THREE.Vector2(0, 0.065)], 96),
    glazeMat);

  // garis oranye tipis di piring
  const saucerRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.012, 8, 128), accentMat);
  saucerRing.rotation.x = Math.PI / 2;
  saucerRing.position.y = 0.2;

  // permukaan kopi
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.86, 64), coffeeMat);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.1 + 0.87;

  // sendok
  const spoon = new THREE.Group();
  const spoonBowl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), metalMat);
  spoonBowl.scale.set(1.3, 0.3, 0.9);
  spoonBowl.position.x = -0.55;
  const spoonStick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 1.1, 12), metalMat);
  spoonStick.rotation.z = Math.PI / 2;
  spoonStick.position.x = 0.15;
  spoon.add(spoonBowl, spoonStick);
  spoon.position.set(0.1, 0.12, 1.15);
  spoon.rotation.y = 0.3;

  [cup, handle, saucer, spoonBowl, spoonStick].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });

  const CC_SCALE = 0.75;
  const cc = new THREE.Group();
  cc.add(saucer, saucerRing, cup, coffee, spoon);
  cc.scale.setScalar(CC_SCALE);
  cc.position.set(1.15, 0, 0.7);
  pair.add(cc);

  // =====================================================
  // 3) AIR KOPI MENGALIR MENGORBIT
  // =====================================================
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a2410, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide,
  });

  const streams = [];
  function createStream(o) {
    const radial = 10;
    const seg = o.seg;
    const verts = (seg + 1) * (radial + 1);
    const positions = new Float32Array(verts * 3);
    const normals = new Float32Array(verts * 3);
    const index = [];
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j;
        const b = (i + 1) * (radial + 1) + j;
        index.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(index);
    const mesh = new THREE.Mesh(geo, liquidMat);
    mesh.frustumCulled = false;

    const holder = new THREE.Group();
    holder.position.set(0.1, 1.0, 0.1);
    holder.rotation.set(o.tilt[0], o.tilt[1], o.tilt[2]);
    holder.add(mesh);

    // tetesan di depan kepala aliran
    const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), liquidMat, o.drops);
    drops.frustumCulled = false;
    holder.add(drops);
    const dd = Array.from({ length: o.drops }, (_, k) => ({
      off: 0.22 + k * 0.2 + Math.random() * 0.15,
      ph: Math.random() * TAU,
      sz: 0.024 + Math.random() * 0.03,
    }));
    const dummy = new THREE.Object3D();
    const cs = Array.from({ length: radial + 1 }, (_, j) => Math.cos((j / radial) * TAU));
    const sn = Array.from({ length: radial + 1 }, (_, j) => Math.sin((j / radial) * TAU));
    group.add(holder);

    function bob(th, t) { return Math.sin(th * 2 + t * 1.3 + o.phase) * o.wobble; }

    function update(t, e) {
      holder.scale.setScalar(Math.max(e, 0.0001));
      const base = t * o.speed + o.phase;

      for (let i = 0; i <= seg; i++) {
        const s = i / seg;
        const th = base + s * o.arc;
        const cx = Math.cos(th), sz = Math.sin(th);
        const px = o.R * cx, py = bob(th, t), pz = o.R * sz;

        // ujung meruncing, kepala menggembung, permukaan bergelombang
        const taper = Math.pow(Math.sin(Math.PI * s), 0.6) * (0.55 + 0.45 * s);
        const ripple = 1 + 0.28 * Math.sin(s * 22 - t * 5 + o.phase) + 0.12 * Math.sin(s * 47 - t * 8);
        const r = o.rBase * taper * ripple;

        for (let j = 0; j <= radial; j++) {
          const nx = cx * cs[j], ny = sn[j], nz = sz * cs[j];
          const k = (i * (radial + 1) + j) * 3;
          positions[k] = px + r * nx;
          positions[k + 1] = py + r * ny;
          positions[k + 2] = pz + r * nz;
          normals[k] = nx; normals[k + 1] = ny; normals[k + 2] = nz;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;

      dd.forEach((d, k) => {
        const ang = base + o.arc + d.off + Math.sin(t * 1.5 + d.ph) * 0.08;
        const rr = o.R + Math.sin(t * 1.3 + d.ph) * 0.1;
        dummy.position.set(rr * Math.cos(ang), bob(ang, t) + Math.sin(t * 2 + d.ph) * 0.12, rr * Math.sin(ang));
        dummy.scale.setScalar(d.sz * (1 - (k / dd.length) * 0.6));
        dummy.updateMatrix();
        drops.setMatrixAt(k, dummy.matrix);
      });
      drops.instanceMatrix.needsUpdate = true;
    }
    return { update };
  }

  streams.push(createStream({
    R: quality.isMobile ? 2.2 : 2.45, tilt: [1.2, 0, 0.25], speed: 0.55, arc: 4.2,
    rBase: 0.085, seg: quality.isMobile ? 90 : 150, phase: 0, wobble: 0.18, drops: quality.isMobile ? 6 : 12,
  }));
  if (!quality.isMobile) {
    streams.push(createStream({
      R: 2.85, tilt: [1.0, 0.5, -0.45], speed: 0.4, arc: 3.3,
      rBase: 0.065, seg: 130, phase: 2.4, wobble: 0.22, drops: 8,
    }));
  }

  // =====================================================
  // 4) BIDANG BAYANGAN + UAP KOPI
  // =====================================================
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.25 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  group.add(ground);

  const n = quality.steam;
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const speed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, r = Math.random() * 0.35;
    pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3);
    seed[i] = Math.random();
    speed[i] = 0.08 + Math.random() * 0.1;
  }
  const steamGeo = new THREE.BufferGeometry();
  steamGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  steamGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  steamGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));

  const steamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 0 },
      uSize: { value: 420 * quality.pixelRatio },
      uColor: { value: new THREE.Color(0x8b7766) },
    },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uSize;
      attribute float aSeed; attribute float aSpeed;
      varying float vAlpha;
      void main(){
        float t = fract(uTime * aSpeed + aSeed);
        vec3 p = position;
        p.y += t * 2.0;
        p.x += (sin(t * 6.0 + aSeed * 20.0) * 0.18 + sin(t * 11.0 + aSeed * 9.0) * 0.06) * t;
        p.z += (cos(t * 5.0 + aSeed * 15.0) * 0.18 + cos(t * 9.0 + aSeed * 7.0) * 0.06) * t;
        vAlpha = smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.5, 1.0, t));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.6 + t * 1.5) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uFade; varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float soft = smoothstep(0.5, 0.0, d);
        float a = pow(soft, 1.5) * vAlpha * 0.32 * uFade;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const steam = new THREE.Points(steamGeo, steamMat);
  steam.frustumCulled = false;
  steam.position.set(cc.position.x, 0.75, cc.position.z);
  pair.add(steam);

  // ---- Tema terang/gelap ----
  world.onTheme((m) => {
    const dark = m === 'dark';
    steamMat.uniforms.uColor.value.set(dark ? 0xf5efe6 : 0x8b7766);
    bodyMat.color.set(dark ? 0x1c1c1e : 0x0d0d0d);
    lidMat.color.set(dark ? 0x232326 : 0x151515);
    glazeMat.color.set(dark ? 0x1f1f22 : 0x111111);
    liquidMat.color.set(dark ? 0x7a4220 : 0x4a2410);
  });

  // ---- Layout responsif ----
  world.onResize((w) => {
    if (w < 768) { anchor.position.set(0, -1.8, 0); anchor.scale.setScalar(0.6); }
    else if (w < 1100) { anchor.position.set(1.7, -1.0, 0); anchor.scale.setScalar(0.8); }
    else { anchor.position.set(2.5, -1.0, 0); anchor.scale.setScalar(0.92); }
  });

  // pose awal (dipakai juga kalau reduced motion)
  tc.rotation.set(0.18, -0.25, 0);
  cc.rotation.set(0.5, 0.35, 0);
  let frozen = false;

  // ---- Update per frame ----
  function update(t, dt) {
    const e = intro.v;
    const e2 = THREE.MathUtils.clamp((e - 0.12) / 0.88, 0, 1);
    steamMat.uniforms.uTime.value = world.reduced ? 0 : t;
    steamMat.uniforms.uFade.value = e2;

    if (world.reduced) {
      if (!frozen) { frozen = true; streams.forEach((s) => s.update(0, 1)); }
      return;
    }

    streams.forEach((s) => s.update(t, e));

    // cup takeaway: turun sambil berputar, lalu melayang dan bergoyang
    tc.scale.setScalar(TC_SCALE * (0.8 + 0.2 * e));
    tc.position.y = (1 - e) * 3.4 + Math.sin(t * 1.1) * 0.05 * e;
    tc.rotation.y = (1 - e) * -TAU + Math.sin(t * 0.6) * 0.3 * e - 0.25;
    tc.rotation.x = 0.18 + Math.sin(t * 0.9) * 0.02;

    // cangkir keramik: masuk sedikit setelah cup, miring ke kamera agar latte art terlihat
    cc.scale.setScalar(CC_SCALE * (0.8 + 0.2 * e2));
    cc.position.y = (1 - e2) * 3.4 + Math.sin(t * 1.3 + 1) * 0.05 * e2;
    cc.rotation.y = (1 - e2) * TAU + Math.sin(t * 0.5 + 1) * 0.25 * e2 + 0.35;
    cc.rotation.x = 0.5 + Math.sin(t * 0.8) * 0.03;

    // parallax mengikuti mouse
    const k = Math.min(1, dt * 4);
    anchor.rotation.y += (world.pointer.x * 0.3 - anchor.rotation.y) * k;
    anchor.rotation.x += (world.pointer.y * 0.12 - anchor.rotation.x) * k;
  }

  return { group, update };
}