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

// Exacto: conserva tildes
function normalizarTextoExacto(texto) {
    return limpiarBordes((texto || "").toLowerCase()).replace(/\s+/g, " ");
}

// Solo para buscar claves del aliasNormalizacion
function normalizarTextoAlias(texto) {
    return quitarTildes(
        limpiarBordes((texto || "").toLowerCase())
    ).replace(/\s+/g, " ");
}

function aplicarAlias(texto) {
    const t = normalizarTextoAlias(texto);
    return aliasNormalizacion[t] || null;
}

function normalizarDiccionarioExacto(diccionario) {
    const salida = {};
    for (const clave in diccionario) {
        salida[normalizarTextoExacto(clave)] = diccionario[clave];
    }
    return salida;
}

function normalizarListaExacta(lista) {
    return lista.map(item => normalizarTextoExacto(item));
}

// ==================== ÍNDICES EXACTOS ====================

const pictogramasExactos = normalizarDiccionarioExacto(pictogramas);
const verbosConjugadosExactos = normalizarDiccionarioExacto(verbosConjugados);

const verbosBaseExactos = normalizarListaExacta(verbosBase);
const pronombresExactos = normalizarListaExacta(pronombres);
const relacionantesExactos = normalizarListaExacta(relacionantes);
const preposicionesExactas = normalizarListaExacta(preposiciones);
const adjetivosExactos = normalizarListaExacta(adjetivos);
const reflexivosExactos = normalizarListaExacta(pronombresReflexivosCuasiReflejos);

// ==================== FUNCIONES AUX ====================

function resolverPalabraExactaOAlias(palabra) {
    const exacta = normalizarTextoExacto(palabra);

    return {
        exacta,
        alias: aplicarAlias(palabra)
    };
}

function estaEnLista(palabra, listaExacta) {
    const { exacta, alias } = resolverPalabraExactaOAlias(palabra);

    // 1. EXACTO
    if (listaExacta.includes(exacta)) {
        return true;
    }

    // 2. SOLO ALIAS EXPLÍCITO
    if (alias) {
        const aliasExacto = normalizarTextoExacto(alias);
        return listaExacta.includes(aliasExacto);
    }

    return false;
}

function obtenerValorDiccionario(clave, diccionarioExacto) {
    const { exacta, alias } = resolverPalabraExactaOAlias(clave);

    // 1. EXACTO
    if (Object.prototype.hasOwnProperty.call(diccionarioExacto, exacta)) {
        return diccionarioExacto[exacta];
    }

    // 2. SOLO ALIAS EXPLÍCITO
    if (alias) {
        const aliasExacto = normalizarTextoExacto(alias);
        if (Object.prototype.hasOwnProperty.call(diccionarioExacto, aliasExacto)) {
            return diccionarioExacto[aliasExacto];
        }
    }

    return null;
}

function esPronombre(palabra) {
    return estaEnLista(palabra, pronombresExactos);
}

function esRelacionante(palabra) {
    return estaEnLista(palabra, relacionantesExactos);
}

function esPreposicion(palabra) {
    return estaEnLista(palabra, preposicionesExactas);
}

function esAdjetivo(palabra) {
    return estaEnLista(palabra, adjetivosExactos);
}

function esReflexivosCuasiReflejos(palabra) {
    return estaEnLista(palabra, reflexivosExactos);
}

function obtenerRaizVerbal(palabra) {
    const { exacta, alias } = resolverPalabraExactaOAlias(palabra);

    // Nunca tomar reflexivos como verbo
    if (reflexivosExactos.includes(exacta)) {
        return null;
    }

    // 1. EXACTO
    if (verbosConjugadosExactos[exacta]) {
        return verbosConjugadosExactos[exacta];
    }

    if (verbosBaseExactos.includes(exacta)) {
        return exacta;
    }

    // 2. SOLO ALIAS EXPLÍCITO
    if (alias) {
        const aliasExacto = normalizarTextoExacto(alias);

        if (reflexivosExactos.includes(aliasExacto)) {
            return null;
        }

        if (verbosConjugadosExactos[aliasExacto]) {
            return verbosConjugadosExactos[aliasExacto];
        }

        if (verbosBaseExactos.includes(aliasExacto)) {
            return aliasExacto;
        }
    }

    return null;
}

function existePicto(clave) {
    return obtenerValorDiccionario(clave, pictogramasExactos) !== null;
}

function obtenerPicto(clave) {
    return obtenerValorDiccionario(clave, pictogramasExactos) || "";
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

            const palabraExacta = normalizarTextoExacto(palabraLimpia);
            const palabraAlias = aplicarAlias(palabraLimpia);

            const palabraAnteriorOriginal = palabras[i - 1] || "";
            const palabraSiguienteOriginal = palabras[i + 1] || "";

            const palabraAnteriorLimpia = limpiarBordes(palabraAnteriorOriginal);
            const palabraSiguienteLimpia = limpiarBordes(palabraSiguienteOriginal);

            const palabraAnteriorExacta = normalizarTextoExacto(palabraAnteriorLimpia);
            const palabraSiguienteExacta = normalizarTextoExacto(palabraSiguienteLimpia);

            const palabraAnteriorAlias = aplicarAlias(palabraAnteriorLimpia);
            const palabraSiguienteAlias = aplicarAlias(palabraSiguienteLimpia);

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

                const grupoExacto = normalizarTextoExacto(grupoLimpio);

                // 1. EXACTO
                if (Object.prototype.hasOwnProperty.call(pictogramasExactos, grupoExacto)) {
                    fraseEncontrada = {
                        original: grupoOriginal,
                        limpio: grupoLimpio,
                        normalizado: grupoExacto,
                        imagen: pictogramasExactos[grupoExacto]
                    };
                    palabrasConsumidas = longitud;
                    break;
                }

                // 2. SOLO ALIAS EXPLÍCITO
                const grupoAlias = aplicarAlias(grupoLimpio);
                if (grupoAlias) {
                    const grupoAliasExacto = normalizarTextoExacto(grupoAlias);

                    if (Object.prototype.hasOwnProperty.call(pictogramasExactos, grupoAliasExacto)) {
                        fraseEncontrada = {
                            original: grupoOriginal,
                            limpio: grupoLimpio,
                            normalizado: grupoAliasExacto,
                            imagen: pictogramasExactos[grupoAliasExacto]
                        };
                        palabrasConsumidas = longitud;
                        break;
                    }
                }
            }

            // =========================
            // VERBOS
            // =========================
            const raizVerbal = obtenerRaizVerbal(palabraLimpia);
            const esInfinitivo =
                verbosBaseExactos.includes(palabraExacta) ||
                (palabraAlias && verbosBaseExactos.includes(normalizarTextoExacto(palabraAlias)));

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
                const palabraA = palabraExacta === "a" || palabraAlias === "a";

                const siguienteEsInfinitivo =
                    verbosBaseExactos.includes(palabraSiguienteExacta) ||
                    (palabraSiguienteAlias &&
                        verbosBaseExactos.includes(normalizarTextoExacto(palabraSiguienteAlias)));

                const anteriorEsVerbo =
                    verbosConjugadosExactos[palabraAnteriorExacta] ||
                    verbosBaseExactos.includes(palabraAnteriorExacta) ||
                    (palabraAnteriorAlias &&
                        (
                            verbosConjugadosExactos[normalizarTextoExacto(palabraAnteriorAlias)] ||
                            verbosBaseExactos.includes(normalizarTextoExacto(palabraAnteriorAlias))
                        ));

                const esFraseVerbal = palabraA && siguienteEsInfinitivo && anteriorEsVerbo;

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
            if (fraseEncontrada && mostrarImagenes && !raizVerbal) {
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
    const btn = document.getElementById("btnSimbolos");
    btn.innerText = mostrarSimbolos ? "Símbolos ON" : "Símbolos OFF";
    btn.classList.toggle("boton-on", mostrarSimbolos);
    btn.classList.toggle("boton-off", !mostrarSimbolos);
    mostrarPictos();
}

function togglePictos() {
    mostrarImagenes = !mostrarImagenes;
    const btn = document.getElementById("btnPictos");
    btn.innerText = mostrarImagenes ? "Pictogramas ON" : "Pictogramas OFF";
    btn.classList.toggle("boton-on", mostrarImagenes);
    btn.classList.toggle("boton-off", !mostrarImagenes);
    mostrarPictos();
}

function toggleColor() {
    mostrarColores = !mostrarColores;
    const btn = document.getElementById("btnColor");
    btn.innerText = mostrarColores ? "Color ON" : "Color OFF";
    btn.classList.toggle("boton-on", mostrarColores);
    btn.classList.toggle("boton-off", !mostrarColores);
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