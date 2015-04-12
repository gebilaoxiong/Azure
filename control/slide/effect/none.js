/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-11-02 22:04:23
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
      'display': 'none'
    })
    
    .eq(me.activeIndex).css({
      'display': 'block'
    });
  }


  /**
   * 激活某帧
   * @param  {Int}                  index           帧的索引
   * @param  {Boolean}              doEffct         是否播放特效
   * @param  {Function|Boolean}     callback        当为布尔值的时候为是否启用过度效果
   */
  function active(activeIndex, doEffct, callback) {
    var me = this;


    me.all

    .css({
      'display': 'none'
    })

    .eq(activeIndex).css({
      'display': 'block'
    });

    if (callback) {
      //延迟执行
      setTimeout(callback, 0);
    }
  }

  return {
    init: init,
    prepare: prepare,
    active: active,
    jumpTo: active
  }
})