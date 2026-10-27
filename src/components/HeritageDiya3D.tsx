'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface HeritageDiya3DProps {
  className?: string;
  size?: number; // Size in pixels or responsive
  interactive?: boolean;
}

export function HeritageDiya3D({
  className = '',
  size = 220,
  interactive = true,
}: HeritageDiya3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = size;
    const height = size;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 4.2);
    camera.lookAt(0, 0.2, 0);

    // 3. Renderer with high DPR and transparent background
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Lighting Setup
    // Warm flame point light
    const flameLight = new THREE.PointLight(0xffa726, 3.2, 8, 1.8);
    flameLight.position.set(0, 0.75, 0.3);
    scene.add(flameLight);

    // Secondary soft amber ambient fill
    const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.8);
    scene.add(ambientLight);

    // Key directional light for metallic brass sheen
    const keyLight = new THREE.DirectionalLight(0xffecd2, 1.6);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    // Soft cool rim light from behind for luxury edge contrast
    const rimLight = new THREE.DirectionalLight(0xb8922a, 0.9);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // 5. Materials
    // Royal Polished Indian Brass Material
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xc49b30,
      metalness: 0.88,
      roughness: 0.24,
    });

    // Darker antique brass for stepped base trims
    const antiqueBrassMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6514,
      metalness: 0.92,
      roughness: 0.35,
    });

    // Golden Ghee / Oil Material
    const oilMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6a817,
      metalness: 0.3,
      roughness: 0.05,
    });

    // 6. Geometry Construction (Diya Group)
    const diyaGroup = new THREE.Group();
    scene.add(diyaGroup);

    // (A) Stepped Circular Pedestal
    const baseP1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.76, 0.12, 32),
      antiqueBrassMaterial
    );
    baseP1.position.y = -0.4;
    diyaGroup.add(baseP1);

    const baseP2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.65, 0.14, 32),
      brassMaterial
    );
    baseP2.position.y = -0.28;
    diyaGroup.add(baseP2);

    // (B) Elegant Lathed Diya Oil Bowl
    const points: THREE.Vector2[] = [];
    // Outline curve from stem to outward cup to upper lip
    points.push(new THREE.Vector2(0.3, -0.2));
    points.push(new THREE.Vector2(0.45, -0.05));
    points.push(new THREE.Vector2(0.85, 0.18));
    points.push(new THREE.Vector2(1.15, 0.42));
    points.push(new THREE.Vector2(1.22, 0.5));
    points.push(new THREE.Vector2(1.18, 0.52));
    points.push(new THREE.Vector2(1.0, 0.45));
    points.push(new THREE.Vector2(0.65, 0.28));
    points.push(new THREE.Vector2(0.2, 0.2));
    points.push(new THREE.Vector2(0.0, 0.18));

    const bowlGeometry = new THREE.LatheGeometry(points, 36);
    const bowlMesh = new THREE.Mesh(bowlGeometry, brassMaterial);
    diyaGroup.add(bowlMesh);

    // (C) Glistening Golden Oil Surface
    const oilGeo = new THREE.CircleGeometry(0.9, 32);
    const oilMesh = new THREE.Mesh(oilGeo, oilMaterial);
    oilMesh.rotation.x = -Math.PI / 2;
    oilMesh.position.y = 0.38;
    diyaGroup.add(oilMesh);

    // (D) Cotton Wick (Batti)
    const wickGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.28, 12);
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x3d2716,
      roughness: 0.9,
    });
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.set(0, 0.52, 0.15);
    wickMesh.rotation.x = 0.25;
    diyaGroup.add(wickMesh);

    // (E) The Sacred Flame (Jyoti) - Glowing Tear-Drop Layer
    const flameGeo = new THREE.SphereGeometry(0.22, 24, 24);
    // Stretch into flame tear drop
    flameGeo.scale(0.8, 1.9, 0.8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0.8, 0.18);
    diyaGroup.add(flameMesh);

    // Flame Outer Amber Halo
    const haloGeo = new THREE.SphereGeometry(0.32, 20, 20);
    haloGeo.scale(0.9, 1.8, 0.9);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff7a00,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0.82, 0.18);
    diyaGroup.add(haloMesh);

    // (F) Golden Ember Particles Rising from Flame
    const particleCount = 20;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 0.2;
      particlePositions[i * 3 + 1] = 0.85 + Math.random() * 0.8;
      particlePositions[i * 3 + 2] = 0.18 + (Math.random() - 0.5) * 0.2;
      particleSpeeds[i] = 0.008 + Math.random() * 0.012;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffd54f,
      size: 0.055,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    diyaGroup.add(particleSystem);

    // Initial slight tilt toward camera for royal presentation
    diyaGroup.rotation.x = 0.18;

    // 7. Mouse & Interactive Parallax State
    let targetRotationX = 0.18;
    let targetRotationY = 0;
    let isHovered = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Calculate normalized offset relative to container center
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (clientY - centerY) / (window.innerHeight / 2);

      targetRotationY = deltaX * 0.65;
      targetRotationX = 0.18 + deltaY * 0.35;
    };

    const handleMouseEnter = () => {
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
      targetRotationX = 0.18;
      targetRotationY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    // 8. 60fps Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // (A) Smooth Lerped Interactive Rotation
      diyaGroup.rotation.y += (targetRotationY - diyaGroup.rotation.y) * 0.06;
      diyaGroup.rotation.x += (targetRotationX - diyaGroup.rotation.x) * 0.06;

      // (B) Gentle Ambient Idle Floating Bobbing
      diyaGroup.position.y = Math.sin(time * 1.8) * 0.04;

      // (C) Realistic Flickering Sacred Flame & Dynamic Lighting
      const flicker1 = Math.sin(time * 14) * 0.08;
      const flicker2 = Math.cos(time * 26) * 0.05;
      const flicker3 = (Math.random() - 0.5) * 0.03;

      flameMesh.scale.y = 1.9 + flicker1 + flicker2;
      flameMesh.scale.x = 0.8 - flicker1 * 0.5;
      flameMesh.rotation.z = Math.sin(time * 8) * 0.05;

      haloMesh.scale.y = 1.8 + flicker1 * 1.2;
      haloMesh.scale.x = 0.9 + flicker2 * 0.8;

      // Modulate point light intensity with natural flame jitter
      flameLight.intensity = 3.2 + flicker1 * 4 + flicker3 * 6;

      // (D) Animate Rising Ember Particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Rise up
        positions[i * 3 + 1] += particleSpeeds[i];
        // Slight natural horizontal flutter
        positions[i * 3] += Math.sin(time * 6 + i) * 0.0015;

        // Reset if reached ceiling
        if (positions[i * 3 + 1] > 2.0) {
          positions[i * 3 + 1] = 0.85;
          positions[i * 3] = (Math.random() - 0.5) * 0.18;
          positions[i * 3 + 2] = 0.18 + (Math.random() - 0.5) * 0.18;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseenter', handleMouseEnter);
      container?.removeEventListener('mouseleave', handleMouseLeave);

      // Dispose geometries & materials
      baseP1.geometry.dispose();
      baseP2.geometry.dispose();
      bowlGeometry.dispose();
      oilGeo.dispose();
      wickGeo.dispose();
      flameGeo.dispose();
      haloGeo.dispose();
      particleGeo.dispose();

      brassMaterial.dispose();
      antiqueBrassMaterial.dispose();
      oilMaterial.dispose();
      wickMat.dispose();
      flameMat.dispose();
      haloMat.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, interactive]);

  return (
    <div
      ref={mountRef}
      className={`relative inline-flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ width: size, height: size }}
      title="Interactive 3D Heritage Diya · Move your cursor to inspect"
      aria-label="Interactive 3D Heritage Brass Lamp"
    />
  );
}
