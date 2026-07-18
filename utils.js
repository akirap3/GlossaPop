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

// Helper to retrieve French present tense conjugations
function getFrenchConjugations(verb) {
  const v = verb.toLowerCase().trim();
  
  // Irregulars
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
