import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LogoModel() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dir1.position.set(5, 8, 6);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xff2200, 0.5);
    dir2.position.set(-5, -4, -3);
    scene.add(dir2);
    const point = new THREE.PointLight(0xffffff, 0.8, 30);
    point.position.set(-3, 4, 4);
    scene.add(point);

    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.4 });
    const matRed = new THREE.MeshStandardMaterial({ color: 0xcc2200, metalness: 0.4, roughness: 0.3, emissive: 0x440000 });

    const group = new THREE.Group();

    // Helper: build a letter from box segments
    const box = (w: number, h: number, d: number, x: number, y: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, 0);
      return m;
    };

    const depth = 0.5;
    const lh = 2.0;   // letter height
    const lw = 1.2;   // letter width
    const t = 0.28;   // stroke thickness
    const gap = 0.18; // gap between letters

    // All letters centered around x=0
    // FORM3D — 6 chars
    // Total width estimation: each letter ~lw, gaps between
    const letters: THREE.Group[] = [];

    // F
    const F = new THREE.Group();
    F.add(box(t, lh, depth, 0, 0, matWhite));               // vertical
    F.add(box(lw * 0.7, t, depth, lw * 0.35 - t / 2, lh / 2 - t / 2, matWhite)); // top
    F.add(box(lw * 0.55, t, depth, lw * 0.275 - t / 2, 0, matWhite));            // mid
    letters.push(F);

    // O
    const O = new THREE.Group();
    O.add(box(t, lh, depth, 0, 0, matWhite));               // left
    O.add(box(t, lh, depth, lw - t, 0, matWhite));          // right
    O.add(box(lw, t, depth, lw / 2 - t / 2, lh / 2 - t / 2, matWhite)); // top
    O.add(box(lw, t, depth, lw / 2 - t / 2, -lh / 2 + t / 2, matWhite)); // bottom
    letters.push(O);

    // R
    const R = new THREE.Group();
    R.add(box(t, lh, depth, 0, 0, matWhite));               // vertical
    R.add(box(lw * 0.8, t, depth, lw * 0.4 - t / 2, lh / 2 - t / 2, matWhite)); // top
    R.add(box(lw * 0.8, t, depth, lw * 0.4 - t / 2, 0.05, matWhite));           // mid
    R.add(box(t, lh / 2 - t / 2, depth, lw * 0.8 - t, lh / 4 - t / 4, matWhite)); // right upper
    // diagonal leg
    const leg = new THREE.Mesh(new THREE.BoxGeometry(t, lh / 2 + 0.1, depth), matWhite);
    leg.position.set(lw * 0.65, -lh / 4, 0);
    leg.rotation.z = -0.4;
    R.add(leg);
    letters.push(R);

    // M
    const M = new THREE.Group();
    M.add(box(t, lh, depth, 0, 0, matWhite));               // left
    M.add(box(t, lh, depth, lw, 0, matWhite));              // right
    // left diagonal
    const md1 = new THREE.Mesh(new THREE.BoxGeometry(t, lh * 0.7, depth), matWhite);
    md1.position.set(lw * 0.28, lh * 0.08, 0);
    md1.rotation.z = 0.45;
    M.add(md1);
    // right diagonal
    const md2 = new THREE.Mesh(new THREE.BoxGeometry(t, lh * 0.7, depth), matWhite);
    md2.position.set(lw * 0.72, lh * 0.08, 0);
    md2.rotation.z = -0.45;
    M.add(md2);
    letters.push(M);

    // 3 (red)
    const Three = new THREE.Group();
    Three.add(box(lw * 0.75, t, depth, lw * 0.375, lh / 2 - t / 2, matRed));  // top
    Three.add(box(lw * 0.75, t, depth, lw * 0.375, 0, matRed));               // mid
    Three.add(box(lw * 0.75, t, depth, lw * 0.375, -lh / 2 + t / 2, matRed)); // bot
    Three.add(box(t, lh / 2, depth, lw - t, lh / 4, matRed));                 // right upper
    Three.add(box(t, lh / 2, depth, lw - t, -lh / 4, matRed));                // right lower
    letters.push(Three);

    // D (red)
    const D = new THREE.Group();
    D.add(box(t, lh, depth, 0, 0, matRed));                                    // left
    D.add(box(lw * 0.6, t, depth, lw * 0.3, lh / 2 - t / 2, matRed));        // top
    D.add(box(lw * 0.6, t, depth, lw * 0.3, -lh / 2 + t / 2, matRed));       // bot
    D.add(box(t, lh, depth, lw * 0.85, 0, matRed));                           // right curve approx
    letters.push(D);

    // Position letters side by side
    const totalWidth = letters.length * lw + (letters.length - 1) * gap;
    let xCursor = -totalWidth / 2;
    letters.forEach(letter => {
      letter.position.x = xCursor;
      letter.position.y = -lh / 2;
      group.add(letter);
      xCursor += lw + gap;
    });

    // Thin base plate
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth + 0.3, 0.08, depth + 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 })
    );
    plate.position.y = -lh / 2 - 0.1;
    group.add(plate);

    scene.add(group);

    // Drag rotation
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotX = 0.25, rotY = 0.4;
    let velX = 0, velY = 0.004;

    const onDown = (x: number, y: number) => { isDragging = true; prevX = x; prevY = y; velX = 0; velY = 0; };
    const onMove = (x: number, y: number) => {
      if (!isDragging) return;
      velY = (x - prevX) * 0.007;
      velX = (y - prevY) * 0.007;
      rotY += velY; rotX += velX;
      prevX = x; prevY = y;
    };
    const onUp = () => { isDragging = false; };

    mount.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);
    mount.addEventListener('touchstart', e => onDown(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', e => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchend', onUp);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isDragging) { velX *= 0.93; velY *= 0.93; rotX += velX; rotY += velY; }
      group.rotation.x = rotX;
      group.rotation.y = rotY;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', e => onMove(e.touches[0].clientX, e.touches[0].clientY));
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-neutral-500 select-none pointer-events-none uppercase tracking-widest whitespace-nowrap">
        потяни, чтобы покрутить
      </p>
    </div>
  );
}
