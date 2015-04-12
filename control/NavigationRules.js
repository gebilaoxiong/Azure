/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-09-16 23:23:44
 * @description 导航规则
 */
define([
  'azure/ClassFactory',
  'azure/util/Observable',
  'azure/core'
], function(ClassFactory, Observable, io) {

  var NavigationRule,

    //是否是静态页面
    isStaticPage = location.protocol === 'file:';

  NavigationRule = ClassFactory.define('NavigationRule', Observable, {

    /*默认的激活 className*/
    activeCls: 'active',

    /*本地根目录 只有在静态页面中 此参数才会生效*/
    staticRoot: '',

    /*匹配规则*/
    rules: undefined,

    /**
     * 初始化函数
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    init: function(options) {
      var me = this;

      $.extend(me, options);

      if (!me.rules) {
        me.rules = [];
      }
    },

    /**
     * 注册规则
     * @param  {String|RegExp}              rule            路由规则
     * @param  {String|function}            selector        选择器
     * @param  {String}                     activeCls       激活的class(可选)
     * @param  {Boolean}                    isStrict        是否完全匹配(默认为true)
     * @example
     *
     * 1.navRules.register('/a/1.html','.navList li:eq(1)');
     *
     * 2.navRules.register({
     *   rule:'/a/1.html',
     *   selector:'.navList li:eq(1)',
     *   activeCls:'active',
     *   isStrict:true
     * });
     */
    register: function(rule, selector, /*optional*/ activeCls, isStrict) {

      var me = this,
        ruleType = $.type(rule);

      if (rule == null) {
        return me;
      }

      //方法2的传参方式
      if (ruleType === 'object') {
        return me.register(rule.rule, rule.selector, rule.activeCls, rule.isStrict);
      }

      //参数整理
      if ($.type(activeCls) === 'boolean') {
        isStrict = activeCls;
        activeCls = undefined;
      }

      //默认的cls
      if (activeCls == null) {
        activeCls = me.activeCls;
      }

      //如果规则为正则表达式
      if (ruleType === 'string') {
        rule = isStrict === true ?
          new RegExp('^' + io.enscapeRegExp(rule) + '$') :
          new RegExp('^' + io.enscapeRegExp(rule));
      }

      rule.selector = selector;
      rule.activeCls = activeCls;

      me.rules.push(rule);

      return me;
    },

    /**
     * 匹配路径
     * @param  {string}       pathname        路径(可选)
     */
    match: function( /*optional*/ pathname) {
      var me = this,
        i = 0,
        rules = me.rules,
        rule, type, $elem;

      pathname = pathname || me.getCurrentPath();

      while (rule = rules[i++]) {
        rule.lastIndex = 0;

        //如果规则能够匹配
        if (rule.test(pathname)) {
          //类型判定
          type = $.type(rule.activeCls);

          if (type === 'string') {

            $(rule.selector).addClass(rule.activeCls, pathname)

          } else if (type === 'function') {

            rule.activeCls(rule.activeCls);
          }
        }
      }
    },

    getCurrentPath: function() {
      var me = this,
        pathname = isStaticPage ? me.getLocalPathName() : location.pathname;

      return String(location.href).substring(pathname.length);
    },

    /**
     * 获取路径名称
     */
    getLocalPathName: function() {
      var me = this;

      return [
        location.protocol,
        '\/\/\/',
        me.staticRoot
      ].join('');
    }

  });

  return NavigationRule;
});