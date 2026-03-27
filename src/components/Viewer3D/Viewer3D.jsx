import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Center } from '@react-three/drei';
import { Box, CircularProgress, Typography, Tooltip, IconButton, Chip, Button } from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

/** Singleton loader — only fetches the Sketchfab SDK script once. */
let _sfbApiPromise = null;
function loadSketchfabApi() {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);
  if (_sfbApiPromise) return _sfbApiPromise;
  _sfbApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.onload = () => resolve(window.Sketchfab);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _sfbApiPromise;
}

/**
 * Fallback component shown while the 3D scene is initialising.
 */
function LoadingFallback() {
  return (
    <Html center>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#aaa' }}>
        <CircularProgress size={32} sx={{ color: '#888' }} />
        <Typography variant="caption">Loading 3D model…</Typography>
      </Box>
    </Html>
  );
}

/**
 * Procedural skull rendered entirely from Three.js primitives.
 *
 * Anatomy covered:
 *   cranium · frontal brow · occipital · eye orbits (rim + dark socket) ·
 *   nasal aperture · mid-face · zygomatic arches · forehead · maxilla ·
 *   upper & lower tooth rows · mandible body + rami
 *
 * @param {string}  color      - hex colour for the bone material
 * @param {boolean} wireframe  - toggle wireframe mode
 */
function ProceduralSkull({ color = '#c8b89a', wireframe = false }) {
  const bone = { color, roughness: 0.78, metalness: 0.04, wireframe };
  const dark = { color: '#120e0a', roughness: 1,    metalness: 0,    wireframe };
  const enamel = { color: '#edeade', roughness: 0.3, metalness: 0,   wireframe };

  return (
    <Center>
      {/* Lift the whole assembly so it sits centred in the camera */}
      <group position={[0, 0.08, 0]}>

        {/* ════════ CRANIUM ════════ */}
        {/* Main egg-shaped braincase — slightly tall and narrow front-to-back */}
        <mesh scale={[1, 1.13, 0.88]} castShadow receiveShadow>
          <sphereGeometry args={[0.5, 48, 32]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* Occipital protrusion (back-base of skull) */}
        <mesh position={[0, -0.09, -0.41]} scale={[0.62, 0.44, 0.26]} castShadow>
          <sphereGeometry args={[0.5, 20, 14]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* Temporal regions (sides, slightly wider) */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.45, 0.05, -0.08]} scale={[0.22, 0.38, 0.46]} castShadow>
            <sphereGeometry args={[0.5, 16, 10]} />
            <meshStandardMaterial {...bone} />
          </mesh>
        ))}

        {/* ════════ FOREHEAD / FRONTAL BONE ════════ */}
        <mesh position={[0, 0.29, 0.34]} scale={[0.9, 0.26, 0.42]} castShadow>
          <sphereGeometry args={[0.5, 24, 14]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* Supraorbital brow ridge */}
        <mesh position={[0, 0.12, 0.46]} scale={[0.9, 0.12, 0.28]} castShadow>
          <sphereGeometry args={[0.5, 24, 10]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* ════════ EYE ORBITS ════════ */}
        {[[-0.175, 0.09, 0.46], [0.175, 0.09, 0.46]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            {/* Dark hollow socket */}
            <mesh>
              <sphereGeometry args={[0.096, 18, 12]} />
              <meshStandardMaterial {...dark} />
            </mesh>
            {/* Orbital rim (torus) — tilted slightly inward */}
            <mesh rotation={[Math.PI / 2, 0, i === 0 ? 0.12 : -0.12]}>
              <torusGeometry args={[0.107, 0.025, 10, 36]} />
              <meshStandardMaterial {...bone} />
            </mesh>
          </group>
        ))}

        {/* ════════ MID-FACE / NASAL ════════ */}
        {/* Mid-face projection */}
        <mesh position={[0, -0.07, 0.39]} scale={[0.7, 0.52, 0.32]} castShadow>
          <sphereGeometry args={[0.5, 28, 18]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* Piriform (nasal) aperture — dark cavity */}
        <mesh position={[0, -0.14, 0.54]} scale={[0.62, 1, 0.55]}>
          <sphereGeometry args={[0.072, 14, 10]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        {/* Nasal bridge */}
        <mesh position={[0, 0.01, 0.5]} scale={[0.22, 0.28, 0.18]} castShadow>
          <sphereGeometry args={[0.5, 14, 10]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* ════════ ZYGOMATIC ARCHES (cheekbones) ════════ */}
        {[-1, 1].map((side) => (
          <group key={side}>
            {/* Malar body */}
            <mesh position={[side * 0.345, -0.08, 0.3]} scale={[0.32, 0.2, 0.28]} castShadow>
              <sphereGeometry args={[0.5, 16, 10]} />
              <meshStandardMaterial {...bone} />
            </mesh>
            {/* Arch sweeping back */}
            <mesh position={[side * 0.425, -0.06, 0.1]} scale={[0.14, 0.1, 0.28]} castShadow>
              <sphereGeometry args={[0.5, 12, 8]} />
              <meshStandardMaterial {...bone} />
            </mesh>
            <mesh position={[side * 0.44, -0.05, -0.1]} scale={[0.12, 0.09, 0.2]} castShadow>
              <sphereGeometry args={[0.5, 12, 8]} />
              <meshStandardMaterial {...bone} />
            </mesh>
          </group>
        ))}

        {/* ════════ UPPER JAW (maxilla) ════════ */}
        <mesh position={[0, -0.3, 0.3]} scale={[0.56, 0.14, 0.3]} castShadow>
          <boxGeometry args={[1, 1, 1, 3, 1, 3]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* Upper teeth row — 7 teeth */}
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
          <mesh key={`ut${i}`} position={[i * 0.067, -0.375, 0.41]} castShadow>
            <boxGeometry args={[0.054, 0.068, 0.048]} />
            <meshStandardMaterial {...enamel} />
          </mesh>
        ))}

        {/* ════════ MANDIBLE (lower jaw) ════════ */}
        {/* Jaw body */}
        <mesh position={[0, -0.495, 0.24]} scale={[0.52, 0.13, 0.25]} castShadow>
          <boxGeometry args={[1, 1, 1, 3, 1, 3]} />
          <meshStandardMaterial {...bone} />
        </mesh>

        {/* Mandibular rami (vertical ascending branches) */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.285, -0.415, 0.04]} scale={[0.1, 0.26, 0.17]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial {...bone} />
          </mesh>
        ))}

        {/* Lower teeth row — 7 teeth */}
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
          <mesh key={`lt${i}`} position={[i * 0.067, -0.448, 0.395]} castShadow>
            <boxGeometry args={[0.054, 0.056, 0.045]} />
            <meshStandardMaterial {...enamel} />
          </mesh>
        ))}

      </group>
    </Center>
  );
}

/**
 * Main 3D Viewer component.
 *
 * When `sketchfabId` is provided, embeds the real photogrammetry scan from
 * Sketchfab. Otherwise falls back to the procedural Three.js skull.
 */
export default function Viewer3D({ color = '#c8b89a', height = 400, smithsonianScan = null, sketchfabId = null, cameraYaw = null }) {
  const controlsRef = useRef();
  const iframeRef = useRef(null);
  const [wireframe, setWireframe] = React.useState(false);

  const resetCamera = () => {
    if (controlsRef.current) controlsRef.current.reset();
  };

  // Load the Sketchfab Viewer API and recenter the orbit pivot once the model
  // is ready. Without this, photogrammetry scans whose scene origin sits at the
  // specimen's base orbit left-right instead of spinning in place.
  useEffect(() => {
    if (!sketchfabId || !iframeRef.current) return;
    let cancelled = false;

    loadSketchfabApi().then((Sketchfab) => {
      if (cancelled) return;
      const client = new Sketchfab(iframeRef.current);
      client.init(sketchfabId, {
        autostart: 1,
        ui_theme: 'dark',
        ui_infos: 0,
        ui_watermark: 0,
        success(api) {
          if (cancelled) return;
          api.start();
          api.addEventListener('viewerready', () => {
            if (cancelled) return;
            api.recenterCamera();
            if (cameraYaw != null) {
              // recenterCamera() runs its own ~600ms animation; wait for it to
              // finish before reading the settled position and rotating from it.
              setTimeout(() => {
                if (cancelled) return;
                api.getCameraLookAt((err, data) => {
                  if (err || !data || cancelled) return;
                  const { position, target } = data;
                  const angle = (cameraYaw * Math.PI) / 180;
                  const dx = position[0] - target[0];
                  const dz = position[2] - target[2];
                  const cos = Math.cos(angle);
                  const sin = Math.sin(angle);
                  // duration 0 = instant snap, no second animation to race with
                  api.setCameraLookAt(
                    [target[0] + dx * cos - dz * sin, position[1], target[2] + dx * sin + dz * cos],
                    target,
                    0
                  );
                });
              }, 900);
            }
          });
        },
        error() {
          console.warn('Sketchfab viewer failed to load');
        },
      });
    });

    return () => { cancelled = true; };
  }, [sketchfabId, cameraYaw]);

  if (sketchfabId) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height, borderRadius: 2, overflow: 'hidden', bgcolor: '#08080f' }}>
        <iframe
          ref={iframeRef}
          title="3D Fossil Skull"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />
        <Chip
          label="Photogrammetry scan · CC-BY · MUVHN / NHM London"
          size="small"
          sx={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.55)', fontSize: '0.58rem',
            backdropFilter: 'blur(4px)', pointerEvents: 'none',
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height, borderRadius: 2, overflow: 'hidden', bgcolor: '#08080f' }}>
      {/* ── Smithsonian 3D scan banner (procedural mode only) ── */}
      {smithsonianScan && (
        <Box
          sx={{
            position: 'absolute', top: 8, left: 8, zIndex: 10,
            display: 'flex', flexDirection: 'column', gap: 0.5,
            maxWidth: 'calc(100% - 88px)',
          }}
        >
          <Chip
            label="Smithsonian 3D Fossil Scan Available"
            size="small"
            sx={{
              bgcolor: 'rgba(79,156,249,0.18)',
              color: '#4f9cf9',
              border: '1px solid rgba(79,156,249,0.4)',
              fontSize: '0.6rem',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
            }}
          />
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem !important' }} />}
            component="a"
            href={smithsonianScan.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontSize: '0.62rem',
              py: 0.25,
              px: 1,
              borderColor: 'rgba(79,156,249,0.4)',
              color: '#4f9cf9',
              bgcolor: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(79,156,249,0.12)', borderColor: '#4f9cf9' },
            }}
          >
            {smithsonianScan.specimen} · {smithsonianScan.age}
          </Button>
        </Box>
      )}

      {/* ── Toolbar ── */}
      <Box
        sx={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          display: 'flex', gap: 0.5,
          bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 2, p: 0.5,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Tooltip title={wireframe ? 'Solid Mode' : 'Wireframe Mode'}>
          <IconButton size="small" onClick={() => setWireframe((w) => !w)}
            sx={{ color: wireframe ? 'primary.main' : 'text.secondary' }}>
            {wireframe ? <GridOffIcon fontSize="small" /> : <GridOnIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset Camera">
          <IconButton size="small" onClick={resetCamera} sx={{ color: 'text.secondary' }}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Hint ── */}
      <Chip
        label="Drag to rotate · Scroll to zoom"
        size="small"
        sx={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          bgcolor: 'rgba(0,0,0,0.5)', color: 'text.secondary', fontSize: '0.6rem',
          backdropFilter: 'blur(4px)',
        }}
      />

      <Canvas camera={{ position: [0, 0.15, 2.4], fov: 42 }} shadows dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}>
        {/* Lighting — warm key light from above-front, cool fill from back */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 6, 4]} intensity={1.4} castShadow
          shadow-mapSize={[1024, 1024]} color="#fff8f0" />
        <directionalLight position={[-4, 1, -3]} intensity={0.5} color="#88aadd" />
        <pointLight position={[0, -2, 2]} intensity={0.25} color="#ff9966" />

        <Environment preset="night" />

        {/* Subtle ground shadow plane */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.82, 0]}>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.25} />
        </mesh>

        <Suspense fallback={<LoadingFallback />}>
          <ProceduralSkull color={color} wireframe={wireframe} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping dampingFactor={0.08}
          minDistance={1.2} maxDistance={5}
          target={[0, 0.08, 0]}
        />
      </Canvas>
    </Box>
  );
}

