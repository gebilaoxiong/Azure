/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-09-25 22:38:03
 * @description 博恩软件 前端框架：azure(蔚蓝)
 */

/*******************************************
 *  amd||cmd||node||script加载方式处理
 *
 */
;~ function(build) {
  var params = arguments;

  //amd
  if (typeof define === 'function' && define.amd) {

    define('azure/core',['jquery'], builder);
  }
  //node/commonJS 
  else if (typeof exports === 'object') {
    module.exports = builder;
  }
  //script tag
  else {
    window.io = builder(jQuery);
  }

  //组装核心结构
  function builder(jQuery) {
    var azure = build(),
      //其他部分
      partial = Array.prototype.slice.call(params, 1),

      part;

    while (part = partial.shift()) {
      $.extend(azure, part(azure));
    }

    return azure;
  }
}(function() {

    /*******************************************
     *  工具函数
     *
     */
    var azure = {},

      uuid = 0,

      dot = '.',

      now, preAzure;

    //获取当前的时间戳
    now = Date.now || function() {
      return new Date().valueOf();
    };


    /**
     * 创建并返回一个像节流阀一样的函数，当重复调用函数的时候，
     * 最多每隔 wait毫秒调用一次该函数。
     * @param  {function}       func                函数
     * @param  {int}            wait                时间段（单位：毫秒）
     * @param  {object}         scope               上下文
     * @param  {object}         options             选项
     *                                              {leading:false,trailing:false}
     */
    function throttle(func, wait, scope, options /*optional*/ ) {
      var pre = 0,
        timer, context, params,
        hanler, ret;

      options = options || {};

      hanler = function() {
        //重置pre
        pre = options.leading === false ? 0 : now();
        timer = null;
        func.apply(context, params);
      };

      ret = function() {
        var start = now(), //调用时间
          remaining; //剩余时间

        context = scope || this;
        params = arguments;

        //首次不执行
        if (!pre && options.leading === false) {
          pre = start;
        }

        remaining = wait - (start - pre);

        //如果剩余时间小于0或者剩余时间大于等待时间（已经过了一帧）
        if (remaining <= 0 || remaining > wait) {
          clearTimeout(timer);
          timer = null;
          pre = start;
          func.apply(context, params);
        }
        //延迟执行
        else if (!timer && options.trailing !== false) {
          timer = setTimeout(hanler, remaining);
        }
      };

      ret.destroy = function() {
        scope = context = params = options = null;
      };

      ret.uuid = markFunction(func);

      return ret;
    }


    /**
     * 生成一个防反跳的函数
     * 如防止表单重复提交
     * scroll事件等等
     * @param  {function}         func          函数
     * @param  {int}              wait          时间段（单位：毫秒）
     * @param  {Object}           scope         上下文
     * @param  {Boolean}          immediate     在开始执行或是在wait时间段后执行
     */
    function debounce(func, wait, scope /*optional*/ , immediate /*optional*/ ) {
      var start, context, params,
        timer, handler, ret;

      //整理参数
      if (typeof scope === 'boolean') {
        immediate = scope;
        scope = null;
      }

      handler = function() {
        var timespan;

        timespan = now() - start;

        //不在时间内触发
        if (timespan < wait && timespan >= 0) {
          timer = setTimeout(handler, wait - timespan);
        } else {
          timer = null;
          //模式为首次执行
          if (!immediate) {
            func.apply(context, params);
          }
        }
      };

      ret = function() {
        var callNow;
        start = now();
        context = scope || this;
        params = arguments;
        callNow = !timer && immediate; //是否立即执行

        if (!timer) {
          timer = setTimeout(handler, wait);
        }
        if (callNow) {
          func.apply(context, params);
        }
      };

      ret.destroy = function() {
        scope = context = params = null;
      };

      ret.uuid = markFunction(func);

      return ret;
    }

    /**
     * 标记函数 给函数添加上uuid
     * @param  {function}         func          需要标记的函数
     */
    function markFunction(func) {
      var ret;

      if ((ret = func.uuid) == null) {
        func.uuid = ret = ++uuid;
      }

      return ret;
    }

    /**
     * 将字符串转换为首字母大写的形式
     * @param  {Mixed}          input         字符串或者其他类型的数据
     */
    function cap(input) {
      input = String(input);
      return input.charAt(0).toUpperCase() + input.substring(1);
    }

    /**
     * 封装jq的类型判断
     */
    $.each('string number boolean function object regExp array'.split(' '), function(_, type) {
      azure['is' + cap(type)] = function(input) {
        return $.type(input) === type;
      };
    });

    /**
     * 判断对象是否为DOM元素
     */
    function isElement(elem) {
      return elem && elem.nodeType;
    }

    /**
     * 转义字符串中的正则表达式
     * @param  {string}     str         需要转义的字符串
     */
    function enscapeRegExp(str) {
      return String(str).replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
    }

    /**
     * 属性提取生成器
     * @param  {String}     props        属性提取生成器
     */
    function extractor(props) {
      var hasSpe; //是否有分隔符

      //将属性名切割成数组
      if (hasSpe = props.indexOf(dot) !== -1) {
        props = props.split('.');
      }

      return hasSpe ?
        function(obj) {
          var ret = obj,
            i, len, prop;

          for (i = 0, len = props.length; i < len; i++) {
            //属性名
            prop = props[i];

            if (prop in ret) {
              ret = ret[prop];
            }
            //如果属性名不存在 返回undefined
            else {
              ret = undefined;
              break;
            }
          }

          return ret;
        } :
        function(obj) {
          return props in obj ? obj[props] : undefined;
        }
    }

    preAzure = window.io;

    $.extend(azure, {
      debounce: debounce,
      throttle: throttle,
      extractor: extractor,
      uuid: markFunction,
      cap: cap,
      now: now,
      isElement: isElement,
      noop: $.noop,
      enscapeRegExp: enscapeRegExp
    });

    return azure;
  },

  /*******************************************
   *  将sizzle的选择器分为get和find
   *
   */
  function(azure) {
    var sizzle = jQuery.find,

      //HTML标签 匹配单标记 双标记
      rHtmlTag = /^<([^>\/\s]*(?:[^>\/]*)?)(?:\/>|(?:.?)*<\/\1>)$/,

      jqElem;

    /**
     * 获取查询的dom 返回符合要求的第一个结果
     */
    function find(elem) {

      //字符串处理
      //如果为HTML字符串 则解析为html
      //如果为选择符 则调用sizzle查找
      if (azure.isString(elem) && rHtmlTag.test(elem)) {
        return jQuery.parseHTML(elem)[0];
      }

      return azure.isElement(elem) ? elem : sizzle.apply(sizzle, arguments)[0];
    }

    /**
     * 获取查询的dom 返回符合要求的被jQeury包裹的第一个结果
     */
    function get(elem) {

      //如果不是dom元素 用 sizzle查找
      if (azure.isString(elem) && !rHtmlTag.test(elem)) {
        elem = sizzle.apply(sizzle, arguments)[0];
      }

      return jQuery(elem);
    }

    /**
     * 享元模式
     * @param  {Element}            dom           DOM元素
     */
    function fly(dom) {

      if (!jqElem) {
        jqElem = new jQuery.fn.init();
      }

      jqElem[0] = dom;
      jqElem.length = 1;

      return jqElem;
    }

    return {
      find: find,
      get: get,
      fly: fly
    };
  });