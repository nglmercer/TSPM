var __legacyDecorateClassTS = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1;i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __legacyMetadataTS = (k, v) => {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};

// node_modules/@lit/reactive-element/development/css-tag.js
var NODE_MODE = false;
var global = globalThis;
var supportsAdoptingStyleSheets = global.ShadowRoot && (global.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var constructionToken = Symbol();
var cssTagCache = new WeakMap;

class CSSResult {
  constructor(cssText, strings, safeToken) {
    this["_$cssResult$"] = true;
    if (safeToken !== constructionToken) {
      throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    }
    this.cssText = cssText;
    this._strings = strings;
  }
  get styleSheet() {
    let styleSheet = this._styleSheet;
    const strings = this._strings;
    if (supportsAdoptingStyleSheets && styleSheet === undefined) {
      const cacheable = strings !== undefined && strings.length === 1;
      if (cacheable) {
        styleSheet = cssTagCache.get(strings);
      }
      if (styleSheet === undefined) {
        (this._styleSheet = styleSheet = new CSSStyleSheet).replaceSync(this.cssText);
        if (cacheable) {
          cssTagCache.set(strings, styleSheet);
        }
      }
    }
    return styleSheet;
  }
  toString() {
    return this.cssText;
  }
}
var textFromCSSResult = (value) => {
  if (value["_$cssResult$"] === true) {
    return value.cssText;
  } else if (typeof value === "number") {
    return value;
  } else {
    throw new Error(`Value passed to 'css' function must be a 'css' function result: ` + `${value}. Use 'unsafeCSS' to pass non-literal values, but take care ` + `to ensure page security.`);
  }
};
var unsafeCSS = (value) => new CSSResult(typeof value === "string" ? value : String(value), undefined, constructionToken);
var css = (strings, ...values) => {
  const cssText = strings.length === 1 ? strings[0] : values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
  return new CSSResult(cssText, strings, constructionToken);
};
var adoptStyles = (renderRoot, styles) => {
  if (supportsAdoptingStyleSheets) {
    renderRoot.adoptedStyleSheets = styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  } else {
    for (const s of styles) {
      const style = document.createElement("style");
      const nonce = global["litNonce"];
      if (nonce !== undefined) {
        style.setAttribute("nonce", nonce);
      }
      style.textContent = s.cssText;
      renderRoot.appendChild(style);
    }
  }
};
var cssResultFromStyleSheet = (sheet) => {
  let cssText = "";
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};
var getCompatibleStyle = supportsAdoptingStyleSheets || NODE_MODE && global.CSSStyleSheet === undefined ? (s) => s : (s) => s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;

// node_modules/@lit/reactive-element/development/reactive-element.js
var { is, defineProperty, getOwnPropertyDescriptor, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf } = Object;
var NODE_MODE2 = false;
var global2 = globalThis;
if (NODE_MODE2) {
  global2.customElements ??= customElements;
}
var DEV_MODE = true;
var issueWarning;
var trustedTypes = global2.trustedTypes;
var emptyStringForBooleanAttribute = trustedTypes ? trustedTypes.emptyScript : "";
var polyfillSupport = DEV_MODE ? global2.reactiveElementPolyfillSupportDevMode : global2.reactiveElementPolyfillSupport;
if (DEV_MODE) {
  global2.litIssuedWarnings ??= new Set;
  issueWarning = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!global2.litIssuedWarnings.has(warning) && !global2.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global2.litIssuedWarnings.add(warning);
    }
  };
  queueMicrotask(() => {
    issueWarning("dev-mode", `Lit is in dev mode. Not recommended for production!`);
    if (global2.ShadyDOM?.inUse && polyfillSupport === undefined) {
      issueWarning("polyfill-support-missing", `Shadow DOM is being polyfilled via \`ShadyDOM\` but ` + `the \`polyfill-support\` module has not been loaded.`);
    }
  });
}
var debugLogEvent = DEV_MODE ? (event) => {
  const shouldEmit = global2.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global2.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : undefined;
var JSCompiler_renameProperty = (prop, _obj) => prop;
var defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        value = value ? emptyStringForBooleanAttribute : null;
        break;
      case Object:
      case Array:
        value = value == null ? value : JSON.stringify(value);
        break;
    }
    return value;
  },
  fromAttribute(value, type) {
    let fromValue = value;
    switch (type) {
      case Boolean:
        fromValue = value !== null;
        break;
      case Number:
        fromValue = value === null ? null : Number(value);
        break;
      case Object:
      case Array:
        try {
          fromValue = JSON.parse(value);
        } catch (e) {
          fromValue = null;
        }
        break;
    }
    return fromValue;
  }
};
var notEqual = (value, old) => !is(value, old);
var defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  useDefault: false,
  hasChanged: notEqual
};
Symbol.metadata ??= Symbol("metadata");
global2.litPropertyMetadata ??= new WeakMap;

class ReactiveElement extends HTMLElement {
  static addInitializer(initializer) {
    this.__prepare();
    (this._initializers ??= []).push(initializer);
  }
  static get observedAttributes() {
    this.finalize();
    return this.__attributeToPropertyMap && [...this.__attributeToPropertyMap.keys()];
  }
  static createProperty(name, options = defaultPropertyDeclaration) {
    if (options.state) {
      options.attribute = false;
    }
    this.__prepare();
    if (this.prototype.hasOwnProperty(name)) {
      options = Object.create(options);
      options.wrapped = true;
    }
    this.elementProperties.set(name, options);
    if (!options.noAccessor) {
      const key = DEV_MODE ? Symbol.for(`${String(name)} (@property() cache)`) : Symbol();
      const descriptor = this.getPropertyDescriptor(name, key, options);
      if (descriptor !== undefined) {
        defineProperty(this.prototype, name, descriptor);
      }
    }
  }
  static getPropertyDescriptor(name, key, options) {
    const { get, set } = getOwnPropertyDescriptor(this.prototype, name) ?? {
      get() {
        return this[key];
      },
      set(v) {
        this[key] = v;
      }
    };
    if (DEV_MODE && get == null) {
      if ("value" in (getOwnPropertyDescriptor(this.prototype, name) ?? {})) {
        throw new Error(`Field ${JSON.stringify(String(name))} on ` + `${this.name} was declared as a reactive property ` + `but it's actually declared as a value on the prototype. ` + `Usually this is due to using @property or @state on a method.`);
      }
      issueWarning("reactive-property-without-getter", `Field ${JSON.stringify(String(name))} on ` + `${this.name} was declared as a reactive property ` + `but it does not have a getter. This will be an error in a ` + `future version of Lit.`);
    }
    return {
      get,
      set(value) {
        const oldValue = get?.call(this);
        set?.call(this, value);
        this.requestUpdate(name, oldValue, options);
      },
      configurable: true,
      enumerable: true
    };
  }
  static getPropertyOptions(name) {
    return this.elementProperties.get(name) ?? defaultPropertyDeclaration;
  }
  static __prepare() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("elementProperties", this))) {
      return;
    }
    const superCtor = getPrototypeOf(this);
    superCtor.finalize();
    if (superCtor._initializers !== undefined) {
      this._initializers = [...superCtor._initializers];
    }
    this.elementProperties = new Map(superCtor.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("finalized", this))) {
      return;
    }
    this.finalized = true;
    this.__prepare();
    if (this.hasOwnProperty(JSCompiler_renameProperty("properties", this))) {
      const props = this.properties;
      const propKeys = [
        ...getOwnPropertyNames(props),
        ...getOwnPropertySymbols(props)
      ];
      for (const p of propKeys) {
        this.createProperty(p, props[p]);
      }
    }
    const metadata = this[Symbol.metadata];
    if (metadata !== null) {
      const properties = litPropertyMetadata.get(metadata);
      if (properties !== undefined) {
        for (const [p, options] of properties) {
          this.elementProperties.set(p, options);
        }
      }
    }
    this.__attributeToPropertyMap = new Map;
    for (const [p, options] of this.elementProperties) {
      const attr = this.__attributeNameForProperty(p, options);
      if (attr !== undefined) {
        this.__attributeToPropertyMap.set(attr, p);
      }
    }
    this.elementStyles = this.finalizeStyles(this.styles);
    if (DEV_MODE) {
      if (this.hasOwnProperty("createProperty")) {
        issueWarning("no-override-create-property", "Overriding ReactiveElement.createProperty() is deprecated. " + "The override will not be called with standard decorators");
      }
      if (this.hasOwnProperty("getPropertyDescriptor")) {
        issueWarning("no-override-get-property-descriptor", "Overriding ReactiveElement.getPropertyDescriptor() is deprecated. " + "The override will not be called with standard decorators");
      }
    }
  }
  static finalizeStyles(styles) {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      const set = new Set(styles.flat(Infinity).reverse());
      for (const s of set) {
        elementStyles.unshift(getCompatibleStyle(s));
      }
    } else if (styles !== undefined) {
      elementStyles.push(getCompatibleStyle(styles));
    }
    return elementStyles;
  }
  static __attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? undefined : typeof attribute === "string" ? attribute : typeof name === "string" ? name.toLowerCase() : undefined;
  }
  constructor() {
    super();
    this.__instanceProperties = undefined;
    this.isUpdatePending = false;
    this.hasUpdated = false;
    this.__reflectingProperty = null;
    this.__initialize();
  }
  __initialize() {
    this.__updatePromise = new Promise((res) => this.enableUpdating = res);
    this._$changedProperties = new Map;
    this.__saveInstanceProperties();
    this.requestUpdate();
    this.constructor._initializers?.forEach((i) => i(this));
  }
  addController(controller) {
    (this.__controllers ??= new Set).add(controller);
    if (this.renderRoot !== undefined && this.isConnected) {
      controller.hostConnected?.();
    }
  }
  removeController(controller) {
    this.__controllers?.delete(controller);
  }
  __saveInstanceProperties() {
    const instanceProperties = new Map;
    const elementProperties = this.constructor.elementProperties;
    for (const p of elementProperties.keys()) {
      if (this.hasOwnProperty(p)) {
        instanceProperties.set(p, this[p]);
        delete this[p];
      }
    }
    if (instanceProperties.size > 0) {
      this.__instanceProperties = instanceProperties;
    }
  }
  createRenderRoot() {
    const renderRoot = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    adoptStyles(renderRoot, this.constructor.elementStyles);
    return renderRoot;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot();
    this.enableUpdating(true);
    this.__controllers?.forEach((c) => c.hostConnected?.());
  }
  enableUpdating(_requestedUpdate) {}
  disconnectedCallback() {
    this.__controllers?.forEach((c) => c.hostDisconnected?.());
  }
  attributeChangedCallback(name, _old, value) {
    this._$attributeToProperty(name, value);
  }
  __propertyToAttribute(name, value) {
    const elemProperties = this.constructor.elementProperties;
    const options = elemProperties.get(name);
    const attr = this.constructor.__attributeNameForProperty(name, options);
    if (attr !== undefined && options.reflect === true) {
      const converter = options.converter?.toAttribute !== undefined ? options.converter : defaultConverter;
      const attrValue = converter.toAttribute(value, options.type);
      if (DEV_MODE && this.constructor.enabledWarnings.includes("migration") && attrValue === undefined) {
        issueWarning("undefined-attribute-value", `The attribute value for the ${name} property is ` + `undefined on element ${this.localName}. The attribute will be ` + `removed, but in the previous version of \`ReactiveElement\`, ` + `the attribute would not have changed.`);
      }
      this.__reflectingProperty = name;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      }
      this.__reflectingProperty = null;
    }
  }
  _$attributeToProperty(name, value) {
    const ctor = this.constructor;
    const propName = ctor.__attributeToPropertyMap.get(name);
    if (propName !== undefined && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName);
      const converter = typeof options.converter === "function" ? { fromAttribute: options.converter } : options.converter?.fromAttribute !== undefined ? options.converter : defaultConverter;
      this.__reflectingProperty = propName;
      const convertedValue = converter.fromAttribute(value, options.type);
      this[propName] = convertedValue ?? this.__defaultValues?.get(propName) ?? convertedValue;
      this.__reflectingProperty = null;
    }
  }
  requestUpdate(name, oldValue, options, useNewValue = false, newValue) {
    if (name !== undefined) {
      if (DEV_MODE && name instanceof Event) {
        issueWarning(``, `The requestUpdate() method was called with an Event as the property name. This is probably a mistake caused by binding this.requestUpdate as an event listener. Instead bind a function that will call it with no arguments: () => this.requestUpdate()`);
      }
      const ctor = this.constructor;
      if (useNewValue === false) {
        newValue = this[name];
      }
      options ??= ctor.getPropertyOptions(name);
      const changed = (options.hasChanged ?? notEqual)(newValue, oldValue) || options.useDefault && options.reflect && newValue === this.__defaultValues?.get(name) && !this.hasAttribute(ctor.__attributeNameForProperty(name, options));
      if (changed) {
        this._$changeProperty(name, oldValue, options);
      } else {
        return;
      }
    }
    if (this.isUpdatePending === false) {
      this.__updatePromise = this.__enqueueUpdate();
    }
  }
  _$changeProperty(name, oldValue, { useDefault, reflect, wrapped }, initializeValue) {
    if (useDefault && !(this.__defaultValues ??= new Map).has(name)) {
      this.__defaultValues.set(name, initializeValue ?? oldValue ?? this[name]);
      if (wrapped !== true || initializeValue !== undefined) {
        return;
      }
    }
    if (!this._$changedProperties.has(name)) {
      if (!this.hasUpdated && !useDefault) {
        oldValue = undefined;
      }
      this._$changedProperties.set(name, oldValue);
    }
    if (reflect === true && this.__reflectingProperty !== name) {
      (this.__reflectingProperties ??= new Set).add(name);
    }
  }
  async __enqueueUpdate() {
    this.isUpdatePending = true;
    try {
      await this.__updatePromise;
    } catch (e) {
      Promise.reject(e);
    }
    const result = this.scheduleUpdate();
    if (result != null) {
      await result;
    }
    return !this.isUpdatePending;
  }
  scheduleUpdate() {
    const result = this.performUpdate();
    if (DEV_MODE && this.constructor.enabledWarnings.includes("async-perform-update") && typeof result?.then === "function") {
      issueWarning("async-perform-update", `Element ${this.localName} returned a Promise from performUpdate(). ` + `This behavior is deprecated and will be removed in a future ` + `version of ReactiveElement.`);
    }
    return result;
  }
  performUpdate() {
    if (!this.isUpdatePending) {
      return;
    }
    debugLogEvent?.({ kind: "update" });
    if (!this.hasUpdated) {
      this.renderRoot ??= this.createRenderRoot();
      if (DEV_MODE) {
        const ctor = this.constructor;
        const shadowedProperties = [...ctor.elementProperties.keys()].filter((p) => this.hasOwnProperty(p) && (p in getPrototypeOf(this)));
        if (shadowedProperties.length) {
          throw new Error(`The following properties on element ${this.localName} will not ` + `trigger updates as expected because they are set using class ` + `fields: ${shadowedProperties.join(", ")}. ` + `Native class fields and some compiled output will overwrite ` + `accessors used for detecting changes. See ` + `https://lit.dev/msg/class-field-shadowing ` + `for more information.`);
        }
      }
      if (this.__instanceProperties) {
        for (const [p, value] of this.__instanceProperties) {
          this[p] = value;
        }
        this.__instanceProperties = undefined;
      }
      const elementProperties = this.constructor.elementProperties;
      if (elementProperties.size > 0) {
        for (const [p, options] of elementProperties) {
          const { wrapped } = options;
          const value = this[p];
          if (wrapped === true && !this._$changedProperties.has(p) && value !== undefined) {
            this._$changeProperty(p, undefined, options, value);
          }
        }
      }
    }
    let shouldUpdate = false;
    const changedProperties = this._$changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.willUpdate(changedProperties);
        this.__controllers?.forEach((c) => c.hostUpdate?.());
        this.update(changedProperties);
      } else {
        this.__markUpdated();
      }
    } catch (e) {
      shouldUpdate = false;
      this.__markUpdated();
      throw e;
    }
    if (shouldUpdate) {
      this._$didUpdate(changedProperties);
    }
  }
  willUpdate(_changedProperties) {}
  _$didUpdate(changedProperties) {
    this.__controllers?.forEach((c) => c.hostUpdated?.());
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changedProperties);
    }
    this.updated(changedProperties);
    if (DEV_MODE && this.isUpdatePending && this.constructor.enabledWarnings.includes("change-in-update")) {
      issueWarning("change-in-update", `Element ${this.localName} scheduled an update ` + `(generally because a property was set) ` + `after an update completed, causing a new update to be scheduled. ` + `This is inefficient and should be avoided unless the next update ` + `can only be scheduled as a side effect of the previous update.`);
    }
  }
  __markUpdated() {
    this._$changedProperties = new Map;
    this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this.__updatePromise;
  }
  shouldUpdate(_changedProperties) {
    return true;
  }
  update(_changedProperties) {
    this.__reflectingProperties &&= this.__reflectingProperties.forEach((p) => this.__propertyToAttribute(p, this[p]));
    this.__markUpdated();
  }
  updated(_changedProperties) {}
  firstUpdated(_changedProperties) {}
}
ReactiveElement.elementStyles = [];
ReactiveElement.shadowRootOptions = { mode: "open" };
ReactiveElement[JSCompiler_renameProperty("elementProperties", ReactiveElement)] = new Map;
ReactiveElement[JSCompiler_renameProperty("finalized", ReactiveElement)] = new Map;
polyfillSupport?.({ ReactiveElement });
if (DEV_MODE) {
  ReactiveElement.enabledWarnings = [
    "change-in-update",
    "async-perform-update"
  ];
  const ensureOwnWarnings = function(ctor) {
    if (!ctor.hasOwnProperty(JSCompiler_renameProperty("enabledWarnings", ctor))) {
      ctor.enabledWarnings = ctor.enabledWarnings.slice();
    }
  };
  ReactiveElement.enableWarning = function(warning) {
    ensureOwnWarnings(this);
    if (!this.enabledWarnings.includes(warning)) {
      this.enabledWarnings.push(warning);
    }
  };
  ReactiveElement.disableWarning = function(warning) {
    ensureOwnWarnings(this);
    const i = this.enabledWarnings.indexOf(warning);
    if (i >= 0) {
      this.enabledWarnings.splice(i, 1);
    }
  };
}
(global2.reactiveElementVersions ??= []).push("2.1.2");
if (DEV_MODE && global2.reactiveElementVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
  });
}

// node_modules/lit-html/development/lit-html.js
var DEV_MODE2 = true;
var ENABLE_EXTRA_SECURITY_HOOKS = true;
var ENABLE_SHADYDOM_NOPATCH = true;
var NODE_MODE3 = false;
var global3 = globalThis;
var debugLogEvent2 = DEV_MODE2 ? (event) => {
  const shouldEmit = global3.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global3.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : undefined;
var debugLogRenderId = 0;
var issueWarning2;
if (DEV_MODE2) {
  global3.litIssuedWarnings ??= new Set;
  issueWarning2 = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : "";
    if (!global3.litIssuedWarnings.has(warning) && !global3.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global3.litIssuedWarnings.add(warning);
    }
  };
  queueMicrotask(() => {
    issueWarning2("dev-mode", `Lit is in dev mode. Not recommended for production!`);
  });
}
var wrap = ENABLE_SHADYDOM_NOPATCH && global3.ShadyDOM?.inUse && global3.ShadyDOM?.noPatch === true ? global3.ShadyDOM.wrap : (node) => node;
var trustedTypes2 = global3.trustedTypes;
var policy = trustedTypes2 ? trustedTypes2.createPolicy("lit-html", {
  createHTML: (s) => s
}) : undefined;
var identityFunction = (value) => value;
var noopSanitizer = (_node, _name, _type) => identityFunction;
var setSanitizer = (newSanitizer) => {
  if (!ENABLE_EXTRA_SECURITY_HOOKS) {
    return;
  }
  if (sanitizerFactoryInternal !== noopSanitizer) {
    throw new Error(`Attempted to overwrite existing lit-html security policy.` + ` setSanitizeDOMValueFactory should be called at most once.`);
  }
  sanitizerFactoryInternal = newSanitizer;
};
var _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
  sanitizerFactoryInternal = noopSanitizer;
};
var createSanitizer = (node, name, type) => {
  return sanitizerFactoryInternal(node, name, type);
};
var boundAttributeSuffix = "$lit$";
var marker = `lit$${Math.random().toFixed(9).slice(2)}$`;
var markerMatch = "?" + marker;
var nodeMarker = `<${markerMatch}>`;
var d = NODE_MODE3 && global3.document === undefined ? {
  createTreeWalker() {
    return {};
  }
} : document;
var createMarker = () => d.createComment("");
var isPrimitive = (value) => value === null || typeof value != "object" && typeof value != "function";
var isArray = Array.isArray;
var isIterable = (value) => isArray(value) || typeof value?.[Symbol.iterator] === "function";
var SPACE_CHAR = `[ 	
\f\r]`;
var ATTR_VALUE_CHAR = `[^ 	
\f\r"'\`<>=]`;
var NAME_CHAR = `[^\\s"'>=/]`;
var textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var COMMENT_START = 1;
var TAG_NAME = 2;
var DYNAMIC_TAG_NAME = 3;
var commentEndRegex = /-->/g;
var comment2EndRegex = />/g;
var tagEndRegex = new RegExp(`>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`, "g");
var ENTIRE_MATCH = 0;
var ATTRIBUTE_NAME = 1;
var SPACES_AND_EQUALS = 2;
var QUOTE_CHAR = 3;
var singleQuoteAttrEndRegex = /'/g;
var doubleQuoteAttrEndRegex = /"/g;
var rawTextElement = /^(?:script|style|textarea|title)$/i;
var HTML_RESULT = 1;
var SVG_RESULT = 2;
var MATHML_RESULT = 3;
var ATTRIBUTE_PART = 1;
var CHILD_PART = 2;
var PROPERTY_PART = 3;
var BOOLEAN_ATTRIBUTE_PART = 4;
var EVENT_PART = 5;
var ELEMENT_PART = 6;
var COMMENT_PART = 7;
var tag = (type) => (strings, ...values) => {
  if (DEV_MODE2 && strings.some((s) => s === undefined)) {
    console.warn(`Some template strings are undefined.
` + "This is probably caused by illegal octal escape sequences.");
  }
  if (DEV_MODE2) {
    if (values.some((val) => val?.["_$litStatic$"])) {
      issueWarning2("", `Static values 'literal' or 'unsafeStatic' cannot be used as values to non-static templates.
` + `Please use the static 'html' tag function. See https://lit.dev/docs/templates/expressions/#static-expressions`);
    }
  }
  return {
    ["_$litType$"]: type,
    strings,
    values
  };
};
var html = tag(HTML_RESULT);
var svg = tag(SVG_RESULT);
var mathml = tag(MATHML_RESULT);
var noChange = Symbol.for("lit-noChange");
var nothing = Symbol.for("lit-nothing");
var templateCache = new WeakMap;
var walker = d.createTreeWalker(d, 129);
var sanitizerFactoryInternal = noopSanitizer;
function trustFromTemplateString(tsa, stringFromTSA) {
  if (!isArray(tsa) || !tsa.hasOwnProperty("raw")) {
    let message = "invalid template strings array";
    if (DEV_MODE2) {
      message = `
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.
          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        `.trim().replace(/\n */g, `
`);
    }
    throw new Error(message);
  }
  return policy !== undefined ? policy.createHTML(stringFromTSA) : stringFromTSA;
}
var getTemplateHtml = (strings, type) => {
  const l = strings.length - 1;
  const attrNames = [];
  let html2 = type === SVG_RESULT ? "<svg>" : type === MATHML_RESULT ? "<math>" : "";
  let rawTextEndRegex;
  let regex = textEndRegex;
  for (let i = 0;i < l; i++) {
    const s = strings[i];
    let attrNameEndIndex = -1;
    let attrName;
    let lastIndex = 0;
    let match;
    while (lastIndex < s.length) {
      regex.lastIndex = lastIndex;
      match = regex.exec(s);
      if (match === null) {
        break;
      }
      lastIndex = regex.lastIndex;
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === "!--") {
          regex = commentEndRegex;
        } else if (match[COMMENT_START] !== undefined) {
          regex = comment2EndRegex;
        } else if (match[TAG_NAME] !== undefined) {
          if (rawTextElement.test(match[TAG_NAME])) {
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, "g");
          }
          regex = tagEndRegex;
        } else if (match[DYNAMIC_TAG_NAME] !== undefined) {
          if (DEV_MODE2) {
            throw new Error("Bindings in tag names are not supported. Please use static templates instead. " + "See https://lit.dev/docs/templates/expressions/#static-expressions");
          }
          regex = tagEndRegex;
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === ">") {
          regex = rawTextEndRegex ?? textEndRegex;
          attrNameEndIndex = -1;
        } else if (match[ATTRIBUTE_NAME] === undefined) {
          attrNameEndIndex = -2;
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
          attrName = match[ATTRIBUTE_NAME];
          regex = match[QUOTE_CHAR] === undefined ? tagEndRegex : match[QUOTE_CHAR] === '"' ? doubleQuoteAttrEndRegex : singleQuoteAttrEndRegex;
        }
      } else if (regex === doubleQuoteAttrEndRegex || regex === singleQuoteAttrEndRegex) {
        regex = tagEndRegex;
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex;
      } else {
        regex = tagEndRegex;
        rawTextEndRegex = undefined;
      }
    }
    if (DEV_MODE2) {
      console.assert(attrNameEndIndex === -1 || regex === tagEndRegex || regex === singleQuoteAttrEndRegex || regex === doubleQuoteAttrEndRegex, "unexpected parse state B");
    }
    const end = regex === tagEndRegex && strings[i + 1].startsWith("/>") ? " " : "";
    html2 += regex === textEndRegex ? s + nodeMarker : attrNameEndIndex >= 0 ? (attrNames.push(attrName), s.slice(0, attrNameEndIndex) + boundAttributeSuffix + s.slice(attrNameEndIndex)) + marker + end : s + marker + (attrNameEndIndex === -2 ? i : end);
  }
  const htmlResult = html2 + (strings[l] || "<?>") + (type === SVG_RESULT ? "</svg>" : type === MATHML_RESULT ? "</math>" : "");
  return [trustFromTemplateString(strings, htmlResult), attrNames];
};

class Template {
  constructor({ strings, ["_$litType$"]: type }, options) {
    this.parts = [];
    let node;
    let nodeIndex = 0;
    let attrNameIndex = 0;
    const partCount = strings.length - 1;
    const parts = this.parts;
    const [html2, attrNames] = getTemplateHtml(strings, type);
    this.el = Template.createElement(html2, options);
    walker.currentNode = this.el.content;
    if (type === SVG_RESULT || type === MATHML_RESULT) {
      const wrapper = this.el.content.firstChild;
      wrapper.replaceWith(...wrapper.childNodes);
    }
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (node.nodeType === 1) {
        if (DEV_MODE2) {
          const tag2 = node.localName;
          if (/^(?:textarea|template)$/i.test(tag2) && node.innerHTML.includes(marker)) {
            const m = `Expressions are not supported inside \`${tag2}\` ` + `elements. See https://lit.dev/msg/expression-in-${tag2} for more ` + `information.`;
            if (tag2 === "template") {
              throw new Error(m);
            } else
              issueWarning2("", m);
          }
        }
        if (node.hasAttributes()) {
          for (const name of node.getAttributeNames()) {
            if (name.endsWith(boundAttributeSuffix)) {
              const realName = attrNames[attrNameIndex++];
              const value = node.getAttribute(name);
              const statics = value.split(marker);
              const m = /([.?@])?(.*)/.exec(realName);
              parts.push({
                type: ATTRIBUTE_PART,
                index: nodeIndex,
                name: m[2],
                strings: statics,
                ctor: m[1] === "." ? PropertyPart : m[1] === "?" ? BooleanAttributePart : m[1] === "@" ? EventPart : AttributePart
              });
              node.removeAttribute(name);
            } else if (name.startsWith(marker)) {
              parts.push({
                type: ELEMENT_PART,
                index: nodeIndex
              });
              node.removeAttribute(name);
            }
          }
        }
        if (rawTextElement.test(node.tagName)) {
          const strings2 = node.textContent.split(marker);
          const lastIndex = strings2.length - 1;
          if (lastIndex > 0) {
            node.textContent = trustedTypes2 ? trustedTypes2.emptyScript : "";
            for (let i = 0;i < lastIndex; i++) {
              node.append(strings2[i], createMarker());
              walker.nextNode();
              parts.push({ type: CHILD_PART, index: ++nodeIndex });
            }
            node.append(strings2[lastIndex], createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = node.data;
        if (data === markerMatch) {
          parts.push({ type: CHILD_PART, index: nodeIndex });
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            parts.push({ type: COMMENT_PART, index: nodeIndex });
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }
    if (DEV_MODE2) {
      if (attrNames.length !== attrNameIndex) {
        throw new Error(`Detected duplicate attribute bindings. This occurs if your template ` + `has duplicate attributes on an element tag. For example ` + `"<input ?disabled=\${true} ?disabled=\${false}>" contains a ` + `duplicate "disabled" attribute. The error was detected in ` + `the following template: 
` + "`" + strings.join("${...}") + "`");
      }
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "template prep",
      template: this,
      clonableTemplate: this.el,
      parts: this.parts,
      strings
    });
  }
  static createElement(html2, _options) {
    const el = d.createElement("template");
    el.innerHTML = html2;
    return el;
  }
}
function resolveDirective(part, value, parent = part, attributeIndex) {
  if (value === noChange) {
    return value;
  }
  let currentDirective = attributeIndex !== undefined ? parent.__directives?.[attributeIndex] : parent.__directive;
  const nextDirectiveConstructor = isPrimitive(value) ? undefined : value["_$litDirective$"];
  if (currentDirective?.constructor !== nextDirectiveConstructor) {
    currentDirective?.["_$notifyDirectiveConnectionChanged"]?.(false);
    if (nextDirectiveConstructor === undefined) {
      currentDirective = undefined;
    } else {
      currentDirective = new nextDirectiveConstructor(part);
      currentDirective._$initialize(part, parent, attributeIndex);
    }
    if (attributeIndex !== undefined) {
      (parent.__directives ??= [])[attributeIndex] = currentDirective;
    } else {
      parent.__directive = currentDirective;
    }
  }
  if (currentDirective !== undefined) {
    value = resolveDirective(part, currentDirective._$resolve(part, value.values), currentDirective, attributeIndex);
  }
  return value;
}

class TemplateInstance {
  constructor(template, parent) {
    this._$parts = [];
    this._$disconnectableChildren = undefined;
    this._$template = template;
    this._$parent = parent;
  }
  get parentNode() {
    return this._$parent.parentNode;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _clone(options) {
    const { el: { content }, parts } = this._$template;
    const fragment = (options?.creationScope ?? d).importNode(content, true);
    walker.currentNode = fragment;
    let node = walker.nextNode();
    let nodeIndex = 0;
    let partIndex = 0;
    let templatePart = parts[0];
    while (templatePart !== undefined) {
      if (nodeIndex === templatePart.index) {
        let part;
        if (templatePart.type === CHILD_PART) {
          part = new ChildPart(node, node.nextSibling, this, options);
        } else if (templatePart.type === ATTRIBUTE_PART) {
          part = new templatePart.ctor(node, templatePart.name, templatePart.strings, this, options);
        } else if (templatePart.type === ELEMENT_PART) {
          part = new ElementPart(node, this, options);
        }
        this._$parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (nodeIndex !== templatePart?.index) {
        node = walker.nextNode();
        nodeIndex++;
      }
    }
    walker.currentNode = d;
    return fragment;
  }
  _update(values) {
    let i = 0;
    for (const part of this._$parts) {
      if (part !== undefined) {
        debugLogEvent2 && debugLogEvent2({
          kind: "set part",
          part,
          value: values[i],
          valueIndex: i,
          values,
          templateInstance: this
        });
        if (part.strings !== undefined) {
          part._$setValue(values, part, i);
          i += part.strings.length - 2;
        } else {
          part._$setValue(values[i]);
        }
      }
      i++;
    }
  }
}

class ChildPart {
  get _$isConnected() {
    return this._$parent?._$isConnected ?? this.__isConnected;
  }
  constructor(startNode, endNode, parent, options) {
    this.type = CHILD_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = undefined;
    this._$startNode = startNode;
    this._$endNode = endNode;
    this._$parent = parent;
    this.options = options;
    this.__isConnected = options?.isConnected ?? true;
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._textSanitizer = undefined;
    }
  }
  get parentNode() {
    let parentNode = wrap(this._$startNode).parentNode;
    const parent = this._$parent;
    if (parent !== undefined && parentNode?.nodeType === 11) {
      parentNode = parent.parentNode;
    }
    return parentNode;
  }
  get startNode() {
    return this._$startNode;
  }
  get endNode() {
    return this._$endNode;
  }
  _$setValue(value, directiveParent = this) {
    if (DEV_MODE2 && this.parentNode === null) {
      throw new Error(`This \`ChildPart\` has no \`parentNode\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \`innerHTML\` or \`textContent\` can do this.`);
    }
    value = resolveDirective(this, value, directiveParent);
    if (isPrimitive(value)) {
      if (value === nothing || value == null || value === "") {
        if (this._$committedValue !== nothing) {
          debugLogEvent2 && debugLogEvent2({
            kind: "commit nothing to child",
            start: this._$startNode,
            end: this._$endNode,
            parent: this._$parent,
            options: this.options
          });
          this._$clear();
        }
        this._$committedValue = nothing;
      } else if (value !== this._$committedValue && value !== noChange) {
        this._commitText(value);
      }
    } else if (value["_$litType$"] !== undefined) {
      this._commitTemplateResult(value);
    } else if (value.nodeType !== undefined) {
      if (DEV_MODE2 && this.options?.host === value) {
        this._commitText(`[probable mistake: rendered a template's host in itself ` + `(commonly caused by writing \${this} in a template]`);
        console.warn(`Attempted to render the template host`, value, `inside itself. This is almost always a mistake, and in dev mode `, `we render some warning text. In production however, we'll `, `render it, which will usually result in an error, and sometimes `, `in the element disappearing from the DOM.`);
        return;
      }
      this._commitNode(value);
    } else if (isIterable(value)) {
      this._commitIterable(value);
    } else {
      this._commitText(value);
    }
  }
  _insert(node) {
    return wrap(wrap(this._$startNode).parentNode).insertBefore(node, this._$endNode);
  }
  _commitNode(value) {
    if (this._$committedValue !== value) {
      this._$clear();
      if (ENABLE_EXTRA_SECURITY_HOOKS && sanitizerFactoryInternal !== noopSanitizer) {
        const parentNodeName = this._$startNode.parentNode?.nodeName;
        if (parentNodeName === "STYLE" || parentNodeName === "SCRIPT") {
          let message = "Forbidden";
          if (DEV_MODE2) {
            if (parentNodeName === "STYLE") {
              message = `Lit does not support binding inside style nodes. ` + `This is a security risk, as style injection attacks can ` + `exfiltrate data and spoof UIs. ` + `Consider instead using css\`...\` literals ` + `to compose styles, and do dynamic styling with ` + `css custom properties, ::parts, <slot>s, ` + `and by mutating the DOM rather than stylesheets.`;
            } else {
              message = `Lit does not support binding inside script nodes. ` + `This is a security risk, as it could allow arbitrary ` + `code execution.`;
            }
          }
          throw new Error(message);
        }
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit node",
        start: this._$startNode,
        parent: this._$parent,
        value,
        options: this.options
      });
      this._$committedValue = this._insert(value);
    }
  }
  _commitText(value) {
    if (this._$committedValue !== nothing && isPrimitive(this._$committedValue)) {
      const node = wrap(this._$startNode).nextSibling;
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(node, "data", "property");
        }
        value = this._textSanitizer(value);
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit text",
        node,
        value,
        options: this.options
      });
      node.data = value;
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        const textNode = d.createTextNode("");
        this._commitNode(textNode);
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(textNode, "data", "property");
        }
        value = this._textSanitizer(value);
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: textNode,
          value,
          options: this.options
        });
        textNode.data = value;
      } else {
        this._commitNode(d.createTextNode(value));
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: wrap(this._$startNode).nextSibling,
          value,
          options: this.options
        });
      }
    }
    this._$committedValue = value;
  }
  _commitTemplateResult(result) {
    const { values, ["_$litType$"]: type } = result;
    const template = typeof type === "number" ? this._$getTemplate(result) : (type.el === undefined && (type.el = Template.createElement(trustFromTemplateString(type.h, type.h[0]), this.options)), type);
    if (this._$committedValue?._$template === template) {
      debugLogEvent2 && debugLogEvent2({
        kind: "template updating",
        template,
        instance: this._$committedValue,
        parts: this._$committedValue._$parts,
        options: this.options,
        values
      });
      this._$committedValue._update(values);
    } else {
      const instance = new TemplateInstance(template, this);
      const fragment = instance._clone(this.options);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      instance._update(values);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated and updated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      this._commitNode(fragment);
      this._$committedValue = instance;
    }
  }
  _$getTemplate(result) {
    let template = templateCache.get(result.strings);
    if (template === undefined) {
      templateCache.set(result.strings, template = new Template(result));
    }
    return template;
  }
  _commitIterable(value) {
    if (!isArray(this._$committedValue)) {
      this._$committedValue = [];
      this._$clear();
    }
    const itemParts = this._$committedValue;
    let partIndex = 0;
    let itemPart;
    for (const item of value) {
      if (partIndex === itemParts.length) {
        itemParts.push(itemPart = new ChildPart(this._insert(createMarker()), this._insert(createMarker()), this, this.options));
      } else {
        itemPart = itemParts[partIndex];
      }
      itemPart._$setValue(item);
      partIndex++;
    }
    if (partIndex < itemParts.length) {
      this._$clear(itemPart && wrap(itemPart._$endNode).nextSibling, partIndex);
      itemParts.length = partIndex;
    }
  }
  _$clear(start = wrap(this._$startNode).nextSibling, from) {
    this._$notifyConnectionChanged?.(false, true, from);
    while (start !== this._$endNode) {
      const n = wrap(start).nextSibling;
      wrap(start).remove();
      start = n;
    }
  }
  setConnected(isConnected) {
    if (this._$parent === undefined) {
      this.__isConnected = isConnected;
      this._$notifyConnectionChanged?.(isConnected);
    } else if (DEV_MODE2) {
      throw new Error("part.setConnected() may only be called on a " + "RootPart returned from render().");
    }
  }
}

class AttributePart {
  get tagName() {
    return this.element.tagName;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  constructor(element, name, strings, parent, options) {
    this.type = ATTRIBUTE_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = undefined;
    this.element = element;
    this.name = name;
    this._$parent = parent;
    this.options = options;
    if (strings.length > 2 || strings[0] !== "" || strings[1] !== "") {
      this._$committedValue = new Array(strings.length - 1).fill(new String);
      this.strings = strings;
    } else {
      this._$committedValue = nothing;
    }
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._sanitizer = undefined;
    }
  }
  _$setValue(value, directiveParent = this, valueIndex, noCommit) {
    const strings = this.strings;
    let change = false;
    if (strings === undefined) {
      value = resolveDirective(this, value, directiveParent, 0);
      change = !isPrimitive(value) || value !== this._$committedValue && value !== noChange;
      if (change) {
        this._$committedValue = value;
      }
    } else {
      const values = value;
      value = strings[0];
      let i, v;
      for (i = 0;i < strings.length - 1; i++) {
        v = resolveDirective(this, values[valueIndex + i], directiveParent, i);
        if (v === noChange) {
          v = this._$committedValue[i];
        }
        change ||= !isPrimitive(v) || v !== this._$committedValue[i];
        if (v === nothing) {
          value = nothing;
        } else if (value !== nothing) {
          value += (v ?? "") + strings[i + 1];
        }
        this._$committedValue[i] = v;
      }
    }
    if (change && !noCommit) {
      this._commitValue(value);
    }
  }
  _commitValue(value) {
    if (value === nothing) {
      wrap(this.element).removeAttribute(this.name);
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._sanitizer === undefined) {
          this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "attribute");
        }
        value = this._sanitizer(value ?? "");
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit attribute",
        element: this.element,
        name: this.name,
        value,
        options: this.options
      });
      wrap(this.element).setAttribute(this.name, value ?? "");
    }
  }
}

class PropertyPart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = PROPERTY_PART;
  }
  _commitValue(value) {
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      if (this._sanitizer === undefined) {
        this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "property");
      }
      value = this._sanitizer(value);
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "commit property",
      element: this.element,
      name: this.name,
      value,
      options: this.options
    });
    this.element[this.name] = value === nothing ? undefined : value;
  }
}

class BooleanAttributePart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = BOOLEAN_ATTRIBUTE_PART;
  }
  _commitValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit boolean attribute",
      element: this.element,
      name: this.name,
      value: !!(value && value !== nothing),
      options: this.options
    });
    wrap(this.element).toggleAttribute(this.name, !!value && value !== nothing);
  }
}

class EventPart extends AttributePart {
  constructor(element, name, strings, parent, options) {
    super(element, name, strings, parent, options);
    this.type = EVENT_PART;
    if (DEV_MODE2 && this.strings !== undefined) {
      throw new Error(`A \`<${element.localName}>\` has a \`@${name}=...\` listener with ` + "invalid content. Event listeners in templates must have exactly " + "one expression and no surrounding text.");
    }
  }
  _$setValue(newListener, directiveParent = this) {
    newListener = resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
    if (newListener === noChange) {
      return;
    }
    const oldListener = this._$committedValue;
    const shouldRemoveListener = newListener === nothing && oldListener !== nothing || newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive;
    const shouldAddListener = newListener !== nothing && (oldListener === nothing || shouldRemoveListener);
    debugLogEvent2 && debugLogEvent2({
      kind: "commit event listener",
      element: this.element,
      name: this.name,
      value: newListener,
      options: this.options,
      removeListener: shouldRemoveListener,
      addListener: shouldAddListener,
      oldListener
    });
    if (shouldRemoveListener) {
      this.element.removeEventListener(this.name, this, oldListener);
    }
    if (shouldAddListener) {
      this.element.addEventListener(this.name, this, newListener);
    }
    this._$committedValue = newListener;
  }
  handleEvent(event) {
    if (typeof this._$committedValue === "function") {
      this._$committedValue.call(this.options?.host ?? this.element, event);
    } else {
      this._$committedValue.handleEvent(event);
    }
  }
}

class ElementPart {
  constructor(element, parent, options) {
    this.element = element;
    this.type = ELEMENT_PART;
    this._$disconnectableChildren = undefined;
    this._$parent = parent;
    this.options = options;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _$setValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit to element binding",
      element: this.element,
      value,
      options: this.options
    });
    resolveDirective(this, value);
  }
}
var polyfillSupport2 = DEV_MODE2 ? global3.litHtmlPolyfillSupportDevMode : global3.litHtmlPolyfillSupport;
polyfillSupport2?.(Template, ChildPart);
(global3.litHtmlVersions ??= []).push("3.3.2");
if (DEV_MODE2 && global3.litHtmlVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning2("multiple-versions", `Multiple versions of Lit loaded. ` + `Loading multiple versions is not recommended.`);
  });
}
var render = (value, container, options) => {
  if (DEV_MODE2 && container == null) {
    throw new TypeError(`The container to render into may not be ${container}`);
  }
  const renderId = DEV_MODE2 ? debugLogRenderId++ : 0;
  const partOwnerNode = options?.renderBefore ?? container;
  let part = partOwnerNode["_$litPart$"];
  debugLogEvent2 && debugLogEvent2({
    kind: "begin render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  if (part === undefined) {
    const endNode = options?.renderBefore ?? null;
    partOwnerNode["_$litPart$"] = part = new ChildPart(container.insertBefore(createMarker(), endNode), endNode, undefined, options ?? {});
  }
  part._$setValue(value);
  debugLogEvent2 && debugLogEvent2({
    kind: "end render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  return part;
};
if (ENABLE_EXTRA_SECURITY_HOOKS) {
  render.setSanitizer = setSanitizer;
  render.createSanitizer = createSanitizer;
  if (DEV_MODE2) {
    render._testOnlyClearSanitizerFactoryDoNotCallOrElse = _testOnlyClearSanitizerFactoryDoNotCallOrElse;
  }
}

// node_modules/lit-element/development/lit-element.js
var JSCompiler_renameProperty2 = (prop, _obj) => prop;
var DEV_MODE3 = true;
var global4 = globalThis;
var issueWarning3;
if (DEV_MODE3) {
  global4.litIssuedWarnings ??= new Set;
  issueWarning3 = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!global4.litIssuedWarnings.has(warning) && !global4.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global4.litIssuedWarnings.add(warning);
    }
  };
}

class LitElement extends ReactiveElement {
  constructor() {
    super(...arguments);
    this.renderOptions = { host: this };
    this.__childPart = undefined;
  }
  createRenderRoot() {
    const renderRoot = super.createRenderRoot();
    this.renderOptions.renderBefore ??= renderRoot.firstChild;
    return renderRoot;
  }
  update(changedProperties) {
    const value = this.render();
    if (!this.hasUpdated) {
      this.renderOptions.isConnected = this.isConnected;
    }
    super.update(changedProperties);
    this.__childPart = render(value, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback();
    this.__childPart?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.__childPart?.setConnected(false);
  }
  render() {
    return noChange;
  }
}
LitElement["_$litElement$"] = true;
LitElement[JSCompiler_renameProperty2("finalized", LitElement)] = true;
global4.litElementHydrateSupport?.({ LitElement });
var polyfillSupport3 = DEV_MODE3 ? global4.litElementPolyfillSupportDevMode : global4.litElementPolyfillSupport;
polyfillSupport3?.({ LitElement });
(global4.litElementVersions ??= []).push("4.2.2");
if (DEV_MODE3 && global4.litElementVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning3("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
  });
}
// node_modules/@lit/reactive-element/development/decorators/custom-element.js
var customElement = (tagName) => (classOrTarget, context) => {
  if (context !== undefined) {
    context.addInitializer(() => {
      customElements.define(tagName, classOrTarget);
    });
  } else {
    customElements.define(tagName, classOrTarget);
  }
};
// node_modules/@lit/reactive-element/development/decorators/property.js
var DEV_MODE4 = true;
var issueWarning4;
if (DEV_MODE4) {
  globalThis.litIssuedWarnings ??= new Set;
  issueWarning4 = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!globalThis.litIssuedWarnings.has(warning) && !globalThis.litIssuedWarnings.has(code)) {
      console.warn(warning);
      globalThis.litIssuedWarnings.add(warning);
    }
  };
}
var legacyProperty = (options, proto, name) => {
  const hasOwnProperty = proto.hasOwnProperty(name);
  proto.constructor.createProperty(name, options);
  return hasOwnProperty ? Object.getOwnPropertyDescriptor(proto, name) : undefined;
};
var defaultPropertyDeclaration2 = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
var standardProperty = (options = defaultPropertyDeclaration2, target, context) => {
  const { kind, metadata } = context;
  if (DEV_MODE4 && metadata == null) {
    issueWarning4("missing-class-metadata", `The class ${target} is missing decorator metadata. This ` + `could mean that you're using a compiler that supports decorators ` + `but doesn't support decorator metadata, such as TypeScript 5.1. ` + `Please update your compiler.`);
  }
  let properties = globalThis.litPropertyMetadata.get(metadata);
  if (properties === undefined) {
    globalThis.litPropertyMetadata.set(metadata, properties = new Map);
  }
  if (kind === "setter") {
    options = Object.create(options);
    options.wrapped = true;
  }
  properties.set(context.name, options);
  if (kind === "accessor") {
    const { name } = context;
    return {
      set(v) {
        const oldValue = target.get.call(this);
        target.set.call(this, v);
        this.requestUpdate(name, oldValue, options, true, v);
      },
      init(v) {
        if (v !== undefined) {
          this._$changeProperty(name, undefined, options, v);
        }
        return v;
      }
    };
  } else if (kind === "setter") {
    const { name } = context;
    return function(value) {
      const oldValue = this[name];
      target.call(this, value);
      this.requestUpdate(name, oldValue, options, true, value);
    };
  }
  throw new Error(`Unsupported decorator location: ${kind}`);
};
function property(options) {
  return (protoOrTarget, nameOrContext) => {
    return typeof nameOrContext === "object" ? standardProperty(options, protoOrTarget, nameOrContext) : legacyProperty(options, protoOrTarget, nameOrContext);
  };
}
// node_modules/@lit/reactive-element/development/decorators/state.js
function state(options) {
  return property({
    ...options,
    state: true,
    attribute: false
  });
}
// node_modules/@lit/reactive-element/development/decorators/base.js
var desc = (obj, name, descriptor) => {
  descriptor.configurable = true;
  descriptor.enumerable = true;
  if (Reflect.decorate && typeof name !== "object") {
    Object.defineProperty(obj, name, descriptor);
  }
  return descriptor;
};

// node_modules/@lit/reactive-element/development/decorators/query.js
var DEV_MODE5 = true;
var issueWarning5;
if (DEV_MODE5) {
  globalThis.litIssuedWarnings ??= new Set;
  issueWarning5 = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : "";
    if (!globalThis.litIssuedWarnings.has(warning) && !globalThis.litIssuedWarnings.has(code)) {
      console.warn(warning);
      globalThis.litIssuedWarnings.add(warning);
    }
  };
}
function query(selector, cache) {
  return (protoOrTarget, nameOrContext, descriptor) => {
    const doQuery = (el) => {
      const result = el.renderRoot?.querySelector(selector) ?? null;
      if (DEV_MODE5 && result === null && cache && !el.hasUpdated) {
        const name = typeof nameOrContext === "object" ? nameOrContext.name : nameOrContext;
        issueWarning5("", `@query'd field ${JSON.stringify(String(name))} with the 'cache' ` + `flag set for selector '${selector}' has been accessed before ` + `the first update and returned null. This is expected if the ` + `renderRoot tree has not been provided beforehand (e.g. via ` + `Declarative Shadow DOM). Therefore the value hasn't been cached.`);
      }
      return result;
    };
    if (cache) {
      const { get, set } = typeof nameOrContext === "object" ? protoOrTarget : descriptor ?? (() => {
        const key = DEV_MODE5 ? Symbol(`${String(nameOrContext)} (@query() cache)`) : Symbol();
        return {
          get() {
            return this[key];
          },
          set(v) {
            this[key] = v;
          }
        };
      })();
      return desc(protoOrTarget, nameOrContext, {
        get() {
          let result = get.call(this);
          if (result === undefined) {
            result = doQuery(this);
            if (result !== null || this.hasUpdated) {
              set.call(this, result);
            }
          }
          return result;
        }
      });
    } else {
      return desc(protoOrTarget, nameOrContext, {
        get() {
          return doQuery(this);
        }
      });
    }
  };
}
// src/web/public/components/tspm-sidebar.ts
class TspmSidebar extends LitElement {
  constructor() {
    super(...arguments);
    this.currentView = "dashboard";
    this.isOnline = false;
  }
  static styles = css`
        :host {
            background: rgba(15, 15, 20, 0.8);
            backdrop-filter: blur(12px);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            padding: 1.5rem 1rem;
            z-index: 100;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 1rem;
            margin-bottom: 2rem;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #fff;
        }

        .nav-links {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            flex: 1;
        }

        .nav-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.875rem 1rem;
            border: none;
            background: transparent;
            color: #94a3b8;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 0.95rem;
            font-weight: 500;
            text-align: left;
            width: 100%;
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.03);
            color: #fff;
        }

        .nav-btn.active {
            background: rgba(99, 102, 241, 0.1);
            color: #818cf8;
        }

        .nav-btn i {
            width: 20px;
            height: 20px;
        }

        .sidebar-footer {
            margin-top: auto;
            padding: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .system-status {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.85rem;
            color: #64748b;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #475569;
        }

        .status-dot.online {
            background: #10b981;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        @media (max-width: 768px) {
            .logo-text, .nav-btn span, .system-status span {
                display: none;
            }
            .nav-btn {
                justify-content: center;
                padding: 1rem;
            }
            .logo {
                justify-content: center;
                padding: 1rem 0;
            }
        }
    `;
  _changeView(view) {
    this.dispatchEvent(new CustomEvent("view-change", { detail: view }));
  }
  render() {
    return html`
            <div class="logo">
                <div class="logo-icon">T</div>
                <span class="logo-text">TSPM</span>
            </div>

            <div class="nav-links">
                <button class="nav-btn ${this.currentView === "dashboard" ? "active" : ""}" @click="${() => this._changeView("dashboard")}">
                    <i data-lucide="layout-dashboard"></i>
                    <span>Dashboard</span>
                </button>
                <button class="nav-btn ${this.currentView === "processes" ? "active" : ""}" @click="${() => this._changeView("processes")}">
                    <i data-lucide="cpu"></i>
                    <span>Processes</span>
                </button>
                <button class="nav-btn ${this.currentView === "terminal" ? "active" : ""}" @click="${() => this._changeView("terminal")}">
                    <i data-lucide="terminal"></i>
                    <span>Executor</span>
                </button>
                <button class="nav-btn ${this.currentView === "logs" ? "active" : ""}" @click="${() => this._changeView("logs")}">
                    <i data-lucide="file-text"></i>
                    <span>Live Logs</span>
                </button>
            </div>

            <div class="sidebar-footer">
                <div class="system-status">
                    <div class="status-dot ${this.isOnline ? "online" : ""}"></div>
                    <span>System ${this.isOnline ? "Online" : "Offline"}</span>
                </div>
            </div>
        `;
  }
  updated() {
    const lucide = window.lucide;
    if (lucide) {
      lucide.createIcons({
        attrs: {
          "stroke-width": 2,
          class: "lucide-icon"
        },
        nameAttr: "data-lucide",
        root: this.shadowRoot
      });
    }
  }
}
__legacyDecorateClassTS([
  property({ type: String }),
  __legacyMetadataTS("design:type", Object)
], TspmSidebar.prototype, "currentView", undefined);
__legacyDecorateClassTS([
  property({ type: Boolean }),
  __legacyMetadataTS("design:type", Object)
], TspmSidebar.prototype, "isOnline", undefined);
TspmSidebar = __legacyDecorateClassTS([
  customElement("tspm-sidebar")
], TspmSidebar);

// src/web/public/components/tspm-topbar.ts
class TspmTopbar extends LitElement {
  static styles = css`
        :host {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 2rem;
            background: rgba(10, 10, 12, 0.4);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            height: 72px;
            box-sizing: border-box;
        }

        .search-container {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 0.6rem 1rem;
            width: 400px;
            gap: 12px;
            transition: all 0.2s ease;
        }

        .search-container:focus-within {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(99, 102, 241, 0.3);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        .search-container i {
            color: #64748b;
            width: 18px;
            height: 18px;
        }

        .search-container input {
            background: transparent;
            border: none;
            color: #fff;
            outline: none;
            width: 100%;
            font-family: inherit;
            font-size: 0.9rem;
        }

        .actions {
            display: flex;
            gap: 0.75rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 0.6rem 1rem;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
            font-family: inherit;
        }

        .btn-primary {
            background: #6366f1;
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .btn-primary:hover {
            background: #4f46e5;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: #e2e8f0;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .btn-icon {
            padding: 0.6rem;
            aspect-ratio: 1;
        }

        @media (max-width: 640px) {
            .search-container {
                display: none;
            }
        }
    `;
  render() {
    return html`
            <div class="search-container">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search processes, logs, commands..." />
            </div>

            <div class="actions">
                <button class="btn btn-secondary btn-icon" @click="${() => this.dispatchEvent(new CustomEvent("refresh"))}">
                    <i data-lucide="refresh-cw"></i>
                </button>
                <button class="btn btn-primary" @click="${() => this.dispatchEvent(new CustomEvent("open-modal"))}">
                    <i data-lucide="plus"></i>
                    <span>New Process</span>
                </button>
            </div>
        `;
  }
  updated() {
    const lucide = window.lucide;
    if (lucide) {
      lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
TspmTopbar = __legacyDecorateClassTS([
  customElement("tspm-topbar")
], TspmTopbar);

// src/web/public/components/tspm-dashboard.ts
class TspmDashboard extends LitElement {
  constructor() {
    super(...arguments);
    this.processes = [];
    this.stats = {};
  }
  static styles = css`
        :host {
            display: block;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s ease, background 0.2s ease;
        }

        .stat-card:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .stat-header h3 {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 500;
            color: #94a3b8;
        }

        .stat-header i {
            color: #6366f1;
            width: 20px;
            height: 20px;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 0.5rem;
        }

        .stat-footer {
            font-size: 0.85rem;
        }

        .text-success { color: #10b981; }
        .text-muted { color: #64748b; }

        .progress-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
            margin-top: 1rem;
            overflow: hidden;
        }

        .progress {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #a855f7);
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .section-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .process-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
        }

        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem;
            color: #64748b;
            grid-column: 1 / -1;
        }

        .spin {
            animation: spin 2s linear infinite;
            width: 32px;
            height: 32px;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
  formatBytes(bytes) {
    if (!bytes)
      return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  render() {
    const totalCpu = this.processes.reduce((acc, p) => acc + (p.cpu || 0), 0);
    const totalMem = this.processes.reduce((acc, p) => acc + (p.memory || 0), 0);
    return html`
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Processes</h3>
                        <i data-lucide="layers"></i>
                    </div>
                    <div class="stat-value">${this.processes.length}</div>
                    <div class="stat-footer">
                        <span class="text-success">Active & Monitoring</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Active CPU Usage</h3>
                        <i data-lucide="activity"></i>
                    </div>
                    <div class="stat-value">${Math.round(totalCpu)}%</div>
                    <div class="stat-footer">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(100, totalCpu)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Memory</h3>
                        <i data-lucide="database"></i>
                    </div>
                    <div class="stat-value">${this.formatBytes(totalMem)}</div>
                    <div class="stat-footer">
                        <span class="text-muted">Total allocated</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>System Health</h3>
                        <i data-lucide="shield-check"></i>
                    </div>
                    <div class="stat-value">Stable</div>
                    <div class="stat-footer">
                        <span class="text-success">All services operational</span>
                    </div>
                </div>
            </div>

            <div class="section-header">
                <h2>Running Processes</h2>
            </div>

            <div class="process-grid">
                ${this.processes.length === 0 ? html`
                    <div class="loading-state">
                        <i data-lucide="loader-2" class="spin"></i>
                        <p>Waiting for process data...</p>
                    </div>
                ` : this.processes.map((p) => html`
                    <tspm-process-card .process="${p}"></tspm-process-card>
                `)}
            </div>
        `;
  }
  updated() {
    const lucide = window.lucide;
    if (lucide) {
      lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
__legacyDecorateClassTS([
  property({ type: Array }),
  __legacyMetadataTS("design:type", Array)
], TspmDashboard.prototype, "processes", undefined);
__legacyDecorateClassTS([
  property({ type: Object }),
  __legacyMetadataTS("design:type", Object)
], TspmDashboard.prototype, "stats", undefined);
TspmDashboard = __legacyDecorateClassTS([
  customElement("tspm-dashboard")
], TspmDashboard);

// src/web/public/components/tspm-process-card.ts
class TspmProcessCard extends LitElement {
  constructor() {
    super(...arguments);
    this.process = {};
  }
  static styles = css`
        :host {
            display: block;
        }

        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.25rem;
            transition: all 0.2s ease;
        }

        .card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(99, 102, 241, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.25rem;
        }

        .info h4 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #fff;
        }

        .pid {
            font-size: 0.75rem;
            color: #64748b;
            font-family: 'JetBrains Mono', monospace;
            margin-top: 4px;
        }

        .status-badge {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 20px;
            letter-spacing: 0.5px;
        }

        .status-running {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-stopped {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
            background: rgba(0, 0, 0, 0.2);
            padding: 0.875rem;
            border-radius: 12px;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: #94a3b8;
        }

        .stat-item i {
            width: 14px;
            height: 14px;
            color: #6366f1;
        }

        .stat-item span {
            color: #e2e8f0;
            font-weight: 500;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .btn-icon {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.6rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-icon:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-icon.restart:hover { color: #818cf8; border-color: rgba(129, 140, 248, 0.3); }
        .btn-icon.stop:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
        .btn-icon.start:hover { color: #34d399; border-color: rgba(52, 211, 153, 0.3); }

        .btn-icon i {
            width: 18px;
            height: 18px;
        }
    `;
  formatBytes(bytes) {
    if (!bytes)
      return "0 B";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + ["B", "KB", "MB", "GB"][i];
  }
  async action(type) {
    try {
      const res = await fetch(`/api/v1/processes/${this.process.name}/${type}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        this.dispatchEvent(new CustomEvent("refresh-required", { bubbles: true, composed: true }));
      }
    } catch (err) {
      console.error("Action failed", err);
    }
  }
  render() {
    const p = this.process;
    return html`
            <div class="card">
                <div class="card-header">
                    <div class="info">
                        <h4>${p.name}</h4>
                        <div class="pid">PID: ${p.pid || "N/A"}</div>
                    </div>
                    <span class="status-badge status-${p.state}">${p.state}</span>
                </div>

                <div class="stats">
                    <div class="stat-item">
                        <i data-lucide="activity"></i>
                        <span>${p.cpu || 0}%</span>
                    </div>
                    <div class="stat-item">
                        <i data-lucide="database"></i>
                        <span>${this.formatBytes(p.memory || 0)}</span>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn-icon restart" title="Restart" @click="${() => this.action("restart")}">
                        <i data-lucide="refresh-ccw"></i>
                    </button>
                    ${p.state === "running" ? html`<button class="btn-icon stop" title="Stop" @click="${() => this.action("stop")}"><i data-lucide="square"></i></button>` : html`<button class="btn-icon start" title="Start" @click="${() => this.action("start")}"><i data-lucide="play"></i></button>`}
                    <button class="btn-icon" title="Logs" @click="${() => this.dispatchEvent(new CustomEvent("view-logs", { detail: p.name, bubbles: true, composed: true }))}">
                        <i data-lucide="file-text"></i>
                    </button>
                </div>
            </div>
        `;
  }
  updated() {
    const lucide = window.lucide;
    if (lucide) {
      lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
__legacyDecorateClassTS([
  property({ type: Object }),
  __legacyMetadataTS("design:type", Object)
], TspmProcessCard.prototype, "process", undefined);
TspmProcessCard = __legacyDecorateClassTS([
  customElement("tspm-process-card")
], TspmProcessCard);

// src/web/public/components/tspm-process-table.ts
class TspmProcessTable extends LitElement {
  constructor() {
    super(...arguments);
    this.processes = [];
  }
  static styles = css`
        :host {
            display: block;
        }

        .table-container {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
        }

        th {
            background: rgba(255, 255, 255, 0.02);
            padding: 1.25rem 1.5rem;
            color: #94a3b8;
            font-weight: 500;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        td {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            color: #e2e8f0;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: rgba(255, 255, 255, 0.01);
        }

        .status-badge {
            font-size: 0.75rem;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
        }

        .status-running { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .status-stopped { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .font-mono {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            color: #94a3b8;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .btn-icon {
            padding: 6px;
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .btn-icon:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
        }
    `;
  formatBytes(bytes) {
    if (!bytes)
      return "0 B";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + ["B", "KB", "MB", "GB"][i];
  }
  render() {
    return html`
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>PID</th>
                            <th>Memory</th>
                            <th>CPU</th>
                            <th>Uptime</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.processes.map((p) => html`
                            <tr>
                                <td style="font-weight: 600;">${p.name}</td>
                                <td><span class="status-badge status-${p.state}">${p.state}</span></td>
                                <td class="font-mono">#${p.pid || "-"}</td>
                                <td>${this.formatBytes(p.memory || 0)}</td>
                                <td>${p.cpu || 0}%</td>
                                <td>${this.formatUptime(p.uptime)}</td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-icon" @click="${() => this._action(p.name, "restart")}"><i data-lucide="refresh-ccw" style="width:16px"></i></button>
                                        <button class="btn-icon" @click="${() => this._action(p.name, p.state === "running" ? "stop" : "start")}">
                                            <i data-lucide="${p.state === "running" ? "square" : "play"}" style="width:16px"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `;
  }
  formatUptime(ms) {
    if (!ms)
      return "-";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  async _action(name, action) {
    await fetch(`/api/v1/processes/${name}/${action}`, { method: "POST" });
    this.dispatchEvent(new CustomEvent("refresh-required", { bubbles: true, composed: true }));
  }
  updated() {
    const lucide = window.lucide;
    if (lucide) {
      lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
__legacyDecorateClassTS([
  property({ type: Array }),
  __legacyMetadataTS("design:type", Array)
], TspmProcessTable.prototype, "processes", undefined);
TspmProcessTable = __legacyDecorateClassTS([
  customElement("tspm-process-table")
], TspmProcessTable);

// src/web/public/components/tspm-terminal.ts
class TspmTerminal extends LitElement {
  constructor() {
    super();
    this.active = false;
    this.history = [];
    this._setupListeners();
  }
  _setupListeners() {
    window.addEventListener("terminal-out", (e) => {
      this.history = [...this.history, { text: e.detail, type: "output" }];
      this._scrollToBottom();
    });
  }
  static styles = css`
        :host {
            display: block;
            height: 100%;
        }

        .terminal {
            background: #000;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .header {
            background: #1a1a1a;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid #333;
        }

        .dots { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27c93f; }

        .title { color: #888; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; }

        .output {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            color: #d1d5db;
            line-height: 1.5;
            white-space: pre-wrap;
            scrollbar-width: thin;
        }

        .output::-webkit-scrollbar { width: 6px; }
        .output::-webkit-scrollbar-thumb { background: #333; }

        .line { margin-bottom: 4px; }
        .line.input { color: #818cf8; font-weight: bold; }
        .line.error { color: #f87171; }

        .input-area {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            background: #000;
            border-top: 1px solid #1a1a1a;
        }

        .prompt { color: #10b981; margin-right: 12px; font-weight: bold; }

        input {
            background: transparent;
            border: none;
            color: #fff;
            outline: none;
            flex: 1;
            font-family: inherit;
            font-size: inherit;
        }
    `;
  async _handleKey(e) {
    if (e.key === "Enter") {
      const cmd = e.target.value.trim();
      if (!cmd)
        return;
      this.history = [...this.history, { text: cmd, type: "input" }];
      e.target.value = "";
      try {
        const res = await fetch("/api/v1/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        if (data.output)
          this.history = [...this.history, { text: data.output, type: "output" }];
        if (data.error)
          this.history = [...this.history, { text: data.error, type: "error" }];
        this._scrollToBottom();
      } catch (err) {
        this.history = [...this.history, { text: "Execution failed", type: "error" }];
      }
    }
  }
  _scrollToBottom() {
    setTimeout(() => {
      if (this.outputEl)
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }, 0);
  }
  updated(changed) {
    if (changed.has("active") && this.active) {
      this.inputEl?.focus();
    }
  }
  render() {
    return html`
            <div class="terminal">
                <div class="header">
                    <div class="dots">
                        <div class="dot red"></div>
                        <div class="dot yellow"></div>
                        <div class="dot green"></div>
                    </div>
                    <div class="title">TSPM SHELL — BUN</div>
                </div>
                <div class="output">
                    ${this.history.map((line) => html`
                        <div class="line ${line.type}">${line.type === "input" ? "$ " : ""}${line.text}</div>
                    `)}
                </div>
                <div class="input-area">
                    <span class="prompt">➜</span>
                    <input type="text" placeholder="Type a command..." @keydown="${this._handleKey}" />
                </div>
            </div>
        `;
  }
}
__legacyDecorateClassTS([
  property({ type: Boolean }),
  __legacyMetadataTS("design:type", Object)
], TspmTerminal.prototype, "active", undefined);
__legacyDecorateClassTS([
  state(),
  __legacyMetadataTS("design:type", Array)
], TspmTerminal.prototype, "history", undefined);
__legacyDecorateClassTS([
  query(".output"),
  __legacyMetadataTS("design:type", typeof HTMLElement === "undefined" ? Object : HTMLElement)
], TspmTerminal.prototype, "outputEl", undefined);
__legacyDecorateClassTS([
  query("input"),
  __legacyMetadataTS("design:type", typeof HTMLInputElement === "undefined" ? Object : HTMLInputElement)
], TspmTerminal.prototype, "inputEl", undefined);
TspmTerminal = __legacyDecorateClassTS([
  customElement("tspm-terminal"),
  __legacyMetadataTS("design:paramtypes", [])
], TspmTerminal);

// src/web/public/components/tspm-logs.ts
class TspmLogs extends LitElement {
  constructor() {
    super();
    this.processes = [];
    this.selectedProcess = "all";
    this.logs = [];
    this._setupListeners();
  }
  _setupListeners() {
    window.addEventListener("new-log", (e) => {
      this.logs = [...this.logs.slice(-999), e.detail];
      this._scrollToBottom();
    });
  }
  static styles = css`
        :host {
            display: block;
            height: 100%;
        }

        .container {
            background: rgba(15, 15, 20, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            padding: 1rem;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        select {
            background: #1a1a1a;
            color: #fff;
            border: 1px solid #333;
            padding: 6px 12px;
            border-radius: 8px;
            font-family: inherit;
        }

        .output {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            scrollbar-width: thin;
        }

        .output::-webkit-scrollbar { width: 6px; }
        .output::-webkit-scrollbar-thumb { background: #333; }

        .line {
            margin-bottom: 4px;
            display: flex;
            gap: 12px;
        }

        .timestamp { color: #64748b; min-width: 80px; }
        .proc { color: #818cf8; font-weight: 600; min-width: 100px; }
        .msg { color: #e2e8f0; white-space: pre-wrap; word-break: break-all; }

        .controls { display: flex; gap: 10px; }
        .btn-icon {
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 4px;
        }
        .btn-icon:hover { color: #fff; }
    `;
  _scrollToBottom() {
    if (this.outputEl) {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }
  }
  render() {
    const filteredLogs = this.selectedProcess === "all" ? this.logs : this.logs.filter((l) => l.processName === this.selectedProcess);
    return html`
            <div class="container">
                <div class="header">
                    <select @change="${(e) => this.selectedProcess = e.target.value}">
                        <option value="all">Global Logs</option>
                        ${this.processes.map((p) => html`<option value="${p.name}" ?selected="${this.selectedProcess === p.name}">${p.name}</option>`)}
                    </select>
                    <div class="controls">
                        <button class="btn-icon" title="Clear" @click="${() => this.logs = []}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="output">
                    ${filteredLogs.map((log) => html`
                        <div class="line">
                            <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                            <span class="proc">[${log.processName}]</span>
                            <span class="msg">${log.message}</span>
                        </div>
                    `)}
                </div>
            </div>
        `;
  }
  updated() {
    const lucide = window.lucide;
    if (lucide) {
      lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
__legacyDecorateClassTS([
  property({ type: Array }),
  __legacyMetadataTS("design:type", Array)
], TspmLogs.prototype, "processes", undefined);
__legacyDecorateClassTS([
  property({ type: String }),
  __legacyMetadataTS("design:type", Object)
], TspmLogs.prototype, "selectedProcess", undefined);
__legacyDecorateClassTS([
  state(),
  __legacyMetadataTS("design:type", Array)
], TspmLogs.prototype, "logs", undefined);
__legacyDecorateClassTS([
  query(".output"),
  __legacyMetadataTS("design:type", typeof HTMLElement === "undefined" ? Object : HTMLElement)
], TspmLogs.prototype, "outputEl", undefined);
TspmLogs = __legacyDecorateClassTS([
  customElement("tspm-logs"),
  __legacyMetadataTS("design:paramtypes", [])
], TspmLogs);

// src/web/public/components/tspm-modal.ts
class TspmModal extends LitElement {
  constructor() {
    super(...arguments);
    this.isOpen = false;
  }
  open() {
    this.isOpen = true;
  }
  close() {
    this.isOpen = false;
  }
  static styles = css`
        :host {
            display: contents;
        }

        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .modal {
            background: #1a1a1e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            width: 500px;
            max-width: 90%;
            padding: 2rem;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .active .modal {
            transform: scale(1);
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        header h2 { margin: 0; font-size: 1.5rem; color: #fff; }

        .btn-close {
            background: none;
            border: none;
            color: #64748b;
            font-size: 1.5rem;
            cursor: pointer;
        }

        form { display: flex; flex-direction: column; gap: 1.5rem; }

        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { color: #94a3b8; font-size: 0.9rem; font-weight: 500; }

        input, select {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: #fff;
            font-family: inherit;
        }

        input:focus { border-color: #6366f1; outline: none; }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        footer {
            margin-top: 2.5rem;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .btn-cancel { background: transparent; color: #94a3b8; }
        .btn-primary { background: #6366f1; color: white; }
        .btn-primary:hover { background: #4f46e5; }
    `;
  async _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const config = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`/api/v1/processes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        this.close();
        this.dispatchEvent(new CustomEvent("process-added", { bubbles: true, composed: true }));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to spawn process");
    }
  }
  render() {
    return html`
            <div class="overlay ${this.isOpen ? "active" : ""}" @click="${(e) => e.target.classList.contains("overlay") && this.close()}">
                <div class="modal">
                    <header>
                        <h2>Process Configuration</h2>
                        <button class="btn-close" @click="${this.close}">&times;</button>
                    </header>
                    <form @submit="${this._handleSubmit}">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" placeholder="my-awesome-api" required />
                        </div>
                        <div class="row">
                            <div class="form-group">
                                <label>Script Path</label>
                                <input type="text" name="script" placeholder="./src/index.ts" required />
                            </div>
                            <div class="form-group">
                                <label>Interpreter</label>
                                <select name="interpreter">
                                    <option value="bun">Bun</option>
                                    <option value="node">Node</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group">
                                <label>Instances</label>
                                <input type="number" name="instances" value="1" min="1" />
                            </div>
                            <div class="form-group">
                                <label>Namespace</label>
                                <input type="text" name="namespace" placeholder="production" />
                            </div>
                        </div>
                        <footer>
                            <button type="button" class="btn btn-cancel" @click="${this.close}">Cancel</button>
                            <button type="submit" class="btn btn-primary">Spawn Instance</button>
                        </footer>
                    </form>
                </div>
            </div>
        `;
  }
}
__legacyDecorateClassTS([
  property({ type: Boolean }),
  __legacyMetadataTS("design:type", Object)
], TspmModal.prototype, "isOpen", undefined);
TspmModal = __legacyDecorateClassTS([
  customElement("tspm-modal")
], TspmModal);

// src/web/public/components/tspm-app.ts
class TspmApp extends LitElement {
  socket;
  constructor() {
    super();
    this.currentView = "dashboard";
    this.processes = [];
    this.systemStats = { cpu: 0, memory: 0, uptime: 0 };
    this.isOnline = false;
    this.connect();
    this.addEventListener("view-logs", (e) => {
      this.currentView = "logs";
      this.updateComplete.then(() => {
        const logsComp = this.shadowRoot?.querySelector("tspm-logs");
        if (logsComp)
          logsComp.selectedProcess = e.detail;
      });
    });
    this.addEventListener("refresh-required", () => this.fetchData());
  }
  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.socket = new WebSocket(`${protocol}//${host}/ws`);
    this.socket.onopen = () => {
      console.log("Connected to TSPM Node");
      this.isOnline = true;
      this.fetchData();
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleUpdate(data);
    };
    this.socket.onclose = () => {
      console.log("Disconnected from TSPM Node");
      this.isOnline = false;
      setTimeout(() => this.connect(), 3000);
    };
  }
  handleUpdate(data) {
    switch (data.type) {
      case "process:update":
        this.processes = data.payload;
        break;
      case "process:log":
        this.dispatchEvent(new CustomEvent("new-log", { detail: data.payload, bubbles: true, composed: true }));
        break;
      case "terminal:out":
        this.dispatchEvent(new CustomEvent("terminal-out", { detail: data.payload, bubbles: true, composed: true }));
        break;
      case "system:stats":
        this.systemStats = data.payload;
        break;
    }
  }
  async fetchData() {
    try {
      const res = await fetch("/api/v1/status");
      const data = await res.json();
      if (data.success) {
        this.processes = data.data.processes;
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  }
  static styles = css`
        :host {
            display: grid;
            grid-template-columns: 260px 1fr;
            height: 100vh;
            background: #0a0a0c;
            color: #e2e8f0;
            font-family: 'Outfit', sans-serif;
            overflow: hidden;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: 80px 1fr;
            }
        }

        .main-content {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: radial-gradient(circle at top right, #1a1a2e 0%, #0a0a0c 100%);
        }

        .view-container {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #334155 transparent;
        }

        .view-container::-webkit-scrollbar {
            width: 6px;
        }

        .view-container::-webkit-scrollbar-thumb {
            background-color: #334155;
            border-radius: 10px;
        }

        .view {
            display: none;
            animation: fadeIn 0.4s ease-out;
        }

        .view.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
  render() {
    return html`
            <tspm-sidebar 
                .currentView="${this.currentView}" 
                .isOnline="${this.isOnline}"
                @view-change="${(e) => this.currentView = e.detail}"
            ></tspm-sidebar>
            
            <main class="main-content">
                <tspm-topbar 
                    @refresh="${this.fetchData}"
                    @open-modal="${() => this.modal.open()}"
                ></tspm-topbar>
                
                <div class="view-container">
                    <tspm-dashboard 
                        class="view ${this.currentView === "dashboard" ? "active" : ""}"
                        .processes="${this.processes}"
                        .stats="${this.systemStats}"
                    ></tspm-dashboard>

                    <tspm-process-table
                        class="view ${this.currentView === "processes" ? "active" : ""}"
                        .processes="${this.processes}"
                    ></tspm-process-table>

                    <tspm-terminal
                        class="view ${this.currentView === "terminal" ? "active" : ""}"
                        ?active="${this.currentView === "terminal"}"
                    ></tspm-terminal>

                    <tspm-logs
                        class="view ${this.currentView === "logs" ? "active" : ""}"
                        .processes="${this.processes}"
                    ></tspm-logs>
                </div>
            </main>

            <tspm-modal @process-added="${this.fetchData}"></tspm-modal>
        `;
  }
}
__legacyDecorateClassTS([
  state(),
  __legacyMetadataTS("design:type", Object)
], TspmApp.prototype, "currentView", undefined);
__legacyDecorateClassTS([
  state(),
  __legacyMetadataTS("design:type", Array)
], TspmApp.prototype, "processes", undefined);
__legacyDecorateClassTS([
  state(),
  __legacyMetadataTS("design:type", Object)
], TspmApp.prototype, "systemStats", undefined);
__legacyDecorateClassTS([
  state(),
  __legacyMetadataTS("design:type", Object)
], TspmApp.prototype, "isOnline", undefined);
__legacyDecorateClassTS([
  query("tspm-modal"),
  __legacyMetadataTS("design:type", Object)
], TspmApp.prototype, "modal", undefined);
TspmApp = __legacyDecorateClassTS([
  customElement("tspm-app"),
  __legacyMetadataTS("design:paramtypes", [])
], TspmApp);

// src/web/public/main.ts
console.log("TSPM Web Components Loaded");

//# debugId=B6167F44E7DC4DD564756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL0BsaXQvcmVhY3RpdmUtZWxlbWVudC9kZXZlbG9wbWVudC9jc3MtdGFnLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGV2ZWxvcG1lbnQvcmVhY3RpdmUtZWxlbWVudC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvZGV2ZWxvcG1lbnQvbGl0LWh0bWwuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpdC1lbGVtZW50L2RldmVsb3BtZW50L2xpdC1lbGVtZW50LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGV2ZWxvcG1lbnQvZGVjb3JhdG9ycy9jdXN0b20tZWxlbWVudC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RldmVsb3BtZW50L2RlY29yYXRvcnMvcHJvcGVydHkuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL0BsaXQvcmVhY3RpdmUtZWxlbWVudC9kZXZlbG9wbWVudC9kZWNvcmF0b3JzL3N0YXRlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGV2ZWxvcG1lbnQvZGVjb3JhdG9ycy9iYXNlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGV2ZWxvcG1lbnQvZGVjb3JhdG9ycy9xdWVyeS5qcyIsICIuLi8uLi9zcmMvd2ViL3B1YmxpYy9jb21wb25lbnRzL3RzcG0tc2lkZWJhci50cyIsICIuLi8uLi9zcmMvd2ViL3B1YmxpYy9jb21wb25lbnRzL3RzcG0tdG9wYmFyLnRzIiwgIi4uLy4uL3NyYy93ZWIvcHVibGljL2NvbXBvbmVudHMvdHNwbS1kYXNoYm9hcmQudHMiLCAiLi4vLi4vc3JjL3dlYi9wdWJsaWMvY29tcG9uZW50cy90c3BtLXByb2Nlc3MtY2FyZC50cyIsICIuLi8uLi9zcmMvd2ViL3B1YmxpYy9jb21wb25lbnRzL3RzcG0tcHJvY2Vzcy10YWJsZS50cyIsICIuLi8uLi9zcmMvd2ViL3B1YmxpYy9jb21wb25lbnRzL3RzcG0tdGVybWluYWwudHMiLCAiLi4vLi4vc3JjL3dlYi9wdWJsaWMvY29tcG9uZW50cy90c3BtLWxvZ3MudHMiLCAiLi4vLi4vc3JjL3dlYi9wdWJsaWMvY29tcG9uZW50cy90c3BtLW1vZGFsLnRzIiwgIi4uLy4uL3NyYy93ZWIvcHVibGljL2NvbXBvbmVudHMvdHNwbS1hcHAudHMiLCAiLi4vLi4vc3JjL3dlYi9wdWJsaWMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxOSBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cbmNvbnN0IE5PREVfTU9ERSA9IGZhbHNlO1xuLy8gQWxsb3dzIG1pbmlmaWVycyB0byByZW5hbWUgcmVmZXJlbmNlcyB0byBnbG9iYWxUaGlzXG5jb25zdCBnbG9iYWwgPSBnbG9iYWxUaGlzO1xuLyoqXG4gKiBXaGV0aGVyIHRoZSBjdXJyZW50IGJyb3dzZXIgc3VwcG9ydHMgYGFkb3B0ZWRTdHlsZVNoZWV0c2AuXG4gKi9cbmV4cG9ydCBjb25zdCBzdXBwb3J0c0Fkb3B0aW5nU3R5bGVTaGVldHMgPSBnbG9iYWwuU2hhZG93Um9vdCAmJlxuICAgIChnbG9iYWwuU2hhZHlDU1MgPT09IHVuZGVmaW5lZCB8fCBnbG9iYWwuU2hhZHlDU1MubmF0aXZlU2hhZG93KSAmJlxuICAgICdhZG9wdGVkU3R5bGVTaGVldHMnIGluIERvY3VtZW50LnByb3RvdHlwZSAmJlxuICAgICdyZXBsYWNlJyBpbiBDU1NTdHlsZVNoZWV0LnByb3RvdHlwZTtcbmNvbnN0IGNvbnN0cnVjdGlvblRva2VuID0gU3ltYm9sKCk7XG5jb25zdCBjc3NUYWdDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG4vKipcbiAqIEEgY29udGFpbmVyIGZvciBhIHN0cmluZyBvZiBDU1MgdGV4dCwgdGhhdCBtYXkgYmUgdXNlZCB0byBjcmVhdGUgYSBDU1NTdHlsZVNoZWV0LlxuICpcbiAqIENTU1Jlc3VsdCBpcyB0aGUgcmV0dXJuIHZhbHVlIG9mIGBjc3NgLXRhZ2dlZCB0ZW1wbGF0ZSBsaXRlcmFscyBhbmRcbiAqIGB1bnNhZmVDU1MoKWAuIEluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IENTU1Jlc3VsdHMgYXJlIG9ubHkgY3JlYXRlZCB2aWEgdGhlXG4gKiBgY3NzYCB0YWcgYW5kIGB1bnNhZmVDU1MoKWAsIENTU1Jlc3VsdCBjYW5ub3QgYmUgY29uc3RydWN0ZWQgZGlyZWN0bHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDU1NSZXN1bHQge1xuICAgIGNvbnN0cnVjdG9yKGNzc1RleHQsIHN0cmluZ3MsIHNhZmVUb2tlbikge1xuICAgICAgICAvLyBUaGlzIHByb3BlcnR5IG5lZWRzIHRvIHJlbWFpbiB1bm1pbmlmaWVkLlxuICAgICAgICB0aGlzWydfJGNzc1Jlc3VsdCQnXSA9IHRydWU7XG4gICAgICAgIGlmIChzYWZlVG9rZW4gIT09IGNvbnN0cnVjdGlvblRva2VuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NTU1Jlc3VsdCBpcyBub3QgY29uc3RydWN0YWJsZS4gVXNlIGB1bnNhZmVDU1NgIG9yIGBjc3NgIGluc3RlYWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jc3NUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgdGhpcy5fc3RyaW5ncyA9IHN0cmluZ3M7XG4gICAgfVxuICAgIC8vIFRoaXMgaXMgYSBnZXR0ZXIgc28gdGhhdCBpdCdzIGxhenkuIEluIHByYWN0aWNlLCB0aGlzIG1lYW5zIHN0eWxlc2hlZXRzXG4gICAgLy8gYXJlIG5vdCBjcmVhdGVkIHVudGlsIHRoZSBmaXJzdCBlbGVtZW50IGluc3RhbmNlIGlzIG1hZGUuXG4gICAgZ2V0IHN0eWxlU2hlZXQoKSB7XG4gICAgICAgIC8vIElmIGBzdXBwb3J0c0Fkb3B0aW5nU3R5bGVTaGVldHNgIGlzIHRydWUgdGhlbiB3ZSBhc3N1bWUgQ1NTU3R5bGVTaGVldCBpc1xuICAgICAgICAvLyBjb25zdHJ1Y3RhYmxlLlxuICAgICAgICBsZXQgc3R5bGVTaGVldCA9IHRoaXMuX3N0eWxlU2hlZXQ7XG4gICAgICAgIGNvbnN0IHN0cmluZ3MgPSB0aGlzLl9zdHJpbmdzO1xuICAgICAgICBpZiAoc3VwcG9ydHNBZG9wdGluZ1N0eWxlU2hlZXRzICYmIHN0eWxlU2hlZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgY2FjaGVhYmxlID0gc3RyaW5ncyAhPT0gdW5kZWZpbmVkICYmIHN0cmluZ3MubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgaWYgKGNhY2hlYWJsZSkge1xuICAgICAgICAgICAgICAgIHN0eWxlU2hlZXQgPSBjc3NUYWdDYWNoZS5nZXQoc3RyaW5ncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3R5bGVTaGVldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgKHRoaXMuX3N0eWxlU2hlZXQgPSBzdHlsZVNoZWV0ID0gbmV3IENTU1N0eWxlU2hlZXQoKSkucmVwbGFjZVN5bmModGhpcy5jc3NUZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNzc1RhZ0NhY2hlLnNldChzdHJpbmdzLCBzdHlsZVNoZWV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0eWxlU2hlZXQ7XG4gICAgfVxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jc3NUZXh0O1xuICAgIH1cbn1cbmNvbnN0IHRleHRGcm9tQ1NTUmVzdWx0ID0gKHZhbHVlKSA9PiB7XG4gICAgLy8gVGhpcyBwcm9wZXJ0eSBuZWVkcyB0byByZW1haW4gdW5taW5pZmllZC5cbiAgICBpZiAodmFsdWVbJ18kY3NzUmVzdWx0JCddID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5jc3NUZXh0O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVmFsdWUgcGFzc2VkIHRvICdjc3MnIGZ1bmN0aW9uIG11c3QgYmUgYSAnY3NzJyBmdW5jdGlvbiByZXN1bHQ6IGAgK1xuICAgICAgICAgICAgYCR7dmFsdWV9LiBVc2UgJ3Vuc2FmZUNTUycgdG8gcGFzcyBub24tbGl0ZXJhbCB2YWx1ZXMsIGJ1dCB0YWtlIGNhcmUgYCArXG4gICAgICAgICAgICBgdG8gZW5zdXJlIHBhZ2Ugc2VjdXJpdHkuYCk7XG4gICAgfVxufTtcbi8qKlxuICogV3JhcCBhIHZhbHVlIGZvciBpbnRlcnBvbGF0aW9uIGluIGEge0BsaW5rY29kZSBjc3N9IHRhZ2dlZCB0ZW1wbGF0ZSBsaXRlcmFsLlxuICpcbiAqIFRoaXMgaXMgdW5zYWZlIGJlY2F1c2UgdW50cnVzdGVkIENTUyB0ZXh0IGNhbiBiZSB1c2VkIHRvIHBob25lIGhvbWVcbiAqIG9yIGV4ZmlsdHJhdGUgZGF0YSB0byBhbiBhdHRhY2tlciBjb250cm9sbGVkIHNpdGUuIFRha2UgY2FyZSB0byBvbmx5IHVzZVxuICogdGhpcyB3aXRoIHRydXN0ZWQgaW5wdXQuXG4gKi9cbmV4cG9ydCBjb25zdCB1bnNhZmVDU1MgPSAodmFsdWUpID0+IG5ldyBDU1NSZXN1bHQodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlIDogU3RyaW5nKHZhbHVlKSwgdW5kZWZpbmVkLCBjb25zdHJ1Y3Rpb25Ub2tlbik7XG4vKipcbiAqIEEgdGVtcGxhdGUgbGl0ZXJhbCB0YWcgd2hpY2ggY2FuIGJlIHVzZWQgd2l0aCBMaXRFbGVtZW50J3NcbiAqIHtAbGlua2NvZGUgTGl0RWxlbWVudC5zdHlsZXN9IHByb3BlcnR5IHRvIHNldCBlbGVtZW50IHN0eWxlcy5cbiAqXG4gKiBGb3Igc2VjdXJpdHkgcmVhc29ucywgb25seSBsaXRlcmFsIHN0cmluZyB2YWx1ZXMgYW5kIG51bWJlciBtYXkgYmUgdXNlZCBpblxuICogZW1iZWRkZWQgZXhwcmVzc2lvbnMuIFRvIGluY29ycG9yYXRlIG5vbi1saXRlcmFsIHZhbHVlcyB7QGxpbmtjb2RlIHVuc2FmZUNTU31cbiAqIG1heSBiZSB1c2VkIGluc2lkZSBhbiBleHByZXNzaW9uLlxuICovXG5leHBvcnQgY29uc3QgY3NzID0gKHN0cmluZ3MsIC4uLnZhbHVlcykgPT4ge1xuICAgIGNvbnN0IGNzc1RleHQgPSBzdHJpbmdzLmxlbmd0aCA9PT0gMVxuICAgICAgICA/IHN0cmluZ3NbMF1cbiAgICAgICAgOiB2YWx1ZXMucmVkdWNlKChhY2MsIHYsIGlkeCkgPT4gYWNjICsgdGV4dEZyb21DU1NSZXN1bHQodikgKyBzdHJpbmdzW2lkeCArIDFdLCBzdHJpbmdzWzBdKTtcbiAgICByZXR1cm4gbmV3IENTU1Jlc3VsdChjc3NUZXh0LCBzdHJpbmdzLCBjb25zdHJ1Y3Rpb25Ub2tlbik7XG59O1xuLyoqXG4gKiBBcHBsaWVzIHRoZSBnaXZlbiBzdHlsZXMgdG8gYSBgc2hhZG93Um9vdGAuIFdoZW4gU2hhZG93IERPTSBpc1xuICogYXZhaWxhYmxlIGJ1dCBgYWRvcHRlZFN0eWxlU2hlZXRzYCBpcyBub3QsIHN0eWxlcyBhcmUgYXBwZW5kZWQgdG8gdGhlXG4gKiBgc2hhZG93Um9vdGAgdG8gW21pbWljIHRoZSBuYXRpdmUgZmVhdHVyZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NoYWRvd1Jvb3QvYWRvcHRlZFN0eWxlU2hlZXRzKS5cbiAqIE5vdGUsIHdoZW4gc2hpbW1pbmcgaXMgdXNlZCwgYW55IHN0eWxlcyB0aGF0IGFyZSBzdWJzZXF1ZW50bHkgcGxhY2VkIGludG9cbiAqIHRoZSBzaGFkb3dSb290IHNob3VsZCBiZSBwbGFjZWQgKmJlZm9yZSogYW55IHNoaW1tZWQgYWRvcHRlZCBzdHlsZXMuIFRoaXNcbiAqIHdpbGwgbWF0Y2ggc3BlYyBiZWhhdmlvciB0aGF0IGdpdmVzIGFkb3B0ZWQgc2hlZXRzIHByZWNlZGVuY2Ugb3ZlciBzdHlsZXMgaW5cbiAqIHNoYWRvd1Jvb3QuXG4gKi9cbmV4cG9ydCBjb25zdCBhZG9wdFN0eWxlcyA9IChyZW5kZXJSb290LCBzdHlsZXMpID0+IHtcbiAgICBpZiAoc3VwcG9ydHNBZG9wdGluZ1N0eWxlU2hlZXRzKSB7XG4gICAgICAgIHJlbmRlclJvb3QuYWRvcHRlZFN0eWxlU2hlZXRzID0gc3R5bGVzLm1hcCgocykgPT4gcyBpbnN0YW5jZW9mIENTU1N0eWxlU2hlZXQgPyBzIDogcy5zdHlsZVNoZWV0KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3QgcyBvZiBzdHlsZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgICBjb25zdCBub25jZSA9IGdsb2JhbFsnbGl0Tm9uY2UnXTtcbiAgICAgICAgICAgIGlmIChub25jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUuc2V0QXR0cmlidXRlKCdub25jZScsIG5vbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gcy5jc3NUZXh0O1xuICAgICAgICAgICAgcmVuZGVyUm9vdC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuY29uc3QgY3NzUmVzdWx0RnJvbVN0eWxlU2hlZXQgPSAoc2hlZXQpID0+IHtcbiAgICBsZXQgY3NzVGV4dCA9ICcnO1xuICAgIGZvciAoY29uc3QgcnVsZSBvZiBzaGVldC5jc3NSdWxlcykge1xuICAgICAgICBjc3NUZXh0ICs9IHJ1bGUuY3NzVGV4dDtcbiAgICB9XG4gICAgcmV0dXJuIHVuc2FmZUNTUyhjc3NUZXh0KTtcbn07XG5leHBvcnQgY29uc3QgZ2V0Q29tcGF0aWJsZVN0eWxlID0gc3VwcG9ydHNBZG9wdGluZ1N0eWxlU2hlZXRzIHx8XG4gICAgKE5PREVfTU9ERSAmJiBnbG9iYWwuQ1NTU3R5bGVTaGVldCA9PT0gdW5kZWZpbmVkKVxuICAgID8gKHMpID0+IHNcbiAgICA6IChzKSA9PiBzIGluc3RhbmNlb2YgQ1NTU3R5bGVTaGVldCA/IGNzc1Jlc3VsdEZyb21TdHlsZVNoZWV0KHMpIDogcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNzcy10YWcuanMubWFwIiwKICAgICIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNyBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cbi8qKlxuICogVXNlIHRoaXMgbW9kdWxlIGlmIHlvdSB3YW50IHRvIGNyZWF0ZSB5b3VyIG93biBiYXNlIGNsYXNzIGV4dGVuZGluZ1xuICoge0BsaW5rIFJlYWN0aXZlRWxlbWVudH0uXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqL1xuaW1wb3J0IHsgZ2V0Q29tcGF0aWJsZVN0eWxlLCBhZG9wdFN0eWxlcywgfSBmcm9tICcuL2Nzcy10YWcuanMnO1xuLy8gSW4gdGhlIE5vZGUgYnVpbGQsIHRoaXMgaW1wb3J0IHdpbGwgYmUgaW5qZWN0ZWQgYnkgUm9sbHVwOlxuLy8gaW1wb3J0IHtIVE1MRWxlbWVudCwgY3VzdG9tRWxlbWVudHN9IGZyb20gJ0BsaXQtbGFicy9zc3ItZG9tLXNoaW0nO1xuZXhwb3J0ICogZnJvbSAnLi9jc3MtdGFnLmpzJztcbi8vIFRPRE8gKGp1c3RpbmZhZ25hbmkpOiBBZGQgYGhhc093bmAgaGVyZSB3aGVuIHdlIHNoaXAgRVMyMDIyXG5jb25zdCB7IGlzLCBkZWZpbmVQcm9wZXJ0eSwgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLCBnZXRPd25Qcm9wZXJ0eU5hbWVzLCBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMsIGdldFByb3RvdHlwZU9mLCB9ID0gT2JqZWN0O1xuY29uc3QgTk9ERV9NT0RFID0gZmFsc2U7XG4vLyBMZXRzIGEgbWluaWZpZXIgcmVwbGFjZSBnbG9iYWxUaGlzIHJlZmVyZW5jZXMgd2l0aCBhIG1pbmlmaWVkIG5hbWVcbmNvbnN0IGdsb2JhbCA9IGdsb2JhbFRoaXM7XG5pZiAoTk9ERV9NT0RFKSB7XG4gICAgZ2xvYmFsLmN1c3RvbUVsZW1lbnRzID8/PSBjdXN0b21FbGVtZW50cztcbn1cbmNvbnN0IERFVl9NT0RFID0gdHJ1ZTtcbmxldCBpc3N1ZVdhcm5pbmc7XG5jb25zdCB0cnVzdGVkVHlwZXMgPSBnbG9iYWxcbiAgICAudHJ1c3RlZFR5cGVzO1xuLy8gVGVtcG9yYXJ5IHdvcmthcm91bmQgZm9yIGh0dHBzOi8vY3JidWcuY29tLzk5MzI2OFxuLy8gQ3VycmVudGx5LCBhbnkgYXR0cmlidXRlIHN0YXJ0aW5nIHdpdGggXCJvblwiIGlzIGNvbnNpZGVyZWQgdG8gYmUgYVxuLy8gVHJ1c3RlZFNjcmlwdCBzb3VyY2UuIFN1Y2ggYm9vbGVhbiBhdHRyaWJ1dGVzIG11c3QgYmUgc2V0IHRvIHRoZSBlcXVpdmFsZW50XG4vLyB0cnVzdGVkIGVtcHR5U2NyaXB0IHZhbHVlLlxuY29uc3QgZW1wdHlTdHJpbmdGb3JCb29sZWFuQXR0cmlidXRlID0gdHJ1c3RlZFR5cGVzXG4gICAgPyB0cnVzdGVkVHlwZXMuZW1wdHlTY3JpcHRcbiAgICA6ICcnO1xuY29uc3QgcG9seWZpbGxTdXBwb3J0ID0gREVWX01PREVcbiAgICA/IGdsb2JhbC5yZWFjdGl2ZUVsZW1lbnRQb2x5ZmlsbFN1cHBvcnREZXZNb2RlXG4gICAgOiBnbG9iYWwucmVhY3RpdmVFbGVtZW50UG9seWZpbGxTdXBwb3J0O1xuaWYgKERFVl9NT0RFKSB7XG4gICAgLy8gRW5zdXJlIHdhcm5pbmdzIGFyZSBpc3N1ZWQgb25seSAxeCwgZXZlbiBpZiBtdWx0aXBsZSB2ZXJzaW9ucyBvZiBMaXRcbiAgICAvLyBhcmUgbG9hZGVkLlxuICAgIGdsb2JhbC5saXRJc3N1ZWRXYXJuaW5ncyA/Pz0gbmV3IFNldCgpO1xuICAgIC8qKlxuICAgICAqIElzc3VlIGEgd2FybmluZyBpZiB3ZSBoYXZlbid0IGFscmVhZHksIGJhc2VkIGVpdGhlciBvbiBgY29kZWAgb3IgYHdhcm5pbmdgLlxuICAgICAqIFdhcm5pbmdzIGFyZSBkaXNhYmxlZCBhdXRvbWF0aWNhbGx5IG9ubHkgYnkgYHdhcm5pbmdgOyBkaXNhYmxpbmcgdmlhIGBjb2RlYFxuICAgICAqIGNhbiBiZSBkb25lIGJ5IHVzZXJzLlxuICAgICAqL1xuICAgIGlzc3VlV2FybmluZyA9IChjb2RlLCB3YXJuaW5nKSA9PiB7XG4gICAgICAgIHdhcm5pbmcgKz0gYCBTZWUgaHR0cHM6Ly9saXQuZGV2L21zZy8ke2NvZGV9IGZvciBtb3JlIGluZm9ybWF0aW9uLmA7XG4gICAgICAgIGlmICghZ2xvYmFsLmxpdElzc3VlZFdhcm5pbmdzLmhhcyh3YXJuaW5nKSAmJlxuICAgICAgICAgICAgIWdsb2JhbC5saXRJc3N1ZWRXYXJuaW5ncy5oYXMoY29kZSkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybih3YXJuaW5nKTtcbiAgICAgICAgICAgIGdsb2JhbC5saXRJc3N1ZWRXYXJuaW5ncy5hZGQod2FybmluZyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgaXNzdWVXYXJuaW5nKCdkZXYtbW9kZScsIGBMaXQgaXMgaW4gZGV2IG1vZGUuIE5vdCByZWNvbW1lbmRlZCBmb3IgcHJvZHVjdGlvbiFgKTtcbiAgICAgICAgLy8gSXNzdWUgcG9seWZpbGwgc3VwcG9ydCB3YXJuaW5nLlxuICAgICAgICBpZiAoZ2xvYmFsLlNoYWR5RE9NPy5pblVzZSAmJiBwb2x5ZmlsbFN1cHBvcnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaXNzdWVXYXJuaW5nKCdwb2x5ZmlsbC1zdXBwb3J0LW1pc3NpbmcnLCBgU2hhZG93IERPTSBpcyBiZWluZyBwb2x5ZmlsbGVkIHZpYSBcXGBTaGFkeURPTVxcYCBidXQgYCArXG4gICAgICAgICAgICAgICAgYHRoZSBcXGBwb2x5ZmlsbC1zdXBwb3J0XFxgIG1vZHVsZSBoYXMgbm90IGJlZW4gbG9hZGVkLmApO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4vKipcbiAqIFVzZWZ1bCBmb3IgdmlzdWFsaXppbmcgYW5kIGxvZ2dpbmcgaW5zaWdodHMgaW50byB3aGF0IHRoZSBMaXQgdGVtcGxhdGUgc3lzdGVtIGlzIGRvaW5nLlxuICpcbiAqIENvbXBpbGVkIG91dCBvZiBwcm9kIG1vZGUgYnVpbGRzLlxuICovXG5jb25zdCBkZWJ1Z0xvZ0V2ZW50ID0gREVWX01PREVcbiAgICA/IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBzaG91bGRFbWl0ID0gZ2xvYmFsXG4gICAgICAgICAgICAuZW1pdExpdERlYnVnTG9nRXZlbnRzO1xuICAgICAgICBpZiAoIXNob3VsZEVtaXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnbG9iYWwuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2xpdC1kZWJ1ZycsIHtcbiAgICAgICAgICAgIGRldGFpbDogZXZlbnQsXG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgOiB1bmRlZmluZWQ7XG4vKlxuICogV2hlbiB1c2luZyBDbG9zdXJlIENvbXBpbGVyLCBKU0NvbXBpbGVyX3JlbmFtZVByb3BlcnR5KHByb3BlcnR5LCBvYmplY3QpIGlzXG4gKiByZXBsYWNlZCBhdCBjb21waWxlIHRpbWUgYnkgdGhlIG11bmdlZCBuYW1lIGZvciBvYmplY3RbcHJvcGVydHldLiBXZSBjYW5ub3RcbiAqIGFsaWFzIHRoaXMgZnVuY3Rpb24sIHNvIHdlIGhhdmUgdG8gdXNlIGEgc21hbGwgc2hpbSB0aGF0IGhhcyB0aGUgc2FtZVxuICogYmVoYXZpb3Igd2hlbiBub3QgY29tcGlsaW5nLlxuICovXG4vKkBfX0lOTElORV9fKi9cbmNvbnN0IEpTQ29tcGlsZXJfcmVuYW1lUHJvcGVydHkgPSAocHJvcCwgX29iaikgPT4gcHJvcDtcbmV4cG9ydCBjb25zdCBkZWZhdWx0Q29udmVydGVyID0ge1xuICAgIHRvQXR0cmlidXRlKHZhbHVlLCB0eXBlKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBCb29sZWFuOlxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgPyBlbXB0eVN0cmluZ0ZvckJvb2xlYW5BdHRyaWJ1dGUgOiBudWxsO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBPYmplY3Q6XG4gICAgICAgICAgICBjYXNlIEFycmF5OlxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgcGFzcyB0aGlzIHRocm91Z2hcbiAgICAgICAgICAgICAgICAvLyB0byBhbGxvdyByZW1vdmluZy9ubyBjaGFuZ2UgYmVoYXZpb3IuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gdmFsdWUgOiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgZnJvbUF0dHJpYnV0ZSh2YWx1ZSwgdHlwZSkge1xuICAgICAgICBsZXQgZnJvbVZhbHVlID0gdmFsdWU7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBCb29sZWFuOlxuICAgICAgICAgICAgICAgIGZyb21WYWx1ZSA9IHZhbHVlICE9PSBudWxsO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOdW1iZXI6XG4gICAgICAgICAgICAgICAgZnJvbVZhbHVlID0gdmFsdWUgPT09IG51bGwgPyBudWxsIDogTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgICAgICAgY2FzZSBBcnJheTpcbiAgICAgICAgICAgICAgICAvLyBEbyAqbm90KiBnZW5lcmF0ZSBleGNlcHRpb24gd2hlbiBpbnZhbGlkIEpTT04gaXMgc2V0IGFzIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgLy8gZG9uJ3Qgbm9ybWFsbHkgY29tcGxhaW4gb24gYmVpbmcgbWlzLWNvbmZpZ3VyZWQuXG4gICAgICAgICAgICAgICAgLy8gVE9ETyhzb3J2ZWxsKTogRG8gZ2VuZXJhdGUgZXhjZXB0aW9uIGluICpkZXYgbW9kZSouXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzZXJ0IHRvIGFkaGVyZSB0byBCYXplbCdzIFwibXVzdCB0eXBlIGFzc2VydCBKU09OIHBhcnNlXCIgcnVsZS5cbiAgICAgICAgICAgICAgICAgICAgZnJvbVZhbHVlID0gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb21WYWx1ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmcm9tVmFsdWU7XG4gICAgfSxcbn07XG4vKipcbiAqIENoYW5nZSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdHJ1ZSBpZiBgdmFsdWVgIGlzIGRpZmZlcmVudCBmcm9tIGBvbGRWYWx1ZWAuXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGFzIHRoZSBkZWZhdWx0IGZvciBhIHByb3BlcnR5J3MgYGhhc0NoYW5nZWRgIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgY29uc3Qgbm90RXF1YWwgPSAodmFsdWUsIG9sZCkgPT4gIWlzKHZhbHVlLCBvbGQpO1xuY29uc3QgZGVmYXVsdFByb3BlcnR5RGVjbGFyYXRpb24gPSB7XG4gICAgYXR0cmlidXRlOiB0cnVlLFxuICAgIHR5cGU6IFN0cmluZyxcbiAgICBjb252ZXJ0ZXI6IGRlZmF1bHRDb252ZXJ0ZXIsXG4gICAgcmVmbGVjdDogZmFsc2UsXG4gICAgdXNlRGVmYXVsdDogZmFsc2UsXG4gICAgaGFzQ2hhbmdlZDogbm90RXF1YWwsXG59O1xuLy8gRW5zdXJlIG1ldGFkYXRhIGlzIGVuYWJsZWQuIFR5cGVTY3JpcHQgZG9lcyBub3QgcG9seWZpbGxcbi8vIFN5bWJvbC5tZXRhZGF0YSwgc28gd2UgbXVzdCBlbnN1cmUgdGhhdCBpdCBleGlzdHMuXG5TeW1ib2wubWV0YWRhdGEgPz89IFN5bWJvbCgnbWV0YWRhdGEnKTtcbi8vIE1hcCBmcm9tIGEgY2xhc3MncyBtZXRhZGF0YSBvYmplY3QgdG8gcHJvcGVydHkgb3B0aW9uc1xuLy8gTm90ZSB0aGF0IHdlIG11c3QgdXNlIG51bGxpc2gtY29hbGVzY2luZyBhc3NpZ25tZW50IHNvIHRoYXQgd2Ugb25seSB1c2Ugb25lXG4vLyBtYXAgZXZlbiBpZiB3ZSBsb2FkIG11bHRpcGxlIHZlcnNpb24gb2YgdGhpcyBtb2R1bGUuXG5nbG9iYWwubGl0UHJvcGVydHlNZXRhZGF0YSA/Pz0gbmV3IFdlYWtNYXAoKTtcbi8qKlxuICogQmFzZSBlbGVtZW50IGNsYXNzIHdoaWNoIG1hbmFnZXMgZWxlbWVudCBwcm9wZXJ0aWVzIGFuZCBhdHRyaWJ1dGVzLiBXaGVuXG4gKiBwcm9wZXJ0aWVzIGNoYW5nZSwgdGhlIGB1cGRhdGVgIG1ldGhvZCBpcyBhc3luY2hyb25vdXNseSBjYWxsZWQuIFRoaXMgbWV0aG9kXG4gKiBzaG91bGQgYmUgc3VwcGxpZWQgYnkgc3ViY2xhc3NlcyB0byByZW5kZXIgdXBkYXRlcyBhcyBkZXNpcmVkLlxuICogQG5vSW5oZXJpdERvY1xuICovXG5leHBvcnQgY2xhc3MgUmVhY3RpdmVFbGVtZW50XG4vLyBJbiB0aGUgTm9kZSBidWlsZCwgdGhpcyBgZXh0ZW5kc2AgY2xhdXNlIHdpbGwgYmUgc3Vic3RpdHV0ZWQgd2l0aFxuLy8gYChnbG9iYWxUaGlzLkhUTUxFbGVtZW50ID8/IEhUTUxFbGVtZW50KWAuXG4vL1xuLy8gVGhpcyB3YXksIHdlIHdpbGwgZmlyc3QgcHJlZmVyIGFueSBnbG9iYWwgYEhUTUxFbGVtZW50YCBwb2x5ZmlsbCB0aGF0IHRoZVxuLy8gdXNlciBoYXMgYXNzaWduZWQsIGFuZCB0aGVuIGZhbGwgYmFjayB0byB0aGUgYEhUTUxFbGVtZW50YCBzaGltIHdoaWNoIGhhc1xuLy8gYmVlbiBpbXBvcnRlZCAoc2VlIG5vdGUgYXQgdGhlIHRvcCBvZiB0aGlzIGZpbGUgYWJvdXQgaG93IHRoaXMgaW1wb3J0IGlzXG4vLyBnZW5lcmF0ZWQgYnkgUm9sbHVwKS4gTm90ZSB0aGF0IHRoZSBgSFRNTEVsZW1lbnRgIHZhcmlhYmxlIGhhcyBiZWVuXG4vLyBzaGFkb3dlZCBieSB0aGlzIGltcG9ydCwgc28gaXQgbm8gbG9uZ2VyIHJlZmVycyB0byB0aGUgZ2xvYmFsLlxuIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gaW5pdGlhbGl6ZXIgZnVuY3Rpb24gdG8gdGhlIGNsYXNzIHRoYXQgaXMgY2FsbGVkIGR1cmluZyBpbnN0YW5jZVxuICAgICAqIGNvbnN0cnVjdGlvbi5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgdXNlZnVsIGZvciBjb2RlIHRoYXQgcnVucyBhZ2FpbnN0IGEgYFJlYWN0aXZlRWxlbWVudGBcbiAgICAgKiBzdWJjbGFzcywgc3VjaCBhcyBhIGRlY29yYXRvciwgdGhhdCBuZWVkcyB0byBkbyB3b3JrIGZvciBlYWNoXG4gICAgICogaW5zdGFuY2UsIHN1Y2ggYXMgc2V0dGluZyB1cCBhIGBSZWFjdGl2ZUNvbnRyb2xsZXJgLlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBjb25zdCBteURlY29yYXRvciA9ICh0YXJnZXQ6IHR5cGVvZiBSZWFjdGl2ZUVsZW1lbnQsIGtleTogc3RyaW5nKSA9PiB7XG4gICAgICogICB0YXJnZXQuYWRkSW5pdGlhbGl6ZXIoKGluc3RhbmNlOiBSZWFjdGl2ZUVsZW1lbnQpID0+IHtcbiAgICAgKiAgICAgLy8gVGhpcyBpcyBydW4gZHVyaW5nIGNvbnN0cnVjdGlvbiBvZiB0aGUgZWxlbWVudFxuICAgICAqICAgICBuZXcgTXlDb250cm9sbGVyKGluc3RhbmNlKTtcbiAgICAgKiAgIH0pO1xuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIERlY29yYXRpbmcgYSBmaWVsZCB3aWxsIHRoZW4gY2F1c2UgZWFjaCBpbnN0YW5jZSB0byBydW4gYW4gaW5pdGlhbGl6ZXJcbiAgICAgKiB0aGF0IGFkZHMgYSBjb250cm9sbGVyOlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICAgKiAgIEBteURlY29yYXRvciBmb287XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogSW5pdGlhbGl6ZXJzIGFyZSBzdG9yZWQgcGVyLWNvbnN0cnVjdG9yLiBBZGRpbmcgYW4gaW5pdGlhbGl6ZXIgdG8gYVxuICAgICAqIHN1YmNsYXNzIGRvZXMgbm90IGFkZCBpdCB0byBhIHN1cGVyY2xhc3MuIFNpbmNlIGluaXRpYWxpemVycyBhcmUgcnVuIGluXG4gICAgICogY29uc3RydWN0b3JzLCBpbml0aWFsaXplcnMgd2lsbCBydW4gaW4gb3JkZXIgb2YgdGhlIGNsYXNzIGhpZXJhcmNoeSxcbiAgICAgKiBzdGFydGluZyB3aXRoIHN1cGVyY2xhc3NlcyBhbmQgcHJvZ3Jlc3NpbmcgdG8gdGhlIGluc3RhbmNlJ3MgY2xhc3MuXG4gICAgICpcbiAgICAgKiBAbm9jb2xsYXBzZVxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRJbml0aWFsaXplcihpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLl9fcHJlcGFyZSgpO1xuICAgICAgICAodGhpcy5faW5pdGlhbGl6ZXJzID8/PSBbXSkucHVzaChpbml0aWFsaXplcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIGF0dHJpYnV0ZXMgY29ycmVzcG9uZGluZyB0byB0aGUgcmVnaXN0ZXJlZCBwcm9wZXJ0aWVzLlxuICAgICAqIEBub2NvbGxhcHNlXG4gICAgICogQGNhdGVnb3J5IGF0dHJpYnV0ZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgLy8gRW5zdXJlIHdlJ3ZlIGNyZWF0ZWQgYWxsIHByb3BlcnRpZXNcbiAgICAgICAgdGhpcy5maW5hbGl6ZSgpO1xuICAgICAgICAvLyB0aGlzLl9fYXR0cmlidXRlVG9Qcm9wZXJ0eU1hcCBpcyBvbmx5IHVuZGVmaW5lZCBhZnRlciBmaW5hbGl6ZSgpIGluXG4gICAgICAgIC8vIFJlYWN0aXZlRWxlbWVudCBpdHNlbGYuIFJlYWN0aXZlRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXMgaXMgb25seVxuICAgICAgICAvLyBhY2Nlc3NlZCB3aXRoIFJlYWN0aXZlRWxlbWVudCBhcyB0aGUgcmVjZWl2ZXIgd2hlbiBhIHN1YmNsYXNzIG9yIG1peGluXG4gICAgICAgIC8vIGNhbGxzIHN1cGVyLm9ic2VydmVkQXR0cmlidXRlc1xuICAgICAgICByZXR1cm4gKHRoaXMuX19hdHRyaWJ1dGVUb1Byb3BlcnR5TWFwICYmIFsuLi50aGlzLl9fYXR0cmlidXRlVG9Qcm9wZXJ0eU1hcC5rZXlzKCldKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHByb3BlcnR5IGFjY2Vzc29yIG9uIHRoZSBlbGVtZW50IHByb3RvdHlwZSBpZiBvbmUgZG9lcyBub3QgZXhpc3RcbiAgICAgKiBhbmQgc3RvcmVzIGEge0BsaW5rY29kZSBQcm9wZXJ0eURlY2xhcmF0aW9ufSBmb3IgdGhlIHByb3BlcnR5IHdpdGggdGhlXG4gICAgICogZ2l2ZW4gb3B0aW9ucy4gVGhlIHByb3BlcnR5IHNldHRlciBjYWxscyB0aGUgcHJvcGVydHkncyBgaGFzQ2hhbmdlZGBcbiAgICAgKiBwcm9wZXJ0eSBvcHRpb24gb3IgdXNlcyBhIHN0cmljdCBpZGVudGl0eSBjaGVjayB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAgICAgKiB0byByZXF1ZXN0IGFuIHVwZGF0ZS5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIG1heSBiZSBvdmVycmlkZGVuIHRvIGN1c3RvbWl6ZSBwcm9wZXJ0aWVzOyBob3dldmVyLFxuICAgICAqIHdoZW4gZG9pbmcgc28sIGl0J3MgaW1wb3J0YW50IHRvIGNhbGwgYHN1cGVyLmNyZWF0ZVByb3BlcnR5YCB0byBlbnN1cmVcbiAgICAgKiB0aGUgcHJvcGVydHkgaXMgc2V0dXAgY29ycmVjdGx5LiBUaGlzIG1ldGhvZCBjYWxsc1xuICAgICAqIGBnZXRQcm9wZXJ0eURlc2NyaXB0b3JgIGludGVybmFsbHkgdG8gZ2V0IGEgZGVzY3JpcHRvciB0byBpbnN0YWxsLlxuICAgICAqIFRvIGN1c3RvbWl6ZSB3aGF0IHByb3BlcnRpZXMgZG8gd2hlbiB0aGV5IGFyZSBnZXQgb3Igc2V0LCBvdmVycmlkZVxuICAgICAqIGBnZXRQcm9wZXJ0eURlc2NyaXB0b3JgLiBUbyBjdXN0b21pemUgdGhlIG9wdGlvbnMgZm9yIGEgcHJvcGVydHksXG4gICAgICogaW1wbGVtZW50IGBjcmVhdGVQcm9wZXJ0eWAgbGlrZSB0aGlzOlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBzdGF0aWMgY3JlYXRlUHJvcGVydHkobmFtZSwgb3B0aW9ucykge1xuICAgICAqICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24ob3B0aW9ucywge215T3B0aW9uOiB0cnVlfSk7XG4gICAgICogICBzdXBlci5jcmVhdGVQcm9wZXJ0eShuYW1lLCBvcHRpb25zKTtcbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAbm9jb2xsYXBzZVxuICAgICAqIEBjYXRlZ29yeSBwcm9wZXJ0aWVzXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZVByb3BlcnR5KG5hbWUsIG9wdGlvbnMgPSBkZWZhdWx0UHJvcGVydHlEZWNsYXJhdGlvbikge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIGEgc3RhdGUgcHJvcGVydHksIGZvcmNlIHRoZSBhdHRyaWJ1dGUgdG8gZmFsc2UuXG4gICAgICAgIGlmIChvcHRpb25zLnN0YXRlKSB7XG4gICAgICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19wcmVwYXJlKCk7XG4gICAgICAgIC8vIFdoZXRoZXIgdGhpcyBwcm9wZXJ0eSBpcyB3cmFwcGluZyBhY2Nlc3NvcnMuXG4gICAgICAgIC8vIEhlbHBzIGNvbnRyb2wgdGhlIGluaXRpYWwgdmFsdWUgY2hhbmdlIGFuZCByZWZsZWN0aW9uIGxvZ2ljLlxuICAgICAgICBpZiAodGhpcy5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgb3B0aW9ucy53cmFwcGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsZW1lbnRQcm9wZXJ0aWVzLnNldChuYW1lLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKCFvcHRpb25zLm5vQWNjZXNzb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IERFVl9NT0RFXG4gICAgICAgICAgICAgICAgPyAvLyBVc2UgU3ltYm9sLmZvciBpbiBkZXYgbW9kZSB0byBtYWtlIGl0IGVhc2llciB0byBtYWludGFpbiBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIGRvaW5nIEhNUi5cbiAgICAgICAgICAgICAgICAgICAgU3ltYm9sLmZvcihgJHtTdHJpbmcobmFtZSl9IChAcHJvcGVydHkoKSBjYWNoZSlgKVxuICAgICAgICAgICAgICAgIDogU3ltYm9sKCk7XG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdG9yID0gdGhpcy5nZXRQcm9wZXJ0eURlc2NyaXB0b3IobmFtZSwga2V5LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwgbmFtZSwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHByb3BlcnR5IGRlc2NyaXB0b3IgdG8gYmUgZGVmaW5lZCBvbiB0aGUgZ2l2ZW4gbmFtZWQgcHJvcGVydHkuXG4gICAgICogSWYgbm8gZGVzY3JpcHRvciBpcyByZXR1cm5lZCwgdGhlIHByb3BlcnR5IHdpbGwgbm90IGJlY29tZSBhbiBhY2Nlc3Nvci5cbiAgICAgKiBGb3IgZXhhbXBsZSxcbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgICogICBzdGF0aWMgZ2V0UHJvcGVydHlEZXNjcmlwdG9yKG5hbWUsIGtleSwgb3B0aW9ucykge1xuICAgICAqICAgICBjb25zdCBkZWZhdWx0RGVzY3JpcHRvciA9XG4gICAgICogICAgICAgICBzdXBlci5nZXRQcm9wZXJ0eURlc2NyaXB0b3IobmFtZSwga2V5LCBvcHRpb25zKTtcbiAgICAgKiAgICAgY29uc3Qgc2V0dGVyID0gZGVmYXVsdERlc2NyaXB0b3Iuc2V0O1xuICAgICAqICAgICByZXR1cm4ge1xuICAgICAqICAgICAgIGdldDogZGVmYXVsdERlc2NyaXB0b3IuZ2V0LFxuICAgICAqICAgICAgIHNldCh2YWx1ZSkge1xuICAgICAqICAgICAgICAgc2V0dGVyLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAqICAgICAgICAgLy8gY3VzdG9tIGFjdGlvbi5cbiAgICAgKiAgICAgICB9LFxuICAgICAqICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgKiAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICogICAgIH1cbiAgICAgKiAgIH1cbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAbm9jb2xsYXBzZVxuICAgICAqIEBjYXRlZ29yeSBwcm9wZXJ0aWVzXG4gICAgICovXG4gICAgc3RhdGljIGdldFByb3BlcnR5RGVzY3JpcHRvcihuYW1lLCBrZXksIG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgeyBnZXQsIHNldCB9ID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRoaXMucHJvdG90eXBlLCBuYW1lKSA/PyB7XG4gICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNba2V5XTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodikge1xuICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IHY7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoREVWX01PREUgJiYgZ2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgIGlmICgndmFsdWUnIGluIChnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGhpcy5wcm90b3R5cGUsIG5hbWUpID8/IHt9KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmllbGQgJHtKU09OLnN0cmluZ2lmeShTdHJpbmcobmFtZSkpfSBvbiBgICtcbiAgICAgICAgICAgICAgICAgICAgYCR7dGhpcy5uYW1lfSB3YXMgZGVjbGFyZWQgYXMgYSByZWFjdGl2ZSBwcm9wZXJ0eSBgICtcbiAgICAgICAgICAgICAgICAgICAgYGJ1dCBpdCdzIGFjdHVhbGx5IGRlY2xhcmVkIGFzIGEgdmFsdWUgb24gdGhlIHByb3RvdHlwZS4gYCArXG4gICAgICAgICAgICAgICAgICAgIGBVc3VhbGx5IHRoaXMgaXMgZHVlIHRvIHVzaW5nIEBwcm9wZXJ0eSBvciBAc3RhdGUgb24gYSBtZXRob2QuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpc3N1ZVdhcm5pbmcoJ3JlYWN0aXZlLXByb3BlcnR5LXdpdGhvdXQtZ2V0dGVyJywgYEZpZWxkICR7SlNPTi5zdHJpbmdpZnkoU3RyaW5nKG5hbWUpKX0gb24gYCArXG4gICAgICAgICAgICAgICAgYCR7dGhpcy5uYW1lfSB3YXMgZGVjbGFyZWQgYXMgYSByZWFjdGl2ZSBwcm9wZXJ0eSBgICtcbiAgICAgICAgICAgICAgICBgYnV0IGl0IGRvZXMgbm90IGhhdmUgYSBnZXR0ZXIuIFRoaXMgd2lsbCBiZSBhbiBlcnJvciBpbiBhIGAgK1xuICAgICAgICAgICAgICAgIGBmdXR1cmUgdmVyc2lvbiBvZiBMaXQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldCxcbiAgICAgICAgICAgIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gZ2V0Py5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIHNldD8uY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0VXBkYXRlKG5hbWUsIG9sZFZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwcm9wZXJ0eSBvcHRpb25zIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gcHJvcGVydHkuXG4gICAgICogVGhlc2Ugb3B0aW9ucyBhcmUgZGVmaW5lZCB3aXRoIGEgYFByb3BlcnR5RGVjbGFyYXRpb25gIHZpYSB0aGUgYHByb3BlcnRpZXNgXG4gICAgICogb2JqZWN0IG9yIHRoZSBgQHByb3BlcnR5YCBkZWNvcmF0b3IgYW5kIGFyZSByZWdpc3RlcmVkIGluXG4gICAgICogYGNyZWF0ZVByb3BlcnR5KC4uLilgLlxuICAgICAqXG4gICAgICogTm90ZSwgdGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNvbnNpZGVyZWQgXCJmaW5hbFwiIGFuZCBub3Qgb3ZlcnJpZGRlbi4gVG9cbiAgICAgKiBjdXN0b21pemUgdGhlIG9wdGlvbnMgZm9yIGEgZ2l2ZW4gcHJvcGVydHksIG92ZXJyaWRlXG4gICAgICoge0BsaW5rY29kZSBjcmVhdGVQcm9wZXJ0eX0uXG4gICAgICpcbiAgICAgKiBAbm9jb2xsYXBzZVxuICAgICAqIEBmaW5hbFxuICAgICAqIEBjYXRlZ29yeSBwcm9wZXJ0aWVzXG4gICAgICovXG4gICAgc3RhdGljIGdldFByb3BlcnR5T3B0aW9ucyhuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRQcm9wZXJ0aWVzLmdldChuYW1lKSA/PyBkZWZhdWx0UHJvcGVydHlEZWNsYXJhdGlvbjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgc3RhdGljIG93biBwcm9wZXJ0aWVzIG9mIHRoZSBjbGFzcyB1c2VkIGluIGJvb2trZWVwaW5nXG4gICAgICogZm9yIGVsZW1lbnQgcHJvcGVydGllcywgaW5pdGlhbGl6ZXJzLCBldGMuXG4gICAgICpcbiAgICAgKiBDYW4gYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzIGJ5IGNvZGUgdGhhdCBuZWVkcyB0byBlbnN1cmUgdGhlc2VcbiAgICAgKiBwcm9wZXJ0aWVzIGV4aXN0IGJlZm9yZSB1c2luZyB0aGVtLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgZW5zdXJlcyB0aGUgc3VwZXJjbGFzcyBpcyBmaW5hbGl6ZWQgc28gdGhhdCBpbmhlcml0ZWRcbiAgICAgKiBwcm9wZXJ0eSBtZXRhZGF0YSBjYW4gYmUgY29waWVkIGRvd24uXG4gICAgICogQG5vY29sbGFwc2VcbiAgICAgKi9cbiAgICBzdGF0aWMgX19wcmVwYXJlKCkge1xuICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShKU0NvbXBpbGVyX3JlbmFtZVByb3BlcnR5KCdlbGVtZW50UHJvcGVydGllcycsIHRoaXMpKSkge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBwcmVwYXJlZFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZpbmFsaXplIGFueSBzdXBlcmNsYXNzZXNcbiAgICAgICAgY29uc3Qgc3VwZXJDdG9yID0gZ2V0UHJvdG90eXBlT2YodGhpcyk7XG4gICAgICAgIHN1cGVyQ3Rvci5maW5hbGl6ZSgpO1xuICAgICAgICAvLyBDcmVhdGUgb3duIHNldCBvZiBpbml0aWFsaXplcnMgZm9yIHRoaXMgY2xhc3MgaWYgYW55IGV4aXN0IG9uIHRoZVxuICAgICAgICAvLyBzdXBlcmNsYXNzIGFuZCBjb3B5IHRoZW0gZG93bi4gTm90ZSwgZm9yIGEgc21hbGwgcGVyZiBib29zdCwgYXZvaWRcbiAgICAgICAgLy8gY3JlYXRpbmcgaW5pdGlhbGl6ZXJzIHVubGVzcyBuZWVkZWQuXG4gICAgICAgIGlmIChzdXBlckN0b3IuX2luaXRpYWxpemVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0aWFsaXplcnMgPSBbLi4uc3VwZXJDdG9yLl9pbml0aWFsaXplcnNdO1xuICAgICAgICB9XG4gICAgICAgIC8vIEluaXRpYWxpemUgZWxlbWVudFByb3BlcnRpZXMgZnJvbSB0aGUgc3VwZXJjbGFzc1xuICAgICAgICB0aGlzLmVsZW1lbnRQcm9wZXJ0aWVzID0gbmV3IE1hcChzdXBlckN0b3IuZWxlbWVudFByb3BlcnRpZXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBGaW5pc2hlcyBzZXR0aW5nIHVwIHRoZSBjbGFzcyBzbyB0aGF0IGl0J3MgcmVhZHkgdG8gYmUgcmVnaXN0ZXJlZFxuICAgICAqIGFzIGEgY3VzdG9tIGVsZW1lbnQgYW5kIGluc3RhbnRpYXRlZC5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBieSB0aGUgUmVhY3RpdmVFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlcyBnZXR0ZXIuXG4gICAgICogSWYgeW91IG92ZXJyaWRlIHRoZSBvYnNlcnZlZEF0dHJpYnV0ZXMgZ2V0dGVyLCB5b3UgbXVzdCBlaXRoZXIgY2FsbFxuICAgICAqIHN1cGVyLm9ic2VydmVkQXR0cmlidXRlcyB0byB0cmlnZ2VyIGZpbmFsaXphdGlvbiwgb3IgY2FsbCBmaW5hbGl6ZSgpXG4gICAgICogeW91cnNlbGYuXG4gICAgICpcbiAgICAgKiBAbm9jb2xsYXBzZVxuICAgICAqL1xuICAgIHN0YXRpYyBmaW5hbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoSlNDb21waWxlcl9yZW5hbWVQcm9wZXJ0eSgnZmluYWxpemVkJywgdGhpcykpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maW5hbGl6ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9fcHJlcGFyZSgpO1xuICAgICAgICAvLyBDcmVhdGUgcHJvcGVydGllcyBmcm9tIHRoZSBzdGF0aWMgcHJvcGVydGllcyBibG9jazpcbiAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoSlNDb21waWxlcl9yZW5hbWVQcm9wZXJ0eSgncHJvcGVydGllcycsIHRoaXMpKSkge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnByb3BlcnRpZXM7XG4gICAgICAgICAgICBjb25zdCBwcm9wS2V5cyA9IFtcbiAgICAgICAgICAgICAgICAuLi5nZXRPd25Qcm9wZXJ0eU5hbWVzKHByb3BzKSxcbiAgICAgICAgICAgICAgICAuLi5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocHJvcHMpLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcCBvZiBwcm9wS2V5cykge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlUHJvcGVydHkocCwgcHJvcHNbcF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSBwcm9wZXJ0aWVzIGZyb20gc3RhbmRhcmQgZGVjb3JhdG9yIG1ldGFkYXRhOlxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXNbU3ltYm9sLm1ldGFkYXRhXTtcbiAgICAgICAgaWYgKG1ldGFkYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0aWVzID0gbGl0UHJvcGVydHlNZXRhZGF0YS5nZXQobWV0YWRhdGEpO1xuICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW3AsIG9wdGlvbnNdIG9mIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50UHJvcGVydGllcy5zZXQocCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgYXR0cmlidXRlLXRvLXByb3BlcnR5IG1hcFxuICAgICAgICB0aGlzLl9fYXR0cmlidXRlVG9Qcm9wZXJ0eU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChjb25zdCBbcCwgb3B0aW9uc10gb2YgdGhpcy5lbGVtZW50UHJvcGVydGllcykge1xuICAgICAgICAgICAgY29uc3QgYXR0ciA9IHRoaXMuX19hdHRyaWJ1dGVOYW1lRm9yUHJvcGVydHkocCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoYXR0ciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2F0dHJpYnV0ZVRvUHJvcGVydHlNYXAuc2V0KGF0dHIsIHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxlbWVudFN0eWxlcyA9IHRoaXMuZmluYWxpemVTdHlsZXModGhpcy5zdHlsZXMpO1xuICAgICAgICBpZiAoREVWX01PREUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KCdjcmVhdGVQcm9wZXJ0eScpKSB7XG4gICAgICAgICAgICAgICAgaXNzdWVXYXJuaW5nKCduby1vdmVycmlkZS1jcmVhdGUtcHJvcGVydHknLCAnT3ZlcnJpZGluZyBSZWFjdGl2ZUVsZW1lbnQuY3JlYXRlUHJvcGVydHkoKSBpcyBkZXByZWNhdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1RoZSBvdmVycmlkZSB3aWxsIG5vdCBiZSBjYWxsZWQgd2l0aCBzdGFuZGFyZCBkZWNvcmF0b3JzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnZ2V0UHJvcGVydHlEZXNjcmlwdG9yJykpIHtcbiAgICAgICAgICAgICAgICBpc3N1ZVdhcm5pbmcoJ25vLW92ZXJyaWRlLWdldC1wcm9wZXJ0eS1kZXNjcmlwdG9yJywgJ092ZXJyaWRpbmcgUmVhY3RpdmVFbGVtZW50LmdldFByb3BlcnR5RGVzY3JpcHRvcigpIGlzIGRlcHJlY2F0ZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVGhlIG92ZXJyaWRlIHdpbGwgbm90IGJlIGNhbGxlZCB3aXRoIHN0YW5kYXJkIGRlY29yYXRvcnMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBUYWtlcyB0aGUgc3R5bGVzIHRoZSB1c2VyIHN1cHBsaWVkIHZpYSB0aGUgYHN0YXRpYyBzdHlsZXNgIHByb3BlcnR5IGFuZFxuICAgICAqIHJldHVybnMgdGhlIGFycmF5IG9mIHN0eWxlcyB0byBhcHBseSB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBPdmVycmlkZSB0aGlzIG1ldGhvZCB0byBpbnRlZ3JhdGUgaW50byBhIHN0eWxlIG1hbmFnZW1lbnQgc3lzdGVtLlxuICAgICAqXG4gICAgICogU3R5bGVzIGFyZSBkZWR1cGxpY2F0ZWQgcHJlc2VydmluZyB0aGUgX2xhc3RfIGluc3RhbmNlIGluIHRoZSBsaXN0LiBUaGlzXG4gICAgICogaXMgYSBwZXJmb3JtYW5jZSBvcHRpbWl6YXRpb24gdG8gYXZvaWQgZHVwbGljYXRlZCBzdHlsZXMgdGhhdCBjYW4gb2NjdXJcbiAgICAgKiBlc3BlY2lhbGx5IHdoZW4gY29tcG9zaW5nIHZpYSBzdWJjbGFzc2luZy4gVGhlIGxhc3QgaXRlbSBpcyBrZXB0IHRvIHRyeVxuICAgICAqIHRvIHByZXNlcnZlIHRoZSBjYXNjYWRlIG9yZGVyIHdpdGggdGhlIGFzc3VtcHRpb24gdGhhdCBpdCdzIG1vc3QgaW1wb3J0YW50XG4gICAgICogdGhhdCBsYXN0IGFkZGVkIHN0eWxlcyBvdmVycmlkZSBwcmV2aW91cyBzdHlsZXMuXG4gICAgICpcbiAgICAgKiBAbm9jb2xsYXBzZVxuICAgICAqIEBjYXRlZ29yeSBzdHlsZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgZmluYWxpemVTdHlsZXMoc3R5bGVzKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnRTdHlsZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc3R5bGVzKSkge1xuICAgICAgICAgICAgLy8gRGVkdXBlIHRoZSBmbGF0dGVuZWQgYXJyYXkgaW4gcmV2ZXJzZSBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgbGFzdCBpdGVtcy5cbiAgICAgICAgICAgIC8vIENhc3RpbmcgdG8gQXJyYXk8dW5rbm93bj4gd29ya3MgYXJvdW5kIFRTIGVycm9yIHRoYXRcbiAgICAgICAgICAgIC8vIGFwcGVhcnMgdG8gY29tZSBmcm9tIHRyeWluZyB0byBmbGF0dGVuIGEgdHlwZSBDU1NSZXN1bHRBcnJheS5cbiAgICAgICAgICAgIGNvbnN0IHNldCA9IG5ldyBTZXQoc3R5bGVzLmZsYXQoSW5maW5pdHkpLnJldmVyc2UoKSk7XG4gICAgICAgICAgICAvLyBUaGVuIHByZXNlcnZlIG9yaWdpbmFsIG9yZGVyIGJ5IGFkZGluZyB0aGUgc2V0IGl0ZW1zIGluIHJldmVyc2Ugb3JkZXIuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHMgb2Ygc2V0KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudFN0eWxlcy51bnNoaWZ0KGdldENvbXBhdGlibGVTdHlsZShzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3R5bGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGVsZW1lbnRTdHlsZXMucHVzaChnZXRDb21wYXRpYmxlU3R5bGUoc3R5bGVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnRTdHlsZXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHByb3BlcnR5IG5hbWUgZm9yIHRoZSBnaXZlbiBhdHRyaWJ1dGUgYG5hbWVgLlxuICAgICAqIEBub2NvbGxhcHNlXG4gICAgICovXG4gICAgc3RhdGljIF9fYXR0cmlidXRlTmFtZUZvclByb3BlcnR5KG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgYXR0cmlidXRlID0gb3B0aW9ucy5hdHRyaWJ1dGU7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGUgPT09IGZhbHNlXG4gICAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgICAgOiB0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgID8gYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgOiB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyBuYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9faW5zdGFuY2VQcm9wZXJ0aWVzID0gdW5kZWZpbmVkO1xuICAgICAgICAvKipcbiAgICAgICAgICogVHJ1ZSBpZiB0aGVyZSBpcyBhIHBlbmRpbmcgdXBkYXRlIGFzIGEgcmVzdWx0IG9mIGNhbGxpbmcgYHJlcXVlc3RVcGRhdGUoKWAuXG4gICAgICAgICAqIFNob3VsZCBvbmx5IGJlIHJlYWQuXG4gICAgICAgICAqIEBjYXRlZ29yeSB1cGRhdGVzXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzVXBkYXRlUGVuZGluZyA9IGZhbHNlO1xuICAgICAgICAvKipcbiAgICAgICAgICogSXMgc2V0IHRvIGB0cnVlYCBhZnRlciB0aGUgZmlyc3QgdXBkYXRlLiBUaGUgZWxlbWVudCBjb2RlIGNhbm5vdCBhc3N1bWVcbiAgICAgICAgICogdGhhdCBgcmVuZGVyUm9vdGAgZXhpc3RzIGJlZm9yZSB0aGUgZWxlbWVudCBgaGFzVXBkYXRlZGAuXG4gICAgICAgICAqIEBjYXRlZ29yeSB1cGRhdGVzXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmhhc1VwZGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5hbWUgb2YgY3VycmVudGx5IHJlZmxlY3RpbmcgcHJvcGVydHlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX19yZWZsZWN0aW5nUHJvcGVydHkgPSBudWxsO1xuICAgICAgICB0aGlzLl9faW5pdGlhbGl6ZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBvbmx5IG92ZXJyaWRlIHBvaW50IGZvciBjdXN0b21pemluZyB3b3JrIGRvbmUgd2hlbiBlbGVtZW50c1xuICAgICAqIGFyZSBjb25zdHJ1Y3RlZC5cbiAgICAgKi9cbiAgICBfX2luaXRpYWxpemUoKSB7XG4gICAgICAgIHRoaXMuX191cGRhdGVQcm9taXNlID0gbmV3IFByb21pc2UoKHJlcykgPT4gKHRoaXMuZW5hYmxlVXBkYXRpbmcgPSByZXMpKTtcbiAgICAgICAgdGhpcy5fJGNoYW5nZWRQcm9wZXJ0aWVzID0gbmV3IE1hcCgpO1xuICAgICAgICAvLyBUaGlzIGVucXVldWVzIGEgbWljcm90YXNrIHRoYXQgbXVzdCBydW4gYmVmb3JlIHRoZSBmaXJzdCB1cGRhdGUsIHNvIGl0XG4gICAgICAgIC8vIG11c3QgYmUgY2FsbGVkIGJlZm9yZSByZXF1ZXN0VXBkYXRlKClcbiAgICAgICAgdGhpcy5fX3NhdmVJbnN0YW5jZVByb3BlcnRpZXMoKTtcbiAgICAgICAgLy8gZW5zdXJlcyBmaXJzdCB1cGRhdGUgd2lsbCBiZSBjYXVnaHQgYnkgYW4gZWFybHkgYWNjZXNzIG9mXG4gICAgICAgIC8vIGB1cGRhdGVDb21wbGV0ZWBcbiAgICAgICAgdGhpcy5yZXF1ZXN0VXBkYXRlKCk7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IuX2luaXRpYWxpemVycz8uZm9yRWFjaCgoaSkgPT4gaSh0aGlzKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhIGBSZWFjdGl2ZUNvbnRyb2xsZXJgIHRvIHBhcnRpY2lwYXRlIGluIHRoZSBlbGVtZW50J3MgcmVhY3RpdmVcbiAgICAgKiB1cGRhdGUgY3ljbGUuIFRoZSBlbGVtZW50IGF1dG9tYXRpY2FsbHkgY2FsbHMgaW50byBhbnkgcmVnaXN0ZXJlZFxuICAgICAqIGNvbnRyb2xsZXJzIGR1cmluZyBpdHMgbGlmZWN5Y2xlIGNhbGxiYWNrcy5cbiAgICAgKlxuICAgICAqIElmIHRoZSBlbGVtZW50IGlzIGNvbm5lY3RlZCB3aGVuIGBhZGRDb250cm9sbGVyKClgIGlzIGNhbGxlZCwgdGhlXG4gICAgICogY29udHJvbGxlcidzIGBob3N0Q29ubmVjdGVkKClgIGNhbGxiYWNrIHdpbGwgYmUgaW1tZWRpYXRlbHkgY2FsbGVkLlxuICAgICAqIEBjYXRlZ29yeSBjb250cm9sbGVyc1xuICAgICAqL1xuICAgIGFkZENvbnRyb2xsZXIoY29udHJvbGxlcikge1xuICAgICAgICAodGhpcy5fX2NvbnRyb2xsZXJzID8/PSBuZXcgU2V0KCkpLmFkZChjb250cm9sbGVyKTtcbiAgICAgICAgLy8gSWYgYSBjb250cm9sbGVyIGlzIGFkZGVkIGFmdGVyIHRoZSBlbGVtZW50IGhhcyBiZWVuIGNvbm5lY3RlZCxcbiAgICAgICAgLy8gY2FsbCBob3N0Q29ubmVjdGVkLiBOb3RlLCByZS11c2luZyBleGlzdGVuY2Ugb2YgYHJlbmRlclJvb3RgIGhlcmVcbiAgICAgICAgLy8gKHdoaWNoIGlzIHNldCBpbiBjb25uZWN0ZWRDYWxsYmFjaykgdG8gYXZvaWQgdGhlIG5lZWQgdG8gdHJhY2sgYVxuICAgICAgICAvLyBmaXJzdCBjb25uZWN0ZWQgc3RhdGUuXG4gICAgICAgIGlmICh0aGlzLnJlbmRlclJvb3QgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLmhvc3RDb25uZWN0ZWQ/LigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYSBgUmVhY3RpdmVDb250cm9sbGVyYCBmcm9tIHRoZSBlbGVtZW50LlxuICAgICAqIEBjYXRlZ29yeSBjb250cm9sbGVyc1xuICAgICAqL1xuICAgIHJlbW92ZUNvbnRyb2xsZXIoY29udHJvbGxlcikge1xuICAgICAgICB0aGlzLl9fY29udHJvbGxlcnM/LmRlbGV0ZShjb250cm9sbGVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRml4ZXMgYW55IHByb3BlcnRpZXMgc2V0IG9uIHRoZSBpbnN0YW5jZSBiZWZvcmUgdXBncmFkZSB0aW1lLlxuICAgICAqIE90aGVyd2lzZSB0aGVzZSB3b3VsZCBzaGFkb3cgdGhlIGFjY2Vzc29yIGFuZCBicmVhayB0aGVzZSBwcm9wZXJ0aWVzLlxuICAgICAqIFRoZSBwcm9wZXJ0aWVzIGFyZSBzdG9yZWQgaW4gYSBNYXAgd2hpY2ggaXMgcGxheWVkIGJhY2sgYWZ0ZXIgdGhlXG4gICAgICogY29uc3RydWN0b3IgcnVucy5cbiAgICAgKi9cbiAgICBfX3NhdmVJbnN0YW5jZVByb3BlcnRpZXMoKSB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlUHJvcGVydGllcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgY29uc3QgZWxlbWVudFByb3BlcnRpZXMgPSB0aGlzLmNvbnN0cnVjdG9yXG4gICAgICAgICAgICAuZWxlbWVudFByb3BlcnRpZXM7XG4gICAgICAgIGZvciAoY29uc3QgcCBvZiBlbGVtZW50UHJvcGVydGllcy5rZXlzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2VQcm9wZXJ0aWVzLnNldChwLCB0aGlzW3BdKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1twXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5zdGFuY2VQcm9wZXJ0aWVzLnNpemUgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9faW5zdGFuY2VQcm9wZXJ0aWVzID0gaW5zdGFuY2VQcm9wZXJ0aWVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5vZGUgaW50byB3aGljaCB0aGUgZWxlbWVudCBzaG91bGQgcmVuZGVyIGFuZCBieSBkZWZhdWx0XG4gICAgICogY3JlYXRlcyBhbmQgcmV0dXJucyBhbiBvcGVuIHNoYWRvd1Jvb3QuIEltcGxlbWVudCB0byBjdXN0b21pemUgd2hlcmUgdGhlXG4gICAgICogZWxlbWVudCdzIERPTSBpcyByZW5kZXJlZC4gRm9yIGV4YW1wbGUsIHRvIHJlbmRlciBpbnRvIHRoZSBlbGVtZW50J3NcbiAgICAgKiBjaGlsZE5vZGVzLCByZXR1cm4gYHRoaXNgLlxuICAgICAqXG4gICAgICogQHJldHVybiBSZXR1cm5zIGEgbm9kZSBpbnRvIHdoaWNoIHRvIHJlbmRlci5cbiAgICAgKiBAY2F0ZWdvcnkgcmVuZGVyaW5nXG4gICAgICovXG4gICAgY3JlYXRlUmVuZGVyUm9vdCgpIHtcbiAgICAgICAgY29uc3QgcmVuZGVyUm9vdCA9IHRoaXMuc2hhZG93Um9vdCA/P1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3codGhpcy5jb25zdHJ1Y3Rvci5zaGFkb3dSb290T3B0aW9ucyk7XG4gICAgICAgIGFkb3B0U3R5bGVzKHJlbmRlclJvb3QsIHRoaXMuY29uc3RydWN0b3IuZWxlbWVudFN0eWxlcyk7XG4gICAgICAgIHJldHVybiByZW5kZXJSb290O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBPbiBmaXJzdCBjb25uZWN0aW9uLCBjcmVhdGVzIHRoZSBlbGVtZW50J3MgcmVuZGVyUm9vdCwgc2V0cyB1cFxuICAgICAqIGVsZW1lbnQgc3R5bGluZywgYW5kIGVuYWJsZXMgdXBkYXRpbmcuXG4gICAgICogQGNhdGVnb3J5IGxpZmVjeWNsZVxuICAgICAqL1xuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAvLyBDcmVhdGUgcmVuZGVyUm9vdCBiZWZvcmUgY29udHJvbGxlcnMgYGhvc3RDb25uZWN0ZWRgXG4gICAgICAgIHRoaXMucmVuZGVyUm9vdCA/Pz1cbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVuZGVyUm9vdCgpO1xuICAgICAgICB0aGlzLmVuYWJsZVVwZGF0aW5nKHRydWUpO1xuICAgICAgICB0aGlzLl9fY29udHJvbGxlcnM/LmZvckVhY2goKGMpID0+IGMuaG9zdENvbm5lY3RlZD8uKCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBOb3RlLCB0aGlzIG1ldGhvZCBzaG91bGQgYmUgY29uc2lkZXJlZCBmaW5hbCBhbmQgbm90IG92ZXJyaWRkZW4uIEl0IGlzXG4gICAgICogb3ZlcnJpZGRlbiBvbiB0aGUgZWxlbWVudCBpbnN0YW5jZSB3aXRoIGEgZnVuY3Rpb24gdGhhdCB0cmlnZ2VycyB0aGUgZmlyc3RcbiAgICAgKiB1cGRhdGUuXG4gICAgICogQGNhdGVnb3J5IHVwZGF0ZXNcbiAgICAgKi9cbiAgICBlbmFibGVVcGRhdGluZyhfcmVxdWVzdGVkVXBkYXRlKSB7IH1cbiAgICAvKipcbiAgICAgKiBBbGxvd3MgZm9yIGBzdXBlci5kaXNjb25uZWN0ZWRDYWxsYmFjaygpYCBpbiBleHRlbnNpb25zIHdoaWxlXG4gICAgICogcmVzZXJ2aW5nIHRoZSBwb3NzaWJpbGl0eSBvZiBtYWtpbmcgbm9uLWJyZWFraW5nIGZlYXR1cmUgYWRkaXRpb25zXG4gICAgICogd2hlbiBkaXNjb25uZWN0aW5nIGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKiBAY2F0ZWdvcnkgbGlmZWN5Y2xlXG4gICAgICovXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX19jb250cm9sbGVycz8uZm9yRWFjaCgoYykgPT4gYy5ob3N0RGlzY29ubmVjdGVkPy4oKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN5bmNocm9uaXplcyBwcm9wZXJ0eSB2YWx1ZXMgd2hlbiBhdHRyaWJ1dGVzIGNoYW5nZS5cbiAgICAgKlxuICAgICAqIFNwZWNpZmljYWxseSwgd2hlbiBhbiBhdHRyaWJ1dGUgaXMgc2V0LCB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBpcyBzZXQuXG4gICAgICogWW91IHNob3VsZCByYXJlbHkgbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBjYWxsYmFjay4gSWYgdGhpcyBtZXRob2QgaXNcbiAgICAgKiBvdmVycmlkZGVuLCBgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIF9vbGQsIHZhbHVlKWAgbXVzdCBiZVxuICAgICAqIGNhbGxlZC5cbiAgICAgKlxuICAgICAqIFNlZSBbcmVzcG9uZGluZyB0byBhdHRyaWJ1dGUgY2hhbmdlc10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYl9jb21wb25lbnRzL1VzaW5nX2N1c3RvbV9lbGVtZW50cyNyZXNwb25kaW5nX3RvX2F0dHJpYnV0ZV9jaGFuZ2VzKVxuICAgICAqIG9uIE1ETiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFja2AuXG4gICAgICogQGNhdGVnb3J5IGF0dHJpYnV0ZXNcbiAgICAgKi9cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgX29sZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5fJGF0dHJpYnV0ZVRvUHJvcGVydHkobmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgICBfX3Byb3BlcnR5VG9BdHRyaWJ1dGUobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgZWxlbVByb3BlcnRpZXMgPSB0aGlzLmNvbnN0cnVjdG9yLmVsZW1lbnRQcm9wZXJ0aWVzO1xuICAgICAgICBjb25zdCBvcHRpb25zID0gZWxlbVByb3BlcnRpZXMuZ2V0KG5hbWUpO1xuICAgICAgICBjb25zdCBhdHRyID0gdGhpcy5jb25zdHJ1Y3Rvci5fX2F0dHJpYnV0ZU5hbWVGb3JQcm9wZXJ0eShuYW1lLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKGF0dHIgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLnJlZmxlY3QgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlciA9IG9wdGlvbnMuY29udmVydGVyPy50b0F0dHJpYnV0ZSAhPT1cbiAgICAgICAgICAgICAgICB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMuY29udmVydGVyXG4gICAgICAgICAgICAgICAgOiBkZWZhdWx0Q29udmVydGVyO1xuICAgICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gY29udmVydGVyLnRvQXR0cmlidXRlKHZhbHVlLCBvcHRpb25zLnR5cGUpO1xuICAgICAgICAgICAgaWYgKERFVl9NT0RFICYmXG4gICAgICAgICAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5lbmFibGVkV2FybmluZ3MuaW5jbHVkZXMoJ21pZ3JhdGlvbicpICYmXG4gICAgICAgICAgICAgICAgYXR0clZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpc3N1ZVdhcm5pbmcoJ3VuZGVmaW5lZC1hdHRyaWJ1dGUtdmFsdWUnLCBgVGhlIGF0dHJpYnV0ZSB2YWx1ZSBmb3IgdGhlICR7bmFtZX0gcHJvcGVydHkgaXMgYCArXG4gICAgICAgICAgICAgICAgICAgIGB1bmRlZmluZWQgb24gZWxlbWVudCAke3RoaXMubG9jYWxOYW1lfS4gVGhlIGF0dHJpYnV0ZSB3aWxsIGJlIGAgK1xuICAgICAgICAgICAgICAgICAgICBgcmVtb3ZlZCwgYnV0IGluIHRoZSBwcmV2aW91cyB2ZXJzaW9uIG9mIFxcYFJlYWN0aXZlRWxlbWVudFxcYCwgYCArXG4gICAgICAgICAgICAgICAgICAgIGB0aGUgYXR0cmlidXRlIHdvdWxkIG5vdCBoYXZlIGNoYW5nZWQuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUcmFjayBpZiB0aGUgcHJvcGVydHkgaXMgYmVpbmcgcmVmbGVjdGVkIHRvIGF2b2lkXG4gICAgICAgICAgICAvLyBzZXR0aW5nIHRoZSBwcm9wZXJ0eSBhZ2FpbiB2aWEgYGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFja2AuIE5vdGU6XG4gICAgICAgICAgICAvLyAxLiB0aGlzIHRha2VzIGFkdmFudGFnZSBvZiB0aGUgZmFjdCB0aGF0IHRoZSBjYWxsYmFjayBpcyBzeW5jaHJvbm91cy5cbiAgICAgICAgICAgIC8vIDIuIHdpbGwgYmVoYXZlIGluY29ycmVjdGx5IGlmIG11bHRpcGxlIGF0dHJpYnV0ZXMgYXJlIGluIHRoZSByZWFjdGlvblxuICAgICAgICAgICAgLy8gc3RhY2sgYXQgdGltZSBvZiBjYWxsaW5nLiBIb3dldmVyLCBzaW5jZSB3ZSBwcm9jZXNzIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgIC8vIGluIGB1cGRhdGVgIHRoaXMgc2hvdWxkIG5vdCBiZSBwb3NzaWJsZSAob3IgYW4gZXh0cmVtZSBjb3JuZXIgY2FzZVxuICAgICAgICAgICAgLy8gdGhhdCB3ZSdkIGxpa2UgdG8gZGlzY292ZXIpLlxuICAgICAgICAgICAgLy8gbWFyayBzdGF0ZSByZWZsZWN0aW5nXG4gICAgICAgICAgICB0aGlzLl9fcmVmbGVjdGluZ1Byb3BlcnR5ID0gbmFtZTtcbiAgICAgICAgICAgIGlmIChhdHRyVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoYXR0ciwgYXR0clZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG1hcmsgc3RhdGUgbm90IHJlZmxlY3RpbmdcbiAgICAgICAgICAgIHRoaXMuX19yZWZsZWN0aW5nUHJvcGVydHkgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKiBAaW50ZXJuYWwgKi9cbiAgICBfJGF0dHJpYnV0ZVRvUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgY3RvciA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICAgIC8vIE5vdGUsIGhpbnQgdGhpcyBhcyBhbiBgQXR0cmlidXRlTWFwYCBzbyBjbG9zdXJlIGNsZWFybHkgdW5kZXJzdGFuZHNcbiAgICAgICAgLy8gdGhlIHR5cGU7IGl0IGhhcyBpc3N1ZXMgd2l0aCB0cmFja2luZyB0eXBlcyB0aHJvdWdoIHN0YXRpY3NcbiAgICAgICAgY29uc3QgcHJvcE5hbWUgPSBjdG9yLl9fYXR0cmlidXRlVG9Qcm9wZXJ0eU1hcC5nZXQobmFtZSk7XG4gICAgICAgIC8vIFVzZSB0cmFja2luZyBpbmZvIHRvIGF2b2lkIHJlZmxlY3RpbmcgYSBwcm9wZXJ0eSB2YWx1ZSB0byBhbiBhdHRyaWJ1dGVcbiAgICAgICAgLy8gaWYgaXQgd2FzIGp1c3Qgc2V0IGJlY2F1c2UgdGhlIGF0dHJpYnV0ZSBjaGFuZ2VkLlxuICAgICAgICBpZiAocHJvcE5hbWUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9fcmVmbGVjdGluZ1Byb3BlcnR5ICE9PSBwcm9wTmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGN0b3IuZ2V0UHJvcGVydHlPcHRpb25zKHByb3BOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlciA9IHR5cGVvZiBvcHRpb25zLmNvbnZlcnRlciA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgID8geyBmcm9tQXR0cmlidXRlOiBvcHRpb25zLmNvbnZlcnRlciB9XG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLmNvbnZlcnRlcj8uZnJvbUF0dHJpYnV0ZSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgID8gb3B0aW9ucy5jb252ZXJ0ZXJcbiAgICAgICAgICAgICAgICAgICAgOiBkZWZhdWx0Q29udmVydGVyO1xuICAgICAgICAgICAgLy8gbWFyayBzdGF0ZSByZWZsZWN0aW5nXG4gICAgICAgICAgICB0aGlzLl9fcmVmbGVjdGluZ1Byb3BlcnR5ID0gcHJvcE5hbWU7XG4gICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IGNvbnZlcnRlci5mcm9tQXR0cmlidXRlKHZhbHVlLCBvcHRpb25zLnR5cGUpO1xuICAgICAgICAgICAgdGhpc1twcm9wTmFtZV0gPVxuICAgICAgICAgICAgICAgIGNvbnZlcnRlZFZhbHVlID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19kZWZhdWx0VmFsdWVzPy5nZXQocHJvcE5hbWUpID8/XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZFZhbHVlO1xuICAgICAgICAgICAgLy8gbWFyayBzdGF0ZSBub3QgcmVmbGVjdGluZ1xuICAgICAgICAgICAgdGhpcy5fX3JlZmxlY3RpbmdQcm9wZXJ0eSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgYW4gdXBkYXRlIHdoaWNoIGlzIHByb2Nlc3NlZCBhc3luY2hyb25vdXNseS4gVGhpcyBzaG91bGQgYmUgY2FsbGVkXG4gICAgICogd2hlbiBhbiBlbGVtZW50IHNob3VsZCB1cGRhdGUgYmFzZWQgb24gc29tZSBzdGF0ZSBub3QgdHJpZ2dlcmVkIGJ5IHNldHRpbmdcbiAgICAgKiBhIHJlYWN0aXZlIHByb3BlcnR5LiBJbiB0aGlzIGNhc2UsIHBhc3Mgbm8gYXJndW1lbnRzLiBJdCBzaG91bGQgYWxzbyBiZVxuICAgICAqIGNhbGxlZCB3aGVuIG1hbnVhbGx5IGltcGxlbWVudGluZyBhIHByb3BlcnR5IHNldHRlci4gSW4gdGhpcyBjYXNlLCBwYXNzIHRoZVxuICAgICAqIHByb3BlcnR5IGBuYW1lYCBhbmQgYG9sZFZhbHVlYCB0byBlbnN1cmUgdGhhdCBhbnkgY29uZmlndXJlZCBwcm9wZXJ0eVxuICAgICAqIG9wdGlvbnMgYXJlIGhvbm9yZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBuYW1lIG9mIHJlcXVlc3RpbmcgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0gb2xkVmFsdWUgb2xkIHZhbHVlIG9mIHJlcXVlc3RpbmcgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBwcm9wZXJ0eSBvcHRpb25zIHRvIHVzZSBpbnN0ZWFkIG9mIHRoZSBwcmV2aW91c2x5XG4gICAgICogICAgIGNvbmZpZ3VyZWQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB1c2VOZXdWYWx1ZSBpZiB0cnVlLCB0aGUgbmV3VmFsdWUgYXJndW1lbnQgaXMgdXNlZCBpbnN0ZWFkIG9mXG4gICAgICogICAgIHJlYWRpbmcgdGhlIHByb3BlcnR5IHZhbHVlLiBUaGlzIGlzIGltcG9ydGFudCB0byB1c2UgaWYgdGhlIHJlYWN0aXZlXG4gICAgICogICAgIHByb3BlcnR5IGlzIGEgc3RhbmRhcmQgcHJpdmF0ZSBhY2Nlc3NvciwgYXMgb3Bwb3NlZCB0byBhIHBsYWluXG4gICAgICogICAgIHByb3BlcnR5LCBzaW5jZSBwcml2YXRlIG1lbWJlcnMgY2FuJ3QgYmUgZHluYW1pY2FsbHkgcmVhZCBieSBuYW1lLlxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSB0aGUgbmV3IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eS4gVGhpcyBpcyBvbmx5IHVzZWQgaWZcbiAgICAgKiAgICAgYHVzZU5ld1ZhbHVlYCBpcyB0cnVlLlxuICAgICAqIEBjYXRlZ29yeSB1cGRhdGVzXG4gICAgICovXG4gICAgcmVxdWVzdFVwZGF0ZShuYW1lLCBvbGRWYWx1ZSwgb3B0aW9ucywgdXNlTmV3VmFsdWUgPSBmYWxzZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIHByb3BlcnR5IGtleSwgcGVyZm9ybSBwcm9wZXJ0eSB1cGRhdGUgc3RlcHMuXG4gICAgICAgIGlmIChuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChERVZfTU9ERSAmJiBuYW1lIGluc3RhbmNlb2YgRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpc3N1ZVdhcm5pbmcoYGAsIGBUaGUgcmVxdWVzdFVwZGF0ZSgpIG1ldGhvZCB3YXMgY2FsbGVkIHdpdGggYW4gRXZlbnQgYXMgdGhlIHByb3BlcnR5IG5hbWUuIFRoaXMgaXMgcHJvYmFibHkgYSBtaXN0YWtlIGNhdXNlZCBieSBiaW5kaW5nIHRoaXMucmVxdWVzdFVwZGF0ZSBhcyBhbiBldmVudCBsaXN0ZW5lci4gSW5zdGVhZCBiaW5kIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGNhbGwgaXQgd2l0aCBubyBhcmd1bWVudHM6ICgpID0+IHRoaXMucmVxdWVzdFVwZGF0ZSgpYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjdG9yID0gdGhpcy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIGlmICh1c2VOZXdWYWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcHRpb25zID8/PSBjdG9yLmdldFByb3BlcnR5T3B0aW9ucyhuYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IGNoYW5nZWQgPSAob3B0aW9ucy5oYXNDaGFuZ2VkID8/IG5vdEVxdWFsKShuZXdWYWx1ZSwgb2xkVmFsdWUpIHx8XG4gICAgICAgICAgICAgICAgLy8gV2hlbiB0aGVyZSBpcyBubyBjaGFuZ2UsIGNoZWNrIGEgY29ybmVyIGNhc2UgdGhhdCBjYW4gb2NjdXIgd2hlblxuICAgICAgICAgICAgICAgIC8vIDEuIHRoZXJlJ3MgYSBpbml0aWFsIHZhbHVlIHdoaWNoIHdhcyBub3QgcmVmbGVjdGVkXG4gICAgICAgICAgICAgICAgLy8gMi4gdGhlIHByb3BlcnR5IGlzIHN1YnNlcXVlbnRseSBzZXQgdG8gdGhpcyB2YWx1ZS5cbiAgICAgICAgICAgICAgICAvLyBGb3IgZXhhbXBsZSwgYHByb3A6IHt1c2VEZWZhdWx0OiB0cnVlLCByZWZsZWN0OiB0cnVlfWBcbiAgICAgICAgICAgICAgICAvLyBhbmQgZWwucHJvcCA9ICdmb28nLiBUaGlzIHNob3VsZCBiZSBjb25zaWRlcmVkIGEgY2hhbmdlIGlmIHRoZVxuICAgICAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSBpcyBub3Qgc2V0IGJlY2F1c2Ugd2Ugd2lsbCBub3cgcmVmbGVjdCB0aGUgcHJvcGVydHkgdG8gdGhlIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgICAgICAob3B0aW9ucy51c2VEZWZhdWx0ICYmXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucmVmbGVjdCAmJlxuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9PT0gdGhpcy5fX2RlZmF1bHRWYWx1ZXM/LmdldChuYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICAhdGhpcy5oYXNBdHRyaWJ1dGUoY3Rvci5fX2F0dHJpYnV0ZU5hbWVGb3JQcm9wZXJ0eShuYW1lLCBvcHRpb25zKSkpO1xuICAgICAgICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl8kY2hhbmdlUHJvcGVydHkobmFtZSwgb2xkVmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQWJvcnQgdGhlIHJlcXVlc3QgaWYgdGhlIHByb3BlcnR5IHNob3VsZCBub3QgYmUgY29uc2lkZXJlZCBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc1VwZGF0ZVBlbmRpbmcgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLl9fdXBkYXRlUHJvbWlzZSA9IHRoaXMuX19lbnF1ZXVlVXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgXyRjaGFuZ2VQcm9wZXJ0eShuYW1lLCBvbGRWYWx1ZSwgeyB1c2VEZWZhdWx0LCByZWZsZWN0LCB3cmFwcGVkIH0sIGluaXRpYWxpemVWYWx1ZSkge1xuICAgICAgICAvLyBSZWNvcmQgZGVmYXVsdCB2YWx1ZSB3aGVuIHVzZURlZmF1bHQgaXMgdXNlZC4gVGhpcyBhbGxvd3MgdXMgdG9cbiAgICAgICAgLy8gcmVzdG9yZSB0aGlzIHZhbHVlIHdoZW4gdGhlIGF0dHJpYnV0ZSBpcyByZW1vdmVkLlxuICAgICAgICBpZiAodXNlRGVmYXVsdCAmJiAhKHRoaXMuX19kZWZhdWx0VmFsdWVzID8/PSBuZXcgTWFwKCkpLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5fX2RlZmF1bHRWYWx1ZXMuc2V0KG5hbWUsIGluaXRpYWxpemVWYWx1ZSA/PyBvbGRWYWx1ZSA/PyB0aGlzW25hbWVdKTtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgbm90IHdyYXBwaW5nIGFuIGFjY2Vzc29yLCBpdCBtdXN0IGJlIGFuIGluaXRpYWwgc2V0dGluZ1xuICAgICAgICAgICAgLy8gYW5kIGluIHRoaXMgY2FzZSB3ZSBkbyBub3Qgd2FudCB0byByZWNvcmQgdGhlIGNoYW5nZSBvciByZWZsZWN0LlxuICAgICAgICAgICAgaWYgKHdyYXBwZWQgIT09IHRydWUgfHwgaW5pdGlhbGl6ZVZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETyAoanVzdGluZmFnbmFuaSk6IENyZWF0ZSBhIGJlbmNobWFyayBvZiBNYXAuaGFzKCkgKyBNYXAuc2V0KFxuICAgICAgICAvLyB2cyBqdXN0IE1hcC5zZXQoKVxuICAgICAgICBpZiAoIXRoaXMuXyRjaGFuZ2VkUHJvcGVydGllcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIC8vIE9uIHRoZSBpbml0aWFsIGNoYW5nZSwgdGhlIG9sZCB2YWx1ZSBzaG91bGQgYmUgYHVuZGVmaW5lZGAsIGV4Y2VwdFxuICAgICAgICAgICAgLy8gd2l0aCBgdXNlRGVmYXVsdGBcbiAgICAgICAgICAgIGlmICghdGhpcy5oYXNVcGRhdGVkICYmICF1c2VEZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgb2xkVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl8kY2hhbmdlZFByb3BlcnRpZXMuc2V0KG5hbWUsIG9sZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBBZGQgdG8gcmVmbGVjdGluZyBwcm9wZXJ0aWVzIHNldC5cbiAgICAgICAgLy8gTm90ZSwgaXQncyBpbXBvcnRhbnQgdGhhdCBldmVyeSBjaGFuZ2UgaGFzIGEgY2hhbmNlIHRvIGFkZCB0aGVcbiAgICAgICAgLy8gcHJvcGVydHkgdG8gYF9fcmVmbGVjdGluZ1Byb3BlcnRpZXNgLiBUaGlzIGVuc3VyZXMgc2V0dGluZ1xuICAgICAgICAvLyBhdHRyaWJ1dGUgKyBwcm9wZXJ0eSByZWZsZWN0cyBjb3JyZWN0bHkuXG4gICAgICAgIGlmIChyZWZsZWN0ID09PSB0cnVlICYmIHRoaXMuX19yZWZsZWN0aW5nUHJvcGVydHkgIT09IG5hbWUpIHtcbiAgICAgICAgICAgICh0aGlzLl9fcmVmbGVjdGluZ1Byb3BlcnRpZXMgPz89IG5ldyBTZXQoKSkuYWRkKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdXAgdGhlIGVsZW1lbnQgdG8gYXN5bmNocm9ub3VzbHkgdXBkYXRlLlxuICAgICAqL1xuICAgIGFzeW5jIF9fZW5xdWV1ZVVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5pc1VwZGF0ZVBlbmRpbmcgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRW5zdXJlIGFueSBwcmV2aW91cyB1cGRhdGUgaGFzIHJlc29sdmVkIGJlZm9yZSB1cGRhdGluZy5cbiAgICAgICAgICAgIC8vIFRoaXMgYGF3YWl0YCBhbHNvIGVuc3VyZXMgdGhhdCBwcm9wZXJ0eSBjaGFuZ2VzIGFyZSBiYXRjaGVkLlxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fX3VwZGF0ZVByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIFJlZmlyZSBhbnkgcHJldmlvdXMgZXJyb3JzIGFzeW5jIHNvIHRoZXkgZG8gbm90IGRpc3J1cHQgdGhlIHVwZGF0ZVxuICAgICAgICAgICAgLy8gY3ljbGUuIEVycm9ycyBhcmUgcmVmaXJlZCBzbyBkZXZlbG9wZXJzIGhhdmUgYSBjaGFuY2UgdG8gb2JzZXJ2ZVxuICAgICAgICAgICAgLy8gdGhlbSwgYW5kIHRoaXMgY2FuIGJlIGRvbmUgYnkgaW1wbGVtZW50aW5nXG4gICAgICAgICAgICAvLyBgd2luZG93Lm9udW5oYW5kbGVkcmVqZWN0aW9uYC5cbiAgICAgICAgICAgIFByb21pc2UucmVqZWN0KGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc2NoZWR1bGVVcGRhdGUoKTtcbiAgICAgICAgLy8gSWYgYHNjaGVkdWxlVXBkYXRlYCByZXR1cm5zIGEgUHJvbWlzZSwgd2UgYXdhaXQgaXQuIFRoaXMgaXMgZG9uZSB0b1xuICAgICAgICAvLyBlbmFibGUgY29vcmRpbmF0aW5nIHVwZGF0ZXMgd2l0aCBhIHNjaGVkdWxlci4gTm90ZSwgdGhlIHJlc3VsdCBpc1xuICAgICAgICAvLyBjaGVja2VkIHRvIGF2b2lkIGRlbGF5aW5nIGFuIGFkZGl0aW9uYWwgbWljcm90YXNrIHVubGVzcyB3ZSBuZWVkIHRvLlxuICAgICAgICBpZiAocmVzdWx0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF3YWl0IHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIXRoaXMuaXNVcGRhdGVQZW5kaW5nO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTY2hlZHVsZXMgYW4gZWxlbWVudCB1cGRhdGUuIFlvdSBjYW4gb3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZVxuICAgICAqIHRpbWluZyBvZiB1cGRhdGVzIGJ5IHJldHVybmluZyBhIFByb21pc2UuIFRoZSB1cGRhdGUgd2lsbCBhd2FpdCB0aGVcbiAgICAgKiByZXR1cm5lZCBQcm9taXNlLCBhbmQgeW91IHNob3VsZCByZXNvbHZlIHRoZSBQcm9taXNlIHRvIGFsbG93IHRoZSB1cGRhdGVcbiAgICAgKiB0byBwcm9jZWVkLiBJZiB0aGlzIG1ldGhvZCBpcyBvdmVycmlkZGVuLCBgc3VwZXIuc2NoZWR1bGVVcGRhdGUoKWBcbiAgICAgKiBtdXN0IGJlIGNhbGxlZC5cbiAgICAgKlxuICAgICAqIEZvciBpbnN0YW5jZSwgdG8gc2NoZWR1bGUgdXBkYXRlcyB0byBvY2N1ciBqdXN0IGJlZm9yZSB0aGUgbmV4dCBmcmFtZTpcbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogb3ZlcnJpZGUgcHJvdGVjdGVkIGFzeW5jIHNjaGVkdWxlVXBkYXRlKCk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgICAqICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiByZXNvbHZlKCkpKTtcbiAgICAgKiAgIHN1cGVyLnNjaGVkdWxlVXBkYXRlKCk7XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqIEBjYXRlZ29yeSB1cGRhdGVzXG4gICAgICovXG4gICAgc2NoZWR1bGVVcGRhdGUoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucGVyZm9ybVVwZGF0ZSgpO1xuICAgICAgICBpZiAoREVWX01PREUgJiZcbiAgICAgICAgICAgIHRoaXMuY29uc3RydWN0b3IuZW5hYmxlZFdhcm5pbmdzLmluY2x1ZGVzKCdhc3luYy1wZXJmb3JtLXVwZGF0ZScpICYmXG4gICAgICAgICAgICB0eXBlb2YgcmVzdWx0Py50aGVuID09PVxuICAgICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlzc3VlV2FybmluZygnYXN5bmMtcGVyZm9ybS11cGRhdGUnLCBgRWxlbWVudCAke3RoaXMubG9jYWxOYW1lfSByZXR1cm5lZCBhIFByb21pc2UgZnJvbSBwZXJmb3JtVXBkYXRlKCkuIGAgK1xuICAgICAgICAgICAgICAgIGBUaGlzIGJlaGF2aW9yIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiBhIGZ1dHVyZSBgICtcbiAgICAgICAgICAgICAgICBgdmVyc2lvbiBvZiBSZWFjdGl2ZUVsZW1lbnQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYW4gZWxlbWVudCB1cGRhdGUuIE5vdGUsIGlmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24gZHVyaW5nIHRoZVxuICAgICAqIHVwZGF0ZSwgYGZpcnN0VXBkYXRlZGAgYW5kIGB1cGRhdGVkYCB3aWxsIG5vdCBiZSBjYWxsZWQuXG4gICAgICpcbiAgICAgKiBDYWxsIGBwZXJmb3JtVXBkYXRlKClgIHRvIGltbWVkaWF0ZWx5IHByb2Nlc3MgYSBwZW5kaW5nIHVwZGF0ZS4gVGhpcyBzaG91bGRcbiAgICAgKiBnZW5lcmFsbHkgbm90IGJlIG5lZWRlZCwgYnV0IGl0IGNhbiBiZSBkb25lIGluIHJhcmUgY2FzZXMgd2hlbiB5b3UgbmVlZCB0b1xuICAgICAqIHVwZGF0ZSBzeW5jaHJvbm91c2x5LlxuICAgICAqXG4gICAgICogQGNhdGVnb3J5IHVwZGF0ZXNcbiAgICAgKi9cbiAgICBwZXJmb3JtVXBkYXRlKCkge1xuICAgICAgICAvLyBBYm9ydCBhbnkgdXBkYXRlIGlmIG9uZSBpcyBub3QgcGVuZGluZyB3aGVuIHRoaXMgaXMgY2FsbGVkLlxuICAgICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gaWYgYHBlcmZvcm1VcGRhdGVgIGlzIGNhbGxlZCBlYXJseSB0byBcImZsdXNoXCJcbiAgICAgICAgLy8gdGhlIHVwZGF0ZS5cbiAgICAgICAgaWYgKCF0aGlzLmlzVXBkYXRlUGVuZGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnTG9nRXZlbnQ/Lih7IGtpbmQ6ICd1cGRhdGUnIH0pO1xuICAgICAgICBpZiAoIXRoaXMuaGFzVXBkYXRlZCkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHJlbmRlclJvb3QgYmVmb3JlIGZpcnN0IHVwZGF0ZS4gVGhpcyBvY2N1cnMgaW4gYGNvbm5lY3RlZENhbGxiYWNrYFxuICAgICAgICAgICAgLy8gYnV0IGlzIGRvbmUgaGVyZSB0byBzdXBwb3J0IG91dCBvZiB0cmVlIGNhbGxzIHRvIGBlbmFibGVVcGRhdGluZ2AvYHBlcmZvcm1VcGRhdGVgLlxuICAgICAgICAgICAgdGhpcy5yZW5kZXJSb290ID8/PVxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVuZGVyUm9vdCgpO1xuICAgICAgICAgICAgaWYgKERFVl9NT0RFKSB7XG4gICAgICAgICAgICAgICAgLy8gUHJvZHVjZSB3YXJuaW5nIGlmIGFueSByZWFjdGl2ZSBwcm9wZXJ0aWVzIG9uIHRoZSBwcm90b3R5cGUgYXJlXG4gICAgICAgICAgICAgICAgLy8gc2hhZG93ZWQgYnkgY2xhc3MgZmllbGRzLiBJbnN0YW5jZSBmaWVsZHMgc2V0IGJlZm9yZSB1cGdyYWRlIGFyZVxuICAgICAgICAgICAgICAgIC8vIGRlbGV0ZWQgYnkgdGhpcyBwb2ludCwgc28gYW55IG93biBwcm9wZXJ0eSBpcyBjYXVzZWQgYnkgY2xhc3MgZmllbGRcbiAgICAgICAgICAgICAgICAvLyBpbml0aWFsaXphdGlvbiBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgICAgICAgICAgY29uc3QgY3RvciA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hhZG93ZWRQcm9wZXJ0aWVzID0gWy4uLmN0b3IuZWxlbWVudFByb3BlcnRpZXMua2V5cygpXS5maWx0ZXIoKHApID0+IHRoaXMuaGFzT3duUHJvcGVydHkocCkgJiYgcCBpbiBnZXRQcm90b3R5cGVPZih0aGlzKSk7XG4gICAgICAgICAgICAgICAgaWYgKHNoYWRvd2VkUHJvcGVydGllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgZm9sbG93aW5nIHByb3BlcnRpZXMgb24gZWxlbWVudCAke3RoaXMubG9jYWxOYW1lfSB3aWxsIG5vdCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGB0cmlnZ2VyIHVwZGF0ZXMgYXMgZXhwZWN0ZWQgYmVjYXVzZSB0aGV5IGFyZSBzZXQgdXNpbmcgY2xhc3MgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgZmllbGRzOiAke3NoYWRvd2VkUHJvcGVydGllcy5qb2luKCcsICcpfS4gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgTmF0aXZlIGNsYXNzIGZpZWxkcyBhbmQgc29tZSBjb21waWxlZCBvdXRwdXQgd2lsbCBvdmVyd3JpdGUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgYWNjZXNzb3JzIHVzZWQgZm9yIGRldGVjdGluZyBjaGFuZ2VzLiBTZWUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgaHR0cHM6Ly9saXQuZGV2L21zZy9jbGFzcy1maWVsZC1zaGFkb3dpbmcgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgZm9yIG1vcmUgaW5mb3JtYXRpb24uYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTWl4aW4gaW5zdGFuY2UgcHJvcGVydGllcyBvbmNlLCBpZiB0aGV5IGV4aXN0LlxuICAgICAgICAgICAgaWYgKHRoaXMuX19pbnN0YW5jZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIChqdXN0aW5mYWduYW5pKTogc2hvdWxkIHdlIHVzZSB0aGUgc3RvcmVkIHZhbHVlPyBDb3VsZCBhIG5ldyB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGhhdmUgYmVlbiBzZXQgc2luY2Ugd2Ugc3RvcmVkIHRoZSBvd24gcHJvcGVydHkgdmFsdWU/XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBbcCwgdmFsdWVdIG9mIHRoaXMuX19pbnN0YW5jZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9faW5zdGFuY2VQcm9wZXJ0aWVzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVHJpZ2dlciBpbml0aWFsIHZhbHVlIHJlZmxlY3Rpb24gYW5kIHBvcHVsYXRlIHRoZSBpbml0aWFsXG4gICAgICAgICAgICAvLyBgY2hhbmdlZFByb3BlcnRpZXNgIG1hcCwgYnV0IG9ubHkgZm9yIHRoZSBjYXNlIG9mIHByb3BlcnRpZXMgY3JlYXRlZFxuICAgICAgICAgICAgLy8gdmlhIGBjcmVhdGVQcm9wZXJ0eWAgb24gYWNjZXNzb3JzLCB3aGljaCB3aWxsIG5vdCBoYXZlIGFscmVhZHlcbiAgICAgICAgICAgIC8vIHBvcHVsYXRlZCB0aGUgYGNoYW5nZWRQcm9wZXJ0aWVzYCBtYXAgc2luY2UgdGhleSBhcmUgbm90IHNldC5cbiAgICAgICAgICAgIC8vIFdlIGNhbid0IGtub3cgaWYgdGhlc2UgYWNjZXNzb3JzIGhhZCBpbml0aWFsaXplcnMsIHNvIHdlIGp1c3Qgc2V0XG4gICAgICAgICAgICAvLyB0aGVtIGFueXdheSAtIGEgZGlmZmVyZW5jZSBmcm9tIGV4cGVyaW1lbnRhbCBkZWNvcmF0b3JzIG9uIGZpZWxkcyBhbmRcbiAgICAgICAgICAgIC8vIHN0YW5kYXJkIGRlY29yYXRvcnMgb24gYXV0by1hY2Nlc3NvcnMuXG4gICAgICAgICAgICAvLyBGb3IgY29udGV4dCBzZWU6XG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbGl0L2xpdC9wdWxsLzQxODMjaXNzdWVjb21tZW50LTE3MTE5NTk2MzVcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRQcm9wZXJ0aWVzID0gdGhpcy5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgICAgIC5lbGVtZW50UHJvcGVydGllcztcbiAgICAgICAgICAgIGlmIChlbGVtZW50UHJvcGVydGllcy5zaXplID4gMCkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW3AsIG9wdGlvbnNdIG9mIGVsZW1lbnRQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgd3JhcHBlZCB9ID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzW3BdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod3JhcHBlZCA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIXRoaXMuXyRjaGFuZ2VkUHJvcGVydGllcy5oYXMocCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuXyRjaGFuZ2VQcm9wZXJ0eShwLCB1bmRlZmluZWQsIG9wdGlvbnMsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgc2hvdWxkVXBkYXRlID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGNoYW5nZWRQcm9wZXJ0aWVzID0gdGhpcy5fJGNoYW5nZWRQcm9wZXJ0aWVzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2hvdWxkVXBkYXRlID0gdGhpcy5zaG91bGRVcGRhdGUoY2hhbmdlZFByb3BlcnRpZXMpO1xuICAgICAgICAgICAgaWYgKHNob3VsZFVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMud2lsbFVwZGF0ZShjaGFuZ2VkUHJvcGVydGllcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2NvbnRyb2xsZXJzPy5mb3JFYWNoKChjKSA9PiBjLmhvc3RVcGRhdGU/LigpKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZShjaGFuZ2VkUHJvcGVydGllcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fbWFya1VwZGF0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gUHJldmVudCBgZmlyc3RVcGRhdGVkYCBhbmQgYHVwZGF0ZWRgIGZyb20gcnVubmluZyB3aGVuIHRoZXJlJ3MgYW5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSBleGNlcHRpb24uXG4gICAgICAgICAgICBzaG91bGRVcGRhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIEVuc3VyZSBlbGVtZW50IGNhbiBhY2NlcHQgYWRkaXRpb25hbCB1cGRhdGVzIGFmdGVyIGFuIGV4Y2VwdGlvbi5cbiAgICAgICAgICAgIHRoaXMuX19tYXJrVXBkYXRlZCgpO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgdXBkYXRlIGlzIG5vIGxvbmdlciBjb25zaWRlcmVkIHBlbmRpbmcgYW5kIGZ1cnRoZXIgdXBkYXRlcyBhcmUgbm93IGFsbG93ZWQuXG4gICAgICAgIGlmIChzaG91bGRVcGRhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuXyRkaWRVcGRhdGUoY2hhbmdlZFByb3BlcnRpZXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEludm9rZWQgYmVmb3JlIGB1cGRhdGUoKWAgdG8gY29tcHV0ZSB2YWx1ZXMgbmVlZGVkIGR1cmluZyB0aGUgdXBkYXRlLlxuICAgICAqXG4gICAgICogSW1wbGVtZW50IGB3aWxsVXBkYXRlYCB0byBjb21wdXRlIHByb3BlcnR5IHZhbHVlcyB0aGF0IGRlcGVuZCBvbiBvdGhlclxuICAgICAqIHByb3BlcnRpZXMgYW5kIGFyZSB1c2VkIGluIHRoZSByZXN0IG9mIHRoZSB1cGRhdGUgcHJvY2Vzcy5cbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogd2lsbFVwZGF0ZShjaGFuZ2VkUHJvcGVydGllcykge1xuICAgICAqICAgLy8gb25seSBuZWVkIHRvIGNoZWNrIGNoYW5nZWQgcHJvcGVydGllcyBmb3IgYW4gZXhwZW5zaXZlIGNvbXB1dGF0aW9uLlxuICAgICAqICAgaWYgKGNoYW5nZWRQcm9wZXJ0aWVzLmhhcygnZmlyc3ROYW1lJykgfHwgY2hhbmdlZFByb3BlcnRpZXMuaGFzKCdsYXN0TmFtZScpKSB7XG4gICAgICogICAgIHRoaXMuc2hhID0gY29tcHV0ZVNIQShgJHt0aGlzLmZpcnN0TmFtZX0gJHt0aGlzLmxhc3ROYW1lfWApO1xuICAgICAqICAgfVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIHJlbmRlcigpIHtcbiAgICAgKiAgIHJldHVybiBodG1sYFNIQTogJHt0aGlzLnNoYX1gO1xuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBjYXRlZ29yeSB1cGRhdGVzXG4gICAgICovXG4gICAgd2lsbFVwZGF0ZShfY2hhbmdlZFByb3BlcnRpZXMpIHsgfVxuICAgIC8vIE5vdGUsIHRoaXMgaXMgYW4gb3ZlcnJpZGUgcG9pbnQgZm9yIHBvbHlmaWxsLXN1cHBvcnQuXG4gICAgLy8gQGludGVybmFsXG4gICAgXyRkaWRVcGRhdGUoY2hhbmdlZFByb3BlcnRpZXMpIHtcbiAgICAgICAgdGhpcy5fX2NvbnRyb2xsZXJzPy5mb3JFYWNoKChjKSA9PiBjLmhvc3RVcGRhdGVkPy4oKSk7XG4gICAgICAgIGlmICghdGhpcy5oYXNVcGRhdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmhhc1VwZGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5maXJzdFVwZGF0ZWQoY2hhbmdlZFByb3BlcnRpZXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlZChjaGFuZ2VkUHJvcGVydGllcyk7XG4gICAgICAgIGlmIChERVZfTU9ERSAmJlxuICAgICAgICAgICAgdGhpcy5pc1VwZGF0ZVBlbmRpbmcgJiZcbiAgICAgICAgICAgIHRoaXMuY29uc3RydWN0b3IuZW5hYmxlZFdhcm5pbmdzLmluY2x1ZGVzKCdjaGFuZ2UtaW4tdXBkYXRlJykpIHtcbiAgICAgICAgICAgIGlzc3VlV2FybmluZygnY2hhbmdlLWluLXVwZGF0ZScsIGBFbGVtZW50ICR7dGhpcy5sb2NhbE5hbWV9IHNjaGVkdWxlZCBhbiB1cGRhdGUgYCArXG4gICAgICAgICAgICAgICAgYChnZW5lcmFsbHkgYmVjYXVzZSBhIHByb3BlcnR5IHdhcyBzZXQpIGAgK1xuICAgICAgICAgICAgICAgIGBhZnRlciBhbiB1cGRhdGUgY29tcGxldGVkLCBjYXVzaW5nIGEgbmV3IHVwZGF0ZSB0byBiZSBzY2hlZHVsZWQuIGAgK1xuICAgICAgICAgICAgICAgIGBUaGlzIGlzIGluZWZmaWNpZW50IGFuZCBzaG91bGQgYmUgYXZvaWRlZCB1bmxlc3MgdGhlIG5leHQgdXBkYXRlIGAgK1xuICAgICAgICAgICAgICAgIGBjYW4gb25seSBiZSBzY2hlZHVsZWQgYXMgYSBzaWRlIGVmZmVjdCBvZiB0aGUgcHJldmlvdXMgdXBkYXRlLmApO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9fbWFya1VwZGF0ZWQoKSB7XG4gICAgICAgIHRoaXMuXyRjaGFuZ2VkUHJvcGVydGllcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pc1VwZGF0ZVBlbmRpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBlbGVtZW50IGhhcyBjb21wbGV0ZWQgdXBkYXRpbmcuXG4gICAgICogVGhlIFByb21pc2UgdmFsdWUgaXMgYSBib29sZWFuIHRoYXQgaXMgYHRydWVgIGlmIHRoZSBlbGVtZW50IGNvbXBsZXRlZCB0aGVcbiAgICAgKiB1cGRhdGUgd2l0aG91dCB0cmlnZ2VyaW5nIGFub3RoZXIgdXBkYXRlLiBUaGUgUHJvbWlzZSByZXN1bHQgaXMgYGZhbHNlYCBpZlxuICAgICAqIGEgcHJvcGVydHkgd2FzIHNldCBpbnNpZGUgYHVwZGF0ZWQoKWAuIElmIHRoZSBQcm9taXNlIGlzIHJlamVjdGVkLCBhblxuICAgICAqIGV4Y2VwdGlvbiB3YXMgdGhyb3duIGR1cmluZyB0aGUgdXBkYXRlLlxuICAgICAqXG4gICAgICogVG8gYXdhaXQgYWRkaXRpb25hbCBhc3luY2hyb25vdXMgd29yaywgb3ZlcnJpZGUgdGhlIGBnZXRVcGRhdGVDb21wbGV0ZWBcbiAgICAgKiBtZXRob2QuIEZvciBleGFtcGxlLCBpdCBpcyBzb21ldGltZXMgdXNlZnVsIHRvIGF3YWl0IGEgcmVuZGVyZWQgZWxlbWVudFxuICAgICAqIGJlZm9yZSBmdWxmaWxsaW5nIHRoaXMgUHJvbWlzZS4gVG8gZG8gdGhpcywgZmlyc3QgYXdhaXRcbiAgICAgKiBgc3VwZXIuZ2V0VXBkYXRlQ29tcGxldGUoKWAsIHRoZW4gYW55IHN1YnNlcXVlbnQgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIEEgcHJvbWlzZSBvZiBhIGJvb2xlYW4gdGhhdCByZXNvbHZlcyB0byB0cnVlIGlmIHRoZSB1cGRhdGUgY29tcGxldGVkXG4gICAgICogICAgIHdpdGhvdXQgdHJpZ2dlcmluZyBhbm90aGVyIHVwZGF0ZS5cbiAgICAgKiBAY2F0ZWdvcnkgdXBkYXRlc1xuICAgICAqL1xuICAgIGdldCB1cGRhdGVDb21wbGV0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VXBkYXRlQ29tcGxldGUoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgcG9pbnQgZm9yIHRoZSBgdXBkYXRlQ29tcGxldGVgIHByb21pc2UuXG4gICAgICpcbiAgICAgKiBJdCBpcyBub3Qgc2FmZSB0byBvdmVycmlkZSB0aGUgYHVwZGF0ZUNvbXBsZXRlYCBnZXR0ZXIgZGlyZWN0bHkgZHVlIHRvIGFcbiAgICAgKiBsaW1pdGF0aW9uIGluIFR5cGVTY3JpcHQgd2hpY2ggbWVhbnMgaXQgaXMgbm90IHBvc3NpYmxlIHRvIGNhbGwgYVxuICAgICAqIHN1cGVyY2xhc3MgZ2V0dGVyIChlLmcuIGBzdXBlci51cGRhdGVDb21wbGV0ZS50aGVuKC4uLilgKSB3aGVuIHRoZSB0YXJnZXRcbiAgICAgKiBsYW5ndWFnZSBpcyBFUzUgKGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzM4KS5cbiAgICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBpbnN0ZWFkLiBGb3IgZXhhbXBsZTpcbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgICogICBvdmVycmlkZSBhc3luYyBnZXRVcGRhdGVDb21wbGV0ZSgpIHtcbiAgICAgKiAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc3VwZXIuZ2V0VXBkYXRlQ29tcGxldGUoKTtcbiAgICAgKiAgICAgYXdhaXQgdGhpcy5fbXlDaGlsZC51cGRhdGVDb21wbGV0ZTtcbiAgICAgKiAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgKiAgIH1cbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIEEgcHJvbWlzZSBvZiBhIGJvb2xlYW4gdGhhdCByZXNvbHZlcyB0byB0cnVlIGlmIHRoZSB1cGRhdGUgY29tcGxldGVkXG4gICAgICogICAgIHdpdGhvdXQgdHJpZ2dlcmluZyBhbm90aGVyIHVwZGF0ZS5cbiAgICAgKiBAY2F0ZWdvcnkgdXBkYXRlc1xuICAgICAqL1xuICAgIGdldFVwZGF0ZUNvbXBsZXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3VwZGF0ZVByb21pc2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGB1cGRhdGUoKWAgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIHRoZSBlbGVtZW50IHJlcXVlc3RzXG4gICAgICogYW4gdXBkYXRlLiBCeSBkZWZhdWx0LCB0aGlzIG1ldGhvZCBhbHdheXMgcmV0dXJucyBgdHJ1ZWAsIGJ1dCB0aGlzIGNhbiBiZVxuICAgICAqIGN1c3RvbWl6ZWQgdG8gY29udHJvbCB3aGVuIHRvIHVwZGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfY2hhbmdlZFByb3BlcnRpZXMgTWFwIG9mIGNoYW5nZWQgcHJvcGVydGllcyB3aXRoIG9sZCB2YWx1ZXNcbiAgICAgKiBAY2F0ZWdvcnkgdXBkYXRlc1xuICAgICAqL1xuICAgIHNob3VsZFVwZGF0ZShfY2hhbmdlZFByb3BlcnRpZXMpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGVsZW1lbnQuIFRoaXMgbWV0aG9kIHJlZmxlY3RzIHByb3BlcnR5IHZhbHVlcyB0byBhdHRyaWJ1dGVzLlxuICAgICAqIEl0IGNhbiBiZSBvdmVycmlkZGVuIHRvIHJlbmRlciBhbmQga2VlcCB1cGRhdGVkIGVsZW1lbnQgRE9NLlxuICAgICAqIFNldHRpbmcgcHJvcGVydGllcyBpbnNpZGUgdGhpcyBtZXRob2Qgd2lsbCAqbm90KiB0cmlnZ2VyXG4gICAgICogYW5vdGhlciB1cGRhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2NoYW5nZWRQcm9wZXJ0aWVzIE1hcCBvZiBjaGFuZ2VkIHByb3BlcnRpZXMgd2l0aCBvbGQgdmFsdWVzXG4gICAgICogQGNhdGVnb3J5IHVwZGF0ZXNcbiAgICAgKi9cbiAgICB1cGRhdGUoX2NoYW5nZWRQcm9wZXJ0aWVzKSB7XG4gICAgICAgIC8vIFRoZSBmb3JFYWNoKCkgZXhwcmVzc2lvbiB3aWxsIG9ubHkgcnVuIHdoZW4gX19yZWZsZWN0aW5nUHJvcGVydGllcyBpc1xuICAgICAgICAvLyBkZWZpbmVkLCBhbmQgaXQgcmV0dXJucyB1bmRlZmluZWQsIHNldHRpbmcgX19yZWZsZWN0aW5nUHJvcGVydGllcyB0b1xuICAgICAgICAvLyB1bmRlZmluZWRcbiAgICAgICAgdGhpcy5fX3JlZmxlY3RpbmdQcm9wZXJ0aWVzICYmPSB0aGlzLl9fcmVmbGVjdGluZ1Byb3BlcnRpZXMuZm9yRWFjaCgocCkgPT4gdGhpcy5fX3Byb3BlcnR5VG9BdHRyaWJ1dGUocCwgdGhpc1twXSkpO1xuICAgICAgICB0aGlzLl9fbWFya1VwZGF0ZWQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuZXZlciB0aGUgZWxlbWVudCBpcyB1cGRhdGVkLiBJbXBsZW1lbnQgdG8gcGVyZm9ybVxuICAgICAqIHBvc3QtdXBkYXRpbmcgdGFza3MgdmlhIERPTSBBUElzLCBmb3IgZXhhbXBsZSwgZm9jdXNpbmcgYW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIFNldHRpbmcgcHJvcGVydGllcyBpbnNpZGUgdGhpcyBtZXRob2Qgd2lsbCB0cmlnZ2VyIHRoZSBlbGVtZW50IHRvIHVwZGF0ZVxuICAgICAqIGFnYWluIGFmdGVyIHRoaXMgdXBkYXRlIGN5Y2xlIGNvbXBsZXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfY2hhbmdlZFByb3BlcnRpZXMgTWFwIG9mIGNoYW5nZWQgcHJvcGVydGllcyB3aXRoIG9sZCB2YWx1ZXNcbiAgICAgKiBAY2F0ZWdvcnkgdXBkYXRlc1xuICAgICAqL1xuICAgIHVwZGF0ZWQoX2NoYW5nZWRQcm9wZXJ0aWVzKSB7IH1cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIGVsZW1lbnQgaXMgZmlyc3QgdXBkYXRlZC4gSW1wbGVtZW50IHRvIHBlcmZvcm0gb25lIHRpbWVcbiAgICAgKiB3b3JrIG9uIHRoZSBlbGVtZW50IGFmdGVyIHVwZGF0ZS5cbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogZmlyc3RVcGRhdGVkKCkge1xuICAgICAqICAgdGhpcy5yZW5kZXJSb290LmdldEVsZW1lbnRCeUlkKCdteS10ZXh0LWFyZWEnKS5mb2N1cygpO1xuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIFNldHRpbmcgcHJvcGVydGllcyBpbnNpZGUgdGhpcyBtZXRob2Qgd2lsbCB0cmlnZ2VyIHRoZSBlbGVtZW50IHRvIHVwZGF0ZVxuICAgICAqIGFnYWluIGFmdGVyIHRoaXMgdXBkYXRlIGN5Y2xlIGNvbXBsZXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfY2hhbmdlZFByb3BlcnRpZXMgTWFwIG9mIGNoYW5nZWQgcHJvcGVydGllcyB3aXRoIG9sZCB2YWx1ZXNcbiAgICAgKiBAY2F0ZWdvcnkgdXBkYXRlc1xuICAgICAqL1xuICAgIGZpcnN0VXBkYXRlZChfY2hhbmdlZFByb3BlcnRpZXMpIHsgfVxufVxuLyoqXG4gKiBNZW1vaXplZCBsaXN0IG9mIGFsbCBlbGVtZW50IHN0eWxlcy5cbiAqIENyZWF0ZWQgbGF6aWx5IG9uIHVzZXIgc3ViY2xhc3NlcyB3aGVuIGZpbmFsaXppbmcgdGhlIGNsYXNzLlxuICogQG5vY29sbGFwc2VcbiAqIEBjYXRlZ29yeSBzdHlsZXNcbiAqL1xuUmVhY3RpdmVFbGVtZW50LmVsZW1lbnRTdHlsZXMgPSBbXTtcbi8qKlxuICogT3B0aW9ucyB1c2VkIHdoZW4gY2FsbGluZyBgYXR0YWNoU2hhZG93YC4gU2V0IHRoaXMgcHJvcGVydHkgdG8gY3VzdG9taXplXG4gKiB0aGUgb3B0aW9ucyBmb3IgdGhlIHNoYWRvd1Jvb3Q7IGZvciBleGFtcGxlLCB0byBjcmVhdGUgYSBjbG9zZWRcbiAqIHNoYWRvd1Jvb3Q6IGB7bW9kZTogJ2Nsb3NlZCd9YC5cbiAqXG4gKiBOb3RlLCB0aGVzZSBvcHRpb25zIGFyZSB1c2VkIGluIGBjcmVhdGVSZW5kZXJSb290YC4gSWYgdGhpcyBtZXRob2RcbiAqIGlzIGN1c3RvbWl6ZWQsIG9wdGlvbnMgc2hvdWxkIGJlIHJlc3BlY3RlZCBpZiBwb3NzaWJsZS5cbiAqIEBub2NvbGxhcHNlXG4gKiBAY2F0ZWdvcnkgcmVuZGVyaW5nXG4gKi9cblJlYWN0aXZlRWxlbWVudC5zaGFkb3dSb290T3B0aW9ucyA9IHsgbW9kZTogJ29wZW4nIH07XG4vLyBBc3NpZ25lZCBoZXJlIHRvIHdvcmsgYXJvdW5kIGEganNjb21waWxlciBidWcgd2l0aCBzdGF0aWMgZmllbGRzXG4vLyB3aGVuIGNvbXBpbGluZyB0byBFUzUuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2Nsb3N1cmUtY29tcGlsZXIvaXNzdWVzLzMxNzdcblJlYWN0aXZlRWxlbWVudFtKU0NvbXBpbGVyX3JlbmFtZVByb3BlcnR5KCdlbGVtZW50UHJvcGVydGllcycsIFJlYWN0aXZlRWxlbWVudCldID0gbmV3IE1hcCgpO1xuUmVhY3RpdmVFbGVtZW50W0pTQ29tcGlsZXJfcmVuYW1lUHJvcGVydHkoJ2ZpbmFsaXplZCcsIFJlYWN0aXZlRWxlbWVudCldID0gbmV3IE1hcCgpO1xuLy8gQXBwbHkgcG9seWZpbGxzIGlmIGF2YWlsYWJsZVxucG9seWZpbGxTdXBwb3J0Py4oeyBSZWFjdGl2ZUVsZW1lbnQgfSk7XG4vLyBEZXYgbW9kZSB3YXJuaW5ncy4uLlxuaWYgKERFVl9NT0RFKSB7XG4gICAgLy8gRGVmYXVsdCB3YXJuaW5nIHNldC5cbiAgICBSZWFjdGl2ZUVsZW1lbnQuZW5hYmxlZFdhcm5pbmdzID0gW1xuICAgICAgICAnY2hhbmdlLWluLXVwZGF0ZScsXG4gICAgICAgICdhc3luYy1wZXJmb3JtLXVwZGF0ZScsXG4gICAgXTtcbiAgICBjb25zdCBlbnN1cmVPd25XYXJuaW5ncyA9IGZ1bmN0aW9uIChjdG9yKSB7XG4gICAgICAgIGlmICghY3Rvci5oYXNPd25Qcm9wZXJ0eShKU0NvbXBpbGVyX3JlbmFtZVByb3BlcnR5KCdlbmFibGVkV2FybmluZ3MnLCBjdG9yKSkpIHtcbiAgICAgICAgICAgIGN0b3IuZW5hYmxlZFdhcm5pbmdzID0gY3Rvci5lbmFibGVkV2FybmluZ3Muc2xpY2UoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVhY3RpdmVFbGVtZW50LmVuYWJsZVdhcm5pbmcgPSBmdW5jdGlvbiAod2FybmluZykge1xuICAgICAgICBlbnN1cmVPd25XYXJuaW5ncyh0aGlzKTtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWRXYXJuaW5ncy5pbmNsdWRlcyh3YXJuaW5nKSkge1xuICAgICAgICAgICAgdGhpcy5lbmFibGVkV2FybmluZ3MucHVzaCh3YXJuaW5nKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVhY3RpdmVFbGVtZW50LmRpc2FibGVXYXJuaW5nID0gZnVuY3Rpb24gKHdhcm5pbmcpIHtcbiAgICAgICAgZW5zdXJlT3duV2FybmluZ3ModGhpcyk7XG4gICAgICAgIGNvbnN0IGkgPSB0aGlzLmVuYWJsZWRXYXJuaW5ncy5pbmRleE9mKHdhcm5pbmcpO1xuICAgICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZWRXYXJuaW5ncy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuLy8gSU1QT1JUQU5UOiBkbyBub3QgY2hhbmdlIHRoZSBwcm9wZXJ0eSBuYW1lIG9yIHRoZSBhc3NpZ25tZW50IGV4cHJlc3Npb24uXG4vLyBUaGlzIGxpbmUgd2lsbCBiZSB1c2VkIGluIHJlZ2V4ZXMgdG8gc2VhcmNoIGZvciBSZWFjdGl2ZUVsZW1lbnQgdXNhZ2UuXG4oZ2xvYmFsLnJlYWN0aXZlRWxlbWVudFZlcnNpb25zID8/PSBbXSkucHVzaCgnMi4xLjInKTtcbmlmIChERVZfTU9ERSAmJiBnbG9iYWwucmVhY3RpdmVFbGVtZW50VmVyc2lvbnMubGVuZ3RoID4gMSkge1xuICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgaXNzdWVXYXJuaW5nKCdtdWx0aXBsZS12ZXJzaW9ucycsIGBNdWx0aXBsZSB2ZXJzaW9ucyBvZiBMaXQgbG9hZGVkLiBMb2FkaW5nIG11bHRpcGxlIHZlcnNpb25zIGAgK1xuICAgICAgICAgICAgYGlzIG5vdCByZWNvbW1lbmRlZC5gKTtcbiAgICB9KTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlYWN0aXZlLWVsZW1lbnQuanMubWFwIiwKICAgICIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNyBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cbmNvbnN0IERFVl9NT0RFID0gdHJ1ZTtcbmNvbnN0IEVOQUJMRV9FWFRSQV9TRUNVUklUWV9IT09LUyA9IHRydWU7XG5jb25zdCBFTkFCTEVfU0hBRFlET01fTk9QQVRDSCA9IHRydWU7XG5jb25zdCBOT0RFX01PREUgPSBmYWxzZTtcbi8vIEFsbG93cyBtaW5pZmllcnMgdG8gcmVuYW1lIHJlZmVyZW5jZXMgdG8gZ2xvYmFsVGhpc1xuY29uc3QgZ2xvYmFsID0gZ2xvYmFsVGhpcztcbi8qKlxuICogVXNlZnVsIGZvciB2aXN1YWxpemluZyBhbmQgbG9nZ2luZyBpbnNpZ2h0cyBpbnRvIHdoYXQgdGhlIExpdCB0ZW1wbGF0ZSBzeXN0ZW0gaXMgZG9pbmcuXG4gKlxuICogQ29tcGlsZWQgb3V0IG9mIHByb2QgbW9kZSBidWlsZHMuXG4gKi9cbmNvbnN0IGRlYnVnTG9nRXZlbnQgPSBERVZfTU9ERVxuICAgID8gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHNob3VsZEVtaXQgPSBnbG9iYWxcbiAgICAgICAgICAgIC5lbWl0TGl0RGVidWdMb2dFdmVudHM7XG4gICAgICAgIGlmICghc2hvdWxkRW1pdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdsb2JhbC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnbGl0LWRlYnVnJywge1xuICAgICAgICAgICAgZGV0YWlsOiBldmVudCxcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICA6IHVuZGVmaW5lZDtcbi8vIFVzZWQgZm9yIGNvbm5lY3RpbmcgYmVnaW5SZW5kZXIgYW5kIGVuZFJlbmRlciBldmVudHMgd2hlbiB0aGVyZSBhcmUgbmVzdGVkXG4vLyByZW5kZXJzIHdoZW4gZXJyb3JzIGFyZSB0aHJvd24gcHJldmVudGluZyBhbiBlbmRSZW5kZXIgZXZlbnQgZnJvbSBiZWluZ1xuLy8gY2FsbGVkLlxubGV0IGRlYnVnTG9nUmVuZGVySWQgPSAwO1xubGV0IGlzc3VlV2FybmluZztcbmlmIChERVZfTU9ERSkge1xuICAgIGdsb2JhbC5saXRJc3N1ZWRXYXJuaW5ncyA/Pz0gbmV3IFNldCgpO1xuICAgIC8qKlxuICAgICAqIElzc3VlIGEgd2FybmluZyBpZiB3ZSBoYXZlbid0IGFscmVhZHksIGJhc2VkIGVpdGhlciBvbiBgY29kZWAgb3IgYHdhcm5pbmdgLlxuICAgICAqIFdhcm5pbmdzIGFyZSBkaXNhYmxlZCBhdXRvbWF0aWNhbGx5IG9ubHkgYnkgYHdhcm5pbmdgOyBkaXNhYmxpbmcgdmlhIGBjb2RlYFxuICAgICAqIGNhbiBiZSBkb25lIGJ5IHVzZXJzLlxuICAgICAqL1xuICAgIGlzc3VlV2FybmluZyA9IChjb2RlLCB3YXJuaW5nKSA9PiB7XG4gICAgICAgIHdhcm5pbmcgKz0gY29kZVxuICAgICAgICAgICAgPyBgIFNlZSBodHRwczovL2xpdC5kZXYvbXNnLyR7Y29kZX0gZm9yIG1vcmUgaW5mb3JtYXRpb24uYFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgaWYgKCFnbG9iYWwubGl0SXNzdWVkV2FybmluZ3MuaGFzKHdhcm5pbmcpICYmXG4gICAgICAgICAgICAhZ2xvYmFsLmxpdElzc3VlZFdhcm5pbmdzLmhhcyhjb2RlKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKHdhcm5pbmcpO1xuICAgICAgICAgICAgZ2xvYmFsLmxpdElzc3VlZFdhcm5pbmdzLmFkZCh3YXJuaW5nKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICBpc3N1ZVdhcm5pbmcoJ2Rldi1tb2RlJywgYExpdCBpcyBpbiBkZXYgbW9kZS4gTm90IHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIWApO1xuICAgIH0pO1xufVxuY29uc3Qgd3JhcCA9IEVOQUJMRV9TSEFEWURPTV9OT1BBVENIICYmXG4gICAgZ2xvYmFsLlNoYWR5RE9NPy5pblVzZSAmJlxuICAgIGdsb2JhbC5TaGFkeURPTT8ubm9QYXRjaCA9PT0gdHJ1ZVxuICAgID8gZ2xvYmFsLlNoYWR5RE9NLndyYXBcbiAgICA6IChub2RlKSA9PiBub2RlO1xuY29uc3QgdHJ1c3RlZFR5cGVzID0gZ2xvYmFsLnRydXN0ZWRUeXBlcztcbi8qKlxuICogT3VyIFRydXN0ZWRUeXBlUG9saWN5IGZvciBIVE1MIHdoaWNoIGlzIGRlY2xhcmVkIHVzaW5nIHRoZSBodG1sIHRlbXBsYXRlXG4gKiB0YWcgZnVuY3Rpb24uXG4gKlxuICogVGhhdCBIVE1MIGlzIGEgZGV2ZWxvcGVyLWF1dGhvcmVkIGNvbnN0YW50LCBhbmQgaXMgcGFyc2VkIHdpdGggaW5uZXJIVE1MXG4gKiBiZWZvcmUgYW55IHVudHJ1c3RlZCBleHByZXNzaW9ucyBoYXZlIGJlZW4gbWl4ZWQgaW4uIFRoZXJlZm9yIGl0IGlzXG4gKiBjb25zaWRlcmVkIHNhZmUgYnkgY29uc3RydWN0aW9uLlxuICovXG5jb25zdCBwb2xpY3kgPSB0cnVzdGVkVHlwZXNcbiAgICA/IHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3koJ2xpdC1odG1sJywge1xuICAgICAgICBjcmVhdGVIVE1MOiAocykgPT4gcyxcbiAgICB9KVxuICAgIDogdW5kZWZpbmVkO1xuY29uc3QgaWRlbnRpdHlGdW5jdGlvbiA9ICh2YWx1ZSkgPT4gdmFsdWU7XG5jb25zdCBub29wU2FuaXRpemVyID0gKF9ub2RlLCBfbmFtZSwgX3R5cGUpID0+IGlkZW50aXR5RnVuY3Rpb247XG4vKiogU2V0cyB0aGUgZ2xvYmFsIHNhbml0aXplciBmYWN0b3J5LiAqL1xuY29uc3Qgc2V0U2FuaXRpemVyID0gKG5ld1Nhbml0aXplcikgPT4ge1xuICAgIGlmICghRU5BQkxFX0VYVFJBX1NFQ1VSSVRZX0hPT0tTKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHNhbml0aXplckZhY3RvcnlJbnRlcm5hbCAhPT0gbm9vcFNhbml0aXplcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF0dGVtcHRlZCB0byBvdmVyd3JpdGUgZXhpc3RpbmcgbGl0LWh0bWwgc2VjdXJpdHkgcG9saWN5LmAgK1xuICAgICAgICAgICAgYCBzZXRTYW5pdGl6ZURPTVZhbHVlRmFjdG9yeSBzaG91bGQgYmUgY2FsbGVkIGF0IG1vc3Qgb25jZS5gKTtcbiAgICB9XG4gICAgc2FuaXRpemVyRmFjdG9yeUludGVybmFsID0gbmV3U2FuaXRpemVyO1xufTtcbi8qKlxuICogT25seSB1c2VkIGluIGludGVybmFsIHRlc3RzLCBub3QgYSBwYXJ0IG9mIHRoZSBwdWJsaWMgQVBJLlxuICovXG5jb25zdCBfdGVzdE9ubHlDbGVhclNhbml0aXplckZhY3RvcnlEb05vdENhbGxPckVsc2UgPSAoKSA9PiB7XG4gICAgc2FuaXRpemVyRmFjdG9yeUludGVybmFsID0gbm9vcFNhbml0aXplcjtcbn07XG5jb25zdCBjcmVhdGVTYW5pdGl6ZXIgPSAobm9kZSwgbmFtZSwgdHlwZSkgPT4ge1xuICAgIHJldHVybiBzYW5pdGl6ZXJGYWN0b3J5SW50ZXJuYWwobm9kZSwgbmFtZSwgdHlwZSk7XG59O1xuLy8gQWRkZWQgdG8gYW4gYXR0cmlidXRlIG5hbWUgdG8gbWFyayB0aGUgYXR0cmlidXRlIGFzIGJvdW5kIHNvIHdlIGNhbiBmaW5kXG4vLyBpdCBlYXNpbHkuXG5jb25zdCBib3VuZEF0dHJpYnV0ZVN1ZmZpeCA9ICckbGl0JCc7XG4vLyBUaGlzIG1hcmtlciBpcyB1c2VkIGluIG1hbnkgc3ludGFjdGljIHBvc2l0aW9ucyBpbiBIVE1MLCBzbyBpdCBtdXN0IGJlXG4vLyBhIHZhbGlkIGVsZW1lbnQgbmFtZSBhbmQgYXR0cmlidXRlIG5hbWUuIFdlIGRvbid0IHN1cHBvcnQgZHluYW1pYyBuYW1lcyAoeWV0KVxuLy8gYnV0IHRoaXMgYXQgbGVhc3QgZW5zdXJlcyB0aGF0IHRoZSBwYXJzZSB0cmVlIGlzIGNsb3NlciB0byB0aGUgdGVtcGxhdGVcbi8vIGludGVudGlvbi5cbmNvbnN0IG1hcmtlciA9IGBsaXQkJHtNYXRoLnJhbmRvbSgpLnRvRml4ZWQoOSkuc2xpY2UoMil9JGA7XG4vLyBTdHJpbmcgdXNlZCB0byB0ZWxsIGlmIGEgY29tbWVudCBpcyBhIG1hcmtlciBjb21tZW50XG5jb25zdCBtYXJrZXJNYXRjaCA9ICc/JyArIG1hcmtlcjtcbi8vIFRleHQgdXNlZCB0byBpbnNlcnQgYSBjb21tZW50IG1hcmtlciBub2RlLiBXZSB1c2UgcHJvY2Vzc2luZyBpbnN0cnVjdGlvblxuLy8gc3ludGF4IGJlY2F1c2UgaXQncyBzbGlnaHRseSBzbWFsbGVyLCBidXQgcGFyc2VzIGFzIGEgY29tbWVudCBub2RlLlxuY29uc3Qgbm9kZU1hcmtlciA9IGA8JHttYXJrZXJNYXRjaH0+YDtcbmNvbnN0IGQgPSBOT0RFX01PREUgJiYgZ2xvYmFsLmRvY3VtZW50ID09PSB1bmRlZmluZWRcbiAgICA/IHtcbiAgICAgICAgY3JlYXRlVHJlZVdhbGtlcigpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfSxcbiAgICB9XG4gICAgOiBkb2N1bWVudDtcbi8vIENyZWF0ZXMgYSBkeW5hbWljIG1hcmtlci4gV2UgbmV2ZXIgaGF2ZSB0byBzZWFyY2ggZm9yIHRoZXNlIGluIHRoZSBET00uXG5jb25zdCBjcmVhdGVNYXJrZXIgPSAoKSA9PiBkLmNyZWF0ZUNvbW1lbnQoJycpO1xuY29uc3QgaXNQcmltaXRpdmUgPSAodmFsdWUpID0+IHZhbHVlID09PSBudWxsIHx8ICh0eXBlb2YgdmFsdWUgIT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlICE9ICdmdW5jdGlvbicpO1xuY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5jb25zdCBpc0l0ZXJhYmxlID0gKHZhbHVlKSA9PiBpc0FycmF5KHZhbHVlKSB8fFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgdHlwZW9mIHZhbHVlPy5bU3ltYm9sLml0ZXJhdG9yXSA9PT0gJ2Z1bmN0aW9uJztcbmNvbnN0IFNQQUNFX0NIQVIgPSBgWyBcXHRcXG5cXGZcXHJdYDtcbmNvbnN0IEFUVFJfVkFMVUVfQ0hBUiA9IGBbXiBcXHRcXG5cXGZcXHJcIidcXGA8Pj1dYDtcbmNvbnN0IE5BTUVfQ0hBUiA9IGBbXlxcXFxzXCInPj0vXWA7XG4vLyBUaGVzZSByZWdleGVzIHJlcHJlc2VudCB0aGUgZml2ZSBwYXJzaW5nIHN0YXRlcyB0aGF0IHdlIGNhcmUgYWJvdXQgaW4gdGhlXG4vLyBUZW1wbGF0ZSdzIEhUTUwgc2Nhbm5lci4gVGhleSBtYXRjaCB0aGUgKmVuZCogb2YgdGhlIHN0YXRlIHRoZXkncmUgbmFtZWRcbi8vIGFmdGVyLlxuLy8gRGVwZW5kaW5nIG9uIHRoZSBtYXRjaCwgd2UgdHJhbnNpdGlvbiB0byBhIG5ldyBzdGF0ZS4gSWYgdGhlcmUncyBubyBtYXRjaCxcbi8vIHdlIHN0YXkgaW4gdGhlIHNhbWUgc3RhdGUuXG4vLyBOb3RlIHRoYXQgdGhlIHJlZ2V4ZXMgYXJlIHN0YXRlZnVsLiBXZSB1dGlsaXplIGxhc3RJbmRleCBhbmQgc3luYyBpdFxuLy8gYWNyb3NzIHRoZSBtdWx0aXBsZSByZWdleGVzIHVzZWQuIEluIGFkZGl0aW9uIHRvIHRoZSBmaXZlIHJlZ2V4ZXMgYmVsb3dcbi8vIHdlIGFsc28gZHluYW1pY2FsbHkgY3JlYXRlIGEgcmVnZXggdG8gZmluZCB0aGUgbWF0Y2hpbmcgZW5kIHRhZ3MgZm9yIHJhd1xuLy8gdGV4dCBlbGVtZW50cy5cbi8qKlxuICogRW5kIG9mIHRleHQgaXM6IGA8YCBmb2xsb3dlZCBieTpcbiAqICAgKGNvbW1lbnQgc3RhcnQpIG9yICh0YWcpIG9yIChkeW5hbWljIHRhZyBiaW5kaW5nKVxuICovXG5jb25zdCB0ZXh0RW5kUmVnZXggPSAvPCg/OighLS18XFwvW15hLXpBLVpdKXwoXFwvP1thLXpBLVpdW14+XFxzXSopfChcXC8/JCkpL2c7XG5jb25zdCBDT01NRU5UX1NUQVJUID0gMTtcbmNvbnN0IFRBR19OQU1FID0gMjtcbmNvbnN0IERZTkFNSUNfVEFHX05BTUUgPSAzO1xuY29uc3QgY29tbWVudEVuZFJlZ2V4ID0gLy0tPi9nO1xuLyoqXG4gKiBDb21tZW50cyBub3Qgc3RhcnRlZCB3aXRoIDwhLS0sIGxpa2UgPC97LCBjYW4gYmUgZW5kZWQgYnkgYSBzaW5nbGUgYD5gXG4gKi9cbmNvbnN0IGNvbW1lbnQyRW5kUmVnZXggPSAvPi9nO1xuLyoqXG4gKiBUaGUgdGFnRW5kIHJlZ2V4IG1hdGNoZXMgdGhlIGVuZCBvZiB0aGUgXCJpbnNpZGUgYW4gb3BlbmluZ1wiIHRhZyBzeW50YXhcbiAqIHBvc2l0aW9uLiBJdCBlaXRoZXIgbWF0Y2hlcyBhIGA+YCwgYW4gYXR0cmlidXRlLWxpa2Ugc2VxdWVuY2UsIG9yIHRoZSBlbmRcbiAqIG9mIHRoZSBzdHJpbmcgYWZ0ZXIgYSBzcGFjZSAoYXR0cmlidXRlLW5hbWUgcG9zaXRpb24gZW5kaW5nKS5cbiAqXG4gKiBTZWUgYXR0cmlidXRlcyBpbiB0aGUgSFRNTCBzcGVjOlxuICogaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L3N5bnRheC5odG1sI2VsZW1lbnRzLWF0dHJpYnV0ZXNcbiAqXG4gKiBcIiBcXHRcXG5cXGZcXHJcIiBhcmUgSFRNTCBzcGFjZSBjaGFyYWN0ZXJzOlxuICogaHR0cHM6Ly9pbmZyYS5zcGVjLndoYXR3Zy5vcmcvI2FzY2lpLXdoaXRlc3BhY2VcbiAqXG4gKiBTbyBhbiBhdHRyaWJ1dGUgaXM6XG4gKiAgKiBUaGUgbmFtZTogYW55IGNoYXJhY3RlciBleGNlcHQgYSB3aGl0ZXNwYWNlIGNoYXJhY3RlciwgKFwiKSwgKCcpLCBcIj5cIixcbiAqICAgIFwiPVwiLCBvciBcIi9cIi4gTm90ZTogdGhpcyBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgSFRNTCBzcGVjIHdoaWNoIGFsc28gZXhjbHVkZXMgY29udHJvbCBjaGFyYWN0ZXJzLlxuICogICogRm9sbG93ZWQgYnkgemVybyBvciBtb3JlIHNwYWNlIGNoYXJhY3RlcnNcbiAqICAqIEZvbGxvd2VkIGJ5IFwiPVwiXG4gKiAgKiBGb2xsb3dlZCBieSB6ZXJvIG9yIG1vcmUgc3BhY2UgY2hhcmFjdGVyc1xuICogICogRm9sbG93ZWQgYnk6XG4gKiAgICAqIEFueSBjaGFyYWN0ZXIgZXhjZXB0IHNwYWNlLCAoJyksIChcIiksIFwiPFwiLCBcIj5cIiwgXCI9XCIsIChgKSwgb3JcbiAqICAgICogKFwiKSB0aGVuIGFueSBub24tKFwiKSwgb3JcbiAqICAgICogKCcpIHRoZW4gYW55IG5vbi0oJylcbiAqL1xuY29uc3QgdGFnRW5kUmVnZXggPSBuZXcgUmVnRXhwKGA+fCR7U1BBQ0VfQ0hBUn0oPzooJHtOQU1FX0NIQVJ9KykoJHtTUEFDRV9DSEFSfSo9JHtTUEFDRV9DSEFSfSooPzoke0FUVFJfVkFMVUVfQ0hBUn18KFwifCcpfCkpfCQpYCwgJ2cnKTtcbmNvbnN0IEVOVElSRV9NQVRDSCA9IDA7XG5jb25zdCBBVFRSSUJVVEVfTkFNRSA9IDE7XG5jb25zdCBTUEFDRVNfQU5EX0VRVUFMUyA9IDI7XG5jb25zdCBRVU9URV9DSEFSID0gMztcbmNvbnN0IHNpbmdsZVF1b3RlQXR0ckVuZFJlZ2V4ID0gLycvZztcbmNvbnN0IGRvdWJsZVF1b3RlQXR0ckVuZFJlZ2V4ID0gL1wiL2c7XG4vKipcbiAqIE1hdGNoZXMgdGhlIHJhdyB0ZXh0IGVsZW1lbnRzLlxuICpcbiAqIENvbW1lbnRzIGFyZSBub3QgcGFyc2VkIHdpdGhpbiByYXcgdGV4dCBlbGVtZW50cywgc28gd2UgbmVlZCB0byBzZWFyY2ggdGhlaXJcbiAqIHRleHQgY29udGVudCBmb3IgbWFya2VyIHN0cmluZ3MuXG4gKi9cbmNvbnN0IHJhd1RleHRFbGVtZW50ID0gL14oPzpzY3JpcHR8c3R5bGV8dGV4dGFyZWF8dGl0bGUpJC9pO1xuLyoqIFRlbXBsYXRlUmVzdWx0IHR5cGVzICovXG5jb25zdCBIVE1MX1JFU1VMVCA9IDE7XG5jb25zdCBTVkdfUkVTVUxUID0gMjtcbmNvbnN0IE1BVEhNTF9SRVNVTFQgPSAzO1xuLy8gVGVtcGxhdGVQYXJ0IHR5cGVzXG4vLyBJTVBPUlRBTlQ6IHRoZXNlIG11c3QgbWF0Y2ggdGhlIHZhbHVlcyBpbiBQYXJ0VHlwZVxuY29uc3QgQVRUUklCVVRFX1BBUlQgPSAxO1xuY29uc3QgQ0hJTERfUEFSVCA9IDI7XG5jb25zdCBQUk9QRVJUWV9QQVJUID0gMztcbmNvbnN0IEJPT0xFQU5fQVRUUklCVVRFX1BBUlQgPSA0O1xuY29uc3QgRVZFTlRfUEFSVCA9IDU7XG5jb25zdCBFTEVNRU5UX1BBUlQgPSA2O1xuY29uc3QgQ09NTUVOVF9QQVJUID0gNztcbi8qKlxuICogR2VuZXJhdGVzIGEgdGVtcGxhdGUgbGl0ZXJhbCB0YWcgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgVGVtcGxhdGVSZXN1bHQgd2l0aFxuICogdGhlIGdpdmVuIHJlc3VsdCB0eXBlLlxuICovXG5jb25zdCB0YWcgPSAodHlwZSkgPT4gKHN0cmluZ3MsIC4uLnZhbHVlcykgPT4ge1xuICAgIC8vIFdhcm4gYWdhaW5zdCB0ZW1wbGF0ZXMgb2N0YWwgZXNjYXBlIHNlcXVlbmNlc1xuICAgIC8vIFdlIGRvIHRoaXMgaGVyZSByYXRoZXIgdGhhbiBpbiByZW5kZXIgc28gdGhhdCB0aGUgd2FybmluZyBpcyBjbG9zZXIgdG8gdGhlXG4gICAgLy8gdGVtcGxhdGUgZGVmaW5pdGlvbi5cbiAgICBpZiAoREVWX01PREUgJiYgc3RyaW5ncy5zb21lKChzKSA9PiBzID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignU29tZSB0ZW1wbGF0ZSBzdHJpbmdzIGFyZSB1bmRlZmluZWQuXFxuJyArXG4gICAgICAgICAgICAnVGhpcyBpcyBwcm9iYWJseSBjYXVzZWQgYnkgaWxsZWdhbCBvY3RhbCBlc2NhcGUgc2VxdWVuY2VzLicpO1xuICAgIH1cbiAgICBpZiAoREVWX01PREUpIHtcbiAgICAgICAgLy8gSW1wb3J0IHN0YXRpYy1odG1sLmpzIHJlc3VsdHMgaW4gYSBjaXJjdWxhciBkZXBlbmRlbmN5IHdoaWNoIGczIGRvZXNuJ3RcbiAgICAgICAgLy8gaGFuZGxlLiBJbnN0ZWFkIHdlIGtub3cgdGhhdCBzdGF0aWMgdmFsdWVzIG11c3QgaGF2ZSB0aGUgZmllbGRcbiAgICAgICAgLy8gYF8kbGl0U3RhdGljJGAuXG4gICAgICAgIGlmICh2YWx1ZXMuc29tZSgodmFsKSA9PiB2YWw/LlsnXyRsaXRTdGF0aWMkJ10pKSB7XG4gICAgICAgICAgICBpc3N1ZVdhcm5pbmcoJycsIGBTdGF0aWMgdmFsdWVzICdsaXRlcmFsJyBvciAndW5zYWZlU3RhdGljJyBjYW5ub3QgYmUgdXNlZCBhcyB2YWx1ZXMgdG8gbm9uLXN0YXRpYyB0ZW1wbGF0ZXMuXFxuYCArXG4gICAgICAgICAgICAgICAgYFBsZWFzZSB1c2UgdGhlIHN0YXRpYyAnaHRtbCcgdGFnIGZ1bmN0aW9uLiBTZWUgaHR0cHM6Ly9saXQuZGV2L2RvY3MvdGVtcGxhdGVzL2V4cHJlc3Npb25zLyNzdGF0aWMtZXhwcmVzc2lvbnNgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBUaGlzIHByb3BlcnR5IG5lZWRzIHRvIHJlbWFpbiB1bm1pbmlmaWVkLlxuICAgICAgICBbJ18kbGl0VHlwZSQnXTogdHlwZSxcbiAgICAgICAgc3RyaW5ncyxcbiAgICAgICAgdmFsdWVzLFxuICAgIH07XG59O1xuLyoqXG4gKiBJbnRlcnByZXRzIGEgdGVtcGxhdGUgbGl0ZXJhbCBhcyBhbiBIVE1MIHRlbXBsYXRlIHRoYXQgY2FuIGVmZmljaWVudGx5XG4gKiByZW5kZXIgdG8gYW5kIHVwZGF0ZSBhIGNvbnRhaW5lci5cbiAqXG4gKiBgYGB0c1xuICogY29uc3QgaGVhZGVyID0gKHRpdGxlOiBzdHJpbmcpID0+IGh0bWxgPGgxPiR7dGl0bGV9PC9oMT5gO1xuICogYGBgXG4gKlxuICogVGhlIGBodG1sYCB0YWcgcmV0dXJucyBhIGRlc2NyaXB0aW9uIG9mIHRoZSBET00gdG8gcmVuZGVyIGFzIGEgdmFsdWUuIEl0IGlzXG4gKiBsYXp5LCBtZWFuaW5nIG5vIHdvcmsgaXMgZG9uZSB1bnRpbCB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQuIFdoZW4gcmVuZGVyaW5nLFxuICogaWYgYSB0ZW1wbGF0ZSBjb21lcyBmcm9tIHRoZSBzYW1lIGV4cHJlc3Npb24gYXMgYSBwcmV2aW91c2x5IHJlbmRlcmVkIHJlc3VsdCxcbiAqIGl0J3MgZWZmaWNpZW50bHkgdXBkYXRlZCBpbnN0ZWFkIG9mIHJlcGxhY2VkLlxuICovXG5leHBvcnQgY29uc3QgaHRtbCA9IHRhZyhIVE1MX1JFU1VMVCk7XG4vKipcbiAqIEludGVycHJldHMgYSB0ZW1wbGF0ZSBsaXRlcmFsIGFzIGFuIFNWRyBmcmFnbWVudCB0aGF0IGNhbiBlZmZpY2llbnRseSByZW5kZXJcbiAqIHRvIGFuZCB1cGRhdGUgYSBjb250YWluZXIuXG4gKlxuICogYGBgdHNcbiAqIGNvbnN0IHJlY3QgPSBzdmdgPHJlY3Qgd2lkdGg9XCIxMFwiIGhlaWdodD1cIjEwXCI+PC9yZWN0PmA7XG4gKlxuICogY29uc3QgbXlJbWFnZSA9IGh0bWxgXG4gKiAgIDxzdmcgdmlld0JveD1cIjAgMCAxMCAxMFwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAqICAgICAke3JlY3R9XG4gKiAgIDwvc3ZnPmA7XG4gKiBgYGBcbiAqXG4gKiBUaGUgYHN2Z2AgKnRhZyBmdW5jdGlvbiogc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgU1ZHIGZyYWdtZW50cywgb3IgZWxlbWVudHNcbiAqIHRoYXQgd291bGQgYmUgY29udGFpbmVkICoqaW5zaWRlKiogYW4gYDxzdmc+YCBIVE1MIGVsZW1lbnQuIEEgY29tbW9uIGVycm9yIGlzXG4gKiBwbGFjaW5nIGFuIGA8c3ZnPmAgKmVsZW1lbnQqIGluIGEgdGVtcGxhdGUgdGFnZ2VkIHdpdGggdGhlIGBzdmdgIHRhZ1xuICogZnVuY3Rpb24uIFRoZSBgPHN2Zz5gIGVsZW1lbnQgaXMgYW4gSFRNTCBlbGVtZW50IGFuZCBzaG91bGQgYmUgdXNlZCB3aXRoaW4gYVxuICogdGVtcGxhdGUgdGFnZ2VkIHdpdGggdGhlIHtAbGlua2NvZGUgaHRtbH0gdGFnIGZ1bmN0aW9uLlxuICpcbiAqIEluIExpdEVsZW1lbnQgdXNhZ2UsIGl0J3MgaW52YWxpZCB0byByZXR1cm4gYW4gU1ZHIGZyYWdtZW50IGZyb20gdGhlXG4gKiBgcmVuZGVyKClgIG1ldGhvZCwgYXMgdGhlIFNWRyBmcmFnbWVudCB3aWxsIGJlIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGVsZW1lbnQnc1xuICogc2hhZG93IHJvb3QgYW5kIHRodXMgbm90IGJlIHByb3Blcmx5IGNvbnRhaW5lZCB3aXRoaW4gYW4gYDxzdmc+YCBIVE1MXG4gKiBlbGVtZW50LlxuICovXG5leHBvcnQgY29uc3Qgc3ZnID0gdGFnKFNWR19SRVNVTFQpO1xuLyoqXG4gKiBJbnRlcnByZXRzIGEgdGVtcGxhdGUgbGl0ZXJhbCBhcyBNYXRoTUwgZnJhZ21lbnQgdGhhdCBjYW4gZWZmaWNpZW50bHkgcmVuZGVyXG4gKiB0byBhbmQgdXBkYXRlIGEgY29udGFpbmVyLlxuICpcbiAqIGBgYHRzXG4gKiBjb25zdCBudW0gPSBtYXRobWxgPG1uPjE8L21uPmA7XG4gKlxuICogY29uc3QgZXEgPSBodG1sYFxuICogICA8bWF0aD5cbiAqICAgICAke251bX1cbiAqICAgPC9tYXRoPmA7XG4gKiBgYGBcbiAqXG4gKiBUaGUgYG1hdGhtbGAgKnRhZyBmdW5jdGlvbiogc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgTWF0aE1MIGZyYWdtZW50cywgb3JcbiAqIGVsZW1lbnRzIHRoYXQgd291bGQgYmUgY29udGFpbmVkICoqaW5zaWRlKiogYSBgPG1hdGg+YCBIVE1MIGVsZW1lbnQuIEEgY29tbW9uXG4gKiBlcnJvciBpcyBwbGFjaW5nIGEgYDxtYXRoPmAgKmVsZW1lbnQqIGluIGEgdGVtcGxhdGUgdGFnZ2VkIHdpdGggdGhlIGBtYXRobWxgXG4gKiB0YWcgZnVuY3Rpb24uIFRoZSBgPG1hdGg+YCBlbGVtZW50IGlzIGFuIEhUTUwgZWxlbWVudCBhbmQgc2hvdWxkIGJlIHVzZWRcbiAqIHdpdGhpbiBhIHRlbXBsYXRlIHRhZ2dlZCB3aXRoIHRoZSB7QGxpbmtjb2RlIGh0bWx9IHRhZyBmdW5jdGlvbi5cbiAqXG4gKiBJbiBMaXRFbGVtZW50IHVzYWdlLCBpdCdzIGludmFsaWQgdG8gcmV0dXJuIGFuIE1hdGhNTCBmcmFnbWVudCBmcm9tIHRoZVxuICogYHJlbmRlcigpYCBtZXRob2QsIGFzIHRoZSBNYXRoTUwgZnJhZ21lbnQgd2lsbCBiZSBjb250YWluZWQgd2l0aGluIHRoZVxuICogZWxlbWVudCdzIHNoYWRvdyByb290IGFuZCB0aHVzIG5vdCBiZSBwcm9wZXJseSBjb250YWluZWQgd2l0aGluIGEgYDxtYXRoPmBcbiAqIEhUTUwgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IG1hdGhtbCA9IHRhZyhNQVRITUxfUkVTVUxUKTtcbi8qKlxuICogQSBzZW50aW5lbCB2YWx1ZSB0aGF0IHNpZ25hbHMgdGhhdCBhIHZhbHVlIHdhcyBoYW5kbGVkIGJ5IGEgZGlyZWN0aXZlIGFuZFxuICogc2hvdWxkIG5vdCBiZSB3cml0dGVuIHRvIHRoZSBET00uXG4gKi9cbmV4cG9ydCBjb25zdCBub0NoYW5nZSA9IFN5bWJvbC5mb3IoJ2xpdC1ub0NoYW5nZScpO1xuLyoqXG4gKiBBIHNlbnRpbmVsIHZhbHVlIHRoYXQgc2lnbmFscyBhIENoaWxkUGFydCB0byBmdWxseSBjbGVhciBpdHMgY29udGVudC5cbiAqXG4gKiBgYGB0c1xuICogY29uc3QgYnV0dG9uID0gaHRtbGAke1xuICogIHVzZXIuaXNBZG1pblxuICogICAgPyBodG1sYDxidXR0b24+REVMRVRFPC9idXR0b24+YFxuICogICAgOiBub3RoaW5nXG4gKiB9YDtcbiAqIGBgYFxuICpcbiAqIFByZWZlciB1c2luZyBgbm90aGluZ2Agb3ZlciBvdGhlciBmYWxzeSB2YWx1ZXMgYXMgaXQgcHJvdmlkZXMgYSBjb25zaXN0ZW50XG4gKiBiZWhhdmlvciBiZXR3ZWVuIHZhcmlvdXMgZXhwcmVzc2lvbiBiaW5kaW5nIGNvbnRleHRzLlxuICpcbiAqIEluIGNoaWxkIGV4cHJlc3Npb25zLCBgdW5kZWZpbmVkYCwgYG51bGxgLCBgJydgLCBhbmQgYG5vdGhpbmdgIGFsbCBiZWhhdmUgdGhlXG4gKiBzYW1lIGFuZCByZW5kZXIgbm8gbm9kZXMuIEluIGF0dHJpYnV0ZSBleHByZXNzaW9ucywgYG5vdGhpbmdgIF9yZW1vdmVzXyB0aGVcbiAqIGF0dHJpYnV0ZSwgd2hpbGUgYHVuZGVmaW5lZGAgYW5kIGBudWxsYCB3aWxsIHJlbmRlciBhbiBlbXB0eSBzdHJpbmcuIEluXG4gKiBwcm9wZXJ0eSBleHByZXNzaW9ucyBgbm90aGluZ2AgYmVjb21lcyBgdW5kZWZpbmVkYC5cbiAqL1xuZXhwb3J0IGNvbnN0IG5vdGhpbmcgPSBTeW1ib2wuZm9yKCdsaXQtbm90aGluZycpO1xuLyoqXG4gKiBUaGUgY2FjaGUgb2YgcHJlcGFyZWQgdGVtcGxhdGVzLCBrZXllZCBieSB0aGUgdGFnZ2VkIFRlbXBsYXRlU3RyaW5nc0FycmF5XG4gKiBhbmQgX25vdF8gYWNjb3VudGluZyBmb3IgdGhlIHNwZWNpZmljIHRlbXBsYXRlIHRhZyB1c2VkLiBUaGlzIG1lYW5zIHRoYXRcbiAqIHRlbXBsYXRlIHRhZ3MgY2Fubm90IGJlIGR5bmFtaWMgLSB0aGV5IG11c3Qgc3RhdGljYWxseSBiZSBvbmUgb2YgaHRtbCwgc3ZnLFxuICogb3IgYXR0ci4gVGhpcyByZXN0cmljdGlvbiBzaW1wbGlmaWVzIHRoZSBjYWNoZSBsb29rdXAsIHdoaWNoIGlzIG9uIHRoZSBob3RcbiAqIHBhdGggZm9yIHJlbmRlcmluZy5cbiAqL1xuY29uc3QgdGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCB3YWxrZXIgPSBkLmNyZWF0ZVRyZWVXYWxrZXIoZCwgMTI5IC8qIE5vZGVGaWx0ZXIuU0hPV197RUxFTUVOVHxDT01NRU5UfSAqLyk7XG5sZXQgc2FuaXRpemVyRmFjdG9yeUludGVybmFsID0gbm9vcFNhbml0aXplcjtcbmZ1bmN0aW9uIHRydXN0RnJvbVRlbXBsYXRlU3RyaW5nKHRzYSwgc3RyaW5nRnJvbVRTQSkge1xuICAgIC8vIEEgc2VjdXJpdHkgY2hlY2sgdG8gcHJldmVudCBzcG9vZmluZyBvZiBMaXQgdGVtcGxhdGUgcmVzdWx0cy5cbiAgICAvLyBJbiB0aGUgZnV0dXJlLCB3ZSBtYXkgYmUgYWJsZSB0byByZXBsYWNlIHRoaXMgd2l0aCBBcnJheS5pc1RlbXBsYXRlT2JqZWN0LFxuICAgIC8vIHRob3VnaCB3ZSBtaWdodCBuZWVkIHRvIG1ha2UgdGhhdCBjaGVjayBpbnNpZGUgb2YgdGhlIGh0bWwgYW5kIHN2Z1xuICAgIC8vIGZ1bmN0aW9ucywgYmVjYXVzZSBwcmVjb21waWxlZCB0ZW1wbGF0ZXMgZG9uJ3QgY29tZSBpbiBhc1xuICAgIC8vIFRlbXBsYXRlU3RyaW5nQXJyYXkgb2JqZWN0cy5cbiAgICBpZiAoIWlzQXJyYXkodHNhKSB8fCAhdHNhLmhhc093blByb3BlcnR5KCdyYXcnKSkge1xuICAgICAgICBsZXQgbWVzc2FnZSA9ICdpbnZhbGlkIHRlbXBsYXRlIHN0cmluZ3MgYXJyYXknO1xuICAgICAgICBpZiAoREVWX01PREUpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBgXG4gICAgICAgICAgSW50ZXJuYWwgRXJyb3I6IGV4cGVjdGVkIHRlbXBsYXRlIHN0cmluZ3MgdG8gYmUgYW4gYXJyYXlcbiAgICAgICAgICB3aXRoIGEgJ3JhdycgZmllbGQuIEZha2luZyBhIHRlbXBsYXRlIHN0cmluZ3MgYXJyYXkgYnlcbiAgICAgICAgICBjYWxsaW5nIGh0bWwgb3Igc3ZnIGxpa2UgYW4gb3JkaW5hcnkgZnVuY3Rpb24gaXMgZWZmZWN0aXZlbHlcbiAgICAgICAgICB0aGUgc2FtZSBhcyBjYWxsaW5nIHVuc2FmZUh0bWwgYW5kIGNhbiBsZWFkIHRvIG1ham9yIHNlY3VyaXR5XG4gICAgICAgICAgaXNzdWVzLCBlLmcuIG9wZW5pbmcgeW91ciBjb2RlIHVwIHRvIFhTUyBhdHRhY2tzLlxuICAgICAgICAgIElmIHlvdSdyZSB1c2luZyB0aGUgaHRtbCBvciBzdmcgdGFnZ2VkIHRlbXBsYXRlIGZ1bmN0aW9ucyBub3JtYWxseVxuICAgICAgICAgIGFuZCBzdGlsbCBzZWVpbmcgdGhpcyBlcnJvciwgcGxlYXNlIGZpbGUgYSBidWcgYXRcbiAgICAgICAgICBodHRwczovL2dpdGh1Yi5jb20vbGl0L2xpdC9pc3N1ZXMvbmV3P3RlbXBsYXRlPWJ1Z19yZXBvcnQubWRcbiAgICAgICAgICBhbmQgaW5jbHVkZSBpbmZvcm1hdGlvbiBhYm91dCB5b3VyIGJ1aWxkIHRvb2xpbmcsIGlmIGFueS5cbiAgICAgICAgYFxuICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuICovZywgJ1xcbicpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIHBvbGljeSAhPT0gdW5kZWZpbmVkXG4gICAgICAgID8gcG9saWN5LmNyZWF0ZUhUTUwoc3RyaW5nRnJvbVRTQSlcbiAgICAgICAgOiBzdHJpbmdGcm9tVFNBO1xufVxuLyoqXG4gKiBSZXR1cm5zIGFuIEhUTUwgc3RyaW5nIGZvciB0aGUgZ2l2ZW4gVGVtcGxhdGVTdHJpbmdzQXJyYXkgYW5kIHJlc3VsdCB0eXBlXG4gKiAoSFRNTCBvciBTVkcpLCBhbG9uZyB3aXRoIHRoZSBjYXNlLXNlbnNpdGl2ZSBib3VuZCBhdHRyaWJ1dGUgbmFtZXMgaW5cbiAqIHRlbXBsYXRlIG9yZGVyLiBUaGUgSFRNTCBjb250YWlucyBjb21tZW50IG1hcmtlcnMgZGVub3RpbmcgdGhlIGBDaGlsZFBhcnRgc1xuICogYW5kIHN1ZmZpeGVzIG9uIGJvdW5kIGF0dHJpYnV0ZXMgZGVub3RpbmcgdGhlIGBBdHRyaWJ1dGVQYXJ0c2AuXG4gKlxuICogQHBhcmFtIHN0cmluZ3MgdGVtcGxhdGUgc3RyaW5ncyBhcnJheVxuICogQHBhcmFtIHR5cGUgSFRNTCBvciBTVkdcbiAqIEByZXR1cm4gQXJyYXkgY29udGFpbmluZyBgW2h0bWwsIGF0dHJOYW1lc11gIChhcnJheSByZXR1cm5lZCBmb3IgdGVyc2VuZXNzLFxuICogICAgIHRvIGF2b2lkIG9iamVjdCBmaWVsZHMgc2luY2UgdGhpcyBjb2RlIGlzIHNoYXJlZCB3aXRoIG5vbi1taW5pZmllZCBTU1JcbiAqICAgICBjb2RlKVxuICovXG5jb25zdCBnZXRUZW1wbGF0ZUh0bWwgPSAoc3RyaW5ncywgdHlwZSkgPT4ge1xuICAgIC8vIEluc2VydCBtYWtlcnMgaW50byB0aGUgdGVtcGxhdGUgSFRNTCB0byByZXByZXNlbnQgdGhlIHBvc2l0aW9uIG9mXG4gICAgLy8gYmluZGluZ3MuIFRoZSBmb2xsb3dpbmcgY29kZSBzY2FucyB0aGUgdGVtcGxhdGUgc3RyaW5ncyB0byBkZXRlcm1pbmUgdGhlXG4gICAgLy8gc3ludGFjdGljIHBvc2l0aW9uIG9mIHRoZSBiaW5kaW5ncy4gVGhleSBjYW4gYmUgaW4gdGV4dCBwb3NpdGlvbiwgd2hlcmVcbiAgICAvLyB3ZSBpbnNlcnQgYW4gSFRNTCBjb21tZW50LCBhdHRyaWJ1dGUgdmFsdWUgcG9zaXRpb24sIHdoZXJlIHdlIGluc2VydCBhXG4gICAgLy8gc2VudGluZWwgc3RyaW5nIGFuZCByZS13cml0ZSB0aGUgYXR0cmlidXRlIG5hbWUsIG9yIGluc2lkZSBhIHRhZyB3aGVyZVxuICAgIC8vIHdlIGluc2VydCB0aGUgc2VudGluZWwgc3RyaW5nLlxuICAgIGNvbnN0IGwgPSBzdHJpbmdzLmxlbmd0aCAtIDE7XG4gICAgLy8gU3RvcmVzIHRoZSBjYXNlLXNlbnNpdGl2ZSBib3VuZCBhdHRyaWJ1dGUgbmFtZXMgaW4gdGhlIG9yZGVyIG9mIHRoZWlyXG4gICAgLy8gcGFydHMuIEVsZW1lbnRQYXJ0cyBhcmUgYWxzbyByZWZsZWN0ZWQgaW4gdGhpcyBhcnJheSBhcyB1bmRlZmluZWRcbiAgICAvLyByYXRoZXIgdGhhbiBhIHN0cmluZywgdG8gZGlzYW1iaWd1YXRlIGZyb20gYXR0cmlidXRlIGJpbmRpbmdzLlxuICAgIGNvbnN0IGF0dHJOYW1lcyA9IFtdO1xuICAgIGxldCBodG1sID0gdHlwZSA9PT0gU1ZHX1JFU1VMVCA/ICc8c3ZnPicgOiB0eXBlID09PSBNQVRITUxfUkVTVUxUID8gJzxtYXRoPicgOiAnJztcbiAgICAvLyBXaGVuIHdlJ3JlIGluc2lkZSBhIHJhdyB0ZXh0IHRhZyAobm90IGl0J3MgdGV4dCBjb250ZW50KSwgdGhlIHJlZ2V4XG4gICAgLy8gd2lsbCBzdGlsbCBiZSB0YWdSZWdleCBzbyB3ZSBjYW4gZmluZCBhdHRyaWJ1dGVzLCBidXQgd2lsbCBzd2l0Y2ggdG9cbiAgICAvLyB0aGlzIHJlZ2V4IHdoZW4gdGhlIHRhZyBlbmRzLlxuICAgIGxldCByYXdUZXh0RW5kUmVnZXg7XG4gICAgLy8gVGhlIGN1cnJlbnQgcGFyc2luZyBzdGF0ZSwgcmVwcmVzZW50ZWQgYXMgYSByZWZlcmVuY2UgdG8gb25lIG9mIHRoZVxuICAgIC8vIHJlZ2V4ZXNcbiAgICBsZXQgcmVnZXggPSB0ZXh0RW5kUmVnZXg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY29uc3QgcyA9IHN0cmluZ3NbaV07XG4gICAgICAgIC8vIFRoZSBpbmRleCBvZiB0aGUgZW5kIG9mIHRoZSBsYXN0IGF0dHJpYnV0ZSBuYW1lLiBXaGVuIHRoaXMgaXNcbiAgICAgICAgLy8gcG9zaXRpdmUgYXQgZW5kIG9mIGEgc3RyaW5nLCBpdCBtZWFucyB3ZSdyZSBpbiBhbiBhdHRyaWJ1dGUgdmFsdWVcbiAgICAgICAgLy8gcG9zaXRpb24gYW5kIG5lZWQgdG8gcmV3cml0ZSB0aGUgYXR0cmlidXRlIG5hbWUuXG4gICAgICAgIC8vIFdlIGFsc28gdXNlIGEgc3BlY2lhbCB2YWx1ZSBvZiAtMiB0byBpbmRpY2F0ZSB0aGF0IHdlIGVuY291bnRlcmVkXG4gICAgICAgIC8vIHRoZSBlbmQgb2YgYSBzdHJpbmcgaW4gYXR0cmlidXRlIG5hbWUgcG9zaXRpb24uXG4gICAgICAgIGxldCBhdHRyTmFtZUVuZEluZGV4ID0gLTE7XG4gICAgICAgIGxldCBhdHRyTmFtZTtcbiAgICAgICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgICAgIGxldCBtYXRjaDtcbiAgICAgICAgLy8gVGhlIGNvbmRpdGlvbnMgaW4gdGhpcyBsb29wIGhhbmRsZSB0aGUgY3VycmVudCBwYXJzZSBzdGF0ZSwgYW5kIHRoZVxuICAgICAgICAvLyBhc3NpZ25tZW50cyB0byB0aGUgYHJlZ2V4YCB2YXJpYWJsZSBhcmUgdGhlIHN0YXRlIHRyYW5zaXRpb25zLlxuICAgICAgICB3aGlsZSAobGFzdEluZGV4IDwgcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBzdGFydCBzZWFyY2hpbmcgZnJvbSB3aGVyZSB3ZSBwcmV2aW91c2x5IGxlZnQgb2ZmXG4gICAgICAgICAgICByZWdleC5sYXN0SW5kZXggPSBsYXN0SW5kZXg7XG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMocyk7XG4gICAgICAgICAgICBpZiAobWF0Y2ggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RJbmRleCA9IHJlZ2V4Lmxhc3RJbmRleDtcbiAgICAgICAgICAgIGlmIChyZWdleCA9PT0gdGV4dEVuZFJlZ2V4KSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoW0NPTU1FTlRfU1RBUlRdID09PSAnIS0tJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleCA9IGNvbW1lbnRFbmRSZWdleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWF0Y2hbQ09NTUVOVF9TVEFSVF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBzdGFydGVkIGEgd2VpcmQgY29tbWVudCwgbGlrZSA8L3tcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSBjb21tZW50MkVuZFJlZ2V4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtYXRjaFtUQUdfTkFNRV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmF3VGV4dEVsZW1lbnQudGVzdChtYXRjaFtUQUdfTkFNRV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWNvcmQgaWYgd2UgZW5jb3VudGVyIGEgcmF3LXRleHQgZWxlbWVudC4gV2UnbGwgc3dpdGNoIHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHJlZ2V4IGF0IHRoZSBlbmQgb2YgdGhlIHRhZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd1RleHRFbmRSZWdleCA9IG5ldyBSZWdFeHAoYDwvJHttYXRjaFtUQUdfTkFNRV19YCwgJ2cnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZWdleCA9IHRhZ0VuZFJlZ2V4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtYXRjaFtEWU5BTUlDX1RBR19OQU1FXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChERVZfTU9ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCaW5kaW5ncyBpbiB0YWcgbmFtZXMgYXJlIG5vdCBzdXBwb3J0ZWQuIFBsZWFzZSB1c2Ugc3RhdGljIHRlbXBsYXRlcyBpbnN0ZWFkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnU2VlIGh0dHBzOi8vbGl0LmRldi9kb2NzL3RlbXBsYXRlcy9leHByZXNzaW9ucy8jc3RhdGljLWV4cHJlc3Npb25zJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSB0YWdFbmRSZWdleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChyZWdleCA9PT0gdGFnRW5kUmVnZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbRU5USVJFX01BVENIXSA9PT0gJz4nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVuZCBvZiBhIHRhZy4gSWYgd2UgaGFkIHN0YXJ0ZWQgYSByYXctdGV4dCBlbGVtZW50LCB1c2UgdGhhdFxuICAgICAgICAgICAgICAgICAgICAvLyByZWdleFxuICAgICAgICAgICAgICAgICAgICByZWdleCA9IHJhd1RleHRFbmRSZWdleCA/PyB0ZXh0RW5kUmVnZXg7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIG1heSBiZSBlbmRpbmcgYW4gdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlLCBzbyBtYWtlIHN1cmUgd2VcbiAgICAgICAgICAgICAgICAgICAgLy8gY2xlYXIgYW55IHBlbmRpbmcgYXR0ck5hbWVFbmRJbmRleFxuICAgICAgICAgICAgICAgICAgICBhdHRyTmFtZUVuZEluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1hdGNoW0FUVFJJQlVURV9OQU1FXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEF0dHJpYnV0ZSBuYW1lIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICAgIGF0dHJOYW1lRW5kSW5kZXggPSAtMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJOYW1lRW5kSW5kZXggPSByZWdleC5sYXN0SW5kZXggLSBtYXRjaFtTUEFDRVNfQU5EX0VRVUFMU10ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBhdHRyTmFtZSA9IG1hdGNoW0FUVFJJQlVURV9OQU1FXTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hbUVVPVEVfQ0hBUl0gPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gdGFnRW5kUmVnZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG1hdGNoW1FVT1RFX0NIQVJdID09PSAnXCInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG91YmxlUXVvdGVBdHRyRW5kUmVnZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzaW5nbGVRdW90ZUF0dHJFbmRSZWdleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChyZWdleCA9PT0gZG91YmxlUXVvdGVBdHRyRW5kUmVnZXggfHxcbiAgICAgICAgICAgICAgICByZWdleCA9PT0gc2luZ2xlUXVvdGVBdHRyRW5kUmVnZXgpIHtcbiAgICAgICAgICAgICAgICByZWdleCA9IHRhZ0VuZFJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocmVnZXggPT09IGNvbW1lbnRFbmRSZWdleCB8fCByZWdleCA9PT0gY29tbWVudDJFbmRSZWdleCkge1xuICAgICAgICAgICAgICAgIHJlZ2V4ID0gdGV4dEVuZFJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gTm90IG9uZSBvZiB0aGUgZml2ZSBzdGF0ZSByZWdleGVzLCBzbyBpdCBtdXN0IGJlIHRoZSBkeW5hbWljYWxseVxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZWQgcmF3IHRleHQgcmVnZXggYW5kIHdlJ3JlIGF0IHRoZSBjbG9zZSBvZiB0aGF0IGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgcmVnZXggPSB0YWdFbmRSZWdleDtcbiAgICAgICAgICAgICAgICByYXdUZXh0RW5kUmVnZXggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERFVl9NT0RFKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgYXR0ck5hbWVFbmRJbmRleCwgd2hpY2ggaW5kaWNhdGVzIHRoYXQgd2Ugc2hvdWxkXG4gICAgICAgICAgICAvLyByZXdyaXRlIHRoZSBhdHRyaWJ1dGUgbmFtZSwgYXNzZXJ0IHRoYXQgd2UncmUgaW4gYSB2YWxpZCBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vIHBvc2l0aW9uIC0gZWl0aGVyIGluIGEgdGFnLCBvciBhIHF1b3RlZCBhdHRyaWJ1dGUgdmFsdWUuXG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydChhdHRyTmFtZUVuZEluZGV4ID09PSAtMSB8fFxuICAgICAgICAgICAgICAgIHJlZ2V4ID09PSB0YWdFbmRSZWdleCB8fFxuICAgICAgICAgICAgICAgIHJlZ2V4ID09PSBzaW5nbGVRdW90ZUF0dHJFbmRSZWdleCB8fFxuICAgICAgICAgICAgICAgIHJlZ2V4ID09PSBkb3VibGVRdW90ZUF0dHJFbmRSZWdleCwgJ3VuZXhwZWN0ZWQgcGFyc2Ugc3RhdGUgQicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdlIGhhdmUgZm91ciBjYXNlczpcbiAgICAgICAgLy8gIDEuIFdlJ3JlIGluIHRleHQgcG9zaXRpb24sIGFuZCBub3QgaW4gYSByYXcgdGV4dCBlbGVtZW50XG4gICAgICAgIC8vICAgICAocmVnZXggPT09IHRleHRFbmRSZWdleCk6IGluc2VydCBhIGNvbW1lbnQgbWFya2VyLlxuICAgICAgICAvLyAgMi4gV2UgaGF2ZSBhIG5vbi1uZWdhdGl2ZSBhdHRyTmFtZUVuZEluZGV4IHdoaWNoIG1lYW5zIHdlIG5lZWQgdG9cbiAgICAgICAgLy8gICAgIHJld3JpdGUgdGhlIGF0dHJpYnV0ZSBuYW1lIHRvIGFkZCBhIGJvdW5kIGF0dHJpYnV0ZSBzdWZmaXguXG4gICAgICAgIC8vICAzLiBXZSdyZSBhdCB0aGUgbm9uLWZpcnN0IGJpbmRpbmcgaW4gYSBtdWx0aS1iaW5kaW5nIGF0dHJpYnV0ZSwgdXNlIGFcbiAgICAgICAgLy8gICAgIHBsYWluIG1hcmtlci5cbiAgICAgICAgLy8gIDQuIFdlJ3JlIHNvbWV3aGVyZSBlbHNlIGluc2lkZSB0aGUgdGFnLiBJZiB3ZSdyZSBpbiBhdHRyaWJ1dGUgbmFtZVxuICAgICAgICAvLyAgICAgcG9zaXRpb24gKGF0dHJOYW1lRW5kSW5kZXggPT09IC0yKSwgYWRkIGEgc2VxdWVudGlhbCBzdWZmaXggdG9cbiAgICAgICAgLy8gICAgIGdlbmVyYXRlIGEgdW5pcXVlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgICAvLyBEZXRlY3QgYSBiaW5kaW5nIG5leHQgdG8gc2VsZi1jbG9zaW5nIHRhZyBlbmQgYW5kIGluc2VydCBhIHNwYWNlIHRvXG4gICAgICAgIC8vIHNlcGFyYXRlIHRoZSBtYXJrZXIgZnJvbSB0aGUgdGFnIGVuZDpcbiAgICAgICAgY29uc3QgZW5kID0gcmVnZXggPT09IHRhZ0VuZFJlZ2V4ICYmIHN0cmluZ3NbaSArIDFdLnN0YXJ0c1dpdGgoJy8+JykgPyAnICcgOiAnJztcbiAgICAgICAgaHRtbCArPVxuICAgICAgICAgICAgcmVnZXggPT09IHRleHRFbmRSZWdleFxuICAgICAgICAgICAgICAgID8gcyArIG5vZGVNYXJrZXJcbiAgICAgICAgICAgICAgICA6IGF0dHJOYW1lRW5kSW5kZXggPj0gMFxuICAgICAgICAgICAgICAgICAgICA/IChhdHRyTmFtZXMucHVzaChhdHRyTmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBzLnNsaWNlKDAsIGF0dHJOYW1lRW5kSW5kZXgpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3VuZEF0dHJpYnV0ZVN1ZmZpeCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcy5zbGljZShhdHRyTmFtZUVuZEluZGV4KSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFxuICAgICAgICAgICAgICAgICAgICA6IHMgKyBtYXJrZXIgKyAoYXR0ck5hbWVFbmRJbmRleCA9PT0gLTIgPyBpIDogZW5kKTtcbiAgICB9XG4gICAgY29uc3QgaHRtbFJlc3VsdCA9IGh0bWwgK1xuICAgICAgICAoc3RyaW5nc1tsXSB8fCAnPD8+JykgK1xuICAgICAgICAodHlwZSA9PT0gU1ZHX1JFU1VMVCA/ICc8L3N2Zz4nIDogdHlwZSA9PT0gTUFUSE1MX1JFU1VMVCA/ICc8L21hdGg+JyA6ICcnKTtcbiAgICAvLyBSZXR1cm5lZCBhcyBhbiBhcnJheSBmb3IgdGVyc2VuZXNzXG4gICAgcmV0dXJuIFt0cnVzdEZyb21UZW1wbGF0ZVN0cmluZyhzdHJpbmdzLCBodG1sUmVzdWx0KSwgYXR0ck5hbWVzXTtcbn07XG5jbGFzcyBUZW1wbGF0ZSB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgLy8gVGhpcyBwcm9wZXJ0eSBuZWVkcyB0byByZW1haW4gdW5taW5pZmllZC5cbiAgICB7IHN0cmluZ3MsIFsnXyRsaXRUeXBlJCddOiB0eXBlIH0sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5wYXJ0cyA9IFtdO1xuICAgICAgICBsZXQgbm9kZTtcbiAgICAgICAgbGV0IG5vZGVJbmRleCA9IDA7XG4gICAgICAgIGxldCBhdHRyTmFtZUluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgcGFydENvdW50ID0gc3RyaW5ncy5sZW5ndGggLSAxO1xuICAgICAgICBjb25zdCBwYXJ0cyA9IHRoaXMucGFydHM7XG4gICAgICAgIC8vIENyZWF0ZSB0ZW1wbGF0ZSBlbGVtZW50XG4gICAgICAgIGNvbnN0IFtodG1sLCBhdHRyTmFtZXNdID0gZ2V0VGVtcGxhdGVIdG1sKHN0cmluZ3MsIHR5cGUpO1xuICAgICAgICB0aGlzLmVsID0gVGVtcGxhdGUuY3JlYXRlRWxlbWVudChodG1sLCBvcHRpb25zKTtcbiAgICAgICAgd2Fsa2VyLmN1cnJlbnROb2RlID0gdGhpcy5lbC5jb250ZW50O1xuICAgICAgICAvLyBSZS1wYXJlbnQgU1ZHIG9yIE1hdGhNTCBub2RlcyBpbnRvIHRlbXBsYXRlIHJvb3RcbiAgICAgICAgaWYgKHR5cGUgPT09IFNWR19SRVNVTFQgfHwgdHlwZSA9PT0gTUFUSE1MX1JFU1VMVCkge1xuICAgICAgICAgICAgY29uc3Qgd3JhcHBlciA9IHRoaXMuZWwuY29udGVudC5maXJzdENoaWxkO1xuICAgICAgICAgICAgd3JhcHBlci5yZXBsYWNlV2l0aCguLi53cmFwcGVyLmNoaWxkTm9kZXMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdhbGsgdGhlIHRlbXBsYXRlIHRvIGZpbmQgYmluZGluZyBtYXJrZXJzIGFuZCBjcmVhdGUgVGVtcGxhdGVQYXJ0c1xuICAgICAgICB3aGlsZSAoKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkgIT09IG51bGwgJiYgcGFydHMubGVuZ3RoIDwgcGFydENvdW50KSB7XG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGlmIChERVZfTU9ERSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWcgPSBub2RlLmxvY2FsTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2FybiBpZiBgdGV4dGFyZWFgIGluY2x1ZGVzIGFuIGV4cHJlc3Npb24gYW5kIHRocm93IGlmIGB0ZW1wbGF0ZWBcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9lcyBzaW5jZSB0aGVzZSBhcmUgbm90IHN1cHBvcnRlZC4gV2UgZG8gdGhpcyBieSBjaGVja2luZ1xuICAgICAgICAgICAgICAgICAgICAvLyBpbm5lckhUTUwgZm9yIGFueXRoaW5nIHRoYXQgbG9va3MgbGlrZSBhIG1hcmtlci4gVGhpcyBjYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2VzIGxpa2UgYmluZGluZ3MgaW4gdGV4dGFyZWEgdGhlcmUgbWFya2VycyB0dXJuIGludG8gdGV4dCBub2Rlcy5cbiAgICAgICAgICAgICAgICAgICAgaWYgKC9eKD86dGV4dGFyZWF8dGVtcGxhdGUpJC9pLnRlc3QodGFnKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwuaW5jbHVkZXMobWFya2VyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbSA9IGBFeHByZXNzaW9ucyBhcmUgbm90IHN1cHBvcnRlZCBpbnNpZGUgXFxgJHt0YWd9XFxgIGAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBlbGVtZW50cy4gU2VlIGh0dHBzOi8vbGl0LmRldi9tc2cvZXhwcmVzc2lvbi1pbi0ke3RhZ30gZm9yIG1vcmUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYGluZm9ybWF0aW9uLmA7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnID09PSAndGVtcGxhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzc3VlV2FybmluZygnJywgbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVE9ETyAoanVzdGluZmFnbmFuaSk6IGZvciBhdHRlbXB0ZWQgZHluYW1pYyB0YWcgbmFtZXMsIHdlIGRvbid0XG4gICAgICAgICAgICAgICAgLy8gaW5jcmVtZW50IHRoZSBiaW5kaW5nSW5kZXgsIGFuZCBpdCdsbCBiZSBvZmYgYnkgMSBpbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgICAgIC8vIGFuZCBvZmYgYnkgdHdvIGFmdGVyIGl0LlxuICAgICAgICAgICAgICAgIGlmIChub2RlLmhhc0F0dHJpYnV0ZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2Ygbm9kZS5nZXRBdHRyaWJ1dGVOYW1lcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZS5lbmRzV2l0aChib3VuZEF0dHJpYnV0ZVN1ZmZpeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWFsTmFtZSA9IGF0dHJOYW1lc1thdHRyTmFtZUluZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbm9kZS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdGljcyA9IHZhbHVlLnNwbGl0KG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbSA9IC8oWy4/QF0pPyguKikvLmV4ZWMocmVhbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBBVFRSSUJVVEVfUEFSVCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IG5vZGVJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbVsyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nczogc3RhdGljcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RvcjogbVsxXSA9PT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFByb3BlcnR5UGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBtWzFdID09PSAnPydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IEJvb2xlYW5BdHRyaWJ1dGVQYXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBtWzFdID09PSAnQCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBFdmVudFBhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBBdHRyaWJ1dGVQYXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobmFtZS5zdGFydHNXaXRoKG1hcmtlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogRUxFTUVOVF9QQVJULFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogbm9kZUluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFRPRE8gKGp1c3RpbmZhZ25hbmkpOiBiZW5jaG1hcmsgdGhlIHJlZ2V4IGFnYWluc3QgdGVzdGluZyBmb3IgZWFjaFxuICAgICAgICAgICAgICAgIC8vIG9mIHRoZSAzIHJhdyB0ZXh0IGVsZW1lbnQgbmFtZXMuXG4gICAgICAgICAgICAgICAgaWYgKHJhd1RleHRFbGVtZW50LnRlc3Qobm9kZS50YWdOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgcmF3IHRleHQgZWxlbWVudHMgd2UgbmVlZCB0byBzcGxpdCB0aGUgdGV4dCBjb250ZW50IG9uXG4gICAgICAgICAgICAgICAgICAgIC8vIG1hcmtlcnMsIGNyZWF0ZSBhIFRleHQgbm9kZSBmb3IgZWFjaCBzZWdtZW50LCBhbmQgY3JlYXRlXG4gICAgICAgICAgICAgICAgICAgIC8vIGEgVGVtcGxhdGVQYXJ0IGZvciBlYWNoIG1hcmtlci5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RyaW5ncyA9IG5vZGUudGV4dENvbnRlbnQuc3BsaXQobWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gc3RyaW5ncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdEluZGV4ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9IHRydXN0ZWRUeXBlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gdHJ1c3RlZFR5cGVzLmVtcHR5U2NyaXB0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIGEgbmV3IHRleHQgbm9kZSBmb3IgZWFjaCBsaXRlcmFsIHNlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXNlIG5vZGVzIGFyZSBhbHNvIHVzZWQgYXMgdGhlIG1hcmtlcnMgZm9yIGNoaWxkIHBhcnRzXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxhc3RJbmRleDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hcHBlbmQoc3RyaW5nc1tpXSwgY3JlYXRlTWFya2VyKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdhbGsgcGFzdCB0aGUgbWFya2VyIG5vZGUgd2UganVzdCBhZGRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhbGtlci5uZXh0Tm9kZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goeyB0eXBlOiBDSElMRF9QQVJULCBpbmRleDogKytub2RlSW5kZXggfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3RlIGJlY2F1c2UgdGhpcyBtYXJrZXIgaXMgYWRkZWQgYWZ0ZXIgdGhlIHdhbGtlcidzIGN1cnJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vZGUsIGl0IHdpbGwgYmUgd2Fsa2VkIHRvIGluIHRoZSBvdXRlciBsb29wIChhbmQgaWdub3JlZCksIHNvXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIGFkanVzdCBub2RlSW5kZXggaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hcHBlbmQoc3RyaW5nc1tsYXN0SW5kZXhdLCBjcmVhdGVNYXJrZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSA4KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IG5vZGUuZGF0YTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PT0gbWFya2VyTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydHMucHVzaCh7IHR5cGU6IENISUxEX1BBUlQsIGluZGV4OiBub2RlSW5kZXggfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKGkgPSBub2RlLmRhdGEuaW5kZXhPZihtYXJrZXIsIGkgKyAxKSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21tZW50IG5vZGUgaGFzIGEgYmluZGluZyBtYXJrZXIgaW5zaWRlLCBtYWtlIGFuIGluYWN0aXZlIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBiaW5kaW5nIHdvbid0IHdvcmssIGJ1dCBzdWJzZXF1ZW50IGJpbmRpbmdzIHdpbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goeyB0eXBlOiBDT01NRU5UX1BBUlQsIGluZGV4OiBub2RlSW5kZXggfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSBlbmQgb2YgdGhlIG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBpICs9IG1hcmtlci5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZUluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERFVl9NT0RFKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGVyZSB3YXMgYSBkdXBsaWNhdGUgYXR0cmlidXRlIG9uIGEgdGFnLCB0aGVuIHdoZW4gdGhlIHRhZyBpc1xuICAgICAgICAgICAgLy8gcGFyc2VkIGludG8gYW4gZWxlbWVudCB0aGUgYXR0cmlidXRlIGdldHMgZGUtZHVwbGljYXRlZC4gV2UgY2FuIGRldGVjdFxuICAgICAgICAgICAgLy8gdGhpcyBtaXNtYXRjaCBpZiB3ZSBoYXZlbid0IHByZWNpc2VseSBjb25zdW1lZCBldmVyeSBhdHRyaWJ1dGUgbmFtZVxuICAgICAgICAgICAgLy8gd2hlbiBwcmVwYXJpbmcgdGhlIHRlbXBsYXRlLiBUaGlzIHdvcmtzIGJlY2F1c2UgYGF0dHJOYW1lc2AgaXMgYnVpbHRcbiAgICAgICAgICAgIC8vIGZyb20gdGhlIHRlbXBsYXRlIHN0cmluZyBhbmQgYGF0dHJOYW1lSW5kZXhgIGNvbWVzIGZyb20gcHJvY2Vzc2luZyB0aGVcbiAgICAgICAgICAgIC8vIHJlc3VsdGluZyBET00uXG4gICAgICAgICAgICBpZiAoYXR0ck5hbWVzLmxlbmd0aCAhPT0gYXR0ck5hbWVJbmRleCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRGV0ZWN0ZWQgZHVwbGljYXRlIGF0dHJpYnV0ZSBiaW5kaW5ncy4gVGhpcyBvY2N1cnMgaWYgeW91ciB0ZW1wbGF0ZSBgICtcbiAgICAgICAgICAgICAgICAgICAgYGhhcyBkdXBsaWNhdGUgYXR0cmlidXRlcyBvbiBhbiBlbGVtZW50IHRhZy4gRm9yIGV4YW1wbGUgYCArXG4gICAgICAgICAgICAgICAgICAgIGBcIjxpbnB1dCA/ZGlzYWJsZWQ9XFwke3RydWV9ID9kaXNhYmxlZD1cXCR7ZmFsc2V9PlwiIGNvbnRhaW5zIGEgYCArXG4gICAgICAgICAgICAgICAgICAgIGBkdXBsaWNhdGUgXCJkaXNhYmxlZFwiIGF0dHJpYnV0ZS4gVGhlIGVycm9yIHdhcyBkZXRlY3RlZCBpbiBgICtcbiAgICAgICAgICAgICAgICAgICAgYHRoZSBmb2xsb3dpbmcgdGVtcGxhdGU6IFxcbmAgK1xuICAgICAgICAgICAgICAgICAgICAnYCcgK1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmdzLmpvaW4oJyR7Li4ufScpICtcbiAgICAgICAgICAgICAgICAgICAgJ2AnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBXZSBjb3VsZCBzZXQgd2Fsa2VyLmN1cnJlbnROb2RlIHRvIGFub3RoZXIgbm9kZSBoZXJlIHRvIHByZXZlbnQgYSBtZW1vcnlcbiAgICAgICAgLy8gbGVhaywgYnV0IGV2ZXJ5IHRpbWUgd2UgcHJlcGFyZSBhIHRlbXBsYXRlLCB3ZSBpbW1lZGlhdGVseSByZW5kZXIgaXRcbiAgICAgICAgLy8gYW5kIHJlLXVzZSB0aGUgd2Fsa2VyIGluIG5ldyBUZW1wbGF0ZUluc3RhbmNlLl9jbG9uZSgpLlxuICAgICAgICBkZWJ1Z0xvZ0V2ZW50ICYmXG4gICAgICAgICAgICBkZWJ1Z0xvZ0V2ZW50KHtcbiAgICAgICAgICAgICAgICBraW5kOiAndGVtcGxhdGUgcHJlcCcsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgY2xvbmFibGVUZW1wbGF0ZTogdGhpcy5lbCxcbiAgICAgICAgICAgICAgICBwYXJ0czogdGhpcy5wYXJ0cyxcbiAgICAgICAgICAgICAgICBzdHJpbmdzLFxuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIE92ZXJyaWRkZW4gdmlhIGBsaXRIdG1sUG9seWZpbGxTdXBwb3J0YCB0byBwcm92aWRlIHBsYXRmb3JtIHN1cHBvcnQuXG4gICAgLyoqIEBub2NvbGxhcHNlICovXG4gICAgc3RhdGljIGNyZWF0ZUVsZW1lbnQoaHRtbCwgX29wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkLmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGVsLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9XG59XG5mdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlKHBhcnQsIHZhbHVlLCBwYXJlbnQgPSBwYXJ0LCBhdHRyaWJ1dGVJbmRleCkge1xuICAgIC8vIEJhaWwgZWFybHkgaWYgdGhlIHZhbHVlIGlzIGV4cGxpY2l0bHkgbm9DaGFuZ2UuIE5vdGUsIHRoaXMgbWVhbnMgYW55XG4gICAgLy8gbmVzdGVkIGRpcmVjdGl2ZSBpcyBzdGlsbCBhdHRhY2hlZCBhbmQgaXMgbm90IHJ1bi5cbiAgICBpZiAodmFsdWUgPT09IG5vQ2hhbmdlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IGN1cnJlbnREaXJlY3RpdmUgPSBhdHRyaWJ1dGVJbmRleCAhPT0gdW5kZWZpbmVkXG4gICAgICAgID8gcGFyZW50Ll9fZGlyZWN0aXZlcz8uW2F0dHJpYnV0ZUluZGV4XVxuICAgICAgICA6IHBhcmVudC5fX2RpcmVjdGl2ZTtcbiAgICBjb25zdCBuZXh0RGlyZWN0aXZlQ29uc3RydWN0b3IgPSBpc1ByaW1pdGl2ZSh2YWx1ZSlcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiAvLyBUaGlzIHByb3BlcnR5IG5lZWRzIHRvIHJlbWFpbiB1bm1pbmlmaWVkLlxuICAgICAgICAgICAgdmFsdWVbJ18kbGl0RGlyZWN0aXZlJCddO1xuICAgIGlmIChjdXJyZW50RGlyZWN0aXZlPy5jb25zdHJ1Y3RvciAhPT0gbmV4dERpcmVjdGl2ZUNvbnN0cnVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgcHJvcGVydHkgbmVlZHMgdG8gcmVtYWluIHVubWluaWZpZWQuXG4gICAgICAgIGN1cnJlbnREaXJlY3RpdmU/LlsnXyRub3RpZnlEaXJlY3RpdmVDb25uZWN0aW9uQ2hhbmdlZCddPy4oZmFsc2UpO1xuICAgICAgICBpZiAobmV4dERpcmVjdGl2ZUNvbnN0cnVjdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlID0gbmV3IG5leHREaXJlY3RpdmVDb25zdHJ1Y3RvcihwYXJ0KTtcbiAgICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmUuXyRpbml0aWFsaXplKHBhcnQsIHBhcmVudCwgYXR0cmlidXRlSW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdHRyaWJ1dGVJbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAocGFyZW50Ll9fZGlyZWN0aXZlcyA/Pz0gW10pW2F0dHJpYnV0ZUluZGV4XSA9XG4gICAgICAgICAgICAgICAgY3VycmVudERpcmVjdGl2ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5fX2RpcmVjdGl2ZSA9IGN1cnJlbnREaXJlY3RpdmU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGN1cnJlbnREaXJlY3RpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWx1ZSA9IHJlc29sdmVEaXJlY3RpdmUocGFydCwgY3VycmVudERpcmVjdGl2ZS5fJHJlc29sdmUocGFydCwgdmFsdWUudmFsdWVzKSwgY3VycmVudERpcmVjdGl2ZSwgYXR0cmlidXRlSW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG4vKipcbiAqIEFuIHVwZGF0ZWFibGUgaW5zdGFuY2Ugb2YgYSBUZW1wbGF0ZS4gSG9sZHMgcmVmZXJlbmNlcyB0byB0aGUgUGFydHMgdXNlZCB0b1xuICogdXBkYXRlIHRoZSB0ZW1wbGF0ZSBpbnN0YW5jZS5cbiAqL1xuY2xhc3MgVGVtcGxhdGVJbnN0YW5jZSB7XG4gICAgY29uc3RydWN0b3IodGVtcGxhdGUsIHBhcmVudCkge1xuICAgICAgICB0aGlzLl8kcGFydHMgPSBbXTtcbiAgICAgICAgLyoqIEBpbnRlcm5hbCAqL1xuICAgICAgICB0aGlzLl8kZGlzY29ubmVjdGFibGVDaGlsZHJlbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fJHRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICAgIHRoaXMuXyRwYXJlbnQgPSBwYXJlbnQ7XG4gICAgfVxuICAgIC8vIENhbGxlZCBieSBDaGlsZFBhcnQgcGFyZW50Tm9kZSBnZXR0ZXJcbiAgICBnZXQgcGFyZW50Tm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXyRwYXJlbnQucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgLy8gU2VlIGNvbW1lbnQgaW4gRGlzY29ubmVjdGFibGUgaW50ZXJmYWNlIGZvciB3aHkgdGhpcyBpcyBhIGdldHRlclxuICAgIGdldCBfJGlzQ29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fJHBhcmVudC5fJGlzQ29ubmVjdGVkO1xuICAgIH1cbiAgICAvLyBUaGlzIG1ldGhvZCBpcyBzZXBhcmF0ZSBmcm9tIHRoZSBjb25zdHJ1Y3RvciBiZWNhdXNlIHdlIG5lZWQgdG8gcmV0dXJuIGFcbiAgICAvLyBEb2N1bWVudEZyYWdtZW50IGFuZCB3ZSBkb24ndCB3YW50IHRvIGhvbGQgb250byBpdCB3aXRoIGFuIGluc3RhbmNlIGZpZWxkLlxuICAgIF9jbG9uZShvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHsgZWw6IHsgY29udGVudCB9LCBwYXJ0czogcGFydHMsIH0gPSB0aGlzLl8kdGVtcGxhdGU7XG4gICAgICAgIGNvbnN0IGZyYWdtZW50ID0gKG9wdGlvbnM/LmNyZWF0aW9uU2NvcGUgPz8gZCkuaW1wb3J0Tm9kZShjb250ZW50LCB0cnVlKTtcbiAgICAgICAgd2Fsa2VyLmN1cnJlbnROb2RlID0gZnJhZ21lbnQ7XG4gICAgICAgIGxldCBub2RlID0gd2Fsa2VyLm5leHROb2RlKCk7XG4gICAgICAgIGxldCBub2RlSW5kZXggPSAwO1xuICAgICAgICBsZXQgcGFydEluZGV4ID0gMDtcbiAgICAgICAgbGV0IHRlbXBsYXRlUGFydCA9IHBhcnRzWzBdO1xuICAgICAgICB3aGlsZSAodGVtcGxhdGVQYXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChub2RlSW5kZXggPT09IHRlbXBsYXRlUGFydC5pbmRleCkge1xuICAgICAgICAgICAgICAgIGxldCBwYXJ0O1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVBhcnQudHlwZSA9PT0gQ0hJTERfUEFSVCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gbmV3IENoaWxkUGFydChub2RlLCBub2RlLm5leHRTaWJsaW5nLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGVtcGxhdGVQYXJ0LnR5cGUgPT09IEFUVFJJQlVURV9QQVJUKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnQgPSBuZXcgdGVtcGxhdGVQYXJ0LmN0b3Iobm9kZSwgdGVtcGxhdGVQYXJ0Lm5hbWUsIHRlbXBsYXRlUGFydC5zdHJpbmdzLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGVtcGxhdGVQYXJ0LnR5cGUgPT09IEVMRU1FTlRfUEFSVCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gbmV3IEVsZW1lbnRQYXJ0KG5vZGUsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl8kcGFydHMucHVzaChwYXJ0KTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVBhcnQgPSBwYXJ0c1srK3BhcnRJbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZUluZGV4ICE9PSB0ZW1wbGF0ZVBhcnQ/LmluZGV4KSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpO1xuICAgICAgICAgICAgICAgIG5vZGVJbmRleCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBjdXJyZW50Tm9kZSBhd2F5IGZyb20gdGhlIGNsb25lZCB0cmVlIHNvIHRoYXQgd2VcbiAgICAgICAgLy8gZG9uJ3QgaG9sZCBvbnRvIHRoZSB0cmVlIGV2ZW4gaWYgdGhlIHRyZWUgaXMgZGV0YWNoZWQgYW5kIHNob3VsZCBiZVxuICAgICAgICAvLyBmcmVlZC5cbiAgICAgICAgd2Fsa2VyLmN1cnJlbnROb2RlID0gZDtcbiAgICAgICAgcmV0dXJuIGZyYWdtZW50O1xuICAgIH1cbiAgICBfdXBkYXRlKHZhbHVlcykge1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiB0aGlzLl8kcGFydHMpIHtcbiAgICAgICAgICAgIGlmIChwYXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZ0V2ZW50ICYmXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nRXZlbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogJ3NldCBwYXJ0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWVzW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVJbmRleDogaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0LnN0cmluZ3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0Ll8kc2V0VmFsdWUodmFsdWVzLCBwYXJ0LCBpKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG51bWJlciBvZiB2YWx1ZXMgdGhlIHBhcnQgY29uc3VtZXMgaXMgcGFydC5zdHJpbmdzLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luY2UgdmFsdWVzIGFyZSBpbiBiZXR3ZWVuIHRlbXBsYXRlIHNwYW5zLiBXZSBpbmNyZW1lbnQgaSBieSAxXG4gICAgICAgICAgICAgICAgICAgIC8vIGxhdGVyIGluIHRoZSBsb29wLCBzbyBpbmNyZW1lbnQgaXQgYnkgcGFydC5zdHJpbmdzLmxlbmd0aCAtIDIgaGVyZVxuICAgICAgICAgICAgICAgICAgICBpICs9IHBhcnQuc3RyaW5ncy5sZW5ndGggLSAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydC5fJHNldFZhbHVlKHZhbHVlc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfVxufVxuY2xhc3MgQ2hpbGRQYXJ0IHtcbiAgICAvLyBTZWUgY29tbWVudCBpbiBEaXNjb25uZWN0YWJsZSBpbnRlcmZhY2UgZm9yIHdoeSB0aGlzIGlzIGEgZ2V0dGVyXG4gICAgZ2V0IF8kaXNDb25uZWN0ZWQoKSB7XG4gICAgICAgIC8vIENoaWxkUGFydHMgdGhhdCBhcmUgbm90IGF0IHRoZSByb290IHNob3VsZCBhbHdheXMgYmUgY3JlYXRlZCB3aXRoIGFcbiAgICAgICAgLy8gcGFyZW50OyBvbmx5IFJvb3RDaGlsZE5vZGUncyB3b24ndCwgc28gdGhleSByZXR1cm4gdGhlIGxvY2FsIGlzQ29ubmVjdGVkXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHJldHVybiB0aGlzLl8kcGFyZW50Py5fJGlzQ29ubmVjdGVkID8/IHRoaXMuX19pc0Nvbm5lY3RlZDtcbiAgICB9XG4gICAgY29uc3RydWN0b3Ioc3RhcnROb2RlLCBlbmROb2RlLCBwYXJlbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gQ0hJTERfUEFSVDtcbiAgICAgICAgdGhpcy5fJGNvbW1pdHRlZFZhbHVlID0gbm90aGluZztcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBmaWVsZHMgd2lsbCBiZSBwYXRjaGVkIG9udG8gQ2hpbGRQYXJ0cyB3aGVuIHJlcXVpcmVkIGJ5XG4gICAgICAgIC8vIEFzeW5jRGlyZWN0aXZlXG4gICAgICAgIC8qKiBAaW50ZXJuYWwgKi9cbiAgICAgICAgdGhpcy5fJGRpc2Nvbm5lY3RhYmxlQ2hpbGRyZW4gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuXyRzdGFydE5vZGUgPSBzdGFydE5vZGU7XG4gICAgICAgIHRoaXMuXyRlbmROb2RlID0gZW5kTm9kZTtcbiAgICAgICAgdGhpcy5fJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgLy8gTm90ZSBfX2lzQ29ubmVjdGVkIGlzIG9ubHkgZXZlciBhY2Nlc3NlZCBvbiBSb290UGFydHMgKGkuZS4gd2hlbiB0aGVyZSBpc1xuICAgICAgICAvLyBubyBfJHBhcmVudCk7IHRoZSB2YWx1ZSBvbiBhIG5vbi1yb290LXBhcnQgaXMgXCJkb24ndCBjYXJlXCIsIGJ1dCBjaGVja2luZ1xuICAgICAgICAvLyBmb3IgcGFyZW50IHdvdWxkIGJlIG1vcmUgY29kZVxuICAgICAgICB0aGlzLl9faXNDb25uZWN0ZWQgPSBvcHRpb25zPy5pc0Nvbm5lY3RlZCA/PyB0cnVlO1xuICAgICAgICBpZiAoRU5BQkxFX0VYVFJBX1NFQ1VSSVRZX0hPT0tTKSB7XG4gICAgICAgICAgICAvLyBFeHBsaWNpdGx5IGluaXRpYWxpemUgZm9yIGNvbnNpc3RlbnQgY2xhc3Mgc2hhcGUuXG4gICAgICAgICAgICB0aGlzLl90ZXh0U2FuaXRpemVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRoZSBwYXJlbnQgbm9kZSBpbnRvIHdoaWNoIHRoZSBwYXJ0IHJlbmRlcnMgaXRzIGNvbnRlbnQuXG4gICAgICpcbiAgICAgKiBBIENoaWxkUGFydCdzIGNvbnRlbnQgY29uc2lzdHMgb2YgYSByYW5nZSBvZiBhZGphY2VudCBjaGlsZCBub2RlcyBvZlxuICAgICAqIGAucGFyZW50Tm9kZWAsIHBvc3NpYmx5IGJvcmRlcmVkIGJ5ICdtYXJrZXIgbm9kZXMnIChgLnN0YXJ0Tm9kZWAgYW5kXG4gICAgICogYC5lbmROb2RlYCkuXG4gICAgICpcbiAgICAgKiAtIElmIGJvdGggYC5zdGFydE5vZGVgIGFuZCBgLmVuZE5vZGVgIGFyZSBub24tbnVsbCwgdGhlbiB0aGUgcGFydCdzIGNvbnRlbnRcbiAgICAgKiBjb25zaXN0cyBvZiBhbGwgc2libGluZ3MgYmV0d2VlbiBgLnN0YXJ0Tm9kZWAgYW5kIGAuZW5kTm9kZWAsIGV4Y2x1c2l2ZWx5LlxuICAgICAqXG4gICAgICogLSBJZiBgLnN0YXJ0Tm9kZWAgaXMgbm9uLW51bGwgYnV0IGAuZW5kTm9kZWAgaXMgbnVsbCwgdGhlbiB0aGUgcGFydCdzXG4gICAgICogY29udGVudCBjb25zaXN0cyBvZiBhbGwgc2libGluZ3MgZm9sbG93aW5nIGAuc3RhcnROb2RlYCwgdXAgdG8gYW5kXG4gICAgICogaW5jbHVkaW5nIHRoZSBsYXN0IGNoaWxkIG9mIGAucGFyZW50Tm9kZWAuIElmIGAuZW5kTm9kZWAgaXMgbm9uLW51bGwsIHRoZW5cbiAgICAgKiBgLnN0YXJ0Tm9kZWAgd2lsbCBhbHdheXMgYmUgbm9uLW51bGwuXG4gICAgICpcbiAgICAgKiAtIElmIGJvdGggYC5lbmROb2RlYCBhbmQgYC5zdGFydE5vZGVgIGFyZSBudWxsLCB0aGVuIHRoZSBwYXJ0J3MgY29udGVudFxuICAgICAqIGNvbnNpc3RzIG9mIGFsbCBjaGlsZCBub2RlcyBvZiBgLnBhcmVudE5vZGVgLlxuICAgICAqL1xuICAgIGdldCBwYXJlbnROb2RlKCkge1xuICAgICAgICBsZXQgcGFyZW50Tm9kZSA9IHdyYXAodGhpcy5fJHN0YXJ0Tm9kZSkucGFyZW50Tm9kZTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fJHBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBwYXJlbnROb2RlPy5ub2RlVHlwZSA9PT0gMTEgLyogTm9kZS5ET0NVTUVOVF9GUkFHTUVOVCAqLykge1xuICAgICAgICAgICAgLy8gSWYgdGhlIHBhcmVudE5vZGUgaXMgYSBEb2N1bWVudEZyYWdtZW50LCBpdCBtYXkgYmUgYmVjYXVzZSB0aGUgRE9NIGlzXG4gICAgICAgICAgICAvLyBzdGlsbCBpbiB0aGUgY2xvbmVkIGZyYWdtZW50IGR1cmluZyBpbml0aWFsIHJlbmRlcjsgaWYgc28sIGdldCB0aGUgcmVhbFxuICAgICAgICAgICAgLy8gcGFyZW50Tm9kZSB0aGUgcGFydCB3aWxsIGJlIGNvbW1pdHRlZCBpbnRvIGJ5IGFza2luZyB0aGUgcGFyZW50LlxuICAgICAgICAgICAgcGFyZW50Tm9kZSA9IHBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJlbnROb2RlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUaGUgcGFydCdzIGxlYWRpbmcgbWFya2VyIG5vZGUsIGlmIGFueS4gU2VlIGAucGFyZW50Tm9kZWAgZm9yIG1vcmVcbiAgICAgKiBpbmZvcm1hdGlvbi5cbiAgICAgKi9cbiAgICBnZXQgc3RhcnROb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fJHN0YXJ0Tm9kZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGhlIHBhcnQncyB0cmFpbGluZyBtYXJrZXIgbm9kZSwgaWYgYW55LiBTZWUgYC5wYXJlbnROb2RlYCBmb3IgbW9yZVxuICAgICAqIGluZm9ybWF0aW9uLlxuICAgICAqL1xuICAgIGdldCBlbmROb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fJGVuZE5vZGU7XG4gICAgfVxuICAgIF8kc2V0VmFsdWUodmFsdWUsIGRpcmVjdGl2ZVBhcmVudCA9IHRoaXMpIHtcbiAgICAgICAgaWYgKERFVl9NT0RFICYmIHRoaXMucGFyZW50Tm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGlzIFxcYENoaWxkUGFydFxcYCBoYXMgbm8gXFxgcGFyZW50Tm9kZVxcYCBhbmQgdGhlcmVmb3JlIGNhbm5vdCBhY2NlcHQgYSB2YWx1ZS4gVGhpcyBsaWtlbHkgbWVhbnMgdGhlIGVsZW1lbnQgY29udGFpbmluZyB0aGUgcGFydCB3YXMgbWFuaXB1bGF0ZWQgaW4gYW4gdW5zdXBwb3J0ZWQgd2F5IG91dHNpZGUgb2YgTGl0J3MgY29udHJvbCBzdWNoIHRoYXQgdGhlIHBhcnQncyBtYXJrZXIgbm9kZXMgd2VyZSBlamVjdGVkIGZyb20gRE9NLiBGb3IgZXhhbXBsZSwgc2V0dGluZyB0aGUgZWxlbWVudCdzIFxcYGlubmVySFRNTFxcYCBvciBcXGB0ZXh0Q29udGVudFxcYCBjYW4gZG8gdGhpcy5gKTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IHJlc29sdmVEaXJlY3RpdmUodGhpcywgdmFsdWUsIGRpcmVjdGl2ZVBhcmVudCk7XG4gICAgICAgIGlmIChpc1ByaW1pdGl2ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIC8vIE5vbi1yZW5kZXJpbmcgY2hpbGQgdmFsdWVzLiBJdCdzIGltcG9ydGFudCB0aGF0IHRoZXNlIGRvIG5vdCByZW5kZXJcbiAgICAgICAgICAgIC8vIGVtcHR5IHRleHQgbm9kZXMgdG8gYXZvaWQgaXNzdWVzIHdpdGggcHJldmVudGluZyBkZWZhdWx0IDxzbG90PlxuICAgICAgICAgICAgLy8gZmFsbGJhY2sgY29udGVudC5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbm90aGluZyB8fCB2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl8kY29tbWl0dGVkVmFsdWUgIT09IG5vdGhpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZDogJ2NvbW1pdCBub3RoaW5nIHRvIGNoaWxkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogdGhpcy5fJHN0YXJ0Tm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IHRoaXMuXyRlbmROb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogdGhpcy5fJHBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fJGNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuXyRjb21taXR0ZWRWYWx1ZSA9IG5vdGhpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPT0gdGhpcy5fJGNvbW1pdHRlZFZhbHVlICYmIHZhbHVlICE9PSBub0NoYW5nZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRleHQodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVGhpcyBwcm9wZXJ0eSBuZWVkcyB0byByZW1haW4gdW5taW5pZmllZC5cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZVsnXyRsaXRUeXBlJCddICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRlbXBsYXRlUmVzdWx0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZS5ub2RlVHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoREVWX01PREUgJiYgdGhpcy5vcHRpb25zPy5ob3N0ID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRleHQoYFtwcm9iYWJsZSBtaXN0YWtlOiByZW5kZXJlZCBhIHRlbXBsYXRlJ3MgaG9zdCBpbiBpdHNlbGYgYCArXG4gICAgICAgICAgICAgICAgICAgIGAoY29tbW9ubHkgY2F1c2VkIGJ5IHdyaXRpbmcgXFwke3RoaXN9IGluIGEgdGVtcGxhdGVdYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBBdHRlbXB0ZWQgdG8gcmVuZGVyIHRoZSB0ZW1wbGF0ZSBob3N0YCwgdmFsdWUsIGBpbnNpZGUgaXRzZWxmLiBUaGlzIGlzIGFsbW9zdCBhbHdheXMgYSBtaXN0YWtlLCBhbmQgaW4gZGV2IG1vZGUgYCwgYHdlIHJlbmRlciBzb21lIHdhcm5pbmcgdGV4dC4gSW4gcHJvZHVjdGlvbiBob3dldmVyLCB3ZSdsbCBgLCBgcmVuZGVyIGl0LCB3aGljaCB3aWxsIHVzdWFsbHkgcmVzdWx0IGluIGFuIGVycm9yLCBhbmQgc29tZXRpbWVzIGAsIGBpbiB0aGUgZWxlbWVudCBkaXNhcHBlYXJpbmcgZnJvbSB0aGUgRE9NLmApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdE5vZGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzSXRlcmFibGUodmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLl9jb21taXRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBGYWxsYmFjaywgd2lsbCByZW5kZXIgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvblxuICAgICAgICAgICAgdGhpcy5fY29tbWl0VGV4dCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2luc2VydChub2RlKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHdyYXAodGhpcy5fJHN0YXJ0Tm9kZSkucGFyZW50Tm9kZSkuaW5zZXJ0QmVmb3JlKG5vZGUsIHRoaXMuXyRlbmROb2RlKTtcbiAgICB9XG4gICAgX2NvbW1pdE5vZGUodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuXyRjb21taXR0ZWRWYWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuXyRjbGVhcigpO1xuICAgICAgICAgICAgaWYgKEVOQUJMRV9FWFRSQV9TRUNVUklUWV9IT09LUyAmJlxuICAgICAgICAgICAgICAgIHNhbml0aXplckZhY3RvcnlJbnRlcm5hbCAhPT0gbm9vcFNhbml0aXplcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudE5vZGVOYW1lID0gdGhpcy5fJHN0YXJ0Tm9kZS5wYXJlbnROb2RlPy5ub2RlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZU5hbWUgPT09ICdTVFlMRScgfHwgcGFyZW50Tm9kZU5hbWUgPT09ICdTQ1JJUFQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJ0ZvcmJpZGRlbic7XG4gICAgICAgICAgICAgICAgICAgIGlmIChERVZfTU9ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGVOYW1lID09PSAnU1RZTEUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBMaXQgZG9lcyBub3Qgc3VwcG9ydCBiaW5kaW5nIGluc2lkZSBzdHlsZSBub2Rlcy4gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgVGhpcyBpcyBhIHNlY3VyaXR5IHJpc2ssIGFzIHN0eWxlIGluamVjdGlvbiBhdHRhY2tzIGNhbiBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBleGZpbHRyYXRlIGRhdGEgYW5kIHNwb29mIFVJcy4gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgQ29uc2lkZXIgaW5zdGVhZCB1c2luZyBjc3NcXGAuLi5cXGAgbGl0ZXJhbHMgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgdG8gY29tcG9zZSBzdHlsZXMsIGFuZCBkbyBkeW5hbWljIHN0eWxpbmcgd2l0aCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBjc3MgY3VzdG9tIHByb3BlcnRpZXMsIDo6cGFydHMsIDxzbG90PnMsIGAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYGFuZCBieSBtdXRhdGluZyB0aGUgRE9NIHJhdGhlciB0aGFuIHN0eWxlc2hlZXRzLmA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYExpdCBkb2VzIG5vdCBzdXBwb3J0IGJpbmRpbmcgaW5zaWRlIHNjcmlwdCBub2Rlcy4gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgVGhpcyBpcyBhIHNlY3VyaXR5IHJpc2ssIGFzIGl0IGNvdWxkIGFsbG93IGFyYml0cmFyeSBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBjb2RlIGV4ZWN1dGlvbi5gO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1Z0xvZ0V2ZW50ICYmXG4gICAgICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6ICdjb21taXQgbm9kZScsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB0aGlzLl8kc3RhcnROb2RlLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHRoaXMuXyRwYXJlbnQsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fJGNvbW1pdHRlZFZhbHVlID0gdGhpcy5faW5zZXJ0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfY29tbWl0VGV4dCh2YWx1ZSkge1xuICAgICAgICAvLyBJZiB0aGUgY29tbWl0dGVkIHZhbHVlIGlzIGEgcHJpbWl0aXZlIGl0IG1lYW5zIHdlIGNhbGxlZCBfY29tbWl0VGV4dCBvblxuICAgICAgICAvLyB0aGUgcHJldmlvdXMgcmVuZGVyLCBhbmQgd2Uga25vdyB0aGF0IHRoaXMuXyRzdGFydE5vZGUubmV4dFNpYmxpbmcgaXMgYVxuICAgICAgICAvLyBUZXh0IG5vZGUuIFdlIGNhbiBub3cganVzdCByZXBsYWNlIHRoZSB0ZXh0IGNvbnRlbnQgKC5kYXRhKSBvZiB0aGUgbm9kZS5cbiAgICAgICAgaWYgKHRoaXMuXyRjb21taXR0ZWRWYWx1ZSAhPT0gbm90aGluZyAmJlxuICAgICAgICAgICAgaXNQcmltaXRpdmUodGhpcy5fJGNvbW1pdHRlZFZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHdyYXAodGhpcy5fJHN0YXJ0Tm9kZSkubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICBpZiAoRU5BQkxFX0VYVFJBX1NFQ1VSSVRZX0hPT0tTKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3RleHRTYW5pdGl6ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90ZXh0U2FuaXRpemVyID0gY3JlYXRlU2FuaXRpemVyKG5vZGUsICdkYXRhJywgJ3Byb3BlcnR5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5fdGV4dFNhbml0aXplcih2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1Z0xvZ0V2ZW50ICYmXG4gICAgICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6ICdjb21taXQgdGV4dCcsXG4gICAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChFTkFCTEVfRVhUUkFfU0VDVVJJVFlfSE9PS1MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0Tm9kZSA9IGQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbW1pdE5vZGUodGV4dE5vZGUpO1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gc2V0dGluZyB0ZXh0IGNvbnRlbnQsIGZvciBzZWN1cml0eSBwdXJwb3NlcyBpdCBtYXR0ZXJzIGEgbG90XG4gICAgICAgICAgICAgICAgLy8gd2hhdCB0aGUgcGFyZW50IGlzLiBGb3IgZXhhbXBsZSwgPHN0eWxlPiBhbmQgPHNjcmlwdD4gbmVlZCB0byBiZVxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZWQgd2l0aCBjYXJlLCB3aGlsZSA8c3Bhbj4gZG9lcyBub3QuIFNvIGZpcnN0IHdlIG5lZWQgdG8gcHV0IGFcbiAgICAgICAgICAgICAgICAvLyB0ZXh0IG5vZGUgaW50byB0aGUgZG9jdW1lbnQsIHRoZW4gd2UgY2FuIHNhbml0aXplIGl0cyBjb250ZW50LlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl90ZXh0U2FuaXRpemVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGV4dFNhbml0aXplciA9IGNyZWF0ZVNhbml0aXplcih0ZXh0Tm9kZSwgJ2RhdGEnLCAncHJvcGVydHknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLl90ZXh0U2FuaXRpemVyKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZ0V2ZW50ICYmXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nRXZlbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogJ2NvbW1pdCB0ZXh0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IHRleHROb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRleHROb2RlLmRhdGEgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbW1pdE5vZGUoZC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSkpO1xuICAgICAgICAgICAgICAgIGRlYnVnTG9nRXZlbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBraW5kOiAnY29tbWl0IHRleHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZTogd3JhcCh0aGlzLl8kc3RhcnROb2RlKS5uZXh0U2libGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl8kY29tbWl0dGVkVmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgX2NvbW1pdFRlbXBsYXRlUmVzdWx0KHJlc3VsdCkge1xuICAgICAgICAvLyBUaGlzIHByb3BlcnR5IG5lZWRzIHRvIHJlbWFpbiB1bm1pbmlmaWVkLlxuICAgICAgICBjb25zdCB7IHZhbHVlcywgWydfJGxpdFR5cGUkJ106IHR5cGUgfSA9IHJlc3VsdDtcbiAgICAgICAgLy8gSWYgJGxpdFR5cGUkIGlzIGEgbnVtYmVyLCByZXN1bHQgaXMgYSBwbGFpbiBUZW1wbGF0ZVJlc3VsdCBhbmQgd2UgZ2V0XG4gICAgICAgIC8vIHRoZSB0ZW1wbGF0ZSBmcm9tIHRoZSB0ZW1wbGF0ZSBjYWNoZS4gSWYgbm90LCByZXN1bHQgaXMgYVxuICAgICAgICAvLyBDb21waWxlZFRlbXBsYXRlUmVzdWx0IGFuZCBfJGxpdFR5cGUkIGlzIGEgQ29tcGlsZWRUZW1wbGF0ZSBhbmQgd2UgbmVlZFxuICAgICAgICAvLyB0byBjcmVhdGUgdGhlIDx0ZW1wbGF0ZT4gZWxlbWVudCB0aGUgZmlyc3QgdGltZSB3ZSBzZWUgaXQuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdHlwZW9mIHR5cGUgPT09ICdudW1iZXInXG4gICAgICAgICAgICA/IHRoaXMuXyRnZXRUZW1wbGF0ZShyZXN1bHQpXG4gICAgICAgICAgICA6ICh0eXBlLmVsID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAodHlwZS5lbCA9IFRlbXBsYXRlLmNyZWF0ZUVsZW1lbnQodHJ1c3RGcm9tVGVtcGxhdGVTdHJpbmcodHlwZS5oLCB0eXBlLmhbMF0pLCB0aGlzLm9wdGlvbnMpKSxcbiAgICAgICAgICAgICAgICB0eXBlKTtcbiAgICAgICAgaWYgKHRoaXMuXyRjb21taXR0ZWRWYWx1ZT8uXyR0ZW1wbGF0ZSA9PT0gdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGRlYnVnTG9nRXZlbnQgJiZcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZ0V2ZW50KHtcbiAgICAgICAgICAgICAgICAgICAga2luZDogJ3RlbXBsYXRlIHVwZGF0aW5nJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlOiB0aGlzLl8kY29tbWl0dGVkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzOiB0aGlzLl8kY29tbWl0dGVkVmFsdWUuXyRwYXJ0cyxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl8kY29tbWl0dGVkVmFsdWUuX3VwZGF0ZSh2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgVGVtcGxhdGVJbnN0YW5jZSh0ZW1wbGF0ZSwgdGhpcyk7XG4gICAgICAgICAgICBjb25zdCBmcmFnbWVudCA9IGluc3RhbmNlLl9jbG9uZSh0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICAgICAgICAgIGRlYnVnTG9nRXZlbnQoe1xuICAgICAgICAgICAgICAgICAgICBraW5kOiAndGVtcGxhdGUgaW5zdGFudGlhdGVkJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgICAgICAgICBwYXJ0czogaW5zdGFuY2UuXyRwYXJ0cyxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaW5zdGFuY2UuX3VwZGF0ZSh2YWx1ZXMpO1xuICAgICAgICAgICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICAgICAgICAgIGRlYnVnTG9nRXZlbnQoe1xuICAgICAgICAgICAgICAgICAgICBraW5kOiAndGVtcGxhdGUgaW5zdGFudGlhdGVkIGFuZCB1cGRhdGVkJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgICAgICAgICBwYXJ0czogaW5zdGFuY2UuXyRwYXJ0cyxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fY29tbWl0Tm9kZShmcmFnbWVudCk7XG4gICAgICAgICAgICB0aGlzLl8kY29tbWl0dGVkVmFsdWUgPSBpbnN0YW5jZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBPdmVycmlkZGVuIHZpYSBgbGl0SHRtbFBvbHlmaWxsU3VwcG9ydGAgdG8gcHJvdmlkZSBwbGF0Zm9ybSBzdXBwb3J0LlxuICAgIC8qKiBAaW50ZXJuYWwgKi9cbiAgICBfJGdldFRlbXBsYXRlKHJlc3VsdCkge1xuICAgICAgICBsZXQgdGVtcGxhdGUgPSB0ZW1wbGF0ZUNhY2hlLmdldChyZXN1bHQuc3RyaW5ncyk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZUNhY2hlLnNldChyZXN1bHQuc3RyaW5ncywgKHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKHJlc3VsdCkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuICAgIF9jb21taXRJdGVyYWJsZSh2YWx1ZSkge1xuICAgICAgICAvLyBGb3IgYW4gSXRlcmFibGUsIHdlIGNyZWF0ZSBhIG5ldyBJbnN0YW5jZVBhcnQgcGVyIGl0ZW0sIHRoZW4gc2V0IGl0c1xuICAgICAgICAvLyB2YWx1ZSB0byB0aGUgaXRlbS4gVGhpcyBpcyBhIGxpdHRsZSBiaXQgb2Ygb3ZlcmhlYWQgZm9yIGV2ZXJ5IGl0ZW0gaW5cbiAgICAgICAgLy8gYW4gSXRlcmFibGUsIGJ1dCBpdCBsZXRzIHVzIHJlY3Vyc2UgZWFzaWx5IGFuZCBlZmZpY2llbnRseSB1cGRhdGUgQXJyYXlzXG4gICAgICAgIC8vIG9mIFRlbXBsYXRlUmVzdWx0cyB0aGF0IHdpbGwgYmUgY29tbW9ubHkgcmV0dXJuZWQgZnJvbSBleHByZXNzaW9ucyBsaWtlOlxuICAgICAgICAvLyBhcnJheS5tYXAoKGkpID0+IGh0bWxgJHtpfWApLCBieSByZXVzaW5nIGV4aXN0aW5nIFRlbXBsYXRlSW5zdGFuY2VzLlxuICAgICAgICAvLyBJZiB2YWx1ZSBpcyBhbiBhcnJheSwgdGhlbiB0aGUgcHJldmlvdXMgcmVuZGVyIHdhcyBvZiBhblxuICAgICAgICAvLyBpdGVyYWJsZSBhbmQgdmFsdWUgd2lsbCBjb250YWluIHRoZSBDaGlsZFBhcnRzIGZyb20gdGhlIHByZXZpb3VzXG4gICAgICAgIC8vIHJlbmRlci4gSWYgdmFsdWUgaXMgbm90IGFuIGFycmF5LCBjbGVhciB0aGlzIHBhcnQgYW5kIG1ha2UgYSBuZXdcbiAgICAgICAgLy8gYXJyYXkgZm9yIENoaWxkUGFydHMuXG4gICAgICAgIGlmICghaXNBcnJheSh0aGlzLl8kY29tbWl0dGVkVmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLl8kY29tbWl0dGVkVmFsdWUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuXyRjbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIC8vIExldHMgdXMga2VlcCB0cmFjayBvZiBob3cgbWFueSBpdGVtcyB3ZSBzdGFtcGVkIHNvIHdlIGNhbiBjbGVhciBsZWZ0b3ZlclxuICAgICAgICAvLyBpdGVtcyBmcm9tIGEgcHJldmlvdXMgcmVuZGVyXG4gICAgICAgIGNvbnN0IGl0ZW1QYXJ0cyA9IHRoaXMuXyRjb21taXR0ZWRWYWx1ZTtcbiAgICAgICAgbGV0IHBhcnRJbmRleCA9IDA7XG4gICAgICAgIGxldCBpdGVtUGFydDtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAocGFydEluZGV4ID09PSBpdGVtUGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gZXhpc3RpbmcgcGFydCwgY3JlYXRlIGEgbmV3IG9uZVxuICAgICAgICAgICAgICAgIC8vIFRPRE8gKGp1c3RpbmZhZ25hbmkpOiB0ZXN0IHBlcmYgaW1wYWN0IG9mIGFsd2F5cyBjcmVhdGluZyB0d28gcGFydHNcbiAgICAgICAgICAgICAgICAvLyBpbnN0ZWFkIG9mIHNoYXJpbmcgcGFydHMgYmV0d2VlbiBub2Rlc1xuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9saXQvbGl0L2lzc3Vlcy8xMjY2XG4gICAgICAgICAgICAgICAgaXRlbVBhcnRzLnB1c2goKGl0ZW1QYXJ0ID0gbmV3IENoaWxkUGFydCh0aGlzLl9pbnNlcnQoY3JlYXRlTWFya2VyKCkpLCB0aGlzLl9pbnNlcnQoY3JlYXRlTWFya2VyKCkpLCB0aGlzLCB0aGlzLm9wdGlvbnMpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBSZXVzZSBhbiBleGlzdGluZyBwYXJ0XG4gICAgICAgICAgICAgICAgaXRlbVBhcnQgPSBpdGVtUGFydHNbcGFydEluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZW1QYXJ0Ll8kc2V0VmFsdWUoaXRlbSk7XG4gICAgICAgICAgICBwYXJ0SW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFydEluZGV4IDwgaXRlbVBhcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gaXRlbVBhcnRzIGFsd2F5cyBoYXZlIGVuZCBub2Rlc1xuICAgICAgICAgICAgdGhpcy5fJGNsZWFyKGl0ZW1QYXJ0ICYmIHdyYXAoaXRlbVBhcnQuXyRlbmROb2RlKS5uZXh0U2libGluZywgcGFydEluZGV4KTtcbiAgICAgICAgICAgIC8vIFRydW5jYXRlIHRoZSBwYXJ0cyBhcnJheSBzbyBfdmFsdWUgcmVmbGVjdHMgdGhlIGN1cnJlbnQgc3RhdGVcbiAgICAgICAgICAgIGl0ZW1QYXJ0cy5sZW5ndGggPSBwYXJ0SW5kZXg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbm9kZXMgY29udGFpbmVkIHdpdGhpbiB0aGlzIFBhcnQgZnJvbSB0aGUgRE9NLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0YXJ0IFN0YXJ0IG5vZGUgdG8gY2xlYXIgZnJvbSwgZm9yIGNsZWFyaW5nIGEgc3Vic2V0IG9mIHRoZSBwYXJ0J3NcbiAgICAgKiAgICAgRE9NICh1c2VkIHdoZW4gdHJ1bmNhdGluZyBpdGVyYWJsZXMpXG4gICAgICogQHBhcmFtIGZyb20gIFdoZW4gYHN0YXJ0YCBpcyBzcGVjaWZpZWQsIHRoZSBpbmRleCB3aXRoaW4gdGhlIGl0ZXJhYmxlIGZyb21cbiAgICAgKiAgICAgd2hpY2ggQ2hpbGRQYXJ0cyBhcmUgYmVpbmcgcmVtb3ZlZCwgdXNlZCBmb3IgZGlzY29ubmVjdGluZyBkaXJlY3RpdmVzXG4gICAgICogICAgIGluIHRob3NlIFBhcnRzLlxuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgXyRjbGVhcihzdGFydCA9IHdyYXAodGhpcy5fJHN0YXJ0Tm9kZSkubmV4dFNpYmxpbmcsIGZyb20pIHtcbiAgICAgICAgdGhpcy5fJG5vdGlmeUNvbm5lY3Rpb25DaGFuZ2VkPy4oZmFsc2UsIHRydWUsIGZyb20pO1xuICAgICAgICB3aGlsZSAoc3RhcnQgIT09IHRoaXMuXyRlbmROb2RlKSB7XG4gICAgICAgICAgICAvLyBUaGUgbm9uLW51bGwgYXNzZXJ0aW9uIGlzIHNhZmUgYmVjYXVzZSBpZiBfJHN0YXJ0Tm9kZS5uZXh0U2libGluZyBpc1xuICAgICAgICAgICAgLy8gbnVsbCwgdGhlbiBfJGVuZE5vZGUgaXMgYWxzbyBudWxsLCBhbmQgd2Ugd291bGQgbm90IGhhdmUgZW50ZXJlZCB0aGlzXG4gICAgICAgICAgICAvLyBsb29wLlxuICAgICAgICAgICAgY29uc3QgbiA9IHdyYXAoc3RhcnQpLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgd3JhcChzdGFydCkucmVtb3ZlKCk7XG4gICAgICAgICAgICBzdGFydCA9IG47XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogSW1wbGVtZW50YXRpb24gb2YgUm9vdFBhcnQncyBgaXNDb25uZWN0ZWRgLiBOb3RlIHRoYXQgdGhpcyBtZXRob2RcbiAgICAgKiBzaG91bGQgb25seSBiZSBjYWxsZWQgb24gYFJvb3RQYXJ0YHMgKHRoZSBgQ2hpbGRQYXJ0YCByZXR1cm5lZCBmcm9tIGFcbiAgICAgKiB0b3AtbGV2ZWwgYHJlbmRlcigpYCBjYWxsKS4gSXQgaGFzIG5vIGVmZmVjdCBvbiBub24tcm9vdCBDaGlsZFBhcnRzLlxuICAgICAqIEBwYXJhbSBpc0Nvbm5lY3RlZCBXaGV0aGVyIHRvIHNldFxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHNldENvbm5lY3RlZChpc0Nvbm5lY3RlZCkge1xuICAgICAgICBpZiAodGhpcy5fJHBhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9faXNDb25uZWN0ZWQgPSBpc0Nvbm5lY3RlZDtcbiAgICAgICAgICAgIHRoaXMuXyRub3RpZnlDb25uZWN0aW9uQ2hhbmdlZD8uKGlzQ29ubmVjdGVkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChERVZfTU9ERSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwYXJ0LnNldENvbm5lY3RlZCgpIG1heSBvbmx5IGJlIGNhbGxlZCBvbiBhICcgK1xuICAgICAgICAgICAgICAgICdSb290UGFydCByZXR1cm5lZCBmcm9tIHJlbmRlcigpLicpO1xuICAgICAgICB9XG4gICAgfVxufVxuY2xhc3MgQXR0cmlidXRlUGFydCB7XG4gICAgZ2V0IHRhZ05hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudGFnTmFtZTtcbiAgICB9XG4gICAgLy8gU2VlIGNvbW1lbnQgaW4gRGlzY29ubmVjdGFibGUgaW50ZXJmYWNlIGZvciB3aHkgdGhpcyBpcyBhIGdldHRlclxuICAgIGdldCBfJGlzQ29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fJHBhcmVudC5fJGlzQ29ubmVjdGVkO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBuYW1lLCBzdHJpbmdzLCBwYXJlbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gQVRUUklCVVRFX1BBUlQ7XG4gICAgICAgIC8qKiBAaW50ZXJuYWwgKi9cbiAgICAgICAgdGhpcy5fJGNvbW1pdHRlZFZhbHVlID0gbm90aGluZztcbiAgICAgICAgLyoqIEBpbnRlcm5hbCAqL1xuICAgICAgICB0aGlzLl8kZGlzY29ubmVjdGFibGVDaGlsZHJlbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5fJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgaWYgKHN0cmluZ3MubGVuZ3RoID4gMiB8fCBzdHJpbmdzWzBdICE9PSAnJyB8fCBzdHJpbmdzWzFdICE9PSAnJykge1xuICAgICAgICAgICAgdGhpcy5fJGNvbW1pdHRlZFZhbHVlID0gbmV3IEFycmF5KHN0cmluZ3MubGVuZ3RoIC0gMSkuZmlsbChuZXcgU3RyaW5nKCkpO1xuICAgICAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5ncztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuXyRjb21taXR0ZWRWYWx1ZSA9IG5vdGhpbmc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEVOQUJMRV9FWFRSQV9TRUNVUklUWV9IT09LUykge1xuICAgICAgICAgICAgdGhpcy5fc2FuaXRpemVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHZhbHVlIG9mIHRoaXMgcGFydCBieSByZXNvbHZpbmcgdGhlIHZhbHVlIGZyb20gcG9zc2libHkgbXVsdGlwbGVcbiAgICAgKiB2YWx1ZXMgYW5kIHN0YXRpYyBzdHJpbmdzIGFuZCBjb21taXR0aW5nIGl0IHRvIHRoZSBET00uXG4gICAgICogSWYgdGhpcyBwYXJ0IGlzIHNpbmdsZS12YWx1ZWQsIGB0aGlzLl9zdHJpbmdzYCB3aWxsIGJlIHVuZGVmaW5lZCwgYW5kIHRoZVxuICAgICAqIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCB3aXRoIGEgc2luZ2xlIHZhbHVlIGFyZ3VtZW50LiBJZiB0aGlzIHBhcnQgaXNcbiAgICAgKiBtdWx0aS12YWx1ZSwgYHRoaXMuX3N0cmluZ3NgIHdpbGwgYmUgZGVmaW5lZCwgYW5kIHRoZSBtZXRob2QgaXMgY2FsbGVkXG4gICAgICogd2l0aCB0aGUgdmFsdWUgYXJyYXkgb2YgdGhlIHBhcnQncyBvd25pbmcgVGVtcGxhdGVJbnN0YW5jZSwgYW5kIGFuIG9mZnNldFxuICAgICAqIGludG8gdGhlIHZhbHVlIGFycmF5IGZyb20gd2hpY2ggdGhlIHZhbHVlcyBzaG91bGQgYmUgcmVhZC5cbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBvdmVybG9hZGVkIHRoaXMgd2F5IHRvIGVsaW1pbmF0ZSBzaG9ydC1saXZlZCBhcnJheSBzbGljZXNcbiAgICAgKiBvZiB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgdmFsdWVzLCBhbmQgYWxsb3cgYSBmYXN0LXBhdGggZm9yIHNpbmdsZS12YWx1ZWRcbiAgICAgKiBwYXJ0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgcGFydCB2YWx1ZSwgb3IgYW4gYXJyYXkgb2YgdmFsdWVzIGZvciBtdWx0aS12YWx1ZWQgcGFydHNcbiAgICAgKiBAcGFyYW0gdmFsdWVJbmRleCB0aGUgaW5kZXggdG8gc3RhcnQgcmVhZGluZyB2YWx1ZXMgZnJvbS4gYHVuZGVmaW5lZGAgZm9yXG4gICAgICogICBzaW5nbGUtdmFsdWVkIHBhcnRzXG4gICAgICogQHBhcmFtIG5vQ29tbWl0IGNhdXNlcyB0aGUgcGFydCB0byBub3QgY29tbWl0IGl0cyB2YWx1ZSB0byB0aGUgRE9NLiBVc2VkXG4gICAgICogICBpbiBoeWRyYXRpb24gdG8gcHJpbWUgYXR0cmlidXRlIHBhcnRzIHdpdGggdGhlaXIgZmlyc3QtcmVuZGVyZWQgdmFsdWUsXG4gICAgICogICBidXQgbm90IHNldCB0aGUgYXR0cmlidXRlLCBhbmQgaW4gU1NSIHRvIG5vLW9wIHRoZSBET00gb3BlcmF0aW9uIGFuZFxuICAgICAqICAgY2FwdHVyZSB0aGUgdmFsdWUgZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgICpcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBfJHNldFZhbHVlKHZhbHVlLCBkaXJlY3RpdmVQYXJlbnQgPSB0aGlzLCB2YWx1ZUluZGV4LCBub0NvbW1pdCkge1xuICAgICAgICBjb25zdCBzdHJpbmdzID0gdGhpcy5zdHJpbmdzO1xuICAgICAgICAvLyBXaGV0aGVyIGFueSBvZiB0aGUgdmFsdWVzIGhhcyBjaGFuZ2VkLCBmb3IgZGlydHktY2hlY2tpbmdcbiAgICAgICAgbGV0IGNoYW5nZSA9IGZhbHNlO1xuICAgICAgICBpZiAoc3RyaW5ncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBTaW5nbGUtdmFsdWUgYmluZGluZyBjYXNlXG4gICAgICAgICAgICB2YWx1ZSA9IHJlc29sdmVEaXJlY3RpdmUodGhpcywgdmFsdWUsIGRpcmVjdGl2ZVBhcmVudCwgMCk7XG4gICAgICAgICAgICBjaGFuZ2UgPVxuICAgICAgICAgICAgICAgICFpc1ByaW1pdGl2ZSh2YWx1ZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKHZhbHVlICE9PSB0aGlzLl8kY29tbWl0dGVkVmFsdWUgJiYgdmFsdWUgIT09IG5vQ2hhbmdlKTtcbiAgICAgICAgICAgIGlmIChjaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl8kY29tbWl0dGVkVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIEludGVycG9sYXRpb24gY2FzZVxuICAgICAgICAgICAgY29uc3QgdmFsdWVzID0gdmFsdWU7XG4gICAgICAgICAgICB2YWx1ZSA9IHN0cmluZ3NbMF07XG4gICAgICAgICAgICBsZXQgaSwgdjtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzdHJpbmdzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIHYgPSByZXNvbHZlRGlyZWN0aXZlKHRoaXMsIHZhbHVlc1t2YWx1ZUluZGV4ICsgaV0sIGRpcmVjdGl2ZVBhcmVudCwgaSk7XG4gICAgICAgICAgICAgICAgaWYgKHYgPT09IG5vQ2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSB1c2VyLXByb3ZpZGVkIHZhbHVlIGlzIGBub0NoYW5nZWAsIHVzZSB0aGUgcHJldmlvdXMgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgdiA9IHRoaXMuXyRjb21taXR0ZWRWYWx1ZVtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hhbmdlIHx8PVxuICAgICAgICAgICAgICAgICAgICAhaXNQcmltaXRpdmUodikgfHwgdiAhPT0gdGhpcy5fJGNvbW1pdHRlZFZhbHVlW2ldO1xuICAgICAgICAgICAgICAgIGlmICh2ID09PSBub3RoaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbm90aGluZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgIT09IG5vdGhpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gKHYgPz8gJycpICsgc3RyaW5nc1tpICsgMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFdlIGFsd2F5cyByZWNvcmQgZWFjaCB2YWx1ZSwgZXZlbiBpZiBvbmUgaXMgYG5vdGhpbmdgLCBmb3IgZnV0dXJlXG4gICAgICAgICAgICAgICAgLy8gY2hhbmdlIGRldGVjdGlvbi5cbiAgICAgICAgICAgICAgICB0aGlzLl8kY29tbWl0dGVkVmFsdWVbaV0gPSB2O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2UgJiYgIW5vQ29tbWl0KSB7XG4gICAgICAgICAgICB0aGlzLl9jb21taXRWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqIEBpbnRlcm5hbCAqL1xuICAgIF9jb21taXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IG5vdGhpbmcpIHtcbiAgICAgICAgICAgIHdyYXAodGhpcy5lbGVtZW50KS5yZW1vdmVBdHRyaWJ1dGUodGhpcy5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChFTkFCTEVfRVhUUkFfU0VDVVJJVFlfSE9PS1MpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2FuaXRpemVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2FuaXRpemVyID0gc2FuaXRpemVyRmFjdG9yeUludGVybmFsKHRoaXMuZWxlbWVudCwgdGhpcy5uYW1lLCAnYXR0cmlidXRlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5fc2FuaXRpemVyKHZhbHVlID8/ICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlYnVnTG9nRXZlbnQgJiZcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZ0V2ZW50KHtcbiAgICAgICAgICAgICAgICAgICAga2luZDogJ2NvbW1pdCBhdHRyaWJ1dGUnLFxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiB0aGlzLmVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHdyYXAodGhpcy5lbGVtZW50KS5zZXRBdHRyaWJ1dGUodGhpcy5uYW1lLCAodmFsdWUgPz8gJycpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIFByb3BlcnR5UGFydCBleHRlbmRzIEF0dHJpYnV0ZVBhcnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLnR5cGUgPSBQUk9QRVJUWV9QQVJUO1xuICAgIH1cbiAgICAvKiogQGludGVybmFsICovXG4gICAgX2NvbW1pdFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGlmIChFTkFCTEVfRVhUUkFfU0VDVVJJVFlfSE9PS1MpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zYW5pdGl6ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nhbml0aXplciA9IHNhbml0aXplckZhY3RvcnlJbnRlcm5hbCh0aGlzLmVsZW1lbnQsIHRoaXMubmFtZSwgJ3Byb3BlcnR5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuX3Nhbml0aXplcih2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAga2luZDogJ2NvbW1pdCBwcm9wZXJ0eScsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgICAgdGhpcy5lbGVtZW50W3RoaXMubmFtZV0gPSB2YWx1ZSA9PT0gbm90aGluZyA/IHVuZGVmaW5lZCA6IHZhbHVlO1xuICAgIH1cbn1cbmNsYXNzIEJvb2xlYW5BdHRyaWJ1dGVQYXJ0IGV4dGVuZHMgQXR0cmlidXRlUGFydCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMudHlwZSA9IEJPT0xFQU5fQVRUUklCVVRFX1BBUlQ7XG4gICAgfVxuICAgIC8qKiBAaW50ZXJuYWwgKi9cbiAgICBfY29tbWl0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAga2luZDogJ2NvbW1pdCBib29sZWFuIGF0dHJpYnV0ZScsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogISEodmFsdWUgJiYgdmFsdWUgIT09IG5vdGhpbmcpLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB3cmFwKHRoaXMuZWxlbWVudCkudG9nZ2xlQXR0cmlidXRlKHRoaXMubmFtZSwgISF2YWx1ZSAmJiB2YWx1ZSAhPT0gbm90aGluZyk7XG4gICAgfVxufVxuY2xhc3MgRXZlbnRQYXJ0IGV4dGVuZHMgQXR0cmlidXRlUGFydCB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgbmFtZSwgc3RyaW5ncywgcGFyZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIG5hbWUsIHN0cmluZ3MsIHBhcmVudCwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMudHlwZSA9IEVWRU5UX1BBUlQ7XG4gICAgICAgIGlmIChERVZfTU9ERSAmJiB0aGlzLnN0cmluZ3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBIFxcYDwke2VsZW1lbnQubG9jYWxOYW1lfT5cXGAgaGFzIGEgXFxgQCR7bmFtZX09Li4uXFxgIGxpc3RlbmVyIHdpdGggYCArXG4gICAgICAgICAgICAgICAgJ2ludmFsaWQgY29udGVudC4gRXZlbnQgbGlzdGVuZXJzIGluIHRlbXBsYXRlcyBtdXN0IGhhdmUgZXhhY3RseSAnICtcbiAgICAgICAgICAgICAgICAnb25lIGV4cHJlc3Npb24gYW5kIG5vIHN1cnJvdW5kaW5nIHRleHQuJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gRXZlbnRQYXJ0IGRvZXMgbm90IHVzZSB0aGUgYmFzZSBfJHNldFZhbHVlL19yZXNvbHZlVmFsdWUgaW1wbGVtZW50YXRpb25cbiAgICAvLyBzaW5jZSB0aGUgZGlydHkgY2hlY2tpbmcgaXMgbW9yZSBjb21wbGV4XG4gICAgLyoqIEBpbnRlcm5hbCAqL1xuICAgIF8kc2V0VmFsdWUobmV3TGlzdGVuZXIsIGRpcmVjdGl2ZVBhcmVudCA9IHRoaXMpIHtcbiAgICAgICAgbmV3TGlzdGVuZXIgPVxuICAgICAgICAgICAgcmVzb2x2ZURpcmVjdGl2ZSh0aGlzLCBuZXdMaXN0ZW5lciwgZGlyZWN0aXZlUGFyZW50LCAwKSA/PyBub3RoaW5nO1xuICAgICAgICBpZiAobmV3TGlzdGVuZXIgPT09IG5vQ2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb2xkTGlzdGVuZXIgPSB0aGlzLl8kY29tbWl0dGVkVmFsdWU7XG4gICAgICAgIC8vIElmIHRoZSBuZXcgdmFsdWUgaXMgbm90aGluZyBvciBhbnkgb3B0aW9ucyBjaGFuZ2Ugd2UgaGF2ZSB0byByZW1vdmUgdGhlXG4gICAgICAgIC8vIHBhcnQgYXMgYSBsaXN0ZW5lci5cbiAgICAgICAgY29uc3Qgc2hvdWxkUmVtb3ZlTGlzdGVuZXIgPSAobmV3TGlzdGVuZXIgPT09IG5vdGhpbmcgJiYgb2xkTGlzdGVuZXIgIT09IG5vdGhpbmcpIHx8XG4gICAgICAgICAgICBuZXdMaXN0ZW5lci5jYXB0dXJlICE9PVxuICAgICAgICAgICAgICAgIG9sZExpc3RlbmVyLmNhcHR1cmUgfHxcbiAgICAgICAgICAgIG5ld0xpc3RlbmVyLm9uY2UgIT09XG4gICAgICAgICAgICAgICAgb2xkTGlzdGVuZXIub25jZSB8fFxuICAgICAgICAgICAgbmV3TGlzdGVuZXIucGFzc2l2ZSAhPT1cbiAgICAgICAgICAgICAgICBvbGRMaXN0ZW5lci5wYXNzaXZlO1xuICAgICAgICAvLyBJZiB0aGUgbmV3IHZhbHVlIGlzIG5vdCBub3RoaW5nIGFuZCB3ZSByZW1vdmVkIHRoZSBsaXN0ZW5lciwgd2UgaGF2ZVxuICAgICAgICAvLyB0byBhZGQgdGhlIHBhcnQgYXMgYSBsaXN0ZW5lci5cbiAgICAgICAgY29uc3Qgc2hvdWxkQWRkTGlzdGVuZXIgPSBuZXdMaXN0ZW5lciAhPT0gbm90aGluZyAmJlxuICAgICAgICAgICAgKG9sZExpc3RlbmVyID09PSBub3RoaW5nIHx8IHNob3VsZFJlbW92ZUxpc3RlbmVyKTtcbiAgICAgICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAga2luZDogJ2NvbW1pdCBldmVudCBsaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3TGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczogdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyOiBzaG91bGRSZW1vdmVMaXN0ZW5lcixcbiAgICAgICAgICAgICAgICBhZGRMaXN0ZW5lcjogc2hvdWxkQWRkTGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgb2xkTGlzdGVuZXIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKHNob3VsZFJlbW92ZUxpc3RlbmVyKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLm5hbWUsIHRoaXMsIG9sZExpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvdWxkQWRkTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMubmFtZSwgdGhpcywgbmV3TGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuXyRjb21taXR0ZWRWYWx1ZSA9IG5ld0xpc3RlbmVyO1xuICAgIH1cbiAgICBoYW5kbGVFdmVudChldmVudCkge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuXyRjb21taXR0ZWRWYWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5fJGNvbW1pdHRlZFZhbHVlLmNhbGwodGhpcy5vcHRpb25zPy5ob3N0ID8/IHRoaXMuZWxlbWVudCwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fJGNvbW1pdHRlZFZhbHVlLmhhbmRsZUV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIEVsZW1lbnRQYXJ0IHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy50eXBlID0gRUxFTUVOVF9QQVJUO1xuICAgICAgICAvKiogQGludGVybmFsICovXG4gICAgICAgIHRoaXMuXyRkaXNjb25uZWN0YWJsZUNoaWxkcmVuID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl8kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIH1cbiAgICAvLyBTZWUgY29tbWVudCBpbiBEaXNjb25uZWN0YWJsZSBpbnRlcmZhY2UgZm9yIHdoeSB0aGlzIGlzIGEgZ2V0dGVyXG4gICAgZ2V0IF8kaXNDb25uZWN0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8kcGFyZW50Ll8kaXNDb25uZWN0ZWQ7XG4gICAgfVxuICAgIF8kc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICAgICAga2luZDogJ2NvbW1pdCB0byBlbGVtZW50IGJpbmRpbmcnLFxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHRoaXMuZWxlbWVudCxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmVzb2x2ZURpcmVjdGl2ZSh0aGlzLCB2YWx1ZSk7XG4gICAgfVxufVxuLyoqXG4gKiBFTkQgVVNFUlMgU0hPVUxEIE5PVCBSRUxZIE9OIFRISVMgT0JKRUNULlxuICpcbiAqIFByaXZhdGUgZXhwb3J0cyBmb3IgdXNlIGJ5IG90aGVyIExpdCBwYWNrYWdlcywgbm90IGludGVuZGVkIGZvciB1c2UgYnlcbiAqIGV4dGVybmFsIHVzZXJzLlxuICpcbiAqIFdlIGN1cnJlbnRseSBkbyBub3QgbWFrZSBhIG1hbmdsZWQgcm9sbHVwIGJ1aWxkIG9mIHRoZSBsaXQtc3NyIGNvZGUuIEluIG9yZGVyXG4gKiB0byBrZWVwIGEgbnVtYmVyIG9mIChvdGhlcndpc2UgcHJpdmF0ZSkgdG9wLWxldmVsIGV4cG9ydHMgbWFuZ2xlZCBpbiB0aGVcbiAqIGNsaWVudCBzaWRlIGNvZGUsIHdlIGV4cG9ydCBhIF8kTEggb2JqZWN0IGNvbnRhaW5pbmcgdGhvc2UgbWVtYmVycyAob3JcbiAqIGhlbHBlciBtZXRob2RzIGZvciBhY2Nlc3NpbmcgcHJpdmF0ZSBmaWVsZHMgb2YgdGhvc2UgbWVtYmVycyksIGFuZCB0aGVuXG4gKiByZS1leHBvcnQgdGhlbSBmb3IgdXNlIGluIGxpdC1zc3IuIFRoaXMga2VlcHMgbGl0LXNzciBhZ25vc3RpYyB0byB3aGV0aGVyIHRoZVxuICogY2xpZW50LXNpZGUgY29kZSBpcyBiZWluZyB1c2VkIGluIGBkZXZgIG1vZGUgb3IgYHByb2RgIG1vZGUuXG4gKlxuICogVGhpcyBoYXMgYSB1bmlxdWUgbmFtZSwgdG8gZGlzYW1iaWd1YXRlIGl0IGZyb20gcHJpdmF0ZSBleHBvcnRzIGluXG4gKiBsaXQtZWxlbWVudCwgd2hpY2ggcmUtZXhwb3J0cyBhbGwgb2YgbGl0LWh0bWwuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IF8kTEggPSB7XG4gICAgLy8gVXNlZCBpbiBsaXQtc3NyXG4gICAgX2JvdW5kQXR0cmlidXRlU3VmZml4OiBib3VuZEF0dHJpYnV0ZVN1ZmZpeCxcbiAgICBfbWFya2VyOiBtYXJrZXIsXG4gICAgX21hcmtlck1hdGNoOiBtYXJrZXJNYXRjaCxcbiAgICBfSFRNTF9SRVNVTFQ6IEhUTUxfUkVTVUxULFxuICAgIF9nZXRUZW1wbGF0ZUh0bWw6IGdldFRlbXBsYXRlSHRtbCxcbiAgICAvLyBVc2VkIGluIHRlc3RzIGFuZCBwcml2YXRlLXNzci1zdXBwb3J0XG4gICAgX1RlbXBsYXRlSW5zdGFuY2U6IFRlbXBsYXRlSW5zdGFuY2UsXG4gICAgX2lzSXRlcmFibGU6IGlzSXRlcmFibGUsXG4gICAgX3Jlc29sdmVEaXJlY3RpdmU6IHJlc29sdmVEaXJlY3RpdmUsXG4gICAgX0NoaWxkUGFydDogQ2hpbGRQYXJ0LFxuICAgIF9BdHRyaWJ1dGVQYXJ0OiBBdHRyaWJ1dGVQYXJ0LFxuICAgIF9Cb29sZWFuQXR0cmlidXRlUGFydDogQm9vbGVhbkF0dHJpYnV0ZVBhcnQsXG4gICAgX0V2ZW50UGFydDogRXZlbnRQYXJ0LFxuICAgIF9Qcm9wZXJ0eVBhcnQ6IFByb3BlcnR5UGFydCxcbiAgICBfRWxlbWVudFBhcnQ6IEVsZW1lbnRQYXJ0LFxufTtcbi8vIEFwcGx5IHBvbHlmaWxscyBpZiBhdmFpbGFibGVcbmNvbnN0IHBvbHlmaWxsU3VwcG9ydCA9IERFVl9NT0RFXG4gICAgPyBnbG9iYWwubGl0SHRtbFBvbHlmaWxsU3VwcG9ydERldk1vZGVcbiAgICA6IGdsb2JhbC5saXRIdG1sUG9seWZpbGxTdXBwb3J0O1xucG9seWZpbGxTdXBwb3J0Py4oVGVtcGxhdGUsIENoaWxkUGFydCk7XG4vLyBJTVBPUlRBTlQ6IGRvIG5vdCBjaGFuZ2UgdGhlIHByb3BlcnR5IG5hbWUgb3IgdGhlIGFzc2lnbm1lbnQgZXhwcmVzc2lvbi5cbi8vIFRoaXMgbGluZSB3aWxsIGJlIHVzZWQgaW4gcmVnZXhlcyB0byBzZWFyY2ggZm9yIGxpdC1odG1sIHVzYWdlLlxuKGdsb2JhbC5saXRIdG1sVmVyc2lvbnMgPz89IFtdKS5wdXNoKCczLjMuMicpO1xuaWYgKERFVl9NT0RFICYmIGdsb2JhbC5saXRIdG1sVmVyc2lvbnMubGVuZ3RoID4gMSkge1xuICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgaXNzdWVXYXJuaW5nKCdtdWx0aXBsZS12ZXJzaW9ucycsIGBNdWx0aXBsZSB2ZXJzaW9ucyBvZiBMaXQgbG9hZGVkLiBgICtcbiAgICAgICAgICAgIGBMb2FkaW5nIG11bHRpcGxlIHZlcnNpb25zIGlzIG5vdCByZWNvbW1lbmRlZC5gKTtcbiAgICB9KTtcbn1cbi8qKlxuICogUmVuZGVycyBhIHZhbHVlLCB1c3VhbGx5IGEgbGl0LWh0bWwgVGVtcGxhdGVSZXN1bHQsIHRvIHRoZSBjb250YWluZXIuXG4gKlxuICogVGhpcyBleGFtcGxlIHJlbmRlcnMgdGhlIHRleHQgXCJIZWxsbywgWm9lIVwiIGluc2lkZSBhIHBhcmFncmFwaCB0YWcsIGFwcGVuZGluZ1xuICogaXQgdG8gdGhlIGNvbnRhaW5lciBgZG9jdW1lbnQuYm9keWAuXG4gKlxuICogYGBganNcbiAqIGltcG9ydCB7aHRtbCwgcmVuZGVyfSBmcm9tICdsaXQnO1xuICpcbiAqIGNvbnN0IG5hbWUgPSBcIlpvZVwiO1xuICogcmVuZGVyKGh0bWxgPHA+SGVsbG8sICR7bmFtZX0hPC9wPmAsIGRvY3VtZW50LmJvZHkpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHZhbHVlIEFueSBbcmVuZGVyYWJsZVxuICogICB2YWx1ZV0oaHR0cHM6Ly9saXQuZGV2L2RvY3MvdGVtcGxhdGVzL2V4cHJlc3Npb25zLyNjaGlsZC1leHByZXNzaW9ucyksXG4gKiAgIHR5cGljYWxseSBhIHtAbGlua2NvZGUgVGVtcGxhdGVSZXN1bHR9IGNyZWF0ZWQgYnkgZXZhbHVhdGluZyBhIHRlbXBsYXRlIHRhZ1xuICogICBsaWtlIHtAbGlua2NvZGUgaHRtbH0gb3Ige0BsaW5rY29kZSBzdmd9LlxuICogQHBhcmFtIGNvbnRhaW5lciBBIERPTSBjb250YWluZXIgdG8gcmVuZGVyIHRvLiBUaGUgZmlyc3QgcmVuZGVyIHdpbGwgYXBwZW5kXG4gKiAgIHRoZSByZW5kZXJlZCB2YWx1ZSB0byB0aGUgY29udGFpbmVyLCBhbmQgc3Vic2VxdWVudCByZW5kZXJzIHdpbGxcbiAqICAgZWZmaWNpZW50bHkgdXBkYXRlIHRoZSByZW5kZXJlZCB2YWx1ZSBpZiB0aGUgc2FtZSByZXN1bHQgdHlwZSB3YXNcbiAqICAgcHJldmlvdXNseSByZW5kZXJlZCB0aGVyZS5cbiAqIEBwYXJhbSBvcHRpb25zIFNlZSB7QGxpbmtjb2RlIFJlbmRlck9wdGlvbnN9IGZvciBvcHRpb25zIGRvY3VtZW50YXRpb24uXG4gKiBAc2VlXG4gKiB7QGxpbmsgaHR0cHM6Ly9saXQuZGV2L2RvY3MvbGlicmFyaWVzL3N0YW5kYWxvbmUtdGVtcGxhdGVzLyNyZW5kZXJpbmctbGl0LWh0bWwtdGVtcGxhdGVzfCBSZW5kZXJpbmcgTGl0IEhUTUwgVGVtcGxhdGVzfVxuICovXG5leHBvcnQgY29uc3QgcmVuZGVyID0gKHZhbHVlLCBjb250YWluZXIsIG9wdGlvbnMpID0+IHtcbiAgICBpZiAoREVWX01PREUgJiYgY29udGFpbmVyID09IG51bGwpIHtcbiAgICAgICAgLy8gR2l2ZSBhIGNsZWFyZXIgZXJyb3IgbWVzc2FnZSB0aGFuXG4gICAgICAgIC8vICAgICBVbmNhdWdodCBUeXBlRXJyb3I6IENhbm5vdCByZWFkIHByb3BlcnRpZXMgb2YgbnVsbCAocmVhZGluZ1xuICAgICAgICAvLyAgICAgJ18kbGl0UGFydCQnKVxuICAgICAgICAvLyB3aGljaCByZWFkcyBsaWtlIGFuIGludGVybmFsIExpdCBlcnJvci5cbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVGhlIGNvbnRhaW5lciB0byByZW5kZXIgaW50byBtYXkgbm90IGJlICR7Y29udGFpbmVyfWApO1xuICAgIH1cbiAgICBjb25zdCByZW5kZXJJZCA9IERFVl9NT0RFID8gZGVidWdMb2dSZW5kZXJJZCsrIDogMDtcbiAgICBjb25zdCBwYXJ0T3duZXJOb2RlID0gb3B0aW9ucz8ucmVuZGVyQmVmb3JlID8/IGNvbnRhaW5lcjtcbiAgICAvLyBUaGlzIHByb3BlcnR5IG5lZWRzIHRvIHJlbWFpbiB1bm1pbmlmaWVkLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgbGV0IHBhcnQgPSBwYXJ0T3duZXJOb2RlWydfJGxpdFBhcnQkJ107XG4gICAgZGVidWdMb2dFdmVudCAmJlxuICAgICAgICBkZWJ1Z0xvZ0V2ZW50KHtcbiAgICAgICAgICAgIGtpbmQ6ICdiZWdpbiByZW5kZXInLFxuICAgICAgICAgICAgaWQ6IHJlbmRlcklkLFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgcGFydCxcbiAgICAgICAgfSk7XG4gICAgaWYgKHBhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBlbmROb2RlID0gb3B0aW9ucz8ucmVuZGVyQmVmb3JlID8/IG51bGw7XG4gICAgICAgIC8vIFRoaXMgcHJvcGVydHkgbmVlZHMgdG8gcmVtYWluIHVubWluaWZpZWQuXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgIHBhcnRPd25lck5vZGVbJ18kbGl0UGFydCQnXSA9IHBhcnQgPSBuZXcgQ2hpbGRQYXJ0KGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoY3JlYXRlTWFya2VyKCksIGVuZE5vZGUpLCBlbmROb2RlLCB1bmRlZmluZWQsIG9wdGlvbnMgPz8ge30pO1xuICAgIH1cbiAgICBwYXJ0Ll8kc2V0VmFsdWUodmFsdWUpO1xuICAgIGRlYnVnTG9nRXZlbnQgJiZcbiAgICAgICAgZGVidWdMb2dFdmVudCh7XG4gICAgICAgICAgICBraW5kOiAnZW5kIHJlbmRlcicsXG4gICAgICAgICAgICBpZDogcmVuZGVySWQsXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICBwYXJ0LFxuICAgICAgICB9KTtcbiAgICByZXR1cm4gcGFydDtcbn07XG5pZiAoRU5BQkxFX0VYVFJBX1NFQ1VSSVRZX0hPT0tTKSB7XG4gICAgcmVuZGVyLnNldFNhbml0aXplciA9IHNldFNhbml0aXplcjtcbiAgICByZW5kZXIuY3JlYXRlU2FuaXRpemVyID0gY3JlYXRlU2FuaXRpemVyO1xuICAgIGlmIChERVZfTU9ERSkge1xuICAgICAgICByZW5kZXIuX3Rlc3RPbmx5Q2xlYXJTYW5pdGl6ZXJGYWN0b3J5RG9Ob3RDYWxsT3JFbHNlID1cbiAgICAgICAgICAgIF90ZXN0T25seUNsZWFyU2FuaXRpemVyRmFjdG9yeURvTm90Q2FsbE9yRWxzZTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1saXQtaHRtbC5qcy5tYXAiLAogICAgIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL1xuLyoqXG4gKiBUaGUgbWFpbiBMaXRFbGVtZW50IG1vZHVsZSwgd2hpY2ggZGVmaW5lcyB0aGUge0BsaW5rY29kZSBMaXRFbGVtZW50fSBiYXNlXG4gKiBjbGFzcyBhbmQgcmVsYXRlZCBBUElzLlxuICpcbiAqIExpdEVsZW1lbnQgY29tcG9uZW50cyBjYW4gZGVmaW5lIGEgdGVtcGxhdGUgYW5kIGEgc2V0IG9mIG9ic2VydmVkXG4gKiBwcm9wZXJ0aWVzLiBDaGFuZ2luZyBhbiBvYnNlcnZlZCBwcm9wZXJ0eSB0cmlnZ2VycyBhIHJlLXJlbmRlciBvZiB0aGVcbiAqIGVsZW1lbnQuXG4gKlxuICogSW1wb3J0IHtAbGlua2NvZGUgTGl0RWxlbWVudH0gYW5kIHtAbGlua2NvZGUgaHRtbH0gZnJvbSB0aGlzIG1vZHVsZSB0b1xuICogY3JlYXRlIGEgY29tcG9uZW50OlxuICpcbiAqICBgYGBqc1xuICogaW1wb3J0IHtMaXRFbGVtZW50LCBodG1sfSBmcm9tICdsaXQtZWxlbWVudCc7XG4gKlxuICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gKlxuICogICAvLyBEZWNsYXJlIG9ic2VydmVkIHByb3BlcnRpZXNcbiAqICAgc3RhdGljIGdldCBwcm9wZXJ0aWVzKCkge1xuICogICAgIHJldHVybiB7XG4gKiAgICAgICBhZGplY3RpdmU6IHt9XG4gKiAgICAgfVxuICogICB9XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICB0aGlzLmFkamVjdGl2ZSA9ICdhd2Vzb21lJztcbiAqICAgfVxuICpcbiAqICAgLy8gRGVmaW5lIHRoZSBlbGVtZW50J3MgdGVtcGxhdGVcbiAqICAgcmVuZGVyKCkge1xuICogICAgIHJldHVybiBodG1sYDxwPnlvdXIgJHthZGplY3RpdmV9IHRlbXBsYXRlIGhlcmU8L3A+YDtcbiAqICAgfVxuICogfVxuICpcbiAqIGN1c3RvbUVsZW1lbnRzLmRlZmluZSgnbXktZWxlbWVudCcsIE15RWxlbWVudCk7XG4gKiBgYGBcbiAqXG4gKiBgTGl0RWxlbWVudGAgZXh0ZW5kcyB7QGxpbmtjb2RlIFJlYWN0aXZlRWxlbWVudH0gYW5kIGFkZHMgbGl0LWh0bWxcbiAqIHRlbXBsYXRpbmcuIFRoZSBgUmVhY3RpdmVFbGVtZW50YCBjbGFzcyBpcyBwcm92aWRlZCBmb3IgdXNlcnMgdGhhdCB3YW50IHRvXG4gKiBidWlsZCB0aGVpciBvd24gY3VzdG9tIGVsZW1lbnQgYmFzZSBjbGFzc2VzIHRoYXQgZG9uJ3QgdXNlIGxpdC1odG1sLlxuICpcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICovXG5pbXBvcnQgeyBSZWFjdGl2ZUVsZW1lbnQgfSBmcm9tICdAbGl0L3JlYWN0aXZlLWVsZW1lbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBub0NoYW5nZSB9IGZyb20gJ2xpdC1odG1sJztcbmV4cG9ydCAqIGZyb20gJ0BsaXQvcmVhY3RpdmUtZWxlbWVudCc7XG5leHBvcnQgKiBmcm9tICdsaXQtaHRtbCc7XG4vKlxuICogV2hlbiB1c2luZyBDbG9zdXJlIENvbXBpbGVyLCBKU0NvbXBpbGVyX3JlbmFtZVByb3BlcnR5KHByb3BlcnR5LCBvYmplY3QpIGlzXG4gKiByZXBsYWNlZCBhdCBjb21waWxlIHRpbWUgYnkgdGhlIG11bmdlZCBuYW1lIGZvciBvYmplY3RbcHJvcGVydHldLiBXZSBjYW5ub3RcbiAqIGFsaWFzIHRoaXMgZnVuY3Rpb24sIHNvIHdlIGhhdmUgdG8gdXNlIGEgc21hbGwgc2hpbSB0aGF0IGhhcyB0aGUgc2FtZVxuICogYmVoYXZpb3Igd2hlbiBub3QgY29tcGlsaW5nLlxuICovXG4vKkBfX0lOTElORV9fKi9cbmNvbnN0IEpTQ29tcGlsZXJfcmVuYW1lUHJvcGVydHkgPSAocHJvcCwgX29iaikgPT4gcHJvcDtcbmNvbnN0IERFVl9NT0RFID0gdHJ1ZTtcbi8vIEFsbG93cyBtaW5pZmllcnMgdG8gcmVuYW1lIHJlZmVyZW5jZXMgdG8gZ2xvYmFsVGhpc1xuY29uc3QgZ2xvYmFsID0gZ2xvYmFsVGhpcztcbmxldCBpc3N1ZVdhcm5pbmc7XG5pZiAoREVWX01PREUpIHtcbiAgICAvLyBFbnN1cmUgd2FybmluZ3MgYXJlIGlzc3VlZCBvbmx5IDF4LCBldmVuIGlmIG11bHRpcGxlIHZlcnNpb25zIG9mIExpdFxuICAgIC8vIGFyZSBsb2FkZWQuXG4gICAgZ2xvYmFsLmxpdElzc3VlZFdhcm5pbmdzID8/PSBuZXcgU2V0KCk7XG4gICAgLyoqXG4gICAgICogSXNzdWUgYSB3YXJuaW5nIGlmIHdlIGhhdmVuJ3QgYWxyZWFkeSwgYmFzZWQgZWl0aGVyIG9uIGBjb2RlYCBvciBgd2FybmluZ2AuXG4gICAgICogV2FybmluZ3MgYXJlIGRpc2FibGVkIGF1dG9tYXRpY2FsbHkgb25seSBieSBgd2FybmluZ2A7IGRpc2FibGluZyB2aWEgYGNvZGVgXG4gICAgICogY2FuIGJlIGRvbmUgYnkgdXNlcnMuXG4gICAgICovXG4gICAgaXNzdWVXYXJuaW5nID0gKGNvZGUsIHdhcm5pbmcpID0+IHtcbiAgICAgICAgd2FybmluZyArPSBgIFNlZSBodHRwczovL2xpdC5kZXYvbXNnLyR7Y29kZX0gZm9yIG1vcmUgaW5mb3JtYXRpb24uYDtcbiAgICAgICAgaWYgKCFnbG9iYWwubGl0SXNzdWVkV2FybmluZ3MuaGFzKHdhcm5pbmcpICYmXG4gICAgICAgICAgICAhZ2xvYmFsLmxpdElzc3VlZFdhcm5pbmdzLmhhcyhjb2RlKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKHdhcm5pbmcpO1xuICAgICAgICAgICAgZ2xvYmFsLmxpdElzc3VlZFdhcm5pbmdzLmFkZCh3YXJuaW5nKTtcbiAgICAgICAgfVxuICAgIH07XG59XG4vKipcbiAqIEJhc2UgZWxlbWVudCBjbGFzcyB0aGF0IG1hbmFnZXMgZWxlbWVudCBwcm9wZXJ0aWVzIGFuZCBhdHRyaWJ1dGVzLCBhbmRcbiAqIHJlbmRlcnMgYSBsaXQtaHRtbCB0ZW1wbGF0ZS5cbiAqXG4gKiBUbyBkZWZpbmUgYSBjb21wb25lbnQsIHN1YmNsYXNzIGBMaXRFbGVtZW50YCBhbmQgaW1wbGVtZW50IGFcbiAqIGByZW5kZXJgIG1ldGhvZCB0byBwcm92aWRlIHRoZSBjb21wb25lbnQncyB0ZW1wbGF0ZS4gRGVmaW5lIHByb3BlcnRpZXNcbiAqIHVzaW5nIHRoZSB7QGxpbmtjb2RlIExpdEVsZW1lbnQucHJvcGVydGllcyBwcm9wZXJ0aWVzfSBwcm9wZXJ0eSBvciB0aGVcbiAqIHtAbGlua2NvZGUgcHJvcGVydHl9IGRlY29yYXRvci5cbiAqL1xuZXhwb3J0IGNsYXNzIExpdEVsZW1lbnQgZXh0ZW5kcyBSZWFjdGl2ZUVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQGNhdGVnb3J5IHJlbmRlcmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZW5kZXJPcHRpb25zID0geyBob3N0OiB0aGlzIH07XG4gICAgICAgIHRoaXMuX19jaGlsZFBhcnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBjYXRlZ29yeSByZW5kZXJpbmdcbiAgICAgKi9cbiAgICBjcmVhdGVSZW5kZXJSb290KCkge1xuICAgICAgICBjb25zdCByZW5kZXJSb290ID0gc3VwZXIuY3JlYXRlUmVuZGVyUm9vdCgpO1xuICAgICAgICAvLyBXaGVuIGFkb3B0ZWRTdHlsZVNoZWV0cyBhcmUgc2hpbW1lZCwgdGhleSBhcmUgaW5zZXJ0ZWQgaW50byB0aGVcbiAgICAgICAgLy8gc2hhZG93Um9vdCBieSBjcmVhdGVSZW5kZXJSb290LiBBZGp1c3QgdGhlIHJlbmRlckJlZm9yZSBub2RlIHNvIHRoYXRcbiAgICAgICAgLy8gYW55IHN0eWxlcyBpbiBMaXQgY29udGVudCByZW5kZXIgYmVmb3JlIGFkb3B0ZWRTdHlsZVNoZWV0cy4gVGhpcyBpc1xuICAgICAgICAvLyBpbXBvcnRhbnQgc28gdGhhdCBhZG9wdGVkU3R5bGVTaGVldHMgaGF2ZSBwcmVjZWRlbmNlIG92ZXIgc3R5bGVzIGluXG4gICAgICAgIC8vIHRoZSBzaGFkb3dSb290LlxuICAgICAgICB0aGlzLnJlbmRlck9wdGlvbnMucmVuZGVyQmVmb3JlID8/PSByZW5kZXJSb290LmZpcnN0Q2hpbGQ7XG4gICAgICAgIHJldHVybiByZW5kZXJSb290O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBlbGVtZW50LiBUaGlzIG1ldGhvZCByZWZsZWN0cyBwcm9wZXJ0eSB2YWx1ZXMgdG8gYXR0cmlidXRlc1xuICAgICAqIGFuZCBjYWxscyBgcmVuZGVyYCB0byByZW5kZXIgRE9NIHZpYSBsaXQtaHRtbC4gU2V0dGluZyBwcm9wZXJ0aWVzIGluc2lkZVxuICAgICAqIHRoaXMgbWV0aG9kIHdpbGwgKm5vdCogdHJpZ2dlciBhbm90aGVyIHVwZGF0ZS5cbiAgICAgKiBAcGFyYW0gY2hhbmdlZFByb3BlcnRpZXMgTWFwIG9mIGNoYW5nZWQgcHJvcGVydGllcyB3aXRoIG9sZCB2YWx1ZXNcbiAgICAgKiBAY2F0ZWdvcnkgdXBkYXRlc1xuICAgICAqL1xuICAgIHVwZGF0ZShjaGFuZ2VkUHJvcGVydGllcykge1xuICAgICAgICAvLyBTZXR0aW5nIHByb3BlcnRpZXMgaW4gYHJlbmRlcmAgc2hvdWxkIG5vdCB0cmlnZ2VyIGFuIHVwZGF0ZS4gU2luY2VcbiAgICAgICAgLy8gdXBkYXRlcyBhcmUgYWxsb3dlZCBhZnRlciBzdXBlci51cGRhdGUsIGl0J3MgaW1wb3J0YW50IHRvIGNhbGwgYHJlbmRlcmBcbiAgICAgICAgLy8gYmVmb3JlIHRoYXQuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgaWYgKCF0aGlzLmhhc1VwZGF0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyT3B0aW9ucy5pc0Nvbm5lY3RlZCA9IHRoaXMuaXNDb25uZWN0ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIudXBkYXRlKGNoYW5nZWRQcm9wZXJ0aWVzKTtcbiAgICAgICAgdGhpcy5fX2NoaWxkUGFydCA9IHJlbmRlcih2YWx1ZSwgdGhpcy5yZW5kZXJSb290LCB0aGlzLnJlbmRlck9wdGlvbnMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBhZGRlZCB0byB0aGUgZG9jdW1lbnQncyBET00uXG4gICAgICpcbiAgICAgKiBJbiBgY29ubmVjdGVkQ2FsbGJhY2soKWAgeW91IHNob3VsZCBzZXR1cCB0YXNrcyB0aGF0IHNob3VsZCBvbmx5IG9jY3VyIHdoZW5cbiAgICAgKiB0aGUgZWxlbWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIGRvY3VtZW50LiBUaGUgbW9zdCBjb21tb24gb2YgdGhlc2UgaXNcbiAgICAgKiBhZGRpbmcgZXZlbnQgbGlzdGVuZXJzIHRvIG5vZGVzIGV4dGVybmFsIHRvIHRoZSBlbGVtZW50LCBsaWtlIGEga2V5ZG93blxuICAgICAqIGV2ZW50IGhhbmRsZXIgYWRkZWQgdG8gdGhlIHdpbmRvdy5cbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICogICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgICAqICAgYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2hhbmRsZUtleWRvd24pO1xuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIFR5cGljYWxseSwgYW55dGhpbmcgZG9uZSBpbiBgY29ubmVjdGVkQ2FsbGJhY2soKWAgc2hvdWxkIGJlIHVuZG9uZSB3aGVuIHRoZVxuICAgICAqIGVsZW1lbnQgaXMgZGlzY29ubmVjdGVkLCBpbiBgZGlzY29ubmVjdGVkQ2FsbGJhY2soKWAuXG4gICAgICpcbiAgICAgKiBAY2F0ZWdvcnkgbGlmZWN5Y2xlXG4gICAgICovXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgICAgIHRoaXMuX19jaGlsZFBhcnQ/LnNldENvbm5lY3RlZCh0cnVlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBkb2N1bWVudCdzIERPTS5cbiAgICAgKlxuICAgICAqIFRoaXMgY2FsbGJhY2sgaXMgdGhlIG1haW4gc2lnbmFsIHRvIHRoZSBlbGVtZW50IHRoYXQgaXQgbWF5IG5vIGxvbmdlciBiZVxuICAgICAqIHVzZWQuIGBkaXNjb25uZWN0ZWRDYWxsYmFjaygpYCBzaG91bGQgZW5zdXJlIHRoYXQgbm90aGluZyBpcyBob2xkaW5nIGFcbiAgICAgKiByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgKHN1Y2ggYXMgZXZlbnQgbGlzdGVuZXJzIGFkZGVkIHRvIG5vZGVzIGV4dGVybmFsXG4gICAgICogdG8gdGhlIGVsZW1lbnQpLCBzbyB0aGF0IGl0IGlzIGZyZWUgdG8gYmUgZ2FyYmFnZSBjb2xsZWN0ZWQuXG4gICAgICpcbiAgICAgKiBgYGB0c1xuICAgICAqIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAqICAgc3VwZXIuZGlzY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICAgKiAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5faGFuZGxlS2V5ZG93bik7XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQW4gZWxlbWVudCBtYXkgYmUgcmUtY29ubmVjdGVkIGFmdGVyIGJlaW5nIGRpc2Nvbm5lY3RlZC5cbiAgICAgKlxuICAgICAqIEBjYXRlZ29yeSBsaWZlY3ljbGVcbiAgICAgKi9cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgc3VwZXIuZGlzY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICAgICAgdGhpcy5fX2NoaWxkUGFydD8uc2V0Q29ubmVjdGVkKGZhbHNlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW52b2tlZCBvbiBlYWNoIHVwZGF0ZSB0byBwZXJmb3JtIHJlbmRlcmluZyB0YXNrcy4gVGhpcyBtZXRob2QgbWF5IHJldHVyblxuICAgICAqIGFueSB2YWx1ZSByZW5kZXJhYmxlIGJ5IGxpdC1odG1sJ3MgYENoaWxkUGFydGAgLSB0eXBpY2FsbHkgYVxuICAgICAqIGBUZW1wbGF0ZVJlc3VsdGAuIFNldHRpbmcgcHJvcGVydGllcyBpbnNpZGUgdGhpcyBtZXRob2Qgd2lsbCAqbm90KiB0cmlnZ2VyXG4gICAgICogdGhlIGVsZW1lbnQgdG8gdXBkYXRlLlxuICAgICAqIEBjYXRlZ29yeSByZW5kZXJpbmdcbiAgICAgKi9cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBub0NoYW5nZTtcbiAgICB9XG59XG4vLyBUaGlzIHByb3BlcnR5IG5lZWRzIHRvIHJlbWFpbiB1bm1pbmlmaWVkLlxuTGl0RWxlbWVudFsnXyRsaXRFbGVtZW50JCddID0gdHJ1ZTtcbi8qKlxuICogRW5zdXJlIHRoaXMgY2xhc3MgaXMgbWFya2VkIGFzIGBmaW5hbGl6ZWRgIGFzIGFuIG9wdGltaXphdGlvbiBlbnN1cmluZ1xuICogaXQgd2lsbCBub3QgbmVlZGxlc3NseSB0cnkgdG8gYGZpbmFsaXplYC5cbiAqXG4gKiBOb3RlIHRoaXMgcHJvcGVydHkgbmFtZSBpcyBhIHN0cmluZyB0byBwcmV2ZW50IGJyZWFraW5nIENsb3N1cmUgSlMgQ29tcGlsZXJcbiAqIG9wdGltaXphdGlvbnMuIFNlZSBAbGl0L3JlYWN0aXZlLWVsZW1lbnQgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKi9cbkxpdEVsZW1lbnRbSlNDb21waWxlcl9yZW5hbWVQcm9wZXJ0eSgnZmluYWxpemVkJywgTGl0RWxlbWVudCldID0gdHJ1ZTtcbi8vIEluc3RhbGwgaHlkcmF0aW9uIGlmIGF2YWlsYWJsZVxuZ2xvYmFsLmxpdEVsZW1lbnRIeWRyYXRlU3VwcG9ydD8uKHsgTGl0RWxlbWVudCB9KTtcbi8vIEFwcGx5IHBvbHlmaWxscyBpZiBhdmFpbGFibGVcbmNvbnN0IHBvbHlmaWxsU3VwcG9ydCA9IERFVl9NT0RFXG4gICAgPyBnbG9iYWwubGl0RWxlbWVudFBvbHlmaWxsU3VwcG9ydERldk1vZGVcbiAgICA6IGdsb2JhbC5saXRFbGVtZW50UG9seWZpbGxTdXBwb3J0O1xucG9seWZpbGxTdXBwb3J0Py4oeyBMaXRFbGVtZW50IH0pO1xuLyoqXG4gKiBFTkQgVVNFUlMgU0hPVUxEIE5PVCBSRUxZIE9OIFRISVMgT0JKRUNULlxuICpcbiAqIFByaXZhdGUgZXhwb3J0cyBmb3IgdXNlIGJ5IG90aGVyIExpdCBwYWNrYWdlcywgbm90IGludGVuZGVkIGZvciB1c2UgYnlcbiAqIGV4dGVybmFsIHVzZXJzLlxuICpcbiAqIFdlIGN1cnJlbnRseSBkbyBub3QgbWFrZSBhIG1hbmdsZWQgcm9sbHVwIGJ1aWxkIG9mIHRoZSBsaXQtc3NyIGNvZGUuIEluIG9yZGVyXG4gKiB0byBrZWVwIGEgbnVtYmVyIG9mIChvdGhlcndpc2UgcHJpdmF0ZSkgdG9wLWxldmVsIGV4cG9ydHMgIG1hbmdsZWQgaW4gdGhlXG4gKiBjbGllbnQgc2lkZSBjb2RlLCB3ZSBleHBvcnQgYSBfJExFIG9iamVjdCBjb250YWluaW5nIHRob3NlIG1lbWJlcnMgKG9yXG4gKiBoZWxwZXIgbWV0aG9kcyBmb3IgYWNjZXNzaW5nIHByaXZhdGUgZmllbGRzIG9mIHRob3NlIG1lbWJlcnMpLCBhbmQgdGhlblxuICogcmUtZXhwb3J0IHRoZW0gZm9yIHVzZSBpbiBsaXQtc3NyLiBUaGlzIGtlZXBzIGxpdC1zc3IgYWdub3N0aWMgdG8gd2hldGhlciB0aGVcbiAqIGNsaWVudC1zaWRlIGNvZGUgaXMgYmVpbmcgdXNlZCBpbiBgZGV2YCBtb2RlIG9yIGBwcm9kYCBtb2RlLlxuICpcbiAqIFRoaXMgaGFzIGEgdW5pcXVlIG5hbWUsIHRvIGRpc2FtYmlndWF0ZSBpdCBmcm9tIHByaXZhdGUgZXhwb3J0cyBpblxuICogbGl0LWh0bWwsIHNpbmNlIHRoaXMgbW9kdWxlIHJlLWV4cG9ydHMgYWxsIG9mIGxpdC1odG1sLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBfJExFID0ge1xuICAgIF8kYXR0cmlidXRlVG9Qcm9wZXJ0eTogKGVsLCBuYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICAgICAgZWwuXyRhdHRyaWJ1dGVUb1Byb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICB9LFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgIF8kY2hhbmdlZFByb3BlcnRpZXM6IChlbCkgPT4gZWwuXyRjaGFuZ2VkUHJvcGVydGllcyxcbn07XG4vLyBJTVBPUlRBTlQ6IGRvIG5vdCBjaGFuZ2UgdGhlIHByb3BlcnR5IG5hbWUgb3IgdGhlIGFzc2lnbm1lbnQgZXhwcmVzc2lvbi5cbi8vIFRoaXMgbGluZSB3aWxsIGJlIHVzZWQgaW4gcmVnZXhlcyB0byBzZWFyY2ggZm9yIExpdEVsZW1lbnQgdXNhZ2UuXG4oZ2xvYmFsLmxpdEVsZW1lbnRWZXJzaW9ucyA/Pz0gW10pLnB1c2goJzQuMi4yJyk7XG5pZiAoREVWX01PREUgJiYgZ2xvYmFsLmxpdEVsZW1lbnRWZXJzaW9ucy5sZW5ndGggPiAxKSB7XG4gICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICBpc3N1ZVdhcm5pbmcoJ211bHRpcGxlLXZlcnNpb25zJywgYE11bHRpcGxlIHZlcnNpb25zIG9mIExpdCBsb2FkZWQuIExvYWRpbmcgbXVsdGlwbGUgdmVyc2lvbnMgYCArXG4gICAgICAgICAgICBgaXMgbm90IHJlY29tbWVuZGVkLmApO1xuICAgIH0pO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGl0LWVsZW1lbnQuanMubWFwIiwKICAgICIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNyBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cbi8qKlxuICogQ2xhc3MgZGVjb3JhdG9yIGZhY3RvcnkgdGhhdCBkZWZpbmVzIHRoZSBkZWNvcmF0ZWQgY2xhc3MgYXMgYSBjdXN0b20gZWxlbWVudC5cbiAqXG4gKiBgYGBqc1xuICogQGN1c3RvbUVsZW1lbnQoJ215LWVsZW1lbnQnKVxuICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gKiAgIHJlbmRlcigpIHtcbiAqICAgICByZXR1cm4gaHRtbGBgO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqIEBjYXRlZ29yeSBEZWNvcmF0b3JcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgdG8gZGVmaW5lLlxuICovXG5leHBvcnQgY29uc3QgY3VzdG9tRWxlbWVudCA9ICh0YWdOYW1lKSA9PiAoY2xhc3NPclRhcmdldCwgY29udGV4dCkgPT4ge1xuICAgIGlmIChjb250ZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5hZGRJbml0aWFsaXplcigoKSA9PiB7XG4gICAgICAgICAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUodGFnTmFtZSwgY2xhc3NPclRhcmdldCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY3VzdG9tRWxlbWVudHMuZGVmaW5lKHRhZ05hbWUsIGNsYXNzT3JUYXJnZXQpO1xuICAgIH1cbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jdXN0b20tZWxlbWVudC5qcy5tYXAiLAogICAgIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL1xuLypcbiAqIElNUE9SVEFOVDogRm9yIGNvbXBhdGliaWxpdHkgd2l0aCB0c2lja2xlIGFuZCB0aGUgQ2xvc3VyZSBKUyBjb21waWxlciwgYWxsXG4gKiBwcm9wZXJ0eSBkZWNvcmF0b3JzIChidXQgbm90IGNsYXNzIGRlY29yYXRvcnMpIGluIHRoaXMgZmlsZSB0aGF0IGhhdmVcbiAqIGFuIEBFeHBvcnREZWNvcmF0ZWRJdGVtcyBhbm5vdGF0aW9uIG11c3QgYmUgZGVmaW5lZCBhcyBhIHJlZ3VsYXIgZnVuY3Rpb24sXG4gKiBub3QgYW4gYXJyb3cgZnVuY3Rpb24uXG4gKi9cbmltcG9ydCB7IGRlZmF1bHRDb252ZXJ0ZXIsIG5vdEVxdWFsLCB9IGZyb20gJy4uL3JlYWN0aXZlLWVsZW1lbnQuanMnO1xuY29uc3QgREVWX01PREUgPSB0cnVlO1xubGV0IGlzc3VlV2FybmluZztcbmlmIChERVZfTU9ERSkge1xuICAgIC8vIEVuc3VyZSB3YXJuaW5ncyBhcmUgaXNzdWVkIG9ubHkgMXgsIGV2ZW4gaWYgbXVsdGlwbGUgdmVyc2lvbnMgb2YgTGl0XG4gICAgLy8gYXJlIGxvYWRlZC5cbiAgICBnbG9iYWxUaGlzLmxpdElzc3VlZFdhcm5pbmdzID8/PSBuZXcgU2V0KCk7XG4gICAgLyoqXG4gICAgICogSXNzdWUgYSB3YXJuaW5nIGlmIHdlIGhhdmVuJ3QgYWxyZWFkeSwgYmFzZWQgZWl0aGVyIG9uIGBjb2RlYCBvciBgd2FybmluZ2AuXG4gICAgICogV2FybmluZ3MgYXJlIGRpc2FibGVkIGF1dG9tYXRpY2FsbHkgb25seSBieSBgd2FybmluZ2A7IGRpc2FibGluZyB2aWEgYGNvZGVgXG4gICAgICogY2FuIGJlIGRvbmUgYnkgdXNlcnMuXG4gICAgICovXG4gICAgaXNzdWVXYXJuaW5nID0gKGNvZGUsIHdhcm5pbmcpID0+IHtcbiAgICAgICAgd2FybmluZyArPSBgIFNlZSBodHRwczovL2xpdC5kZXYvbXNnLyR7Y29kZX0gZm9yIG1vcmUgaW5mb3JtYXRpb24uYDtcbiAgICAgICAgaWYgKCFnbG9iYWxUaGlzLmxpdElzc3VlZFdhcm5pbmdzLmhhcyh3YXJuaW5nKSAmJlxuICAgICAgICAgICAgIWdsb2JhbFRoaXMubGl0SXNzdWVkV2FybmluZ3MuaGFzKGNvZGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4od2FybmluZyk7XG4gICAgICAgICAgICBnbG9iYWxUaGlzLmxpdElzc3VlZFdhcm5pbmdzLmFkZCh3YXJuaW5nKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5jb25zdCBsZWdhY3lQcm9wZXJ0eSA9IChvcHRpb25zLCBwcm90bywgbmFtZSkgPT4ge1xuICAgIGNvbnN0IGhhc093blByb3BlcnR5ID0gcHJvdG8uaGFzT3duUHJvcGVydHkobmFtZSk7XG4gICAgcHJvdG8uY29uc3RydWN0b3IuY3JlYXRlUHJvcGVydHkobmFtZSwgb3B0aW9ucyk7XG4gICAgLy8gRm9yIGFjY2Vzc29ycyAod2hpY2ggaGF2ZSBhIGRlc2NyaXB0b3Igb24gdGhlIHByb3RvdHlwZSkgd2UgbmVlZCB0b1xuICAgIC8vIHJldHVybiBhIGRlc2NyaXB0b3IsIG90aGVyd2lzZSBUeXBlU2NyaXB0IG92ZXJ3cml0ZXMgdGhlIGRlc2NyaXB0b3Igd2VcbiAgICAvLyBkZWZpbmUgaW4gY3JlYXRlUHJvcGVydHkoKSB3aXRoIHRoZSBvcmlnaW5hbCBkZXNjcmlwdG9yLiBXZSBkb24ndCBkbyB0aGlzXG4gICAgLy8gZm9yIGZpZWxkcywgd2hpY2ggZG9uJ3QgaGF2ZSBhIGRlc2NyaXB0b3IsIGJlY2F1c2UgdGhpcyBjb3VsZCBvdmVyd3JpdGVcbiAgICAvLyBkZXNjcmlwdG9yIGRlZmluZWQgYnkgb3RoZXIgZGVjb3JhdG9ycy5cbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHlcbiAgICAgICAgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvLCBuYW1lKVxuICAgICAgICA6IHVuZGVmaW5lZDtcbn07XG4vLyBUaGlzIGlzIGR1cGxpY2F0ZWQgZnJvbSBhIHNpbWlsYXIgdmFyaWFibGUgaW4gcmVhY3RpdmUtZWxlbWVudC50cywgYnV0XG4vLyBhY3R1YWxseSBtYWtlcyBzZW5zZSB0byBoYXZlIHRoaXMgZGVmYXVsdCBkZWZpbmVkIHdpdGggdGhlIGRlY29yYXRvciwgc29cbi8vIHRoYXQgZGlmZmVyZW50IGRlY29yYXRvcnMgY291bGQgaGF2ZSBkaWZmZXJlbnQgZGVmYXVsdHMuXG5jb25zdCBkZWZhdWx0UHJvcGVydHlEZWNsYXJhdGlvbiA9IHtcbiAgICBhdHRyaWJ1dGU6IHRydWUsXG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGNvbnZlcnRlcjogZGVmYXVsdENvbnZlcnRlcixcbiAgICByZWZsZWN0OiBmYWxzZSxcbiAgICBoYXNDaGFuZ2VkOiBub3RFcXVhbCxcbn07XG4vKipcbiAqIFdyYXBzIGEgY2xhc3MgYWNjZXNzb3Igb3Igc2V0dGVyIHNvIHRoYXQgYHJlcXVlc3RVcGRhdGUoKWAgaXMgY2FsbGVkIHdpdGggdGhlXG4gKiBwcm9wZXJ0eSBuYW1lIGFuZCBvbGQgdmFsdWUgd2hlbiB0aGUgYWNjZXNzb3IgaXMgc2V0LlxuICovXG5leHBvcnQgY29uc3Qgc3RhbmRhcmRQcm9wZXJ0eSA9IChvcHRpb25zID0gZGVmYXVsdFByb3BlcnR5RGVjbGFyYXRpb24sIHRhcmdldCwgY29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHsga2luZCwgbWV0YWRhdGEgfSA9IGNvbnRleHQ7XG4gICAgaWYgKERFVl9NT0RFICYmIG1ldGFkYXRhID09IG51bGwpIHtcbiAgICAgICAgaXNzdWVXYXJuaW5nKCdtaXNzaW5nLWNsYXNzLW1ldGFkYXRhJywgYFRoZSBjbGFzcyAke3RhcmdldH0gaXMgbWlzc2luZyBkZWNvcmF0b3IgbWV0YWRhdGEuIFRoaXMgYCArXG4gICAgICAgICAgICBgY291bGQgbWVhbiB0aGF0IHlvdSdyZSB1c2luZyBhIGNvbXBpbGVyIHRoYXQgc3VwcG9ydHMgZGVjb3JhdG9ycyBgICtcbiAgICAgICAgICAgIGBidXQgZG9lc24ndCBzdXBwb3J0IGRlY29yYXRvciBtZXRhZGF0YSwgc3VjaCBhcyBUeXBlU2NyaXB0IDUuMS4gYCArXG4gICAgICAgICAgICBgUGxlYXNlIHVwZGF0ZSB5b3VyIGNvbXBpbGVyLmApO1xuICAgIH1cbiAgICAvLyBTdG9yZSB0aGUgcHJvcGVydHkgb3B0aW9uc1xuICAgIGxldCBwcm9wZXJ0aWVzID0gZ2xvYmFsVGhpcy5saXRQcm9wZXJ0eU1ldGFkYXRhLmdldChtZXRhZGF0YSk7XG4gICAgaWYgKHByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBnbG9iYWxUaGlzLmxpdFByb3BlcnR5TWV0YWRhdGEuc2V0KG1ldGFkYXRhLCAocHJvcGVydGllcyA9IG5ldyBNYXAoKSkpO1xuICAgIH1cbiAgICBpZiAoa2luZCA9PT0gJ3NldHRlcicpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIG9wdGlvbnMud3JhcHBlZCA9IHRydWU7XG4gICAgfVxuICAgIHByb3BlcnRpZXMuc2V0KGNvbnRleHQubmFtZSwgb3B0aW9ucyk7XG4gICAgaWYgKGtpbmQgPT09ICdhY2Nlc3NvcicpIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgZGVjb3JhdG9ycyBjYW5ub3QgZHluYW1pY2FsbHkgbW9kaWZ5IHRoZSBjbGFzcywgc28gd2UgY2FuJ3RcbiAgICAgICAgLy8gcmVwbGFjZSBhIGZpZWxkIHdpdGggYWNjZXNzb3JzLiBUaGUgdXNlciBtdXN0IHVzZSB0aGUgbmV3IGBhY2Nlc3NvcmBcbiAgICAgICAgLy8ga2V5d29yZCBpbnN0ZWFkLlxuICAgICAgICBjb25zdCB7IG5hbWUgfSA9IGNvbnRleHQ7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXQodikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGFyZ2V0LmdldC5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRhcmdldC5zZXQuY2FsbCh0aGlzLCB2KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RVcGRhdGUobmFtZSwgb2xkVmFsdWUsIG9wdGlvbnMsIHRydWUsIHYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluaXQodikge1xuICAgICAgICAgICAgICAgIGlmICh2ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fJGNoYW5nZVByb3BlcnR5KG5hbWUsIHVuZGVmaW5lZCwgb3B0aW9ucywgdik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAoa2luZCA9PT0gJ3NldHRlcicpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lIH0gPSBjb250ZXh0O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgICAgICAgICB0YXJnZXQuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RVcGRhdGUobmFtZSwgb2xkVmFsdWUsIG9wdGlvbnMsIHRydWUsIHZhbHVlKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBkZWNvcmF0b3IgbG9jYXRpb246ICR7a2luZH1gKTtcbn07XG4vKipcbiAqIEEgY2xhc3MgZmllbGQgb3IgYWNjZXNzb3IgZGVjb3JhdG9yIHdoaWNoIGNyZWF0ZXMgYSByZWFjdGl2ZSBwcm9wZXJ0eSB0aGF0XG4gKiByZWZsZWN0cyBhIGNvcnJlc3BvbmRpbmcgYXR0cmlidXRlIHZhbHVlLiBXaGVuIGEgZGVjb3JhdGVkIHByb3BlcnR5IGlzIHNldFxuICogdGhlIGVsZW1lbnQgd2lsbCB1cGRhdGUgYW5kIHJlbmRlci4gQSB7QGxpbmtjb2RlIFByb3BlcnR5RGVjbGFyYXRpb259IG1heVxuICogb3B0aW9uYWxseSBiZSBzdXBwbGllZCB0byBjb25maWd1cmUgcHJvcGVydHkgZmVhdHVyZXMuXG4gKlxuICogVGhpcyBkZWNvcmF0b3Igc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgcHVibGljIGZpZWxkcy4gQXMgcHVibGljIGZpZWxkcyxcbiAqIHByb3BlcnRpZXMgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYXMgcHJpbWFyaWx5IHNldHRhYmxlIGJ5IGVsZW1lbnQgdXNlcnMsXG4gKiBlaXRoZXIgdmlhIGF0dHJpYnV0ZSBvciB0aGUgcHJvcGVydHkgaXRzZWxmLlxuICpcbiAqIEdlbmVyYWxseSwgcHJvcGVydGllcyB0aGF0IGFyZSBjaGFuZ2VkIGJ5IHRoZSBlbGVtZW50IHNob3VsZCBiZSBwcml2YXRlIG9yXG4gKiBwcm90ZWN0ZWQgZmllbGRzIGFuZCBzaG91bGQgdXNlIHRoZSB7QGxpbmtjb2RlIHN0YXRlfSBkZWNvcmF0b3IuXG4gKlxuICogSG93ZXZlciwgc29tZXRpbWVzIGVsZW1lbnQgY29kZSBkb2VzIG5lZWQgdG8gc2V0IGEgcHVibGljIHByb3BlcnR5LiBUaGlzXG4gKiBzaG91bGQgdHlwaWNhbGx5IG9ubHkgYmUgZG9uZSBpbiByZXNwb25zZSB0byB1c2VyIGludGVyYWN0aW9uLCBhbmQgYW4gZXZlbnRcbiAqIHNob3VsZCBiZSBmaXJlZCBpbmZvcm1pbmcgdGhlIHVzZXI7IGZvciBleGFtcGxlLCBhIGNoZWNrYm94IHNldHMgaXRzXG4gKiBgY2hlY2tlZGAgcHJvcGVydHkgd2hlbiBjbGlja2VkIGFuZCBmaXJlcyBhIGBjaGFuZ2VkYCBldmVudC4gTXV0YXRpbmcgcHVibGljXG4gKiBwcm9wZXJ0aWVzIHNob3VsZCB0eXBpY2FsbHkgbm90IGJlIGRvbmUgZm9yIG5vbi1wcmltaXRpdmUgKG9iamVjdCBvciBhcnJheSlcbiAqIHByb3BlcnRpZXMuIEluIG90aGVyIGNhc2VzIHdoZW4gYW4gZWxlbWVudCBuZWVkcyB0byBtYW5hZ2Ugc3RhdGUsIGEgcHJpdmF0ZVxuICogcHJvcGVydHkgZGVjb3JhdGVkIHZpYSB0aGUge0BsaW5rY29kZSBzdGF0ZX0gZGVjb3JhdG9yIHNob3VsZCBiZSB1c2VkLiBXaGVuXG4gKiBuZWVkZWQsIHN0YXRlIHByb3BlcnRpZXMgY2FuIGJlIGluaXRpYWxpemVkIHZpYSBwdWJsaWMgcHJvcGVydGllcyB0b1xuICogZmFjaWxpdGF0ZSBjb21wbGV4IGludGVyYWN0aW9ucy5cbiAqXG4gKiBgYGB0c1xuICogY2xhc3MgTXlFbGVtZW50IHtcbiAqICAgQHByb3BlcnR5KHsgdHlwZTogQm9vbGVhbiB9KVxuICogICBjbGlja2VkID0gZmFsc2U7XG4gKiB9XG4gKiBgYGBcbiAqIEBjYXRlZ29yeSBEZWNvcmF0b3JcbiAqIEBFeHBvcnREZWNvcmF0ZWRJdGVtc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkob3B0aW9ucykge1xuICAgIHJldHVybiAocHJvdG9PclRhcmdldCwgbmFtZU9yQ29udGV4dFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgKSA9PiB7XG4gICAgICAgIHJldHVybiAodHlwZW9mIG5hbWVPckNvbnRleHQgPT09ICdvYmplY3QnXG4gICAgICAgICAgICA/IHN0YW5kYXJkUHJvcGVydHkob3B0aW9ucywgcHJvdG9PclRhcmdldCwgbmFtZU9yQ29udGV4dClcbiAgICAgICAgICAgIDogbGVnYWN5UHJvcGVydHkob3B0aW9ucywgcHJvdG9PclRhcmdldCwgbmFtZU9yQ29udGV4dCkpO1xuICAgIH07XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9wZXJ0eS5qcy5tYXAiLAogICAgIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL1xuLypcbiAqIElNUE9SVEFOVDogRm9yIGNvbXBhdGliaWxpdHkgd2l0aCB0c2lja2xlIGFuZCB0aGUgQ2xvc3VyZSBKUyBjb21waWxlciwgYWxsXG4gKiBwcm9wZXJ0eSBkZWNvcmF0b3JzIChidXQgbm90IGNsYXNzIGRlY29yYXRvcnMpIGluIHRoaXMgZmlsZSB0aGF0IGhhdmVcbiAqIGFuIEBFeHBvcnREZWNvcmF0ZWRJdGVtcyBhbm5vdGF0aW9uIG11c3QgYmUgZGVmaW5lZCBhcyBhIHJlZ3VsYXIgZnVuY3Rpb24sXG4gKiBub3QgYW4gYXJyb3cgZnVuY3Rpb24uXG4gKi9cbmltcG9ydCB7IHByb3BlcnR5IH0gZnJvbSAnLi9wcm9wZXJ0eS5qcyc7XG4vKipcbiAqIERlY2xhcmVzIGEgcHJpdmF0ZSBvciBwcm90ZWN0ZWQgcmVhY3RpdmUgcHJvcGVydHkgdGhhdCBzdGlsbCB0cmlnZ2Vyc1xuICogdXBkYXRlcyB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGNoYW5nZXMuIEl0IGRvZXMgbm90IHJlZmxlY3QgZnJvbSB0aGVcbiAqIGNvcnJlc3BvbmRpbmcgYXR0cmlidXRlLlxuICpcbiAqIFByb3BlcnRpZXMgZGVjbGFyZWQgdGhpcyB3YXkgbXVzdCBub3QgYmUgdXNlZCBmcm9tIEhUTUwgb3IgSFRNTCB0ZW1wbGF0aW5nXG4gKiBzeXN0ZW1zLCB0aGV5J3JlIHNvbGVseSBmb3IgcHJvcGVydGllcyBpbnRlcm5hbCB0byB0aGUgZWxlbWVudC4gVGhlc2VcbiAqIHByb3BlcnRpZXMgbWF5IGJlIHJlbmFtZWQgYnkgb3B0aW1pemF0aW9uIHRvb2xzIGxpa2UgY2xvc3VyZSBjb21waWxlci5cbiAqIEBjYXRlZ29yeSBEZWNvcmF0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXRlKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gcHJvcGVydHkoe1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAvLyBBZGQgYm90aCBgc3RhdGVgIGFuZCBgYXR0cmlidXRlYCBiZWNhdXNlIHdlIGZvdW5kIGEgdGhpcmQgcGFydHlcbiAgICAgICAgLy8gY29udHJvbGxlciB0aGF0IGlzIGtleWluZyBvZmYgb2YgUHJvcGVydHlPcHRpb25zLnN0YXRlIHRvIGRldGVybWluZVxuICAgICAgICAvLyB3aGV0aGVyIGEgZmllbGQgaXMgYSBwcml2YXRlIGludGVybmFsIHByb3BlcnR5IG9yIG5vdC5cbiAgICAgICAgc3RhdGU6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZTogZmFsc2UsXG4gICAgfSk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdGF0ZS5qcy5tYXAiLAogICAgIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL1xuLyoqXG4gKiBXcmFwcyB1cCBhIGZldyBiZXN0IHByYWN0aWNlcyB3aGVuIHJldHVybmluZyBhIHByb3BlcnR5IGRlc2NyaXB0b3IgZnJvbSBhXG4gKiBkZWNvcmF0b3IuXG4gKlxuICogTWFya3MgdGhlIGRlZmluZWQgcHJvcGVydHkgYXMgY29uZmlndXJhYmxlLCBhbmQgZW51bWVyYWJsZSwgYW5kIGhhbmRsZXNcbiAqIHRoZSBjYXNlIHdoZXJlIHdlIGhhdmUgYSBidXN0ZWQgUmVmbGVjdC5kZWNvcmF0ZSB6b21iaWVmaWxsIChlLmcuIGluIEFuZ3VsYXJcbiAqIGFwcHMpLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY29uc3QgZGVzYyA9IChvYmosIG5hbWUsIGRlc2NyaXB0b3IpID0+IHtcbiAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIHdlIGtlZXAgdGhlbSBjb25maWd1cmFibGUgYW5kIGVudW1lcmFibGUuXG4gICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IHRydWU7XG4gICAgaWYgKFxuICAgIC8vIFdlIGNoZWNrIGZvciBSZWZsZWN0LmRlY29yYXRlIGVhY2ggdGltZSwgaW4gY2FzZSB0aGUgem9tYmllZmlsbFxuICAgIC8vIGlzIGFwcGxpZWQgdmlhIGxhenkgbG9hZGluZyBzb21lIEFuZ3VsYXIgY29kZS5cbiAgICBSZWZsZWN0LmRlY29yYXRlICYmXG4gICAgICAgIHR5cGVvZiBuYW1lICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBJZiB3ZSdyZSBjYWxsZWQgYXMgYSBsZWdhY3kgZGVjb3JhdG9yLCBhbmQgUmVmbGVjdC5kZWNvcmF0ZSBpcyBwcmVzZW50XG4gICAgICAgIC8vIHRoZW4gd2UgaGF2ZSBubyBndWFyYW50ZWVzIHRoYXQgdGhlIHJldHVybmVkIGRlc2NyaXB0b3Igd2lsbCBiZVxuICAgICAgICAvLyBkZWZpbmVkIG9uIHRoZSBjbGFzcywgc28gd2UgbXVzdCBhcHBseSBpdCBkaXJlY3RseSBvdXJzZWx2ZXMuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIGRlc2NyaXB0b3IpO1xuICAgIH1cbiAgICByZXR1cm4gZGVzY3JpcHRvcjtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1iYXNlLmpzLm1hcCIsCiAgICAiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovXG5pbXBvcnQgeyBkZXNjIH0gZnJvbSAnLi9iYXNlLmpzJztcbmNvbnN0IERFVl9NT0RFID0gdHJ1ZTtcbmxldCBpc3N1ZVdhcm5pbmc7XG5pZiAoREVWX01PREUpIHtcbiAgICAvLyBFbnN1cmUgd2FybmluZ3MgYXJlIGlzc3VlZCBvbmx5IDF4LCBldmVuIGlmIG11bHRpcGxlIHZlcnNpb25zIG9mIExpdFxuICAgIC8vIGFyZSBsb2FkZWQuXG4gICAgZ2xvYmFsVGhpcy5saXRJc3N1ZWRXYXJuaW5ncyA/Pz0gbmV3IFNldCgpO1xuICAgIC8qKlxuICAgICAqIElzc3VlIGEgd2FybmluZyBpZiB3ZSBoYXZlbid0IGFscmVhZHksIGJhc2VkIGVpdGhlciBvbiBgY29kZWAgb3IgYHdhcm5pbmdgLlxuICAgICAqIFdhcm5pbmdzIGFyZSBkaXNhYmxlZCBhdXRvbWF0aWNhbGx5IG9ubHkgYnkgYHdhcm5pbmdgOyBkaXNhYmxpbmcgdmlhIGBjb2RlYFxuICAgICAqIGNhbiBiZSBkb25lIGJ5IHVzZXJzLlxuICAgICAqL1xuICAgIGlzc3VlV2FybmluZyA9IChjb2RlLCB3YXJuaW5nKSA9PiB7XG4gICAgICAgIHdhcm5pbmcgKz0gY29kZVxuICAgICAgICAgICAgPyBgIFNlZSBodHRwczovL2xpdC5kZXYvbXNnLyR7Y29kZX0gZm9yIG1vcmUgaW5mb3JtYXRpb24uYFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgaWYgKCFnbG9iYWxUaGlzLmxpdElzc3VlZFdhcm5pbmdzLmhhcyh3YXJuaW5nKSAmJlxuICAgICAgICAgICAgIWdsb2JhbFRoaXMubGl0SXNzdWVkV2FybmluZ3MuaGFzKGNvZGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4od2FybmluZyk7XG4gICAgICAgICAgICBnbG9iYWxUaGlzLmxpdElzc3VlZFdhcm5pbmdzLmFkZCh3YXJuaW5nKTtcbiAgICAgICAgfVxuICAgIH07XG59XG4vKipcbiAqIEEgcHJvcGVydHkgZGVjb3JhdG9yIHRoYXQgY29udmVydHMgYSBjbGFzcyBwcm9wZXJ0eSBpbnRvIGEgZ2V0dGVyIHRoYXRcbiAqIGV4ZWN1dGVzIGEgcXVlcnlTZWxlY3RvciBvbiB0aGUgZWxlbWVudCdzIHJlbmRlclJvb3QuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9yIEEgRE9NU3RyaW5nIGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgc2VsZWN0b3JzIHRvIG1hdGNoLlxuICogQHBhcmFtIGNhY2hlIEFuIG9wdGlvbmFsIGJvb2xlYW4gd2hpY2ggd2hlbiB0cnVlIHBlcmZvcm1zIHRoZSBET00gcXVlcnkgb25seVxuICogICAgIG9uY2UgYW5kIGNhY2hlcyB0aGUgcmVzdWx0LlxuICpcbiAqIFNlZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0RvY3VtZW50L3F1ZXJ5U2VsZWN0b3JcbiAqXG4gKiBgYGB0c1xuICogY2xhc3MgTXlFbGVtZW50IHtcbiAqICAgQHF1ZXJ5KCcjZmlyc3QnKVxuICogICBmaXJzdDogSFRNTERpdkVsZW1lbnQ7XG4gKlxuICogICByZW5kZXIoKSB7XG4gKiAgICAgcmV0dXJuIGh0bWxgXG4gKiAgICAgICA8ZGl2IGlkPVwiZmlyc3RcIj48L2Rpdj5cbiAqICAgICAgIDxkaXYgaWQ9XCJzZWNvbmRcIj48L2Rpdj5cbiAqICAgICBgO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqIEBjYXRlZ29yeSBEZWNvcmF0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5KHNlbGVjdG9yLCBjYWNoZSkge1xuICAgIHJldHVybiAoKHByb3RvT3JUYXJnZXQsIG5hbWVPckNvbnRleHQsIGRlc2NyaXB0b3IpID0+IHtcbiAgICAgICAgY29uc3QgZG9RdWVyeSA9IChlbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gKGVsLnJlbmRlclJvb3Q/LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpID8/IG51bGwpO1xuICAgICAgICAgICAgaWYgKERFVl9NT0RFICYmIHJlc3VsdCA9PT0gbnVsbCAmJiBjYWNoZSAmJiAhZWwuaGFzVXBkYXRlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0eXBlb2YgbmFtZU9yQ29udGV4dCA9PT0gJ29iamVjdCdcbiAgICAgICAgICAgICAgICAgICAgPyBuYW1lT3JDb250ZXh0Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgOiBuYW1lT3JDb250ZXh0O1xuICAgICAgICAgICAgICAgIGlzc3VlV2FybmluZygnJywgYEBxdWVyeSdkIGZpZWxkICR7SlNPTi5zdHJpbmdpZnkoU3RyaW5nKG5hbWUpKX0gd2l0aCB0aGUgJ2NhY2hlJyBgICtcbiAgICAgICAgICAgICAgICAgICAgYGZsYWcgc2V0IGZvciBzZWxlY3RvciAnJHtzZWxlY3Rvcn0nIGhhcyBiZWVuIGFjY2Vzc2VkIGJlZm9yZSBgICtcbiAgICAgICAgICAgICAgICAgICAgYHRoZSBmaXJzdCB1cGRhdGUgYW5kIHJldHVybmVkIG51bGwuIFRoaXMgaXMgZXhwZWN0ZWQgaWYgdGhlIGAgK1xuICAgICAgICAgICAgICAgICAgICBgcmVuZGVyUm9vdCB0cmVlIGhhcyBub3QgYmVlbiBwcm92aWRlZCBiZWZvcmVoYW5kIChlLmcuIHZpYSBgICtcbiAgICAgICAgICAgICAgICAgICAgYERlY2xhcmF0aXZlIFNoYWRvdyBET00pLiBUaGVyZWZvcmUgdGhlIHZhbHVlIGhhc24ndCBiZWVuIGNhY2hlZC5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IGlmIHdlIHdhbnQgdG8gYWxsb3cgdXNlcnMgdG8gYXNzZXJ0IHRoYXQgdGhlIHF1ZXJ5IHdpbGwgbmV2ZXJcbiAgICAgICAgICAgIC8vIHJldHVybiBudWxsLCB3ZSBuZWVkIGEgbmV3IG9wdGlvbiBhbmQgdG8gdGhyb3cgaGVyZSBpZiB0aGUgcmVzdWx0XG4gICAgICAgICAgICAvLyBpcyBudWxsLlxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGNhY2hlKSB7XG4gICAgICAgICAgICAvLyBBY2Nlc3NvcnMgdG8gd3JhcCBmcm9tIGVpdGhlcjpcbiAgICAgICAgICAgIC8vICAgMS4gVGhlIGRlY29yYXRvciB0YXJnZXQsIGluIHRoZSBjYXNlIG9mIHN0YW5kYXJkIGRlY29yYXRvcnNcbiAgICAgICAgICAgIC8vICAgMi4gVGhlIHByb3BlcnR5IGRlc2NyaXB0b3IsIGluIHRoZSBjYXNlIG9mIGV4cGVyaW1lbnRhbCBkZWNvcmF0b3JzXG4gICAgICAgICAgICAvLyAgICAgIG9uIGF1dG8tYWNjZXNzb3JzLlxuICAgICAgICAgICAgLy8gICAzLiBGdW5jdGlvbnMgdGhhdCBhY2Nlc3Mgb3VyIG93biBjYWNoZS1rZXkgcHJvcGVydHkgb24gdGhlIGluc3RhbmNlLFxuICAgICAgICAgICAgLy8gICAgICBpbiB0aGUgY2FzZSBvZiBleHBlcmltZW50YWwgZGVjb3JhdG9ycyBvbiBmaWVsZHMuXG4gICAgICAgICAgICBjb25zdCB7IGdldCwgc2V0IH0gPSB0eXBlb2YgbmFtZU9yQ29udGV4dCA9PT0gJ29iamVjdCdcbiAgICAgICAgICAgICAgICA/IHByb3RvT3JUYXJnZXRcbiAgICAgICAgICAgICAgICA6IChkZXNjcmlwdG9yID8/XG4gICAgICAgICAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBERVZfTU9ERVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gU3ltYm9sKGAke1N0cmluZyhuYW1lT3JDb250ZXh0KX0gKEBxdWVyeSgpIGNhY2hlKWApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTeW1ib2woKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0KHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXldID0gdjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSkoKSk7XG4gICAgICAgICAgICByZXR1cm4gZGVzYyhwcm90b09yVGFyZ2V0LCBuYW1lT3JDb250ZXh0LCB7XG4gICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gZ2V0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZG9RdWVyeSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwgfHwgdGhpcy5oYXNVcGRhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0LmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoaXMgb2JqZWN0IHdvcmtzIGFzIHRoZSByZXR1cm4gdHlwZSBmb3IgYm90aCBzdGFuZGFyZCBhbmRcbiAgICAgICAgICAgIC8vIGV4cGVyaW1lbnRhbCBkZWNvcmF0b3JzLlxuICAgICAgICAgICAgcmV0dXJuIGRlc2MocHJvdG9PclRhcmdldCwgbmFtZU9yQ29udGV4dCwge1xuICAgICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvUXVlcnkodGhpcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWVyeS5qcy5tYXAiLAogICAgImltcG9ydCB7IExpdEVsZW1lbnQsIGh0bWwsIGNzcyB9IGZyb20gJ2xpdCc7XG5pbXBvcnQgeyBjdXN0b21FbGVtZW50LCBwcm9wZXJ0eSB9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcblxuQGN1c3RvbUVsZW1lbnQoJ3RzcG0tc2lkZWJhcicpXG5leHBvcnQgY2xhc3MgVHNwbVNpZGViYXIgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBAcHJvcGVydHkoeyB0eXBlOiBTdHJpbmcgfSkgY3VycmVudFZpZXcgPSAnZGFzaGJvYXJkJztcbiAgICBAcHJvcGVydHkoeyB0eXBlOiBCb29sZWFuIH0pIGlzT25saW5lID0gZmFsc2U7XG5cbiAgICBzdGF0aWMgb3ZlcnJpZGUgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE1LCAxNSwgMjAsIDAuOCk7XG4gICAgICAgICAgICBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoMTJweCk7XG4gICAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBwYWRkaW5nOiAxLjVyZW0gMXJlbTtcbiAgICAgICAgICAgIHotaW5kZXg6IDEwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5sb2dvIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDJyZW07XG4gICAgICAgIH1cblxuICAgICAgICAubG9nby1pY29uIHtcbiAgICAgICAgICAgIHdpZHRoOiAzMnB4O1xuICAgICAgICAgICAgaGVpZ2h0OiAzMnB4O1xuICAgICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzYzNjZmMSAwJSwgI2E4NTVmNyAxMDAlKTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSg5OSwgMTAyLCAyNDEsIDAuMyk7XG4gICAgICAgIH1cblxuICAgICAgICAubG9nby10ZXh0IHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMS4yNXJlbTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgICBsZXR0ZXItc3BhY2luZzogLTAuNXB4O1xuICAgICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgIH1cblxuICAgICAgICAubmF2LWxpbmtzIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgICAgZ2FwOiAwLjVyZW07XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLm5hdi1idG4ge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjg3NXJlbSAxcmVtO1xuICAgICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgICBjb2xvcjogIzk0YTNiODtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBjdWJpYy1iZXppZXIoMC40LCAwLCAwLjIsIDEpO1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjk1cmVtO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5uYXYtYnRuOmhvdmVyIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMyk7XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5uYXYtYnRuLmFjdGl2ZSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDk5LCAxMDIsIDI0MSwgMC4xKTtcbiAgICAgICAgICAgIGNvbG9yOiAjODE4Y2Y4O1xuICAgICAgICB9XG5cbiAgICAgICAgLm5hdi1idG4gaSB7XG4gICAgICAgICAgICB3aWR0aDogMjBweDtcbiAgICAgICAgICAgIGhlaWdodDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zaWRlYmFyLWZvb3RlciB7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiBhdXRvO1xuICAgICAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnN5c3RlbS1zdGF0dXMge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBnYXA6IDEwcHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuODVyZW07XG4gICAgICAgICAgICBjb2xvcjogIzY0NzQ4YjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtZG90IHtcbiAgICAgICAgICAgIHdpZHRoOiA4cHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDhweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICM0NzU1Njk7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdHVzLWRvdC5vbmxpbmUge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzEwYjk4MTtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgMCA4cHggcmdiYSgxNiwgMTg1LCAxMjksIDAuNSk7XG4gICAgICAgIH1cblxuICAgICAgICBAbWVkaWEgKG1heC13aWR0aDogNzY4cHgpIHtcbiAgICAgICAgICAgIC5sb2dvLXRleHQsIC5uYXYtYnRuIHNwYW4sIC5zeXN0ZW0tc3RhdHVzIHNwYW4ge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAubmF2LWJ0biB7XG4gICAgICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC5sb2dvIHtcbiAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAxcmVtIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBgO1xuXG4gICAgcHJpdmF0ZSBfY2hhbmdlVmlldyh2aWV3OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgndmlldy1jaGFuZ2UnLCB7IGRldGFpbDogdmlldyB9KSk7XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gaHRtbGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsb2dvXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvZ28taWNvblwiPlQ8L2Rpdj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImxvZ28tdGV4dFwiPlRTUE08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm5hdi1saW5rc1wiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJuYXYtYnRuICR7dGhpcy5jdXJyZW50VmlldyA9PT0gJ2Rhc2hib2FyZCcgPyAnYWN0aXZlJyA6ICcnfVwiIEBjbGljaz1cIiR7KCkgPT4gdGhpcy5fY2hhbmdlVmlldygnZGFzaGJvYXJkJyl9XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwibGF5b3V0LWRhc2hib2FyZFwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+RGFzaGJvYXJkPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJuYXYtYnRuICR7dGhpcy5jdXJyZW50VmlldyA9PT0gJ3Byb2Nlc3NlcycgPyAnYWN0aXZlJyA6ICcnfVwiIEBjbGljaz1cIiR7KCkgPT4gdGhpcy5fY2hhbmdlVmlldygncHJvY2Vzc2VzJyl9XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiY3B1XCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5Qcm9jZXNzZXM8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cIm5hdi1idG4gJHt0aGlzLmN1cnJlbnRWaWV3ID09PSAndGVybWluYWwnID8gJ2FjdGl2ZScgOiAnJ31cIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuX2NoYW5nZVZpZXcoJ3Rlcm1pbmFsJyl9XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwidGVybWluYWxcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkV4ZWN1dG9yPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJuYXYtYnRuICR7dGhpcy5jdXJyZW50VmlldyA9PT0gJ2xvZ3MnID8gJ2FjdGl2ZScgOiAnJ31cIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuX2NoYW5nZVZpZXcoJ2xvZ3MnKX1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJmaWxlLXRleHRcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkxpdmUgTG9nczwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2lkZWJhci1mb290ZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3lzdGVtLXN0YXR1c1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHVzLWRvdCAke3RoaXMuaXNPbmxpbmUgPyAnb25saW5lJyA6ICcnfVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5TeXN0ZW0gJHt0aGlzLmlzT25saW5lID8gJ09ubGluZScgOiAnT2ZmbGluZSd9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgdXBkYXRlZCgpIHtcbiAgICAgICAgLy8gTHVjaWRlIGljb25zIG5lZWQgdG8gYmUgaW5pdGlhbGl6ZWQgYWZ0ZXIgcmVuZGVyXG4gICAgICAgIGNvbnN0IGx1Y2lkZSA9ICh3aW5kb3cgYXMgYW55KS5sdWNpZGU7XG4gICAgICAgIGlmIChsdWNpZGUpIHtcbiAgICAgICAgICAgIGx1Y2lkZS5jcmVhdGVJY29ucyh7XG4gICAgICAgICAgICAgICAgYXR0cnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ3N0cm9rZS13aWR0aCc6IDIsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6ICdsdWNpZGUtaWNvbidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG5hbWVBdHRyOiAnZGF0YS1sdWNpZGUnLFxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMuc2hhZG93Um9vdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbiIsCiAgICAiaW1wb3J0IHsgTGl0RWxlbWVudCwgaHRtbCwgY3NzIH0gZnJvbSAnbGl0JztcbmltcG9ydCB7IGN1c3RvbUVsZW1lbnQgfSBmcm9tICdsaXQvZGVjb3JhdG9ycy5qcyc7XG5cbkBjdXN0b21FbGVtZW50KCd0c3BtLXRvcGJhcicpXG5leHBvcnQgY2xhc3MgVHNwbVRvcGJhciBleHRlbmRzIExpdEVsZW1lbnQge1xuICAgIHN0YXRpYyBvdmVycmlkZSBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgICAgcGFkZGluZzogMS4yNXJlbSAycmVtO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgxMCwgMTAsIDEyLCAwLjQpO1xuICAgICAgICAgICAgYmFja2Ryb3AtZmlsdGVyOiBibHVyKDhweCk7XG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGhlaWdodDogNzJweDtcbiAgICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICAgIH1cblxuICAgICAgICAuc2VhcmNoLWNvbnRhaW5lciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMyk7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAuNnJlbSAxcmVtO1xuICAgICAgICAgICAgd2lkdGg6IDQwMHB4O1xuICAgICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zZWFyY2gtY29udGFpbmVyOmZvY3VzLXdpdGhpbiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2JhKDk5LCAxMDIsIDI0MSwgMC4zKTtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDk5LCAxMDIsIDI0MSwgMC4xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zZWFyY2gtY29udGFpbmVyIGkge1xuICAgICAgICAgICAgY29sb3I6ICM2NDc0OGI7XG4gICAgICAgICAgICB3aWR0aDogMThweDtcbiAgICAgICAgICAgIGhlaWdodDogMThweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zZWFyY2gtY29udGFpbmVyIGlucHV0IHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgICBmb250LWZhbWlseTogaW5oZXJpdDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMC45cmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLmFjdGlvbnMge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGdhcDogMC43NXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4ge1xuICAgICAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjZyZW0gMXJlbTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOXJlbTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBlYXNlO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgICBmb250LWZhbWlseTogaW5oZXJpdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4tcHJpbWFyeSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjNjM2NmYxO1xuICAgICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDk5LCAxMDIsIDI0MSwgMC4yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjNGY0NmU1O1xuICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xcHgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi1zZWNvbmRhcnkge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGNvbG9yOiAjZTJlOGYwO1xuICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSk7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLXNlY29uZGFyeTpob3ZlciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi1pY29uIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAuNnJlbTtcbiAgICAgICAgICAgIGFzcGVjdC1yYXRpbzogMTtcbiAgICAgICAgfVxuXG4gICAgICAgIEBtZWRpYSAobWF4LXdpZHRoOiA2NDBweCkge1xuICAgICAgICAgICAgLnNlYXJjaC1jb250YWluZXIge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBgO1xuXG4gICAgb3ZlcnJpZGUgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gaHRtbGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWFyY2gtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJzZWFyY2hcIj48L2k+XG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJTZWFyY2ggcHJvY2Vzc2VzLCBsb2dzLCBjb21tYW5kcy4uLlwiIC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFjdGlvbnNcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1zZWNvbmRhcnkgYnRuLWljb25cIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3JlZnJlc2gnKSl9XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwicmVmcmVzaC1jd1wiPjwvaT5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5XCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdvcGVuLW1vZGFsJykpfVwiPlxuICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cInBsdXNcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPk5ldyBQcm9jZXNzPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgdXBkYXRlZCgpIHtcbiAgICAgICAgY29uc3QgbHVjaWRlID0gKHdpbmRvdyBhcyBhbnkpLmx1Y2lkZTtcbiAgICAgICAgaWYgKGx1Y2lkZSkge1xuICAgICAgICAgICAgbHVjaWRlLmNyZWF0ZUljb25zKHtcbiAgICAgICAgICAgICAgICBhdHRyczogeyAnc3Ryb2tlLXdpZHRoJzogMiwgJ2NsYXNzJzogJ2x1Y2lkZS1pY29uJyB9LFxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMuc2hhZG93Um9vdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbiIsCiAgICAiaW1wb3J0IHsgTGl0RWxlbWVudCwgaHRtbCwgY3NzIH0gZnJvbSAnbGl0JztcbmltcG9ydCB7IGN1c3RvbUVsZW1lbnQsIHByb3BlcnR5IH0gZnJvbSAnbGl0L2RlY29yYXRvcnMuanMnO1xuXG5AY3VzdG9tRWxlbWVudCgndHNwbS1kYXNoYm9hcmQnKVxuZXhwb3J0IGNsYXNzIFRzcG1EYXNoYm9hcmQgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBAcHJvcGVydHkoeyB0eXBlOiBBcnJheSB9KSBwcm9jZXNzZXM6IGFueVtdID0gW107XG4gICAgQHByb3BlcnR5KHsgdHlwZTogT2JqZWN0IH0pIHN0YXRzOiBhbnkgPSB7fTtcblxuICAgIHN0YXRpYyBvdmVycmlkZSBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICB9XG5cbiAgICAgICAgLnN0YXRzLWdyaWQge1xuICAgICAgICAgICAgZGlzcGxheTogZ3JpZDtcbiAgICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMjQwcHgsIDFmcikpO1xuICAgICAgICAgICAgZ2FwOiAxLjVyZW07XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAyLjVyZW07XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdC1jYXJkIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMyk7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMjBweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEuNXJlbTtcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC4ycyBlYXNlLCBiYWNrZ3JvdW5kIDAuMnMgZWFzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LWNhcmQ6aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMnB4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LWhlYWRlciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxcmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLnN0YXQtaGVhZGVyIGgzIHtcbiAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMC45cmVtO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnN0YXQtaGVhZGVyIGkge1xuICAgICAgICAgICAgY29sb3I6ICM2MzY2ZjE7XG4gICAgICAgICAgICB3aWR0aDogMjBweDtcbiAgICAgICAgICAgIGhlaWdodDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LXZhbHVlIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMnJlbTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDAuNXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LWZvb3RlciB7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuODVyZW07XG4gICAgICAgIH1cblxuICAgICAgICAudGV4dC1zdWNjZXNzIHsgY29sb3I6ICMxMGI5ODE7IH1cbiAgICAgICAgLnRleHQtbXV0ZWQgeyBjb2xvcjogIzY0NzQ4YjsgfVxuXG4gICAgICAgIC5wcm9ncmVzcy1iYXIge1xuICAgICAgICAgICAgaGVpZ2h0OiA0cHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMnB4O1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMXJlbTtcbiAgICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAucHJvZ3Jlc3Mge1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkwZGVnLCAjNjM2NmYxLCAjYTg1NWY3KTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDJweDtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IHdpZHRoIDAuM3MgZWFzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zZWN0aW9uLWhlYWRlciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDEuNXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zZWN0aW9uLWhlYWRlciBoMiB7XG4gICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICBmb250LXNpemU6IDEuNXJlbTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgIH1cblxuICAgICAgICAucHJvY2Vzcy1ncmlkIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgzMjBweCwgMWZyKSk7XG4gICAgICAgICAgICBnYXA6IDEuNXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5sb2FkaW5nLXN0YXRlIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgICAgcGFkZGluZzogNHJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjNjQ3NDhiO1xuICAgICAgICAgICAgZ3JpZC1jb2x1bW46IDEgLyAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zcGluIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbjogc3BpbiAycyBsaW5lYXIgaW5maW5pdGU7XG4gICAgICAgICAgICB3aWR0aDogMzJweDtcbiAgICAgICAgICAgIGhlaWdodDogMzJweDtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDFyZW07XG4gICAgICAgIH1cblxuICAgICAgICBAa2V5ZnJhbWVzIHNwaW4ge1xuICAgICAgICAgICAgZnJvbSB7IHRyYW5zZm9ybTogcm90YXRlKDBkZWcpOyB9XG4gICAgICAgICAgICB0byB7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH1cbiAgICAgICAgfVxuICAgIGA7XG5cbiAgICBwcml2YXRlIGZvcm1hdEJ5dGVzKGJ5dGVzOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCFieXRlcykgcmV0dXJuICcwIEInO1xuICAgICAgICBjb25zdCBrID0gMTAyNDtcbiAgICAgICAgY29uc3Qgc2l6ZXMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXTtcbiAgICAgICAgY29uc3QgaSA9IE1hdGguZmxvb3IoTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coaykpO1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCgoYnl0ZXMgLyBNYXRoLnBvdyhrLCBpKSkudG9GaXhlZCgyKSkgKyAnICcgKyBzaXplc1tpXTtcbiAgICB9XG5cbiAgICBvdmVycmlkZSByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsQ3B1ID0gdGhpcy5wcm9jZXNzZXMucmVkdWNlKChhY2MsIHApID0+IGFjYyArIChwLmNwdSB8fCAwKSwgMCk7XG4gICAgICAgIGNvbnN0IHRvdGFsTWVtID0gdGhpcy5wcm9jZXNzZXMucmVkdWNlKChhY2MsIHApID0+IGFjYyArIChwLm1lbW9yeSB8fCAwKSwgMCk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHMtZ3JpZFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+VG90YWwgUHJvY2Vzc2VzPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwibGF5ZXJzXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtdmFsdWVcIj4ke3RoaXMucHJvY2Vzc2VzLmxlbmd0aH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPkFjdGl2ZSAmIE1vbml0b3Jpbmc8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtY2FyZFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMz5BY3RpdmUgQ1BVIFVzYWdlPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiYWN0aXZpdHlcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC12YWx1ZVwiPiR7TWF0aC5yb3VuZCh0b3RhbENwdSl9JTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1mb290ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwcm9ncmVzcy1iYXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3NcIiBzdHlsZT1cIndpZHRoOiAke01hdGgubWluKDEwMCwgdG90YWxDcHUpfSVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+VG90YWwgTWVtb3J5PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiZGF0YWJhc2VcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC12YWx1ZVwiPiR7dGhpcy5mb3JtYXRCeXRlcyh0b3RhbE1lbSl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LW11dGVkXCI+VG90YWwgYWxsb2NhdGVkPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+U3lzdGVtIEhlYWx0aDwvaDM+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cInNoaWVsZC1jaGVja1wiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LXZhbHVlXCI+U3RhYmxlPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3NcIj5BbGwgc2VydmljZXMgb3BlcmF0aW9uYWw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxoMj5SdW5uaW5nIFByb2Nlc3NlczwvaDI+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInByb2Nlc3MtZ3JpZFwiPlxuICAgICAgICAgICAgICAgICR7dGhpcy5wcm9jZXNzZXMubGVuZ3RoID09PSAwID8gaHRtbGBcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvYWRpbmctc3RhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwibG9hZGVyLTJcIiBjbGFzcz1cInNwaW5cIj48L2k+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5XYWl0aW5nIGZvciBwcm9jZXNzIGRhdGEuLi48L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIGAgOiB0aGlzLnByb2Nlc3Nlcy5tYXAocCA9PiBodG1sYFxuICAgICAgICAgICAgICAgICAgICA8dHNwbS1wcm9jZXNzLWNhcmQgLnByb2Nlc3M9XCIke3B9XCI+PC90c3BtLXByb2Nlc3MtY2FyZD5cbiAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cblxuICAgIG92ZXJyaWRlIHVwZGF0ZWQoKSB7XG4gICAgICAgIGNvbnN0IGx1Y2lkZSA9ICh3aW5kb3cgYXMgYW55KS5sdWNpZGU7XG4gICAgICAgIGlmIChsdWNpZGUpIHtcbiAgICAgICAgICAgIGx1Y2lkZS5jcmVhdGVJY29ucyh7XG4gICAgICAgICAgICAgICAgYXR0cnM6IHsgJ3N0cm9rZS13aWR0aCc6IDIsICdjbGFzcyc6ICdsdWNpZGUtaWNvbicgfSxcbiAgICAgICAgICAgICAgICByb290OiB0aGlzLnNoYWRvd1Jvb3RcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4iLAogICAgImltcG9ydCB7IExpdEVsZW1lbnQsIGh0bWwsIGNzcyB9IGZyb20gJ2xpdCc7XG5pbXBvcnQgeyBjdXN0b21FbGVtZW50LCBwcm9wZXJ0eSB9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcblxuQGN1c3RvbUVsZW1lbnQoJ3RzcG0tcHJvY2Vzcy1jYXJkJylcbmV4cG9ydCBjbGFzcyBUc3BtUHJvY2Vzc0NhcmQgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBAcHJvcGVydHkoeyB0eXBlOiBPYmplY3QgfSkgcHJvY2VzczogYW55ID0ge307XG5cbiAgICBzdGF0aWMgb3ZlcnJpZGUgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5jYXJkIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMyk7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEuMjVyZW07XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLmNhcmQ6aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1jb2xvcjogcmdiYSg5OSwgMTAyLCAyNDEsIDAuMik7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDhweCAzMnB4IHJnYmEoMCwgMCwgMCwgMC4yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5jYXJkLWhlYWRlciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxLjI1cmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLmluZm8gaDQge1xuICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgICAgZm9udC1zaXplOiAxLjFyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlkIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMC43NXJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjNjQ3NDhiO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdKZXRCcmFpbnMgTW9ubycsIG1vbm9zcGFjZTtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDRweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtYmFkZ2Uge1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjdyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDRweCAxMHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMjBweDtcbiAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAwLjVweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtcnVubmluZyB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE2LCAxODUsIDEyOSwgMC4xKTtcbiAgICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgxNiwgMTg1LCAxMjksIDAuMik7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdHVzLXN0b3BwZWQge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyMzksIDY4LCA2OCwgMC4xKTtcbiAgICAgICAgICAgIGNvbG9yOiAjZWY0NDQ0O1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyMzksIDY4LCA2OCwgMC4yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0cyB7XG4gICAgICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyO1xuICAgICAgICAgICAgZ2FwOiAxcmVtO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMS41cmVtO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjIpO1xuICAgICAgICAgICAgcGFkZGluZzogMC44NzVyZW07XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnN0YXQtaXRlbSB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjg1cmVtO1xuICAgICAgICAgICAgY29sb3I6ICM5NGEzYjg7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdC1pdGVtIGkge1xuICAgICAgICAgICAgd2lkdGg6IDE0cHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDE0cHg7XG4gICAgICAgICAgICBjb2xvcjogIzYzNjZmMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LWl0ZW0gc3BhbiB7XG4gICAgICAgICAgICBjb2xvcjogI2UyZThmMDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgIH1cblxuICAgICAgICAuYWN0aW9ucyB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLWljb24ge1xuICAgICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjZyZW07XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgICAgICAgICBjb2xvcjogIzk0YTNiODtcbiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjJzIGVhc2U7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLWljb246aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSk7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLWljb24ucmVzdGFydDpob3ZlciB7IGNvbG9yOiAjODE4Y2Y4OyBib3JkZXItY29sb3I6IHJnYmEoMTI5LCAxNDAsIDI0OCwgMC4zKTsgfVxuICAgICAgICAuYnRuLWljb24uc3RvcDpob3ZlciB7IGNvbG9yOiAjZjg3MTcxOyBib3JkZXItY29sb3I6IHJnYmEoMjQ4LCAxMTMsIDExMywgMC4zKTsgfVxuICAgICAgICAuYnRuLWljb24uc3RhcnQ6aG92ZXIgeyBjb2xvcjogIzM0ZDM5OTsgYm9yZGVyLWNvbG9yOiByZ2JhKDUyLCAyMTEsIDE1MywgMC4zKTsgfVxuXG4gICAgICAgIC5idG4taWNvbiBpIHtcbiAgICAgICAgICAgIHdpZHRoOiAxOHB4O1xuICAgICAgICAgICAgaGVpZ2h0OiAxOHB4O1xuICAgICAgICB9XG4gICAgYDtcblxuICAgIHByaXZhdGUgZm9ybWF0Qnl0ZXMoYnl0ZXM6IG51bWJlcikge1xuICAgICAgICBpZiAoIWJ5dGVzKSByZXR1cm4gJzAgQic7XG4gICAgICAgIGNvbnN0IGsgPSAxMDI0O1xuICAgICAgICBjb25zdCBpID0gTWF0aC5mbG9vcihNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZyhrKSk7XG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KChieXRlcyAvIE1hdGgucG93KGssIGkpKS50b0ZpeGVkKDEpKSArICcgJyArIFsnQicsICdLQicsICdNQicsICdHQiddW2ldO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYWN0aW9uKHR5cGU6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvdjEvcHJvY2Vzc2VzLyR7dGhpcy5wcm9jZXNzLm5hbWV9LyR7dHlwZX1gLCB7IG1ldGhvZDogJ1BPU1QnIH0pO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgncmVmcmVzaC1yZXF1aXJlZCcsIHsgYnViYmxlczogdHJ1ZSwgY29tcG9zZWQ6IHRydWUgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FjdGlvbiBmYWlsZWQnLCBlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBwID0gdGhpcy5wcm9jZXNzO1xuICAgICAgICByZXR1cm4gaHRtbGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpbmZvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDQ+JHtwLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWRcIj5QSUQ6ICR7cC5waWQgfHwgJ04vQSd9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXR1cy1iYWRnZSBzdGF0dXMtJHtwLnN0YXRlfVwiPiR7cC5zdGF0ZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaXRlbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJhY3Rpdml0eVwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7cC5jcHUgfHwgMH0lPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaXRlbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJkYXRhYmFzZVwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7dGhpcy5mb3JtYXRCeXRlcyhwLm1lbW9yeSB8fCAwKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFjdGlvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1pY29uIHJlc3RhcnRcIiB0aXRsZT1cIlJlc3RhcnRcIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuYWN0aW9uKCdyZXN0YXJ0Jyl9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cInJlZnJlc2gtY2N3XCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgJHtwLnN0YXRlID09PSAncnVubmluZycgXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGh0bWxgPGJ1dHRvbiBjbGFzcz1cImJ0bi1pY29uIHN0b3BcIiB0aXRsZT1cIlN0b3BcIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuYWN0aW9uKCdzdG9wJyl9XCI+PGkgZGF0YS1sdWNpZGU9XCJzcXVhcmVcIj48L2k+PC9idXR0b24+YFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBodG1sYDxidXR0b24gY2xhc3M9XCJidG4taWNvbiBzdGFydFwiIHRpdGxlPVwiU3RhcnRcIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuYWN0aW9uKCdzdGFydCcpfVwiPjxpIGRhdGEtbHVjaWRlPVwicGxheVwiPjwvaT48L2J1dHRvbj5gXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1pY29uXCIgdGl0bGU9XCJMb2dzXCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCd2aWV3LWxvZ3MnLCB7IGRldGFpbDogcC5uYW1lLCBidWJibGVzOiB0cnVlLCBjb21wb3NlZDogdHJ1ZSB9KSl9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cImZpbGUtdGV4dFwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBvdmVycmlkZSB1cGRhdGVkKCkge1xuICAgICAgICBjb25zdCBsdWNpZGUgPSAod2luZG93IGFzIGFueSkubHVjaWRlO1xuICAgICAgICBpZiAobHVjaWRlKSB7XG4gICAgICAgICAgICBsdWNpZGUuY3JlYXRlSWNvbnMoe1xuICAgICAgICAgICAgICAgIGF0dHJzOiB7ICdzdHJva2Utd2lkdGgnOiAyLCAnY2xhc3MnOiAnbHVjaWRlLWljb24nIH0sXG4gICAgICAgICAgICAgICAgcm9vdDogdGhpcy5zaGFkb3dSb290XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuIiwKICAgICJpbXBvcnQgeyBMaXRFbGVtZW50LCBodG1sLCBjc3MgfSBmcm9tICdsaXQnO1xuaW1wb3J0IHsgY3VzdG9tRWxlbWVudCwgcHJvcGVydHkgfSBmcm9tICdsaXQvZGVjb3JhdG9ycy5qcyc7XG5cbkBjdXN0b21FbGVtZW50KCd0c3BtLXByb2Nlc3MtdGFibGUnKVxuZXhwb3J0IGNsYXNzIFRzcG1Qcm9jZXNzVGFibGUgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBAcHJvcGVydHkoeyB0eXBlOiBBcnJheSB9KSBwcm9jZXNzZXM6IGFueVtdID0gW107XG5cbiAgICBzdGF0aWMgb3ZlcnJpZGUgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZS1jb250YWluZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKTtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAyMHB4O1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhYmxlIHtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMik7XG4gICAgICAgICAgICBwYWRkaW5nOiAxLjI1cmVtIDEuNXJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGQge1xuICAgICAgICAgICAgcGFkZGluZzogMS4yNXJlbSAxLjVyZW07XG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKTtcbiAgICAgICAgICAgIGNvbG9yOiAjZTJlOGYwO1xuICAgICAgICB9XG5cbiAgICAgICAgdHI6bGFzdC1jaGlsZCB0ZCB7XG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgdHI6aG92ZXIgdGQge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtYmFkZ2Uge1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjc1cmVtO1xuICAgICAgICAgICAgcGFkZGluZzogNHB4IDhweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdHVzLXJ1bm5pbmcgeyBjb2xvcjogIzEwYjk4MTsgYmFja2dyb3VuZDogcmdiYSgxNiwgMTg1LCAxMjksIDAuMSk7IH1cbiAgICAgICAgLnN0YXR1cy1zdG9wcGVkIHsgY29sb3I6ICNlZjQ0NDQ7IGJhY2tncm91bmQ6IHJnYmEoMjM5LCA2OCwgNjgsIDAuMSk7IH1cblxuICAgICAgICAuZm9udC1tb25vIHtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOHJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmFjdGlvbnMge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi1pY29uIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDZweDtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgICAgY29sb3I6ICM2NDc0OGI7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4taWNvbjpob3ZlciB7XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgIH1cbiAgICBgO1xuXG4gICAgcHJpdmF0ZSBmb3JtYXRCeXRlcyhieXRlczogbnVtYmVyKSB7XG4gICAgICAgIGlmICghYnl0ZXMpIHJldHVybiAnMCBCJztcbiAgICAgICAgY29uc3QgayA9IDEwMjQ7XG4gICAgICAgIGNvbnN0IGkgPSBNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKTtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoKGJ5dGVzIC8gTWF0aC5wb3coaywgaSkpLnRvRml4ZWQoMSkpICsgJyAnICsgWydCJywgJ0tCJywgJ01CJywgJ0dCJ11baV07XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gaHRtbGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWJsZS1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+TmFtZTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPlN0YXR1czwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPlBJRDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPk1lbW9yeTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPkNQVTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPlVwdGltZTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPkFjdGlvbnM8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgJHt0aGlzLnByb2Nlc3Nlcy5tYXAocCA9PiBodG1sYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiZm9udC13ZWlnaHQ6IDYwMDtcIj4ke3AubmFtZX08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PHNwYW4gY2xhc3M9XCJzdGF0dXMtYmFkZ2Ugc3RhdHVzLSR7cC5zdGF0ZX1cIj4ke3Auc3RhdGV9PC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImZvbnQtbW9ub1wiPiMke3AucGlkIHx8ICctJ308L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+JHt0aGlzLmZvcm1hdEJ5dGVzKHAubWVtb3J5IHx8IDApfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3AuY3B1IHx8IDB9JTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3RoaXMuZm9ybWF0VXB0aW1lKHAudXB0aW1lKX08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYWN0aW9uc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4taWNvblwiIEBjbGljaz1cIiR7KCkgPT4gdGhpcy5fYWN0aW9uKHAubmFtZSwgJ3Jlc3RhcnQnKX1cIj48aSBkYXRhLWx1Y2lkZT1cInJlZnJlc2gtY2N3XCIgc3R5bGU9XCJ3aWR0aDoxNnB4XCI+PC9pPjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4taWNvblwiIEBjbGljaz1cIiR7KCkgPT4gdGhpcy5fYWN0aW9uKHAubmFtZSwgcC5zdGF0ZSA9PT0gJ3J1bm5pbmcnID8gJ3N0b3AnIDogJ3N0YXJ0Jyl9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiJHtwLnN0YXRlID09PSAncnVubmluZycgPyAnc3F1YXJlJyA6ICdwbGF5J31cIiBzdHlsZT1cIndpZHRoOjE2cHhcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgYCl9XG4gICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cblxuICAgIHByaXZhdGUgZm9ybWF0VXB0aW1lKG1zPzogbnVtYmVyKSB7XG4gICAgICAgIGlmICghbXMpIHJldHVybiAnLSc7XG4gICAgICAgIGNvbnN0IHMgPSBNYXRoLmZsb29yKG1zIC8gMTAwMCk7XG4gICAgICAgIGNvbnN0IG0gPSBNYXRoLmZsb29yKHMgLyA2MCk7XG4gICAgICAgIGNvbnN0IGggPSBNYXRoLmZsb29yKG0gLyA2MCk7XG4gICAgICAgIHJldHVybiBgJHtofWggJHttICUgNjB9bWA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfYWN0aW9uKG5hbWU6IHN0cmluZywgYWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgZmV0Y2goYC9hcGkvdjEvcHJvY2Vzc2VzLyR7bmFtZX0vJHthY3Rpb259YCwgeyBtZXRob2Q6ICdQT1NUJyB9KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgncmVmcmVzaC1yZXF1aXJlZCcsIHsgYnViYmxlczogdHJ1ZSwgY29tcG9zZWQ6IHRydWUgfSkpO1xuICAgIH1cblxuICAgIG92ZXJyaWRlIHVwZGF0ZWQoKSB7XG4gICAgICAgIGNvbnN0IGx1Y2lkZSA9ICh3aW5kb3cgYXMgYW55KS5sdWNpZGU7XG4gICAgICAgIGlmIChsdWNpZGUpIHtcbiAgICAgICAgICAgIGx1Y2lkZS5jcmVhdGVJY29ucyh7XG4gICAgICAgICAgICAgICAgYXR0cnM6IHsgJ3N0cm9rZS13aWR0aCc6IDIsICdjbGFzcyc6ICdsdWNpZGUtaWNvbicgfSxcbiAgICAgICAgICAgICAgICByb290OiB0aGlzLnNoYWRvd1Jvb3RcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4iLAogICAgImltcG9ydCB7IExpdEVsZW1lbnQsIGh0bWwsIGNzcywgdHlwZSBQcm9wZXJ0eVZhbHVlcyB9IGZyb20gJ2xpdCc7XG5pbXBvcnQgeyBjdXN0b21FbGVtZW50LCBwcm9wZXJ0eSwgc3RhdGUsIHF1ZXJ5IH0gZnJvbSAnbGl0L2RlY29yYXRvcnMuanMnO1xuXG5AY3VzdG9tRWxlbWVudCgndHNwbS10ZXJtaW5hbCcpXG5leHBvcnQgY2xhc3MgVHNwbVRlcm1pbmFsIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgQHByb3BlcnR5KHsgdHlwZTogQm9vbGVhbiB9KSBhY3RpdmUgPSBmYWxzZTtcbiAgICBAc3RhdGUoKSBwcml2YXRlIGhpc3Rvcnk6IGFueVtdID0gW107XG5cbiAgICBAcXVlcnkoJy5vdXRwdXQnKSBwcml2YXRlIG91dHB1dEVsPzogSFRNTEVsZW1lbnQ7XG4gICAgQHF1ZXJ5KCdpbnB1dCcpIHByaXZhdGUgaW5wdXRFbD86IEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fc2V0dXBMaXN0ZW5lcnMoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zZXR1cExpc3RlbmVycygpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Rlcm1pbmFsLW91dCcsIChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGlzdG9yeSA9IFsuLi50aGlzLmhpc3RvcnksIHsgdGV4dDogZS5kZXRhaWwsIHR5cGU6ICdvdXRwdXQnIH1dO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIG92ZXJyaWRlIHN0eWxlcyA9IGNzc2BcbiAgICAgICAgOmhvc3Qge1xuICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAudGVybWluYWwge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzAwMDtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDYwMHB4O1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAyMHB4IDUwcHggcmdiYSgwLDAsMCwwLjUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmhlYWRlciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWExYTFhO1xuICAgICAgICAgICAgcGFkZGluZzogOHB4IDE2cHg7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogMTJweDtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjMzMzO1xuICAgICAgICB9XG5cbiAgICAgICAgLmRvdHMgeyBkaXNwbGF5OiBmbGV4OyBnYXA6IDZweDsgfVxuICAgICAgICAuZG90IHsgd2lkdGg6IDEwcHg7IGhlaWdodDogMTBweDsgYm9yZGVyLXJhZGl1czogNTAlOyB9XG4gICAgICAgIC5kb3QucmVkIHsgYmFja2dyb3VuZDogI2ZmNWY1NjsgfVxuICAgICAgICAuZG90LnllbGxvdyB7IGJhY2tncm91bmQ6ICNmZmJkMmU7IH1cbiAgICAgICAgLmRvdC5ncmVlbiB7IGJhY2tncm91bmQ6ICMyN2M5M2Y7IH1cblxuICAgICAgICAudGl0bGUgeyBjb2xvcjogIzg4ODsgZm9udC1zaXplOiAwLjc1cmVtOyBmb250LWZhbWlseTogJ0pldEJyYWlucyBNb25vJywgbW9ub3NwYWNlOyB9XG5cbiAgICAgICAgLm91dHB1dCB7XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgICAgICBmb250LWZhbWlseTogJ0pldEJyYWlucyBNb25vJywgbW9ub3NwYWNlO1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjlyZW07XG4gICAgICAgICAgICBjb2xvcjogI2QxZDVkYjtcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxLjU7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gICAgICAgICAgICBzY3JvbGxiYXItd2lkdGg6IHRoaW47XG4gICAgICAgIH1cblxuICAgICAgICAub3V0cHV0Ojotd2Via2l0LXNjcm9sbGJhciB7IHdpZHRoOiA2cHg7IH1cbiAgICAgICAgLm91dHB1dDo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIgeyBiYWNrZ3JvdW5kOiAjMzMzOyB9XG5cbiAgICAgICAgLmxpbmUgeyBtYXJnaW4tYm90dG9tOiA0cHg7IH1cbiAgICAgICAgLmxpbmUuaW5wdXQgeyBjb2xvcjogIzgxOGNmODsgZm9udC13ZWlnaHQ6IGJvbGQ7IH1cbiAgICAgICAgLmxpbmUuZXJyb3IgeyBjb2xvcjogI2Y4NzE3MTsgfVxuXG4gICAgICAgIC5pbnB1dC1hcmVhIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgcGFkZGluZzogMC43NXJlbSAxcmVtO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzAwMDtcbiAgICAgICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCAjMWExYTFhO1xuICAgICAgICB9XG5cbiAgICAgICAgLnByb21wdCB7IGNvbG9yOiAjMTBiOTgxOyBtYXJnaW4tcmlnaHQ6IDEycHg7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XG5cbiAgICAgICAgaW5wdXQge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgICAgICAgICBmb250LXNpemU6IGluaGVyaXQ7XG4gICAgICAgIH1cbiAgICBgO1xuXG4gICAgcHJpdmF0ZSBhc3luYyBfaGFuZGxlS2V5KGU6IEtleWJvYXJkRXZlbnQpIHtcbiAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgICAgICBjb25zdCBjbWQgPSAoZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKCFjbWQpIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5oaXN0b3J5ID0gWy4uLnRoaXMuaGlzdG9yeSwgeyB0ZXh0OiBjbWQsIHR5cGU6ICdpbnB1dCcgfV07XG4gICAgICAgICAgICAoZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAnJztcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS92MS9leGVjdXRlJywge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgY29tbWFuZDogY21kIH0pXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEub3V0cHV0KSB0aGlzLmhpc3RvcnkgPSBbLi4udGhpcy5oaXN0b3J5LCB7IHRleHQ6IGRhdGEub3V0cHV0LCB0eXBlOiAnb3V0cHV0JyB9XTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5lcnJvcikgdGhpcy5oaXN0b3J5ID0gWy4uLnRoaXMuaGlzdG9yeSwgeyB0ZXh0OiBkYXRhLmVycm9yLCB0eXBlOiAnZXJyb3InIH1dO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpc3RvcnkgPSBbLi4udGhpcy5oaXN0b3J5LCB7IHRleHQ6ICdFeGVjdXRpb24gZmFpbGVkJywgdHlwZTogJ2Vycm9yJyB9XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3Njcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dEVsKSB0aGlzLm91dHB1dEVsLnNjcm9sbFRvcCA9IHRoaXMub3V0cHV0RWwuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICB9LCAwKTtcbiAgICB9XG5cbiAgICBvdmVycmlkZSB1cGRhdGVkKGNoYW5nZWQ6IFByb3BlcnR5VmFsdWVzKSB7XG4gICAgICAgIGlmIChjaGFuZ2VkLmhhcygnYWN0aXZlJykgJiYgdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRFbD8uZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGVybWluYWxcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkb3RzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZG90IHJlZFwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImRvdCB5ZWxsb3dcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkb3QgZ3JlZW5cIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlRTUE0gU0hFTEwg4oCUIEJVTjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvdXRwdXRcIj5cbiAgICAgICAgICAgICAgICAgICAgJHt0aGlzLmhpc3RvcnkubWFwKGxpbmUgPT4gaHRtbGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsaW5lICR7bGluZS50eXBlfVwiPiR7bGluZS50eXBlID09PSAnaW5wdXQnID8gJyQgJyA6ICcnfSR7bGluZS50ZXh0fTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW5wdXQtYXJlYVwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByb21wdFwiPuKenDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJUeXBlIGEgY29tbWFuZC4uLlwiIEBrZXlkb3duPVwiJHt0aGlzLl9oYW5kbGVLZXl9XCIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cbn1cblxuIiwKICAgICJpbXBvcnQgeyBMaXRFbGVtZW50LCBodG1sLCBjc3MgfSBmcm9tICdsaXQnO1xuaW1wb3J0IHsgY3VzdG9tRWxlbWVudCwgcHJvcGVydHksIHN0YXRlLCBxdWVyeSB9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcblxuQGN1c3RvbUVsZW1lbnQoJ3RzcG0tbG9ncycpXG5leHBvcnQgY2xhc3MgVHNwbUxvZ3MgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBAcHJvcGVydHkoeyB0eXBlOiBBcnJheSB9KSBwcm9jZXNzZXM6IGFueVtdID0gW107XG4gICAgQHByb3BlcnR5KHsgdHlwZTogU3RyaW5nIH0pIHNlbGVjdGVkUHJvY2VzcyA9ICdhbGwnO1xuICAgIEBzdGF0ZSgpIHByaXZhdGUgbG9nczogYW55W10gPSBbXTtcblxuICAgIEBxdWVyeSgnLm91dHB1dCcpIHByaXZhdGUgb3V0cHV0RWw/OiBIVE1MRWxlbWVudDtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9zZXR1cExpc3RlbmVycygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NldHVwTGlzdGVuZXJzKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmV3LWxvZycsIChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9ncyA9IFsuLi50aGlzLmxvZ3Muc2xpY2UoLTk5OSksIGUuZGV0YWlsXTtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBvdmVycmlkZSBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB9XG5cbiAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE1LCAxNSwgMjAsIDAuNik7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICAgICAgICAgIGhlaWdodDogNjAwcHg7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAuaGVhZGVyIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpO1xuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGVjdCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWExYTFhO1xuICAgICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjMzMzO1xuICAgICAgICAgICAgcGFkZGluZzogNnB4IDEycHg7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgICAgICAgICBmb250LWZhbWlseTogaW5oZXJpdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5vdXRwdXQge1xuICAgICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdKZXRCcmFpbnMgTW9ubycsIG1vbm9zcGFjZTtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMC44NXJlbTtcbiAgICAgICAgICAgIHNjcm9sbGJhci13aWR0aDogdGhpbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5vdXRwdXQ6Oi13ZWJraXQtc2Nyb2xsYmFyIHsgd2lkdGg6IDZweDsgfVxuICAgICAgICAub3V0cHV0Ojotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7IGJhY2tncm91bmQ6ICMzMzM7IH1cblxuICAgICAgICAubGluZSB7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiA0cHg7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnRpbWVzdGFtcCB7IGNvbG9yOiAjNjQ3NDhiOyBtaW4td2lkdGg6IDgwcHg7IH1cbiAgICAgICAgLnByb2MgeyBjb2xvcjogIzgxOGNmODsgZm9udC13ZWlnaHQ6IDYwMDsgbWluLXdpZHRoOiAxMDBweDsgfVxuICAgICAgICAubXNnIHsgY29sb3I6ICNlMmU4ZjA7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgd29yZC1icmVhazogYnJlYWstYWxsOyB9XG5cbiAgICAgICAgLmNvbnRyb2xzIHsgZGlzcGxheTogZmxleDsgZ2FwOiAxMHB4OyB9XG4gICAgICAgIC5idG4taWNvbiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICAgIGNvbG9yOiAjNjQ3NDhiO1xuICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgICAgcGFkZGluZzogNHB4O1xuICAgICAgICB9XG4gICAgICAgIC5idG4taWNvbjpob3ZlciB7IGNvbG9yOiAjZmZmOyB9XG4gICAgYDtcblxuICAgIHByaXZhdGUgX3Njcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBpZiAodGhpcy5vdXRwdXRFbCkge1xuICAgICAgICAgICAgdGhpcy5vdXRwdXRFbC5zY3JvbGxUb3AgPSB0aGlzLm91dHB1dEVsLnNjcm9sbEhlaWdodDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgZmlsdGVyZWRMb2dzID0gdGhpcy5zZWxlY3RlZFByb2Nlc3MgPT09ICdhbGwnIFxuICAgICAgICAgICAgPyB0aGlzLmxvZ3MgXG4gICAgICAgICAgICA6IHRoaXMubG9ncy5maWx0ZXIobCA9PiBsLnByb2Nlc3NOYW1lID09PSB0aGlzLnNlbGVjdGVkUHJvY2Vzcyk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IEBjaGFuZ2U9XCIkeyhlOiBhbnkpID0+IHRoaXMuc2VsZWN0ZWRQcm9jZXNzID0gZS50YXJnZXQudmFsdWV9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYWxsXCI+R2xvYmFsIExvZ3M8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7dGhpcy5wcm9jZXNzZXMubWFwKHAgPT4gaHRtbGA8b3B0aW9uIHZhbHVlPVwiJHtwLm5hbWV9XCIgP3NlbGVjdGVkPVwiJHt0aGlzLnNlbGVjdGVkUHJvY2VzcyA9PT0gcC5uYW1lfVwiPiR7cC5uYW1lfTwvb3B0aW9uPmApfVxuICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLWljb25cIiB0aXRsZT1cIkNsZWFyXCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLmxvZ3MgPSBbXX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cInRyYXNoLTJcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm91dHB1dFwiPlxuICAgICAgICAgICAgICAgICAgICAke2ZpbHRlcmVkTG9ncy5tYXAobG9nID0+IGh0bWxgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGluZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGltZXN0YW1wXCI+WyR7bmV3IERhdGUoKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJvY1wiPlske2xvZy5wcm9jZXNzTmFtZX1dPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXNnXCI+JHtsb2cubWVzc2FnZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgYCl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBvdmVycmlkZSB1cGRhdGVkKCkge1xuICAgICAgICBjb25zdCBsdWNpZGUgPSAod2luZG93IGFzIGFueSkubHVjaWRlO1xuICAgICAgICBpZiAobHVjaWRlKSB7XG4gICAgICAgICAgICBsdWNpZGUuY3JlYXRlSWNvbnMoe1xuICAgICAgICAgICAgICAgIGF0dHJzOiB7ICdzdHJva2Utd2lkdGgnOiAyLCAnY2xhc3MnOiAnbHVjaWRlLWljb24nIH0sXG4gICAgICAgICAgICAgICAgcm9vdDogdGhpcy5zaGFkb3dSb290XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuIiwKICAgICJpbXBvcnQgeyBMaXRFbGVtZW50LCBodG1sLCBjc3MgfSBmcm9tICdsaXQnO1xuaW1wb3J0IHsgY3VzdG9tRWxlbWVudCwgcHJvcGVydHkgfSBmcm9tICdsaXQvZGVjb3JhdG9ycy5qcyc7XG5cbkBjdXN0b21FbGVtZW50KCd0c3BtLW1vZGFsJylcbmV4cG9ydCBjbGFzcyBUc3BtTW9kYWwgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBAcHJvcGVydHkoeyB0eXBlOiBCb29sZWFuIH0pIGlzT3BlbiA9IGZhbHNlO1xuXG4gICAgb3BlbigpIHsgdGhpcy5pc09wZW4gPSB0cnVlOyB9XG4gICAgY2xvc2UoKSB7IHRoaXMuaXNPcGVuID0gZmFsc2U7IH1cblxuICAgIHN0YXRpYyBvdmVycmlkZSBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGNvbnRlbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgLm92ZXJsYXkge1xuICAgICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgICAgbGVmdDogMDtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjgpO1xuICAgICAgICAgICAgYmFja2Ryb3AtZmlsdGVyOiBibHVyKDhweCk7XG4gICAgICAgICAgICB6LWluZGV4OiAxMDAwO1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4zcyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLm92ZXJsYXkuYWN0aXZlIHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDE7XG4gICAgICAgICAgICBwb2ludGVyLWV2ZW50czogYXV0bztcbiAgICAgICAgfVxuXG4gICAgICAgIC5tb2RhbCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWExYTFlO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMjRweDtcbiAgICAgICAgICAgIHdpZHRoOiA1MDBweDtcbiAgICAgICAgICAgIG1heC13aWR0aDogOTAlO1xuICAgICAgICAgICAgcGFkZGluZzogMnJlbTtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC45KTtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIGN1YmljLWJlemllcigwLjM0LCAxLjU2LCAwLjY0LCAxKTtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgMjVweCA1MHB4IC0xMnB4IHJnYmEoMCwgMCwgMCwgMC41KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5hY3RpdmUgLm1vZGFsIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkZXIge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAycmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZGVyIGgyIHsgbWFyZ2luOiAwOyBmb250LXNpemU6IDEuNXJlbTsgY29sb3I6ICNmZmY7IH1cblxuICAgICAgICAuYnRuLWNsb3NlIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICBjb2xvcjogIzY0NzQ4YjtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMS41cmVtO1xuICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybSB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMS41cmVtOyB9XG5cbiAgICAgICAgLmZvcm0tZ3JvdXAgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDhweDsgfVxuICAgICAgICBsYWJlbCB7IGNvbG9yOiAjOTRhM2I4OyBmb250LXNpemU6IDAuOXJlbTsgZm9udC13ZWlnaHQ6IDUwMDsgfVxuXG4gICAgICAgIGlucHV0LCBzZWxlY3Qge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKTtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjc1cmVtIDFyZW07XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBpbmhlcml0O1xuICAgICAgICB9XG5cbiAgICAgICAgaW5wdXQ6Zm9jdXMgeyBib3JkZXItY29sb3I6ICM2MzY2ZjE7IG91dGxpbmU6IG5vbmU7IH1cblxuICAgICAgICAucm93IHsgZGlzcGxheTogZ3JpZDsgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyOyBnYXA6IDFyZW07IH1cblxuICAgICAgICBmb290ZXIge1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMi41cmVtO1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAuNzVyZW0gMS41cmVtO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcbiAgICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4tY2FuY2VsIHsgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7IGNvbG9yOiAjOTRhM2I4OyB9XG4gICAgICAgIC5idG4tcHJpbWFyeSB7IGJhY2tncm91bmQ6ICM2MzY2ZjE7IGNvbG9yOiB3aGl0ZTsgfVxuICAgICAgICAuYnRuLXByaW1hcnk6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjNGY0NmU1OyB9XG4gICAgYDtcblxuICAgIHByaXZhdGUgYXN5bmMgX2hhbmRsZVN1Ym1pdChlOiBTdWJtaXRFdmVudCkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGUudGFyZ2V0IGFzIEhUTUxGb3JtRWxlbWVudCk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IE9iamVjdC5mcm9tRW50cmllcyhmb3JtRGF0YS5lbnRyaWVzKCkpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS92MS9wcm9jZXNzZXNgLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoY29uZmlnKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICAgIGlmIChkYXRhLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgncHJvY2Vzcy1hZGRlZCcsIHsgYnViYmxlczogdHJ1ZSwgY29tcG9zZWQ6IHRydWUgfSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbGVydChkYXRhLmVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBhbGVydCgnRmFpbGVkIHRvIHNwYXduIHByb2Nlc3MnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwib3ZlcmxheSAke3RoaXMuaXNPcGVuID8gJ2FjdGl2ZScgOiAnJ31cIiBAY2xpY2s9XCIkeyhlOiBhbnkpID0+IGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnb3ZlcmxheScpICYmIHRoaXMuY2xvc2UoKX1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxcIj5cbiAgICAgICAgICAgICAgICAgICAgPGhlYWRlcj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5Qcm9jZXNzIENvbmZpZ3VyYXRpb248L2gyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1jbG9zZVwiIEBjbGljaz1cIiR7dGhpcy5jbG9zZX1cIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxuICAgICAgICAgICAgICAgICAgICA8Zm9ybSBAc3VibWl0PVwiJHt0aGlzLl9oYW5kbGVTdWJtaXR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5OYW1lPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwibmFtZVwiIHBsYWNlaG9sZGVyPVwibXktYXdlc29tZS1hcGlcIiByZXF1aXJlZCAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlNjcmlwdCBQYXRoPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cInNjcmlwdFwiIHBsYWNlaG9sZGVyPVwiLi9zcmMvaW5kZXgudHNcIiByZXF1aXJlZCAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5JbnRlcnByZXRlcjwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgbmFtZT1cImludGVycHJldGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYnVuXCI+QnVuPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibm9kZVwiPk5vZGU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+SW5zdGFuY2VzPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBuYW1lPVwiaW5zdGFuY2VzXCIgdmFsdWU9XCIxXCIgbWluPVwiMVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPk5hbWVzcGFjZTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJuYW1lc3BhY2VcIiBwbGFjZWhvbGRlcj1cInByb2R1Y3Rpb25cIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1jYW5jZWxcIiBAY2xpY2s9XCIke3RoaXMuY2xvc2V9XCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnlcIj5TcGF3biBJbnN0YW5jZTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XG4gICAgICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cbn1cblxuIiwKICAgICJpbXBvcnQgeyBMaXRFbGVtZW50LCBodG1sLCBjc3MgfSBmcm9tICdsaXQnO1xuaW1wb3J0IHsgY3VzdG9tRWxlbWVudCwgcHJvcGVydHksIHN0YXRlLCBxdWVyeSB9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcblxuQGN1c3RvbUVsZW1lbnQoJ3RzcG0tYXBwJylcbmV4cG9ydCBjbGFzcyBUc3BtQXBwIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgQHN0YXRlKCkgY3VycmVudFZpZXcgPSAnZGFzaGJvYXJkJztcbiAgICBAc3RhdGUoKSBwcm9jZXNzZXM6IGFueVtdID0gW107XG4gICAgQHN0YXRlKCkgc3lzdGVtU3RhdHMgPSB7IGNwdTogMCwgbWVtb3J5OiAwLCB1cHRpbWU6IDAgfTtcbiAgICBAc3RhdGUoKSBpc09ubGluZSA9IGZhbHNlO1xuICAgIFxuICAgIHByaXZhdGUgc29ja2V0PzogV2ViU29ja2V0O1xuXG4gICAgQHF1ZXJ5KCd0c3BtLW1vZGFsJykgbW9kYWw6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNvbm5lY3QoKTtcblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3ZpZXctbG9ncycsIChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFZpZXcgPSAnbG9ncyc7XG4gICAgICAgICAgICAvLyBXYWl0IGZvciB1cGRhdGUgdGhlbiBzZXQgdGhlIHNlbGVjdGVkIHByb2Nlc3NcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29tcGxldGUudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbG9nc0NvbXAgPSB0aGlzLnNoYWRvd1Jvb3Q/LnF1ZXJ5U2VsZWN0b3IoJ3RzcG0tbG9ncycpIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAobG9nc0NvbXApIGxvZ3NDb21wLnNlbGVjdGVkUHJvY2VzcyA9IGUuZGV0YWlsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigncmVmcmVzaC1yZXF1aXJlZCcsICgpID0+IHRoaXMuZmV0Y2hEYXRhKCkpO1xuICAgIH1cblxuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIGNvbnN0IHByb3RvY29sID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyA/ICd3c3M6JyA6ICd3czonO1xuICAgICAgICBjb25zdCBob3N0ID0gd2luZG93LmxvY2F0aW9uLmhvc3Q7XG4gICAgICAgIHRoaXMuc29ja2V0ID0gbmV3IFdlYlNvY2tldChgJHtwcm90b2NvbH0vLyR7aG9zdH0vd3NgKTtcblxuICAgICAgICB0aGlzLnNvY2tldC5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQ29ubmVjdGVkIHRvIFRTUE0gTm9kZScpO1xuICAgICAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmZldGNoRGF0YSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc29ja2V0Lm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZVVwZGF0ZShkYXRhKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Rpc2Nvbm5lY3RlZCBmcm9tIFRTUE0gTm9kZScpO1xuICAgICAgICAgICAgdGhpcy5pc09ubGluZSA9IGZhbHNlO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNvbm5lY3QoKSwgMzAwMCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaGFuZGxlVXBkYXRlKGRhdGE6IGFueSkge1xuICAgICAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAncHJvY2Vzczp1cGRhdGUnOlxuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc2VzID0gZGF0YS5wYXlsb2FkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncHJvY2Vzczpsb2cnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ25ldy1sb2cnLCB7IGRldGFpbDogZGF0YS5wYXlsb2FkLCBidWJibGVzOiB0cnVlLCBjb21wb3NlZDogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0ZXJtaW5hbDpvdXQnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3Rlcm1pbmFsLW91dCcsIHsgZGV0YWlsOiBkYXRhLnBheWxvYWQsIGJ1YmJsZXM6IHRydWUsIGNvbXBvc2VkOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3N5c3RlbTpzdGF0cyc6XG4gICAgICAgICAgICAgICAgdGhpcy5zeXN0ZW1TdGF0cyA9IGRhdGEucGF5bG9hZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRGF0YSgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3YxL3N0YXR1cycpO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzZXMgPSBkYXRhLmRhdGEucHJvY2Vzc2VzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBkYXRhJywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBvdmVycmlkZSBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDI2MHB4IDFmcjtcbiAgICAgICAgICAgIGhlaWdodDogMTAwdmg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMGEwYTBjO1xuICAgICAgICAgICAgY29sb3I6ICNlMmU4ZjA7XG4gICAgICAgICAgICBmb250LWZhbWlseTogJ091dGZpdCcsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDc2OHB4KSB7XG4gICAgICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiA4MHB4IDFmcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC5tYWluLWNvbnRlbnQge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KGNpcmNsZSBhdCB0b3AgcmlnaHQsICMxYTFhMmUgMCUsICMwYTBhMGMgMTAwJSk7XG4gICAgICAgIH1cblxuICAgICAgICAudmlldy1jb250YWluZXIge1xuICAgICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDJyZW07XG4gICAgICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICAgICAgc2Nyb2xsYmFyLXdpZHRoOiB0aGluO1xuICAgICAgICAgICAgc2Nyb2xsYmFyLWNvbG9yOiAjMzM0MTU1IHRyYW5zcGFyZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLnZpZXctY29udGFpbmVyOjotd2Via2l0LXNjcm9sbGJhciB7XG4gICAgICAgICAgICB3aWR0aDogNnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnZpZXctY29udGFpbmVyOjotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzM0MTU1O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC52aWV3IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgICBhbmltYXRpb246IGZhZGVJbiAwLjRzIGVhc2Utb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgLnZpZXcuYWN0aXZlIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICB9XG5cbiAgICAgICAgQGtleWZyYW1lcyBmYWRlSW4ge1xuICAgICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgxMHB4KTsgfVxuICAgICAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCk7IH1cbiAgICAgICAgfVxuICAgIGA7XG5cbiAgICBvdmVycmlkZSByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBodG1sYFxuICAgICAgICAgICAgPHRzcG0tc2lkZWJhciBcbiAgICAgICAgICAgICAgICAuY3VycmVudFZpZXc9XCIke3RoaXMuY3VycmVudFZpZXd9XCIgXG4gICAgICAgICAgICAgICAgLmlzT25saW5lPVwiJHt0aGlzLmlzT25saW5lfVwiXG4gICAgICAgICAgICAgICAgQHZpZXctY2hhbmdlPVwiJHsoZTogYW55KSA9PiB0aGlzLmN1cnJlbnRWaWV3ID0gZS5kZXRhaWx9XCJcbiAgICAgICAgICAgID48L3RzcG0tc2lkZWJhcj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPG1haW4gY2xhc3M9XCJtYWluLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8dHNwbS10b3BiYXIgXG4gICAgICAgICAgICAgICAgICAgIEByZWZyZXNoPVwiJHt0aGlzLmZldGNoRGF0YX1cIlxuICAgICAgICAgICAgICAgICAgICBAb3Blbi1tb2RhbD1cIiR7KCkgPT4gdGhpcy5tb2RhbC5vcGVuKCl9XCJcbiAgICAgICAgICAgICAgICA+PC90c3BtLXRvcGJhcj5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidmlldy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRzcG0tZGFzaGJvYXJkIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ2aWV3ICR7dGhpcy5jdXJyZW50VmlldyA9PT0gJ2Rhc2hib2FyZCcgPyAnYWN0aXZlJyA6ICcnfVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAucHJvY2Vzc2VzPVwiJHt0aGlzLnByb2Nlc3Nlc31cIlxuICAgICAgICAgICAgICAgICAgICAgICAgLnN0YXRzPVwiJHt0aGlzLnN5c3RlbVN0YXRzfVwiXG4gICAgICAgICAgICAgICAgICAgID48L3RzcG0tZGFzaGJvYXJkPlxuXG4gICAgICAgICAgICAgICAgICAgIDx0c3BtLXByb2Nlc3MtdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidmlldyAke3RoaXMuY3VycmVudFZpZXcgPT09ICdwcm9jZXNzZXMnID8gJ2FjdGl2ZScgOiAnJ31cIlxuICAgICAgICAgICAgICAgICAgICAgICAgLnByb2Nlc3Nlcz1cIiR7dGhpcy5wcm9jZXNzZXN9XCJcbiAgICAgICAgICAgICAgICAgICAgPjwvdHNwbS1wcm9jZXNzLXRhYmxlPlxuXG4gICAgICAgICAgICAgICAgICAgIDx0c3BtLXRlcm1pbmFsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInZpZXcgJHt0aGlzLmN1cnJlbnRWaWV3ID09PSAndGVybWluYWwnID8gJ2FjdGl2ZScgOiAnJ31cIlxuICAgICAgICAgICAgICAgICAgICAgICAgP2FjdGl2ZT1cIiR7dGhpcy5jdXJyZW50VmlldyA9PT0gJ3Rlcm1pbmFsJ31cIlxuICAgICAgICAgICAgICAgICAgICA+PC90c3BtLXRlcm1pbmFsPlxuXG4gICAgICAgICAgICAgICAgICAgIDx0c3BtLWxvZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidmlldyAke3RoaXMuY3VycmVudFZpZXcgPT09ICdsb2dzJyA/ICdhY3RpdmUnIDogJyd9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wcm9jZXNzZXM9XCIke3RoaXMucHJvY2Vzc2VzfVwiXG4gICAgICAgICAgICAgICAgICAgID48L3RzcG0tbG9ncz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvbWFpbj5cblxuICAgICAgICAgICAgPHRzcG0tbW9kYWwgQHByb2Nlc3MtYWRkZWQ9XCIke3RoaXMuZmV0Y2hEYXRhfVwiPjwvdHNwbS1tb2RhbD5cbiAgICAgICAgYDtcbiAgICB9XG59XG5cbiIsCiAgICAiLy8gSW1wb3J0IExpdCBDb21wb25lbnRzXG5pbXBvcnQgJy4vY29tcG9uZW50cy90c3BtLXNpZGViYXIudHMnO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvdHNwbS10b3BiYXIudHMnO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvdHNwbS1kYXNoYm9hcmQudHMnO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvdHNwbS1wcm9jZXNzLWNhcmQudHMnO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvdHNwbS1wcm9jZXNzLXRhYmxlLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tdGVybWluYWwudHMnO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvdHNwbS1sb2dzLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tbW9kYWwudHMnO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvdHNwbS1hcHAudHMnO1xuXG5jb25zb2xlLmxvZygnVFNQTSBXZWIgQ29tcG9uZW50cyBMb2FkZWQnKTtcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLQSxJQUFNLFlBQVk7QUFFbEIsSUFBTSxTQUFTO0FBSVIsSUFBTSw4QkFBOEIsT0FBTyxlQUM3QyxPQUFPLGFBQWEsYUFBYSxPQUFPLFNBQVMsaUJBQ2xELHdCQUF3QixTQUFTLGFBQ2pDLGFBQWEsY0FBYztBQUMvQixJQUFNLG9CQUFvQixPQUFPO0FBQ2pDLElBQU0sY0FBYyxJQUFJO0FBQUE7QUFRakIsTUFBTSxVQUFVO0FBQUEsRUFDbkIsV0FBVyxDQUFDLFNBQVMsU0FBUyxXQUFXO0FBQUEsSUFFckMsS0FBSyxrQkFBa0I7QUFBQSxJQUN2QixJQUFJLGNBQWMsbUJBQW1CO0FBQUEsTUFDakMsTUFBTSxJQUFJLE1BQU0sbUVBQW1FO0FBQUEsSUFDdkY7QUFBQSxJQUNBLEtBQUssVUFBVTtBQUFBLElBQ2YsS0FBSyxXQUFXO0FBQUE7QUFBQSxNQUloQixVQUFVLEdBQUc7QUFBQSxJQUdiLElBQUksYUFBYSxLQUFLO0FBQUEsSUFDdEIsTUFBTSxVQUFVLEtBQUs7QUFBQSxJQUNyQixJQUFJLCtCQUErQixlQUFlLFdBQVc7QUFBQSxNQUN6RCxNQUFNLFlBQVksWUFBWSxhQUFhLFFBQVEsV0FBVztBQUFBLE1BQzlELElBQUksV0FBVztBQUFBLFFBQ1gsYUFBYSxZQUFZLElBQUksT0FBTztBQUFBLE1BQ3hDO0FBQUEsTUFDQSxJQUFJLGVBQWUsV0FBVztBQUFBLFNBQ3pCLEtBQUssY0FBYyxhQUFhLElBQUksZUFBaUIsWUFBWSxLQUFLLE9BQU87QUFBQSxRQUM5RSxJQUFJLFdBQVc7QUFBQSxVQUNYLFlBQVksSUFBSSxTQUFTLFVBQVU7QUFBQSxRQUN2QztBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxF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c0NBSUwsS0FBSyxnQkFBZ0IsYUFBYSxXQUFXO0FBQUEsbUNBQ2hELEtBQUssZ0JBQWdCO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0NBSWxCLEtBQUssZ0JBQWdCLFNBQVMsV0FBVztBQUFBLHNDQUN6QyxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSwwQ0FLRCxLQUFLO0FBQUE7QUFBQTtBQUcvQztBQTlLYTtBQUFBLEVBQVIsTUFBTTtBQUFBLEVBQUU7QUFBQSxHQURBLFFBQ0E7QUFDQTtBQUFBLEVBQVIsTUFBTTtBQUFBLEVBQUU7QUFBQSxHQUZBLFFBRUE7QUFDQTtBQUFBLEVBQVIsTUFBTTtBQUFBLEVBQUU7QUFBQSxHQUhBLFFBR0E7QUFDQTtBQUFBLEVBQVIsTUFBTTtBQUFBLEVBQUU7QUFBQSxHQUpBLFFBSUE7QUFJWTtBQUFBLEVBQXBCLE1BQU0sWUFBWTtBQUFBLEVBQUU7QUFBQSxHQVJaLFFBUVk7QUFSWixVQUFOO0FBQUEsRUFETixjQUFjLFVBQVU7QUFBQSxFQUNsQjtBQUFBLEdBQU07OztBQ09iLFFBQVEsSUFBSSw0QkFBNEI7IiwKICAiZGVidWdJZCI6ICJCNjE2N0Y0NEU3REM0REQ1NjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
