/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-11-26 21:17:09
 * @description css3特性嗅
 */
(function(factory) {
  //amd||cmd
  if (typeof define == 'function' && (define.amd || define.cmd)) {
    define('azure/util/css3Judge', [], factory);
  }
  //script target 标记documentElement
  else {
    var css3Support = factory(),

      docElem = document.documentElement,

      cls = [];

    for (prop in css3Support) {
      prop = (css3Support[prop] ? 'css' : 'noCss') + (prop.substr(0, 1).toUpperCase() + prop.slice(1));
      cls.push(prop);
    }

    docElem.className += ' ' + cls.join(' ');
  }

})(function() {
  var props = ['transition', 'transform', 'animation', 'borderRadius'],

    vendors = ['Webkit', 'Moz', 'O', 'ms', ''],

    div = document.createElement('div'),

    style = div.style,

    supports = {},

    i, len, prop;

  div.innerHTML = '<div style="background-color:rgba(0,0,0,0.1)"></div>';

  for (i = 0, len = props.length; i < len; i++) {
    prop = props[i];
    supports[prop] = vendorPropName(prop);
  }

  //rgba
  supports.rgba = div.firstChild.style.backgroundColor !== '';

  //transform3d
  if (supports.transform) {
    style[supports.transform] = 'rotateY(90deg)';
    supports.transform3d = style[supports.transform] !== '';
  }

  style = div = null;

  /**
   * 获取浏览器的属性名
   * @param  {String}           prop          属性名
   */
  function vendorPropName(prop) {
    var i = 0,
      len = vendors.length,
      prefix, vendorProp,
      ret;

    for (; i < len; i++) {
      prefix = vendors[i]
        //浏览器属性
      vendorProp = prefix ? prop : (prefix + cap(prop));

      if (vendorProp in style) {
        ret = vendorProp;
        break;
      }
    }
    return ret;
  }

  /**
   * 首字母大写
   * @param  {String}           input           输入字符串
   */
  function cap(input) {
    return input.substr(0, 1).toUpperCase() + input.slice(1);
  }

  return supports;
})