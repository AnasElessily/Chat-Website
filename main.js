// Storage
class Storage {
  constructor() {
    this.storage_keys = {
      contacts: "contacts",
      conversations: "conversations",
      messages: "messages",
      current_user: "current_user",
    };
    this.initializeStorage();
  }

  initializeStorage() {
    if (!localStorage.getItem(this.storage_keys.contacts))
      localStorage.setItem(this.storage_keys.contacts, JSON.stringify({}));
    if (!localStorage.getItem(this.storage_keys.conversations))
      localStorage.setItem(this.storage_keys.conversations, JSON.stringify({}));
    if (!localStorage.getItem(this.storage_keys.messages))
      localStorage.setItem(this.storage_keys.messages, JSON.stringify({}));
  }

  // Contact Management
  getContacts() {
    return JSON.parse(localStorage.getItem(this.storage_keys.contacts)) || {};
  }

  getContact(contactId) {
    const contacts = this.getContacts();
    return contacts[contactId] || null;
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
    localStorage.setItem(this.storage_keys.contacts, JSON.stringify(contacts));
    return contacts[contact.id];
  }

  // Conversations Management
  getConversations() {
    return (
      JSON.parse(localStorage.getItem(this.storage_keys.conversations)) || {}
    );
  }

  getConversation(conversationId) {
    const conversations = this.getConversations();
    return conversations[conversationId] || null;
  }

  createConversation(participants, type = "individual") {
    const conversations = this.getConversations();
    const conversationId = `conv_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    conversations[conversationId] = {
      id: conversationId,
      participants: participants,
      type: type,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      lastMessage: null,
      unreadCount: 0,
    };
    localStorage.setItem(
      this.storage_keys.conversations,
      JSON.stringify(conversations)
    );
    return conversations[conversationId];
  }

  // Chats Managments
  getAllMessages() {
    return JSON.parse(localStorage.getItem(this.storage_keys.messages)) || {};
  }

  getMessages(conversationId) {
    const messages = this.getAllMessages();
    return messages[conversationId] || null;
  }

  addMessage(conversationId, message) {
    const messages = this.getAllMessages();
    const messageId = `msg_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const newMessage = {
      id: messageId,
      conversationId: conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type || "text",
      timestamp: new Date().toISOString(),
      status: message.status || "sent",
      replyTo: message.replyTo || null,
    };

    if (!messages[conversationId]) messages[conversationId] = [];
    messages[conversationId].push(newMessage);
    localStorage.setItem(this.storage_keys.messages, JSON.stringify(messages));
    this.updateConversationLastActivity(conversationId, newMessage);
    return newMessage;
  }

  updateConversationLastActivity(conversationId, lastMessage) {
    const conversations = this.getConversations();
    const conversation = conversations[conversationId];
    if (conversations) {
      conversation.lastActivity = new Date().toISOString;
      conversation.lastMessage = {
        content: lastMessage.content,
        timestamp: lastMessage.timestamp,
        senderId: lastMessage.senderId,
      };
      localStorage.setItem(
        this.storage_keys.conversations,
        JSON.stringify(conversations)
      );
    }
  }

  // Current User Management
  getCurrentUser() {
    return (
      JSON.parse(localStorage.getItem(this.storage_keys.current_user)) || null
    );
  }

  setCurrentUser(user) {
    localStorage.setItem(this.storage_keys.current_user, JSON.stringify(user));
  }
}

const chatStorage = new Storage();
const contacts = Object.values(chatStorage.getContacts());

if (!chatStorage.getCurrentUser()) {
  chatStorage.setCurrentUser({
    id: "current_user_123",
    name: "You",
    avatar: "imgs/avatar.png",
  });
}

// Get active state
window.addEventListener("load", () => {
  const lastActiveIcon = localStorage.getItem("activeTab") || "chat-icon";
  const target = document.getElementById(lastActiveIcon);
  if (target) {
    setActiveIcon(target);
    displaySection(lastActiveIcon);
  }
  fetchContacts();
});

// Icons section management
const iconsContainer = document.getElementById("icons-container");
const profileIconImage = document.getElementById("profile-icon-image");

profileIconImage.src = chatStorage.getCurrentUser().avatar;

let messageInput = document.getElementById("message-input");
let sendButton = document.getElementById("send-button");

iconsContainer.addEventListener("click", function (e) {
  const target = e.target.closest("li"); // Find nearest <li>
  if (!target) return;

  setActiveIcon(target);
  displaySection(target.id);

  localStorage.setItem("activeTab", target.id);
});

function setActiveIcon(target) {
  // Remove active class from the icon that has it
  iconsContainer.querySelector(".active")?.classList.remove("active");

  // Add active class to the clicked one
  target.classList.add("active");
}

// Sidebar Section Management
// Chats sidebar
const chatsSidebarContainer = document.getElementById(
  "chats-sidebar-container"
);
const emptyChatsSidebar = document.getElementById("empty-chats-sidebar");
const chatsSidebar = document.getElementById("chats-sidebar");

// Contacts sidebar
const contactsSidebarContainer = document.getElementById(
  "contacts-sidebar-container"
);
const emptyContactsSidebar = document.getElementById("empty-contacts-sidebar");
const contactsSidebar = document.getElementById("contacts-sidebar");

const contactsSearchInput = document.getElementById("contacts-search");

contactsSearchInput.addEventListener("input", function () {
  const value = contactsSearchInput.value.toLowerCase();
  if (value) {
    const filteredContacts = contacts.filter((el) =>
      el.name.toLowerCase().includes(value)
    );
    displayContacts(filteredContacts);
  }
});

contactsSidebar.addEventListener("click", function (e) {
  // Find the contact card container
  const contactDiv = e.target.closest(".contact-item");
  if (!contactDiv) return; // Clicked outside of a contact card

  openChat(contactDiv.id);
});

async function fetchContacts() {
  try {
    const res = await fetch('contacts.json')
    const contacts = await res.json()
    const existingContacts = chatStorage.getContacts()

    contacts.forEach(contact => {
      if(!existingContacts[contact.id])
        chatStorage.addContact(contact)
    })

    displayContacts(contacts)

  } catch (error) {
    console.error("Failed to fetch contacts:", error);
  }
}

function displaySection(id) {
  if (id == "chat-icon") {
    contactsSidebarContainer.classList.add("hidden");
    chatsSidebarContainer.classList.remove("hidden");
    toggleSection(
      emptyChatsSidebar,
      chatsSidebar,
      chatStorage.getConversations()
    );
  } else if (id == "contacts-icon") {
    chatsSidebarContainer.classList.add("hidden");
    contactsSidebarContainer.classList.remove("hidden");
    toggleSection(emptyContactsSidebar, contactsSidebar, contacts);
  }
}

function toggleSection(emptyContainer, filledContainer, items) {
  if (Object.keys(items).length == 0) {
    emptyContainer.classList.remove("hidden");
    filledContainer.classList.add("hidden");
  } else {
    emptyContainer.classList.add("hidden");
    filledContainer.classList.remove("hidden");
  }
}

function displayContacts(contacts) {
  contactsSidebar.innerHTML = contacts
    .sort((a, b) => {
      return a.name.localeCompare(b.name);
    })
    .map(
      (contact) => `
  <div id=${contact.id} class="contact-item flex justify-between items-center hover:bg-gray-200 p-2 rounded-lg">
    <div class="flex space-x-2 items-center">
      <img src="${contact.avatar}" class="w-12 h-12 object-cover rounded-full"/>
      <div class="min-w-0">
        <h3 class="font-bold">${contact.name}</h3>
        <p class="opacity-60 truncate">Tap to chat</p>
      </div>
    </div>
    <i class="fa-solid fa-ellipsis-vertical fa-lg"></i>
  </div>
`
    )
    .join("");
}

// Main section management
const mainContainer = document.getElementById("main-section");
const emptyChatContainer = document.getElementById("main-empty-chat");
const mainChatContainer = document.getElementById("main-chat-container");
const headerContactAvatar = document.getElementById("contact-avatar");
const headerContactName = document.getElementById("contact-name");
const chatContentContainer = document.getElementById("chat-content");

function openChat(id) {
  const [contact] = contacts.filter((el) => el.id == id);
  emptyChatContainer.classList.add("hidden");
  mainChatContainer.classList.remove("hidden");
  headerContactAvatar.src = contact.avatar;
  headerContactName.innerHTML = contact.name;
  chatContentContainer.innerHTML = ``;
}

// Message format
/*
<div class="self-end bg-blue-500 text-white rounded-lg px-3 py-2 max-w-xs space-y-2">
            <p
              class="break-words"
            >
              ya3ny masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan masalan 
            </p>
            <div class="relative opacity-90">
              <i class="fa-solid fa-check-double"></i>
              <span>12:35 pm</span>
            </div>
          </div>
*/
