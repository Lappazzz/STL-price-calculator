import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export const parseSTLAndGetVolume = async (file: File): Promise<number> => {
  const arrayBuffer = await file.arrayBuffer();
  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);

  let sum = 0;
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const position = geometry.attributes.position;
  const faces = position.count / 3;

  for (let i = 0; i < faces; i++) {
    p1.fromBufferAttribute(position, i * 3 + 0);
    p2.fromBufferAttribute(position, i * 3 + 1);
    p3.fromBufferAttribute(position, i * 3 + 2);
    sum += p1.dot(p2.cross(p3)) / 6.0;
  }
  
  const volumeMm3 = Math.abs(sum);
  return volumeMm3 / 1000; // Returns cm³
};