"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type StageSlide = { imageUrl: string };

type Props = {
  slides: StageSlide[];
  active: number;
  /** Paused by the visitor: every moving part holds still. */
  paused: boolean;
  /** `prefers-reduced-motion`: shoes cross-fade in place; no fly-through, parallax or scroll dolly. */
  gentle: boolean;
  /** `right` parks the product in the right of the frame, clear of the copy. */
  align: "right" | "center";
  onReady: () => void;
  /** WebGL isn't available; the poster carries the hero instead. */
  onUnavailable?: () => void;
  /** The slide now actually on stage (after its image has loaded). */
  onShown?: (index: number) => void;
};

/** Everything the React side can ask of a running scene. */
type StageApi = {
  goTo: (index: number) => void;
  setPaused: (paused: boolean) => void;
  setGentle: (gentle: boolean) => void;
  setAlign: (align: "right" | "center") => void;
};

type ShoeState = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  from: Pose;
  to: Pose;
  start: number;
  duration: number;
  loaded: boolean;
};

type Pose = { x: number; y: number; z: number; scale: number; opacity: number; rz: number };

const ACTIVE: Pose = { x: 0, y: 0.05, z: 0.55, scale: 1, opacity: 1, rz: 0 };
const EXIT: Pose = { x: -2.9, y: 1.05, z: -2.6, scale: 0.5, opacity: 0, rz: 0.45 };
const ENTER: Pose = { x: 3.1, y: -1.15, z: -2.8, scale: 0.5, opacity: 0, rz: -0.4 };

const SWAP_MS = 1150;
/** Lets the poster finish fading before the first shoe enters. */
const INTRO_DELAY_MS = 280;
const GENTLE_SWAP_MS = 700;
/** Largest box a shoe may fill, in scene units — wide shoes and tall ones both fit. */
const SHOE_BOX = { w: 3.9, h: 2.9 };

/** Cubic-bezier(0.22, 1, 0.36, 1)-ish: fast start, long soft settle. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Routes a product image through Next's optimiser, so the texture arrives as a
 * sized WebP/AVIF from our own origin whatever the source — a local file or an
 * image uploaded to object storage — and WebGL never trips over CORS.
 */
function textureUrl(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=82`;
}

/**
 * Soft round sprite. `rgb` is "r,g,b"; alpha follows a smoothstep-shaped curve
 * down to zero. A straight linear ramp has a kink where it hits zero, and the
 * eye reads that kink as a hard rim — a visible disc rather than a glow.
 */
function radialTexture(rgb: string, peak: number, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const falloff = 1 - t * t * (3 - 2 * t); // 1 - smoothstep(t)
    g.addColorStop(t, `rgba(${rgb},${(peak * falloff * falloff).toFixed(4)})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The WebGL half of the hero: product cut-outs floating inside metallic gold
 * rings, with gold dust drifting through the frame.
 *
 * The rings are real geometry with a reflective gold material, and the shoes
 * are depth-tested against them — so a ring genuinely passes in front of a shoe
 * on one side and behind it on the other, instead of being a flat decoration
 * painted over the top. Transparent pixels of each cut-out are discarded
 * (`alphaTest`), otherwise the empty corners of the image would hide the ring
 * behind them.
 *
 * Work stops whenever it can't be seen: off-screen, background tab, or paused.
 * Everything created here is disposed on unmount, which matters because
 * client-side navigation mounts and unmounts the homepage repeatedly.
 */
export default function HeroStage({
  slides,
  active,
  paused,
  gentle,
  align,
  onReady,
  onUnavailable,
  onShown,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<StageApi | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;

  // Latest props for the one-time setup below to start from.
  const initial = useRef({ active, paused, gentle, align });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // No WebGL: the poster image in the parent simply stays in place.
      onUnavailableRef.current?.();
      return;
    }

    const small = mount.clientWidth < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    // Everything that moves as one — offset right on wide screens.
    const stage = new THREE.Group();
    scene.add(stage);

    // Warm key light for a highlight that travels round the rings.
    const key = new THREE.DirectionalLight(0xfff1d6, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);

    // ------------------------------------------------------------ glow --
    const glowTexture = radialTexture("214,170,85", 0.6, 256);
    // Broad and faint on purpose: a tighter, brighter glow reads as a disc
    // sitting behind the shoe rather than as light falling on it.
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        opacity: 0.24,
      })
    );
    glow.position.set(0, 0, -3);
    stage.add(glow);

    // Light pool under the shoe, so it reads as lit on a stage.
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1),
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        opacity: 0.6,
      })
    );
    pool.position.set(0, -1.75, 0.2);
    stage.add(pool);

    // ----------------------------------------------------------- rings --
    const gold = new THREE.MeshStandardMaterial({
      color: 0xd9ab52,
      metalness: 1,
      roughness: 0.2,
      envMapIntensity: 1.3,
    });
    const ringSpecs = [
      { radius: 2.35, tube: 0.02, tilt: [1.22, 0, 0.12], speed: 0.22 },
      { radius: 2.8, tube: 0.011, tilt: [1.02, 0.35, -0.42], speed: -0.15 },
      { radius: 3.25, tube: 0.007, tilt: [1.42, -0.2, 0.55], speed: 0.1 },
    ];
    const rings = ringSpecs.map((spec) => {
      const pivot = new THREE.Group();
      pivot.rotation.set(spec.tilt[0], spec.tilt[1], spec.tilt[2]);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, spec.tube, 20, 220), gold);
      pivot.add(ring);
      stage.add(pivot);
      return { ring, pivot, speed: spec.speed };
    });

    // ------------------------------------------------------------ dust --
    const dustCount = small ? 110 : 240;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSeeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 13;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      dustSeeds[i] = Math.random() * Math.PI * 2;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustTexture = radialTexture("255,236,190", 1, 64);
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        map: dustTexture,
        color: 0xe8c677,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.85,
        toneMapped: false,
      })
    );
    scene.add(dust);

    // ----------------------------------------------------------- shoes --
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const shoeGroup = new THREE.Group();
    stage.add(shoeGroup);

    const clock = new THREE.Clock();
    let elapsed = 0;
    let current = Math.min(initial.current.active, Math.max(0, slides.length - 1));
    let isPaused = initial.current.paused;
    let isGentle = initial.current.gentle;
    let alignment = initial.current.align;
    let readyFired = false;
    // A slide requested before its texture arrived; shown as soon as it does,
    // so the stage never swaps the current shoe for an empty frame.
    let pendingIndex: number | null = null;

    const shoes: ShoeState[] = slides.map((slide, index) => {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        alphaTest: 0.02,
        toneMapped: false,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      const pose = index === current ? ACTIVE : ENTER;
      applyPose(mesh, pose);
      mesh.visible = false;
      shoeGroup.add(mesh);

      const state: ShoeState = { mesh, from: pose, to: pose, start: 0, duration: 1, loaded: false };

      loader.load(textureUrl(slide.imageUrl), (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = maxAnisotropy;
        material.map = texture;
        material.needsUpdate = true;

        // Size the plane to the image's own proportions inside SHOE_BOX.
        const image = texture.image as { width: number; height: number };
        const fit = Math.min(SHOE_BOX.w / image.width, SHOE_BOX.h / image.height);
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(image.width * fit, image.height * fit);
        mesh.visible = true;
        state.loaded = true;

        if (index === current && !readyFired) {
          readyFired = true;
          // Make an entrance rather than pop in over the poster: the poster
          // (drawn at a slightly different size) fades out first, then the
          // shoe rises into place — never both at once, which reads as a
          // ghosted double image.
          applyPose(
            mesh,
            isGentle
              ? { ...ACTIVE, opacity: 0, scale: 0.97 }
              : { ...ACTIVE, opacity: 0, scale: 0.88, y: ACTIVE.y - 0.3 }
          );
          tweenTo(state, ACTIVE, isGentle ? 600 : 1000, INTRO_DELAY_MS);
          renderFrame();
          onShownRef.current?.(index);
          onReadyRef.current();
        } else if (index === pendingIndex) {
          goTo(index);
        }
      });

      return state;
    });

    function applyPose(mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>, pose: Pose) {
      mesh.position.set(pose.x, pose.y, pose.z);
      mesh.scale.setScalar(pose.scale);
      mesh.rotation.z = pose.rz;
      mesh.material.opacity = pose.opacity;
    }

    function tweenTo(state: ShoeState, to: Pose, duration: number, delay = 0) {
      const m = state.mesh;
      state.from = {
        x: m.position.x,
        y: m.position.y,
        z: m.position.z,
        scale: m.scale.x,
        opacity: m.material.opacity,
        rz: m.rotation.z,
      };
      state.to = to;
      state.start = elapsed + delay / 1000;
      state.duration = duration / 1000;
    }

    function goTo(next: number) {
      pendingIndex = null;
      if (!shoes.length || next === current) return;
      const outgoing = shoes[current];
      const incoming = shoes[next];
      if (!incoming.loaded) {
        pendingIndex = next;
        return;
      }

      if (isGentle) {
        // Out, then in — in place. Overlapping two half-transparent cut-outs
        // for a simultaneous cross-fade reads as a muddy double exposure.
        tweenTo(outgoing, { ...ACTIVE, opacity: 0 }, GENTLE_SWAP_MS * 0.45);
        applyPose(incoming.mesh, { ...ACTIVE, opacity: 0, scale: 0.97 });
        tweenTo(incoming, ACTIVE, GENTLE_SWAP_MS * 0.6, GENTLE_SWAP_MS * 0.4);
      } else {
        tweenTo(outgoing, EXIT, SWAP_MS);
        applyPose(incoming.mesh, ENTER);
        tweenTo(incoming, ACTIVE, SWAP_MS);
      }
      current = next;
      onShownRef.current?.(next);
    }

    // ------------------------------------------------------ interaction --
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let scrollProgress = 0;
    const onScroll = () => {
      const rect = mount.getBoundingClientRect();
      scrollProgress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // ---------------------------------------------------------- layout --
    function layout() {
      const width = mount!.clientWidth;
      const height = mount!.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const visibleHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const visibleWidth = visibleHeight * camera.aspect;
      // The composition is ~7.2 units wide; shrink it to fit narrow frames.
      const fit = Math.min(1, visibleWidth / 7.4, visibleHeight / 6.6);
      stage.scale.setScalar(fit);
      stage.position.x = alignment === "right" ? visibleWidth * 0.19 : 0;
    }
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(mount);
    layout();

    // ------------------------------------------------------ visibility --
    let inView = true;
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    });
    intersection.observe(mount);

    // ------------------------------------------------------------ loop --
    const parallax = { x: 0, y: 0 };

    function renderFrame() {
      renderer.render(scene, camera);
    }

    function tick() {
      // Capped so a stalled frame (tab switch, GC pause) cannot jump a tween, but
      // loosely enough that slow devices still finish transitions on time.
      const delta = Math.min(clock.getDelta(), 0.1);
      if (!inView || document.hidden) return;
      if (isPaused) {
        renderFrame();
        return;
      }
      elapsed += delta;

      // Rings turn about their own axes at different speeds. They keep turning
      // in gentle mode: a slow rotation in place isn't the kind of movement
      // reduced-motion guards against — sweeping, zooming and parallax are,
      // and those are what gentle mode removes.
      for (const { ring, speed } of rings) ring.rotation.z += speed * delta;

      // Shoes: advance any tween in flight, then add a gentle idle float.
      for (const state of shoes) {
        if (!state.loaded) continue;
        // Clamped at both ends: a delayed tween holds its start pose until due.
        const t = Math.min(1, Math.max(0, (elapsed - state.start) / state.duration));
        const k = easeOut(t);
        const { from, to } = state;
        state.mesh.position.set(lerp(from.x, to.x, k), lerp(from.y, to.y, k), lerp(from.z, to.z, k));
        state.mesh.scale.setScalar(lerp(from.scale, to.scale, k));
        state.mesh.rotation.z = lerp(from.rz, to.rz, k);
        state.mesh.material.opacity = lerp(from.opacity, to.opacity, k);
      }
      // A soft float and a slight turn, smaller in gentle mode.
      const hero = shoes[current];
      const sway = isGentle ? 0.45 : 1;
      if (hero?.loaded) {
        const settled = Math.min(1, Math.max(0, (elapsed - hero.start) / hero.duration));
        hero.mesh.position.y += Math.sin(elapsed * 1.4) * 0.07 * settled * sway;
        hero.mesh.rotation.y = Math.sin(elapsed * 0.6) * 0.16 * settled * sway;
      }
      pool.scale.x = 1 + Math.sin(elapsed * 1.4) * 0.05 * sway;

      // Dust drifts upward and sways; wraps round at the top.
      const positions = dustGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = positions.getY(i) + delta * (0.12 + (i % 5) * 0.03) * sway;
        if (y > 4) y = -4;
        positions.setY(i, y);
        positions.setX(i, positions.getX(i) + Math.sin(elapsed * 0.5 + dustSeeds[i]) * delta * 0.05);
      }
      positions.needsUpdate = true;

      // Pointer parallax and scroll choreography — the whole stage leans
      // toward the cursor, and eases back and up as the hero scrolls away.
      const targetX = isGentle ? 0 : pointer.x * 0.28;
      const targetY = isGentle ? 0 : pointer.y * 0.16;
      parallax.x += (targetX - parallax.x) * 0.05;
      parallax.y += (targetY - parallax.y) * 0.05;
      const scroll = isGentle ? 0 : scrollProgress;
      stage.rotation.y = parallax.x;
      stage.rotation.x = parallax.y + scroll * 0.45;
      stage.position.y = scroll * 1.4;
      camera.position.z = 9 + scroll * 2.5;
      dust.rotation.y = parallax.x * 0.5;

      renderFrame();
    }
    renderer.setAnimationLoop(tick);

    apiRef.current = {
      goTo,
      setPaused: (value) => (isPaused = value),
      setGentle: (value) => (isGentle = value),
      setAlign: (value) => {
        alignment = value;
        layout();
      },
    };

    return () => {
      apiRef.current = null;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);

      for (const state of shoes) {
        state.mesh.geometry.dispose();
        state.mesh.material.map?.dispose();
        state.mesh.material.dispose();
      }
      for (const { ring } of rings) ring.geometry.dispose();
      gold.dispose();
      glow.geometry.dispose();
      glow.material.dispose();
      pool.geometry.dispose();
      pool.material.dispose();
      glowTexture.dispose();
      dustGeometry.dispose();
      dust.material.dispose();
      dustTexture.dispose();
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // The scene is built once per set of slides; later prop changes are fed
    // in through `apiRef` below rather than by tearing the scene down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  // Block bodies on purpose: an expression-bodied effect returns the setter's
  // value, and React would try to call that as a cleanup function.
  useEffect(() => {
    apiRef.current?.goTo(active);
  }, [active]);
  useEffect(() => {
    apiRef.current?.setPaused(paused);
  }, [paused]);
  useEffect(() => {
    apiRef.current?.setGentle(gentle);
  }, [gentle]);
  useEffect(() => {
    apiRef.current?.setAlign(align);
  }, [align]);

  return <div ref={mountRef} className="absolute inset-0" />;
}
