// utils.js - General utility functions for text escaping and grammar helpers

// HTML escaping utility for XSS mitigation
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

// Helper to derive French feminine form for adjectives/nouns
function getFrenchFeminineForm(word) {
  if (!word || word.endsWith('e')) return null;
  
  // Check common endings
  if (word.endsWith('ien')) return word.slice(0, -3) + 'ienne';
  if (word.endsWith('en')) return word.slice(0, -2) + 'enne';
  if (word.endsWith('on')) return word.slice(0, -2) + 'onne';
  if (word.endsWith('er')) return word.slice(0, -2) + 'ère';
  if (word.endsWith('eux')) return word.slice(0, -3) + 'euse';
  if (word.endsWith('if')) return word.slice(0, -2) + 'ive';
  if (word.endsWith('el')) return word.slice(0, -2) + 'elle';
  
  // Irregular/Exceptions
  if (word === 'blanc') return 'blanche';
  if (word === 'public') return 'publique';
  if (word === 'beau') return 'belle';
  if (word === 'nouveau') return 'nouvelle';
  
  if (word.endsWith('c')) return word.slice(0, -1) + 'que';
  
  // Default suffix addition
  return word + 'e';
}

// Helper to retrieve French past participle
function getFrenchPastParticiple(verb) {
  const v = verb.toLowerCase().trim();
  const irregulars = {
    'être': 'été', 'avoir': 'eu', 'faire': 'fait', 'dire': 'dit',
    'pouvoir': 'pu', 'vouloir': 'voulu', 'savoir': 'su', 'voir': 'vu',
    'devoir': 'dû', 'venir': 'venu', 'devenir': 'devenu', 'revenir': 'revenu',
    'prendre': 'pris', 'comprendre': 'compris', 'apprendre': 'appris',
    'mettre': 'mis', 'partir': 'parti', 'sortir': 'sorti', 'lire': 'lu',
    'écrire': 'écrit', 'aller': 'allé', 'ouvrir': 'ouvert', 'découvrir': 'découvert',
    'offrir': 'offert', 'naître': 'né', 'mourir': 'mort', 'boire': 'bu', 'recevoir': 'reçu'
  };
  if (irregulars[v]) return irregulars[v];
  if (v.endsWith('er')) return v.slice(0, -2) + 'é';
  if (v.endsWith('ir')) return v.slice(0, -2) + 'i';
  if (v.endsWith('re')) return v.slice(0, -2) + 'u';
  return v;
}

// Helper to retrieve French verb conjugations across 4 core tenses: present, passe_compose, imparfait, futur_simple
function getFrenchConjugations(verb, tense = 'present') {
  const v = verb.toLowerCase().trim();

  // 1. Passé composé (Compound Past)
  if (tense === 'passe_compose') {
    const pp = getFrenchPastParticiple(v);
    const etreVerbs = ['aller', 'venir', 'devenir', 'revenir', 'partir', 'sortir', 'naître', 'mourir', 'entrer', 'monter', 'descendre', 'tomber', 'rester', 'retourner'];
    const usesEtre = etreVerbs.includes(v);

    if (usesEtre) {
      return {
        je: 'je suis ' + pp,
        tu: 'tu es ' + pp,
        il: 'il est ' + pp,
        nous: 'nous sommes ' + pp,
        vous: 'vous êtes ' + pp,
        ils: 'ils sont ' + pp
      };
    } else {
      return {
        je: "j’ai " + pp,
        tu: 'tu as ' + pp,
        il: 'il a ' + pp,
        nous: 'nous avons ' + pp,
        vous: 'vous avez ' + pp,
        ils: 'ils ont ' + pp
      };
    }
  }

  // 2. Imparfait (Imperfect)
  if (tense === 'imparfait') {
    if (v === 'être') {
      return { je: "j’étais", tu: "étais", il: "était", nous: "étions", vous: "étiez", ils: "étaient" };
    }
    const pres = getFrenchConjugations(v, 'present');
    let stem = '';
    if (pres && pres.nous) {
      stem = pres.nous.replace(/^nous\s*/, '').replace(/ons$/, '');
    } else {
      stem = v.endsWith('er') ? v.slice(0, -2) : (v.endsWith('ir') ? v.slice(0, -2) + 'iss' : v.slice(0, -2));
    }
    const isVowel = stem[0] && stem[0].match(/[aeiouyhéèàùâêîôû]/i);
    return {
      je: (isVowel ? "j’" : "je ") + stem + 'ais',
      tu: stem + 'ais',
      il: stem + 'ait',
      nous: stem + 'ions',
      vous: stem + 'iez',
      ils: stem + 'aient'
    };
  }

  // 3. Futur simple (Simple Future)
  if (tense === 'futur_simple') {
    const futurStems = {
      'être': 'ser', 'avoir': 'aur', 'aller': 'ir', 'faire': 'fer',
      'pouvoir': 'pourr', 'vouloir': 'voudr', 'savoir': 'saur', 'voir': 'verr',
      'devoir': 'devr', 'venir': 'viendr', 'devenir': 'deviendr', 'revenir': 'reviendr',
      'recevoir': 'recevr', 'courir': 'courr', 'envoyer': 'enverr'
    };
    let stem = futurStems[v];
    if (!stem) {
      if (v.endsWith('re')) stem = v.slice(0, -1);
      else stem = v;
    }
    const isVowel = stem[0] && stem[0].match(/[aeiouyhéèàùâêîôû]/i);
    return {
      je: (isVowel ? "j’" : "je ") + stem + 'ai',
      tu: stem + 'as',
      il: stem + 'a',
      nous: stem + 'ons',
      vous: stem + 'ez',
      ils: stem + 'ont'
    };
  }

  // 4. Présent (Default Present Tense)
  const irregulars = {
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
    'revenir': { je: 'reviens', tu: 'reviens', il: 'revient', nous: 'revenons', vous: 'revenez', ils: 'reviennent' },
    'devenir': { je: 'deviens', tu: 'deviens', il: 'devient', nous: 'devenons', vous: 'devenez', ils: 'deviennent' },
    'venir': { je: 'viens', tu: 'viens', il: 'vient', nous: 'venons', vous: 'venez', ils: 'viennent' },
    'prendre': { je: 'prends', tu: 'prends', il: 'prend', nous: 'prenons', vous: 'prenez', ils: 'prennent' },
    'comprendre': { je: 'comprends', tu: 'comprends', il: 'comprend', nous: 'comprenons', vous: 'comprenez', ils: 'comprennent' },
    'apprendre': { je: 'apprends', tu: 'apprends', il: 'apprend', nous: 'apprenons', vous: 'apprenez', ils: 'apprennent' },
    'mettre': { je: 'mets', tu: 'mets', il: 'met', nous: 'mettons', vous: 'mettez', ils: 'mettent' },
    'partir': { je: 'pars', tu: 'pars', il: 'part', nous: 'partons', vous: 'partez', ils: 'partent' },
    'sortir': { je: 'sors', tu: 'sors', il: 'sort', nous: 'sortons', vous: 'sortez', ils: 'sortent' },
    'lire': { je: 'lis', tu: 'lis', il: 'lit', nous: 'lisons', vous: 'lisez', ils: 'lisent' },
    'écrire': { je: 'écris', tu: 'écris', il: 'écrit', nous: 'écrivons', vous: 'écrivez', ils: 'écrivent' }
  };
  
  if (irregulars[v]) return irregulars[v];
  
  // Regular -er verbs
  if (v.endsWith('er')) {
    const stem = v.slice(0, -2);
    // Nous forms for -ger and -cer verbs
    const nousForm = v.endsWith('ger') ? stem + 'eons' : (v.endsWith('cer') ? stem.slice(0, -1) + 'çons' : stem + 'ons');
    return {
      je: (stem[0] && stem[0].match(/[aeiouyhéèàùâêîôû]/i) ? "j’" : "je ") + stem + 'e',
      tu: stem + 'es',
      il: stem + 'e',
      nous: nousForm,
      vous: stem + 'ez',
      ils: stem + 'ent'
    };
  }
  
  // Regular -ir verbs (finir type)
  if (v.endsWith('ir')) {
    const stem = v.slice(0, -2);
    return {
      je: 'je ' + stem + 'is',
      tu: stem + 'is',
      il: stem + 'it',
      nous: stem + 'issons',
      vous: stem + 'issez',
      ils: stem + 'issent'
    };
  }
  
  // Fallback or generic regular -re verbs
  if (v.endsWith('re')) {
    const stem = v.slice(0, -2);
    return {
      je: 'je ' + stem + 's',
      tu: stem + 's',
      il: stem + 't',
      nous: stem + 'ons',
      vous: stem + 'ez',
      ils: stem + 'ent'
    };
  }
  
  return null;
}

// Helper to estimate CEFR level (A1, A2, B1, B2, C1, C2) and badge colors
function getCEFRLevel(word, lang) {
  if (!word) return null;
  const w = word.toLowerCase().trim();
  
  const cefrDict = {
    // English Core Dictionary
    'a1': ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'house', 'book', 'cat', 'dog', 'apple', 'friend', 'family', 'water', 'food', 'car', 'school'],
    'a2': ['achieve', 'activity', 'advantage', 'advice', 'always', 'amount', 'answer', 'appear', 'article', 'available', 'beautiful', 'become', 'beginning', 'believe', 'benefit', 'better', 'between', 'building', 'business', 'careful', 'century', 'change', 'choose', 'clear', 'clothes', 'complete', 'decide', 'description', 'difference', 'different', 'difficult', 'discover', 'discussion', 'distance', 'education', 'effect', 'effort', 'enjoy', 'example', 'experience', 'explain', 'famous', 'foreign', 'future', 'important', 'improve', 'industry', 'information', 'interest', 'language', 'learn', 'lesson', 'letter', 'listen', 'measure', 'memory', 'method', 'mind', 'modern', 'moment', 'morning', 'move', 'natural', 'necessary', 'neighbor', 'notice', 'number', 'offer', 'office', 'opinion', 'opportunity', 'order', 'original', 'parent', 'pattern', 'performance', 'person', 'picture', 'place', 'plan', 'position', 'possible', 'practice', 'prepare', 'present', 'problem', 'process', 'produce', 'product', 'program', 'protect', 'provide', 'quality', 'question', 'reason', 'receive', 'report', 'require', 'result', 'return', 'science', 'section', 'service', 'simple', 'society', 'special', 'student', 'success', 'system', 'teacher', 'today', 'travel', 'understand', 'university', 'value', 'village', 'visit', 'weather', 'window', 'writer', 'yesterday'],
    'b1': ['accurate', 'adequate', 'advantageous', 'alternative', 'analyze', 'apparent', 'approach', 'appropriate', 'associate', 'assume', 'attribute', 'authority', 'capacity', 'category', 'circumstance', 'challenge', 'collaboration', 'complexity', 'component', 'concept', 'conclusion', 'conduct', 'consequence', 'considerable', 'consist', 'constant', 'constitute', 'constraint', 'context', 'contribution', 'convention', 'correspond', 'criteria', 'crucial', 'definition', 'demonstrate', 'derived', 'dimension', 'distinction', 'diversity', 'element', 'emphasis', 'empirical', 'ensure', 'environment', 'equivalent', 'establish', 'estimate', 'evidence', 'expansion', 'extension', 'factor', 'feature', 'framework', 'function', 'fundamental', 'generate', 'hypothesis', 'identify', 'illustration', 'impact', 'implication', 'indicate', 'individual', 'initial', 'insight', 'instance', 'integration', 'interaction', 'interpretation', 'investigation', 'item', 'journal', 'layer', 'mechanism', 'methodology', 'motivation', 'objective', 'outcome', 'parameter', 'perspective', 'phenomenon', 'potential', 'predict', 'principal', 'principle', 'priority', 'procedure', 'proportion', 'protocol', 'publication', 'reference', 'regional', 'regulation', 'relevant', 'reliability', 'requirement', 'research', 'resilience', 'resource', 'response', 'retention', 'scope', 'section', 'segment', 'significance', 'source', 'strategy', 'structure', 'subsequent', 'sufficient', 'sustainable', 'tendency', 'theory', 'transition', 'ultimate', 'underlying', 'validity', 'variable', 'version'],
    // French Core Dictionary
    'fr_a1': ['maison', 'manger', 'grand', 'petit', 'avec', 'pour', 'dans', 'sur', 'être', 'avoir', 'faire', 'aller', 'dire', 'voir', 'savoir', 'pouvoir', 'vouloir', 'venir', 'prendre', 'homme', 'femme', 'enfant', 'jour', 'temps', 'vie', 'chose', 'monde', 'nom', 'pays', 'eau', 'beau', 'bon', 'bien', 'oui', 'non', 'plus', 'ici', 'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'qui', 'que', 'quoi', 'quand', 'comment', 'pourquoi'],
    'fr_a2': ['attendre', 'choisir', 'comprendre', 'devenir', 'devoir', 'écrire', 'lire', 'mettre', 'partir', 'penser', 'répondre', 'sortir', 'trouver', 'vivre', 'besoin', 'cause', 'chemin', 'côté', 'exemple', 'fin', 'heure', 'idée', 'journée', 'lieu', 'main', 'moment', 'mot', 'nuit', 'œil', 'part', 'place', 'question', 'raison', 'soir', 'terre', 'travail', 'toujours', 'souvent', 'parfois', 'jamais', 'ensemble', 'nouveau', 'ancien', 'premier', 'dernier', 'jeune', 'vieux', 'meilleur', 'tout', 'chacun', 'plusieurs'],
    'fr_b1': ['susciter', 'définitivement', 'développement', 'contrainte', 'épanouissement', 'démarche', 'exigence', 'enjeu', 'soutenir', 'reconnaître', 'maintenir', 'bénéficier', 'compétence', 'dispositif', 'équilibre', 'évaluation', 'évolution', 'perspective', 'priorité', 'processus', 'réflexion', 'stratégie', 'transformation', 'valeur']
  };
  
  let level = 'B1';
  if (cefrDict.a1.includes(w) || cefrDict.fr_a1.includes(w)) level = 'A1';
  else if (cefrDict.a2.includes(w) || cefrDict.fr_a2.includes(w)) level = 'A2';
  else if (cefrDict.b1.includes(w) || cefrDict.fr_b1.includes(w)) level = 'B1';
  else {
    // Length & syllable complexity heuristics
    if (w.length <= 4) level = 'A1';
    else if (w.length <= 6) level = 'A2';
    else if (w.length <= 8) level = 'B1';
    else if (w.length <= 10) level = 'B2';
    else if (w.length <= 12) level = 'C1';
    else level = 'C2';
  }
  
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
