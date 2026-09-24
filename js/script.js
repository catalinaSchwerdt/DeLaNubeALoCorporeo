// =============================================================================
// CONFIGURACIÓN DEL MOVIMIENTO DEL AUTO (AutoFuturistaCables)
// Modificá estos valores para calibrar la inclinación, recorrido y velocidad:
// =============================================================================
const CONFIG_AUTO = {
  // 1. RECORRIDO HORIZONTAL HASTA EL MARGEN IZQUIERDO:
  // Cruza toda la pantalla y sale por el margen izquierdo (da la ilusión de irse)
  distanciaX: () => window.innerWidth + 200,

  // 2. PARÁMETRO DE INCLINACIÓN (CAÍDA VERTICAL EN Y):
  distanciaY: 500, // Tu valor configurado en píxeles hacia abajo

  // 3. VELOCIDAD / RANGO DE SCROLL:
  // Cuántos píxeles de scroll hacia abajo se necesitan para completar el recorrido
  rangoScroll: 1000,

  // 4. POSICIÓN FUERA DE PANTALLA PARA LA 2DA VEZ EN ADELANTE ("Dar una vuelta"):
  // En el 2do scroll en adelante, el auto arranca esperando afuera arriba a la derecha:
  fueraPantallaX: 480,  // píxeles hacia la derecha (afuera de la pantalla)
  fueraPantallaY: -140, // píxeles hacia arriba (afuera de la pantalla)
};

// =============================================================================
// LÓGICA DE ANIMACIÓN CON SCROLL
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const auto = document.querySelector('.auto-cables');

  if (!auto) return;

  let lastScrollY = window.scrollY || window.pageYOffset;
  let maxProgressReached = 0;
  let hasExited = false;
  
  // Bandera que controla si es la primera vez que se scrollea
  // (la 1ra vez parte desde su posición fija original; a partir de la 2da vez entra desde afuera)
  let esPrimeraVez = true;

  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const isScrollingDown = scrollY >= lastScrollY;

    // A. CUANDO EL USUARIO LLEGA AL TOPE DE LA PÁGINA (scrollY <= 30):
    if (scrollY <= 30) {
      auto.style.transition = 'none';

      if (esPrimeraVez) {
        // La primera vez: en su punto visible original
        auto.style.transform = 'translate3d(0, 0, 0)';
      } else {
        // A partir de la segunda vez: esperando afuera de la pantalla (arriba a la derecha)
        auto.style.transform = `translate3d(${CONFIG_AUTO.fueraPantallaX}px, ${CONFIG_AUTO.fueraPantallaY}px, 0)`;
      }

      auto.style.opacity = '1';
      hasExited = false;
      maxProgressReached = 0;
      lastScrollY = scrollY;
      return;
    }

    // B. CUANDO EL USUARIO SCROLLEA HACIA ABAJO:
    if (isScrollingDown) {
      auto.style.transition = 'none';
      auto.style.opacity = '1';

      const currentProgress = Math.min(Math.max(scrollY / CONFIG_AUTO.rangoScroll, 0), 1);

      if (currentProgress > maxProgressReached) {
        maxProgressReached = currentProgress;
      }

      const totalX = typeof CONFIG_AUTO.distanciaX === 'function'
        ? CONFIG_AUTO.distanciaX()
        : CONFIG_AUTO.distanciaX;

      // Definir punto de partida según si es la 1ra vez o las siguientes
      const startX = esPrimeraVez ? 0 : CONFIG_AUTO.fueraPantallaX;
      const startY = esPrimeraVez ? 0 : CONFIG_AUTO.fueraPantallaY;

      const endX = -totalX;
      const endY = CONFIG_AUTO.distanciaY;

      // Interpolación lineal entre el punto de inicio y el de salida
      const moveX = startX + maxProgressReached * (endX - startX);
      const moveY = startY + maxProgressReached * (endY - startY);

      auto.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;

      // Si el auto ya cruzó y salió por la izquierda:
      if (maxProgressReached >= 1) {
        hasExited = true;
        esPrimeraVez = false; // Ya completó el 1er viaje; los próximos vendrán desde afuera
        auto.style.opacity = '0';
      }
    }
    // C. CUANDO EL USUARIO SCROLLEA HACIA ARRIBA:
    else {
      // Mientras se sube la página, el auto se mantiene invisible/oculto
      // para que NUNCA se vea volver marcha atrás en reversa
      if (hasExited || maxProgressReached > 0) {
        auto.style.opacity = '0';
      }
    }

    lastScrollY = scrollY;
  }

  // RequestAnimationFrame para sincronización fluida a 60/120 fps
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', onScroll, { passive: true });

  // Inicializar en la posición de partida
  onScroll();

  // =============================================================================
  // INTERACCIÓN DE LOS BOTONES DE EMERGENCIA (Basados en Botones.png)
  // =============================================================================
  const botonesEmergencia = document.querySelectorAll('.btn-emergencia');

  // Sonido sintético de click mecánico físico (Web Audio API)
  function playClickSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      // Silencioso si el navegador aún no permite audio sin gesto previo
    }
  }

  botonesEmergencia.forEach((btn) => {
    btn.addEventListener('click', () => {
      playClickSound();

      // Efecto momentáneo de pulsación física hacia abajo
      btn.classList.add('is-pressed');
      setTimeout(() => {
        btn.classList.remove('is-pressed');
      }, 160);

      const label = btn.parentElement?.querySelector('.btn-emergencia-label')?.textContent?.trim() || btn.id;
      console.log(`[Botón de emergencia activado]: ${label}`);
    });
  });

  // =============================================================================
  // MODAL QUIZ — "¡Descubrí que robot sos!" (fondoQuiz.svg)
  // =============================================================================
  const modalQuiz = document.getElementById('modal-quiz');
  const btnCerrarQuiz = document.getElementById('btn-cerrar-quiz');
  const btnDescubriRobot = document.getElementById('btn-descubri-robot');
  const quizContent = document.getElementById('quiz-content');

  // Banco de preguntas secuenciales del Quiz
  const QUIZ_PREGUNTAS = [
    {
      id: 1,
      pregunta: "En tu grupo de amigos, ¿cuál es tu cualidad más destacada?",
      opciones: [
        { key: "A", texto: "A) Eficiencia" },
        { key: "B", texto: "B) Hospitalidad" },
        { key: "C", texto: "C) Curiosidad" },
        { key: "D", texto: "D) Audacia" },
        { key: "E", texto: "E) Autocontrol" },
        { key: "F", texto: "F) Empatía" }
      ]
    },
    {
      id: 2,
      pregunta: "¿Qué hacés cuando un proyecto en el que trabajás se complica?",
      opciones: [
        { key: "A", texto: "A) Sistematizo" },
        { key: "B", texto: "B) Agilizo" },
        { key: "C", texto: "C) Cuestiono" },
        { key: "D", texto: "D) Mapeo" },
        { key: "E", texto: "E) Contengo" },
        { key: "F", texto: "F) Evaluo" }
      ]
    },
    {
      id: 3,
      pregunta: "Elegí el escenario donde te sentirías más cómodo pasando una tarde",
      opciones: [
        { key: "A", texto: "A) Taller" },
        { key: "B", texto: "B) Sillón" },
        { key: "C", texto: "C) Biblioteca" },
        { key: "D", texto: "D) Naturaleza" },
        { key: "E", texto: "E) En lugares de confianza" },
        { key: "F", texto: "F) Lugar tranquilo" }
      ]
    },
    {
      id: 4,
      pregunta: "¿Qué le molesta más a tu sistema cuando algo sale mal?",
      opciones: [
        { key: "A", texto: "A) Desorden" },
        { key: "B", texto: "B) Incomodidad" },
        { key: "C", texto: "C) Monotonía" },
        { key: "D", texto: "D) Estancamiento" },
        { key: "E", texto: "E) Vulnerabilidad" },
        { key: "F", texto: "F) Deterioro" }
      ]
    },
    {
      id: 5,
      pregunta: "Si tuvieras que elegir una sola herramienta para llevar siempre con vos, ¿cuál sería?",
      opciones: [
        { key: "A", texto: "A) Destornillador" },
        { key: "B", texto: "B) Pañuelitos" },
        { key: "C", texto: "C) Cuaderno" },
        { key: "D", texto: "D) Brújula" },
        { key: "E", texto: "E) Objeto de defensa personal" },
        { key: "F", texto: "F) Alcohol desinfectante" }
      ]
    },
    {
      id: 6,
      pregunta: "¿Cuál es tu filosofía principal frente a las tareas del día a día?",
      opciones: [
        { key: "A", texto: "A) Mejorar" },
        { key: "B", texto: "B) Seguir como siempre" },
        { key: "C", texto: "C) Descubrir" },
        { key: "D", texto: "D) Adaptación" },
        { key: "E", texto: "E) Protección" },
        { key: "F", texto: "F) Reparación" }
      ]
    }
  ];

  // Configuración de los resultados del Quiz
  const QUIZ_RESULTADOS = {
    A: {
      titulo: "Robot Industrial",
      descripcion: "Sos la definición de ritmo y precisión. No te asustan los procesos largos ni repetitivos porque tenés una capacidad única para optimizarlos y volverlos perfectos. Reconfigurable y altamente productivo.",
      imagen: "img/imgRobotsQuiz/robotIndustrial.svg"
    },
    B: {
      titulo: "Robot Doméstico",
      descripcion: "Sos quien mantiene la armonía cotidiana. Tu enfoque está en solucionar lo diario de forma silenciosa para que el entorno funcione sin sobresaltos (como un Roomba). Sos constante y sumamente práctico.",
      imagen: "img/imgRobotsQuiz/robotDomestico.svg"
    },
    C: {
      titulo: "Robot de Investigación",
      descripcion: "Sos una mente analítica e impredecible. Te mueven las preguntas más que las respuestas y necesitás ensayar ideas raras en tu cabeza o laboratorio antes de dar un veredicto.",
      imagen: "img/imgRobotsQuiz/robotInvestigacion.svg"
    },
    D: {
      titulo: "Robot de Exploración",
      descripcion: "No te atraen los caminos marcados. Ya sea por aire, tierra o profundidades, tenés el impulso de averiguar qué hay más allá del mapa y adaptarte a terrenos inestables.",
      imagen: "img/imgRobotsQuiz/robotExploracion.svg"
    },
    E: {
      titulo: "Robot Militar",
      descripcion: "Sos el pilar en momentos de crisis. Tenés mente fría para actuar bajo presión, desactivar problemas complejos y proteger a los tuyos en situaciones donde otros dudarían.",
      imagen: "img/imgRobotsQuiz/robotMilitar.svg"
    },
    F: {
      titulo: "Robot Médico",
      descripcion: "Combinás paciencia, técnica fina y una vocación natural por reparar lo que está roto. Destacás por tu delicadeza para intervenir justo donde se necesita con exactitud milimétrica.",
      imagen: "img/imgRobotsQuiz/robotMedico.svg"
    }
  };

  let preguntaActualIndex = 0;
  const respuestasUsuario = [];

  function renderPregunta(index) {
    if (!quizContent || !QUIZ_PREGUNTAS[index]) return;
    const p = QUIZ_PREGUNTAS[index];

    quizContent.classList.remove('is-resultado');
    quizContent.innerHTML = `
      <p class="quiz-pregunta font-gantari">${p.pregunta}</p>
      <div class="quiz-opciones">
        ${p.opciones.map(opt => `
          <button class="quiz-opcion font-gantari" data-respuesta="${opt.key}">
            ${opt.texto}
          </button>
        `).join('')}
      </div>
    `;

    // Asignar listeners a los botones de opciones generados
    const botones = quizContent.querySelectorAll('.quiz-opcion');
    botones.forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        const seleccion = btn.getAttribute('data-respuesta');
        const textoSeleccion = btn.textContent.trim();
        respuestasUsuario[index] = { paso: index + 1, respuesta: seleccion, texto: textoSeleccion };
        console.log(`[Quiz Paso ${index + 1} respondido]:`, seleccion, `("${textoSeleccion}")`);

        avanzarSiguientePregunta();
      });
    });
  }

  function mostrarResultadoQuiz() {
    // Contabilizar votos de cada opción (A, B, C, D, E, F)
    const conteo = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    respuestasUsuario.forEach((r) => {
      if (r && r.respuesta && conteo[r.respuesta] !== undefined) {
        conteo[r.respuesta]++;
      }
    });

    console.log('[Quiz Votos Finales]:', conteo);

    // Encontrar la opción ganadora (la que tiene más votos)
    let ganador = 'A';
    let maxVotos = -1;
    for (const [letra, votos] of Object.entries(conteo)) {
      if (votos > maxVotos) {
        maxVotos = votos;
        ganador = letra;
      }
    }

    if (!quizContent) return;

    quizContent.classList.add('is-transitioning');
    setTimeout(() => {
      quizContent.classList.add('is-resultado');

      if (QUIZ_RESULTADOS[ganador]) {
        const res = QUIZ_RESULTADOS[ganador];
        quizContent.innerHTML = `
          <div class="quiz-resultado">
            <h2 class="quiz-resultado-titulo font-gantari">${res.titulo}</h2>
            <p class="quiz-resultado-desc font-gantari">${res.descripcion}</p>
            <div class="quiz-resultado-img-wrap">
              <img src="${res.imagen}" alt="${res.titulo}" class="quiz-resultado-img" />
            </div>
          </div>
        `;
      } else {
        // En caso de que el usuario haya seleccionado en su mayoría otra opción aún pendiente
        quizContent.innerHTML = `
          <div class="quiz-resultado">
            <h2 class="quiz-resultado-titulo font-gantari" style="text-decoration: none;">Próximo Resultado</h2>
            <p class="quiz-resultado-desc font-gantari">
              Seleccionaste mayormente una opción cuyo perfil está siendo calibrado. Probá seleccionando mayormente <strong>A</strong>, <strong>B</strong>, <strong>C</strong>, <strong>D</strong> o <strong>E</strong>.
            </p>
            <button class="quiz-opcion font-gantari" id="btn-reintentar-quiz" style="max-width: 280px; margin: 16px auto;">
              Volver a intentar
            </button>
          </div>
        `;
        const btnReintentar = document.getElementById('btn-reintentar-quiz');
        if (btnReintentar) {
          btnReintentar.addEventListener('click', () => {
            playClickSound();
            resetQuiz();
          });
        }
      }

      quizContent.classList.remove('is-transitioning');
    }, 180);
  }

  function avanzarSiguientePregunta() {
    if (preguntaActualIndex + 1 < QUIZ_PREGUNTAS.length) {
      if (quizContent) {
        quizContent.classList.add('is-transitioning');
        setTimeout(() => {
          preguntaActualIndex++;
          renderPregunta(preguntaActualIndex);
          quizContent.classList.remove('is-transitioning');
        }, 180);
      } else {
        preguntaActualIndex++;
        renderPregunta(preguntaActualIndex);
      }
    } else {
      mostrarResultadoQuiz();
    }
  }

  function resetQuiz() {
    preguntaActualIndex = 0;
    respuestasUsuario.length = 0;
    if (quizContent) {
      quizContent.classList.remove('is-resultado');
    }
    renderPregunta(0);
  }

  function openQuizModal() {
    if (!modalQuiz) return;
    resetQuiz();
    modalQuiz.classList.add('is-open');
    modalQuiz.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeQuizModal() {
    if (!modalQuiz) return;
    modalQuiz.classList.remove('is-open');
    modalQuiz.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnDescubriRobot) {
    btnDescubriRobot.addEventListener('click', () => {
      playClickSound();
      console.log('[Acción]: ¡Descubrí que robot sos!');
      setTimeout(openQuizModal, 100);
    });
  }

  if (btnCerrarQuiz) {
    btnCerrarQuiz.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeQuizModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalQuiz) {
    modalQuiz.addEventListener('click', (e) => {
      if (e.target === modalQuiz) {
        closeQuizModal();
      }
    });
  }

  // Cerrar con la tecla Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalesAbiertos = document.querySelectorAll('.modal-quiz-overlay.is-open');
      if (modalesAbiertos.length > 0) {
        modalesAbiertos.forEach((m) => {
          m.classList.remove('is-open');
          m.setAttribute('aria-hidden', 'true');
        });
        document.body.style.overflow = '';
      }
    }
  });

  // =============================================================================
  // MODALES INTRO — "¿Qué es una IA?" y "¿Qué funciones puede cumplir?"
  // =============================================================================
  const introModales = [
    {
      btnId: 'btn-que-es-ia',
      modalId: 'modal-que-es-ia',
      cerrarBtnId: 'btn-cerrar-que-es-ia'
    },
    {
      btnId: 'btn-funciones',
      modalId: 'modal-funciones',
      cerrarBtnId: 'btn-cerrar-funciones'
    }
  ];

  introModales.forEach(({ btnId, modalId, cerrarBtnId }) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const btnCerrar = document.getElementById(cerrarBtnId);

    function openIntroModal() {
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeIntroModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (btn) {
      btn.addEventListener('click', () => {
        playClickSound();
        setTimeout(openIntroModal, 80);
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeIntroModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeIntroModal();
      });
    }
  });

  // =============================================================================
  // MODAL NÚCLEO 2 — "¿Qué es?" (¿queEsUnRobot¿.png)
  // =============================================================================
  const modalQueEs = document.getElementById('modal-que-es');
  const btnCerrarQueEs = document.getElementById('btn-cerrar-que-es');
  const btnQueEs = document.getElementById('btn-que-es');

  function openQueEsModal() {
    if (!modalQueEs) return;
    modalQueEs.classList.add('is-open');
    modalQueEs.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeQueEsModal() {
    if (!modalQueEs) return;
    modalQueEs.classList.remove('is-open');
    modalQueEs.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnQueEs) {
    btnQueEs.addEventListener('click', () => {
      setTimeout(openQueEsModal, 120);
    });

    // Permitir también abrirlo haciendo clic sobre la etiqueta de texto del botón
    const labelQueEs = btnQueEs.parentElement?.querySelector('.btn-emergencia-label');
    if (labelQueEs) {
      labelQueEs.style.cursor = 'pointer';
      labelQueEs.addEventListener('click', () => {
        btnQueEs.click();
      });
    }
  }

  if (btnCerrarQueEs) {
    btnCerrarQueEs.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeQueEsModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalQueEs) {
    modalQueEs.addEventListener('click', (e) => {
      if (e.target === modalQueEs) {
        closeQueEsModal();
      }
    });
  }

  // =============================================================================
  // MODAL NÚCLEO 2 — "¿Qué tipos hay?" (¿queTiposHay¿1.svg)
  // =============================================================================
  const modalQueTiposHay = document.getElementById('modal-que-tipos-hay');
  const btnCerrarQueTiposHay = document.getElementById('btn-cerrar-que-tipos-hay');
  const btnQueTiposHay = document.getElementById('btn-que-tipos-hay');

  function openQueTiposHayModal() {
    if (!modalQueTiposHay) return;
    modalQueTiposHay.classList.add('is-open');
    modalQueTiposHay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeQueTiposHayModal() {
    if (!modalQueTiposHay) return;
    modalQueTiposHay.classList.remove('is-open');
    modalQueTiposHay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnQueTiposHay) {
    btnQueTiposHay.addEventListener('click', () => {
      setTimeout(openQueTiposHayModal, 120);
    });

    // Permitir también abrirlo haciendo clic sobre la etiqueta de texto del botón
    const labelQueTiposHay = btnQueTiposHay.parentElement?.querySelector('.btn-emergencia-label');
    if (labelQueTiposHay) {
      labelQueTiposHay.style.cursor = 'pointer';
      labelQueTiposHay.addEventListener('click', () => {
        btnQueTiposHay.click();
      });
    }
  }

  if (btnCerrarQueTiposHay) {
    btnCerrarQueTiposHay.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeQueTiposHayModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalQueTiposHay) {
    modalQueTiposHay.addEventListener('click', (e) => {
      if (e.target === modalQueTiposHay) {
        closeQueTiposHayModal();
      }
    });
  }

  // =============================================================================
  // MODAL NÚCLEO 2 — "Robots + IA" (robotMasIA1.svg, tercer botón)
  // =============================================================================
  const modalRobotsIa = document.getElementById('modal-robots-ia');
  const btnCerrarRobotsIa = document.getElementById('btn-cerrar-robots-ia');
  const btnRobotsIa = document.getElementById('btn-robots-ia');

  function openRobotsIaModal() {
    if (!modalRobotsIa) return;
    modalRobotsIa.classList.add('is-open');
    modalRobotsIa.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeRobotsIaModal(keepBodyLocked = false) {
    if (!modalRobotsIa) return;
    modalRobotsIa.classList.remove('is-open');
    modalRobotsIa.setAttribute('aria-hidden', 'true');
    if (!keepBodyLocked) {
      document.body.style.overflow = '';
    }
  }

  if (btnRobotsIa) {
    btnRobotsIa.addEventListener('click', () => {
      setTimeout(openRobotsIaModal, 120);
    });

    // Permitir también abrirlo haciendo clic sobre la etiqueta de texto del botón
    const labelRobotsIa = btnRobotsIa.parentElement?.querySelector('.btn-emergencia-label');
    if (labelRobotsIa) {
      labelRobotsIa.style.cursor = 'pointer';
      labelRobotsIa.addEventListener('click', () => {
        btnRobotsIa.click();
      });
    }
  }

  if (btnCerrarRobotsIa) {
    btnCerrarRobotsIa.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeRobotsIaModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalRobotsIa) {
    modalRobotsIa.addEventListener('click', (e) => {
      if (e.target === modalRobotsIa) {
        closeRobotsIaModal();
      }
    });
  }

  // =============================================================================
  // SUB-MODALES DE "Robots + IA" (AMECA, Spot, Atlas)
  // =============================================================================
  const modalesRobotsIa = [
    {
      btnId: 'btn-ia-ameca',
      modalId: 'modal-ia-ameca',
      volverBtnId: 'btn-volver-ia-ameca',
      cerrarBtnId: 'btn-cerrar-ia-ameca'
    },
    {
      btnId: 'btn-ia-spot',
      modalId: 'modal-ia-spot',
      volverBtnId: 'btn-volver-ia-spot',
      cerrarBtnId: 'btn-cerrar-ia-spot'
    },
    {
      btnId: 'btn-ia-atlas',
      modalId: 'modal-ia-atlas',
      volverBtnId: 'btn-volver-ia-atlas',
      cerrarBtnId: 'btn-cerrar-ia-atlas'
    }
  ];

  modalesRobotsIa.forEach(({ btnId, modalId, volverBtnId, cerrarBtnId }) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const btnVolver = document.getElementById(volverBtnId);
    const btnCerrar = document.getElementById(cerrarBtnId);

    function openSubIaModal() {
      if (!modal) return;
      closeRobotsIaModal(true);  // oculta el modal padre manteniendo el scroll bloqueado
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeSubIaModal(keepBodyLocked = false) {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (!keepBodyLocked) {
        document.body.style.overflow = '';
      }
    }

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        openSubIaModal();
      });
    }

    if (btnVolver) {
      btnVolver.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubIaModal(true); // mantiene body bloqueado
        openRobotsIaModal();   // vuelve al popup "Robots + IA"
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubIaModal(false);
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeSubIaModal(false);
        }
      });
    }
  });

  // =============================================================================
  // SUB-MODALES DE "¿Qué tipos hay?" (Cronología, Función, Estructura)
  // =============================================================================
  const subModalesTipos = [
    {
      btnId: 'btn-tipos-cronologia',
      modalId: 'modal-tipos-cronologia',
      volverBtnId: 'btn-volver-tipos-cronologia',
      cerrarBtnId: 'btn-cerrar-tipos-cronologia'
    },
    {
      btnId: 'btn-tipos-funcion',
      modalId: 'modal-tipos-funcion',
      volverBtnId: 'btn-volver-tipos-funcion',
      cerrarBtnId: 'btn-cerrar-tipos-funcion'
    },
    {
      btnId: 'btn-tipos-estructura',
      modalId: 'modal-tipos-estructura',
      volverBtnId: 'btn-volver-tipos-estructura',
      cerrarBtnId: 'btn-cerrar-tipos-estructura'
    }
  ];

  subModalesTipos.forEach(({ btnId, modalId, volverBtnId, cerrarBtnId }) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const btnVolver = document.getElementById(volverBtnId);
    const btnCerrar = document.getElementById(cerrarBtnId);

    function openSubModal() {
      if (!modal) return;
      closeQueTiposHayModal();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeSubModal(keepBodyLocked = false) {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (!keepBodyLocked) {
        document.body.style.overflow = '';
      }
    }

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        openSubModal();
      });
    }

    if (btnVolver) {
      btnVolver.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubModal(true); // Se mantiene el overflow bloqueado y volvemos al popup inicial
        openQueTiposHayModal();
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubModal(false);
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeSubModal(false);
        }
      });
    }
  });

  // =============================================================================
  // MODALES DE LAS 8 CATEGORÍAS DE "SEGÚN SU FUNCIÓN"
  // =============================================================================
  const modalTiposFuncion = document.getElementById('modal-tipos-funcion');

  function openTiposFuncionModal() {
    if (!modalTiposFuncion) return;
    modalTiposFuncion.classList.add('is-open');
    modalTiposFuncion.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeTiposFuncionModal() {
    if (!modalTiposFuncion) return;
    modalTiposFuncion.classList.remove('is-open');
    modalTiposFuncion.setAttribute('aria-hidden', 'true');
  }

  const modalesCategoriasFuncion = [
    {
      btnId: 'btn-func-industriales',
      modalId: 'modal-func-industriales',
      volverBtnId: 'btn-volver-func-industriales',
      cerrarBtnId: 'btn-cerrar-func-industriales'
    },
    {
      btnId: 'btn-func-educativos',
      modalId: 'modal-func-educativos',
      volverBtnId: 'btn-volver-func-educativos',
      cerrarBtnId: 'btn-cerrar-func-educativos'
    },
    {
      btnId: 'btn-func-exploracion',
      modalId: 'modal-func-exploracion',
      volverBtnId: 'btn-volver-func-exploracion',
      cerrarBtnId: 'btn-cerrar-func-exploracion'
    },
    {
      btnId: 'btn-func-medicos',
      modalId: 'modal-func-medicos',
      volverBtnId: 'btn-volver-func-medicos',
      cerrarBtnId: 'btn-cerrar-func-medicos'
    },
    {
      btnId: 'btn-func-militares',
      modalId: 'modal-func-militares',
      volverBtnId: 'btn-volver-func-militares',
      cerrarBtnId: 'btn-cerrar-func-militares'
    },
    {
      btnId: 'btn-func-investigacion',
      modalId: 'modal-func-investigacion',
      volverBtnId: 'btn-volver-func-investigacion',
      cerrarBtnId: 'btn-cerrar-func-investigacion'
    },
    {
      btnId: 'btn-func-domesticos',
      modalId: 'modal-func-domesticos',
      volverBtnId: 'btn-volver-func-domesticos',
      cerrarBtnId: 'btn-cerrar-func-domesticos'
    },
    {
      btnId: 'btn-func-servicios',
      modalId: 'modal-func-servicios',
      volverBtnId: 'btn-volver-func-servicios',
      cerrarBtnId: 'btn-cerrar-func-servicios'
    }
  ];

  modalesCategoriasFuncion.forEach(({ btnId, modalId, volverBtnId, cerrarBtnId }) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const btnVolver = document.getElementById(volverBtnId);
    const btnCerrar = document.getElementById(cerrarBtnId);

    function openModalCat() {
      if (!modal) return;
      closeTiposFuncionModal();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModalCat(keepBodyLocked = false) {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (!keepBodyLocked) {
        document.body.style.overflow = '';
      }
    }

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        openModalCat();
      });
    }

    if (btnVolver) {
      btnVolver.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeModalCat(true); // Se mantiene el overflow bloqueado y volvemos a "Según su función"
        openTiposFuncionModal();
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeModalCat(false);
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModalCat(false);
        }
      });
    }
  });

  // Inicializar primera pregunta
  renderPregunta(0);

  // =============================================================================
  // MODAL NÚCLEO 1 — "Tipos de IA" (TiposDeIA.svg)
  // =============================================================================
  const modalTiposIa = document.getElementById('modal-tipos-ia');
  const btnCerrarTiposIa = document.getElementById('btn-cerrar-tipos-ia');
  const btnTiposIa = document.getElementById('btn-tipos-ia');

  function openTiposIaModal() {
    if (!modalTiposIa) return;
    modalTiposIa.classList.add('is-open');
    modalTiposIa.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeTiposIaModal(keepBodyLocked = false) {
    if (!modalTiposIa) return;
    modalTiposIa.classList.remove('is-open');
    modalTiposIa.setAttribute('aria-hidden', 'true');
    if (!keepBodyLocked) {
      document.body.style.overflow = '';
    }
  }

  if (btnTiposIa) {
    btnTiposIa.addEventListener('click', () => {
      playClickSound();
      setTimeout(openTiposIaModal, 120);
    });

    // Permitir también abrirlo haciendo clic sobre la etiqueta de texto del botón
    const labelTiposIa = btnTiposIa.parentElement?.querySelector('.btn-emergencia-label');
    if (labelTiposIa) {
      labelTiposIa.style.cursor = 'pointer';
      labelTiposIa.addEventListener('click', () => {
        btnTiposIa.click();
      });
    }
  }

  if (btnCerrarTiposIa) {
    btnCerrarTiposIa.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeTiposIaModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalTiposIa) {
    modalTiposIa.addEventListener('click', (e) => {
      if (e.target === modalTiposIa) {
        closeTiposIaModal();
      }
    });
  }

  // =============================================================================
  // SUB-MODALES DE "Tipos de IA" (ANI, AGI, ASI)
  // =============================================================================
  const subModalesTiposIa = [
    {
      btnId: 'btn-tipo-ani',
      modalId: 'modal-ani',
      volverBtnId: 'btn-volver-ani',
      cerrarBtnId: 'btn-cerrar-ani'
    },
    {
      btnId: 'btn-tipo-agi',
      modalId: 'modal-agi',
      volverBtnId: 'btn-volver-agi',
      cerrarBtnId: 'btn-cerrar-agi'
    },
    {
      btnId: 'btn-tipo-asi',
      modalId: 'modal-asi',
      volverBtnId: 'btn-volver-asi',
      cerrarBtnId: 'btn-cerrar-asi'
    }
  ];

  subModalesTiposIa.forEach(({ btnId, modalId, volverBtnId, cerrarBtnId }) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const btnVolver = document.getElementById(volverBtnId);
    const btnCerrar = document.getElementById(cerrarBtnId);

    function openSubModal() {
      if (!modal) return;
      closeTiposIaModal(true); // Oculta el modal padre manteniendo el scroll bloqueado
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeSubModal(keepBodyLocked = false) {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (!keepBodyLocked) {
        document.body.style.overflow = '';
      }
    }

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        openSubModal();
      });
    }

    if (btnVolver) {
      btnVolver.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubModal(true); // Mantiene el overflow bloqueado y volvemos al popup inicial
        openTiposIaModal();
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubModal(false);
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeSubModal(false);
        }
      });
    }
  });

  // =============================================================================
  // MODAL NÚCLEO 1 — "IAs Actuales" (IAsActuales.svg)
  // =============================================================================
  const modalIasActuales = document.getElementById('modal-ias-actuales');
  const btnCerrarIasActuales = document.getElementById('btn-cerrar-ias-actuales');
  const btnIasActuales = document.getElementById('btn-ias-actuales');

  function openIasActualesModal() {
    if (!modalIasActuales) return;
    modalIasActuales.classList.add('is-open');
    modalIasActuales.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeIasActualesModal(keepBodyLocked = false) {
    if (!modalIasActuales) return;
    modalIasActuales.classList.remove('is-open');
    modalIasActuales.setAttribute('aria-hidden', 'true');
    if (!keepBodyLocked) {
      document.body.style.overflow = '';
    }
  }

  if (btnIasActuales) {
    btnIasActuales.addEventListener('click', () => {
      playClickSound();
      setTimeout(openIasActualesModal, 120);
    });

    // Permitir también abrirlo haciendo clic sobre la etiqueta de texto del botón
    const labelIasActuales = btnIasActuales.parentElement?.querySelector('.btn-emergencia-label');
    if (labelIasActuales) {
      labelIasActuales.style.cursor = 'pointer';
      labelIasActuales.addEventListener('click', () => {
        btnIasActuales.click();
      });
    }
  }

  if (btnCerrarIasActuales) {
    btnCerrarIasActuales.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeIasActualesModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalIasActuales) {
    modalIasActuales.addEventListener('click', (e) => {
      if (e.target === modalIasActuales) {
        closeIasActualesModal();
      }
    });
  }

  // =============================================================================
  // SUB-MODALES DE "IAs Actuales" (Generativas, Multimodales, Razonamiento, Agentes)
  // =============================================================================
  const subModalesIasActuales = [
    {
      btnId: 'btn-ias-generativas',
      modalId: 'modal-ias-generativas',
      volverBtnId: 'btn-volver-ias-generativas',
      cerrarBtnId: 'btn-cerrar-ias-generativas'
    },
    {
      btnId: 'btn-ias-multimodales',
      modalId: 'modal-ias-multimodales',
      volverBtnId: 'btn-volver-ias-multimodales',
      cerrarBtnId: 'btn-cerrar-ias-multimodales'
    },
    {
      btnId: 'btn-ias-razonamiento',
      modalId: 'modal-ias-razonamiento',
      volverBtnId: 'btn-volver-ias-razonamiento',
      cerrarBtnId: 'btn-cerrar-ias-razonamiento'
    },
    {
      btnId: 'btn-agentes-ia',
      modalId: 'modal-agentes-ia',
      volverBtnId: 'btn-volver-agentes-ia',
      cerrarBtnId: 'btn-cerrar-agentes-ia'
    }
  ];

  subModalesIasActuales.forEach(({ btnId, modalId, volverBtnId, cerrarBtnId }) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const btnVolver = document.getElementById(volverBtnId);
    const btnCerrar = document.getElementById(cerrarBtnId);

    function openSubModal() {
      if (!modal) return;
      closeIasActualesModal(true); // Oculta el modal padre manteniendo el scroll bloqueado
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeSubModal(keepBodyLocked = false) {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (!keepBodyLocked) {
        document.body.style.overflow = '';
      }
    }

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        openSubModal();
      });
    }

    if (btnVolver) {
      btnVolver.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubModal(true); // Mantiene el overflow bloqueado y volvemos al popup inicial
        openIasActualesModal();
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        closeSubModal(false);
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeSubModal(false);
        }
      });
    }
  });

  // =============================================================================
  // MODAL NÚCLEO 1 — "Rango etario de uso" (rangoEtario.svg)
  // =============================================================================
  const modalRangoEtario = document.getElementById('modal-rango-etario');
  const btnCerrarRangoEtario = document.getElementById('btn-cerrar-rango-etario');
  const btnRangoEtario = document.getElementById('btn-rango-etario') || document.getElementById('btn-otra-cosa');

  function openRangoEtarioModal() {
    if (!modalRangoEtario) return;
    modalRangoEtario.classList.add('is-open');
    modalRangoEtario.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeRangoEtarioModal() {
    if (!modalRangoEtario) return;
    modalRangoEtario.classList.remove('is-open');
    modalRangoEtario.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnRangoEtario) {
    btnRangoEtario.addEventListener('click', () => {
      playClickSound();
      setTimeout(openRangoEtarioModal, 120);
    });

    // Permitir también abrirlo haciendo clic sobre la etiqueta de texto del botón
    const labelRangoEtario = btnRangoEtario.parentElement?.querySelector('.btn-emergencia-label');
    if (labelRangoEtario) {
      labelRangoEtario.style.cursor = 'pointer';
      labelRangoEtario.addEventListener('click', () => {
        btnRangoEtario.click();
      });
    }
  }

  if (btnCerrarRangoEtario) {
    btnCerrarRangoEtario.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeRangoEtarioModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalRangoEtario) {
    modalRangoEtario.addEventListener('click', (e) => {
      if (e.target === modalRangoEtario) {
        closeRangoEtarioModal();
      }
    });
  }

  // =============================================================================
  // MODAL POPUP: FUENTES DE INFORMACIÓN (informacion.svg -> fuentes.svg)
  // =============================================================================
  const modalFuentes = document.getElementById('modal-fuentes');
  const btnCerrarFuentes = document.getElementById('btn-cerrar-fuentes');
  const btnInformacion = document.getElementById('btn-informacion');

  function openFuentesModal() {
    if (!modalFuentes) return;
    modalFuentes.classList.add('is-open');
    modalFuentes.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeFuentesModal() {
    if (!modalFuentes) return;
    modalFuentes.classList.remove('is-open');
    modalFuentes.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnInformacion) {
    btnInformacion.addEventListener('click', () => {
      playClickSound();
      setTimeout(openFuentesModal, 120);
    });
  }

  if (btnCerrarFuentes) {
    btnCerrarFuentes.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      closeFuentesModal();
    });
  }

  // Cerrar al hacer clic en el fondo fuera de la tarjeta
  if (modalFuentes) {
    modalFuentes.addEventListener('click', (e) => {
      if (e.target === modalFuentes) {
        closeFuentesModal();
      }
    });
  }

  // =============================================================================
  // INDICADOR DE SCROLL AUTOMÁTICO EN EL INICIO (7 SEGUNDOS SIN MOVIMIENTO)
  // =============================================================================
  const scrollIndicator = document.getElementById('scroll-prompt-indicator');
  const IDLE_TIME = 7000;
  const TOP_THRESHOLD = 30; // Rango de píxeles considerado "justo en el inicio"
  let idleScrollTimeout = null;
  let lastMouseX = null;
  let lastMouseY = null;

  function isAtTop() {
    return (window.scrollY || window.pageYOffset || 0) <= TOP_THRESHOLD;
  }

  function hideScrollIndicator() {
    if (!scrollIndicator) return;
    if (scrollIndicator.classList.contains('is-visible')) {
      scrollIndicator.classList.remove('is-visible');
      scrollIndicator.setAttribute('aria-hidden', 'true');
    }
  }

  function showScrollIndicator() {
    if (!scrollIndicator) return;
    if (isAtTop()) {
      scrollIndicator.classList.add('is-visible');
      scrollIndicator.setAttribute('aria-hidden', 'false');
    }
  }

  function startIdleTimer() {
    clearTimeout(idleScrollTimeout);
    if (!isAtTop()) {
      hideScrollIndicator();
      return;
    }
    idleScrollTimeout = setTimeout(() => {
      if (isAtTop()) {
        showScrollIndicator();
      }
    }, IDLE_TIME);
  }

  function onUserActivity(e) {
    // Si es movimiento del mouse, verificar que haya un movimiento real (> 3px)
    if (e && e.type === 'mousemove') {
      if (lastMouseX === null || lastMouseY === null) {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        return;
      }
      const dist = Math.hypot(e.clientX - lastMouseX, e.clientY - lastMouseY);
      if (dist <= 3) return;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }

    // Ocultar el indicador inmediatamente ante cualquier movimiento o scroll
    hideScrollIndicator();

    // Solo programar el temporizador si estamos justo en el inicio de la infografía
    if (isAtTop()) {
      startIdleTimer();
    } else {
      clearTimeout(idleScrollTimeout);
    }
  }

  if (scrollIndicator) {
    // Si la página inicia en el tope, iniciar el temporizador de 7 segundos
    if (isAtTop()) {
      startIdleTimer();
    }

    // Escuchar actividad continua (movimiento de mouse, scroll, teclado, táctil)
    window.addEventListener('mousemove', onUserActivity, { passive: true });
    window.addEventListener('scroll', onUserActivity, { passive: true });
    window.addEventListener('wheel', onUserActivity, { passive: true });
    window.addEventListener('touchstart', onUserActivity, { passive: true });
    window.addEventListener('touchmove', onUserActivity, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('pointerdown', onUserActivity, { passive: true });
  }
});


