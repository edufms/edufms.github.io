
    let lists = JSON.parse(localStorage.getItem('shoppingLists') || '{}');
    let currentListId = null;
    let editingItemId = null;

    function saveLists() {
      localStorage.setItem('shoppingLists', JSON.stringify(lists));
	  loadRecentLists();
    }

    function exportLists() {
      const dataStr = JSON.stringify(lists, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "listas_de_compras.json";
      a.click();
      URL.revokeObjectURL(url);
    }

    function importLists(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedData = JSON.parse(e.target.result);
          if (typeof importedData === "object" && importedData !== null) {
            lists = { ...lists, ...importedData };
            saveLists();
            loadListSelector();
            selectList(currentListId);
            alert("Listas importadas com sucesso!");
          } else {
            alert("Arquivo inválido!");
          }
        } catch (err) {
          alert("Erro ao importar JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    }

    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeToggle();
    }

    function updateThemeToggle() {
      const themeToggle = document.getElementById('themeToggle');
      const currentTheme = document.documentElement.getAttribute('data-theme');
      themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }

	function loadRecentLists() {
		const container = document.getElementById('recentListsContainer');
		
		// Obter listas ordenadas por data de criacao (mais recentes primeiro)
		const sortedLists = Object.entries(lists)
			.sort((a, b) => new Date(b[1].created || 0) - new Date(a[1].created || 0))
			.slice(0, 3); // Apenas as 3 mais recentes

		if (sortedLists.length === 0) {
			container.innerHTML = `
				<div style="text-align: center; color: var(--text-secondary); font-size: 0.9em; padding: 20px;">
					Nenhuma lista criada ainda
				</div>
			`;
			return;
		}

		container.innerHTML = sortedLists.map(([listId, list]) => `
			<div class="recent-item ${currentListId === listId ? 'active' : ''}" 
				 onclick="selectList('${listId}')" title="Clique para abrir esta lista">
				<div style="font-weight: 500; margin-bottom: 2px;">${list.name}</div>
				<div style="font-size: 0.8em; color: var(--text-secondary);">
					${list.items.length} itens ${formatDate(list.created)}
				</div>
			</div>
		`).join('');
	}
	
	function showDeleteConfirm() {
            if (!currentListId || !lists[currentListId]) {
                alert('Nenhuma lista selecionada');
                return;
            }

            document.getElementById('deleteMessage').textContent = 
                `Tem certeza que deseja excluir a lista "${lists[currentListId].name}"? Esta acao nao pode ser desfeita.`;
            document.getElementById('deleteModal').style.display = 'block';
        }

        function closeDeleteModal() {
            document.getElementById('deleteModal').style.display = 'none';
        }

        function confirmDelete() {
            if (currentListId && lists[currentListId]) {
                delete lists[currentListId];
                saveLists();
                loadListSelector();
                selectList('');
            }
            closeDeleteModal();
        }

    function loadListSelector() {
      const select = document.getElementById('listSelect');
      select.innerHTML = '<option value="">Selecionar Lista</option>';
      Object.keys(lists).forEach(listId => {
        const option = document.createElement('option');
        option.value = listId;
        option.textContent = lists[listId].name;
        select.appendChild(option);
      });
      if (currentListId && lists[currentListId]) {
        select.value = currentListId;
      }
    }

    function createList() {
      const nameInput = document.getElementById('newListName');
      const name = nameInput.value.trim();
      if (!name) return alert('Digite um nome');
      const listId = 'list_' + Date.now();
      lists[listId] = { name, items: [], created: new Date().toISOString() };
      saveLists();
      loadListSelector();
      selectList(listId);
      nameInput.value = '';
    }

    function selectList(listId) {
      currentListId = listId;
      if (listId && lists[listId]) {
        document.getElementById('itemFormContainer').style.display = 'block';
        document.getElementById('currentListContainer').style.display = 'block';
        document.getElementById('currentListTitle').textContent = lists[listId].name;
        loadItems();
      } else {
        document.getElementById('itemFormContainer').style.display = 'none';
        document.getElementById('currentListContainer').style.display = 'none';
      }
    }

    function addItem() {
      if (!currentListId) return;
      const name = document.getElementById('itemName').value.trim();
      const price = parseFloat(document.getElementById('itemPrice').value) || 0;
      const qty = parseFloat(document.getElementById('itemQty').value) || 1;
      if (!name) return alert('Digite o nome do item');
      const item = { id: 'item_' + Date.now(), name, price, quantity: qty, completed: false };
      lists[currentListId].items.push(item);
      saveLists();
      loadItems();
      document.getElementById('itemName').value = '';
      document.getElementById('itemPrice').value = '';
      document.getElementById('itemQty').value = 1;
    }

    function loadItems() {
      const container = document.getElementById('itemsContainer');
      const items = lists[currentListId].items;
      if (items.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:20px;">Lista vazia</div>`;
      } else {
        container.innerHTML = items.map(item => `
          <div class="item ${item.completed ? 'completed' : ''}">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleItem('${item.id}')">
            <div class="item-info">
              <span class="item-name" onclick="startEdit('${item.id}','name')">${item.name}</span>
              <span class="item-price" onclick="startEdit('${item.id}','price')">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
              <span class="item-qty" onclick="startEdit('${item.id}','quantity')">Qtd: ${item.quantity}</span>
              <span class="item-total">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="item-actions">
              <button class="action-btn" onclick="confirmDeleteItem('${item.id}')">🗑️</button>
            </div>
          </div>
        `).join('');
      }
      updateTotal();
    }

    function toggleItem(itemId) {
      const item = lists[currentListId].items.find(i => i.id === itemId);
      if (item) { item.completed = !item.completed; saveLists(); loadItems(); }
    }

    function startEdit(itemId, field) {
      if (editingItemId && editingItemId !== itemId) cancelEdit();
      const item = lists[currentListId].items.find(i => i.id === itemId);
      if (!item) return;
      editingItemId = itemId;

      let selector;
      if (field === "price") selector = ".item-price";
      else if (field === "quantity") selector = ".item-qty";
      else if (field === "name") selector = ".item-name";

      const elements = document.querySelectorAll(selector);
      const element = Array.from(elements).find(el => el.onclick.toString().includes(itemId));
      if (element) {
        const currentValue =
          field === "price" ? item.price.toFixed(2) :
          field === "quantity" ? item.quantity :
          item.name;
        const inputType = field === "name" ? "text" : "number";
        const step = field === "price" ? "0.01" : field === "quantity" ? "0.01" : "";
        element.innerHTML = `
          <input type="${inputType}" class="price-input"
                value="${currentValue}"
                step="${step}" min="0"
                id="editInput_${itemId}_${field}"
                onkeypress="handleEditKeypress(event,'${itemId}','${field}')"
                onblur="saveEdit('${itemId}','${field}')">
        `;
        const input = document.getElementById(`editInput_${itemId}_${field}`);
        input.focus(); input.select();
      }
    }

    function handleEditKeypress(event,itemId,field){ if(event.key==='Enter'){ saveEdit(itemId,field);} else if(event.key==='Escape'){ cancelEdit();}}

    function saveEdit(itemId, field) {
      const input = document.getElementById(`editInput_${itemId}_${field}`);
      if (!input) return;
      let newValue;
      if (field === "price" || field === "quantity") newValue = parseFloat(input.value) || 0;
      else newValue = input.value.trim();

      const item = lists[currentListId].items.find(i => i.id === itemId);
      if (item) item[field] = newValue;
      saveLists();
      editingItemId = null;
      loadItems();
    }


    function cancelEdit(){ editingItemId=null; loadItems(); }

    function confirmDeleteItem(itemId) {
      const item = lists[currentListId].items.find(i => i.id === itemId);
      if (item && confirm(`Excluir "${item.name}"?`)) {
        lists[currentListId].items = lists[currentListId].items.filter(i => i.id !== itemId);
        saveLists(); loadItems();
      }
    }

    function updateTotal() {
      const items = lists[currentListId].items;
      const total = items.filter(i => i.completed).reduce((sum,i)=>sum+(i.price*i.quantity),0);
      document.getElementById('totalAmount').textContent = total.toFixed(2).replace('.', ',');
      const previsto = items.reduce((sum,i)=>sum+(i.price*i.quantity),0);
      document.getElementById('valorPrevisto').textContent = previsto.toFixed(2).replace('.', ',');
    }

	function loadRecentLists() {
  const container = document.getElementById('recentListsContainer');

  const sortedLists = Object.entries(lists)
    .sort((a, b) => new Date(b[1].created || 0) - new Date(a[1].created || 0))
    .slice(0, 3);

  if (sortedLists.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); font-size: 0.9em; padding: 20px;">
        Nenhuma lista criada ainda
      </div>
    `;
    return;
  }
        
  container.innerHTML = sortedLists.map(([listId, list]) => `
    <div class="recent-item ${currentListId === listId ? 'active' : ''}" 
         onclick="selectList('${listId}')" title="Clique para abrir esta lista">
      <div style="font-weight: 500; margin-bottom: 2px;">${list.name}</div>
      <div style="font-size: 0.8em; color: var(--text-secondary);">
        ${list.items.length} itens • ${formatDate(list.created)}
      </div>
    </div>
  `).join('');
}

function formatDate(dateString) {
  if (!dateString) return 'Data desconhecida';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Hoje';
  if (diffDays === 2) return 'Ontem';
  if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
  return date.toLocaleDateString('pt-BR');
}

async function importFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) {
      alert("A área de transferência está vazia.");
      return;
    }

    const importedData = JSON.parse(text);

    if (typeof importedData !== "object" || importedData === null) {
      alert("O conteúdo colado não é um JSON válido.");
      return;
    }

    // Mescla com as listas existentes
    lists = { ...lists, ...importedData };

    saveLists();
    loadListSelector();
    loadRecentLists();

    alert("JSON importado com sucesso!");
  } catch (err) {
    alert("Erro ao ler ou importar o JSON: " + err.message);
  }
}


document.getElementById('listSelect').addEventListener('change',function(){selectList(this.value)});
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme')||'light');
updateThemeToggle();
loadListSelector();
loadRecentLists();