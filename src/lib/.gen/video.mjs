
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
var wasmBinaryFile = 'data:application/octet-stream;base64,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AEgbIAC7oBALDAILIAJBAEgEQETSITN/fNkSwCAAu6EQDAwCCyAAu0TSITN/fNkSwKAQDAwBCyAAIACTIAFBgICA/AdPDQAaIAAgA0EIahANIQEgAysDCCEEAkACQAJAAkAgAUEDcUEBaw4DAQIDAAsgBBALDAMLIASaEAwMAgsgBBALjAwBCyAEEAwLIQAgA0EQaiQAIAAL/gMBAn8gAkGABE8EQCAAIAEgAhAADwsgACACaiEDAkAgACABc0EDcUUEQAJAIABBA3FFBEAgACECDAELIAJFBEAgACECDAELIAAhAgNAIAIgAS0AADoAACABQQFqIQEgAkEBaiICQQNxRQ0BIAIgA0kNAAsLIANBfHEhAAJAIANBwABJDQAgAiAAQUBqIgRLDQADQCACIAEoAgA2AgAgAiABKAIENgIEIAIgASgCCDYCCCACIAEoAgw2AgwgAiABKAIQNgIQIAIgASgCFDYCFCACIAEoAhg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUFAayEBIAJBQGsiAiAETQ0ACwsgACACTQ0BA0AgAiABKAIANgIAIAFBBGohASACQQRqIgIgAEkNAAsMAQsgA0EESQRAIAAhAgwBCyADQQRrIgQgAEkEQCAAIQIMAQsgACECA0AgAiABLQAAOgAAIAIgAS0AAToAASACIAEtAAI6AAIgAiABLQADOgADIAFBBGohASACQQRqIgIgBE0NAAsLIAIgA0kEQANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCwvyAgICfwF+AkAgAkUNACAAIAE6AAAgACACaiIDQQFrIAE6AAAgAkEDSQ0AIAAgAToAAiAAIAE6AAEgA0EDayABOgAAIANBAmsgAToAACACQQdJDQAgACABOgADIANBBGsgAToAACACQQlJDQAgAEEAIABrQQNxIgRqIgMgAUH/AXFBgYKECGwiATYCACADIAIgBGtBfHEiBGoiAkEEayABNgIAIARBCUkNACADIAE2AgggAyABNgIEIAJBCGsgATYCACACQQxrIAE2AgAgBEEZSQ0AIAMgATYCGCADIAE2AhQgAyABNgIQIAMg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bXNjcmlwdGVuX2RhdGVfbm93Ag9fX3dhc2lfZmRfY2xvc2UDD19fd2FzaV9mZF93cml0ZQQWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAUabGVnYWxpbXBvcnQkX193YXNpX2ZkX3NlZWsGEV9fd2FzbV9jYWxsX2N0b3JzBwZyZW5kZXIICmNsZWFyRnJhbWUJCGRyYXdMaW5lChRyZW5kZXJXYXZlZm9ybVNpbXBsZQsHX19jb3NkZgwHX19zaW5kZg0LX19yZW1fcGlvMmYOBGNvc2YPCF9fbWVtY3B5EAhfX21lbXNldBEJX190b3dyaXRlEglfX2Z3cml0ZXgTBmZ3cml0ZRQGcm91bmRmFQZzY2FsYm4WBHNpbmYXDV9fc3RkaW9fY2xvc2UYDV9fc3RkaW9fd3JpdGUZDF9fc3RkaW9fc2VlaxoZX19lbXNjcmlwdGVuX3N0ZG91dF9jbG9zZRsYX19lbXNjcmlwdGVuX3N0ZG91dF9zZWVrHARzYnJrHRllbXNjcmlwdGVuX2J1aWx0aW5fbWFsbG9jHhdlbXNjcmlwdGVuX2J1aWx0aW5fZnJlZR8ZX2Vtc2NyaXB0ZW5fc3RhY2tfcmVzdG9yZSAXX2Vtc2NyaXB0ZW5fc3RhY2tfYWxsb2MhHGVtc2NyaXB0ZW5fc3RhY2tfZ2V0X2N1cnJlbnQiFmxlZ2Fsc3R1YiRkeW5DYWxsX2ppamkHEgEAD19fc3RhY2tfcG9pbnRlcgmCAQ4ABy5yb2RhdGEBCS5yb2RhdGEuMQIJLnJvZGF0YS4yAwUuZGF0YQQHLmRhdGEuMQUHLmRhdGEuMgYHLmRhdGEuMwcHLmRhdGEuNAgHLmRhdGEuNQkHLmRhdGEuNgoHLmRhdGEuNwsHLmRhdGEuOAwHLmRhdGEuOQ0ILmRhdGEuMTAAIBBzb3VyY2VNYXBwaW5nVVJMDnZpZGVvLndhc20ubWFw';
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

  var _emscripten_date_now = () => Date.now();

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

  var _fd_close = (fd) => {
      return 52;
    };

  var convertI32PairToI53Checked = (lo, hi) => {
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    };
  function _fd_seek(fd,offset_low, offset_high,whence,newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
  
    
      return 70;
    ;
  }

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
  emscripten_date_now: _emscripten_date_now,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write
};
var wasmExports = createWasm();
var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports['__wasm_call_ctors'])();
var _render = Module['_render'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) => (_render = Module['_render'] = wasmExports['render'])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
var _free = Module['_free'] = (a0) => (_free = Module['_free'] = wasmExports['free'])(a0);
var _malloc = Module['_malloc'] = (a0) => (_malloc = Module['_malloc'] = wasmExports['malloc'])(a0);
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
