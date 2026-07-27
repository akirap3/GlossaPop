// utils.js - Modernized Utilities & Morphological Engine for French/English Grammar

/**
 * HTML escaping utility for XSS mitigation
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

/**
 * Linguistic Helper: French Adjective & Noun Feminization Engine
 * Applies systematic French phonological/orthographic suffix mutation rules.
 */
function getFrenchFeminineForm(word) {
  if (!word) return null;
  const w = word.toLowerCase().trim();
  
  // Invariant adjectives ending in 'e' remain unchanged
  if (w.endsWith('e')) return w;
  
  // Irregular Suppletive Forms (Mandatory linguistic exceptions)
  const SUPPLETIVE_FEMININE = {
    'beau': 'belle',
    'nouveau': 'nouvelle',
    'vieux': 'vieille',
    'blanc': 'blanche',
    'franc': 'franche',
    'frais': 'fraîche',
    'sec': 'sèche',
    'fou': 'folle',
    'mou': 'molle',
    'public': 'publique',
    'grec': 'grecque'
  };
  if (SUPPLETIVE_FEMININE[w]) return SUPPLETIVE_FEMININE[w];
  
  // Systematic Phonological & Orthographic Suffix Rules
  if (w.endsWith('ien')) return w.slice(0, -3) + 'ienne';
  if (w.endsWith('en')) return w.slice(0, -2) + 'enne';
  if (w.endsWith('on')) return w.slice(0, -2) + 'onne';
  if (w.endsWith('er')) return w.slice(0, -2) + 'ère';
  if (w.endsWith('eux')) return w.slice(0, -3) + 'euse';
  if (w.endsWith('eur')) return w.slice(0, -3) + 'euse';
  if (w.endsWith('if')) return w.slice(0, -2) + 'ive';
  if (w.endsWith('el')) return w.slice(0, -2) + 'elle';
  if (w.endsWith('eil')) return w.slice(0, -3) + 'eille';
  if (w.endsWith('c')) return w.slice(0, -1) + 'que';
  
  // Regular Feminine Suffix Appendage (-e)
  return w + 'e';
}

/**
 * Morphological Engine: French Prefix Decomposer
 * Deconstructs compound verbs into [prefix, baseVerb] to allow prefix inheritance.
 * Example: 'devenir' -> ['de', 'venir'], 'comprendre' -> ['com', 'prendre']
 */
const BASE_IRREGULAR_VERBS = [
  'être', 'avoir', 'aller', 'faire', 'dire', 'pouvoir', 'vouloir', 
  'savoir', 'voir', 'devoir', 'venir', 'prendre', 'mettre', 'partir', 
  'sortir', 'lire', 'écrire', 'ouvrir', 'offrir', 'naître', 'mourir', 'boire', 'recevoir'
];

const KNOWN_PREFIXES = ['de', 're', 'com', 'app', 'sur', 'inter', 'pre', 'dis', 'con', 'trans', 'dé'];

function decomposeFrenchVerb(verb) {
  const v = verb.toLowerCase().trim();
  if (BASE_IRREGULAR_VERBS.includes(v)) return { prefix: '', base: v };
  
  for (const prefix of KNOWN_PREFIXES) {
    if (v.startsWith(prefix)) {
      const baseCandidate = v.slice(prefix.length);
      if (BASE_IRREGULAR_VERBS.includes(baseCandidate) || baseCandidate.endsWith('er') || baseCandidate.endsWith('ir') || baseCandidate.endsWith('re')) {
        return { prefix, base: baseCandidate };
      }
    }
  }
  return { prefix: '', base: v };
}

/**
 * French Past Participle Engine
 */
function getFrenchPastParticiple(verb) {
  const v = verb.toLowerCase().trim();
  const { prefix, base } = decomposeFrenchVerb(v);
  
  const BASE_PARTICIPLES = {
    'être': 'été', 'avoir': 'eu', 'faire': 'fait', 'dire': 'dit',
    'pouvoir': 'pu', 'vouloir': 'voulu', 'savoir': 'su', 'voir': 'vu',
    'devoir': 'dû', 'venir': 'venu', 'prendre': 'pris', 'mettre': 'mis',
    'partir': 'parti', 'sortir': 'sorti', 'lire': 'lu', 'écrire': 'écrit',
    'aller': 'allé', 'ouvrir': 'ouvert', 'offrir': 'offert',
    'naître': 'né', 'mourir': 'mort', 'boire': 'bu', 'recevoir': 'reçu'
  };
  
  if (BASE_PARTICIPLES[base]) {
    return prefix + BASE_PARTICIPLES[base];
  }
  
  // Regular verb participle endings
  if (v.endsWith('er')) return v.slice(0, -2) + 'é';
  if (v.endsWith('ir')) return v.slice(0, -2) + 'i';
  if (v.endsWith('re')) return v.slice(0, -2) + 'u';
  return v;
}

/**
 * Phonological Helper: Applies French Elision ('je' -> "j'", 'que je' -> "que j'")
 */
function withElision(pronoun, verbForm) {
  const startsWithVowel = /^[aeiouyhéèàùâêîôû]/i.test(verbForm);
  if (pronoun === 'je') {
    return startsWithVowel ? `j’${verbForm}` : `je ${verbForm}`;
  }
  if (pronoun === 'que je') {
    return startsWithVowel ? `que j’${verbForm}` : `que je ${verbForm}`;
  }
  if (pronoun === 'que il') {
    return `qu’il ${verbForm}`;
  }
  if (pronoun === 'que ils') {
    return `qu’ils ${verbForm}`;
  }
  return `${pronoun} ${verbForm}`;
}

/**
 * French Verb Conjugation Engine
 * Handles Present, Passé Composé, Imparfait, Futur Simple, and Subjonctif Présent
 * using prefix inheritance and systematic tense stem generation.
 */
function getFrenchConjugations(verb, tense = 'present') {
  if (!verb) return null;
  const v = verb.toLowerCase().trim();
  const { prefix, base } = decomposeFrenchVerb(v);

  // 1. Passé Composé (Compound Past)
  if (tense === 'passe_compose') {
    const pp = getFrenchPastParticiple(v);
    const ETRE_VERBS = ['aller', 'venir', 'devenir', 'revenir', 'partir', 'sortir', 'naître', 'mourir', 'entrer', 'monter', 'descendre', 'tomber', 'rester', 'retourner'];
    const usesEtre = ETRE_VERBS.includes(v) || ETRE_VERBS.includes(base);

    if (usesEtre) {
      return {
        je: `je suis ${pp}`,
        tu: `tu es ${pp}`,
        il: `il est ${pp}`,
        nous: `nous sommes ${pp}`,
        vous: `vous êtes ${pp}`,
        ils: `ils sont ${pp}`
      };
    } else {
      return {
        je: `j’ai ${pp}`,
        tu: `tu as ${pp}`,
        il: `il a ${pp}`,
        nous: `nous avons ${pp}`,
        vous: `vous avez ${pp}`,
        ils: `ils ont ${pp}`
      };
    }
  }

  // 2. Imparfait (Imperfect)
  if (tense === 'imparfait') {
    if (v === 'être') {
      return { je: "j’étais", tu: "tu étais", il: "il était", nous: "nous étions", vous: "vous étiez", ils: "ils étaient" };
    }
    const pres = getFrenchConjugations(v, 'present');
    let stem = '';
    if (pres && pres.nous) {
      stem = pres.nous.replace(/^nous\s*/, '').replace(/ons$/, '');
    } else {
      stem = v.endsWith('er') ? v.slice(0, -2) : (v.endsWith('ir') ? v.slice(0, -2) + 'iss' : v.slice(0, -2));
    }
    return {
      je: withElision('je', stem + 'ais'),
      tu: `tu ${stem}ais`,
      il: `il ${stem}ait`,
      nous: `nous ${stem}ions`,
      vous: `vous ${stem}iez`,
      ils: `ils ${stem}aient`
    };
  }

  // 3. Futur Simple (Simple Future)
  if (tense === 'futur_simple') {
    const BASE_FUTUR_STEMS = {
      'être': 'ser', 'avoir': 'aur', 'aller': 'ir', 'faire': 'fer',
      'pouvoir': 'pourr', 'vouloir': 'voudr', 'savoir': 'saur', 'voir': 'verr',
      'devoir': 'devr', 'venir': 'viendr', 'recevoir': 'recevr', 'courir': 'courr', 'envoyer': 'enverr'
    };
    let stem = BASE_FUTUR_STEMS[base] ? prefix + BASE_FUTUR_STEMS[base] : null;
    if (!stem) {
      stem = v.endsWith('re') ? v.slice(0, -1) : v;
    }
    return {
      je: withElision('je', stem + 'ai'),
      tu: `tu ${stem}as`,
      il: `il ${stem}a`,
      nous: `nous ${stem}ons`,
      vous: `vous ${stem}ez`,
      ils: `ils ${stem}ont`
    };
  }

  // 4. Subjonctif Présent (Subjunctive Present)
  if (tense === 'subjonctif') {
    const BASE_SUBJ_IRREGULARS = {
      'être': { je: 'sois', tu: 'sois', il: 'soit', nous: 'soyons', vous: 'soyez', ils: 'soient' },
      'avoir': { je: 'aie', tu: 'aies', il: 'ait', nous: 'ayons', vous: 'ayez', ils: 'aient' },
      'faire': { je: 'fasse', tu: 'fasses', il: 'fasse', nous: 'fassions', vous: 'fassiez', ils: 'fassent' },
      'pouvoir': { je: 'puisse', tu: 'puisses', il: 'puisse', nous: 'puissions', vous: 'puissiez', ils: 'puissent' },
      'vouloir': { je: 'veuille', tu: 'veuilles', il: 'veuille', nous: 'voulions', vous: 'vouliez', ils: 'veuillent' },
      'savoir': { je: 'sache', tu: 'saches', il: 'sache', nous: 'sachions', vous: 'sachiez', ils: 'sachent' },
      'aller': { je: 'aille', tu: 'ailles', il: 'aille', nous: 'allions', vous: 'alliez', ils: 'aillent' }
    };
    
    if (BASE_SUBJ_IRREGULARS[base]) {
      const b = BASE_SUBJ_IRREGULARS[base];
      return {
        je: withElision('que je', prefix + b.je),
        tu: `que tu ${prefix}${b.tu}`,
        il: withElision('que il', prefix + b.il),
        nous: `que nous ${prefix}${b.nous}`,
        vous: `que vous ${prefix}${b.vous}`,
        ils: withElision('que ils', prefix + b.ils)
      };
    }

    let stem = '';
    if (v.endsWith('er')) stem = v.slice(0, -2);
    else if (v.endsWith('ir')) stem = v.slice(0, -2) + 'iss';
    else if (v.endsWith('re')) stem = v.slice(0, -2);
    else {
      const pres = getFrenchConjugations(v, 'present');
      stem = (pres && pres.ils) ? pres.ils.replace(/^ils\s*/, '').replace(/ent$/, '') : v;
    }
    
    return {
      je: withElision('que je', stem + 'e'),
      tu: `que tu ${stem}es`,
      il: withElision('que il', stem + 'e'),
      nous: `que nous ${stem}ions`,
      vous: `que vous ${stem}iez`,
      ils: withElision('que ils', stem + 'ent')
    };
  }

  // 5. Présent de l'Indicatif (Default Present Tense)
  const BASE_PRESENT_IRREGULARS = {
    'être': { je: 'suis', tu: 'es', il: 'est', nous: 'sommes', vous: 'êtes', ils: 'sont' },
    'avoir': { je: 'ai', tu: 'as', il: 'a', nous: 'avons', vous: 'avez', ils: 'ont' },
    'aller': { je: 'vais', tu: 'vas', il: 'va', nous: 'allons', vous: 'allez', ils: 'vont' },
    'faire': { je: 'fais', tu: 'fais', il: 'fait', nous: 'faisons', vous: 'faites', ils: 'font' },
    'dire': { je: 'dis', tu: 'dis', il: 'dit', nous: 'disons', vous: 'dites', ils: 'disent' },
    'pouvoir': { je: 'peux', tu: 'peux', il: 'peut', nous: 'pouvons', vous: 'pouvez', ils: 'peuvent' },
    'vouloir': { je: 'veux', tu: 'veux', il: 'veut', nous: 'voulons', vous: 'voulez', ils: 'veulent' },
    'savoir': { je: 'sais', tu: 'sais', il: 'sait', nous: 'savons', vous: 'savez', ils: 'savent' },
    'voir': { je: 'vois', tu: 'vois', il: 'voit', nous: 'voyons', vous: 'voyez', ils: 'voient' },
    'devoir': { je: 'dois', tu: 'dois', il: 'doit', nous: 'devons', vous: 'devez', ils: 'doivent' },
    'venir': { je: 'viens', tu: 'viens', il: 'vient', nous: 'venons', vous: 'venez', ils: 'viennent' },
    'prendre': { je: 'prends', tu: 'prends', il: 'prend', nous: 'prenons', vous: 'prenez', ils: 'prennent' },
    'mettre': { je: 'mets', tu: 'mets', il: 'met', nous: 'mettons', vous: 'mettez', ils: 'mettent' },
    'partir': { je: 'pars', tu: 'pars', il: 'part', nous: 'partons', vous: 'partez', ils: 'partent' },
    'sortir': { je: 'sors', tu: 'sors', il: 'sort', nous: 'sortons', vous: 'sortez', ils: 'sortent' },
    'lire': { je: 'lis', tu: 'lis', il: 'lit', nous: 'lisons', vous: 'lisez', ils: 'lisent' },
    'écrire': { je: 'écris', tu: 'écris', il: 'écrit', nous: 'écrivons', vous: 'écrivez', ils: 'écrivent' }
  };
  
  if (BASE_PRESENT_IRREGULARS[base]) {
    const b = BASE_PRESENT_IRREGULARS[base];
    return {
      je: withElision('je', prefix + b.je),
      tu: `tu ${prefix}${b.tu}`,
      il: `il ${prefix}${b.il}`,
      nous: `nous ${prefix}${b.nous}`,
      vous: `vous ${prefix}${b.vous}`,
      ils: `ils ${prefix}${b.ils}`
    };
  }
  
  // Regular -er verbs
  if (v.endsWith('er')) {
    const stem = v.slice(0, -2);
    const nousForm = v.endsWith('ger') ? stem + 'eons' : (v.endsWith('cer') ? stem.slice(0, -1) + 'çons' : stem + 'ons');
    return {
      je: withElision('je', stem + 'e'),
      tu: `tu ${stem}es`,
      il: `il ${stem}e`,
      nous: `nous ${nousForm}`,
      vous: `vous ${stem}ez`,
      ils: `ils ${stem}ent`
    };
  }
  
  // Regular -ir verbs (finir type)
  if (v.endsWith('ir')) {
    const stem = v.slice(0, -2);
    return {
      je: withElision('je', stem + 'is'),
      tu: `tu ${stem}is`,
      il: `il ${stem}it`,
      nous: `nous ${stem}issons`,
      vous: `vous ${stem}issez`,
      ils: `ils ${stem}issent`
    };
  }
  
  // Generic regular -re verbs
  if (v.endsWith('re')) {
    const stem = v.slice(0, -2);
    return {
      je: withElision('je', stem + 's'),
      tu: `tu ${stem}s`,
      il: `il ${stem}t`,
      nous: `nous ${stem}ons`,
      vous: `vous ${stem}ez`,
      ils: `ils ${stem}ent`
    };
  }
  
  return null;
}

/**
 * Helper to estimate CEFR level dynamically based on word length and structural complexity.
 * Does NOT use static word lists.
 */
function getCEFRLevel(word, lang) {
  if (!word) return null;
  const w = word.toLowerCase().trim();
  
  let level = 'B1';
  if (w.length <= 4) level = 'A1';
  else if (w.length <= 6) level = 'A2';
  else if (w.length <= 8) level = 'B1';
  else if (w.length <= 10) level = 'B2';
  else if (w.length <= 12) level = 'C1';
  else level = 'C2';
  
  const colors = {
    'A1': { text: 'A1', color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.12)', label: 'A1 Beginner' },
    'A2': { text: 'A2', color: '#00796b', bg: 'rgba(0, 121, 107, 0.12)', label: 'A2 Elementary' },
    'B1': { text: 'B1', color: '#1565c0', bg: 'rgba(21, 101, 192, 0.12)', label: 'B1 Intermediate' },
    'B2': { text: 'B2', color: '#4a148c', bg: 'rgba(74, 20, 140, 0.12)', label: 'B2 Upper-Inter' },
    'C1': { text: 'C1', color: '#7b1fa2', bg: 'rgba(123, 31, 162, 0.12)', label: 'C1 Advanced' },
    'C2': { text: 'C2', color: '#c2185b', bg: 'rgba(194, 24, 91, 0.12)', label: 'C2 Mastery' }
  };
  
  return colors[level] || colors['B1'];
}

/**
 * Dynamic Language-Aware External Reference Links Generator
 */
function getDynamicReferenceLinks(word, lang, explainLang = '') {
  const clean = (word || '').trim();
  const encoded = encodeURIComponent(clean);
  const l = (lang || 'en').toLowerCase();
  const expL = (explainLang || '').toLowerCase();
  const isChineseExplain = expL.startsWith('zh');

  if (l === 'ja') {
    return [
      { name: 'Jisho', url: `https://jisho.org/search/${encoded}` },
      { name: 'Weblio', url: `https://cjjc.weblio.jp/content/${encoded}` },
      { name: 'OJAD', url: `https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/word:${encoded}` }
    ];
  }
  if (l === 'fr') {
    const frLinks = [
      { name: 'Larousse', url: `https://www.larousse.fr/dictionnaires/francais/${encoded}` },
      { name: 'WordReference', url: `https://www.wordreference.com/fren/${encoded}` },
      { name: 'CNRTL', url: `https://www.cnrtl.fr/definition/${encoded}` }
    ];
    if (isChineseExplain) {
      frLinks.push({ name: '法語助手', url: `https://www.frdic.com/dicts/fr/${encoded}` });
    }
    return frLinks;
  }
  if (l === 'es') {
    return [
      { name: 'SpanishDict', url: `https://www.spanishdict.com/translate/${encoded}` },
      { name: 'RAE', url: `https://dle.rae.es/${encoded}` },
      { name: 'WordReference', url: `https://www.wordreference.com/es/en/translation.asp?spen=${encoded}` }
    ];
  }
  if (l === 'de') {
    return [
      { name: 'Duden', url: `https://www.duden.de/suchen/dudenonline/${encoded}` },
      { name: 'DWDS', url: `https://www.dwds.de/wb/${encoded}` },
      { name: 'Leo', url: `https://dict.leo.org/german-english/${encoded}` }
    ];
  }
  if (l === 'ko') {
    return [
      { name: 'Naver', url: `https://dict.naver.com/search.nhn?query=${encoded}` },
      { name: 'Daum', url: `https://dic.daum.net/search.do?q=${encoded}` }
    ];
  }
  if (l === 'it') {
    return [
      { name: 'Treccani', url: `https://www.treccani.it/vocabolario/ricerca/${encoded}/` },
      { name: 'WordReference', url: `https://www.wordreference.com/iten/${encoded}` }
    ];
  }
  if (l === 'pt') {
    return [
      { name: 'Priberam', url: `https://dicionario.priberam.org/${encoded}` },
      { name: 'WordReference', url: `https://www.wordreference.com/pten/${encoded}` }
    ];
  }
  if (l === 'zh-tw' || l === 'zh-cn' || l === 'zh') {
    return [
      { name: 'MoeDict', url: `https://www.moedict.tw/${encoded}` },
      { name: 'WordReference', url: `https://www.wordreference.com/zhen/${encoded}` }
    ];
  }
  // Default English / Global fallback
  return [
    { name: 'Cambridge', url: `https://dictionary.cambridge.org/dictionary/english/${encoded}` },
    { name: 'Oxford', url: `https://www.oxfordlearnersdictionaries.com/definition/english/${encoded}` },
    { name: 'Merriam-Webster', url: `https://www.merriam-webster.com/dictionary/${encoded}` }
  ];
}

/**
 * Automatically senses the primary language of the current webpage DOM
 */
function detectPageLanguage(doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d) return 'en';

  // 1. Check <html lang="..."> attribute
  if (d.documentElement && d.documentElement.lang) {
    const raw = d.documentElement.lang.trim();
    if (raw) {
      const lower = raw.toLowerCase();
      if (lower.startsWith('ja')) return 'ja';
      if (lower.startsWith('fr')) return 'fr';
      if (lower.startsWith('es')) return 'es';
      if (lower.startsWith('de')) return 'de';
      if (lower.startsWith('ko')) return 'ko';
      if (lower.startsWith('it')) return 'it';
      if (lower.startsWith('pt')) return 'pt';
      if (lower.startsWith('zh-cn') || lower === 'zh-hans') return 'zh-CN';
      if (lower.startsWith('zh')) return 'zh-TW';
      if (lower.startsWith('en')) return 'en';
      return lower.split('-')[0];
    }
  }

  // 2. Check <meta property="og:locale"> or <meta http-equiv="content-language">
  try {
    const metaLocale = d.querySelector('meta[property="og:locale"], meta[name="og:locale"], meta[http-equiv="content-language"]');
    if (metaLocale) {
      const val = (metaLocale.getAttribute('content') || '').toLowerCase().trim();
      if (val) {
        if (val.includes('ja')) return 'ja';
        if (val.includes('fr')) return 'fr';
        if (val.includes('es')) return 'es';
        if (val.includes('de')) return 'de';
        if (val.includes('ko')) return 'ko';
        if (val.includes('it')) return 'it';
        if (val.includes('pt')) return 'pt';
        if (val.includes('zh_tw') || val.includes('zh-tw')) return 'zh-TW';
        if (val.includes('zh_cn') || val.includes('zh-cn')) return 'zh-CN';
        if (val.includes('en')) return 'en';
      }
    }
  } catch (e) {}

  return 'en';
}
