/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-22 15:09:32
 * @description 集合类型抽象类
 */
define([
  'azure/core',
  'azure/ClassFactory',
  'azure/util/Observable'
], function(io,ClassFactory, Observable) {

  var Enumberable,

    array_slice = Array.prototype.slice;

  Enumberable = ClassFactory.define('Enumberable', Observable, {

    /**
     * 迭代集合中的每一项
     * @param  {function}     iterator      迭代函数
     * @param  {Object}       scope         上下文（可选）
     */
    each: io.noop,

    /**
     * 映射
     * @param  {function}     func      迭代函数
     */
    map: io.noop,

    /**
     * 添加
     */
    add:io.noop,

    /**
     * 删除
     */
    remove:io.noop,

    /**
     * 销毁
     */
    destroy:io.noop,

    /**
     * 在集合中逐项查找，返回第一个通过条件的项
     * @param  {function}     condition     条件
     * @param  {Object}       scope         上下文（可选）
     */
    find: function(condition, scope) {
      var me = this,
        ret;

      me.each(function(item) {
        if (condition.apply(scope || item, arguments) === true) {
          ret = item;
          return false;
        }
      });

      return ret;
    },

    /**
     * 在集合中逐项查找，返回满足条件的所有结果
     * @param  {function}     condition     条件
     * @param  {Object}       scope         上下文（可选）
     */
    filter: function(condition, scope) {
      var me = this,
        ret = [];

      me.each(function(item) {
        if (condition.apply(scope || item, arguments) === true) {
          ret.push(item);
        }
      });

      return ret;
    },

    /**
     * 集合中是否每一项都满足条件
     * @param  {function}     condition     条件
     * @param  {Object}       scope         上下文（可选）
     */
    every: function(condition, scope) {
      var me = this,
        ret = true;

      me.each(function(item) {
        if (!condition.apply(scope || item, arguments)) {
          ret = false;
          return false;
        }
      });

      return ret;
    },

    /**
     * 集合中是否部分项满足条件
     * @param  {function}     condition     条件
     * @param  {Object}       scope         上下文（可选）
     */
    some: function(condition, scope) {
      var me = this,
        ret = false;

      me.each(function(item) {
        if (condition.apply(scope || item, arguments) === true) {
          ret = true;
          return false;
        }
      });

      return ret;
    },

    /**
     * 判断集合中是否包含该项
     * @param  {Object}       item            需要判断的元素
     */
    contains: function(item) {
      var me = this,
        ret = false;

      me.each(function(i) {
        if (i === item) {
          ret = true;
          return false;
        }
      });

      return ret;
    },

    /**
     * 在集合中的每一项上调用方法
     * @param  {string|function}         method          方法名称
     */
    invoke: function(method) {
      var me = this,
        params = array_slice.call(arguments, 1),
        isFunction = typeof method === 'function';

      return me.map(function(item) {
        var _method = isFunction ? method : item[method];

        return _method.apply(item, params);
      });
    },

    /**
     * 获取在集合中的每一项上的属性值
     * @param  {string}                   iterator          属性名
     */
    pluck: function(iterator) {
      iterator = typeof iterator == 'function' ?
        iterator : io.extractor(iterator);

      return this.map(function(item) {
        return iterator(item);
      });
    }
  });

  return Enumberable;
})