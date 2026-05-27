var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js/index.js
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
var N = Object.defineProperty;
var ne = Object.getOwnPropertyDescriptor;
var ae = Object.getOwnPropertyNames;
var re = Object.getPrototypeOf;
var ie = Object.prototype.hasOwnProperty;
var j = /* @__PURE__ */ __name((e, t) => () => (e && (t = e(e = 0)), t), "j");
var U = /* @__PURE__ */ __name((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "U");
var oe = /* @__PURE__ */ __name((e, t, n, s) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let r of ae(t))
      !ie.call(e, r) && r !== n && N(e, r, { get: () => t[r], enumerable: !(s = ne(t, r)) || s.enumerable });
  return e;
}, "oe");
var V = /* @__PURE__ */ __name((e, t, n) => (n = e != null ? se(re(e)) : {}, oe(t || !e || !e.__esModule ? N(n, "default", { value: e, enumerable: true }) : n, e)), "V");
var g;
var u = j(() => {
  g = { collectedLocales: [] };
});
var f;
var l = j(() => {
  f = { version: 3, routes: { none: [{ src: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$", headers: { Location: "/$1" }, status: 308, continue: true }, { src: "^/_next/__private/trace$", dest: "/404", status: 404, continue: true }, { src: "^/404/?$", status: 404, continue: true, missing: [{ type: "header", key: "x-prerender-revalidate" }] }, { src: "^/500$", status: 500, continue: true }, { src: "^/?$", has: [{ type: "header", key: "rsc", value: "1" }], dest: "/index.rsc", headers: { vary: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url" }, continue: true, override: true }, { src: "^/((?!.+\\.rsc).+?)(?:/)?$", has: [{ type: "header", key: "rsc", value: "1" }], dest: "/$1.rsc", headers: { vary: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url" }, continue: true, override: true }], filesystem: [{ src: "^/index(\\.action|\\.rsc)$", dest: "/", continue: true }, { src: "^/_next/data/(.*)$", dest: "/_next/data/$1", check: true }, { src: "^/\\.prefetch\\.rsc$", dest: "/__index.prefetch.rsc", check: true }, { src: "^/(.+)/\\.prefetch\\.rsc$", dest: "/$1.prefetch.rsc", check: true }, { src: "^/\\.rsc$", dest: "/index.rsc", check: true }, { src: "^/(.+)/\\.rsc$", dest: "/$1.rsc", check: true }], miss: [{ src: "^/_next/static/.+$", status: 404, check: true, dest: "/_next/static/not-found.txt", headers: { "content-type": "text/plain; charset=utf-8" } }], rewrite: [{ src: "^/_next/data/(.*)$", dest: "/404", status: 404 }, { src: "^/api/journal/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/api/journal/[id].rsc?nxtPid=$nxtPid" }, { src: "^/api/journal/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/api/journal/[id]?nxtPid=$nxtPid" }, { src: "^/api/paper/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/api/paper/[id].rsc?nxtPid=$nxtPid" }, { src: "^/api/paper/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/api/paper/[id]?nxtPid=$nxtPid" }, { src: "^/author/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/author/[id].rsc?nxtPid=$nxtPid" }, { src: "^/author/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/author/[id]?nxtPid=$nxtPid" }, { src: "^/journal/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/journal/[id].rsc?nxtPid=$nxtPid" }, { src: "^/journal/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/journal/[id]?nxtPid=$nxtPid" }, { src: "^/paper/(?<nxtPid>[^/]+?)(?:\\.rsc)(?:/)?$", dest: "/paper/[id].rsc?nxtPid=$nxtPid" }, { src: "^/paper/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/paper/[id]?nxtPid=$nxtPid" }], resource: [{ src: "^/.*$", status: 404 }], hit: [{ src: "^/_next/static/(?:[^/]+/pages|pages|chunks|runtime|css|image|media|ypAAtaIuoiNMyBAPWzp8m)/.+$", headers: { "cache-control": "public,max-age=31536000,immutable" }, continue: true, important: true }, { src: "^/index(?:/)?$", headers: { "x-matched-path": "/" }, continue: true, important: true }, { src: "^/((?!index$).*?)(?:/)?$", headers: { "x-matched-path": "/$1" }, continue: true, important: true }], error: [{ src: "^/.*$", dest: "/404", status: 404, headers: { "x-next-error-status": "404" } }, { src: "^/.*$", dest: "/500", status: 500, headers: { "x-next-error-status": "500" } }] }, images: { domains: [], sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840, 16, 32, 48, 64, 96, 128, 256, 384], remotePatterns: [], minimumCacheTTL: 60, formats: ["image/webp"], dangerouslyAllowSVG: false, contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;", contentDispositionType: "inline" }, overrides: { "404.html": { path: "404", contentType: "text/html; charset=utf-8" }, "500.html": { path: "500", contentType: "text/html; charset=utf-8" }, "_app.rsc.json": { path: "_app.rsc", contentType: "application/json" }, "_error.rsc.json": { path: "_error.rsc", contentType: "application/json" }, "_document.rsc.json": { path: "_document.rsc", contentType: "application/json" }, "404.rsc.json": { path: "404.rsc", contentType: "application/json" }, "_next/static/not-found.txt": { contentType: "text/plain" } }, framework: { slug: "nextjs", version: "13.5.6" }, crons: [] };
});
var m;
var p = j(() => {
  m = { "/404.html": { type: "override", path: "/404.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/404.rsc.json": { type: "override", path: "/404.rsc.json", headers: { "content-type": "application/json" } }, "/500.html": { type: "override", path: "/500.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/_app.rsc.json": { type: "override", path: "/_app.rsc.json", headers: { "content-type": "application/json" } }, "/_document.rsc.json": { type: "override", path: "/_document.rsc.json", headers: { "content-type": "application/json" } }, "/_error.rsc.json": { type: "override", path: "/_error.rsc.json", headers: { "content-type": "application/json" } }, "/_next/static/chunks/187-0216d381a34ff2ee.js": { type: "static" }, "/_next/static/chunks/320-6f9d668980b58e87.js": { type: "static" }, "/_next/static/chunks/37-a5aa02103f1c24cf.js": { type: "static" }, "/_next/static/chunks/983-6323b037be8c99b4.js": { type: "static" }, "/_next/static/chunks/app/_not-found-687e66220b624c91.js": { type: "static" }, "/_next/static/chunks/app/about/page-99e953b88c21d006.js": { type: "static" }, "/_next/static/chunks/app/author/[id]/page-e0153b56e574eac7.js": { type: "static" }, "/_next/static/chunks/app/author/layout-b12b54f12f098b1a.js": { type: "static" }, "/_next/static/chunks/app/journal/[id]/page-a1a728eb8a48b539.js": { type: "static" }, "/_next/static/chunks/app/journal/layout-009ffe6a82803e22.js": { type: "static" }, "/_next/static/chunks/app/layout-4620445500514d9f.js": { type: "static" }, "/_next/static/chunks/app/page-786099cc896122f9.js": { type: "static" }, "/_next/static/chunks/app/paper/[id]/page-f019bf769449869d.js": { type: "static" }, "/_next/static/chunks/app/paper/layout-43a6b78e1b71afab.js": { type: "static" }, "/_next/static/chunks/app/search/page-099fa893ff06e4dc.js": { type: "static" }, "/_next/static/chunks/app/trending/page-bfb16b9c09ddf615.js": { type: "static" }, "/_next/static/chunks/bf6a786c-5642d9fbbcda6727.js": { type: "static" }, "/_next/static/chunks/framework-c5181c9431ddc45b.js": { type: "static" }, "/_next/static/chunks/main-1def9304459c7bfc.js": { type: "static" }, "/_next/static/chunks/main-app-ae05580087df577e.js": { type: "static" }, "/_next/static/chunks/pages/_app-1534f180665c857f.js": { type: "static" }, "/_next/static/chunks/pages/_error-b646007f40c4f0a8.js": { type: "static" }, "/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js": { type: "static" }, "/_next/static/chunks/webpack-fe2d7f101b9d16ba.js": { type: "static" }, "/_next/static/css/7c238094b37c7318.css": { type: "static" }, "/_next/static/media/19cfc7226ec3afaa-s.woff2": { type: "static" }, "/_next/static/media/21350d82a1f187e9-s.woff2": { type: "static" }, "/_next/static/media/36966cca54120369-s.p.woff2": { type: "static" }, "/_next/static/media/8e9860b6e62d6359-s.woff2": { type: "static" }, "/_next/static/media/b7387a63dd068245-s.woff2": { type: "static" }, "/_next/static/media/ba9851c3c22cd980-s.woff2": { type: "static" }, "/_next/static/media/c5fe6dc8356a8c31-s.woff2": { type: "static" }, "/_next/static/media/df0a9ae256c0569c-s.woff2": { type: "static" }, "/_next/static/media/e1aab0933260df4d-s.woff2": { type: "static" }, "/_next/static/media/e4af272ccee01ff0-s.p.woff2": { type: "static" }, "/_next/static/not-found.txt": { type: "override", path: "/_next/static/not-found.txt", headers: { "content-type": "text/plain" } }, "/_next/static/ypAAtaIuoiNMyBAPWzp8m/_buildManifest.js": { type: "static" }, "/_next/static/ypAAtaIuoiNMyBAPWzp8m/_ssgManifest.js": { type: "static" }, "/ads.txt": { type: "static" }, "/favicon.ico": { type: "static" }, "/about": { type: "function", entrypoint: "__next-on-pages-dist__/functions/about.func.js" }, "/about.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/about.func.js" }, "/api/journal/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/journal/[id].func.js" }, "/api/journal/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/journal/[id].func.js" }, "/api/paper/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/paper/[id].func.js" }, "/api/paper/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/paper/[id].func.js" }, "/api/search": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/search.func.js" }, "/api/search.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/search.func.js" }, "/api/trending": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/trending.func.js" }, "/api/trending.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/trending.func.js" }, "/author/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/author/[id].func.js" }, "/author/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/author/[id].func.js" }, "/index": { type: "function", entrypoint: "__next-on-pages-dist__/functions/index.func.js" }, "/": { type: "override", path: "/_next/static/not-found.txt", headers: { "content-type": "text/plain" } }, "/index.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/index.func.js" }, "/journal/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/journal/[id].func.js" }, "/journal/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/journal/[id].func.js" }, "/paper/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/paper/[id].func.js" }, "/paper/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/paper/[id].func.js" }, "/robots.txt": { type: "function", entrypoint: "__next-on-pages-dist__/functions/robots.txt.func.js" }, "/robots.txt.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/robots.txt.func.js" }, "/search": { type: "function", entrypoint: "__next-on-pages-dist__/functions/search.func.js" }, "/search.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/search.func.js" }, "/sitemap.xml": { type: "function", entrypoint: "__next-on-pages-dist__/functions/sitemap.xml.func.js" }, "/sitemap.xml.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/sitemap.xml.func.js" }, "/trending": { type: "function", entrypoint: "__next-on-pages-dist__/functions/trending.func.js" }, "/trending.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/trending.func.js" }, "/404": { type: "override", path: "/404.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/500": { type: "override", path: "/500.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/_app.rsc": { type: "override", path: "/_app.rsc.json", headers: { "content-type": "application/json" } }, "/_error.rsc": { type: "override", path: "/_error.rsc.json", headers: { "content-type": "application/json" } }, "/_document.rsc": { type: "override", path: "/_document.rsc.json", headers: { "content-type": "application/json" } }, "/404.rsc": { type: "override", path: "/404.rsc.json", headers: { "content-type": "application/json" } } };
});
var F = U((Ge, $) => {
  "use strict";
  u();
  l();
  p();
  function w(e, t) {
    e = String(e || "").trim();
    let n = e, s, r = "";
    if (/^[^a-zA-Z\\\s]/.test(e)) {
      s = e[0];
      let o = e.lastIndexOf(s);
      r += e.substring(o + 1), e = e.substring(1, o);
    }
    let a = 0;
    return e = le(e, (o) => {
      if (/^\(\?[P<']/.test(o)) {
        let c = /^\(\?P?[<']([^>']+)[>']/.exec(o);
        if (!c)
          throw new Error(`Failed to extract named captures from ${JSON.stringify(o)}`);
        let d = o.substring(c[0].length, o.length - 1);
        return t && (t[a] = c[1]), a++, `(${d})`;
      }
      return o.substring(0, 3) === "(?:" || a++, o;
    }), e = e.replace(/\[:([^:]+):\]/g, (o, c) => w.characterClasses[c] || o), new w.PCRE(e, r, n, r, s);
  }
  __name(w, "w");
  function le(e, t) {
    let n = 0, s = 0, r = false;
    for (let i = 0; i < e.length; i++) {
      let a = e[i];
      if (r) {
        r = false;
        continue;
      }
      switch (a) {
        case "(":
          s === 0 && (n = i), s++;
          break;
        case ")":
          if (s > 0 && (s--, s === 0)) {
            let o = i + 1, c = n === 0 ? "" : e.substring(0, n), d = e.substring(o), h = String(t(e.substring(n, o)));
            e = c + h + d, i = n;
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
  (function(e) {
    class t extends RegExp {
      constructor(s, r, i, a, o) {
        super(s, r), this.pcrePattern = i, this.pcreFlags = a, this.delimiter = o;
      }
    }
    __name(t, "t");
    e.PCRE = t, e.characterClasses = { alnum: "[A-Za-z0-9]", word: "[A-Za-z0-9_]", alpha: "[A-Za-z]", blank: "[ \\t]", cntrl: "[\\x00-\\x1F\\x7F]", digit: "\\d", graph: "[\\x21-\\x7E]", lower: "[a-z]", print: "[\\x20-\\x7E]", punct: "[\\]\\[!\"#$%&'()*+,./:;<=>?@\\\\^_`{|}~-]", space: "\\s", upper: "[A-Z]", xdigit: "[A-Fa-f0-9]" };
  })(w || (w = {}));
  w.prototype = w.PCRE.prototype;
  $.exports = w;
});
var X = U((H) => {
  "use strict";
  u();
  l();
  p();
  H.parse = be;
  H.serialize = Pe;
  var Re = Object.prototype.toString, E = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
  function be(e, t) {
    if (typeof e != "string")
      throw new TypeError("argument str must be a string");
    for (var n = {}, s = t || {}, r = s.decode || ve, i = 0; i < e.length; ) {
      var a = e.indexOf("=", i);
      if (a === -1)
        break;
      var o = e.indexOf(";", i);
      if (o === -1)
        o = e.length;
      else if (o < a) {
        i = e.lastIndexOf(";", a - 1) + 1;
        continue;
      }
      var c = e.slice(i, a).trim();
      if (n[c] === void 0) {
        var d = e.slice(a + 1, o).trim();
        d.charCodeAt(0) === 34 && (d = d.slice(1, -1)), n[c] = ke(d, r);
      }
      i = o + 1;
    }
    return n;
  }
  __name(be, "be");
  function Pe(e, t, n) {
    var s = n || {}, r = s.encode || Se;
    if (typeof r != "function")
      throw new TypeError("option encode is invalid");
    if (!E.test(e))
      throw new TypeError("argument name is invalid");
    var i = r(t);
    if (i && !E.test(i))
      throw new TypeError("argument val is invalid");
    var a = e + "=" + i;
    if (s.maxAge != null) {
      var o = s.maxAge - 0;
      if (isNaN(o) || !isFinite(o))
        throw new TypeError("option maxAge is invalid");
      a += "; Max-Age=" + Math.floor(o);
    }
    if (s.domain) {
      if (!E.test(s.domain))
        throw new TypeError("option domain is invalid");
      a += "; Domain=" + s.domain;
    }
    if (s.path) {
      if (!E.test(s.path))
        throw new TypeError("option path is invalid");
      a += "; Path=" + s.path;
    }
    if (s.expires) {
      var c = s.expires;
      if (!Ce(c) || isNaN(c.valueOf()))
        throw new TypeError("option expires is invalid");
      a += "; Expires=" + c.toUTCString();
    }
    if (s.httpOnly && (a += "; HttpOnly"), s.secure && (a += "; Secure"), s.priority) {
      var d = typeof s.priority == "string" ? s.priority.toLowerCase() : s.priority;
      switch (d) {
        case "low":
          a += "; Priority=Low";
          break;
        case "medium":
          a += "; Priority=Medium";
          break;
        case "high":
          a += "; Priority=High";
          break;
        default:
          throw new TypeError("option priority is invalid");
      }
    }
    if (s.sameSite) {
      var h = typeof s.sameSite == "string" ? s.sameSite.toLowerCase() : s.sameSite;
      switch (h) {
        case true:
          a += "; SameSite=Strict";
          break;
        case "lax":
          a += "; SameSite=Lax";
          break;
        case "strict":
          a += "; SameSite=Strict";
          break;
        case "none":
          a += "; SameSite=None";
          break;
        default:
          throw new TypeError("option sameSite is invalid");
      }
    }
    return a;
  }
  __name(Pe, "Pe");
  function ve(e) {
    return e.indexOf("%") !== -1 ? decodeURIComponent(e) : e;
  }
  __name(ve, "ve");
  function Se(e) {
    return encodeURIComponent(e);
  }
  __name(Se, "Se");
  function Ce(e) {
    return Re.call(e) === "[object Date]" || e instanceof Date;
  }
  __name(Ce, "Ce");
  function ke(e, t) {
    try {
      return t(e);
    } catch {
      return e;
    }
  }
  __name(ke, "ke");
});
u();
l();
p();
u();
l();
p();
u();
l();
p();
var b = "INTERNAL_SUSPENSE_CACHE_HOSTNAME.local";
u();
l();
p();
u();
l();
p();
u();
l();
p();
u();
l();
p();
var q = V(F());
function C(e, t, n) {
  if (t == null)
    return { match: null, captureGroupKeys: [] };
  let s = n ? "" : "i", r = [];
  return { match: (0, q.default)(`%${e}%${s}`, r).exec(t), captureGroupKeys: r };
}
__name(C, "C");
function P(e, t, n, { namedOnly: s } = {}) {
  return e.replace(/\$([a-zA-Z0-9_]+)/g, (r, i) => {
    let a = n.indexOf(i);
    return s && a === -1 ? r : (a === -1 ? t[parseInt(i, 10)] : t[a + 1]) || "";
  });
}
__name(P, "P");
function I(e, { url: t, cookies: n, headers: s, routeDest: r }) {
  switch (e.type) {
    case "host":
      return { valid: t.hostname === e.value };
    case "header":
      return e.value !== void 0 ? T(e.value, s.get(e.key), r) : { valid: s.has(e.key) };
    case "cookie": {
      let i = n[e.key];
      return i && e.value !== void 0 ? T(e.value, i, r) : { valid: i !== void 0 };
    }
    case "query":
      return e.value !== void 0 ? T(e.value, t.searchParams.get(e.key), r) : { valid: t.searchParams.has(e.key) };
  }
}
__name(I, "I");
function T(e, t, n) {
  let { match: s, captureGroupKeys: r } = C(e, t);
  return n && s && r.length ? { valid: !!s, newRouteDest: P(n, s, r, { namedOnly: true }) } : { valid: !!s };
}
__name(T, "T");
u();
l();
p();
function D(e) {
  let t = new Headers(e.headers);
  return e.cf && (t.set("x-vercel-ip-city", encodeURIComponent(e.cf.city)), t.set("x-vercel-ip-country", e.cf.country), t.set("x-vercel-ip-country-region", e.cf.regionCode), t.set("x-vercel-ip-latitude", e.cf.latitude), t.set("x-vercel-ip-longitude", e.cf.longitude)), t.set("x-vercel-sc-host", b), new Request(e, { headers: t });
}
__name(D, "D");
u();
l();
p();
function _(e, t, n) {
  let s = t instanceof Headers ? t.entries() : Object.entries(t);
  for (let [r, i] of s) {
    let a = r.toLowerCase(), o = n?.match ? P(i, n.match, n.captureGroupKeys) : i;
    a === "set-cookie" ? e.append(a, o) : e.set(a, o);
  }
}
__name(_, "_");
function v(e) {
  return /^https?:\/\//.test(e);
}
__name(v, "v");
function x(e, t) {
  for (let [n, s] of t.entries()) {
    let r = /^nxtP(.+)$/.exec(n), i = /^nxtI(.+)$/.exec(n);
    r?.[1] ? (e.set(n, s), e.set(r[1], s)) : i?.[1] ? e.set(i[1], s.replace(/(\(\.+\))+/, "")) : (!e.has(n) || !!s && !e.getAll(n).includes(s)) && e.append(n, s);
  }
}
__name(x, "x");
function A(e, t) {
  let n = new URL(t, e.url);
  return x(n.searchParams, new URL(e.url).searchParams), n.pathname = n.pathname.replace(/\/index.html$/, "/").replace(/\.html$/, ""), new Request(n, e);
}
__name(A, "A");
function S(e) {
  return new Response(e.body, e);
}
__name(S, "S");
function L(e) {
  return e.split(",").map((t) => {
    let [n, s] = t.split(";"), r = parseFloat((s ?? "q=1").replace(/q *= */gi, ""));
    return [n.trim(), isNaN(r) ? 1 : r];
  }).sort((t, n) => n[1] - t[1]).map(([t]) => t === "*" || t === "" ? [] : t).flat();
}
__name(L, "L");
u();
l();
p();
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
async function k(e, { request: t, assetsFetcher: n, ctx: s }, { path: r, searchParams: i }) {
  let a, o = new URL(t.url);
  x(o.searchParams, i);
  let c = new Request(o, t);
  try {
    switch (e?.type) {
      case "function":
      case "middleware": {
        let d = await import(e.entrypoint);
        try {
          a = await d.default(c, s);
        } catch (h) {
          let y = h;
          throw y.name === "TypeError" && y.message.endsWith("default is not a function") ? new Error(`An error occurred while evaluating the target edge function (${e.entrypoint})`) : h;
        }
        break;
      }
      case "override": {
        a = S(await n.fetch(A(c, e.path ?? r))), e.headers && _(a.headers, e.headers);
        break;
      }
      case "static": {
        a = await n.fetch(A(c, r));
        break;
      }
      default:
        a = new Response("Not Found", { status: 404 });
    }
  } catch (d) {
    return console.error(d), new Response("Internal Server Error", { status: 500 });
  }
  return S(a);
}
__name(k, "k");
function B(e, t) {
  let n = "^//?(?:", s = ")/(.*)$";
  return !e.startsWith(n) || !e.endsWith(s) ? false : e.slice(n.length, -s.length).split("|").every((i) => t.has(i));
}
__name(B, "B");
u();
l();
p();
function pe(e, { protocol: t, hostname: n, port: s, pathname: r }) {
  return !(t && e.protocol.replace(/:$/, "") !== t || !new RegExp(n).test(e.hostname) || s && !new RegExp(s).test(e.port) || r && !new RegExp(r).test(e.pathname));
}
__name(pe, "pe");
function de(e, t) {
  if (e.method !== "GET")
    return;
  let { origin: n, searchParams: s } = new URL(e.url), r = s.get("url"), i = Number.parseInt(s.get("w") ?? "", 10), a = Number.parseInt(s.get("q") ?? "75", 10);
  if (!r || Number.isNaN(i) || Number.isNaN(a) || !t?.sizes?.includes(i) || a < 0 || a > 100)
    return;
  let o = new URL(r, n);
  if (o.pathname.endsWith(".svg") && !t?.dangerouslyAllowSVG)
    return;
  let c = r.startsWith("//"), d = r.startsWith("/") && !c;
  if (!d && !t?.domains?.includes(o.hostname) && !t?.remotePatterns?.find((R) => pe(o, R)))
    return;
  let h = e.headers.get("Accept") ?? "", y = t?.formats?.find((R) => h.includes(R))?.replace("image/", "");
  return { isRelative: d, imageUrl: o, options: { width: i, quality: a, format: y } };
}
__name(de, "de");
function he(e, t, n) {
  let s = new Headers();
  if (n?.contentSecurityPolicy && s.set("Content-Security-Policy", n.contentSecurityPolicy), n?.contentDispositionType) {
    let i = t.pathname.split("/").pop(), a = i ? `${n.contentDispositionType}; filename="${i}"` : n.contentDispositionType;
    s.set("Content-Disposition", a);
  }
  e.headers.has("Cache-Control") || s.set("Cache-Control", `public, max-age=${n?.minimumCacheTTL ?? 60}`);
  let r = S(e);
  return _(r.headers, s), r;
}
__name(he, "he");
async function G(e, { buildOutput: t, assetsFetcher: n, imagesConfig: s }) {
  let r = de(e, s);
  if (!r)
    return new Response("Invalid image resizing request", { status: 400 });
  let { isRelative: i, imageUrl: a } = r, c = await (i && a.pathname in t ? n.fetch.bind(n) : fetch)(a);
  return he(c, a, s);
}
__name(G, "G");
u();
l();
p();
u();
l();
p();
var fe = "x-vercel-cache-tags";
var me = "x-next-cache-soft-tags";
var ge = Symbol.for("__cloudflare-request-context__");
async function K(e) {
  let t = `https://${b}/v1/suspense-cache/`;
  if (!e.url.startsWith(t))
    return null;
  try {
    let n = new URL(e.url), s = await ye();
    if (n.pathname === "/v1/suspense-cache/revalidate") {
      let i = n.searchParams.get("tags")?.split(",") ?? [];
      for (let a of i)
        await s.revalidateTag(a);
      return new Response(null, { status: 200 });
    }
    let r = n.pathname.replace("/v1/suspense-cache/", "");
    if (!r.length)
      return new Response("Invalid cache key", { status: 400 });
    switch (e.method) {
      case "GET": {
        let i = z(e, me), a = await s.get(r, { softTags: i });
        return a ? new Response(JSON.stringify(a.value), { status: 200, headers: { "Content-Type": "application/json", "x-vercel-cache-state": "fresh", age: `${(Date.now() - (a.lastModified ?? Date.now())) / 1e3}` } }) : new Response(null, { status: 404 });
      }
      case "POST": {
        let i = globalThis[ge], a = /* @__PURE__ */ __name(async () => {
          let o = await e.json();
          o.data.tags === void 0 && (o.tags ??= z(e, fe) ?? []), await s.set(r, o);
        }, "a");
        return i ? i.ctx.waitUntil(a()) : await a(), new Response(null, { status: 200 });
      }
      default:
        return new Response(null, { status: 405 });
    }
  } catch (n) {
    return console.error(n), new Response("Error handling cache request", { status: 500 });
  }
}
__name(K, "K");
async function ye() {
  return process.env.__NEXT_ON_PAGES__KV_SUSPENSE_CACHE ? W("kv") : W("cache-api");
}
__name(ye, "ye");
async function W(e) {
  let t = await import(`./__next-on-pages-dist__/cache/${e}.js`);
  return new t.default();
}
__name(W, "W");
function z(e, t) {
  return e.headers.get(t)?.split(",")?.filter(Boolean);
}
__name(z, "z");
function Z() {
  globalThis[J] || (_e(), globalThis[J] = true);
}
__name(Z, "Z");
function _e() {
  let e = globalThis.fetch;
  globalThis.fetch = async (...t) => {
    let n = new Request(...t), s = await xe(n);
    return s || (s = await K(n), s) ? s : (we(n), e(n));
  };
}
__name(_e, "_e");
async function xe(e) {
  if (e.url.startsWith("blob:"))
    try {
      let n = (await import(`./__next-on-pages-dist__/assets/${new URL(e.url).pathname}.bin`)).default, s = { async arrayBuffer() {
        return n;
      }, get body() {
        return new ReadableStream({ start(r) {
          let i = Buffer.from(n);
          r.enqueue(i), r.close();
        } });
      }, async text() {
        return Buffer.from(n).toString();
      }, async json() {
        let r = Buffer.from(n);
        return JSON.stringify(r.toString());
      }, async blob() {
        return new Blob(n);
      } };
      return s.clone = () => ({ ...s }), s;
    } catch {
    }
  return null;
}
__name(xe, "xe");
function we(e) {
  e.headers.has("user-agent") || e.headers.set("user-agent", "Next.js Middleware");
}
__name(we, "we");
var J = Symbol.for("next-on-pages fetch patch");
u();
l();
p();
var Q = V(X());
var M = /* @__PURE__ */ __name(class {
  constructor(t, n, s, r, i) {
    this.routes = t;
    this.output = n;
    this.reqCtx = s;
    this.url = new URL(s.request.url), this.cookies = (0, Q.parse)(s.request.headers.get("cookie") || ""), this.path = this.url.pathname || "/", this.headers = { normal: new Headers(), important: new Headers() }, this.searchParams = new URLSearchParams(), x(this.searchParams, this.url.searchParams), this.checkPhaseCounter = 0, this.middlewareInvoked = [], this.wildcardMatch = i?.find((a) => a.domain === this.url.hostname), this.locales = new Set(r.collectedLocales);
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
  checkRouteMatch(t, { checkStatus: n, checkIntercept: s }) {
    let r = C(t.src, this.path, t.caseSensitive);
    if (!r.match || t.methods && !t.methods.map((a) => a.toUpperCase()).includes(this.reqCtx.request.method.toUpperCase()))
      return;
    let i = { url: this.url, cookies: this.cookies, headers: this.reqCtx.request.headers, routeDest: t.dest };
    if (!t.has?.find((a) => {
      let o = I(a, i);
      return o.newRouteDest && (i.routeDest = o.newRouteDest), !o.valid;
    }) && !t.missing?.find((a) => I(a, i).valid) && !(n && t.status !== this.status)) {
      if (s && t.dest) {
        let a = /\/(\(\.+\))+/, o = a.test(t.dest), c = a.test(this.path);
        if (o && !c)
          return;
      }
      return { routeMatch: r, routeDest: i.routeDest };
    }
  }
  processMiddlewareResp(t) {
    let n = "x-middleware-override-headers", s = t.headers.get(n);
    if (s) {
      let c = new Set(s.split(",").map((d) => d.trim()));
      for (let d of c.keys()) {
        let h = `x-middleware-request-${d}`, y = t.headers.get(h);
        this.reqCtx.request.headers.get(d) !== y && (y ? this.reqCtx.request.headers.set(d, y) : this.reqCtx.request.headers.delete(d)), t.headers.delete(h);
      }
      t.headers.delete(n);
    }
    let r = "x-middleware-rewrite", i = t.headers.get(r);
    if (i) {
      let c = new URL(i, this.url), d = this.url.hostname !== c.hostname;
      this.path = d ? `${c}` : c.pathname, x(this.searchParams, c.searchParams), t.headers.delete(r);
    }
    let a = "x-middleware-next";
    t.headers.get(a) ? t.headers.delete(a) : !i && !t.headers.has("location") ? (this.body = t.body, this.status = t.status) : t.headers.has("location") && t.status >= 300 && t.status < 400 && (this.status = t.status), _(this.reqCtx.request.headers, t.headers), _(this.headers.normal, t.headers), this.headers.middlewareLocation = t.headers.get("location");
  }
  async runRouteMiddleware(t) {
    if (!t)
      return true;
    let n = t && this.output[t];
    if (!n || n.type !== "middleware")
      return this.status = 500, false;
    let s = await k(n, this.reqCtx, { path: this.path, searchParams: this.searchParams, headers: this.headers, status: this.status });
    return this.middlewareInvoked.push(t), s.status === 500 ? (this.status = s.status, false) : (this.processMiddlewareResp(s), true);
  }
  applyRouteOverrides(t) {
    !t.override || (this.status = void 0, this.headers.normal = new Headers(), this.headers.important = new Headers());
  }
  applyRouteHeaders(t, n, s) {
    !t.headers || (_(this.headers.normal, t.headers, { match: n, captureGroupKeys: s }), t.important && _(this.headers.important, t.headers, { match: n, captureGroupKeys: s }));
  }
  applyRouteStatus(t) {
    !t.status || (this.status = t.status);
  }
  applyRouteDest(t, n, s) {
    if (!t.dest)
      return this.path;
    let r = this.path, i = t.dest;
    this.wildcardMatch && /\$wildcard/.test(i) && (i = i.replace(/\$wildcard/g, this.wildcardMatch.value)), this.path = P(i, n, s);
    let a = /\/index\.rsc$/i.test(this.path), o = /^\/(?:index)?$/i.test(r), c = /^\/__index\.prefetch\.rsc$/i.test(r);
    a && !o && !c && (this.path = r);
    let d = /\.rsc$/i.test(this.path), h = /\.prefetch\.rsc$/i.test(this.path), y = this.path in this.output;
    d && !h && !y && (this.path = this.path.replace(/\.rsc/i, ""));
    let R = new URL(this.path, this.url);
    return x(this.searchParams, R.searchParams), v(this.path) || (this.path = R.pathname), r;
  }
  applyLocaleRedirects(t) {
    if (!t.locale?.redirect || !/^\^(.)*$/.test(t.src) && t.src !== this.path || this.headers.normal.has("location"))
      return;
    let { locale: { redirect: s, cookie: r } } = t, i = r && this.cookies[r], a = L(i ?? ""), o = L(this.reqCtx.request.headers.get("accept-language") ?? ""), h = [...a, ...o].map((y) => s[y]).filter(Boolean)[0];
    if (h) {
      !this.path.startsWith(h) && (this.headers.normal.set("location", h), this.status = 307);
      return;
    }
  }
  getLocaleFriendlyRoute(t, n) {
    return !this.locales || n !== "miss" ? t : B(t.src, this.locales) ? { ...t, src: t.src.replace(/\/\(\.\*\)\$$/, "(?:/(.*))?$") } : t;
  }
  async checkRoute(t, n) {
    let s = this.getLocaleFriendlyRoute(n, t), { routeMatch: r, routeDest: i } = this.checkRouteMatch(s, { checkStatus: t === "error", checkIntercept: t === "rewrite" }) ?? {}, a = { ...s, dest: i };
    if (!r?.match || a.middlewarePath && this.middlewareInvoked.includes(a.middlewarePath))
      return "skip";
    let { match: o, captureGroupKeys: c } = r;
    if (this.applyRouteOverrides(a), this.applyLocaleRedirects(a), !await this.runRouteMiddleware(a.middlewarePath))
      return "error";
    if (this.body !== void 0 || this.headers.middlewareLocation)
      return "done";
    this.applyRouteHeaders(a, o, c), this.applyRouteStatus(a);
    let h = this.applyRouteDest(a, o, c);
    if (a.check && !v(this.path))
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
    return !a.continue || a.status && a.status >= 300 && a.status <= 399 ? "done" : "next";
  }
  async checkPhase(t) {
    if (this.checkPhaseCounter++ >= 50)
      return console.error(`Routing encountered an infinite loop while checking ${this.url.pathname}`), this.status = 500, "error";
    this.middlewareInvoked = [];
    let n = true;
    for (let i of this.routes[t]) {
      let a = await this.checkRoute(t, i);
      if (a === "error")
        return "error";
      if (a === "done") {
        n = false;
        break;
      }
    }
    if (t === "hit" || v(this.path) || this.headers.normal.has("location") || !!this.body)
      return "done";
    if (t === "none")
      for (let i of this.locales) {
        let a = new RegExp(`/${i}(/.*)`), c = this.path.match(a)?.[1];
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
    return s || t === "miss" || t === "error" ? r = "hit" : n && (r = O(t)), this.checkPhase(r);
  }
  async run(t = "none") {
    this.checkPhaseCounter = 0;
    let n = await this.checkPhase(t);
    return this.headers.normal.has("location") && (!this.status || this.status < 300 || this.status >= 400) && (this.status = 307), n;
  }
}, "M");
async function Y(e, t, n, s) {
  let r = new M(t.routes, n, e, s, t.wildcard), i = await ee(r);
  return Ee(e, i, n);
}
__name(Y, "Y");
async function ee(e, t = "none", n = false) {
  return await e.run(t) === "error" || !n && e.status && e.status >= 400 ? ee(e, "error", true) : { path: e.path, status: e.status, headers: e.headers, searchParams: e.searchParams, body: e.body };
}
__name(ee, "ee");
async function Ee(e, { path: t = "/404", status: n, headers: s, searchParams: r, body: i }, a) {
  let o = s.normal.get("location");
  if (o) {
    if (o !== s.middlewareLocation) {
      let h = [...r.keys()].length ? `?${r.toString()}` : "";
      s.normal.set("location", `${o ?? "/"}${h}`);
    }
    return new Response(null, { status: n, headers: s.normal });
  }
  let c;
  if (i !== void 0)
    c = new Response(i, { status: n });
  else if (v(t)) {
    let h = new URL(t);
    x(h.searchParams, r), c = await fetch(h, e.request);
  } else
    c = await k(a[t], e, { path: t, status: n, headers: s, searchParams: r });
  let d = s.normal;
  return _(d, c.headers), _(d, s.important), c = new Response(c.body, { ...c, status: n || c.status, headers: d }), c;
}
__name(Ee, "Ee");
u();
l();
p();
function te() {
  globalThis.__nextOnPagesRoutesIsolation ??= { _map: /* @__PURE__ */ new Map(), getProxyFor: Me };
}
__name(te, "te");
function Me(e) {
  let t = globalThis.__nextOnPagesRoutesIsolation._map.get(e);
  if (t)
    return t;
  let n = je();
  return globalThis.__nextOnPagesRoutesIsolation._map.set(e, n), n;
}
__name(Me, "Me");
function je() {
  let e = /* @__PURE__ */ new Map();
  return new Proxy(globalThis, { get: (t, n) => e.has(n) ? e.get(n) : Reflect.get(globalThis, n), set: (t, n, s) => Te.has(n) ? Reflect.set(globalThis, n, s) : (e.set(n, s), true) });
}
__name(je, "je");
var Te = /* @__PURE__ */ new Set(["_nextOriginalFetch", "fetch", "__incrementalCache"]);
var ms = { async fetch(e, t, n) {
  te(), Z();
  let s = await __ALSes_PROMISE__;
  if (!s) {
    let a = new URL(e.url), o = await t.ASSETS.fetch(`${a.protocol}//${a.host}/cdn-cgi/errors/no-nodejs_compat.html`), c = o.ok ? o.body : "Error: Could not access built-in Node.js modules. Please make sure that your Cloudflare Pages project has the 'nodejs_compat' compatibility flag set.";
    return new Response(c, { status: 503 });
  }
  let { envAsyncLocalStorage: r, requestContextAsyncLocalStorage: i } = s;
  return r.run({ ...t, NODE_ENV: "production", SUSPENSE_CACHE_URL: b }, async () => i.run({ env: t, ctx: n, cf: e.cf }, async () => {
    if (new URL(e.url).pathname.startsWith("/_next/image"))
      return G(e, { buildOutput: m, assetsFetcher: t.ASSETS, imagesConfig: f.images });
    let o = D(e);
    return Y({ request: o, ctx: n, assetsFetcher: t.ASSETS }, f, m, g);
  }));
} };
export {
  ms as default
};
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
//# sourceMappingURL=bundledWorker-0.028789914287618013.mjs.map
