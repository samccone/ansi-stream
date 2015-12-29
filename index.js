(function() {
  'use strict';

  var decoder = new TextDecoder();
  var ansiRegex = /(\\[.*?m)/g;
  var colorRegex = /\\[(.*)m/;
  var newLineRegex = /\n/g;
  var DEFAULT_TEXT = '#fff';
  var DEFAULT_BACKGROUND = '#000';

  function ansiStream(path, onChunk, opts) {
    DEFAULT_TEXT = opts.text || DEFAULT_TEXT;
    DEFAULT_BACKGROUND = opts.background || DEFAULT_BACKGROUND;

    return fetch(path).then(function(res) {
      return parseLogStream(res.body.getReader(), onChunk);
    });
  }

  // 0 - 7 int to rgb
  function bitToRGB(v, opts) {
    opts = opts || {};

    var base = v.toString(2).split('');
    var rgbArr = [0,0,0].slice(base.length).concat(base)
      .map(v => v * 255).reverse();

    if (opts.intensity === 'high') {
      rgbArr = rgbArr.map(v => v === 0 ? 85 : v);
    }

    return 'rgb(' + rgbArr.join(',') + ')';
  }

  function isAnsiRule(chunk) {
    return chunk.match(ansiRegex) !== null;
  }

  function styleChunk(css, chunk, closePrev) {
    var ret = '';

    if (closePrev) {
      ret += '</span>';
    }

    return `${ret}<span style="${objectToCssString(css)}">${chunk}`
  }

  function isForeground(code) {
    return Boolean(code[0] === '3' || code[0] === '9');
  }

  function isBackground(code) {
    return Boolean(code[0] === '4' || code.slice(0, 2).join('') === '10');
  }

  function getIntensity(code) {
    return (code[0] === '9' || code[0] === '1') ? 'high' : 'low';
  }

  function setStyles(ansiCode, css) {
    var matched = matched = ansiCode.match(colorRegex)[1].split(';').forEach((code) => {
      let split = code.split('');
      let color = parseInt(split.slice(-1), 10);

      if (isForeground(split)) {
        css['color'] = (color === '9')
          ? DEFAULT_TEXT : bitToRGB(color, {
            intensity: getIntensity(split),
          });
      }

      if (isBackground(split)) {
        css['background'] = (color === '9')
          ? DEFAULT_BACKGROUND : bitToRGB(color, {
            intensity: getIntensity(split),
          });
      }

      if (split.length < 3 && split[0] === '1') {
        css['font-weight'] = 'bold';
      }

      if (code === '22') {
        delete css['font-weight'];
      }

      if (split[0] === '0') {
        delete css['color'];
        delete css['background'];
        delete css['font-weight'];
      }
    });
  }

  function inlineStyles(line, prevCss) {
    return line.split(ansiRegex).reduce((prev, chunk) => {
      if (isAnsiRule(chunk)) {
        setStyles(chunk, prevCss);
        return prev;
      }

      return prev + styleChunk(prevCss, chunk, true);
    }, '');
  }

  function objectToCssString(cssObj) {
    return Object.keys(cssObj).reduce((prev, key) => {
      if (cssObj[key] !== undefined) {
        return prev + `${key}: ${cssObj[key]};`
      }

      return prev;
    }, '');
  }

  function parseLogStream(stream, onChunk) {
    var css = {};

    stream.read().then(r => {
      var html = decoder.decode(r.value);
      html = html.split(newLineRegex)
      .map(function(line) {
        return `${inlineStyles(line, css)}</br>`;
      })
      .join('');


      onChunk(html);
      parseLogStream(stream, onChunk);
    });
  };

  if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    module.exports = ansiStream;

    module.exports = Object.assign(ansiStream, {
      _objectToCssString: objectToCssString,
      _inlineStyles: inlineStyles,
      _setStyles: setStyles,
      _isAnsiRule: isAnsiRule,
      _bitToRGB: bitToRGB,
      _isForeground: isForeground,
      _isBackground: isBackground,
      _getIntensity: getIntensity,
    });
  } else {
    window.ansiStream = ansiStream;
  }
})();
