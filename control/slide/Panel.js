/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-25 21:20:33
 * @description 轮播插件
 */
define([
  'azure/core',
  'azure/ClassFactory',
  'azure/Container',
  'azure/control/slide/Item',
  'azure/collection/List',
  'azure/control/slide/effect/hSlide',
  'azure/control/slide/effect/none',
  'azure/control/slide/effect/fade',
  'azure/control/slide/effect/accordion'
], function(io, ClassFactory, Container, Item, List, hSlide, none, fade, accordion) {

  var animateWrapTemp = '<div style="position:absolute;"></div>',
    array_push = Array.prototype.push,
    Slide, effects;

  Slide = ClassFactory.define('Slide', Container, {

    defaultType: Item,

    /**
     * 默认帧切换的特效
     * @type {String}
     *
     * none:无特效
     * fade:渐隐
     * hSlide:水平切换
     * vSlide:垂直切换
     */
    effect: 'none',

    /**
     * 默认激活帧的索引
     * @type {Number}
     */
    activeIndex: 0,

    /**
     * 帧切换的速度
     * @type {Number}
     */
    speed: 600,


    /**
     * 帧切换的时间间隔
     * @type {Number}
     */
    timeout: 3000,

    /**
     * 滑块窗口的跨度，比如滑块中包含2帧，则指定为2
     * @type {Number}
     */
    colspan: 1,

    /**
     * 鼠标悬停在面板上是否停止自动播放
     * @type {Boolean}
     */
    hoverStop: true,

    /**
     * 是否开启跑马灯效果
     * @type {Boolean}
     */
    carousel: false,

    /**
     * 屏幕是否根据控件的宽度改变重新渲染尺寸，默认为false
     * 主要在组件定宽高的场景中,保证尺寸正常
     * @type {Boolean}
     */
    autoFixedWidth: false,

    /**
     * 屏幕是否根据控件的高度改变重新渲染尺寸，默认为false
     * 主要在组件定宽高的场景中,保证尺寸正常
     * @type {Boolean}
     */
    autoFixedHeight: false,

    /**
     * 如果是百分比设置容器的宽度的话，
     * 需要指定这个函数，返回一个宽度值，
     * 动态的得到可变化的宽度,默认为false
     *
     *
     *  var slide = new Slide({
     *     autoWidth:function(){
     *       return document.body.offsetWidth;
     *     }
     *  });
     *
     *
     * @type {Function}
     */
    adaptiveWidth: false,

    /**
     * 同上
     * @type {Function}
     */
    adaptiveHeight: false,

    /**
     * 是否自动播放
     * @type {Boolean}
     */
    autoSlide: false,

    /**
     * @private 是否需要一个动画容器
     * @type {Boolean}
     */
    needAnimateContainer: false,

    animWrapperAutoHeightSetting: true,

    /**
     * 当effect为according时 子元素折叠后的宽度
     * @type {Number}
     */
    collapseWidth:45,


    /**
     * 切换时候的时间函数
     * 默认为easeInOutQuint
     *
     * 'easeInCubic':    'cubic-bezier(.550,.055,.675,.190)',
     * 'easeOutCubic':   'cubic-bezier(.215,.61,.355,1)',
     * 'easeInOutCubic': 'cubic-bezier(.645,.045,.355,1)',
     * 'easeInCirc':     'cubic-bezier(.6,.04,.98,.335)',
     * 'easeOutCirc':    'cubic-bezier(.075,.82,.165,1)',
     * 'easeInOutCirc':  'cubic-bezier(.785,.135,.15,.86)',
     * 'easeInExpo':     'cubic-bezier(.95,.05,.795,.035)',
     * 'easeOutExpo':    'cubic-bezier(.19,1,.22,1)',
     * 'easeInOutExpo':  'cubic-bezier(1,0,0,1)',
     * 'easeInQuad':     'cubic-bezier(.55,.085,.68,.53)',
     * 'easeOutQuad':    'cubic-bezier(.25,.46,.45,.94)',
     * 'easeInOutQuad':  'cubic-bezier(.455,.03,.515,.955)',
     * 'easeInQuart':    'cubic-bezier(.895,.03,.685,.22)',
     * 'easeOutQuart':   'cubic-bezier(.165,.84,.44,1)',
     * 'easeInOutQuart': 'cubic-bezier(.77,0,.175,1)',
     * 'easeInQuint':    'cubic-bezier(.755,.05,.855,.06)',
     * 'easeOutQuint':   'cubic-bezier(.23,1,.32,1)',
     * 'easeInOutQuint': 'cubic-bezier(.86,0,.07,1)',
     * 'easeInSine':     'cubic-bezier(.47,0,.745,.715)',
     * 'easeOutSine':    'cubic-bezier(.39,.575,.565,1)',
     * 'easeInOutSine':  'cubic-bezier(.445,.05,.55,.95)',
     * 'easeInBack':     'cubic-bezier(.6,-.28,.735,.045)',
     * 'easeOutBack':    'cubic-bezier(.175, .885,.32,1.275)',
     * 'easeInOutBack':  'cubic-bezier(.68,-.55,.265,1.55)'
     *
     * @type {String}
     */
    timingFunction: undefined,

    /**
     * 重写初始化组件
     */
    initComponent: function() {
      var me = this;

      me.callParent(arguments);

      //如果效果为字符串
      //转换为特效对象
      if (io.isString(me.effect)) {
        me.effect = Slide.effect[me.effect];
      }

      if (!me.effect) {
        me.effect = Slide.effect['none'];
      }

      //特效初始化
      if (me.effect.init) {
        me.effect.init.apply(me);
      }
    },

    /**
     * 重新onRender
     */
    onRender: function() {
      var me = this,
        colspan;

      me.callParent(arguments);

      //初始化所有帧
      me.initAllFrames();



      if (me.activeIndex != undefined) {
        colspan = me.carousel ? me.colspan : 0;
        me.activeIndex = (me.activeIndex + colspan) % me.all.length;
      }

      //prepare
      if (me.effect.prepare) {
        me.effect.prepare.call(me);
      }

      //调整容器尺寸
      me.fixSlideSize(me.carousel ? me.activeIndex - me.colspan : me.activeIndex);
    },

    /**
     * 重写获取内容容器
     */
    getAnimateWrap: function() {
      var me = this,
        contentEl = me.getContentEl();

      if (me.needAnimateContainer) {

        if (me.animateWrap) {
          return me.animateWrap;
        }

        return me.animateWrap = $(animateWrapTemp).appendTo(contentEl)
      }

      return contentEl || me.el;
    },

    /**
     * 初始化所有帧
     */
    initAllFrames: function() {
      var me = this,
        all = [],
        animateWrap = me.getAnimateWrap(),
        items, prefix, suffix;

      //如果开启了旋转木马效果
      if (me.carousel) {
        items = me.items;

        //复制起结束位置步长个数的元素
        prefix = $.map(
          items.slice(items.count() - me.colspan),
          cloneItemElem);

        suffix = $.map(
          items.slice(0, me.colspan),
          cloneItemElem);
      }


      //将所有子元素的DOM元素组合成一个数组
      $.each([].concat(prefix, me.items.items, suffix),

        function(_, item) {

          if (item == undefined) {
            return;
          }

          all.push(item instanceof Item ?
            item.el[0] : item[0]);
        });

      //将DOM元素为一个jQ对象
      me.all = $.merge(new jQuery.fn.init(), all)
        .appendTo(animateWrap);
    },

    /**
     * 重写 afterRender
     * 添加自动播放
     */
    afterRender: function() {
      var me = this;

      me.callParent(arguments);

      if (me.autoSlide) {
        me.play();
      }
    },

    /**
     * 判断当前帧是否为最后一帧
     */
    isEndFrame: function() {
      var me = this;
      return me.activeIndex == me.all.length - (me.colspan - 1) - 1;
    },
    /**
     * 判断当前帧是否为第一帧
     */
    isStartFrame: function() {
      var me = this;
      return me.activeIndex == 0;
    },

    /**
     * 播放下一帧
     */
    next: function(callback) {
      var me = this,
        effect = me.effect,
        index, lastIndex;

      if (me.switching) {
        return;
      }

      index = me.activeIndex + 1;
      //最后一帧的索引
      lastIndex = me.all.length - me.colspan + 1;


      //把现实折叠  回到梦开始的地方
      if (index >= lastIndex) {
        index = index % lastIndex;
      }

      if (
        me.carousel && //如果开启了跑马灯效果
        me.isEndFrame() //且当前帧为最后一帧
      ) {

        //调整跑马灯到第一帧的位置
        if (effect.jumpTo) {
          effect.jumpTo.call(me, me.colspan);
        }
        me.activeIndex = me.colspan;

        return me.next(callback);
      }

      me.active(index, callback);
      return me;
    },

    /**
     * 播放上一帧
     */
    previous: function(callback) {
      var me = this,
        index, lastIndex, effect;

      //播放中
      if (me.switching) {
        return me;
      }

      effect = me.effect;
      index = me.activeIndex + me.all.length - 1 - (me.colspan - 1);
      lastIndex = me.all.length - me.colspan + 1;

      //把现实折叠  回到梦开始的地方
      if (index >= lastIndex) {
        index = index % lastIndex;
      }

      if (me.carousel && //如果开启了跑马灯效果
        me.isStartFrame() //且当前帧为第一帧
      ) {

        if (effect.jumpTo) {
          //移至最后一帧的前面         all中最后一帧的索引-colspan*2+1
          effect.jumpTo.call(me, me.all.length - 1 - me.colspan * 2 + 1);
        }

        me.activeIndex = me.all.length - 1 - me.colspan * 2 + 1;

        return me.previous(callback);
      }

      me.active(index, callback);
    },

    /**
     * 激活某个位置的帧
     * @param  {Number}                   index           帧的真实索引 0,1,2,3,4....
     * @param  {Function|Boolean}         callback        当为布尔值的时候为
     */
    active: function(index, callback) {
      var me = this,
        effect = me.effect,
        len, activeIndex, lastActiveIndex,
        doEffct;


      //折叠掉多余的
      if (index >= me.all.length) {
        index = index % me.all.length;
      }

      //如果索引未改变
      //不做任何处理
      if (index == me.activeIndex || me.switching) {
        return me;
      }

      //如果当处于自动切换状态
      if (me.autoSlide && me.stoped === false) {
        me.stop().play();
      }

      //如果动画正在运行中
      //紧急制动
      if (me.animator) {
        me.animator.stop();
        me.animator = null;
      }

      //是否执行动画效果
      if (io.isBoolean(callback)) {

        doEffct = callback;
        callback = undefined;

      } else {
        doEffct = doEffct == undefined ? true : doEffct;
      }


      //计算真实索引
      len = me.items.count();
      activeIndex = (index - me.colspan + len) % len;
      lastActiveIndex = (me.activeIndex - me.colspan + len) % len;


      me.fixSlideSize(activeIndex);

      // 调用自身接口
      if (me.onBeforeActive(activeIndex, lastActiveIndex, doEffct)) {

        //调用效果的切换方式
        effect.active.call(me, index, doEffct, function() {

          me.onAfterActive(activeIndex, lastActiveIndex, doEffct);

          if (callback) {
            callback(me, activeIndex, lastActiveIndex, doEffct);
          }

        });

        //更改激活帧索引
        me.activeIndex = index;

        me.emit('activate', me, activeIndex);
        me.emit('activatechange',
          me,
          me.items.get(activeIndex),
          me.items.get(lastActiveIndex));
      }



    },

    /**
     * 切换前的接口 返回false可停止切换
     */
    onBeforeActive: function(activeIndex, lastActiveIndex, doEffct) {
      var me = this,
        effect = me.effect;

      me.switching = true;

      //触发beforeactive事件
      return me.emit('beforeactive',
          me, activeIndex, lastActiveIndex, doEffct) === false ||

        //特效预处理
        (!effect.onBeforeActive ||
          effect.onBeforeActive(
            me, activeIndex, lastActiveIndex, doEffct) === false);
    },

    /**
     * 切换后的接口 返回false可停止切换
     */
    onAfterActive: function(activeIndex, lastActiveIndex, doEffct) {
      var me = this;

      me.switching = false;
      //触发afterActive事件
      me.emit('afteractive', me, activeIndex, lastActiveIndex, doEffct);
    },

    /**
     * 开始播放
     */
    play: function() {
      var me = this;

      //如果定时器存在
      //消除
      if (me.timer !== null) {
        clearTimeout(me.timer);
      }

      //设置定时器
      me.timer = setTimeout(function() {
        me.next().play();
      }, Number(me.timeout));

      me.stoped = false;
      return me;
    },

    /**
     * 停止播放
     */
    stop: function() {
      var me = this;

      clearTimeout(me.timer);
      self.timer = null;
      self.stoped = true;
      return me;
    },

    /**
     * 获取当前激活帧
     */
    getActiveItem: function() {
      var me = this,
        index = me.getActiveIndex();
      return me.items.get(index);
    },

    /**
     * 获取激活帧的索引
     */
    getActiveIndex: function() {
      var me = this,
        len = me.all.length;
      return (me.activeIndex - me.colspan + len) % len;
    },

    /**
     * 根据配置条件修正控件尺寸
     * 重新渲染slide的尺寸，
     */
    fixSlideSize: function(index) {
      var me = this;

      if (me.autoFixedWidth) {
        me.adjustFrameWidth();
      }

      if (me.autoFixedHeight) {
        me.adjustFrameHeight();
      }

      me.restSlideSize(index);
    },

    /**
     * 调整每一帧的宽度
     * 使其等于容器的内部宽度
     */
    adjustFrameWidth: function() {
      var me = this,
        effect = me.effect,
        contentElWidth = me.getContentEl().innerWidth();

      if (effect.adjustFrameWidth) {
        effect.adjustFrameWidth.call(me, contentElWidth);
      };
    },

    /**
     * 调整每一帧的高度
     * 使其等于容器的内部高度
     */
    adjustFrameHeight: function() {
      var me = this,
        effect = me.effect,
        contentElHeight = me.getContentEl().innerHeight();

      if (effect.adjustFrameHeight) {
        effect.adjustFrameHeight.call(me, contentElHeight);
      }
    },

    restSlideSize: function(index) {
      var me = this,
        effect = me.effect;

      if (index == undefined) {
        index = self.currentTab;
      }

      if (effect.restSlideSize) {
        effect.restSlideSize.call(me, index);
      }
    }
  });

  /*特效钩子*/
  Slide.effect = effects = {};

  $.each({
    'hSlide': hSlide,
    'none': none,
    'fade': fade,
    'accordion': accordion
  }, function(type, item) {
    effects[type] = item;
  });


  /**
   * 复制SlideItem控件的dom
   */
  function cloneItemElem(o) {
    return o.el.clone();
  }

  function getItemElemDom(item) {
    return item.el[0];
  }

  return Slide;
})