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
  function bitToRGB(v) {
    var base = v.toString(2).split('');

    return 'rgb(' + [0,0,0].slice(base.length).concat(base)
      .map(v => v * 255).reverse().join(',') + ')';
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

  function setStyles(ansiCode, css) {
    var matched = matched = ansiCode.match(colorRegex)[1].split(';').forEach((code) => {
      let split = code.split('');
      let intensity = parseInt(split[1], 10);

      if (split[0] === '3') {
        css['color'] = (split[1] === '9')
          ? DEFAULT_TEXT : bitToRGB(intensity);
      }

      if (split[0] === '4') {
        css['background'] = (split[1] === '9')
          ? DEFAULT_BACKGROUND : bitToRGB(intensity);
      }

      if (split[0] === '1') {
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
      _bitToRGB: bitToRGB
    });
  } else {
    window.ansiStream = ansiStream;
  }
})();
