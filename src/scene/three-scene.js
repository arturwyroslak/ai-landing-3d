// Lightweight Three.js scene module
// Public API: init(container: HTMLElement) -> Promise<void>, dispose() -> void

import * as THREE from 'three';

let renderer, scene, camera, rafId;

export async function init(container){
  if(!container) throw new Error('Container element is required');

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Scene & Camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0,1.2,3);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5,10,7.5);
  scene.add(dir);

  // Simple geometry as placeholder
  const geo = new THREE.IcosahedronGeometry(1, 3);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7c5cff, metalness: 0.6, roughness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = 0.5;
  scene.add(mesh);

  // Resize handling
  const onResize = ()=>{
    if(!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  };
  window.addEventListener('resize', onResize);

  // Animation loop
  let last = 0;
  const animate = (t)=>{
    rafId = requestAnimationFrame(animate);
    const dt = (t - last) / 1000; last = t;
    mesh.rotation.y += dt * 0.6;
    renderer.render(scene, camera);
  };
  rafId = requestAnimationFrame(animate);

  // Store for dispose
  init._onResize = onResize;
  init._mesh = mesh;
}

export function dispose(){
  try{
    if(rafId) cancelAnimationFrame(rafId);
    if(init._onResize) window.removeEventListener('resize', init._onResize);
    if(init._mesh){
      init._mesh.geometry.dispose();
      if(init._mesh.material){
        init._mesh.material.dispose();
      }
    }
    if(renderer && renderer.domElement && renderer.domElement.parentNode){
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = scene = camera = rafId = null;
  }catch(err){ console.warn('Error during scene dispose', err); }
}
