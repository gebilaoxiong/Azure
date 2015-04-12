/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-10-25 21:55:14
 * @description 轮播项
 */
define([
  'azure/ClassFactory',
  'azure/Component'
], function(ClassFactory, Component) {
  var SlideItem;

  SlideItem = ClassFactory.define('SlideItem', Component, {});

  return SlideItem;
});