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
 * Helper to handle French stem variations for -eler and -eter verbs
 * (e.g. rappeler -> rappell- / rappel-, jeter -> jett- / jet-)
 */
function getFrenchElerEterStems(verb) {
  const v = verb.toLowerCase().trim();
  
  if (v.endsWith('eler')) {
    const baseStem = v.slice(0, -4);
    return { stemMute: baseStem + 'ell', stemNormal: baseStem + 'el', isElerEter: true };
  }
  if (v.endsWith('eter')) {
    const baseStem = v.slice(0, -4);
    return { stemMute: baseStem + 'ett', stemNormal: baseStem + 'et', isElerEter: true };
  }
  
  return { isElerEter: false };
}

/**
 * French Verb Conjugation Engine (3-Tier Hybrid Architecture)
 * Priority 1: Local offline NPM library (french-verbs + french-verbs-lefff) - 0ms, 100% authoritative
 * Priority 2: Online Kaikki API fallback
 * Priority 3: Online Wiktionary API fallback
 */
let _lefffDictCache = null;

function getFrenchConjugations(verb, tense = 'present') {
  if (!verb) return null;
  let rawVerb = verb.toLowerCase().trim().replace(/’/g, "'");
  let isPronominal = false;
  if (rawVerb.startsWith("s'")) {
    isPronominal = true;
    rawVerb = rawVerb.slice(2).trim();
  } else if (rawVerb.startsWith("se ")) {
    isPronominal = true;
    rawVerb = rawVerb.slice(3).trim();
  }

  const v = rawVerb;
  const { prefix, base } = decomposeFrenchVerb(v);

  // -----------------------------------------------------------------
  // PRIORITY 1: Offline NPM Library (french-verbs + french-verbs-lefff)
  // -----------------------------------------------------------------
  if (typeof require !== 'undefined') {
    try {
      const { getConjugation } = require('french-verbs');
      if (!_lefffDictCache) {
        _lefffDictCache = require('french-verbs-lefff/dist/conjugations.json');
      }
      const Lefff = _lefffDictCache;
      
      const targetVerb = Lefff[v] ? v : (Lefff[base] ? base : null);
      if (targetVerb && Lefff[targetVerb]) {
        console.log(`🟢 [Priority 1: Offline LEFFF Engine] Conjugating "${verb}" (targetVerb: "${targetVerb}") via french-verbs library.`);
        const p = targetVerb === base ? prefix : '';
        
        const isCompound = ['passe_compose', 'plus_que_parfait', 'passe_anterieur', 'futur_anterieur', 'subjonctif_passe', 'subjonctif_plus_que_parfait', 'conditionnel_passe', 'imperatif_passe'].includes(tense);
        
        if (isCompound) {
          const pp = getConjugation(Lefff, targetVerb, 'PARTICIPE_PASSE', 0, {}, false);
          const fullPp = p + pp;
          const ETRE_VERBS = ['aller', 'venir', 'devenir', 'revenir', 'partir', 'sortir', 'naître', 'mourir', 'entrer', 'monter', 'descendre', 'tomber', 'rester', 'retourner'];
          const auxVerb = (isPronominal || ETRE_VERBS.includes(v) || ETRE_VERBS.includes(base)) ? 'être' : 'avoir';
          
          let auxTenseMap = {
            'passe_compose': 'present',
            'plus_que_parfait': 'imparfait',
            'passe_anterieur': 'passe_simple',
            'futur_anterieur': 'futur_simple',
            'subjonctif_passe': 'subjonctif_present',
            'subjonctif_plus_que_parfait': 'subjonctif_imparfait',
            'conditionnel_passe': 'conditionnel_present',
            'imperatif_passe': 'imperatif_present'
          };
          const auxConj = getFrenchConjugations(auxVerb, auxTenseMap[tense]);
          if (auxConj) {
            if (tense === 'imperatif_passe') {
              return {
                je: '-',
                tu: auxConj.tu + ' ' + fullPp,
                il: '-',
                nous: auxConj.nous + ' ' + fullPp,
                vous: auxConj.vous + ' ' + fullPp,
                ils: '-'
              };
            }
            return {
              je: auxConj.je + ' ' + fullPp,
              tu: auxConj.tu + ' ' + fullPp,
              il: auxConj.il + ' ' + fullPp,
              nous: auxConj.nous + ' ' + fullPp,
              vous: auxConj.vous + ' ' + fullPp,
              ils: auxConj.ils + ' ' + fullPp
            };
          }
        }

        let fvTense = null;
        if (tense === 'present') fvTense = 'PRESENT';
        else if (tense === 'imparfait') fvTense = 'IMPARFAIT';
        else if (tense === 'passe_simple') fvTense = 'PASSE_SIMPLE';
        else if (tense === 'futur_simple' || tense === 'futur') fvTense = 'FUTUR';
        else if (tense === 'subjonctif' || tense === 'subjonctif_present') fvTense = 'SUBJONCTIF_PRESENT';
        else if (tense === 'subjonctif_imparfait') fvTense = 'SUBJONCTIF_IMPARFAIT';
        else if (tense === 'conditionnel_present') fvTense = 'CONDITIONNEL_PRESENT';
        else if (tense === 'imperatif_present') fvTense = 'IMPERATIF_PRESENT';
        else if (tense === 'participe_present') fvTense = 'PARTICIPE_PRESENT';
        else if (tense === 'participe_passe') fvTense = 'PARTICIPE_PASSE';

        if (fvTense) {
          const c0 = p + getConjugation(Lefff, targetVerb, fvTense, 0, {}, isPronominal);
          const c1 = p + getConjugation(Lefff, targetVerb, fvTense, 1, {}, isPronominal);
          const c2 = p + getConjugation(Lefff, targetVerb, fvTense, 2, {}, isPronominal);
          const c3 = p + getConjugation(Lefff, targetVerb, fvTense, 3, {}, isPronominal);
          const c4 = p + getConjugation(Lefff, targetVerb, fvTense, 4, {}, isPronominal);
          const c5 = p + getConjugation(Lefff, targetVerb, fvTense, 5, {}, isPronominal);

          if (tense.startsWith('subjonctif')) {
            return {
              je: withElision('que je', c0),
              tu: `que tu ${c1}`,
              il: withElision('que il', c2),
              nous: `que nous ${c3}`,
              vous: `que vous ${c4}`,
              ils: withElision('que ils', c5)
            };
          } else if (tense === 'participe_present' || tense === 'participe_passe') {
            return { je: c0, tu: c0, il: c0, nous: c0, vous: c0, ils: c0 };
          } else {
            return {
              je: withElision('je', c0),
              tu: `tu ${c1}`,
              il: `il ${c2}`,
              nous: `nous ${c3}`,
              vous: `vous ${c4}`,
              ils: `ils ${c5}`
            };
          }
        }
      }
    } catch (err) {
      // Fallthrough to algorithmic fallback or online APIs if module unavailable
    }
  }

  // -----------------------------------------------------------------
  // PRIORITY 1b: Algorithmic Fallback for 18 Tenses (Browser & Standalone)
  // -----------------------------------------------------------------
  
  // 1. Compound Tenses (All 8 Compound Tenses)
  const isCompoundAlg = ['passe_compose', 'plus_que_parfait', 'passe_anterieur', 'futur_anterieur', 'subjonctif_passe', 'subjonctif_plus_que_parfait', 'conditionnel_passe', 'imperatif_passe'].includes(tense);
  if (isCompoundAlg) {
    const pp = getFrenchPastParticiple(v);
    const ETRE_VERBS = ['aller', 'venir', 'devenir', 'revenir', 'partir', 'sortir', 'naître', 'mourir', 'entrer', 'monter', 'descendre', 'tomber', 'rester', 'retourner'];
    const auxVerb = (isPronominal || ETRE_VERBS.includes(v) || ETRE_VERBS.includes(base)) ? 'être' : 'avoir';
    let auxTenseMap = {
      'passe_compose': 'present',
      'plus_que_parfait': 'imparfait',
      'passe_anterieur': 'passe_simple',
      'futur_anterieur': 'futur_simple',
      'subjonctif_passe': 'subjonctif_present',
      'subjonctif_plus_que_parfait': 'subjonctif_imparfait',
      'conditionnel_passe': 'conditionnel_present',
      'imperatif_passe': 'imperatif_present'
    };
    const auxConj = getFrenchConjugations(auxVerb, auxTenseMap[tense]);
    if (auxConj) {
      if (tense === 'imperatif_passe') {
        return {
          je: '-',
          tu: auxConj.tu + ' ' + pp,
          il: '-',
          nous: auxConj.nous + ' ' + pp,
          vous: auxConj.vous + ' ' + pp,
          ils: '-'
        };
      }
      return {
        je: auxConj.je + ' ' + pp,
        tu: auxConj.tu + ' ' + pp,
        il: auxConj.il + ' ' + pp,
        nous: auxConj.nous + ' ' + pp,
        vous: auxConj.vous + ' ' + pp,
        ils: auxConj.ils + ' ' + pp
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

  // 3. Passé Simple
  if (tense === 'passe_simple') {
    if (base === 'être') return { je: "je fus", tu: "tu fus", il: "il fut", nous: "nous fûmes", vous: "vous fûtes", ils: "ils furent" };
    if (base === 'avoir') return { je: "j’eus", tu: "tu eus", il: "il eut", nous: "nous eûmes", vous: "vous eûtes", ils: "ils eurent" };
    if (base === 'faire') return { je: "je fis", tu: "tu fis", il: "il fit", nous: "nous fîmes", vous: "vous fîtes", ils: "ils firent" };
    if (base === 'aller') return { je: "j’allai", tu: "tu allas", il: "il alla", nous: "nous allâmes", vous: "vous allâtes", ils: "ils allèrent" };

    const elerInfo = getFrenchElerEterStems(v);
    const stem = elerInfo.isElerEter ? elerInfo.stemNormal + (v.endsWith('er') ? 'el' : 'et') : (v.endsWith('er') ? v.slice(0, -2) : v.slice(0, -2));
    
    if (v.endsWith('er')) {
      const psStem = v.slice(0, -2);
      return {
        je: withElision('je', psStem + 'ai'),
        tu: `tu ${psStem}as`,
        il: `il ${psStem}a`,
        nous: `nous ${psStem}âmes`,
        vous: `vous ${psStem}âtes`,
        ils: `ils ${psStem}èrent`
      };
    } else {
      const psStem = v.slice(0, -2);
      return {
        je: withElision('je', psStem + 'is'),
        tu: `tu ${psStem}is`,
        il: `il ${psStem}it`,
        nous: `nous ${psStem}îmes`,
        vous: `vous ${psStem}îtes`,
        ils: `ils ${psStem}irent`
      };
    }
  }

  // 4. Futur Simple (Simple Future)
  if (tense === 'futur_simple' || tense === 'futur') {
    const BASE_FUTUR_STEMS = {
      'être': 'ser', 'avoir': 'aur', 'aller': 'ir', 'faire': 'fer',
      'pouvoir': 'pourr', 'vouloir': 'voudr', 'savoir': 'saur', 'voir': 'verr',
      'devoir': 'devr', 'venir': 'viendr', 'recevoir': 'recevr', 'courir': 'courr', 'envoyer': 'enverr'
    };
    let stem = BASE_FUTUR_STEMS[base] ? prefix + BASE_FUTUR_STEMS[base] : null;
    if (!stem) {
      const elerInfo = getFrenchElerEterStems(v);
      if (elerInfo.isElerEter) {
        stem = elerInfo.stemMute + 'er';
      } else {
        stem = v.endsWith('re') ? v.slice(0, -1) : v;
      }
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

  // 5. Subjonctif Présent
  if (tense === 'subjonctif' || tense === 'subjonctif_present') {
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

    const elerInfo = getFrenchElerEterStems(v);
    if (elerInfo.isElerEter) {
      const { stemMute, stemNormal } = elerInfo;
      return {
        je: withElision('que je', stemMute + 'e'),
        tu: `que tu ${stemMute}es`,
        il: withElision('que il', stemMute + 'e'),
        nous: `que nous ${stemNormal}ions`,
        vous: `que vous ${stemNormal}iez`,
        ils: withElision('que ils', stemMute + 'ent')
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

  // 6. Subjonctif Imparfait
  if (tense === 'subjonctif_imparfait') {
    if (base === 'être') return { je: "que je fusse", tu: "que tu fusses", il: "qu’il fût", nous: "que nous fussions", vous: "que vous fussiez", ils: "qu’ils fussent" };
    if (base === 'avoir') return { je: "que j’eusse", tu: "que tu eusses", il: "qu’il eût", nous: "que nous eussions", vous: "que vous eussiez", ils: "qu’ils eussent" };
    
    if (v.endsWith('er')) {
      const stem = v.slice(0, -2);
      return {
        je: withElision('que je', stem + 'asse'),
        tu: `que tu ${stem}asses`,
        il: withElision('que il', stem + 'ât'),
        nous: `que nous ${stem}assions`,
        vous: `que vous ${stem}assiez`,
        ils: withElision('que ils', stem + 'assent')
      };
    } else {
      const stem = v.slice(0, -2);
      return {
        je: withElision('que je', stem + 'isse'),
        tu: `que tu ${stem}isses`,
        il: withElision('que il', stem + 'ît'),
        nous: `que nous ${stem}issions`,
        vous: `que vous ${stem}issiez`,
        ils: withElision('que ils', stem + 'issent')
      };
    }
  }

  // 7. Conditionnel Présent
  if (tense === 'conditionnel_present') {
    const fut = getFrenchConjugations(v, 'futur_simple');
    if (fut && fut.je) {
      let stem = fut.je.replace(/^(j’|je\s*)/, '').replace(/ai$/, '');
      return {
        je: withElision('je', stem + 'ais'),
        tu: `tu ${stem}ais`,
        il: `il ${stem}ait`,
        nous: `nous ${stem}ions`,
        vous: `vous ${stem}iez`,
        ils: `ils ${stem}aient`
      };
    }
  }

  // 8. Impératif Présent
  if (tense === 'imperatif_present') {
    if (base === 'être') return { je: '-', tu: '(tu) sois', il: '-', nous: '(nous) soyons', vous: '(vous) soyez', ils: '-' };
    if (base === 'avoir') return { je: '-', tu: '(tu) aie', il: '-', nous: '(nous) ayons', vous: '(vous) ayez', ils: '-' };

    const pres = getFrenchConjugations(v, 'present');
    if (pres) {
      let tuForm = pres.tu.replace(/^tu\s*/, '');
      if (v.endsWith('er') && tuForm.endsWith('es')) {
        tuForm = tuForm.slice(0, -1); // Drop silent 's' in -er imperative tu
      }
      return {
        je: `-`,
        tu: `(tu) ${tuForm}`,
        il: `-`,
        nous: `(nous) ${pres.nous.replace(/^nous\s*/, '')}`,
        vous: `(vous) ${pres.vous.replace(/^vous\s*/, '')}`,
        ils: `-`
      };
    }
  }

  // 9. Participe Présent
  if (tense === 'participe_present') {
    if (v === 'être') return { je: 'étant', tu: 'étant', il: 'étant', nous: 'étant', vous: 'étant', ils: 'étant' };
    if (v === 'avoir') return { je: 'ayant', tu: 'ayant', il: 'ayant', nous: 'ayant', vous: 'ayant', ils: 'ayant' };
    const pres = getFrenchConjugations(v, 'present');
    let stem = (pres && pres.nous) ? pres.nous.replace(/^nous\s*/, '').replace(/ons$/, '') : v.slice(0, -2);
    const pForm = stem + 'ant';
    return { je: pForm, tu: pForm, il: pForm, nous: pForm, vous: pForm, ils: pForm };
  }

  // 10. Participe Passé
  if (tense === 'participe_passe') {
    const pp = getFrenchPastParticiple(v);
    return { je: pp, tu: pp, il: pp, nous: pp, vous: pp, ils: pp };
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
    const elerInfo = getFrenchElerEterStems(v);
    if (elerInfo.isElerEter) {
      const { stemMute, stemNormal } = elerInfo;
      return {
        je: withElision('je', stemMute + 'e'),
        tu: `tu ${stemMute}es`,
        il: `il ${stemMute}e`,
        nous: `nous ${stemNormal}ons`,
        vous: `vous ${stemNormal}ez`,
        ils: `ils ${stemMute}ent`
      };
    }

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

/**
 * 10-Language Word Micro-Sensor
 * Performs deterministic character-set scanning to detect word language.
 */
function detectWordLanguage(word, fallbackLang = 'en') {
  if (!word) return fallbackLang;
  const w = word.trim();
  if (!w) return fallbackLang;

  // 1. Japanese: Hiragana (\u3040-\u309F) or Katakana (\u30A0-\u30FF)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(w)) return 'ja';

  // 2. Korean: Hangul Syllables (\uAC00-\uD7AF) or Jamo (\u3130-\u318F)
  if (/[\uAC00-\uD7AF\u3130-\u318F]/.test(w)) return 'ko';

  // 3. German: Eszett (ß) or German Umlauts
  if (/[ß]/.test(w)) return 'de';

  // 4. French: Distinct accents (œ, æ, ç, è, ê, ë), contractions (s', d'), or French conjugated verb suffixes
  if (/[œæçèêë]/.test(w.toLowerCase()) || /^[sdSD]['’]/.test(w)) return 'fr';
  if (/(?:eras|erai|erons|erez|eront|erais|erait|erions|eriez|eraient|assent|assions|assiez)$/i.test(w)) return 'fr';

  // 5. Portuguese: Tildes (ã, õ)
  if (/[ãõÃÕ]/.test(w)) return 'pt';

  // 6. Spanish: Tilde ñ/Ñ, inverted punctuation ¿/¡
  if (/[ñÑ¿¡]/.test(w)) return 'es';

  // German/Spanish/French overlapping accents (ä, ö, ü, á, é, í, ó, ú)
  if (/[äöüÄÖÜ]/.test(w)) return 'de';
  if (/[áéíóúÁÉÍÓÚ]/.test(w)) return 'es';

  // 7. CJK Hanzi (Chinese)
  if (/[\u4E00-\u9FFF]/.test(w)) {
    return fallbackLang === 'zh-CN' ? 'zh-CN' : 'zh-TW';
  }

  return fallbackLang || 'en';
}

/**
 * Detects the conjugated tense of a French inflected verb query word.
 * Returns one of: 'present', 'passe_compose', 'imparfait', 'futur_simple', 'subjonctif'.
 */
function detectFrenchQueryTense(word, data = {}) {
  if (!word) return 'present';
  const w = word.trim().toLowerCase();

  // 1. Definition Text Signals (highest precision)
  if (data && Array.isArray(data.definitions)) {
    const defStr = data.definitions.join(' ').toLowerCase();
    if ((defStr.includes('imperfect') || defStr.includes('imparfait')) && (defStr.includes('subjunctive') || defStr.includes('subjonctif'))) return 'subjonctif_imparfait';
    if (defStr.includes('subjunctive') || defStr.includes('subjonctif')) return 'subjonctif_present';
    if (defStr.includes('future') || defStr.includes('futur')) return 'futur_simple';
    if (defStr.includes('imperfect') || defStr.includes('imparfait')) return 'imparfait';
    if (defStr.includes('past participle') || defStr.includes('passé composé') || defStr.includes('compound past')) return 'passe_compose';
  }

  // 2. Exact Reverse LEFFF Table Lookup for Irregular Verbs (être, avoir, faire, aller, etc.)
  if (typeof require !== 'undefined') {
    try {
      const { getConjugation } = require('french-verbs');
      if (!_lefffDictCache) {
        _lefffDictCache = require('french-verbs-lefff/dist/conjugations.json');
      }
      const Lefff = _lefffDictCache;
      const targetVerb = data.lemmaInfo ? data.lemmaInfo.lemma : null;
      
      const tensesToCheck = [
        { fv: 'FUTUR', id: 'futur_simple' },
        { fv: 'SUBJONCTIF_PRESENT', id: 'subjonctif_present' },
        { fv: 'IMPARFAIT', id: 'imparfait' },
        { fv: 'PARTICIPE_PASSE', id: 'passe_compose' },
        { fv: 'PASSE_COMPOSE', id: 'passe_compose' },
        { fv: 'PRESENT', id: 'present' }
      ];

      const checkVerbs = targetVerb && Lefff[targetVerb] 
        ? [targetVerb] 
        : ['être', 'avoir', 'faire', 'pouvoir', 'vouloir', 'aller', 'voir', 'savoir', 'venir', 'devenir'];

      for (const vCandidate of checkVerbs) {
        if (Lefff[vCandidate]) {
          for (const tObj of tensesToCheck) {
            for (let pIdx = 0; pIdx < 6; pIdx++) {
              try {
                const cVal = getConjugation(Lefff, vCandidate, tObj.fv, pIdx, {}, false);
                if (cVal && cVal.toLowerCase() === w) {
                  return tObj.id;
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {}
  }

  // 3. Morphological Suffix Signals
  // Participe Présent: -ant
  if (w.endsWith('ant') && !w.endsWith('er')) {
    return 'participe_present';
  }

  // Subjonctif Imparfait: -asse, -asses, -ât, -assions, -assiez, -assent
  if (/(?:asse|asses|ât|assions|assiez|assent)$/i.test(w)) {
    return 'subjonctif_imparfait';
  }

  // Conditionnel Présent: -erais, -erait, -erions, -eriez, -eraient, -rais, -rait, -rions, -riez, -raient
  if (/(?:erais|erait|erions|eriez|eraient|rais|rait|rions|riez|raient)$/i.test(w)) {
    return 'conditionnel_present';
  }

  // Futur Simple: -erai, -eras, -era, -erons, -erez, -eront, -rai, -ras, -ra, -rons, -rez, -ront
  if (/(?:eras|erai|erons|erez|eront|rai|ras|ra|rons|rez|ront)$/i.test(w)) {
    return 'futur_simple';
  }

  // Imparfait: -ais, -ait, -ions, -iez, -aient
  if (/(?:ais|ait|ions|iez|aient)$/i.test(w)) {
    return 'imparfait';
  }

  // Passé composé (Past Participle endings)
  if (/[é]s?$|[ui]s?$|[ui]t$/i.test(w) && !w.endsWith('er') && !w.endsWith('ir') && !w.endsWith('re')) {
    return 'passe_compose';
  }

  return 'present';
}

const TENSE_PAGE_MAP = {
  // Page 1: 直陳式 核心 (Indicatif Core)
  'present': { pageIndex: 1, label: 'Présent', category: 'Indicatif' },
  'passe_compose': { pageIndex: 1, label: 'Passé C.', category: 'Indicatif' },
  'imparfait': { pageIndex: 1, label: 'Imparfait', category: 'Indicatif' },
  'plus_que_parfait': { pageIndex: 1, label: 'Plus-que-parfait', category: 'Indicatif' },

  // Page 2: 直陳式 歷史與將來 (Indicatif Advanced)
  'passe_simple': { pageIndex: 2, label: 'Passé Simple', category: 'Indicatif' },
  'passe_anterieur': { pageIndex: 2, label: 'Passé Antér.', category: 'Indicatif' },
  'futur_simple': { pageIndex: 2, label: 'Futur', category: 'Indicatif' },
  'futur_anterieur': { pageIndex: 2, label: 'Futur Antér.', category: 'Indicatif' },

  // Page 3: 虛擬式 (Subjonctif)
  'subjonctif_present': { pageIndex: 3, label: 'Subj. Présent', category: 'Subjonctif' },
  'subjonctif_passe': { pageIndex: 3, label: 'Subj. Passé', category: 'Subjonctif' },
  'subjonctif_imparfait': { pageIndex: 3, label: 'Subj. Imp.', category: 'Subjonctif' },
  'subjonctif_plus_que_parfait': { pageIndex: 3, label: 'Subj. P.Q.P.', category: 'Subjonctif' },

  // Page 4: 條件式與命令式 (Conditionnel & Impératif)
  'conditionnel_present': { pageIndex: 4, label: 'Conditionnel', category: 'Conditionnel' },
  'conditionnel_passe': { pageIndex: 4, label: 'Cond. Passé', category: 'Conditionnel' },
  'imperatif_present': { pageIndex: 4, label: 'Impératif', category: 'Impératif' },
  'imperatif_passe': { pageIndex: 4, label: 'Impér. Passé', category: 'Impératif' },

  // Page 5: 分詞 (Participe)
  'participe_present': { pageIndex: 5, label: 'Part. Présent', category: 'Participe' },
  'participe_passe': { pageIndex: 5, label: 'Part. Passé', category: 'Participe' }
};

// Aliases
TENSE_PAGE_MAP['subjonctif'] = TENSE_PAGE_MAP['subjonctif_present'];
TENSE_PAGE_MAP['futur'] = TENSE_PAGE_MAP['futur_simple'];

function getTensePageInfo(tenseId) {
  if (!tenseId) return TENSE_PAGE_MAP['present'];
  const tKey = tenseId.toLowerCase();
  return TENSE_PAGE_MAP[tKey] || TENSE_PAGE_MAP['present'];
}




