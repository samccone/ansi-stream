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

  it('handles a single bright color rule', function() {
    ansiStream._setStyles('[90m', this.retCSS);

    assert.deepEqual(this.retCSS, {color: 'rgb(85,85,85)'});
  });

  it('handles a single bright background color rule', function() {
    ansiStream._setStyles('[100m', this.retCSS);
    assert.deepEqual(this.retCSS, {background: 'rgb(85,85,85)'});
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

describe('utils', function() {
  it('detects foreground', function() {
    assert.equal(ansiStream._isForeground(['3']), true);
    assert.equal(ansiStream._isForeground(['4']), false);
    assert.equal(ansiStream._isForeground(['9']), true);
  });

  it('detects background', function() {
    assert.equal(ansiStream._isBackground(['4']), true);
    assert.equal(ansiStream._isBackground(['1']), false);
    assert.equal(ansiStream._isBackground(['1', '0']), true);
  });

  it('gets intensity', function() {
    assert.equal(ansiStream._getIntensity(['9']), 'high');
    assert.equal(ansiStream._getIntensity(['1']), 'high');
    assert.equal(ansiStream._getIntensity(['3']), 'low');
    assert.equal(ansiStream._getIntensity(['4']), 'low');
  });
});
