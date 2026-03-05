// ── Firebase ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDQ9mHgSYLmM1Bcp0MNttsRKNbZpLhxMM0",
  authDomain: "gestor-despesas-refeicao.firebaseapp.com",
  projectId: "gestor-despesas-refeicao",
  storageBucket: "gestor-despesas-refeicao.appspot.com",
  messagingSenderId: "770194270939",
  appId: "1:770194270939:web:5d34fab2d2350289c1fafe"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ── Tab switching ─────────────────────────────────────────
function switchTab(person) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".main-tab").forEach(t => {
    t.classList.remove("active-edu", "active-luc");
  });
  document.getElementById("panel-" + person).classList.add("active");
  const tabs = document.querySelectorAll(".main-tab");
  if (person === "eduardo") tabs[0].classList.add("active-edu");
  else tabs[1].classList.add("active-luc");
}

// ── Helpers ───────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatDate(dataManual) {
  if (!dataManual) return "—";
  const p = dataManual.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatMonthKey(dataManual) {
  if (!dataManual) return "Desconhecido";
  const p = dataManual.split("-");
  return `${MESES[parseInt(p[1]) - 1]} ${p[0]}`;
}

function fmt(valor) {
  return parseFloat(valor).toFixed(2).replace(".", ",") + " €";
}

function setToday(id) {
  document.getElementById(id).value = new Date().toISOString().split("T")[0];
}

// ── Saldo UI ──────────────────────────────────────────────
function updateSaldoUI(elementId, valor) {
  const el = document.getElementById(elementId);
  el.innerText = fmt(valor);
  el.className = "saldo-valor " + (valor >= 0 ? "positivo" : "negativo");
}

// ── Recalcular saldo (entradas - despesas) ─────────────────
function recalcularSaldo(pessoa) {
  const elId = pessoa === "Eduardo" ? "saldoEduardo" : "saldoLuciana";
  let entradas = 0, despesas = 0;

  const p1 = db.collection("saldos").where("quem", "==", pessoa).get()
    .then(snap => snap.forEach(d => entradas += d.data().valor));

  const p2 = db.collection("despesas").where("quem", "==", pessoa).get()
    .then(snap => snap.forEach(d => despesas += d.data().valor));

  Promise.all([p1, p2]).then(() => updateSaldoUI(elId, entradas - despesas));
}

// ── Render tabela saldos ──────────────────────────────────
function renderTabelaSaldos(pessoa, docs) {
  const tbodyId = pessoa === "Eduardo" ? "tabelaSaldosEduardo" : "tabelaSaldosLuciana";
  const tbody = document.getElementById(tbodyId);

  if (docs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2"><div class="empty-state"><div class="icon">📭</div>Sem registos.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  docs.forEach(doc => {
    const d = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="date-cell">${formatDate(d.dataManual)}</td>
      <td class="valor-pos">+ ${fmt(d.valor)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Render tabela despesas agrupadas por mês ───────────────
function renderTabelaDespesas(pessoa, docs) {
  const tbodyId = pessoa === "Eduardo" ? "tabelaDespesasEduardo" : "tabelaDespesasLuciana";
  const tbody = document.getElementById(tbodyId);
  const cols = 4;

  if (docs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><div class="icon">📭</div>Sem despesas.</div></td></tr>`;
    return;
  }

  // Agrupar por mês
  const grupos = {};
  docs.forEach(doc => {
    const d = doc.data();
    const key = d.dataManual ? d.dataManual.substring(0, 7) : "0000-00"; // YYYY-MM
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(d);
  });

  // Ordenar meses do mais recente para o mais antigo
  const mesesOrdenados = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

  tbody.innerHTML = "";
  mesesOrdenados.forEach(mesKey => {
    const despesasMes = grupos[mesKey];
    const totalMes = despesasMes.reduce((sum, d) => sum + d.valor, 0);
    const mesLabel = formatMonthKey(mesKey + "-01");

    // Cabeçalho do mês
    const trHeader = document.createElement("tr");
    trHeader.className = "month-header";
    trHeader.innerHTML = `<td colspan="${cols}">📅 ${mesLabel}</td>`;
    tbody.appendChild(trHeader);

    // Despesas do mês (ordenadas por data desc)
    despesasMes
      .sort((a, b) => (b.dataManual || "").localeCompare(a.dataManual || ""))
      .forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="date-cell">${formatDate(d.dataManual)}</td>
          <td>${d.descricao}</td>
          <td><span class="cat-badge">${d.categoria}</span></td>
          <td class="valor-neg">− ${fmt(d.valor)}</td>
        `;
        tbody.appendChild(tr);
      });

    // Total do mês
    const trTotal = document.createElement("tr");
    trTotal.className = "month-total";
    trTotal.innerHTML = `
      <td colspan="3">Total ${mesLabel}</td>
      <td class="valor-neg">− ${fmt(totalMes)}</td>
    `;
    tbody.appendChild(trTotal);
  });
}

// ── Guardar saldo ─────────────────────────────────────────
function guardarSaldo(pessoa) {
  const prefix = pessoa === "Eduardo" ? "edu" : "luc";
  const valor = parseFloat(document.getElementById(prefix + "-saldo").value);
  const dataManual = document.getElementById(prefix + "-saldo-data").value;

  if (isNaN(valor) || valor <= 0) { alert("Insere um valor válido!"); return; }
  if (!dataManual) { alert("Seleciona uma data!"); return; }

  db.collection("saldos").add({ valor, quem: pessoa, dataManual, data: new Date(dataManual) })
    .then(() => {
      document.getElementById(prefix + "-saldo").value = "";
      setToday(prefix + "-saldo-data");
      alert("Saldo adicionado!");
    })
    .catch(err => alert("Erro: " + err.message));
}

// ── Adicionar despesa ─────────────────────────────────────
function adicionarDespesa(pessoa) {
  const prefix = pessoa === "Eduardo" ? "edu" : "luc";
  const descricao = document.getElementById(prefix + "-descricao").value.trim();
  const valor = parseFloat(document.getElementById(prefix + "-valor").value);
  const dataManual = document.getElementById(prefix + "-data").value;
  const categoria = document.getElementById(prefix + "-categoria").value;

  if (!descricao || isNaN(valor) || valor <= 0 || !categoria || !dataManual) {
    alert("Preenche todos os campos corretamente!");
    return;
  }

  db.collection("despesas").add({
    descricao, valor, categoria, quem: pessoa,
    dataManual, data: new Date(dataManual)
  })
  .then(() => {
    document.getElementById(prefix + "-descricao").value = "";
    document.getElementById(prefix + "-valor").value = "";
    document.getElementById(prefix + "-categoria").value = "";
    setToday(prefix + "-data");
    alert("Despesa adicionada!");
  })
  .catch(err => alert("Erro: " + err.message));
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Datas default
  ["edu-data", "edu-saldo-data", "luc-data", "luc-saldo-data"].forEach(setToday);

  // Listeners em tempo real para cada pessoa
  ["Eduardo", "Luciana"].forEach(pessoa => {
    const prefix = pessoa === "Eduardo" ? "edu" : "luc";

    // Saldos
    db.collection("saldos")
      .where("quem", "==", pessoa)
      .orderBy("data", "desc")
      .onSnapshot(snap => {
        renderTabelaSaldos(pessoa, snap.docs);
        recalcularSaldo(pessoa);
      }, err => console.error(err));

    // Despesas
    db.collection("despesas")
      .where("quem", "==", pessoa)
      .orderBy("data", "desc")
      .onSnapshot(snap => {
        renderTabelaDespesas(pessoa, snap.docs);
        recalcularSaldo(pessoa);
      }, err => console.error(err));
  });
});
