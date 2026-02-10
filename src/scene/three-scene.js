import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export default function initScene({mount}){
  if(!mount) throw new Error('mount element is required');

  const width = Math.max(320, mount.clientWidth);
  const height = Math.max(240, mount.clientHeight || 480);

  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }catch(err){
    console.error('Failed to create WebGLRenderer',err);
    throw err;
  }

  renderer.setSize(width,height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2));
  renderer.domElement.style.display = 'block';
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = null; // transparent - hero has CSS backdrop

  const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
  camera.position.set(0,0,6);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x111122, 0.6);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5,10,7.5);
  scene.add(dir);

  // Geometry - stylized AI core orb
  const g = new THREE.IcosahedronGeometry(1.4, 5);
  const mat = new THREE.MeshStandardMaterial({
    color:0x8b5cf6,
    roughness:0.18,
    metalness:0.05,
    emissive:0x381a8b,
    emissiveIntensity:0.6,
    clearcoat:0.2
  });
  const mesh = new THREE.Mesh(g,mat);
  mesh.rotation.x = 0.4;
  mesh.scale.setScalar(1.0);
  scene.add(mesh);

  // Soft inner glow - a slightly larger translucent mesh
  const glowMat = new THREE.MeshBasicMaterial({color:0x7c5cff, transparent:true, opacity:0.06, blending:THREE.AdditiveBlending});
  const glowMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6,4), glowMat);
  scene.add(glowMesh);

  // Particle field
  const particleCount = Math.min(800, Math.floor((width*height)/800));
  const positions = new Float32Array(particleCount * 3);
  for(let i=0;i<particleCount;i++){
    const r = 2.4 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;
    positions[i*3] = Math.cos(theta) * Math.cos(phi) * r;
    positions[i*3+1] = Math.sin(phi) * r * 0.5;
    positions[i*3+2] = Math.sin(theta) * Math.cos(phi) * r;
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const particlesMat = new THREE.PointsMaterial({color:0xc7b3ff, size:0.014, sizeAttenuation:true, transparent:true, opacity:0.9});
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // Postprocessing
  let composer;
  try{
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.9, 0.4, 0.1);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.9;
    bloomPass.radius = 0.4;
    composer.addPass(bloomPass);
  }catch(e){
    console.warn('Postprocessing not available, falling back to basic render', e);
    composer = null;
  }

  // Responsive resize
  function onResize(){
    const w = Math.max(320, mount.clientWidth);
    const h = Math.max(240, mount.clientHeight || 400);
    if(renderer && camera){
      renderer.setSize(w,h);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    }
    if(composer && composer.setSize){
      composer.setSize(w,h);
    }
  }

  window.addEventListener('resize', onResize);

  // Pointer interaction - subtle parallax
  let pointer = {x:0,y:0};
  function onPointerMove(e){
    const rect = mount.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  mount.addEventListener('pointermove', onPointerMove);

  // Animation loop
  let active = true;
  let last = performance.now();
  function animate(t){
    if(!active) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;

    try{
      // Orb subtle breathing
      const scale = 1.0 + Math.sin(t / 1000) * 0.015;
      mesh.scale.setScalar(scale);
      glowMesh.scale.setScalar(1.0 + Math.sin(t / 800) * 0.03);

      // Rotations influenced by pointer
      mesh.rotation.y += dt * (0.2 + pointer.x * 0.3);
      mesh.rotation.x += dt * (0.06 + pointer.y * 0.03);
      glowMesh.rotation.y = mesh.rotation.y * 0.98;

      // Particles slow drift
      particles.rotation.y += dt * 0.02;

      if(composer){
        composer.render(dt);
      }else{
        renderer.render(scene,camera);
      }
    }catch(err){
      console.error('Render loop error',err);
      active = false;
      return;
    }

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  function dispose(){
    active = false;
    try{ window.removeEventListener('resize', onResize); }catch(e){}
    try{ mount.removeEventListener('pointermove', onPointerMove); }catch(e){}

    // dispose geometries/materials
    try{
      particlesGeo.dispose();
      particlesMat.dispose();
      mesh.geometry && mesh.geometry.dispose && mesh.geometry.dispose();
      mesh.material && mesh.material.dispose && mesh.material.dispose();
      glowMesh.geometry && glowMesh.geometry.dispose && glowMesh.geometry.dispose();
      glowMat && glowMat.dispose && glowMat.dispose();
    }catch(e){}

    try{ scene.remove(mesh); scene.remove(particles); scene.remove(glowMesh); }catch(e){}

    try{
      if(composer){
        composer.clearRenderTarget();
        // there is no standardized dispose for composer, but dispose passes
      }
    }catch(e){}

    try{
      if(renderer){
        renderer.dispose();
        if(renderer.domElement && renderer.domElement.parentNode === mount){
          mount.removeChild(renderer.domElement);
        }
      }
    }catch(e){}
  }

  return {scene,camera,renderer,mesh,dispose};
}
