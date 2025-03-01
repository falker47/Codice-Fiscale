// Mappe globali per i comuni
let comuniByName = {};
let comuniByBelfiore = {};

// Carica il file JSON e popola le mappe e il datalist per l'autocomplete
function loadComuni() {
  return fetch('DB-province.json')
    .then(response => response.json())
    .then(data => {
      const datalist = document.getElementById("comuniList");
      data.forEach(item => {
        const comuneName = item["DESCRIZIONE COMUNE"].toUpperCase();
        const belfiore = item["CODICE BELFIORE"];
        const sigla = item["SIGLA"];

        // Popola la mappa per la generazione CF
        comuniByName[comuneName] = {
          belfiore: belfiore,
          sigla: sigla
        };

        // Popola la mappa inversa per la decodifica
        comuniByBelfiore[belfiore] = {
          name: item["DESCRIZIONE COMUNE"],
          sigla: sigla
        };

        // Aggiungi l'opzione al datalist
        let option = document.createElement("option");
        option.value = comuneName;
        datalist.appendChild(option);
      });
      console.log("Mappe dei comuni caricate:", comuniByName, comuniByBelfiore);
    })
    .catch(error => {
      console.error("Errore nel caricamento del file JSON:", error);
    });
}

// Utility per la navigazione col tasto Invio
function focusNextFieldOnEnter(currentId, nextId) {
  const currentEl = document.getElementById(currentId);
  currentEl.addEventListener("keydown", function(e) {
    if(e.key === "Enter") {
      e.preventDefault();
      document.getElementById(nextId).focus();
    }
  });
}

// Funzioni di utilità per estrarre consonanti e vocali
function getConsonants(str) {
  return str.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, '');
}

function getVowels(str) {
  return str.toUpperCase().replace(/[^AEIOU]/g, '');
}

// Genera il codice per il cognome
function generateSurnameCode(surname) {
  let cons = getConsonants(surname);
  let vowels = getVowels(surname);
  return (cons + vowels + "XXX").slice(0, 3);
}

// Genera il codice per il nome
function generateNameCode(name) {
  let cons = getConsonants(name);
  let vowels = getVowels(name);
  let code = "";
  if (cons.length >= 4) {
    // Se ci sono almeno 4 consonanti, prendi la prima, la terza e la quarta
    code = cons[0] + cons[2] + cons[3];
  } else {
    code = (cons + vowels + "XXX").slice(0, 3);
  }
  return code;
}

// Genera la parte relativa alla data di nascita e al sesso
function generateDateCode(birthdate, gender) {
  let date = new Date(birthdate);
  let year = date.getFullYear().toString().slice(-2);
  let month = date.getMonth(); // 0-based
  const monthMap = ['A','B','C','D','E','H','L','M','P','R','S','T'];
  let day = date.getDate();
  if (gender === "F") {
    day += 40;
  }
  let dayStr = day < 10 ? "0" + day : day.toString();
  return year + monthMap[month] + dayStr;
}

// Recupera il codice del comune dalla mappa
function getPlaceCode(place) {
  let codice = comuniByName[place.toUpperCase()];
  if (!codice) {
    alert("Comune non trovato nel database!");
    return "XXXX";
  }
  return codice.belfiore;
}

// Calcola il carattere di controllo (check digit) secondo l'algoritmo ufficiale
function generateCheckDigit(cf15) {
  const oddValues = {
    '0':1, '1':0, '2':5, '3':7, '4':9, '5':13, '6':15, '7':17, '8':19, '9':21,
    'A':1, 'B':0, 'C':5, 'D':7, 'E':9, 'F':13, 'G':15, 'H':17, 'I':19, 'J':21,
    'K':2, 'L':4, 'M':18, 'N':20, 'O':11, 'P':3, 'Q':6, 'R':8, 'S':12, 'T':14,
    'U':16, 'V':10, 'W':22, 'X':25, 'Y':24, 'Z':23
  };
  const evenValues = {
    '0':0, '1':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9,
    'A':0, 'B':1, 'C':2, 'D':3, 'E':4, 'F':5, 'G':6, 'H':7, 'I':8, 'J':9,
    'K':10, 'L':11, 'M':12, 'N':13, 'O':14, 'P':15, 'Q':16, 'R':17, 'S':18, 'T':19,
    'U':20, 'V':21, 'W':22, 'X':23, 'Y':24, 'Z':25
  };
  let sum = 0;
  for (let i = 0; i < cf15.length; i++) {
    let c = cf15[i];
    // Indice dispari (1-based) => oddValues, altrimenti evenValues
    if ((i + 1) % 2 !== 0) {
      sum += oddValues[c];
    } else {
      sum += evenValues[c];
    }
  }
  let remainder = sum % 26;
  return String.fromCharCode(65 + remainder);
}

// Funzione principale per generare il codice fiscale
function generateCodiceFiscale(surname, name, birthdate, gender, place) {
  let surnameCode = generateSurnameCode(surname);
  let nameCode = generateNameCode(name);
  let dateCode = generateDateCode(birthdate, gender);
  let placeCode = getPlaceCode(place);
  let partialCF = surnameCode + nameCode + dateCode + placeCode;
  let checkDigit = generateCheckDigit(partialCF);
  return partialCF + checkDigit;
}

// Funzione per decodificare (in parte) il codice fiscale
function decodeCodiceFiscale(cf) {
  if (cf.length !== 16) {
    alert("Il codice fiscale deve essere lungo 16 caratteri.");
    return null;
  }

  // Anno
  let yearTwoDigits = parseInt(cf.slice(6, 8), 10);
  let yearFull = (yearTwoDigits < 30) ? 2000 + yearTwoDigits : 1900 + yearTwoDigits;

  // Mese
  let monthLetter = cf[8];
  const monthMap = {
    'A': "Gennaio", 'B': "Febbraio", 'C': "Marzo", 'D': "Aprile",
    'E': "Maggio", 'H': "Giugno", 'L': "Luglio", 'M': "Agosto",
    'P': "Settembre", 'R': "Ottobre", 'S': "Novembre", 'T': "Dicembre"
  };
  let monthName = monthMap[monthLetter] || "Mese sconosciuto";

  // Giorno e sesso
  let dayCode = parseInt(cf.slice(9, 11), 10);
  let gender = (dayCode > 40) ? "F" : "M";
  let day = (gender === "F") ? dayCode - 40 : dayCode;

  // Comune e provincia
  let belfiore = cf.slice(11, 15);
  let comune = "Comune sconosciuto";
  let provincia = "";
  if (comuniByBelfiore[belfiore]) {
    comune = comuniByBelfiore[belfiore].name;
    provincia = comuniByBelfiore[belfiore].sigla;
  }

  return {
    day: day,
    monthName: monthName,
    year: yearFull,
    gender: gender,
    comune: comune,
    provincia: provincia
  };
}

// Attende il caricamento completo del DOM
document.addEventListener("DOMContentLoaded", function() {
  // Carica la mappa dei comuni
  loadComuni();

  // Abilita la navigazione con Invio tra i campi del form di generazione
  focusNextFieldOnEnter("name", "surname");
  focusNextFieldOnEnter("surname", "birthdate");
  focusNextFieldOnEnter("birthdate", "gender");
  focusNextFieldOnEnter("gender", "place");
  // Su "place" non forziamo il passaggio al prossimo, perché vogliamo
  // che Enter invii il form (comportamento predefinito).

  // Riferimenti ai nodi DOM
  const cfResultText = document.getElementById("cfResultText");
  const copyCFButton = document.getElementById("copyCFButton");
  const decodeResultBox = document.getElementById("decodeResultBox");

  // Form per generare il CF
  document.getElementById("cfForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const surname = document.getElementById("surname").value;
    const name = document.getElementById("name").value;
    const birthdate = document.getElementById("birthdate").value;
    const gender = document.getElementById("gender").value;
    const place = document.getElementById("place").value;
    
    const cf = generateCodiceFiscale(surname, name, birthdate, gender, place);
    
    if (cf) {
      cfResultText.innerText = "Codice Fiscale: " + cf;
      copyCFButton.style.display = "inline-flex";
    } else {
      cfResultText.innerText = "Impossibile generare il codice fiscale.";
      copyCFButton.style.display = "none";
    }
  });

  // Bottone "Copia"
  copyCFButton.addEventListener("click", function() {
    // Rimuove il prefisso "Codice Fiscale: " per copiare solo il CF
    const text = cfResultText.innerText.replace("Codice Fiscale: ", "");
    navigator.clipboard.writeText(text)
      .then(() => {
        alert("Codice fiscale copiato negli appunti!");
      })
      .catch(err => {
        console.error("Errore durante la copia:", err);
      });
  });

  // Form per decodificare il CF
  document.getElementById("decodeForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const cfInput = document.getElementById("cfInput").value.toUpperCase();
    const data = decodeCodiceFiscale(cfInput);

    if (data) {
      const genderString = (data.gender === "M") ? "Maschile" : "Femminile";
      const output = `Data di nascita: ${data.day} ${data.monthName} ${data.year}\n` +
                     `Luogo di nascita: ${data.comune} (${data.provincia})\n` +
                     `Sesso: ${genderString}`;
      decodeResultBox.innerText = output;
    } else {
      decodeResultBox.innerText = "Codice fiscale non valido.";
    }
  });
});
