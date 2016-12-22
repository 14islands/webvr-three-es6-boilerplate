import * as THREE from 'three'
import query from './utils/query'
import Snowfall from './snowfall'

// load shimmed plugins - access on THREE namespace
import _OBJLoader from 'OBJLoader'
import _VRControls from 'VRControls'
import _VREffect from 'VREffect'
import _ViveController from 'ViveController'

// Import WebVRManager npm module
import WebVRManager from 'webvr-boilerplate'

const clock = new THREE.Clock()

let scene, camera, HEIGHT, WIDTH, renderer, container
let vrControls, vrEffect, vrManager, vrDisplay
let viveController1, viveController2
let snowfall

function createScene () {
  HEIGHT = window.innerHeight
  WIDTH = window.innerWidth

  // Create the scene
  scene = new THREE.Scene()

  // Add a fog vrEffect to the scene using similar color as background
  scene.fog = new THREE.Fog(0xc6ccff, 4, 11)

  // Create the camera
  const aspectRatio = WIDTH / HEIGHT
  const fieldOfView = 60
  const nearPlane = 0.1
  const farPlane = 50
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  )

  // Create the renderer
  renderer = new THREE.WebGLRenderer({
    // Allow transparency to show the gradient background
    // we defined in the CSS
    alpha: true,
    // Activate the anti-aliasing this is less performant,
    // but, as our project is low-poly based, it should be fine :)
    antialias: true
  })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0xc6ccff, 1)

  // Define the size of the renderer in this case,
  // it will fill the entire screen
  renderer.setSize(WIDTH, HEIGHT)

  // Enable shadow rendering
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Add the DOM element of the renderer to the
  // container we created in the HTML
  container = document.getElementById('world')
  container.appendChild(renderer.domElement)
}

function handleWindowResize () {
  // update height and width of the renderer and the camera
  HEIGHT = window.innerHeight
  WIDTH = window.innerWidth
  vrEffect.setSize(WIDTH, HEIGHT)
  renderer.setSize(WIDTH, HEIGHT)
  camera.aspect = WIDTH / HEIGHT
  camera.updateProjectionMatrix()
}

function createLights () {
  // A directional light shines from a specific direction.
  // It acts like the sun, that means that all the rays produced are parallel.
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.8)

  // Set the direction of the light
  shadowLight.position.set(1, 2, -1)
  shadowLight.position.normalize()

  // Allow shadow casting
  shadowLight.castShadow = true

  // define the visible area of the projected shadow
  shadowLight.shadow.camera.left = -10
  shadowLight.shadow.camera.right = 10
  shadowLight.shadow.camera.top = 10
  shadowLight.shadow.camera.bottom = -10
  shadowLight.shadow.camera.near = -10
  shadowLight.shadow.camera.far = 10

  // debug light
  if (query.debug) {
    scene.add(new THREE.CameraHelper(shadowLight.shadow.camera))
  }

  // define the resolution of the shadow the higher the better,
  // but also the more expensive and less performant
  shadowLight.shadow.mapSize.width = 1024 * 2
  shadowLight.shadow.mapSize.height = 1024 * 2

  // an ambient light modifies the global color of a scene and makes the shadows softer
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)

  scene.add(shadowLight)
  scene.add(ambientLight)
}

function createSnowFall () {
  snowfall = new Snowfall(200000)
  snowfall.system.position.set(0, 0, 0)
  scene.add(snowfall.system)
}

function loop () {
  var delta = clock.getDelta()
  var elapsed = clock.getElapsedTime()

  if (viveController1) {
    viveController1.update()
  }
  if (viveController2) {
    viveController2.update()
  }

  if (snowfall) {
    snowfall.update(delta, elapsed)
  }

  // Render the scene through the vrManager.
  vrControls.update(delta)
  vrManager.render(scene, camera, delta)

  // call the loop function again
  vrDisplay.requestAnimationFrame(loop)
}

function loadViveControllerModels () {
  var loader = new THREE.OBJLoader()
  loader.setPath('assets/models/vive-controller/')
  loader.load('vr_controller_vive_1_5.obj', function (object) {
    console.log('loaded controller OBJ')
    var loader = new THREE.TextureLoader()
    loader.setPath('assets/models/vive-controller/')

    var controller = object.children[0]
    controller.material.map = loader.load('onepointfive_texture.png')
    controller.material.specularMap = loader.load('onepointfive_spec.png')

    viveController1.add(object.clone())
    viveController2.add(object.clone())
  })
}

function showControllerGuideRays () {
  // show ray for debug
  var geometry = new THREE.Geometry()
  geometry.vertices.push(new THREE.Vector3(0, 0, 0))
  geometry.vertices.push(new THREE.Vector3(0, 0, -1))

  var line = new THREE.Line(geometry)
  line.name = 'line'
  line.scale.z = 5

  viveController1.add(line.clone())
  viveController2.add(line.clone())
}

// VIVE CONTROLLER
function initViveControllers () {
  if (!navigator.getGamepads) {
    console.warn('GAMEPAD API not enabled?')
    return
  }

  viveController1 = new THREE.ViveController(0)
  viveController1.standingMatrix = vrControls.getStandingMatrix()
  // viveController1.addEventListener('triggerdown', onTriggerDown)
  // viveController1.addEventListener('triggerup', onTriggerUp)
  scene.add(viveController1)

  viveController2 = new THREE.ViveController(1)
  viveController2.standingMatrix = vrControls.getStandingMatrix()
  // viveController2.addEventListener('triggerdown', onTriggerDown)
  // viveController2.addEventListener('triggerup', onTriggerUp)
  scene.add(viveController2)

  loadViveControllerModels()

  if (query.debug) {
    showControllerGuideRays()
  }
}

function init () {
  // set up the scene, the camera and the renderer
  createScene()

  // add the lights
  createLights()

  // add the objects
  createSnowFall()

  // // Apply VR headset positional data to camera.
  vrControls = new THREE.VRControls(camera)
  vrControls.standing = true

  // Apply VR stereo rendering to renderer.
  vrEffect = new THREE.VREffect(renderer)
  vrEffect.setSize(window.innerWidth, window.innerHeight)

  // Create a VR vrManager helper to enter and exit VR mode.
  var params = {
    hideButton: false, // Default: false.
    isUndistorted: false // Default: false.
  }
  vrManager = new WebVRManager(renderer, vrEffect, params)

  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  setupStage()

  initViveControllers()

  // Listen to the screen: if the user resizes it
  // we have to update the camera and the renderer size
  window.addEventListener('resize', handleWindowResize, false)
  window.addEventListener('vrdisplaypresentchange', handleWindowResize, true)
}

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage () {
  navigator.getVRDisplays().then((displays) => {
    if (displays.length > 0) {
      vrDisplay = displays[0]
      if (vrDisplay.stageParameters) {
        setStageDimensions(vrDisplay.stageParameters)
      }
      // start a loop that will update the objects' positions
      // and render the scene on each frame
      vrDisplay.requestAnimationFrame(loop)
    }
  })
}

function setStageDimensions (stage) {
  // Size the skybox according to the size of the actual stage.
  // var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
}

window.addEventListener('load', init, false)
