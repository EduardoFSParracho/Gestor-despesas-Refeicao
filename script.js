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

// ── Helpers ───────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function today() {
  return new Date().toISOString().split("T")[0];
}

function fmtDate(str) {
  if (!str) return "—";
  const p = str.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function fmtMes(yyyymm) {
  const p = yyyymm.split("-");
  return MESES[parseInt(p[1]) - 1] + " " + p[0];
}

function fmtVal(v) {
  return parseFloat(v).toFixed(2).replace(".", ",") + " €";
}

// ── Saldo UI ──────────────────────────────────────────────
function setSaldoUI(id, valor) {
  const el = document.getElementById(id);
  el.textContent = fmtVal(valor);
  el.className = "amount " + (valor >= 0 ? "pos" : "neg");
}

// ── Recalcular saldo ──────────────────────────────────────
function recalcular(pessoa) {
  const elId = pessoa === "Eduardo" ? "saldoEduardo" : "saldoLuciana";
  let ent = 0, desp = 0;
  db.collection("saldos").where("quem","==",pessoa).get()
    .then(s => { s.forEach(d => ent += d.data().valor);
      db.collection("despesas").where("quem","==",pessoa).get()
        .then(s2 => { s2.forEach(d => desp += d.data().valor);
          setSaldoUI(elId, ent - desp);
        });
    });
}

// ── Render: tabela saldos ─────────────────────────────────
function renderSaldos(pessoa, docs) {
  const id = pessoa === "Eduardo" ? "tb-saldos-edu" : "tb-saldos-luc";
  const tb = document.getElementById(id);
  if (!docs.length) {
    tb.innerHTML = '<tr><td colspan="2"><div class="empty">Sem registos.</div></td></tr>';
    return;
  }
  tb.innerHTML = "";
  docs.forEach(doc => {
    const d = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = '<td class="mono c-muted">' + fmtDate(d.dataManual) + '</td>' +
                   '<td class="mono c-green">+ ' + fmtVal(d.valor) + '</td>';
    tb.appendChild(tr);
  });
}

// ── Render: despesas agrupadas por mês ───────────────────
function renderDespesas(pessoa, docs) {
  const id = pessoa === "Eduardo" ? "tb-desp-edu" : "tb-desp-luc";
  const tb = document.getElementById(id);
  if (!docs.length) {
    tb.innerHTML = '<tr><td colspan="4"><div class="empty">Sem despesas.</div></td></tr>';
    return;
  }

  // agrupar por YYYY-MM
  const grupos = {};
  docs.forEach(doc => {
    const d = doc.data();
    const key = (d.dataManual || "0000-00").substring(0, 7);
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(d);
  });

  const meses = Object.keys(grupos).sort((a,b) => b.localeCompare(a));
  tb.innerHTML = "";

  meses.forEach(mes => {
    const lista = grupos[mes].sort((a,b) => (b.dataManual||"").localeCompare(a.dataManual||""));
    const total = lista.reduce((s,d) => s + d.valor, 0);

    // cabeçalho do mês
    const trH = document.createElement("tr");
    trH.className = "month-row";
    trH.innerHTML = '<td colspan="4">📅 ' + fmtMes(mes) + '</td>';
    tb.appendChild(trH);

    lista.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td class="mono c-muted">' + fmtDate(d.dataManual) + '</td>' +
                     '<td>' + d.descricao + '</td>' +
                     '<td><span class="cat-badge">' + d.categoria + '</span></td>' +
                     '<td class="mono c-red">− ' + fmtVal(d.valor) + '</td>';
      tb.appendChild(tr);
    });

    // total do mês
    const trT = document.createElement("tr");
    trT.className = "month-total-row";
    trT.innerHTML = '<td colspan="3">Total ' + fmtMes(mes) + '</td>' +
                    '<td>− ' + fmtVal(total) + '</td>';
    tb.appendChild(trT);
  });
}

// ── Guardar saldo ─────────────────────────────────────────
function guardarSaldo(pessoa) {
  const p = pessoa === "Eduardo" ? "edu" : "luc";
  const val = parseFloat(document.getElementById(p + "-saldo-val").value);
  const data = document.getElementById(p + "-saldo-data").value;

  if (isNaN(val) || val <= 0) { alert("Insere um valor válido!"); return; }
  if (!data) { alert("Seleciona uma data!"); return; }

  db.collection("saldos").add({ valor: val, quem: pessoa, dataManual: data, data: new Date(data) })
    .then(() => {
      document.getElementById(p + "-saldo-val").value = "";
      document.getElementById(p + "-saldo-data").value = today();
    })
    .catch(err => alert("Erro: " + err.message));
}

// ── Adicionar despesa ─────────────────────────────────────
function adicionarDespesa(pessoa) {
  const p = pessoa === "Eduardo" ? "edu" : "luc";
  const desc = document.getElementById(p + "-desc").value.trim();
  const val  = parseFloat(document.getElementById(p + "-val").value);
  const data = document.getElementById(p + "-data").value;
  const cat  = document.getElementById(p + "-cat").value;

  if (!desc)           { alert("Preenche a descrição!"); return; }
  if (isNaN(val)||val<=0) { alert("Insere um valor válido!"); return; }
  if (!data)           { alert("Seleciona uma data!"); return; }
  if (!cat)            { alert("Seleciona uma categoria!"); return; }

  db.collection("despesas").add({
    descricao: desc, valor: val, categoria: cat,
    quem: pessoa, dataManual: data, data: new Date(data)
  })
  .then(() => {
    document.getElementById(p + "-desc").value = "";
    document.getElementById(p + "-val").value  = "";
    document.getElementById(p + "-cat").value  = "";
    document.getElementById(p + "-data").value = today();
  })
  .catch(err => alert("Erro: " + err.message));
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  // datas default
  ["edu-saldo-data","luc-saldo-data","edu-data","luc-data"].forEach(function(id) {
    document.getElementById(id).value = today();
  });

  ["Eduardo","Luciana"].forEach(function(pessoa) {
    // saldos em tempo real
    db.collection("saldos")
      .where("quem","==",pessoa)
      .orderBy("data","desc")
      .onSnapshot(function(snap) {
        renderSaldos(pessoa, snap.docs);
        recalcular(pessoa);
      });

    // despesas em tempo real
    db.collection("despesas")
      .where("quem","==",pessoa)
      .orderBy("data","desc")
      .onSnapshot(function(snap) {
        renderDespesas(pessoa, snap.docs);
        recalcular(pessoa);
      });
  });
});
