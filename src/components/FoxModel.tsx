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
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;

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
      camera.position.set(0, 1, 4);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(5, 8, 6);
      key.castShadow = true;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfff0e0, 0.5);
      fill.position.set(-6, 3, 4);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffb27a, 0.6);
      rim.position.set(-4, 4, -6);
      scene.add(rim);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.5;
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 1.8;

      const loader = new GLTFLoader();
      loader.load(
        MODEL_URL,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.5 / maxDim;
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
        },
        undefined,
        (err) => console.error('GLB load error', err)
      );

      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls.update();
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

      (mount as HTMLDivElement & { _cleanup?: () => void })._cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', onResize);
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    };

    init();

    return () => {
      cancelAnimationFrame(frame);
      const m = mount as HTMLDivElement & { _cleanup?: () => void };
      if (m._cleanup) m._cleanup();
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
