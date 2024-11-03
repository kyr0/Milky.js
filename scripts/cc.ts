import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, ChildProcess } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';

let currentCompileProcess: ChildProcess | null = null;

const fileToDataUrl = async (filePath: string): Promise<string> => {
  try {
    const fileBuffer = await readFile(filePath);
    const base64Data = fileBuffer.toString('base64');
    return `data:application/octet-stream;base64,${base64Data}`;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
};

const compileCCode = () => {
  console.log('Compiling C code...');

  if (!existsSync('src/lib/.gen')) {
    // create src/lib/.gen folder
    mkdirSync('src/lib/.gen', { recursive: true });
  }

  // If there's an existing compile process, terminate it
  if (currentCompileProcess) {
    console.log('Terminating previous compile process...');
    currentCompileProcess.kill('SIGTERM');
  }

  // Command to compile the C code with emscripten
  currentCompileProcess = spawn('emcc', [
    'src/lib/video.c',
    '-s',
    `EXPORTED_FUNCTIONS=["_render", "_malloc", "_free"]`,
    '-msimd128',
    '-O3',
    '-o',
    'src/lib/.gen/video.mjs',
    '--minify',
    '0',
    '-gsource-map',
    '--emit-tsd',
    'video.d.ts',
    '-s',
    `TOTAL_MEMORY=${1024 * 1024 * 256}`// Set max memory to 1GB (very high)
  ], {
    stdio: 'inherit'
  });

  currentCompileProcess.on('close', async(code) => {
    if (code !== 0 && code !== null /* null means SIGTERM, killed because of re-start */) {
      console.error('Error executing emcc:', code);
    } else {
      console.log('Done.');
      await updateWasmBinary();
    }
    currentCompileProcess = null;
  });
};

const updateWasmBinary = async () => {
  console.log('Updating WASM binary...');

  const dataUrl = await fileToDataUrl('src/lib/.gen/video.wasm');

  let dotProductRuntime = readFileSync('src/lib/.gen/video.mjs', 'utf-8');

  // code injection and auto-deserialization of the wasm binary data
  dotProductRuntime = dotProductRuntime.replace('var wasmBinaryFile;', `
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
var wasmBinaryFile = '${dataUrl}';
wasmBinary = dataUrlToUint8Array(wasmBinaryFile);
`);

  writeFileSync('src/lib/.gen/video.mjs', dotProductRuntime);

  console.log('Finished.');
};

// Initial compilation
compileCCode();

console.log('Watching for changes in C files...');

// Watch for changes in C files and recompile using node's fs.watch
watch('./src', { recursive: true }, async (eventType, filename) => {
  if (filename && filename.endsWith('.c')) {
    console.log(`Change detected in: ${filename}`);
    compileCCode();
  }
});