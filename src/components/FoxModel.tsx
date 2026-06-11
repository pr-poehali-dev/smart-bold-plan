import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FoxModel({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff9955, 0.5);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    const fox = new THREE.Group();

    const orange = new THREE.MeshStandardMaterial({ color: 0xe8732c, roughness: 0.55, metalness: 0.05 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.55, metalness: 0.05 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.1 });

    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), orange);
    body.scale.set(1, 0.85, 1.1);
    body.position.y = 0.2;
    fox.add(body);

    // chest (white)
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), white);
    chest.scale.set(1, 1.1, 0.6);
    chest.position.set(0, 0, 0.75);
    fox.add(chest);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), orange);
    head.position.set(0, 1.05, 0.55);
    fox.add(head);

    // snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 24), white);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.95, 1.15);
    fox.add(snout);

    // nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), dark);
    nose.position.set(0, 0.95, 1.5);
    fox.add(nose);

    // eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeL = new THREE.Mesh(eyeGeo, dark);
    eyeL.position.set(-0.28, 1.2, 1.05);
    fox.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, dark);
    eyeR.position.set(0.28, 1.2, 1.05);
    fox.add(eyeR);

    // ears
    const earGeo = new THREE.ConeGeometry(0.32, 0.75, 4);
    const earL = new THREE.Mesh(earGeo, orange);
    earL.position.set(-0.4, 1.75, 0.4);
    earL.rotation.set(0, Math.PI / 4, -0.25);
    fox.add(earL);
    const earR = new THREE.Mesh(earGeo, orange);
    earR.position.set(0.4, 1.75, 0.4);
    earR.rotation.set(0, Math.PI / 4, 0.25);
    fox.add(earR);

    const earInnerGeo = new THREE.ConeGeometry(0.16, 0.4, 4);
    const earInL = new THREE.Mesh(earInnerGeo, dark);
    earInL.position.set(-0.4, 1.72, 0.5);
    earInL.rotation.set(0, Math.PI / 4, -0.25);
    fox.add(earInL);
    const earInR = new THREE.Mesh(earInnerGeo, dark);
    earInR.position.set(0.4, 1.72, 0.5);
    earInR.rotation.set(0, Math.PI / 4, 0.25);
    fox.add(earInR);

    // legs
    const legGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.6, 16);
    const legPositions: [number, number, number][] = [
      [-0.45, -0.55, 0.55],
      [0.45, -0.55, 0.55],
      [-0.45, -0.55, -0.45],
      [0.45, -0.55, -0.45],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, dark);
      leg.position.set(x, y, z);
      fox.add(leg);
    });

    // tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.6, 24), orange);
    tail.rotation.set(-Math.PI / 3, 0, 0);
    tail.position.set(0, 0.5, -1.15);
    fox.add(tail);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), white);
    tailTip.position.set(0, 1.1, -1.75);
    fox.add(tailTip);

    fox.position.y = 0.1;
    scene.add(fox);

    // interaction
    let rotY = 0;
    let rotX = 0.1;
    let dragging = false;
    let autoRotate = true;
    let lastX = 0;
    let lastY = 0;

    const onDown = (clientX: number, clientY: number) => {
      dragging = true;
      autoRotate = false;
      lastX = clientX;
      lastY = clientY;
    };
    const onMove = (clientX: number, clientY: number) => {
      if (!dragging) return;
      rotY += (clientX - lastX) * 0.01;
      rotX += (clientY - lastY) * 0.01;
      rotX = Math.max(-0.6, Math.min(0.8, rotX));
      lastX = clientX;
      lastY = clientY;
    };
    const onUp = () => { dragging = false; };

    const md = (e: MouseEvent) => onDown(e.clientX, e.clientY);
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const ts = (e: TouchEvent) => onDown(e.touches[0].clientX, e.touches[0].clientY);
    const tm = (e: TouchEvent) => { onMove(e.touches[0].clientX, e.touches[0].clientY); };

    mount.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', onUp);
    mount.addEventListener('touchstart', ts, { passive: true });
    mount.addEventListener('touchmove', tm, { passive: true });
    mount.addEventListener('touchend', onUp);

    let frame = 0;
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

    return () => {
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
