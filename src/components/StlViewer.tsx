"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const BED_SIZE_X = parseFloat(process.env.NEXT_PUBLIC_MAX_X || "256");
const BED_SIZE_Y = parseFloat(process.env.NEXT_PUBLIC_MAX_Y || "256");

interface StlViewerProps {
  geometry: THREE.BufferGeometry | null;
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
    scene.background = new THREE.Color("#333333"); // Dark slicer background

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = THREE.PCFShadowMap; 
    container.appendChild(renderer.domElement);

    // --- 2. Add Print Plate ---
    const bedGeometry = new THREE.PlaneGeometry(BED_SIZE_X, BED_SIZE_Y);
    const bedMaterial = new THREE.MeshStandardMaterial({
      color: "#222222", 
      roughness: 0.8,
    });
    const bedMesh = new THREE.Mesh(bedGeometry, bedMaterial);
    bedMesh.rotation.x = -Math.PI / 2; 
    bedMesh.receiveShadow = true; 
    bedMesh.position.y = -0.1; 
    scene.add(bedMesh);

    const gridHelper = new THREE.GridHelper(BED_SIZE_X, 20, 0x555555, 0x444444);
    gridHelper.position.y = 0; 
    scene.add(gridHelper);

    // --- 3. Process the STL Model ---
    let displayGeometry: THREE.BufferGeometry | null = null;
    let mesh: THREE.Mesh | null = null;
    let material: THREE.MeshStandardMaterial | null = null;

    if (geometry) {
      displayGeometry = geometry.clone();
      displayGeometry.rotateX(-Math.PI / 2);
      
      // ✨ THE MAGIC LINE: This calculates smooth shading across the curves! ✨
      displayGeometry.computeVertexNormals();
      
      displayGeometry.computeBoundingBox();
      const box = displayGeometry.boundingBox!;
      const center = new THREE.Vector3();
      box.getCenter(center);

      // A smooth resin-like material to catch highlights
      material = new THREE.MeshStandardMaterial({
        color: "#5f6e7d", // Slate-blue/gray, standard for 3D modeling
        roughness: 0.4,   // Low enough to get nice specular highlights on curves
        metalness: 0.1,   // Adds a slight sheen
      });
      
      mesh = new THREE.Mesh(displayGeometry, material);
      mesh.castShadow = true; 
      mesh.receiveShadow = true; 

      mesh.position.set(-center.x, -box.min.y, -center.z);
      scene.add(mesh);
    }

    // --- 4. Professional 3-Point Studio Lighting ---
    // Ambient: Base visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Key Light: Primary light source (casts shadows)
    const keyLight = new THREE.SpotLight(0xffffff, 1.2);
    keyLight.position.set(150, 300, 150); 
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005; 
    scene.add(keyLight);

    // Fill Light: Softens the dark shadows on the opposite side
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.6); // Slightly cool tone
    fillLight.position.set(-150, 100, -150);
    scene.add(fillLight);

    // Rim/Back Light: Highlights the edges of the model to separate it from the background
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 150, -250);
    scene.add(rimLight);

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

    // --- 6. Camera Setup ---
    if (displayGeometry) {
      const radius = displayGeometry.boundingSphere?.radius || 100;
      camera.position.set(0, radius * 1.5, radius * 2.5);
      controls.target.set(0, radius * 0.5, 0); 
    } else {
      camera.position.set(0, BED_SIZE_X * 0.8, BED_SIZE_Y * 1.2);
      controls.target.set(0, 0, 0);
    }
    controls.update();

    // --- 7. Loop & Cleanup ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

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
      className="w-full h-full min-h-[320px] rounded-2xl border-2 border-gray-200 overflow-hidden cursor-move shadow-inner relative"
    >
      <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none font-medium flex gap-3 z-10">
        <span>🖱️ Rotate: <span className="font-bold text-gray-200">Left Click</span></span>
        <span>✋ Pan: <span className="font-bold text-gray-200">Right Click</span></span>
      </div>
      {!geometry && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-bold opacity-50 z-10 text-xl tracking-wide uppercase">
          Empty Print Bed
        </div>
      )}
    </div>
  );
}