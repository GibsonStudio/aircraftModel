
var mouse = {};
mouse.x = 0;
mouse.y = 0;

var animateAircraft = false;
var animateSpeed = 0.1;

var joystick = {};
joystick.x = 0;
joystick.y = 0;
joystick.active = false;
joystick.offsetX = 0;
joystick.offsetY = 0;
joystick.width = 40;
joystick.deadzone = 0.03;

var rudderSlider = {};
rudderSlider.x = 0;
rudderSlider.active = false;
rudderSlider.offsetX = 0;
rudderSlider.width = 40;
rudderSlider.deadzone = 0.03;

var flapSlider = {};
flapSlider.x = 0;
flapSlider.active = false;
flapSlider.offsetX = 0;
flapSlider.width = 40;

var canopySlider = {};
canopySlider.x = 0;
canopySlider.active = false;
canopySlider.offsetX = 0;
canopySlider.width = 40;
canopySlider.canopyOrigin = 0;
canopySlider.factor = 0.7; // controls how far it moves

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var scene, camera, renderer, controls;


// models
var aircraft, propeller, aileronL, aileronR, elevator, rudder, flapL, flapR, canopy;

var envmap, matFuselageMain, matFuselage2;


function init ()
{


  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, WIDTH/HEIGHT, 0.1, 100);
  controls = new THREE.OrbitControls(camera);
  camera.position.set(0, 3, 10);

  camera.lookAt(new THREE.Vector3(0,0,0));
  //camera.rotation.z = Math.PI / 2;
  //camera.up.set(0,0,1);

  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0xF0B323);

  controls.update();

  document.getElementById('threejs-container').appendChild(renderer.domElement);


  // add event listeners
  window.addEventListener('resize', resizeCanvas);
  document.getElementById('joystick').addEventListener('mousedown', function (e) { startJoystick(e); } );
  document.getElementById('rudderSlider').addEventListener('mousedown', function (e) { startRudderSlider(e); } );
  document.getElementById('flapSlider').addEventListener('mousedown', function (e) { startFlapSlider(e); } );
  document.getElementById('canopySlider').addEventListener('mousedown', function (e) { startCanopySlider(e); } );
  document.addEventListener('mouseup', function (e) { stopControl(e); } );
  document.addEventListener('mousemove', function (e) { mouseMove(e); } );

  resizeCanvas();
  load3D();

}



function load3D ()
{

  //var loader = new THREE.GLTFLoader();
  var loader = new THREE.ColladaLoader();

  loader.load("aircraft.dae", function (obj) {

    dae = obj.scene;
    scene.add(dae);

    var light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    var l = new THREE.PointLight(0xFFFFFF, 0.1, 20);
    l.position.set(0, 2, 1);
    scene.add(l);

    // define objects
    aircraft    = obj.scene.getObjectByName("aircraft");
    aircraft.rotation.x = -Math.PI / 2;
    propeller   = obj.scene.getObjectByName("propeller");
    aileronL    = obj.scene.getObjectByName('aileron_L');
    aileronR    = obj.scene.getObjectByName('aileron_R');
    elevator    = obj.scene.getObjectByName('elevator');
    rudder      = obj.scene.getObjectByName('rudder');
    flapL       = obj.scene.getObjectByName('flap_L');
    flapR       = obj.scene.getObjectByName('flap_R');
    canopy      = obj.scene.getObjectByName('canopy_sliding');

    canopySlider.canopyOrigin = canopy.position.y;
    aileronL.rotateOrigin = new THREE.Vector3(aileronL.rotation.x, aileronL.rotation.y, aileronL.rotation.z);
    aileronR.rotateOrigin = new THREE.Vector3(aileronR.rotation.x, aileronR.rotation.y, aileronR.rotation.z);
    flapL.rotateOrigin = new THREE.Vector3(flapL.rotation.x, flapL.rotation.y, flapL.rotation.z);
    flapR.rotateOrigin = new THREE.Vector3(flapR.rotation.x, flapR.rotation.y, flapR.rotation.z);

    envmap = new THREE.CubeTextureLoader().load([
      'img/posx.jpg', 'img/negx.jpg',
      'img/posy.jpg', 'img/negy.jpg',
      'img/posz.jpg', 'img/negz.jpg'
    ], function () {});

    matFuselageMain = new THREE.MeshStandardMaterial({ color:0x005eb8, envMap: envmap, envMapIntensity: 0.8, metalness:0.1, roughness:0 });
    matFuselage2 = new THREE.MeshStandardMaterial({ color:0x005eb8, envMap: envmap, envMapIntensity: 0.9, metalness:0.5, roughness:0 });
    matShineyMetal = new THREE.MeshStandardMaterial({ color:0xffffff, envMap: envmap, envMapIntensity: 1, metalness:1, roughness:0 });
    matBlackMetal = new THREE.MeshStandardMaterial({ color:0x666666, envMap: envmap, envMapIntensity: 0.8, metalness:0.5, roughness:0 });
    matWindows = new THREE.MeshStandardMaterial({ color:0xccccdf, envMap: envmap, envMapIntensity: 0.8, metalness:0.5, roughness:0, side:THREE.DoubleSide });
    matRed = new THREE.MeshStandardMaterial({ color:0xf9423a, metalness:0.5, roughness:0 });
    matGreen = new THREE.MeshStandardMaterial({ color:0x00C389, metalness:0.5, roughness:0 });
    matYellow = new THREE.MeshStandardMaterial({ color:0xffef0f, metalness:0.5, roughness:0 });
    matPurple = new THREE.MeshStandardMaterial({ color:0x772583, metalness:0.5, roughness:0 });

    aircraft.children[0].material[0] = matFuselageMain;
    aircraft.children[0].material[1] = matFuselage2;
    aircraft.children[0].material[3] = matShineyMetal;
    aircraft.children[0].material[4] = matWindows;

    canopy.children[0].material[0] = matBlackMetal;
    canopy.children[0].material[1] = matWindows;

    propeller.children[0].material[0] = matBlackMetal;
    propeller.children[0].material[1] = matShineyMetal;

    aileronL.children[0].material = matRed;
    aileronR.children[0].material = matRed;

    flapL.children[0].material = matGreen;
    flapR.children[0].material = matGreen;

    elevator.children[0].material = matYellow;
    rudder.children[0].material = matPurple;

    animate();

  });

}


function resetSim ()
{
  aircraft.rotation.set(-Math.PI / 2, 0, 0);
  joystick.x = 0;
  joystick.y = 0;
  $('#joystick').css({ 'left':'80px', 'top':'80px'});
  rudderSlider.x = 0;
  $('#rudderSlider').css({ 'left':'80px' });
  flapSlider.x = 0;
  $('#flapSlider').css({ 'left':'0px' });
  canopySlider.x = 0;
  $('#canopySlider').css({ 'left':'0px' });
}


function toggleAnimation ()
{
  if (animateAircraft) {
    $('#buToggleAnimation').html('Animation OFF');
    animateAircraft = false;
  } else {
    $('#buToggleAnimation').html('Animation ON');
    animateAircraft = true;
  }
}

function mouseMove (e) {
   mouse.x = e.pageX; // - $('#my-container').offset().left;
   mouse.y = e.pageY;
 }


function startJoystick (e)
{
  joystick.elOffsetX = e.pageX - $('#joystick').offset().left;
  joystick.elOffsetY = e.pageY - $('#joystick').offset().top;
  controls.enabled = false;
  joystick.active = true;
}


function startRudderSlider (e)
{
  rudderSlider.elOffsetX = e.pageX - $('#rudderSlider').offset().left;
  controls.enabled = false;
  rudderSlider.active = true;
}


function startFlapSlider (e)
{
  flapSlider.elOffsetX = e.pageX - $('#flapSlider').offset().left;
  controls.enabled = false;
  flapSlider.active = true;
}


function startCanopySlider (e)
{
  canopySlider.elOffsetX = e.pageX - $('#canopySlider').offset().left;
  controls.enabled = false;
  canopySlider.active = true;
}


function stopControl ()
{
  joystick.active = false;
  rudderSlider.active = false;
  flapSlider.active = false;
  canopySlider.active = false;
  controls.enabled = true;
}



function resizeCanvas () {

  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  var threejsWidth = WIDTH - 250; // 250 is width of controls
  $('#my-container').width(WIDTH);
  $('#my-container').height(HEIGHT);
  $('#threejs-container').width(threejsWidth);
  $('#threejs-container').height(HEIGHT);
  renderer.setSize(threejsWidth, HEIGHT);
  camera.aspect = threejsWidth / HEIGHT;
  camera.updateProjectionMatrix();

}






function rotateLocal (obj, axis, ang)
{

  var rOrigin = obj.rotateOrigin || new THREE.Vector3(0,0,0);

  obj.rotation.x = rOrigin.x;
  obj.rotation.y = rOrigin.y;
  obj.rotation.z = rOrigin.z;

  var rads = ang; //(ang / 360) * Math.PI * 2;

  if (axis == 'y') {
    obj.rotateY(rads);
  } else if (axis == 'z') {
    obj.rotateZ(rads);
  } else {
    obj.rotateX(rads);
  }

}



function animate ()
{

  requestAnimationFrame(animate);

  propeller.rotation.y -= 0.2;

  if (joystick.active) {
    var jx = mouse.x - $('#joystick-container').offset().left - joystick.elOffsetX;
    var jy = mouse.y - $('#joystick-container').offset().top - joystick.elOffsetY;
    jx = Math.max(0, Math.min(jx, 160));
    jy = Math.max(0, Math.min(jy, 160));
    $('#joystick').css({ 'left':jx +'px', 'top':jy +'px'});
    // calculate joystick value
    joystick.x = (jx - 80) / 80;
    joystick.y = (jy - 80) / 80;
    if (Math.abs(joystick.x) < joystick.deadzone) { joystick.x = 0; }
    if (Math.abs(joystick.y) < joystick.deadzone) { joystick.y = 0; }
  }

  if (rudderSlider.active) {
    var rx = mouse.x - $('#rudderSlider-container').offset().left - rudderSlider.elOffsetX;
    rx = Math.max(0, Math.min(rx, 160));
    $('#rudderSlider').css({ 'left':rx +'px' });
    rudderSlider.x = (rx - 80) / 80;
    if (Math.abs(rudderSlider.x) < rudderSlider.deadzone) { rudderSlider.x = 0; }
  }

  if (flapSlider.active) {
    var fx = mouse.x - $('#flapSlider-container').offset().left - flapSlider.elOffsetX;
    fx = Math.max(0, Math.min(fx, 160));
    $('#flapSlider').css({ 'left':fx +'px' });
    flapSlider.x = fx / 160;
  }

  if (canopySlider.active) {
    var cx = mouse.x - $('#canopySlider-container').offset().left - canopySlider.elOffsetX;
    cx = Math.max(0, Math.min(cx, 160));
    $('#canopySlider').css({ 'left':cx +'px' });
    canopySlider.x = cx / 160;
  }

  // ailerons
  rotateLocal(aileronL, 'x', joystick.x);
  rotateLocal(aileronR, 'x', -joystick.x);

  // elevator
  elevator.rotation.x = joystick.y;

  // rudder
  rudder.rotation.z = rudderSlider.x;

  // flaps
  rotateLocal(flapL, 'x', flapSlider.x);
  rotateLocal(flapR, 'x', flapSlider.x);

  // canopy
  canopy.position.y = canopySlider.canopyOrigin + (canopySlider.x * canopySlider.factor);

  // animate aircraft?
  if (animateAircraft) {
    aircraft.rotateY(-Math.pow(joystick.x, 3) * animateSpeed);
    aircraft.rotateX(-Math.pow(joystick.y, 3) * animateSpeed);
    aircraft.rotateZ(-Math.pow(rudderSlider.x, 3) * animateSpeed);
  }

  renderer.render(scene, camera);

}
