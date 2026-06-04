import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function NozzleModel() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [exploded, setExploded] = useState(false);
  const explodedRef = useRef(false);
  const partsRef = useRef<{ mesh: THREE.Group; baseY: number; explodeY: number }[]>([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dir1.position.set(4, 8, 6);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x8888ff, 0.4);
    dir2.position.set(-5, -3, -4);
    scene.add(dir2);
    const fill = new THREE.PointLight(0xffffff, 0.6, 30);
    fill.position.set(-3, 4, 3);
    scene.add(fill);

    // Materials
    const matDark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.5 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.15 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc89b3c, metalness: 0.95, roughness: 0.1 });
    const matHeater = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 });

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ─── PART 1: HEATSINK (радиатор) ───
    const heatsinkGroup = new THREE.Group();

    // Main heatsink body
    const hsBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.0, 0.55),
      matDark
    );
    heatsinkGroup.add(hsBody);

    // Fins (рёбра)
    for (let i = 0; i < 8; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.12, 0.12),
        matDark
      );
      fin.position.set(0, 0.75 - i * 0.22, 0.33);
      heatsinkGroup.add(fin);
    }

    // Side clips (боковые зацепы)
    const clipGeo = new THREE.BoxGeometry(0.18, 0.5, 0.35);
    [-1.15, 1.15].forEach(x => {
      const clip = new THREE.Mesh(clipGeo, matDark);
      clip.position.set(x, -0.65, 0.1);
      heatsinkGroup.add(clip);
    });

    // Top connector stub
    const topStub = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.4, 0.4),
      matDark
    );
    topStub.position.set(0, 1.18, 0);
    heatsinkGroup.add(topStub);

    // Hole through center (tube)
    const tubeMetal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 2.6, 16),
      matMetal
    );
    heatsinkGroup.add(tubeMetal);

    heatsinkGroup.position.y = 1.2;
    rootGroup.add(heatsinkGroup);
    partsRef.current.push({ mesh: heatsinkGroup, baseY: 1.2, explodeY: 3.2 });

    // ─── PART 2: HEATER BLOCK (нагревательный блок) ───
    const heaterGroup = new THREE.Group();

    // Octagonal block — approximate with cylinder + chamfer
    const blockShape = new THREE.Shape();
    const s = 0.75;
    const c = 0.22;
    blockShape.moveTo(-s + c, -s);
    blockShape.lineTo(s - c, -s);
    blockShape.lineTo(s, -s + c);
    blockShape.lineTo(s, s - c);
    blockShape.lineTo(s - c, s);
    blockShape.lineTo(-s + c, s);
    blockShape.lineTo(-s, s - c);
    blockShape.lineTo(-s, -s + c);
    blockShape.closePath();
    const blockGeo = new THREE.ExtrudeGeometry(blockShape, { depth: 0.7, bevelEnabled: false });
    blockGeo.center();
    const block = new THREE.Mesh(blockGeo, matHeater);
    block.rotation.x = Math.PI / 2;
    heaterGroup.add(block);

    // Heater cartridge hole sides
    const cartridgeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.85, 12);
    const cartridge = new THREE.Mesh(cartridgeGeo, matMetal);
    cartridge.rotation.z = Math.PI / 2;
    cartridge.position.set(0, 0, 0.3);
    heaterGroup.add(cartridge);

    // Thermistor wire stub
    const wireGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    const wire = new THREE.Mesh(wireGeo, matMetal);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(0.65, 0.25, 0);
    heaterGroup.add(wire);

    // Center bore
    const bore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.6, 16),
      matMetal
    );
    heaterGroup.add(bore);

    heaterGroup.position.y = -0.2;
    rootGroup.add(heaterGroup);
    partsRef.current.push({ mesh: heaterGroup, baseY: -0.2, explodeY: -0.2 });

    // ─── PART 3: NOZZLE (сопло) ───
    const nozzleGroup = new THREE.Group();

    // Nozzle body lathe
    const nzPts: THREE.Vector2[] = [
      new THREE.Vector2(0.42, 0.5),
      new THREE.Vector2(0.42, 0.1),
      new THREE.Vector2(0.32, -0.1),
      new THREE.Vector2(0.22, -0.3),
      new THREE.Vector2(0.12, -0.55),
      new THREE.Vector2(0.06, -0.75),
      new THREE.Vector2(0.025, -0.9),
    ];
    const nozzleBody = new THREE.Mesh(
      new THREE.LatheGeometry(nzPts, 24),
      matBrass
    );
    nozzleGroup.add(nozzleBody);

    // Thread section
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.43, 0.018, 6, 24),
        matBrass
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.12 + i * 0.09;
      nozzleGroup.add(ring);
    }

    // Tip glow
    const glowGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = -0.94;
    nozzleGroup.add(glow);

    nozzleGroup.position.y = -1.55;
    rootGroup.add(nozzleGroup);
    partsRef.current.push({ mesh: nozzleGroup, baseY: -1.55, explodeY: -3.8 });

    // ─── Drag rotation ───
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotX = 0.15, rotY = 0.3;
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

    // ─── Animation ───
    let frameId: number;
    let t = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.02;

      if (!isDragging) {
        velX *= 0.93; velY *= 0.93;
        rotX += velX; rotY += velY;
      }
      rotGroup.rotation.x = rotX;
      rotGroup.rotation.y = rotY;

      // Animate explode/assemble
      const isExp = explodedRef.current;
      partsRef.current.forEach(p => {
        const target = isExp ? p.explodeY : p.baseY;
        p.mesh.position.y += (target - p.mesh.position.y) * 0.08;
      });

      // Glow pulse
      glowMat.emissiveIntensity = 1.8 + Math.sin(t * 2.5) * 0.8;
      glow.scale.setScalar(1 + Math.sin(t * 2.5) * 0.1);

      renderer.render(scene, camera);
    };

    // Wrap root in rotation group
    const rotGroup = new THREE.Group();
    scene.remove(rootGroup);
    rotGroup.add(rootGroup);
    scene.add(rotGroup);

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

  const toggle = () => {
    const next = !exploded;
    setExploded(next);
    explodedRef.current = next;
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      <button
        onClick={toggle}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-xs uppercase tracking-widest border border-neutral-600 text-neutral-300 hover:bg-white hover:text-black transition-colors rounded-lg bg-black/40 backdrop-blur-sm"
      >
        {exploded ? 'Собрать' : 'Разобрать'}
      </button>
    </div>
  );
}
