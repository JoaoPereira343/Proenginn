function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("ativo");
}

// Fechar menu ao clicar em um link
document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("menu").classList.remove("ativo");
  });
});

// Scroll suave
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Animação ao scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

document
  .querySelectorAll(".card-servico, .card-valor, .card-diferencial")
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "all 0.6s ease";
    observer.observe(el);
  });

// =======================
// CHAT BOT (OpenAI)
// =======================
// ⚠️ RECOMENDADO: NÃO colocar API key no front-end (browser).
// Para rodar agora do jeito que você pediu, deixei aqui só como placeholder.
const API_KEY = "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";
const WHATSAPP_NUMBER = "5542991530163"; // Coloca o teu número aqui (com código do país e DDD)

// Lista de Serviços
const servicos = [
  "Montagem de Painéis Elétricos",
  "Programação de CLP's",
  "Desenvolvimento de Supervisórios",
  "Retrofit de Máquinas",
  "Projetos e Instalações",
  "Manutenção e Instrumentação",
  "Malhas de Processo",
  "Correção de Fator de Potência",
  "Consultorias",
];

let optionsShown = false; // Para não repetir os botões toda vez que abre

function toggleChat() {
  const chat = document.getElementById("chatContainer");
  chat.style.display = chat.style.display === "flex" ? "none" : "flex";

  // Mostra as opções automaticamente na primeira vez que abre
  if (chat.style.display === "flex" && !optionsShown) {
    showOptions();
    optionsShown = true;
  }
}

function handleEnter(event) {
  if (event.key === "Enter") sendMessage();
}

// Função para criar e mostrar os botões
function showOptions() {
  const chatMessages = document.getElementById("chatMessages");

  // Cria um container para os botões
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options-container";

  // 1. Criar botões para cada serviço
  servicos.forEach((servico) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = servico;

    // Quando clica, envia a mensagem como se o utilizador tivesse escrito
    btn.onclick = () => {
      const input = document.getElementById("userInput");
      input.value = `Gostaria de saber mais sobre ${servico}`;
      sendMessage();
    };

    optionsDiv.appendChild(btn);
  });

  // 2. Criar botão do WhatsApp (Destaque)
  const whatsBtn = document.createElement("button");
  whatsBtn.className = "option-btn whatsapp";
  whatsBtn.textContent = "📱 Falar com Atendente (WhatsApp)";
  whatsBtn.onclick = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank");
  };
  optionsDiv.appendChild(whatsBtn);

  // Adiciona ao chat
  chatMessages.appendChild(optionsDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Extrai texto do Responses API (robusto)
function extractOpenAIText(data) {
  // Formato típico: data.output = [{type:"message", role:"assistant", content:[{type:"output_text", text:"..."}]}]
  if (!data || !Array.isArray(data.output)) return null;

  const msg = data.output.find((o) => o && o.type === "message" && o.role === "assistant");
  if (!msg || !Array.isArray(msg.content)) return null;

  const textPart = msg.content.find((c) => c && (c.type === "output_text" || c.type === "text"));
  if (!textPart) return null;

  // Algumas variantes podem usar "text" diretamente
  return textPart.text || null;
}

async function sendMessage() {
  const inputField = document.getElementById("userInput");
  const messageText = inputField.value.trim();

  if (messageText === "") return;

  addMessage(messageText, "user-message");
  inputField.value = "";

  const loadingId = addMessage("A pensar...", "bot-message");

  try {
    // Prompt do sistema com a lista de serviços
    const systemPrompt = `
Tu és um assistente técnico especializado em automação industrial.
Os teus serviços são: ${servicos.join(", ")}.
Se o cliente perguntar sobre um destes serviços, explica brevemente o que é e convida a fazer um orçamento.
Se perguntarem contato, indica o botão do WhatsApp.
Responde de forma curta e profissional.
`.trim();

    // Endpoint OpenAI Responses API
    const url = "https://api.openai.com/v1/responses";

    // Contexto estilo chat (system + user)
    const context = [
      { role: "system", content: systemPrompt },
      { role: "user", content: messageText },
    ];

    const requestBody = {
      model: "gpt-4.1-mini",
      input: context,
      max_output_tokens: 220,
      temperature: 0.4,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    removeMessage(loadingId);

    if (!response.ok || data.error) {
      console.error("OpenAI error:", data.error || data);

      const msg =
        (data && data.error && data.error.message) ||
        "Desculpe, ocorreu um erro ao contactar o assistente.";

      // Mensagem mais “comercial” caso falhe
      addMessage(
        `⚠️ Não consegui responder agora. Se preferir, use o botão do WhatsApp para falar connosco.\n\nDetalhe: ${msg}`,
        "bot-message"
      );
      return;
    }

    const botReply = extractOpenAIText(data);
    if (botReply) {
      addMessage(botReply, "bot-message");
    } else {
      // Fallback: se o formato vier diferente
      addMessage("Recebi a resposta, mas não consegui ler o texto retornado.", "bot-message");
      console.warn("Formato inesperado do Responses API:", data);
    }
  } catch (error) {
    removeMessage(loadingId);
    console.error(error);
    addMessage("Erro de conexão.", "bot-message");
  }
}

// Funções Auxiliares
function addMessage(text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);

  if (className === "bot-message" && typeof marked !== "undefined") {
    messageDiv.innerHTML = marked.parse(text);
  } else {
    messageDiv.textContent = text;
  }

  const id = Date.now();
  messageDiv.setAttribute("id", id);
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return id;
}

function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
