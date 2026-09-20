const savedTheme = localStorage.getItem('site_theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', current);
  localStorage.setItem('site_theme', current);
});


// Vanilla interactive To-Do functionality
const todoList = document.getElementById('todoList');
const statsLabel = document.getElementById('statsLabel');
const newTodoInput = document.getElementById('newTodoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const resetBtn = document.getElementById('resetBtn');

function updateStats() {
  const total = todoList.children.length;
  const done = todoList.querySelectorAll('li.done').length;
  statsLabel.textContent = `Completed: ${done} of ${total} items (${total > 0 ? Math.round((done / total) * 100) : 0}%)`;
}

// Toggle items on click
todoList.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;

  const check = li.querySelector('.check');
  const isDone = li.classList.toggle('done');
  if (isDone) {
    check.textContent = '×';
    check.setAttribute('aria-checked', 'true');
  } else {
    check.textContent = '';
    check.setAttribute('aria-checked', 'false');
  }
  updateStats();
  saveTodos();
});

function addTodo() {
  const text = newTodoInput.value.trim();
  if (!text) return;

  const li = document.createElement('li');
  li.setAttribute('data-id', Date.now());
  li.innerHTML = `<span class="check" role="checkbox" aria-checked="false"></span><span class="text">${escapeHtml(text)}</span>`;
  todoList.appendChild(li);

  newTodoInput.value = '';
  updateStats();
  saveTodos();
}

addTodoBtn.addEventListener('click', addTodo);
newTodoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTodo();
  }
});

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function saveTodos() {
  const items = [];
  todoList.querySelectorAll('li').forEach(li => {
    items.push({
      text: li.querySelector('.text').textContent,
      done: li.classList.contains('done')
    });
  });
  localStorage.setItem('learning_todos_html', JSON.stringify(items));
}

function loadSavedTodos() {
  const saved = localStorage.getItem('learning_todos_html');
  if (!saved) {
    updateStats();
    return;
  }
  try {
    const items = JSON.parse(saved);
    if (Array.isArray(items) && items.length > 0) {
      todoList.innerHTML = '';
      items.forEach(item => {
        const li = document.createElement('li');
        if (item.done) li.classList.add('done');
        li.innerHTML = `<span class="check" role="checkbox" aria-checked="${item.done ? 'true' : 'false'}">${item.done ? '×' : ''}</span><span class="text">${escapeHtml(item.text)}</span>`;
        todoList.appendChild(li);
      });
    }
  } catch (e) {
    console.warn('Could not parse stored todos', e);
  }
  updateStats();
}

resetBtn.addEventListener('click', () => {
  localStorage.removeItem('learning_todos_html');
  window.location.reload();
});

loadSavedTodos();