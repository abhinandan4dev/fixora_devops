import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Environment, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 1500 }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 10;
            p[i * 3 + 1] = (Math.random() - 0.5) * 10;
            p[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return p;
    }, [count]);

    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
            groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <group ref={groupRef}>
            <Points positions={points} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#818cf8"
                    size={0.015}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

function FloatingShapes() {
    return (
        <>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh position={[-2, 1, -2]}>
                    <octahedronGeometry args={[0.5, 0]} />
                    <MeshDistortMaterial
                        color="#ec4899"
                        speed={2}
                        distort={0.4}
                        radius={1}
                        emissive="#ec4899"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </Float>
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={2}>
                <mesh position={[3, -2, -3]}>
                    <icosahedronGeometry args={[0.8, 0]} />
                    <MeshDistortMaterial
                        color="#22d3ee"
                        speed={1.5}
                        distort={0.3}
                        radius={1}
                        emissive="#22d3ee"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </Float>
        </>
    );
}

function DataGrid() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
            <planeGeometry args={[50, 50, 50, 50]} />
            <meshBasicMaterial
                color="#818cf8"
                wireframe
                transparent
                opacity={0.15}
            />
        </mesh>
    );
}

export function Scene3D() {
    return (
        <div className="fixed inset-0 z-0 bg-surface-950">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <color attach="background" args={['#020617']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#818cf8" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ec4899" />

                <Particles />
                <FloatingShapes />
                <DataGrid />

                <Environment preset="city" />
            </Canvas>

            {/* Vignette overlay for depth */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(2, 6, 23, 0.4) 60%, rgba(2, 6, 23, 0.9) 100%)'
                }}
            />
        </div>
    );
}
