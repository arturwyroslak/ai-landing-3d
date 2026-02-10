import initScene from './scene/three-scene.js';

function isWebGLAvailable(){
  try{
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  }catch(e){
    return false;
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  const mount = document.getElementById('three-root');
  if(!mount){
    console.error('Three mount point not found');
    return;
  }

  if(!isWebGLAvailable()){
    mount.innerHTML = '<div style="padding:20px;color:#ddd">WebGL is not available in your browser. A static image will be shown instead.</div>';
    console.warn('WebGL not available - falling back to static content');
    return;
  }

  let sceneInstance = null;
  try{
    sceneInstance = initScene({mount});
    // Expose for debugging in dev
    window.__AI_LANDING__ = {scene:sceneInstance};
  }catch(err){
    console.error('Failed to initialize 3D scene',err);
    mount.innerHTML = '<div style="padding:20px;color:#ddd">Failed to load 3D scene.</div>';
  }

  // Clean up when navigating away
  window.addEventListener('beforeunload',()=>{
    try{
      if(sceneInstance && sceneInstance.renderer){
        sceneInstance.renderer.dispose();
      }
    }catch(e){
      // swallow errors during teardown
    }
  });
});
