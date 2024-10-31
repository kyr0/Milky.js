
var Module = (() => {
  var _scriptName = import.meta.url;
  
  return (
async function(moduleArg = {}) {
  var moduleRtn;

// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = moduleArg;

// Set up the promise that indicates the Module is initialized
var readyPromiseResolve, readyPromiseReject;
var readyPromise = new Promise((resolve, reject) => {
  readyPromiseResolve = resolve;
  readyPromiseReject = reject;
});

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts == 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string' && process.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // `require()` is no-op in an ESM module, use `createRequire()` to construct
  // the require()` function.  This is only necessary for multi-environment
  // builds, `-sENVIRONMENT=node` emits a static import declaration instead.
  // TODO: Swap all `require()`'s with `import()`'s?
  const { createRequire } = await import('module');
  let dirname = import.meta.url;
  if (dirname.startsWith("data:")) {
    dirname = '/';
  }
  /** @suppress{duplicate} */
  var require = createRequire(dirname);

}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {

  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('fs');
  var nodePath = require('path');

  // EXPORT_ES6 + ENVIRONMENT_IS_NODE always requires use of import.meta.url,
  // since there's no way getting the current absolute path of the module when
  // support for that is not available.
  if (!import.meta.url.startsWith('data:')) {
    scriptDirectory = nodePath.dirname(require('url').fileURLToPath(import.meta.url)) + '/';
  }

// include: node_shell_read.js
readBinary = (filename) => {
  // We need to re-wrap `file://` strings to URLs. Normalizing isn't
  // necessary in that case, the path should already be absolute.
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  var ret = fs.readFileSync(filename);
  return ret;
};

readAsync = (filename, binary = true) => {
  // See the comment in the `readBinary` function.
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  return new Promise((resolve, reject) => {
    fs.readFile(filename, binary ? undefined : 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(binary ? data.buffer : data);
    });
  });
};
// end include: node_shell_read.js
  if (!Module['thisProgram'] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, '/');
  }

  arguments_ = process.argv.slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here

  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // When MODULARIZE, this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptName) {
    scriptDirectory = _scriptName;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.startsWith('blob:')) {
    scriptDirectory = '';
  } else {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/')+1);
  }

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = (url) => {
    // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
    // See https://github.com/github/fetch/pull/92#issuecomment-140665932
    // Cordova or Electron apps are typically loaded from a file:// url.
    // So use XHR on webview if URL is a file URL.
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    return fetch(url, { credentials: 'same-origin' })
      .then((response) => {
        if (response.ok) {
          return response.arrayBuffer();
        }
        return Promise.reject(new Error(response.status + ' : ' + response.url));
      })
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];

if (Module['thisProgram']) thisProgram = Module['thisProgram'];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary = Module['wasmBinary'];

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    // This build was created without ASSERTIONS defined.  `assert()` should not
    // ever be called in this configuration but in case there are callers in
    // the wild leave this simple abort() implementation here for now.
    abort(text);
  }
}

// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

// include: runtime_shared.js
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

// end include: runtime_shared.js
// include: runtime_stack_check.js
// end include: runtime_stack_check.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  runtimeInitialized = true;

  
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;

  Module['monitorRunDependencies']?.(runDependencies);

}

function removeRunDependency(id) {
  runDependencies--;

  Module['monitorRunDependencies']?.(runDependencies);

  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  Module['onAbort']?.(what);

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  what += '. Build with -sASSERTIONS for more info.';

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  readyPromiseReject(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');
// end include: URIUtils.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
function findWasmBinary() {
  if (Module['locateFile']) {
    var f = 'video.wasm';
    if (!isDataURI(f)) {
      return locateFile(f);
    }
    return f;
  }
  // Use bundler-friendly `new URL(..., import.meta.url)` pattern; works in browsers too.
  return new URL('video.wasm', import.meta.url).href;
}


const dataUrlToUint8Array = (dataUrl) => {
  // extract the base64 encoded part from the data URL
  const base64String = dataUrl.split(',')[1];
  
  // decode the base64 string into a binary string
  const binaryString = atob(base64String);

  // create a Uint8Array from the binary string
  const binaryLength = binaryString.length;
  const bytes = new Uint8Array(binaryLength);
  
  for (let i = 0; i < binaryLength; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};
var wasmBinaryFile = 'data:application/octet-stream;base64,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KAIkNgIkIAIgASgCKDYCKCACIAEoAiw2AiwgAiABKAIwNgIwIAIgASgCNDYCNCACIAEoAjg2AjggAiABKAI8NgI8IAFBQGshASACQUBrIgIgAE0NAAsLIAIgBE8NAQNAIAIgASgCADYCACABQQRqIQEgAkEEaiICIARJDQALDAELIANBBEkEQCAAIQIMAQsgA0EEayIEIABJBEAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCyACIANJBEADQCACIAEtAAA6AAAgAUEBaiEBIAJBAWoiAiADRw0ACwsL8gICAn8BfgJAIAJFDQAgACABOgAAIAAgAmoiA0EBayABOgAAIAJBA0kNACAAIAE6AAIgACABOgABIANBA2sgAToAACADQQJrIAE6AAAgAkEHSQ0AIAAgAToAAyADQQRrIAE6AAAgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALWQEBfyAAIAAoAkgiAUEBayABcjYCSCAAKAIAIgFBCHEEQCAAIAFBIHI2AgBBfw8LIABCADcCBCAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQQQAL2QIBB38jAEEgayIDJAAgAyAAKAIcIgQ2AhAgACgCFCEFIAMgAjYCHCADIAE2AhggAyAFIARrIgE2AhQgASACaiEGIANBEGohBEECIQcCfwJAAkACQCAAKAI8IANBEGpBAiADQQxqEAEQFgRAIAQhBQwBCwNAIAYgAygCDCIBRg0CIAFBAEgEQCAEIQUMBAsgBCABIAQoAgQiCEsiCUEDdGoiBSABIAhB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BQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRBgALC4gBAgN/AX4CQCAAQoCAgIAQVARAIAAhBQwBCwNAIAFBAWsiASAAIABCCoAiBUIKfn2nQTByOgAAIABC/////58BViECIAUhACACDQALCyAFQgBSBEAgBachAgNAIAFBAWsiASACIAJBCm4iA0EKbGtBMHI6AAAgAkEJSyEEIAMhAiAEDQALCyABC2sBAX8jAEGAAmsiBSQAAkAgAiADTA0AIARBgMAEcQ0AIAUgASACIANrIgNBgAIgA0GAAkkiAhsQBhogAkUEQANAIAAgBUGAAhAOIANBgAJrIgNB/wFLDQALCyAAIAUgAxAOCyAFQYACaiQAC4wYAxJ/AXwDfiMAQbAEayIMJAAgDEEANgIsAkAgAb0iGUIAUwRAQQEhEUGKCCETIAGaIgG9IRkMAQsgBEGAEHEEQEEBIRFBjQghEwwBC0GQCEGLCCAEQQFxIhEbIRMgEUUhFwsCQCAZQoCAgICAgID4/wCDQoCAgICAgID4/wBRBEAgAEEgIAIgEUEDaiIGIARB//97cRASIAAgEyAREA4gAEGACUGbCiAFQSBxIgcbQbIJQZ8KIAcbIAEgAWIbQQMQDiAAQSAgAiAGIARBgMAAcxASIAIgBiACIAZKGyEJDAELIAxBEGohEgJAAn8CQCABIAxBLGoQCyIBIAGgIgFEAAAAAAAAAABiBEAgDCAMKAIsIgZBAWs2AiwgBUEgciIVQeEARw0BDAMLIAVBIHIiFUHhAEYNAiAMKAIsIRRBBiADIANBAEgbDAELIAwgBkEdayIUNgIsIAFEAAAAAAAAsEGiIQFBBiADIANBAEgbCyELIAxBMGpBoAJBACAUQQBOG2oiDyEHA0AgBwJ/IAFEAAAAAAAA8EFjIAFEAAAAAAAAAABmcQRAIAGrDAELQQALIgY2AgAgB0EEaiEHIAEgBrihRAAAAABlzc1BoiIBRAAAAAAAAAAAYg0ACwJAIBRBAEwEQCAUIQMgByEGIA8hCAwBCyAPIQggFCEDA0BBHSADIANBHU8bIQMCQCAHQQRrIgYgCEkNACADrSEbQgAhGQNAIAYgGUL/////D4MgBjUCACAbhnwiGiAaQoCU69wDgCIZQoCU69wDfn0+AgAgBkEEayIGIAhPDQALIBpCgJTr3ANUDQAgCEEEayIIIBk+AgALA0AgCCAHIgZJBEAgBkEEayIHKAIARQ0BCwsgDCAMKAIsIANrIgM2AiwgBiEHIANBAEoNAAsLIANBAEgEQCALQRlqQQluQQFqIRAgFUHmAEYhFgNAQQlBACADayIHIAdBCU8bIQoCQCAGIAhNBEAgCCgCAEVBAnQhBwwBC0GAlOvcAyAKdiENQX8gCnRBf3MhDkEAIQMgCCEHA0AgByAHKAIAIgkgCnYgA2o2AgAgCSAOcSANbCEDIAdBBGoiByAGSQ0ACyAIKAIARUECdCEHIANFDQAgBiADNgIAIAZBBGohBgsgDCAMKAIsIApqIgM2AiwgDyAHIAhqIgggFhsiByAQQQJ0aiAGIAYgB2tBAnUgEEobIQYgA0EASA0ACwtBACEDAkAgBiAITQ0AIA8gCGtBAnVBCWwhA0EKIQcgCCgCACIJQQpJDQADQCADQQFqIQMgCSAHQQpsIgdPDQALCyALIANBACAVQeYARxtrIBVB5wBGIAtBAEdxayIHIAYgD2tBAnVBCWxBCWtIBEAgDEEwakGEYEGkYiAUQQBIG2ogB0GAyABqIglBCW0iDUECdGohCkEKIQcgCSANQQlsayIJQQdMBEADQCAHQQpsIQcgCUEBaiIJQQhHDQALCwJAIAooAgAiCSAJIAduIhAgB2xrIg1FIApBBGoiDiAGRnENAAJAIBBBAXFFBEBEAAAAAAAAQEMhASAHQYCU69wDRw0BIAggCk8NASAKQQRrLQAAQQFxRQ0BC0QBAAAAAABAQyEBC0QAAAAAAADgP0QAAAAAAADwP0QAAAAAAAD4PyAGIA5GG0QAAAAAAAD4PyANIAdBAXYiDkYbIA0gDkkbIRgCQCAXDQAgEy0AAEEtRw0AIBiaIRggAZohAQsgCiAJIA1rIgk2AgAgASAYoCABYQ0AIAogByAJaiIHNgIAIAdBgJTr3ANPBEADQCAKQQA2AgAgCCAKQQRrIgpLBEAgCEEEayIIQQA2AgALIAogCigCAEEBaiIHNgIAIAdB/5Pr3ANLDQALCyAPIAhrQQJ1QQlsIQNBCiEHIAgoAgAiCUEKSQ0AA0AgA0EBaiEDIAkgB0EKbCIHTw0ACwsgCkEEaiIHIAYgBiAHSxshBgsDQCAGIgcgCE0iCUUEQCAGQQRrIgYoAgBFDQELCwJAIBVB5wBHBEAgBEEIcSEKDAELIANBf3NBfyALQQEgCxsiBiADSiADQXtKcSIKGyAGaiELQX9BfiAKGyAFaiEFIARBCHEiCg0AQXchBgJAIAkNACAHQQRrKAIAIgpFDQBBCiEJQQAhBiAKQQpwDQADQCAGIg1BAWohBiAKIAlBCmwiCXBFDQALIA1Bf3MhBgsgByAPa0ECdUEJbCEJIAVBX3FBxgBGBEBBACEKIAsgBiAJakEJayIGQQAgBkEAShsiBiAGIAtKGyELDAELQQAhCiALIAMgCWogBmpBCWsiBkEAIAZBAEobIgYgBiALShshCwtBfyEJIAtB/f///wdB/v///wcgCiALciING0oNASALIA1BAEdqQQFqIQ4CQCAFQV9xIhZBxgBGBEAgAyAOQf////8Hc0oNAyADQQAgA0EAShshBgwBCyASIAMgA0EfdSIGcyAGa60gEhARIgZrQQFMBEADQCAGQQFrIgZBMDoAACASIAZrQQJIDQALCyAGQQJrIhAgBToAACAGQQFrQS1BKyADQQBIGzoAACASIBBrIgYgDkH/////B3NKDQILIAYgDmoiBiARQf////8Hc0oNASAAQSAgAiAGIBFqIg4gBBASIAAgEyAREA4gAEEwIAIgDiAEQYCABHMQEgJAAkACQCAWQcYARgRAIAxBEGpBCXIhAyAPIAggCCAPSxsiCSEIA0AgCDUCACADEBEhBgJAIAggCUcEQCAGIAxBEGpNDQEDQCAGQQFrIgZBMDoAACAGIAxBEGpLDQALDAELIAMgBkcNACAGQQFrIgZBMDoAAAsgACAGIAMgBmsQDiAIQQRqIgggD00NAAsgDQRAIABB6ApBARAOCyAHIAhNDQEgC0EATA0BA0AgCDUCACADEBEiBiAMQRBqSwRAA0AgBkEBayIGQTA6AAAgBiAMQRBqSw0ACwsgACAGQQkgCyALQQlOGxAOIAtBCWshBiAIQQRqIgggB08NAyALQQlKIQkgBiELIAkNAAsMAgsCQCALQQBIDQAgByAIQQRqIAcgCEsbIQ0gDEEQakEJciEDIAghBwNAIAMgBzUCACADEBEiBkYEQCAGQQFrIgZBMDoAAAsCQCAHIAhHBEAgBiAMQRBqTQ0BA0AgBkEBayIGQTA6AAAgBiAMQRBqSw0ACwwBCyAAIAZBARAOIAZBAWohBiAKIAtyRQ0AIABB6ApBARAOCyAAIAYgAyAGayIJIAsgCSALSBsQDiALIAlrIQsgB0EEaiIHIA1PDQEgC0EATg0ACwsgAEEwIAtBEmpBEkEAEBIgACAQIBIgEGsQDgwCCyALIQYLIABBMCAGQQlqQQlBABASCyAAQSAgAiAOIARBgMAAcxASIAIgDiACIA5KGyEJDAELIBMgBUEadEEfdUEJcWohDgJAIANBC0sNAEEMIANrIQZEAAAAAAAAMEAhGANAIBhEAAAAAAAAMECiIRggBkEBayIGDQALIA4tAABBLUYEQCAYIAGaIBihoJohAQwBCyABIBigIBihIQELIBIgDCgCLCIHIAdBH3UiBnMgBmutIBIQESIGRgRAIAZBAWsiBkEwOgAAIAwoAiwhBwsgEUECciEKIAVBIHEhCCAGQQJrIg0gBUEPajoAACAGQQFrQS1BKyAHQQBIGzoAACAEQQhxIQkgDEEQaiEHA0AgByIGAn8gAZlEAAAAAAAA4EFjBEAgAaoMAQtBgICAgHgLIgdB8A5qLQAAIAhyOgAAIAEgB7ehRAAAAAAAADBAoiEBAkAgBkEBaiIHIAxBEGprQQFHDQACQCAJDQAgA0EASg0AIAFEAAAAAAAAAABhDQELIAZBLjoAASAGQQJqIQcLIAFEAAAAAAAAAABiDQALQX8hCSADQf3///8HIAogEiANayIIaiIQa0oNACAAQSAgAiAQIANBAmogByAMQRBqayIGIAZBAmsgA0gbIAYgAxsiA2oiByAEEBIgACAOIAoQDiAAQTAgAiAHIARBgIAEcxASIAAgDEEQaiAGEA4gAEEwIAMgBmtBAEEAEBIgACANIAgQDiAAQSAgAiAHIARBgMAAcxASIAIgByACIAdKGyEJCyAMQbAEaiQAIAkLrQUCBn4EfyABIAEoAgBBB2pBeHEiAUEQajYCACAAIAEpAwAhAiABKQMIIQYjAEEgayIBJAAgBkL///////8/gyEDAn4gBkIwiEL//wGDIgSnIgBBgfgAa0H9D00EQCADQgSGIAJCPIiEIQMgAEGA+ABrrSEEAkAgAkL//////////w+DIgJCgYCAgICAgIAIWgRAIANCAXwhAwwBCyACQoCAgICAgICACFINACADQgGDIAN8IQMLQgAgAyADQv////////8HViIAGyECIACtIAR8DAELAkAgAiADhFANACAEQv//AVINACADQgSGIAJCPIiEQoCAgICAgIAEhCECQv8PDAELIABB/ocBSwRAQgAhAkL/DwwBC0GA+ABBgfgAIARQIggbIgsgAGsiCUHwAEoEQEIAIQJCAAwBCyABQRBqIQogAiEEIAMgA0KAgICAgIDAAIQgCBsiAyEFAkBBgAEgCWsiCEHAAHEEQCACIAhBQGqthiEFQgAhBAwBCyAIRQ0AIAUgCK0iB4YgBEHAACAIa62IhCEFIAQgB4YhBAsgCiAENwMAIAogBTcDCAJAIAlBwABxBEAgAyAJQUBqrYghAkIAIQMMAQsgCUUNACADQcAAIAlrrYYgAiAJrSIEiIQhAiADIASIIQMLIAEgAjcDACABIAM3AwggASkDCEIEhiABKQMAIgNCPIiEIQICQCAAIAtHIAEpAxAgASkDGIRCAFJxrSADQv//////////D4OEIgNCgYCAgICAgIAIWgRAIAJCAXwhAgwBCyADQoCAgICAgICACFINACACQgGDIAJ8IQILIAJCgICAgICAgAiFIAIgAkL/////////B1YiABshAiAArQsh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CQBBkw4LARQAQZ8OCxUXAAAAABcAAAAACRQAAAAAABQAABQAQc0OCwEWAEHZDgsnFQAAAAAVAAAAAAkWAAAAAAAWAAAWAAAwMTIzNDU2Nzg5QUJDREVGAEGADwuCAaoEAAB1BAAALwQAACMEAAD7BAAA0wQAAEUEAABoBAAAmgQAAFYFAAA+BQAAJgUAACMFAAANBQAABwUAAM4EAAATBQAAWQUAAEEFAAApBQAAjQQAAOIEAADvBAAAUwUAADsFAAAdBAAAhAQAAFAFAAA4BQAAPgQAAMkEAABfBAAAVgQAQYARCwEFAEGMEQsBAQBBpBELDgIAAAADAAAAyNIAAAAEAEG8EQsBAQBBzBELBf////8KAEGQEgsDgNkBAOsFBG5hbWUACwp2aWRlby53YXNtAfEDHwAVX2Vtc2NyaXB0ZW5fbWVtY3B5X2pzAQ9fX3dhc2lfZmRfd3JpdGUCFmVtc2NyaXB0ZW5fcmVzaXplX2hlYXADEV9fd2FzbV9jYWxsX2N0b3JzBAZyZW5kZXIFCF9fbWVtY3B5BghfX21lbXNldAcJX190b3dyaXRlCA1fX3N0ZGlvX3dyaXRlCRlfX2Vtc2NyaXB0ZW5fc3Rkb3V0X2Nsb3NlChhfX2Vtc2NyaXB0ZW5fc3Rkb3V0X3NlZWsLBWZyZXhwDBNfX3ZmcHJpbnRmX2ludGVybmFsDQtwcmludGZfY29yZQ4Db3V0DwZnZXRpbnQQB3BvcF9hcmcRBWZtdF91EgNwYWQTBmZtdF9mcBQTcG9wX2FyZ19sb25nX2RvdWJsZRUIc25fd3JpdGUWEl9fd2FzaV9zeXNjYWxsX3JldBcGd2N0b21iGBlfZW1zY3JpcHRlbl9zdGFja19yZXN0b3JlGRdfZW1zY3JpcHRlbl9zdGFja19hbGxvYxocZW1zY3JpcHRlbl9zdGFja19nZXRfY3VycmVudBsEc2JyaxwZZW1zY3JpcHRlbl9idWlsdGluX21hbGxvYx0XZW1zY3JpcHRlbl9idWlsdGluX2ZyZWUeFmxlZ2Fsc3R1YiRkeW5DYWxsX2ppamkHEgEAD19fc3RhY2tfcG9pbnRlcgnOARQABy5yb2RhdGEBCS5yb2RhdGEuMQIJLnJvZGF0YS4yAwkucm9kYXRhLjMECS5yb2RhdGEuNAUJLnJvZGF0YS41Bgkucm9kYXRhLjYHCS5yb2RhdGEuNwgJLnJvZGF0YS44CQkucm9kYXRhLjkKCi5yb2RhdGEuMTALCi5yb2RhdGEuMTEMCi5yb2RhdGEuMTINBS5kYXRhDgcuZGF0YS4xDwcuZGF0YS4yEAcuZGF0YS4zEQcuZGF0YS40EgcuZGF0YS41EwcuZGF0YS42ACAQc291cmNlTWFwcGluZ1VSTA52aWRlby53YXNtLm1hcA==';
wasmBinary = dataUrlToUint8Array(wasmBinaryFile);


function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw 'both async and sync fetching of the wasm failed';
}

function getBinaryPromise(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary
      ) {
    // Fetch the binary using readAsync
    return readAsync(binaryFile).then(
      (response) => new Uint8Array(/** @type{!ArrayBuffer} */(response)),
      // Fall back to getBinarySync if readAsync fails
      () => getBinarySync(binaryFile)
    );
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile).then((binary) => {
    return WebAssembly.instantiate(binary, imports);
  }).then(receiver, (reason) => {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    abort(reason);
  });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
  if (!binary &&
      typeof WebAssembly.instantiateStreaming == 'function' &&
      !isDataURI(binaryFile) &&
      // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
      !isFileURI(binaryFile) &&
      // Avoid instantiateStreaming() on Node.js environment for now, as while
      // Node.js v18.1.0 implements it, it does not have a full fetch()
      // implementation yet.
      //
      // Reference:
      //   https://github.com/emscripten-core/emscripten/pull/16917
      !ENVIRONMENT_IS_NODE &&
      typeof fetch == 'function') {
    return fetch(binaryFile, { credentials: 'same-origin' }).then((response) => {
      // Suppress closure warning here since the upstream definition for
      // instantiateStreaming only allows Promise<Repsponse> rather than
      // an actual Response.
      // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure is fixed.
      /** @suppress {checkTypes} */
      var result = WebAssembly.instantiateStreaming(response, imports);

      return result.then(
        callback,
        function(reason) {
          // We expect the most common failure cause to be a bad MIME type for the binary,
          // in which case falling back to ArrayBuffer instantiation should work.
          err(`wasm streaming compile failed: ${reason}`);
          err('falling back to ArrayBuffer instantiation');
          return instantiateArrayBuffer(binaryFile, imports, callback);
        });
    });
  }
  return instantiateArrayBuffer(binaryFile, imports, callback);
}

function getWasmImports() {
  // prepare imports
  return {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  }
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  var info = getWasmImports();
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    updateMemoryViews();

    addOnInit(wasmExports['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    receiveInstance(result['instance']);
  }

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {
    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
        // If instantiation fails, reject the module ready promise.
        readyPromiseReject(e);
    }
  }

  wasmBinaryFile ??= findWasmBinary();

  // If instantiation fails, reject the module ready promise.
  instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
  return {}; // no exports yet; we'll fill them in later
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// include: runtime_debug.js
// end include: runtime_debug.js
// === Body ===
// end include: preamble.js


  /** @constructor */
  function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': abort('to do getValue(i64) use WASM_BIGINT');
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = Module['noExitRuntime'] || true;

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': abort('to do setValue(i64) use WASM_BIGINT');
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

  var getHeapMax = () =>
      HEAPU8.length;
  
  var alignMemory = (size, alignment) => {
      return Math.ceil(size / alignment) * alignment;
    };
  
  var abortOnCannotGrowMemory = (requestedSize) => {
      abort('OOM');
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      abortOnCannotGrowMemory(requestedSize);
    };

  var printCharBuffers = [null,[],[]];
  
  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream];
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };
  
  var flush_NO_FILESYSTEM = () => {
      // flush anything remaining in the buffers during shutdown
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    };
  
  
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead) => {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    };
  var SYSCALLS = {
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var _fd_write = (fd, iov, iovcnt, pnum) => {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    };
var wasmImports = {
  /** @export */
  _emscripten_memcpy_js: __emscripten_memcpy_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  fd_write: _fd_write
};
var wasmExports = createWasm();
var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports['__wasm_call_ctors'])();
var _render = Module['_render'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) => (_render = Module['_render'] = wasmExports['render'])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
var _malloc = Module['_malloc'] = (a0) => (_malloc = Module['_malloc'] = wasmExports['malloc'])(a0);
var _free = Module['_free'] = (a0) => (_free = Module['_free'] = wasmExports['free'])(a0);
var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports['_emscripten_stack_restore'])(a0);
var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'])();
var dynCall_jiji = Module['dynCall_jiji'] = (a0, a1, a2, a3, a4) => (dynCall_jiji = Module['dynCall_jiji'] = wasmExports['dynCall_jiji'])(a0, a1, a2, a3, a4);


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===




var calledRun;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function run() {

  if (runDependencies > 0) {
    return;
  }

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    readyPromiseResolve(Module);
    Module['onRuntimeInitialized']?.();

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(() => {
      setTimeout(() => Module['setStatus'](''), 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();

// end include: postamble.js

// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.
//
// We assign to the `moduleRtn` global here and configure closure to see
// this as and extern so it won't get minified.

moduleRtn = readyPromise;

// end include: postamble_modularize.js



  return moduleRtn;
}
);
})();
export default Module;
