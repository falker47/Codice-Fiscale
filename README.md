# Codice Fiscale

![Anteprima](codice-fiscale.webp)

Calcolatore e decoder client-side del **Codice Fiscale italiano**, basato sulle regole formali del D.M. 23 dicembre 1976.

**Live demo:** https://falker47.github.io/Codice-Fiscale/

## Cosa fa

- genera il **codice fiscale teorico di base** da nome, cognome, data, sesso e Comune/Stato estero di nascita;
- applica la regola speciale del nome con quattro o più consonanti;
- normalizza accenti, spazi, apostrofi e separatori nei nomi;
- verifica struttura e **carattere di controllo** prima della decodifica;
- riconosce e decodifica le sostituzioni da **omocodia**;
- usa un database locale di codici Belfiore, inclusi gli Stati esteri;
- disambigua località omonime mostrando provincia e codice Belfiore;
- funziona interamente nel browser: i dati anagrafici inseriti non vengono inviati a un backend del progetto.

## Limiti importanti

### Il codice calcolato non certifica quello ufficiale

Il codice prodotto dai dati anagrafici è la forma teorica di base. In caso di omocodia l'Agenzia delle Entrate può attribuire un codice differente sostituendo alcune cifre con lettere e ricalcolando il carattere di controllo.

Per usi amministrativi fa fede esclusivamente il codice fiscale attribuito dall'Agenzia delle Entrate e registrato in Anagrafe Tributaria.

Servizio ufficiale di verifica:
https://telematici.agenziaentrate.gov.it/VerificaCF/IVerificaCfPf.jsp

### Dal codice non si ricava il secolo

Il Codice Fiscale contiene soltanto le ultime due cifre dell'anno di nascita. Il decoder mostra quindi il giorno, il mese e il suffisso dell'anno senza inventare automaticamente il secolo.

### Validità formale vs Anagrafe Tributaria

Un codice può essere formalmente corretto — struttura e carattere di controllo validi — senza essere necessariamente attribuito a una persona nell'Anagrafe Tributaria. Questa web app esegue controlli locali, non una verifica anagrafica presso l'Agenzia.

## Regole coperte

La logica implementa le parti rilevanti del D.M. 23/12/1976:

- tre caratteri per cognome e tre per nome;
- regola 1ª/3ª/4ª consonante per nomi con almeno quattro consonanti;
- anno a due cifre;
- codifica del mese con `A B C D E H L M P R S T`;
- giorno invariato per gli uomini e +40 per le donne;
- codice Belfiore del Comune o Stato estero;
- sostituzioni di omocodia `0→L, 1→M, 2→N, 3→P, 4→Q, 5→R, 6→S, 7→T, 8→U, 9→V`;
- carattere alfabetico finale di controllo.

Riferimento normativo:
https://www.iusetnorma.it/normativa/decreto_ministeriale_23_dicembre_1976.asp

## Sviluppo

Il progetto non richiede framework né dipendenze runtime.

Avvio locale:

```bash
python -m http.server
```

Poi apri `http://localhost:8000`.

### Test

Richiede Node.js.

```bash
npm test
```

La suite verifica algoritmo di generazione, controllo formale, omocodia, normalizzazione dei nomi e risoluzione delle località, compresi casi omonimi come Castro (BG/LE).

## Struttura

```
├── index.html
├── styles.css
├── script.js
├── cf-logic.js
├── DB-province.json
├── test/
│   └── cf-logic.test.js
└── .github/workflows/
    └── ci.yml
```

## Fonti dati e riferimenti

- Database locale dei Comuni/Stati esteri: `DB-province.json`
- D.M. 23 dicembre 1976 — sistema di codificazione delle persone fisiche
- Agenzia delle Entrate — servizio ufficiale di verifica/corrispondenza

## Disclaimer

Questo è uno strumento informativo e open source. Non sostituisce la verifica presso l'Agenzia delle Entrate.
