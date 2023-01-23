import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Stripes = () => {
  const containerRef = useRef();

  useEffect(() => {
    // Set up the scene and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create the stripes material
    const stripesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color("black") },
        color2: { value: new THREE.Color("white") },
        stripeWidth: { value: 0.1 },
      },
      vertexShader: `
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
      fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float stripeWidth;
                varying vec2 vUv;
                void main() {
                  float f = mod(vUv.y / stripeWidth, 2.0);
                  f = step(1.0, f);
                  gl_FragColor = vec4(mix(color1, color2, f), 1.0);
                }
              `,
    });

    // Create the stripes mesh
    const stripesGeometry = new THREE.PlaneBufferGeometry(10, 10);
    const stripes = new THREE.Mesh(stripesGeometry, stripesMaterial);
    scene.add(stripes);

    // Create the light
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light);

    // Create the deformed balls
    const ballGeometry = new THREE.IcosahedronGeometry(1, 2);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const balls = [];
    for (let i = 0; i < 10; i++) {
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      );
      scene.add(ball);
      balls.push(ball);
    }

    // Animate the deformed balls movement
    function animate() {
      requestAnimationFrame(animate);

      balls.forEach((ball) => {
        ball.position.x += (Math.random() - 0.5) * 0.1;
        ball.position.y += (Math.random() - 0.5) * 0.1;
        ball.position.z += (Math.random() - 0.5) * 0.1;
        ball.rotation.x += 0.01;
        ball.rotation.y += 0.02;
      });

      renderer.render(scene, camera);
    }
    animate();

    // Clean up on unmount
    return () => {
      stripesGeometry.dispose();
      stripesMaterial.dispose();
      ballGeometry.dispose();
      ballMaterial.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default Stripes;
