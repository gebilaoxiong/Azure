/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-22 21:58:54
 * @description 带有缓存键的列表
 */
define([
  'azure/core',
  'azure/ClassFactory',
  'azure/collection/List'
], function(io,ClassFactory, List) {

  var MixedCollection;

  MixedCollection = ClassFactory.define('MixedCollection', List, {

    /**
     * 重写初始化
     * @param  {Object}             config          配置对象
     * @param  {Function|String}    key             键值
     */
    init: function(config, key) {
      var me = this,
        type = $.type(config);

      //整理参数
      if (type === 'function' || type === 'string') {
        key = config;
        config = undefined;
      }

      //键值萃取器
      if (!me.getKey) {
        me.getKey = typeof key === 'function' ? key : io.extractor(key);
      }

      //缓存
      me.cache = {};
      me.callParent(arguments);
    },

    onAdd: function(item) {
      var me = this,
        key;

      key = me.getKey(item);
      me.cache[key] = item;
    },

    onRemove: function(item) {
      var me = this,
        key;

      key = me.getKey(item);
      delete me.cache[key];
    },

    getBy: function(key) {
      return this.cache[key];
    },

    destroy: function() {
      var me = this;

      delete me.cache;
      me.callParent(arguments);
    }
  });

  return MixedCollection;
});