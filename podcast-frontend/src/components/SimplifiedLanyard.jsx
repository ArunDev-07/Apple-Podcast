import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// Card component with lanyard
function Card() {
  const cardRef = useRef();
  const lanyardRef = useRef();
  const anchorRef = useRef();
  
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState([0, 0, 0]);
  const [position, setPosition] = useState([0, -1, 0]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [springForce, setSpringForce] = useState([0, 0, 0]);
  const [velocity, setVelocity] = useState([0, 0, 0]);
  
  // Handle pointer events
  const onPointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    const offset = [
      e.point.x - position[0],
      e.point.y - position[1],
      e.point.z - position[2]
    ];
    setDragOffset(offset);
  };
  
  const onPointerUp = () => {
    setDragging(false);
  };
  
  const onPointerMove = (e) => {
    if (dragging) {
      setPosition([
        e.point.x - dragOffset[0],
        e.point.y - dragOffset[1],
        e.point.z - dragOffset[2]
      ]);
    }
  };
  
  // Set cursor style based on hover/drag state
  useEffect(() => {
    document.body.style.cursor = hovered ? (dragging ? 'grabbing' : 'grab') : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragging]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (!dragging) {
      // Calculate spring force (attraction to center point at [0, -1, 0])
      const targetPos = [0, -1, 0];
      const stiffness = 2; // Spring stiffness
      const damping = 0.9; // Damping factor
      
      // Calculate spring force
      const force = [
        (targetPos[0] - position[0]) * stiffness,
        (targetPos[1] - position[1]) * stiffness,
        (targetPos[2] - position[2]) * stiffness
      ];
      
      // Add a bit of gravity
      force[1] -= 1;
      
      // Update velocity with force and damping
      const newVelocity = [
        (velocity[0] + force[0] * delta) * damping,
        (velocity[1] + force[1] * delta) * damping,
        (velocity[2] + force[2] * delta) * damping
      ];
      
      // Update position with velocity
      const newPosition = [
        position[0] + newVelocity[0] * delta,
        position[1] + newVelocity[1] * delta,
        position[2] + newVelocity[2] * delta
      ];
      
      // Update rotation based on velocity and position
      const newRotation = [
        rotation[0] + newVelocity[1] * 0.2 * delta,
        rotation[1] + newVelocity[0] * -0.2 * delta,
        rotation[2] + (newVelocity[0] * 0.1 - newVelocity[1] * 0.1) * delta
      ];
      
      setVelocity(newVelocity);
      setPosition(newPosition);
      setRotation(newRotation);
    }
    
    // Update the lanyard curve points
    if (lanyardRef.current && anchorRef.current) {
      // Get anchor and card positions
      const anchorPosition = new THREE.Vector3(0, 2, 0);
      const cardPosition = new THREE.Vector3(position[0], position[1], position[2]);
      
      // Create curve
      const curve = new THREE.CubicBezierCurve3(
        anchorPosition,
        new THREE.Vector3(position[0] * 0.2, 2 - Math.abs(position[1]) * 0.3, position[2] * 0.2),
        new THREE.Vector3(position[0] * 0.8, position[1] * 0.5 + 1, position[2] * 0.8),
        cardPosition
      );
      
      // Update lanyard geometry
      const points = curve.getPoints(30);
      lanyardRef.current.geometry.setFromPoints(points);
    }
  });
  
  return (
    <group>
      {/* Anchor point */}
      <mesh ref={anchorRef} position={[0, 2, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      
      {/* Lanyard strap */}
      <line ref={lanyardRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#ffffff" linewidth={2} />
      </line>
      
      {/* Card */}
      <group 
        ref={cardRef}
        position={position}
        rotation={rotation}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
      >
        {/* Card body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 2, 0.08]} />
          <meshStandardMaterial 
            color={hovered ? "#7c3aed" : "#6366f1"} 
            metalness={0.2}
            roughness={0.3}
          />
        </mesh>
        
        {/* Card face/content */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[1.2, 1.8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        
        {/* Logo */}
        <mesh position={[0, 0.6, 0.06]}>
          <circleGeometry args={[0.25, 32]} />
          <meshStandardMaterial color="#4f46e5" />
        </mesh>
        
        {/* Name field */}
        <mesh position={[0, 0.1, 0.06]}>
          <planeGeometry args={[0.8, 0.2]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        
        {/* Text fields */}
        {[-0.2, -0.5, -0.8].map((y, i) => (
          <mesh key={i} position={[0, y, 0.06]}>
            <planeGeometry args={[0.9, 0.1]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        ))}
        
        {/* Lanyard hole */}
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} rotation={[Math.PI/2, 0, 0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
    </group>
  );
}

// Main component
export default function SimplifiedLanyard() {
  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <Card />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}