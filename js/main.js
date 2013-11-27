/* globals requirejs, define*/
requirejs.config({
  shim: {
    box2d: {
      exports: 'Box2D'
    }
  },
  paths: {
    box2d: 'Box2dWeb/Box2dWeb-2.1.a.3.min'
  }
});

define(function( require ) {
  'use strict';

  var Game    = require( 'game' ),
      Level   = require( 'level' ),
      Circle  = require( 'geometry/circle' ),
      Rect    = require( 'geometry/rect' ),
      Polygon = require( 'geometry/polygon' ),
      Segment = require( 'geometry/segment' ),
      Player  = require( 'entities/player' );

  var Color = require( 'color' );
  var Entity = require( 'entities/entity' );
  var PhysicsEntity = require( 'entities/physics-entity' );

  var Emitter = require( 'entities/emitter' );
  var TractorBeam = require( 'entities/tractor-beam' );
  var Trail = require( 'effects/trail' );
  var Laser = require( 'entities/laser' );

  var Material = require( 'config/material' );

  var Settings = require( 'config/settings' );
  if ( !Settings.background ) {
    console.log( 'not high settings' );
  }
  Settings.low();
  if ( Settings.background ) {
    console.log( 'not low settings' );
  }
  Settings.high();

  // Mixin normals drawing for debugging.
  (function() {
    var normalOptions = {
      length: 1,
      lineWidth: 0.2
    };

    function drawNormalsMixin( prototype ) {
      var drawPathFn = prototype.drawPath;
      prototype.drawPath = function( ctx ) {
        this.drawNormals( ctx, normalOptions );
        drawPathFn.call( this, ctx );
      };
    }

    drawNormalsMixin( Segment.prototype );
    drawNormalsMixin( Polygon.prototype );
    drawNormalsMixin( Laser.prototype );
  }) ();

  var game = Game.instance = new Game();
  game.level = new Level();
  game.level.fill.set({
    red: 32,
    green: 32,
    blue: 48,
    alpha: 1.0
  });

  // Circle.
  var circleEntity = new Entity();

  var circle = new Circle( 10, 20, 5 );
  circle.fill.alpha = 0.5;

  circleEntity.add( circle );
  game.add( circleEntity );

  // Rect.
  var rectEntity = new Entity( 30, 5 );

  var rect = new Rect( 0, 0, 5, 10 );
  rect.fill.alpha = 0.5;

  rectEntity.add( rect );
  game.add( rectEntity );

  var rectInterval = setInterval(function() {
    rectEntity.x -= 0.4;
    rectEntity.angle += 10 * Math.PI / 180;
    polyEntity.angle += 2 * Math.PI / 180;
    segmentEntity.angle -= 2 * Math.PI / 180;
  }, 16 );

  setTimeout(function() {
    clearInterval( rectInterval );
  }, 600 );

  // Polygon.
  var polyEntity = new Entity( 50, 35 );

  var polygon = new Polygon( 5, 0 );
  polygon.vertices = [ 5, 3, -5, 3, 0, -5 ];
  polygon.fill.alpha = 0.5;

  polyEntity.add( polygon );
  game.add( polyEntity );

  // Segment.
  var segmentEntity = new Entity();
  segmentEntity.x = 20;
  segmentEntity.y = 35;

  var testSegment = new Segment(10, 5, 0, 0 );
  testSegment.stroke.alpha = 1;
  testSegment.lineWidth = 0.2;

  segmentEntity.add( testSegment );
  game.add( segmentEntity );

  // Tractor beam.
  var tractorBeam = new TractorBeam( 20, 30, 5 );
  tractorBeam.distance = 20;
  tractorBeam.force = 1500;
  game.add( tractorBeam );

  // Factory test.
  var GeometryFactory = require( 'geometry/geometry-factory' );
  var polygonClone =  GeometryFactory.create( JSON.stringify( polygon ) );
  if ( JSON.stringify( polygon ) !== JSON.stringify( polygonClone ) ) {
    console.log( 'GeometryFactory clone failed.' );
  }

  // Emitter.
  var emitter = new Emitter( 25, 20 );
  var emitterPolygon = new Polygon( 0, 0 );
  emitterPolygon.vertices = [ 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5 ];
  emitterPolygon.stroke.set({
    red: 255,
    alpha: 1
  });
  emitterPolygon.lineWidth = 0.2;

  emitter.spawnArea = new Segment( 0, -2, 0, 2 );
  emitter.spawnArea.stroke.set({
    red: 255,
    alpha: 1
  });
  emitter.spawnArea.lineWidth = 0.2;
  emitter.add( emitter.spawnArea );

  emitter.rate = 0.4;
  emitter.lifeTime = 2000;
  emitter.speed = 100;
  emitter.angle = -0.5 * Math.PI;

  emitter.particle = emitterPolygon;
  emitter.properties = {
    radius: 0.5,
    fixture: {
      density: 4.0,
      friction: 0.5,
      restitution: 0.2,
      filter: {
        categoryBits: Material.ANTIMATTER
      }
    },
    body: {
      angularVelocity: 3 * Math.PI,
      linearDamping: 0.2,
      type: 'dynamic'
    }
  };

  emitter.start( 500 );
  game.add( emitter );

  // Matter emitter.
  var matEmitter = new Emitter( 45, 20 );
  matEmitter.spawnArea = new Segment( 0, -2, 0, 2 );
  matEmitter.spawnArea.stroke.set({
    red: 64,
    green: 64,
    blue: 255,
    alpha: 1
  });
  matEmitter.spawnArea.lineWidth = 0.2;
  matEmitter.add( matEmitter.spawnArea );

  matEmitter.rate = 0.4;
  matEmitter.lifeTime = 2000;
  matEmitter.speed = 100;
  matEmitter.angle = -0.5 * Math.PI;

  var matEmitterPolygon = new Polygon( 0, 0 );
  matEmitterPolygon.vertices = emitterPolygon.vertices.slice();
  matEmitterPolygon.stroke.set({
    red: 64,
    green: 64,
    blue: 255,
    alpha: 1
  });
  matEmitterPolygon.lineWidth = emitterPolygon.lineWidth;

  matEmitter.particle = matEmitterPolygon;
  matEmitter.properties = {
    radius: 0.5,
    fixture: {
      density: 4.0,
      friction: 0.5,
      restitution: 0.2,
      filter: {
        categoryBits: Material.MATTER
      }
    },
    body: {
      angularVelocity: 3 * Math.PI,
      linearDamping: 0.2,
      type: 'dynamic'
    }
  };

  matEmitter.start( 500 );
  game.add( matEmitter );

  // Laser.
  var laser = new Laser( 0, 20 );
  var laserCircle = new Circle( 0, 0, 1 );
  laserCircle.fill.set({
    red: 255,
    alpha: 1
  });
  laser.angle = -25 * Math.PI / 180;
  laser.add( laserCircle );
  laser.material = Material.ANTIMATTER;
  game.add( laser );

  // Player.
  game.setPlayer( new Player( 20, 20 ) );

  game.camera.target = game.player;

  // Trail.
  var trail = new Trail();
  trail.fill = new Color( 255, 255, 255, 0.2 );
  game.add( trail );
  trail.target = game.player;

  // Debug objects.
  [
    [
      [  3,  0,  3, 10 ],
      [  3, 10, 30, 15 ],
      [ 30, 15, 50,  5 ],
      [ 50,  5, 60,  5 ]
    ],
    [
      // Rectangle.
      [ 10, 0, 10, -5 ],
      [ 10, -5, 20, -5 ],
      [ 20, -5, 20, 0 ],
      [ 20, 0, 10, 0 ]
    ]
  ].forEach(function( object ) {
    object.forEach(function( edgeData ) {
      var entity = new PhysicsEntity({
        shape: 'polygon',
        type: 'edge',
        data: edgeData,
        fixture: {
          density: 1.0,
          friction: 0.5,
          restitution: 0.2,
          filter: {
            categoryBits: Material.BIMATTER
          }
        }
      });

      var segment = new Segment( edgeData[0], edgeData[1], edgeData[2], edgeData[3] );
      segment.stroke.set({
        red: 255,
        alpha: 1
      });
      segment.lineWidth = 0.2;

      entity.add( segment );
      game.add( entity );
    });
  });

  // Debug polygons.
  [
    [ 5, -5, 5, 5, -5, 0 ]
  ].forEach(function( polyData ) {
    var entity = new PhysicsEntity({
      shape: 'polygon',
      type: 'vector',
      data: polyData,
      fixture: {
        density: 1.0,
        friction: 0.5,
        restitution: 0.2,
        filter: {
          categoryBits: Material.BIMATTER
        }
      },
      body: {
        type: 'static',
        position: {
          x: 50,
          y: 45
        }
      },
      shapes: [
        {
          type: 'polygon',
          vertices: polyData,
          fill: {
            type: 'color',
            alpha: 1
          }
        }
      ]
    });

    game.add( entity );
  });


  // Add game element to body.
  game.element.classList.add( 'game' );
  document.body.insertBefore( game.element, document.body.firstChild );

  // Setup input.
  var input = game.input;

  document.addEventListener( 'keydown', input.onKeyDown.bind( input ) );
  document.addEventListener( 'keyup', input.onKeyUp.bind( input ) );

  if ( typeof window.ontouchstart !== 'undefined' ) {
    game.canvas.addEventListener( 'touchstart', input.onTouchStart.bind( input ) );
    game.canvas.addEventListener( 'touchmove', input.onTouchMove.bind( input ) );
    game.canvas.addEventListener( 'touchend', input.onTouchEnd.bind( input ) );
  }

  // Start game.
  game.tick();

  // Add a checkbox to toggle continuous rendering,
  var runCheckbox = document.getElementById( 'run-checkbox' );
  function play() {
    game.running = true;
    game.tick();
    runCheckbox.checked = true;
  }

  function pause() {
    game.running = false;
    runCheckbox.checked = false;
  }

  function toggleContinuousRendering() {
    if ( !runCheckbox.checked ) {
      play();
    } else {
      pause();
    }
  }

  runCheckbox.addEventListener( 'click', function() {
    // Hacky. Since play() and pause() change the checked state, we need to
    // toggle the checkbox state to back before it was clicked.
    runCheckbox.checked = !runCheckbox.checked;
    toggleContinuousRendering();
  });

  // Add a checkbox to toggle Box2D debug view.
  var debugCanvas = document.getElementById( 'box2d-debug-canvas' );
  debugCanvas.style.display = 'none';

  var debugCheckbox = document.getElementById( 'box2d-debug-checkbox' );
  function toggleDebug() {
    debugCheckbox.checked = game.box2dDebug = !game.box2dDebug;

    // Toggle visibility.
    if ( game.box2dDebug ) {
      debugCanvas.style.display = 'block';
    } else {
      debugCanvas.style.display = 'none';
    }
  }

  debugCheckbox.addEventListener( 'click', function() {
    debugCheckbox.checked = !debugCheckbox.checked;
    toggleDebug();
  });

  // Settings.
  var settingsCheckbox = document.getElementById( 'settings-checkbox' );
  settingsCheckbox.addEventListener( 'click', function() {
    if ( settingsCheckbox.checked ) {
      Settings.low();
    } else {
      Settings.high();
    }
  });

  // Load level data.
  var levelDataEl = document.getElementById( 'level-data' );
  levelDataEl.addEventListener( 'keydown', function( event ) {
    // Enter.
    if ( event.which === 13 ) {
      load();
    }
  });

  function load() {
    var levelData = levelDataEl.value;
    JSON.parse( levelData ).forEach(function( entityData ) {
      game.add( new PhysicsEntity( entityData ) );
    });
  }

  var loadBtn = document.getElementById( 'level-data-btn' );
  loadBtn.addEventListener( 'click', function() {
    load();
  });

  document.addEventListener( 'keydown', function( event ) {
    // B.
    if ( event.which === 66 ) {
      toggleDebug();
    }

    // R.
    if ( event.which === 82 ) {
      toggleContinuousRendering( event );
    }

    // P.
    if ( event.which === 80 ) {
      event.preventDefault();
      var loader = document.querySelector( '.loader' );
      if ( !loader.style.display || loader.style.display === 'none' ) {
        loader.style.display = 'inline';
        levelDataEl.focus();
      } else {
        loader.style.display = 'none';
        levelDataEl.blur();
      }
    }
  });

  window.addEventListener( 'blur', function() {
    pause();

    // Disable all inputs.
    Object.keys( game.input.keys ).forEach(function( key ) {
      game.input[ key ] = false;
    });

    Object.keys( game.input.controls ).forEach(function( control ) {
      game.controls[ control ] = false;
    });
  });

  setTimeout(function() {
    game.running = false;
  }, 500 );
});
