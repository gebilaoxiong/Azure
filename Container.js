/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-22 14:06:37
 * @description 容器组件
 */
define([
  'azure/core',
  'azure/ClassFactory',
  'azure/Component',
  'azure/collection/MixedCollection',
  'azure/ComponentManager'
], function(io, ClassFactory, Component, MixedCollection, ComponentManager) {
  var Container;

  Container = ClassFactory.define('Container', Component, {

    /**
     * 当子控件从容器中移除的时候是否自动销毁
     * @type {Boolean}
     */
    autoDestroy: true,

    /**
     * 默认子控件类型
     * @type {Class}
     */
    defaultType: undefined,

    /**
     * 子控件默认参数
     */
    defaults: undefined,

    /**
     * 重写初始化控件
     * 初始化子控件集合
     */
    initComponent: function() {
      var me = this,
        items, itmCfgArray;

      me.callParent(arguments);

      //添加子元素
      if (me.items) {
        items = me.items;
        delete me.items;

        //选择符
        if (io.isString(items)) {

          itmCfgArray = [];

          $(items).each(function(_, elem) {
            itmCfgArray.push({
              applyTo: elem
            });
          });

          items = itmCfgArray;
        }


        me.add(items);
      }

    },

    onRender: function() {
      var me = this;

      me.callParent(arguments);

      if (me.contentEl) {
        me.contentEl = io.get(me.contentEl);
      }
    },

    afterRender: function() {
      var me = this;

      me.callParent(arguments);
      me.doLayout();
    },

    /**
     * 向容器中添加子控件
     * @param {Component}               cmp               子控件
     */
    add: function(cmp) {
      var me = this,
        i, item, isMulti,
        ret, index;

      me.initItems();

      //添加多个元素
      if ((isMulti = arguments.length > 1) || io.isArray(cmp)) {
        ret = [];

        $.each(isMulti ? arguments : cmp, function(_, item) {
          ret.push(me.add(item));
        });

        return ret;
      }

      //确认子控件被初始化
      cmp = me.lookupComponent(me.applyDefaults(cmp));
      index = me.items.length;


      //如果事件和接口都未阻止添加
      if (
        cmp &&
        me.emit('beforeadd', me, cmp, index) !== false &&
        me.onBeforeAdd(cmp) !== false
      ) {
        me.items.add(cmp);
        cmp.onAdded(me, index);
        me.onAdd(cmp);
        //触发添加事件
        me.emit('add', me, cmp, index);
      }

      return cmp;
    },

    /**
     * 初始化子元素结合
     */
    initItems: function() {
      var me = this;
      //首次初始化
      if (!me.items) {
        me.items = new MixedCollection(getId);
      }
    },

    /**
     * 添加前接口
     * @param {Component}               cmp               子控件
     */
    onBeforeAdd: function(cmp) {
      //如果已存在在其他容器中
      //从其他容器中删除
      if (cmp.ownerCt) {
        cmp.ownerCt.remove(cmp, false);
      }
    },

    /**
     * 确认子控件已实例化
     * @param {Component}               cmp               子控件
     */
    lookupComponent: function(cmp) {
      var me = this,
        ret = cmp;

      //id
      if (io.isString(cmp)) {
        ret = ComponentManager.get(cmp);
      } else if ($.isPlainObject(cmp)) {
        ret = me.createComponet(cmp);
      }
      return ret;
    },

    /**
     * 实例化控件
     * @param  {object}             config              配置对象
     * @param  {Class}              defaultType         默认类型
     */
    createComponet: function(config, defaultType) {
      var me = this,
        cmp;

      //配置对象为控件实例
      if (config.render) {
        return config;
      }

      cmp = ClassFactory.create($.extend({
        ownerCt: me
      }, config), defaultType || me.defaultType);


      delete cmp.initConfig.ownerCt;
      delete cmp.ownerCt;
      return cmp;
    },

    applyDefaults: function(cmp) {
      var me = this,
        defaults = me.defaults;

      if (!defaults) {
        return cmp;
      }

      //id
      if (io.isString(cmp)) {
        cmp = ComponentManager.get(cmp);
        $.extend(cmp, defaults);
      }
      //配置对象
      //已实例化控件
      else {
        $.extend(cmp, defaults);
      }

      return cmp;
    },

    /**
     * 将子控件从容器中移除
     * @param  {Componet}             cmp               子控件
     * @param  {Boolen}               autoDestroy       是否在移除的时候销毁子控件
     */
    remove: function(cmp, autoDestroy) {
      var me = this;

      me.initItems();

      cmp = me.getComponent(cmp);

      if (cmp && me.emit('beforeremove', me, cmp) !== false) {
        me.doRemove(cmp, autoDestroy);
        me.emit('remove', me, cmp);
      }
      return cmp;
    },

    doRemove: function(cmp, autoDestroy) {
      var me = this;

      me.items.remove(cmp);
      cmp.onRemoved();
      this.onRemove(cmp);

      //自动销毁
      if (autoDestroy === true || (autoDestroy !== false && me.autoDestroy)) {
        cmp.destroy();
      }
    },

    /**
     * 获取子控件
     * @param  {string|Component} cmp 子控件
     */
    getComponent: function(cmp) {
      if (io.isObject(cmp)) {
        cmp = cmp.id;
      }

      return this.items.get(cmp);
    },



    /**
     * 当子控件添加到其中时调用的接口
     *
     * @param {Component}               cmp               子控件
     */
    onAdd: io.noop,

    /**
     * 当子控件移除容器的调用的接口
     * @param {Component}               cmp               子控件
     */
    onRemove: io.noop,

    /**
     * 重写销毁前接口
     */
    beforeDestroy: function() {
      var me = this,
        items = me.items,
        cmp;

      if (me.items) {
        while (cmp = items.first()) {
          me.remove(cmp);
        }
      }

      me.callParent(arguments);
    },

    item: function(index) {
      return this.items.get(index);
    },

    getContentEl: function() {
      var me = this;
      return me.contentEl || me.el;
    },

    doLayout: io.noop

  });

  /**
   * 获取组件的ID
   * @param {Component}                 cmp               子控件
   */
  function getId(cmp) {
    return cmp.id;
  }

  return Container;
})