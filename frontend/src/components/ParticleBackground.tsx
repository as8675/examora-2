import { useEffect, useRef } from "react";
import * as THREE from "three";

const ParticleBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: new THREE.Color("#a855f7"),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );
    scene.add(particlesMesh);

    camera.position.z = 3;

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Infinity loop rotation
      particlesMesh.rotation.y += 0.0005;
      particlesMesh.rotation.x = Math.sin(Date.now() * 0.0001) * 0.1;

      // Spiral motion
      const positions = particlesMesh.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const angle = Math.atan2(y, x);
        const radius = Math.sqrt(x * x + y * y);

        positions[i] = Math.cos(angle + 0.001) * radius;
        positions[i + 1] = Math.sin(angle + 0.001) * radius;
      }
      particlesMesh.geometry.attributes.position.needsUpdate = true;

      // Parallax effect
      camera.position.x = mousePosition.current.x * 0.3;
      camera.position.y = mousePosition.current.y * 0.3;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: "none" }}
    />
  );
};

export default ParticleBackground;
