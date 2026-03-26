/**
 * Generates minimal but valid GLB (binary GLTF) files for the skull models.
 * Each GLB contains a simple sphere mesh to stand in for the real fossil scan.
 * Run once: node scripts/generate-models.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'models');

mkdirSync(OUT_DIR, { recursive: true });

/**
 * Builds a minimal GLB containing one mesh (UV sphere approximation
 * using an icosahedron-subdivided sphere baked into flat arrays).
 *
 * GLB format:
 *   - 12-byte header
 *   - JSON chunk (type 0x4E4F534A)
 *   - BIN chunk  (type 0x004E4942)
 */
function buildGLB(color = [0.78, 0.72, 0.60]) {
  // Generate icosphere vertices & indices (subdivision level 2 → 162 vertices)
  const { positions, indices, normals } = buildIcosphere(2);

  // Pack positions (VEC3 float32) and indices (SCALAR uint16) into one buffer
  const posBytes = new Float32Array(positions);
  const normBytes = new Float32Array(normals);
  const idxBytes = new Uint16Array(indices);

  // Align to 4-byte boundary
  const pad4 = (n) => Math.ceil(n / 4) * 4;

  const posOffset = 0;
  const posLen = posBytes.byteLength;
  const normOffset = pad4(posLen);
  const normLen = normBytes.byteLength;
  const idxOffset = pad4(normOffset + normLen);
  const idxLen = idxBytes.byteLength;
  const totalBin = pad4(idxOffset + idxLen);

  const binBuffer = Buffer.alloc(totalBin, 0);
  Buffer.from(posBytes.buffer).copy(binBuffer, posOffset);
  Buffer.from(normBytes.buffer).copy(binBuffer, normOffset);
  Buffer.from(idxBytes.buffer).copy(binBuffer, idxOffset);

  // Compute bounding box
  let minPos = [Infinity, Infinity, Infinity];
  let maxPos = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      if (positions[i + j] < minPos[j]) minPos[j] = positions[i + j];
      if (positions[i + j] > maxPos[j]) maxPos[j] = positions[i + j];
    }
  }

  const gltf = {
    asset: { version: '2.0', generator: 'Human Evolution Explorer' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
            mode: 4,
          },
        ],
      },
    ],
    materials: [
      {
        name: 'SkullMaterial',
        pbrMetallicRoughness: {
          baseColorFactor: [...color, 1.0],
          metallicFactor: 0.05,
          roughnessFactor: 0.75,
        },
        doubleSided: false,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: positions.length / 3,
        type: 'VEC3',
        min: minPos,
        max: maxPos,
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normals.length / 3,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        componentType: 5123, // UNSIGNED_SHORT
        count: indices.length,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posOffset, byteLength: posLen, target: 34962 },
      { buffer: 0, byteOffset: normOffset, byteLength: normLen, target: 34962 },
      { buffer: 0, byteOffset: idxOffset, byteLength: idxLen, target: 34963 },
    ],
    buffers: [{ byteLength: totalBin }],
  };

  const jsonStr = JSON.stringify(gltf);
  // JSON chunk must be padded with spaces (0x20) to 4-byte boundary
  const jsonPad = pad4(jsonStr.length);
  const jsonBuf = Buffer.alloc(jsonPad, 0x20);
  Buffer.from(jsonStr, 'utf8').copy(jsonBuf);

  // GLB Header: magic, version, total length
  const totalLen = 12 + 8 + jsonPad + 8 + totalBin;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // magic: glTF
  header.writeUInt32LE(2, 4);           // version: 2
  header.writeUInt32LE(totalLen, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPad, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // JSON

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(totalBin, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // BIN

  return Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, binBuffer]);
}

/**
 * Creates an icosphere (recursive subdivision of icosahedron) at a given level.
 * Returns flat arrays of positions, normals, and indices.
 */
function buildIcosphere(subdivisions) {
  // Golden ratio for icosahedron seed vertices
  const t = (1 + Math.sqrt(5)) / 2;
  const normalize = (v) => {
    const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
    return [v[0] / len, v[1] / len, v[2] / len];
  };

  let vertices = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(normalize);

  let faces = [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
  ];

  const midpoints = new Map();
  const getMidpoint = (a, b) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (midpoints.has(key)) return midpoints.get(key);
    const mid = normalize([
      (vertices[a][0] + vertices[b][0]) / 2,
      (vertices[a][1] + vertices[b][1]) / 2,
      (vertices[a][2] + vertices[b][2]) / 2,
    ]);
    vertices.push(mid);
    const idx = vertices.length - 1;
    midpoints.set(key, idx);
    return idx;
  };

  for (let i = 0; i < subdivisions; i++) {
    const newFaces = [];
    for (const [a, b, c] of faces) {
      const ab = getMidpoint(a, b);
      const bc = getMidpoint(b, c);
      const ca = getMidpoint(c, a);
      newFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = newFaces;
  }

  // Flatten
  const positions = vertices.flatMap((v) => v); // normals = positions for unit sphere
  const normals = [...positions];
  const indices = faces.flatMap((f) => f);

  return { positions, normals, indices };
}

// Model definitions: name → [R, G, B] base color
const models = {
  'skull_sapiens': [0.24, 0.70, 0.44],
  'skull_neanderthal': [0.27, 0.51, 0.71],
  'skull_erectus': [0.85, 0.65, 0.13],
  'skull_habilis': [0.80, 0.52, 0.25],
  'skull_generic': [0.78, 0.72, 0.60],
};

for (const [name, color] of Object.entries(models)) {
  const filePath = join(OUT_DIR, `${name}.glb`);
  const glb = buildGLB(color);
  writeFileSync(filePath, glb);
  console.log(`✓ Created ${filePath} (${glb.length} bytes)`);
}

console.log('\n✅ All 3D models generated successfully.');
