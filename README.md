# Codice Fiscale

![Anteprima dell'applicazione](codice-fiscale.webp)

Calcolatore e decoder del **Codice Fiscale italiano**, realizzato in JavaScript e utilizzabile direttamente dal browser.

Permette di generare un codice fiscale teorico a partire dai dati anagrafici oppure di decodificare le informazioni contenute in un codice di 16 caratteri, comprese le sostituzioni da omocodia.

L'applicazione segue le regole formali di codificazione previste dal D.M. 23 dicembre 1976. Non è un servizio dell'Agenzia delle Entrate e non verifica l'attribuzione ufficiale di un codice fiscale.

**[Apri la demo online](https://falker47.github.io/Codice-Fiscale/)**

## Funzionalità

### Calcolo del Codice Fiscale

Inserendo nome, cognome, data di nascita, sesso e Comune italiano o Stato estero di nascita, l'applicazione genera il codice fiscale teorico di base.

Il calcolo comprende:

- estrazione dei caratteri del cognome e del nome secondo le regole previste;
- normalizzazione di maiuscole, minuscole, accenti e separatori nei nomi;
- codifica dell'anno, del mese, del giorno e del sesso;
- ricerca del codice Belfiore associato alla località selezionata;
- calcolo del sedicesimo carattere di controllo.

Il risultato può essere copiato negli appunti.

**Esempio**

Per Mario Rossi, nato a Roma il 1° gennaio 1980, sesso maschile:

`RSSMRA80A01H501U`

L'esempio illustra il funzionamento dell'algoritmo, non l'esistenza di una specifica registrazione anagrafica.

### Decodifica

Inserendo un codice fiscale di 16 caratteri, il decoder:

- controlla la struttura prevista per una persona fisica;
- ricalcola e verifica il carattere finale di controllo;
- riconosce le sostituzioni da omocodia;
- ricava giorno, mese, ultime due cifre dell'anno e sesso codificato;
- cerca il codice Belfiore nel database locale;
- propone una stima dell'anno completo di nascita.

La decodifica non recupera nome e cognome originali. I rispettivi tre caratteri rappresentano una codifica sintetica, non reversibile in modo univoco.

Se il codice Belfiore non è presente nel database, il luogo viene indicato come sconosciuto. Questa circostanza, da sola, non dimostra che il codice fiscale sia errato.

## Come viene costruito il codice

Il Codice Fiscale ordinario delle persone fisiche è composto da 16 caratteri.

| Posizioni | Informazione | Regola |
|---|---|---|
| 1–3 | Cognome | Consonanti, poi vocali; eventuale completamento con X |
| 4–6 | Nome | Regola analoga, con trattamento speciale per almeno quattro consonanti |
| 7–8 | Anno | Ultime due cifre |
| 9 | Mese | Lettera associata al mese |
| 10–11 | Giorno e sesso | Giorno normale oppure aumentato di 40 |
| 12–15 | Luogo di nascita | Codice Belfiore |
| 16 | Controllo | Lettera calcolata sui primi 15 caratteri |

### Cognome e nome

Per il cognome vengono utilizzate nell'ordine le prime tre consonanti disponibili. Se non sono sufficienti, si aggiungono le vocali; se occorre, si completa con la lettera X.

Per il nome si applica la stessa logica, con una differenza: quando sono presenti almeno quattro consonanti, si prendono la **prima, la terza e la quarta**.

Spazi, apostrofi e altri separatori non occupano posizioni nella codifica. L'implementazione normalizza anche i comuni caratteri accentati.

### Data di nascita e sesso

L'anno è rappresentato soltanto dalle ultime due cifre.

I mesi utilizzano questa corrispondenza:

| Mese | Codice | Mese | Codice |
|---|---|---|---|
| Gennaio | A | Luglio | L |
| Febbraio | B | Agosto | M |
| Marzo | C | Settembre | P |
| Aprile | D | Ottobre | R |
| Maggio | E | Novembre | S |
| Giugno | H | Dicembre | T |

Per il giorno di nascita:

- sesso maschile: giorno da 01 a 31;
- sesso femminile: giorno aumentato di 40, quindi da 41 a 71.

Il carattere finale viene calcolato utilizzando le tabelle di conversione delle posizioni pari e dispari previste dalla normativa, sommando i valori e applicando il modulo 26.

## Omocodia

L'omocodia si verifica quando i dati anagrafici di persone diverse porterebbero alla stessa espressione iniziale del codice fiscale.

Per distinguere i soggetti, l'amministrazione può sostituire alcune cifre con lettere nelle sette posizioni numeriche del codice.

Le posizioni interessate sono la **7, 8, 10, 11, 13, 14 e 15**, contando i caratteri da uno.

La corrispondenza è:

`0→L · 1→M · 2→N · 3→P · 4→Q · 5→R · 6→S · 7→T · 8→U · 9→V`

Quando vengono applicate sostituzioni, cambia anche il carattere finale di controllo, che deve essere ricalcolato.

Il decoder verifica il carattere di controllo sul codice ricevuto e, successivamente, riconverte le lettere sostitutive nelle cifre corrispondenti per ricavare le informazioni codificate.

**Cosa fa questa applicazione:** riconosce e decodifica codici con omocodia formalmente corretti.

**Cosa non fa:** non determina quale variante sia stata attribuita a una persona dall'Agenzia delle Entrate e non genera tutte le possibili varianti omocodiche.

## Il problema del secolo di nascita

Il Codice Fiscale contiene due sole cifre per l'anno. Di conseguenza, non permette di distinguere direttamente, per esempio, il 1916 dal 2016.

Il decoder utilizza una convenzione pratica basata sul secolo corrente, su quello precedente e sulla data odierna.

Nel 2026:

- `15/06/98` viene presentato come `15/06/1998`, perché il 15 giugno 2098 è ancora futuro;
- `15/06/16` viene presentato come `15/06/2016 (o 15/06/1916)`, perché entrambe le date sono trascorse.

La stima considera anche giorno e mese, non soltanto l'anno.

Questa convenzione:

- non identifica con certezza il secolo di nascita;
- non contempla ogni possibile secolo storico;
- non garantisce la validità di tutte le date candidate nei rispettivi anni bisestili;
- non interroga dati anagrafici ufficiali.

I valori mostrati sono quindi **candidati dedotti**, non date di nascita ufficialmente accertate.

## Database dei luoghi di nascita

L'applicazione utilizza il file locale [`DB-province.json`](DB-province.json), caricato nel browser all'apertura della pagina.

Alla revisione del 5 novembre 2026 contiene **8.166 record**, dei quali **270 con sigla `EE`**, relativi a Stati esteri e altre denominazioni territoriali presenti nell'archivio.

Ogni record contiene informazioni quali denominazione della località, provincia, sigla, regione, codice ISTAT e codice Belfiore, quando disponibili.

### Ricerca e località omonime

La ricerca mostra denominazione, sigla e codice Belfiore per distinguere voci con lo stesso nome.

Per esempio, `CASTRO` corrisponde a due località:

- `CASTRO (BG) · C337`
- `CASTRO (LE) · M261`

Quando un nome corrisponde a più voci, è necessario selezionare quella completa. Un nome univoco può invece essere riconosciuto direttamente.

### Limiti e aggiornamento dei dati

Il database è una copia inclusa nella repository: non viene interrogato o aggiornato automaticamente da un archivio amministrativo ufficiale.

Nel progetto non sono documentati in modo verificabile la provenienza originale, la licenza del dataset e un processo periodico di aggiornamento.

Inoltre, i record non comprendono intervalli di validità che permettano di ricostruire con certezza tutti i cambiamenti amministrativi nel tempo.

Questo comporta alcune limitazioni:

- Comuni istituiti di recente possono non essere presenti;
- fusioni, soppressioni e cambi di denominazione possono non essere rappresentati completamente;
- denominazioni storiche e attuali possono coesistere senza indicazione del relativo periodo di validità;
- Stati esteri e denominazioni territoriali possono presentare varianti storiche o omonimie;
- la presenza di un codice nell'archivio non ne certifica la correttezza per qualsiasi data di nascita.

Il database è quindi uno strumento di consultazione integrato, non una fonte ufficiale completa o continuamente aggiornata.

Per approfondire le variazioni amministrative dei Comuni è disponibile la [documentazione territoriale Istat](https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/). I codici statistici ISTAT e i codici fiscali Belfiore sono identificativi distinti e non vanno confusi.

## Validità formale e attribuzione ufficiale

Questa distinzione è essenziale.

**Il calcolo teorico** applica le regole di codificazione ai dati inseriti. Il risultato non coincide necessariamente con il codice fiscale ufficialmente attribuito, soprattutto in presenza di omocodia o particolarità anagrafiche.

**La validazione locale** controlla struttura, carattere di controllo e alcune compatibilità della data codificata. Non dimostra che un codice esista nell'Anagrafe Tributaria.

**La verifica ufficiale** confronta invece il codice fiscale e, quando previsto, i dati anagrafici con le informazioni registrate presso l'Agenzia delle Entrate.

Questa applicazione non supporta i codici fiscali provvisori numerici: il decoder è dedicato al formato alfanumerico di 16 caratteri delle persone fisiche.

Per verificare un codice fiscale effettivamente attribuito, utilizzare il [servizio ufficiale dell'Agenzia delle Entrate](https://telematici.agenziaentrate.gov.it/VerificaCF/Scegli.jsp).

## Privacy e funzionamento nel browser

La generazione e la decodifica sono implementate in JavaScript nel browser.

Il codice applicativo esaminato:

- elabora i dati anagrafici senza inviarli a un backend di calcolo del progetto;
- scarica il database Belfiore come risorsa statica;
- non prevede salvataggi dei dati inseriti in `localStorage`, `sessionStorage` o cookie applicativi;
- non include servizi di analytics nel codice esaminato;
- permette di copiare volontariamente il risultato negli appunti del dispositivo.

La pagina pubblica è distribuita tramite GitHub Pages e carica il font Poppins da Google Fonts. La consultazione comporta quindi richieste di rete ai servizi che ospitano la pagina e le risorse esterne.

L'assenza di invii applicativi dei dati anagrafici non equivale all'assenza assoluta di traffico di rete, né costituisce una garanzia sul comportamento del browser, delle estensioni o di servizi esterni.

## Utilizzo in locale

Il progetto è una web app statica: non richiede un framework frontend, un backend o dipendenze JavaScript da installare per utilizzare l'interfaccia.

Per avviarlo in locale è sufficiente scaricare la repository e utilizzare un server HTTP statico.

Con Git installato:

```bash
git clone https://github.com/falker47/Codice-Fiscale.git
cd Codice-Fiscale
```

Con Python 3 disponibile:

```bash
python -m http.server 8000
```

Aprire quindi:

`http://localhost:8000`

Il server HTTP è necessario per il normale caricamento dei moduli JavaScript e del file JSON nel browser. L'apertura diretta di `index.html` tramite `file://` può incontrare restrizioni di sicurezza.

### Test automatici

I test utilizzano il test runner integrato in Node.js, senza framework di testing esterni.

Per riprodurre l'ambiente della CI è consigliato **Node.js 24**.

Dalla root del progetto:

```bash
npm test
```

È disponibile anche:

```bash
npm run check
```

Il secondo comando esegue gli stessi test del primo.

La suite attuale comprende nove test relativi a:

- codifica di cognome e nome, inclusi alcuni accenti e apostrofi;
- generazione di un codice fiscale standard;
- verifica del carattere di controllo e rifiuto di un codice alterato;
- decodifica di un esempio con omocodia;
- stima degli anni di nascita in più scenari temporali;
- ricerca di Stati esteri e disambiguazione di località omonime.

Non si tratta di una verifica esaustiva di tutte le combinazioni anagrafiche, dei codici storici, delle regole amministrative e dell'interfaccia utente.

### Continuous Integration

Il workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) esegue `npm test` su GitHub Actions con Node.js 24 e runner `ubuntu-latest`.

È attivato dai push su `main` e dagli eventi `pull_request`.

La riuscita dei test dimostra il superamento dei casi implementati nella suite, non la conformità amministrativa completa dell'applicazione.

## Struttura del progetto

```text
Codice-Fiscale/
├── index.html
├── styles.css
├── script.js
├── cf-logic.js
├── DB-province.json
├── codice-fiscale.webp
├── favicon.png
├── package.json
├── README.md
├── test/
│   └── cf-logic.test.js
└── .github/
    └── workflows/
        └── ci.yml
```

I componenti principali sono:

- **`index.html`** — struttura dell'interfaccia e moduli di generazione e decodifica;
- **`styles.css`** — aspetto grafico, layout responsive e stati visivi;
- **`script.js`** — interazione con i form, caricamento delle località, risultati e notifiche;
- **`cf-logic.js`** — funzioni di generazione, validazione, decodifica e indicizzazione dei luoghi, riutilizzate nei test;
- **`DB-province.json`** — archivio statico delle località;
- **`test/cf-logic.test.js`** — test automatici della logica;
- **`package.json`** — configurazione ES Modules e comandi di test.

L'interfaccia include elementi semantici e adattamenti CSS per schermi di dimensioni differenti. Non è tuttavia documentata una verifica completa di compatibilità tra browser o conformità alle linee guida WCAG.

## Riferimenti normativi e ufficiali

- [Ministero dell'Economia e delle Finanze — D.M. 23 dicembre 1976, n. 13813, *Sistemi di codificazione dei soggetti da iscrivere all'anagrafe tributaria*](https://def.finanze.it/DocTribFrontend/getAttoNormativoDetail.do?ACTION=getSommario&id=%7B8D93A450-E5FE-47FC-A6F0-F938769051BF%7D) — in particolare gli articoli 2–7.
- [Agenzia delle Entrate — Servizio di verifica del Codice Fiscale](https://telematici.agenziaentrate.gov.it/VerificaCF/Scegli.jsp) — verifica dell'esistenza e della corrispondenza con i dati dell'Anagrafe Tributaria.
- [Istat — Codici delle unità amministrative e variazioni territoriali](https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/) — riferimento complementare per le variazioni amministrative, non certificazione dei codici Belfiore contenuti nel progetto.

## Diritti e riutilizzo

La repository è pubblicamente consultabile su GitHub, ma alla revisione del 5 novembre 2026 non contiene un file `LICENSE` nella root né una dichiarazione di licenza nel `package.json`.

Non sono inoltre documentati in modo sufficiente i diritti di riutilizzo del database `DB-province.json` e la provenienza/licenza delle risorse grafiche incluse.

**La disponibilità pubblica del codice non costituisce, da sola, una concessione di licenza open source.**

Prima di copiare, ridistribuire, modificare o incorporare codice, dati o immagini in altri progetti, occorre verificare i diritti applicabili e ottenere le eventuali autorizzazioni necessarie.

## Disclaimer

Questo progetto è uno strumento informativo e didattico indipendente.

I risultati del calcolo, della validazione e della decodifica non costituiscono certificazione anagrafica o fiscale.

Per gli utilizzi amministrativi fare riferimento al codice fiscale effettivamente attribuito e alle verifiche ufficiali dell'Agenzia delle Entrate.
