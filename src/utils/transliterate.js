// Comprehensive Indic-to-English Script Transliterator
// Transliterates non-Latin scripts (Telugu, Hindi, Punjabi, Tamil, Kannada, Malayalam, Bengali) into readable English / Romanized text

const INDIC_MAP = {
  // Telugu Vowels & Consonants
  'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo', 'ఋ': 'ru', 'ఎ': 'e', 'ఏ': 'ae', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'oo', 'ఔ': 'au', 'అం': 'am', 'అః': 'aha',
  'క': 'ka', 'ఖ': 'kha', 'గ': 'ga', 'ఘ': 'gha', 'ఙ': 'nga',
  'చ': 'cha', 'ఛ': 'chha', 'జ': 'ja', 'ఝ': 'jha', 'ఞ': 'nya',
  'ట': 'ta', 'ఠ': 'tha', 'డ': 'da', 'ఢ': 'dha', 'ణ': 'na',
  'త': 'ta', 'థ': 'tha', 'ద': 'da', 'ధ': 'dha', 'న': 'na',
  'ప': 'pa', 'ఫ': 'pha', 'బ': 'ba', 'భ': 'bha', 'మ': 'ma',
  'య': 'ya', 'ర': 'ra', 'ల': 'la', 'వ': 'va', 'శ': 'sha', 'ష': 'sha', 'స': 'sa', 'హ': 'ha', 'ళ': 'la', 'ఱ': 'ra', 'క్ష': 'ksha',
  'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru', 'ె': 'e', 'ే': 'ae', 'ై': 'ai', 'ొ': 'o', 'ో': 'oo', 'ౌ': 'au', 'ం': 'm', 'ః': 'h',

  // Devanagari (Hindi, Marathi)
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ru', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'am', 'अः': 'aha',
  'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga',
  'च': 'cha', 'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya',
  'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha', 'ण': 'na',
  'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
  'प': 'pa', 'फ': 'fa', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
  'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'sha', 'ष': 'sha', 'स': 'sa', 'ह': 'ha', 'क्ष': 'ksha', 'ज्ञ': 'gya',
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ru', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'm', 'ः': 'h',

  // Punjabi (Gurmukhi)
  'ਅ': 'a', 'ਆ': 'aa', 'ਇ': 'i', 'ਈ': 'ee', 'ਉ': 'u', 'ਊ': 'oo', 'ਏ': 'e', 'ਐ': 'ai', 'ਓ': 'o', 'ਔ': 'au',
  'ਸ': 'sa', 'ਹ': 'ha', 'ਕ': 'ka', 'ਖ': 'kha', 'ਗ': 'ga', 'ਘ': 'gha', 'ਙ': 'nga',
  'ਚ': 'cha', 'ਛ': 'chha', 'ਜ': 'ja', 'ਝ': 'jha', 'ਞ': 'nya',
  'ਟ': 'ta', 'ਠ': 'tha', 'ਡ': 'da', 'ਢ': 'dha', 'ਣ': 'na',
  'ਤ': 'ta', 'ਥ': 'tha', 'ਦ': 'da', 'ਧ': 'dha', 'ਨ': 'na',
  'ਪ': 'pa', 'ਫ': 'pha', 'ਬ': 'ba', 'ਭ': 'bha', 'ਮ': 'ma',
  'ਯ': 'ya', 'ਰ': 'ra', 'ਲ': 'la', 'ਵ': 'va', 'ੜ': 'ra',
  'ਸ਼': 'sha', 'ਖ਼': 'kha', 'ਗ਼': 'ga', 'ਜ਼': 'za', 'ਫ਼': 'fa', 'ਲ਼': 'la',
  'ਾ': 'aa', 'ਿ': 'i', 'ੀ': 'ee', 'ੁ': 'u', 'ੂ': 'oo', 'ੇ': 'e', 'ੈ': 'ai', 'ੋ': 'o', 'ੌ': 'au', 'ਂ': 'm', 'ੰ': 'm', '੍ਹ': 'h',

  // Tamil
  'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo', 'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oo', 'ஔ': 'au',
  'க': 'ka', 'ங': 'nga', 'ச': 'cha', 'ஞ': 'nya', 'ட': 'ta', 'ண': 'na', 'த': 'ta', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra', 'ல': 'la', 'வ': 'va', 'ழ': 'zha', 'ள': 'la', 'ற': 'ra', 'ன': 'na',
  'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo', 'ெ': 'e', 'ே': 'ae', 'ை': 'ai', 'ொ': 'o', 'ோ': 'oo', 'ௌ': 'au',

  // Kannada
  'ಅ': 'a', 'ಆ': 'aa', 'ಇ': 'i', 'ಈ': 'ee', 'ಉ': 'u', 'ಊ': 'oo', 'ಋ': 'ru', 'ಎ': 'e', 'ಏ': 'ae', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'oo', 'ಔ': 'au',
  'ಕ': 'ka', 'ಖ': 'kha', 'ಗ': 'ga', 'ಘ': 'gha', 'ಙ': 'nga', 'ಚ': 'cha', 'ಛ': 'chha', 'ಜ': 'ja', 'ಝ': 'jha', 'ಞ': 'nya',
  'ಟ': 'ta', 'ఠ': 'tha', 'ಡ': 'da', 'ಢ': 'dha', 'ಣ': 'na', 'ತ': 'ta', 'థ': 'tha', 'ದ': 'da', 'ధ': 'dha', 'ನ': 'na',
  'ಪ': 'pa', 'ಫ': 'pha', 'ಬ': 'ba', 'ಭ': 'bha', 'ಮ': 'ma', 'ಯ': 'ya', 'ರ': 'ra', 'ಲ': 'la', 'ವ': 'va', 'ಶ': 'sha', 'ಷ': 'sha', 'ಸ': 'sa', 'ಹ': 'ha', 'ಳ': 'la',
  'ಾ': 'aa', 'ಿ': 'i', 'ీ': 'ee', 'ು': 'u', 'ూ': 'oo', 'ೃ': 'ru', 'ೆ': 'e', 'ೇ': 'ae', 'ೈ': 'ai', 'ೊ': 'o', 'ೋ': 'oo', 'ೌ': 'au', 'ಂ': 'm', 'ః': 'h',

  // Malayalam
  'അ': 'a', 'ആ': 'aa', 'ഇ': 'i', 'ഈ': 'ee', 'ഉ': 'u', 'ഊ': 'oo', 'ഋ': 'ru', 'എ': 'e', 'ഏ': 'ae', 'ഐ': 'ai', 'ഒ': 'o', 'ഓ': 'oo', 'ഔ': 'au',
  'ക': 'ka', 'ഖ': 'kha', 'ഗ': 'ga', 'ഘ': 'gha', 'ങ': 'nga', 'ച': 'cha', 'ഛ': 'chha', 'ജ': 'ja', 'ഝ': 'jha', 'ഞ': 'nya',
  'ട': 'ta', 'ഠ': 'tha', 'ഡ': 'da', 'ഢ': 'dha', 'ണ': 'na', 'ത': 'ta', 'ഥ': 'tha', 'ദ': 'da', 'ധ': 'dha', 'ന': 'na',
  'പ': 'pa', 'ഫ': 'pha', 'ബ': 'ba', 'ഭ': 'bha', 'മ': 'ma', 'യ': 'ya', 'ര': 'ra', 'ല': 'la', 'വ': 'va', 'ശ': 'sha', 'ഷ': 'sha', 'സ': 'sa', 'ഹ': 'ha', 'ള': 'la', 'ഴ': 'zha', 'റ': 'ra',
  'ാ': 'aa', 'ி': 'i', 'ീ': 'ee', 'ு': 'u', 'ூ': 'oo', 'ൃ': 'ru', 'െ': 'e', 'േ': 'ae', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'oo', 'ൌ': 'au', 'ം': 'm', 'ഃ': 'h'
};

const HALANTS = ['్', '्', '်', '੍', '്'];
const MATRAS = 'ాిీుూృెేైొోౌంఃािीुूृेैोौंशாிீுூெேைொோௌ<ctrl42>ಿീੁੂೃೆೇೈೊೋೌಂఃാിീുൂൃെേൈൊോൌംഃਾਿੀੁੂੇੈੋੌਂੰ੍ਹ';

export function hasNonLatinScript(text) {
  if (!text) return false;
  return /[\u0900-\u0D7F\u0A00-\u0A7F]/.test(text);
}

export function transliterateToEnglish(str) {
  if (!str) return '';
  if (!hasNonLatinScript(str)) return str;

  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (HALANTS.includes(ch)) {
      if (out.endsWith('a')) out = out.slice(0, -1);
      continue;
    }

    const val = INDIC_MAP[ch];
    if (val !== undefined) {
      if (MATRAS.includes(ch) && out.endsWith('a') && val !== 'a') {
        out = out.slice(0, -1) + val;
      } else {
        out += val;
      }
    } else {
      out += ch;
    }
  }

  // Strip residual unmapped combining characters, nuktas, zero-width joiners & dotted circles
  out = out.replace(/[\u0300-\u036F\u093C\u0A3C\u0900-\u0D7F\u25CC\u200C\u200D]/g, '');

  return out
    .split('\n')
    .map((l) => {
      const trimmed = l.replace(/\s+/g, ' ').trim();
      if (!trimmed) return '';
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .join('\n');
}
