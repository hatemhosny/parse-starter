import Parse from "./parse";

Parse.initialize("myappid");
Parse.serverURL = `https://${location.hostname}:1337/api`;
// Parse.serverURL = `https://api.${location.hostname}/api`;

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const addBtn = document.querySelector("#add-btn");
const todosContainer = document.querySelector("#todos-container");
const todosCount = document.querySelector("#todos-count");
const loadingIndicator = document.querySelector("#loading-indicator");

const Todo = "Todo";

const showLoading = (loading = true) => {
  if (loading) {
    loadingIndicator.style.display = "block";
    todosCount.style.display = "none";
  } else {
    loadingIndicator.style.display = "none";
    todosCount.style.display = "block";
  }
};

const subscribeToData = async () => {
  const query = new Parse.Query(Todo);
  query.descending("createdAt");
  let results = await query.find();
  updateDOM(results);

  const subscription = await query.subscribe();

  subscription.on("create", (object) => {
    results = [object, ...results];
    updateDOM(results);
  });

  subscription.on("update", (object) => {
    results = results.map((item) => (item.id === object.id ? object : item));
    updateDOM(results);
  });

  subscription.on("delete", (object) => {
    results = results.filter((item) => !(item.id === object.id));
    updateDOM(results);
  });
};

const updateDOM = (data) => {
  todosContainer.innerHTML = data.length === 0 ? emptyListHtml() : "";
  const todos = data.map((object) => ({
    id: object.id,
    text: object.get("text"),
    complete: object.get("complete"),
  }));

  todos.forEach((todo) => {
    const li = createTodoElement(todo);
    const closeButton = li.querySelector("button.close");
    todosContainer.appendChild(li);
    li.addEventListener("click", () => toggleTodo(todo.id));
    closeButton.addEventListener("click", () => deleteTodo(todo.id));
  });

  todosCount.innerHTML = todos.filter((todo) => !todo.complete).length;

  showLoading(false);

  function createTodoElement(todo) {
    const template = document.createElement("template");
    template.innerHTML = `
  <li
    class="list-group-item d-flex justify-content-between ${
      todo.complete ? "bg-light" : "lh-condensed"
    }"
  >
    <div>
      <div class="custom-control custom-checkbox">
        <input
          type="checkbox"
          class="custom-control-input"
          id="${todo.id}"
          ${todo.complete ? "checked" : ""}
          onClick="event.stopPropagation();"
        />
        <label class="custom-control-label" for="${todo.id}">
        ${todo.complete ? "<del>" : ""}
          ${todo.text}
        ${todo.complete ? "</del>" : ""}
        </label>
      </div>
    </div>
    <button 
      type="button" 
      class="close" 
      aria-label="Close" 
      onClick="event.stopPropagation();"
    >
      <span aria-hidden="true">&times;</span>
    </button>
  </li>`.trim();
    return template.content.firstChild;
  }

  function emptyListHtml() {
    return `            
<li class="list-group-item d-flex justify-content-between lh-condensed empty">
  <div>No Todos!</div>
</li>
`;
  }
};

const addTodo = async () => {
  if (todoInput.value === "") return;
  showLoading();
  const obj = new Parse.Object(Todo);
  obj.set("text", todoInput.value);
  obj.set("complete", false);
  await obj.save();
  todoInput.value = "";
  todoInput.focus();
};

const getTodo = async (id) => {
  const query = new Parse.Query(Todo);
  query.equalTo("objectId", id);
  const todo = await query.first();
  return todo;
};

const toggleTodo = async (id) => {
  if (!id) return;
  showLoading();
  const todo = await getTodo(id);
  todo.set("complete", !todo.get("complete"));
  await todo.save();
};

const deleteTodo = async (id) => {
  if (!id) return;
  showLoading();
  const todo = await getTodo(id);
  await todo.destroy();
};

addBtn.addEventListener("click", addTodo);
todoForm.addEventListener("submit", addTodo);
todoInput.focus();
subscribeToData();
