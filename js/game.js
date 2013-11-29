/*jshint bitwise: false, camelcase: false*/
/*globals define*/
define(function( require ) {
  'use strict';

  var Box2D = require( 'box2d' );
  var Input = require( 'input' );
  var Camera = require( 'entities/camera' );
  var Player = require( 'entities/player' );
  var Explosion = require( 'entities/explosion' );
  var Trigger = require( 'entities/trigger' );
  var Background = require( 'effects/background' );
  var Shake = require( 'effects/shake' );
  var Colors = require( 'config/colors' );
  var Material = require( 'config/material' );
  var Settings = require( 'config/settings' );
  var world = require( 'world' );

  var DebugDraw = Box2D.Dynamics.b2DebugDraw;
  var ContactListener = Box2D.Dynamics.b2ContactListener;

  function Game() {
    this.prevTime = Date.now();
    this.currTime = this.prevTime;

    this.running = true;

    this.element = document.createElement( 'div' );
    this.canvas  = document.createElement( 'canvas' );
    this.ctx     = this.canvas.getContext( '2d' );

    this.element.appendChild( this.canvas );

    this.WIDTH  = 640;
    this.HEIGHT = 480;

    this.canvas.width  = this.WIDTH;
    this.canvas.height = this.HEIGHT;

    this.removed = [];

    this.entities = [];
    this.player = null;

    this.camera = new Camera( 0.5 * this.WIDTH, 0.5 * this.HEIGHT );
    this.camera.world = this;
    this.camera.stroke.set({
      blue: 255,
      alpha: 1.0
    });

    this.camera.margin = 10;
    this.camera.lineWidth = 0.2;

    this.shake = new Shake();

    this.level = null;

    this.input = new Input();
    this.input.game = this;

    // dt should never exceed this (milliseconds).
    this.MAX_FRAME_TIME = 1000 / 30;
    // Frame time (seconds).
    this.FRAME_TIME = 1 / 60;

    this.debug = {};

    this.background = new Background( this.WIDTH, this.HEIGHT );
    this.background.fill.set({
      red: 64,
      green: 64,
      blue: 96,
      alpha: 1
    });

    this.background.camera = this.camera;
    this.background.game = this;
    this.background.prerender();

    this.world = world;
    world.GetGravity().SetZero();

    // Initialize debug view.
    this.box2dDebug = false;

    this.debugCanvas = document.createElement( 'canvas' );
    this.debugCtx    = this.debugCanvas.getContext( '2d' );

    document.body.appendChild( this.debugCanvas );

    this.debugCanvas.id = 'box2d-debug-canvas';
    this.debugCanvas.width  = this.WIDTH;
    this.debugCanvas.height = this.HEIGHT;

    var debugDraw = new DebugDraw();
    debugDraw.SetSprite( this.debugCtx );
    debugDraw.SetDrawScale( 1 );
    debugDraw.SetFillAlpha( 0.3 );
    debugDraw.SetLineThickness( 1 );
    debugDraw.SetFlags( DebugDraw.e_shapeBit );
    world.SetDebugDraw( debugDraw );

    var contactListener = new ContactListener();

    function userData( fixture ) {
      return fixture.GetBody().GetUserData();
    }

    contactListener.BeginContact = function( contact ) {
      var fixtureA = contact.GetFixtureA(),
          fixtureB = contact.GetFixtureB();

      var a = userData( fixtureA ),
          b = userData( fixtureB );

      // Handle player explosions.
      var player, other;
      if ( a instanceof Player && !fixtureB.IsSensor() ) {
        player = a;
        other = b;
      } else if ( b instanceof Player && !fixtureA.IsSensor() ) {
        player = b;
        other = a;
      }

      var explosion, fill;
      if ( player && !( player.material & other.material ) &&
           player.game && other.game ) {
        player.emotion = Player.Emotion.HIT;
        if ( player.emotionTimeout ) {
          clearTimeout( player.emotionTimeout );
        }

        player.emotionTimeout = setTimeout(function() {
          player.emotion = Player.Emotion.NORMAL;
          clearTimeout( player.emotionTimeout );
          player.emotionTimeout = null;
        }, 700 );

        if ( Settings.explosions ) {
          if ( other.material & Material.MATTER ) {
            fill = Colors.Explosion.MATTER;
          } else if ( other.material & Material.ANTIMATTER ) {
            fill = Colors.Explosion.ANTIMATTER;
          }

          if ( fill ) {
            explosion = new Explosion( other.x, other.y );
            explosion.fill.set( fill );
            this.add( explosion );
          }
        }

        this.shake.shake( 0.5, 0.2 );
        this.removed.push( other );
        return;
      }

      // Handle explosions.
      if ( !player &&
           !fixtureA.IsSensor() &&
           !fixtureB.IsSensor() &&
           !( a.material & b.material ) &&
           a.game &&
           b.game ) {
        var explosionA,
            explosionB;

        var fillA,
            fillB;

        if ( Settings.explosions ) {
          if ( a.material & Material.MATTER ) {
            fillA = Colors.Explosion.MATTER;
          } else if ( a.material & Material.ANTIMATTER ) {
            fillA = Colors.Explosion.ANTIMATTER;
          }

          if ( b.material & Material.MATTER ) {
            fillB = Colors.Explosion.MATTER;
          } else if ( b.material & Material.ANTIMATTER ) {
            fillB = Colors.Explosion.ANTIMATTER;
          }

          if ( fillA ) {
            explosionA = new Explosion( a.x, a.y );
            explosionA.fill.set( fillA );
            this.add( explosionA );
          }

          if ( fillB ) {
            explosionB = new Explosion( b.x, b.y );
            explosionB.fill.set( fillB );
            this.add( explosionB );
          }
        }

        this.removed.push( a );
        this.removed.push( b );
      }

      // Handles trigger.
      var trigger;
      if ( a instanceof Trigger &&
           !fixtureB.IsSensor() &&
           !( b instanceof Player ) ) {
        trigger = a;
        other = b;
      } else if ( b instanceof Trigger &&
                  !fixtureA.IsSensor() &&
                  !( a instanceof Player ) ) {
        trigger = b;
        other = a;
      }

      if ( trigger &&
           !trigger.active &&
           ( trigger.material & other.material ) ) {
        trigger.object = other;
      }


    }.bind( this );

    world.SetContactListener( contactListener );
  }

  Game.instance = null;

  Game.prototype.update = function() {

    this.currTime = Date.now();
    var dt = this.currTime - this.prevTime;
    this.prevTime = this.currTime;

    if ( dt > this.MAX_FRAME_TIME ) {
      dt = this.MAX_FRAME_TIME;
    }

    dt *= 1e-3;

    this.input.update( dt );
    // Camera controls.
    this.updateDebug( dt );

    this.entities.forEach(function( entity ) {
      entity.update( dt );
    });

    this.player.update( dt );
    this.camera.update( dt );
    this.shake.update( dt );

    this.world.Step( this.FRAME_TIME, 8, 3 );

    this.world.ClearForces();

    this.removed.forEach(function( removed ) {
      this.remove( removed );
    }.bind( this ));
  };

  Game.prototype.draw = function() {
    if ( this.box2dDebug ) {
      this.drawDebug();
    }

    var ctx = this.ctx;

    var level = this.level;
    if ( level.fill.alpha ) {
      ctx.fillStyle = level.fill.rgba();
      ctx.fillRect( 0, 0, ctx.canvas.width, ctx.canvas.height );
    } else {
      ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );
    }

    ctx.save();
    this.camera.applyTransform( ctx );
    this.shake.applyTransform( ctx );

    if ( Settings.background ) {
      this.background.draw( ctx );
    }

    this.entities.forEach(function( entity ) {
      entity.draw( ctx );
    });

    this.player.draw( ctx );
    this.camera.draw( ctx );

    ctx.restore();

    this.input.draw( ctx );
  };

  Game.prototype.updateDebug = function( dt ) {
    // Basic camera controls.
    // W. Zoom in.
    if ( this.input.keys[ 87 ] ) {
      this.camera.width = Math.max( this.camera.width - 2, 32 );
      this.camera.height = Math.max( this.camera.height - 1.5, 24 );
    }
    // S. Zoom out.
    if ( this.input.keys[ 83 ] ) {
      this.camera.width += 2;
      this.camera.height += 1.5;
    }
    // A. Rotate left.
    if ( this.input.keys[ 65 ] ) {
      this.camera.angle += dt;
    }
    // D. Rotate right.
    if ( this.input.keys[ 68 ] ) {
      this.camera.angle -= dt;
    }
    // Q. Reset camera.
    if ( this.input.keys[ 81 ] ) {
      this.camera.width = 64;
      this.camera.height = 48;
      this.camera.angle = 0;
    }
  };

  Game.prototype.drawDebug = function() {
    var debugCtx = this.debugCtx;

    var width  = debugCtx.canvas.width,
        height = debugCtx.canvas.height;

    debugCtx.clearRect( 0, 0, width, height );
    debugCtx.save();

    debugCtx.translate( 0.5 * width, 0.5 * height );
    this.world.DrawDebugData();

    debugCtx.restore();
  };

  Game.prototype.tick = function() {
    if ( !this.running ) {
      return;
    }

    this.update();
    this.draw();

    window.requestAnimationFrame( this.tick.bind( this ) );
  };

  Game.prototype.add = function( entity ) {
    this.entities.push( entity );
    entity.game = this;
  };

  Game.prototype.remove = function( entity ) {
    var index = this.entities.indexOf( entity );
    if ( index !== -1 ) {
      this.entities.splice( index, 1 );
      entity.game = null;
    }
  };

  Game.prototype.setPlayer = function( player ) {
    player.game = this;
    this.player = player;
  };

  /**
   * Clear the world before loading the level.
   */
  Game.prototype.clear = function() {
    this.entities = [];
    this.player = null;

    var world = this.world;
    world.ClearForces();

    var body = world.GetBodyList();
    while ( body ) {
      world.DestroyBody( body );
      body = body.GetNext();
    }
  };

  Game.prototype.load = function( level ) {
    level.entities.forEach(function( entity ) {
      this.add( entity );
    }.bind( this ));
  };

  return Game;
});
