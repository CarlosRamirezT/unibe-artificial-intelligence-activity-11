/***********************************************************************
 * 1. DEFINICIÓN DE NODOS CON GRUPO
 *
 * Cada nodo tiene:
 *  - id: identificador único.
 *  - type: "question" para preguntas o "conclusion" para el diagnóstico.
 *  - text: texto a mostrar.
 *  - group: identifica el grupo (en este caso, "symptoms" o "risk").
 *  - yes / no: id del siguiente nodo según la respuesta.
 *
 * El árbol de inferencia se construye de la siguiente forma:
 *  • Se inician con preguntas sobre los síntomas principales.
 *  • Si se confirma la presencia de síntomas, se pregunta por la exposición
 *    a factores de riesgo para definir la probabilidad de cólera severo.
 ***********************************************************************/
const nodes = {
    // Nodo inicial: síntomas principales
    start: {
      id: "start",
      type: "question",
      text: "¿Presenta diarrea acuosa y profusa (con aspecto de 'agua de arroz')?",
      group: "symptoms",
      yes: "q1",
      no: "c0"
    },
    c0: {
      id: "c0",
      type: "conclusion",
      text: "La ausencia de diarrea acuosa masiva descarta el cólera típico. Considere otras causas de diarrea aguda.",
      group: "symptoms"
    },
    q1: {
      id: "q1",
      type: "question",
      text: "¿Presenta vómitos intensos?",
      group: "symptoms",
      yes: "q2",
      no: "c1"
    },
    c1: {
      id: "c1",
      type: "conclusion",
      text: "La falta de vómitos intensos sugiere que la causa de la diarrea podría ser otra, como gastroenteritis viral o intoxicación alimentaria.",
      group: "symptoms"
    },
    q2: {
      id: "q2",
      type: "question",
      text: "¿Presenta signos de deshidratación severa (sed intensa, ojos hundidos, piel menos elástica)?",
      group: "symptoms",
      yes: "q3",
      no: "c2"
    },
    c2: {
      id: "c2",
      type: "conclusion",
      text: "La ausencia de deshidratación severa indica un cuadro leve. Se recomienda rehidratación oral y seguimiento.",
      group: "symptoms"
    },
    q3: {
      id: "q3",
      type: "question",
      text: "¿Presenta calambres musculares en piernas o abdomen?",
      group: "symptoms",
      yes: "q4",
      no: "c3"
    },
    c3: {
      id: "c3",
      type: "conclusion",
      text: "La ausencia de calambres musculares puede indicar una forma menos grave, aunque se debe monitorear la evolución del paciente.",
      group: "symptoms"
    },
    q4: {
      id: "q4",
      type: "question",
      text: "¿Ha consumido recientemente agua o alimentos en condiciones sanitarias deficientes?",
      group: "risk",
      yes: "c4",
      no: "c5"
    },
    c4: {
      id: "c4",
      type: "conclusion",
      text: "Diagnóstico: Posible cólera severo. Se recomienda rehidratación inmediata, evaluación médica urgente y tratamiento antibiótico.",
      group: "risk"
    },
    c5: {
      id: "c5",
      type: "conclusion",
      text: "Aunque se presentan síntomas compatibles con cólera, la ausencia de exposición a factores de riesgo reduce la probabilidad. Se requiere evaluación médica para descartar otras causas.",
      group: "risk"
    }
  };
  
  /***********************************************************************
   * 2. GESTIÓN DE ESTADO
   ***********************************************************************/
  let currentNodeId = "start";
  // Almacena el camino recorrido: { nodeId, type, text, answer, depth, group }
  const inferencePath = [];
  
  /***********************************************************************
   * 3. FUNCIONES PARA RENDERIZAR EL CHAT Y EL DIAGRAMA
   ***********************************************************************/
  function showNode(nodeId, answer = "start", depth = 0) {
    const node = nodes[nodeId];
  
    // Agrega el nodo al camino de inferencia
    inferencePath.push({
      nodeId: node.id,
      type: node.type,
      text: node.text,
      answer: answer,
      depth: depth,
      group: node.group
    });
  
    updateDiagram();
  
    // Crea el elemento para el mensaje en el chat
    const messageEl = document.createElement("div");
    messageEl.classList.add("message");
    messageEl.style.marginLeft = (depth * 20) + "px";
  
    if (node.type === "question") {
      messageEl.innerHTML = `
        <div class="question-header">Pregunta [${node.id}]</div>
        <div class="question-text">${node.text}</div>
        <div class="answers">
          <label><input type="radio" name="answer-${node.id}" value="yes" /> Sí</label>
          <label><input type="radio" name="answer-${node.id}" value="no" /> No</label>
        </div>
        <button id="btn-${node.id}">Siguiente</button>
      `;
      chatContainer.appendChild(messageEl);
  
      // Listener para el botón "Siguiente"
      const btnNext = document.getElementById(`btn-${node.id}`);
      btnNext.addEventListener("click", () => {
        const selected = document.querySelector(`input[name="answer-${node.id}"]:checked`);
        if (!selected) {
          alert("Por favor, selecciona Sí o No.");
          return;
        }
        const userAnswer = selected.value;
        btnNext.disabled = true;
        const radios = messageEl.querySelectorAll(`input[name="answer-${node.id}"]`);
        radios.forEach(r => r.disabled = true);
  
        // Determinar el siguiente nodo
        const nextId = (userAnswer === "yes") ? node.yes : node.no;
        if (nextId) {
          // Si el grupo del siguiente nodo es distinto, reiniciamos la indentación (depth = 0)
          const nextGroup = nodes[nextId].group;
          const currentGroup = node.group;
          const nextDepth = (nextGroup !== currentGroup) ? 0 : depth + 1;
          goToNextNode(node, userAnswer, nextDepth);
        } else {
          const msg = document.createElement("div");
          msg.innerHTML = "<p>No se encontró el siguiente paso en la red de inferencia.</p>";
          chatContainer.appendChild(msg);
        }
      });
    } else { // Caso de conclusión
      messageEl.classList.add("conclusion");
      messageEl.innerHTML = `
        <div class="question-header">Conclusión [${node.id}]</div>
        <div class="question-text">${node.text}</div>
      `;
      chatContainer.appendChild(messageEl);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  function goToNextNode(node, answer, nextDepth) {
    const nextId = (answer === "yes") ? node.yes : node.no;
    if (nextId) {
      showNode(nextId, answer, nextDepth);
    } else {
      const msg = document.createElement("div");
      msg.innerHTML = "<p>No se encontró el siguiente paso en la red de inferencia.</p>";
      chatContainer.appendChild(msg);
    }
  }
  
  function updateDiagram() {
    diagramContainer.innerHTML = "";
    inferencePath.forEach((step, index) => {
      const stepEl = document.createElement("div");
      stepEl.classList.add("flow-node");
      stepEl.style.marginLeft = (step.depth * 20) + "px";
  
      if (step.answer === "yes") {
        stepEl.style.borderColor = "green";
      } else if (step.answer === "no") {
        stepEl.style.borderColor = "red";
      }
      if (step.type === "question") {
        stepEl.innerHTML = `<h3>Pregunta [${step.nodeId}]</h3><p>${step.text}</p>`;
      } else {
        stepEl.innerHTML = `<h3>Conclusión [${step.nodeId}]</h3><p>${step.text}</p>`;
      }
      diagramContainer.appendChild(stepEl);
  
      if (index < inferencePath.length - 1) {
        const arrowEl = document.createElement("div");
        arrowEl.classList.add("flow-arrow");
        diagramContainer.appendChild(arrowEl);
      }
    });
  }
  
  /***********************************************************************
   * 4. INICIALIZACIÓN
   ***********************************************************************/
  const chatContainer = document.getElementById("chatContainer");
  const diagramContainer = document.getElementById("diagramContainer");
  
  // Inicia el proceso mostrando el nodo inicial (depth = 0)
  showNode(currentNodeId, "start", 0);
  