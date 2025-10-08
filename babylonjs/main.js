// main.js - Escena BabylonJS basada en código del playground
(function(){
  function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("cam", Math.PI/3, Math.PI/4, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

  // Luces más suaves y cálidas simulando atardecer pantanoso
  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0.2,1,0.1), scene);
  hemi.intensity = 0.65;
  hemi.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85);
  hemi.groundColor = new BABYLON.Color3(0.15, 0.2, 0.15);

  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.6, -1, -0.3), scene);
  sun.intensity = 1.0;
  sun.diffuse = new BABYLON.Color3(1.0, 0.9, 0.75);
  sun.specular = new BABYLON.Color3(0.6, 0.55, 0.5);
  // Sombra
  const shadowGen = new BABYLON.ShadowGenerator(1024, sun);
  shadowGen.usePoissonSampling = true;

  // NIEBLA ligera para atmósfera húmeda
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.03;
  scene.fogColor = new BABYLON.Color3(0.75, 0.85, 0.9);

  // Cielo: textura procedural o fondo degradado simple
  const skyMat = new BABYLON.StandardMaterial("skyMat", scene);
  skyMat.backFaceCulling = false;
  skyMat.disableLighting = true;
  const skyTexture = new BABYLON.GradientMaterial ? null : null; // placeholder por si se usa GradientMaterial
  const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 200}, scene);
  skyMat.diffuseColor = new BABYLON.Color3(0.65, 0.85, 0.95);
  skyMat.specularColor = new BABYLON.Color3(0,0,0);
  skyMat.emissiveColor = new BABYLON.Color3(0.65, 0.85, 0.95);
  skybox.material = skyMat;

  // Terreno principal más ancho
  const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 40, height: 40, subdivisions: 32}, scene);
  const matG = new BABYLON.StandardMaterial("matG", scene);
  // Restaurada textura original del playground
  matG.diffuseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grass.png", scene);
  matG.diffuseTexture.uScale = 8; matG.diffuseTexture.vScale = 8;
  matG.specularColor = new BABYLON.Color3(0.05,0.05,0.05);
  ground.material = matG;

  // Zona de agua (plano con material de agua simple)
  const water = BABYLON.MeshBuilder.CreateGround("water", {width: 18, height: 12, subdivisions: 4}, scene);
  water.position = new BABYLON.Vector3(-5, 0.02, 0);
  const waterMat = new BABYLON.StandardMaterial("waterMat", scene);
  waterMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.55);
  waterMat.alpha = 0.75;
  waterMat.specularColor = new BABYLON.Color3(0.6, 0.7, 0.7);
  water.material = waterMat;

  // Ligeras ondulaciones animando la escala/posición UV
  let waterTime = 0;

  // Quitar esfera original y usar una roca decorativa
  const sphere = BABYLON.MeshBuilder.CreateSphere("rock", {diameter: 1.5}, scene);
  sphere.position = new BABYLON.Vector3(-6, 0.9, 2);
  const matRock = new BABYLON.StandardMaterial("matRock", scene);
  matRock.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/rockn.png", scene);
  matRock.specularColor = new BABYLON.Color3(0.1,0.1,0.1);
  sphere.material = matRock;

    // Caja con material PBR
  // Reemplazar caja por tronco caído sencillo
  const box = BABYLON.MeshBuilder.CreateCylinder("fallenLog", {height: 3.5, diameter: 0.5, tessellation: 12}, scene);
  box.rotation.z = Math.PI / 6;
  box.position = new BABYLON.Vector3(4, 0.3, -3);
  const pbr = new BABYLON.StandardMaterial("pbrLog", scene);
  pbr.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/wood.jpg", scene);
  pbr.specularColor = new BABYLON.Color3(0.1,0.1,0.1);
  box.material = pbr;

    // Árbol
    function createTree(name, position, scale = 1) {
      const trunk = BABYLON.MeshBuilder.CreateCylinder(name + "_trunk", { diameterTop: 0.5*scale, diameterBottom: 0.8*scale, height: 3*scale }, scene);
      trunk.position = new BABYLON.Vector3(position.x, position.y + 1.5*scale, position.z);
      const matTrunk = new BABYLON.StandardMaterial(name + "_matTrunk", scene);
      matTrunk.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.05);
      trunk.material = matTrunk;

      const foliageMat = new BABYLON.StandardMaterial(name + "_foliageMat", scene);
      foliageMat.diffuseColor = new BABYLON.Color3(0.12, 0.55, 0.12);

      const top1 = BABYLON.MeshBuilder.CreateSphere(name + "_top1", {diameter: 2.2*scale}, scene);
      top1.position = new BABYLON.Vector3(position.x, position.y + 3.4*scale, position.z); top1.material = foliageMat;
      const top2 = BABYLON.MeshBuilder.CreateSphere(name + "_top2", {diameter: 1.8*scale}, scene);
      top2.position = new BABYLON.Vector3(position.x + 0.6*scale, position.y + 3.0*scale, position.z - 0.3*scale); top2.material = foliageMat;
      const top3 = BABYLON.MeshBuilder.CreateSphere(name + "_top3", {diameter: 1.7*scale}, scene);
      top3.position = new BABYLON.Vector3(position.x - 0.6*scale, position.y + 3.0*scale, position.z + 0.3*scale); top3.material = foliageMat;

      const merged = BABYLON.Mesh.MergeMeshes([trunk, top1, top2, top3], true, false, null, false, true);
      if (merged) {
        merged.name = name;
      }
      return merged;
    }

    const tree = createTree("tree_main", new BABYLON.Vector3(6,0,5), 1);

    // === Capibara (aproximado con primitivas) ===
    // Función para crear el capibara y devolver el mesh combinado
    function createCapybara() {
      // Material principal (pelaje)
      const furMat = new BABYLON.StandardMaterial("capyFur", scene);
      // Usamos una textura marrón suave (wood como placeholder) + ligero brillo especular bajo
      furMat.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/wood.jpg", scene);
      furMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      furMat.roughness = 0.9;

      // Material hocico
      const snoutMat = new BABYLON.StandardMaterial("capySnout", scene);
      snoutMat.diffuseColor = new BABYLON.Color3(0.35, 0.25, 0.2);
      snoutMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

      // Cuerpo (cápsula improvisada con un escalado de esfera + cilindro central)
      const body = BABYLON.MeshBuilder.CreateSphere("capyBody", {diameterX: 2.2, diameterY: 1.2, diameterZ: 1.0}, scene);
      body.position = new BABYLON.Vector3(0.5, 0.6, -2);
      body.material = furMat;

      const belly = BABYLON.MeshBuilder.CreateCylinder("capyBelly", {height: 1.6, diameter: 1.0, tessellation: 12}, scene);
      belly.rotation.z = Math.PI/2;
      belly.scaling.y = 0.55; // aplastar
      belly.position = new BABYLON.Vector3(0.5, 0.55, -2);
      belly.material = furMat;

      // Cabeza
      const head = BABYLON.MeshBuilder.CreateSphere("capyHead", {diameter: 0.9}, scene);
      head.scaling.z = 1.2;
      head.position = new BABYLON.Vector3(1.5, 0.85, -2);
      head.material = furMat;

      // Hocico
      const snout = BABYLON.MeshBuilder.CreateSphere("capySnout", {diameter: 0.45}, scene);
      snout.scaling.z = 1.3;
      snout.position = new BABYLON.Vector3(1.9, 0.78, -2);
      snout.material = snoutMat;

      // Orejas
      const ear1 = BABYLON.MeshBuilder.CreateSphere("capyEar1", {diameter: 0.25}, scene);
      ear1.scaling.z = 0.6; ear1.scaling.x = 0.7;
      ear1.position = new BABYLON.Vector3(1.35, 1.15, -1.85);
      ear1.material = furMat;
      const ear2 = ear1.clone("capyEar2");
      ear2.position = new BABYLON.Vector3(1.35, 1.15, -2.15);

      // Patas (cilindros pequeños)
      function leg(name, offsetX, offsetZ) {
        const l = BABYLON.MeshBuilder.CreateCylinder(name, {height: 0.5, diameter: 0.18, tessellation: 8}, scene);
        l.position = new BABYLON.Vector3(offsetX, 0.25, offsetZ);
        l.material = furMat;
        return l;
      }
      const legFL = leg("capyLegFL", -0.2 + 0.5, -1.65 + (-0.35 + -2 + 2)); // ajustar Z relativo a cuerpo (-2 base)
      legFL.position.z = -1.7; legFL.position.x = 0.1; // fino ajuste
      const legFR = leg("capyLegFR", 0.1, -2.3); // frontal derecha
      const legBL = leg("capyLegBL", 0.9, -1.7); // trasera izquierda
      const legBR = leg("capyLegBR", 0.9, -2.3); // trasera derecha

      // Cola (pequeña)
      const tail = BABYLON.MeshBuilder.CreateSphere("capyTail", {diameter: 0.2}, scene);
      tail.position = new BABYLON.Vector3(-0.4, 0.65, -2);
      tail.material = furMat;

      const parts = [body, belly, head, snout, ear1, ear2, legFL, legFR, legBL, legBR, tail];
      const capy = BABYLON.Mesh.MergeMeshes(parts, true, false, null, false, true);
      if (capy) {
        capy.name = "capybara";
      }
      return capy;
    }

  const capybara = createCapybara();
  if (capybara) capybara.position = new BABYLON.Vector3(-2, 0.55, 1);
  // Añadir algunas mallas al shadow generator
  [capybara, box, sphere].forEach(m => { if (m) shadowGen.addShadowCaster(m); });
  ground.receiveShadows = true;

    // Crear más árboles distribuidos (evitar zona de agua alrededor de x ~ -5)
    const treePositions = [
      {pos: new BABYLON.Vector3(10,0,6), scale: 1.1},
      {pos: new BABYLON.Vector3(12,0,-4), scale: 0.9},
      {pos: new BABYLON.Vector3(2,0,-8), scale: 0.8},
      {pos: new BABYLON.Vector3(-10,0,8), scale: 1.2},
      {pos: new BABYLON.Vector3(-12,0,-6), scale: 1.0},
      {pos: new BABYLON.Vector3(8,0,-10), scale: 0.95}
    ];
    const extraTrees = treePositions.map((t,i) => createTree("tree_"+i, t.pos, t.scale));
    extraTrees.forEach(t => { if (t) { shadowGen.addShadowCaster(t); } });
    // Animación ligera: respiración (escala Y del cuerpo) y cabeceo
    let t = 0;
    scene.onBeforeRenderObservable.add(() => {
      t += scene.getEngine().getDeltaTime() * 0.0025; // velocidad temporal
      if (capybara) {
        const s = 1 + Math.sin(t) * 0.015;
        capybara.scaling.y = s;
        capybara.rotation.y = Math.sin(t * 0.5) * 0.1;
      }
    });

    // Animación
    scene.registerBeforeRender(() => {
      sphere.rotation.y += 0.001; // roca casi estática
      box.rotation.y += 0.002; // tronco leve
      waterTime += scene.getEngine().getDeltaTime() * 0.00025;
      // Pequeño efecto de "olas" simple variando ligeramente la posición Y por un seno (solo visual fake)
      water.position.y = 0.02 + Math.sin(waterTime * 2.0) * 0.03;
      sun.intensity = 0.95 + Math.sin(waterTime * 0.5) * 0.05; // leve variación
    });

    return scene;
  }

  function init() {
    const canvas = document.getElementById("renderCanvas");
    if (!canvas) { console.error('No se encontró el canvas #renderCanvas'); return; }
    const engine = new BABYLON.Engine(canvas, true);
    const scene = createScene(engine, canvas);
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();