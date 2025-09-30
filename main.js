// Storage
class StorageManager {
  constructor() {
    this.keys = {
      contacts: "contacts",
      conversations: "conversations",
      messages: "messages",
      currentUser: "currentUser",
      activeTab: "activeTab",
      darkMode: "darkMode",
    };
    this.initializeStorage();
  }

  initializeStorage() {
    // Initializing the keys that their value is an object except currentUser
    Object.values(this.keys)
      .slice(0, 3)
      .forEach((key) => {
        if (!this.getItem(key)) this.setItem(key, {});
      });
  }

  // Parsing the arrays from local storage
  getItem(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  // Stringifying the arrays to local storage
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Contact Management
  getContacts() {
    return this.getItem(this.keys.contacts) || {};
  }

  getContact(contactId) {
    return this.getContacts()[contactId] || null;
  }

  addContact(contact) {
    const contacts = this.getContacts();

    contacts[contact.id] = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone || "",
      avatar: contact.avatar || "imgs/avatar.png",
      lastSeen: contact.lastSeen || new Date().toISOString(),
      status: contact.status || "offline",
    };
    this.setItem(this.keys.contacts, contacts);

    return contacts[contact.id];
  }

  // Conversations Management
  getConversations() {
    return this.getItem(this.keys.conversations) || {};
  }

  getConversation(conversationId) {
    return this.getConversations()[conversationId] || null;
  }

  getConversationsWithLastMessage() {
    const conversations = this.getConversations();
    const contacts = this.getContacts();
    const currentUser = this.getCurrentUser();

    return Object.values(conversations)
      .filter((conv) => conv.lastMessage) // Get only the conversations that have messages
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      .map((conv) => {
        const contactId = conv.participants.find(
          (id) => id !== currentUser?.id
        );
        const contact = contacts[contactId];

        return {
          ...conv,
          contactId,
          contactName: contact?.name || contact?.phone,
          contactAvatar: contact?.avatar || "imgs/avatar.png",
          lastMessageText: conv.lastMessage?.content || "No messages yet",
        };
      });
  }

  createConversation(participants, type = "individual") {
    const conversations = this.getConversations();
    const conversationId = `conv_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    conversations[conversationId] = {
      id: conversationId,
      participants,
      type,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      lastMessage: null,
      unreadCount: 0,
    };
    this.setItem(this.keys.conversations, conversations);

    return conversations[conversationId];
  }

  findConversationBetween(userId1, userId2) {
    return Object.values(this.getConversations()).find(
      (conv) =>
        conv.type === "individual" &&
        conv.participants.includes(userId1) &&
        conv.participants.includes(userId2)
    );
  }

  // Chats Managments
  getAllMessages() {
    return this.getItem(this.keys.messages) || {};
  }

  getMessages(conversationId) {
    return this.getAllMessages()[conversationId] || null;
  }

  addMessage(conversationId, message) {
    const messages = this.getAllMessages();
    const messageId = `msg_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const newMessage = {
      id: messageId,
      conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type || "text",
      timestamp: new Date().toISOString(),
      status: message.status || "sent",
      replyTo: message.replyTo || null,
    };

    if (!messages[conversationId]) messages[conversationId] = [];

    messages[conversationId].push(newMessage);

    this.setItem(this.keys.messages, messages);
    this.updateConversationLastActivity(conversationId, newMessage);

    return newMessage;
  }

  updateConversationLastActivity(conversationId, lastMessage) {
    const conversations = this.getConversations();
    const conversation = conversations[conversationId];

    if (conversation) {
      conversation.lastActivity = new Date().toISOString();
      conversation.lastMessage = {
        content: lastMessage.content,
        timestamp: lastMessage.timestamp,
        senderId: lastMessage.senderId,
      };
      this.setItem(this.keys.conversations, conversations);
    }
  }

  // Current User Management
  getCurrentUser() {
    return this.getItem(this.keys.currentUser) || null;
  }

  setCurrentUser(user) {
    this.setItem(this.keys.currentUser, user);
  }

  // Tab Management
  getActiveTab() {
    return localStorage.getItem(this.keys.activeTab) || "chat-icon";
  }

  setActiveTab(tabId) {
    localStorage.setItem(this.keys.activeTab, tabId);
  }

  // Dark mode management
  getDarkMode() {
    return localStorage.getItem(this.keys.darkMode) === "true";
  }

  setDarkMode(enabled) {
    localStorage.setItem(this.keys.darkMode, enabled.toString());
    document.documentElement.classList.toggle("dark", enabled); // If enabled is true then it adds dark to classlist else removes it.
  }
}

// Global variables initialization
const chatStorage = new StorageManager();
let currentConversation = null;
let cachedContacts = [];
const sampleMessages = [
  // 🔹 Short
  "Hi",
  "Ok",
  "Yes",
  "No",
  "Cool",
  "Thanks!",
  "Great!",
  "Wow",
  "Sure",
  "Done",

  // 🔹 Medium
  "I’ll meet you at 5.",
  "What are you doing now?",
  "I just had lunch, it was great.",
  "This is a test message for the chat.",
  "Can you send me the file later today?",
  "That was really funny 😂",
  "Let’s go out for coffee tomorrow morning.",
  "Do you know where my phone is?",
  "I’ll be there in about 20 minutes.",
  "The game last night was amazing!",

  // 🔹 Long
  "This is a much longer message meant to test how the chat bubbles expand vertically when a user sends more text. It should wrap around multiple lines and show that the UI can handle tall messages properly.",
  "Here’s another long block of text. The quick brown fox jumps over the lazy dog. Repeating phrases like this can make the message stretch out so that we can see how your chat interface handles wrapping, alignment, and spacing.",
  "Sometimes people write long messages that span several lines because they are telling a story, explaining something in detail, or just typing without stopping. This is one of those tall messages that should really stretch the chat container.",
  "This is an extremely long message written for the purpose of testing. It doesn’t have to be meaningful, but it should contain enough words and sentences so that you can see how the text wraps, how the scroll behaves, and whether the design looks good with very tall chat bubbles. Ideally, this text should go on for a while, maybe a few sentences, so that you can test the maximum size of a bubble in your UI.",
  "This is an extremely long message written for the purpose of testing. It doesn’t have to be meaningful, but it should contain enough words and sentences so that you can see how the text wraps, how the scroll behaves, and whether the design looks good with very tall chat bubbles. Ideally, this text should go on for a while, maybe a few sentences, so that you can test the maximum size of a bubble in your UI.This is an extremely long message written for the purpose of testing. It doesn’t have to be meaningful, but it should contain enough words and sentences so that you can see how the text wraps, how the scroll behaves, and whether the design looks good with very tall chat bubbles. Ideally, this text should go on for a while, maybe a few sentences, so that you can test the maximum size of a bubble in your UI.This is an extremely long message written for the purpose of testing. It doesn’t have to be meaningful, but it should contain enough words and sentences so that you can see how the text wraps, how the scroll behaves, and whether the design looks good with very tall chat bubbles. Ideally, this text should go on for a while, maybe a few sentences, so that you can test the maximum size of a bubble in your UI.This is an extremely long message written for the purpose of testing. It doesn’t have to be meaningful, but it should contain enough words and sentences so that you can see how the text wraps, how the scroll behaves, and whether the design looks good with very tall chat bubbles. Ideally, this text should go on for a while, maybe a few sentences, so that you can test the maximum size of a bubble in your UI.gful, but it should contain enough words and sentences so that you can see how the text wraps, how the scroll behaves, and whether the design looks good with very tall chat bubbles. Ideally, this text should go on for a while, maybe a few sentences, so that you can test the maximum size of a bubble in your UI.gful, but it should contain enough words and sentences so that you can see how the text wraps, how the scroll behaves, and whether the design looks good with very tall chat bubbles. Ideally, this text should go on for a while, maybe a few sentences, so that you can test the maximum size of a bubble in your UI.",
];

// DOM elements cache
const elements = {
  // Navigation management
  iconsContainer: document.getElementById("icons-container"),
  profileIconImage: document.getElementById("profile-icon-image"),
  darkModeIcon: document.getElementById("dark-mode-icon"),

  // Sidebars
  // Chats sidebar
  chatsSidebarContainer: document.getElementById("chats-sidebar-container"),
  emptyChatsSidebar: document.getElementById("empty-chats-sidebar"),
  chatsSidebar: document.getElementById("chats-sidebar"),
  conversationsSearchInput: document.getElementById("conversations-search"),
  // Contacts sidebar
  contactsSidebarContainer: document.getElementById(
    "contacts-sidebar-container"
  ),
  emptyContactsSidebar: document.getElementById("empty-contacts-sidebar"),
  contactsSidebar: document.getElementById("contacts-sidebar"),
  contactsSearchInput: document.getElementById("contacts-search"),

  // Main section management
  emptyChatContainer: document.getElementById("main-empty-chat"),
  mainChatContainer: document.getElementById("main-chat-container"),
  headerContactAvatar: document.getElementById("contact-avatar"),
  headerContactName: document.getElementById("contact-name"),
  chatContentContainer: document.getElementById("chat-content"),
  botChatContainer: document.getElementById("bot-chat-container"),
  botChatContentContainer: document.getElementById("bot-chat-content"),

  // Message input
  messageInput: document.getElementById("message-input"),
  botMessageInput: document.getElementById("bot-message-input"),
  sendButton: document.getElementById("send-button"),
  botSendButton: document.getElementById("bot-send-button"),
};

// Initialization functions
function initializeApp() {
  // Set current user if he doesn't exist
  if (!chatStorage.getCurrentUser()) {
    chatStorage.setCurrentUser({
      id: "current_user_123",
      name: "You",
      avatar: "imgs/avatar.png",
    });
  }

  // Set user profile image
  elements.profileIconImage.src = chatStorage.getCurrentUser().avatar;

  // Initialize dark mode
  const isDarkMode = chatStorage.getDarkMode();
  chatStorage.setDarkMode(isDarkMode);
  if(isDarkMode)
    elements.darkModeIcon.innerHTML = `<i class="fa-solid fa-sun"></i>`

  // Load contacts from storage
  cachedContacts = Object.values(chatStorage.getContacts());

  // Load contacts and check if there is any new contact
  fetchContacts();
}

function initializeEventListeners() {
  // Navigation events
  elements.iconsContainer.addEventListener("click", handleNavigationClick);

  elements.darkModeIcon.addEventListener("click", handleDarkModeClick);

  // Search events
  elements.conversationsSearchInput.addEventListener(
    "input",
    debounce(handleConversationsSearch, 300)
  );
  elements.contactsSearchInput.addEventListener(
    "input",
    debounce(handleContactsSearch, 300)
  );

  // Sidebar events
  elements.chatsSidebar.addEventListener("click", handleChatsSidebarClick);
  elements.contactsSidebar.addEventListener(
    "click",
    handleContactsSidebarClick
  );

  // Message events
  elements.sendButton.addEventListener("click", sendMessage);
  elements.messageInput.addEventListener("keypress", handleMessageKeyPress);
  elements.botSendButton.addEventListener("click", sendBotMessage);
  elements.botMessageInput.addEventListener(
    "keypress",
    handleBotMessageKeyPress
  );

  // Simulated message events
  elements.mainChatContainer.addEventListener(
    "keydown",
    handleSimulatedMessage
  );
  elements.botChatContainer.addEventListener("keydown", handleSimulatedMessage);
}

// Event handlers
function handleNavigationClick(e) {
  const target = e.target.closest("li"); // Find nearest <li>
  if (!target) return;

  setActiveIcon(target);
  displaySection(target.id);
}

function handleDarkModeClick() {
  const currentDarkMode = chatStorage.getDarkMode();
  
  // Switch between moon and sun icon
  if(currentDarkMode)
    elements.darkModeIcon.innerHTML = `<i class="fa-solid fa-moon"></i>`
  else
    elements.darkModeIcon.innerHTML = `<i class="fa-solid fa-sun"></i>`

  // Toggle the dark mode
  chatStorage.setDarkMode(!currentDarkMode);
}

function handleConversationsSearch(e) {
  const value = e.target.value.toLowerCase();
  const conversations = chatStorage.getConversationsWithLastMessage();

  if (value) {
    const filteredConversations = conversations.filter((conversation) => {
      if (conversation.contactName)
        return conversation.contactName.toLowerCase().includes(value);
    });
    displayConversations(filteredConversations);
  } else displayConversations(conversations);
}

function handleChatsSidebarClick(e) {
  // Find the chat card container
  const chatDiv = e.target.closest(".chat-card");
  if (!chatDiv) return; // Clicked outside of a chat card

  openChat(chatDiv.id);
  setActiveConversation(chatDiv);
}

function handleContactsSearch(e) {
  const value = e.target.value.toLowerCase();
  if (value) {
    const filteredContacts = cachedContacts.filter((contact) =>
      contact.name.toLowerCase().includes(value)
    );
    displayContacts(filteredContacts);
  } else displayContacts(cachedContacts);
}

function handleContactsSidebarClick(e) {
  // Find the contact card container
  const contactDiv = e.target.closest(".contact-card");
  if (!contactDiv) return; // Clicked outside of a contact card

  const contactId = contactDiv.id;

  switchToChatTab();
  openChat(contactId);
  clearActiveElements();

  const chatCard = elements.chatsSidebar.querySelector(`[id="${contactId}"]`);
  if (chatCard) setActiveConversation(chatCard);
}

function handleMessageKeyPress(e) {
  if (e.key === "Enter") sendMessage();
}

function handleBotMessageKeyPress(e) {
  if (e.key === "Enter") sendBotMessage();
}

function handleSimulatedMessage(e) {
  if (e.ctrlKey && e.key.toLowerCase() === "m") simulateMessage();
}

// UI functions
function setActiveIcon(target) {
  // We don't want the icon of dark-mode to be active
  if (target.id == "dark-mode-icon") return;

  // Remove active class from the icon that has it
  elements.iconsContainer.querySelector(".active")?.classList.remove("active");

  // Add active class to the clicked one
  target.classList.add("active");

  chatStorage.setActiveTab(target.id);
}

function displaySection(id) {
  if (id == "chat-icon") {
    elements.contactsSidebarContainer.classList.add("hidden");
    elements.botChatContainer.classList.add("hidden");
    elements.chatsSidebarContainer.classList.remove("hidden");
    if (!currentConversation)
      elements.emptyChatContainer.classList.remove("hidden");
    const conversations = chatStorage.getConversationsWithLastMessage();
    displayConversations(conversations);
  } else if (id == "contacts-icon") {
    elements.chatsSidebarContainer.classList.add("hidden");
    elements.botChatContainer.classList.add("hidden");
    elements.contactsSidebarContainer.classList.remove("hidden");
    if (!currentConversation)
      elements.emptyChatContainer.classList.remove("hidden");
    displayContacts(cachedContacts);
  } else if (id == "ai-icon") {
    elements.chatsSidebarContainer.classList.add("hidden");
    elements.contactsSidebarContainer.classList.add("hidden");
    elements.emptyChatContainer.classList.add("hidden");
    elements.mainChatContainer.classList.add("hidden");
    elements.botChatContainer.classList.remove("hidden");
    openChatBot();
  }
}

function toggleSection(emptyContainer, filledContainer, items) {
  if (items.length == 0) {
    emptyContainer.classList.remove("hidden");
    filledContainer.classList.add("hidden");
  } else {
    emptyContainer.classList.add("hidden");
    filledContainer.classList.remove("hidden");
  }
}

function clearActiveElements() {
  elements.chatsSidebar.querySelector(".active")?.classList.remove("active");
  elements.contactsSidebar.querySelector(".active")?.classList.remove("active");
}

function displayConversations(conversations) {
  toggleSection(
    elements.emptyChatsSidebar,
    elements.chatsSidebar,
    conversations
  );

  const currentUser = chatStorage.getCurrentUser();

  if (conversations.length > 0) {
    const fragment = document.createDocumentFragment();

    conversations.forEach((conv) => {
      if (conv.contactId === "chatbot") return;

      console.log(conv);

      const time = new Date(conv.lastMessage.timestamp).toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      const div = document.createElement("div");
      div.id = conv.contactId;
      div.className =
        "chat-card flex items-center hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg cursor-pointer w-full";

      div.innerHTML = `
        <img src="${
          conv.contactAvatar
        }" alt="" class="w-12 h-12 object-cover rounded-full mr-3"/>

        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 truncate">
              ${escapeHtml(conv.contactName)}
            </h3>
            <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              ${time}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
            ${
              conv.lastMessage.senderId == currentUser.id
                ? '<i class="fa-solid fa-check mr-1"></i>'
                : ""
            }
            ${escapeHtml(conv.lastMessageText)}
          </p>
        </div>
      `;

      fragment.appendChild(div);
    });

    elements.chatsSidebar.innerHTML = "";
    elements.chatsSidebar.appendChild(fragment);

    // Makes sure that the active conversation has the active class
    if (currentConversation) {
      const currentConv = chatStorage.getConversation(currentConversation);
      if (currentConv) {
        const currentUser = chatStorage.getCurrentUser();
        const contactId = currentConv.participants.find(
          (id) => id !== currentUser.id
        );
        const activeChat = elements.chatsSidebar.querySelector(
          `[id="${contactId}"]`
        );
        if (activeChat) activeChat.classList.add("active");
      }
    }
  }
}

function setActiveConversation(target) {
  clearActiveElements();
  target.classList.add("active");
}

function displayContacts(contacts) {
  toggleSection(
    elements.emptyContactsSidebar,
    elements.contactsSidebar,
    contacts
  );

  if (contacts.length > 0) {
    const sortedContacts = [...contacts].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const fragment = document.createDocumentFragment();

    sortedContacts.forEach((contact) => {
      const div = document.createElement("div");
      div.id = contact.id;
      div.className =
        "contact-card flex justify-between items-center hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg";

      div.innerHTML = `
        <div class="flex space-x-2 items-center">
          <img src="${
            contact.avatar
          }" class="w-12 h-12 object-cover rounded-full"/>
          <div class="min-w-0">
            <h3 class="font-bold">${escapeHtml(contact.name)}</h3>
            <p class="opacity-60 truncate">Tap to chat</p>
          </div>
        </div>
        <i class="fa-solid fa-ellipsis-vertical fa-lg"></i>
      `;

      fragment.appendChild(div);
    });

    elements.contactsSidebar.innerHTML = "";
    elements.contactsSidebar.appendChild(fragment);
  }
}

function displayMessages(conversationId) {
  const messages = chatStorage.getMessages(conversationId);
  const currentUser = chatStorage.getCurrentUser();

  if (!messages || messages.length === 0) {
    elements.chatContentContainer.innerHTML = ``;
    return;
  }

  const fragment = document.createDocumentFragment();

  messages.forEach((message) => {
    const isCurrentUser = message.senderId === currentUser.id;
    const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const div = document.createElement("div");
    div.className = isCurrentUser ? "self-end max-w-xs" : "self-start max-w-xs";
    div.innerHTML = `
        <div class="${
          isCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        } rounded-lg px-3 py-2 shadow-sm">
              <p class="break-words">${escapeHtml(message.content)}</p>
              <div class="relative opacity-90 text-right message-time">
                  ${
                    isCurrentUser
                      ? '<i class="fa-solid fa-check mr-1"></i>'
                      : ""
                  }
                  <span>${time}</span>
              </div>
        </div>
      `;
    fragment.appendChild(div);
  });

  elements.chatContentContainer.innerHTML = "";
  elements.chatContentContainer.appendChild(fragment);

  // Scroll to bottom
  elements.chatContentContainer.scrollTop =
    elements.chatContentContainer.scrollHeight;
}

function displayBotMessages(conversationId) {
  const messages = chatStorage.getMessages(conversationId);
  const currentUser = chatStorage.getCurrentUser();

  if (!messages || messages.length === 0) {
    elements.botChatContentContainer.innerHTML = ``;
    return;
  }

  const fragment = document.createDocumentFragment();

  messages.forEach((message) => {
    const isCurrentUser = message.senderId === currentUser.id;
    const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const div = document.createElement("div");
    div.className = isCurrentUser ? "self-end max-w-xs" : "self-start max-w-xs";
    div.innerHTML = `
        <div class="${
          isCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        } rounded-lg px-3 py-2 shadow-sm">
              <p class="break-words">${escapeHtml(message.content)}</p>
              <div class="relative opacity-90 text-right message-time">
                  ${
                    isCurrentUser
                      ? '<i class="fa-solid fa-check mr-1"></i>'
                      : ""
                  }
                  <span>${time}</span>
              </div>
        </div>
      `;
    fragment.appendChild(div);
  });

  elements.botChatContentContainer.innerHTML = "";
  elements.botChatContentContainer.appendChild(fragment);

  // Scroll to bottom
  elements.botChatContentContainer.scrollTop =
    elements.botChatContentContainer.scrollHeight;
}

// Chat handling functions
function openChat(contactId) {
  const contact = chatStorage.getContact(contactId);
  const currentUser = chatStorage.getCurrentUser();

  if (!contact) return;

  let conv = chatStorage.findConversationBetween(currentUser.id, contactId);

  if (!conv) conv = chatStorage.createConversation([currentUser.id, contactId]);

  elements.emptyChatContainer.classList.add("hidden");
  elements.mainChatContainer.classList.remove("hidden");
  elements.headerContactAvatar.src = contact.avatar;
  elements.headerContactName.textContent = contact.name;
  elements.messageInput.focus();

  currentConversation = conv.id;
  displayMessages(currentConversation);
}

function openChatBot() {
  const currentUser = chatStorage.getCurrentUser();

  let conv = chatStorage.findConversationBetween(currentUser.id, "chatbot");

  if (!conv) conv = chatStorage.createConversation([currentUser.id, "chatbot"]);

  elements.botMessageInput.focus();

  currentConversation = conv.id;
  displayBotMessages(currentConversation);
}

function sendMessage() {
  const content = elements.messageInput.value.trim();
  if (!currentConversation || !content) return;

  const currentUser = chatStorage.getCurrentUser();

  chatStorage.addMessage(currentConversation, {
    senderId: currentUser.id,
    content: content,
    type: "text",
  });

  elements.messageInput.value = "";
  displayMessages(currentConversation);

  switchToChatTab();
}

function sendBotMessage() {
  const content = elements.botMessageInput.value.trim();
  if (!currentConversation || !content) return;

  const currentUser = chatStorage.getCurrentUser();

  chatStorage.addMessage(currentConversation, {
    senderId: currentUser.id,
    content: content,
    type: "text",
  });

  elements.botMessageInput.value = "";
  displayBotMessages(currentConversation);
}

function switchToChatTab() {
  const target = document.getElementById("chat-icon");
  if (target) {
    setActiveIcon(target);
    displaySection("chat-icon");
  }
}

function simulateMessage() {
  if (!currentConversation) return;

  let content = sampleMessages[genRandomInt(24)];

  const currentUser = chatStorage.getCurrentUser();
  const conversation = chatStorage.getConversation(currentConversation);

  const senderId = conversation.participants.find(
    (id) => id !== currentUser.id
  );

  const newMessage = chatStorage.addMessage(currentConversation, {
    senderId,
    content,
    type: "text",
    status: "received",
  });

  if (senderId === "chatbot") displayBotMessages(currentConversation);
  else {
    const conversations = chatStorage.getConversationsWithLastMessage();
    displayMessages(currentConversation);
    displayConversations(conversations);
  }

  return newMessage;
}

// Data functions
async function fetchContacts() {
  try {
    const existingContacts = chatStorage.getContacts();
    cachedContacts = Object.values(existingContacts);

    if (cachedContacts.length > 0) displayContacts(cachedContacts);

    const res = await fetch("contacts.json");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const fetchedContacts = await res.json();

    let hasNewContacts = false;
    fetchedContacts.forEach((contact) => {
      if (!existingContacts[contact.id]) {
        chatStorage.addContact(contact);
        hasNewContacts = true;
      }
    });

    if (hasNewContacts) {
      cachedContacts = Object.values(chatStorage.getContacts());
      displayContacts(cachedContacts);
    }
  } catch (error) {
    console.error("Failed to fetch contacts from JSON:", error);
    // Fallback to contacts already in storage
    const existingContacts = chatStorage.getContacts();
    cachedContacts = Object.values(existingContacts);
    displayContacts(cachedContacts);
  }
}

// For security so no one can execute html code
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Creates a debounced version of a function that delays its execution until after a specified wait time has passed since the last call
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// App initialization
window.addEventListener("load", () => {
  initializeApp();
  initializeEventListeners();

  // Set active tab
  const lastActiveIcon = localStorage.getItem("activeTab") || "chat-icon";
  const target = document.getElementById(lastActiveIcon);
  if (target) {
    setActiveIcon(target);
    displaySection(lastActiveIcon);
  }
});

function genRandomInt(max) {
  return Math.floor(Math.random() * (max + 1));
}
