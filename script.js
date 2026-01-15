'use strict';

// IIFE to avoid polluting global namespace
(() => {
    // State management for municipalities
    const store = {
        comuniByName: {},
        comuniByBelfiore: {}
    };

    /**
     * UI Utils
     */
    const UI = {
        elements: {
            currentYear: document.getElementById("currentYear"),
            datalist: document.getElementById("comuniList"),
            cfForm: document.getElementById("cfForm"),
            cfResultText: document.getElementById("cfResultText"),
            copyCFButton: document.getElementById("copyCFButton"),
            decodeForm: document.getElementById("decodeForm"),
            decodeResultBox: document.getElementById("decodeResultBox"),
            toastContainer: document.getElementById("toast-container")
        },

        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            // Simple icon based on type
            let icon = '';
            if (type === 'success') icon = '✓';
            if (type === 'error') icon = '✕';

            toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

            this.elements.toastContainer.appendChild(toast);

            // Trigger animation
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            // Remove after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 400); // Wait for transition
            }, 3000);
        },

        focusNext(currentId, nextId) {
            const currentEl = document.getElementById(currentId);
            if (currentEl) {
                currentEl.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        const nextEl = document.getElementById(nextId);
                        if (nextEl) nextEl.focus();
                    }
                });
            }
        }
    };

    /**
     * Data Loading
     */
    async function loadComuni() {
        try {
            const response = await fetch('DB-province.json');
            if (!response.ok) throw new Error("Failed to load DB");
            const data = await response.json();

            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();

            data.forEach(item => {
                const comuneName = item["DESCRIZIONE COMUNE"].toUpperCase();
                const belfiore = item["CODICE BELFIORE"];
                const sigla = item["SIGLA"];
                const regione = item["REGIONE"];

                store.comuniByName[comuneName] = { belfiore, sigla };
                store.comuniByBelfiore[belfiore] = { name: item["DESCRIZIONE COMUNE"], sigla, regione };

                const option = document.createElement("option");
                option.value = comuneName;
                fragment.appendChild(option);
            });

            UI.elements.datalist.appendChild(fragment);
            console.log("Database Comuni loaded successfully.");
        } catch (error) {
            console.error("Error loading JSON:", error);
            UI.showToast("Errore nel caricamento del database comuni.", "error");
        }
    }

    /**
     * Business Logic (CF Generation)
     */
    const Logic = {
        getConsonants: (str) => str.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, ''),
        getVowels: (str) => str.toUpperCase().replace(/[^AEIOU]/g, ''),

        generateSurnameCode(surname) {
            let cons = this.getConsonants(surname);
            let vowels = this.getVowels(surname);
            return (cons + vowels + "XXX").slice(0, 3);
        },

        generateNameCode(name) {
            let cons = this.getConsonants(name);
            let vowels = this.getVowels(name);
            if (cons.length >= 4) {
                return cons[0] + cons[2] + cons[3];
            }
            return (cons + vowels + "XXX").slice(0, 3);
        },

        generateDateCode(birthdate, gender) {
            if (!birthdate) throw new Error("Data di nascita mancante");
            const date = new Date(birthdate);
            if (isNaN(date.getTime())) throw new Error("Data non valida");

            const year = date.getFullYear().toString().slice(-2);
            const month = date.getMonth();
            const monthMap = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];

            let day = date.getDate();
            if (gender === "F") day += 40;

            const dayStr = day.toString().padStart(2, '0');
            return year + monthMap[month] + dayStr;
        },

        getPlaceCode(place) {
            const codice = store.comuniByName[place.toUpperCase()];
            if (!codice) {
                throw new Error("Comune non trovato nel database!");
            }
            return codice.belfiore;
        },

        generateCheckDigit(cf15) {
            const oddValues = {
                '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
                'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
                'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
                'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
            };
            const evenValues = {
                '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
                'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
                'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
                'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
            };

            let sum = 0;
            for (let i = 0; i < cf15.length; i++) {
                let c = cf15[i];
                if ((i + 1) % 2 !== 0) {
                    sum += oddValues[c]; // Dispari
                } else {
                    sum += evenValues[c]; // Pari
                }
            }
            return String.fromCharCode(65 + (sum % 26));
        },

        calculate(surname, name, birthdate, gender, place) {
            const sCode = this.generateSurnameCode(surname);
            const nCode = this.generateNameCode(name);
            const dCode = this.generateDateCode(birthdate, gender);
            const pCode = this.getPlaceCode(place);
            const partial = sCode + nCode + dCode + pCode;
            return partial + this.generateCheckDigit(partial);
        },

        decode(cf) {
            cf = cf.toUpperCase();
            if (cf.length !== 16) throw new Error("Lunghezza codice errata (16 caratteri richiesti)");

            // Year
            const yearTwoDigits = parseInt(cf.slice(6, 8), 10);
            const yearFull = (yearTwoDigits < 30) ? 2000 + yearTwoDigits : 1900 + yearTwoDigits;

            // Month
            const monthLetter = cf[8];
            const monthMap = {
                'A': "Gennaio", 'B': "Febbraio", 'C': "Marzo", 'D': "Aprile",
                'E': "Maggio", 'H': "Giugno", 'L': "Luglio", 'M': "Agosto",
                'P': "Settembre", 'R': "Ottobre", 'S': "Novembre", 'T': "Dicembre"
            };
            const monthName = monthMap[monthLetter] || "Sconosciuto";

            // Day & Gender
            const dayCode = parseInt(cf.slice(9, 11), 10);
            const gender = (dayCode > 40) ? "F" : "M";
            const day = (gender === "F") ? dayCode - 40 : dayCode;

            // Place
            const belfiore = cf.slice(11, 15);
            let locationInfo = store.comuniByBelfiore[belfiore];
            let comune = "Sconosciuto";
            let provincia = "";
            let regione = "";

            if (locationInfo) {
                comune = locationInfo.name;
                provincia = locationInfo.sigla;
                regione = locationInfo.regione;
            }

            return { day, monthName, year: yearFull, gender, comune, provincia, regione };
        }
    };

    /**
     * Event Handlers
     */
    function init() {
        UI.elements.currentYear.textContent = new Date().getFullYear();
        loadComuni();

        // Keyboard Navigation
        UI.focusNext("name", "surname");
        UI.focusNext("surname", "birthdate");
        UI.focusNext("birthdate", "gender");
        UI.focusNext("gender", "place");

        // Generation Handler
        UI.elements.cfForm.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const surname = document.getElementById("surname").value.trim();
                const name = document.getElementById("name").value.trim();
                const birthdate = document.getElementById("birthdate").value;
                const gender = document.getElementById("gender").value;
                const place = document.getElementById("place").value.trim();

                if (!surname || !name || !birthdate || !place) {
                    throw new Error("Compila tutti i campi obbligatori.");
                }

                const cf = Logic.calculate(surname, name, birthdate, gender, place);
                UI.elements.cfResultText.innerText = cf;
                UI.elements.cfResultText.parentElement.classList.add("show"); // Show output box
                UI.elements.copyCFButton.style.display = "inline-flex";
                UI.showToast("Codice Fiscale Calcolato!", "success");
            } catch (err) {
                UI.elements.cfResultText.innerText = "Errore";
                UI.elements.cfResultText.parentElement.classList.add("show"); // Show output box on error too
                UI.elements.copyCFButton.style.display = "none";
                UI.showToast(err.message, "error");
            }
        });

        // Copy Handler
        UI.elements.copyCFButton.addEventListener("click", () => {
            const text = UI.elements.cfResultText.innerText.replace("Codice Fiscale: ", "");
            if (!text || text === "Errore") return;

            navigator.clipboard.writeText(text)
                .then(() => UI.showToast("Copiato negli appunti!", "success"))
                .catch(err => UI.showToast("Errore copia", "error"));
        });

        // Decode Handler
        UI.elements.decodeForm.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const cfInput = document.getElementById("cfInput").value.trim();
                const data = Logic.decode(cfInput);

                const genderFull = (data.gender === "M") ? "Maschile" : "Femminile";
                const luogo = (data.provincia !== "EE" && data.regione)
                    ? `${data.comune} (${data.provincia}) - ${data.regione}`
                    : `${data.comune} (${data.provincia})`;

                const output = `
                    <div class="decode-grid">
                        <div class="decode-item">
                            <span class="decode-label">Data di Nascita</span>
                            <span class="decode-value">${data.day} ${data.monthName} ${data.year}</span>
                        </div>
                        
                        <div class="decode-item">
                            <span class="decode-label">Sesso</span>
                            <span class="decode-value">${genderFull}</span>
                        </div>
                        
                        <div class="decode-item">
                            <span class="decode-label">Luogo di Nascita</span>
                            <span class="decode-value">${luogo}</span>
                        </div>
                    </div>
                `;

                UI.elements.decodeResultBox.innerHTML = output;
                UI.elements.decodeResultBox.classList.add("show"); // Show output box
                UI.showToast("Decodifica avvenuta", "success");
            } catch (err) {
                UI.elements.decodeResultBox.innerText = "Errore decodifica";
                UI.showToast(err.message, "error");
            }
        });
    }

    // Start
    document.addEventListener("DOMContentLoaded", init);

})();
