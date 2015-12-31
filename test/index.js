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

  it('handles underlines', function() {
    ansiStream._setStyles('[4m', this.retCSS);
    assert.deepEqual(this.retCSS, {'text-decoration': 'underline'});
  });

  it('handles underline cancel', function() {
    ansiStream._setStyles('[4m', this.retCSS);
    ansiStream._setStyles('[24m', this.retCSS);
    assert.deepEqual(this.retCSS, {});
  });

  it('handles bold cancel', function() {
    ansiStream._setStyles('[1;22m', this.retCSS);
    assert.deepEqual(this.retCSS, {});
  });

  it('handles complex rule', function() {
    ansiStream._setStyles('[1;4;34;43m', this.retCSS);
    assert.deepEqual(this.retCSS, {
      'background': 'rgb(255,255,0)',
      'color': 'rgb(0,0,255)',
      'font-weight': 'bold',
      'text-decoration': 'underline',
    });
  })

  it('handles clearing all', function() {
    ansiStream._setStyles('[1;4;34;43m', this.retCSS);
    ansiStream._setStyles('[0m', this.retCSS);
    assert.deepEqual(this.retCSS, {});
  });
});

describe('utils', function() {
  it('detects foreground', function() {
    assert.equal(ansiStream._isForeground(['3', '0']), true, 'leading 3');
    assert.equal(ansiStream._isForeground(['4', '0']), false, 'invalid leading 4');
    assert.equal(ansiStream._isForeground(['9', '0']), true, 'leading 9');
  });

  it('detects background', function() {
    assert.equal(ansiStream._isBackground(['4', '0']), true, 'leading 4');
    assert.equal(ansiStream._isBackground(['1', '0']), false, 'not long enough leading 1');
    assert.equal(ansiStream._isBackground(['1', '0', '0']), true, 'long enough leading 1');
  });

  it('gets intensity', function() {
    assert.equal(ansiStream._getIntensity(['9']), 'high');
    assert.equal(ansiStream._getIntensity(['1']), 'high');
    assert.equal(ansiStream._getIntensity(['3']), 'low');
    assert.equal(ansiStream._getIntensity(['4']), 'low');
  });
});
