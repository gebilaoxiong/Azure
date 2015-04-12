/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-07-23 21:06:13
 * @description 定宽瀑布流控件 原作者：雨夜带刀（聚美优品） waterfall控件
 *              原项目介绍：http://stylechen.com/waterfall.html
 *
 *  新特性：
 *
 * - 观察者模式
 *
 * - MVC：      提供了Store（数据源）和Template(模板引擎)的支持，
 *              分离了视图和数据加载的逻辑，原控件的做法是暴露一个handler接口。
 *
 * - 扩展性：   梳理了原代码结构，加入了OOP的支持，可针对不同的场景做扩展
 *
 */
define([
  'azure/ClassFactory',
  'azure/Component'
  'controls/util/Template',
  'common/util'
], function(ClassFactory, Component, Template, util) {
  var Waterfall,

    groupTemp = '<div class="ui-wf-group clearfix"></div>',

    empty = '';

  Waterfall = ClassFactory.define(Component, {

    /**
     * 控件的元素
     * @type {Mixed}
     */
    elem: undefined,

    /**
     * 容器
     * @type {Mixed}
     */
    container: undefined,

    /**
     * 滚动容器（可选 默认为window）
     * @type {Mixed}
     */
    scrollCt: undefined,

    /*列宽度*/
    columnWidth: 250,

    /**
     * 最大列数(可选)
     * @type {Number}
     */
    maxColumns: undefined,

    /*最小列数(可选)*/
    minColmns: 2,

    /*单元格的最大高度(可选) 大于该高度图片将被裁剪*/
    maxCellHeight: 600,

    /*单元格除开图片的高度*/
    spaceY: 14,

    /**
     * 单元格模板
     * @type {String||Template}
     */
    cellTemp: undefined,

    /**
     * 数据源中记录的图片宽度属性
     * @type {String}
     */
    imgWidthProp: undefined,

    /**
     * 数据源中记录的图片高度属性
     * @type {String}
     */
    imgHeightProp: undefined,

    /**
     * 图片的限制宽度
     * @type {Number}
     */
    imgRestrictWidth: undefined,

    /**
     * @private 加载偏移量
     * @type {Number}
     */
    loadOffset: -1,


    /**
     * @private 初始化(控件的生命周期，最好是有个Component基类)
     * @param   {Object}            config          配置对象
     */
    init: function(config) {
      var me = this;

      $.extend(me, config);

      //开始配置
      me.configurate(config);

      //绑定构造函数传入的控件事件
      me.callParent(arguments);

      //绘制dom
      if (me.container) {
        me.render(me.container);
      }
    },

    /**
     * @private 配置控件
     * @param   {Object}            config          配置对象
     */
    configurate: function(config) {
      var me = this;

      me.initConfig = config;
      me.groupCells = []; //缓存单元格 以组为单元
      me.fragmentArray = []; //缓存剥离dom树的节点

      //如果传入的单元格模板为字符串
      //转换模板实例
      if ($.type(me.cellTemp) === 'string') {
        me.cellTemp = new Template(me.cellTemp);
      }
    },

    /**
     * 绘制控件
     * @param  {Mixed}            container             容器
     * @param  {int||elem}        position              位置（可选）
     */
    render: function(container, /*optional*/ position) {
      var me = this,
        store, doc;

      //触发beforeRender事件
      if (me.rendered || me.trigger('beforerender', me) === false) {
        return;
      }

      me.elem = $(me.elem);
      doc = me.elem[0].ownerDocument;
      me.container = $(container || me.container);
      me.scrollCt = $(me.scrollCt ? me.scrollCt : window);

      //列缓存文档碎片
      //用于组装列中的单元格
      //随后放入dom中
      me.columnsFragment = doc.createDocumentFragment();

      //位置
      if (position != undefined) {
        position = $.isNumeric(position) ?
          me.container.children(':eq(' + position + ')') :
          position;

        me.elem.insertBefore(position);
      }

      //如果控件的dom不在容器中
      if (!$.contains(me.container[0], me.elem[0])) {
        me.elem.appendTo(me.container);
      }

      //样式
      if (!$.isWindow(me.scrollCt)) {
        me.scrollCt.addClass('ui-wf-scroll');
      }
      me.elem.addClass('ui-wf');

      //初始化的时候元素已有的高度
      me.initHeight = Math.min(me.elem.height(), me.maxCellHeight);

      me.doLayout();
      me.initColumnArray();

      //初始化确保加载的高度（一屏半）
      me.initOffset = Math.round(me.containerHeight * 1.5);

      //绑定数据源
      if (me.store) {
        store = me.store;
        me.store = null;
        me.bindStore(store);
      }


      me.rendered = true;
      me.trigger('rendercomplete', me);
      //绑定其他DOM事件
      me.initEvents();
    },

    initEvents: function() {
      var me = this;

      //持有 便于销毁
      me.onResize = util.delay(me.onResize, me, 60);
      $(window).on('resize', me.onResize);
      me.scrollCt.on('scroll', $.proxy(me.onScroll, me));
    },

    /**
     * 计算布局
     */
    doLayout: function() {
      var me = this,
        totalColsWidth, cols;

      //尺寸计算
      me.containerWidth = me.container.width(); //容器的contentWith
      me.containerHeight = Math.max(me.container.height(), 600);

      totalColsWidth = me.containerWidth - (me.containerWidth % me.columnWidth); //列的总宽度
      cols = totalColsWidth / me.columnWidth; //列数

      //限制列数
      if (me.maxColumns && cols > me.maxColumns) {

        cols = me.maxColumns;
        totalColsWidth = cols * me.columnWidth;

      } else if (me.minColmns && cols < me.minColumns) {

        cols = me.minColumns;
        totalColsWidth = cols * me.columnWidth;

      }

      //如果列数与之前的列数不符
      if (me.columns != cols) {
        me.columns = cols;
        //将元素的内容宽度定为列宽
        me.elem.width(totalColsWidth);
      }

      //元素的顶部偏移量
      me.elemOffsetTop = me.elem.offset().top;
    },

    /**
     * @private 初始化列的宽度及偏移量数组
     */
    initColumnArray: function() {
      var me = this,
        initHeight = me.initHeight,
        cols = me.columns,
        i = 0;

      me.columnHeigths = [];
      me.columnTopOffsets = []; //偏移量

      for (; i < cols; i++) {
        me.columnHeigths[i] = 0;
        me.columnTopOffsets[i] = 0 - initHeight;
      }
    },

    /**
     * 绑定数据源
     * @param  {Store}        store                 数据源
     */
    bindStore: function(store) {
      var me = this,
        eventObj = {
          'datachange': me.onStoreDataChange,
          'beforerequest': me.onBeforeStoreRequest,
          'requestcomplete': me.onRequestComplete,
          scope: me
        };

      //解除旧的
      if (me.store && me.store != store) {

        //autoDestroy
        if (me.store.autoDestroy) {
          me.store.destroy();
        } else {
          //解除事件绑定
          me.un(eventObj);
        }

        delete me.store;
      }

      //新的数据源
      if (store != undefined) {
        if ($.isFunction(store)) { //构造函数
          store = new store(me.storeConfig);
        }
        //绑定 store事件
        store.on(eventObj);
        me.store = store;
      }
    },

    onBeforeStoreRequest: $.noop,

    /**
     * Store加载完毕处理函数
     */
    onRequestComplete: $.noop,


    /**
     * 计算加载偏移量
     */
    computeLoadOffset: function() {
      var me = this;
      me.loadOffset = me.elem.outerHeight() + me.elemOffsetTop - (me.scrollCt.height() * 1.3);
    },

    /**
     * 刷新
     */
    refresh: function() {
      var me = this,
        records;
      //清空DOM
      me.elem.empty();
      records = me.store.getRecords();

      if (records.length) {
        me.onStoreDataChange(records);
      }
    },

    /**
     * @private 数据源数据变更处理函数
     * @param   {Array}           records             新的记录
     */
    onStoreDataChange: function(records) {
      var me = this,
        recordsLen = records.length,
        groupIndex = me.groupCells.length,
        newGroup = true;


      //如果长度大于一列
      //新建组
      if (recordsLen > me.columns) {
        me.groupElem = me.createGroup(); //新建组
        me.groupElems = me.elem.children('div.ui-wf-group'); //组的集合
        me.groupCells[groupIndex] = []; //以组为单位
        me.columnElems = me.createColumns(); //当前组的所有列
      } else {
        groupIndex--;
        newGroup = false;
      }

      //缓存当前各列高度
      //等加载的数据添加到DOM中后要累计计算
      me.prevColumnHeigths = me.columnHeigths.concat();

      //创建单元格 并附加到列上（此时列在文档碎片中）
      $.each(records, function(_, record) {
        me.addCell(record, groupIndex)
      });

      //如果是创建的新组
      if (newGroup) {
        me.addColumn(me.groupElem, groupIndex);
      }

      //计算下次加载的偏移量
      me.computeLoadOffset();

      //初始化的时候
      if (me.removeElem == undefined) {
        me.removeElem = me.groupElem;
      }
    },

    /**
     * 创建一个组
     * @return {jQObj}    组的jq对象
     */
    createGroup: function() {
      return $(groupTemp).appendTo(this.elem);
    },

    /**
     * 创建列并缓存到columnsFragment中
     * @return {jQObj}    列的jq对象
     */
    createColumns: function() {
      var me = this,
        columns = me.columns,
        columnTopOffsets = me.columnTopOffsets,
        i = 0,
        html = '',
        topOffset;

      for (; i < columns; i++) {
        topOffset = columnTopOffsets[i];

        html += [
          '<ul class="ui-wf-col" ',
          topOffset ? 'style="margin-top:' + topOffset + 'px;"' : empty,
          '></ul>'
        ].join(empty);
      }

      //添加到文档碎片中
      return $(html).appendTo(me.columnsFragment);
    },

    /**
     * 创建单元格
     * @param  {Object}           cellTempArgs            单元格模板编译参数
     */
    createCell: function(cellTempArgs) {
      var me = this,
        preWrap = '<li class="card">',
        lastWrap = '</li>';

      return $(preWrap + me.cellTemp.compile(cellTempArgs) + lastWrap);
    },

    /**
     * 创建单元格 并追加到最短的列中
     * @param {Object}              record              单个记录
     * @param {int}                 groupIndex          组的索引
     */
    addCell: function(record, groupIndex) {
      var me = this,
        columnHeigths = me.columnHeigths,
        min = util.getExtreme(columnHeigths, true), //获取所有列中最短列的信息
        index = min.index,
        cellElem, height;

      //如果传入的不是缓存
      if (!record.elem) {
        record = me.getCellTempArgs(record);
        cellElem = me.createCell(record);
        height = record[me.imgHeightProp] + me.spaceY;
        //cellElem.outerHeight(height,true);
      } else {
        cellElem = record.elem;
        height = record.height;
      }

      height = Math.min(me.maxCellHeight, height);

      if (groupIndex !== undefined) {
        //添加到该组的单元格集合中
        me.groupCells[groupIndex].push({
          height: height,
          elem: cellElem
        });
      }

      //更新最短列的高度
      me.columnHeigths[index] = min.item + height;
      me.columnElems.eq(index).append(cellElem);
    },

    /**
     * @private 重写获取单元格模板编译参数
     *          主要是为了实现图片的缩放
     *
     * @param   {Object}              record              单个记录
     * @return  {Object}              编译模板的参数
     */

    getCellTempArgs: function(record) {
      var me = this,
        imgWidth = record[me.imgWidthProp],
        imgHeight = record[me.imgHeightProp],
        restrictWidth = me.imgRestrictWidth;

      //等比缩放
      if (imgWidth !== restrictWidth) {
        record[me.imgHeightProp] = Math.round(imgHeight * (restrictWidth / imgWidth));
        record[me.imgWidthProp] = restrictWidth;
      }

      return record;
    },



    /**
     * @private 将文档碎片中组装好的列移至DOM中
     *          超出高度的截取
     */
    addColumn: function(groupElem, groupIndex) {
      var me = this,
        maxCellHeight, groupCells, i, len,
        cell, cellHeight,
        maxColHeight = maxCellHeight = me.maxCellHeight, //限制单元格高度,
        columnTopOffsets = me.columnTopOffsets,
        groupHeight;

      groupElem.empty().append(me.columnsFragment);
      //记录触发值
      me.cacheResponseOffset(groupElem);

      if (!me.fixedHeight && groupIndex !== undefined) {

        groupCells = me.groupCells[groupIndex]; //当前组的所有单元格
        len = groupCells.length;

        //当列初次添加入dom时 重新计算列中单元格的高度
        for (i = 0; i < len; i++) {
          cell = groupCells[i]; //单元格
          cellHeight = cell.elem.outerHeight(true); //高度


          //当列添加到DOM中的时候重新计算单元格高度
          //超出限定高度的限制其高度
          if (cellHeight > maxCellHeight) {
            cell.elem.outerHeight(maxCellHeight, true);
            cellHeight = maxCellHeight;
          }

          cell.height = cellHeight;
        }

        //计算列的实际高度
        me.computeColumnHeight();
      }

      maxColHeight = util.getExtreme(me.columnHeigths, false).item;

      //修正下一组加载各列的偏移量
      for (i = 0; i < me.columns; i++) {
        columnTopOffsets[i] = me.columnHeigths[i] - maxColHeight;
      }

      //确保第一次加载一屏半的数据
      if (me.initOffset) {
        groupHeight = groupElem.outerHeight() + groupElem.offset().top;

        //如果初次加载没有一屏半
        if (groupHeight < me.initOffset) {
          me.loadData();
        }

        me.initOffset = 0;
      }

    },

    /**
     * 根据上一次的各列高度计算当前的高度
     */
    computeColumnHeight: function() {
      var me = this,
        prevHeight = me.prevColumnHeigths,
        heights = me.columnHeigths,
        columnElems = me.columnElems,
        i = 0,
        len = heights.length,
        height;

      me.fixedHeight = true;

      for (; i < len; i++) {
        //实际高度
        height = prevHeight[i] + columnElems.eq(i).outerHeight();

        //实际高度与当前的理论高度不想当时
        //以实际高度为准
        if (height != heights[i]) {
          me.fixedHeight = false;
          heights[i] = height;
        }
      }
    },

    /**
     * 缓存组的响应滚动条的偏移量
     * @param  {jQObj}            groupElem             组元素
     */
    cacheResponseOffset: function(groupElem) {
      //组元素相对于文档顶部的高度
      var offset = groupElem.offset().top + groupElem.outerHeight();
      groupElem.data('responseScrollOffset', offset);
    },

    /**
     * 加载数据
     */
    loadData: function() {
      var me = this;

      me.store.load();
    },

    /**
     * @private 窗体resize事件处理函数
     */
    onResize: function() {
      var me = this,
        preColumns = me.columns,
        prevHeigth = util.getExtreme(me.columnHeigths, false).item, //上一列的最高列高度
        lastEmptyElem = me.groupElems.filter('.ui-wf-empty').last(),
        nextElem = lastEmptyElem.next(),
        backHeight = me.containerHeight,
        groupElem, records;

      //重新计算布局
      me.doLayout();

      //列数未改变 不做任何处理
      if (preColumns !== me.columns) {
        //重新初始化高度
        me.initColumnArray();

        //迭代所有组
        //将其单元格在各组中进行重新排序
        $.each(me.groupCells, function(i, data) {
          var groupElem = me.groupElems.eq(i),
            prevHeight = util.getExtreme(me.columnHeigths, false).item;

          me.columnElems = me.createColumns();

          //重绘单元格 并添加到合适的列中
          $.each(data, function(_, item) {
            me.addCell(item);
          })

          if (groupElem.hasClass('ui-wf-empty')) {
            me.offlineAddColumn(i, prevHeight);
          } else {
            me.addColumn(groupElem);
          }


        });

        //重置滚动位置
        //新的位置在可见组的第一个
        if (nextElem.length) {
          me.scrollTop = nextElem.offset().top + Math.round(nextElem.height() / 2);
          me.scrollCt.scrollTop(me.scrollTop);
          me.removeElem = nextElem;
          me.revertElem = lastEmptyElem;
        } else { //第一组组元素
          me.removeElem = me.groupElems.eq(0);
          delete me.revertElem;
        }

        me.computeLoadOffset();

        //触发列变更事件
        me.trigger('columnschange', me.columns);
      } else if (backHeight !== me.containerHeight) {
        me.computeLoadOffset();
      }
    },

    /**
     * 离线添加列
     * @param  {Number}           groupIndex              组的索引
     * @param  {Number}           prvGroupHeight          上一组的最高列的高度
     */
    offlineAddColumn: function(groupIndex, prvGroupHeight) {
      var me = this,
        heights = me.columnHeigths, //列的高度
        colTopOffset = me.columnTopOffsets, //列的偏移量
        maxHeight = util.getExtreme(heights, false).item,
        groupElem = me.groupElems.eq(groupIndex),
        fragment = me.fragmentArray[groupIndex],
        i = 0;

      //清空之前的列
      $(fragment).empty();
      fragment.appendChild(me.columnsFragment);
      groupElem.css('height', maxHeight - prvGroupHeight);

      //重新记录组的响应值
      me.cacheResponseOffset(groupElem);

      for (; i < me.columns; i++) {
        colTopOffset[i] = heights[i] - maxHeight;
      }
    },

    /**
     * 容器滚动处理函数
     */
    onScroll: function() {
      var me = this,
        scrollTop = me.scrollCt.scrollTop(),
        lastScrollTop = me.scrollTop,
        responseScrollOffset;

      me.scrollTop = scrollTop;

      //未在加载状态 且 容器滚动高度大于偏移量
      //滚动条离底部剩余一屏半的时候开启加载
      if (me.loadOffset && scrollTop > me.loadOffset) {
        me.loadData();
      }


      //向下滚动
      if (lastScrollTop < scrollTop) {
        //响应滚动条的偏移量
        responseScrollOffset = me.removeElem.data('responseScrollOffset');

        //当滚动高度大于响应高度的时候 
        //删除组
        if (scrollTop > responseScrollOffset) {
          me.removeGroup(me.removeElem);
        }
      }
      //向下滚动
      else {
        if (me.revertElem !== undefined) {
          //响应滚动条的偏移量
          responseScrollOffset = me.revertElem.data('responseScrollOffset');

          if (scrollTop < responseScrollOffset) {
            me.revertGroup();
          }
        }
      }

      me.trigger('scroll', me, scrollTop)
    },

    /**
     * 删除组
     * @param  {jQElem}       removeGroupElem       待删除的组
     */
    removeGroup: function(removeGroupElem) {
      var me = this,
        fragment = me.elem[0].ownerDocument.createDocumentFragment(),
        next;

      removeGroupElem
      //删除之前记录下高度
      .css({
        visibility: 'hidden',
        height: removeGroupElem.height()
      })
      //添加标记class
      .addClass('ui-wf-empty')
      //将子元素添加到文档碎片中
      .children().appendTo(fragment);

      me.fragmentArray.push(fragment);
      me.revertElem = removeGroupElem; //维护链表

      next = removeGroupElem.next();

      if (next.length && next.hasClass('ui-wf-group')) {
        me.removeElem = next;
      }
    },

    /**
     * 恢复组 将缓存在文档碎片中的子元素添加回来
     */
    revertGroup: function() {
      var me = this,
        revertElem = me.revertElem,
        prev = revertElem.prev(),
        revertOffset;

      revertElem
        .append(me.fragmentArray.pop())
        .css({
          visibility: '',
          height: ''
        })
        .removeClass('ui-wf-empty');

      me.removeElem = me.revertElem;

      //前一个元素
      if (prev.length && prev.hasClass('ui-wf-empty')) {
        me.revertElem = prev;

        //如果当前滚动高度还是小于响应高度  继续恢复
        if (prev.data('responseScrollOffset') > me.scrollCt.scrollTop()) {
          me.revertGroup();
        }
      }
    },

    /**
     * 销毁控件
     */
    destroy: function() {
      var me = this;

      if (me.trigger('beforedestroy', me) === false) {
        return;
      }

      //解除事件绑定
      me.callParent(arguments);

      me.beforeDestroy();

      me.bindStore(null);
      //清空 jq empty中会删除组的缓存
      me.elem.empty();

      delete me.cellTemp;
      delete me.columnElems;
      delete me.container;
      delete me.elem;
      delete me.groupCells;
      delete me.groupElem;
      delete me.groupElems;
      delete me.removeElem;
      delete me.revertElem;
      delete me.cellTemp;
      delete me.scrollCt;
      delete me.initConfig;

      me.afterDestroy();
    },

    beforeDestroy: function() {
      var me = this;
      $(window).off('resize', me.onResize);
      me.scrollCt.off('scroll', me.onScroll);
    },

    afterDestroy: $.noop
  });



  return Waterfall;
});