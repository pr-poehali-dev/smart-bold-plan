import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FoxModel({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let frame = 0;
    let renderer: THREE.WebGLRenderer;

    const init = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) {
        frame = requestAnimationFrame(init);
        return;
      }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 1.0, 7);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      mount.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.45);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(5, 8, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.radius = 6;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfff0e0, 0.5);
      fill.position.set(-6, 3, 4);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffb27a, 0.7);
      rim.position.set(-4, 4, -6);
      scene.add(rim);

      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(6, 64),
        new THREE.ShadowMaterial({ opacity: 0.4 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.55;
      ground.receiveShadow = true;
      scene.add(ground);

      const SEG = 64;
      const orange = new THREE.MeshStandardMaterial({ color: 0xe2701f, roughness: 0.62, metalness: 0.0 });
      const cream = new THREE.MeshStandardMaterial({ color: 0xf7f1e6, roughness: 0.6, metalness: 0.0 });
      const black = new THREE.MeshStandardMaterial({ color: 0x16120f, roughness: 0.5, metalness: 0.05 });
      const glossBlack = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.1 });

      const mk = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
      };

      const fox = new THREE.Group();

      const body = mk(new THREE.SphereGeometry(1.05, SEG, SEG), orange);
      body.scale.set(0.95, 1.15, 0.9);
      body.position.y = -0.35;
      fox.add(body);

      const chest = mk(new THREE.SphereGeometry(0.62, SEG, SEG), cream);
      chest.scale.set(0.85, 1.25, 0.55);
      chest.position.set(0, -0.25, 0.62);
      fox.add(chest);

      const head = mk(new THREE.SphereGeometry(0.78, SEG, SEG), orange);
      head.scale.set(1, 0.95, 0.98);
      head.position.set(0, 0.95, 0.22);
      fox.add(head);

      const cheekGeo = new THREE.SphereGeometry(0.34, 40, 40);
      const cheekL = mk(cheekGeo, cream); cheekL.scale.set(0.9, 0.8, 0.7); cheekL.position.set(-0.52, 0.78, 0.45); fox.add(cheekL);
      const cheekR = mk(cheekGeo, cream); cheekR.scale.set(0.9, 0.8, 0.7); cheekR.position.set(0.52, 0.78, 0.45); fox.add(cheekR);

      const muzzle = mk(new THREE.SphereGeometry(0.42, 48, 48), cream);
      muzzle.scale.set(0.78, 0.62, 1.05); muzzle.position.set(0, 0.74, 0.85); fox.add(muzzle);

      const nose = mk(new THREE.SphereGeometry(0.13, 32, 32), glossBlack);
      nose.scale.set(1.2, 0.9, 1); nose.position.set(0, 0.78, 1.28); fox.add(nose);

      const eyeGeo = new THREE.SphereGeometry(0.12, 32, 32);
      const eyeL = mk(eyeGeo, glossBlack); eyeL.position.set(-0.3, 1.02, 0.92); fox.add(eyeL);
      const eyeR = mk(eyeGeo, glossBlack); eyeR.position.set(0.3, 1.02, 0.92); fox.add(eyeR);

      const hlGeo = new THREE.SphereGeometry(0.035, 16, 16);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hlL = new THREE.Mesh(hlGeo, hlMat); hlL.position.set(-0.27, 1.06, 1.02); fox.add(hlL);
      const hlR = new THREE.Mesh(hlGeo, hlMat); hlR.position.set(0.33, 1.06, 1.02); fox.add(hlR);

      const earGeo = new THREE.ConeGeometry(0.34, 0.95, 48);
      const earL = mk(earGeo, orange); earL.position.set(-0.46, 1.82, 0.12); earL.rotation.set(0.15, 0, -0.22); fox.add(earL);
      const earR = mk(earGeo, orange); earR.position.set(0.46, 1.82, 0.12); earR.rotation.set(0.15, 0, 0.22); fox.add(earR);

      const earInGeo = new THREE.ConeGeometry(0.18, 0.6, 40);
      const earInL = mk(earInGeo, black); earInL.position.set(-0.45, 1.78, 0.26); earInL.rotation.set(0.15, 0, -0.22); fox.add(earInL);
      const earInR = mk(earInGeo, black); earInR.position.set(0.45, 1.78, 0.26); earInR.rotation.set(0.15, 0, 0.22); fox.add(earInR);

      const frontLegGeo = new THREE.CapsuleGeometry(0.17, 0.55, 16, 32);
      const frontL = mk(frontLegGeo, black); frontL.position.set(-0.34, -0.95, 0.78); fox.add(frontL);
      const frontR = mk(frontLegGeo, black); frontR.position.set(0.34, -0.95, 0.78); fox.add(frontR);

      const pawGeo = new THREE.SphereGeometry(0.2, 32, 32);
      const pawL = mk(pawGeo, black); pawL.scale.set(1, 0.7, 1.2); pawL.position.set(-0.34, -1.32, 0.92); fox.add(pawL);
      const pawR = mk(pawGeo, black); pawR.scale.set(1, 0.7, 1.2); pawR.position.set(0.34, -1.32, 0.92); fox.add(pawR);

      const haunchGeo = new THREE.SphereGeometry(0.5, 48, 48);
      const haunchL = mk(haunchGeo, orange); haunchL.scale.set(0.8, 0.9, 1.1); haunchL.position.set(-0.75, -0.85, 0.1); fox.add(haunchL);
      const haunchR = mk(haunchGeo, orange); haunchR.scale.set(0.8, 0.9, 1.1); haunchR.position.set(0.75, -0.85, 0.1); fox.add(haunchR);

      const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.6, -0.7),
        new THREE.Vector3(0.5, -0.5, -1.1),
        new THREE.Vector3(0.95, -0.05, -1.0),
        new THREE.Vector3(1.05, 0.6, -0.5),
        new THREE.Vector3(0.85, 1.05, 0.05),
      ]);
      const tail = mk(new THREE.TubeGeometry(tailCurve, 64, 0.42, 32, false), orange); fox.add(tail);
      const tailTip = mk(new THREE.SphereGeometry(0.42, 48, 48), cream); tailTip.position.set(0.85, 1.05, 0.05); fox.add(tailTip);
      const tailBase = mk(new THREE.SphereGeometry(0.42, 48, 48), orange); tailBase.position.set(0, -0.6, -0.7); fox.add(tailBase);

      fox.position.y = 0.45;
      scene.add(fox);

      let rotY = -0.3;
      let rotX = 0.05;
      let dragging = false;
      let autoRotate = true;
      let lastX = 0;
      let lastY = 0;

      const onDown = (x: number, y: number) => { dragging = true; autoRotate = false; lastX = x; lastY = y; };
      const onMove = (x: number, y: number) => {
        if (!dragging) return;
        rotY += (x - lastX) * 0.01;
        rotX += (y - lastY) * 0.01;
        rotX = Math.max(-0.5, Math.min(0.7, rotX));
        lastX = x; lastY = y;
      };
      const onUp = () => { dragging = false; };

      const md = (e: MouseEvent) => onDown(e.clientX, e.clientY);
      const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY);
      const ts = (e: TouchEvent) => onDown(e.touches[0].clientX, e.touches[0].clientY);
      const tm = (e: TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY);

      mount.addEventListener('mousedown', md);
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', onUp);
      mount.addEventListener('touchstart', ts, { passive: true });
      mount.addEventListener('touchmove', tm, { passive: true });
      mount.addEventListener('touchend', onUp);

      const animate = () => {
        frame = requestAnimationFrame(animate);
        if (autoRotate) rotY += 0.006;
        fox.rotation.y = rotY;
        fox.rotation.x = rotX;
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      (mount as HTMLDivElement & { _foxCleanup?: () => void })._foxCleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', onResize);
        mount.removeEventListener('mousedown', md);
        window.removeEventListener('mousemove', mm);
        window.removeEventListener('mouseup', onUp);
        mount.removeEventListener('touchstart', ts);
        mount.removeEventListener('touchmove', tm);
        mount.removeEventListener('touchend', onUp);
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    };

    init();

    return () => {
      cancelAnimationFrame(frame);
      const m = mount as HTMLDivElement & { _foxCleanup?: () => void };
      if (m._foxCleanup) m._foxCleanup();
    };
  }, []);

  return (
    <div className={`relative bg-black ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/40 uppercase tracking-widest pointer-events-none select-none">
        Покрутите мышкой
      </div>
    </div>
  );
}
