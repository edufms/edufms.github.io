document.addEventListener('DOMContentLoaded', function () {
  var STATUS = [
    "HP", "DEF", "Atq", "Vel Atq", "Evasão", "Taxa Critica", "Dano Critico",
    "Dano Undead", "Dano Demon", "Dano Primate", "Dano Boss",
    "Red no Consumo de Saciedade", "Red no Consumo de Humor", "Red no Consumo de Vigor",
    "Velocidade de Movimento", "Chance de material extra", "Chance de Ouro extra"
  ];
  var STORAGE_KEY = "heroEquipDB_v3";
  var DB = loadDB();
  var editingIndex = null;

  function loadDB() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { heroes: {} }; }
    catch (_) { return { heroes: {} }; }
  }
  function saveDB() { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }

  var statsInputsEl = document.getElementById("statsInputs");
  STATUS.forEach(function (s) {
    var div = document.createElement("div");
    div.className = "col-md-2";
    var label = document.createElement("label");
    label.className = "form-label small";
    label.textContent = s;
    var inp = document.createElement("input");
    inp.setAttribute("data-stat", s);
    inp.type = "number";
    inp.className = "form-control form-control-sm";
    inp.placeholder = "0";
    div.appendChild(label);
    div.appendChild(inp);
    statsInputsEl.appendChild(div);
  });

  var heroSelect = document.getElementById("heroSelect");
  var heroNameIn = document.getElementById("heroName");
  var heroClassIn = document.getElementById("heroClass");
  var addHeroBtn = document.getElementById("addHeroBtn");
  var deleteHeroBtn = document.getElementById("deleteHeroBtn");
  var equipNameIn = document.getElementById("equipName");
  var equipTypeIn = document.getElementById("equipType");
  var equipRarity = document.getElementById("equipRarity");
  var addEquipBtn = document.getElementById("addEquipBtn");
  var equipListWrap = document.getElementById("equipListWrap");
  var totalsEl = document.getElementById("totals");

  function refreshHeroSelect() {
    heroSelect.innerHTML = "";
    var keys = Object.keys(DB.heroes);
    if (keys.length === 0) {
      heroSelect.innerHTML = "<option>— Sem heróis —</option>";
      refreshEquipList();
      updateTotals();
      return;
    }
    keys.forEach(function (k) {
      var opt = document.createElement("option");
      var cls = DB.heroes[k].classe ? " (" + DB.heroes[k].classe + ")" : "";
      opt.text = k + cls;
      opt.value = k;
      heroSelect.appendChild(opt);
    });
    if (!heroSelect.value) heroSelect.value = keys[0];
    refreshEquipList();
    updateTotals();
  }

  addHeroBtn.onclick = function () {
    var name = (heroNameIn.value || "").trim();
    var classe = heroClassIn.value;
    if (!name) return alert("Digite o nome do herói!");
    if (DB.heroes[name]) return alert("Herói já existe!");
    DB.heroes[name] = { classe: classe, equips: [] };
    saveDB();
    heroNameIn.value = "";
    heroClassIn.value = "";
    refreshHeroSelect();
    heroSelect.value = name;
  };

  deleteHeroBtn.onclick = function () {
    var hero = heroSelect.value;
    if (!hero) return;
    if (!confirm("Remover " + hero + " e todos os equipamentos?")) return;
    delete DB.heroes[hero];
    saveDB();
    refreshHeroSelect();
  };

  function refreshEquipList() {
    var hero = heroSelect.value;
    equipListWrap.innerHTML = "";
    if (!hero || !DB.heroes[hero]) {
      equipListWrap.innerHTML = "<div class='text-muted small'>Selecione um herói.</div>";
      return;
    }
    var equips = DB.heroes[hero].equips || [];
    if (equips.length === 0) {
      equipListWrap.innerHTML = "<div class='text-muted small'>Nenhum equipamento cadastrado.</div>";
      return;
    }
    var t = document.createElement("table");
    t.className = "table table-striped table-sm align-middle";
    t.innerHTML = "<thead><tr><th>Nome</th><th>Tipo</th><th>Raridade</th><th>Resumo</th><th>Ações</th></tr></thead>";
    var tb = document.createElement("tbody");
    equips.forEach(function (eq, i) {
      var stats = STATUS.map(function (s) { return eq.stats[s] ? s + ": " + eq.stats[s] : null; }).filter(Boolean).join("; ");
      var tr = document.createElement("tr");
      var tdName = document.createElement("td");
      tdName.textContent = eq.name;
      var tdType = document.createElement("td");
      tdType.textContent = eq.type;
      var tdRarity = document.createElement("td");
      tdRarity.textContent = eq.rarity;
      var tdStats = document.createElement("td");
      tdStats.textContent = stats || "—";
      var tdActions = document.createElement("td");
      var editBtn = document.createElement("button");
      editBtn.setAttribute("data-idx", i);
      editBtn.className = "btn btn-sm btn-warning edit-eq";
      editBtn.textContent = "✏️";
      editBtn.setAttribute("aria-label", "Editar " + eq.name);
      var delBtn = document.createElement("button");
      delBtn.setAttribute("data-idx", i);
      delBtn.className = "btn btn-sm btn-danger del-eq";
      delBtn.textContent = "🗑️";
      delBtn.setAttribute("aria-label", "Remover " + eq.name);
      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);
      tr.appendChild(tdName);
      tr.appendChild(tdType);
      tr.appendChild(tdRarity);
      tr.appendChild(tdStats);
      tr.appendChild(tdActions);
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    equipListWrap.appendChild(t);

    equipListWrap.querySelectorAll(".del-eq").forEach(function (b) {
      b.onclick = function () {
        var idx = +b.dataset.idx;
        if (!confirm("Remover equipamento?")) return;
        DB.heroes[hero].equips.splice(idx, 1);
        saveDB();
        refreshEquipList();
        updateTotals();
      };
    });

    equipListWrap.querySelectorAll(".edit-eq").forEach(function (b) {
      b.onclick = function () {
        var idx = +b.dataset.idx;
        var eq = DB.heroes[hero].equips[idx];
        editingIndex = idx;
        equipNameIn.value = eq.name;
        equipTypeIn.value = eq.type;
        equipRarity.value = eq.rarity;
        STATUS.forEach(function (s) {
          var inp = statsInputsEl.querySelector("[data-stat='" + s + "']");
          inp.value = eq.stats[s] || "";
        });
        addEquipBtn.textContent = "💾 Salvar Alterações";
        addEquipBtn.classList.replace("btn-primary", "btn-success");
      };
    });
  }

  addEquipBtn.onclick = function () {
    var hero = heroSelect.value;
    if (!hero) return alert("Selecione um herói primeiro.");
    var name = (equipNameIn.value || "").trim();
    if (!name) return alert("Informe o nome do equipamento.");
    var type = equipTypeIn.value;
    if (!type) return alert("Selecione o tipo do equipamento.");
    var rarity = equipRarity.value;
    var stats = {};
    statsInputsEl.querySelectorAll("input").forEach(function (inp) {
      var val = inp.value.trim();
      if (val !== "") stats[inp.dataset.stat] = Number(val);
    });
    var newEquip = { name: name, type: type, rarity: rarity, stats: stats };
    if (editingIndex !== null) {
      DB.heroes[hero].equips[editingIndex] = newEquip;
      editingIndex = null;
      addEquipBtn.textContent = "➕ Adicionar Equipamento";
      addEquipBtn.classList.replace("btn-success", "btn-primary");
    } else {
      DB.heroes[hero].equips.push(newEquip);
    }
    saveDB();
    equipNameIn.value = "";
    equipTypeIn.value = "";
    statsInputsEl.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    refreshEquipList();
    updateTotals();
  };

  function updateTotals() {
    var hero = heroSelect.value;
    var totals = {};
    STATUS.forEach(function (s) { totals[s] = 0; });
    if (hero && DB.heroes[hero]) {
      DB.heroes[hero].equips.forEach(function (eq) {
        STATUS.forEach(function (s) { totals[s] += Number(eq.stats[s] || 0); });
      });
    }
    totalsEl.innerHTML = STATUS.map(function (s) {
      return "<div><strong>" + s + ":</strong> " + totals[s] + "</div>";
    }).join("");
  }

  heroSelect.onchange = function () { refreshEquipList(); updateTotals(); };
  refreshHeroSelect();
});
