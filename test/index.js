//hack for node compat
global.TextDecoder = function() {};

var assert = require('assert');
var ansiStream = require('../');

describe('object to CSS', function() {
  it('converts an object to css', function() {
    assert.equal(
        ansiStream._objectToCssString({foo: 1, 'bar-zap': 2}),
        'foo: 1;bar-zap: 2;');
  });

  it('does not set undefined values', function() {
    assert.equal(
        ansiStream._objectToCssString({foo: undefined, 'bar-zap': 2}),
        'bar-zap: 2;');
  });
});

describe('setting styles', function() {
  beforeEach(function() {
    this.retCSS = {};
  });

  it('handles a single color rule', function() {
    ansiStream._setStyles('[34m', this.retCSS);

    assert.deepEqual(this.retCSS, {color: 'rgb(0,0,255)'});
  });

  it('handles a single color rule', function() {
    ansiStream._setStyles('[1m', this.retCSS);

    assert.deepEqual(this.retCSS, {'font-weight': 'bold'});
  });

  it('handles a multi rules', function() {
    ansiStream._setStyles('[34;1m', this.retCSS);
    assert.deepEqual(this.retCSS, {
      'color': 'rgb(0,0,255)',
      'font-weight': 'bold'});
  });

  it('handles bold cancel', function() {
    ansiStream._setStyles('[1;22m', this.retCSS);

    assert.deepEqual(this.retCSS, {});
  });
});
