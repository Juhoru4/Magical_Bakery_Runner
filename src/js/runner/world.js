import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import {math} from './math.js';

import {MTLLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/MTLLoader.js';
import {OBJLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/OBJLoader.js';


export const world = (() => {

  const START_POS = 100;
  const SEPARATION_DISTANCE = 20;


  class WorldObject {
    constructor(params) {
      this.position = new THREE.Vector3();
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;
      this.baseScale_ = 1.0;
      this.modelOffsetY_ = 0.0;
      this.colliderScale_ = 0.7;
      this.collider = new THREE.Box3();
      this.colliderCenter_ = new THREE.Vector3();
      this.colliderSize_ = new THREE.Vector3();

      this.params_ = params;
      this.LoadModel_();
    }

    LoadModel_() {
      const mtlLoader = new MTLLoader();
      mtlLoader.setPath('../src/models/obstacles/');
      mtlLoader.load('Cactus3.mtl', (materials) => {
        materials.preload();

        const loader = new OBJLoader();
        loader.setMaterials(materials);
        loader.setPath('../src/models/obstacles/');
        loader.load('Cactus3.obj', (obj) => {
          obj.scale.setScalar(1.0);

          obj.updateWorldMatrix(true, true);
          const boundingBox = new THREE.Box3().setFromObject(obj);
          this.modelOffsetY_ = -boundingBox.min.y;

          this.mesh = obj;
          this.params_.scene.add(this.mesh);

          obj.traverse(c => {
            if (c.geometry) {
              c.geometry.computeBoundingBox();
            }

            let materials = c.material;
            if (!(c.material instanceof Array)) {
              materials = [c.material];
            }

            for (let m of materials) {
              if (m) {
                m.specular = new THREE.Color(0x000000);
              }
            }
            c.castShadow = true;
            c.receiveShadow = true;
          });
        });
      });
    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
      this.collider.getCenter(this.colliderCenter_);
      this.collider.getSize(this.colliderSize_);
      this.colliderSize_.multiplyScalar(this.colliderScale_);
      this.collider.setFromCenterAndSize(this.colliderCenter_, this.colliderSize_);
    }

    Update(timeElapsed) {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.position.y += this.modelOffsetY_;
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale * this.baseScale_);
      this.UpdateCollider_();
    }
  }

  class WorldManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 12;
      this.params_ = params;
      this.score_ = 0.0;
      this.scoreText_ = '00000';
      this.separationDistance_ = SEPARATION_DISTANCE;
    }

    GetColliders() {
      return this.objects_;
    }

    GetScoreText() {
      return Math.round(this.score_).toLocaleString(
          'en-US', {minimumIntegerDigits: 5, useGrouping: false});
    }

    LastObjectPosition_() {
      if (this.objects_.length == 0) {
        return SEPARATION_DISTANCE;
      }

      return this.objects_[this.objects_.length - 1].position.x;
    }

    SpawnObj_(scale, offset) {
      let obj = null;

      if (this.unused_.length > 0) {
        obj = this.unused_.pop();
        obj.mesh.visible = true;
      } else {
        obj = new WorldObject(this.params_);
      }

      obj.quaternion.setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2.0);
      obj.position.x = START_POS + offset;
      obj.position.z = 2;
      obj.scale = scale;
      this.objects_.push(obj);
    }

    SpawnCluster_() {
      const scaleIndex = math.rand_int(0, 1);
      const scales = [1, 0.5];
      const ranges = [2, 3];
      const scale = scales[scaleIndex];
      const numObjects = math.rand_int(1, ranges[scaleIndex]);

      for (let i = 0; i < numObjects; ++i) {
        const offset = i * 1 * scale;
        this.SpawnObj_(scale, offset);
      }
    }

    MaybeSpawn_() {
      const closest = this.LastObjectPosition_();
      if (Math.abs(START_POS - closest) > this.separationDistance_) {
        this.SpawnCluster_();
        this.separationDistance_ = math.rand_range(SEPARATION_DISTANCE, SEPARATION_DISTANCE * 1.5);
      }
    }

    Update(timeElapsed) {
      this.MaybeSpawn_();
      this.UpdateColliders_(timeElapsed);
      this.UpdateScore_(timeElapsed);
    }

    UpdateScore_(timeElapsed) {
      this.score_ += timeElapsed * 10.0;

      const scoreText = this.GetScoreText();

      if (scoreText == this.scoreText_) {
        return;
      }

      document.getElementById('score-text').innerText = scoreText;
    }

    UpdateColliders_(timeElapsed) {
      const invisible = [];
      const visible = [];

      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed * this.speed_;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }

        obj.Update(timeElapsed);
      }

      this.objects_ = visible;
      this.unused_.push(...invisible);
    }
  };

  return {
      WorldManager: WorldManager,
  };
})();