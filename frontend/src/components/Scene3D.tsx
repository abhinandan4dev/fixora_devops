import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Floating Icosahedrons ────────────────────────────── */
function FloatingGeo({ position, color, speed = 1, scale = 1 }: { position: [number, number, number]; color: string; speed?: number; scale?: number; }) {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.5;
        ref.current.rotation.y = Math.cos(state.clock.elapsedTime * speed * 0.2) * 0.5;
        ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.3;
    });

    return (
        <Float speed={speed * 1.5} rotationIntensity={0.4} floatIntensity={0.6}>
            <mesh ref={ref} position={position} scale={scale}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.15}
                    emissive={color}
                    emissiveIntensity={0.3}
                />
            </mesh>
        </Float>
    );
}

/* ─── Particle Field ────────────────────────────────────── */
function ParticleField({ count = 800 }: { count?: number }) {
    const ref = useRef<THREE.Points>(null!);

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        return pos;
    }, [count]);

    const colors = useMemo(() => {
        const col = new Float32Array(count * 3);
        const palette = [
            new THREE.Color('#818cf8'),
            new THREE.Color('#f472b6'),
            new THREE.Color('#22d3ee'),
            new THREE.Color('#a78bfa'),
        ];
        for (let i = 0; i < count; i++) {
            const c = palette[Math.floor(Math.random() * palette.length)];
            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }
        return col;
    }, [count]);

    useFrame((state) => {
        ref.current.rotation.y = state.clock.elapsedTime * 0.02;
        ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

/* ─── Torus Knot Wireframe ──────────────────────────────── */
function TorusKnot() {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        ref.current.rotation.x = state.clock.elapsedTime * 0.05;
        ref.current.rotation.y = state.clock.elapsedTime * 0.08;
    });

    return (
        <mesh ref={ref} position={[0, 0, -5]} scale={2.5}>
            <torusKnotGeometry args={[1, 0.3, 128, 16]} />
            <meshStandardMaterial
                color="#818cf8"
                wireframe
                transparent
                opacity={0.06}
                emissive="#6366f1"
                emissiveIntensity={0.15}
            />
        </mesh>
    );
}

/* ─── Connection Lines between geometries ────────────────── */
function ConnectionLines() {
    const ref = useRef<THREE.LineSegments>(null!);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const lineCount = 40;
        const positions = new Float32Array(lineCount * 6);
        for (let i = 0; i < lineCount; i++) {
            positions[i * 6] = (Math.random() - 0.5) * 20;
            positions[i * 6 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 6 + 2] = (Math.random() - 0.5) * 15;
            positions[i * 6 + 3] = (Math.random() - 0.5) * 20;
            positions[i * 6 + 4] = (Math.random() - 0.5) * 20;
            positions[i * 6 + 5] = (Math.random() - 0.5) * 15;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, []);

    useFrame((state) => {
        ref.current.rotation.y = state.clock.elapsedTime * 0.01;
        ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
    });

    return (
        <lineSegments ref={ref} geometry={geometry}>
            <lineBasicMaterial color="#818cf8" transparent opacity={0.04} />
        </lineSegments>
    );
}

/* ─── Main Scene Component ──────────────────────────────── */
export function Scene3D() {
    const handleCreated = useCallback((state: { gl: THREE.WebGLRenderer }) => {
        state.gl.setClearColor('#030712');
    }, []);

    return (
        <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
            <Canvas
                camera={{ position: [0, 0, 8], fov: 60 }}
                dpr={[1, 1.5]}
                onCreated={handleCreated}
                style={{ pointerEvents: 'auto' }}
            >
                <ambientLight intensity={0.15} />
                <pointLight position={[10, 10, 10]} color="#818cf8" intensity={0.5} />
                <pointLight position={[-10, -10, 5]} color="#f472b6" intensity={0.3} />
                <pointLight position={[0, 5, -5]} color="#22d3ee" intensity={0.2} />

                <Stars
                    radius={50}
                    depth={50}
                    count={2000}
                    factor={3}
                    saturation={0.5}
                    fade
                    speed={0.5}
                />

                <ParticleField count={600} />
                <TorusKnot />
                <ConnectionLines />

                <FloatingGeo position={[-4, 2, -3]} color="#818cf8" speed={0.8} scale={0.6} />
                <FloatingGeo position={[4, -1, -4]} color="#f472b6" speed={1.2} scale={0.5} />
                <FloatingGeo position={[0, 3, -6]} color="#22d3ee" speed={0.6} scale={0.8} />
                <FloatingGeo position={[-3, -3, -5]} color="#a78bfa" speed={1} scale={0.4} />
                <FloatingGeo position={[5, 2, -7]} color="#34d399" speed={0.9} scale={0.5} />
            </Canvas>

            {/* Gradient overlay to blend 3D into page */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(3,7,18,0.4) 70%, rgba(3,7,18,0.8) 100%)'
            }} />
        </div>
    );
}
