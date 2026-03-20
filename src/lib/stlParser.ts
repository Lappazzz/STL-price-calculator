import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export const parseSTL = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);

  // 1. Get Dimensions (Width, Depth, Height)
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const dimensions = {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
  };

  // 2. Get Volume
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
  
  const volumeCm3 = Math.abs(sum) / 1000;

  return { volumeCm3, dimensions, geometry };
};