import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./gallery.css";

const MAX_PANELS = 12;
const PANEL_ASPECT = 0.75;
const FOV = 32;

export const GALLERY_DEFAULT_IMAGES: readonly string[] = [
  "https://picsum.photos/seed/porto-01/900/1200",
  "https://picsum.photos/seed/porto-02/900/1200",
  "https://picsum.photos/seed/porto-03/900/1200",
  "https://picsum.photos/seed/porto-04/900/1200",
  "https://picsum.photos/seed/porto-05/900/1200",
  "https://picsum.photos/seed/porto-06/900/1200",
  "https://picsum.photos/seed/porto-07/900/1200",
  "https://picsum.photos/seed/porto-08/900/1200",
  "https://picsum.photos/seed/porto-09/900/1200",
  "https://picsum.photos/seed/porto-10/900/1200",
  "https://picsum.photos/seed/porto-11/900/1200",
  "https://picsum.photos/seed/porto-12/900/1200",
];

export interface GalleryProps {
  images?: readonly string[];
  speed?: number;
  radius?: number;
  height?: number;
  className?: string;
}

interface GalleryState {
  renderer: any;
  materials: any[];
  textures: Map<any, any>;
  layout: (count: number) => void;
}

export default function Gallery({
  images,
  speed = 0.14,
  radius = 10,
  height = 5.6,
  className = "",
}: GalleryProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<GalleryState | null>(null);
  const generationRef = useRef(0);
  const readyRef = useRef(false);
  const speedRef = useRef(speed);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  speedRef.current = speed;

  const sceneKey = `${radius}:${height}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: any;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "gallery__canvas";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
    let distance = radius * 1.9;
    camera.position.set(0, 0, distance);

    const group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.PlaneGeometry(height * PANEL_ASPECT, height);

    const materials: any[] = [];
    const meshes: any[] = [];

    for (let index = 0; index < MAX_PANELS; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      group.add(mesh);
      materials.push(material);
      meshes.push(mesh);
    }

    const layout = (count: number) => {
      const total = Math.max(1, Math.min(count, MAX_PANELS));
      const step = (Math.PI * 2) / total;

      meshes.forEach((mesh, index) => {
        if (index >= total) {
          mesh.visible = false;
          return;
        }
        const angle = index * step;
        mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
        mesh.rotation.set(0, angle, 0);
        mesh.visible = true;
      });
    };

    const pointer = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const width = host.clientWidth || 1;
      const heightPx = host.clientHeight || 1;
      renderer.setSize(width, heightPx, false);

      const aspect = width / heightPx;
      camera.aspect = aspect;

      const half = Math.tan((FOV * Math.PI) / 360);
      const target = radius * 2.2;
      const fitted = target / (2 * half * Math.max(aspect, 0.35));
      distance = Math.min(Math.max(fitted, radius * 1.7), radius * 2.8);

      camera.position.z = distance;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let active = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
      },
      { rootMargin: "250px" }
    );
    visibilityObserver.observe(host);

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const started = performance.now();
    let frame = 0;

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const elapsed = (performance.now() - started) / 1000;

      smooth.x += (pointer.x - smooth.x) * 0.06;
      smooth.y += (pointer.y - smooth.y) * 0.06;

      if (!reduceMotion) {
        group.rotation.y = elapsed * speedRef.current;
        group.position.y = Math.sin(elapsed * 0.55) * 0.12;
        group.rotation.x = smooth.y * 0.05;
        camera.position.x = smooth.x * 1.2;
        camera.lookAt(0, 0, 0);
      }

      if (active) renderer.render(scene, camera);
    };
    tick();

    stateRef.current = {
      renderer,
      materials,
      textures: new Map(),
      layout,
    };

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);

      materials.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });

      geometry.dispose();

      stateRef.current = null;
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();

      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [sceneKey]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const token = generationRef.current + 1;
    generationRef.current = token;

    const source = (images && images.length ? images : GALLERY_DEFAULT_IMAGES).filter(
      Boolean
    ) as string[];

    if (!source.length) return;

    const visible = Math.min(source.length, MAX_PANELS);
    state.layout(visible);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const anisotropy = state.renderer.capabilities.getMaxAnisotropy();

    source.slice(0, visible).forEach((url, index) => {
      loader.load(
        url,
        (texture: any) => {
          if (token !== generationRef.current) {
            texture.dispose();
            return;
          }

          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = anisotropy;

          const material = state.materials[index];
          const previous = state.textures.get(material);

          state.textures.set(material, texture);
          material.map = texture;
          material.needsUpdate = true;

          if (previous && previous !== texture) previous.dispose();

          if (!readyRef.current) {
            readyRef.current = true;
            setReady(true);
          }
        },
        undefined,
        () => {}
      );
    });
  }, [images, sceneKey]);

  return (
    <div
      className={`gallery-shell${ready ? " gallery-shell--ready" : ""} ${className}`.trim()}
    >
      <div ref={hostRef} className="gallery" aria-hidden="true" />
      {failed && (
        <div className="gallery__fallback">
          {(images && images.length ? images : GALLERY_DEFAULT_IMAGES)
            .slice(0, 12)
            .map((source, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <img key={`${source}-${index}`} src={source} alt="" loading="lazy" />
            ))}
        </div>
      )}
    </div>
  );
}