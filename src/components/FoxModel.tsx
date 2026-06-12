import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MODEL_URL = 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/21d8c115-7efe-495b-b890-e9f2eff6ed19.glb';

export default function FoxModel({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let frame = 0;
    let started = false;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let camera: THREE.PerspectiveCamera;

    const start = (width: number, height: number) => {
      if (started) return;
      started = true;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);

      camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 1000);
      camera.position.set(0, 0.5, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(5, 8, 6);
      key.castShadow = true;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffeedd, 0.5);
      fill.position.set(-6, 3, 4);
      scene.add(fill);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.5;

      new GLTFLoader().load(
        MODEL_URL,
        (gltf) => {
          const model = gltf.scene;

          model.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });

          model.updateWorldMatrix(true, true);
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 2.5 / maxDim;
          console.log('FOXDBG', JSON.stringify({
            size: [size.x, size.y, size.z],
            center: [center.x, center.y, center.z],
            childCount: model.children.length,
          }));

          model.position.set(
            -center.x * scale,
            -center.y * scale,
            -center.z * scale
          );
          model.scale.setScalar(scale);

          const pivot = new THREE.Group();
          pivot.add(model);
          scene.add(pivot);

          const radius = (size.length() * scale) / 2;
          const vFov = (camera.fov * Math.PI) / 180;
          const fitH = radius / Math.tan(vFov / 2);
          const fitW = radius / (Math.tan(vFov / 2) * camera.aspect);
          const dist = Math.max(fitH, fitW) * 1.25;

          camera.near = Math.max(dist - radius * 2, 0.01);
          camera.far = dist + radius * 4;
          camera.position.set(0, 0, dist);
          camera.updateProjectionMatrix();

          controls.target.set(0, 0, 0);
          controls.minDistance = dist;
          controls.maxDistance = dist;
          controls.update();
        },
        undefined,
        (err) => console.error('GLB error:', err)
      );

      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (!started) {
            start(width, height);
          } else if (camera && renderer) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }
        }
      }
    });
    ro.observe(mount);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} style={{ background: '#111' }}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/40 uppercase tracking-widest pointer-events-none select-none">
        Покрутите мышкой
      </div>
    </div>
  );
}