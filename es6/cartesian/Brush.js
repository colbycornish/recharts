import _range from 'lodash-es/range';
import _isFunction from 'lodash-es/isFunction';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _class2, _temp;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @fileOverview Brush
 */
import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { scalePoint } from 'd3-scale';

import { getValueByDataKey } from '../util/ChartUtils';
import pureRender from '../util/PureRender';
import Layer from '../container/Layer';
import Text from '../component/Text';
import { isNumber } from '../util/DataUtils';
import { generatePrefixStyle } from '../util/CssPrefixUtils';

var Brush = pureRender(_class = (_temp = _class2 = function (_Component) {
  _inherits(Brush, _Component);

  function Brush(props) {
    _classCallCheck(this, Brush);

    var _this = _possibleConstructorReturn(this, (Brush.__proto__ || Object.getPrototypeOf(Brush)).call(this, props));

    _this.handleDrag = function (e) {
      if (_this.leaveTimer) {
        clearTimeout(_this.leaveTimer);
        _this.leaveTimer = null;
      }

      if (_this.state.isTravellerMoving) {
        _this.handleTravellerMove(e);
      } else if (_this.state.isSlideMoving) {
        _this.handleSlideDrag(e);
      }
    };

    _this.handleTouchMove = function (e) {
      if (e.changedTouches != null && e.changedTouches.length > 0) {
        _this.handleDrag(e.changedTouches[0]);
      }
    };

    _this.handleDragEnd = function () {
      _this.setState({
        isTravellerMoving: false,
        isSlideMoving: false
      });
    };

    _this.handleLeaveWrapper = function () {
      if (_this.state.isTravellerMoving || _this.state.isSlideMoving) {
        _this.leaveTimer = setTimeout(_this.handleDragEnd, 1000);
      }
    };

    _this.handleEnterSlideOrTraveller = function () {
      _this.setState({
        isTextActive: true
      });
    };

    _this.handleLeaveSlideOrTraveller = function () {
      _this.setState({
        isTextActive: false
      });
    };

    _this.handleSlideDragStart = function (e) {
      var event = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e;

      _this.setState({
        isTravellerMoving: false,
        isSlideMoving: true,
        slideMoveStartX: event.pageX
      });
    };

    _this.travellerDragStartHandlers = {
      startX: _this.handleTravellerDragStart.bind(_this, 'startX'),
      endX: _this.handleTravellerDragStart.bind(_this, 'endX')
    };

    _this.state = props.data && props.data.length ? _this.updateScale(props) : {};
    return _this;
  }

  _createClass(Brush, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var _this2 = this;

      var _props = this.props,
          data = _props.data,
          width = _props.width,
          x = _props.x,
          travellerWidth = _props.travellerWidth,
          updateId = _props.updateId;


      if ((nextProps.data !== data || nextProps.updateId !== updateId) && nextProps.data && nextProps.data.length) {
        this.setState(this.updateScale(nextProps));
      } else if (nextProps.width !== width || nextProps.x !== x || nextProps.travellerWidth !== travellerWidth) {
        this.scale.range([nextProps.x, nextProps.x + nextProps.width - nextProps.travellerWidth]);
        this.scaleValues = this.scale.domain().map(function (entry) {
          return _this2.scale(entry);
        });

        this.setState({
          startX: this.scale(nextProps.startIndex),
          endX: this.scale(nextProps.endIndex)
        });
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.scale = null;
      this.scaleValues = null;

      if (this.leaveTimer) {
        clearTimeout(this.leaveTimer);
        this.leaveTimer = null;
      }
    }
  }, {
    key: 'getIndexInRange',
    value: function getIndexInRange(range, x) {
      var len = range.length;
      var start = 0;
      var end = len - 1;

      while (end - start > 1) {
        var middle = Math.floor((start + end) / 2);

        if (range[middle] > x) {
          end = middle;
        } else {
          start = middle;
        }
      }

      return x >= range[end] ? end : start;
    }
  }, {
    key: 'getIndex',
    value: function getIndex(_ref) {
      var startX = _ref.startX,
          endX = _ref.endX;
      var _props2 = this.props,
          gap = _props2.gap,
          data = _props2.data;

      var lastIndex = data.length - 1;
      var min = Math.min(startX, endX);
      var max = Math.max(startX, endX);
      var minIndex = this.getIndexInRange(this.scaleValues, min);
      var maxIndex = this.getIndexInRange(this.scaleValues, max);
      return {
        startIndex: minIndex - minIndex % gap,
        endIndex: maxIndex === lastIndex ? lastIndex : maxIndex - maxIndex % gap
      };
    }
  }, {
    key: 'getTextOfTick',
    value: function getTextOfTick(index) {
      var _props3 = this.props,
          data = _props3.data,
          tickFormatter = _props3.tickFormatter,
          dataKey = _props3.dataKey;

      var text = getValueByDataKey(data[index], dataKey, index);

      return _isFunction(tickFormatter) ? tickFormatter(text) : text;
    }
  }, {
    key: 'handleSlideDrag',
    value: function handleSlideDrag(e) {
      var _state = this.state,
          slideMoveStartX = _state.slideMoveStartX,
          startX = _state.startX,
          endX = _state.endX;
      var _props4 = this.props,
          x = _props4.x,
          width = _props4.width,
          travellerWidth = _props4.travellerWidth,
          startIndex = _props4.startIndex,
          endIndex = _props4.endIndex,
          onChange = _props4.onChange;

      var delta = e.pageX - slideMoveStartX;

      if (delta > 0) {
        delta = Math.min(delta, x + width - travellerWidth - endX, x + width - travellerWidth - startX);
      } else if (delta < 0) {
        delta = Math.max(delta, x - startX, x - endX);
      }
      var newIndex = this.getIndex({
        startX: startX + delta,
        endX: endX + delta
      });

      if ((newIndex.startIndex !== startIndex || newIndex.endIndex !== endIndex) && onChange) {
        onChange(newIndex);
      }

      this.setState({
        startX: startX + delta,
        endX: endX + delta,
        slideMoveStartX: e.pageX
      });
    }
  }, {
    key: 'handleTravellerDragStart',
    value: function handleTravellerDragStart(id, e) {
      var event = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e;

      this.setState({
        isSlideMoving: false,
        isTravellerMoving: true,
        movingTravellerId: id,
        brushMoveStartX: event.pageX
      });
    }
  }, {
    key: 'handleTravellerMove',
    value: function handleTravellerMove(e) {
      var _setState;

      var _state2 = this.state,
          brushMoveStartX = _state2.brushMoveStartX,
          movingTravellerId = _state2.movingTravellerId,
          endX = _state2.endX,
          startX = _state2.startX;

      var prevValue = this.state[movingTravellerId];

      var _props5 = this.props,
          x = _props5.x,
          width = _props5.width,
          travellerWidth = _props5.travellerWidth,
          onChange = _props5.onChange,
          gap = _props5.gap,
          data = _props5.data;

      var params = { startX: this.state.startX, endX: this.state.endX };

      var delta = e.pageX - brushMoveStartX;
      if (delta > 0) {
        delta = Math.min(delta, x + width - travellerWidth - prevValue);
      } else if (delta < 0) {
        delta = Math.max(delta, x - prevValue);
      }

      params[movingTravellerId] = prevValue + delta;

      var newIndex = this.getIndex(params);
      var startIndex = newIndex.startIndex,
          endIndex = newIndex.endIndex;

      var isFullGap = function isFullGap() {
        var lastIndex = data.length - 1;
        if (movingTravellerId === 'startX' && (endX > startX ? startIndex % gap === 0 : endIndex % gap === 0) || endX < startX && endIndex === lastIndex || movingTravellerId === 'endX' && (endX > startX ? endIndex % gap === 0 : startIndex % gap === 0) || endX > startX && endIndex === lastIndex) {
          return true;
        }
        return false;
      };

      this.setState((_setState = {}, _defineProperty(_setState, movingTravellerId, prevValue + delta), _defineProperty(_setState, 'brushMoveStartX', e.pageX), _setState), function () {
        if (onChange) {
          if (isFullGap()) {
            onChange(newIndex);
          }
        }
      });
    }
  }, {
    key: 'updateScale',
    value: function updateScale(props) {
      var _this3 = this;

      var data = props.data,
          startIndex = props.startIndex,
          endIndex = props.endIndex,
          x = props.x,
          width = props.width,
          travellerWidth = props.travellerWidth;

      var len = data.length;
      this.scale = scalePoint().domain(_range(0, len)).range([x, x + width - travellerWidth]);
      this.scaleValues = this.scale.domain().map(function (entry) {
        return _this3.scale(entry);
      });
      return {
        isTextActive: false,
        isSlideMoving: false,
        isTravellerMoving: false,
        startX: this.scale(startIndex),
        endX: this.scale(endIndex)
      };
    }
  }, {
    key: 'renderBackground',
    value: function renderBackground() {
      var _props6 = this.props,
          x = _props6.x,
          y = _props6.y,
          width = _props6.width,
          height = _props6.height,
          fill = _props6.fill,
          stroke = _props6.stroke;


      return React.createElement('rect', {
        stroke: stroke,
        fill: fill,
        x: x,
        y: y,
        width: width,
        height: height
      });
    }
  }, {
    key: 'renderPanorama',
    value: function renderPanorama() {
      var _props7 = this.props,
          x = _props7.x,
          y = _props7.y,
          width = _props7.width,
          height = _props7.height,
          data = _props7.data,
          children = _props7.children,
          padding = _props7.padding;

      var chartElement = Children.only(children);

      if (!chartElement) {
        return null;
      }

      return React.cloneElement(chartElement, {
        x: x,
        y: y,
        width: width,
        height: height,
        margin: padding,
        compact: true,
        data: data
      });
    }
  }, {
    key: 'renderTraveller',
    value: function renderTraveller(travellerX, id) {
      var _props8 = this.props,
          y = _props8.y,
          travellerWidth = _props8.travellerWidth,
          height = _props8.height,
          stroke = _props8.stroke;

      var lineY = Math.floor(y + height / 2) - 1;
      var x = Math.max(travellerX, this.props.x);

      return React.createElement(
        Layer,
        {
          className: 'recharts-brush-traveller',
          onMouseEnter: this.handleEnterSlideOrTraveller,
          onMouseLeave: this.handleLeaveSlideOrTraveller,
          onMouseDown: this.travellerDragStartHandlers[id],
          onTouchStart: this.travellerDragStartHandlers[id],
          style: { cursor: 'col-resize' }
        },
        React.createElement('rect', {
          x: x,
          y: y,
          width: travellerWidth,
          height: height,
          fill: stroke,
          stroke: 'none'
        }),
        React.createElement('line', {
          x1: x + 1,
          y1: lineY,
          x2: x + travellerWidth - 1,
          y2: lineY,
          fill: 'none',
          stroke: '#fff'
        }),
        React.createElement('line', {
          x1: x + 1,
          y1: lineY + 2,
          x2: x + travellerWidth - 1,
          y2: lineY + 2,
          fill: 'none',
          stroke: '#fff'
        })
      );
    }
  }, {
    key: 'renderSlide',
    value: function renderSlide(startX, endX) {
      var _props9 = this.props,
          y = _props9.y,
          height = _props9.height,
          stroke = _props9.stroke;


      return React.createElement('rect', {
        className: 'recharts-brush-slide',
        onMouseEnter: this.handleEnterSlideOrTraveller,
        onMouseLeave: this.handleLeaveSlideOrTraveller,
        onMouseDown: this.handleSlideDragStart,
        onTouchStart: this.handleSlideDragStart,
        style: { cursor: 'move' },
        stroke: 'none',
        fill: stroke,
        fillOpacity: 0.2,
        x: Math.min(startX, endX),
        y: y,
        width: Math.abs(endX - startX),
        height: height
      });
    }
  }, {
    key: 'renderText',
    value: function renderText() {
      var _props10 = this.props,
          startIndex = _props10.startIndex,
          endIndex = _props10.endIndex,
          y = _props10.y,
          height = _props10.height,
          travellerWidth = _props10.travellerWidth,
          stroke = _props10.stroke;
      var _state3 = this.state,
          startX = _state3.startX,
          endX = _state3.endX;

      var offset = 5;
      var attrs = {
        pointerEvents: 'none',
        fill: stroke
      };

      return React.createElement(
        Layer,
        { className: 'recharts-brush-texts' },
        React.createElement(
          Text,
          _extends({
            textAnchor: 'end',
            verticalAnchor: 'middle',
            x: Math.min(startX, endX) - offset,
            y: y + height / 2
          }, attrs),
          this.getTextOfTick(startIndex)
        ),
        React.createElement(
          Text,
          _extends({
            textAnchor: 'start',
            verticalAnchor: 'middle',
            x: Math.max(startX, endX) + travellerWidth + offset,
            y: y + height / 2
          }, attrs),
          this.getTextOfTick(endIndex)
        )
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _props11 = this.props,
          data = _props11.data,
          className = _props11.className,
          children = _props11.children,
          x = _props11.x,
          y = _props11.y,
          width = _props11.width,
          height = _props11.height;
      var _state4 = this.state,
          startX = _state4.startX,
          endX = _state4.endX,
          isTextActive = _state4.isTextActive,
          isSlideMoving = _state4.isSlideMoving,
          isTravellerMoving = _state4.isTravellerMoving;


      if (!data || !data.length || !isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height) || width <= 0 || height <= 0) {
        return null;
      }

      var layerClass = classNames('recharts-brush', className);
      var isPanoramic = React.Children.count(children) === 1;
      var style = generatePrefixStyle('userSelect', 'none');

      return React.createElement(
        Layer,
        {
          className: layerClass,
          onMouseMove: this.handleDrag,
          onMouseLeave: this.handleLeaveWrapper,
          onMouseUp: this.handleDragEnd,
          onTouchEnd: this.handleDragEnd,
          onTouchMove: this.handleTouchMove,
          style: style
        },
        this.renderBackground(),
        isPanoramic && this.renderPanorama(),
        this.renderSlide(startX, endX),
        this.renderTraveller(startX, 'startX'),
        this.renderTraveller(endX, 'endX'),
        (isTextActive || isSlideMoving || isTravellerMoving) && this.renderText()
      );
    }
  }]);

  return Brush;
}(Component), _class2.displayName = 'Brush', _class2.propTypes = {
  className: PropTypes.string,

  fill: PropTypes.string,
  stroke: PropTypes.string,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number.isRequired,
  travellerWidth: PropTypes.number,
  gap: PropTypes.number,
  padding: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number
  }),

  dataKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.func]),
  data: PropTypes.array,
  startIndex: PropTypes.number,
  endIndex: PropTypes.number,
  tickFormatter: PropTypes.func,

  children: PropTypes.node,

  onChange: PropTypes.func,
  updateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}, _class2.defaultProps = {
  height: 40,
  travellerWidth: 5,
  gap: 1,
  fill: '#fff',
  stroke: '#666',
  padding: { top: 1, right: 1, bottom: 1, left: 1 }
}, _temp)) || _class;

export default Brush;