/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-06 21:03:12
 * @description 组件基类 定义了组件的基本生命周期
 */
define([
  'azure/core',
  'azure/ClassFactory',
  'azure/util/Observable',
  'azure/ComponentManager'
], function(io,ClassFactory, Observable, ComponentManager) {
  var Component,

    uuid = 0;

  Component = ClassFactory.define('Component', Observable, {

    /**
     * 应用到某个元素上
     * @type {Selector|Element}
     */
    applyTo: undefined,

    /**
     * 呈现到某个元素中
     * @type {Selector|Element}
     */
    renderTo: undefined,

    /**
     * @private
     * 是否完成绘制
     * @type {Boolean}
     */
    rendered: false,

    /**
     * @private
     * 是否已销毁
     * @type {Boolean}
     */
    isDestroyed: false,

    /**@private
     * 初始化
     */
    init: function(config) {
      var me = this;

      config = config || {};

      if (io.isString(config)) { // element object
        config = {
          applyTo: config
        };
      }

      me.initConfig = config;

      //覆盖默认配置
      $.extend(me, config);

      //添加唯一键
      if (!me.id) {
        me.id = uuid++;
      }

      ComponentManager.register(me);

      me.initComponent.call(me);

      //如果配置了applyTo|renderTo 将自动开始绘制阶段
      if (me.applyTo) {
        me.applyToMarkup(me.applyTo);
      } else if (me.renderTo) {
        me.render(me.renderTo);
      }
    },

    /**@private
     * 配置组件
     */
    initComponent: function() {
      var me = this,
        listener;

      if (me.listener) {
        listener = me.listener;
        delete me.listener;
      }

      me.listener = {};

      if (listener) {
        me.bind(listener);
      }
    },

    applyToMarkup: function(el) {
      var me = this;

      me.allowDomMove = false;
      me.el = io.get(el);
      me.render(me.el.parentNode);
    },

    /**
     * 呈现控件
     * @param  {Mixed}              container           容器
     * @param  {int}                position            位置
     */
    render: function(container, position) {
      var me = this;
      //触发beforerender事件 
      if (me.rendered || me.emit('beforerender', me) === false) {
        return;
      }

      if (!container && me.el) {
        me.el = io.get(me.el);
        container = me.el[0].parentNode;
        //禁止移动
        me.allowDomMove = false;
      }

      //缓存container
      me.container = io.get(container);

      //标记为已呈现
      me.rendered = true;

      //获取参考位
      if (position !== undefined) {
        //poisition为子元素的索引
        position = io.isNumber(position) ? 'nth-child(' + position + ')' : position;
        position = io.find(position, me.container);
      }

      //调用绘制接口
      me.onRender(me.container, position || null);

      //class
      if (me.cls) {
        me.el.addClass(me.cls);
        delete me.cls;
      }

      //样式
      if (me.style) {
        me.el.css(me.style);
        delete me.style;
      }

      //触发 render事件
      me.emit('render', me);

      //调用afterRender接口
      me.afterRender(me.container);

      me.emit('afterrender', me);

    },

    onRender: function(container, position) {
      var me = this;

      //自动生成控件dom结构
      if (!me.el && me.autoEl) {
        me.el = io.get(me.autoEl);
      }

      if (me.el && me.allowDomMove !== false) {
        position ?
          me.el.prepend(position) :
          container.append(me.el);
      }
    },

    afterRender: io.noop,

    /**
     * 销毁控件
     */
    destroy: function() {
      var me = this;

      if (me.isDestroyed || me.emit('beforedestroy', me) === false) {
        return;
      }

      me.destroying = true;
      //销毁 dom之前的接口
      me.beforeDestroy();

      //从容器控件中删除当前组件
      if (me.ownerCt && me.ownerCt.remove) {
        me.ownerCt.remove(me, false);
      }

      /*如果已呈现*/
      if (me.rendered) {
        me.el.remove();
      }

      //销毁接口
      me.onDestroy();

      //注销控件
      ComponentManager.unregister(me);

      me.emit('destroy', me);
      //移除所有事件
      me.unbind();

      delete me.el;
      delete me.container;

      me.destroying = false;
      me.isDestroyed = true;
    },

    beforeDestroy: io.noop,

    onDestroy: io.noop,

    /**
     * 当控件被添加其他控件中时
     */
    onAdded: function(container, position) {
      var me = this;

      me.ownerCt = container;
      me.emit('added', me, container);
    },

    /**
     * 当控件被移除时
     */
    onRemoved: function() {
      var me = this;

      me.emit('removed', me, me.ownerCt);
      delete me.ownerCt;
    }
  });

  return Component;
});