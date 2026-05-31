const PDF_GERCEK_ORNEKLER = [
  {
    id: 'pdf-exercise-4-1-haydn-symphony-101',
    baslik: 'Exercise 4.1 - Haydn Symphony No. 101',
    kategori: 'PDF Gerçek Örnekler',
    aciklama: 'PDF Exercise 4.1: Haydn Symphony No. 101 in D Major alıntısı. 2 diyezli, 4/4.',
    source: {
      type: 'pdf-real-example',
      lesson: 'Lesson 4',
      exercise: 'Exercise 4.1',
      title: 'Symphonie no. 101 in D Major - Haydn',
      page: 36,
    },
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' },
        {
          type: 'keySignature',
          ad: '2 diyezli donanım',
          gorunum: '♯♯',
          hucreler: [[1, 4, 6], [1, 4, 6]],
        },
        { type: 'timeSignature', ad: '4/4' },

        // Bar 1: 4th octave F minim, 4th octave G minim
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'ikilik' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' },
        { type: 'barline' },

        // Bar 2: 4th octave A minim, G quaver, F quaver, E quaver, D quaver
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'ikilik' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
        { type: 'barline' },

        // Bar 3: 4th octave B crotchet, 5th octave C, D, E crotchets
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },

        // Bar 4: 5th octave D minim, 5th octave C minim
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'ikilik' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'ikilik' },
        { type: 'barline' },

        // Bar 5: 5th octave E minim, 5th octave F minim
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'ikilik' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'ikilik' },
        { type: 'barline' },

        // Bar 6: 5th octave G minim, G quaver, F quaver, E quaver, D quaver
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'ikilik' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'sekizlik' },
        { type: 'barline' },

        // Bar 7: 5th octave C, D, E, F crotchets
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },

        // Bar 8: 5th octave D crotchet, crotchet rest, minim rest, double barline
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'rest', sureAd: 'dörtlük' },
        { type: 'rest', sureAd: 'ikilik' },
        {
          type: 'sectionalBarline',
          ad: 'Çift ölçü çizgisi',
          gorunum: '𝄁',
          hucreler: [[1, 2, 6], [1, 3]],
        },
      ],
    },
  },

  {
    id: 'pdf-exercise-4-4-time-signature-changes',
    baslik: 'Exercise 4.4 - Zaman İmzası Değişimleri',
    kategori: 'PDF Gerçek Örnekler',
    aciklama: 'PDF Exercise 4.4: 3/4, 2/4, 7/8 ve tekrar 3/4 zaman imzası değişimleri.',
    source: {
      type: 'pdf-real-example',
      lesson: 'Lesson 4',
      exercise: 'Exercise 4.4',
      page: 38,
    },
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' },
        {
          type: 'keySignature',
          ad: '1 bemollü donanım',
          gorunum: '♭',
          hucreler: [[1, 2, 6]],
        },
        { type: 'timeSignature', ad: '3/4' },

        // Bar 1: 5th E dotted quaver, 5th D semiquaver, 5th E quaver, 4th B quaver, 5th E crotchet
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'sekizlik', dotted: true },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'onaltılık' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },

        // Bar 2: 4th E dotted quaver, 4th D semiquaver, 4th E quaver, 4th G quaver, 4th E crotchet
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik', dotted: true },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'onaltılık' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
        { type: 'barline' },

        // Bar 3: change to 2/4, 4th E minim
        { type: 'timeSignatureChange', ad: '2/4' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'ikilik' },
        { type: 'barline' },

        // Bar 4: change to 7/8, whole bar rest
        { type: 'timeSignatureChange', ad: '7/8' },
        { type: 'rest', sureAd: 'tam' },
        { type: 'barline' },

        // Bar 5: crotchet rest, quaver rest, 5th F, D, G, E quavers
        { type: 'rest', sureAd: 'dörtlük' },
        { type: 'rest', sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'sekizlik' },
        { type: 'barline' },

        // Bar 6: change to 3/4, 5th F crotchet, crotchet rest, crotchet rest, double barline
        { type: 'timeSignatureChange', ad: '3/4' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'dörtlük' },
        { type: 'rest', sureAd: 'dörtlük' },
        { type: 'rest', sureAd: 'dörtlük' },
        {
          type: 'sectionalBarline',
          ad: 'Çift ölçü çizgisi',
          gorunum: '𝄁',
          hucreler: [[1, 2, 6], [1, 3]],
        },
      ],
    },
  },

  {
    id: 'pdf-lesson-5-oh-my-lovin-brother-tie',
    baslik: 'Lesson 5 - Oh, My Lovin’ Brother Tie Örneği',
    kategori: 'PDF Gerçek Örnekler',
    aciklama: 'PDF Lesson 5 tie örneği: Oh, My Lovin’ Brother. Kesitte tie bar 2’den bar 3’e geçer.',
    source: {
      type: 'pdf-real-example',
      lesson: 'Lesson 5',
      title: 'Oh, My Lovin’ Brother',
      page: 40,
    },
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' },
        {
          type: 'keySignature',
          ad: '1 bemollü donanım',
          gorunum: '♭',
          hucreler: [[1, 2, 6]],
        },
        { type: 'timeSignature', ad: 'cut common' },

        // Bar 1: crotchet rest, 4th F quaver, 4th F quaver, 4th G crotchet, 4th A crotchet
        { type: 'rest', sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' },
        { type: 'barline' },

        // Bar 2: 4th B minim, 4th B minim, tie
        { id: 'omb-b2-b1', type: 'note', notaAd: 'si', oktav: 4, sureAd: 'ikilik' },
        { id: 'omb-b2-b2', type: 'note', notaAd: 'si', oktav: 4, sureAd: 'ikilik' },
        {
          type: 'tie',
          basRef: 'omb-b2-b2',
          sonRef: 'omb-b3-b1',
          notaRefler: ['omb-b2-b2', 'omb-b3-b1'],
        },
        { type: 'barline' },

        // Bar 3: 4th B crotchet, 4th B quaver, 4th B quaver, 4th F crotchet, 4th G crotchet
        { id: 'omb-b3-b1', type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' },
        { type: 'barline' },

        // Bar 4: 4th A semibreve
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'birlik' },
        { type: 'barline' },

        // Bar 5: crotchet rest, 4th A quaver, 4th A quaver, 5th C crotchet, 4th A crotchet
        { type: 'rest', sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' },
      ],
    },
  },

  {
    id: 'pdf-exercise-5-2-tie-slur',
    baslik: 'Exercise 5.2 - Tie ve Slur Ayrımı',
    kategori: 'PDF Gerçek Örnekler',
    aciklama: 'PDF Exercise 5.2: tie ve slur ayrımını içeren gerçek alıştırma.',
    source: {
      type: 'pdf-real-example',
      lesson: 'Lesson 5',
      exercise: 'Exercise 5.2',
      page: 47,
    },
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' },
        {
          type: 'keySignature',
          ad: '2 bemollü donanım',
          gorunum: '♭♭',
          hucreler: [[1, 2, 6], [1, 2, 6]],
        },
        { type: 'timeSignature', ad: '3/4' },

        // Bar 1: 5th F minim, slur, 5th natural E crotchet
        { id: 'ex52-b1-f', type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'ikilik' },
        { id: 'ex52-b1-e', type: 'note', notaAd: 'mi', oktav: 5, accidental: 'natural', sureAd: 'dörtlük' },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b1-f',
          sonRef: 'ex52-b1-e',
          notaRefler: ['ex52-b1-f', 'ex52-b1-e'],
        },
        { type: 'barline' },

        // Bar 2: 5th flat E crotchet, slur, 5th D crotchet, 5th C crotchet
        { id: 'ex52-b2-eb', type: 'note', notaAd: 'mi', oktav: 5, accidental: 'flat', sureAd: 'dörtlük' },
        { id: 'ex52-b2-d', type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b2-eb',
          sonRef: 'ex52-b2-d',
          notaRefler: ['ex52-b2-eb', 'ex52-b2-d'],
        },
        { type: 'barline' },

        // Bar 3: 4th B minim, 5th D quaver, slur, 4th B quaver
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'ikilik' },
        { id: 'ex52-b3-d', type: 'note', notaAd: 're', oktav: 5, sureAd: 'sekizlik' },
        { id: 'ex52-b3-b', type: 'note', notaAd: 'si', oktav: 4, sureAd: 'sekizlik' },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b3-d',
          sonRef: 'ex52-b3-b',
          notaRefler: ['ex52-b3-d', 'ex52-b3-b'],
        },
        { type: 'barline' },

        // Bar 4: A quaver slur C quaver slur F quaver slur E quaver, G quaver slur F quaver
        { id: 'ex52-b4-a', type: 'note', notaAd: 'la', oktav: 4, sureAd: 'sekizlik' },
        { id: 'ex52-b4-c', type: 'note', notaAd: 'do', oktav: 5, sureAd: 'sekizlik' },
        { id: 'ex52-b4-f', type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'sekizlik' },
        { id: 'ex52-b4-e', type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'sekizlik' },
        { id: 'ex52-b4-g', type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'sekizlik' },
        { id: 'ex52-b4-f2', type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'sekizlik' },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b4-a',
          sonRef: 'ex52-b4-c',
          notaRefler: ['ex52-b4-a', 'ex52-b4-c'],
        },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b4-c',
          sonRef: 'ex52-b4-f',
          notaRefler: ['ex52-b4-c', 'ex52-b4-f'],
        },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b4-f',
          sonRef: 'ex52-b4-e',
          notaRefler: ['ex52-b4-f', 'ex52-b4-e'],
        },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b4-g',
          sonRef: 'ex52-b4-f2',
          notaRefler: ['ex52-b4-g', 'ex52-b4-f2'],
        },
        { type: 'barline' },

        // Bar 7-8 tie section from PDF: Bar 7 B crotchet, rest, 5th B crotchet tied; Bar 8 5th B dotted minim tied
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' },
        { type: 'rest', sureAd: 'dörtlük' },
        { id: 'ex52-b7-b5', type: 'note', notaAd: 'si', oktav: 5, sureAd: 'dörtlük' },
        {
          type: 'tie',
          basRef: 'ex52-b7-b5',
          sonRef: 'ex52-b8-b5',
          notaRefler: ['ex52-b7-b5', 'ex52-b8-b5'],
        },
        { type: 'barline' },

        { id: 'ex52-b8-b5', type: 'note', notaAd: 'si', oktav: 5, sureAd: 'ikilik', dotted: true },
        {
          type: 'tie',
          basRef: 'ex52-b8-b5',
          sonRef: 'ex52-b9-b5',
          notaRefler: ['ex52-b8-b5', 'ex52-b9-b5'],
        },
        { type: 'barline' },

        // Bar 9: 5th B minim, slur, 5th natural B crotchet
        { id: 'ex52-b9-b5', type: 'note', notaAd: 'si', oktav: 5, sureAd: 'ikilik' },
        { id: 'ex52-b9-nb5', type: 'note', notaAd: 'si', oktav: 5, accidental: 'natural', sureAd: 'dörtlük' },
        {
          type: 'slur',
          mode: 'single',
          basRef: 'ex52-b9-b5',
          sonRef: 'ex52-b9-nb5',
          notaRefler: ['ex52-b9-b5', 'ex52-b9-nb5'],
        },
      ],
    },
  },
];

export const TURK_COCUK_SARKILARI_KATALOG = [
  {
    id: 'tr-cocuk-daha-dun-annemizin',
    baslik: 'Daha Dün Annemizin',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Okula yeni baslayan cocuklara okulu sevdirmek icin soylenen klasik okul sarkisinin tam melodisi.',
    tema: ['okul', '1. sinif', 'uyum haftasi'],
    source: { type: 'catalog-song', origin: 'known-school-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' },
        { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] },
        { type: 'timeSignature', ad: '4/4' },
        
        // Bar 1-4: Daha dün annemizin kollarında yaşarken
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },

        // Bar 5-8: Çiçekli bahçemizin yollarında koşarken
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },

        // Bar 9-12: Şimdi okullu olduk sınıfları doldurduk
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'ikilik' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
{
  id: 'tr-cocuk-ogretmenim-canim-benim',
  baslik: 'Öğretmenim Canım Benim',
  kategori: 'Türk Çocuk Şarkıları',
  aciklama: 'Kullanıcının verdiği görsel notasyondan girilmiş örnek. 4/4, do majör, tekrar çizgileri dahil.',
  playable: true,
  durum: 'nota-girildi',
  source: {
    type: 'user-provided-image',
    title: 'Öğretmenim',
    notation: 'Musa Çetiner',
    composer: 'Erdoğan Okyay',
    lyricist: 'Rakım Çalapala',
  },
  braille: {
    format: 'tokens',
    tokens: [
      { type: 'clef', clef: 'treble' },
      { type: 'timeSignature', ad: '4/4' },

      // Ölçü 1
      // Do 4'lük, Do-Re 8'lik, Mi 4'lük, Mi 4'lük
      { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
      { type: 'barline' },

      // Ölçü 2
      // Fa noktalı 8'lik, Mi 16'lık, Re 8'lik,
      // Re noktalı 8'lik, Mi 16'lık, Re 8'lik, Do 4'lük
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik', dotted: true },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'onaltılık' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik', dotted: true },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'onaltılık' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' },
      { type: 'barline' },

      // Ölçü 3
      // Re-Mi 8'lik, Fa 4'lük, Sol 4'lük, Mi 4'lük
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
      { type: 'barline' },

      // Ölçü 4
      // La-Sol-Mi-Fa 8'lik, Re 2'lik
      { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'ikilik' },
      { type: 'barline' },

      // Ölçü 5
      // Re 4'lük, Re-Mi 8'lik, Fa 2'lik
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'ikilik' },
      { type: 'barline' },

      // Ölçü 6
      // Mi 4'lük, Mi noktalı 8'lik, Fa 16'lık, Sol 2'lik
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik', dotted: true },
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'onaltılık' },
      { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' },
      { type: 'barline' },

      // Ölçü 7
      // La 4'lük, Sol 4'lük, Re 4'lük, Mi 4'lük
      { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
      { type: 'barline' },

      // Ölçü 8
      // Fa 4'lük, Mi-Re 8'lik, Do 2'lik, tekrar sonu
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'ikilik' },
      {
        type: 'endRepeat',
        ad: 'Tekrar sonu',
        gorunum: '𝄇',
        hucreler: [[1, 2, 6], [2, 3, 5, 6]],
      },

      // Ölçü 9 başı: tekrar başlangıcı
      {
        type: 'beginRepeat',
        ad: 'Tekrar başlangıcı',
        gorunum: '𝄆',
        hucreler: [[1, 2, 6], [2, 3, 5, 6]],
      },

      // Ölçü 9
      // Mi 8'lik, Sol noktalı 4'lük, Mi 4'lük, Sol 4'lük
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük', dotted: true },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' },
      { type: 'barline' },

      // Ölçü 10
      // Re-Mi 8'lik, Fa 4'lük, Mi 2'lik
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'ikilik' },
      { type: 'barline' },

      // Ölçü 11
      // Re 4'lük, Mi-Fa 8'lik, Sol 4'lük, Fa 4'lük
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' },
      { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' },
      { type: 'barline' },

      // Ölçü 12
      // Mi 4'lük, Re 4'lük, Do 2'lik, tekrar sonu
      { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' },
      { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'ikilik' },
      {
        type: 'endRepeat',
        ad: 'Tekrar sonu',
        gorunum: '𝄇',
        hucreler: [[1, 2, 6], [2, 3, 5, 6]],
      },
    ],
  },
},
  {
    id: 'tr-cocuk-tohumlar-fidana',
    baslik: 'Tohumlar Fidana',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Agac sevgisi ve orman bilincini isleyen tam sarki.',
    tema: ['doga', 'orman', 'cevre', 'agac sevgisi'],
    source: { type: 'catalog-song', origin: 'known-school-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '4/4' },

        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'ikilik', dotted: true },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
  {
    id: 'tr-cocuk-kucuk-kurbaga',
    baslik: 'Küçük Kurbağa',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Kuyrugun nerede, ku-vak ku-vak bolumleri dahil tamami.',
    tema: ['hayvanlar', 'ritim', 'hareketli oyun'],
    source: { type: 'catalog-song', origin: 'known-child-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '2/4' },

        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },

        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },

        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
  {
    id: 'tr-cocuk-ali-babanin-bir-ciftligi-var',
    baslik: 'Ali Babanın Bir Çiftliği Var',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Hayvanlari ve seslerini iceren 12 olculuk tam tam sarki.',
    tema: ['hayvanlar', 'ciftlik', 'ses taklidi', 'grup etkinligi'],
    source: { type: 'catalog-song', origin: 'known-child-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '4/4' },

        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' }, { type: 'rest', sureAd: 'ikilik' }, { type: 'barline' },

        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' }, { type: 'rest', sureAd: 'ikilik' }, { type: 'barline' },

        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' }, { type: 'rest', sureAd: 'ikilik' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
  {
    id: 'tr-cocuk-bak-postaci-geliyor',
    baslik: 'Bak Postacı Geliyor',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Postaci meslegini tanitan klasigin tam melodisi.',
    tema: ['meslekler', 'haberlesme', 'postaci'],
    source: { type: 'catalog-song', origin: 'known-school-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '2/4' },

        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
  {
    id: 'tr-cocuk-mini-mini-bir-kus',
    baslik: 'Mini Mini Bir Kuş',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Cik cik cik diye oter bolumunu iceren tam melodisi.',
    tema: ['hayvan sevgisi', 'yardimlasma', 'merhamet'],
    source: { type: 'catalog-song', origin: 'known-child-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '2/4' },

        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },

        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
  {
    id: 'tr-cocuk-ari-viz-viz-viz',
    baslik: 'Arı Vız Vız Vız',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Yaz geldi cicekler acti ve Ari viz viz bolumlerinin tamamini barindiran 8 olculuk sarki.',
    tema: ['arilar', 'caliskanlik', 'ilkbahar', 'doga'],
    source: { type: 'catalog-song', origin: 'known-child-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '2/4' },

        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
  {
    id: 'tr-cocuk-kirmizi-balik',
    baslik: 'Kırmızı Balık',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Kirmizi balik ve balikci hasan bolumlerini iceren 12 olculuk tam cocuk sarkisi.',
    tema: ['oyun', 'hareket', 'balik', 'dramatizasyon'],
    source: { type: 'catalog-song', origin: 'known-child-song' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '2/4' },

        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'rest', sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'rest', sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'fa', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 'mi', oktav: 4, sureAd: 'sekizlik' }, { type: 'note', notaAd: 're', oktav: 4, sureAd: 'sekizlik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 4, sureAd: 'dörtlük' }, { type: 'rest', sureAd: 'dörtlük' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
  {
    id: 'tr-cocuk-arkadasim-esek',
    baslik: 'Arkadaşım Eşek',
    kategori: 'Turk Cocuk Sarkilari',
    aciklama: 'Kac yil oldu saymadim kismi ve Arkadasim Esek nakaratini barindiran tam duzenleme.',
    tema: ['arkadaslik', 'hayvanlar', 'koro', 'populer cocuk sarkisi'],
    source: { type: 'catalog-song', origin: 'copyrighted-known-song', note: 'Kıta ve Nakarat (8 tam ölçü)' },
    durum: 'hazir',
    playable: true,
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' }, { type: 'keySignature', ad: 'La Minör', gorunum: '', hucreler: [] }, { type: 'timeSignature', ad: '4/4' },

        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'ikilik' }, { type: 'note', notaAd: 're', oktav: 5, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'ikilik' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'ikilik' }, { type: 'barline' },
        
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'ikilik' }, { type: 'note', notaAd: 're', oktav: 5, sureAd: 'ikilik' }, { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'si', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'dörtlük' }, { type: 'note', notaAd: 'sol', oktav: 4, sureAd: 'dörtlük' }, { type: 'barline' },
        { type: 'note', notaAd: 'la', oktav: 4, sureAd: 'birlik' },
        { type: 'sectionalBarline', ad: 'Çift ölçü çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3]] }
      ],
    },
  },
];

const TURK_MARSI_NOTA_ADLARI = {
  La: 'la',
  Si: 'si',
  Do: 'do',
  Re: 're',
  Mi: 'mi',
  Fa: 'fa',
  Sol: 'sol',
};

const TURK_MARSI_GRUPLERI = [
  ['La', 'Si', 'La', 'Sol#', 'Fa#', 'La', 'Sol', 'Fa#'],
  ['Mi', 'Fa#', 'Sol#', 'Mi', 'Do#', 'Re#', 'Mi', 'Do#'],
  ['Re#', 'Mi', 'Fa#', 'Re#', 'Do', 'Do#', 'Re#', 'Do'],
  ['Do#', 'Mi*', 'Re*', 'Do#*', 'Si', 'La', 'Si', 'Do#*'],
  ['Re*', 'Mi*', 'Fa#*', 'Sol#*', 'La*', 'La*', 'Sol#*', 'Fa#*'],
  ['Mi*', 'Mi*', 'Re*', 'Do#*', 'Si', 'La', 'Si', 'Do#*'],
  ['Re*', 'Mi*', 'Fa#*', 'Sol#*', 'La*', 'La#*', 'Si*', 'Mi*'],
  ['Re*', 'Do#*', 'Si', 'La', 'Si', 'Do#*', 'Re*', 'Mi*'],
  ['Fa#*', 'Sol#*', 'La*', 'La*', 'Sol#*', 'Fa#*', 'Mi*', 'Mi*'],
  ['Re*', 'Do#*', 'Si', 'Do#*', 'Mi*', 'La', 'Do#*', 'Si'],
  ['Re*', 'Sol#', 'Si', 'La', 'Do#*', 'Re*', 'Do#*', 'Si'],
  ['La', 'Si', 'La', 'Sol#', 'Fa#', 'La', 'Sol#', 'Fa#'],
  ['Fa', 'Fa#', 'Sol#', 'Fa', 'Do#', 'Re#', 'Fa', 'Do#'],
  ['Fa#', 'Fa', 'Fa#', 'Sol#', 'La', 'Sol#', 'La', 'Si'],
  ['Do#*', 'Do*', 'Do#*', 'Do*', 'Do#*', 'Do*', 'Do#*', 'La#'],
  ['Re*', 'Do#*', 'Re*', 'Do#*', 'Re*', 'Do#*', 'Re*', 'Do#*'],
  ['Re*', 'Do#*', 'Si', 'La', 'Sol#', 'La', 'Si', 'Sol#'],
  ['La', 'Si', 'Do#*', 'Fa#', 'Fa', 'Fa#', 'Sol#', 'Fa'],
];

function turkMarsiNotaTokeniOlustur(token, sureAd = 'onaltılık') {
  const temiz = String(token || '').trim();
  const eslesme = temiz.match(/^(La|Si|Do|Re|Mi|Fa|Sol)(#?)(\*?)$/i);

  if (!eslesme) {
    throw new Error(`Geçersiz Türk Marşı notası: ${temiz}`);
  }

  const adHam = eslesme[1];
  const diyezMi = eslesme[2] === '#';
  const ustOktavMi = eslesme[3] === '*';
  const ad = adHam.charAt(0).toUpperCase() + adHam.slice(1).toLowerCase();

  return {
    type: 'note',
    notaAd: TURK_MARSI_NOTA_ADLARI[ad],
    oktav: ustOktavMi ? 6 : 5,
    sureAd,
    ...(diyezMi ? { accidental: 'sharp' } : {}),
  };
}

const TURK_MARSI_TOKENLERI = [
  { type: 'clef', clef: 'treble' },
  { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] },
  { type: 'timeSignature', ad: '2/4' },
  ...TURK_MARSI_GRUPLERI.flatMap((grup) => [
    ...grup.map((nota) => turkMarsiNotaTokeniOlustur(nota)),
    { type: 'barline' },
  ]),
  turkMarsiNotaTokeniOlustur('Fa#', 'ikilik'),
  { type: 'finalBarline', ad: 'Bitiş çizgisi', gorunum: '𝄂', hucreler: [] },
];

const BESTECI_ORNEKLERI = [
  {
    id: 'beethoven-ode-to-joy',
    baslik: 'Neşeye Övgü',
    kategori: 'Besteci',
    aciklama: 'Beethoven – Ode to Joy başlangıcı, basit C majör uyarlama.',
    source: { type: 'composer-example', composer: 'Ludwig van Beethoven' },
    durum: 'hazir',
    playable: true,
    header: {
      composer: 'Ludwig van Beethoven',
      tempo: '♩ = 120',
      timeSignature: '4/4',
      keySignature: { ad: 'Do Majör', gorunum: '', hucreler: [] },
    },
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' },
        { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] },
        { type: 'timeSignature', ad: '4/4' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'do', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük', dotted: true },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'sekizlik' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'ikilik' },
        { type: 'finalBarline', ad: 'Bitiş çizgisi', gorunum: '𝄂', hucreler: [] },
      ],
    },
  },
  {
    id: 'mozart-eine-kleine',
    baslik: 'Eine kleine Nachtmusik',
    kategori: 'Besteci',
    aciklama: 'Mozart – Eine kleine Nachtmusik başlangıç teması, basit C majör uyarlama.',
    source: { type: 'composer-example', composer: 'Wolfgang Amadeus Mozart' },
    durum: 'hazir',
    playable: true,
    header: {
      composer: 'Wolfgang Amadeus Mozart',
      tempo: '♩ = 132',
      timeSignature: '4/4',
      keySignature: { ad: 'Do Majör', gorunum: '', hucreler: [] },
    },
    braille: {
      format: 'tokens',
      tokens: [
        { type: 'clef', clef: 'treble' },
        { type: 'keySignature', ad: 'Do Majör', gorunum: '', hucreler: [] },
        { type: 'timeSignature', ad: '4/4' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 're', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'si', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },
        { type: 'note', notaAd: 're', oktav: 6, sureAd: 'ikilik' },
        { type: 'note', notaAd: 'do', oktav: 6, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'si', oktav: 5, sureAd: 'dörtlük' },
        { type: 'barline' },
        { type: 'note', notaAd: 'la', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'sol', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'fa', oktav: 5, sureAd: 'dörtlük' },
        { type: 'note', notaAd: 'mi', oktav: 5, sureAd: 'dörtlük' },
        { type: 'finalBarline', ad: 'Bitiş çizgisi', gorunum: '𝄂', hucreler: [] },
      ],
    },
  },
  {
    id: 'mozart-turk-marsi',
    baslik: 'Türk Marşı',
    kategori: 'Besteci',
    aciklama: 'Mozart – Türk Marşı / Rondo Alla Turca. Görseldeki nota adları sırasına göre uzun 2/4 eğitim dizisi.',
    source: { type: 'composer-example', composer: 'Wolfgang Amadeus Mozart' },
    durum: 'hazir',
    playable: true,
    header: {
      title: 'Türk Marşı',
      composer: 'Wolfgang Amadeus Mozart',
      tempo: '♩ = 132',
      timeSignature: {
        ad: '2/4',
        gorunum: '2/4',
      },
      keySignature: { ad: 'Do Majör', gorunum: '', hucreler: [] },
    },
    braille: {
      format: 'tokens',
      tokens: TURK_MARSI_TOKENLERI,
    },
  },
];

export const MUSIC_BRAILLE_EXAMPLES = [
  ...PDF_GERCEK_ORNEKLER,
  ...BESTECI_ORNEKLERI,
  ...TURK_COCUK_SARKILARI_KATALOG,
];