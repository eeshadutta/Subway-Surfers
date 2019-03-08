var player;
var police;
var track1 = new Array();
var track2 = new Array();
var track3 = new Array();
var wall = new Array();
var city = new Array();
var coins = new Array();
var trainT = new Array();
var trainF = new Array();
var trainL = new Array();
var trainR = new Array();

var player_texture, police_texture;
var track_texture;
var wall_texture;
var city_texture;
var coin_texture;
var trainF_texture, trainT_texture, trainL_texture, trainR_texture;

var cam_x = 0, cam_y = 5, cam_z = 13.0;
var d, startTime, policeCaughtUp;
var theme = 1;
var theme_flag = 1;

var jump_height = 3;
var train_speed = 0.2;

var score = 0;
var coins_collected = 0;

var cubeRotation = 0;

main();

function main() {

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  d = new Date();
  startTime = d.getTime() * 0.001;
  policeCaughtUp = startTime;

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

  const fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  track_texture = loadTexture(gl, '1_Track.jpg');
  wall_texture = loadTexture(gl, '1_Wall.jpg');
  city_texture = loadTexture(gl, '1_City.jpg');
  player_texture = loadTexture(gl, '1_Player.png');
  police_texture = loadTexture(gl, '1_Police.png');
  coin_texture = loadTexture(gl, '1_Coin.jpg');
  trainF_texture = loadTexture(gl, '1_TrainF.jpg');
  trainT_texture = loadTexture(gl, '1_TrainT.jpeg');
  trainL_texture = loadTexture(gl, '1_TrainL.jpeg');
  trainR_texture = loadTexture(gl, '1_TrainR.jpeg');

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  for (var i = 0; i < 1000; i += 1) {
    wall.push(new Wall(gl, [0, 0, -i * 5]));
    city.push(new City(gl, [0, 5, -i * 10]));
  }

  for (var i = 0; i < 1000; i += 1) {
    track1.push(new Track(gl, [-6, 0, -i * 5]));
    track2.push(new Track(gl, [0, 0, -i * 5]));
    track3.push(new Track(gl, [6, 0, -i * 5]));
  }

  player = new Player(gl, [-6, -4, -4]);
  police = new Police(gl, [-6, -4, 0]);

  for (var i = 0; i < 50; i++) {
    var j = Math.floor(Math.random() * 3);
    var x, y, z;
    if (j == 0)
      x = -6;
    else if (j == 1)
      x = 0;
    else
      x = 6;
    y = -4;
    if (i == 0)
      z = -30;
    else
      z = coins[coins.length - 1].pos[2] - (Math.random() * 30 - 15);
    var num_coins = Math.floor(Math.random() * 5 + 5);
    for (var k = 0; k < num_coins; k++) {
      coins.push(new Coin(gl, [x, y, z]));
      z -= 2.5;
    }
  }

  for (var i = 0; i < 40; i++) {
    var x, y, z;
    var j = Math.floor(Math.random() * 3);
    if (j == 0)
      x = -6;
    else if (j == 1)
      x = 0;
    else
      x = 6;
    y = -4;
    if (i == 0)
      z = -40;
    else
      z = trainF[i - 1].pos[2] - (Math.random() * 100);
    trainF.push(new Cube(gl, [x, y, z + 10], 6, 2, 0.1, trainF_texture));
    trainT.push(new Cube(gl, [x, y + 3, z], 0.1, 2, 20, trainT_texture));
    trainL.push(new Cube(gl, [x - 1, y, z], 6, 0.1, 20, trainL_texture));
    trainR.push(new Cube(gl, [x + 1, y, z], 6, 0.1, 20, trainR_texture));
  }

  var then = 0;

  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    player.pos[2] -= player.speedz;
    cam_z -= player.speedz;
    d = new Date();
    if (d.getTime() * 0.001 - policeCaughtUp >= 5)
      police.speedz = player.speedz / 2;
    else
      police.speedz = player.speedz;
    police.pos[2] -= police.speedz

    if (player.pos[0] > 6)
      player.pos[0] = 6;
    if (player.pos[0] < -6)
      player.pos[0] = -6;

    if (player.pos[1] > -4) {
      player.speedy += 0.01;
      player.pos[1] -= player.speedy;
      if (player.pos[1] < -4) {
        player.pos[1] = -4;
        player.speedy = 0.05;
      }
      police.pos[1] = player.pos[1];
    }
    police.pos[0] = player.pos[0];

    var num_trains = trainF.length;
    for (var i = 0; i < num_trains; i++) {
      trainF[i].pos[2] += train_speed;
      trainT[i].pos[2] += train_speed;
      trainL[i].pos[2] += train_speed;
      trainR[i].pos[2] += train_speed;
    }

    var num_coins = coins.length;
    for (var i = 0; i < num_coins; i++) {
      if (coins[i].exist == true) {
        if (coins[i].pos[0] == player.pos[0]) {
          if (coins[i].pos[1] >= player.pos[1] - 0.75 && coins[i].pos[1] <= player.pos[1] + 0.75) {
            if (coins[i].pos[2] >= player.pos[2] - 0.5 && coins[i].pos[2] <= player.pos[2] + 0.5) {
              coins[i].exist = false;
              coins_collected += 1;
            }
          }
        }
      }
    }

    for (var i = 0; i < num_trains; i++) {
      if (player.pos[0] == trainF[i].pos[0]) {
        if (player.pos[1] >= trainF[i].pos[1] - 4 && player.pos[1] <= trainF[i].pos[1] + 4) {
          if (player.pos[2] >= trainF[i].pos[2] - 20 && player.pos[2] <= trainF[i].pos[2] + 1) {
            console.log("Collision");
          }
        }
      }
    }

    // if (player.pos[2] <= -500) {
    //   window.alert("YOU WON\nScore: " + score + "\nCoins: " + coins_collected);
    // }

    drawScene(gl, programInfo, deltaTime);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function drawScene(gl, programInfo, deltaTime) {

  if (theme_flag == 1) {
    if (theme == 1) {
      track_texture = loadTexture(gl, '1_Track.jpg');
      wall_texture = loadTexture(gl, '1_Wall.jpg');
      city_texture = loadTexture(gl, '1_City.jpg');
      player_texture = loadTexture(gl, '1_Player.png');
      police_texture = loadTexture(gl, '1_Police.png');
      coin_texture = loadTexture(gl, '1_Coin.jpg');
      trainF_texture = loadTexture(gl, '1_TrainF.jpg');
      trainT_texture = loadTexture(gl, '1_TrainT.jpeg');
      trainL_texture = loadTexture(gl, '1_TrainL.jpeg');
      trainR_texture = loadTexture(gl, '1_TrainR.jpeg');
      gl.clearColor(144 / 256, 228 / 256, 252 / 256, 1.0);
    }
    if (theme == 2) {
      track_texture = loadTexture(gl, '2_Track.jpeg');
      wall_texture = loadTexture(gl, '2_Wall.jpeg');
      city_texture = loadTexture(gl, '2_City.jpg');
      player_texture = loadTexture(gl, '1_Player.png');
      police_texture = loadTexture(gl, '1_Police.png');
      coin_texture = loadTexture(gl, '2_Coin.jpeg');
      trainF_texture = loadTexture(gl, '1_TrainF.jpg');
      trainT_texture = loadTexture(gl, '1_TrainT.jpeg');
      trainL_texture = loadTexture(gl, '1_TrainL.jpg');
      trainR_texture = loadTexture(gl, '1_TrainR.jpg');
      gl.clearColor(0, 0, 0, 1.0);
    }
    theme_flag = 0;
  }

  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar);

  var cameraMatrix = mat4.create();
  mat4.translate(cameraMatrix, cameraMatrix, [cam_x, cam_y, cam_z]);
  var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];
  var up = [0, 1, 0];

  mat4.lookAt(cameraMatrix, cameraPosition, [0, 0, cam_z - 10], up);

  var viewMatrix = cameraMatrix;//mat4.create();

  //mat4.invert(viewMatrix, cameraMatrix);

  var viewProjectionMatrix = mat4.create();

  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

  for (var i = 0; i < 1000; i += 1) {
    track1[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
    track2[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
    track3[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
    if (theme == 1)
      city[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
    else if (theme == 2)
      wall[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  }
  player.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  police.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  var num_coins = coins.length;
  for (var i = 0; i < num_coins; i++) {
    if (coins[i].exist == true)
      coins[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  var num_trains = trainF.length;
  for (var i = 0; i < num_trains; i++) {
    trainF[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
    trainT[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
    trainL[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
    trainR[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  }
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
