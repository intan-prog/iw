import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Biji kopi: dua cuping + alur tengah berkelok (S) + sisi belakang bulat + permukaan berkerut
function createBeanGeometry(wSeg, hSeg) {
  let g = new THREE.SphereGeometry(1, wSeg, hSeg);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g); // gabungkan titik kembar agar permukaan mulus
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);

  for (let i = 0; i < p.count; i++) {
    const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i);

    // dasar oval; sisi atas (alur) lebih rata, sisi belakang lebih bulat
    let X = ux;
    let Y = uy * 0.7 * (1 + 0.1 * ux); // satu ujung sedikit lebih ramping
    let Z = uz * (uz > 0 ? 0.44 : 0.52);

    const top = smoothstep(0.0, 0.35, uz);                    // 1 di sisi alur
    const lenFade = Math.pow(Math.max(0, 1 - ux * ux), 0.6);  // alur memudar di ujung
    const cy = Math.sin(ux * 2.4) * 0.07;                     // jalur alur berbentuk S
    const dy = Y - cy;

    const groove = Math.exp(-(dy * dy) / (2 * 0.06 * 0.06)) * lenFade * top;
    const lobe = Math.exp(-Math.pow(Math.abs(dy) - 0.24, 2) / (2 * 0.13 * 0.13)) * lenFade * top;

    Z -= groove * 0.26;   // alur dalam
    Z += lobe * 0.05;     // dua cuping menggembung
    Y -= dy * groove * 0.3; // dinding alur lebih curam
    Z -= ux * ux * 0.06;  // ujung melengkung ke belakang

    // kerutan halus di permukaan
    const w = (Math.sin(X * 11 + Y * 7) * Math.sin(Y * 13 - X * 5) + 0.5 * Math.sin(X * 23 + uz * 9)) * 0.008;
    X += ux * w; Y += uy * w; Z += uz * w;

    // warna per titik: badan lebih gelap, alur lebih terang (kulit ari)
    const shade = 0.62 + 0.38 * Math.min(1, groove * 1.4) + w * 4;
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = shade;

    p.setXYZ(i, X, Y, Z);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

// Biji kopi jatuh pelan di background; kabut scene memberi efek kedalaman
export function createParticles(world) {
  const count = world.quality.beans;
  const camera = world.camera;

  const geo = world.quality.isMobile ? createBeanGeometry(56, 40) : createBeanGeometry(96, 64);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true,
    roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.28,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;
  world.scene.add(mesh);
  // warna asli ada di tiap biji (instance color); tema hanya mengatur terang/gelapnya
  world.onTheme((m) => mat.color.setScalar(m === 'dark' ? 1.8 : 1));

  // Ukuran area terlihat di kedalaman z tertentu
  function viewSize(z) {
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
    return { halfH, halfW: halfH * camera.aspect };
  }

  const color = new THREE.Color();
  const items = Array.from({ length: count }, (_, i) => {
    const it = {
      pos: new THREE.Vector3(0, 0, -8 + Math.random() * 11),
      vel: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
      ),
      phase: Math.random() * Math.PI * 2,
      size: 0.2 + Math.random() * 0.22,
      sx: 0.9 + Math.random() * 0.25, // proporsi tiap biji sedikit berbeda
      sy: 0.85 + Math.random() * 0.3,
      sz: 0.85 + Math.random() * 0.3,
      fall: 0.35 + Math.random() * 0.7, // kecepatan jatuh
    };
    spawn(it, true);
    // tingkat sangrai berbeda-beda: coklat sedang sampai coklat tua
    color.setHSL(0.055 + Math.random() * 0.03, 0.55 + Math.random() * 0.2, 0.2 + Math.random() * 0.18);
    mesh.setColorAt(i, color);
    return it;
  });
  mesh.instanceColor.needsUpdate = true;

  function spawn(it, first) {
    const { halfH, halfW } = viewSize(it.pos.z);
    it.pos.x = (Math.random() * 2 - 1) * (halfW + 1);
    it.pos.y = first
      ? (Math.random() * 2 - 1) * (halfH + 1)
      : halfH + 1 + Math.random() * 3;
    it.vel.set(0, -it.fall * 0.5, 0);
  }

  const dummy = new THREE.Object3D();
  function write(i, it) {
    dummy.position.copy(it.pos);
    dummy.rotation.copy(it.rot);
    dummy.scale.set(it.size * it.sx, it.size * it.sy, it.size * it.sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  // Gerakan dimatikan jika pengguna memilih reduced motion
  if (world.reduced) {
    items.forEach((it, i) => write(i, it));
    mesh.instanceMatrix.needsUpdate = true;
    return { update() {} };
  }

  function update(t, dt) {
    items.forEach((it, i) => {
      const { halfH, halfW } = viewSize(it.pos.z);

      // hambatan udara: kecepatan jatuh mendekati kecepatan akhir
      it.vel.y += (-it.fall - it.vel.y) * Math.min(1, dt * 1.2);
      // hembusan angin pelan + redaman horizontal
      it.vel.x += Math.sin(t * 0.5 + it.phase) * 0.25 * dt;
      it.vel.x *= 1 - Math.min(1, dt * 1.5);

      // kursor mendorong biji yang dekat
      const px = world.pointer.x * halfW;
      const py = -world.pointer.y * halfH;
      const dx = it.pos.x - px;
      const dy = it.pos.y - py;
      const dist = Math.hypot(dx, dy);
      const R = 1.5;
      if (dist < R && dist > 0.001) {
        const f = (1 - dist / R) ** 2 * 16;
        it.vel.x += (dx / dist) * f * dt;
        it.vel.y += (dy / dist) * f * dt;
        it.spin.x += (dy / dist) * f * dt * 0.5; // ikut berputar saat terkena
      }
      // putaran melambat pelan ke kecepatan normal
      it.spin.multiplyScalar(1 - Math.min(1, dt * 0.3));

      it.pos.addScaledVector(it.vel, dt);
      it.rot.x += it.spin.x * dt;
      it.rot.y += it.spin.y * dt;
      it.rot.z += it.spin.z * dt;

      // keluar layar -> muncul lagi dari atas
      if (it.pos.y < -halfH - 1.2 || Math.abs(it.pos.x) > halfW + 2.5) spawn(it, false);

      write(i, it);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { update };
}