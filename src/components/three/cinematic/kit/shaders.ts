import * as THREE from "three";

/**
 * Small custom materials. All are additive or alpha-blended and fade with the
 * scene fog so they never pop in at the edge of a scene.
 */

const FOG_FADE = /* glsl */ `
#ifdef USE_FOG
  alpha *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
#endif
`;

const withFog = (u: Record<string, THREE.IUniform>) => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]);

/** Volumetric-style light shaft: fades along its length and toward the silhouette. */
export function createBeamMaterial(color: THREE.ColorRepresentation) {
  return new THREE.ShaderMaterial({
    uniforms: withFog({ uColor: { value: new THREE.Color(color) }, uIntensity: { value: 0 } }),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vUv;
      varying float vRim;
      varying float vDist;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vRim = abs(dot(n, normalize(-mvPosition.xyz)));
        vDist = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      varying float vRim;
      varying float vDist;
      void main() {
        // uv.y = 0 at the narrow source end of the cone.
        float along = pow(1.0 - vUv.y, 1.6);
        float alpha = along * pow(vRim, 1.5) * uIntensity * 0.4 * smoothstep(2.5, 9.0, vDist);
        ${FOG_FADE}
        gl_FragColor = vec4(uColor * alpha, alpha);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    fog: true,
  });
}

/**
 * Energy shield that assembles from the ground up: fragments above the
 * `uReveal` height are discarded and a bright band traces the assembly edge.
 */
export function createShieldMaterial(color: THREE.ColorRepresentation, lines: boolean, height: number) {
  return new THREE.ShaderMaterial({
    uniforms: withFog({
      uColor: { value: new THREE.Color(color) },
      uReveal: { value: 0 },
      uHeight: { value: height },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
    }),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec3 vPos;
      varying float vRim;
      void main() {
        vPos = position;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normalize(position));
        vRim = 1.0 - abs(dot(n, normalize(-mvPosition.xyz)));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uReveal;
      uniform float uHeight;
      uniform float uOpacity;
      uniform float uTime;
      varying vec3 vPos;
      varying float vRim;
      void main() {
        if (vPos.y < -0.05) discard;
        float h = vPos.y / uHeight;
        float edge = uReveal * 1.08;
        if (h > edge) discard;
        float band = smoothstep(0.08, 0.0, edge - h) * step(uReveal, 0.999);
        float scan = 0.5 + 0.5 * sin(vPos.y * 6.0 - uTime * 1.6);
        float base = ${lines ? "0.55 + 0.25 * scan" : "pow(vRim, 2.2) * 0.45"};
        float alpha = (base + band * 0.6) * uOpacity;
        ${FOG_FADE}
        gl_FragColor = vec4(uColor * (1.0 + band * 0.7), alpha);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    fog: true,
  });
}

/** Torus arc that fills from 0 → uProgress (TorusGeometry uv.x runs around the ring). */
export function createArcMaterial(color: THREE.ColorRepresentation) {
  return new THREE.ShaderMaterial({
    uniforms: withFog({ uColor: { value: new THREE.Color(color) }, uProgress: { value: 0 }, uOpacity: { value: 1 } }),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uProgress;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        if (vUv.x > uProgress) discard;
        float head = smoothstep(uProgress - 0.04, uProgress, vUv.x);
        float alpha = uOpacity;
        ${FOG_FADE}
        gl_FragColor = vec4(uColor * (1.0 + head * 1.5), alpha);
      }`,
    transparent: true,
    toneMapped: false,
    fog: true,
  });
}

/** Infinite-looking floor grid with radial falloff. */
export function createGridMaterial(color: THREE.ColorRepresentation, cell = 1) {
  return new THREE.ShaderMaterial({
    uniforms: withFog({ uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 }, uCell: { value: cell }, uRadius: { value: 14 } }),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vXZ;
      void main() {
        vXZ = position.xy;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uCell;
      uniform float uRadius;
      varying vec2 vXZ;
      float gridLine(vec2 p, float cell) {
        vec2 g = abs(fract(p / cell - 0.5) - 0.5) / fwidth(p / cell);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main() {
        float minor = gridLine(vXZ, uCell) * 0.35;
        float major = gridLine(vXZ, uCell * 5.0);
        float fall = 1.0 - smoothstep(uRadius * 0.35, uRadius, length(vXZ));
        float alpha = max(minor, major) * fall * uOpacity;
        ${FOG_FADE}
        gl_FragColor = vec4(uColor, alpha);
      }`,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
}

/**
 * Atmospheric dust that wraps around the camera entirely on the GPU, so the
 * whole journey has drifting particles for one draw call and zero CPU work.
 */
export function createDustMaterial(size: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCam: { value: new THREE.Vector3() },
      uBox: { value: new THREE.Vector3(26, 16, 34) },
      uTime: { value: 0 },
      uFlow: { value: 0 },
      uSize: { value: size },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color("#7dd3fc") },
    },
    vertexShader: /* glsl */ `
      uniform vec3 uCam;
      uniform vec3 uBox;
      uniform float uTime;
      uniform float uFlow;
      uniform float uSize;
      attribute float aSeed;
      varying float vFade;
      void main() {
        vec3 drift = vec3(sin(uTime * 0.07 + aSeed * 6.0) * 0.6, uTime * 0.12 * (0.4 + aSeed), uFlow);
        vec3 p = mod(position + drift - uCam, uBox) - uBox * 0.5 + uCam;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        vFade = smoothstep(0.4, 2.5, d) * (1.0 - smoothstep(10.0, 17.0, d));
        gl_PointSize = uSize * (0.6 + aSeed) * (60.0 / max(d, 0.1));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c)) * vFade * uOpacity * 0.7;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
