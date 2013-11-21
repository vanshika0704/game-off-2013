/*globals define*/
define(function() {
  'use strict';

  var EPSILON = 1;

  function clamp( value, min, max ) {
    return Math.min( Math.max( value, min ), max );
  }

  function randomFloat( min, max ) {
    return min + Math.random() * ( max - min );
  }

  function randomInt( min, max ) {
    return Math.round( randomFloat( min, max ) );
  }

  /**
   * Returns a float: value +/- spread.
   */
  function floatSpread( value, spread ) {
    return randomFloat( value - spread, value + spread );
  }

  /**
   * Returns an int: value +/- spread.
   */
  function intSpread( value, spread ) {
    return randomInt( value - spread, value + spread );
  }

  function lerp( a, b, t ) {
    return a + t * ( b - a );
  }

  /**
   * Project along the line given by [(x0, y0), (x1, y1)] by parameter.
   */
  function lerp2d( x0, y0, x1, y1, parameter ) {
    if ( parameter === null ) {
      return null;
    }

    return {
      x: lerp( x0, x1, parameter ),
      y: lerp( y0, y1, parameter )
    };
  }

  function roundNearZero( value ) {
    return Math.abs( value ) > EPSILON ? value : 0;
  }

  /**
   * Assuming the line is CCW, the normal of the line is (dy, -dx).
   */
  function lineNormal( x0, y0, x1, y1 ) {
    var dx = x1 - x0,
        dy = y1 - y0;

    var lengthSquared = dx * dx + dy * dy;
    if ( !lengthSquared ) {
      return null;
    }

    var invLength = 1 / Math.sqrt( lengthSquared );
    return {
      x: -dy * invLength,
      y:  dx * invLength
    };
  }

  return {
    EPSILON: EPSILON,

    clamp: clamp,

    randomFloat: randomFloat,
    randomInt: randomInt,

    floatSpread: floatSpread,
    intSpread: intSpread,

    lerp: lerp,
    lerp2d: lerp2d,

    roundNearZero: roundNearZero,
    lineNormal: lineNormal,
  };
});
