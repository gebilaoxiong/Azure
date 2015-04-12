/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-11-02 23:33:17
 * @description
 */
define(function() {
  var initCfg;

  initCfg = {
    carousel: false, //关闭跑马灯效果
    colspan: 1
  }

  function init() {
    var me = this;

    $.extend(me, initCfg);
  }

  /**
   * 绘制完dom后的预处理
   */
  function prepare() {
    var me = this;

    me.all

    .css({
      'position': 'absolute',
      'zIndex': 0,
      'opacity': 0
    })

    .eq(me.activeIndex).css({
      'zIndex': 1,
      'opacity': 1
    });
  }


  /**
   * 激活某帧
   * @param  {Int}                  index           帧的索引
   * @param  {Boolean}              doEffct         是否播放特效
   * @param  {Function|Boolean}     callback        当为布尔值的时候为是否启用过度效果
   */
  function active(activeIndex, doEffct, callback) {
    var me = this,
      last = me.all.eq(me.activeIndex),
      cur = me.all.eq(activeIndex);

    last.css({
      'zIndex': 0
    });

    cur.css({
      'zIndex': 1
    });

    //特效
    if (doEffct) {
      
      me.animator=cur.animate({ opacity: 1 }, me.speed, function() {

        last.css({opacity: 0});

        callback();
      });

    } else {
      cur.css({
        opacity: 1
      });

      last.css({
        opacity: 0
      });
    }

    if (!doEffct) {
      //延迟执行
      setTimeout(callback, 0);
    }

  }

  /**
   * 调整帧的宽度
   * @param  {Number}           contentElInnerWidth         内容区域的宽度
   */
  function adjustFrameWidth(contentElInnerWidth) {
    var me = this;
    me.all.outerWidth(contentElInnerWidth);
  }

  /**
   * 调整帧的宽度
   * @param  {Number}           contentElInnerHeight         内容区域的高度
   */
  function adjustFrameHeight(contentElInnerHeight) {
    var me = this;
    me.all.outerWidth(contentElInnerHeight / me.colspan);
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

    me.all.outerWidth(width);
    me.all.css('display', 'block');

    contentEl.width(width * me.colspan);
    contentEl.css({
      'overflow': 'hidden',
      'position': 'relative'
    });

    console.log(height)
    if (me.animWrapperAutoHeightSetting) {
      contentEl.height(height);
    }

  }

  return {
    init: init,
    prepare: prepare,
    active: active,
    jumpTo: active,
    adjustFrameWidth:adjustFrameWidth,
    adjustFrameHeight:adjustFrameHeight,
    restSlideSize:restSlideSize
  }
})