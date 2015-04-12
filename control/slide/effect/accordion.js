/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-11-24 23:27:56
 * @description 手风琴
 */
define(['azure/util/css3Judge'], function(css3Judge) {
  var supportTransition = css3Judge.transition;

  /**
   * 初始化配置
   * @return {[type]} [description]
   */
  function init() {
    var me = this

    //不需要动画容器
    me.needAnimateContainer = false;
    //关闭跑马灯效果
    me.carousel = false;
  }

  /**
   * 绘制完dom后的预处理
   */
  function prepare() {
    var me = this,
      animateWrapWidth = me.getContentEl().width();

    //子元素浮动
    me.all.css({
      'float': 'left',
      'overflow': 'hidden'
    });

    //调整动画元素尺寸
    //animateWrap.outerWidth(me.all.length * animateWrapWidth);

    jumpTo.call(me, me.activeIndex)
  }

  /**
   * 调整帧的宽度
   * @param  {Number}           contentElInnerWidth         内容区域的宽度
   */
  function adjustFrameWidth(contentElInnerWidth) {
    var me = this;

    me.all.outerWidth(contentElInnerWidth / me.all.length);
  }

  /**
   * 跳至某一帧
   */
  function jumpTo(index) {
    var me = this,
      all = me.all,
      collapseWidth = me.collapseWidth,
      contentWidth, expendWidth;

    if (index == undefined) {
      index = me.activeIndex;
    }

    contentWidth = me.getContentEl().width();
    expendWidth = contentWidth - collapseWidth * (all.length - 1);

    if (supportTransition) {

      all.css({
        'transition-duration': '0s'
      })

    }

    all.outerWidth(collapseWidth)
      .eq(index).outerWidth(expendWidth);

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
      all = me.all,
      collapseWidth = me.collapseWidth,
      contentWidth, expendWidth;

    contentWidth = me.getContentEl().width();
    expendWidth = contentWidth - collapseWidth * (all.length - 1);

    if (supportTransition) {

      all.css({
          'transition-duration': doEffct ? me.speed + 'ms' : '0s',
          'transition-property': 'all',
          'transition-timing-function': me.timingFunction
        })
        .outerWidth(collapseWidth)
        .eq(index).outerWidth(expendWidth);

    } else {

      if (doEffct) {

        all.stop().animate({
          width: collapseWidth - 3
        }, me.speed, "swing");

        all.eq(index).stop().animate({
          width: expendWidth - 3
        }, me.speed, "swing");

      } else {
        all.outerWidth(collapseWidth)
          .eq(index).outerWidth(expendWidth);
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
    jumpTo: jumpTo,
    adjustFrameWidth: adjustFrameWidth
  }
})