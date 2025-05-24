document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('ruletaJuego');
    // Asegurarse que el canvas y el contexto se obtienen correctamente
    if (!canvas || !canvas.getContext) {
        console.error("El elemento canvas 'ruletaJuego' no fue encontrado o el contexto 2D no es soportado.");
        // Detener la ejecución si el canvas no está disponible para evitar más errores.
        // Podrías mostrar un mensaje al usuario en el HTML aquí.
        const principalContainer = document.querySelector('.contenedor-principal');
        if (principalContainer) {
            principalContainer.innerHTML = '<p style="color: red; text-align: center; font-size: 1.2em;">Error: El juego no puede cargarse. El componente gráfico principal (canvas) no está disponible.</p>';
        }
        return;
    }
    const ctx = canvas.getContext('2d');

    const botonGirar = document.getElementById('botonGirar');
    const areaResultado = document.getElementById('areaResultado');
    const textoResultado = document.getElementById('textoResultado');
    const botonNuevoIntento = document.getElementById('botonNuevoIntento');
    const botonExplicarIngles = document.getElementById('botonExplicarIngles');
    const explicacionInglesDiv = document.getElementById('explicacionIngles');

    const puntosAciertosSpan = document.getElementById('puntosAciertos');
    const botonesEvaluacionDiv = document.getElementById('botonesEvaluacion');
    const botonCorrecto = document.getElementById('botonCorrecto');
    const botonIncorrecto = document.getElementById('botonIncorrecto');

    const synth = window.speechSynthesis;
    let puntuacionAciertos = 0;
    let sePuedePuntuarEstaRonda = true;

    const foneticaLetrasIngles = {
        'a': 'ei', 'b': 'bi', 'c': 'ci', 'd': 'di', 'e': 'i',
        'f': 'ef', 'g': 'yi', 'h': 'eich', 'i': 'ai', 'j': 'yei',
        'k': 'kei', 'l': 'el', 'm': 'em', 'n': 'en', 'o': 'ou',
        'p': 'pi', 'q': 'kiu', 'r': 'ar', 's': 'es', 't': 'ti',
        'u': 'iu', 'v': 'vi', 'w': 'dabel iu', 'x': 'ex', 'y': 'uai', 'z': 'zi'
    };

    const datosOriginales = {
        numeros: [
            "8.345.800", "953.146.812", "236.738.459", "18767", "3989",
            "1999", "3.000.000", "3.425.630", "1138", "538.987", "304.551.246"
        ],
        letras: [
            "q-w-l-h-a", "b-x-z-m-p", "s-p-b-r-y", "m-a-f-h-z", "z-v-c-u-a",
            "r-z-h-y-b", "q-x-y-w-h", "w-p-r-s-y", "e-g-k-d-f"
        ]
    };

    const opcionesRuleta = [...datosOriginales.numeros, ...datosOriginales.letras].map(item => {
        const tipo = datosOriginales.numeros.includes(item) ? 'numero' : 'letras';
        return {
            textoOriginal: item,
            tipo: tipo,
            textoMostradoEnRuleta: tipo === 'numero' ? 'Número' : 'Letra'
        };
    });

    const coloresBase = ["#5E72E4", "#825EE4", "#FF6B6B", "#2DCE89", "#FB6340", "#11CDEF", "#F5365C", "#FFD60A", "#AF1AF0", "#0FFAF0", "#FFC107"];
    opcionesRuleta.forEach((opcion, i) => {
        opcion.color = coloresBase[i % coloresBase.length];
    });

    let anguloActual = 0;
    let girando = false;
    let resultadoActual = null;

    let radio;
    const PI2 = Math.PI * 2;
    let anguloPorcion;

    function actualizarMarcador() {
        if (puntosAciertosSpan) {
            puntosAciertosSpan.textContent = puntuacionAciertos;
        }
    }

    function ajustarTamanoYRedibujar() {
        const contenedorCanvas = canvas.parentElement;
        if (!contenedorCanvas) {
            console.warn("Contenedor del canvas no encontrado para ajustar tamaño.");
            return;
        }
        const tamanoContenedor = contenedorCanvas.offsetWidth;

        canvas.width = tamanoContenedor;
        canvas.height = tamanoContenedor;

        radio = canvas.width / 2;
        // anguloPorcion se calcula aquí por si el número de opciones cambiara dinámicamente en el futuro,
        // aunque actualmente es fijo después de la carga inicial.
        if (opcionesRuleta.length > 0) {
            anguloPorcion = PI2 / opcionesRuleta.length;
        } else {
            anguloPorcion = PI2; // Evitar división por cero si no hay opciones
            console.warn("No hay opciones en la ruleta para calcular anguloPorcion.");
        }


        dibujarRuleta();
    }

    function dibujarRuleta() {
        if (!radio || !ctx || !anguloPorcion) { // Verificar todas las dependencias necesarias
            // console.warn("No se puede dibujar la ruleta: radio, ctx o anguloPorcion no definidos.");
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(radio, radio);
        ctx.rotate(anguloActual);

        opcionesRuleta.forEach((opcion, i) => {
            const anguloInicio = i * anguloPorcion;
            const anguloFin = (i + 1) * anguloPorcion;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radio - (radio * 0.05), anguloInicio - PI2 / 4, anguloFin - PI2 / 4);
            ctx.closePath();
            ctx.fillStyle = opcion.color;
            ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            ctx.lineWidth = Math.max(1, radio * 0.01);
            ctx.stroke();
            ctx.save();
            ctx.fillStyle = "white";

            let fontSize = Math.floor(radio / 12);
            if (opcionesRuleta.length > 15) fontSize = Math.floor(radio / 15);
            fontSize = Math.max(8, Math.min(fontSize, 22)); // Clamp font size

            ctx.font = `bold ${fontSize}px Poppins`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const anguloTexto = anguloInicio + anguloPorcion / 2 - PI2 / 4;
            ctx.rotate(anguloTexto);
            ctx.fillText(opcion.textoMostradoEnRuleta, radio * 0.62, 0);
            ctx.restore();
        });
        ctx.restore();
    }

    function girar() {
        if (girando || !ctx || !anguloPorcion) return;
        girando = true;
        sePuedePuntuarEstaRonda = true;

        if(botonGirar) botonGirar.classList.add('hidden');
        if(areaResultado) areaResultado.style.display = 'none';
        if(explicacionInglesDiv) {
            explicacionInglesDiv.style.display = 'none';
            explicacionInglesDiv.textContent = '';
        }
        if(botonesEvaluacionDiv) botonesEvaluacionDiv.style.display = 'none';

        if (synth && synth.speaking) {
            synth.cancel();
        }

        const vueltasMinimas = 5;
        const vueltasExtra = Math.random() * 5;
        const anguloTotalAGirar = (vueltasMinimas + vueltasExtra) * PI2;
        const indiceGanador = Math.floor(Math.random() * opcionesRuleta.length);
        const anguloCentroGanador = (indiceGanador * anguloPorcion) + (anguloPorcion / 2);
        const anguloFinalDeseado = -anguloCentroGanador + (PI2 / 4);
        const anguloFinalConVueltas = anguloTotalAGirar + anguloFinalDeseado;
        let inicioAnimacion = null;
        const anguloInicioAnimacion = anguloActual;
        const duracionAnimacion = 5000 + Math.random() * 2000;

        function animar(timestamp) {
            if (!inicioAnimacion) inicioAnimacion = timestamp;
            const progreso = Math.min((timestamp - inicioAnimacion) / duracionAnimacion, 1);
            const easeOutProgreso = 1 - Math.pow(1 - progreso, 4);
            anguloActual = anguloInicioAnimacion + (anguloFinalConVueltas - anguloInicioAnimacion) * easeOutProgreso;
            anguloActual %= PI2;
            dibujarRuleta();
            if (progreso < 1) {
                requestAnimationFrame(animar);
            } else {
                anguloActual = anguloFinalDeseado % PI2;
                dibujarRuleta();
                girando = false;
                resultadoActual = opcionesRuleta[indiceGanador];
                mostrarResultado();
            }
        }
        requestAnimationFrame(animar);
    }

    function mostrarResultado() {
        if(textoResultado) textoResultado.textContent = resultadoActual.textoOriginal;
        if(areaResultado) {
            areaResultado.style.display = 'block';
            areaResultado.classList.remove('slide-up-fade-in');
            void areaResultado.offsetWidth; // Trigger reflow
            areaResultado.classList.add('slide-up-fade-in');
        }
        if(botonNuevoIntento) botonNuevoIntento.classList.remove('hidden');
        if(botonExplicarIngles) {
            botonExplicarIngles.classList.remove('hidden');
            botonExplicarIngles.disabled = false;
        }
    }

    if(botonGirar) botonGirar.addEventListener('click', girar);

    if(botonNuevoIntento) botonNuevoIntento.addEventListener('click', () => {
        if(botonGirar) botonGirar.classList.remove('hidden');
        if(areaResultado) areaResultado.style.display = 'none';
        if(explicacionInglesDiv) {
            explicacionInglesDiv.style.display = 'none';
            explicacionInglesDiv.textContent = '';
        }
        if(botonesEvaluacionDiv) botonesEvaluacionDiv.style.display = 'none';
        resultadoActual = null;
        if (synth && synth.speaking) {
            synth.cancel();
        }
    });

    if(botonExplicarIngles) botonExplicarIngles.addEventListener('click', () => {
        if (!resultadoActual) return;
        if (!synth) {
            if(explicacionInglesDiv) {
                explicacionInglesDiv.textContent = "La síntesis de voz no está disponible.";
                explicacionInglesDiv.style.display = 'block';
            }
            if(botonesEvaluacionDiv) botonesEvaluacionDiv.style.display = 'none';
            return;
        }
        if (synth.speaking) {
            synth.cancel();
        }

        let textoParaMostrar = '';
        let textoParaHablar = '';

        if (resultadoActual.tipo === 'numero') {
            textoParaMostrar = convertirNumeroAIngles(resultadoActual.textoOriginal);
            textoParaHablar = textoParaMostrar;
        } else {
            textoParaMostrar = resultadoActual.textoOriginal.toUpperCase().split('-').join(' - ');
            const letrasIndividuales = resultadoActual.textoOriginal.toLowerCase().split('-');
            textoParaHablar = letrasIndividuales.map(letra => foneticaLetrasIngles[letra] || letra).join(' - ');
        }

        if(explicacionInglesDiv) {
            explicacionInglesDiv.textContent = textoParaMostrar;
            explicacionInglesDiv.style.display = 'block';
            explicacionInglesDiv.classList.remove('fade-in');
            void explicacionInglesDiv.offsetWidth; // Trigger reflow
            explicacionInglesDiv.classList.add('fade-in');
        }

        const utterance = new SpeechSynthesisUtterance(textoParaHablar);
        utterance.lang = 'en-US';
        utterance.pitch = 1;
        utterance.rate = 0.85;
        utterance.volume = 0.9;

        utterance.onend = () => {
            if (areaResultado && areaResultado.style.display === 'block' && botonesEvaluacionDiv) {
                botonesEvaluacionDiv.style.display = 'flex';
                if(botonCorrecto) botonCorrecto.disabled = false;
                if(botonIncorrecto) botonIncorrecto.disabled = false;
            }
        };
        utterance.onerror = (event) => {
            console.error('Error en la síntesis de voz:', event);
            // Fallback: Mostrar botones de evaluación aunque haya error en TTS
            if (areaResultado && areaResultado.style.display === 'block' && botonesEvaluacionDiv) {
                botonesEvaluacionDiv.style.display = 'flex';
                if(botonCorrecto) botonCorrecto.disabled = false;
                if(botonIncorrecto) botonIncorrecto.disabled = false;
            }
        };
        synth.speak(utterance);
    });

    if(botonCorrecto) botonCorrecto.addEventListener('click', () => {
        if (sePuedePuntuarEstaRonda) {
            puntuacionAciertos++;
            actualizarMarcador();
            sePuedePuntuarEstaRonda = false;
        }
        if(botonesEvaluacionDiv) botonesEvaluacionDiv.style.display = 'none';
    });

    if(botonIncorrecto) botonIncorrecto.addEventListener('click', () => {
        if (sePuedePuntuarEstaRonda) {
            puntuacionAciertos = Math.max(0, puntuacionAciertos - 1); // Restar punto
            actualizarMarcador();
            sePuedePuntuarEstaRonda = false;
        }
        if(botonesEvaluacionDiv) botonesEvaluacionDiv.style.display = 'none';
    });
    
    function convertirNumeroAIngles(numStr) {
        const num = parseInt(numStr.replace(/\./g, ''), 10);
        if (isNaN(num)) return "Invalid number";
        if (num === 0) return "zero";

        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const scales = ['', 'thousand', 'million', 'billion'];

        function convertLessThanThousand(n) {
            let current = "";
            if (n >= 100) {
                current += ones[Math.floor(n / 100)] + " hundred";
                n %= 100;
                if (n > 0) current += " ";
            }
            if (n >= 20) {
                current += tens[Math.floor(n / 10)];
                n %= 10;
                 if (n > 0) current += "-";
            }
            if (n > 0) {
                current += ones[n];
            }
            return current.trim();
        }
        
        if (num === 0) return "zero"; // Ya cubierto arriba, pero por si acaso.
        if (num < 0) return "minus " + convertirNumeroAIngles(Math.abs(num).toString().replace(/\./g, ''));
        
        let words = "";
        let scaleIndex = 0;
        let tempNum = num;

        while (tempNum > 0) {
            if (tempNum % 1000 !== 0) {
                const part = convertLessThanThousand(tempNum % 1000);
                words = part + (scales[scaleIndex] ? " " + scales[scaleIndex] : "") + (words ? " " + words : "");
            }
            tempNum = Math.floor(tempNum / 1000);
            scaleIndex++;
        }
        return words.trim().replace(/\s+/g, ' ');
    }

    // Inicialización
    actualizarMarcador();
    ajustarTamanoYRedibujar(); // Ajustar tamaño inicial y dibujar

    let timeoutIdResize = null;
    window.addEventListener('resize', () => {
        clearTimeout(timeoutIdResize);
        timeoutIdResize = setTimeout(() => {
            if (!girando) { // Solo redibujar si no está girando
                ajustarTamanoYRedibujar();
            }
        }, 250); // Debounce para optimizar el rendimiento
    });

}); // Fin de DOMContentLoaded