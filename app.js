// ==================== NORMALIZACIÓN ====================

function quitarTildes(texto) {
    return (texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function limpiarBordes(texto) {
    return (texto || "")
        .replace(/^[¿¡!?.;,:"()']+|[¿¡!?.;,:"()']+$/g, "")
        .trim();
}

function normalizarTexto(texto) {
    return quitarTildes(
        limpiarBordes((texto || "").toLowerCase())
    ).replace(/\s+/g, " ");
}

function aplicarAlias(texto) {
    const t = normalizarTexto(texto);
    return aliasNormalizacion[t] || t;
}

function normalizarDiccionario(diccionario) {
    const salida = {};
    for (const clave in diccionario) {
        const claveNormalizada = aplicarAlias(clave);
        salida[claveNormalizada] = diccionario[clave];
    }
    return salida;
}

// ==================== ÍNDICES NORMALIZADOS ====================

const pictogramasNormalizados = normalizarDiccionario(pictogramas);
const verbosConjugadosNormalizados = normalizarDiccionario(verbosConjugados);
const verbosBaseNormalizados = verbosBase.map(v => aplicarAlias(v));

const pronombresNormalizados = pronombres.map(p => aplicarAlias(p));
const relacionantesNormalizados = relacionantes.map(p => aplicarAlias(p));
const preposicionesNormalizadas = preposiciones.map(p => aplicarAlias(p));
const adjetivosNormalizados = adjetivos.map(p => aplicarAlias(p));
const reflexivosNormalizados = pronombresReflexivosCuasiReflejos.map(p => aplicarAlias(p));

// ==================== FUNCIONES AUX ====================

function esPronombre(palabra) {
    return pronombresNormalizados.includes(aplicarAlias(palabra));
}

function esRelacionante(palabra) {
    return relacionantesNormalizados.includes(aplicarAlias(palabra));
}

function esPreposicion(palabra) {
    return preposicionesNormalizadas.includes(aplicarAlias(palabra));
}

function esAdjetivo(palabra) {
    return adjetivosNormalizados.includes(aplicarAlias(palabra));
}

function esReflexivosCuasiReflejos(palabra) {
    return reflexivosNormalizados.includes(aplicarAlias(palabra));
}

function obtenerRaizVerbal(palabra) {
    const p = aplicarAlias(palabra);

    // Nunca tomar pronombres reflexivos como verbo
    if (reflexivosNormalizados.includes(p)) {
        return null;
    }

    return verbosConjugadosNormalizados[p] || (verbosBaseNormalizados.includes(p) ? p : null);
}

function existePicto(clave) {
    return Object.prototype.hasOwnProperty.call(pictogramasNormalizados, aplicarAlias(clave));
}

function obtenerPicto(clave) {
    return pictogramasNormalizados[aplicarAlias(clave)] || "";
}

// ==================== ESTADO ====================

let mostrarSimbolos = true;
let mostrarImagenes = true;
let mostrarColores = true;

// ==================== FUNCIONES ====================
function extraerPuntuacionFinal(texto) {
    const match = (texto || "").match(/[.,;:!?]+$/);
    return match ? match[0] : "";
}

function mostrarPictos() {
    const texto = document.getElementById("texto").value || "";
    const resultado = document.getElementById("resultado");
    resultado.innerHTML = "";

    texto.split("\n").forEach(linea => {
        const contenedorLinea = document.createElement("div");
        contenedorLinea.className = "contenedor-linea";

        const palabras = linea.split(/\s+/).filter(Boolean);

        for (let i = 0; i < palabras.length; i++) {
            const palabraOriginal = palabras[i];
            const palabraLimpia = limpiarBordes(palabraOriginal);
            const palabraNormalizada = aplicarAlias(palabraLimpia);

            const palabraAnteriorOriginal = palabras[i - 1] || "";
            const palabraSiguienteOriginal = palabras[i + 1] || "";

            const palabraAnteriorLimpia = limpiarBordes(palabraAnteriorOriginal);
            const palabraSiguienteLimpia = limpiarBordes(palabraSiguienteOriginal);

            const palabraAnteriorNormalizada = aplicarAlias(palabraAnteriorLimpia);
            const palabraSiguienteNormalizada = aplicarAlias(palabraSiguienteLimpia);

            if (!palabraOriginal) continue;

            const div = document.createElement("div");
            div.className = "palabra";

            const filaPicto = document.createElement("div");
            filaPicto.className = "fila-picto";

            const filaSimbolo = document.createElement("div");
            filaSimbolo.className = "fila-simbolo";

            const filaTexto = document.createElement("div");
            filaTexto.className = "fila-texto";

            // =========================
            // BUSCAR FRASES DE HASTA 4 PALABRAS
            // =========================
            let fraseEncontrada = null;
            let palabrasConsumidas = 0;

            for (let longitud = 4; longitud > 0; longitud--) {
                const grupoOriginal = palabras.slice(i, i + longitud).join(" ");
                const grupoLimpio = palabras
                    .slice(i, i + longitud)
                    .map(p => limpiarBordes(p))
                    .join(" ");

                const grupoNormalizado = aplicarAlias(grupoLimpio);

                if (existePicto(grupoNormalizado)) {
                    fraseEncontrada = {
                        original: grupoOriginal,
                        limpio: grupoLimpio,
                        normalizado: grupoNormalizado,
                        imagen: obtenerPicto(grupoNormalizado)
                    };
                    palabrasConsumidas = longitud;
                    break;
                }
            }

            // =========================
            // VERBOS
            // =========================
            const raizVerbal = obtenerRaizVerbal(palabraLimpia);
            const esInfinitivo = verbosBaseNormalizados.includes(palabraNormalizada);

            if (raizVerbal) {
                if (mostrarColores) {
                    filaTexto.style.color = "red";
                    filaTexto.style.fontWeight = "bold";
                }

                if (mostrarSimbolos) {
                    if (esInfinitivo) {
                        const imgSimbolo = document.createElement("img");
                        imgSimbolo.src = simboloVerboInfinitivo;
                        imgSimbolo.style.width = "40px";
                        imgSimbolo.style.height = "40px";
                        filaSimbolo.appendChild(imgSimbolo);
                    } else {
                        filaSimbolo.innerText = "=";
                        filaSimbolo.style.color = "red";
                    }
                }

                const imgVerbo = obtenerPicto(raizVerbal);
                if (imgVerbo && mostrarImagenes) {
                    const img = document.createElement("img");
                    img.src = imgVerbo;
                    filaPicto.appendChild(img);
                }
            }

            // =========================
            // ADJETIVOS
            // =========================
            if (esAdjetivo(palabraLimpia)) {
                const imgSimbolo = document.createElement("img");
                imgSimbolo.src = simboloAdjetivo;
                imgSimbolo.style.width = "40px";
                imgSimbolo.style.height = "40px";

                if (mostrarSimbolos) {
                    filaSimbolo.appendChild(imgSimbolo);
                }
            }

            // =========================
            // PRONOMBRES
            // =========================
            if (esPronombre(palabraLimpia)) {
                const img = document.createElement("img");
                img.src = simboloPronombre;
                img.style.width = "40px";
                img.style.height = "40px";

                if (mostrarSimbolos) {
                    filaSimbolo.appendChild(img);
                }
            }

            // =========================
            // PRONOMBRES REFLEXIVOS / CUASI REFLEJOS
            // =========================
            if (esReflexivosCuasiReflejos(palabraLimpia)) {
                if (mostrarColores) {
                    filaTexto.style.color = "red";
                    filaTexto.style.fontWeight = "bold";
                }

                const img = document.createElement("img");
                img.src = simboloReflexivosCuasiReflejos;
                img.style.width = "40px";
                img.style.height = "40px";

                if (mostrarSimbolos) {
                    filaSimbolo.appendChild(img);
                }
            }

            // =========================
            // RELACIONANTES
            // =========================
            if (esRelacionante(palabraLimpia)) {
                const img = document.createElement("img");
                img.src = simboloRelacionante;
                img.style.width = "40px";
                img.style.height = "40px";

                if (mostrarSimbolos) {
                    filaSimbolo.appendChild(img);
                }
            }

            // =========================
            // PREPOSICIONES
            // =========================
            if (esPreposicion(palabraLimpia)) {
                const esFraseVerbal =
                    palabraNormalizada === "a" &&
                    verbosBaseNormalizados.includes(palabraSiguienteNormalizada) &&
                    (
                        verbosConjugadosNormalizados[palabraAnteriorNormalizada] ||
                        verbosBaseNormalizados.includes(palabraAnteriorNormalizada)
                    );

                if (mostrarColores) {
                    if (esFraseVerbal) {
                        filaTexto.style.color = "red";
                        filaTexto.style.fontWeight = "bold";
                    } else {
                        filaTexto.style.color = "blue";
                        filaTexto.style.fontWeight = "bold";
                    }
                }
            }

            // =========================
            // PICTOGRAMA DE FRASE O PALABRA SIMPLE
            // =========================
            if (
                fraseEncontrada &&
                mostrarImagenes &&
                !raizVerbal
            ) {
                if (fraseEncontrada.imagen) {
                    const img = document.createElement("img");
                    img.src = fraseEncontrada.imagen;
                    filaPicto.appendChild(img);
                }

                i += palabrasConsumidas - 1;
            } else if (!raizVerbal) {
                const imgSimple = obtenerPicto(palabraLimpia);
                if (imgSimple && mostrarImagenes) {
                    const img = document.createElement("img");
                    img.src = imgSimple;
                    filaPicto.appendChild(img);
                }
            }

            // =========================
            // TEXTO A MOSTRAR
            // =========================
let textoMostrar;

if (fraseEncontrada && !raizVerbal) {
    const puntuacionFinal = extraerPuntuacionFinal(fraseEncontrada.original);
    const textoSinPuntuacion = fraseEncontrada.original.replace(/[.,;:!?]+$/g, "");
    textoMostrar = textoSinPuntuacion.toUpperCase() + puntuacionFinal;
} else {
    textoMostrar = (palabraOriginal || "").toUpperCase();
}

            const spanTexto = document.createElement("span");
            spanTexto.innerText = textoMostrar;
            filaTexto.appendChild(spanTexto);

            // =========================
            // ARMADO FINAL
            // =========================
            div.appendChild(filaPicto);
            div.appendChild(filaSimbolo);
            div.appendChild(filaTexto);
            contenedorLinea.appendChild(div);
        }

        resultado.appendChild(contenedorLinea);
    });
}

// ==================== BOTONES ====================

function toggleSimbolos() {
    mostrarSimbolos = !mostrarSimbolos;
    document.getElementById("btnSimbolos").innerText = mostrarSimbolos ? "Símbolos ON" : "Símbolos OFF";
    mostrarPictos();
}

function togglePictos() {
    mostrarImagenes = !mostrarImagenes;
    document.getElementById("btnPictos").innerText = mostrarImagenes ? "Pictogramas ON" : "Pictogramas OFF";
    mostrarPictos();
}

function toggleColor() {
    mostrarColores = !mostrarColores;
    document.getElementById("btnColor").innerText = mostrarColores ? "Color ON" : "Color OFF";
    mostrarPictos();
}

// ==================== DESCARGA ====================

function descargarImagen() {
    html2canvas(document.getElementById("resultado"), {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scale: 2
    }).then(canvas => {
        const link = document.createElement("a");
        link.download = "gramanick.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}