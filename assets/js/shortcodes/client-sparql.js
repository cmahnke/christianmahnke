/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=globalThis,e$2=t$1.ShadowRoot&&(void 0===t$1.ShadyCSS||t$1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$2=Symbol(),o$3=new WeakMap;let n$2 = class n{constructor(t,e,o){if(this._$cssResult$=true,o!==s$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$2&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$3.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$3.set(s,t));}return t}toString(){return this.cssText}};const r$2=t=>new n$2("string"==typeof t?t:t+"",void 0,s$2),i$3=(t,...e)=>{const o=1===t.length?t[0]:e.reduce((e,s,o)=>e+(t=>{if(true===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new n$2(o,t,s$2)},S$1=(s,o)=>{if(e$2)s.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of o){const o=document.createElement("style"),n=t$1.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$2=e$2?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$2(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$2,defineProperty:e$1,getOwnPropertyDescriptor:h$1,getOwnPropertyNames:r$1,getOwnPropertySymbols:o$2,getPrototypeOf:n$1}=Object,a$1=globalThis,c$1=a$1.trustedTypes,l$1=c$1?c$1.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$2(t,s),b$1={attribute:true,type:String,converter:u$1,reflect:false,useDefault:false,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let y$1 = class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b$1){if(s.state&&(s.attribute=false),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=true),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$1(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h$1(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)??b$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$1(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=true,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...r$1(t),...o$2(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$2(s));}else void 0!==s&&i.push(c$2(s));return i}static _$Eu(t,s){const i=s.attribute;return  false===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=false,this.hasUpdated=false,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(true),this._$EO?.forEach(t=>t.hostConnected?.());}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.());}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&true===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e;const r=h.fromAttribute(s,t.type);this[e]=r??this._$Ej?.get(e)??r,this._$Em=null;}}requestUpdate(t,s,i,e=false,h){if(void 0!==t){const r=this.constructor;if(false===e&&(h=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??f$1)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,s,i);} false===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),true!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),true===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=true;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];true!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=false;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(s)):this._$EM();}catch(s){throw t=false,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return  true}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM();}updated(t){}firstUpdated(t){}};y$1.elementStyles=[],y$1.shadowRootOptions={mode:"open"},y$1[d$1("elementProperties")]=new Map,y$1[d$1("finalized")]=new Map,p$1?.({ReactiveElement:y$1}),(a$1.reactiveElementVersions??=[]).push("2.1.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i$1=t=>t,s$1=t.trustedTypes,e=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,h="$lit$",o$1=`lit$${Math.random().toFixed(9).slice(2)}$`,n="?"+o$1,r=`<${n}>`,l=document,c=()=>l.createComment(""),a=t=>null===t||"object"!=typeof t&&"function"!=typeof t,u=Array.isArray,d=t=>u(t)||"function"==typeof t?.[Symbol.iterator],f="[ \t\n\f\r]",v=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,p=RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),g=/'/g,$=/"/g,y=/^(?:script|style|textarea|title)$/i,x=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),b=x(1),E=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),C=new WeakMap,P=l.createTreeWalker(l,129);function V(t,i){if(!u(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==e?e.createHTML(i):i}const N=(t,i)=>{const s=t.length-1,e=[];let n,l=2===i?"<svg>":3===i?"<math>":"",c=v;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,f=0;for(;f<s.length&&(c.lastIndex=f,u=c.exec(s),null!==u);)f=c.lastIndex,c===v?"!--"===u[1]?c=_:void 0!==u[1]?c=m:void 0!==u[2]?(y.test(u[2])&&(n=RegExp("</"+u[2],"g")),c=p):void 0!==u[3]&&(c=p):c===p?">"===u[0]?(c=n??v,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?p:'"'===u[3]?$:g):c===$||c===g?c=p:c===_||c===m?c=v:(c=p,n=void 0);const x=c===p&&t[i+1].startsWith("/>")?" ":"";l+=c===v?s+r:d>=0?(e.push(a),s.slice(0,d)+h+s.slice(d)+o$1+x):s+o$1+(-2===d?i:x);}return [V(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),e]};class S{constructor({strings:t,_$litType$:i},e){let r;this.parts=[];let l=0,a=0;const u=t.length-1,d=this.parts,[f,v]=N(t,i);if(this.el=S.createElement(f,e),P.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=P.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(h)){const i=v[a++],s=r.getAttribute(t).split(o$1),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:l,name:e[2],strings:s,ctor:"."===e[1]?I:"?"===e[1]?L:"@"===e[1]?z:H}),r.removeAttribute(t);}else t.startsWith(o$1)&&(d.push({type:6,index:l}),r.removeAttribute(t));if(y.test(r.tagName)){const t=r.textContent.split(o$1),i=t.length-1;if(i>0){r.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)r.append(t[s],c()),P.nextNode(),d.push({type:2,index:++l});r.append(t[i],c());}}}else if(8===r.nodeType)if(r.data===n)d.push({type:2,index:l});else {let t=-1;for(;-1!==(t=r.data.indexOf(o$1,t+1));)d.push({type:7,index:l}),t+=o$1.length-1;}l++;}}static createElement(t,i){const s=l.createElement("template");return s.innerHTML=t,s}}function M(t,i,s=t,e){if(i===E)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=a(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(false),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=M(t,h._$AS(t,i.values),h,e)),i}class R{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??l).importNode(i,true);P.currentNode=e;let h=P.nextNode(),o=0,n=0,r=s[0];for(;void 0!==r;){if(o===r.index){let i;2===r.type?i=new k(h,h.nextSibling,this,t):1===r.type?i=new r.ctor(h,r.name,r.strings,this,t):6===r.type&&(i=new Z(h,this,t)),this._$AV.push(i),r=s[++n];}o!==r?.index&&(h=P.nextNode(),o++);}return P.currentNode=l,e}p(t){let i=0;for(const s of this._$AV) void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class k{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??true;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=M(this,t,i),a(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==E&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):d(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==A&&a(this._$AH)?this._$AA.nextSibling.data=t:this.T(l.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=S.createElement(V(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new R(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=C.get(t.strings);return void 0===i&&C.set(t.strings,i=new S(t)),i}k(t){u(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new k(this.O(c()),this.O(c()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(false,true,s);t!==this._$AB;){const s=i$1(t).nextSibling;i$1(t).remove(),t=s;}}setConnected(t){ void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class H{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=A;}_$AI(t,i=this,s,e){const h=this.strings;let o=false;if(void 0===h)t=M(this,t,i,0),o=!a(t)||t!==this._$AH&&t!==E,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=M(this,e[s+n],i,n),r===E&&(r=this._$AH[n]),o||=!a(r)||r!==this._$AH[n],r===A?t=A:t!==A&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class I extends H{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===A?void 0:t;}}class L extends H{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==A);}}class z extends H{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=M(this,t,i,0)??A)===E)return;const s=this._$AH,e=t===A&&s!==A||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==A&&(s===A||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class Z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){M(this,t);}}const B=t.litHtmlPolyfillSupport;B?.(S,k),(t.litHtmlVersions??=[]).push("3.3.2");const D=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new k(i.insertBefore(c(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const s=globalThis;class i extends y$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const r=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=D(r,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(true);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(false);}render(){return E}}i._$litElement$=true,i["finalized"]=true,s.litElementHydrateSupport?.({LitElement:i});const o=s.litElementPolyfillSupport;o?.({LitElement:i});(s.litElementVersions??=[]).push("4.2.2");

/* @ts-self-types="./hdt.d.ts" */

class Hdt {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HdtFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm$1.__wbg_hdt_free(ptr, 0);
    }
    /**
     * ids: flat Int32Array of IDs [s1, p1, o1, s2, p2, o2, ...].
     * Returns string triples as a flat array of strings [s1, p1, o1, s2, p2, o2, ...].
     * WASM memory is limited, several million triple IDs may lead to OOM crashes reported as "RuntimeError: unreachable executed"
     * @param {Uint32Array} ids
     * @returns {string[]}
     */
    ids_to_strings(ids) {
        const ptr0 = passArray32ToWasm0(ids, wasm$1.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN$1;
        const ret = wasm$1.hdt_ids_to_strings(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0$1(ret[2]);
        }
        var v2 = getArrayJsValueFromWasm0$1(ret[0], ret[1]).slice();
        wasm$1.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {Uint8Array} data
     */
    constructor(data) {
        const ptr0 = passArray8ToWasm0(data, wasm$1.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN$1;
        const ret = wasm$1.hdt_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0$1(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        HdtFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns a flat Int32Array of IDs [s1, p1, o1, s2, p2, o2, ...].
     * There is some duplication with constants in triple patterns but as we only return 32 bit integers this should only be a few MB even for millions of results.
     * On the other hand this hopefully allows performant transitions between WASM and JavaScript.
     * Also this is expected to often be used with pagination and should use CPU cache better when using a specific "window".
     * @param {string | null} [sp]
     * @param {string | null} [pp]
     * @param {string | null} [op]
     * @returns {Uint32Array}
     */
    triple_ids_with_pattern(sp, pp, op) {
        var ptr0 = isLikeNone$1(sp) ? 0 : passStringToWasm0$1(sp, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN$1;
        var ptr1 = isLikeNone$1(pp) ? 0 : passStringToWasm0$1(pp, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN$1;
        var ptr2 = isLikeNone$1(op) ? 0 : passStringToWasm0$1(op, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
        var len2 = WASM_VECTOR_LEN$1;
        const ret = wasm$1.hdt_triple_ids_with_pattern(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        var v4 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm$1.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v4;
    }
}
if (Symbol.dispose) Hdt.prototype[Symbol.dispose] = Hdt.prototype.free;
function __wbg_get_imports$1() {
    const import0 = {
        __proto__: null,
        __wbg_Error_960c155d3d49e4c2: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0$1(arg0, arg1));
            return ret;
        },
        __wbg___wbindgen_throw_6b64449b9b9ed33c: function(arg0, arg1) {
            throw new Error(getStringFromWasm0$1(arg0, arg1));
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0$1(arg0, arg1));
            } finally {
                wasm$1.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0$1(ret, wasm$1.__wbindgen_malloc, wasm$1.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN$1;
            getDataViewMemory0$1().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0$1().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0$1(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm$1.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./hdt_bg.js": import0,
    };
}

const HdtFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm$1.__wbg_hdt_free(ptr >>> 0, 1));

function getArrayJsValueFromWasm0$1(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0$1();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm$1.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm$1.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedDataViewMemory0$1 = null;
function getDataViewMemory0$1() {
    if (cachedDataViewMemory0$1 === null || cachedDataViewMemory0$1.buffer.detached === true || (cachedDataViewMemory0$1.buffer.detached === undefined && cachedDataViewMemory0$1.buffer !== wasm$1.memory.buffer)) {
        cachedDataViewMemory0$1 = new DataView(wasm$1.memory.buffer);
    }
    return cachedDataViewMemory0$1;
}

function getStringFromWasm0$1(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText$1(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm$1.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0$1 = null;
function getUint8ArrayMemory0$1() {
    if (cachedUint8ArrayMemory0$1 === null || cachedUint8ArrayMemory0$1.byteLength === 0) {
        cachedUint8ArrayMemory0$1 = new Uint8Array(wasm$1.memory.buffer);
    }
    return cachedUint8ArrayMemory0$1;
}

function isLikeNone$1(x) {
    return x === undefined || x === null;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN$1 = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0$1().set(arg, ptr / 1);
    WASM_VECTOR_LEN$1 = arg.length;
    return ptr;
}

function passStringToWasm0$1(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder$1.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0$1().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN$1 = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0$1();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0$1().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder$1.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN$1 = offset;
    return ptr;
}

function takeFromExternrefTable0$1(idx) {
    const value = wasm$1.__wbindgen_externrefs.get(idx);
    wasm$1.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder$1 = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder$1.decode();
const MAX_SAFARI_DECODE_BYTES$1 = 2146435072;
let numBytesDecoded$1 = 0;
function decodeText$1(ptr, len) {
    numBytesDecoded$1 += len;
    if (numBytesDecoded$1 >= MAX_SAFARI_DECODE_BYTES$1) {
        cachedTextDecoder$1 = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder$1.decode();
        numBytesDecoded$1 = len;
    }
    return cachedTextDecoder$1.decode(getUint8ArrayMemory0$1().subarray(ptr, ptr + len));
}

const cachedTextEncoder$1 = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder$1)) {
    cachedTextEncoder$1.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder$1.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN$1 = 0;

let wasm$1;
function __wbg_finalize_init$1(instance, module) {
    wasm$1 = instance.exports;
    cachedDataViewMemory0$1 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0$1 = null;
    wasm$1.__wbindgen_start();
    return wasm$1;
}

async function __wbg_load$1(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

async function __wbg_init$1(module_or_path) {
    if (wasm$1 !== undefined) return wasm$1;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path);
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead');
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('hdt_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports$1();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load$1(await module_or_path, imports);

    return __wbg_finalize_init$1(instance);
}

/* @ts-self-types="./web.d.ts" */

class AsyncParserIterator {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AsyncParserIterator.prototype);
        obj.__wbg_ptr = ptr;
        AsyncParserIteratorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AsyncParserIteratorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_asyncparseriterator_free(ptr, 0);
    }
    /**
     * @returns {Promise<ParserIteratorResult>}
     */
    next() {
        const ret = wasm.asyncparseriterator_next(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) AsyncParserIterator.prototype[Symbol.dispose] = AsyncParserIterator.prototype.free;

class BlankNode {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BlankNode.prototype);
        obj.__wbg_ptr = ptr;
        BlankNodeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BlankNodeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blanknode_free(ptr, 0);
    }
    /**
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        const ret = wasm.blanknode_equals(this.__wbg_ptr, other);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get termType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.blanknode_term_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.blanknode_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.blanknode_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) BlankNode.prototype[Symbol.dispose] = BlankNode.prototype.free;

class DefaultGraph {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DefaultGraph.prototype);
        obj.__wbg_ptr = ptr;
        DefaultGraphFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DefaultGraphFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_defaultgraph_free(ptr, 0);
    }
    /**
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        const ret = wasm.defaultgraph_equals(this.__wbg_ptr, other);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get termType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.defaultgraph_term_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.defaultgraph_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.defaultgraph_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) DefaultGraph.prototype[Symbol.dispose] = DefaultGraph.prototype.free;

class Literal {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Literal.prototype);
        obj.__wbg_ptr = ptr;
        LiteralFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LiteralFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_literal_free(ptr, 0);
    }
    /**
     * @returns {NamedNode}
     */
    get datatype() {
        const ret = wasm.literal_datatype(this.__wbg_ptr);
        return NamedNode.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    get direction() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.literal_direction(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        const ret = wasm.literal_equals(this.__wbg_ptr, other);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get language() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.literal_language(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get termType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.literal_term_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.literal_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.literal_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Literal.prototype[Symbol.dispose] = Literal.prototype.free;

class NamedNode {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NamedNode.prototype);
        obj.__wbg_ptr = ptr;
        NamedNodeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NamedNodeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_namednode_free(ptr, 0);
    }
    /**
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        const ret = wasm.namednode_equals(this.__wbg_ptr, other);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get termType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.namednode_term_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.namednode_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.namednode_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) NamedNode.prototype[Symbol.dispose] = NamedNode.prototype.free;

class ParserIterator {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ParserIterator.prototype);
        obj.__wbg_ptr = ptr;
        ParserIteratorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ParserIteratorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_parseriterator_free(ptr, 0);
    }
    /**
     * @returns {ParserIteratorResult}
     */
    next() {
        const ret = wasm.parseriterator_next(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ParserIteratorResult.__wrap(ret[0]);
    }
}
if (Symbol.dispose) ParserIterator.prototype[Symbol.dispose] = ParserIterator.prototype.free;

class ParserIteratorResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ParserIteratorResult.prototype);
        obj.__wbg_ptr = ptr;
        ParserIteratorResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ParserIteratorResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_parseriteratorresult_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    get done() {
        const ret = wasm.parseriteratorresult_done(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {Quad | undefined}
     */
    get value() {
        const ret = wasm.parseriteratorresult_value(this.__wbg_ptr);
        return ret === 0 ? undefined : Quad.__wrap(ret);
    }
}
if (Symbol.dispose) ParserIteratorResult.prototype[Symbol.dispose] = ParserIteratorResult.prototype.free;

class Quad {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Quad.prototype);
        obj.__wbg_ptr = ptr;
        QuadFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuadFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quad_free(ptr, 0);
    }
    /**
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        const ret = wasm.quad_equals(this.__wbg_ptr, other);
        return ret !== 0;
    }
    /**
     * @returns {any}
     */
    get graph() {
        const ret = wasm.quad_graph(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {any}
     */
    get object() {
        const ret = wasm.quad_object(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {any}
     */
    get predicate() {
        const ret = wasm.quad_predicate(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {any}
     */
    get subject() {
        const ret = wasm.quad_subject(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get termType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.quad_term_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.quad_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.quad_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Quad.prototype[Symbol.dispose] = Quad.prototype.free;

class Store {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StoreFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_store_free(ptr, 0);
    }
    /**
     * @param {any} quad
     */
    add(quad) {
        const ret = wasm.store_add(this.__wbg_ptr, quad);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {any} quad
     */
    delete(quad) {
        const ret = wasm.store_delete(this.__wbg_ptr, quad);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {any} options
     * @param {any} from_graph_name
     * @returns {string}
     */
    dump(options, from_graph_name) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.store_dump(this.__wbg_ptr, options, from_graph_name);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @param {any} quad
     * @returns {boolean}
     */
    has(quad) {
        const ret = wasm.store_has(this.__wbg_ptr, quad);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * @param {any} data
     * @param {any} options
     * @param {any} base_iri
     * @param {any} to_graph_name
     */
    load(data, options, base_iri, to_graph_name) {
        const ret = wasm.store_load(this.__wbg_ptr, data, options, base_iri, to_graph_name);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {any} subject
     * @param {any} predicate
     * @param {any} object
     * @param {any} graph_name
     * @returns {Quad[]}
     */
    match(subject, predicate, object, graph_name) {
        const ret = wasm.store_match(this.__wbg_ptr, subject, predicate, object, graph_name);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {any} quads
     */
    constructor(quads) {
        const ret = wasm.store_new(quads);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        StoreFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} query
     * @param {any} options
     * @returns {any}
     */
    query(query, options) {
        const ptr0 = passStringToWasm0(query, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.store_query(this.__wbg_ptr, ptr0, len0, options);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {number}
     */
    get size() {
        const ret = wasm.store_size(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {string} update
     * @param {any} options
     */
    update(update, options) {
        const ptr0 = passStringToWasm0(update, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.store_update(this.__wbg_ptr, ptr0, len0, options);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) Store.prototype[Symbol.dispose] = Store.prototype.free;

class Variable {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Variable.prototype);
        obj.__wbg_ptr = ptr;
        VariableFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VariableFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_variable_free(ptr, 0);
    }
    /**
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        const ret = wasm.variable_equals(this.__wbg_ptr, other);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get termType() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.variable_term_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.variable_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.variable_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Variable.prototype[Symbol.dispose] = Variable.prototype.free;

/**
 * @param {string | null} [value]
 * @returns {BlankNode}
 */
function blankNode(value) {
    var ptr0 = isLikeNone(value) ? 0 : passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.blankNode(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return BlankNode.__wrap(ret[0]);
}

/**
 * @returns {DefaultGraph}
 */
function defaultGraph() {
    const ret = wasm.defaultGraph();
    return DefaultGraph.__wrap(ret);
}

/**
 * @param {any} original
 * @returns {any}
 */
function fromQuad(original) {
    const ret = wasm.fromQuad(original);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} original
 * @returns {any}
 */
function fromTerm(original) {
    const ret = wasm.fromTerm(original);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {string | null | undefined} value
 * @param {any} language_or_datatype
 * @returns {Literal}
 */
function literal(value, language_or_datatype) {
    var ptr0 = isLikeNone(value) ? 0 : passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.literal(ptr0, len0, language_or_datatype);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Literal.__wrap(ret[0]);
}

function main() {
    wasm.main();
}

/**
 * @param {string} value
 * @returns {NamedNode}
 */
function namedNode(value) {
    const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.namedNode(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return NamedNode.__wrap(ret[0]);
}

/**
 * @param {any} input
 * @param {any} options
 * @returns {any}
 */
function parse(input, options) {
    const ret = wasm.parse(input, options);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} subject
 * @param {any} predicate
 * @param {any} object
 * @param {any} graph
 * @returns {Quad}
 */
function quad(subject, predicate, object, graph) {
    const ret = wasm.quad(subject, predicate, object, graph);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Quad.__wrap(ret[0]);
}

/**
 * @param {any} subject
 * @param {any} predicate
 * @param {any} object
 * @returns {Quad}
 */
function triple(subject, predicate, object) {
    const ret = wasm.triple(subject, predicate, object);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Quad.__wrap(ret[0]);
}

/**
 * @param {string} value
 * @returns {Variable}
 */
function variable(value) {
    const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.variable(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Variable.__wrap(ret[0]);
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_83742b46f01ce22d: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg___wbindgen_debug_string_5398f5bb970e0daa: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_falsy_30906e697739fcc2: function(arg0) {
            const ret = !arg0;
            return ret;
        },
        __wbg___wbindgen_is_function_3c846841762788c1: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_0b605fc6b167c56f: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_object_781bc9f159099513: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_7ef6b97b02428fae: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_52709e72fb9f179c: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_string_get_395e606bd0ee4427: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_6ddd609b62940d55: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_6b5b6b8576d35cb1: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_asyncIterator_ac3da9d2a6fb464d: function() {
            const ret = Symbol.asyncIterator;
            return ret;
        },
        __wbg_asyncparseriterator_new: function(arg0) {
            const ret = AsyncParserIterator.__wrap(arg0);
            return ret;
        },
        __wbg_blanknode_new: function(arg0) {
            const ret = BlankNode.__wrap(arg0);
            return ret;
        },
        __wbg_call_2d781c1f4d5c0ef8: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_call_e133b57c9155d22c: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_defaultgraph_new: function(arg0) {
            const ret = DefaultGraph.__wrap(arg0);
            return ret;
        },
        __wbg_done_08ce71ee07e3bd17: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getRandomValues_3f44b700395062e5: function() { return handleError(function (arg0, arg1) {
            globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
        }, arguments); },
        __wbg_get_326e41e095fb2575: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_3ef1eba1850ade27: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_has_926ef2ff40b308cf: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.has(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_instanceof_Uint8Array_740438561a5b956d: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_iterator_d8f549ec8fb061b1: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_ea16607d7b61445b: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_literal_new: function(arg0) {
            const ret = Literal.__wrap(arg0);
            return ret;
        },
        __wbg_namednode_new: function(arg0) {
            const ret = NamedNode.__wrap(arg0);
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_49d5571bd3f0c4d4: function() {
            const ret = new Map();
            return ret;
        },
        __wbg_new_81ddf1fc13db79a4: function(arg0, arg1) {
            const ret = new URIError(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_a70fbab9066b301f: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_d15cb560a6a0e5f0: function(arg0, arg1) {
            const ret = new Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_typed_aaaeaf29cf802876: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen__convert__closures_____invoke__h3cd3a35048c6a63f(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = state0.b = 0;
            }
        },
        __wbg_next_11b99ee6237339e3: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_next_e01a967809d1aa68: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_eca3bb2f1a45eec9: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_now_16f0c993d5dd6c27: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_parseriterator_new: function(arg0) {
            const ret = ParserIterator.__wrap(arg0);
            return ret;
        },
        __wbg_parseriteratorresult_new: function(arg0) {
            const ret = ParserIteratorResult.__wrap(arg0);
            return ret;
        },
        __wbg_prototypesetcall_d62e5099504357e6: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_e87b0e732085a946: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_quad_new: function(arg0) {
            const ret = Quad.__wrap(arg0);
            return ret;
        },
        __wbg_queueMicrotask_0c399741342fb10f: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_a082d78ce798393e: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_resolve_ae8d83246e5bcc12: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_set_7eaa4f96924fd6b3: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_bf7251625df30a02: function(arg0, arg1, arg2) {
            const ret = arg0.set(arg1, arg2);
            return ret;
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_8adb955bd33fac2f: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_f207c857566db248: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_bb9f1ba69d61b386: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_then_098abe61755d12f6: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_then_9e335f6dd892bc11: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_value_21fc78aab0322612: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_variable_new: function(arg0) {
            const ret = Variable.__wrap(arg0);
            return ret;
        },
        __wbg_warn_cf559e360d225327: function(arg0, arg1) {
            console.warn(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 105, function: Function { arguments: [Externref], shim_idx: 106, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__he4e75ebeb7f40172, wasm_bindgen__convert__closures_____invoke__h055a39b75b369a19);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 26, function: Function { arguments: [], shim_idx: 27, ret: Externref, inner_ret: Some(Externref) }, mutable: false }) -> Externref`.
            const ret = makeClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__had032ae66aadda0c, wasm_bindgen__convert__closures_____invoke__hd946744f81ae9168);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("Quad")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./web_bg.js": import0,
    };
}

function wasm_bindgen__convert__closures_____invoke__hd946744f81ae9168(arg0, arg1) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__hd946744f81ae9168(arg0, arg1);
    return ret;
}

function wasm_bindgen__convert__closures_____invoke__h055a39b75b369a19(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__h055a39b75b369a19(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen__convert__closures_____invoke__h3cd3a35048c6a63f(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures_____invoke__h3cd3a35048c6a63f(arg0, arg1, arg2, arg3);
}

const AsyncParserIteratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_asyncparseriterator_free(ptr >>> 0, 1));
const BlankNodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_blanknode_free(ptr >>> 0, 1));
const DefaultGraphFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_defaultgraph_free(ptr >>> 0, 1));
const LiteralFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_literal_free(ptr >>> 0, 1));
const NamedNodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_namednode_free(ptr >>> 0, 1));
const QuadFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quad_free(ptr >>> 0, 1));
const StoreFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_store_free(ptr >>> 0, 1));
const VariableFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_variable_free(ptr >>> 0, 1));
const ParserIteratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_parseriterator_free(ptr >>> 0, 1));
const ParserIteratorResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_parseriteratorresult_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module);
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead');
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path);
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead');
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('web_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance);
}

var web = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BlankNode: BlankNode,
    DefaultGraph: DefaultGraph,
    Literal: Literal,
    NamedNode: NamedNode,
    Quad: Quad,
    Store: Store,
    Variable: Variable,
    blankNode: blankNode,
    default: __wbg_init,
    defaultGraph: defaultGraph,
    fromQuad: fromQuad,
    fromTerm: fromTerm,
    initSync: initSync,
    literal: literal,
    main: main,
    namedNode: namedNode,
    parse: parse,
    quad: quad,
    triple: triple,
    variable: variable
});

function _loadWasmModule (sync, filepath, src, imports) {
  function _instantiateOrCompile(source, imports, stream) {
    var instantiateFunc = stream ? WebAssembly.instantiateStreaming : WebAssembly.instantiate;
    var compileFunc = stream ? WebAssembly.compileStreaming : WebAssembly.compile;

    if (imports) {
      return instantiateFunc(source, imports)
    } else {
      return compileFunc(source)
    }
  }

  
var buf = null;
if (filepath) {
  
return _instantiateOrCompile(fetch(filepath), imports, true);

}


var raw = globalThis.atob(src);
var rawLength = raw.length;
buf = new Uint8Array(new ArrayBuffer(rawLength));
for(var i = 0; i < rawLength; i++) {
   buf[i] = raw.charCodeAt(i);
}



  {
    return _instantiateOrCompile(buf, imports, false)
  }
}

function wasm_hdt(imports){return _loadWasmModule(0, './hdt_bg.wasm', null, imports)}

function wasm_oxigraph(imports){return _loadWasmModule(0, './web_bg.wasm', null, imports)}

import.meta.url = '';
if (window) {
    import.meta.url = window.location.origin;
}
(async function () {
    await __wbg_init$1({ wasm_hdt });
    await __wbg_init({ wasm_oxigraph });
})();
function parseTerm(value, position) {
    if (value.startsWith("_:")) {
        return blankNode(value.slice(2));
    }
    if (position === "object" && value.startsWith('"')) {
        const lastQuote = value.lastIndexOf('"');
        if (lastQuote <= 0)
            return literal(value.slice(1));
        const text = value.substring(1, lastQuote);
        const suffix = value.substring(lastQuote + 1);
        if (suffix.startsWith("@")) {
            return literal(text, suffix.slice(1));
        }
        if (suffix.startsWith("^^")) {
            const dt = suffix.slice(2);
            const clean = dt.startsWith("<") && dt.endsWith(">") ? dt.slice(1, -1) : dt;
            return literal(text, namedNode(clean));
        }
        return literal(text);
    }
    const clean = value.startsWith("<") && value.endsWith(">") ? value.slice(1, -1) : value;
    return namedNode(clean);
}
function hdtToOxigraph(hdt) {
    const store = new Store();
    const ids = hdt.triple_ids_with_pattern(null, null, null);
    const strings = hdt.ids_to_strings(ids);
    for (let i = 0; i < strings.length; i += 3) {
        try {
            store.add(quad(parseTerm(strings[i], "subject"), parseTerm(strings[i + 1], "predicate"), parseTerm(strings[i + 2], "object"), defaultGraph()));
        }
        catch (e) {
            console.warn("Skip:", strings[i], strings[i + 1], strings[i + 2], e);
        }
    }
    return store;
}
async function loadHdtFromUrl(url) {
    let response;
    try {
        response = await fetch(url);
    }
    catch (networkError) {
        const message = networkError instanceof Error ? networkError.message : String(networkError);
        throw new Error(`Network error while fetching HDT file from "${url}": ${message}`);
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch HDT file from "${url}": HTTP ${response.status} ${response.statusText}`);
    }
    let buffer;
    try {
        buffer = await response.arrayBuffer();
    }
    catch (readError) {
        const message = readError instanceof Error ? readError.message : String(readError);
        throw new Error(`Error reading response body from "${url}": ${message}`);
    }
    if (buffer.byteLength === 0) {
        throw new Error(`HDT file from "${url}" is empty (0 bytes)`);
    }
    let hdt;
    try {
        hdt = await new Hdt(new Uint8Array(buffer));
    }
    catch (parseError) {
        const message = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`Error parsing HDT data from "${url}" (${buffer.byteLength} bytes): ${message}`);
    }
    let store;
    store = hdtToOxigraph(hdt);
    hdt.free();
    return store;
}

const componentStyles = i$3 `
  :host {
    --sparql-font-family: inherit;
    --sparql-font-size: 1rem;
    --sparql-line-height: 1.2;

    --sparql-bg: #fff;
    --sparql-color: #222;
    --sparql-color-muted: #888;
    --sparql-border-color: #e5e5e5;
    --sparql-border-radius: 0;
    --sparql-shadow: none;

    --sparql-accent: #555;
    --sparql-accent-hover: #333;
    --sparql-accent-text: #fff;

    --sparql-editor-bg: #fafafa;
    --sparql-editor-color: #333;
    --sparql-editor-font: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    --sparql-editor-font-size: 0.82rem;
    --sparql-editor-min-height: 140px;
    --sparql-editor-border: #ddd;

    --sparql-table-header-bg: transparent;
    --sparql-table-header-color: #555;
    --sparql-table-border: #e5e5e5;
    --sparql-table-hover: #f9f9f9;
    --sparql-table-alt: #fdfdfd;
    --sparql-table-cell-padding: 8px 12px;

    --sparql-error-bg: #fef2f2;
    --sparql-error-color: #b91c1c;
    --sparql-error-border: #fecaca;
    --sparql-success-color: #555;

    --sparql-padding: 0;
    --sparql-section-gap: 1px solid var(--sparql-border-color);

    --actions-hint-display: block;
    --actions-fontsize: 0.78rem;

    --result-font-size: 0.85rem;

    display: block;
    font-family: var(--sparql-font-family);
    font-size: var(--sparql-font-size);
    line-height: var(--sparql-line-height);
    color: var(--sparql-color);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ========================================
     WRAPPER
     ======================================== */
  .wrapper {
    background: var(--sparql-bg);
    border-top: var(--sparql-section-gap);
    border-bottom: var(--sparql-section-gap);
  }

  /* ========================================
     HEADER
     ======================================== */
  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 1em 0;
    border-bottom: var(--sparql-section-gap);
  }

  .header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    text-transform: uppercase;
    color: var(--sparql-color-muted);
  }

  .header-meta {
    display: flex;
    align-items: center;
    gap: .5em;
  }

  .meta-badge {
    font-size: 0.72rem;
    color: var(--sparql-color-muted);
  }

  .meta-badge.locked::before {
    content: '● ';
    color: var(--sparql-accent);
  }

  /* ========================================
     SOURCE NOTICE (locked)
     ======================================== */
  .source-notice {
    display: flex;
    align-items: baseline;
    gap: .5em;
    padding: .625em 0;
    border-bottom: var(--sparql-section-gap);
    font-size: 0.78rem;
  }

  .source-label {
    text-transform: uppercase;
    color: var(--sparql-color-muted);
    flex-shrink: 0;
  }

  .source-value {
    font-family: var(--sparql-editor-font);
    font-size: 0.76rem;
    color: var(--sparql-color);
    word-break: break-all;
  }

  /* ========================================
     DATA SECTION
     ======================================== */
  .data-section {
    padding: 14px 0;
    border-bottom: var(--sparql-section-gap);
  }

  /* ========================================
     TAB BAR
     ======================================== */
  .tab-bar {
    display: flex;
    gap: 0;
    margin-bottom: .6em;
    border-bottom: 1px solid var(--sparql-border-color);
  }

  .tab-bar button {
    padding: .4em 1em;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    cursor: pointer;
    font-family: var(--sparql-font-family);
    font-size: 0.78rem;
    color: var(--sparql-color-muted);
  }

  .tab-bar button:hover {
    color: var(--sparql-color);
  }

  .tab-bar button.active {
    color: var(--sparql-color);
    border-bottom-color: var(--sparql-color);
  }

  /* ========================================
     INPUT ROWS
     ======================================== */
  .input-row {
    display: flex;
    gap: 8px;
  }

  .input-row input[type="text"] {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid var(--sparql-border-color);
    border-radius: 2px;
    font-family: var(--sparql-editor-font);
    font-size: 0.8rem;
    background: var(--sparql-bg);
    color: var(--sparql-color);
  }

  .input-row input[type="text"]:focus {
    outline: none;
    border-color: var(--sparql-accent);
  }

  .input-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-col textarea {
    width: 100%;
    min-height: 70px;
    padding: 8px 10px;
    border: 1px solid var(--sparql-border-color);
    border-radius: 2px;
    font-family: var(--sparql-editor-font);
    font-size: 0.8rem;
    background: var(--sparql-bg);
    color: var(--sparql-color);
    resize: vertical;
  }

  .input-col textarea:focus {
    outline: none;
    border-color: var(--sparql-accent);
  }

  /* ========================================
     BUTTONS
     ======================================== */
  .btn-primary {
    padding: .45em .6em .6em .6em;
    background: var(--sparql-accent);
    color: var(--sparql-accent-text);
    font-family: var(--sparql-font-family);
    font-size: var(--actions-fontsize);
    cursor: pointer;
    vertical-align: middle;
    border-radius: .2rem;
    border: 0;
    font-size: 100%;
    line-height: 1.15;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--sparql-accent-hover);
  }

  .btn-primary:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .btn-secondary {
    padding: .45em .6em .6em .6em;
    background: none;
    color: var(--sparql-accent);
    font-family: var(--sparql-font-family);
    font-size: var(--actions-fontsize);
    cursor: pointer;
    vertical-align: middle;
    border-radius: .2rem;
    border: 0;
    font-size: 100%;
    line-height: 1.15;
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: var(--sparql-accent);
  }

  .btn-secondary:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* ========================================
     EDITOR
     ======================================== */
  .editor-section {
    padding: 14px 0;
    border-bottom: var(--sparql-section-gap);
  }

  textarea.query-editor {
    width: 100%;
    min-height: var(--sparql-editor-min-height);
    padding: 12px;
    background: var(--sparql-editor-bg);
    color: var(--sparql-editor-color);
    border: 1px solid var(--sparql-editor-border);
    border-radius: 2px;
    font-family: var(--sparql-editor-font);
    font-size: var(--sparql-editor-font-size);
    line-height: 1.55;
    resize: vertical;
    tab-size: 2;
  }

  textarea.query-editor:focus {
    outline: none;
    border-color: var(--sparql-accent);
  }

  /* ========================================
     ACTIONS
     ======================================== */
  .actions {
    display: flex;
    align-items: center;
    gap: .6em;
    padding: .6em 0;
    border-bottom: var(--sparql-section-gap);
  }

  .hint {
    font-size: 0.72rem;
    color: var(--sparql-color-muted);
  }

  .actions .hint {
    display: var(--actions-hint-display);
  }

  .status {
    margin-left: auto;
    font-size: 1rem;
  }

  .status.success {
    color: var(--sparql-success-color);
  }

  .status.loading {
    color: var(--sparql-color-muted);
  }

  .status.error {
    color: var(--sparql-error-color);
  }

  /* ========================================
     RESULTS
     ======================================== */
  .results-section {
    padding: .8em 0;
  }

  .placeholder-text {
    color: var(--sparql-color-muted);
    font-size: var(--result-font-size, 0.85rem);
    font-style: italic;
    padding: 1.2em 0;
  }

  /* ========================================
     TABLE
     ======================================== */
  .table-wrap {
    overflow-x: auto;
    margin: 0 -1px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    text-align: left;
    padding: var(--sparql-table-cell-padding);
    font-weight: 400;
    text-transform: uppercase;
    color: var(--sparql-table-header-color);
    border-bottom: 2px solid var(--sparql-table-border);
    background: var(--sparql-table-header-bg);
    white-space: nowrap;
  }

  tbody td {
    padding: var(--sparql-table-cell-padding);
    border-bottom: 1px solid var(--sparql-table-border);
    max-width: 420px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  tbody tr:nth-child(even) {
    background: var(--sparql-table-alt);
  }

  tbody tr:hover {
    background: var(--sparql-table-hover);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* Cell types */
  .uri {
    color: var(--sparql-accent);
    text-decoration: none;
  }

  .uri:hover {
    text-decoration: underline;
  }

  .bnode {
    color: #9775fa;
    font-family: var(--sparql-editor-font);
    font-size: 0.8rem;
  }

  .lit {
    color: var(--sparql-color);
  }

  .lang {
    color: var(--sparql-color-muted);
    font-size: 1rem;
    margin-left: 2px;
  }

  .dt {
    color: var(--sparql-color-muted);
    font-size: 0.7rem;
    margin-left: 3px;
    font-style: italic;
  }

  .empty {
    color: var(--sparql-color-muted);
  }

  /* ========================================
     BOOLEAN
     ======================================== */
  .boolean-result {
    padding: 1em 0;
    font-family: var(--sparql-editor-font);
    font-size: 1rem;
  }

  .boolean-result.is-true {
    color: #2b8a3e;
  }

  .boolean-result.is-false {
    color: var(--sparql-error-color);
  }

  /* ========================================
     GRAPH RESULT
     ======================================== */
  pre.graph-result {
    margin: 0;
    padding: .8em;
    background: var(--sparql-editor-bg);
    border: 1px solid var(--sparql-editor-border);
    border-radius: 2px;
    font-family: var(--sparql-editor-font);
    font-size: 0.8rem;
    line-height: 1.55;
    max-height: 400px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--sparql-editor-color);
  }

  /* ========================================
     ERROR
     ======================================== */
  .error-box {
    background: var(--sparql-error-bg);
    border: 1px solid var(--sparql-error-border);
    border-radius: 2px;
    padding: .8em;
  }

  .error-box pre {
    margin: 0;
    font-family: var(--sparql-editor-font);
    font-size: 0.78rem;
    color: var(--sparql-error-color);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
  }

  /* ========================================
     LOADING
     ======================================== */
  .loading {
    display: flex;
    justify-content: center;
    padding: 1.5em 0;
  }

  @keyframes sparql-spin {
    to { transform: rotate(360deg); }
  }

  .spinner {
    width: 1.25em;
    height: 1.25em;
    border: 1.5px solid var(--sparql-border-color);
    border-top-color: var(--sparql-accent);
    border-radius: 50%;
    animation: sparql-spin 0.7s linear infinite;
  }

  /* ========================================
     SCROLLBAR
     ======================================== */
  .table-wrap::-webkit-scrollbar,
  pre.graph-result::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  .table-wrap::-webkit-scrollbar-track,
  pre.graph-result::-webkit-scrollbar-track {
    background: transparent;
  }

  .table-wrap::-webkit-scrollbar-thumb,
  pre.graph-result::-webkit-scrollbar-thumb {
    background: var(--sparql-border-color);
    border-radius: 3px;
  }

  /* ========================================
     RESPONSIVE
     ======================================== */
  @media (max-width: 600px) {
    .header {
      flex-direction: column;
      gap: 4px;
    }

    .actions {
      flex-wrap: wrap;
    }

    .status {
      margin-left: 0;
      width: 100%;
    }

    .input-row {
      flex-direction: column;
    }

    tbody td {
      max-width: 180px;
    }
  }

  /* ========================================
     PRINT
     ======================================== */
  @media print {
    .data-section,
    .editor-section,
    .actions,
    .source-notice {
      display: none;
    }

    .table-wrap {
      overflow: visible;
    }

    tbody tr:hover {
      background: inherit;
    }
  }

  /* ========================================
     REDUCED MOTION
     ======================================== */
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 2s;
    }

    * {
      transition: none !important;
    }
  }
`;

const PREFIX_MAP = {
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
    'http://www.w3.org/2000/01/rdf-schema#': 'rdfs:',
    'http://www.w3.org/2002/07/owl#': 'owl:',
    'http://www.w3.org/2001/XMLSchema#': 'xsd:',
    'http://xmlns.com/foaf/0.1/': 'foaf:',
    'http://purl.org/dc/elements/1.1/': 'dc:',
    'http://purl.org/dc/terms/': 'dct:',
    'http://schema.org/': 'schema:',
    'http://www.w3.org/2004/02/skos/core#': 'skos:',
};
const MIME_MAP = {
    turtle: 'text/turtle',
    ntriples: 'application/n-triples',
    rdfxml: 'application/rdf+xml',
    nquads: 'application/n-quads',
    trig: 'application/trig',
};
const HDT_EXTENSIONS = ['.hdt'];
const HDT_MIMETYPES = ['application/x-hdt', 'application/hdt'];
function isHdt(url, contentType) {
    const lowerUrl = url.toLowerCase();
    for (let i = 0; i < HDT_EXTENSIONS.length; i++) {
        if (lowerUrl.endsWith(HDT_EXTENSIONS[i]))
            return true;
    }
    const lowerCt = contentType.toLowerCase();
    for (let i = 0; i < HDT_MIMETYPES.length; i++) {
        if (lowerCt.includes(HDT_MIMETYPES[i]))
            return true;
    }
    return false;
}
function detectRdfFormat(url, contentType, fallback) {
    const lowerUrl = url.toLowerCase();
    const lowerCt = contentType.toLowerCase();
    if (lowerCt.includes('turtle') || lowerUrl.endsWith('.ttl'))
        return 'turtle';
    if (lowerCt.includes('n-triples') || lowerUrl.endsWith('.nt'))
        return 'ntriples';
    if (lowerCt.includes('rdf+xml') || lowerUrl.endsWith('.rdf') || lowerUrl.endsWith('.owl'))
        return 'rdfxml';
    if (lowerCt.includes('n-quads') || lowerUrl.endsWith('.nq'))
        return 'nquads';
    if (lowerCt.includes('trig') || lowerUrl.endsWith('.trig'))
        return 'trig';
    return fallback;
}
class OxigraphSparql extends i {
    static get styles() {
        return componentStyles;
    }
    static get properties() {
        return {
            query: { type: String },
            dataUrl: { type: String, attribute: 'data-url' },
            rdfData: { type: String, attribute: 'rdf-data' },
            rdfFormat: { type: String, attribute: 'rdf-format' },
            heading: { type: String },
            hideDataInput: { type: Boolean, attribute: 'hide-data-input' },
            autoExecute: { type: Boolean, attribute: 'auto-execute' },
            _store: { state: true },
            _loading: { state: true },
            _loadingData: { state: true },
            _result: { state: true },
            _error: { state: true },
            _statusMessage: { state: true },
            _statusType: { state: true },
            _tripleCount: { state: true },
            _executionTime: { state: true },
            _oxigraphReady: { state: true },
            _activeInputTab: { state: true },
            _urlInput: { state: true },
            _textInput: { state: true },
            _storeLocked: { state: true },
        };
    }
    constructor() {
        super();
        this.query = 'SELECT ?s ?p ?o\nWHERE {\n  ?s ?p ?o .\n}\nLIMIT 25';
        this.dataUrl = '';
        this.rdfData = '';
        this.rdfFormat = 'turtle';
        this.heading = '';
        this.hideDataInput = false;
        this.autoExecute = false;
        this._store = null;
        this._loading = false;
        this._loadingData = false;
        this._result = null;
        this._error = null;
        this._statusMessage = '';
        this._statusType = '';
        this._tripleCount = 0;
        this._executionTime = 0;
        this._oxigraphReady = false;
        this._activeInputTab = 'text';
        this._urlInput = '';
        this._textInput = '';
        this._oxigraphModule = null;
        this._storeLocked = false;
    }
    _hasAttributeData() {
        return !!(this.rdfData.trim() || this.dataUrl.trim());
    }
    _shouldShowDataInput() {
        if (this.hideDataInput)
            return false;
        if (this._storeLocked)
            return false;
        return true;
    }
    _shouldShowHeader() {
        return !!this.heading;
    }
    connectedCallback() {
        super.connectedCallback();
        this._initOxigraph();
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('rdfData') && this.rdfData && this._oxigraphReady) {
            this._lockAndLoad(() => this._loadRdfString(this.rdfData, this.rdfFormat));
        }
        if (changedProperties.has('dataUrl') && this.dataUrl && this._oxigraphReady) {
            this._urlInput = this.dataUrl;
            this._lockAndLoad(() => this._loadFromUrl(this.dataUrl));
        }
    }
    async _lockAndLoad(loadFn) {
        this._storeLocked = true;
        await loadFn();
        if (this.autoExecute) {
            await this._executeQuery();
        }
    }
    async _initOxigraph() {
        if (this._oxigraphReady)
            return;
        this._setStatus('Initialisiere…', 'loading');
        try {
            this._oxigraphModule = await Promise.resolve().then(function () { return web; });
            if (typeof this._oxigraphModule.default === 'function') {
                await this._oxigraphModule.default();
            }
            this._store = new this._oxigraphModule.Store();
            this._oxigraphReady = true;
            this._tripleCount = 0;
            this._setStatus('Bereit', 'success');
            if (this._hasAttributeData()) {
                this._storeLocked = true;
                if (this.rdfData) {
                    await this._loadRdfString(this.rdfData, this.rdfFormat);
                }
                if (this.dataUrl) {
                    this._urlInput = this.dataUrl;
                    await this._loadFromUrl(this.dataUrl);
                }
                if (this.autoExecute && this._tripleCount > 0) {
                    await this._executeQuery();
                }
            }
        }
        catch (err) {
            this._setStatus('Initialisierungsfehler', 'error');
            this._error = err.message;
            console.error('OxiGraph init error:', err);
        }
    }
    async _loadRdfString(data, format) {
        if (!this._store || !data.trim())
            return;
        try {
            this._loadingData = true;
            this._setStatus('Lade Daten…', 'loading');
            const mimeType = MIME_MAP[format] || 'text/turtle';
            this._store.load(data, { format: mimeType });
            this._tripleCount = this._store.size;
            this._setStatus(this._tripleCount + ' Tripel', 'success');
            this._error = null;
            this.dispatchEvent(new CustomEvent('data-loaded', {
                detail: { tripleCount: this._tripleCount },
                bubbles: true,
                composed: true,
            }));
        }
        catch (err) {
            this._setStatus('Parse-Fehler', 'error');
            this._error = err.message;
        }
        finally {
            this._loadingData = false;
        }
    }
    async _loadFromUrl(url) {
        if (!url.trim())
            return;
        if (isHdt(url, '')) {
            await this._loadHdt(url);
            return;
        }
        try {
            this._loadingData = true;
            this._setStatus('Lade…', 'loading');
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            const contentType = response.headers.get('content-type') || '';
            if (isHdt(url, contentType)) {
                await this._loadHdt(url);
                return;
            }
            if (!this._store)
                return;
            const text = await response.text();
            const format = detectRdfFormat(url, contentType, this.rdfFormat);
            await this._loadRdfString(text, format);
        }
        catch (err) {
            this._setStatus('Ladefehler', 'error');
            this._error = err.message;
        }
        finally {
            this._loadingData = false;
        }
    }
    async _loadHdt(url) {
        if (!url.trim())
            return;
        try {
            this._loadingData = true;
            this._setStatus('Lade HDT…', 'loading');
            const store = await loadHdtFromUrl(url);
            this._store = store;
            this._tripleCount = this._store.size;
            this._setStatus(this._tripleCount + ' Tripel', 'success');
            this._error = null;
            if (this.autoExecute) {
                await this._executeQuery();
            }
        }
        catch (err) {
            this._setStatus('HDT-Fehler', 'error');
            this._error = err.message;
        }
        finally {
            this._loadingData = false;
        }
    }
    async _executeQuery() {
        if (!this._store)
            return;
        const editorEl = this.renderRoot.querySelector('textarea.query-editor');
        const queryText = editorEl ? editorEl.value : this.query;
        if (!queryText.trim())
            return;
        this._loading = true;
        this._error = null;
        this._result = null;
        this._setStatus('Abfrage…', 'loading');
        try {
            const t0 = performance.now();
            const result = this._store.query(queryText);
            this._executionTime = Math.round((performance.now() - t0) * 100) / 100;
            this._result = this._processResult(result);
            let count;
            if (this._result.type === 'bindings') {
                count = (this._result.rows?.length ?? 0) + ' Ergebnisse';
            }
            else if (this._result.type === 'boolean') {
                count = 'ASK: ' + this._result.boolean;
            }
            else {
                count = (this._result.quads?.length ?? 0) + ' Tripel';
            }
            this._setStatus(count + ' · ' + this._executionTime + ' ms', 'success');
            this.dispatchEvent(new CustomEvent('query-executed', {
                detail: { result: this._result, executionTime: this._executionTime },
                bubbles: true,
                composed: true,
            }));
        }
        catch (err) {
            this._error = err.message;
            this._setStatus('Fehler', 'error');
            this.dispatchEvent(new CustomEvent('query-error', {
                detail: { error: err.message },
                bubbles: true,
                composed: true,
            }));
        }
        finally {
            this._loading = false;
        }
    }
    _processResult(result) {
        if (typeof result === 'boolean') {
            return { type: 'boolean', boolean: result };
        }
        if (Array.isArray(result) || (result && Symbol.iterator in Object(result))) {
            const entries = [...result];
            if (entries.length === 0) {
                return { type: 'bindings', columns: [], rows: [] };
            }
            const first = entries[0];
            if (first && 'subject' in first && 'predicate' in first) {
                return { type: 'graph', quads: entries };
            }
            if (typeof first.get === 'function' || first instanceof Map) {
                const columnSet = new Set();
                const rows = [];
                for (const binding of entries) {
                    const row = {};
                    const iter = typeof binding.entries === 'function' ? binding.entries() : binding;
                    for (const [key, value] of iter) {
                        const colName = typeof key === 'string'
                            ? (key.startsWith('?') ? key.slice(1) : key)
                            : String(key);
                        columnSet.add(colName);
                        row[colName] = value;
                    }
                    rows.push(row);
                }
                const columns = [...columnSet].map((name) => ({ name }));
                return { type: 'bindings', columns, rows };
            }
        }
        return { type: 'bindings', columns: [], rows: [] };
    }
    _setStatus(msg, type) {
        this._statusMessage = msg;
        this._statusType = type;
    }
    _formatTerm(term) {
        if (!term)
            return { type: 'empty', value: '' };
        if (term.termType === 'NamedNode')
            return { type: 'uri', value: term.value };
        if (term.termType === 'BlankNode')
            return { type: 'bnode', value: '_:' + term.value };
        if (term.termType === 'Literal') {
            return {
                type: 'literal',
                value: term.value,
                lang: term.language || undefined,
                datatype: term.datatype?.value || undefined,
            };
        }
        return { type: 'unknown', value: String(term) };
    }
    _shortenUri(uri) {
        const entries = Object.entries(PREFIX_MAP);
        for (let i = 0; i < entries.length; i++) {
            if (uri.startsWith(entries[i][0])) {
                return entries[i][1] + uri.slice(entries[i][0].length);
            }
        }
        return uri;
    }
    setQuery(sparql) {
        this.query = sparql;
        const editorEl = this.renderRoot.querySelector('textarea.query-editor');
        if (editorEl) {
            editorEl.value = sparql;
        }
    }
    runQuery() {
        this._executeQuery();
    }
    _handleKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this._executeQuery();
            return;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value =
                textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
            textarea.selectionStart = start + 2;
            textarea.selectionEnd = start + 2;
        }
    }
    async _handleLoadData() {
        if (this._storeLocked)
            return;
        if (this._activeInputTab === 'url' && this._urlInput.trim()) {
            this._store = new this._oxigraphModule.Store();
            await this._loadFromUrl(this._urlInput.trim());
        }
        else if (this._activeInputTab === 'text' && this._textInput.trim()) {
            this._store = new this._oxigraphModule.Store();
            await this._loadRdfString(this._textInput.trim(), this.rdfFormat);
        }
    }
    _handleTabClick(tab) {
        if (this._storeLocked)
            return;
        this._activeInputTab = tab;
    }
    _handleUrlInput(e) {
        this._urlInput = e.target.value;
    }
    _handleTextInput(e) {
        this._textInput = e.target.value;
    }
    render() {
        return b `
      <div class="wrapper">
        ${this._shouldShowHeader() ? this._renderHeader() : A}
        ${this._shouldShowDataInput() ? this._renderDataSection() : A}
        ${!this.hideDataInput ? this._renderEditor() : A}
        ${!this.hideDataInput ? this._renderActions() : A}
        ${this._renderResults()}
      </div>
    `;
    }
    _renderHeader() {
        let src = '';
        if (this._storeLocked) {
            if (this.rdfData.trim()) {
                src = 'Inline RDF';
            }
            else if (this.dataUrl.trim()) {
                src = this.dataUrl;
            }
        }
        return b `
      <div class="header">
        <div class="header-top">
          <h2>${this.heading}</h2>
          <div class="header-meta">
            ${this._storeLocked
            ? b `<span class="meta-badge locked">Feste Quelle</span>`
            : A}
            ${this._tripleCount > 0
            ? b `<span class="meta-badge">${this._tripleCount} Tripel</span>`
            : A}
          </div>
        </div>
        ${src
            ? b `
            <div class="source-notice">
              <span class="source-label">Quelle</span>
              <span class="source-value">${src}</span>
            </div>
          `
            : A}
      </div>
    `;
    }
    _renderDataSection() {
        return b `
      <div class="data-section">
        <div class="tab-bar">
          <button
            class=${this._activeInputTab === 'text' ? 'active' : ''}
            @click=${() => this._handleTabClick('text')}
          >Turtle</button>
          <button
            class=${this._activeInputTab === 'url' ? 'active' : ''}
            @click=${() => this._handleTabClick('url')}
          >URL</button>
        </div>
        ${this._renderActiveTab()}
      </div>
    `;
    }
    _renderActiveTab() {
        if (this._activeInputTab === 'url') {
            return b `
        <div class="input-row">
          <input type="text"
            placeholder="https://example.org/data.ttl"
            .value=${this._urlInput}
            @input=${this._handleUrlInput} />
          <button class="btn-secondary"
            ?disabled=${!this._oxigraphReady || this._loadingData}
            @click=${this._handleLoadData}>Laden</button>
        </div>
      `;
        }
        return b `
      <div class="input-col">
        <textarea
          placeholder="@prefix ex: <http://example.org/> .&#10;ex:Alice a ex:Person ."
          .value=${this._textInput}
          @input=${this._handleTextInput}></textarea>
        <button class="btn-secondary"
          ?disabled=${!this._oxigraphReady || this._loadingData}
          @click=${this._handleLoadData}>In Store laden</button>
      </div>
    `;
    }
    _renderEditor() {
        return b `
      <div class="editor-section">
        <textarea
          class="query-editor"
          .value=${this.query}
          @keydown=${this._handleKeydown}
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
        ></textarea>
      </div>
    `;
    }
    _renderActions() {
        return b `
      <div class="actions">
        <button class="btn-primary"
          ?disabled=${!this._oxigraphReady || this._loading}
          @click=${this._executeQuery}>
          ${this._loading ? 'Läuft…' : 'Ausführen'}
        </button>
        <span class="hint">Ctrl + Enter</span>
        ${this._statusMessage
            ? b `<span class="status ${this._statusType}">${this._statusMessage}</span>`
            : A}
      </div>
    `;
    }
    _renderResults() {
        let content;
        if (this._loading) {
            content = b `<div class="loading"><div class="spinner"></div></div>`;
        }
        else if (this._error) {
            content = this._renderError();
        }
        else if (this._result) {
            content = this._renderResultContent();
        }
        else {
            content = b `<p class="placeholder-text">Keine Ergebnisse.</p>`;
        }
        return b `<div class="results-section">${content}</div>`;
    }
    _renderError() {
        return b `
      <div class="error-box">
        <pre>${this._error}</pre>
      </div>
    `;
    }
    _renderResultContent() {
        if (!this._result)
            return A;
        switch (this._result.type) {
            case 'boolean': return this._renderBooleanResult();
            case 'graph': return this._renderGraphResult();
            case 'bindings':
            default: return this._renderBindingsResult();
        }
    }
    _renderBooleanResult() {
        const val = this._result.boolean;
        return b `<div class="boolean-result ${val ? 'is-true' : 'is-false'}">${val ? 'True' : 'False'}</div>`;
    }
    _renderGraphResult() {
        const quads = this._result.quads || [];
        const lines = quads.map((q) => {
            const s = this._shortenUri(q.subject?.value ?? String(q.subject));
            const p = this._shortenUri(q.predicate?.value ?? String(q.predicate));
            let o;
            if (q.object?.termType === 'Literal') {
                o = '"' + q.object.value + '"';
                if (q.object.language)
                    o += '@' + q.object.language;
            }
            else {
                o = this._shortenUri(q.object?.value ?? String(q.object));
            }
            return s + '  ' + p + '  ' + o + ' .';
        });
        return b `<pre class="graph-result">${lines.join('\n')}</pre>`;
    }
    _renderBindingsResult() {
        const columns = this._result.columns || [];
        const rows = this._result.rows || [];
        if (columns.length === 0 || rows.length === 0) {
            return b `<p class="placeholder-text">Keine Ergebnisse.</p>`;
        }
        return b `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${columns.map((col) => b `<th>?${col.name}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => b `
              <tr>
                ${columns.map((col) => b `<td>${this._renderCell(row[col.name])}</td>`)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
    }
    _renderCell(term) {
        const f = this._formatTerm(term);
        switch (f.type) {
            case 'uri':
                return b `<a class="uri" href=${f.value} target="_blank" rel="noopener">${this._shortenUri(f.value)}</a>`;
            case 'bnode':
                return b `<span class="bnode">${f.value}</span>`;
            case 'literal': {
                let suffix = A;
                if (f.lang) {
                    suffix = b `<span class="lang">@${f.lang}</span>`;
                }
                else if (f.datatype && !f.datatype.includes('XMLSchema#string')) {
                    suffix = b `<span class="dt">${this._shortenUri(f.datatype)}</span>`;
                }
                return b `<span class="lit">${f.value}${suffix}</span>`;
            }
            case 'empty':
                return b `<span class="empty">–</span>`;
            default:
                return b `<span>${f.value}</span>`;
        }
    }
}
customElements.define('oxigraph-sparql', OxigraphSparql);

export { OxigraphSparql };
//# sourceMappingURL=client-sparql.js.map
