/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-22 23:24:44
 * @description
 */
define(['azure/core'],function(io) {
  var cache = {};

  return {
    /**
     * 注册控件
     * @param  {string}         id          控件ID
     * @param  {Object}         cmp         控件
     */
    register: function(id, cmp) {
      if (io.isObject(id)) {
        cmp = id;
        id = cmp.id;
      }

      if (cmp == undefined) {
        return;
      }

      cache[id] = cmp;
    },

    get: function(id) {
      return cache[id];
    },

    /**
     * 反注册
     * @param  {Object}          cmp          控件
     */
    unregister: function(cmp) {
      delete cache[cmp.id];
    }
  }
})