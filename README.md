<div align="center">

  # Calcolo Codice Fiscale

  <p>
    <strong>Il modo più veloce e semplice per calcolare e decodificare il Codice Fiscale italiano.</strong>
  </p>

  <p>
    <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">
      <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/CSS">
      <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
      <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
    </a>
  </p>

</div>

---

## 🚀 Visione
Questa Web App nasce con l'obiettivo di fornire uno strumento **immediato**, **leggero** e **responsive** per la gestione del Codice Fiscale. A differenza di molti siti pieni di pubblicità, questo progetto è open-source, pulito e focalizzato sull'esperienza utente.

## ✨ Funzionalità

### 🔢 Calcolo Codice Fiscale
Genera istantaneamente il codice fiscale inserendo:
- Nome e Cognome
- Data di nascita
- Sesso
- Comune di nascita (con autocompletamento intelligente)

### 🔍 Decodifica Inversa
Inserisci un codice fiscale esistente per estrarre:
- Data di nascita
- Sesso
- Comune e Provincia di nascita

### ⚡ Altre Caratteristiche
- **Design Glassmorphism Premium**: Un'interfaccia moderna e trasparente con sfondi animati e blur effects, curata nei minimi dettagli.
- **Notifiche "Toast"**: Feedback visivo elegante e non intrusivo per ogni operazione (successo/errore), che sostituisce i vecchi alert.
- **Layout Compatto**: Box ottimizzati per occupare meno spazio verticale e garantire un'esperienza fluida.
- **Responsive**: Perfetto su Desktop, Tablet e Smartphone.
- **Copy-to-Clipboard**: Copia il risultato con un solo click.

## 🛠 Installazione e Uso

A differenza della vecchia versione, per garantire il funzionamento del database dei comuni (JSON) e rispettare le nuove policy di sicurezza dei browser (CORS), è necessario avviare il progetto tramite un **Server Locale**.

1.  **Clona la repository**:
    ```bash
    git clone https://github.com/falker47/Codice-Fiscale.git
    ```
2.  **Avvia con un Server Locale**:
    -   Se usi **VS Code**: Installa l'estensione "Live Server", fai click destro su `index.html` e seleziona "Open with Live Server".
    -   Oppure usa Python: `python -m http.server` nella cartella del progetto e apri `http://localhost:8000`.
    -   *Nota: Aprire direttamente il file con doppio click potrebbe impedire il caricamento del database dei comuni.*


## 💻 Tecnologie

-   **HTML5**: Markup semantico e accessibile.
-   **CSS3**: Flexbox/Grid, variabili CSS, Backdrop Filter e animazioni.
-   **JavaScript (ES6+)**: Logica modulare, gestione eventi asincrona (Fetch API) e manipolazione DOM.
-   **JSON**: Database dei comuni italiani (`DB-province.json`).

## ✍️ Crediti

Sviluppato con ❤️ da **Maurizio Falconi** ([falker47](https://github.com/falker47)).

-   **Font**: [Poppins](https://fonts.google.com/specimen/Poppins) by Google Fonts.
-   **Database Comuni**: Elaborazione dati ISTAT.

---

<div align="center">
  <p>Se questo progetto ti è stato utile, considera di lasciare una stella ⭐!</p>
</div>

