// main.js - Escena BabylonJS basada en código del playground
(function(){
  function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);

  // UniversalCamera básica; el movimiento del personaje no depende de la cámara
  const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 4, -12), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  scene.activeCamera = camera;
  // No consumir WASD para no interferir con el personaje
  camera.keysUp = [];
  camera.keysDown = [];
  camera.keysLeft = [];
  camera.keysRight = [];
  camera.speed = 1.2;
  camera.inertia = 0.8;

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
  // Guardar referencia para uso externo (p. ej. modelos cargados luego)
  scene.metadata = scene.metadata || {};
  scene.metadata.shadowGen = shadowGen;

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
  // Sin textura: color sólido para el suelo
  matG.diffuseColor = new BABYLON.Color3(0.35, 0.6, 0.35);
  matG.specularColor = new BABYLON.Color3(0.05,0.05,0.05);
  ground.material = matG;

  // Colisionador sólido para el suelo (caja invisible con grosor)
  const groundCollider = BABYLON.MeshBuilder.CreateBox("groundCollider", { width: 40, height: 1, depth: 40 }, scene);
  groundCollider.position = new BABYLON.Vector3(0, -0.5, 0); // grosor de 1, centrado para que la cara superior quede en Y=0
  groundCollider.isPickable = false;
  groundCollider.visibility = 0;

  // Zona de agua (plano con material de agua simple)
  const water = BABYLON.MeshBuilder.CreateGround("water", {width: 18, height: 12, subdivisions: 4}, scene);
  water.position = new BABYLON.Vector3(-5, 0.02, 0);
  const waterMat = new BABYLON.StandardMaterial("waterMat", scene);
  waterMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.55);
  waterMat.alpha = 0.75;
  waterMat.specularColor = new BABYLON.Color3(0.6, 0.7, 0.7);
  water.material = waterMat;

  // Sin animaciones: agua estática

  // Quitar esfera original y usar una roca decorativa
  const sphere = BABYLON.MeshBuilder.CreateSphere("rock", {diameter: 1.5}, scene);
  sphere.position = new BABYLON.Vector3(-6, 0.9, 2);
  const matRock = new BABYLON.StandardMaterial("matRock", scene);
  // Sin textura: color sólido para la roca
  matRock.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  matRock.specularColor = new BABYLON.Color3(0.1,0.1,0.1);
  sphere.material = matRock;

    // Caja con material PBR
  // Reemplazar caja por tronco caído sencillo
  const box = BABYLON.MeshBuilder.CreateCylinder("fallenLog", {height: 3.5, diameter: 0.5, tessellation: 12}, scene);
  box.rotation.z = Math.PI / 6;
  box.position = new BABYLON.Vector3(4, 0.3, -3);
  const pbr = new BABYLON.StandardMaterial("pbrLog", scene);
  // Sin textura: color sólido para el tronco
  pbr.diffuseColor = new BABYLON.Color3(0.35, 0.2, 0.1);
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

  // Eliminado capibara y cualquier mesh agregado al modelo
  // Añadir algunas mallas al shadow generator (solo decorativos existentes)
  [box, sphere].forEach(m => { if (m) shadowGen.addShadowCaster(m); });
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
    // Animaciones removidas: capibara permanece estático

    // Animaciones removidas: roca, tronco, agua y luz permanecen estáticos

  // === FÍSICAS HAVOK: habilitar y crear colisionadores estáticos ===
    // Nota: el agua NO colisiona para permitir atravesarla (se puede activar si lo deseas)
    if (typeof HavokPhysics !== 'undefined') {
      HavokPhysics().then((hk) => {
        const plugin = new BABYLON.HavokPlugin(true, hk);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), plugin);

        // Suelo estático (BOX) usando el colisionador grueso
        new BABYLON.PhysicsAggregate(groundCollider, BABYLON.PhysicsShapeType.BOX, {
          mass: 0,
          friction: 1.0,
          restitution: 0.0
        }, scene);

        // Roca estática (SPHERE)
        new BABYLON.PhysicsAggregate(sphere, BABYLON.PhysicsShapeType.SPHERE, {
          mass: 0,
          friction: 0.9,
          restitution: 0.1
        }, scene);

        // Tronco caído estático (CYLINDER)
        new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.CYLINDER, {
          mass: 0,
          friction: 0.9,
          restitution: 0.05
        }, scene);

        // Árbol principal y adicionales como malla estática (MESH)
        const treeMeshes = [tree, ...extraTrees].filter(Boolean);
        treeMeshes.forEach(tm => {
          new BABYLON.PhysicsAggregate(tm, BABYLON.PhysicsShapeType.MESH, {
            mass: 0,
            friction: 0.9,
            restitution: 0.0
          }, scene);
        });

        // Guardar bandera de físicas habilitadas
        scene.metadata = scene.metadata || {};
        scene.metadata.physicsEnabled = true;
      });
    }

    return scene;
  }

  function init() {
    const canvas = document.getElementById("renderCanvas");
    if (!canvas) { console.error('No se encontró el canvas #renderCanvas'); return; }
    const engine = new BABYLON.Engine(canvas, true);
    const scene = createScene(engine, canvas);
    // Cargar modelo GLB del perro desde /dog/source
    // Requiere babylonjs-loaders (ya incluido en index.html)
    BABYLON.SceneLoader.ImportMesh(
      "",
      "../dog/source/",
      "animal  10.glb",
      scene,
  (meshes, particleSystems, skeletons, animationGroups) => {
        const root = new BABYLON.TransformNode("dogRoot", scene);
        meshes.forEach(m => {
          if (m && m.position) {
            m.parent = root;
          }
        });
  // Ajustes solicitados: subir sobre el suelo y duplicar escala
  root.position = new BABYLON.Vector3(0.5, 0.6, -1.8);
  root.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);
        root.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
        // Añadir sombras usando la referencia guardada
        const sg = scene.metadata && scene.metadata.shadowGen;
        if (sg && sg.addShadowCaster) {
          meshes.forEach(m => {
            if (m && m.getClassName && m.getClassName() !== 'TransformNode') {
              sg.addShadowCaster(m);
            }
          });
        }

        // Convertir a estático: remover skeleton de cada mesh y pesos de vértices
        meshes.forEach(m => {
          if (m && m.skeleton) {
            m.skeleton = null;
          }
          const geo = m && m.geometry ? m.geometry : null;
          if (geo && geo._meshes && m && m.getIndices) {
            const vdata = m.getVerticesData && m.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind);
            const wdata = m.getVerticesData && m.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind);
            if (vdata) m.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, null);
            if (wdata) m.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, null);
          }
          if (m && m.isVerticesDataPresent && m.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
            m._removeVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind);
          }
        });

        // Remover texturas del modelo GLB y dejar color sólido
        const solidDogMat = new BABYLON.StandardMaterial("solidDogMat", scene);
        solidDogMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        solidDogMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        meshes.forEach(m => {
          if (m && m.material) {
            m.material = solidDogMat;
          }
        });

        // Desechar skeletons importados
        if (skeletons && skeletons.length) {
          skeletons.length = 0;
        }

        // Crear un colisionador físico (cápsula) para el personaje
        // y moverlo con físicas (Havok) para respetar colisiones
        let character = null;      // Mesh colisionador visible=0
        let charBody = null;       // PhysicsBody del personaje
        if (scene.metadata && scene.metadata.physicsEnabled) {
          character = BABYLON.MeshBuilder.CreateCapsule("dogCollider", { height: 1.2, radius: 0.35 }, scene);
          character.position.copyFrom(root.position);
          character.visibility = 0; // ocultar el colisionador
          // Hacer del collider el padre del modelo importado para que se muevan juntos
          root.parent = character;
          root.position.set(0, 0, 0);

          const agg = new BABYLON.PhysicsAggregate(character, BABYLON.PhysicsShapeType.CAPSULE, {
            mass: 1,
            friction: 0.8,
            restitution: 0.0,
            linearDamping: 0.3
          }, scene);
          charBody = agg.body;
          // Evitar que el personaje se vuelque
          if (charBody && charBody.setAngularFactor) {
            charBody.setAngularFactor(new BABYLON.Vector3(0, 0, 0));
          }
        } else {
          // Fallback temporal: usar root hasta que físicas estén listas; luego creamos el collider
          character = root;
          let deferredPhysicsSub = null;
          deferredPhysicsSub = scene.onBeforeRenderObservable.add(() => {
            if (scene.metadata && scene.metadata.physicsEnabled) {
              // Crear collider y reemplazar
              const col = BABYLON.MeshBuilder.CreateCapsule("dogCollider", { height: 1.2, radius: 0.35 }, scene);
              col.position.copyFrom(character.getAbsolutePosition ? character.getAbsolutePosition() : character.position);
              col.visibility = 0;
              // Reparent
              root.parent = col;
              root.position.set(0, 0, 0);
              const agg2 = new BABYLON.PhysicsAggregate(col, BABYLON.PhysicsShapeType.CAPSULE, {
                mass: 1,
                friction: 0.8,
                restitution: 0.0,
                linearDamping: 0.3
              }, scene);
              const body2 = agg2.body;
              if (body2 && body2.setAngularFactor) {
                body2.setAngularFactor(new BABYLON.Vector3(0, 0, 0));
              }
              // Actualizar referencias
              scene.metadata.dogCollider = col;
              scene.metadata.dogBody = body2;
              // Sustituir variables locales para el bucle
              character = col;
              charBody = body2;
              // Centrar cámara una vez al nuevo collider
              const cam2 = scene.activeCamera;
              if (cam2 && cam2.setTarget) {
                cam2.setTarget(col.getAbsolutePosition());
              }
              // Remover el observador
              scene.onBeforeRenderObservable.remove(deferredPhysicsSub);
            }
          });
        }

        // Centrar la cámara activa una sola vez al personaje/collider
        const cam = scene.activeCamera;
        if (cam && cam.setTarget) {
          if (character && character.getAbsolutePosition) {
            cam.setTarget(character.getAbsolutePosition());
          } else if (character && character.position) {
            cam.setTarget(character.position);
          }
        }

        // === Movimiento WASD en el plano XZ usando scene.onKeyboardObservable ===
        const keys = { w:false, a:false, s:false, d:false };
        const kbSub = scene.onKeyboardObservable.add((kbInfo) => {
          const evt = kbInfo.event;
          const key = evt && evt.key ? evt.key.toLowerCase() : '';
          if (!key) return;
          if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
            if (key === 'w') keys.w = true;
            if (key === 'a') keys.a = true;
            if (key === 's') keys.s = true;
            if (key === 'd') keys.d = true;
          } else if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            if (key === 'w') keys.w = false;
            if (key === 'a') keys.a = false;
            if (key === 's') keys.s = false;
            if (key === 'd') keys.d = false;
          }
        });

        const speed = 3.0; // unidades por segundo en XZ
        const sub = scene.onBeforeRenderObservable.add(() => {
          const dt = scene.getEngine().getDeltaTime() * 0.001; // segundos
          // Movimiento en ejes globales (independiente de la cámara)
          let dx = 0, dz = 0;
          if (keys.w) dz -= 1; // adelante (−Z)
          if (keys.s) dz += 1; // atrás (+Z)
          if (keys.d) dx += 1; // derecha (+X)
          if (keys.a) dx -= 1; // izquierda (−X)

          // Control por físicas: establecer velocidad lineal en XZ
          if (character) {
            if (dx !== 0 || dz !== 0) {
              const len = Math.hypot(dx, dz) || 1;
              dx /= len; dz /= len;

              // No rotar el modelo: solo desplazamiento en XZ
              // Aplicar velocidad en XZ preservando Y (gravedad)
              if (charBody && charBody.getLinearVelocity && charBody.setLinearVelocity) {
                const cur = charBody.getLinearVelocity();
                const target = new BABYLON.Vector3(dx * speed, cur ? cur.y : 0, dz * speed);
                charBody.setLinearVelocity(target);
              } else {
                // Fallback sin físicas
                character.position.x += dx * speed * dt;
                character.position.z += dz * speed * dt;
              }

              // Sin ajuste de offset: la cámara no fuerza seguimiento; solo se centró una vez
            } else {
              // Sin input: detener XZ manteniendo caída/gravedad en Y
              if (charBody && charBody.getLinearVelocity && charBody.setLinearVelocity) {
                const cur = charBody.getLinearVelocity();
                const target = new BABYLON.Vector3(0, cur ? cur.y : 0, 0);
                charBody.setLinearVelocity(target);
              }
            }
          }
        });

        // Guardar referencias por si queremos limpiar luego (opcional)
        scene.metadata = scene.metadata || {};
        scene.metadata.dogRoot = root;
        scene.metadata.dogCollider = character;
        scene.metadata.dogBody = charBody;
        scene.metadata.dogInputCleanup = () => {
          scene.onKeyboardObservable.remove(kbSub);
          scene.onBeforeRenderObservable.remove(sub);
        };
        // Cleanup opcional: nada que limpiar para FollowCamera
      },
      null,
      (scene, message, exception) => console.error("Error cargando perro:", message, exception)
    );
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();