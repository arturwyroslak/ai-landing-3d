import * as THREE from 'three';

export default function initScene({mount}){
  if(!mount) throw new Error('mount element is required');

  const width = mount.clientWidth || 800;
  const height = mount.clientHeight || 600;

  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setSize(width,height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
  camera.position.set(0,0,6);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5,10,7.5);
  scene.add(dir);

  // Geometry - placeholder animated orb
  const g = new THREE.IcosahedronGeometry(1.4, 5);
  const mat = new THREE.MeshStandardMaterial({color:0x7c3aed,roughness:0.2,metalness:0.0,emissive:0x1b0764,emissiveIntensity:0.2});
  const mesh = new THREE.Mesh(g,mat);
  mesh.rotation.x = 0.4;
  scene.add(mesh);

  // Responsive resize
  function onResize(){
    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 600;
    renderer.setSize(w,h);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', onResize);

  // Simple animation loop
  let last = performance.now();
  function animate(t){
    const dt = (t - last) / 1000;
    last = t;

    mesh.rotation.y += dt * 0.3;
    mesh.rotation.x += dt * 0.08;

    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  return {scene,camera,renderer,mesh};
}
