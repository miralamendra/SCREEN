import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Dither.css';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 uCanvas;
uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveFrequency;
uniform float uWaveAmplitude;
uniform vec3 uWaveColor;
uniform vec2 uMousePos;
uniform int uEnableMouseInteraction;
uniform float uMouseRadius;
uniform float uColorNum;
uniform float uPixelSize;
varying vec2 vUv;

float getBayerValue(int x, int y) {
  if (y == 0) {
    if (x == 0) return 0.0/64.0; if (x == 1) return 48.0/64.0; if (x == 2) return 12.0/64.0; if (x == 3) return 60.0/64.0;
    if (x == 4) return 3.0/64.0; if (x == 5) return 51.0/64.0; if (x == 6) return 15.0/64.0; if (x == 7) return 63.0/64.0;
  }
  if (y == 1) {
    if (x == 0) return 32.0/64.0; if (x == 1) return 16.0/64.0; if (x == 2) return 44.0/64.0; if (x == 3) return 28.0/64.0;
    if (x == 4) return 35.0/64.0; if (x == 5) return 19.0/64.0; if (x == 6) return 47.0/64.0; if (x == 7) return 31.0/64.0;
  }
  if (y == 2) {
    if (x == 0) return 8.0/64.0;  if (x == 1) return 56.0/64.0; if (x == 2) return 4.0/64.0;  if (x == 3) return 52.0/64.0;
    if (x == 4) return 11.0/64.0; if (x == 5) return 59.0/64.0; if (x == 6) return 7.0/64.0;  if (x == 7) return 55.0/64.0;
  }
  if (y == 3) {
    if (x == 0) return 40.0/64.0; if (x == 1) return 24.0/64.0; if (x == 2) return 36.0/64.0; if (x == 3) return 20.0/64.0;
    if (x == 4) return 43.0/64.0; if (x == 5) return 27.0/64.0; if (x == 6) return 39.0/64.0; if (x == 7) return 23.0/64.0;
  }
  if (y == 4) {
    if (x == 0) return 2.0/64.0;  if (x == 1) return 50.0/64.0; if (x == 2) return 14.0/64.0; if (x == 3) return 62.0/64.0;
    if (x == 4) return 1.0/64.0;  if (x == 5) return 49.0/64.0; if (x == 6) return 13.0/64.0; if (x == 7) return 61.0/64.0;
  }
  if (y == 5) {
    if (x == 0) return 34.0/64.0; if (x == 1) return 18.0/64.0; if (x == 2) return 46.0/64.0; if (x == 3) return 30.0/64.0;
    if (x == 4) return 33.0/64.0; if (x == 5) return 17.0/64.0; if (x == 6) return 45.0/64.0; if (x == 7) return 29.0/64.0;
  }
  if (y == 6) {
    if (x == 0) return 10.0/64.0; if (x == 1) return 58.0/64.0; if (x == 2) return 6.0/64.0;  if (x == 3) return 54.0/64.0;
    if (x == 4) return 9.0/64.0;  if (x == 5) return 57.0/64.0; if (x == 6) return 5.0/64.0;  if (x == 7) return 53.0/64.0;
  }
  if (y == 7) {
    if (x == 0) return 42.0/64.0; if (x == 1) return 26.0/64.0; if (x == 2) return 38.0/64.0; if (x == 3) return 22.0/64.0;
    if (x == 4) return 41.0/64.0; if (x == 5) return 25.0/64.0; if (x == 6) return 37.0/64.0; if (x == 7) return 21.0/64.0;
  }
  return 0.0;
}

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = uWaveFrequency;
  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= uWaveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - uTime * uWaveSpeed;
  return fbm(p + fbm(p2)); 
}

vec3 dither(vec2 uv, vec3 color) {
  vec2 scaledCoord = floor(uv * uCanvas / uPixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = getBayerValue(x, y) - 0.25;
  float step = 1.0 / (uColorNum - 1.0);
  color += threshold * step;
  float bias = 0.02; // very low bias so we don't clip dark greens
  color = clamp(color - bias, 0.0, 1.0);
  return floor(color * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
}

void main() {
  vec2 normalizedPixelSize = uPixelSize / uCanvas;
  vec2 uvPixel = normalizedPixelSize * (floor(gl_FragCoord.xy / uPixelSize) + 0.5);
  vec2 uv = uvPixel;
  vec2 ditherUv = gl_FragCoord.xy / uCanvas;
  
  uv -= 0.5;
  uv.x *= uCanvas.x / uCanvas.y;
  
  float f = pattern(uv);
  
  if (uEnableMouseInteraction == 1) {
    vec2 mouseNDC = (uMousePos / uCanvas - 0.5) * vec2(1.0, -1.0);
    mouseNDC.x *= uCanvas.x / uCanvas.y;
    float dist = length(uv - mouseNDC);
    float effect = 1.0 - smoothstep(0.0, uMouseRadius, dist);
    f -= 0.5 * effect;
  }
  
  vec3 col = mix(vec3(0.0), uWaveColor, f);
  col = dither(ditherUv, col);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

interface DitherProps {
  className?: string;
  style?: React.CSSProperties;
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: string | number[];
  colorNum?: number;
  pixelSize?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
}

export default function Dither({
  className = '',
  style,
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.5, 0.5, 0.5],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 1
}: DitherProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  const toVec3 = (c: string | number[]): THREE.Color => {
    if (Array.isArray(c)) {
      return new THREE.Color(c[0], c[1], c[2]);
    }
    return new THREE.Color(c);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uWaveSpeed: { value: waveSpeed },
        uWaveFrequency: { value: waveFrequency },
        uWaveAmplitude: { value: waveAmplitude },
        uWaveColor: { value: toVec3(waveColor) },
        uMousePos: { value: new THREE.Vector2(0, 0) },
        uEnableMouseInteraction: { value: enableMouseInteraction ? 1 : 0 },
        uMouseRadius: { value: mouseRadius },
        uColorNum: { value: colorNum },
        uPixelSize: { value: pixelSize }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
      preserveDrawingBuffer: true
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(1); // Lock dpr to 1 as per template's canvas dpr=1
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    const handleResize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      material.uniforms.uCanvas.value.set(w, h);
    };

    handleResize();

    if ('ResizeObserver' in (window as any)) {
      const ro = new ResizeObserver(handleResize);
      ro.observe(container);
      resizeObserverRef.current = ro;
    } else {
      (window as any).addEventListener('resize', handleResize);
    }

    const loop = () => {
      if (!disableAnimation) {
        material.uniforms.uTime.value = clock.getElapsedTime();
      }

      if (enableMouseInteraction) {
        material.uniforms.uMousePos.value.copy(mouseRef.current);
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      else (window as any).removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [disableAnimation, enableMouseInteraction]);

  // Handle uniform updates dynamically
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uWaveSpeed.value = waveSpeed;
    mat.uniforms.uWaveFrequency.value = waveFrequency;
    mat.uniforms.uWaveAmplitude.value = waveAmplitude;
    mat.uniforms.uWaveColor.value.copy(toVec3(waveColor));
    mat.uniforms.uEnableMouseInteraction.value = enableMouseInteraction ? 1 : 0;
    mat.uniforms.uMouseRadius.value = mouseRadius;
    mat.uniforms.uColorNum.value = colorNum;
    mat.uniforms.uPixelSize.value = pixelSize;
  }, [waveSpeed, waveFrequency, waveAmplitude, waveColor, enableMouseInteraction, mouseRadius, colorNum, pixelSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enableMouseInteraction) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = (container as any).getBoundingClientRect();
      // Calculate mouse coordinates relative to the canvas
      mouseRef.current.set(e.clientX - rect.left, e.clientY - rect.top);
    };

    (container as any).addEventListener('pointermove', handlePointerMove);
    return () => {
      (container as any).removeEventListener('pointermove', handlePointerMove);
    };
  }, [enableMouseInteraction]);

  return <div ref={containerRef} className={`dither-container ${className}`} style={style} />;
}
