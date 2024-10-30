
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
var wasmBinaryFile = 'data:application/octet-stream;base64,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';
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
var wasmImports = {
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap
};
var wasmExports = createWasm();
var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports['__wasm_call_ctors'])();
var _render = Module['_render'] = (a0, a1, a2, a3, a4, a5, a6, a7) => (_render = Module['_render'] = wasmExports['render'])(a0, a1, a2, a3, a4, a5, a6, a7);
var _malloc = Module['_malloc'] = (a0) => (_malloc = Module['_malloc'] = wasmExports['malloc'])(a0);
var _free = Module['_free'] = (a0) => (_free = Module['_free'] = wasmExports['free'])(a0);
var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports['_emscripten_stack_restore'])(a0);
var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'])();


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
