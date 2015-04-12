/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-03 20:33:02
 * @description 类型工厂
 */
define(['azure/core'], function(io) {

  var ClassFactory,

    array_shift = Array.prototype.shift,

    object_hasOwnProperty = Object.prototype.hasOwnProperty,

    klassCache = {};

  ClassFactory = {

    cache: klassCache,

    /**
     * 定义一个类型
     * @param  {String}       className           类型名称
     * @param  {Function}     superclass          父类（可选）
     */
    define: function( /*className, superclass , partial1, partial2...*/ ) {
      //没有传入参数
      if (!arguments.length) {
        return;
      }

      var params = arguments,
        className = array_shift.call(params),
        parent, partial;

      //传入了基类
      if (io.isFunction(params[0])) {
        parent = array_shift.call(params);
      }

      //类
      function klass() {
        this.init && this.init.apply(this, arguments);
      }

      if (parent) {
        proto.prototype = parent.prototype;
        klass.$superclass = parent;
        parent.$subclass = parent.$subclass || [];
        parent.$subclass.push(klass);
      }

      klass.prototype = new proto;
      klass.prototype.constructor = klass;
      klass.prototype.$type = className;
      klass.$isClass = true;

      while (partial = array_shift.call(params)) {
        this.addMembers(klass, partial);
      }

      klassCache[className] = klass;
      return klass;
    },
    /**
     * 将部分类附加到类型上
     * @param {Function}        klass             类型
     * @param {Object}          partial           部分类
     */
    addMembers: function(klass, partial) {
      var proto = klass.prototype,
        i, member;

      for (i in partial) {

        //属性不是定义在原型链上的东东
        if (!object_hasOwnProperty.call(partial, i)) {
          continue;
        }

        member = partial[i];

        if (io.isFunction(member) && !member.$isClass) {
          member = wrapFunction(member);
          member.$owner = klass;
          member.$name = i;
        }

        proto[i] = member;
      }
    },

    /**
     * 实例化类型
     * @param  {Object}         config          配置对象
     * @param  {Class}          type            类型
     */
    create: function(config, type) {

      if ('xtype' in config) {

        type = io.isString(config.xtype) ?
          klassCache[config.xtype] : config.xtype;
      }

      return new type(config);
    }
  };


  function proto() {}

  /**
   * 包裹函数
   * @param  {Function}         fn          需要包裹的函数
   */
  function wrapFunction(fn) {
    return function() {
      return fn.apply(this, arguments);
    }
  }

  return ClassFactory;
})