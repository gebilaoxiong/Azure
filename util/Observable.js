/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-03 20:33:57
 * @description
 */
define([
  'azure/core',
  'azure/Abstract',
  'azure/ClassFactory'
], function(io, Abstract, ClassFactory) {

  var Observable,

    array_shift = Array.prototype.shift,

    array_slice = Array.prototype.slice;

  Observable = ClassFactory.define('Observable', Abstract, {

    /**
     * 初始化
     */
    init: function() {
      var me = this,
        listener;

      //如果在初始化中绑定了事件
      if (me.listener) {
        listener = me.listener;
        delete me.listener;
      }

      me.listener = {};

      if (listener) {
        me.bind(listener);
      }

    },

    /**
     * 绑定事件
     * @param  {String}           eventName             事件名称
     * @param  {Object}           scope                 上线文（可选）
     * @param  {Boolean}          once                  是否只执行一次
     * @param  {function}         handler               事件处理函数
     *
     * @example
     * 一、
     * obj.bind('click',context,func);
     * obj.bind('click',func);
     *
     * 二、
     * obj.bind({
     *   'click':func1,
     *   'render':func2,
     *   'scope':context
     * })
     */
    bind: function(eventName, scope, once, func) {
      var me = this,
        listener = me.listener,
        event, eventObject, eventCache,
        handler, uuid;

      //已销毁
      if (me.isDestroyed) {
        return me;
      }

      //例2的情景
      if (io.isObject(eventName)) {
        scope = eventName.scope;
        delete eventName.scope;

        for (event in eventName) {
          me.bind(event, scope, eventName.once, eventName[event]);
        }

        return me;
      }

      //整理参数
      //没有传入上下文
      if (io.isFunction(scope)) {
        func = once;
        once = scope;
        scope = null;
      }

      if (io.isFunction(once)) {
        func = once;
        once = null;
      }

      if (!func) {
        return me;
      }

      //给委托函数加上uuid
      if (func.uuid == null) {
        uuid = io.uuid(func);
      }

      //如果该事件处理函数只调用一次
      if (once) {
        handler = function() {
          var ret;
          ret = func.apply(this, arguments);
          me.unbind(eventName, scope, func);
          return ret;
        }
        handler.uuid = uuid;
      } else {
        handler = func;
      }

      eventObject = {
        event: eventName,
        scope: scope || me,
        handler: handler,
        uuid: uuid
      };

      if (!(eventCache = listener[eventName])) {
        listener[eventName] = eventCache = [];
      }

      eventCache.push(eventObject);
      return me;
    },

    /**
     * 触发事件
     * @param  {String}           eventName             事件名称
     *
     * @example
     * obj.emit('render',me);
     */
    emit: function() {
      var me = this,
        i = 0,
        eventName, params, eventCache,
        ret, eventObject;

      if (me.isDestroyed) {
        return;
      }

      params = arguments;
      eventName = array_shift.call(params);
      eventCache = me.listener[eventName];

      if (!eventCache) {
        return ret;
      }

      while (eventObject = eventCache[i++]) {
        ret = eventObject.handler.apply(eventObject.scope || me, params) === false || ret;

        //已销毁停止迭代
        if (me.isDestroyed) {
          break;
        }
      }

      return !ret;
    },

    /**
     * 解除事件
     * @param  {String}           eventName             事件名称
     * @param  {Object}           scope                 上线文（可选）
     * @param  {function}         handler               事件处理函数
     *
     * @example
     * 一、
     * obj.unbind('click',context,func);
     * obj.unbind('click',func);
     *
     * 二、
     * obj.unbind({
     *   'click':func1,
     *   'render':func2,
     *   'scope':context
     * })
     */
    unbind: function(eventName, scope, handler) {
      var me = this,
        listener = me.listener,
        event, eventCache, i,
        len, eventObject;

      //解除所有已绑定的事件
      if (!arguments.length) {
        for (eventName in listener) {
          listener[eventName].length = 0;
          delete listener[eventName];
        }
        return me;
      }

      //解除情景二
      if (io.isObject(eventName)) {
        scope = eventName.scope;
        delete eventName.scope;

        for (event in eventName) {
          me.unbind(event, scope, eventName[event]);
        }

        return me;
      }

      if (io.isFunction(scope)) {
        func = scope;
        scope = undefined;
      }

      eventCache = listener[eventName];

      for (i = 0, len = eventCache.length; i < len; i++) {
        eventObject = eventCache[i];

        if (
          //uuid匹配
          (!eventObject.uuid || eventObject.uuid === handler.uuid) &&
          //上下文匹配
          (!eventObject.scope || eventObject.scope === scope)
        ) {
          eventCache.splice(i--, 1);
          len--;
        }

      }

      //没有订阅的函数
      if (len === 0) {
        delete listener[eventName];
      }

      return me;
    }

    
  });

  return Observable;
})