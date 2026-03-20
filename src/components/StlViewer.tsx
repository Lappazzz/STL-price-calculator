"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Read Printer Bed Constraints from .env
const BED_SIZE_X = parseFloat(process.env.NEXT_PUBLIC_MAX_X || "256");
const BED_SIZE_Y = parseFloat(process.env.NEXT_PUBLIC_MAX_Y || "256");

interface StlViewerProps {
  geometry: THREE.BufferGeometry | null; // Allow null when no file is uploaded
}

export default function StlViewer({ geometry }: StlViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- 1. Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f1f5f9"); 

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // --- 2. Add Print Plate (Always visible) ---
    const bedGeometry = new THREE.PlaneGeometry(BED_SIZE_X, BED_SIZE_Y);
    const bedMaterial = new THREE.MeshStandardMaterial({
      color: "#919191", 
      roughness: 0.9,
      metalness: 0.1,
    });
    const bedMesh = new THREE.Mesh(bedGeometry, bedMaterial);
    bedMesh.rotation.x = -Math.PI / 2; 
    bedMesh.receiveShadow = true; 
    bedMesh.position.y = -0.1; 
    scene.add(bedMesh);

    const gridHelper = new THREE.GridHelper(BED_SIZE_X, 20, 0x555555, 0x444444);
    gridHelper.position.y = 0; 
    scene.add(gridHelper);

    // --- 3. Conditionally Add the STL Model ---
    let displayGeometry: THREE.BufferGeometry | null = null;
    let mesh: THREE.Mesh | null = null;
    let material: THREE.MeshStandardMaterial | null = null;

    if (geometry) {
      displayGeometry = geometry.clone();
      displayGeometry.rotateX(-Math.PI / 2);
      
      displayGeometry.computeBoundingBox();
      const box = displayGeometry.boundingBox!;
      const center = new THREE.Vector3();
      box.getCenter(center);

      material = new THREE.MeshStandardMaterial({
        color: "#3b82f6", 
        roughness: 0.5,
        metalness: 0.2,
      });
      mesh = new THREE.Mesh(displayGeometry, material);
      mesh.castShadow = true; 
      mesh.receiveShadow = true; 

      mesh.position.set(-center.x, -box.min.y, -center.z);
      scene.add(mesh);
    }

    // --- 4. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(150, 300, 150); 
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.bias = -0.0001; 
    scene.add(spotLight);

    // --- 5. Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.1;
    controls.enablePan = true; 
    controls.panSpeed = 1.0;
    
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };

    controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    // --- 6. Dynamic Camera Position ---
    if (displayGeometry) {
      // Focus on the loaded model
      const radius = displayGeometry.boundingSphere?.radius || 100;
      camera.position.set(0, radius * 1.5, radius * 2.5);
      controls.target.set(0, radius * 0.5, 0); 
    } else {
      // Focus on the empty print bed
      camera.position.set(0, BED_SIZE_X * 0.8, BED_SIZE_Y * 1.2);
      controls.target.set(0, 0, 0);
    }
    controls.update();

    // --- 7. Animation Loop ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      bedMaterial.dispose();
      bedGeometry.dispose();
      if (mesh) scene.remove(mesh);
      if (material) material.dispose();
      if (displayGeometry) displayGeometry.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [geometry]);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-80 rounded-2xl border-2 border-gray-200 overflow-hidden cursor-move shadow-inner relative"
    >
      <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none font-medium flex gap-3">
        <span>🖱️ Rotate: <span className="font-bold text-gray-200">Left Click</span></span>
        <span>✋ Pan: <span className="font-bold text-gray-200">Right Click</span></span>
      </div>
      {!geometry && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-bold opacity-50">
          Empty Print Bed
        </div>
      )}
    </div>
  );
}