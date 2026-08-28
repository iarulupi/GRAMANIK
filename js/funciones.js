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


// ==================== PALABRAS AMBIGUAS ====================
// Permite elegir manualmente la categoría cuando una misma forma escrita
// puede funcionar de más de una manera (por ejemplo: "corto").

const palabrasAmbiguas = {
    "corto": [
        {
            tipo: "verbo",
            etiqueta: "VERBO",
            base: "cortar",
            picto: "cortar"
        },
        {
            tipo: "adjetivo",
            etiqueta: "ADJETIVO",
            base: "corto",
            picto: "corto"
        }
    ],

    "chico": [
        {
            tipo: "sustantivo",
            etiqueta: "SUSTANTIVO",
            base: "chico",
            picto: "chico"
        },
        {
            tipo: "adjetivo",
            etiqueta: "ADJETIVO",
            base: "chico",
            picto: "chico"
        }
    ],

    "chica": [
        {
            tipo: "sustantivo",
            etiqueta: "SUSTANTIVO",
            base: "chica",
            picto: "chica"
        },
        {
            tipo: "adjetivo",
            etiqueta: "ADJETIVO",
            base: "chica",
            picto: "chica"
        }
    ]
};
const eleccionesAmbiguas = {};

function obtenerOpcionesAmbiguas(palabra) {
    const exacta = normalizarTextoExacto(palabra);
    return palabrasAmbiguas[exacta] || null;
}

function claveAparicionAmbigua(indiceLinea, indicePalabra, palabra) {
    return `${indiceLinea}:${indicePalabra}:${normalizarTextoExacto(palabra)}`;
}

function crearSelectorAmbiguedad(opciones, seleccionActual, alCambiar) {
    const contenedor = document.createElement("div");
    contenedor.className = "selector-ambiguedad no-descargar";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-ambiguedad";
    boton.innerText = `${seleccionActual.etiqueta} ▼`;

    const menu = document.createElement("div");
    menu.className = "menu-ambiguedad";

    opciones.forEach(opcion => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "opcion-ambiguedad";
        item.innerText = opcion.etiqueta;

        item.addEventListener("click", evento => {
            evento.stopPropagation();
            menu.classList.remove("menu-ambiguedad-abierto");
            alCambiar(opcion);
        });

        menu.appendChild(item);
    });

    boton.addEventListener("click", evento => {
        evento.stopPropagation();

        document
            .querySelectorAll(".menu-ambiguedad-abierto")
            .forEach(otroMenu => {
                if (otroMenu !== menu) {
                    otroMenu.classList.remove("menu-ambiguedad-abierto");
                }
            });

        menu.classList.toggle("menu-ambiguedad-abierto");
    });

    contenedor.appendChild(boton);
    contenedor.appendChild(menu);

    return contenedor;
}

document.addEventListener("click", evento => {
    if (!evento.target.closest(".selector-ambiguedad")) {
        document
            .querySelectorAll(".menu-ambiguedad-abierto")
            .forEach(menu => menu.classList.remove("menu-ambiguedad-abierto"));
    }
});

function crearPictoAmbiguoSeleccionable(opciones) {
    const picto = crearPictoSeleccionable(opciones);

    // En palabras ambiguas el selector gramatical ocupa la esquina derecha.
    // Movemos la × del pictograma a la izquierda para que ambos controles
    // convivan sin taparse. Esto sirve para CUALQUIER palabra ambigua.
    const botonEliminar = picto.querySelector(".eliminar-picto");
    if (botonEliminar) {
        botonEliminar.style.right = "auto";
        botonEliminar.style.left = "-8px";
    }

    return picto;
}

function renderizarInterpretacionAmbigua({
    opcion,
    filaPicto,
    filaSimbolo,
    filaTexto
}) {
    filaPicto.innerHTML = "";
    filaSimbolo.innerHTML = "";

    filaTexto.style.color = "";
    filaTexto.style.fontWeight = "";

    if (opcion.tipo === "verbo") {
        if (mostrarColores) {
            filaTexto.style.color = "red";
            filaTexto.style.fontWeight = "bold";
        }

        if (mostrarSimbolos) {
            filaSimbolo.innerText = "=";
            filaSimbolo.style.color = "red";
        }

        if (mostrarImagenes) {
            const opcionesPicto = obtenerPictos(opcion.picto);
            if (opcionesPicto.length) {
                filaPicto.appendChild(crearPictoAmbiguoSeleccionable(opcionesPicto));
            }
        }

        return;
    }

    if (opcion.tipo === "adjetivo") {
        if (mostrarSimbolos) {
            const imgSimbolo = document.createElement("img");
            imgSimbolo.src = simboloAdjetivo;
            imgSimbolo.style.width = "40px";
            imgSimbolo.style.height = "40px";
            filaSimbolo.appendChild(imgSimbolo);
        }

        if (opcion.tipo === "sustantivo") {

    if (mostrarImagenes) {
        const opcionesPicto = obtenerPictos(opcion.picto);

        if (opcionesPicto.length) {
            filaPicto.appendChild(
                crearPictoAmbiguoSeleccionable(opcionesPicto)
            );
        }
    }

    return;
}

        if (mostrarImagenes) {
            const opcionesPicto = obtenerPictos(opcion.picto);
            if (opcionesPicto.length) {
                filaPicto.appendChild(crearPictoAmbiguoSeleccionable(opcionesPicto));
            }
        }
    }
}

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

function obtenerPictos(clave) {
    const valor = obtenerValorDiccionario(clave, pictogramasExactos);

    if (!valor) return [];

    // Si ya es una lista de pictogramas
    if (Array.isArray(valor)) {
        return valor.filter(Boolean);
    }

    // Si es un solo pictograma
    return [valor];
}

function obtenerPicto(clave) {
    const opciones = obtenerPictos(clave);
    return opciones.length ? opciones[0] : "";
}

function cerrarMenusPictos(menuExcepto = null) {

    document
        .querySelectorAll(".menu-pictos-abierto")
        .forEach(menu => {

            if (menu !== menuExcepto) {
                menu.classList.remove("menu-pictos-abierto");
            }

        });
}

function crearPictoSeleccionable(opciones) {

    const contenedor = document.createElement("div");
    contenedor.className = "picto-seleccionable";

    const img = document.createElement("img");
    img.src = opciones[0];

    contenedor.appendChild(img);

// ==================== BOTÓN ELIMINAR PICTOGRAMA ====================

const botonEliminar = document.createElement("button");
botonEliminar.type = "button";
botonEliminar.className = "eliminar-picto no-descargar";
botonEliminar.innerText = "×";

botonEliminar.addEventListener("click", evento => {
    evento.stopPropagation();

    // Ocultar únicamente el pictograma de esta aparición
    img.style.display = "none";

    // Ocultar también la flecha si existe
    const flecha = contenedor.querySelector(".flecha-picto");
    if (flecha) {
        flecha.style.display = "none";
    }

    // Cerrar el menú de opciones si estaba abierto
    const menu = contenedor.querySelector(".menu-pictos");
    if (menu) {
        menu.classList.remove("menu-pictos-abierto");
    }

    // Ocultar la propia cruz
    botonEliminar.style.display = "none";
});

contenedor.appendChild(botonEliminar);

    // Si solo hay una imagen, no hace falta selector
    if (opciones.length <= 1) {
        return contenedor;
    }

// ==================== CERRAR SELECTOR AL HACER CLICK AFUERA ====================

document.addEventListener("click", evento => {

    const hizoClickEnSelector =
        evento.target.closest(".picto-seleccionable");

    if (!hizoClickEnSelector) {
        cerrarMenusPictos();
    }

});

    // Flechita
    const flecha = document.createElement("button");
    flecha.type = "button";
    flecha.className = "flecha-picto no-descargar";
    flecha.innerText = "▼";

    contenedor.appendChild(flecha);

    // Menú de opciones
    const menu = document.createElement("div");
    menu.className = "menu-pictos no-descargar";

    opciones.forEach(url => {

        const opcion = document.createElement("img");
        opcion.src = url;
        opcion.className = "opcion-picto";

        opcion.addEventListener("click", () => {
            img.src = url;
            menu.classList.remove("menu-pictos-abierto");
        });

        menu.appendChild(opcion);
    });

    contenedor.appendChild(menu);

flecha.addEventListener("click", evento => {

    evento.stopPropagation();

    const estabaAbierto =
        menu.classList.contains("menu-pictos-abierto");

    // Cerrar cualquier otro selector que esté abierto
    cerrarMenusPictos(menu);

    // Si este ya estaba abierto, lo cerramos
    if (estabaAbierto) {
        menu.classList.remove("menu-pictos-abierto");
        return;
    }

    // Abrir este selector
    menu.classList.add("menu-pictos-abierto");

    // Primero lo dejamos centrado normalmente
    menu.style.left = "50%";
    menu.style.right = "auto";
    menu.style.transform = "translateX(-50%)";

    requestAnimationFrame(() => {

        const rect = menu.getBoundingClientRect();
        const margen = 10;

        // Si se sale por la izquierda
        if (rect.left < margen) {

            const correccion = margen - rect.left;

            menu.style.transform =
                `translateX(calc(-50% + ${correccion}px))`;
        }

        // Si se sale por la derecha
        const rectCorregido = menu.getBoundingClientRect();

        if (rectCorregido.right > window.innerWidth - margen) {

            const correccion =
                rectCorregido.right -
                (window.innerWidth - margen);

            menu.style.transform =
                `translateX(calc(-50% - ${correccion}px))`;
        }

    });

});

    return contenedor;
}

// ==================== ESTADO ====================

let mostrarSimbolos = true;
let mostrarImagenes = true;
let mostrarColores = true;
let tipografiaActual = "'Dreaming Outloud Pro', cursive";

// ==================== FUNCIONES ====================

function extraerPuntuacionFinal(texto) {
    const match = (texto || "").match(/[.,;:!?]+$/);
    return match ? match[0] : "";
}

function mostrarPictos() {
    const texto = document.getElementById("texto").value || "";
    const resultado = document.getElementById("resultado");
    resultado.innerHTML = "";

    texto.split("\n").forEach((linea, indiceLinea) => {
        const contenedorLinea = document.createElement("div");
        contenedorLinea.className = "contenedor-linea";

        const palabras = linea.split(/\s+/).filter(Boolean);

        for (let i = 0; i < palabras.length; i++) {
            const palabraOriginal = palabras[i];
            const palabraLimpia = limpiarBordes(palabraOriginal);

            const opcionesAmbiguasPalabra = obtenerOpcionesAmbiguas(palabraLimpia);

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
filaTexto.style.fontFamily = tipografiaActual;

          // =========================
// BUSCAR FRASES DE HASTA 10 PALABRAS
// =========================
let fraseEncontrada = null;
let palabrasConsumidas = 0;

// Nunca intenta tomar más palabras de las que realmente quedan en la oración
const maxPalabrasFrase = Math.min(10, palabras.length - i);

for (let longitud = maxPalabrasFrase; longitud > 0; longitud--) {
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

            // Si encontró una frase compuesta, permitir que el bloque
            // ocupe el ancho real que necesita sin pisar otras palabras.
            if (fraseEncontrada && palabrasConsumidas > 1) {
                div.classList.add("frase-compuesta");
            }

            // =========================
            // AMBIGÜEDAD GRAMATICAL
            // =========================
            const esAmbiguaActiva =
                !!opcionesAmbiguasPalabra &&
                (!fraseEncontrada || palabrasConsumidas === 1);

            if (esAmbiguaActiva) {
                fraseEncontrada = null;
                palabrasConsumidas = 0;

                const claveEleccion = claveAparicionAmbigua(
                    indiceLinea,
                    i,
                    palabraLimpia
                );

                let indiceElegido = eleccionesAmbiguas[claveEleccion];

                if (
                    typeof indiceElegido !== "number" ||
                    !opcionesAmbiguasPalabra[indiceElegido]
                ) {
                    indiceElegido = 0;
                    eleccionesAmbiguas[claveEleccion] = 0;
                }

                const opcionElegida = opcionesAmbiguasPalabra[indiceElegido];

                const aplicarOpcion = opcion => {
                    const nuevoIndice = opcionesAmbiguasPalabra.indexOf(opcion);
                    eleccionesAmbiguas[claveEleccion] = nuevoIndice;

                    renderizarInterpretacionAmbigua({
                        opcion,
                        filaPicto,
                        filaSimbolo,
                        filaTexto
                    });

                    const selectorViejo = div.querySelector(".selector-ambiguedad");
                    if (selectorViejo) selectorViejo.remove();

                    const selectorNuevo = crearSelectorAmbiguedad(
                        opcionesAmbiguasPalabra,
                        opcion,
                        aplicarOpcion
                    );
                    div.appendChild(selectorNuevo);
                };

                renderizarInterpretacionAmbigua({
                    opcion: opcionElegida,
                    filaPicto,
                    filaSimbolo,
                    filaTexto
                });

                const selector = crearSelectorAmbiguedad(
                    opcionesAmbiguasPalabra,
                    opcionElegida,
                    aplicarOpcion
                );

                div.appendChild(selector);
            }

            // =========================
            // VERBOS
            // =========================
            const raizVerbal = esAmbiguaActiva
                ? null
                : obtenerRaizVerbal(palabraLimpia);
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

               const opcionesVerbo = obtenerPictos(raizVerbal);

if (opcionesVerbo.length && mostrarImagenes) {
    const picto = crearPictoSeleccionable(opcionesVerbo);
    filaPicto.appendChild(picto);
}
            }

            // =========================
            // ADJETIVOS
            // =========================
            if (!esAmbiguaActiva && esAdjetivo(palabraLimpia)) {
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

if (fraseEncontrada && mostrarImagenes && !raizVerbal && !esAmbiguaActiva) {

    const opcionesFrase = Array.isArray(fraseEncontrada.imagen)
        ? fraseEncontrada.imagen.filter(Boolean)
        : fraseEncontrada.imagen
            ? [fraseEncontrada.imagen]
            : [];

    if (opcionesFrase.length) {
        const picto = crearPictoSeleccionable(opcionesFrase);
        filaPicto.appendChild(picto);
    }

    i += palabrasConsumidas - 1;

} else if (!raizVerbal && !esAmbiguaActiva) {

    const opcionesSimple = obtenerPictos(palabraLimpia);

    if (opcionesSimple.length && mostrarImagenes) {
        const picto = crearPictoSeleccionable(opcionesSimple);
        filaPicto.appendChild(picto);
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

    // =========================
    // AJUSTAR TODAS LAS LÍNEAS AL MISMO TAMAÑO
    // =========================

    requestAnimationFrame(() => {

        const lineas = resultado.querySelectorAll(".contenedor-linea");

        if (!lineas.length) return;

        const anchoDisponible = resultado.clientWidth;

        let escalaGeneral = 1;

        // Primero buscamos qué línea necesita achicarse más
        lineas.forEach(linea => {

            // Restablecer por si se vuelve a tocar el botón Crear
            linea.style.transform = "none";
            linea.style.transformOrigin = "left top";
            linea.style.marginBottom = "10px";

            const anchoLinea = linea.scrollWidth;

            if (anchoLinea > anchoDisponible) {

                const escalaNecesaria = anchoDisponible / anchoLinea;

                if (escalaNecesaria < escalaGeneral) {
                    escalaGeneral = escalaNecesaria;
                }
            }
        });

        // Después aplicamos ESA MISMA escala a todas
        lineas.forEach(linea => {

            linea.style.transform = `scale(${escalaGeneral})`;
            linea.style.transformOrigin = "left top";

            const altoOriginal = linea.offsetHeight;
            const espacioQueSobra = altoOriginal * (1 - escalaGeneral);

            linea.style.marginBottom =
                `${10 - espacioQueSobra}px`;
        });

    });
}

// ==================== BOTONES ====================

function cambiarTipografia() {

    const selector = document.getElementById("tipografia");

    tipografiaActual = selector.value;

    // Volver a crear el resultado para recalcular
    // correctamente el ancho de todas las palabras
    document.fonts.ready.then(() => {
        mostrarPictos();
    });
}

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
        scale: 2,

        // No incluir controles de edición en la imagen descargada
        ignoreElements: (elemento) => {
            return elemento.classList &&
                   elemento.classList.contains("no-descargar");
        }

    }).then(canvas => {
        const link = document.createElement("a");
        link.download = "gramanick.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}
