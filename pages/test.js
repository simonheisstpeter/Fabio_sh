import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect";

const AsciiAnimation = () => {
  const containerRef = useRef();

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer();
    const effect = new AsciiEffect(renderer, ' dieDgtale', { invert: true }, { width: window.innerWidth, height: window.innerHeight });

    effect.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(effect.domElement);

    const geometry = new THREE.TubeGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const animate = () => {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.02;
      cube.rotation.y += 0.01;

      effect.render(scene, camera);
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      effect.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      containerRef.current.removeChild(effect.domElement);
    };
  }, []);

  return (
    <>
    <div className="animate-pulse" ref={containerRef}>

    </div>      <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-start">
        <h1 className="text-9xl text-gray-100 text-left bg-black hover:bg-emerald-500 duration-200 p-2">dieDigitale</h1>
      </div></>
  );
}

export default AsciiAnimation;
