let chats = [
  { 
    id: 0, 
    name: 'Новый разговор', 
    messages: [],
    lastUpdated: new Date(),
    model: 'Prismarin-all' // Добавляем поле модели к чату
  }
];
let currentChatId = 0;
let chatIdCounter = 1;
let currentVersion = 'Prismarin-all';

const logoWrapper = document.getElementById('logoWrapper');
const versionDropdown = document.getElementById('versionDropdown');
const versionSubtitle = document.getElementById('versionSubtitle');

logoWrapper.addEventListener('click', (e) => {
  e.stopPropagation();
  logoWrapper.classList.toggle('active');
});

versionDropdown.querySelectorAll('.version-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const ver = item.getAttribute('data-version');
    
    versionDropdown.querySelectorAll('.version-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    
    currentVersion = ver;
    versionSubtitle.textContent = ver;
    logoWrapper.classList.remove('active');
    
    // Обновляем модель текущего чата
    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat) {
      currentChat.model = ver;
    }
  });
});

const chatListToggle = document.getElementById('chatListToggle');
const chatListPanel = document.getElementById('chatListPanel');
const mainWrapper = document.getElementById('mainWrapper');

chatListToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  chatListPanel.classList.toggle('visible');
  
  // Закрываем выбор версий при открытии меню
  logoWrapper.classList.remove('active');
  
  if (window.innerWidth > 768) {
    mainWrapper.classList.toggle('shifted');
  }
});

const newChatBtn = document.getElementById('newChatBtn');
newChatBtn.addEventListener('click', () => {
  // Закрываем выбор версий при создании нового чата
  logoWrapper.classList.remove('active');
  
  const newChat = {
    id: chatIdCounter++,
    name: 'Новый разговор',
    messages: [],
    lastUpdated: new Date(),
    model: currentVersion // Присваиваем текущую модель
  };
  chats.push(newChat);
  currentChatId = newChat.id;
  
  renderChatList();
  renderMessages();
});

function formatDateTime(date) {
  // Формат: ДД.ММ ЧЧ:ММ
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return ${day}.${month} ${hours}:${minutes};
}

function renderChatList() {
  const chatItems = document.getElementById('chatItems');
  chatItems.innerHTML = '';
  
  // Сортируем чаты по дате обновления (сначала новые)
  const sortedChats = [...chats].sort((a, b) => b.lastUpdated - a.lastUpdated);
  
  sortedChats.forEach(chat => {
    // Создаем элемент чата
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === currentChatId ? ' active' : '');
    item.dataset.chatId = chat.id;
    
    // Название чата
    const chatName = document.createElement('div');
    chatName.className = 'chat-item-name';
    chatName.textContent = chat.name;
    
    // Дата и время
    const chatTime = document.createElement('div');
    chatTime.className = 'chat-item-time';
    chatTime.textContent = formatDateTime(chat.lastUpdated);
    
    // Собираем элемент
    item.appendChild(chatName);
    item.appendChild(chatTime);
    
    item.addEventListener('click', () => {
      currentChatId = chat.id;
      // Обновляем текущую версию на ту, что у чата
      currentVersion = chat.model;
      // Обновляем UI выбора версии
      versionDropdown.querySelectorAll('.version-item').forEach(i => i.classList.remove('selected'));
      const selectedItem = versionDropdown.querySelector([data-version="${chat.model}"]);
if (selectedItem) {
        selectedItem.classList.add('selected');
        versionSubtitle.textContent = selectedItem.textContent;
      }
      
      renderChatList();
      renderMessages();
      
      // Закрываем выбор версий при выборе чата
      logoWrapper.classList.remove('active');
    });
    
    chatItems.appendChild(item);
  });
}

function renderMessages() {
  const chatContainer = document.getElementById('chatContainer');
  const currentChat = chats.find(c => c.id === currentChatId);
  
  chatContainer.innerHTML = '';
  
  if (currentChat.messages.length === 0) {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = 
      <h1>Добро пожаловать в ${currentChat.model === 'gemini' ? 'Gemini' : 'Prismarin'}</h1>
      <p>Выберите модель и начните общение. Задайте любой вопрос для начала работы.</p>
    ;
    chatContainer.appendChild(welcomeDiv);
  } else {
    currentChat.messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = message ${msg.role};
      msgDiv.textContent = msg.content;
      chatContainer.appendChild(msgDiv);
    });
    
    // Прокручиваем в самый низ с задержкой
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }
}

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const message = chatInput.value.trim();
  if (!message) return;
  
  const currentChat = chats.find(c => c.id === currentChatId);
  
  currentChat.messages.push({
    role: 'user',
    content: message
  });
  
  // Обновляем дату последнего сообщения
  currentChat.lastUpdated = new Date();
  
  if (currentChat.messages.length === 1) {
    currentChat.name = message.substring(0, 25) + (message.length > 25 ? '...' : '');
  }
  
  chatInput.value = '';
  chatInput.style.height = 'auto';
  renderChatList();
  renderMessages();
  
  setTimeout(() => {
    // Отправляем сообщение в выбранную модель
    sendMessageToModel(message, currentChat.model).then(response => {
      currentChat.messages.push({
        role: 'assistant',
        content: response
      });
      
      // Обновляем дату последнего сообщения после ответа
      currentChat.lastUpdated = new Date();
      renderChatList();
      renderMessages(); // renderMessages теперь сам скроллит
    });
  }, 600);
});

chatInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// Функция отправки сообщения в модель
async function sendMessageToModel(message, model) {
  if (model === 'gemini') {
    // Используем API Gemini
    try {
      // Замените YOUR_API_KEY на ваш реальный API-ключ Gemini
      const response = await fetch(https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyB4IIheARmUIJz8t1aCjXFtbvqkTWfDFU4, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: message
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(API error: ${response.status});
      }
      
      const data = await response.json();
      // Возвращаем только текст, игнорируя возможную разметку
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не удалось получить ответ от Gemini.';
// Очищаем возможные служебные символы или разметку, если нужно
      return textResponse.replace(/[\*\_~\[\]\(\)]/g, ''); // Простое удаление некоторых Markdown-символов
    } catch (error) {
      console.error('Ошибка при запросе к Gemini:', error);
      return 'Ошибка при запросе к Gemini. Попробуйте снова.';
    }
  } else {
    // Ответы Prismarin
    const responses = [
      'Это тестовый ответ от Prismarin. Функционал работает корректно!',
      Вы используете модель ${model}. Как я могу вам помочь?,
      'Отличный вопрос! Давайте разберём это подробнее.',
      'Я готов помочь вам с этим запросом. Что именно вас интересует?',
      'Понял ваш запрос. Вот что я могу предложить по этому поводу.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Темизация
const settingsBtn = document.getElementById('settingsBtn');
const themePanel = document.getElementById('themePanel');
const lightThemeBtn = document.getElementById('lightThemeBtn');
const darkThemeBtn = document.getElementById('darkThemeBtn');

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  
  // Переключаем видимость панели с плавной анимацией
  if (themePanel.classList.contains('visible')) {
    themePanel.classList.remove('visible');
  } else {
    // Сначала скрываем выбор версий
    logoWrapper.classList.remove('active');
    // Затем показываем панель тем
    themePanel.classList.add('visible');
  }
});

// Light theme button - включает светлую тему
lightThemeBtn.addEventListener('click', () => {
  document.body.classList.add('light-theme');
  document.documentElement.classList.add('light-theme');
  localStorage.setItem('theme', 'light');
  
  // Закрываем панель с плавной анимацией
  themePanel.classList.remove('visible');
});

// Dark theme button - включает темную тему
darkThemeBtn.addEventListener('click', () => {
  document.body.classList.remove('light-theme');
  document.documentElement.classList.remove('light-theme');
  localStorage.setItem('theme', 'dark');
  
  // Закрываем панель с плавной анимацией
  themePanel.classList.remove('visible');
});

// Проверяем сохранённую тему при загрузке
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-theme');
  document.documentElement.classList.add('light-theme');
} else {
  document.body.classList.remove('light-theme');
  document.documentElement.classList.remove('light-theme');
}

// Закрытие всех панелей при клике вне их
document.addEventListener('click', (event) => {
  // Закрытие выбора версий
  if (!logoWrapper.contains(event.target)) {
    logoWrapper.classList.remove('active');
  }
  
  // Закрытие меню чатов
  if (!chatListPanel.contains(event.target) && !chatListToggle.contains(event.target)) {
    chatListPanel.classList.remove('visible');
    if (window.innerWidth > 768) {
      mainWrapper.classList.remove('shifted');
    }
  }

  // Закрытие панели тем
  if (!settingsBtn.contains(event.target) && !themePanel.contains(event.target)) {
    themePanel.classList.remove('visible');
  }
});

// Закрытие панелей при скролле
window.addEventListener('scroll', () => {
  logoWrapper.classList.remove('active');
  themePanel.classList.remove('visible');
});

renderChatList();
renderMessages();
