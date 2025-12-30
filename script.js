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

// CHAT BOT
// A TUA CHAVE DO GEMINI (Cola aqui a chave que começa por AIza...)
// CUIDADO: Não partilhes este código publicamente com a chave
const API_KEY = "AIzaSyAkNIfmhMXF9HCDhm0dL0Fl0FQ7ju3jegE";
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

async function sendMessage() {
  const inputField = document.getElementById("userInput");
  const messageText = inputField.value.trim();

  if (messageText === "") return;

  addMessage(messageText, "user-message");
  inputField.value = "";

  const loadingId = addMessage("A pensar...", "bot-message");

  try {
    const modelName = "gemini-flash-latest"; // Ou gemini-2.0-flash se funcionar na tua conta
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    // Construímos a instrução do sistema com a lista de serviços para ele saber do que falar
    const systemPrompt = `
            Tu és um assistente técnico especializado em automação industrial.
            Os teus serviços são: ${servicos.join(", ")}.
            Se o cliente perguntar sobre um destes serviços, explica brevemente o que é e convida a fazer um orçamento.
            Se perguntarem contato, indica o botão do WhatsApp.
            Responde de forma curta e profissional.
        `;

    const requestBody = {
      contents: [{ parts: [{ text: messageText }] }],
      system_instruction: { parts: [{ text: systemPrompt }] },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    removeMessage(loadingId);

    if (data.error) {
      console.error(data.error);
      if (data.error.message.includes("Quota")) {
        addMessage(
          "⚠️ O sistema está sobrecarregado. Por favor, usa o botão do WhatsApp para falar connosco.",
          "bot-message"
        );
      } else {
        addMessage("Desculpe, ocorreu um erro.", "bot-message");
      }
      return;
    }

    if (data.candidates && data.candidates.length > 0) {
      const botReply = data.candidates[0].content.parts[0].text;
      addMessage(botReply, "bot-message");
    }
  } catch (error) {
    removeMessage(loadingId);
    addMessage("Erro de conexão.", "bot-message");
  }
}

// Funções Auxiliares (Iguais às anteriores)
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
