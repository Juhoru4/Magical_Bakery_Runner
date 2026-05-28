import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { MTLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/OBJLoader.js';

const characters = [

  {
    id: "char1",
    name: "Cake",
    color: "#CA2C28",
    modelPath: "../src/models/characters/char1/CharCake.obj",
    mtlPath: "../src/models/characters/char1/CharCake.mtl",
    scale: 2,
    rotationY: 0,
    spinSpeed: 0.7,
    lift: 0,
  },

  {
    id: "char2",
    name: "Cupcake",
    color: "#D8AF70",
    modelPath: "../src/models/characters/char2/CharCupcake.obj",
    mtlPath: "../src/models/characters/char2/CharCupcake.mtl",
    scale: 2,
    rotationY: 0,
    spinSpeed: 0.7,
    lift: 0,
  },

  {
    id: "char3",
    name: "Donut",
    color: "#251009",
    modelPath: "../src/models/characters/char3/CharDonut.obj",
    mtlPath: "../src/models/characters/char3/CharDonut.mtl",
    scale: 2,
    rotationY: 0,
    spinSpeed: 0.7,
    lift: 0,
  }

];

const cardsContainer = document.getElementById("cards");

cardsContainer.innerHTML = characters.map((character, index) => `
  <div class="card" style="--card-accent:${character.color}" data-character-id="${character.id}">
    <div class="card__character">
      <div class="card__viewer" data-character-index="${index}"></div>
    </div>

    <div
      class="card__shape"
      style="background:${character.color}"
    ></div>

    <div
      class="card__detail"
      style="background:${character.color}"
    >

      <h1>${character.name}</h1>


    </div>

  </div>
`).join("");

const selectedCharacterId = localStorage.getItem("selectedCharacterId") || characters[0].id;
const cardElements = [...document.querySelectorAll(".card")];

cardElements.forEach((card) => {
  if (card.dataset.characterId === selectedCharacterId) {
    card.classList.add("card--selected");
  }

  card.addEventListener("click", () => {
    const newId = card.dataset.characterId;
    if (!newId) {
      return;
    }

    localStorage.setItem("selectedCharacterId", newId);
    cardElements.forEach((element) => element.classList.remove("card--selected"));
    card.classList.add("card--selected");
  });
});

const viewerElements = [...document.querySelectorAll(".card__viewer")];
const viewers = [];

characters.forEach((character, index) => {
  const container = viewerElements[index];
  if (!container) {
    return;
  }

  viewers.push(createCharacterViewer(container, character));
});

const resizeViewers = () => {
  for (const viewer of viewers) {
    viewer.resize();
  }
};

window.addEventListener("resize", resizeViewers);
resizeViewers();

function createCharacterViewer(container, character) {
  const scene = new THREE.Scene();
  scene.background = null;
  let modelRoot = null;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.9, 2.8);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
  keyLight.position.set(2, 4, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xF7EFDA, 0.5);
  fillLight.position.set(-2, 1, 2);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 32),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(character.color),
        transparent: true,
        opacity: 0.18,
        roughness: 1,
        metalness: 0,
      }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.95;
  scene.add(ground);

  const loaderPath = character.mtlPath.replace(/[^/]+$/, "");
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath(loaderPath);
  mtlLoader.load(character.mtlPath.split("/").pop(), (materials) => {
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath(loaderPath);
    objLoader.load(character.modelPath.split("/").pop(), (obj) => {
      modelRoot = obj;
      obj.rotation.y = character.rotationY;
      obj.scale.setScalar(character.scale);
      obj.position.y = character.lift;

      obj.traverse((child) => {
        if (child.material && child.material.specular) {
          child.material.specular = new THREE.Color(0x000000);
        }

        if (child.material && child.material.color) {
          child.material.color.offsetHSL(0, 0, 0.08);
        }

        child.castShadow = true;
        child.receiveShadow = true;
      });

      obj.updateWorldMatrix(true, true);
      const bounds = new THREE.Box3().setFromObject(obj);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;

      obj.position.x -= center.x;
      obj.position.y -= center.y;
      obj.position.z -= center.z;
      obj.position.y += character.lift;

      camera.position.set(0, maxDimension * 0.45, maxDimension * 2.2);
      camera.lookAt(0, 0, 0);

      scene.add(obj);
    });
  });

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) {
      return;
    }

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    if (modelRoot) {
      modelRoot.rotation.y = character.rotationY + (elapsed * character.spinSpeed);
    }
    scene.rotation.y = Math.sin(elapsed * 0.35) * 0.08;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  resize();
  render();

  return {
    resize,
  };
}