import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import {player} from './player.js';
import {world} from './world.js';

import {MTLLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/MTLLoader.js';
import {OBJLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/OBJLoader.js';



const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


  const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;


const _PCSS = `
#define LIGHT_WORLD_SIZE 0.05
#define LIGHT_FRUSTUM_WIDTH 3.75
#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
#define NEAR_PLANE 1.0

#define NUM_SAMPLES 17
#define NUM_RINGS 11
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES

vec2 poissonDisk[NUM_SAMPLES];

void initPoissonSamples( const in vec2 randomSeed ) {
  float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
  float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

  // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
  float angle = rand( randomSeed ) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
  return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
  // This uses similar triangles to compute what
  // area of the shadow map we should search
  float searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;
  float blockerDepthSum = 0.0;
  int numBlockers = 0;

  for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {
    float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
    if ( shadowMapDepth < zReceiver ) {
      blockerDepthSum += shadowMapDepth;
      numBlockers ++;
    }
  }

  if( numBlockers == 0 ) return -1.0;

  return blockerDepthSum / float( numBlockers );
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
  float sum = 0.0;
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  return sum / ( 2.0 * float( PCF_NUM_SAMPLES ) );
}

float PCSS ( sampler2D shadowMap, vec4 coords ) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z; // Assumed to be eye-space z in this code

  initPoissonSamples( uv );
  // STEP 1: blocker search
  float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );

  //There are no occluders so early out (this saves filtering)
  if( avgBlockerDepth == -1.0 ) return 1.0;

  // STEP 2: penumbra size
  float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
  float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;

  // STEP 3: filtering
  //return avgBlockerDepth;
  return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
}
`;

const _PCSSGetShadow = `
return PCSS( shadowMap, shadowCoord );
`;


class BasicWorldDemo {
  constructor() {
    this.paused_ = false;
    this.gameOverTriggered_ = false;
    this.lives_ = 3;

    this._Initialize();

    window.addEventListener('pause-state', (event) => {
      this.paused_ = Boolean(event.detail && event.detail.paused);

      if (!this.paused_) {
        requestAnimationFrame(() => this._FocusGame_());
      }
    });

  }

  _FocusGame_() {
    if (document.body) {
      document.body.focus();
    }
  }

  _Initialize() {
    // overwrite shadowmap code
    let shadowCode = THREE.ShaderChunk.shadowmap_pars_fragment;

    shadowCode = shadowCode.replace(
        '#ifdef USE_SHADOWMAP',
        '#ifdef USE_SHADOWMAP' +
        _PCSS
    );

    shadowCode = shadowCode.replace(
        '#if defined( SHADOWMAP_TYPE_PCF )',
        _PCSSGetShadow +
        '#if defined( SHADOWMAP_TYPE_PCF )'
    );

    THREE.ShaderChunk.shadowmap_pars_fragment = shadowCode;
    // renderer

    this.threejs_ = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    this.threejs_.gammaFactor = 2.2;
    // this.threejs_.toneMapping = THREE.ReinhardToneMapping;
    this.threejs_.shadowMap.enabled = true;
    // this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('container').appendChild(this.threejs_.domElement);
    document.body.tabIndex = -1;

    window.addEventListener('resize', () => {
      this.OnWindowResize_();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 20000.0;
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(0, 2, 10);
    this.camera_.lookAt(0, 3, 0);

    this.scene_ = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    light.position.set(50, 40, 80);
    light.target.position.set(40, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.far = 200.0;
    light.shadow.camera.near = 1.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this.scene_.add(light);

    light = new THREE.HemisphereLight(0xF7EFDA, 0x27100B, 1.2);
    this.scene_.add(light);

    this.scene_.background = new THREE.Color(0x808080);
    this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

    // Load world model
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('../src/models/world/');
    mtlLoader.load('SceneBakery.mtl', (materials) => {
      materials.preload();

      const loader = new OBJLoader();
      loader.setMaterials(materials);
      loader.setPath('../src/models/world/');
      loader.load('SceneBakery.obj', (obj) => {
        obj.scale.setScalar(315);
        obj.position.y = 5.35;
        obj.position.z = 0.7;
        obj.position.x = -0.5;
        
        obj.traverse(c => {
          if (c.geometry) {
            c.geometry.computeBoundingBox();
          }

          let materialsList = c.material;
          if (!(c.material instanceof Array)) {
            materialsList = [c.material];
          }

          for (let m of materialsList) {
            if (m) {
              m.specular = new THREE.Color(0x000000);
              if (m.roughness !== undefined) {
                m.roughness = 0.7;
              }
              if (m.metalness !== undefined) {
                m.metalness = 0.1;
              }
            }
          }
          c.castShadow = true;
          c.receiveShadow = true;
        });

        this.scene_.add(obj);
        
        // Debug info
        const bbox = new THREE.Box3().setFromObject(obj);
        console.log('SceneBakery loaded - Bounding box:', bbox);
      });
    });

    const uniforms = {
      topColor: { value: new THREE.Color(0x0077FF) },
      bottomColor: { value: new THREE.Color(0x89b2eb) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };
    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _FS,
        side: THREE.BackSide,
    });
    this.scene_.add(new THREE.Mesh(skyGeo, skyMat));

    this.world_ = new world.WorldManager({scene: this.scene_});
    this.player_ = new player.Player({scene: this.scene_, world: this.world_});

    this.gameOver_ = false;
    this.previousRAF_ = null;
    this.RAF_();
    this.OnWindowResize_();
    this._FocusGame_();
    this._UpdateLivesUI_();
  }

  _UpdateLivesUI_() {
    const livesElement = document.getElementById('lives-text');
    if (livesElement) {
      const lives = Number.isFinite(this.lives_) ? this.lives_ : 0;
      livesElement.innerText = lives.toString();
    }
  }



  _TriggerGameOver_() {
    if (this.gameOverTriggered_) {
      return;
    }

    this.gameOverTriggered_ = true;
    window.dispatchEvent(new CustomEvent('game-over-state', {
      detail: {
        gameOver: true,
        scoreText: this.world_.GetScoreText(),
      }
    }));
  }

  OnWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  RAF_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.RAF_();

      this.Step_((t - this.previousRAF_) / 1000.0);
      this.threejs_.render(this.scene_, this.camera_);
      this.previousRAF_ = t;
    });
  }

  Step_(timeElapsed) {
    if (this.gameOverTriggered_ || this.paused_) {
      return;
    }

    this.player_.Update(timeElapsed);
    this.world_.Update(timeElapsed);

    if (this.player_.hit_) {
      this.player_.hit_ = false;
      const currentLives = Number.isFinite(this.lives_) ? this.lives_ : 3;
      this.lives_ = Math.max(0, currentLives - 1); //Vidass aqui+++
      this._UpdateLivesUI_();

      if (this.lives_ === 0) {
        this._TriggerGameOver_();
      }
    }
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});
