import * as THREE from 'three';

export default function initScene({mount}){
  if(!mount) throw new Error('mount element is required');

  const width = mount.clientWidth || 800;
  const height = mount.clientHeight || 600;

  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  }catch(err){
    console.error('Failed to create WebGLRenderer',err);
    throw err;
  }

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
    if(renderer && camera){
      renderer.setSize(w,h);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    }
  }

  window.addEventListener('resize', onResize);

  // Simple animation loop
  let active = true;
  let last = performance.now();
  function animate(t){
    if(!active) return;
    const dt = (t - last) / 1000;
    last = t;

    try{
      mesh.rotation.y += dt * 0.3;
      mesh.rotation.x += dt * 0.08;
      renderer.render(scene,camera);
    }catch(err){
      console.error('Render loop error',err);
      // stop the loop on fatal errors
      active = false;
      return;
    }

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  function dispose(){
    // stop animation
    active = false;
    try{
      window.removeEventListener('resize', onResize);
    }catch(e){/* ignore */}

    // dispose geometry and materials
    try{
      mesh.geometry && mesh.geometry.dispose && mesh.geometry.dispose();
      mesh.material && mesh.material.dispose && mesh.material.dispose();
    }catch(e){/* ignore */}

    // remove from scene
    try{ scene.remove(mesh); }catch(e){}

    // dispose renderer
    try{
      if(renderer){
        renderer.dispose();
        if(renderer.domElement && renderer.domElement.parentNode === mount){
          mount.removeChild(renderer.domElement);
        }
      }
    }catch(e){/* ignore */}
  }

  return {scene,camera,renderer,mesh,dispose};
}
