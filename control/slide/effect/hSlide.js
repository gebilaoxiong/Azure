/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-11-01 22:22:59
 * @description 横向滚动
 */
define(['azure/util/css3Judge'], function(css3Judge) {
  var supportTransition = css3Judge.transition;

  /**
   * 初始化配置
   * @return {[type]} [description]
   */
  function init() {
    var me = this

    //需要动画容器
    me.needAnimateContainer = true;
  }

  /**
   * 绘制完dom后的预处理
   */
  function prepare() {
    var me = this,
      animateWrap = me.getAnimateWrap(),
      animateWrapWidth = me.getContentEl().width();

    //子元素浮动
    me.all.css({
      'float': 'left',
      'overflow': 'hidden'
    });

    //调整动画元素尺寸
    animateWrap.outerWidth(me.all.length * animateWrapWidth);

    jumpTo.call(me, me.activeIndex)
  }

  /**
   * 调整帧的宽度
   * @param  {Number}           contentElInnerWidth         内容区域的宽度
   */
  function adjustFrameWidth(contentElInnerWidth) {
    var me = this;

    me.all.outerWidth(contentElInnerWidth / me.colspan);
  }


  /**
   * 重置控件的尺寸
   * @param  {Int}                index                       帧的索引
   */
  function restSlideSize(index) {
    var me = this,
      contentEl = me.getContentEl(),
      width, height;

    //内容区域尺寸
    width = me.adaptiveWidth ?
      me.adaptiveWidth() : me.contentEl.innerWidth();
    height = me.items.get(index).el.outerHeight();


    width /= me.colspan;

    me.all.outerWidth(width,true);
    me.all.css('display', 'block');

    contentEl.width(width * me.colspan);
    contentEl.css({
      'overflow': 'hidden',
      'position': 'relative'
    });


    if (me.animWrapperAutoHeightSetting) {
      contentEl.height(height);
    }

  }

  /**
   * 跳至某一帧
   */
  function jumpTo(index) {
    var me = this,
      animateWrap = me.getAnimateWrap(),
      pos;

    if (index == undefined) {
      index = me.activeIndex;
    }

    pos = -1 * index * me.getContentEl().width() / me.colspan;

    if (supportTransition) {
      animateWrap.css({
        'transition-duration': '0s',
        'transform': 'translate(' + pos + 'px,0)'
      });
    } else {
      animateWrap.css({
        'left': pos
      });
    }

    me.activeIndex = index;
  }

  /**
   * 激活某帧
   * @param  {Int}                  index           帧的索引
   * @param  {Boolean}              doEffct         是否播放特效
   * @param  {Function|Boolean}     callback        当为布尔值的时候为是否启用过度效果
   */
  function active(index, doEffct, callback) {
    var me = this,
      animateWrap = me.getAnimateWrap(),
      pos = -1 * index * me.getContentEl().innerWidth() / me.colspan;

    if (supportTransition) {

      animateWrap.css({
        'transition-duration': doEffct ? me.speed + 'ms' : '0s',
        'transition-property':'all',
        'transition-timing-function': me.timingFunction,
        'transform': 'translate(' + pos + 'px,0)'
      });

    } else {

      if (doEffct) {

        me.animator = animateWrap.animate({
          left: pos
        }, me.speed);

      } else {
        animateWrap.css({
          left: pos
        });
      }
    };

    me.activeIndex = index;

    //延迟执行
    setTimeout(callback, doEffct ? me.speed : 0);
  }


  return {
    init: init,
    prepare: prepare,
    active: active,
    adjustFrameWidth: adjustFrameWidth,
    restSlideSize: restSlideSize,
    jumpTo: jumpTo
  }
})