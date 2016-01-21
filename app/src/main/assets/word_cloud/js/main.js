'use strict';

window.utils = (function() {

  function toHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
  }

  function hexToRgb (hex) {
    if (hex.length == 9) { 
        hex = "#" + hex.slice(3);
    }
     var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  }

  function rgbToHex(rgb) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  } 

  return {
    rgbToHex: rgbToHex,
    hexToRgb: hexToRgb,
    interpolateRgb: function(a, b) {
        a = hexToRgb(a);
        b = hexToRgb(b);
        var ar = a.r,
            ag = a.g,
            ab = a.b,
            br = b.r - ar,
            bg = b.g - ag,
            bb = b.b - ab;
        return function(t) {
          return "#"
              + toHex(Math.round(ar + br * t))
              + toHex(Math.round(ag + bg * t))
              + toHex(Math.round(ab + bb * t));
        };
    },
    scale: function(range, domain) {
        if (!domain) {
          domain = [0, 1];
        }
        return function(v) {
          if (range[1] == range[0]) {
              return domain[1];
          } else {
              return domain[0] + (domain[1] - domain[0]) * (v - range[0]) / (range[1] - range[0]); 
          }
        };
    }
  };
})();


window.setChartData = function(data) {
  generateWordCloud(data);
}

window.generateWordCloud = function(data) {
  var devicePixelRatio = window.devicePixelRatio || 1;

  var list = formatData(data);

  var colorScheme = getColorScheme(data);

  var canvas = document.getElementById('wordcloud');
  var bound = canvas.getBoundingClientRect();
  canvas.width = bound.width * devicePixelRatio;
  canvas.height = bound.height * devicePixelRatio;

  // canvas.width = 296; canvas.height = 160;
  // canvas.style.width = 296 + "px"; canvas.style.height = 160 + "px";
  // console.log('canvas width: ' + canvas.width + ' height: ' + canvas.height);

  var options = {
    list: list, 
    shuffle: false,
    rotateRatio: 1,
    customRotations: [-Math.PI/2.0, Math.PI/2.0],
    gridSize: Math.round(16 * Math.max(canvas.width, canvas.height) / 1024) * Math.max(1, 3 - list.length * 0.2),
    weightFactor: getWeightFactor(list),
    fontFamily: 'Arial, Helvetica, Microsoft Yahei, sans-serif',
    color: colorScheme,
    ellipticity: canvas.height / canvas.width,
    // color: 'random-dark',
    click: function(item) {
      // console.log('clicked: ' + item);
      var items = [
        {'text': item[0], value: item[1], color: window.__COLOR_MAP__[item[0]]}
      ];
      var callNative = window.__BDP_CALL_NATIVE__;
      callNative('selectChartItems', {items: items}, '');
    },
  }
  
  WordCloud(canvas, options);
  
  canvas.addEventListener('wordcloudstartrender', function(e) {
      var callNative = window.__BDP_CALL_NATIVE__;
      callNative('startRender', {}, '');
  });

  canvas.addEventListener('wordcloudstop', function(e) {
      var callNative = window.__BDP_CALL_NATIVE__;
      callNative('rendered', {}, '');
  });

  // canvas.addEventListener('wordclouddrawn', function(e) {
  //   console.log('drawn')
  // });

  window.addEventListener('resize', function(e) {
      var canvas = document.getElementById('wordcloud');
      var bound = canvas.getBoundingClientRect();
      canvas.width = bound.width * devicePixelRatio;
      canvas.height = bound.height * devicePixelRatio;

      // canvas.width = 296; canvas.height = 160;
      // canvas.style.width = 296 + "px"; canvas.style.height = 160 + "px";
      options.gridSize = Math.round(16 * Math.max(canvas.width, canvas.height) / 1024) * Math.max(1, 3 - list.length * 0.2),
      options.weightFactor = getWeightFactor(list);
      options.ellipticity = canvas.height / canvas.width;
      console.log('canvas width: ' + canvas.width + ' height: ' + canvas.height);
      WordCloud(canvas, options);
  });
}

function getWeightFactor(list) {
    var devicePixelRatio = window.devicePixelRatio || 1;

    var dataRange = getDataRange(list);
    var scale = utils.scale(dataRange, [20, 157]);

    var canvas = document.getElementById('wordcloud');

    var width = canvas.width / devicePixelRatio;
    var height = canvas.height / devicePixelRatio;

    var s = 0;
    list.forEach(function(item ,i) {
        var word = item[0], count = item[1];
        var size = Math.abs(Math.sin(scale(count) / 100));
        var englist_cnt = 0;
        var rate = 1;
        if (/[\w-]/i.test(word)) {
            englist_cnt = word.match(/[\w-]/ig).length;
            rate = 1 - 0.5 * englist_cnt / word.length;
        }
        s += size * (word.length * size) * rate;
    });

    var index = 0;

    // console.log('devicePixelRatio: ' + devicePixelRatio);
    return function(size) {
        var word = list[index][0];
        size = Math.round(Math.sin(scale(size) / 100) * Math.sqrt((width * height) / s)) * 1.5;

        if (devicePixelRatio == 1) {
            size = size / 2;
        }

        if (devicePixelRatio == 3) {
            size = size * 1.5;
        }

        if (word.length * size > canvas.width * 0.9) {
            size = canvas.width * 0.9 / word.length;
        }

        var ellipticity = canvas.height / canvas.width
        if (ellipticity < 1 && list.length < 5) {
            size *= Math.max(ellipticity, 0.6);
        }
        return size;
    }
}

function formatData(original) {
  var data = original.data;
  var list = [];
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    list.push([item.text, item.value]);
  }

  return list;
}

function getColorScheme(originalData) {
    
    var data = originalData.data;
    var colorMap = {};
    var colors = originalData.colors;

    if (!colors.length) {
        return 'random-dark';
    }

    for (var i = 0; i < data.length; i++) {
        var text = data[i].text;
        colorMap[text] = colors[i % colors.length];
        if (colorMap[text].length == 9) {
            colorMap[text] = "#" + colorMap[text].slice(3);
        }
    }

    window.__COLOR_MAP__ = colorMap;

    return function(word, weight) {
      // console.log(colorMap[word]);
      return colorMap[word] || "#999999";
    }

}

function getDataRange(data) {
  data.sort(function(a, b) {
    return b[1] - a[1];
  });

  var max = 0, min = 0;
  if (data.length > 0) {
    max = data[0][1];
    min = data[data.length - 1][1];
  }
  return [min, max];
}

function initChart() {

  if (!WordCloud.isSupported) {
    return console.debug('Webview版本不支持');
  }

  var callNative = window.__BDP_CALL_NATIVE__;
  callNative('initialized', {}, '');

  if (window.location.search.indexOf('debug') >= 0) {
      // just for test
      var testData = generateTestData();
      generateWordCloud(testData);
  }
}

function generateTestData() {
  var list = [{text: 'Love', value: 12}];
  var nums = [10, 9, 7, 6, 5];
  // This list of the word "Love" in language of the world was taken from
  // the Language links of entry "Love" in English Wikipedia, with duplicate
  // spelling removed.
  var words = ('Liebe,ፍቅር,Lufu,حب,Aimor,Amor,Heyran,ভালোবাসা,Каханне,Любоў,Любов,བརྩེ་དུང་།,' +
    'Ljubav,Karantez,Юрату,Láska,Amore,Cariad,Kærlighed,Armastus,Αγάπη,Amo,Amol,Maitasun,' +
    'عشق,Pyar,Amour,Leafde,Gràdh,愛,爱,પ્રેમ,사랑,Սեր,Ihunanya,Cinta,ᑕᑯᑦᓱᒍᓱᑉᐳᖅ,Ást,אהבה,' +
    'ಪ್ರೀತಿ,სიყვარული,Махаббат,Pendo,Сүйүү,Mīlestība,Meilė,Leefde,Bolingo,Szerelem,' +
    'Љубов,സ്നേഹം,Imħabba,प्रेम,Ái,Хайр,အချစ်,Tlazohtiliztli,Liefde,माया,मतिना,' +
    'Kjærlighet,Kjærleik,ପ୍ରେମ,Sevgi,ਪਿਆਰ,پیار,Miłość,Leevde,Dragoste,' +
    'Khuyay,Любовь,Таптал,Dashuria,Amuri,ආදරය,Ljubezen,Jaceyl,خۆشەویستی,Љубав,Rakkaus,' +
    'Kärlek,Pag-ibig,காதல்,ప్రేమ,ความรัก,Ишқ,Aşk,محبت,Tình yêu,Higugma,ליבע').split(',');

    words.forEach(function(w, i) {
      // if (i  > 5) return;
      // var n = nums[Math.floor(Math.random() * nums.length)];
      var n = nums[i % nums.length];
      list.push({text: w, value: n});
      // list.push([w, n]);
    });

  // bad case: canvas w = 296, h = 160
  // list = [{text: "福建省", value: 22}, {text: "安徽省", value: 22}, {text: "甘肃省", value: 1}];

  // var colors = ["#F16745", "#FFC65D", "#7BC8A4", "#4CC3D9", "#93648D", "#404040"];

  // return {data: list, colors: colors};


  // bad case: "canvas width: 1032 height: 1419"
  var data = {"data":[{"text":"city","value":468},{"text":"new","value":264},{"text":"los","value":222},{"text":"york","value":208},{"text":"angeles","value":203},{"text":"park","value":165},{"text":"san","value":142},{"text":"beach","value":116},{"text":"west","value":112},{"text":"heights","value":107},{"text":"chicago","value":102},{"text":"seattle","value":93},{"text":"north","value":89},{"text":"lake","value":88},{"text":"saint","value":85},{"text":"boston","value":83},{"text":"hills","value":73},{"text":"springs","value":71},{"text":"washington","value":68},{"text":"hill","value":66},{"text":"falls","value":65},{"text":"miami","value":63},{"text":"fort","value":61},{"text":"east","value":61},{"text":"charlotte","value":60},{"text":"grove","value":59},{"text":"philadelphia","value":58},{"text":"port","value":55},{"text":"santa","value":49},{"text":"valley","value":46},{"text":"houston","value":46},{"text":"mount","value":46},{"text":"la","value":43},{"text":"detroit","value":42},{"text":"palm","value":41},{"text":"atlanta","value":40},{"text":"rock","value":40},{"text":"south","value":39},{"text":"bay","value":39},{"text":"oak","value":38},{"text":"dallas","value":38},{"text":"francisco","value":37},{"text":"diego","value":36},{"text":"burlington","value":33},{"text":"prairie","value":32},{"text":"springfield","value":32},{"text":"columbus","value":31},{"text":"island","value":30},{"text":"madison","value":28},{"text":"vernon","value":28},{"text":"el","value":27},{"text":"auburn","value":26},{"text":"des","value":26},{"text":"grand","value":26},{"text":"lafayette","value":26},{"text":"arlington","value":26},{"text":"cleveland","value":26},{"text":"winter","value":25},{"text":"cedar","value":25},{"text":"roswell","value":25},{"text":"forest","value":25},{"text":"point","value":24},{"text":"jackson","value":24},{"text":"marion","value":24},{"text":"portland","value":23},{"text":"franklin","value":23},{"text":"vista","value":23},{"text":"sanford","value":23},{"text":"rochester","value":22},{"text":"boise","value":22},{"text":"palms","value":22},{"text":"clinton","value":22},{"text":"twentynine","value":22},{"text":"spring","value":21},{"text":"las","value":21},{"text":"ridge","value":21},{"text":"charles","value":21},{"text":"roseville","value":21},{"text":"columbia","value":21},{"text":"village","value":21},{"text":"greenville","value":21},{"text":"durango","value":20},{"text":"eagle","value":20},{"text":"danville","value":20},{"text":"richmond","value":20},{"text":"lakewood","value":20},{"text":"highland","value":20},{"text":"lancaster","value":20},{"text":"bozeman","value":19},{"text":"prior","value":19},{"text":"louisville","value":19},{"text":"college","value":19},{"text":"mesa","value":19},{"text":"florence","value":19},{"text":"albany","value":18},{"text":"rapids","value":18},{"text":"watertown","value":18},{"text":"lansing","value":18},{"text":"oswego","value":18},{"text":"louis","value":18}],"colors":["#ff4a72c9","#ff729ade","#ff7aa3e2","#ff7da6e4","#ff7ea7e4","#ff85aee8","#ff8ab3eb","#ff8fb8ed","#ff90b9ee","#ff91baee","#ff92bbef","#ff94bdf0","#ff94bdf0","#ff95bef0","#ff95bef1","#ff96bff1","#ff98c1f2","#ff98c1f2","#ff99c2f2","#ff99c2f2","#ff99c2f3","#ff9ac3f3","#ff9ac3f3","#ff9ac3f3","#ff9ac3f3","#ff9ac3f3","#ff9bc4f3","#ff9bc4f4","#ff9cc5f4","#ff9dc6f5","#ff9dc6f5","#ff9dc6f5","#ff9ec7f5","#ff9ec7f5","#ff9ec7f5","#ff9ec7f5","#ff9ec7f5","#ff9ec7f5","#ff9ec7f5","#ff9fc8f5","#ff9fc8f5","#ff9fc8f6","#ff9fc8f6","#ffa0c9f6","#ffa0c9f6","#ffa0c9f6","#ffa0c9f6","#ffa0c9f6","#ffa1caf6","#ffa1caf6","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa1caf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7","#ffa2cbf7"]};

  return data;

}



initChart();

