function getPasqua(anno) {
    const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    const mese = Math.floor(n / 31), giorno = (n % 31) + 1;
    const p = new Date(anno, mese - 1, giorno);
    const lund = new Date(p); lund.setDate(p.getDate() + 1);
    return { pasqua: p.toDateString(), pasquetta: lund.toDateString() };
}

function isFestivo(data) {
    if (data.getDay() === 0) return true;
    const day = data.getDate(), month = data.getMonth() + 1;
    const festiviFissi = ["1-1", "6-1", "25-4", "1-5", "2-6", "15-8", "1-11", "8-12", "25-12", "26-12"];
    if (festiviFissi.includes(`${day}-${month}`)) return true;
    const { pasqua, pasquetta } = getPasqua(data.getFullYear());
    return data.toDateString() === pasqua || data.toDateString() === pasquetta;
}

const oraAttuale = new Date();
const domani = new Date(oraAttuale); domani.setDate(oraAttuale.getDate() + 1);
const isWeekendDomani = isFestivo(domani);

function bloccaNonNumerici(e) {
    const allowed = ['0','1','2','3','4','5','6','7','8','9','.',',','/','+','Backspace','Tab','Delete','ArrowLeft','ArrowRight'];
    if (!allowed.includes(e.key)) { e.preventDefault(); }
}

function trasformaECalcola(input, soglia, index) {
    let rawVal = input.value.trim().replace(',', '.');
    if (rawVal === "") return;
    let calcolato;
    try {
        if (rawVal === "1/3") calcolato = 0.3;
        else if (rawVal === "1/2") calcolato = 0.5;
        else if (rawVal === "2/3") calcolato = 0.7;
        else if (rawVal === "1/4") calcolato = 0.25;
        else { calcolato = eval(rawVal); }
    } catch (e) { calcolato = NaN; }
    if (!isNaN(calcolato)) { input.value = Math.round(calcolato * 100) / 100; }
    valuta(index, soglia);
}

function estraiNumeroIntelligente(t) {
    if (!t) return NaN;
    t = t.toString().toLowerCase().trim().replace(',', '.');
    try { return eval(t); } catch(e) { return parseFloat(t); }
}

function filtraLista() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const items = document.querySelectorAll('.ing-item');
    const catTitles = document.querySelectorAll('.cat-title');
    const p = document.getElementById('pizzeria').value;

    items.forEach(it => {
        const nome = it.dataset.nome;
        if (q === "barbazza") {
            it.style.display = listaBarbazza.includes(nome) ? "flex" : "none";
        } else if (q === "metro") {
            let isMetro = listaMetro.includes(nome);
            if (p === "BIBAN" && listaMetroBiban.includes(nome)) {
                isMetro = true;
            }
            it.style.display = isMetro ? "flex" : "none";
        } else if (q === "" || nome.includes(q)) {
            it.style.display = "flex";
        } else { it.style.display = "none"; }
    });
    catTitles.forEach(title => { title.style.display = (q === "") ? "block" : "none"; });
}

function generaVistaTutte() {
    const cont = document.getElementById('contenitore-lista');
    cont.classList.add("vista-tabellare");
    const d_casta = JSON.parse(localStorage.getItem('inventario_dati_CASTA')) || {};
    const d_silea = JSON.parse(localStorage.getItem('inventario_dati_SILEA')) || {};
    const d_biban = JSON.parse(localStorage.getItem('inventario_dati_BIBAN')) || {};
    const raggruppati = {};
    ingredienti.forEach(ing => {
        if (ing.cat === "VERDURE CRUDE") return; 
        if (!raggruppati[ing.cat]) raggruppati[ing.cat] = { color: ing.color, items: [] };
        raggruppati[ing.cat].items.push(ing);
    });
    
    let h = `
        <button onclick="scaricaScreenshot(this)" style="background:var(--primary); color:white; width:100%; margin-bottom:15px; padding:12px; border-radius:10px; font-weight:bold; border:none; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">📸 SALVA COME IMMAGINE</button>
        <div id="area-da-fotografare" style="background:var(--bg-body); padding:15px; border-radius:10px;" class="grid-vista-tutte">`;

    for (const cat in raggruppati) {
        h += `<div class="container-cat-tutte">
            <div class="header-cat-tabella">${cat}</div>
            <table class="tabella-tutte">
            <thead><tr><th>Articolo</th><th>Casta</th><th>Silea</th><th>Biban</th></tr></thead><tbody>`;
        raggruppati[cat].items.forEach(ing => {
            const soglia = isWeekendDomani ? ing.we : ing.fer;
            const processaValore = (val) => {
                const n = estraiNumeroIntelligente(val);
                if (!isNaN(n) && n < soglia) return `<span style="color:var(--red-alert); font-weight:bold">${val}</span>`;
                return val || "-";
            };
            h += `<tr><td class="td-nome">${ing.nome}</td><td>${processaValore(d_casta[ing.nome])}</td><td>${processaValore(d_silea[ing.nome])}</td><td>${processaValore(d_biban[ing.nome])}</td></tr>`;
        });
        h += `</tbody></table></div>`;
    }
    h += `</div>`;
    cont.innerHTML = h;
}

function scaricaScreenshot(btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Generazione in corso (attendi)...";
    btn.disabled = true;

    const area = document.getElementById('area-da-fotografare');
    
    const originalWidth = area.style.width;
    const originalMargin = area.style.margin;
    
    area.style.width = "1200px";
    area.style.margin = "0 auto";

    setTimeout(() => {
        html2canvas(area, { 
            scale: 1, 
            backgroundColor: "#ffffff",
            useCORS: true,
            windowWidth: 1200 
        }).then(canvas => {
            area.style.width = originalWidth;
            area.style.margin = originalMargin;

            const imgData = canvas.toDataURL('image/png');
            document.getElementById('img-risultato').src = imgData;
            document.getElementById('modal-screenshot').style.display = 'flex';

            btn.innerHTML = originalText;
            btn.disabled = false;

        }).catch(err => {
            alert("Errore durante la creazione dell'immagine. Riprova.");
            area.style.width = originalWidth;
            area.style.margin = originalMargin;
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }, 150); 
}

function generaVistaArchivio() {
    const dataScelta = document.getElementById('archiveDate').value;
    if (!dataScelta) return;
    const cont = document.getElementById('contenitore-lista');
    cont.classList.add("vista-tabellare");
    const d_casta = JSON.parse(localStorage.getItem(`inventario_dati_CASTA_${dataScelta}`)) || JSON.parse(localStorage.getItem(`inventario_dati_CASTA`)) || {};
    const d_silea = JSON.parse(localStorage.getItem(`inventario_dati_SILEA_${dataScelta}`)) || JSON.parse(localStorage.getItem(`inventario_dati_SILEA`)) || {};
    const d_biban = JSON.parse(localStorage.getItem(`inventario_dati_BIBAN_${dataScelta}`)) || JSON.parse(localStorage.getItem(`inventario_dati_BIBAN`)) || {};
    const raggruppati = {};
    ingredienti.forEach(ing => {
        if (ing.cat === "VERDURE CRUDE") return; 
        if (!raggruppati[ing.cat]) raggruppati[ing.cat] = { color: ing.color, items: [] };
        raggruppati[ing.cat].items.push(ing);
    });
    let h = `<div style="grid-column: 1/-1; text-align:center; padding:15px; font-weight:bold; color:var(--primary)">Archivio: ${dataScelta}</div><div class="grid-vista-tutte">`;
    for (const cat in raggruppati) {
        h += `<div class="container-cat-tutte">
            <div class="header-cat-tabella">${cat}</div>
            <table class="tabella-tutte">
            <thead><tr><th>Articolo</th><th>Casta</th><th>Silea</th><th>Biban</th></tr></thead><tbody>`;
        raggruppati[cat].items.forEach(ing => { h += `<tr><td class="td-nome">${ing.nome}</td><td>${d_casta[ing.nome] || "-"}</td><td>${d_silea[ing.nome] || "-"}</td><td>${d_biban[ing.nome] || "-"}</td></tr>`; });
        h += `</tbody></table></div>`;
    }
    h += `</div>`;
    cont.innerHTML = h;
}

function creaLista() {
    const cont = document.getElementById('contenitore-lista');
    const p = document.getElementById('pizzeria').value;
    cont.innerHTML = "";
    cont.classList.remove("vista-tabellare");
    document.getElementById('btn-azzera').style.display = (p && p !== "TUTTE" && p !== "ARCHIVIO") ? "block" : "none";
    document.getElementById('footer-btns').style.display = (p && p !== "ARCHIVIO") ? "flex" : "none";
    document.getElementById('save-btn').style.display = (p === "TUTTE") ? "none" : "block";
    document.getElementById('search-box').style.display = (p && p !== "TUTTE" && p !== "ARCHIVIO") ? "block" : "none";
    document.getElementById('date-picker-container').style.display = (p === "ARCHIVIO") ? "block" : "none";
    document.getElementById('search-box').style.display = (p && p !== "TUTTE" && p !== "ARCHIVIO") ? "block" : "none";
    document.getElementById('date-picker-container').style.display = (p === "ARCHIVIO") ? "block" : "none";
    if (p === "TUTTE") { generaVistaTutte(); return; }
    if (p === "ARCHIVIO") { generaVistaArchivio(); return; }
    if (!p) return;
    const s = JSON.parse(localStorage.getItem('inventario_dati_'+p)) || {};
    let currentCat = "";
    ingredienti.forEach((ing, i) => {
        if (ing.nome === "Lievito" && p !== "BIBAN") return;
        if (ing.nome === "Pel.Salsa" && p !== "CASTA") return;
        if (ing.nome === "Pelati Salsa" && p === "SILEA") return;
        if (ing.cat === "VERDURE CRUDE" && (p !== "CASTA" || oraAttuale.getDay() !== 0)) return;
        
       if ((ing.nome === "Ghiaccio" || ing.nome === "Canapa Bio") && (p === "CASTA" || p === "SILEA")) return;
        if ((ing.nome === "Olio Fritte" || ing.nome === "Patate Fritte" || ing.nome === "Patate al Forno") && (p === "SILEA" || p === "BIBAN")) return;
        if (ing.cat !== currentCat) {
            cont.innerHTML += `<div class="categoria-header cat-title">${ing.cat}</div>`;
            currentCat = ing.cat;
        }
        const soglia = isWeekendDomani ? ing.we : ing.fer;
        const v = s[ing.nome] || "";
        const isCipolla = ing.nome === "cass.Cipolla";
        
        const limitAttr = ing.cat === "VASCHETTE"  ? ' maxlength="4" oninput="if(!/^(0(,(25?|3|5|7)?)?|1(,(25?|3|5|7)?)?|2(,(25?|3|5|7)?)?|3(,(25?|3|5|7)?)?|4(,(25?|3|5|7)?)?|5(,(25?|3|5|7)?)?|6(,(25?|3|5|7)?)?|7(,(25?|3|5|7)?)?|8(,(25?|3|5|7)?)?)?$/.test(this.value)) this.value = this.value.slice(0, -1);"' : '';

        let inputHtml = isCipolla ? `
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                <div style="display:flex; align-items:center; gap:5px; font-size:10px; color:var(--secondary)">Sfuse <input type="text" inputmode="decimal" class="qty-input" style="height:32px; width:55px" id="sfuse-${i}" onkeydown="bloccaNonNumerici(event)" onchange="trasformaECalcola(this, 0, ${i}); document.getElementById('sel-${i}').value = (this.value/20).toFixed(2); valuta(${i}, ${soglia})"></div>
                <input type="text" inputmode="decimal" class="qty-input" id="sel-${i}" placeholder="Qtà" value="${v}" onkeydown="bloccaNonNumerici(event)" onchange="trasformaECalcola(this, ${soglia}, ${i})">
            </div>` : `
            <input type="text" inputmode="decimal" class="qty-input" id="sel-${i}" placeholder="0" value="${v}" onkeydown="bloccaNonNumerici(event)" onchange="trasformaECalcola(this, ${soglia}, ${i})"${limitAttr}>`;
        
        cont.innerHTML += `
            <div class="item ${v===''?'vuoto':''} ing-item" id="box-${i}" data-nome="${ing.nome.toLowerCase()}">
                <div class="nome-container"><b>${ing.nome}</b><small>Minimo: ${soglia}</small></div>
                <div>${inputHtml}</div>
            </div>`;
        if(v !== "") valuta(i, soglia);
    });
}

function controllaESalva() {
    const p = document.getElementById('pizzeria').value;
    const vuoti = [];
    ingredienti.forEach((ing, i) => {
        const input = document.getElementById(`sel-${i}`);
        if (input && input.value.trim() === "") {
            if (!(ing.nome === "Lievito" && p !== "BIBAN") && 
                !(ing.nome === "Pel.Salsa" && p !== "CASTA") && 
                !(ing.nome === "Pelati Salsa" && p === "SILEA") && 
                !((ing.nome === "Ghiaccio" || ing.nome === "Canapa Bio") && (p === "CASTA" || p === "SILEA")) && 
                !((ing.nome === "Olio Fritte" || ing.nome === "Patate Fritte" || ing.nome === "Patate al Forno") && p === "SILEA") && 
                !ing.noObbligo) { 
                    vuoti.push(ing.nome); 
            }
        }
    });
    if (vuoti.length > 0) {
        document.getElementById('lista-nomi-vuoti').innerHTML = vuoti.join(", ");
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('dialog-vuoti').style.display = 'block';
    } else { eseguiSalva(); }
}

function chiudiDialog() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('dialog-vuoti').style.display = 'none';
}

async function eseguiSalva(forza = false) {
    const p = document.getElementById('pizzeria').value;
    const d = {};
    const oggiStr = new Date().toISOString().split('T')[0];
    
    ingredienti.forEach((ing, i) => { 
        const input = document.getElementById(`sel-${i}`); 
        if(input) d[ing.nome] = input.value; 
    });

    const newDataString = JSON.stringify(d);

    localStorage.setItem('inventario_dati_'+p, newDataString);
    localStorage.setItem(`inventario_dati_${p}_${oggiStr}`, newDataString);

    document.getElementById('sync-status').innerText = 'Recupero dati prima del salvataggio...';

    try {
        let cloudData = {};
        
        const resGet = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { 
            headers: { 'X-Master-Key': API_KEY } 
        });

        if (resGet.ok) {
            const fetched = await resGet.json();
            if (fetched.record) {
                cloudData = fetched.record;
            }
        } else {
            console.warn("Recupero dati cloud fallito, uso i dati locali completi come fallback.");
            for(let i=0; i<localStorage.length; i++) { 
                cloudData[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)); 
            }
        }

        cloudData['inventario_dati_'+p] = newDataString;
        cloudData[`inventario_dati_${p}_${oggiStr}`] = newDataString;

        document.getElementById('sync-status').innerText = 'Salvataggio in corso...';
        await syncCloud(cloudData);

        Object.keys(cloudData).forEach(key => localStorage.setItem(key, cloudData[key]));

        chiudiDialog();
        alert("✅ Report salvato correttamente!");

    } catch (e) {
        console.error("Errore durante il salvataggio:", e);
        alert("❌ Errore di sincronizzazione. I dati sono salvati sul dispositivo, ma c'è stato un problema col cloud.");
        chiudiDialog();
    }
}

async function syncCloud(data = null) {
    const status = document.getElementById('sync-status');
    try {
        if (data) {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Errore salvataggio");
            status.innerText = 'Sincronizzazione completata';
        } else {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
            if (!res.ok) throw new Error(`Errore server: ${res.status}`);
            const cloudData = await res.json();
            if(cloudData.record) {
                Object.keys(cloudData.record).forEach(key => localStorage.setItem(key, cloudData.record[key]));
                status.innerText = '✅ Dati caricati';
            } else {
                throw new Error("Dati cloud vuoti o non validi");
            }
        }
    } catch (e) { 
        console.error("Errore Sync:", e);
        status.innerText = '❌ Cloud non disp. (Modalità Offline)'; 
        status.style.color = 'var(--red-alert)';
    } finally {
        creaLista(); 
    }
}

function cambiaPizzeria() { localStorage.setItem('ultima_pizzeria', document.getElementById('pizzeria').value); creaLista(); }

function valuta(i, s) {
    const input = document.getElementById(`sel-${i}`);
    if(!input) return;
    const v = estraiNumeroIntelligente(input.value);
    document.getElementById(`box-${i}`).className = `item ${isNaN(v) ? 'vuoto' : (v < s ? 'urgente' : 'ok')} ing-item`;
}

function azzeraLista() { if(confirm("Cancellare i dati inseriti per questo punto vendita?")) { localStorage.removeItem('inventario_dati_'+document.getElementById('pizzeria').value); creaLista(); } }

function inviaWhatsApp() {
    const p = document.getElementById('pizzeria').value;
    let msg = "";
    
    if (p === "TUTTE") {
        msg += `🚨 *REPORT GLOBALE MANCANZE* 🚨\n\n`;
        const puntiVendita = ["CASTA", "SILEA", "BIBAN"];
        
        puntiVendita.forEach(pv => {
            const storedData = localStorage.getItem('inventario_dati_' + pv);
            if (storedData) {
                const d = JSON.parse(storedData);
                let msgPv = `*--- PUNTO VENDITA: ${pv} ---*\n`;
                let haMancanze = false;
                
                ingredienti.forEach((ing) => {
                    if (ing.nome === "Lievito" && pv !== "BIBAN") return;
                    if (ing.nome === "Pel.Salsa" && pv !== "CASTA") return;
                    if (ing.nome === "Pelati Salsa" && pv === "SILEA") return;
                    if (ing.cat === "VERDURE CRUDE" && (pv !== "CASTA" || oraAttuale.getDay() !== 0)) return;
                    if ((ing.nome === "Ghiaccio" || ing.nome === "Canapa Bio") && (pv === "CASTA" || pv === "SILEA")) return;
                    if ((ing.nome === "Olio Fritte" || ing.nome === "Patate Fritte" || ing.nome === "Patate al Forno") && (pv === "SILEA" || pv === "BIBAN")) return;
                    
                    const val = d[ing.nome];
                    if (val !== undefined && val !== "") {
                        const v = estraiNumeroIntelligente(val);
                        const s = isWeekendDomani ? ing.we : ing.fer;
                        if (!isNaN(v) && v < s) {
                            msgPv += `• ${ing.nome}: ${val} (Min: ${s})\n`;
                            haMancanze = true;
                        }
                    }
                });
                
                if (haMancanze) {
                    msg += msgPv + "\n";
                }
            }
        });
    } else {
        // Singolo punto vendita (legge direttamente i campi inseriti a schermo)
        msg += `🚨 *MANCANZE PUNTO VENDITA: ${p}* 🚨\n\n`;
        ingredienti.forEach((ing, i) => {
            if (ing.nome === "Lievito" && p !== "BIBAN") return;
            if (ing.nome === "Pel.Salsa" && p !== "CASTA") return;
            if (ing.nome === "Pelati Salsa" && p === "SILEA") return;
            if (ing.cat === "VERDURE CRUDE" && (p !== "CASTA" || oraAttuale.getDay() !== 0)) return;
            if ((ing.nome === "Ghiaccio" || ing.nome === "Canapa Bio") && (p === "CASTA" || p === "SILEA")) return;
            if ((ing.nome === "Olio Fritte" || ing.nome === "Patate Fritte" || ing.nome === "Patate al Forno") && (p === "SILEA" || p === "BIBAN")) return;

            const input = document.getElementById(`sel-${i}`);
            if (input && input.value !== "") {
                const v = estraiNumeroIntelligente(input.value);
                const s = isWeekendDomani ? ing.we : ing.fer;
                if (!isNaN(v) && v < s) {
                    msg += `• ${ing.nome}: ${input.value} (Min: ${s})\n`;
                }
            }
        });
    }
    
    // Se non ci sono mancanze, invia un messaggio di conferma generico
    if (msg.trim() === "" || msg.trim() === "🚨 *REPORT GLOBALE MANCANZE* 🚨" || msg.trim() === `🚨 *MANCANZE PUNTO VENDITA: ${p}* 🚨`) {
        msg = `✅ Inventario controllato per ${p === "TUTTE" ? "tutti i punti vendita" : p}: nessuna mancanza rilevata!`;
    }
    
    window.location.href = "whatsapp://send?text=" + encodeURIComponent(msg);
}

window.onload = async function() {
    const nomiGiorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
    const giornoDomani = nomiGiorni[domani.getDay()];
    document.getElementById('info-giorno').innerHTML = `Lista per <b>${giornoDomani}</b> ${isWeekendDomani?'(FESTIVO)':''}`;
    const uP = localStorage.getItem('ultima_pizzeria');
    if(uP) document.getElementById('pizzeria').value = uP;
    await syncCloud();
};
