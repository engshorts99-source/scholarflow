var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-Dgyovm/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-Dgyovm/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// .wrangler/tmp/pages-aKl6SH/bundledWorker-0.1189841807359504.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
import("node:buffer").then(({ Buffer: Buffer2 }) => {
  globalThis.Buffer = Buffer2;
}).catch(() => null);
var __ALSes_PROMISE__ = import("node:async_hooks").then(({ AsyncLocalStorage }) => {
  globalThis.AsyncLocalStorage = AsyncLocalStorage;
  const envAsyncLocalStorage = new AsyncLocalStorage();
  const requestContextAsyncLocalStorage = new AsyncLocalStorage();
  globalThis.process = {
    env: new Proxy(
      {},
      {
        ownKeys: () => Reflect.ownKeys(envAsyncLocalStorage.getStore()),
        getOwnPropertyDescriptor: (_2, ...args) => Reflect.getOwnPropertyDescriptor(envAsyncLocalStorage.getStore(), ...args),
        get: (_2, property) => Reflect.get(envAsyncLocalStorage.getStore(), property),
        set: (_2, property, value) => Reflect.set(envAsyncLocalStorage.getStore(), property, value)
      }
    )
  };
  globalThis[Symbol.for("__cloudflare-request-context__")] = new Proxy(
    {},
    {
      ownKeys: () => Reflect.ownKeys(requestContextAsyncLocalStorage.getStore()),
      getOwnPropertyDescriptor: (_2, ...args) => Reflect.getOwnPropertyDescriptor(requestContextAsyncLocalStorage.getStore(), ...args),
      get: (_2, property) => Reflect.get(requestContextAsyncLocalStorage.getStore(), property),
      set: (_2, property, value) => Reflect.set(requestContextAsyncLocalStorage.getStore(), property, value)
    }
  );
  return { envAsyncLocalStorage, requestContextAsyncLocalStorage };
}).catch(() => null);
var se = Object.create;
var H = Object.defineProperty;
var ae = Object.getOwnPropertyDescriptor;
var ne = Object.getOwnPropertyNames;
var re = Object.getPrototypeOf;
var ie = Object.prototype.hasOwnProperty;
var j = /* @__PURE__ */ __name2((e, t) => () => (e && (t = e(e = 0)), t), "j");
var N = /* @__PURE__ */ __name2((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "N");
var oe = /* @__PURE__ */ __name2((e, t, a, s) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let r of ne(t))
      !ie.call(e, r) && r !== a && H(e, r, { get: () => t[r], enumerable: !(s = ae(t, r)) || s.enumerable });
  return e;
}, "oe");
var V = /* @__PURE__ */ __name2((e, t, a) => (a = e != null ? se(re(e)) : {}, oe(t || !e || !e.__esModule ? H(a, "default", { value: e, enumerable: true }) : a, e)), "V");
var g;
var u = j(() => {
  g = { collectedLocales: [] };
});
var f;
var l = j(() => {
  f = { version: 3, routes: { none: [{ src: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$", headers: { Location: "/$1" }, status: 308, continue: true }, { src: "^/_next/__private/trace$", dest: "/404", status: 404, continue: true }, { src: "^/404/?$", status: 404, continue: true, missing: [{ type: "header", key: "x-prerender-revalidate" }] }, { src: "^/500$", status: 500, continue: true }, { src: "^/?$", has: [{ type: "header", key: "rsc", value: "1" }], dest: "/index.rsc", headers: { vary: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url" }, continue: true, override: true }, { src: "^/((?!.+\\.rsc).+?)(?:/)?$", has: [{ type: "header", key: "rsc", value: "1" }], dest: "/$1.rsc", headers: { vary: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url" }, continue: true, override: true }], filesystem: [{ src: "^/index(\\.action|\\.rsc)$", dest: "/", continue: true }, { src: "^/_next/data/(.*)$", dest: "/_next/data/$1", check: true }, { src: "^/\\.prefetch\\.rsc$", dest: "/__index.prefetch.rsc", check: true }, { src: "^/(.+)/\\.prefetch\\.rsc$", dest: "/$1.prefetch.rsc", check: true }, { src: "^/\\.rsc$", dest: "/index.rsc", check: true }, { src: "^/(.+)/\\.rsc$", dest: "/$1.rsc", check: true }], miss: [{ src: "^/_next/static/.+$", status: 404, check: true, dest: "/_next/static/not-found.txt", headers: { "content-type": "text/plain; charset=utf-8" } }], rewrite: [{ src: "^/_next/data/(.*)$", dest: "/404", status: 404 }, { src: "^/author/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/author/[id].rsc?nxtPid=$nxtPid" }, { src: "^/author/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/author/[id]?nxtPid=$nxtPid" }, { src: "^/journal/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/journal/[id].rsc?nxtPid=$nxtPid" }, { src: "^/journal/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/journal/[id]?nxtPid=$nxtPid" }, { src: "^/paper/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/paper/[id].rsc?nxtPid=$nxtPid" }, { src: "^/paper/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/paper/[id]?nxtPid=$nxtPid" }], resource: [{ src: "^/.*$", status: 404 }], hit: [{ src: "^/_next/static/(?:[^/]+/pages|pages|chunks|runtime|css|image|media|arStj8bYWiU\\-U3OSbctj6)/.+$", headers: { "cache-control": "public,max-age=31536000,immutable" }, continue: true, important: true }, { src: "^/index(?:/)?$", headers: { "x-matched-path": "/" }, continue: true, important: true }, { src: "^/((?!index$).*?)(?:/)?$", headers: { "x-matched-path": "/$1" }, continue: true, important: true }], error: [{ src: "^/.*$", dest: "/404", status: 404, headers: { "x-next-error-status": "404" } }, { src: "^/.*$", dest: "/500", status: 500, headers: { "x-next-error-status": "500" } }] }, images: { domains: [], sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840, 16, 32, 48, 64, 96, 128, 256, 384], remotePatterns: [], minimumCacheTTL: 60, formats: ["image/webp"], dangerouslyAllowSVG: false, contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;", contentDispositionType: "inline" }, overrides: { "404.html": { path: "404", contentType: "text/html; charset=utf-8" }, "500.html": { path: "500", contentType: "text/html; charset=utf-8" }, "_app.rsc.json": { path: "_app.rsc", contentType: "application/json" }, "_error.rsc.json": { path: "_error.rsc", contentType: "application/json" }, "_document.rsc.json": { path: "_document.rsc", contentType: "application/json" }, "404.rsc.json": { path: "404.rsc", contentType: "application/json" }, "_next/static/not-found.txt": { contentType: "text/plain" } }, framework: { slug: "nextjs", version: "13.5.6" }, crons: [] };
});
var m;
var d = j(() => {
  m = { "/404.html": { type: "override", path: "/404.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/404.rsc.json": { type: "override", path: "/404.rsc.json", headers: { "content-type": "application/json" } }, "/500.html": { type: "override", path: "/500.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/_app.rsc.json": { type: "override", path: "/_app.rsc.json", headers: { "content-type": "application/json" } }, "/_document.rsc.json": { type: "override", path: "/_document.rsc.json", headers: { "content-type": "application/json" } }, "/_error.rsc.json": { type: "override", path: "/_error.rsc.json", headers: { "content-type": "application/json" } }, "/_next/static/arStj8bYWiU-U3OSbctj6/_buildManifest.js": { type: "static" }, "/_next/static/arStj8bYWiU-U3OSbctj6/_ssgManifest.js": { type: "static" }, "/_next/static/chunks/158-9815a95813232387.js": { type: "static" }, "/_next/static/chunks/320-f286eeaec257031a.js": { type: "static" }, "/_next/static/chunks/37-038493e98abc9e77.js": { type: "static" }, "/_next/static/chunks/559-025a251b7f6fd20d.js": { type: "static" }, "/_next/static/chunks/app/_not-found-cd77019088209d1d.js": { type: "static" }, "/_next/static/chunks/app/about/page-62ca30c989a5d375.js": { type: "static" }, "/_next/static/chunks/app/author/[id]/page-cfe23ec871fb4fa1.js": { type: "static" }, "/_next/static/chunks/app/author/layout-673439f662252e17.js": { type: "static" }, "/_next/static/chunks/app/journal/[id]/page-2779c76d9b966558.js": { type: "static" }, "/_next/static/chunks/app/journal/layout-fb91a02605d634aa.js": { type: "static" }, "/_next/static/chunks/app/layout-549325e710e04d57.js": { type: "static" }, "/_next/static/chunks/app/page-295c12ed04965331.js": { type: "static" }, "/_next/static/chunks/app/paper/[id]/page-f4f3051eec0595ab.js": { type: "static" }, "/_next/static/chunks/app/paper/layout-129a1fc9bd45b46b.js": { type: "static" }, "/_next/static/chunks/app/search/page-fd6ebea59709dd8e.js": { type: "static" }, "/_next/static/chunks/app/trending/page-caba2c70eca6e0a1.js": { type: "static" }, "/_next/static/chunks/fd9d1056-67476b28fd9e69f2.js": { type: "static" }, "/_next/static/chunks/framework-c5181c9431ddc45b.js": { type: "static" }, "/_next/static/chunks/main-app-47000f50c75afba7.js": { type: "static" }, "/_next/static/chunks/main-d7692cefb05397f3.js": { type: "static" }, "/_next/static/chunks/pages/_app-1534f180665c857f.js": { type: "static" }, "/_next/static/chunks/pages/_error-b646007f40c4f0a8.js": { type: "static" }, "/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js": { type: "static" }, "/_next/static/chunks/webpack-fe2d7f101b9d16ba.js": { type: "static" }, "/_next/static/css/7c238094b37c7318.css": { type: "static" }, "/_next/static/media/19cfc7226ec3afaa-s.woff2": { type: "static" }, "/_next/static/media/21350d82a1f187e9-s.woff2": { type: "static" }, "/_next/static/media/36966cca54120369-s.p.woff2": { type: "static" }, "/_next/static/media/8e9860b6e62d6359-s.woff2": { type: "static" }, "/_next/static/media/b7387a63dd068245-s.woff2": { type: "static" }, "/_next/static/media/ba9851c3c22cd980-s.woff2": { type: "static" }, "/_next/static/media/c5fe6dc8356a8c31-s.woff2": { type: "static" }, "/_next/static/media/df0a9ae256c0569c-s.woff2": { type: "static" }, "/_next/static/media/e1aab0933260df4d-s.woff2": { type: "static" }, "/_next/static/media/e4af272ccee01ff0-s.p.woff2": { type: "static" }, "/_next/static/not-found.txt": { type: "override", path: "/_next/static/not-found.txt", headers: { "content-type": "text/plain" } }, "/ads.txt": { type: "static" }, "/favicon.ico": { type: "static" }, "/about": { type: "function", entrypoint: "__next-on-pages-dist__/functions/about.func.js" }, "/about.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/about.func.js" }, "/author/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/author/[id].func.js" }, "/author/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/author/[id].func.js" }, "/index": { type: "function", entrypoint: "__next-on-pages-dist__/functions/index.func.js" }, "/": { type: "override", path: "/_next/static/not-found.txt", headers: { "content-type": "text/plain" } }, "/index.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/index.func.js" }, "/journal/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/journal/[id].func.js" }, "/journal/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/journal/[id].func.js" }, "/paper/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/paper/[id].func.js" }, "/paper/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/paper/[id].func.js" }, "/robots.txt": { type: "function", entrypoint: "__next-on-pages-dist__/functions/robots.txt.func.js" }, "/robots.txt.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/robots.txt.func.js" }, "/search": { type: "function", entrypoint: "__next-on-pages-dist__/functions/search.func.js" }, "/search.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/search.func.js" }, "/sitemap.xml": { type: "function", entrypoint: "__next-on-pages-dist__/functions/sitemap.xml.func.js" }, "/sitemap.xml.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/sitemap.xml.func.js" }, "/trending": { type: "function", entrypoint: "__next-on-pages-dist__/functions/trending.func.js" }, "/trending.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/trending.func.js" }, "/404": { type: "override", path: "/404.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/500": { type: "override", path: "/500.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/_app.rsc": { type: "override", path: "/_app.rsc.json", headers: { "content-type": "application/json" } }, "/_error.rsc": { type: "override", path: "/_error.rsc.json", headers: { "content-type": "application/json" } }, "/_document.rsc": { type: "override", path: "/_document.rsc.json", headers: { "content-type": "application/json" } }, "/404.rsc": { type: "override", path: "/404.rsc.json", headers: { "content-type": "application/json" } } };
});
var F = N((Ge, $) => {
  "use strict";
  u();
  l();
  d();
  function w(e, t) {
    e = String(e || "").trim();
    let a = e, s, r = "";
    if (/^[^a-zA-Z\\\s]/.test(e)) {
      s = e[0];
      let o = e.lastIndexOf(s);
      r += e.substring(o + 1), e = e.substring(1, o);
    }
    let n = 0;
    return e = le(e, (o) => {
      if (/^\(\?[P<']/.test(o)) {
        let c = /^\(\?P?[<']([^>']+)[>']/.exec(o);
        if (!c)
          throw new Error(`Failed to extract named captures from ${JSON.stringify(o)}`);
        let p = o.substring(c[0].length, o.length - 1);
        return t && (t[n] = c[1]), n++, `(${p})`;
      }
      return o.substring(0, 3) === "(?:" || n++, o;
    }), e = e.replace(/\[:([^:]+):\]/g, (o, c) => w.characterClasses[c] || o), new w.PCRE(e, r, a, r, s);
  }
  __name(w, "w");
  __name2(w, "w");
  function le(e, t) {
    let a = 0, s = 0, r = false;
    for (let i = 0; i < e.length; i++) {
      let n = e[i];
      if (r) {
        r = false;
        continue;
      }
      switch (n) {
        case "(":
          s === 0 && (a = i), s++;
          break;
        case ")":
          if (s > 0 && (s--, s === 0)) {
            let o = i + 1, c = a === 0 ? "" : e.substring(0, a), p = e.substring(o), h = String(t(e.substring(a, o)));
            e = c + h + p, i = a;
          }
          break;
        case "\\":
          r = true;
          break;
        default:
          break;
      }
    }
    return e;
  }
  __name(le, "le");
  __name2(le, "le");
  (function(e) {
    class t extends RegExp {
      constructor(s, r, i, n, o) {
        super(s, r), this.pcrePattern = i, this.pcreFlags = n, this.delimiter = o;
      }
    }
    __name(t, "t");
    __name2(t, "t");
    e.PCRE = t, e.characterClasses = { alnum: "[A-Za-z0-9]", word: "[A-Za-z0-9_]", alpha: "[A-Za-z]", blank: "[ \\t]", cntrl: "[\\x00-\\x1F\\x7F]", digit: "\\d", graph: "[\\x21-\\x7E]", lower: "[a-z]", print: "[\\x20-\\x7E]", punct: "[\\]\\[!\"#$%&'()*+,./:;<=>?@\\\\^_`{|}~-]", space: "\\s", upper: "[A-Z]", xdigit: "[A-Fa-f0-9]" };
  })(w || (w = {}));
  w.prototype = w.PCRE.prototype;
  $.exports = w;
});
var X = N((U) => {
  "use strict";
  u();
  l();
  d();
  U.parse = be;
  U.serialize = Pe;
  var Re = Object.prototype.toString, E = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
  function be(e, t) {
    if (typeof e != "string")
      throw new TypeError("argument str must be a string");
    for (var a = {}, s = t || {}, r = s.decode || ve, i = 0; i < e.length; ) {
      var n = e.indexOf("=", i);
      if (n === -1)
        break;
      var o = e.indexOf(";", i);
      if (o === -1)
        o = e.length;
      else if (o < n) {
        i = e.lastIndexOf(";", n - 1) + 1;
        continue;
      }
      var c = e.slice(i, n).trim();
      if (a[c] === void 0) {
        var p = e.slice(n + 1, o).trim();
        p.charCodeAt(0) === 34 && (p = p.slice(1, -1)), a[c] = ke(p, r);
      }
      i = o + 1;
    }
    return a;
  }
  __name(be, "be");
  __name2(be, "be");
  function Pe(e, t, a) {
    var s = a || {}, r = s.encode || Se;
    if (typeof r != "function")
      throw new TypeError("option encode is invalid");
    if (!E.test(e))
      throw new TypeError("argument name is invalid");
    var i = r(t);
    if (i && !E.test(i))
      throw new TypeError("argument val is invalid");
    var n = e + "=" + i;
    if (s.maxAge != null) {
      var o = s.maxAge - 0;
      if (isNaN(o) || !isFinite(o))
        throw new TypeError("option maxAge is invalid");
      n += "; Max-Age=" + Math.floor(o);
    }
    if (s.domain) {
      if (!E.test(s.domain))
        throw new TypeError("option domain is invalid");
      n += "; Domain=" + s.domain;
    }
    if (s.path) {
      if (!E.test(s.path))
        throw new TypeError("option path is invalid");
      n += "; Path=" + s.path;
    }
    if (s.expires) {
      var c = s.expires;
      if (!Ce(c) || isNaN(c.valueOf()))
        throw new TypeError("option expires is invalid");
      n += "; Expires=" + c.toUTCString();
    }
    if (s.httpOnly && (n += "; HttpOnly"), s.secure && (n += "; Secure"), s.priority) {
      var p = typeof s.priority == "string" ? s.priority.toLowerCase() : s.priority;
      switch (p) {
        case "low":
          n += "; Priority=Low";
          break;
        case "medium":
          n += "; Priority=Medium";
          break;
        case "high":
          n += "; Priority=High";
          break;
        default:
          throw new TypeError("option priority is invalid");
      }
    }
    if (s.sameSite) {
      var h = typeof s.sameSite == "string" ? s.sameSite.toLowerCase() : s.sameSite;
      switch (h) {
        case true:
          n += "; SameSite=Strict";
          break;
        case "lax":
          n += "; SameSite=Lax";
          break;
        case "strict":
          n += "; SameSite=Strict";
          break;
        case "none":
          n += "; SameSite=None";
          break;
        default:
          throw new TypeError("option sameSite is invalid");
      }
    }
    return n;
  }
  __name(Pe, "Pe");
  __name2(Pe, "Pe");
  function ve(e) {
    return e.indexOf("%") !== -1 ? decodeURIComponent(e) : e;
  }
  __name(ve, "ve");
  __name2(ve, "ve");
  function Se(e) {
    return encodeURIComponent(e);
  }
  __name(Se, "Se");
  __name2(Se, "Se");
  function Ce(e) {
    return Re.call(e) === "[object Date]" || e instanceof Date;
  }
  __name(Ce, "Ce");
  __name2(Ce, "Ce");
  function ke(e, t) {
    try {
      return t(e);
    } catch {
      return e;
    }
  }
  __name(ke, "ke");
  __name2(ke, "ke");
});
u();
l();
d();
u();
l();
d();
u();
l();
d();
var b = "INTERNAL_SUSPENSE_CACHE_HOSTNAME.local";
u();
l();
d();
u();
l();
d();
u();
l();
d();
u();
l();
d();
var q = V(F());
function C(e, t, a) {
  if (t == null)
    return { match: null, captureGroupKeys: [] };
  let s = a ? "" : "i", r = [];
  return { match: (0, q.default)(`%${e}%${s}`, r).exec(t), captureGroupKeys: r };
}
__name(C, "C");
__name2(C, "C");
function P(e, t, a, { namedOnly: s } = {}) {
  return e.replace(/\$([a-zA-Z0-9_]+)/g, (r, i) => {
    let n = a.indexOf(i);
    return s && n === -1 ? r : (n === -1 ? t[parseInt(i, 10)] : t[n + 1]) || "";
  });
}
__name(P, "P");
__name2(P, "P");
function I(e, { url: t, cookies: a, headers: s, routeDest: r }) {
  switch (e.type) {
    case "host":
      return { valid: t.hostname === e.value };
    case "header":
      return e.value !== void 0 ? T(e.value, s.get(e.key), r) : { valid: s.has(e.key) };
    case "cookie": {
      let i = a[e.key];
      return i && e.value !== void 0 ? T(e.value, i, r) : { valid: i !== void 0 };
    }
    case "query":
      return e.value !== void 0 ? T(e.value, t.searchParams.get(e.key), r) : { valid: t.searchParams.has(e.key) };
  }
}
__name(I, "I");
__name2(I, "I");
function T(e, t, a) {
  let { match: s, captureGroupKeys: r } = C(e, t);
  return a && s && r.length ? { valid: !!s, newRouteDest: P(a, s, r, { namedOnly: true }) } : { valid: !!s };
}
__name(T, "T");
__name2(T, "T");
u();
l();
d();
function D(e) {
  let t = new Headers(e.headers);
  return e.cf && (t.set("x-vercel-ip-city", encodeURIComponent(e.cf.city)), t.set("x-vercel-ip-country", e.cf.country), t.set("x-vercel-ip-country-region", e.cf.regionCode), t.set("x-vercel-ip-latitude", e.cf.latitude), t.set("x-vercel-ip-longitude", e.cf.longitude)), t.set("x-vercel-sc-host", b), new Request(e, { headers: t });
}
__name(D, "D");
__name2(D, "D");
u();
l();
d();
function _(e, t, a) {
  let s = t instanceof Headers ? t.entries() : Object.entries(t);
  for (let [r, i] of s) {
    let n = r.toLowerCase(), o = a?.match ? P(i, a.match, a.captureGroupKeys) : i;
    n === "set-cookie" ? e.append(n, o) : e.set(n, o);
  }
}
__name(_, "_");
__name2(_, "_");
function v(e) {
  return /^https?:\/\//.test(e);
}
__name(v, "v");
__name2(v, "v");
function x(e, t) {
  for (let [a, s] of t.entries()) {
    let r = /^nxtP(.+)$/.exec(a), i = /^nxtI(.+)$/.exec(a);
    r?.[1] ? (e.set(a, s), e.set(r[1], s)) : i?.[1] ? e.set(i[1], s.replace(/(\(\.+\))+/, "")) : (!e.has(a) || !!s && !e.getAll(a).includes(s)) && e.append(a, s);
  }
}
__name(x, "x");
__name2(x, "x");
function L(e, t) {
  let a = new URL(t, e.url);
  return x(a.searchParams, new URL(e.url).searchParams), a.pathname = a.pathname.replace(/\/index.html$/, "/").replace(/\.html$/, ""), new Request(a, e);
}
__name(L, "L");
__name2(L, "L");
function S(e) {
  return new Response(e.body, e);
}
__name(S, "S");
__name2(S, "S");
function A(e) {
  return e.split(",").map((t) => {
    let [a, s] = t.split(";"), r = parseFloat((s ?? "q=1").replace(/q *= */gi, ""));
    return [a.trim(), isNaN(r) ? 1 : r];
  }).sort((t, a) => a[1] - t[1]).map(([t]) => t === "*" || t === "" ? [] : t).flat();
}
__name(A, "A");
__name2(A, "A");
u();
l();
d();
function O(e) {
  switch (e) {
    case "none":
      return "filesystem";
    case "filesystem":
      return "rewrite";
    case "rewrite":
      return "resource";
    case "resource":
      return "miss";
    default:
      return "miss";
  }
}
__name(O, "O");
__name2(O, "O");
async function k(e, { request: t, assetsFetcher: a, ctx: s }, { path: r, searchParams: i }) {
  let n, o = new URL(t.url);
  x(o.searchParams, i);
  let c = new Request(o, t);
  try {
    switch (e?.type) {
      case "function":
      case "middleware": {
        let p = await import(e.entrypoint);
        try {
          n = await p.default(c, s);
        } catch (h) {
          let y = h;
          throw y.name === "TypeError" && y.message.endsWith("default is not a function") ? new Error(`An error occurred while evaluating the target edge function (${e.entrypoint})`) : h;
        }
        break;
      }
      case "override": {
        n = S(await a.fetch(L(c, e.path ?? r))), e.headers && _(n.headers, e.headers);
        break;
      }
      case "static": {
        n = await a.fetch(L(c, r));
        break;
      }
      default:
        n = new Response("Not Found", { status: 404 });
    }
  } catch (p) {
    return console.error(p), new Response("Internal Server Error", { status: 500 });
  }
  return S(n);
}
__name(k, "k");
__name2(k, "k");
function B(e, t) {
  let a = "^//?(?:", s = ")/(.*)$";
  return !e.startsWith(a) || !e.endsWith(s) ? false : e.slice(a.length, -s.length).split("|").every((i) => t.has(i));
}
__name(B, "B");
__name2(B, "B");
u();
l();
d();
function de(e, { protocol: t, hostname: a, port: s, pathname: r }) {
  return !(t && e.protocol.replace(/:$/, "") !== t || !new RegExp(a).test(e.hostname) || s && !new RegExp(s).test(e.port) || r && !new RegExp(r).test(e.pathname));
}
__name(de, "de");
__name2(de, "de");
function pe(e, t) {
  if (e.method !== "GET")
    return;
  let { origin: a, searchParams: s } = new URL(e.url), r = s.get("url"), i = Number.parseInt(s.get("w") ?? "", 10), n = Number.parseInt(s.get("q") ?? "75", 10);
  if (!r || Number.isNaN(i) || Number.isNaN(n) || !t?.sizes?.includes(i) || n < 0 || n > 100)
    return;
  let o = new URL(r, a);
  if (o.pathname.endsWith(".svg") && !t?.dangerouslyAllowSVG)
    return;
  let c = r.startsWith("//"), p = r.startsWith("/") && !c;
  if (!p && !t?.domains?.includes(o.hostname) && !t?.remotePatterns?.find((R) => de(o, R)))
    return;
  let h = e.headers.get("Accept") ?? "", y = t?.formats?.find((R) => h.includes(R))?.replace("image/", "");
  return { isRelative: p, imageUrl: o, options: { width: i, quality: n, format: y } };
}
__name(pe, "pe");
__name2(pe, "pe");
function he(e, t, a) {
  let s = new Headers();
  if (a?.contentSecurityPolicy && s.set("Content-Security-Policy", a.contentSecurityPolicy), a?.contentDispositionType) {
    let i = t.pathname.split("/").pop(), n = i ? `${a.contentDispositionType}; filename="${i}"` : a.contentDispositionType;
    s.set("Content-Disposition", n);
  }
  e.headers.has("Cache-Control") || s.set("Cache-Control", `public, max-age=${a?.minimumCacheTTL ?? 60}`);
  let r = S(e);
  return _(r.headers, s), r;
}
__name(he, "he");
__name2(he, "he");
async function G(e, { buildOutput: t, assetsFetcher: a, imagesConfig: s }) {
  let r = pe(e, s);
  if (!r)
    return new Response("Invalid image resizing request", { status: 400 });
  let { isRelative: i, imageUrl: n } = r, c = await (i && n.pathname in t ? a.fetch.bind(a) : fetch)(n);
  return he(c, n, s);
}
__name(G, "G");
__name2(G, "G");
u();
l();
d();
u();
l();
d();
var fe = "x-vercel-cache-tags";
var me = "x-next-cache-soft-tags";
var ge = Symbol.for("__cloudflare-request-context__");
async function z(e) {
  let t = `https://${b}/v1/suspense-cache/`;
  if (!e.url.startsWith(t))
    return null;
  try {
    let a = new URL(e.url), s = await ye();
    if (a.pathname === "/v1/suspense-cache/revalidate") {
      let i = a.searchParams.get("tags")?.split(",") ?? [];
      for (let n of i)
        await s.revalidateTag(n);
      return new Response(null, { status: 200 });
    }
    let r = a.pathname.replace("/v1/suspense-cache/", "");
    if (!r.length)
      return new Response("Invalid cache key", { status: 400 });
    switch (e.method) {
      case "GET": {
        let i = K(e, me), n = await s.get(r, { softTags: i });
        return n ? new Response(JSON.stringify(n.value), { status: 200, headers: { "Content-Type": "application/json", "x-vercel-cache-state": "fresh", age: `${(Date.now() - (n.lastModified ?? Date.now())) / 1e3}` } }) : new Response(null, { status: 404 });
      }
      case "POST": {
        let i = globalThis[ge], n = /* @__PURE__ */ __name2(async () => {
          let o = await e.json();
          o.data.tags === void 0 && (o.tags ??= K(e, fe) ?? []), await s.set(r, o);
        }, "n");
        return i ? i.ctx.waitUntil(n()) : await n(), new Response(null, { status: 200 });
      }
      default:
        return new Response(null, { status: 405 });
    }
  } catch (a) {
    return console.error(a), new Response("Error handling cache request", { status: 500 });
  }
}
__name(z, "z");
__name2(z, "z");
async function ye() {
  return process.env.__NEXT_ON_PAGES__KV_SUSPENSE_CACHE ? W("kv") : W("cache-api");
}
__name(ye, "ye");
__name2(ye, "ye");
async function W(e) {
  let t = await import(`./__next-on-pages-dist__/cache/${e}.js`);
  return new t.default();
}
__name(W, "W");
__name2(W, "W");
function K(e, t) {
  return e.headers.get(t)?.split(",")?.filter(Boolean);
}
__name(K, "K");
__name2(K, "K");
function Z() {
  globalThis[J] || (_e(), globalThis[J] = true);
}
__name(Z, "Z");
__name2(Z, "Z");
function _e() {
  let e = globalThis.fetch;
  globalThis.fetch = async (...t) => {
    let a = new Request(...t), s = await xe(a);
    return s || (s = await z(a), s) ? s : (we(a), e(a));
  };
}
__name(_e, "_e");
__name2(_e, "_e");
async function xe(e) {
  if (e.url.startsWith("blob:"))
    try {
      let a = (await import(`./__next-on-pages-dist__/assets/${new URL(e.url).pathname}.bin`)).default, s = { async arrayBuffer() {
        return a;
      }, get body() {
        return new ReadableStream({ start(r) {
          let i = Buffer.from(a);
          r.enqueue(i), r.close();
        } });
      }, async text() {
        return Buffer.from(a).toString();
      }, async json() {
        let r = Buffer.from(a);
        return JSON.stringify(r.toString());
      }, async blob() {
        return new Blob(a);
      } };
      return s.clone = () => ({ ...s }), s;
    } catch {
    }
  return null;
}
__name(xe, "xe");
__name2(xe, "xe");
function we(e) {
  e.headers.has("user-agent") || e.headers.set("user-agent", "Next.js Middleware");
}
__name(we, "we");
__name2(we, "we");
var J = Symbol.for("next-on-pages fetch patch");
u();
l();
d();
var Y = V(X());
var M = /* @__PURE__ */ __name2(class {
  constructor(t, a, s, r, i) {
    this.routes = t;
    this.output = a;
    this.reqCtx = s;
    this.url = new URL(s.request.url), this.cookies = (0, Y.parse)(s.request.headers.get("cookie") || ""), this.path = this.url.pathname || "/", this.headers = { normal: new Headers(), important: new Headers() }, this.searchParams = new URLSearchParams(), x(this.searchParams, this.url.searchParams), this.checkPhaseCounter = 0, this.middlewareInvoked = [], this.wildcardMatch = i?.find((n) => n.domain === this.url.hostname), this.locales = new Set(r.collectedLocales);
  }
  url;
  cookies;
  wildcardMatch;
  path;
  status;
  headers;
  searchParams;
  body;
  checkPhaseCounter;
  middlewareInvoked;
  locales;
  checkRouteMatch(t, { checkStatus: a, checkIntercept: s }) {
    let r = C(t.src, this.path, t.caseSensitive);
    if (!r.match || t.methods && !t.methods.map((n) => n.toUpperCase()).includes(this.reqCtx.request.method.toUpperCase()))
      return;
    let i = { url: this.url, cookies: this.cookies, headers: this.reqCtx.request.headers, routeDest: t.dest };
    if (!t.has?.find((n) => {
      let o = I(n, i);
      return o.newRouteDest && (i.routeDest = o.newRouteDest), !o.valid;
    }) && !t.missing?.find((n) => I(n, i).valid) && !(a && t.status !== this.status)) {
      if (s && t.dest) {
        let n = /\/(\(\.+\))+/, o = n.test(t.dest), c = n.test(this.path);
        if (o && !c)
          return;
      }
      return { routeMatch: r, routeDest: i.routeDest };
    }
  }
  processMiddlewareResp(t) {
    let a = "x-middleware-override-headers", s = t.headers.get(a);
    if (s) {
      let c = new Set(s.split(",").map((p) => p.trim()));
      for (let p of c.keys()) {
        let h = `x-middleware-request-${p}`, y = t.headers.get(h);
        this.reqCtx.request.headers.get(p) !== y && (y ? this.reqCtx.request.headers.set(p, y) : this.reqCtx.request.headers.delete(p)), t.headers.delete(h);
      }
      t.headers.delete(a);
    }
    let r = "x-middleware-rewrite", i = t.headers.get(r);
    if (i) {
      let c = new URL(i, this.url), p = this.url.hostname !== c.hostname;
      this.path = p ? `${c}` : c.pathname, x(this.searchParams, c.searchParams), t.headers.delete(r);
    }
    let n = "x-middleware-next";
    t.headers.get(n) ? t.headers.delete(n) : !i && !t.headers.has("location") ? (this.body = t.body, this.status = t.status) : t.headers.has("location") && t.status >= 300 && t.status < 400 && (this.status = t.status), _(this.reqCtx.request.headers, t.headers), _(this.headers.normal, t.headers), this.headers.middlewareLocation = t.headers.get("location");
  }
  async runRouteMiddleware(t) {
    if (!t)
      return true;
    let a = t && this.output[t];
    if (!a || a.type !== "middleware")
      return this.status = 500, false;
    let s = await k(a, this.reqCtx, { path: this.path, searchParams: this.searchParams, headers: this.headers, status: this.status });
    return this.middlewareInvoked.push(t), s.status === 500 ? (this.status = s.status, false) : (this.processMiddlewareResp(s), true);
  }
  applyRouteOverrides(t) {
    !t.override || (this.status = void 0, this.headers.normal = new Headers(), this.headers.important = new Headers());
  }
  applyRouteHeaders(t, a, s) {
    !t.headers || (_(this.headers.normal, t.headers, { match: a, captureGroupKeys: s }), t.important && _(this.headers.important, t.headers, { match: a, captureGroupKeys: s }));
  }
  applyRouteStatus(t) {
    !t.status || (this.status = t.status);
  }
  applyRouteDest(t, a, s) {
    if (!t.dest)
      return this.path;
    let r = this.path, i = t.dest;
    this.wildcardMatch && /\$wildcard/.test(i) && (i = i.replace(/\$wildcard/g, this.wildcardMatch.value)), this.path = P(i, a, s);
    let n = /\/index\.rsc$/i.test(this.path), o = /^\/(?:index)?$/i.test(r), c = /^\/__index\.prefetch\.rsc$/i.test(r);
    n && !o && !c && (this.path = r);
    let p = /\.rsc$/i.test(this.path), h = /\.prefetch\.rsc$/i.test(this.path), y = this.path in this.output;
    p && !h && !y && (this.path = this.path.replace(/\.rsc/i, ""));
    let R = new URL(this.path, this.url);
    return x(this.searchParams, R.searchParams), v(this.path) || (this.path = R.pathname), r;
  }
  applyLocaleRedirects(t) {
    if (!t.locale?.redirect || !/^\^(.)*$/.test(t.src) && t.src !== this.path || this.headers.normal.has("location"))
      return;
    let { locale: { redirect: s, cookie: r } } = t, i = r && this.cookies[r], n = A(i ?? ""), o = A(this.reqCtx.request.headers.get("accept-language") ?? ""), h = [...n, ...o].map((y) => s[y]).filter(Boolean)[0];
    if (h) {
      !this.path.startsWith(h) && (this.headers.normal.set("location", h), this.status = 307);
      return;
    }
  }
  getLocaleFriendlyRoute(t, a) {
    return !this.locales || a !== "miss" ? t : B(t.src, this.locales) ? { ...t, src: t.src.replace(/\/\(\.\*\)\$$/, "(?:/(.*))?$") } : t;
  }
  async checkRoute(t, a) {
    let s = this.getLocaleFriendlyRoute(a, t), { routeMatch: r, routeDest: i } = this.checkRouteMatch(s, { checkStatus: t === "error", checkIntercept: t === "rewrite" }) ?? {}, n = { ...s, dest: i };
    if (!r?.match || n.middlewarePath && this.middlewareInvoked.includes(n.middlewarePath))
      return "skip";
    let { match: o, captureGroupKeys: c } = r;
    if (this.applyRouteOverrides(n), this.applyLocaleRedirects(n), !await this.runRouteMiddleware(n.middlewarePath))
      return "error";
    if (this.body !== void 0 || this.headers.middlewareLocation)
      return "done";
    this.applyRouteHeaders(n, o, c), this.applyRouteStatus(n);
    let h = this.applyRouteDest(n, o, c);
    if (n.check && !v(this.path))
      if (h === this.path) {
        if (t !== "miss")
          return this.checkPhase(O(t));
        this.status = 404;
      } else if (t === "miss") {
        if (!(this.path in this.output) && !(this.path.replace(/\/$/, "") in this.output))
          return this.checkPhase("filesystem");
        this.status === 404 && (this.status = void 0);
      } else
        return this.checkPhase("none");
    return !n.continue || n.status && n.status >= 300 && n.status <= 399 ? "done" : "next";
  }
  async checkPhase(t) {
    if (this.checkPhaseCounter++ >= 50)
      return console.error(`Routing encountered an infinite loop while checking ${this.url.pathname}`), this.status = 500, "error";
    this.middlewareInvoked = [];
    let a = true;
    for (let i of this.routes[t]) {
      let n = await this.checkRoute(t, i);
      if (n === "error")
        return "error";
      if (n === "done") {
        a = false;
        break;
      }
    }
    if (t === "hit" || v(this.path) || this.headers.normal.has("location") || !!this.body)
      return "done";
    if (t === "none")
      for (let i of this.locales) {
        let n = new RegExp(`/${i}(/.*)`), c = this.path.match(n)?.[1];
        if (c && c in this.output) {
          this.path = c;
          break;
        }
      }
    let s = this.path in this.output;
    if (!s && this.path.endsWith("/")) {
      let i = this.path.replace(/\/$/, "");
      s = i in this.output, s && (this.path = i);
    }
    if (t === "miss" && !s) {
      let i = !this.status || this.status < 400;
      this.status = i ? 404 : this.status;
    }
    let r = "miss";
    return s || t === "miss" || t === "error" ? r = "hit" : a && (r = O(t)), this.checkPhase(r);
  }
  async run(t = "none") {
    this.checkPhaseCounter = 0;
    let a = await this.checkPhase(t);
    return this.headers.normal.has("location") && (!this.status || this.status < 300 || this.status >= 400) && (this.status = 307), a;
  }
}, "M");
async function Q(e, t, a, s) {
  let r = new M(t.routes, a, e, s, t.wildcard), i = await ee(r);
  return Ee(e, i, a);
}
__name(Q, "Q");
__name2(Q, "Q");
async function ee(e, t = "none", a = false) {
  return await e.run(t) === "error" || !a && e.status && e.status >= 400 ? ee(e, "error", true) : { path: e.path, status: e.status, headers: e.headers, searchParams: e.searchParams, body: e.body };
}
__name(ee, "ee");
__name2(ee, "ee");
async function Ee(e, { path: t = "/404", status: a, headers: s, searchParams: r, body: i }, n) {
  let o = s.normal.get("location");
  if (o) {
    if (o !== s.middlewareLocation) {
      let h = [...r.keys()].length ? `?${r.toString()}` : "";
      s.normal.set("location", `${o ?? "/"}${h}`);
    }
    return new Response(null, { status: a, headers: s.normal });
  }
  let c;
  if (i !== void 0)
    c = new Response(i, { status: a });
  else if (v(t)) {
    let h = new URL(t);
    x(h.searchParams, r), c = await fetch(h, e.request);
  } else
    c = await k(n[t], e, { path: t, status: a, headers: s, searchParams: r });
  let p = s.normal;
  return _(p, c.headers), _(p, s.important), c = new Response(c.body, { ...c, status: a || c.status, headers: p }), c;
}
__name(Ee, "Ee");
__name2(Ee, "Ee");
u();
l();
d();
function te() {
  globalThis.__nextOnPagesRoutesIsolation ??= { _map: /* @__PURE__ */ new Map(), getProxyFor: Me };
}
__name(te, "te");
__name2(te, "te");
function Me(e) {
  let t = globalThis.__nextOnPagesRoutesIsolation._map.get(e);
  if (t)
    return t;
  let a = je();
  return globalThis.__nextOnPagesRoutesIsolation._map.set(e, a), a;
}
__name(Me, "Me");
__name2(Me, "Me");
function je() {
  let e = /* @__PURE__ */ new Map();
  return new Proxy(globalThis, { get: (t, a) => e.has(a) ? e.get(a) : Reflect.get(globalThis, a), set: (t, a, s) => Te.has(a) ? Reflect.set(globalThis, a, s) : (e.set(a, s), true) });
}
__name(je, "je");
__name2(je, "je");
var Te = /* @__PURE__ */ new Set(["_nextOriginalFetch", "fetch", "__incrementalCache"]);
var ms = { async fetch(e, t, a) {
  te(), Z();
  let s = await __ALSes_PROMISE__;
  if (!s) {
    let n = new URL(e.url), o = await t.ASSETS.fetch(`${n.protocol}//${n.host}/cdn-cgi/errors/no-nodejs_compat.html`), c = o.ok ? o.body : "Error: Could not access built-in Node.js modules. Please make sure that your Cloudflare Pages project has the 'nodejs_compat' compatibility flag set.";
    return new Response(c, { status: 503 });
  }
  let { envAsyncLocalStorage: r, requestContextAsyncLocalStorage: i } = s;
  return r.run({ ...t, NODE_ENV: "production", SUSPENSE_CACHE_URL: b }, async () => i.run({ env: t, ctx: a, cf: e.cf }, async () => {
    if (new URL(e.url).pathname.startsWith("/_next/image"))
      return G(e, { buildOutput: m, assetsFetcher: t.ASSETS, imagesConfig: f.images });
    let o = D(e);
    return Q({ request: o, ctx: a, assetsFetcher: t.ASSETS }, f, m, g);
  }));
} };

// node_modules/wrangler/templates/pages-dev-util.ts
function isRoutingRuleMatch(pathname, routingRule) {
  if (!pathname) {
    throw new Error("Pathname is undefined.");
  }
  if (!routingRule) {
    throw new Error("Routing rule is undefined.");
  }
  const ruleRegExp = transformRoutingRuleToRegExp(routingRule);
  return pathname.match(ruleRegExp) !== null;
}
__name(isRoutingRuleMatch, "isRoutingRuleMatch");
function transformRoutingRuleToRegExp(rule) {
  let transformedRule;
  if (rule === "/" || rule === "/*") {
    transformedRule = rule;
  } else if (rule.endsWith("/*")) {
    transformedRule = `${rule.substring(0, rule.length - 2)}(/*)?`;
  } else if (rule.endsWith("/")) {
    transformedRule = `${rule.substring(0, rule.length - 1)}(/)?`;
  } else if (rule.endsWith("*")) {
    transformedRule = rule;
  } else {
    transformedRule = `${rule}(/)?`;
  }
  transformedRule = `^${transformedRule.replaceAll(/\./g, "\\.").replaceAll(/\*/g, ".*")}$`;
  return new RegExp(transformedRule);
}
__name(transformRoutingRuleToRegExp, "transformRoutingRuleToRegExp");

// .wrangler/tmp/pages-aKl6SH/qt0u90nwh1.js
var define_ROUTES_default = { version: 1, description: "Built with @cloudflare/next-on-pages@1.13.7.", include: ["/*"], exclude: ["/_next/static/*"] };
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = ms;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Dgyovm/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_dev_pipeline_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Dgyovm/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
//# sourceMappingURL=qt0u90nwh1.js.map
