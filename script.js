const taskInput = document.getElementById("taskInput");
const reminderInput = document.getElementById("reminderInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const filterButtons = document.querySelectorAll("[data-filter]");
const searchInput = document.getElementById("searchInput");
const stats = document.getElementById("stats");
const emptyState = document.getElementById("emptyState");
const themeToggle = document.getElementById("themeToggle");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let searchQuery = "";

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}
requestNotificationPermission();

function checkReminders() {
  const now = Date.now();
  tasks.forEach(task => {
    if (task.reminder && !task.notified &&
        new Date(task.reminder).getTime() <= now) {
      if (Notification.permission === "granted") {
        new Notification("Reminder", { body: task.text });
      }
      task.notified = true;
      saveTasks();
    }
  });
}
setInterval(checkReminders, 60000);

function renderTasks() {
  taskList.innerHTML = "";

  let filtered = tasks.filter(task => {
    const overdue = task.reminder && new Date(task.reminder) < new Date() && !task.completed;

    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "completed" && task.completed) ||
      (currentFilter === "pending" && !task.completed) ||
      (currentFilter === "overdue" && overdue);

    const matchesSearch = task.text.toLowerCase().includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  emptyState.style.display = filtered.length ? "none" : "block";

  stats.textContent =
    `Total: ${tasks.length} | Completed: ${tasks.filter(t => t.completed).length}`;

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = task.id;

    if (task.completed) li.classList.add("completed");
    if (task.reminder && new Date(task.reminder) < new Date() && !task.completed) {
      li.classList.add("overdue");
    }

    const left = document.createElement("div");
    left.innerHTML = `<strong>${task.text}</strong>`;

    if (task.reminder) {
      const small = document.createElement("small");
      small.textContent = "⏰ " + new Date(task.reminder).toLocaleString();
      left.appendChild(small);
    }

    left.onclick = () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    };

    const right = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      const newText = prompt("Edit task:", task.text);
      if (newText && newText.trim()) {
        task.text = newText.trim();
        task.notified = false;
        saveTasks();
        renderTasks();
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.onclick = () => {
      tasks = tasks.filter(t => t.id != task.id);
      saveTasks();
      renderTasks();
    };

    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(right);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    id: Date.now(),
    text,
    completed: false,
    reminder: reminderInput.value || null,
    notified: false
  });

  taskInput.value = "";
  reminderInput.value = "";
  saveTasks();
  renderTasks();
}

addBtn.onclick = addTask;
taskInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addTask();
});

filterButtons.forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    renderTasks();
  };
});

searchInput.addEventListener("input", e => {
  searchQuery = e.target.value.toLowerCase();
  renderTasks();
});

/* Drag & Drop */
let draggedId = null;

taskList.addEventListener("dragstart", e => {
  draggedId = e.target.closest("li").dataset.id;
});

taskList.addEventListener("dragover", e => e.preventDefault());

taskList.addEventListener("drop", e => {
  e.preventDefault();
  const targetId = e.target.closest("li").dataset.id;

  const draggedIndex = tasks.findIndex(t => t.id == draggedId);
  const targetIndex = tasks.findIndex(t => t.id == targetId);

  const [moved] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, moved);

  saveTasks();
  renderTasks();
});

/* Theme Toggle */
themeToggle.onclick = () => {
  document.body.classList.toggle("light");
};

renderTasks();