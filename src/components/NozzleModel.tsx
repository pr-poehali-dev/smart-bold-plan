import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function NozzleModel() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xff4444, 0.6);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.5, 20);
    fillLight.position.set(-3, 3, 3);
    scene.add(fillLight);

    // Material — brass/gold metal
    const material = new THREE.MeshStandardMaterial({
      color: 0xc89b3c,
      metalness: 0.9,
      roughness: 0.25,
    });

    const group = new THREE.Group();

    // Nozzle body using lathe geometry
    const points: THREE.Vector2[] = [];
    // Top hex body (wide part)
    points.push(new THREE.Vector2(0.55, 2.2));
    points.push(new THREE.Vector2(0.55, 1.5));
    // Shoulder step
    points.push(new THREE.Vector2(0.45, 1.3));
    points.push(new THREE.Vector2(0.45, 0.6));
    // Taper to tip
    points.push(new THREE.Vector2(0.38, 0.3));
    points.push(new THREE.Vector2(0.25, 0.0));
    points.push(new THREE.Vector2(0.12, -0.5));
    points.push(new THREE.Vector2(0.08, -1.0));
    // Narrow tip
    points.push(new THREE.Vector2(0.06, -1.4));
    points.push(new THREE.Vector2(0.04, -1.6));
    points.push(new THREE.Vector2(0.03, -1.8));

    const latheGeo = new THREE.LatheGeometry(points, 32);
    const nozzleBody = new THREE.Mesh(latheGeo, material);
    group.add(nozzleBody);

    // Thread rings on the body
    for (let i = 0; i < 6; i++) {
      const ringGeo = new THREE.TorusGeometry(0.46, 0.025, 8, 32);
      const ring = new THREE.Mesh(ringGeo, material);
      ring.position.y = 0.65 + i * 0.14;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    // Center hole at tip
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, metalness: 0.5, roughness: 0.8 });
    const holeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.15, 16);
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.y = -1.82;
    group.add(hole);

    // Hot glow at tip
    const glowGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.85,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = -1.88;
    group.add(glow);

    // Filament strand coming out
    const filamentPoints = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      filamentPoints.push(new THREE.Vector3(
        Math.sin(t * 3) * 0.03,
        -1.9 - t * 0.6,
        Math.cos(t * 3) * 0.02
      ));
    }
    const filamentCurve = new THREE.CatmullRomCurve3(filamentPoints);
    const filamentGeo = new THREE.TubeGeometry(filamentCurve, 20, 0.018, 8, false);
    const filamentMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff2200, emissiveIntensity: 0.5 });
    const filament = new THREE.Mesh(filamentGeo, filamentMat);
    group.add(filament);

    group.position.y = -0.2;
    scene.add(group);

    // Mouse / touch drag rotation
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotX = 0.3;
    let rotY = 0;
    let velX = 0;
    let velY = 0.003;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      velX = 0;
      velY = 0;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      velX = dy * 0.005;
      velY = dx * 0.005;
      rotX += velX;
      rotY += velY;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };

    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
      velX = 0;
      velY = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - prevX;
      const dy = e.touches[0].clientY - prevY;
      velX = dy * 0.005;
      velY = dx * 0.005;
      rotX += velX;
      rotY += velY;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    };
    const onTouchEnd = () => { isDragging = false; };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Animation
    let frameId: number;
    let t = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.02;

      if (!isDragging) {
        velX *= 0.95;
        velY *= 0.95;
        rotX += velX;
        rotY += velY;
      }

      group.rotation.x = rotX;
      group.rotation.y = rotY;

      // Pulse glow
      glow.material.emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.7;
      glow.scale.setScalar(1 + Math.sin(t * 2) * 0.08);

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mousedown', onMouseDown);
      mount.removeEventListener('touchstart', onTouchStart);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      <p className="absolute bottom-3 text-xs text-neutral-400 dark:text-neutral-600 select-none pointer-events-none">
        потяни, чтобы покрутить
      </p>
    </div>
  );
}
