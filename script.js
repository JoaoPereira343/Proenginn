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

// CHAT BOT COM OPENAI
// Coloca aqui a tua chave da OpenAI (começa por sk-...)
// CUIDADO: Não partilhes este código publicamente com a chave
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
let conversationHistory = []; // Histórico da conversa para contexto

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

  // Adiciona a mensagem do usuário ao histórico
  conversationHistory.push({
    role: "user",
    content: messageText
  });

  const loadingId = addMessage("A pensar...", "bot-message");

  try {
    const url = "https://api.openai.com/v1/chat/completions";

    // Instruções do sistema para o assistente
    const systemPrompt = `Tu és um assistente técnico especializado em automação industrial da WRA Planejamento e Montagens Industrial.
Os teus serviços são: ${servicos.join(", ")}.

Regras de comportamento:
- Se o cliente perguntar sobre um destes serviços, explica brevemente o que é (máximo 3-4 linhas) e convida a fazer um orçamento.
- Se perguntarem sobre contato, indica o botão do WhatsApp ou o número ${WHATSAPP_NUMBER}.
- Responde de forma curta, profissional e amigável em português do Brasil.
- Se perguntarem sobre preços, explica que cada projeto é personalizado e convida a entrar em contato para orçamento.
- Mantém as respostas objetivas e técnicas, mas acessíveis.`;

    // Monta o histórico completo da conversa
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];

    const requestBody = {
      model: "gpt-3.5-turbo", // Modelo mais compatível e estável
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    console.log("Resposta da API:", data); // Para debug
    
    removeMessage(loadingId);

    if (data.error) {
      console.error("Erro da API:", data.error);
      
      let errorMessage = "Desculpe, ocorreu um erro. ";
      
      if (data.error.type === "insufficient_quota" || data.error.code === "insufficient_quota") {
        errorMessage = "⚠️ O sistema está temporariamente indisponível. ";
      } else if (data.error.type === "invalid_request_error") {
        errorMessage = "⚠️ Erro na requisição. ";
      } else if (data.error.message && data.error.message.includes("API key")) {
        errorMessage = "⚠️ Erro de autenticação. ";
      }
      
      errorMessage += "Por favor, usa o botão do WhatsApp para falar connosco.";
      addMessage(errorMessage, "bot-message");
      return;
    }

    if (data.choices && data.choices.length > 0) {
      const botReply = data.choices[0].message.content;
      
      // Adiciona a resposta do assistente ao histórico
      conversationHistory.push({
        role: "assistant",
        content: botReply
      });
      
      addMessage(botReply, "bot-message");
      
      // Limita o histórico a 10 mensagens (5 trocas) para não exceder tokens
      if (conversationHistory.length > 10) {
        conversationHistory = conversationHistory.slice(-10);
      }
    } else {
      addMessage(
        "Não consegui gerar uma resposta. Tenta novamente ou usa o WhatsApp.",
        "bot-message"
      );
    }
  } catch (error) {
    console.error("Erro completo:", error);
    removeMessage(loadingId);
    addMessage(
      "Erro de conexão. Verifica a tua internet ou usa o WhatsApp para contacto direto.",
      "bot-message"
    );
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
