import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import {MTLLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/MTLLoader.js';
import {OBJLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/OBJLoader.js';


export const player = (() => {

  class Player {
    constructor(params) {
      this.position_ = new THREE.Vector3(0, 0, 0);
      this.velocity_ = 0.0;
      this.hit_ = false;
      this.invulnerableTime_ = 0.0;

      // this.mesh_ = new THREE.Mesh(
      //     new THREE.BoxBufferGeometry(1, 1, 1),
      //     new THREE.MeshStandardMaterial({
      //         color: 0x80FF80,
      //     }),
      // );
      // this.mesh_.castShadow = true;
      // this.mesh_.receiveShadow = true;
      // params.scene.add(this.mesh_);

      this.playerBox_ = new THREE.Box3();

      this.params_ = params;

      this.LoadModel_();
      this.InitInput_();
    }

    LoadModel_() {
      const characterOptions = {
        char1: {
          modelPath: '../src/models/characters/char1/Velociraptor.obj',
          mtlPath: '../src/models/characters/char1/Velociraptor.mtl',
          scale: 0.3,
          rotationY: Math.PI / 2,
          lift: 0.1,
        },
        char2: {
          modelPath: '../src/models/characters/char2/Apatosaurus.obj',
          mtlPath: '../src/models/characters/char2/Apatosaurus.mtl',
          scale: 0.22,
          rotationY: Math.PI / 2,
          lift: 0.0,
        },
        char3: {
          modelPath: '../src/models/characters/char3/Parasaurolophus.obj',
          mtlPath: '../src/models/characters/char3/Parasaurolophus.mtl',
          scale: 0.24,
          rotationY: Math.PI / 2,
          lift: 0.0,
        },
      };

      const selectedId = localStorage.getItem('selectedCharacterId') || 'char1';
      const config = characterOptions[selectedId] || characterOptions.char1;
      const loaderPath = config.mtlPath.replace(/[^/]+$/, '');

      const mtlLoader = new MTLLoader();
      mtlLoader.setPath(loaderPath);
      mtlLoader.load(config.mtlPath.split('/').pop(), (materials) => {
        materials.preload();

        const loader = new OBJLoader();
        loader.setMaterials(materials);
        loader.setPath(loaderPath);
        loader.load(config.modelPath.split('/').pop(), (obj) => {
          obj.scale.setScalar(config.scale);
          obj.rotation.y = config.rotationY;
          obj.position.y = config.lift;

          this.mesh_ = obj;
          this.params_.scene.add(this.mesh_);

          obj.traverse(c => {
            let materials = c.material;
            if (!(c.material instanceof Array)) {
              materials = [c.material];
            }

            for (let m of materials) {
              if (m) {
                m.specular = new THREE.Color(0x000000);
                m.color.offsetHSL(0, 0, 0.25);
              }
            }
            c.castShadow = true;
            c.receiveShadow = true;
          });
        });
      });
    }

    InitInput_() {
      this.keys_ = {
          spacebar: false,
      };
      this.oldKeys = {...this.keys_};

      document.addEventListener('keydown', (e) => this.OnKeyDown_(e), false);
      document.addEventListener('keyup', (e) => this.OnKeyUp_(e), false);
    }

    OnKeyDown_(event) {
      switch(event.keyCode) {
        case 32:
          this.keys_.space = true;
          break;
      }
    }

    OnKeyUp_(event) {
      switch(event.keyCode) {
        case 32:
          this.keys_.space = false;
          break;
      }
    }

    CheckCollisions_() {
      if (this.invulnerableTime_ > 0.0) {
        return;
      }

      const colliders = this.params_.world.GetColliders();

      this.playerBox_.setFromObject(this.mesh_);

      for (let c of colliders) {
        const cur = c.collider;

        if (cur.intersectsBox(this.playerBox_)) {
          this.hit_ = true;
          this.invulnerableTime_ = 0.9;
          break;
        }
      }
    }

    Update(timeElapsed) {
      if (this.invulnerableTime_ > 0.0) {
        this.invulnerableTime_ = Math.max(0.0, this.invulnerableTime_ - timeElapsed);
      }

      if (this.keys_.space && this.position_.y == 0.0) {
        this.velocity_ = 30;
      }

      const acceleration = -75 * timeElapsed;

      this.position_.y += timeElapsed * (
          this.velocity_ + acceleration * 0.5);
      this.position_.y = Math.max(this.position_.y, 0.0);

      this.velocity_ += acceleration;
      this.velocity_ = Math.max(this.velocity_, -100);

      if (this.mesh_) {
        this.mesh_.position.copy(this.position_);
        this.CheckCollisions_();
      }
    }
  };

  return {
      Player: Player,
  };
})();