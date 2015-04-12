/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-07-23 17:09:05
 * @description 数据仓库(Queen 的Store超级简化版:只包含读取操作 和数据格式的映射操作)
 *
 * 主要事件
 *         beforerequest                                  执行请求前
 *         beforeload                                     执行读取数据前
 *         requestcomplete                                请求完成
 *         loadsuccess                                    请求成功
 *         datachange                                     数据发生变更
 *         loadfailure                                    请求失败
 *
 *
 */
define([
  'azure',
  'azure/ClassFactory',
  'azure/util/Observable'
], function(io,ClassFactory, Observable) {
  var Store,

    dot = '.',

    rdot = new RegExp('\\' + dot);

  Store = ClassFactory.define('Store',Observable, {

    /*记录的根在返回对象中的属性名*/
    root: 'data',

    /**
     * 一个包含url和method的字典
     * @type {Object}
     * @example
     * {
     *   操作名称:{url:'路径',method:'请求方式'},
     *
     *   read:{url:'xxxxx',method:'GET'},
     *
     *   remove:{url:'xxxxx',method:'POST'}
     * }
     */
    api: undefined,

    /**
     * 基本参数 每次都将随请求一起发送
     * @type {Object}
     * @example  默认按timespan的降序排列
     * {
     *   sort:[{property:'timespan',direction:'DESC'}]
     * }
     */
    baseParams: undefined,

    /**
     * 记录的字段
     * @type {Array}
     * @example
     * [{
     *   name:'username',
     *   mapping:'username'
     * },{
     *   name:'password',
     *   mapping:'password'
     * },{
     *   name:'address',
     *   mapping:'info.address'
     * }]
     */
    fileds: undefined,

    /**
     * 当为boolean值的时候代表是否开启自动加载，
     * 如果为object为load操作的参数
     * @type {Boolean||Object}
     */
    autoLoad: undefined,

    /**
     * 是否自动取消前一个加载操作
     */
    autoAbort: false,

    /**
     * 是否取消前一个加载操作的时候不触发相应操作的失败事件
     * @type {Boolean}
     */
    silentAbort: true,

    /**
     * 是否在控件销毁的时候自动销毁
     * @type {Boolean}
     */
    autoDestroy: false,

    meta: {
      success: 'success',
      total: 'total'
    },

    /*初始化*/
    init: function(config) {
      var me = this;

      //用配置覆盖默认设置
      $.extend(me, config);

      //根提取器
      if (me.root) {
        me.getRoot = io.extractor(me.root);
      }
      //默认根提取器
      else {
        me.getRoot = defaultRootExtractor;
      }

      //给每一个字段创建一个提取器
      if (me.fileds) {

        me.fileds = me.fileds.concat();

        //给mapping 带有点号的生成提取器(例如：info.address)
        $.each(me.fileds, function(_, filed) {
          var mapping = filed.mapping || filed.name;

          if (rdot.test(mapping) && !filed.convert) {
            filed.convert = io.extractor(mapping);
          }
        });

      }

      //调用Observable的init方法 
      //绑定构造函数传入的事件
      me.callParent(arguments);

      //自动加载
      if (me.autoLoad) {
        setTimeout(function() {
          me.load(me.autoLoad);
          delete me.autoLoad;
        }, 60);
      }
    },

    /**
     * 载入静态数据
     * @param  {Array}          data          静态数据
     */
    loadData: function(data) {
      var me = this;

      me.data = data;

      //触发datachange事件
      me.trigger('datachange', me.data);
    },

    /**
     * 载入数据
     * @param   {Object}         param         参数
     * @return  {Promise}        jQ的Promise对象
     */
    load: function(param) {
      var me = this,
        options;

      param = me.lastLoadParam = $.extend(me.baseParams, param);

      //ajax设置
      options = {
        data: param,
        context: me,
        cache: false,
        dataType: 'json',
        success: me.onLoadSuccess,
        error: me.onLoadFailure,
        complete: me.proccessResponse
      };

      me.data = null;

      return me.doRequest('read', options);
    },

    /**
     * 重新载入
     * @param   {Object}         param         参数（可选）
     */
    reload: function( /*optinal*/ param) {
      var me = this,
        lastLoadParam = me.lastLoadParam,
        param = $.extend({}, lastLoadParam, param);

      return me.load(lastLoadParam);
    },

    /**
     * @private 发送请求
     * @param   {String}       action          操作名称
     * @param   {Object}       options         ajax选项
     */
    doRequest: function(action, options) {
      var me = this,
        api;

      //如果已销毁不做任何操作
      if (me.isDestroyed||me.trigger('beforerequest', action, options) === false) {
        return;
      }

      if (!(api = me.api['read'])) {
        //操作对应的API不存在
        throw new Error('api: '+action + ' is not define!');
      }

      //同一时间确保只有一个线程
      if (me.locked) {
        return;
      }

      options.url = api.url;
      options.type = api.method;

      //触发action的前置事件 如：beforeload 
      //如果事件被取消（处理函数返回false）则不执行操作 
      if ( me.trigger('before' + action, options) !== false) {
        me.locked = true;
        return $.ajax(options);
      }
    },

    /**
     * @private 数据载入成功的处理函数
     * @param   {Object}             data            载入的数据
     * @param   {String}             textStatus      文字状态
     * @param   {jQXHR}              jqXHR           jQ内部的数据传输对象
     */
    onLoadSuccess: function(data, textStatus, jqXHR) {
      var me = this,
        meta = me.meta,
        root;

      //如果没有返回数据 或者 返回的数据中没有记录
      //视为失败
      if (
        data == undefined ||
        data[meta.success] !== true ||
        !(root = me.getRoot(data))
      ) {
        me.onLoadFailure(jqXHR, 'server_invalid', null);
        return;
      }

      //服务器数据总量
      me.totalCount = data[meta.totalCount];
      //格式转换
      me.data = me.buildRecords(root);


      me.trigger('requestsuccess', jqXHR.responseText, jqXHR);
      me.trigger('loadsuccess', me.data, textStatus, jqXHR);
      //触发datachange事件
      me.trigger('datachange', me.data);
    },

    /*请求失败的处理函数*/
    onLoadFailure: function(transport, textStatus, errorThrown) {
      var me = this;

      //如果xhr失败的原因是 abort 且silentAbort属性为true
      //那么不触发事件 
      if (textStatus === 'abort' && me.silentAbort) {
        return;
      }

      me.trigger('requestfailure', transport, textStatus, errorThrown);
      me.trigger('loadfailure', transport, textStatus, errorThrown);
    },

    /*处理响应*/
    proccessResponse: function(transport, textStatus) {
      var me = this;
      me.locked = false;
      this.trigger('requestcomplete', transport, textStatus);
    },

    /**
     * @private 将响应的数据转换为要求的格式
     * @param   {Array}        root                    XHR响应的数据的记录
     * @return  {Array}        返回转换的记录
     */
    buildRecords: function(root) {
      var me = this,
        fileds = me.fileds,
        record, ret = [];

      //没有数据返回空数组
      if (!root || !root.length) {
        return ret;
      }

      $.each(root, function(_, item) {
        record = {};

        $.each(fileds, function(_, filed) {
          record[filed.name] = filed.convert ?
            filed.convert(item, filed) : //如果带有提取器(例如info.address)
          item[filed.name];
        })

        ret.push(record);
      });


      return ret;
    },

    /**
     * 获取当前记录的数量
     * @return  {int}      当前记录的数量
     */
    getCount: function() {
      var data = this.data;

      return data ? data.length : 0;
    },

    /**
     * 获取服务器记录的条数
     * @return {int}        服务器记录的条数
     */
    getTotal: function() {
      return this.totalCount;
    },

    /**
     * 获取加载的数据
     * @return {Array}      加载的数据
     */
    getRecords: function() {
      return this.data || [];
    },
    /**
     * 销毁
     */
    destroy: function() {
      var me = this;

      //如果beforedestroy事件返回值为false
      //取消销毁
      if (me.trigger('beforedestroy', me) === false) {
        return;
      }

      me.isDestroyed = true;

      $.each(me.fileds, function(_, filed) {
        delete filed.convert;
      });

      //清空fileds
      me.fileds.length = 0;
      delete me.getRoot;
    }
  });

  //默认根提取器
  function defaultRootExtractor(data) {
    return data;
  }

  return Store;
})