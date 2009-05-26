/*
 * Copyright (C) 2008, 2009 Mihai Şucan
 *
 * This file is part of PaintWeb.
 *
 * PaintWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PaintWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PaintWeb.  If not, see <http://www.gnu.org/licenses/>.
 *
 * $URL: http://code.google.com/p/paintweb $
 * $Date: 2009-05-26 13:35:51 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the text tool implementation.
 */

// TODO: make this tool nicer to use and make it work in Opera.

/**
 * @class The text tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintWebInstance.toolAdd('text', function (app) {
  var _self         = this,
      clearInterval = window.clearInterval,
      config        = app.config,
      container     = app.elems.container,
      context       = app.buffer.context,
      elems         = app.elems,
      image         = app.image,
      inputs        = app.inputs,
      layerUpdate   = app.layerUpdate,
      mouse         = app.mouse,
      setInterval   = window.setInterval,
      statusShow    = app.statusShow,
      toolActivate  = app.toolActivate;

  /**
   * The interval ID used for invoking the drawing operation every few 
   * milliseconds.
   *
   * @private
   * @see PaintWeb.config.toolDrawDelay
   */
  var timer = null;

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool ? app.tool._id : null;

  /**
   * Tells if the drawing canvas needs to be updated or not.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var needsRedraw = false;

  /**
   * Tool preactivation code. This method is invoked when the user attempts to 
   * activate the text tool.
   *
   * @returns {Boolean} True if the tool can be activated successfully, or false 
   * if not.
   */
  this.preActivate = function () {
    if (!context.fillText || !context.strokeText) {
      alert(app.lang.errorTextUnsupported);
      return false;
    } else {
      return true;
    }
  };

  /**
   * The tool activation code. This runs after the text tool is constructed, and 
   * after the previous tool has been deactivated.
   */
  this.activate = function () {
    // Reset mouse coordinates in the center of the image, for the purpose of 
    // placing the text there.
    mouse.x = Math.round(image.width  / 2);
    mouse.y = Math.round(image.height / 2);

    // Show the text options.
    elems.textOptions.className = '';

    setup('add');

    if (!timer) {
      timer = setInterval(_self.draw, config.toolDrawDelay);
    }
    needsRedraw = true;

    return true;
  };

  /**
   * The tool deactivation simply consists of removing the event listeners added 
   * when the tool was constructed, and clearing the buffer canvas.
   */
  this.deactivate = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    needsRedraw = false;

    setup('remove');

    context.clearRect(0, 0, image.width, image.height);

    // Minimize the text options.
    elems.textOptions.className = 'minimized';

    return true;
  };

  /**
   * Setup the <code>draw()</code> event handler for several inputs. This allows 
   * the text rendering to be updated automatically when some value changes.
   *
   * @private
   * @param {String} act The action to perform: 'add' or 'remove' the event 
   * listeners.
   */
  function setup (act) {
    var ev, i, listeners = ['textString', 'textFont', 'textSize', 'lineWidth'];

    for (i in listeners) {
      i = listeners[i];
      i = inputs[i];
      if (!i) {
        continue;
      }

      if (i.tagName.toLowerCase() == 'select' || i.type == 'checkbox') {
        ev = 'change';
      } else {
        ev = 'input';
      }

      if (act == 'add') {
        i.addEventListener(ev,    _self.draw, false);
      } else {
        i.removeEventListener(ev, _self.draw, false);
      }
    }
  };

  /**
   * The <code>mousemove</code> event handler.
   */
  this.mousemove = function () {
    needsRedraw = true;
  };

  /**
   * Perform the drawing operation.
   *
   * @param {Boolean} [force] Force redrawing.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw = function (force) {
    if (!needsRedraw && !force) {
      return;
    }

    context.clearRect(0, 0, image.width, image.height);

    if (config.shapeType != 'stroke') {
      context.fillText(inputs.textString.value, mouse.x, mouse.y);
    }

    if (config.shapeType != 'fill') {
      context.strokeText(inputs.textString.value, mouse.x, mouse.y);
    }

    needsRedraw = false;
  };

  /**
   * The <code>click</code> event handler. This method completes the drawing 
   * operation by inserting the text into the layer canvas, and by activating 
   * the previous tool.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.click = function (ev) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    _self.draw();
    layerUpdate();

    if (prevTool) {
      toolActivate(prevTool, ev);
    }

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The <code>keydown</code> event handler allows users to press the 
   * <kbd>Escape</kbd> key to cancel the drawing operation and return to the 
   * previous tool.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the key was recognized, or false if not.
   */
  this.keydown = function (ev) {
    if (!prevTool || ev.kid_ != 'Escape') {
      return false;
    }

    mouse.buttonDown = false;
    toolActivate(prevTool, ev);

    return true;
  };
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:
