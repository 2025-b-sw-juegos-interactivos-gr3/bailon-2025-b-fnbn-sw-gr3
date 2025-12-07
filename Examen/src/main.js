// src/main.js
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

let personaEnTaxi = null;           // referencia al mesh/persona que estoy cargando (null = sin persona)
let personas = [];                  // lista de personas en escena
let obstaculos = [];               // lista de obstáculos en escena
let zonasRecogida = [];             // zonas de donde vienen personas (opcional)
let zonaEntrega = null;             // zona de entrega
let score = 0;

// UI
const estadoEl = document.getElementById("estado");
const scoreEl = document.getElementById("score");

// Función principal
const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.8, 0.9, 1.0);
  scene.collisionsEnabled = true;

  // ---------------------------------------------------
  // Luz (la cámara la creamos después del jugador)
  // ---------------------------------------------------

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0,1,0), scene);
  light.intensity = 0.9;

  // ---------------------------------------------------
  // Suelo (con textura)
  // ---------------------------------------------------
  const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 60, height: 60}, scene);
  const matGround = new BABYLON.StandardMaterial("mg", scene);
  // si tienes textura local: assets/textures/ground.jpg
  matGround.diffuseTexture = new BABYLON.Texture("../assets/textures/ground.jpg", scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
  ground.material = matGround;

  // ---------------------------------------------------
  // Jugador (taxi) — usamos un modelo si está disponible, si no, un box
  // ---------------------------------------------------
  let jugador = BABYLON.MeshBuilder.CreateBox("jugador", {size: 1.6}, scene);
  jugador.position = new BABYLON.Vector3(10, 0.5, 0);

  // Opcional: si tienes un modelo glb (taxi.glb) lo puedes cargar así:
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "../assets/models/", "taxi.glb", scene);
    // si se cargó, reemplazamos el jugador por el root del modelo
    if (result.meshes.length > 0) {
      const root = result.meshes[0];
      root.position = jugador.position.clone();
      root.rotation = jugador.rotation.clone();
      root.scaling = new BABYLON.Vector3(0.01,0.01,0.01);
      jugador.dispose(); // quitamos el box
      jugador = root;
      jugador.name = "jugadorTaxi";
    }
  } catch (e) {
    console.warn("No se cargó modelo taxi.glb (continuando con box).", e);
  }

  // Hacemos que el jugador tenga colisión simple
  jugador.checkCollisions = true;
  jugador.ellipsoid = new BABYLON.Vector3(0.8, 1.0, 0.8);
  jugador.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);

  // ---------------------------------------------------
  // FollowCamera que sigue al jugador
  // ---------------------------------------------------
  const camera = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 3, -6), scene);
  camera.lockedTarget = jugador;     // objetivo
  camera.radius = 6;                 // distancia tipo tercera persona
  camera.heightOffset = 3;           // altura sobre el jugador
  camera.rotationOffset = 0;         // se actualizará según la rotación del jugador
  camera.cameraAcceleration = 0.1;   // respuesta de seguimiento
  camera.maxCameraSpeed = 50;        // límite de velocidad de ajuste
  camera.attachControl(canvas, true);

  // ---------------------------------------------------
  // ZONA de ENTREGA (ground semitransparente)
  // ---------------------------------------------------
  const zonaMat = new BABYLON.StandardMaterial("zonaMat", scene);
  zonaMat.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.1);
  zonaMat.alpha = 0.45;

  zonaEntrega = BABYLON.MeshBuilder.CreateGround("zonaEntrega", {width: 6, height: 6}, scene);
  zonaEntrega.position = new BABYLON.Vector3(-18, 0.01, -10);
  zonaEntrega.material = zonaMat;

  // ---------------------------------------------------
  // Crear varias personas con posiciones iniciales (y zonas de recogida)
  // ---------------------------------------------------
  const coords = [
    new BABYLON.Vector3(10, 1, 10),
    new BABYLON.Vector3(12, 1, 8),
    new BABYLON.Vector3(8, 1, 12)
  ];

  // Cargar y ubicar personas usando person.glb
  for (let i = 0; i < coords.length; i++) {
    const pos = coords[i];
    try {
      const res = await BABYLON.SceneLoader.ImportMeshAsync("", "../assets/models/", "person.glb", scene);
      if (res.meshes && res.meshes.length > 0) {
        const root = res.meshes[0];
        // Crear un contenedor para controlar posición/metadata
        const node = new BABYLON.TransformNode("persona_" + i, scene);
        node.position = pos.clone();
        // Parentear todos los meshes importados a "node"
        res.meshes.forEach(m => {
          if (m !== node) m.parent = node;
        });
        // Ajustar escala si el modelo es grande
        node.scaling = new BABYLON.Vector3(1, 1, 1);
        // Rotar en eje Y (180 grados)
        node.rotation = new BABYLON.Vector3(10.5, 4, 0);
        node.metadata = { id: i, delivered: false };
        personas.push(node);
      }
    } catch (e) {
      console.warn("No se pudo cargar person.glb para persona_" + i, e);
      // Fallback: esfera pequeña representando persona
      const s = BABYLON.MeshBuilder.CreateSphere("persona_" + i, {diameter: 0.8}, scene);
      s.position = pos.clone();
      const mat = new BABYLON.StandardMaterial("matPersona_" + i, scene);
      mat.diffuseColor = new BABYLON.Color3(0.9, 0.6, 0.6);
      s.material = mat;
      s.metadata = { id: i, delivered: false };
      personas.push(s);
    }
  }

  // ---------------------------------------------------
  // Obstáculos entre origen de personas y zona de entrega (farm_house.glb)
  // ---------------------------------------------------
  async function colocarObstaculosEntre(origenes, destino) {
    // Distribución aleatoria, fija y uniforme evitando spawns, zona de entrega y posición inicial del taxi
    const groundHalf = 30; // ground 60x60 centrado en 0
    const maxObstaculos = 12;
    const cellSize = 20; // celdas más grandes para más separación
    const jitter = 0; // sin aleatoriedad: posiciones fijas
    const minDistEntreObst = 15; // mayor separación entre obstáculos
    const radioExclusionOrigen = 4; // evitar spawns de personas
    const radioExclusionEntrega = 5; // evitar zona de entrega
    const radioExclusionTaxi = 3; // evitar posición inicial del taxi

    const candidatos = [];
    // generar centros de celdas dentro de límites del ground
    for (let x = -groundHalf + cellSize * 0.5; x <= groundHalf - cellSize * 0.5; x += cellSize) {
      for (let z = -groundHalf + cellSize * 0.5; z <= groundHalf - cellSize * 0.5; z += cellSize) {
        candidatos.push(new BABYLON.Vector3(x, 0, z));
      }
    }
    // no mezclamos candidatos: orden fijo garantiza posiciones fijas

    const posiciones = [];
    function esValida(pos) {
      if (BABYLON.Vector3.Distance(pos, destino.position) < radioExclusionEntrega) return false;
      for (const o of origenes) {
        if (BABYLON.Vector3.Distance(pos, o) < radioExclusionOrigen) return false;
      }
      if (BABYLON.Vector3.Distance(pos, jugador.position) < radioExclusionTaxi) return false;
      for (const p of posiciones) {
        if (BABYLON.Vector3.Distance(pos, p) < minDistEntreObst) return false;
      }
      return true;
    }

    // construir posiciones finales con jitter uniforme
    for (let c = 0; c < candidatos.length && posiciones.length < maxObstaculos; c++) {
      const base = candidatos[c];
      const pos = new BABYLON.Vector3(
        base.x,
        5,
        base.z
      );
      if (!esValida(pos)) continue;
      posiciones.push(pos);
    }

    // Instanciar obstáculos en posiciones calculadas
    for (let idx = 0; idx < posiciones.length; idx++) {
      const pos = posiciones[idx];
      try {
        const res = await BABYLON.SceneLoader.ImportMeshAsync("", "../assets/models/", "farm_house.glb", scene);
        if (res.meshes && res.meshes.length > 0) {
          const node = new BABYLON.TransformNode(`obstaculo_${idx}`, scene);
          node.position = pos;
          res.meshes.forEach(m => {
            if (m !== node) m.parent = node;
            m.checkCollisions = true;
          });
          node.scaling = new BABYLON.Vector3(5, 5, 5);
          node.rotation = new BABYLON.Vector3(4.7, 0, 0);
          obstaculos.push(node);
        }
      } catch(e) {
        const box = BABYLON.MeshBuilder.CreateBox(`obstaculo_${idx}`, {size: 2}, scene);
        box.position = pos;
        box.checkCollisions = true;
        const mat = new BABYLON.StandardMaterial(`obstMat_${idx}`, scene);
        mat.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4);
        box.material = mat;
        obstaculos.push(box);
      }
    }
  }

  await colocarObstaculosEntre(coords, zonaEntrega);

    // (No se eliminan obstáculos: ya se evita que toquen spawns y zona de entrega)

  // ---------------------------------------------------
  // Input: map de teclas y movimiento WASD
  // ---------------------------------------------------
  const inputMap = {};
  scene.actionManager = new BABYLON.ActionManager(scene);
  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
    inputMap[evt.sourceEvent.key.toLowerCase()] = true;
  }));
  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
    inputMap[evt.sourceEvent.key.toLowerCase()] = false;
  }));

  const velocidad = 0.2;

  scene.onBeforeRenderObservable.add(() => {
    // movimiento con colisiones
    let dir = new BABYLON.Vector3(0, 0, 0);
    if (inputMap["s"] || inputMap["arrowup"]) {
      dir.z -= velocidad;
    }
    if (inputMap["w"] || inputMap["arrowdown"]) {
      dir.z += velocidad;
    }
    if (inputMap["a"] || inputMap["arrowleft"]) {
      dir.x -= velocidad;
    }
    if (inputMap["d"] || inputMap["arrowright"]) {
      dir.x += velocidad;
    }
    if (!dir.equals(BABYLON.Vector3.Zero())) {
      // orientar el frente del coche hacia la dirección de movimiento
      const angY = Math.atan2(dir.x, dir.z);
      jugador.rotation.y = angY;
      jugador.moveWithCollisions(dir);
    }
    // alinear la cámara con la orientación del jugador (tercera persona)
    camera.rotationOffset = jugador.rotation.y * 180 / Math.PI;
  });

  // ---------------------------------------------------
  // Manejo de recoger/soltar personas con tecla ESPACIO
  // ---------------------------------------------------
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
      const key = kbInfo.event.key;
      if (key === " " || key.toLowerCase() === "e") {
        if (!personaEnTaxi) {
          // intentar recoger: buscar persona cercana y no entregada
          let candidato = null;
          let minD = 999;
          personas.forEach(p => {
            if (p.metadata && p.metadata.delivered) return;
            const d = BABYLON.Vector3.Distance(jugador.position, p.position);
            if (d < 2.0 && d < minD) { minD = d; candidato = p; }
          });
          if (candidato) {
            // Parenting: unir persona al jugador (como si subiera al taxi)
            personaEnTaxi = candidato;
            candidato.parent = jugador;
            candidato.position = new BABYLON.Vector3(0, 1.2, 0.2); // relativa al padre
            estadoEl.innerText = "Con pasajero";
            console.log("Persona recogida", candidato.name);
          } else {
            console.log("No hay persona cerca para recoger");
          }
        } else {
          // intentar entregar: comprobar distancia a zonaEntrega
          const distEntrega = BABYLON.Vector3.Distance(jugador.position, zonaEntrega.position);
          if (distEntrega < 4.0) {
            // la persona baja del taxi en la zona
            personaEnTaxi.parent = null;
            // poner la posición sobre la zona de entrega (evitar superposición)
            const dropPos = zonaEntrega.position.clone();
            dropPos.x += (Math.random() - 0.5) * 2; // pequeño offset
            dropPos.z += (Math.random() - 0.5) * 2;
            dropPos.y = 0.3;
            personaEnTaxi.position = dropPos;
            // marcar como entregado
            personaEnTaxi.metadata.delivered = true;
            personaEnTaxi = null;
            estadoEl.innerText = "Sin pasajero";
            score += 1;
            scoreEl.innerText = score;
            console.log("Pasajero entregado. Score:", score);
          } else {
            console.log("No estás en la zona de entrega.");
          }
        }
      }
    }
  });

  // ---------------------------------------------------
  // Pequeñas ayudas visuales: etiquetas (GUI) o bounding boxes
  // ---------------------------------------------------
  personas.forEach(p => {
    // un pequeño plano encima para indicar que se puede recoger
    const plane = BABYLON.MeshBuilder.CreatePlane(p.name + "_hint", {size: 0.8}, scene);
    plane.parent = p;
    plane.position = new BABYLON.Vector3(0, 0.6, 0);
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    const pm = new BABYLON.StandardMaterial("pm", scene);
    pm.diffuseColor = new BABYLON.Color3(1,1,0);
    pm.alpha = 0.6;
    plane.material = pm;
  });

  // (Sonidos eliminados)

  // ---------------------------------------------------
  // Debug: cámara libre al presionar F (opcional)
  // ---------------------------------------------------
  scene.onKeyboardObservable.add((kb) => {
    if (kb.type === BABYLON.KeyboardEventTypes.KEYDOWN && kb.event.key.toLowerCase() === "f") {
      scene.debugLayer.show();
    }
  });

  // ---------------------------------------------------
  // Retorno
  // ---------------------------------------------------
  return scene;
};

// crear scene y loop
createScene().then(scene => {
  engine.runRenderLoop(() => {
    scene.render();
  });
});

// resize
window.addEventListener("resize", () => engine.resize());
