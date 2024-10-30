export interface IniSection {
  presetNumber: number;
  [key: string]: number;
}

export type IniResult = Array<IniSection>;

const MAX_PROPERTY_COUNT_PER_PRESET = 64;

// pre-computed, sorted list of well-known property names (encoder/decoder are order-sensitive)
export const wellKnownIniPropertyNames = [
  'damping', 'effect_bar', 'effect_chasers', 'effect_dots', 'effect_grid', 'effect_nuclide', 'effect_shadebobs', 
  'effect_solar', 'effect_spectral', 'f1', 'f2', 'f3', 'f4', 'gamma', 'magic', 'mode', 'pal_bFX', 'pal_curve_id_1', 
  'pal_curve_id_2', 'pal_curve_id_3', 'pal_FXpalnum', 'pal_hi_oband', 'pal_lo_band', 's1', 's2', 'shift', 'spectrum', 
  't1', 't2', 'volpos', 'wave', 'x_center', 'y_center'
] //.sort((a, b) => a.localeCompare(b));

export function parseIni(text: string): IniResult {
  const result: IniResult = [];
  let currentSection: IniSection | null = null;

  const checkMissingProperties = (section: IniSection) => {
    const missingProperties = wellKnownIniPropertyNames.filter(
      propName => !(propName in section)
    );
    if (missingProperties.length > 0) {
      throw new Error(`Section [PRESET ${section.presetNumber}] is missing values: ${missingProperties.join(', ')}.`);
    }
  };

  text.split(/\r?\n/).forEach(line => {
    line = line.trim();

    // ignore empty lines or comments
    if (line === "" || line.startsWith(";")) return;

    // match section headers like [PRESET 99]
    const sectionMatch = line.match(/^\[PRESET (\d+)\]$/);
    if (sectionMatch) {
      if (currentSection) {
        checkMissingProperties(currentSection);
      }
      currentSection = { presetNumber: parseInt(sectionMatch[1], 10) };
      result.push(currentSection);
      return;
    }

    // match key-value pairs like x_center=0.471875
    const keyValueMatch = line.match(/^([^=]+)=(.*)$/);
    if (keyValueMatch && currentSection) {
      const key = keyValueMatch[1].trim();
      const value = parseFloat(keyValueMatch[2].trim()); // always parse as number
      currentSection[key] = value;
    }
  });

  // check the last section after parsing
  if (currentSection) {
    checkMissingProperties(currentSection);
  }
  return result;
}

export function encodeIni(iniResult: IniResult): Float32Array {
  const floatArray = new Float32Array(iniResult.length * MAX_PROPERTY_COUNT_PER_PRESET);

  iniResult.forEach((section, sectionIndex) => {
    let index = sectionIndex * MAX_PROPERTY_COUNT_PER_PRESET;
    const sortedEntries = Object.entries(section)
      .filter(([key]) => key !== 'presetNumber')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    sortedEntries.forEach(([_key, value]) => {
      floatArray[index++] = value;
    });
  });
  return floatArray;
}

export function decodeIni(floatArray: Float32Array, propertyNames: Array<string>): IniResult {
  const iniResult: IniResult = [];
  const sectionSize = MAX_PROPERTY_COUNT_PER_PRESET;

  for (let sectionIndex = 0; sectionIndex < floatArray.length / sectionSize; sectionIndex++) {
    const section: IniSection = { presetNumber: sectionIndex + 1 };
    let index = sectionIndex * sectionSize;

    propertyNames.forEach((propertyName) => {
      if (index < floatArray.length) {
        section[propertyName] = floatArray[index++];
      }
    });

    iniResult.push(section);
  }
  return iniResult;
}

export function stringifyIni(iniResult: IniResult): string {
  return iniResult.map(section => {
    const sectionHeader = `[PRESET ${section.presetNumber}]`;
    const keyValuePairs = Object.entries(section)
      .filter(([key]) => key !== 'presetNumber')
      .map(([key, value]) => {
        // check if the value has decimals
        const formattedValue = value % 1 !== 0 ? value.toFixed(6) : value.toString();
        return `${key}=${formattedValue}`;
      })
      .join('\n');
    return `${sectionHeader}\n${keyValuePairs}`;
  }).join('\n\n');
}
