import OpenSeadragon from 'openseadragon';
import { initOSDFabricJS } from 'openseadragon-fabric';
import { Line, Rect } from 'fabric';
import i18next from 'i18next';
import { IIIF, Collection, Manifest, Image } from '@allmaps/iiif-parser';
import LanguageDetector from 'i18next-browser-languagedetector';

class RotatingInput extends HTMLElement {
    constructor() {
        super();
        this.degree = 0;
        this.step = 1;
        this.displayDegrees = true;
        this.radius = 75;
        this._disabled = false;
        this.handleElement = null;
        this.styleElement = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.handleMouseDown = (e) => {
            if (this._disabled || !this.handleElement)
                return;
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            e.preventDefault();
            if (this.handleElement) {
                this.handleElement.style.cursor = "grabbing";
            }
            document.body.style.cursor = "grabbing";
            document.addEventListener("mousemove", this.handleMouseMove);
            document.addEventListener("mouseup", this.handleMouseUp);
        };
        this.handleMouseMove = (e) => {
            if (!this.isDragging || this._disabled)
                return;
            const circle = this.shadow.querySelector(".circle");
            if (!circle)
                return;
            const rect = circle.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            let newDegree = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);
            if (newDegree < 0) {
                newDegree += 360;
            }
            this.degree = Math.round(newDegree / this.step) * this.step;
            this.updateHandlePosition();
        };
        this.handleMouseUp = () => {
            if (this.isDragging && this.handleElement) {
                this.isDragging = false;
                this.handleElement.style.cursor = "grab";
                document.body.style.cursor = "default";
                document.removeEventListener("mousemove", this.handleMouseMove);
                document.removeEventListener("mouseup", this.handleMouseUp);
            }
        };
        this.shadow = this.attachShadow({ mode: "open" });
        this.render();
    }
    static get observedAttributes() {
        return ["step", "display-degrees", "radius", "value", "disabled"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "step" && newValue !== null) {
            this.step = parseInt(newValue, 10) || 1;
        }
        else if (name === "display-degrees") {
            this.displayDegrees = newValue !== "false";
        }
        else if (name === "radius" && newValue !== null) {
            this.radius = parseInt(newValue, 10) || 75;
            this.updateRadius();
        }
        else if (name === "value" && newValue !== null) {
            this.degree = parseInt(newValue, 10) || 0;
            this.updateHandlePosition();
        }
        else if (name === "disabled") {
            const isDisabled = newValue !== null;
            if (this._disabled !== isDisabled) {
                this._disabled = isDisabled;
                this.updateDisabledState();
            }
        }
        this.updateDisplay();
    }
    render() {
        this.shadow.innerHTML = `
      <style id="dynamic-styles">
        :host {
          --control-handle-color: #007bff;
          --handle-color: ${this._disabled ? "var(--control-disabled-color)" : "var(--control-handle-color)"};
          --rotating-input-container-margin: 20px auto;
          --disabled-opacity: .6;
          --control-circle-color: #ccc;
          --control-circle-border: 2px solid var(--control-circle-color);
        }

        :host(.disabled) {
          opacity: var(--disabled-opacity);
          pointer-events: none;
        }

        .rotating-input-container {
          position: relative;
          width: ${2 * this.radius}px;
          height: ${2 * this.radius}px;
          margin: var(--rotating-input-container-margin);
          user-select: none;
        }

        .circle {
          width: ${2 * this.radius}px;
          height: ${2 * this.radius}px;
          border-radius: 50%;
          border: var(--control-circle-border);
          position: relative;
          opacity: ${this._disabled ? "0.6" : "var(--disabled-opacity)"};
          cursor: ${this._disabled ? "not-allowed" : "default"};
        }

        .handle {
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: var(--handle-color);
          border-radius: 50%;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          cursor: ${this._disabled ? "not-allowed" : "grab"};
        }

        .degree-display {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 16px;
          color: ${this._disabled ? "#999" : ""};
        }
      </style>
      <div class="rotating-input-container">
        <div class="circle">
          <div class="handle"></div>
        </div>
        <div class="degree-display">0°</div>
      </div>
    `;
        this.handleElement = this.shadow.querySelector(".handle");
        this.styleElement = this.shadow.querySelector("#dynamic-styles");
        this.updateDisplay();
        this.updateHandlePosition();
        this.setupEventListeners();
        this.updateDisabledState();
    }
    updateRadius() {
        const container = this.shadow.querySelector(".rotating-input-container");
        const circle = this.shadow.querySelector(".circle");
        if (container && circle) {
            container.style.width = `${2 * this.radius}px`;
            container.style.height = `${2 * this.radius}px`;
            circle.style.width = `${2 * this.radius}px`;
            circle.style.height = `${2 * this.radius}px`;
            this.updateHandlePosition();
        }
    }
    setupEventListeners() {
        if (this.handleElement) {
            this.handleElement.addEventListener("mousedown", this.handleMouseDown);
            this.handleElement.addEventListener("dragstart", (e) => e.preventDefault());
        }
    }
    removeEventListeners() {
        if (this.handleElement) {
            this.handleElement.removeEventListener("mousedown", this.handleMouseDown);
        }
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
    }
    updateHandlePosition() {
        if (!this.handleElement)
            return;
        const x = this.radius * Math.sin(this.degree * (Math.PI / 180));
        const y = -this.radius * Math.cos(this.degree * (Math.PI / 180));
        this.handleElement.style.left = `${this.radius + x}px`;
        this.handleElement.style.top = `${this.radius + y}px`;
        this.updateDisplay();
        this.dispatchEvent(new CustomEvent("degreeChange", { detail: { degree: this.degree } }));
    }
    updateDisplay() {
        const displayElement = this.shadow.querySelector(".degree-display");
        if (displayElement) {
            if (this.displayDegrees) {
                displayElement.textContent = `${Math.round(this.degree)}°`;
                displayElement.style.display = "block";
                displayElement.style.color = this._disabled ? "#999" : "";
            }
            else {
                displayElement.style.display = "none";
            }
        }
    }
    updateDisabledState() {
        const circle = this.shadow.querySelector(".circle");
        const handle = this.shadow.querySelector(".handle");
        if (circle) {
            circle.style.opacity = this._disabled ? "0.6" : "1";
            circle.style.cursor = this._disabled ? "not-allowed" : "default";
        }
        if (handle) {
            handle.style.cursor = this._disabled ? "not-allowed" : "grab";
        }
        if (this.styleElement) {
            this.styleElement.textContent = `
        :host {
          --control-handle-color: #007bff;
          --handle-color: ${this._disabled ? "var(--control-disabled-color)" : "var(--control-handle-color)"};
          --rotating-input-container-margin: 20px auto;
          --disabled-opacity: .6;
          --control-circle-color: #ccc;
          --control-circle-border: 2px solid var(--control-circle-color);
        }

        .rotating-input-container {
          position: relative;
          width: ${2 * this.radius}px;
          height: ${2 * this.radius}px;
          margin: 20px auto;
          user-select: none;
        }

        .circle {
          width: ${2 * this.radius}px;
          height: ${2 * this.radius}px;
          border-radius: 50%;
          border: var(--control-circle-border);
          position: relative;
          opacity: ${this._disabled ? "var(--disabled-opacity)" : "1"};
          cursor: ${this._disabled ? "not-allowed" : "default"};
        }

        .handle {
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: var(--handle-color);
          border-radius: 50%;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          cursor: ${this._disabled ? "not-allowed" : "grab"};
        }

        .degree-display {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 16px;
          color: ${this._disabled ? "#999" : ""};
        }
      `;
        }
        if (!this._disabled && this.handleElement) {
            this.handleElement.addEventListener("mousedown", this.handleMouseDown);
        }
        else if (this._disabled) {
            this.removeEventListeners();
            this.isDragging = false;
            document.body.style.cursor = "default";
            if (this.handleElement) {
                this.handleElement.style.cursor = "not-allowed";
            }
        }
    }
    get value() {
        return this.degree;
    }
    set value(val) {
        this.degree = val;
        this.updateHandlePosition();
    }
    get disabled() {
        return this._disabled;
    }
    set disabled(val) {
        this._disabled = val;
        if (val) {
            this.setAttribute("disabled", "");
        }
        else {
            this.removeAttribute("disabled");
        }
        this.updateDisabledState();
    }
}

class DualRangeSlider extends HTMLElement {
    static get observedAttributes() {
        return ["min", "max", "step", "value-min", "value-max", "disabled"];
    }
    constructor() {
        super();
        this.sliderMin = null;
        this.sliderMax = null;
        this.rangeFill = null;
        this.trackContainer = null;
        this._min = 0;
        this._max = 100;
        this._step = 1;
        this._valueMin = 25;
        this._valueMax = 75;
        this._disabled = false;
        this.handleMinInput = (event) => {
            if (this._disabled)
                return;
            const target = event.target;
            this.valueMin = parseFloat(target.value);
            this.dispatchInputEvent();
        };
        this.handleMaxInput = (event) => {
            if (this._disabled)
                return;
            const target = event.target;
            this.valueMax = parseFloat(target.value);
            this.dispatchInputEvent();
        };
        this.shadow = this.attachShadow({ mode: "open" });
        this.setupDOM();
        this.applyStyling();
    }
    connectedCallback() {
        this.initializeSliders();
        this.addEventListeners();
        this.updateVisuals();
    }
    disconnectedCallback() {
        this.removeEventListeners();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        let needsReinit = false;
        switch (name) {
            case "min":
            case "max":
            case "step":
                if (name === "min")
                    this.min = parseFloat(newValue ?? "0");
                if (name === "max")
                    this.max = parseFloat(newValue ?? "100");
                if (name === "step")
                    this.step = parseFloat(newValue ?? "1");
                needsReinit = true;
                break;
            case "value-min":
                this.valueMin = parseFloat(newValue ?? String(this._min));
                break;
            case "value-max":
                this.valueMax = parseFloat(newValue ?? String(this._max));
                break;
            case "disabled":
                this.disabled = newValue !== null && newValue !== "false";
                break;
        }
        if (needsReinit && this.isConnected) {
            this.initializeSliders();
            this.updateVisuals();
        }
    }
    get min() {
        return this._min;
    }
    set min(value) {
        const newMin = isNaN(value) ? 0 : value;
        if (this._min !== newMin) {
            this._min = newMin;
        }
    }
    get max() {
        return this._max;
    }
    set max(value) {
        const newMax = isNaN(value) ? 100 : value;
        if (this._max !== newMax) {
            this._max = newMax;
        }
    }
    get step() {
        return this._step;
    }
    set step(value) {
        const newStep = isNaN(value) || value <= 0 ? 1 : value;
        if (this._step !== newStep) {
            this._step = newStep;
        }
    }
    get valueMin() {
        return this._valueMin;
    }
    set valueMin(value) {
        if (isNaN(value))
            return;
        let newValue = Math.min(Math.max(value, this._min), this._max);
        newValue = Math.min(newValue, this._valueMax);
        if (this._valueMin !== newValue) {
            this._valueMin = newValue;
            if (this.isConnected) {
                if (this.sliderMin)
                    this.sliderMin.value = String(newValue);
                this.updateAttribute("value-min", String(newValue));
                this.updateVisuals();
                this.dispatchChangeEvent();
                this.dispatchInputEvent();
            }
        }
        else if (this.isConnected && this.sliderMin && parseFloat(this.sliderMin.value) !== newValue) {
            this.sliderMin.value = String(newValue);
        }
    }
    get valueMax() {
        return this._valueMax;
    }
    set valueMax(value) {
        if (isNaN(value))
            return;
        let newValue = Math.min(Math.max(value, this._min), this._max);
        newValue = Math.max(newValue, this._valueMin);
        if (this._valueMax !== newValue) {
            this._valueMax = newValue;
            if (this.isConnected) {
                if (this.sliderMax)
                    this.sliderMax.value = String(newValue);
                this.updateAttribute("value-max", String(newValue));
                this.updateVisuals();
                this.dispatchChangeEvent();
                this.dispatchInputEvent();
            }
        }
        else if (this.isConnected && this.sliderMax && parseFloat(this.sliderMax.value) !== newValue) {
            this.sliderMax.value = String(newValue);
        }
    }
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        const newValue = !!value;
        if (this._disabled !== newValue) {
            this._disabled = newValue;
            this.applyStyling();
            this.updateDisabledState();
            this.updateAttribute("disabled", String(newValue));
        }
    }
    setupDOM() {
        this.shadow.innerHTML = `
      <div class="wrapper">
        <div class="track-container">
          <div id="range-fill"></div>
          <input type="range" id="slider-min" aria-label="Minimum Value"/>
          <input type="range" id="slider-max" aria-label="Maximum Value"/>
        </div>
      </div>
    `;
        this.sliderMin = this.shadow.getElementById("slider-min");
        this.sliderMax = this.shadow.getElementById("slider-max");
        this.rangeFill = this.shadow.getElementById("range-fill");
        this.trackContainer = this.shadow.querySelector(".track-container");
        if (!this.sliderMin || !this.sliderMax || !this.rangeFill || !this.trackContainer) {
            console.error("DualRangeSlider: Failed to find essential elements in Shadow DOM!");
        }
    }
    applyStyling() {
        const style = document.createElement("style");
        style.textContent = `
        :host {
          display: inline-block;
          width: 300px;
          height: auto;
          padding: 5px 0;
          --track-height: 6px;
          --thumb-size: 16px;
          --fill-color: ${this._disabled ? "var(--control-disabled-color)" : "var(--control-fill-color)"};
          --control-track-color: #ddd;
          --thumb-color: ${this._disabled ? "var(--control-disabled-color)" : "var(--control-thumb-color)"};
          --thumb-hover-color: ${this._disabled ? "var(--control-disabled-color)" : "var(--control-thumb-hover-color)"};
          --thumb-active-color: ${this._disabled ? "var(--control-disabled-color)" : "var(--control-thumb-active-color)"};
          --disabled-opacity: .6;
        }

        :host(.disabled) {
          opacity: var(--disabled-opacity);
          pointer-events: none;
        }

        .wrapper {
          position: relative;
        }
        .track-container {
          position: relative;
          width: ${this.isVertical() ? "var(--thumb-size)" : "100%"};
          height: ${this.isVertical() ? "100%" : "var(--thumb-size)"};
          display: flex;
          align-items: center;
          ${this.isVertical() ? "flex-direction: column;" : ""};
        }
        .track-container::before {
          content: '';
          position: absolute;
          left: ${this.isVertical() ? "50%" : "0"};
          right: ${this.isVertical() ? "auto" : "0"};
          top: ${this.isVertical() ? "0" : "50%"};
          bottom: ${this.isVertical() ? "auto" : "0"};
          transform: ${this.isVertical() ? "translateX(-50%)" : "translateY(-50%)"};
          width: ${this.isVertical() ? "var(--track-height)" : "100%"};
          height: ${this.isVertical() ? "100%" : "var(--track-height)"};
          background-color: var(--control-track-color);
          border-radius: calc(var(--track-height) / 2);
          z-index: 1;
          pointer-events: none;
        }
        #range-fill {
          position: absolute;
          width: ${this.isVertical() ? "var(--track-height)" : "100%"};
          height: ${this.isVertical() ? "100%" : "var(--track-height)"};
          background-color: var(--fill-color);
          border-radius: calc(var(--track-height) / 2);
          left: ${this.isVertical() ? "50%" : "0"};
          right: ${this.isVertical() ? "auto" : "0"};
          top: ${this.isVertical() ? "0" : "50%"};
          bottom: ${this.isVertical() ? "auto" : "0"};
          transform: ${this.isVertical() ? "translateX(-50%)" : "translateY(-50%)"};
          z-index: 2;
          pointer-events: none;
        }
        input[type="range"] {
          position: absolute;
          top: 0;
          left: 0;
          width: ${this.isVertical() ? "var(--thumb-size)" : "100%"};
          height: ${this.isVertical() ? "100%" : "var(--thumb-size)"};
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          margin: 0;
          padding: 0;
          cursor: ${this._disabled ? "default" : "pointer"};
          z-index: 3;
          pointer-events: none;
          ${this.isVertical() ? "writing-mode: vertical-rl;" : ""};
          ${this.isVertical() && this.getDirection() === "rtl" ? "transform: rotate(180deg);" : ""};
        }
        input[type="range"]::-webkit-slider-thumb { pointer-events: ${this._disabled ? "none" : "auto"}; }
        input[type="range"]::-moz-range-thumb { pointer-events: ${this._disabled ? "none" : "auto"}; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: var(--thumb-size);
          height: var(--thumb-size);
          background-color: var(--thumb-color);
          border-radius: 50%;
          border: none;
          cursor: ${this._disabled ? "default" : "pointer"};
          margin-top: ${this.isVertical() ? "0" : "calc((var(--thumb-size) - var(--track-height)) / -2 )"};
          margin-left: ${this.isVertical() ? "calc((var(--thumb-size) - var(--track-height)) / -2 )" : "0"};
          position: relative;
          z-index: 4;
        }
        input[type="range"]:hover::-webkit-slider-thumb { background-color: var(--thumb-hover-color); }
        input[type="range"]:active::-webkit-slider-thumb { background-color: var(--thumb-active-color); }
        input[type="range"]::-moz-range-thumb {
          width: var(--thumb-size);
          height: var(--thumb-size);
          background-color: var(--thumb-color);
          border-radius: 50%;
          border: none;
          cursor: ${this._disabled ? "default" : "pointer"};
          position: relative;
          z-index: 4;
        }
        input[type="range"]:hover::-moz-range-thumb { background-color: var(--thumb-hover-color); }
        input[type="range"]:active::-moz-range-thumb { background-color: var(--thumb-active-color); }
        input[type="range"]::-moz-range-track { background: transparent; border: none; }
      `;
        style.textContent += this.isVertical() ? "" : "";
        this.shadow.appendChild(style);
    }
    initializeSliders() {
        if (!this.sliderMin || !this.sliderMax) {
            console.error("Cannot initialize sliders, elements not found.");
            return;
        }
        this._min = isNaN(this._min) ? 0 : this._min;
        this._max = isNaN(this._max) ? 100 : this._max;
        this._step = isNaN(this._step) || this._step <= 0 ? 1 : this._step;
        if (this._min > this._max) {
            console.warn(`Initial min (${this._min}) > max (${this._max}). Swapping them.`);
            [this._min, this._max] = [this._max, this._min];
        }
        this.sliderMin.min = String(this._min);
        this.sliderMin.max = String(this._max);
        this.sliderMin.step = String(this._step);
        this.sliderMax.min = String(this._min);
        this.sliderMax.max = String(this._max);
        this.sliderMax.step = String(this._step);
        const attrValueMin = this.getAttribute("value-min");
        const attrValueMax = this.getAttribute("value-max");
        let initialMin = attrValueMin !== null ? parseFloat(attrValueMin) : this._valueMin;
        let initialMax = attrValueMax !== null ? parseFloat(attrValueMax) : this._valueMax;
        initialMin = isNaN(initialMin) ? this._min : initialMin;
        initialMax = isNaN(initialMax) ? this._max : initialMax;
        this._valueMin = initialMin;
        this._valueMax = initialMax;
        this.valueMin = initialMin;
        this.valueMax = initialMax;
        this.sliderMin.value = String(this._valueMin);
        this.sliderMax.value = String(this._valueMax);
        this.updateAttribute("value-min", String(this._valueMin));
        this.updateAttribute("value-max", String(this._valueMax));
        this.updateDisabledState();
    }
    addEventListeners() {
        if (!this.sliderMin || !this.sliderMax)
            return;
        this.sliderMin.addEventListener("input", this.handleMinInput);
        this.sliderMax.addEventListener("input", this.handleMaxInput);
    }
    removeEventListeners() {
        if (!this.sliderMin || !this.sliderMax)
            return;
        this.sliderMin.removeEventListener("input", this.handleMinInput);
        this.sliderMax.removeEventListener("input", this.handleMaxInput);
    }
    updateVisuals() {
        if (this.rangeFill && this.trackContainer) {
            const range = this._max - this._min;
            if (range <= 0) {
                if (this.isVertical()) {
                    this.rangeFill.style.top = "0%";
                    this.rangeFill.style.height = "0%";
                    this.rangeFill.style.width = "var(--track-height)";
                    this.rangeFill.style.left = "50%";
                    this.rangeFill.style.transform = "translateX(-50%)";
                }
                else {
                    this.rangeFill.style.left = "0%";
                    this.rangeFill.style.width = "0%";
                    this.rangeFill.style.height = "var(--track-height)";
                    this.rangeFill.style.top = "50%";
                    this.rangeFill.style.transform = "translateY(-50%)";
                }
                return;
            }
            const minPercent = ((this._valueMin - this._min) / range) * 100;
            const maxPercent = ((this._valueMax - this._min) / range) * 100;
            if (this.isVertical()) {
                this.rangeFill.style.top = `${Math.max(0, minPercent)}%`;
                this.rangeFill.style.height = `${Math.min(100, Math.max(0, maxPercent - minPercent))}%`;
                this.rangeFill.style.width = "var(--track-height)";
                this.rangeFill.style.left = "50%";
                this.rangeFill.style.transform = "translateX(-50%)";
            }
            else {
                this.rangeFill.style.left = `${Math.max(0, minPercent)}%`;
                this.rangeFill.style.width = `${Math.min(100, Math.max(0, maxPercent - minPercent))}%`;
                this.rangeFill.style.height = "var(--track-height)";
                this.rangeFill.style.top = "50%";
                this.rangeFill.style.transform = "translateY(-50%)";
            }
            if (this.sliderMin && this.sliderMax) {
                this.sliderMin.style.zIndex = "3";
                this.sliderMax.style.zIndex = "4";
            }
        }
    }
    dispatchChangeEvent() {
        const event = new CustomEvent("change", {
            detail: {
                min: this._valueMin,
                max: this._valueMax
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
    dispatchInputEvent() {
        const event = new CustomEvent("input", {
            detail: {
                min: this._valueMin,
                max: this._valueMax
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
    updateAttribute(attrName, value) {
        if (this.getAttribute(attrName) !== value) {
            this.setAttribute(attrName, value);
        }
    }
    isVertical() {
        const computedStyle = window.getComputedStyle(this);
        return computedStyle.writingMode === "vertical-rl" || computedStyle.writingMode === "vertical-lr";
    }
    getDirection() {
        const computedStyle = window.getComputedStyle(this);
        return computedStyle.direction;
    }
    updateDisabledState() {
        if (this.sliderMin)
            this.sliderMin.disabled = this._disabled;
        if (this.sliderMax)
            this.sliderMax.disabled = this._disabled;
    }
}

var CutPosition;
(function (CutPosition) {
    CutPosition[CutPosition["Top"] = 0] = "Top";
    CutPosition[CutPosition["Bottom"] = 1] = "Bottom";
    CutPosition[CutPosition["Left"] = 2] = "Left";
    CutPosition[CutPosition["Right"] = 3] = "Right";
})(CutPosition || (CutPosition = {}));
class CutPositionUtil {
    static toString(position) {
        return CutPosition[position];
    }
    static fromString(position) {
        const positions = Object.keys(CutPosition);
        let ret;
        positions.forEach((key) => {
            if (typeof CutPosition[key] === "string" && position.toLowerCase() == CutPosition[key].toLowerCase()) {
                ret = key;
            }
        });
        return ret;
    }
}

class Cuts {
    constructor(positions, overlay, url) {
        this.shapes = {};
        this.offsets = {};
        this.rotations = {};
        this._show = false;
        this.positions = {};
        this.overlay = overlay;
        if (url !== undefined) {
            this.url = url;
        }
        this.initCutShapes(positions);
    }
    initCutShapes(positions) {
        positions.forEach((position) => {
            const line = this.createLine();
            line.visible = false;
            const cover = this.createCover();
            cover.visible = false;
            this.shapes[position] = [line, cover];
            this.positions[position] = undefined;
        });
    }
    set url(url) {
        this._url = url;
    }
    get url() {
        if (this._url !== undefined) {
            return this._url.toString();
        }
        return "";
    }
    get cutPostions() {
        return Object.keys(this.shapes);
    }
    get calculatedWidth() {
        let width = this.width;
        if (CutPosition.Left in this.positions && this.positions[CutPosition.Left] !== undefined) {
            width = width - this.positions[CutPosition.Left];
        }
        if (CutPosition.Right in this.positions && this.positions[CutPosition.Right] !== undefined) {
            width = width - (this.width - this.positions[CutPosition.Right]);
        }
        return width;
    }
    get calculatedHeight() {
        let height = this.height;
        if (CutPosition.Top in this.positions && this.positions[CutPosition.Top] !== undefined) {
            height = height - this.positions[CutPosition.Top];
        }
        if (CutPosition.Bottom in this.positions && this.positions[CutPosition.Bottom] !== undefined) {
            height = height - (this.width - this.positions[CutPosition.Bottom]);
        }
        return height;
    }
    getPosition(position) {
        let val;
        if (this.positions[position] !== undefined) {
            val = this.positions[position];
        }
        else if (this.positions[position] === undefined && position == CutPosition.Right) {
            val = this.width;
        }
        else if (this.positions[position] === undefined && position == CutPosition.Left) {
            val = 0;
        }
        else if (this.positions[position] === undefined && position == CutPosition.Bottom) {
            val = this.height;
        }
        else if (this.positions[position] === undefined && position == CutPosition.Top) {
            val = 0;
        }
        else {
            throw new Error("Unknown CutPosition, this should never happen!");
        }
        return val;
    }
    square() {
        const changes = [];
        if (this.lastAxis === undefined) {
            if (this.height > this.width) {
                changes.push({ position: CutPosition.Bottom, value: this.width });
            }
            else if (this.height < this.width) {
                changes.push({ position: CutPosition.Right, value: this.height });
            }
        }
        else {
            const width = this.calculatedWidth;
            const height = this.calculatedHeight;
            if (height == width) {
                return false;
            }
            let side;
            if (this.lastAxis == CutPosition.Left || this.lastAxis == CutPosition.Right) {
                side = width;
                if (this.height < side) {
                    side = this.height;
                }
                if (this.lastAxis == CutPosition.Left && this.width - this.getPosition(CutPosition.Left) < side) {
                    side = this.width - this.getPosition(CutPosition.Left);
                }
                if (this.lastAxis == CutPosition.Right && this.getPosition(CutPosition.Right) < side) {
                    side = this.getPosition(CutPosition.Right);
                }
            }
            else if (this.lastAxis == CutPosition.Top || this.lastAxis == CutPosition.Bottom) {
                side = height;
                if (this.width < side) {
                    side = this.width;
                }
                if (this.lastAxis == CutPosition.Top && this.width - this.getPosition(CutPosition.Top) < side) {
                    side = this.width - this.getPosition(CutPosition.Top);
                }
                if (this.lastAxis == CutPosition.Bottom && this.getPosition(CutPosition.Bottom) < side) {
                    side = this.getPosition(CutPosition.Bottom);
                }
            }
            else {
                if (this.height > this.width) {
                    side = this.width;
                }
                else {
                    side = this.height;
                }
            }
            if (this.lastAxis == CutPosition.Left || this.lastAxis == CutPosition.Right) {
                if (this.lastAxis == CutPosition.Left) {
                    changes.push({ position: CutPosition.Right, value: this.getPosition(CutPosition.Left) + side });
                }
                else if (this.lastAxis == CutPosition.Right) {
                    changes.push({ position: CutPosition.Left, value: this.getPosition(CutPosition.Right) - side });
                }
                if (this.getPosition(CutPosition.Top) + side <= this.height) {
                    changes.push({ position: CutPosition.Bottom, value: this.getPosition(CutPosition.Top) + side });
                }
                else {
                    changes.push({ position: CutPosition.Bottom, value: this.height });
                    changes.push({ position: CutPosition.Top, value: this.height - side });
                }
            }
            else if (this.lastAxis == CutPosition.Top || this.lastAxis == CutPosition.Bottom) {
                if (this.lastAxis == CutPosition.Top) {
                    changes.push({ position: CutPosition.Bottom, value: this.getPosition(CutPosition.Top) + side });
                }
                else if (this.lastAxis == CutPosition.Bottom) {
                    changes.push({ position: CutPosition.Top, value: this.getPosition(CutPosition.Bottom) - side });
                }
                if (this.getPosition(CutPosition.Left) + side <= this.width) {
                    changes.push({ position: CutPosition.Right, value: this.getPosition(CutPosition.Left) + side });
                }
                else {
                    changes.push({ position: CutPosition.Right, value: this.width });
                    changes.push({ position: CutPosition.Left, value: this.width - side });
                }
            }
        }
        if (changes.length) {
            changes.forEach((change) => {
                this.update(change.position, change.value);
            });
            return true;
        }
        return false;
    }
    createLine(width = 5) {
        const line = new Line([0, 0, 0, 0], {
            strokeWidth: width,
            stroke: "red",
            hasControls: false,
            visible: false
        });
        this.overlay.fabricCanvas().add(line);
        return line;
    }
    createCover(opacity = 0.4, fill = "white") {
        const rect = new Rect({
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            strokeWidth: 0,
            hasControls: false,
            opacity: opacity,
            fill: fill,
            visible: false
        });
        this.overlay.fabricCanvas().add(rect);
        return rect;
    }
    allPositions() {
        const allPositions = Object.values(CutPosition)
            .filter((value) => typeof value === "number")
            .map((value) => value);
        const all = {};
        allPositions.forEach((position) => {
            if (!(position in this.positions) || this.positions[position] === undefined) {
                if (position == CutPosition.Top) {
                    all[position] = 0;
                }
                else if (position == CutPosition.Bottom) {
                    if (this.height !== undefined) {
                        all[position] = this.height;
                    }
                    else {
                        all[position] = 0;
                    }
                }
                else if (position == CutPosition.Right) {
                    if (this.width !== undefined) {
                        all[position] = this.width;
                    }
                    else {
                        all[position] = 0;
                    }
                }
                else if (position == CutPosition.Left) {
                    all[position] = 0;
                }
            }
            else {
                all[position] = this.positions[position];
            }
        });
        return all;
    }
    getLine(position) {
        if (position in this.positions && this.shapes[position] !== undefined) {
            return this.shapes[position][0];
        }
        return undefined;
    }
    getCover(position) {
        if (position in this.positions && this.shapes[position] !== undefined) {
            return this.shapes[position][1];
        }
        return undefined;
    }
    setLineWidth(position, width) {
        if (position in this.positions && this.shapes[position] !== undefined) {
            this.shapes[position][0].set({
                strokeWidth: width
            });
            this.shapes[position][0].setCoords();
            this.shapes[position][0].canvas?.renderAll();
        }
    }
    setVisibility(show) {
        if (show === undefined) {
            show = !this._show;
        }
        if (this.shapes !== undefined) {
            const validPositions = Object.keys(this.shapes);
            validPositions.forEach((position) => {
                if (this.shapes[position] !== undefined) {
                    this.shapes[position][0].visible = show;
                    this.shapes[position][1].visible = show;
                    this.shapes[position][1].canvas?.renderAll();
                }
            });
        }
        this._show = show;
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
        const validPositions = Object.keys(this.positions);
        validPositions.forEach((position) => {
            if (this.shapes[position] === undefined) {
                return;
            }
            const line = this.shapes[position][0];
            const cover = this.shapes[position][1];
            if (position == CutPosition.Top) {
                line.set({
                    x1: 0,
                    y1: 0,
                    x2: width,
                    y2: 0
                });
                cover.set({
                    left: 0,
                    top: 0,
                    width: width,
                    height: 0
                });
            }
            else if (position == CutPosition.Bottom) {
                line.set({
                    x1: 0,
                    y1: height,
                    x2: width,
                    y2: height
                });
                cover.set({
                    left: 0,
                    top: height,
                    width: width,
                    height: height
                });
            }
            else if (position == CutPosition.Right) {
                line.set({
                    x1: width,
                    y1: 0,
                    x2: width,
                    y2: height
                });
                cover.set({
                    left: width,
                    top: 0,
                    width: width,
                    height: height
                });
            }
            else if (position == CutPosition.Left) {
                line.set({
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: height
                });
                cover.set({
                    left: 0,
                    top: 0,
                    width: 0,
                    height: height
                });
            }
            else {
                throw new Error("Not a valid position");
            }
            line.setCoords();
            cover.setCoords();
            line.canvas?.renderAll();
        });
    }
    set offsetX(offset) {
        if (offset < 0) {
            this.offsets[CutPosition.Left] = offset;
            if (CutPosition.Right in this.offsets) {
                delete this.offsets[CutPosition.Right];
            }
            this.lastAxis = CutPosition.Left;
        }
        else if (offset > 0) {
            this.offsets[CutPosition.Right] = offset;
            if (CutPosition.Left in this.offsets) {
                delete this.offsets[CutPosition.Left];
            }
            this.lastAxis = CutPosition.Right;
        }
        if (offset != 0) {
            this.notify();
        }
    }
    set offsetY(offset) {
        if (offset < 0) {
            this.offsets[CutPosition.Top] = offset;
            if (CutPosition.Bottom in this.offsets) {
                delete this.offsets[CutPosition.Bottom];
            }
            this.lastAxis = CutPosition.Top;
        }
        else if (offset > 0) {
            this.offsets[CutPosition.Bottom] = offset;
            if (CutPosition.Top in this.offsets) {
                delete this.offsets[CutPosition.Top];
            }
            this.lastAxis = CutPosition.Bottom;
        }
        if (offset != 0) {
            this.notify();
        }
    }
    set rotateX(deg) {
        if (this.rotations[CutPosition.Right] != deg) {
            this.rotations[CutPosition.Right] = deg;
            this.notify();
        }
    }
    set rotateY(deg) {
        if (this.rotations[CutPosition.Bottom] != deg) {
            this.rotations[CutPosition.Bottom] = deg;
            this.notify();
        }
    }
    update(position, pos) {
        if (this.shapes[position] === undefined) {
            return;
        }
        if (this.positions[position] == pos) {
            return;
        }
        if (position == CutPosition.Bottom &&
            CutPosition.Top in this.positions &&
            this.positions[CutPosition.Top] !== undefined &&
            this.positions[CutPosition.Top] > pos) {
            this.positions[CutPosition.Top] = pos;
        }
        else if (position == CutPosition.Top &&
            CutPosition.Bottom in this.positions &&
            this.positions[CutPosition.Bottom] !== undefined &&
            this.positions[CutPosition.Bottom] > pos) {
            this.positions[CutPosition.Bottom] = pos;
        }
        else if (position == CutPosition.Right &&
            CutPosition.Left in this.positions &&
            this.positions[CutPosition.Left] !== undefined &&
            this.positions[CutPosition.Left] > pos) {
            this.positions[CutPosition.Left] = pos;
        }
        else if (position == CutPosition.Left &&
            CutPosition.Right in this.positions &&
            this.positions[CutPosition.Right] !== undefined &&
            this.positions[CutPosition.Right] < pos) {
            this.positions[CutPosition.Right] = pos;
        }
        this.positions[position] = pos;
        const line = this.shapes[position][0];
        const cover = this.shapes[position][1];
        if (position == CutPosition.Bottom || position == CutPosition.Top) {
            line.set({
                x1: 0,
                y1: pos,
                x2: this.width,
                y2: pos
            });
            if (position == CutPosition.Bottom) {
                cover.set({
                    left: 0,
                    top: pos,
                    width: this.width,
                    height: this.height - pos
                });
            }
            else {
                cover.set({
                    left: 0,
                    top: 0,
                    width: this.width,
                    height: pos
                });
            }
        }
        else if (position == CutPosition.Right || position == CutPosition.Left) {
            line.set({
                x1: pos,
                y1: 0,
                x2: pos,
                y2: this.height
            });
            if (position == CutPosition.Right) {
                cover.set({
                    left: pos,
                    top: 0,
                    width: this.width - pos,
                    height: this.height
                });
            }
            else {
                cover.set({
                    left: 0,
                    top: 0,
                    width: pos,
                    height: this.height
                });
            }
        }
        else {
            throw new Error("THis should never happen!");
        }
        this.lastAxis = position;
        line.setCoords();
        cover.setCoords();
        line.canvas?.renderAll();
        this.notify();
    }
    set callback(func) {
        this.changeCallback = [];
        this.changeCallback.push(func);
    }
    addCallback(func) {
        if (this.changeCallback !== undefined) {
            this.changeCallback = [];
        }
        this.changeCallback.push(func);
    }
    notify() {
        if (this.changeCallback !== undefined) {
            this.changeCallback.forEach((fn) => {
                const notification = [{}];
                notification[0] = this.allPositions();
                if (this.offsets !== undefined) {
                    notification[1] = this.offsets;
                }
                if (this.rotations !== undefined) {
                    notification[2] = this.rotations;
                }
                fn(notification);
            });
        }
    }
    static expandPositions(cutPostions, all = false) {
        const positions = {};
        let validPositions;
        if (!all) {
            validPositions = Object.keys(cutPostions);
        }
        else {
            validPositions = Object.keys(CutPosition);
        }
        validPositions.forEach((key) => {
            if (key in cutPostions && cutPostions[key] !== undefined) {
                positions[CutPositionUtil.toString(key)] = cutPostions[key];
            }
            else {
                positions[CutPositionUtil.toString(key)] = 0;
            }
        });
        return positions;
    }
    toJSON() {
        const json = {
            url: this.url,
            width: this.width,
            height: this.height
        };
        const cuts = Cuts.expandPositions(this.positions);
        if (this.positions !== undefined && Object.keys(cuts).length) {
            json["cuts"] = cuts;
        }
        const offsets = Cuts.expandPositions(this.offsets);
        if (this.offsets !== undefined && Object.keys(offsets).length) {
            json["offsets"] = offsets;
        }
        const rotations = Cuts.expandPositions(this.rotations);
        if (this.rotations !== undefined && Object.keys(rotations).length) {
            json["rotations"] = rotations;
        }
        return json;
    }
    toJSONLD() {
        const fragSelector = `xywh=0,0,${this.width},${this.height}`;
        const json = {
            id: "",
            motivation: "editing",
            type: "Annotation",
            body: {
                type: "Dataset",
                id: "",
                value: {}
            },
            target: {
                source: this.url,
                type: "SpecificResource",
                selector: {
                    type: "FragmentSelector",
                    value: fragSelector
                }
            }
        };
        const value = {};
        const cuts = Cuts.expandPositions(this.positions, true);
        if (this.positions !== undefined && Object.keys(cuts).length) {
            value.cuts = cuts;
        }
        const offsets = Cuts.expandPositions(this.offsets, true);
        if (this.offsets !== undefined && Object.keys(offsets).length) {
            value.offsets = offsets;
        }
        const rotations = Cuts.expandPositions(this.rotations, true);
        if (this.rotations !== undefined && Object.keys(rotations).length) {
            value.rotations = rotations;
        }
        json.body.value = value;
        let rotation = "";
        if ("Bottom" in rotations && rotations.Bottom !== 0) {
            rotation += ` rotate(${rotations.Bottom}, ${Math.ceil(this.width / 2)}, ${this.height})`;
        }
        if ("Right" in rotations && rotations.Right !== 0) {
            rotation += ` rotate(${rotations.Right}, ${this.width}, ${Math.ceil(this.height / 2)})`;
        }
        let svgPattern = `
    <pattern id="pattern" width="${this.width}" height="${this.height}" x="${offsets.Right}" y="${offsets.Bottom}">
      <clipPath id="cuts">
        <rect x="${cuts.Left}" y="${cuts.Top}" width="${cuts.Right - cuts.Left}" height="${cuts.Bottom - cuts.Top}" transform="${rotation}" />
      </clipPath>
    </pattern>`;
        svgPattern = svgPattern.replace(/\n|\r/g, "");
        json.body.value = svgPattern;
        return json;
    }
    loadJSON(json) {
        this.url = new URL(json.url);
        this.width = json.width;
        this.height = json.height;
        this.initCutShapes(this.cutPostions);
        this.setSize(this.width, this.height);
        if ("cuts" in json && json.cuts !== undefined) {
            Object.keys(json.cuts).forEach((key) => {
                const typedKey = CutPositionUtil.fromString(key);
                if (typedKey !== undefined && json.cuts !== undefined && json.cuts[key] !== undefined) {
                    this.positions[typedKey] = json.cuts[key];
                }
            });
        }
        if ("offsets" in json && json.offsets !== undefined) {
            Object.keys(json.offsets).forEach((key) => {
                const typedKey = CutPositionUtil.fromString(key);
                if (typedKey !== undefined && json.offsets !== undefined && json.offsets[key] !== undefined) {
                    this.offsets[typedKey] = json.offsets[key];
                }
            });
        }
        if ("rotations" in json && json.rotations !== undefined) {
            Object.keys(json.rotations).forEach((key) => {
                const typedKey = CutPositionUtil.fromString(key);
                if (typedKey !== undefined && json.rotations !== undefined && json.rotations[key] !== undefined) {
                    this.rotations[typedKey] = json.rotations[key];
                }
            });
        }
        this.setVisibility(true);
        this.notify();
    }
    loadJSONLD(json) {
        const dimensions = json.target.selector.value.split("=")[1].split(",");
        const cutJson = {
            url: json.target.source,
            width: Number(dimensions[2]),
            height: Number(dimensions[3])
        };
        if (typeof json.body.value !== "string" && "cuts" in json.body.value) {
            cutJson.cuts = json.body.value.cuts;
        }
        if (typeof json.body.value !== "string" && "offsets" in json.body.value) {
            cutJson.offsets = json.body.value.offsets;
        }
        if (typeof json.body.value !== "string" && "rotations" in json.body.value) {
            cutJson.rotations = json.body.value.rotations;
        }
        if (typeof json.body.value === "string") {
            const parser = new DOMParser();
            const svg = parser.parseFromString(json.body.value, "image/svg+xml");
            const patternElement = svg.querySelector("pattern");
            const offsets = {};
            if (patternElement.hasAttribute("x") && patternElement.getAttribute("x") !== "0") {
                offsets.Right = Number(patternElement.getAttribute("x"));
            }
            if (patternElement.hasAttribute("y") && patternElement.getAttribute("y") !== "0") {
                offsets.Bottom = Number(patternElement.getAttribute("y"));
            }
            if (Object.keys(offsets).length) {
                cutJson.offsets = offsets;
            }
            const rectElement = svg.querySelector("rect");
            const cuts = { Left: 0, Top: 0, Right: Number(dimensions[2]), Bottom: Number(dimensions[3]) };
            if (rectElement.hasAttribute("x") && rectElement.getAttribute("x") !== "0") {
                cuts.Left = Number(rectElement.getAttribute("x"));
            }
            if (rectElement.hasAttribute("y") && rectElement.getAttribute("y") !== "0") {
                cuts.Top = Number(rectElement.getAttribute("y"));
            }
            if (rectElement.hasAttribute("width") && rectElement.getAttribute("width") !== "0") {
                cuts.Right = Number(rectElement.getAttribute("x")) + Number(rectElement.getAttribute("width"));
            }
            if (rectElement.hasAttribute("height") && rectElement.getAttribute("height") !== "0") {
                cuts.Bottom = Number(rectElement.getAttribute("y")) + Number(rectElement.getAttribute("height"));
            }
            if (Object.keys(cuts).length) {
                cutJson.cuts = cuts;
            }
            const rotations = {};
            if (rectElement.hasAttribute("transform") && rectElement.getAttribute("transform") !== "") {
                const transform = rectElement.getAttribute("transform");
                const re = /rotate\((.*?)\)/g;
                let match;
                while ((match = re.exec(transform))) {
                    if (match.length < 2) {
                        continue;
                    }
                    const rotValues = match[1].split(",").map((item) => {
                        return item.trim();
                    });
                    if (rotValues[0] !== "0") {
                        if (rotValues[1] == dimensions[2]) {
                            rotations.Right = Number(rotValues[0]);
                        }
                        else if (rotValues[2] == dimensions[3]) {
                            rotations.Bottom = Number(rotValues[0]);
                        }
                    }
                }
            }
            if (Object.keys(rotations).length) {
                cutJson.rotations = rotations;
            }
        }
        this.loadJSON(cutJson);
    }
}

class ImageResolutionSelect extends HTMLElement {
    constructor() {
        super();
        this.options = [
            { value: "custom", label: i18next.t("imageResolutionSelect:custom") },
            { value: "1920x1080", label: "1080p (Full HD) (1920x1080)" },
            { value: "1280x720", label: "720p (HD) (1280x720)" },
            { value: "800x600", label: "SVGA (800x600)" },
            { value: "640x480", label: "VGA (640x480)" },
            { value: "1080x1080", label: "Instagram Post (1080x1080)" },
            { value: "1080x1920", label: "Instagram Story (1080x1920)" },
            { value: "1200x630", label: "Facebook Post (1200x630)" },
            { value: "1280x720", label: "YouTube Thumbnail (1280x720)" }
        ];
        this._disabled = false;
        this._value = null;
        this._selectedIndex = -1;
        this._customWidth = 0;
        this._customHeight = 0;
        this.customInputs = null;
        this.confirmButton = null;
        this.shadow = this.attachShadow({ mode: "open" });
        this.displayElement = document.createElement("div");
        this.displayElement.classList.add("display");
        this.optionsContainer = document.createElement("div");
        this.optionsContainer.classList.add("options-container");
        this.setupDOM();
        this.applyStyles();
        this.setupEventListeners();
        this.mergeOptions();
    }
    mergeOptions() {
        const childOptions = Array.from(this.children)
            .filter((child) => child.tagName.toLowerCase() === "option")
            .map((child) => ({
            value: child.getAttribute("value") || "",
            label: child.textContent || ""
        }));
        const allOptions = [...this.options, ...childOptions];
        const uniqueOptions = [];
        const seenValues = new Set();
        for (const option of allOptions) {
            if (!seenValues.has(option.value)) {
                uniqueOptions.push(option);
                seenValues.add(option.value);
            }
        }
        const customOption = uniqueOptions.shift();
        uniqueOptions.sort((a, b) => {
            const [widthA, heightA] = (a.value.match(/\d+x\d+/) ? a.value : "0x0").split("x").map(Number);
            const [widthB, heightB] = (b.value.match(/\d+x\d+/) ? b.value : "0x0").split("x").map(Number);
            return widthB * heightB - widthA * heightA;
        });
        uniqueOptions.forEach((option) => {
            if (option.value.match(/\d+x\d+/)) {
                if (!option.label.includes(option.value)) {
                    option.label += ` (${option.value})`;
                }
            }
        });
        if (customOption) {
            this.options = [customOption, ...uniqueOptions];
        }
        else {
            this.options = uniqueOptions;
        }
    }
    connectedCallback() {
        this.populateOptions();
        this.showCustomInputs();
        if (this.confirmButton) {
            this.enableConfirmButton();
        }
    }
    static get observedAttributes() {
        return ["disabled", "value", "custom-width", "custom-height", "confirm-button"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (name === "disabled") {
            this.disabled = newValue !== null;
        }
        else if (name === "value") {
            this.value = newValue;
        }
        else if (name === "custom-width") {
            this._customWidth = newValue ? parseInt(newValue) || 0 : 0;
            this.updateCustomInputs();
        }
        else if (name === "custom-height") {
            this._customHeight = newValue ? parseInt(newValue) || 0 : 0;
            this.updateCustomInputs();
        }
    }
    get customWidth() {
        return this._customWidth;
    }
    set customWidth(value) {
        this._customWidth = value;
        this.updateCustomInputs();
    }
    get customHeight() {
        return this._customHeight;
    }
    set customHeight(value) {
        this._customHeight = value;
        this.updateCustomInputs();
    }
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = value;
        this.updateDisabledState();
    }
    get value() {
        return this._value;
    }
    set value(newValue) {
        if (this._value !== newValue) {
            this._value = newValue;
            this.updateDisplay();
        }
    }
    get optionsData() {
        return this.options;
    }
    set optionsData(newOptions) {
        this.options = [{ value: "custom", label: "Custom" }, ...newOptions];
        this.populateOptions();
    }
    setupDOM() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("wrapper");
        wrapper.appendChild(this.displayElement);
        wrapper.appendChild(this.optionsContainer);
        this.shadow.appendChild(wrapper);
    }
    applyStyles() {
        const style = document.createElement("style");
        style.textContent = `
      :host {
        display: inline-block;
        --btn-bg-color: #66afff;
        --btn-font-size: 1em;
        --font-family: sans-serif;
        --disabled-opacity: .6;
        --btn-disabled-bg-color: #cccccc;
        --btn-disabled-text-color: #666666;
        --btn-disabled-cursor: not-allowed;
        --btn-hover-bg-color: #007bff;
        --btn-hover-tansition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
        --btn-border-radius: 0.4rem;
        --btn-border: none;
        --btn-padding: 8px 16px;
        --disabled-opacity: .6;
      }

      :host(.disabled) {
        opacity: var(--disabled-opacity);
        pointer-events: none;
      }

      .wrapper {
        position: relative;
        display: inline-block;
        min-width: 14em;
        font-size: var(--btn-font-size);
        font-family: var(--font-family);
      }

      .display {
        border: var(--btn-border);
        padding: var(--btn-padding);
        background-color: var(--btn-bg-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        width: 100%;
        border-radius: var(--btn-border-radius);
        color: var(--btn-text-color);
      }

      .display.disabled {
        background-color: var(--btn-disabled-bg-color);
        color: var(--btn-disabled-text-color);
        opacity: var(--disabled-opacity);
        pointer-events: none;
        cursor: var(--btn-disabled-cursor);
      }

      .options-container {
        position: absolute;
        top: 100%;
        left: 0;
        display: none;
        border: 1px solid #ccc;
        background-color: white;
        z-index: 10;
        border-radius: var(--btn-border-radius);
      }

      .options-container.open {
        display: block;
      }

      .option {
        padding: 8px;
        display: flex;
        align-items: center;
        cursor: pointer;
        white-space: nowrap;
      }

      .option.selected {
        background-color: #f0f0f0;
      }

      .custom-inputs {
        display: flex;
        align-items: center;
      }

      .custom-inputs input {
        width: 60px;
        margin: 0 4px;
      }

      .custom-inputs button {
        margin-left: 4px;
        transition: var(--btn-hover-tansition);
        border-radius: var(--btn-border-radius);
        background-color: var(--btn-bg-color);
        font-size: var(--btn-font-size);
        color: var(--btn-text-color);
        var(--btn-border);
        padding: var(--btn-padding);
        font-family: var(--font-family)
      }

      .custom-inputs button:hover:not(:disabled) {
        background-color: var(--btn-hover-bg-color);
      }

      .custom-inputs button:disabled {
        background-color: var(--btn-disabled-bg-color);
        color: var(--btn-disabled-text-color);
        cursor: var(--btn-disabled-cursor);
      }
    `;
        this.shadow.appendChild(style);
    }
    setupEventListeners() {
        this.displayElement.addEventListener("click", (event) => {
            event.stopPropagation();
            if (!this.disabled) {
                this.optionsContainer.classList.toggle("open");
                if (this.optionsContainer.classList.contains("open")) {
                    this._selectedIndex = -1;
                }
            }
        });
        document.addEventListener("click", (event) => {
            if (!this.shadow.contains(event.target) && this.optionsContainer.classList.contains("open")) {
                this.optionsContainer.classList.remove("open");
            }
        });
        this.displayElement.addEventListener("keydown", (event) => {
            if (this.disabled)
                return;
            if (event.key === "ArrowDown") {
                event.preventDefault();
                this.navigateOptions(1);
            }
            else if (event.key === "ArrowUp") {
                event.preventDefault();
                this.navigateOptions(-1);
            }
            else if (event.key === "Enter" && this._selectedIndex !== -1) {
                event.preventDefault();
                this.selectOption(this._selectedIndex);
            }
            else if (event.key === "Escape") {
                this.optionsContainer.classList.remove("open");
            }
        });
        this.displayElement.setAttribute("tabindex", "0");
    }
    navigateOptions(direction) {
        if (!this.optionsContainer.classList.contains("open")) {
            this.optionsContainer.classList.add("open");
        }
        this._selectedIndex += direction;
        if (this._selectedIndex < 0) {
            this._selectedIndex = this.options.length - 1;
        }
        else if (this._selectedIndex >= this.options.length) {
            this._selectedIndex = 0;
        }
        this.updateOptionSelection();
    }
    selectOption(index) {
        if (index >= 0 && index < this.options.length) {
            this.value = this.options[index].value;
            this.optionsContainer.classList.remove("open");
            let detailValue = this.options[index].value;
            if (this.options[index].value !== "custom") {
                const [width, height] = this.options[index].value.split("x").map(Number);
                if (!isNaN(width) && !isNaN(height)) {
                    this._customWidth = width;
                    this._customHeight = height;
                    this.updateCustomInputs();
                    detailValue = [width, height];
                }
            }
            else {
                detailValue = [this._customWidth, this._customHeight];
            }
            this.dispatchEvent(new CustomEvent("change", { detail: detailValue }));
        }
    }
    updateOptionSelection() {
        Array.from(this.optionsContainer.children).forEach((option, index) => {
            if (index === this._selectedIndex) {
                option.classList.add("selected");
                option.scrollIntoView({ block: "nearest" });
            }
            else {
                option.classList.remove("selected");
            }
        });
    }
    populateOptions() {
        this.optionsContainer.innerHTML = "";
        this.options.forEach((option, index) => {
            const optionElement = document.createElement("div");
            optionElement.classList.add("option");
            optionElement.dataset.value = option.value;
            optionElement.textContent = option.label;
            optionElement.addEventListener("click", () => {
                this.selectOption(index);
            });
            this.optionsContainer.appendChild(optionElement);
        });
        this.updateDisplay();
        this.updateDisabledState();
    }
    updateDisplay() {
        const selectedOption = this.options.find((option) => option.value === this.value);
        if (selectedOption) {
            this.displayElement.textContent = selectedOption.label;
        }
        else {
            this.displayElement.textContent = this.options[0].label;
        }
    }
    updateDisabledState() {
        if (this.disabled) {
            this.displayElement.classList.add("disabled");
            this.displayElement.setAttribute("tabindex", "-1");
        }
        else {
            this.displayElement.classList.remove("disabled");
            this.displayElement.setAttribute("tabindex", "0");
        }
    }
    showCustomInputs() {
        if (!this.customInputs) {
            this.customInputs = document.createElement("div");
            this.customInputs.classList.add("custom-inputs");
            const widthInput = document.createElement("input");
            widthInput.type = "number";
            widthInput.value = this._customWidth.toString();
            widthInput.addEventListener("change", (e) => {
                this._customWidth = parseInt(e.target.value) || 0;
                this.updateCustomValue();
                this.enableConfirmButton();
            });
            widthInput.addEventListener("click", (event) => {
                event.stopPropagation();
            });
            const heightInput = document.createElement("input");
            heightInput.type = "number";
            heightInput.value = this._customHeight.toString();
            heightInput.addEventListener("change", (e) => {
                this._customHeight = parseInt(e.target.value) || 0;
                this.updateCustomValue();
                this.enableConfirmButton();
            });
            heightInput.addEventListener("click", (event) => {
                event.stopPropagation();
            });
            const x = document.createTextNode("x");
            this.customInputs.appendChild(widthInput);
            this.customInputs.appendChild(x);
            this.customInputs.appendChild(heightInput);
            if (this.hasAttribute("confirm-button")) {
                this.confirmButton = document.createElement("button");
                this.confirmButton.textContent = i18next.t("imageResolutionSelect:confirmButton");
                this.confirmButton.addEventListener("click", (event) => {
                    event.stopPropagation();
                    this.confirmCustomSelection();
                });
                this.confirmButton.disabled = true;
                this.confirmButton.style.display = "none";
                this.customInputs.appendChild(this.confirmButton);
            }
            const customOption = Array.from(this.optionsContainer.children).find((option) => {
                return option.dataset.value === "custom";
            });
            if (customOption) {
                const initialLabel = this.getCustomOption().label;
                customOption.innerHTML = "";
                customOption.appendChild(document.createTextNode(`${initialLabel} (`));
                customOption.appendChild(this.customInputs);
                customOption.appendChild(document.createTextNode(")"));
            }
        }
        this.customInputs.style.display = "flex";
    }
    updateCustomInputs() {
        if (this.customInputs) {
            const widthInput = this.customInputs.querySelector("input[type='number']:first-of-type");
            const heightInput = this.customInputs.querySelector("input[type='number']:last-of-type");
            if (widthInput) {
                widthInput.value = this._customWidth.toString();
            }
            if (heightInput) {
                heightInput.value = this._customHeight.toString();
            }
        }
    }
    updateCustomValue() {
        this.value = `${this._customWidth}x${this._customHeight}`;
    }
    confirmCustomSelection() {
        this.selectOption(0);
    }
    enableConfirmButton() {
        if (this.confirmButton) {
            this.confirmButton.disabled = false;
            this.confirmButton.style.display = "inline-block";
        }
    }
    getCustomOption() {
        return this.options.filter((opt) => opt.value === "custom")[0];
    }
}

class CanvasDownloadButton extends HTMLElement {
    constructor() {
        super();
        this._disabled = true;
        this._fileName = "canvas-image";
        this._format = "png";
        this._internallySettingFormat = false;
        this._height = null;
        this._width = null;
        this.shadow = this.attachShadow({ mode: "open" });
        this._button = document.createElement("button");
        this._button.className = "download-button";
        this._button.part = "button";
        this._button.textContent = i18next.t("canvasDownloadButton:download");
        this._button.addEventListener("click", this._initiateDownload.bind(this));
        this.shadow.appendChild(this._button);
        this._applyStyles();
        this._updateButtonState();
    }
    connectedCallback() {
        this._reflectAttribute("disabled", this.hasAttribute("disabled"));
        this._reflectAttribute("button-text", this.getAttribute("button-text") || i18next.t("canvasDownloadButton:download"));
        this._reflectAttribute("file-name", this.getAttribute("file-name") || "canvas-image");
        this._reflectAttribute("format", this.getAttribute("format") || "png");
        this._reflectAttribute("height", this.getAttribute("height"));
        this._reflectAttribute("width", this.getAttribute("width"));
        this._updateButtonState();
    }
    static get observedAttributes() {
        return ["disabled", "button-text", "file-name", "format", "height", "width"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this._internallySettingFormat && name === "format") {
            return;
        }
        switch (name) {
            case "disabled":
                this.disabled = newValue !== null;
                break;
            case "button-text":
                this.buttonText = newValue || i18next.t("canvasDownloadButton:download");
                break;
            case "file-name":
                this.fileName = newValue || "canvas-image";
                break;
            case "format":
                this.format = newValue || "png";
                break;
            case "height":
                this.height = newValue ? parseInt(newValue, 10) : null;
                break;
            case "width":
                this.width = newValue ? parseInt(newValue, 10) : null;
                break;
        }
    }
    _reflectAttribute(name, value) {
        switch (name) {
            case "disabled":
                this._disabled = !!value;
                break;
            case "button-text":
                this.buttonText = String(value);
                break;
            case "file-name":
                this.fileName = String(value);
                break;
            case "format":
                this.format = String(value);
                break;
            case "height":
                this.height = value !== null ? parseInt(String(value), 10) : null;
                break;
            case "width":
                this.width = value !== null ? parseInt(String(value), 10) : null;
                break;
        }
    }
    get canvas() {
        return this._canvas;
    }
    set canvas(canvasInstance) {
        this._canvas = canvasInstance;
        this._updateButtonState();
    }
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        const trulyDisabled = Boolean(value);
        if (this._disabled !== trulyDisabled) {
            this._disabled = trulyDisabled;
            if (trulyDisabled) {
                this.setAttribute("disabled", "");
            }
            else {
                this.removeAttribute("disabled");
            }
            this._updateButtonState();
        }
    }
    get buttonText() {
        return this._button?.textContent ?? "";
    }
    set buttonText(value) {
        const text = String(value || i18next.t("canvasDownloadButton:download"));
        if (this._button && this._button.textContent !== text) {
            this._button.textContent = text;
        }
    }
    get fileName() {
        return this._fileName;
    }
    set fileName(value) {
        const name = String(value || "canvas-image");
        if (this._fileName !== name) {
            this._fileName = name;
        }
    }
    get format() {
        return this._format;
    }
    set format(value) {
        this._internallySettingFormat = true;
        let newFormat = String(value || "png").toLowerCase();
        if (newFormat !== "png" && newFormat !== "jpeg") {
            console.warn(`Invalid format "${newFormat}". Defaulting to PNG.`);
            newFormat = "png";
        }
        if (this._format !== newFormat) {
            this._format = newFormat;
            this.setAttribute("format", this._format);
        }
        this._internallySettingFormat = false;
    }
    get height() {
        return this._height;
    }
    set height(value) {
        const numValue = value === null ? null : Number(value);
        if (this._height !== numValue) {
            this._height = numValue;
            if (numValue !== null && !isNaN(numValue)) {
                this.setAttribute("height", String(numValue));
            }
            else {
                this.removeAttribute("height");
                this._height = null;
            }
            this._updateButtonState();
        }
    }
    get width() {
        return this._width;
    }
    set width(value) {
        const numValue = value === null ? null : Number(value);
        if (this._width !== numValue) {
            this._width = numValue;
            if (numValue !== null && !isNaN(numValue)) {
                this.setAttribute("width", String(numValue));
            }
            else {
                this.removeAttribute("width");
                this._width = null;
            }
            this._updateButtonState();
        }
    }
    set renderCallback(callback) {
        this._renderCallback = callback;
        this._updateButtonState();
    }
    _canDownload() {
        if (this._disabled)
            return false;
        if (this._canvas)
            return true;
        if (this._renderCallback && typeof this._width === "number" && typeof this._height === "number") {
            return true;
        }
        return false;
    }
    _updateButtonState() {
        if (this._button) {
            this._button.disabled = !this._canDownload();
        }
    }
    async _initiateDownload() {
        if (!this._canDownload())
            return;
        this.dispatchEvent(new CustomEvent("download-start", { bubbles: true, composed: true }));
        let canvasToDownload = undefined;
        if (this._renderCallback && typeof this._width === "number" && typeof this._height === "number") {
            try {
                const result = this._renderCallback(this._width, this._height);
                canvasToDownload = await result;
                if (!canvasToDownload) {
                    throw new Error("Render callback did not return a valid HTMLCanvasElement.");
                }
                if (!(canvasToDownload instanceof HTMLCanvasElement)) {
                    throw new Error("Render callback must return an HTMLCanvasElement.");
                }
            }
            catch (error) {
                console.error("Error executing render callback:", error);
                this.dispatchEvent(new CustomEvent("download-error", {
                    detail: { message: "Render callback failed.", error: error },
                    bubbles: true,
                    composed: true
                }));
                this.dispatchEvent(new CustomEvent("download-end", { bubbles: true, composed: true }));
                return;
            }
        }
        else if (this._canvas) {
            canvasToDownload = this._canvas;
        }
        if (!canvasToDownload) {
            console.error("Error downloading: No canvas available (neither set directly nor generated by callback).");
            this.dispatchEvent(new CustomEvent("download-error", {
                detail: { message: "No canvas available for download." },
                bubbles: true,
                composed: true
            }));
            this.dispatchEvent(new CustomEvent("download-end", { bubbles: true, composed: true }));
            return;
        }
        this._download(canvasToDownload, this._format, this._fileName);
    }
    async _download(canvas, format, fileName) {
        try {
            const blob = await this._getBlob(canvas, format);
            if (!blob) {
                throw new Error("Failed to generate Blob from canvas.");
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.${format}`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.dispatchEvent(new CustomEvent("download-success", {
                detail: { fileName: a.download, format: format, blobSize: blob.size },
                bubbles: true,
                composed: true
            }));
        }
        catch (error) {
            console.error("Error during download process:", error);
            this.dispatchEvent(new CustomEvent("download-error", {
                detail: { message: i18next.t("canvasDownloadButton:downloadFailed"), error: error },
                bubbles: true,
                composed: true
            }));
        }
        finally {
            this.dispatchEvent(new CustomEvent("download-end", { bubbles: true, composed: true }));
        }
    }
    _getBlob(canvas, format) {
        return new Promise((resolve, reject) => {
            const type = format === "jpeg" ? "image/jpeg" : "image/png";
            const quality = format === "jpeg" ? 0.92 : undefined;
            try {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, type, quality);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    _applyStyles() {
        const style = document.createElement("style");
        style.textContent = `
      :host {
        display: inline-block; 
        vertical-align: middle;
        /* Variables for easier theming */
        --btn-bg-color: #66afff;
        --btn-text-color: white;
        --btn-hover-bg-color: #007bff;
        --btn-hover-tansition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
        --btn-disabled-bg-color: #cccccc;
        --btn-disabled-text-color: #666666;
        --btn-padding: 8px 16px;
        --btn-border-radius: 0.4rem;
        --btn-border: none;
        --btn-font-size: 1em;
        --btn-line-height: 1.2;
        --btn-cursor: pointer;
        --btn-disabled-cursor: not-allowed;
        --btn-margin: 0 2em;
        --disabled-opacity: .6;
        --font-family: sans-serif;
      }

      :host(.disabled) {
        opacity: var(--disabled-opacity);
        pointer-events: none;
      }

      .download-button {
        font-family: var(--font-family);
        padding: var(--btn-padding);
        border: var(--btn-border);
        border-radius: var(--btn-border-radius);
        cursor: var(--btn-cursor);
        font-size: var(--btn-font-size);
        transition: var(--btn-hover-tansition);
        color: var(--btn-text-color);
        background-color: var(--btn-bg-color);
        white-space: nowrap;
        line-height: var(--btn-line-height);
        margin: var(--btn-margin);
      }

      .download-button:hover:not(:disabled) {
        background-color: var(--btn-hover-bg-color);
      }

      .download-button:disabled {
        background-color: var(--btn-disabled-bg-color);
        color: var(--btn-disabled-text-color);
        cursor: var(--btn-disabled-cursor);
        opacity: var(--disabled-opacity)
      }
      `;
        this.shadow.appendChild(style);
    }
}

class GridSizeSelector extends HTMLElement {
    constructor(maxCols, maxRows) {
        super();
        this.width = 10;
        this.height = 10;
        this.maxrows = GridSizeSelector.initialMaxRows;
        this.maxcols = GridSizeSelector.initialMaxCols;
        this.disabled = false;
        this._width = this.width;
        this._height = this.height;
        this._isDragging = false;
        this._dragStartWidth = 0;
        this._dragStartHeight = 0;
        this._isOpen = false;
        this._gridSize = 200;
        this._maxGridSize = 400;
        this._disableSizeUpdate = false;
        this.widthInput = null;
        this.heightInput = null;
        this.gridContainer = null;
        this.triggerButton = null;
        this.updateButton = null;
        if (maxCols !== undefined) {
            this.maxcols = maxCols;
        }
        if (maxRows !== undefined) {
            this.maxrows = maxRows;
        }
        this.attachShadow({ mode: "open" });
        this.render();
    }
    connectedCallback() {
        this.initializeElements();
        this.addEventListeners();
        this.updateInputs();
    }
    disconnectedCallback() {
        this.removeEventListeners();
    }
    initializeElements() {
        if (!this.shadowRoot)
            return;
        this.widthInput = this.shadowRoot.querySelector("#widthInput");
        this.heightInput = this.shadowRoot.querySelector("#heightInput");
        this.gridContainer = this.shadowRoot.querySelector(".grid-container");
        this.triggerButton = this.shadowRoot.querySelector(".trigger-button");
        this.updateButton = this.shadowRoot.querySelector(".update-button");
    }
    addEventListeners() {
        const gridArea = this.shadowRoot?.querySelector(".grid-area");
        if (gridArea && !this.disabled) {
            gridArea.addEventListener("mousedown", this.handleMouseDown.bind(this));
            gridArea.addEventListener("mousemove", this.handleMouseMove.bind(this));
            gridArea.addEventListener("mouseup", this.handleMouseUp.bind(this));
            gridArea.addEventListener("mouseleave", this.handleMouseUp.bind(this));
        }
        if (this.widthInput && !this.disabled) {
            this.widthInput.addEventListener("change", this.handleInputChange.bind(this));
        }
        if (this.heightInput && !this.disabled) {
            this.heightInput.addEventListener("change", this.handleInputChange.bind(this));
        }
        if (this.updateButton && !this._disableSizeUpdate && !this.disabled) {
            this.updateButton.addEventListener("click", () => this.handleUpdateSize());
        }
        if (this.triggerButton && !this.disabled) {
            this.triggerButton.addEventListener("click", () => this.handleToggleGrid());
        }
    }
    removeEventListeners() {
        const gridArea = this.shadowRoot?.querySelector(".grid-area");
        if (gridArea) {
            gridArea.removeEventListener("mousedown", this.handleMouseDown.bind(this));
            gridArea.removeEventListener("mousemove", this.handleMouseMove.bind(this));
            gridArea.removeEventListener("mouseup", this.handleMouseUp.bind(this));
            gridArea.removeEventListener("mouseleave", this.handleMouseUp.bind(this));
        }
        if (this.widthInput) {
            this.widthInput.removeEventListener("change", this.handleInputChange.bind(this));
        }
        if (this.heightInput) {
            this.heightInput.removeEventListener("change", this.handleInputChange.bind(this));
        }
        if (this.updateButton) {
            this.updateButton.removeEventListener("click", () => this.handleUpdateSize());
        }
        if (this.triggerButton) {
            this.triggerButton.removeEventListener("click", () => this.handleToggleGrid());
        }
    }
    static get styles() {
        return `
      :host {
        --btn-bg-color: #66afff;
        --btn-disabled-bg-color: #cccccc;
        --btn-disabled-text-color: #666666;
        --btn-text-color: white;
        --btn-hover-bg-color: #007bff;
        --btn-hover-tansition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
        --btn-padding: 8px 16px;
        --btn-border-radius: 0.4rem;
        --btn-border: none;
        --btn-disabled-cursor: not-allowed;
        --btn-font-size: 1em;
        --btn-line-height: 1.2;
        --font-family: sans-serif;
        --gap: .8em;
        --disabled-opacity: .6;
        --input-border: 1px solid #ccc;
        --grid-width: 15em;
        --grid-height: 15em;
        --cell-background-color: #ddd;
        --cell-selected-background-color: #66afff;
        --cell-selected-border: 1px solid color-mix(in srgb, var(--cell-selected-background-color) 90%, black);
        --grid-box-shadow: 0 4px 8px rgba(0,0,0,0.2);

        display: block;
        font-family: var(--font-family);
        opacity: 1;
        transition: opacity 0.3s ease;

      }

      :host(.disabled) {
        opacity: var(--disabled-opacity);
        pointer-events: none;
      }

      .container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--gap);
        font-family: var(--font-family);
        justify-content: flex-end;
      }

      :host(.disabled) .container {
        color: var(--btn-disabled-text-color);
        cursor: var(--btn-disabled-cursor);
      }

      .input-area {
        display: flex;
        gap: var(--gap);
        align-self: center;
      }

      .container label {
        vertical-align: middle;
        text-shadow: 0px 0px 15px white, 0px 0px 15px white, 0px 0px 15px white, 0px 0px 15px white, 0px 0px 15px white, 0px 0px 15px white, 0px 0px 15px white;
        align-self: center;
      }

      input[type="number"] {
        width: 80px;
        padding: 8px;
        border: var(--input-border);
        border-radius: var(--btn-border-radius);
        text-align: center;
        font-size: var(--btn-font-size);
      }

      button {
        padding: var(--btn-padding);
        background-color: var(--btn-bg-color);
        color: var(--btn-text-color);
        border: var(--btn-border);
        border-radius: var(--btn-border-radius);
        cursor: pointer;
        transition: var(--btn-hover-tansition);
        font-size: var(--btn-font-size);
        font-family: var(--font-family);
        line-height: var(--btn-line-height);
      }

      button:hover:not(:disabled) {
        background-color: var(--btn-hover-bg-color);
      }

      :host(.disabled) button,    
      button:disabled {
        background-color: var(--btn-disabled-bg-color);
        color: var(--btn-disabled-text-color);
        cursor: var(--btn-disabled-cursor);
      }

      .grid-container {
        position: relative;
        display: inline-block;
      }

      .trigger-button {
        background-color: var(--btn-bg-color);
        var(--btn-border);
        cursor: pointer;
      }

      .trigger-button:hover {
        background-color: #367c39;
      }

      @media (min-width: 720px) {
        .trigger-button {
          order: 1;
        }
        .width-label {
          order: 2;
        }
        .width-input {
          order: 3;
        }
        .height-label {
          order: 4;
        }
        .height-input {
          order: 5;
        }
        .update-button {
          order: 6;
        }
      }

      .grid-area {
        display: none;
        /*
        grid-template-columns: repeat(${GridSizeSelector.initialMaxCols}, auto);
        grid-template-rows: repeat(${GridSizeSelector.initialMaxRows}, auto);
        */
        width: var(--grid-width, 200px);
        height: var(--grid-height, 200px);
        border: 1px solid #aaa;
        cursor: pointer;
        background-color: #f0f0f0;
        user-select: none;
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;
        box-shadow: var(--grid-box-shadow);
        background-color: #ffffff;
        gap: 2px;
        padding: 2px;
        box-sizing: border-box;
      }

      .grid-cell {
        background-color: var(--cell-background-color);
        border: 1px solid transparent;
        box-sizing: border-box;
      }

      .selected-cell {
        background-color: var(--cell-selected-background-color);
        border: var(--cell-selected-border);
      }
    `;
    }
    render() {
        this.shadowRoot.innerHTML = `
        <style>${GridSizeSelector.styles}</style>
        <div class="container">
          <label class="width-label" for="widthInput">${i18next.t("generic:columns")}:</label>
          <input
            class="width-input"
            id="widthInput"
            type="number"
            min="1"
            max="${this.maxcols}"
            value="${this._width}"
            ${this.disabled ? "disabled" : ""}
          />
          <label class="height-label" for="heightInput">${i18next.t("generic:rows")}:</label>
          <input
            class="height-input"
            id="heightInput"
            type="number"
            min="1"
            max="${this.maxrows}"
            value="${this._height}"
            ${this.disabled ? "disabled" : ""}
          />
          <button class="update-button" ${this._disableSizeUpdate || this.disabled ? "disabled" : ""}>${i18next.t("gridSizeSelector:updateSize")}</button>
          <button class="trigger-button" ${this.disabled ? "disabled" : ""}>${i18next.t("gridSizeSelector:selectSize")}</button>
        </div>
        <div class="grid-container">
          <div class="grid-area">
            ${this._renderGrid()}
          </div>
        </div>
      </div>
      `;
        this.initializeElements();
        this.addEventListeners();
        this.classList.toggle("disabled", this.disabled);
    }
    _renderGrid() {
        let cellsHtml = "";
        for (let i = 0; i < this.maxrows; i++) {
            for (let j = 0; j < this.maxcols; j++) {
                const isSelected = i < this._height && j < this._width;
                cellsHtml += `
          <div
            class="grid-cell ${isSelected ? "selected-cell" : ""}"
            data-row="${i}"
            data-col="${j}"
          ></div>
        `;
            }
        }
        return cellsHtml;
    }
    handleMouseDown(event) {
        if (this.disabled)
            return;
        const gridArea = this.shadowRoot?.querySelector(".grid-area");
        if (!gridArea)
            return;
        const cell = event.target.closest(".grid-cell");
        if (!cell)
            return;
        this._isDragging = true;
        this._dragStartWidth = parseInt(cell.getAttribute("data-col") || "0") + 1;
        this._dragStartHeight = parseInt(cell.getAttribute("data-row") || "0") + 1;
        this._width = this._dragStartWidth;
        this._height = this._dragStartHeight;
        this.updateInputs();
        this.updateGrid();
    }
    handleMouseMove(event) {
        if (this.disabled)
            return;
        if (!this._isDragging)
            return;
        const gridArea = this.shadowRoot?.querySelector(".grid-area");
        if (!gridArea)
            return;
        const cell = event.target.closest(".grid-cell");
        if (!cell)
            return;
        const currentWidth = parseInt(cell.getAttribute("data-col") || "0") + 1;
        const currentHeight = parseInt(cell.getAttribute("data-row") || "0") + 1;
        this._width = Math.max(currentWidth, this._dragStartWidth);
        this._height = Math.max(currentHeight, this._dragStartHeight);
        this.updateInputs();
        this.updateGrid();
    }
    handleMouseUp() {
        if (this.disabled)
            return;
        this._isDragging = false;
        this._dragStartWidth = 0;
        this._dragStartHeight = 0;
    }
    handleInputChange(event) {
        if (this.disabled)
            return;
        const input = event.target;
        if (input.id === "widthInput") {
            this._width = parseInt(input.value);
        }
        else if (input.id === "heightInput") {
            this._height = parseInt(input.value);
        }
        this.updateGrid();
    }
    handleUpdateSize() {
        if (this.disabled)
            return;
        this.width = this._width;
        this.height = this._height;
        this._isOpen = false;
        this.updateGrid();
        this._fireChange();
    }
    _fireChange() {
        this.dispatchEvent(new CustomEvent("size-changed", {
            detail: { width: this.width, height: this.height }
        }));
    }
    handleToggleGrid() {
        if (this.disabled)
            return;
        this._isOpen = !this._isOpen;
        this.updateGrid();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "width") {
            this.width = parseInt(newValue);
            this._width = this.width;
        }
        else if (name === "height") {
            this.height = parseInt(newValue);
            this._height = this.height;
        }
        else if (name === "maxrows") {
            this.maxrows = parseInt(newValue);
            this._disableSizeUpdate = true;
        }
        else if (name === "maxcols") {
            this.maxcols = parseInt(newValue);
            this._disableSizeUpdate = true;
        }
        else if (name === "disabled") {
            this.disabled = newValue === "true";
            this.updateInputs();
            this.updateUpdateButtonState();
            this.classList.toggle("disabled", this.disabled);
        }
        this.updateGrid();
    }
    updateGrid() {
        const gridArea = this.shadowRoot?.querySelector(".grid-area");
        if (!gridArea)
            return;
        gridArea.style.display = this._isOpen ? "grid" : "none";
        gridArea.style.gridTemplateColumns = `repeat(${this.maxcols}, auto)`;
        gridArea.style.gridTemplateRows = `repeat(${this.maxrows}, auto)`;
        gridArea.innerHTML = this._renderGrid();
    }
    updateInputs() {
        if (this.widthInput) {
            this.widthInput.value = String(this._width);
            this.widthInput.max = String(this.maxcols);
            this.widthInput.disabled = this.disabled;
        }
        if (this.heightInput) {
            this.heightInput.value = String(this._height);
            this.heightInput.max = String(this.maxrows);
            this.heightInput.disabled = this.disabled;
        }
    }
    updateUpdateButtonState() {
        if (this.updateButton) {
            this.updateButton.disabled = this._disableSizeUpdate || this.disabled;
        }
    }
}
GridSizeSelector.observedAttributes = ["width", "height", "maxrows", "maxcols", "disabled"];
GridSizeSelector.initialMaxRows = 10;
GridSizeSelector.initialMaxCols = 10;

class OffsetRect extends OpenSeadragon.Rect {
    constructor(x = 0, y = 0, width = 0, height = 0, degrees = 0, horizontal, vertical) {
        super(x, y, width, height, degrees);
        if (horizontal !== undefined) {
            this._horizontal = horizontal;
        }
        if (vertical !== undefined) {
            this._vertical = vertical;
        }
    }
    set horizontal(horizontal) {
        this._horizontal = horizontal;
    }
    get horizontal() {
        return this._horizontal;
    }
    set vertical(vertical) {
        this._vertical = vertical;
    }
    get vertical() {
        return this._vertical;
    }
    calculateX(reference) {
        if (reference === undefined && this.reference !== undefined) {
            reference = this.reference;
        }
        if (reference !== undefined) {
            const width = this.reference.imageToViewportRectangle(this).width;
            if (this.horizontal !== undefined && this.horizontal == CutPosition.Left) {
                return -1 * width;
            }
            return width;
        }
        return 0;
    }
    calculateY(reference) {
        if (reference === undefined && this.reference !== undefined) {
            reference = this.reference;
        }
        if (reference !== undefined) {
            const height = this.reference.imageToViewportRectangle(this).height;
            if (this.vertical !== undefined && this.vertical == CutPosition.Top) {
                return -1 * height;
            }
            return height;
        }
        return 0;
    }
    static fromRect(rect) {
        return new OffsetRect(rect.x, rect.y, rect.width, rect.height, rect.degrees);
    }
}

class RotateableRect extends OpenSeadragon.Rect {
    constructor(x = 0, y = 0, width = 0, height = 0, degrees = 0) {
        super(x, y, width, height, degrees);
        this._degreesNoRotate = 0;
        this._xNoRotate = x;
        this._yNoRotate = y;
        this._widthNoRotate = width;
        this._heightNoRotate = height;
        this._degreesNoRotate = degrees;
    }
    rotate(degree, pivot) {
        super.rotate(degree, pivot);
        if (this._degreesNoRotate == 0) {
            this._degreesNoRotate = degree;
        }
        else {
            degree = degree % 360;
            if (degree < 0) {
                degree += 360;
            }
            this._degreesNoRotate = degree;
        }
        return this;
    }
    setXNoRotate(x) {
        this._xNoRotate = x;
        this._updateRotation();
    }
    setYNoRotate(y) {
        this._yNoRotate = y;
        this._updateRotation();
    }
    setWidthNoRotate(width) {
        this._widthNoRotate = width;
        this._updateRotation();
    }
    setHeightNoRotate(height) {
        this._widthNoRotate = height;
        this._updateRotation();
    }
    setDegreesNoRotate(height) {
        this._degreesNoRotate = height;
        this._updateRotation();
    }
    set rotationPoint(rotationPoint) {
        this._rotationPoint = rotationPoint;
    }
    get rotationPoint() {
        if (this._rotationPoint === undefined) {
            return this.getCenter();
        }
        else {
            return this._rotationPoint;
        }
    }
    _updateRotation() {
        if (RotateableRect._isRotated(this._degreesNoRotate)) {
            this.x = this._yNoRotate;
            this.y = this._xNoRotate;
            this.width = this._heightNoRotate;
            this.height = this._widthNoRotate;
        }
        else {
            this.x = this._xNoRotate;
            this.y = this._yNoRotate;
            this.width = this._widthNoRotate;
            this.height = this._heightNoRotate;
        }
    }
    clone() {
        const clone = new RotateableRect(this.x, this.y, this.width, this.height, this.degrees);
        clone._xNoRotate = this._xNoRotate;
        clone._yNoRotate = this._yNoRotate;
        clone._widthNoRotate = this._widthNoRotate;
        clone._heightNoRotate = this._heightNoRotate;
        clone._degreesNoRotate = this._degreesNoRotate;
        clone._rotationPoint = this._rotationPoint;
        return clone;
    }
    static _isRotated(degree, tolerance = 45) {
        const isVertical = Math.abs(degree - 90) <= tolerance || Math.abs(degree - 270) <= tolerance;
        return !isVertical;
    }
    static fromRect(rect) {
        return new RotateableRect(rect.x, rect.y, rect.width, rect.height, rect.degrees);
    }
}

class HideRect extends OpenSeadragon.Rect {
    constructor(tiledImage, y, width, height, degrees) {
        let x;
        if (tiledImage instanceof OpenSeadragon.TiledImage) {
            x = tiledImage.getContentSize().x;
            y = tiledImage.getContentSize().y;
            width = 0;
            height = 0;
            degrees = tiledImage.getRotation();
        }
        else {
            x = tiledImage;
        }
        super(x, y, width, height, degrees);
    }
    clone() {
        return new HideRect(this.x, this.y, this.width, this.height, this.degrees);
    }
    static isHidden(tiledImage) {
        const clip = tiledImage.getClip();
        if (clip === null) {
            return false;
        }
        const x = tiledImage.getContentSize().x;
        const y = tiledImage.getContentSize().y;
        const degrees = tiledImage.getRotation();
        if (clip.x != x || clip.y != y || clip.width != 0 || clip.height != 0 || clip.degrees != degrees) {
            return false;
        }
        return true;
    }
}

function equals(obj1, obj2) {
    function isObject(object) {
        return object != null && typeof object === "object";
    }
    if (obj1 === undefined || obj2 === undefined) {
        return false;
    }
    if (!isObject(obj1) || !isObject(obj2)) {
        return obj1 === obj2;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
            return false;
        }
        const val1 = obj1[key];
        const val2 = obj2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (areObjects && !equals(val1, val2)) {
            return false;
        }
        if (!areObjects && val1 !== val2) {
            return false;
        }
    }
    return true;
}
async function loadInfoJson(id) {
    let url;
    if (!id.toString().endsWith("/info.json")) {
        if (!id.toString().endsWith("/")) {
            url = id.toString() + "/info.json";
        }
        else {
            url = id.toString() + "info.json";
        }
    }
    else {
        url = id.toString();
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    return await response.json();
}

class Renderer {
    constructor(element, columns = 4, rows = 4, gridSelector = true, download = true, controls = true, source, width, height) {
        this._loaded = false;
        this._margins = true;
        this._marginWidth = 1;
        this.defaultExportDimensions = [1920, 1080];
        this._notificationQueue = [];
        this._debug = false;
        this.fitPreview = true;
        this.renderTimeout = 3000;
        if (element !== undefined) {
            this.element = element;
        }
        else {
            this.element = document.querySelector(Renderer.defaultSelector);
        }
        this.setSize(columns, rows);
        this._gridSelector = gridSelector;
        this._download = download;
        this._controls = controls;
        Renderer.setupHTML(this.element, controls, width, height);
        this.viewerElement = this.element.querySelector(Renderer.rendererViewerSelector);
        this.viewer = this.setupViewer(this.viewerElement);
        if (source !== undefined) {
            this.source = source;
        }
        if (this.element !== null) {
            this.addControls(this.viewerElement, this.defaultExportDimensions[0], this.defaultExportDimensions[1]);
        }
    }
    clear() {
        this._source = undefined;
        this.clipRect = undefined;
        this._offsets = undefined;
        if (this.viewer !== undefined) {
            this._clearTiles();
            this.viewer.close();
            this._loaded = false;
        }
    }
    _clearTiles() {
        if (this.viewer !== undefined) {
            this.viewer.world.removeAll();
            for (let i = 0; i < this.viewer.world.getItemCount(); i++) {
                this.viewer.world.removeItem(this.viewer.world.getItemAt(i));
            }
        }
    }
    static _loadTiles(viewer, source, count) {
        return new Promise((resolve, reject) => {
            let tilesLoaded = 0;
            const sources = [];
            if (Array.isArray(source)) {
                throw new Error("Handling of TiledImage array not implemented!");
            }
            else {
                for (let i = 0; i < count; i++) {
                    sources.push(source);
                }
            }
            const errorHandler = (error) => {
                reject(`Failed to load TiledImage: ${error.message}`);
            };
            const tileLoadedHandler = () => {
                tilesLoaded++;
                checkAllTilesLoaded();
            };
            const checkAllTilesLoaded = () => {
                if (tilesLoaded === sources.length) {
                    viewer.removeHandler("tile-load-failed", errorHandler);
                    viewer.removeHandler("tile-loaded", tileLoadedHandler);
                    resolve(true);
                }
            };
            viewer.addHandler("tile-loaded", tileLoadedHandler);
            viewer.addHandler("tile-load-failed", errorHandler);
            viewer.open(sources);
        });
    }
    set source(json) {
        if (this.viewer === undefined) {
            throw new Error("Result viewer element is null!");
        }
        this._source = json;
        this._loaded = false;
        if (this.clipRect === undefined) {
            this.clipRect = new OpenSeadragon.Rect(0, 0, json.width, json.height);
        }
        const columns = this._columns;
        const rows = this._rows;
        this._clearTiles();
        Renderer._loadTiles(this.viewer, this._source, columns * rows).then((result) => {
            if (typeof result === "boolean" && result) {
                this.viewer?.world.arrange({ rows: this._rows, columns: this._columns, tileMargin: 0, immediately: true });
                if (!this._notificationQueue.length) {
                    this.preview();
                    this.layout(true);
                }
                else {
                    this._notificationQueue.forEach((notification) => {
                        this.notify(notification);
                    });
                }
                this.viewer?.raiseEvent("source-loaded");
                this._loaded = true;
                this.preview();
                this.enableControls();
            }
            else {
                if (typeof result === "boolean") {
                    throw new Error(`Failed to load TiledImage for unknown reasons`);
                }
                else {
                    throw new Error(result);
                }
            }
        });
    }
    get width() {
        if (this._source !== undefined) {
            return this._source.width;
        }
        return undefined;
    }
    get height() {
        if (this._source !== undefined) {
            return this._source.height;
        }
        return undefined;
    }
    get loaded() {
        return this._loaded;
    }
    set debug(debug) {
        this._debug = debug;
        if (this._debug) {
            this._debugOverlays = new Map();
        }
    }
    set margins(margins) {
        this._margins = margins;
        this.setSize(this.columns, this.rows);
    }
    set offsets(offsets) {
        if (Renderer.validateSidedVariations(offsets, "rotation")) {
            this._offsets = offsets;
        }
    }
    set rotations(rotations) {
        if (Renderer.validateSidedVariations(rotations, "rotation")) {
            this._rotations = rotations;
        }
    }
    get rows() {
        if (this._margins) {
            return this._rows - this._marginWidth * 2;
        }
        return this._rows;
    }
    get columns() {
        if (this._margins) {
            return this._columns - this._marginWidth * 2;
        }
        return this._columns;
    }
    setSize(columns, rows, callback) {
        if (this._margins) {
            if (columns > rows) {
                this._marginWidth = Math.floor(columns / 2);
            }
            else {
                this._marginWidth = Math.floor(rows / 2);
            }
            columns = columns + this._marginWidth * 2;
            rows = rows + this._marginWidth * 2;
        }
        if (this.viewer !== undefined && callback !== undefined) {
            this.viewer.addOnceHandler("source-loaded", callback);
            this.viewer.raiseEvent("grid-size-changed");
        }
        if (this._columns != columns || this._rows != rows) {
            this._columns = columns;
            this._rows = rows;
            if (this._source !== undefined) {
                this.source = this._source;
            }
        }
    }
    enableControls() {
        if (this.gridSizeSelect !== undefined && this.gridSizeSelect !== null) {
            this.gridSizeSelect.removeAttribute("disabled");
        }
        if (this.resolutionSelect !== undefined && this.resolutionSelect !== null) {
            this.resolutionSelect.removeAttribute("disabled");
        }
        if (this.downloadButton !== undefined && this.downloadButton !== null) {
            this.downloadButton.removeAttribute("disabled");
        }
        this.viewerElement.querySelector(".zoomin")?.classList.remove("disabled");
        this.viewerElement.querySelector(".zoomout")?.classList.remove("disabled");
        this.viewerElement.querySelector(".fullscreen")?.classList.remove("disabled");
        this.viewerElement.querySelector(".fullwidth")?.classList.remove("disabled");
    }
    static validateSidedVariations(variation, type) {
        if (variation === undefined) {
            return false;
        }
        if (CutPosition.Left in variation &&
            variation[CutPosition.Left] !== undefined &&
            CutPosition.Right &&
            variation[CutPosition.Right] !== undefined) {
            if (variation[CutPosition.Left] != 0 && variation[CutPosition.Right] != 0) {
                console.error(`Different ${type} for left (${variation[CutPosition.Left]}) and right (${variation[CutPosition.Right]}) sides`);
            }
        }
        if (CutPosition.Top in variation &&
            variation[CutPosition.Top] !== undefined &&
            CutPosition.Bottom &&
            variation[CutPosition.Bottom] !== undefined) {
            if (variation[CutPosition.Top] != 0 && variation[CutPosition.Bottom] != 0) {
                console.error(`Different ${type} for top (${variation[CutPosition.Top]}) and bottom (${variation[CutPosition.Bottom]}) sides`);
                return false;
            }
        }
        return true;
    }
    static setupHTML(element, controls = true, width, height) {
        let controlsHTML = `
        <i class="controls button zoomin disabled"></i>
        <i class="controls button zoomout disabled"></i>
        <i class="controls button fullscreen disabled"></i>
        <i class="controls button fullwidth disabled"></i>`;
        if (!controls) {
            controlsHTML = "";
        }
        let style = "";
        if (width !== undefined && height !== undefined) {
            style = `width: ${width}px; height: ${height}px`;
        }
        element.innerHTML = `
      <div class="output-viewer" style="${style}">
        ${controlsHTML}
      </div>
    `;
    }
    setupViewer(element) {
        if (element !== undefined) {
            element = this.viewerElement;
        }
        if (element !== null && element !== undefined) {
            let options = {
                element: element,
                collectionMode: true,
                preserveViewport: true,
                gestureSettingsMouse: { clickToZoom: false },
                showHomeControl: false,
                autoHideControls: false,
                collectionTileMargin: 0,
                collectionRows: this._rows,
                collectionColumns: this._columns,
                crossOriginPolicy: "Anonymous",
                drawer: "canvas",
                debug: this._debug
            };
            if (this._controls) {
                options = {
                    ...options,
                    zoomInButton: this.element.querySelector(".zoomin"),
                    zoomOutButton: this.element.querySelector(".zoomout"),
                    fullPageButton: this.element.querySelector(".fullscreen")
                };
            }
            else {
                options = {
                    ...options,
                    showNavigationControl: false,
                    showZoomControl: false,
                    showHomeControl: false,
                    showFullPageControl: false,
                    showSequenceControl: false
                };
            }
            const fullwidthButton = this.element.querySelector(".fullwidth");
            if (fullwidthButton !== undefined && fullwidthButton !== null) {
                fullwidthButton.addEventListener("click", () => {
                    if (this._loaded) {
                        if (this.viewer !== undefined) {
                            Renderer.fitToWidth(this.viewer, false, undefined, true);
                        }
                    }
                });
            }
            return OpenSeadragon(options);
        }
        else {
            throw new Error("Result viewer element is null!");
        }
    }
    preview(left = 0, top = 0, right, bottom, immediately = true, offsets, rotations) {
        if (this.viewer === undefined) {
            throw new Error("Result viewer not initialized");
        }
        if (right === undefined && bottom === undefined) {
            right = this.width;
            bottom = this.height;
        }
        if (left === undefined ||
            top === undefined ||
            right == undefined ||
            bottom === undefined ||
            this.viewer.world.getItemCount() === undefined) {
            throw new Error("Can't clip image, some dimensions aren't defined");
        }
        const itemCount = this.viewer.world.getItemCount();
        for (let i = 0; i < itemCount; i++) {
            const tiledImage = this.viewer.world.getItemAt(i);
            if (tiledImage !== undefined) {
                if (this.clipRect === undefined) {
                    throw new Error("Clip rect is empty!");
                }
                else {
                    this.clipRect.x = left;
                    this.clipRect.y = top;
                    this.clipRect.width = right - left;
                    this.clipRect.height = bottom - top;
                }
                tiledImage.setClip(RotateableRect.fromRect(this.clipRect));
            }
            else {
                throw new Error("Couldn't generate clip mask, no images found!");
            }
        }
        if (offsets !== undefined) {
            this.offsets = offsets;
        }
        if (rotations !== undefined) {
            this.rotations = rotations;
        }
        this.layout(immediately);
        if (this.downloadButton !== undefined && this.downloadButton !== null) {
            this.downloadButton.disabled = false;
        }
        if (this.fitPreview) {
            Renderer.fitToWidth(this.viewer, true, undefined, false, true);
        }
    }
    static createOffsetRect(offsets, reference) {
        let width = 0, height = 0, horizontal, vertical;
        if (CutPosition.Left in offsets && offsets[CutPosition.Left] != undefined) {
            width = offsets[CutPosition.Left];
            horizontal = CutPosition.Left;
        }
        if (CutPosition.Right in offsets && offsets[CutPosition.Right] != undefined) {
            width = offsets[CutPosition.Right];
            horizontal = CutPosition.Right;
        }
        if (CutPosition.Top in offsets && offsets[CutPosition.Top] != undefined) {
            height = offsets[CutPosition.Top];
            vertical = CutPosition.Top;
        }
        if (CutPosition.Bottom in offsets && offsets[CutPosition.Bottom] != undefined) {
            height = offsets[CutPosition.Bottom];
            vertical = CutPosition.Bottom;
        }
        if (width != 0 || height != 0) {
            const offsetRect = new OffsetRect(0, 0, width, height, undefined, horizontal, vertical);
            offsetRect.reference = reference;
            return offsetRect;
        }
        return undefined;
    }
    layout(immediately = true) {
        const raiseFinished = () => {
            this.viewer?.raiseEvent("layout-finish", { eventSource: this.viewer });
        };
        const columns = this._columns;
        const rows = this._rows;
        const margins = this._margins;
        const marginWidth = this._marginWidth;
        let visibleColumns = columns;
        let visibleRows = rows;
        if (margins) {
            visibleColumns = columns - this._marginWidth * 2;
            visibleRows = rows - this._marginWidth * 2;
        }
        if (!immediately) {
            this.viewer?.addHandler("animation-finish", raiseFinished.bind(this));
        }
        this.viewer?.raiseEvent("start-layout", { eventSource: this.viewer });
        let pos = -1;
        if (this.clipRect === undefined || this.viewer === undefined) {
            throw new Error("Clip rect or viewer is not defined");
        }
        this.viewer.world.arrange({ rows: rows, columns: columns, tileMargin: 0, immediately: true });
        const referenceImage = this.viewer.world.getItemAt(0);
        referenceImage.setPosition(new OpenSeadragon.Point(0, 0), immediately);
        const transformedClipRect = referenceImage.imageToViewportRectangle(this.clipRect);
        if (referenceImage === undefined) {
            throw new Error("Couldn't get first tiled image!");
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                pos++;
                let row = r;
                let column = c;
                let x = 0, y = 0;
                let width = 0, height = 0;
                const tiledImage = this.viewer.world.getItemAt(pos);
                const hideRect = new HideRect(tiledImage);
                if (tiledImage === undefined || referenceImage === undefined || this.clipRect === undefined) {
                    throw new Error("Required variables are not defined");
                }
                let offsetRect;
                if (this._offsets != undefined) {
                    offsetRect = Renderer.createOffsetRect(this._offsets, tiledImage);
                }
                width = transformedClipRect.width;
                height = transformedClipRect.height;
                if (margins) {
                    if (c < marginWidth || c >= columns - marginWidth || r < marginWidth || r >= rows - marginWidth) {
                        tiledImage.setClip(hideRect.clone());
                    }
                    column = c - marginWidth;
                    row = r - marginWidth;
                }
                if (tiledImage.getClip() === null) {
                    throw new Error("TiledImage has no clipings!");
                }
                x = (c - marginWidth) * width;
                y = (r - marginWidth) * height;
                if (this._rotations !== undefined && Object.keys(this._rotations).length) {
                    let rowEven = false, columnEven = false;
                    if (r % 2 == 0 && (!margins || (margins && marginWidth % 2 == 0))) {
                        rowEven = true;
                    }
                    else if (r % 2 == 1 && margins && marginWidth % 2 == 1) {
                        rowEven = true;
                    }
                    if (c % 2 == 0 && (!margins || (margins && marginWidth % 2 == 0))) {
                        columnEven = true;
                    }
                    else if (c % 2 == 1 && margins && marginWidth % 2 == 1) {
                        columnEven = true;
                    }
                    const clipRotationPoint = this.clipRect.getCenter();
                    let rotation = NaN;
                    if (CutPosition.Right in this._rotations && this._rotations[CutPosition.Right] !== undefined && rowEven && !columnEven) {
                        rotation = this._rotations[CutPosition.Right];
                    }
                    if (CutPosition.Bottom in this._rotations && this._rotations[CutPosition.Bottom] !== undefined && columnEven && !rowEven) {
                        rotation = this._rotations[CutPosition.Bottom];
                    }
                    if (CutPosition.Right in this._rotations &&
                        this._rotations[CutPosition.Right] !== undefined &&
                        CutPosition.Bottom in this._rotations &&
                        this._rotations[CutPosition.Bottom] !== undefined) {
                        if (rowEven && !columnEven && columnEven && !rowEven) {
                            rotation = this._rotations[CutPosition.Right] + this._rotations[CutPosition.Bottom];
                        }
                    }
                    if (rotation == 360) {
                        rotation = NaN;
                    }
                    if (!isNaN(rotation) && !HideRect.isHidden(tiledImage)) {
                        const initialClip = tiledImage.getClip();
                        const rotatedClip = tiledImage.getClip();
                        if (initialClip === null || rotatedClip === null) {
                            throw new Error("tiled image has no clip for rotation");
                        }
                        rotatedClip.rotate(rotation, clipRotationPoint);
                        if (rotation == 0 || rotation == 180) {
                            tiledImage.setWidth(referenceImage.getBounds().width, true);
                        }
                        else {
                            tiledImage.setHeight(referenceImage.getBounds().height, true);
                            const ratio = tiledImage._worldWidthCurrent / tiledImage.source.dimensions.x;
                            const clipCenterX = this.clipRect.x + this.clipRect.width / 2;
                            const clipCenterY = this.clipRect.y + this.clipRect.height / 2;
                            const imageCenterX = tiledImage.source.dimensions.x / 2;
                            const imageCenterY = tiledImage.source.dimensions.y / 2;
                            const imageMarginLeft = this.clipRect.x;
                            const imageMarginRight = tiledImage.source.dimensions.x - (this.clipRect.x + this.clipRect.width);
                            const imageMarginTop = this.clipRect.y;
                            const imageMarginBottom = tiledImage.source.dimensions.y - (this.clipRect.y + this.clipRect.height);
                            if (this.clipRect.height - this.clipRect.y > this.clipRect.width - this.clipRect.x) {
                                rotatedClip.y = rotatedClip.y / 2 + (this.clipRect.height - this.clipRect.y) / 2 - rotatedClip.width / 2;
                            }
                            rotatedClip.height = this.clipRect.width;
                            if (rotation == 90) {
                                tiledImage.source.dimensions.x - (this.clipRect.x + this.clipRect.width);
                                this.clipRect.x;
                            }
                            else if (rotation == 270) {
                                tiledImage.source.dimensions.x - (this.clipRect.x + this.clipRect.width);
                                this.clipRect.x;
                            }
                            console.log(`Margins left ${imageMarginLeft} right ${imageMarginRight} top ${imageMarginTop} bottom ${imageMarginBottom} : ${imageMarginTop * 0.5 + imageMarginBottom * 0.5} `);
                            const rotationOffsetX = clipCenterY - imageCenterY - imageMarginLeft * 0.5 + imageMarginRight * 0.5 + imageMarginBottom;
                            let rotationOffsetY = clipCenterX - imageCenterX - imageMarginTop * 0.5 + imageMarginBottom * 0.5;
                            if (this.clipRect.height - this.clipRect.y < this.clipRect.width - this.clipRect.x) {
                                const correctionY = this.clipRect.width - this.clipRect.x - (this.clipRect.height - this.clipRect.y);
                                rotatedClip.width = this.clipRect.height - this.clipRect.y;
                                rotationOffsetY = rotationOffsetY - correctionY / 2;
                                console.log(`Less height (${this.clipRect.height - this.clipRect.y}) then width (${this.clipRect.width - this.clipRect.x}), using ${this.clipRect.height - this.clipRect.y}`);
                            }
                            console.log(`offset Y ${rotationOffsetY} X ${rotationOffsetX}`);
                            x = x - ratio * rotationOffsetX;
                            y = y - ratio * rotationOffsetY;
                            console.log("Rotations", `${c},${r}`, `source width ${tiledImage.source.dimensions.x} clip width ${this.clipRect.width}`);
                            new OpenSeadragon.Point(initialClip.width / 2 - rotatedClip.width / 2, initialClip.height / 2 - rotatedClip.height / 2);
                        }
                        tiledImage.setRotationPoint(new OpenSeadragon.Rect(0, 0, tiledImage.getContentSize().x, tiledImage.getContentSize().y).getCenter());
                        tiledImage.setRotation(rotation, immediately);
                        tiledImage.setClip(rotatedClip);
                    }
                }
                if (offsetRect !== undefined) {
                    if (offsetRect.height > 0) {
                        const shift = offsetRect.calculateY(referenceImage) * column;
                        y = y + shift;
                    }
                    else if (offsetRect.height < 0) {
                        const shift = offsetRect.calculateY(referenceImage) * column;
                        y = y - shift;
                    }
                    if (column == 0 && offsetRect.width < 0) {
                        const borderClip = tiledImage.getClip().clone();
                        const imageCoordShift = offsetRect.width * row * -1;
                        borderClip.width = borderClip.width - imageCoordShift;
                        borderClip.x = borderClip.x + imageCoordShift;
                        tiledImage.setClip(borderClip);
                    }
                    if (column == visibleColumns - 1 && offsetRect.width > 0) {
                        const borderClip = tiledImage.getClip().clone();
                        const imageCoordShift = offsetRect.width * row;
                        borderClip.width = borderClip.width - imageCoordShift;
                        tiledImage.setClip(borderClip);
                    }
                    if (offsetRect.width > 0) {
                        const shift = offsetRect.calculateX(referenceImage) * row;
                        x = x + shift;
                    }
                    else if (offsetRect.width < 0) {
                        const shift = offsetRect.calculateX(referenceImage) * row;
                        x = x - shift;
                    }
                    if (row == 0 && offsetRect.height < 0) {
                        const borderClip = tiledImage.getClip().clone();
                        const imageCoordShift = offsetRect.height * column * -1;
                        borderClip.height = borderClip.height - imageCoordShift;
                        borderClip.y = borderClip.y + imageCoordShift;
                        tiledImage.setClip(borderClip);
                    }
                    if (row == visibleRows - 1 && offsetRect.height > 0) {
                        const borderClip = tiledImage.getClip().clone();
                        const imageCoordShift = offsetRect.height * column;
                        borderClip.height = borderClip.height - imageCoordShift;
                        tiledImage.setClip(borderClip);
                    }
                    const imageCoordShiftX = offsetRect.width * row;
                    const imageCoordShiftY = offsetRect.height * column;
                    const checkModifiedClip = (tiledImage) => {
                        if (HideRect.isHidden(tiledImage)) {
                            return this.clipRect.clone();
                        }
                        else {
                            return tiledImage.getClip();
                        }
                    };
                    const marginPos = (curPos, dimension) => {
                        if (curPos < marginWidth) {
                            return marginWidth - curPos;
                        }
                        else if (curPos >= dimension + marginWidth) {
                            return curPos - (marginWidth + dimension) + 1;
                        }
                        return NaN;
                    };
                    if (margins && (c < marginWidth || c >= columns - marginWidth || r < marginWidth || r >= rows - marginWidth)) {
                        if (c < marginWidth && offsetRect.width > 0) {
                            const borderClip = checkModifiedClip(tiledImage);
                            if (marginPos(c, visibleColumns) * this.clipRect.width > imageCoordShiftX &&
                                (marginPos(c, visibleColumns) - 1) * this.clipRect.width < imageCoordShiftX) {
                                borderClip.x = borderClip.width + (marginPos(c, visibleColumns) - 1) * borderClip.width - imageCoordShiftX;
                                borderClip.width = borderClip.width - (marginPos(c, visibleColumns) - 1) * borderClip.width + imageCoordShiftX;
                            }
                            else if (marginPos(c, visibleColumns) * this.clipRect.width > imageCoordShiftX) {
                                borderClip.width = hideRect.width;
                                borderClip.x = hideRect.x;
                            }
                            else {
                                borderClip.width = this.clipRect.width;
                                borderClip.x = this.clipRect.x;
                            }
                            tiledImage.setClip(borderClip);
                        }
                        if (c >= columns - marginWidth && offsetRect.width < 0) {
                            const borderClip = checkModifiedClip(tiledImage);
                            if (marginPos(c, visibleColumns) * this.clipRect.width > imageCoordShiftX * -1 &&
                                (marginPos(c, visibleColumns) - 1) * this.clipRect.width < imageCoordShiftX * -1) {
                                borderClip.width = (imageCoordShiftX + (marginPos(c, visibleColumns) - 1) * borderClip.width) * -1;
                            }
                            else if (marginPos(c, visibleColumns) * this.clipRect.width > imageCoordShiftX * -1) {
                                borderClip.width = hideRect.width;
                            }
                            else {
                                borderClip.width = this.clipRect.width;
                            }
                            tiledImage.setClip(borderClip);
                        }
                        if (r < marginWidth && offsetRect.height > 0) {
                            const borderClip = checkModifiedClip(tiledImage);
                            if (marginPos(r, visibleRows) * this.clipRect.height > imageCoordShiftY &&
                                (marginPos(r, visibleRows) - 1) * this.clipRect.height < imageCoordShiftY) {
                                borderClip.y = borderClip.height + (marginPos(r, visibleRows) - 1) * borderClip.height - imageCoordShiftY;
                                borderClip.height = borderClip.height - (marginPos(r, visibleRows) - 1) * borderClip.height + imageCoordShiftY;
                            }
                            else if (marginPos(r, visibleRows) * this.clipRect.height > imageCoordShiftY) {
                                borderClip.height = hideRect.height;
                                borderClip.y = hideRect.y;
                            }
                            else {
                                borderClip.height = this.clipRect.height;
                                borderClip.y = this.clipRect.y;
                            }
                            tiledImage.setClip(borderClip);
                        }
                        if (r >= rows - marginWidth && offsetRect.height < 0) {
                            const borderClip = checkModifiedClip(tiledImage);
                            if (marginPos(r, visibleRows) * this.clipRect.height > imageCoordShiftY * -1 &&
                                (marginPos(r, visibleRows) - 1) * this.clipRect.height < imageCoordShiftY * -1) {
                                borderClip.height = (imageCoordShiftY + (marginPos(r, visibleRows) - 1) * borderClip.height) * -1;
                            }
                            else if (marginPos(r, visibleRows) * this.clipRect.height > imageCoordShiftY * -1) {
                                borderClip.height = hideRect.height;
                            }
                            else {
                                borderClip.height = this.clipRect.height;
                            }
                            tiledImage.setClip(borderClip);
                        }
                        if ((r < marginWidth || r >= rows - marginWidth) && offsetRect.width != 0 && offsetRect.height == 0) {
                            const borderClip = checkModifiedClip(tiledImage);
                            borderClip.y = borderClip.height + (marginPos(r, visibleRows) - 1) * borderClip.height - imageCoordShiftY;
                            tiledImage.setClip(borderClip);
                        }
                        else if ((c < marginWidth || c >= rows - marginWidth) && offsetRect.height != 0 && offsetRect.width == 0) {
                            const borderClip = checkModifiedClip(tiledImage);
                            borderClip.x = borderClip.width + (marginPos(c, visibleColumns) - 1) * borderClip.width - imageCoordShiftX;
                            tiledImage.setClip(borderClip);
                        }
                        if (offsetRect.width != 0 && offsetRect.height != 0) {
                            if ((c < marginWidth || c >= rows - marginWidth) && (r < marginWidth || r >= rows - marginWidth)) {
                                const borderClip = checkModifiedClip(tiledImage);
                                borderClip.y = borderClip.height + (marginPos(r, visibleRows) - 1) * borderClip.height - imageCoordShiftY;
                                borderClip.x = borderClip.width + (marginPos(c, visibleColumns) - 1) * borderClip.width - imageCoordShiftX;
                                borderClip.width = (imageCoordShiftX + (marginPos(c, visibleColumns) - 1) * borderClip.width) * -1;
                                borderClip.height = borderClip.height - (marginPos(r, visibleRows) - 1) * borderClip.height + imageCoordShiftY;
                                tiledImage.setClip(borderClip);
                            }
                        }
                    }
                    const shiftTilesX = Math.ceil(((marginWidth + visibleColumns) * offsetRect.width * Math.sign(offsetRect.width)) / this.clipRect.width);
                    if (shiftTilesX > marginWidth && (c == columns - shiftTilesX - 1 || c == shiftTilesX)) {
                        if (c == shiftTilesX && imageCoordShiftX * -1 > this.clipRect.width) {
                            const borderClip = checkModifiedClip(tiledImage);
                            borderClip.width = borderClip.width - (this.clipRect.width + imageCoordShiftX) * -1;
                            borderClip.x = borderClip.x + (this.clipRect.width + imageCoordShiftX) * -1;
                            tiledImage.setClip(borderClip);
                        }
                        if (c == columns - shiftTilesX - 1 && imageCoordShiftX > this.clipRect.width) {
                            const borderClip = checkModifiedClip(tiledImage);
                            borderClip.width = this.clipRect.width - (imageCoordShiftX - this.clipRect.width);
                            tiledImage.setClip(borderClip);
                        }
                    }
                    const shiftTilesY = Math.ceil(((marginWidth + visibleRows) * offsetRect.height * Math.sign(offsetRect.height)) / this.clipRect.height);
                    if (shiftTilesY > marginWidth && (r == rows - shiftTilesY - 1 || r == shiftTilesY)) {
                        if (r == shiftTilesY && imageCoordShiftY * -1 > this.clipRect.height) {
                            const borderClip = checkModifiedClip(tiledImage);
                            borderClip.height = borderClip.height - (this.clipRect.height + imageCoordShiftX) * -1;
                            borderClip.y = borderClip.y + (this.clipRect.height + imageCoordShiftY) * -1;
                            tiledImage.setClip(borderClip);
                        }
                        else if (r == rows - shiftTilesY - 1 && imageCoordShiftY > this.clipRect.height) {
                            const borderClip = checkModifiedClip(tiledImage);
                            borderClip.height = this.clipRect.height - (imageCoordShiftY - this.clipRect.height);
                            tiledImage.setClip(borderClip);
                        }
                    }
                }
                tiledImage.setPosition(new OpenSeadragon.Point(x, y), immediately);
                let debugText = `${c}, ${r} (${column}, ${row})`;
                if (tiledImage === referenceImage) {
                    debugText = "Reference " + debugText;
                }
                this.debugOverlay(debugText, tiledImage, true);
            }
        }
        this.viewer.world.setAutoRefigureSizes(true);
        if (immediately) {
            raiseFinished.bind(this)();
        }
    }
    debugOverlay(content, image, clip = false) {
        if (!this._debug || this._debugOverlays === undefined) {
            return;
        }
        if (this._debugOverlays.has(image)) {
            const overlays = this._debugOverlays.get(image);
            overlays[0].element.innerHTML = content;
            this.viewer?.getOverlayById(overlays[0].element).update(image.getBounds(true), undefined);
            if (overlays[1] !== undefined && clip && image.getClip() !== null) {
                this.viewer?.getOverlayById(overlays[1].element).update(image.imageToViewportRectangle(image.getClip()), undefined);
            }
        }
        else {
            const labelElem = document.createElement("div");
            labelElem.id = "debug-overlay" + Math.random().toString(16).slice(2);
            labelElem.className = "debug-overlay";
            labelElem.innerHTML = content;
            labelElem.dataset.content = content;
            labelElem.style.fontSize = "2em";
            labelElem.style.color = "red";
            labelElem.style.alignItems = "center";
            labelElem.style.justifyContent = "canter";
            labelElem.style.display = "flex";
            labelElem.style.textAlign = "center";
            labelElem.style.border = "2px solid red";
            const overlay = {
                element: labelElem,
                location: image.getBounds(true)
            };
            this.viewer?.addOverlay(overlay.element, overlay.location);
            let clipOverlay;
            if (clip && image.getClip() !== null) {
                const clipElem = document.createElement("div");
                clipElem.id = "debug-overlay" + Math.random().toString(16).slice(2);
                clipElem.className = "debug-overlay";
                clipElem.classList.add("clip");
                clipElem.dataset.content = content;
                clipElem.style.border = "1px dashed green";
                clipOverlay = {
                    element: clipElem,
                    location: image.imageToViewportRectangle(image.getClip())
                };
                this.viewer?.addOverlay(clipOverlay.element, clipOverlay.location);
                this._debugOverlays.set(image, [overlay, clipOverlay]);
            }
            else {
                this._debugOverlays.set(image, [overlay]);
            }
        }
    }
    static fitToWidth(viewer, immediately = true, clipRect, fitTop = false, fitHeight = false) {
        if (viewer !== undefined && viewer.world.getItemCount() > 0) {
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            for (let i = 0; i < viewer.world.getItemCount(); i++) {
                const tiledImage = viewer.world.getItemAt(i);
                const bounds = tiledImage.getBounds();
                if (tiledImage.getClip() !== null) {
                    if (tiledImage.getContentSize().x == tiledImage.getClip().x && tiledImage.getContentSize().y == tiledImage.getClip().y) {
                        continue;
                    }
                    minX = Math.min(minX, tiledImage.imageToViewportRectangle(tiledImage.getClip()).x);
                    maxX = Math.max(maxX, tiledImage.imageToViewportRectangle(tiledImage.getClip()).x + tiledImage.imageToViewportRectangle(tiledImage.getClip()).width);
                    maxY = Math.max(maxY, tiledImage.imageToViewportRectangle(tiledImage.getClip()).y + tiledImage.imageToViewportRectangle(tiledImage.getClip()).height);
                    minY = Math.min(minY, tiledImage.imageToViewportRectangle(tiledImage.getClip()).y);
                }
                else {
                    minX = Math.min(minX, bounds.x);
                    maxX = Math.max(maxX, bounds.x + bounds.width);
                    maxY = Math.max(maxY, bounds.y + bounds.height);
                    minY = Math.min(minY, bounds.y);
                }
            }
            const combinedWidth = maxX - minX;
            const combinedHeight = maxY - minY;
            if (combinedWidth > 0 || combinedHeight > 0) {
                let targetZoom;
                let combinedCenterX;
                let combinedCenterY;
                if (fitHeight) {
                    if (combinedHeight === 0) {
                        console.warn("Cannot fit to height when combined height is zero.");
                        return;
                    }
                    const containerHeight = viewer.viewport.getContainerSize().y;
                    targetZoom = containerHeight / viewer.viewport.getContainerSize().x / combinedHeight;
                    combinedCenterX = minX + combinedWidth / 2;
                    combinedCenterY = minY + combinedHeight / 2;
                    viewer.viewport.zoomTo(targetZoom, undefined, immediately);
                    viewer.viewport.panTo(new OpenSeadragon.Point(combinedCenterX, combinedCenterY), immediately);
                }
                else {
                    if (combinedWidth === 0) {
                        console.warn("Cannot fit to width when combined width is zero.");
                    }
                    targetZoom = 1.0 / combinedWidth;
                    combinedCenterX = minX + combinedWidth / 2;
                    viewer.viewport.zoomTo(targetZoom, undefined, immediately);
                    viewer.viewport.panTo(new OpenSeadragon.Point(combinedCenterX, viewer.viewport.getCenter().y), immediately);
                    const currentViewportBounds = viewer.viewport.getBounds();
                    if (currentViewportBounds.y < 0) {
                        viewer.viewport.panBy(new OpenSeadragon.Point(0, -currentViewportBounds.y), immediately);
                    }
                    if (currentViewportBounds.y > 0 && fitTop) {
                        viewer.viewport.panBy(new OpenSeadragon.Point(0, -currentViewportBounds.y + minY), immediately);
                    }
                }
                viewer.raiseEvent("full-width", viewer);
            }
        }
        else {
            throw new Error("Not a valid viewer or no items in the world.");
        }
    }
    appendNotification(cuts) {
        const last = this._notificationQueue[this._notificationQueue.length - 1];
        if (last === undefined || !equals(last, cuts)) {
            this._notificationQueue.push(cuts);
        }
    }
    notify(cuts, immediately = true) {
        if (!this._loaded || this.viewer === undefined) {
            this.appendNotification(cuts);
        }
        else {
            this.preview(cuts[0][CutPosition.Left], cuts[0][CutPosition.Top], cuts[0][CutPosition.Right], cuts[0][CutPosition.Bottom], immediately, cuts[1], cuts[2]);
        }
    }
    async renderImage(width = 1920, height = 1080) {
        const container = document.createElement("div");
        let debugElement;
        container.id = Renderer._rendererContainer;
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        if (this._debug !== undefined && this._debug) {
            debugElement = document.querySelector(`#${Renderer._debugId}`);
            if (debugElement === null) {
                debugElement = document.querySelector("body");
            }
            debugElement.insertAdjacentElement("beforeend", container);
        }
        else {
            container.style.position = "absolute";
            container.style.left = "-9999px";
            container.style.top = "-9999px";
            container.style.overflow = "hidden";
            document.querySelector("body").insertAdjacentElement("beforeend", container);
        }
        const renderer = new Renderer(container, this.columns, this.rows, false, false, false, undefined, width, height);
        renderer.fitPreview = false;
        const childViewer = renderer.viewer;
        if (!childViewer) {
            throw new Error("Child Renderer has no viewer!");
        }
        if (!this._source) {
            throw new Error("Parent viewer has no source!");
        }
        const clip = {};
        const offsets = this._offsets;
        const rotations = this._rotations;
        if (this.clipRect !== undefined) {
            clip[CutPosition.Top] = this.clipRect.y;
            clip[CutPosition.Left] = this.clipRect.x;
            clip[CutPosition.Right] = this.clipRect.x + this.clipRect.width;
            clip[CutPosition.Bottom] = this.clipRect.y + this.clipRect.height;
        }
        else {
            clip[CutPosition.Top] = 0;
            clip[CutPosition.Left] = 0;
            clip[CutPosition.Right] = this._source.width;
            clip[CutPosition.Bottom] = this._source.height;
        }
        renderer.source = this._source;
        const numTiles = childViewer.world.getItemCount();
        return new Promise((resolve, reject) => {
            let layoutFinished = false;
            let tilesDrawn = 0;
            let fullWidthFired = false;
            const checkReady = () => {
                if (layoutFinished && tilesDrawn >= numTiles && fullWidthFired) {
                    try {
                        resolve(childViewer);
                        clearTimeout(timer);
                        if (tileDrawnHandler)
                            childViewer.removeHandler("tile-drawn", tileDrawnHandler);
                        if (layoutFinishHandler)
                            childViewer.removeHandler("layout-finish", layoutFinishHandler);
                        if (fullWidthHandler)
                            childViewer.removeHandler("full-width", fullWidthHandler);
                    }
                    catch (error) {
                        reject(error);
                        clearTimeout(timer);
                        if (tileDrawnHandler)
                            childViewer.removeHandler("tile-drawn", tileDrawnHandler);
                        if (layoutFinishHandler)
                            childViewer.removeHandler("layout-finish", layoutFinishHandler);
                        if (fullWidthHandler)
                            childViewer.removeHandler("full-width", fullWidthHandler);
                    }
                }
            };
            const tileDrawnHandler = () => {
                tilesDrawn++;
                checkReady();
            };
            const layoutFinishHandler = () => {
                layoutFinished = true;
                childViewer.addOnceHandler("full-width", fullWidthHandler);
                Renderer.fitToWidth(childViewer, true, undefined, true);
                checkReady();
            };
            const fullWidthHandler = () => {
                fullWidthFired = true;
                checkReady();
            };
            childViewer.addHandler("tile-drawn", tileDrawnHandler);
            const updateViewportHandler = () => {
            };
            childViewer.addHandler("update-viewport", updateViewportHandler);
            const waitForTiles = () => {
                if (tilesDrawn >= numTiles) {
                    childViewer.removeHandler("tile-drawn", waitForTiles);
                    childViewer.addOnceHandler("layout-finish", layoutFinishHandler);
                    renderer.notify([clip, offsets, rotations], true);
                }
            };
            childViewer.addHandler("tile-drawn", waitForTiles);
            const timer = setTimeout(() => {
                const errMsg = i18next.t("renderer:renderTimeout");
                reject(new Error(`${errMsg} ${this.renderTimeout}ms`));
                if (tileDrawnHandler)
                    childViewer.removeHandler("tile-drawn", tileDrawnHandler);
                if (layoutFinishHandler)
                    childViewer.removeHandler("layout-finish", layoutFinishHandler);
                if (fullWidthHandler)
                    childViewer.removeHandler("full-width", fullWidthHandler);
            }, this.renderTimeout);
        });
    }
    addControls(element, width = 1920, height = 1080, type = "image/png") {
        let childViewer;
        const renderCallback = async (width = 1920, height = 1080) => {
            try {
                const viewer = await this.renderImage(width, height);
                await new Promise((r) => setTimeout(r, 500));
                childViewer = viewer;
                return viewer.drawer.canvas;
            }
            catch (e) {
                if (this.statusContainer !== null) {
                    const errMsg = i18next.t("renderer:error") + ": " + e.message;
                    this.statusContainer.innerHTML = errMsg;
                }
                throw new Error(e);
            }
        };
        if (this._download) {
            customElements.define("offscreencanvas-download", CanvasDownloadButton);
            this.downloadButton = document.createElement("offscreencanvas-download");
            const suffix = type.split("/")[1];
            this.downloadButton.format = suffix;
            this.downloadButton.renderCallback = renderCallback.bind(this);
            this.downloadButton.addEventListener("download-end", () => {
                if (childViewer !== undefined && childViewer !== null && childViewer.container !== undefined) {
                    const childViewerContainer = childViewer.container;
                    childViewer.destroy();
                    childViewerContainer.remove();
                    if (this._debug !== undefined && this._debug) {
                        const debugElement = document.querySelector(`#${Renderer._debugId}`);
                        if (debugElement !== null) {
                            debugElement.remove();
                        }
                        else {
                            document.querySelector("body > div:last-of-type")?.remove();
                        }
                    }
                    const downloadRenderer = document.querySelector(`#${Renderer._rendererContainer}`);
                    if (downloadRenderer !== null) {
                        downloadRenderer.remove();
                    }
                    childViewer = null;
                }
            });
            this.downloadButton.fileName = `wallpaper`;
            this.downloadButton.width = width;
            this.downloadButton.height = height;
            this.downloadButton.setAttribute("disabled", "true");
            this.downloadButton.classList.add("download-button");
            customElements.define("image-resolution-select", ImageResolutionSelect);
            this.resolutionSelect = document.createElement("image-resolution-select");
            this.resolutionSelect.setAttribute("confirm-button", "true");
            this.resolutionSelect.customHeight = height;
            this.resolutionSelect.customWidth = width;
            this.resolutionSelect.setAttribute("disabled", "true");
            this.resolutionSelect.addEventListener("change", (event) => {
                if (event.detail !== undefined) {
                    this.downloadButton.width = event.detail[0];
                    this.downloadButton.height = event.detail[1];
                    this.downloadButton.disabled = false;
                }
            });
            this.resolutionSelect.classList.add("resolution-select");
            element.appendChild(this.resolutionSelect);
            element.appendChild(this.downloadButton);
        }
        if (this._gridSelector) {
            customElements.define("grid-size-selector", GridSizeSelector);
            this.gridSizeSelect = document.createElement("grid-size-selector");
            this.gridSizeSelect.setAttribute("disabled", "true");
            this.gridSizeSelect.setAttribute("width", String(this.columns));
            this.gridSizeSelect.setAttribute("height", String(this.rows));
            this.gridSizeSelect.classList.add("grid-select");
            const sizeChangeHandler = (event) => {
                const columns = event.detail.width;
                const rows = event.detail.height;
                const fitCallback = () => {
                    if (this.viewer !== undefined) {
                        Renderer.fitToWidth(this.viewer, true);
                    }
                };
                this.viewer?.addOnceHandler("source-loaded", fitCallback.bind(this));
                this.setSize(columns, rows);
            };
            this.gridSizeSelect.addEventListener("size-changed", sizeChangeHandler.bind(this));
            element.appendChild(this.gridSizeSelect);
        }
    }
}
Renderer.defaultSelector = ".texture-container";
Renderer.rendererViewerSelector = ".output-viewer";
Renderer._debugId = "debug";
Renderer._rendererContainer = "hidden-renderer-container";

class IconDropdownSelect extends HTMLElement {
    constructor() {
        super();
        this.options = [];
        this._disabled = false;
        this._value = null;
        this._selectedIndex = -1;
        this.shadow = this.attachShadow({ mode: "open" });
        this.displayElement = document.createElement("div");
        this.displayElement.classList.add("display");
        this.optionsContainer = document.createElement("div");
        this.optionsContainer.classList.add("options-container");
        this.setupDOM();
        this.applyStyles();
        this.setupEventListeners();
    }
    connectedCallback() {
        this.populateOptions();
    }
    static get observedAttributes() {
        return ["disabled", "value"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (name === "disabled") {
            this.disabled = newValue !== null;
        }
        else if (name === "value") {
            this.value = newValue;
        }
    }
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = value;
        this.updateDisabledState();
    }
    get value() {
        return this._value;
    }
    set value(newValue) {
        if (this._value !== newValue) {
            this._value = newValue;
            this.updateDisplay();
        }
    }
    setupDOM() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("wrapper");
        wrapper.appendChild(this.displayElement);
        wrapper.appendChild(this.optionsContainer);
        this.shadow.appendChild(wrapper);
    }
    applyStyles() {
        const style = document.createElement("style");
        style.textContent = `
      :host {
          display: inline-block;
          --disabled-opacity: .6;
      }

      :host(.disabled) {
        opacity: var(--disabled-opacity);
        pointer-events: none;
      }

      .wrapper {
        position: relative;
        display: inline-block;
        width: 100%;
      }
      
      .display {
        border: 1px solid #ccc;
        padding: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        border-radius: .4rem;
      }

      .display.disabled {
        cursor: default;
        background-color: #eee;
        color: #999;
      }

      .display img {
        margin-right: 8px;
        width: 20px;
        height: 20px;
      }

      .options-container {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        display: none;
        border: 1px solid #ccc;
        background-color: white;
        z-index: 10;
        overflow-y: scroll;
        min-height: 30vh;
        max-height: 80vh;
      }

      .options-container.open {
        display: block;
      }

      .option {
        padding: .2rem;
        display: flex;
        align-items: center;
        cursor: pointer;
      }

      .option img {
        margin-right: 8px;
        width: 20px;
        height: 20px;
      }

      .option.selected {
        background-color: #f0f0f0;
      }

    `;
        this.shadow.appendChild(style);
    }
    setupEventListeners() {
        this.displayElement.addEventListener("click", (event) => {
            event.stopPropagation();
            if (!this.disabled) {
                this.optionsContainer.classList.toggle("open");
                if (this.optionsContainer.classList.contains("open")) {
                    this._selectedIndex = -1;
                }
            }
        });
        document.addEventListener("click", (event) => {
            if (!this.shadow.contains(event.target) && this.optionsContainer.classList.contains("open")) {
                this.optionsContainer.classList.remove("open");
            }
        });
        this.displayElement.addEventListener("keydown", (event) => {
            if (this.disabled)
                return;
            if (event.key === "ArrowDown") {
                event.preventDefault();
                this.navigateOptions(1);
            }
            else if (event.key === "ArrowUp") {
                event.preventDefault();
                this.navigateOptions(-1);
            }
            else if (event.key === "Enter" && this._selectedIndex !== -1) {
                event.preventDefault();
                this.selectOption(this._selectedIndex);
            }
            else if (event.key === "Escape") {
                this.optionsContainer.classList.remove("open");
            }
        });
        this.displayElement.setAttribute("tabindex", "0");
    }
    navigateOptions(direction) {
        if (!this.optionsContainer.classList.contains("open")) {
            this.optionsContainer.classList.add("open");
        }
        this._selectedIndex += direction;
        if (this._selectedIndex < 0) {
            this._selectedIndex = this.options.length - 1;
        }
        else if (this._selectedIndex >= this.options.length) {
            this._selectedIndex = 0;
        }
        this.updateOptionSelection();
    }
    selectOption(index) {
        if (index >= 0 && index < this.options.length) {
            this.value = this.options[index].value;
            this.optionsContainer.classList.remove("open");
            this.dispatchEvent(new CustomEvent("change", { detail: this.options[index].value }));
        }
    }
    updateOptionSelection() {
        Array.from(this.optionsContainer.children).forEach((option, index) => {
            if (index === this._selectedIndex) {
                option.classList.add("selected");
                option.scrollIntoView({ block: "nearest" });
            }
            else {
                option.classList.remove("selected");
            }
        });
    }
    populateOptions() {
        this.optionsContainer.innerHTML = "";
        this.options = Array.from(this.children).map((child) => {
            const value = child.getAttribute("value") || "";
            const innerHTML = child.innerHTML || "";
            return { value, innerHTML };
        });
        this.options.forEach((option) => {
            const optionElement = document.createElement("div");
            optionElement.classList.add("option");
            optionElement.innerHTML = option.innerHTML;
            optionElement.addEventListener("click", () => {
                this.value = option.value;
                this.optionsContainer.classList.remove("open");
                this.dispatchEvent(new CustomEvent("change", { detail: option.value }));
            });
            this.optionsContainer.appendChild(optionElement);
        });
        this.updateDisplay();
        this.updateDisabledState();
    }
    updateDisplay() {
        const selectedOption = this.options.find((option) => option.value === this.value);
        this.displayElement.innerHTML = "";
        if (selectedOption) {
            this.displayElement.innerHTML = selectedOption.innerHTML;
        }
        else if (this.options.length > 0) {
            this.displayElement.innerHTML = this.options[0].innerHTML;
        }
    }
    updateDisabledState() {
        if (this.disabled) {
            this.displayElement.classList.add("disabled");
        }
        else {
            this.displayElement.classList.remove("disabled");
        }
    }
}

class IIIFForm {
    constructor(cuttingTable, element, statusContainer, urlInput = true, autoLoad) {
        this.buttonClass = "load-url-button";
        this.inputFieldClass = "url-input";
        this.entries = {};
        this._autoLoad = false;
        this.cuttingTable = cuttingTable;
        customElements.define("icon-dropdown-select", IconDropdownSelect);
        this.inputField = this.cuttingTable.container.querySelector(`.${this.inputFieldClass}`);
        if (element === undefined) {
            this.selectContainer = this.cuttingTable.container.querySelector(`.${CuttingTable.selectContainerClass}`);
        }
        else {
            this.selectContainer = element;
        }
        this._urlInput = urlInput;
        if (autoLoad !== undefined) {
            this._autoLoad = autoLoad;
        }
        this.statusContainer = statusContainer;
        if (urlInput) {
            this.button = this.cuttingTable.container.querySelector(`.${this.buttonClass}`);
            this.button.innerText = i18next.t("iiifForm:loadButton");
        }
        this.setup();
    }
    setup() {
        const loader = (url) => {
            try {
                this.loadUrl(new URL(url), undefined).then((options) => {
                    this.createForm(options);
                });
            }
            catch (error) {
                this.displayMessage(i18next.t("iiifForm:errorURL"));
                return;
            }
        };
        if (this._urlInput) {
            this.button?.addEventListener("click", () => {
                if (this.inputField !== null) {
                    const url = this.inputField?.value;
                    if (url !== undefined && url !== "" && this.statusContainer !== null) {
                        this.statusContainer.innerHTML = "";
                        this.selectContainer.innerHTML = "";
                        loader(url);
                    }
                }
            });
            if (this._autoLoad) {
                this.button?.click();
            }
        }
        else if (this.cuttingTable.url !== undefined) {
            this.loadUrl(new URL(this.cuttingTable.url), undefined).then((options) => {
                this.createForm(options);
            });
        }
        else {
            throw new Error("Input is disabled but no default URL given!");
        }
    }
    set urlInput(url) {
        if (this.inputField !== null) {
            this.inputField.value = url.toString();
        }
    }
    createForm(options) {
        if (options === undefined) {
            return;
        }
        if (options.type === "Image") {
            return;
        }
        if (options.type in this.entries) {
            this.entries[options.type] = this.addSelect(options);
            this.current = options.type;
        }
        else if (!Object.keys(this.entries).length) {
            this.entries[options.type] = this.addSelect(options);
            this.current = options.type;
        }
        else {
            throw new Error("This should't happen!");
        }
    }
    updateForm(url, type) {
        this.loadUrl(new URL(url), type).then((options) => {
            this.createForm(options);
        });
    }
    async safeLoadIIIF(url, trySuffix = "") {
        return fetch(url, { redirect: "follow" })
            .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return { url: url, json: res.json() };
        })
            .catch((error) => {
            console.warn(`Failed to load ${url}, it's safe to ignore CORS warnings, those are the results of checking for manifests.`);
            if (trySuffix !== "") {
                let u = url.toString();
                if (!u.endsWith("/")) {
                    u = u + "/" + trySuffix;
                }
                else {
                    u = u + trySuffix;
                }
                return this.safeLoadIIIF(new URL(u));
            }
            else {
                console.warn(`Network or CORS issue for ${url.toString()}:`, error);
            }
            return { url: url, json: undefined };
        });
    }
    displayMessage(msg) {
        if (this.statusContainer !== null) {
            this.statusContainer.innerHTML = msg;
        }
    }
    clearMessage() {
        if (this.statusContainer !== null) {
            this.statusContainer.innerHTML = "";
        }
    }
    async loadUrl(url, type = "Image") {
        let trySuffix;
        if (type === undefined) {
            trySuffix = "";
        }
        else {
            trySuffix = IIIFForm.typeHierarchy[type];
        }
        let json, loadedUrl;
        try {
            const loaded = await this.safeLoadIIIF(url, trySuffix);
            json = await loaded.json;
            loadedUrl = loaded.url;
        }
        catch (error) {
            console.warn(error);
        }
        if (json === undefined || loadedUrl === undefined) {
            this.displayMessage(i18next.t("iiifForm:errorJson"));
            return;
        }
        const manifest = IIIF.parse(json);
        const lang = i18next.language.split("-")[0];
        if (manifest instanceof Collection) {
            const manifests = { type: "Collection", entries: [], source: url };
            manifest.items.forEach((m) => {
                let label = "";
                if (m.label !== undefined) {
                    if (lang in m.label) {
                        label = m.label[lang].join(" ");
                    }
                    else {
                        label = m.label[Object.keys(m.label)[0]].join(" ");
                    }
                }
                const entry = { id: m.uri, label: label };
                if ("thumbnail" in m && m.thumbnail !== undefined) {
                    entry.thumbnail = new URL(m.thumbnail[0].id);
                }
                manifests.entries.push(entry);
            });
            this.current = "Collection";
            this.entries["Collection"] = manifests;
        }
        else if (manifest instanceof Manifest) {
            const pages = { type: "Manifest", entries: [], source: url };
            manifest.canvases.forEach((m) => {
                let label = "";
                if (m.label !== undefined) {
                    if (lang in m.label) {
                        label = m.label[lang].join(" ");
                    }
                    else {
                        label = m.label[Object.keys(m.label)[0]].join(" ");
                    }
                }
                const entry = { id: m.image.uri, label: label };
                if ("width" in m && "height" in m) {
                    entry.height = m.height;
                    entry.width = m.width;
                }
                if ("thumbnail" in m && m.thumbnail !== undefined) {
                    entry.thumbnail = new URL(m.thumbnail[0].id);
                }
                pages.entries.push(entry);
            });
            this.current = "Manifest";
            this.entries["Manifest"] = pages;
        }
        else if (manifest instanceof Image) {
            const image = { type: "Image", entries: [], source: url };
            image.entries.push({ id: manifest.uri, label: "" });
            this.current = "Image";
            this.entries["Image"] = image;
            this.loadImageAPI(loadedUrl);
        }
        return this.entries[this.current];
    }
    static createSelect(options, clz, id, element, label) {
        const selectList = document.createElement("icon-dropdown-select");
        selectList.classList.add("select", options.type.toLowerCase());
        const selectName = "select-" + Math.random().toString(16).slice(5);
        const selectId = "select-" + options.type;
        const labelElement = document.createElement("label");
        if (label !== undefined) {
            if (element !== undefined) {
                const existing = element.querySelector(`#${selectId}`);
                if (existing !== null) {
                    existing.remove();
                }
            }
            labelElement.innerHTML = label;
            labelElement.htmlFor = selectId;
            if (selectList instanceof HTMLSelectElement) {
                selectList.name = selectName;
            }
            selectList.id = selectId;
            labelElement.id = selectId;
        }
        if (clz !== undefined && clz !== "") {
            selectList.classList.add(clz);
        }
        if (id !== undefined && clz !== "") {
            selectList.id = id;
        }
        options.entries.forEach((optionEntry) => {
            const option = document.createElement("option");
            option.value = optionEntry.id;
            if (optionEntry.thumbnail !== undefined) {
                const thumbnail = document.createElement("img");
                thumbnail.src = optionEntry.thumbnail.toString();
                option.innerHTML = thumbnail.outerHTML + optionEntry.label;
            }
            else {
                option.text = optionEntry.label;
            }
            selectList.appendChild(option);
        });
        if (options.type === "Image") {
            options.element = labelElement;
        }
        else {
            options.element = selectList;
        }
        if (labelElement !== undefined) {
            options.label = labelElement;
        }
        if (element !== undefined) {
            element.appendChild(selectList);
        }
        return options;
    }
    addSelect(options, autoLoadSingle = true) {
        if (this.selectContainer !== null) {
            const label = i18next.t(`iiifForm:${options.type.toLowerCase()}Choose`);
            const id = "";
            options = IIIFForm.createSelect(options, id, `select-${options.type}`, this.selectContainer, label);
        }
        if (autoLoadSingle && options.entries.length == 1) {
            if ("element" in options && options.element !== undefined) {
                options.element.disabled = true;
            }
            if (options.type === "Manifest" || options.type === "Image") {
                console.warn(`Autoloading ${options.entries[0].id}`);
                this.loadImageAPI(new URL(options.entries[0].id));
            }
        }
        else {
            options.element?.addEventListener("change", (event) => {
                if (event.detail !== undefined) {
                    const url = new URL(event.detail);
                    const typeKeys = Object.keys(IIIFForm.typeHierarchy);
                    let expectedType;
                    if (options.type !== undefined) {
                        const currentType = typeKeys.indexOf(options.type);
                        expectedType = typeKeys[currentType + 1];
                    }
                    this.updateForm(url, expectedType);
                }
            });
        }
        return options;
    }
    async loadImageAPI(imageAPIEndpoint) {
        let service;
        try {
            service = await loadInfoJson(imageAPIEndpoint);
        }
        catch {
            console.warn(`Failed to get ${imageAPIEndpoint}`);
        }
        this.cuttingTable.imageService = service;
        if (this._imageAPIUrl !== undefined && this._imageAPIUrl != imageAPIEndpoint) {
            this.cuttingTable.imageServiceUrl = this._imageAPIUrl;
        }
        else {
            this.cuttingTable.imageServiceUrl = imageAPIEndpoint;
        }
        return service;
    }
}
IIIFForm.typeHierarchy = { Collection: "collection.json", Manifest: "manifest.json", Image: "info.json" };

const en = {
	cuttingTable: {
		linksJson: "Download as JSON",
		uploadError: "JSON could not be loaded",
		loadUrl: "Load URL",
		rulerToggle: "Show rulers"
	},
	iiifForm: {
		collectionChoose: "Select manifest from the collection",
		collectionButton: "Select",
		manifestChoose: "Select page as template",
		manifestButton: "Select",
		imageChoose: "Select image",
		imageButton: "Select",
		loadButton: "Load URL",
		errorJson: "<b>IIIF file could not be loaded</b>",
		errorURL: "<b>Invalid URL</b>"
	},
	renderer: {
		error: "Error",
		renderTimeout: "Render not finished after"
	},
	canvasDownloadButton: {
		download: "Download",
		downloadFailed: "Download failed."
	},
	imageResolutionSelect: {
		custom: "Custom resolution",
		confirmButton: "Confirm"
	},
	gridSizeSelector: {
		selectSize: "Select Size",
		updateSize: "Update Size"
	},
	generic: {
		columns: "Columns",
		rows: "Rows"
	}
};
const de = {
	cuttingTable: {
		linksJson: "Als JSON herunterladen",
		uploadError: "JSON konnte nicht geladen werden",
		loadUrl: "URL laden",
		rulerToggle: "Lineale anzeigen"
	},
	iiifForm: {
		collectionChoose: "Manifest aus der Sammlung auswählen",
		collectionButton: "Auswählen",
		manifestChoose: "Seite als Vorlage auswählen",
		manifestButton: "Auswählen",
		imageChoose: "Bild auswählen",
		imageButton: "Auswählen",
		loadButton: "URL laden",
		errorJson: "<b>IIIF Datei konnte nicht geladen werden</b>",
		errorURL: "<b>Ungültige URL</b>"
	},
	renderer: {
		error: "Fehler",
		renderTimeout: "Erzeugung nicht abgeschlossen nach"
	},
	canvasDownloadButton: {
		download: "Herunterladen",
		downloadFailed: "Download fehlgeschlagen."
	},
	imageResolutionSelect: {
		custom: "Eigene Auflösung",
		confirmButton: "Bestätigen"
	},
	gridSizeSelector: {
		selectSize: "Größe wählen",
		updateSize: "Größe aktualisieren"
	},
	generic: {
		columns: "Spalten",
		rows: "Zeilen"
	}
};
var translations = {
	en: en,
	de: de
};

i18next.use(LanguageDetector).init({
    debug: false,
    fallbackLng: "en",
    resources: translations,
    supportedLngs: [
        'en', 'de'
    ]
});
class CuttingTable {
    constructor(element, urlInput = true, gridSelector = true, download = true, autoLoad = true, urls, shifts = false) {
        this.download = true;
        this._debug = false;
        this._shifts = true;
        this._columns = 4;
        this._rows = 4;
        if (element !== undefined) {
            this.container = element;
        }
        else {
            this.container = document.querySelector(`.${CuttingTable.defaultId}`);
        }
        this.container.classList.add("lucienne");
        if (this.container === undefined) {
            throw new Error("Couldn't setup element");
        }
        if ("debug" in element.dataset && element.dataset.debug !== undefined && element.dataset.debug !== "") {
            this._debug = element.dataset.debug === "true";
        }
        if ("urlInput" in element.dataset && element.dataset.urlInput !== undefined && element.dataset.urlInput !== "") {
            urlInput = element.dataset.urlInput === "true";
        }
        this._urlInput = urlInput;
        if ("gridSelector" in element.dataset && element.dataset.gridSelector !== undefined && element.dataset.gridSelector !== "") {
            gridSelector = element.dataset.gridSelector === "true";
        }
        this._gridSelector = gridSelector;
        if ("download" in element.dataset && element.dataset.download !== undefined && element.dataset.download !== "") {
            download = element.dataset.download === "true";
        }
        this._download = download;
        this._autoLoad = autoLoad;
        this._shifts = shifts;
        if ("url" in element.dataset && element.dataset.url !== undefined && element.dataset.url !== "") {
            this._url = new URL(element.dataset.url);
        }
        else {
            if (urls !== undefined && urls instanceof URL) {
                this._url = urls;
            }
            else if (urls !== undefined && Array.isArray(urls)) {
                this._initialUrls = urls;
            }
            else if (typeof urls === "string") {
                this._url = new URL(urls);
            }
            if (this._autoLoad && Array.isArray(this._initialUrls)) {
                this._url = new URL(this._initialUrls[0]["url"]);
            }
        }
        if ("columns" in element.dataset && element.dataset.columns !== undefined && element.dataset.columns !== "") {
            this._columns = parseInt(element.dataset.columns);
        }
        if ("rows" in element.dataset && element.dataset.rows !== undefined && element.dataset.rows !== "") {
            this._rows = parseInt(element.dataset.rows);
        }
        if (this._shifts) {
            this.container.classList.add(CuttingTable.shiftClass);
        }
        if (!this._urlInput && this._url === undefined) {
            throw new Error("No initial URL set");
        }
        customElements.define("rotating-input", RotatingInput);
        customElements.define("dual-range-slider", DualRangeSlider);
        this.setupInterface();
        const selectContainer = this.container.querySelector(`.${CuttingTable.selectContainerClass}`);
        this.statusContainer = this.container.querySelector(`.${CuttingTable.statusContainerClass}`);
        this.form = new IIIFForm(this, selectContainer, this.statusContainer, this._urlInput, this._autoLoad);
        const renderElement = this.container.querySelector(`.${CuttingTable.rendererElementClass}`);
        this.renderer = new Renderer(renderElement, this._columns, this._rows, this._gridSelector, this._download);
        this.renderer.debug = this._debug;
        this.renderer.statusContainer = this.statusContainer;
        this.viewerElement = this.container.querySelector(`.${CuttingTable.viewerElementClass}`);
        this.setupOSD(this.viewerElement);
        if (this.viewerElement.parentElement !== null && this.download) {
            this.addJSONLink(this.viewerElement.parentElement);
        }
        this.setupControls();
    }
    setupOSD(element) {
        initOSDFabricJS();
        const options = {
            zoomInButton: element.querySelector(".zoomin"),
            zoomOutButton: element.querySelector(".zoomout"),
            element: element,
            gestureSettingsMouse: { clickToZoom: false },
            showFullPageControl: false,
            showHomeControl: false,
            autoHideControls: false,
            drawer: "canvas",
            crossOriginPolicy: "Anonymous"
        };
        this.viewer = OpenSeadragon(options);
        this.fabricOverlay = this.viewer.fabricOverlay({ fabricCanvasOptions: { selection: false } });
    }
    addJSONLink(element) {
        this.downloadLink = document.createElement("a");
        this.downloadLink.innerText = i18next.t("cuttingTable:linksJson");
        this.downloadLink.title = i18next.t("cuttingTable:linksJson");
        this.downloadLink.setAttribute("href", "javascript:void(0)");
        this.downloadLink.classList.add("link", "json", "disabled");
        this.downloadLink.setAttribute("id", "downloadJSON");
        this.downloadLink.setAttribute("download", "cuttingTable.json");
        this.downloadLink.addEventListener("click", () => {
            if (this.cuts !== undefined) {
                if (this.cuts.url === "" && this.imageServiceUrl === undefined) {
                    throw new Error("Couldn' set target URL!");
                }
                else {
                    this.cuts.url = this.imageServiceUrl;
                }
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.cuts.toJSONLD(), null, 2));
                this.downloadLink.setAttribute("href", dataStr);
            }
        });
        element.appendChild(this.downloadLink);
    }
    square() {
        if (this.cuts !== undefined && this.cuts.square()) {
            this.cutY.valueMin = this.cuts.getPosition(CutPosition.Top);
            this.cutY.valueMax = this.cuts.getPosition(CutPosition.Bottom);
            this.cutX.valueMin = this.cuts.getPosition(CutPosition.Left);
            this.cutX.valueMax = this.cuts.getPosition(CutPosition.Right);
        }
    }
    async loadImageAPI(imageAPIEndpoint) {
        let service;
        try {
            service = await loadInfoJson(imageAPIEndpoint);
        }
        catch {
            console.warn(`Failed to get ${imageAPIEndpoint}`);
        }
        if (this.renderer !== undefined) {
            this.renderer.source = service;
        }
        this.imageService = service;
        this.imageServiceUrl = imageAPIEndpoint;
    }
    set imageService(endpointService) {
        if (this.viewer !== undefined) {
            this.viewer.world.addHandler("add-item", () => {
                if (this.cuts !== undefined) {
                    this.cuts.lastAxis = undefined;
                    this.updateLines(endpointService.width, endpointService.height);
                    this.form.clearMessage();
                    this.cuts.setVisibility(true);
                }
            });
            if (this.viewer.world.getItemCount()) {
                this.viewer.close();
                this.viewer.open(endpointService);
            }
            else {
                this.viewer.addTiledImage({ index: this.viewer.world.getItemCount(), tileSource: endpointService });
            }
            if (endpointService["@context"].startsWith("http://iiif.io/api/image/")) {
                this.updateLines(endpointService.width, endpointService.height, false);
            }
        }
        else {
            console.warn("Viewer not initialized");
        }
        if (this.renderer !== undefined) {
            if (this.renderer.loaded) {
                this.renderer.clear();
            }
            this.renderer.source = endpointService;
        }
    }
    set imageServiceUrl(url) {
        if (this.download) {
            this.downloadLink.classList.remove("disabled");
        }
        this._imageAPI = url;
        this.cuts.url = url;
    }
    get imageServiceUrl() {
        return this._imageAPI;
    }
    set initialUrls(initialUrls) {
        this._initialUrls = initialUrls;
    }
    get url() {
        return this._url;
    }
    get urlInput() {
        return this._urlInput;
    }
    initCuts() {
        this.cuts = new Cuts([CutPosition.Right, CutPosition.Bottom, CutPosition.Top, CutPosition.Left], this.fabricOverlay);
        this.cuts.setVisibility(false);
    }
    dropHandler(event) {
        this.dragOffHandler();
        if (event.dataTransfer === null) {
            return;
        }
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === "application/json") {
                const reader = new FileReader();
                reader.addEventListener("load", async (e) => {
                    if (e !== undefined && e.target !== null && e.target.result !== null) {
                        try {
                            const result = e.target.result;
                            let url;
                            const json = JSON.parse(result);
                            let jsonLoadCallback;
                            if ("type" in json) {
                                url = new URL(json.target.source);
                                this.form.urlInput = url;
                                jsonLoadCallback = () => {
                                    this.cuts.loadJSONLD(json);
                                    this.updateControls();
                                };
                            }
                            else {
                                url = new URL(json.url);
                                this.form.urlInput = url;
                                jsonLoadCallback = () => {
                                    this.cuts.loadJSON(json);
                                    this.updateControls();
                                };
                            }
                            await this.loadImageAPI(url);
                            this.viewer?.addOnceHandler("tile-loaded", jsonLoadCallback.bind(this));
                            this.cuts.setVisibility(true);
                        }
                        catch (error) {
                            console.error(error);
                            this.form.displayMessage(i18next.t("cuttingTable:uploadError") + "+ " + error.message);
                        }
                    }
                });
                reader.readAsText(file);
            }
            else {
                const msg = "File is not a JSON";
                this.form.displayMessage(i18next.t("cuttingTable:uploadError") + ": " + msg);
                throw new Error(msg);
            }
        }
    }
    dragOnHandler() {
        this.dropZoneElement.classList.add("dropzone");
    }
    dragOffHandler() {
        this.dropZoneElement.classList.remove("dropzone");
    }
    updateCutLineWidth() {
        if (this.cuts !== undefined && this.viewer !== undefined) {
            const lineWidth = Math.ceil(5 / this.viewer.viewport.getZoom());
            const shapePositions = Object.keys(this.cuts.shapes);
            shapePositions.forEach((position) => {
                this.cuts.setLineWidth(position, lineWidth);
            });
        }
    }
    updateControls() {
        this.updateCutLineWidth();
        if (this.cuts !== undefined) {
            this.cutX.max = this.cuts.width;
            this.cutY.max = this.cuts.height;
            this.offsetX.min = String(Math.ceil(0 - this.cuts.width / 2));
            this.offsetX.max = String(Math.floor(this.cuts.width / 2));
            this.offsetY.min = String(Math.ceil(0 - this.cuts.height / 2));
            this.offsetY.max = String(Math.floor(this.cuts.height / 2));
            const positions = Object.keys(this.cuts.positions);
            positions.forEach((position) => {
                if (position == CutPosition.Left && this.cuts.positions[CutPosition.Left] !== undefined) {
                    this.cutX.valueMin = this.cuts.positions[CutPosition.Left];
                }
                if (position == CutPosition.Right && this.cuts.positions[CutPosition.Right] !== undefined) {
                    this.cutX.valueMax = this.cuts.positions[CutPosition.Right];
                }
                if (position == CutPosition.Top && this.cuts.positions[CutPosition.Top] !== undefined) {
                    this.cutY.valueMin = this.cuts.positions[CutPosition.Top];
                }
                if (position == CutPosition.Bottom && this.cuts.positions[CutPosition.Bottom] !== undefined) {
                    this.cutY.valueMax = this.cuts.positions[CutPosition.Bottom];
                }
            });
            const offsets = Object.keys(this.cuts.offsets);
            offsets.forEach((position) => {
                if (position == CutPosition.Left && this.cuts.offsets[CutPosition.Left] !== undefined) {
                    this.offsetX.value = String(this.cuts.offsets[CutPosition.Left] * -1);
                }
                if (position == CutPosition.Right && this.cuts.offsets[CutPosition.Right] !== undefined) {
                    this.offsetX.value = String(this.cuts.offsets[CutPosition.Right]);
                }
                if (position == CutPosition.Top && this.cuts.offsets[CutPosition.Right] !== undefined) {
                    this.offsetY.value = String(this.cuts.offsets[CutPosition.Right] * -1);
                }
                if (position == CutPosition.Bottom && this.cuts.offsets[CutPosition.Bottom] !== undefined) {
                    this.offsetY.value = String(this.cuts.offsets[CutPosition.Bottom]);
                }
            });
            const rotations = Object.keys(this.cuts.rotations);
            rotations.forEach((position) => {
                if (position == CutPosition.Right && this.cuts.rotations[CutPosition.Right] !== undefined) {
                    this.rotationX.value = this.cuts.rotations[CutPosition.Right];
                }
                if (position == CutPosition.Bottom && this.cuts.rotations[CutPosition.Bottom] !== undefined) {
                    this.rotationY.value = this.cuts.rotations[CutPosition.Bottom];
                }
            });
        }
    }
    updateLines(width, height, visibility = true) {
        this.fabricOverlay.fabricCanvas().clear();
        this.initCuts();
        this.cuts.setSize(width, height);
        if (this.cuts.url === undefined) {
            this.cuts.url = this.imageServiceUrl;
        }
        this.updateCutLineWidth();
        this.cuts.setVisibility(visibility);
        if (this.renderer !== undefined) {
            this.cuts.callback = this.renderer.notify.bind(this.renderer);
        }
        this.cutX.setAttribute("max", String(width));
        this.cutX.setAttribute("value-min", "0");
        this.cutX.setAttribute("value-max", String(width));
        this.cutX.disabled = false;
        this.rotationX.disabled = false;
        this.rotationX.value = 0;
        this.cutY.setAttribute("max", String(height));
        this.cutY.setAttribute("value-min", "0");
        this.cutY.setAttribute("value-max", String(height));
        this.cutY.disabled = false;
        if (this._shifts) {
            this.offsetY.min = String(Math.ceil(0 - height / 2));
            this.offsetY.max = String(Math.floor(height / 2));
            this.offsetY.setAttribute("value", "0");
            this.offsetY.value = "0";
            this.offsetY.disabled = false;
            this.offsetX.min = String(Math.ceil(0 - width / 2));
            this.offsetX.max = String(Math.floor(width / 2));
            this.offsetX.setAttribute("value", "0");
            this.offsetX.value = "0";
            this.offsetX.disabled = false;
        }
        this.rotationY.disabled = false;
        this.rotationY.value = 0;
        this.rulerCheckbox.disabled = false;
        this.rulerCheckbox.checked = true;
        this.viewerElement.querySelector(".zoomin")?.classList.remove("disabled");
        this.viewerElement.querySelector(".zoomout")?.classList.remove("disabled");
        this.squareButton.dataset.height = String(height);
        this.squareButton.dataset.width = String(width);
        this.squareButton.classList.remove("disabled");
    }
    createJsonUploader(element) {
        element.addEventListener("dragover", (event) => {
            event.preventDefault();
            this.dragOnHandler();
        });
        element.addEventListener("dragenter", (event) => {
            event.preventDefault();
            this.dragOnHandler();
        });
        element.addEventListener("dragleave", (event) => {
            event.preventDefault();
            this.dragOffHandler();
        });
        element.addEventListener("dragend", (event) => {
            event.preventDefault();
            this.dragOffHandler();
        });
        element.addEventListener("drop", (event) => {
            event.preventDefault();
            this.dropHandler(event);
        });
    }
    setupInterface() {
        let listId = "";
        let initialUrls = "";
        if (this._initialUrls !== undefined && this._initialUrls.length != 0) {
            listId = "defaultURLs";
            const dataList = document.createElement("datalist");
            dataList.setAttribute("id", listId);
            this._initialUrls.forEach((optionEntry) => {
                const option = document.createElement("option");
                option.value = optionEntry.url;
                option.text = optionEntry.label;
                dataList.appendChild(option);
            });
            initialUrls = dataList.outerHTML;
        }
        let url = "", urlInput = "";
        if (this.url !== undefined) {
            url = this.url.toString();
        }
        if (this._urlInput) {
            urlInput = `<input class="url-input" type="url" value="${url}" name="url" id="collection-url" pattern="https://.*" list="${listId}" required />
          ${initialUrls}
          <button type="button" class="load-url-button">${i18next.t("cuttingTable:loadUrl")}</button>`;
        }
        this.container.innerHTML = `
      <div class="input-area">
        <div class="source-select">
          ${urlInput}
          <div class="select-container"></div>
          <div class="status-container"></div>
        </div>
        <div class="cutting-table">
          <div class="${CuttingTable.viewerElementClass}">
            <i class="controls button zoomin"></i><i class="controls button zoomout"></i>
            <i class="controls button square"></i>
          </div>
          <dual-range-slider min="0" max="1" value-min="0" value-max="1" class="control slider vertical cut-y"></dual-range-slider>
          <input type="range" min="1" max="100" value="50" class="control slider vertical offset offset-y" />
          <rotating-input step="90" display-degrees="false" radius="25" class="control rotation vertical rotation-y"></rotating-input>
          <dual-range-slider min="0" max="1" value-min="0" value-max="1" class="control slider horizontal cut-x"></dual-range-slider>
          <input type="range" min="1" max="100" value="50" class="control slider horizontal offset offset-x" />
          <rotating-input step="90" display-degrees="false" radius="25" class="control rotation horizontal rotation-x"></rotating-input>
          <input type="checkbox" class="control box rulers" checked />
        </div>
      </div>
      <div class="${CuttingTable.rendererElementClass} output-area">
      </div>
    `;
    }
    async setupControls() {
        this.cutX = this.container.querySelector(CuttingTable.controlSelectors.cut.x);
        this.cutY = this.container.querySelector(CuttingTable.controlSelectors.cut.y);
        this.cutX?.addEventListener("input", (e) => {
            if (e.detail !== undefined) {
                const min = Number(e.detail.min);
                const max = Number(e.detail.max);
                this.cuts.update(CutPosition.Left, min);
                this.cuts.update(CutPosition.Right, max);
            }
        });
        this.cutY?.addEventListener("input", (e) => {
            if (e.detail !== undefined) {
                const min = Number(e.detail.min);
                const max = Number(e.detail.max);
                this.cuts.update(CutPosition.Top, min);
                this.cuts.update(CutPosition.Bottom, max);
            }
        });
        this.offsetX = this.container.querySelector(CuttingTable.controlSelectors.offset.x);
        this.offsetY = this.container.querySelector(CuttingTable.controlSelectors.offset.y);
        this.offsetX?.addEventListener("input", (e) => {
            const value = Number(e.target.value);
            this.cuts.offsetX = value;
        });
        this.offsetY?.addEventListener("input", (e) => {
            const value = Number(e.target.value);
            this.cuts.offsetY = value;
        });
        this.rotationX = this.container.querySelector(CuttingTable.controlSelectors.rotation.x);
        this.rotationY = this.container.querySelector(CuttingTable.controlSelectors.rotation.y);
        this.rotationX?.addEventListener("degreeChange", (event) => {
            this.cuts.rotateX = event.detail.degree;
        });
        this.rotationY?.addEventListener("degreeChange", (event) => {
            this.cuts.rotateY = event.detail.degree;
        });
        this.rulerCheckbox = this.container.querySelector(CuttingTable.rulerElementSelector);
        this.rulerCheckbox.title = i18next.t("cuttingTable:toggleRuler");
        this.rulerCheckbox?.addEventListener("change", (e) => {
            const value = Boolean(e.target.checked);
            this.cuts.setVisibility(value);
        });
        this.viewerElement.querySelector(".zoomin")?.classList.add("disabled");
        this.viewerElement.querySelector(".zoomout")?.classList.add("disabled");
        this.squareButton = this.viewerElement.querySelector(CuttingTable.squareButtonSelector);
        this.squareButton.addEventListener("click", () => {
            this.square();
        });
        this.squareButton.classList.add("disabled");
        this.dropZoneElement = this.container.querySelector(`.${CuttingTable.dropZoneElementClass}`);
        this.createJsonUploader(this.dropZoneElement);
        if (this.cuts === undefined) {
            this.cutX.disabled = true;
            this.cutY.disabled = true;
            this.offsetX.disabled = true;
            this.offsetY.disabled = true;
            this.rotationX.disabled = true;
            this.rotationY.disabled = true;
            this.rulerCheckbox.disabled = true;
        }
    }
    static patchOpenSeadragon() {
        OpenSeadragon.TiledImage.prototype._getRotationPoint = function (current) {
            let bounds = this.getBoundsNoRotate(current);
            const worldWidth = current ? this._worldWidthCurrent : this._worldWidthTarget;
            const ratio = worldWidth / this.source.dimensions.x;
            if (this._rotationPoint !== undefined) {
                const point = this._rotationPoint.times(ratio);
                return new OpenSeadragon.Point(bounds.x + point.x, bounds.y + point.y);
            }
            if (this._clip) {
                const clip = this._clip.times(ratio);
                bounds = new OpenSeadragon.Rect(bounds.x + clip.x, bounds.y + clip.y, clip.width, clip.height);
            }
            return bounds.getCenter();
        };
        OpenSeadragon.TiledImage.prototype.setRotationPoint = function (rotationPoint) {
            this._rotationPoint = rotationPoint;
        };
        OpenSeadragon.TiledImage.prototype.getPosition = function (current) {
            const bounds = this.getBounds(current);
            return new OpenSeadragon.Point(bounds.x, bounds.y);
        };
        Object.defineProperty(OpenSeadragon.TiledImage.prototype, "clip", {
            get() {
                return this._clip;
            },
            set(clip) {
                this._clip = clip;
            }
        });
        OpenSeadragon.TileSource.prototype.getTileAtPoint = function (level, point) {
            const widthScaled = this.dimensions.x * this.getLevelScale(level);
            const pixelX = point.x * widthScaled;
            const pixelY = point.y * widthScaled;
            let x = Math.floor(pixelX / this.getTileWidth(level));
            let y = Math.floor(pixelY / this.getTileHeight(level));
            if (point.x >= 1) {
                x = this.getNumTiles(level).x - 1;
            }
            const EPSILON = 1e-15;
            if (point.y >= 1 / this.aspectRatio - EPSILON) {
                y = this.getNumTiles(level).y - 1;
            }
            return new OpenSeadragon.Point(x, y);
        };
        OpenSeadragon.Viewport.prototype._setContentBounds = function (bounds, contentFactor) {
            if (isNaN(bounds.x) || isNaN(bounds.y) || isNaN(bounds.width) || isNaN(bounds.width)) {
                return;
            }
            console.assert(bounds, "[Viewport._setContentBounds] bounds is required");
            console.assert(bounds instanceof OpenSeadragon.Rect, "[Viewport._setContentBounds] bounds must be an OpenSeadragon.Rect");
            console.assert(bounds.width > 0, "[Viewport._setContentBounds] bounds.width must be greater than 0");
            console.assert(bounds.height > 0, "[Viewport._setContentBounds] bounds.height must be greater than 0");
            this._contentBoundsNoRotate = bounds.clone();
            this._contentSizeNoRotate = this._contentBoundsNoRotate.getSize().times(contentFactor);
            this._contentBounds = bounds.rotate(this.getRotation()).getBoundingBox();
            this._contentSize = this._contentBounds.getSize().times(contentFactor);
            this._contentAspectRatio = this._contentSize.x / this._contentSize.y;
            if (this.viewer) {
                this.viewer.raiseEvent("reset-size", {
                    contentSize: this._contentSizeNoRotate.clone(),
                    contentFactor: contentFactor,
                    homeBounds: this._contentBoundsNoRotate.clone(),
                    contentBounds: this._contentBounds.clone()
                });
            }
        };
    }
}
(() => {
    CuttingTable.patchOpenSeadragon();
})();
CuttingTable.defaultId = "generator";
CuttingTable.selectContainerClass = "select-container";
CuttingTable.statusContainerClass = "status-container";
CuttingTable.viewerElementClass = "cutting-table-viewer";
CuttingTable.dropZoneElementClass = "input-area";
CuttingTable.rendererElementClass = "texture-container";
CuttingTable.shiftClass = "shifts";
CuttingTable.rulerElementSelector = ".box.rulers";
CuttingTable.squareButtonSelector = ".square";
CuttingTable.controlSelectors = {
    cut: { x: ".cut-x", y: ".cut-y" },
    offset: { x: ".offset-x", y: ".offset-y" },
    rotation: { x: ".rotation-x", y: ".rotation-y" }
};

export { CuttingTable };
//# sourceMappingURL=lucienne-0.1.0.js.map
