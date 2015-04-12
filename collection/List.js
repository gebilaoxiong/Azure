/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-22 19:08:40
 * @description 列表对象
 */
define([
  'azure/core',
  'azure/ClassFactory',
  'azure/collection/Enumerable'
], function(io,ClassFactory, Enumerable) {
  var array_slice = Array.prototype.slice,
    proto, List;

  proto = {

    init: function(config) {
      var me = this,
        items;

      //整理参数
      if (io.isArray(config)) {
        config = {
          items: config
        };
      }

      $.extend(me, config);

      me.callParent(arguments);

      if (items = me.items) {
        delete me.items;
        me.add.apply(me, items);
      }
    },

    /**
     * 迭代集合中的每一项
     * @param  {function}     iterator      迭代函数
     * @param  {Object}       scope         上下文（可选）
     */
    each: function(iterator, scope) {
      var me = this,
        items = me.items,
        i, len, item;

      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        if (iterator.call(scope || item, item, i, me));
      }

      return me;
    },

    /**
     * 映射
     * @param  {function}     func      迭代函数
     */
    map: function(func) {
      var items = this.items,
        ret = new List(),
        i, len;

      for (i = 0, len = items.length; i < len; i++) {
        ret.add(func(items[i], i, this));
      }

      return ret;
    },

    /**
     * 向集合中添加元素
     */
    add: function() {
      var me = this,
        args = arguments,
        items = me.items,
        item, i, len;

      if (!items) {
        me.items = items = [];
      }

      for (i = 0, len = args.length; i < len; i++) {
        item = args[i];
        //调用onAdd接口
        me.onAdd(item, items.length);
        me.items.push(item);
      }

      me.emit('datachange', me);

      return me;
    },

    /**
     * 将数据插入到列表中的某个位置
     * @param  {index}                  index           索引
     * @param  {Mixed}                  item            需要添加的元素
     */
    insert: function(index) {
      var me = this,
        args = array_slice.call(arguments, 1),
        i, len, item;

      for (i = 0, len = args.length; i < len; i++) {
        item = args[i];
        //调用onAdd接口
        me.onAdd(item, i);
        me.items.splice(index + i, 0, item);
      }

      me.emit('datachange', me);

      return me;
    },

    /**
     * 当元素添加到集合中的接口
     * @type {[type]}
     */
    onAdd: io.noop,

    /**
     * 从集合中删除符合条件的元素
     * @param  {Function|item}          where          条件
     */
    remove: function(where) {
      var me = this,
        items = me.items,
        condition, i, len,
        item;

      condition = typeof where == 'function' ?
        condition : function(item) {
          return item === where;
      };

      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];

        if (condition(item, i, me) === true) {
          me.onRemove(item, i);
          items.splice(i, 1);
          i--;
          len--;
        }
      }

      me.emit('datachange', me);
      return me;
    },

    onRemove: io.noop,

    /**
     * 获取某个元素的索引
     * @param  {Object}               item              元素
     */
    indexOf: function(item) {
      var items = this.items,
        ret = -1,
        i, len;

      for (i = 0, len = items.length; i < len; i++) {
        if (items[i] === item) {
          ret = i;
        }
      }

      return ret;
    },

    /**
     * 获取索引位置的元素
     * @param  {int}                  index               索引位置
     */
    get: function(index) {
      return this.items[index];
    },

    first: function() {
      return this.items[0];
    },

    /**
     * 判断符合条件的元素个数
     * @param  {function}               condition         条件(可选)
     */
    count: function(condition) {
      var me = this,
        items = me.items,
        ret, i, len;


      //返回当前元素数量
      if (!condition) {
        return items.length;
      }

      ret = 0;
      for (i = 0, len = items.length; i < len; i++) {
        if (condition(items[i], i, me) === true) {
          ret++;
        }
      }
      return ret;
    },

    /**
     * 销毁
     */
    destroy: function() {
      var me = this;

      me.items.length = 0;
      delete me.items;
    },

    slice: function() {
      var items = this.items;

      return items.slice.apply(items, arguments);
    }
  };

  List = ClassFactory.define('List', Enumerable, proto);
  return List;
});