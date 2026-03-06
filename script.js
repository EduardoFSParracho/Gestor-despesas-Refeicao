// ══════════════════════════════════
// CONFIGURAÇÃO — muda o código aqui
// ══════════════════════════════════
var CODIGO_CORRETO = "1003"; // ← altera para o código que quiseres

// ── Firebase ──────────────────────────────────────────────
var firebaseConfig = {
  apiKey: "AIzaSyDQ9mHgSYLmM1Bcp0MNttsRKNbZpLhxMM0",
  authDomain: "gestor-despesas-refeicao.firebaseapp.com",
  projectId: "gestor-despesas-refeicao",
  storageBucket: "gestor-despesas-refeicao.appspot.com",
  messagingSenderId: "770194270939",
  appId: "1:770194270939:web:5d34fab2d2350289c1fafe"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// ══════════════════════════════════
// PIN / LOCK
// ══════════════════════════════════
var pinAtual = "";

function pinPress(num) {
  if (pinAtual.length >= CODIGO_CORRETO.length) return;
  pinAtual += num;
  atualizarDots(false);
  if (pinAtual.length === CODIGO_CORRETO.length) {
    setTimeout(function() { verificarPin(); }, 120);
  }
}

function pinDel() {
  pinAtual = pinAtual.slice(0, -1);
  atualizarDots(false);
  document.getElementById("pin-error").textContent = "";
}

function atualizarDots(erro) {
  for (var i = 0; i < CODIGO_CORRETO.length; i++) {
    var dot = document.getElementById("dot-" + i);
    dot.className = "pin-dot";
    if (erro) dot.classList.add("error");
    else if (i < pinAtual.length) dot.classList.add("filled");
  }
}

function verificarPin() {
  if (pinAtual === CODIGO_CORRETO) {
    sessionStorage.setItem("acesso", "ok");
    mostrarApp();
  } else {
    atualizarDots(true);
    document.getElementById("pin-error").textContent = "Código incorreto. Tenta outra vez.";
    setTimeout(function() {
      pinAtual = "";
      atualizarDots(false);
      document.getElementById("pin-error").textContent = "";
    }, 1200);
  }
}

function mostrarApp() {
  document.getElementById("lock-page").style.display = "none";
  document.getElementById("app-page").style.display  = "block";
  iniciarApp();
}

function bloquear() {
  sessionStorage.removeItem("acesso");
  pinAtual = "";
  atualizarDots(false);
  document.getElementById("pin-error").textContent = "";
  document.getElementById("lock-page").style.display = "flex";
  document.getElementById("app-page").style.display  = "none";
  pararListeners();
}

// Verificar se já tem sessão ativa (dentro do mesmo separador)
document.addEventListener("DOMContentLoaded", function() {
  if (sessionStorage.getItem("acesso") === "ok") {
    mostrarApp();
  }
});

// ══════════════════════════════════
// APP
// ══════════════════════════════════
var unsubscribers = [];

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
             "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function today() {
  return new Date().toISOString().split("T")[0];
}
function fmtDate(str) {
  if (!str) return "—";
  var p = str.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}
function fmtMes(yyyymm) {
  var p = yyyymm.split("-");
  return MESES[parseInt(p[1]) - 1] + " " + p[0];
}
function fmtVal(v) {
  return parseFloat(v).toFixed(2).replace(".", ",") + " €";
}

function setSaldoUI(id, valor) {
  var el = document.getElementById(id);
  el.textContent = fmtVal(valor);
  el.className = "amount " + (valor >= 0 ? "pos" : "neg");
}

function recalcular(pessoa) {
  var elId = pessoa === "Eduardo" ? "saldoEduardo" : "saldoLuciana";
  var ent = 0, desp = 0;
  db.collection("saldos").where("quem","==",pessoa).get()
    .then(function(s) {
      s.forEach(function(d) { ent += d.data().valor; });
      return db.collection("despesas").where("quem","==",pessoa).get();
    })
    .then(function(s2) {
      s2.forEach(function(d) { desp += d.data().valor; });
      setSaldoUI(elId, ent - desp);
    });
}

function renderSaldos(pessoa, docs) {
  var id = pessoa === "Eduardo" ? "tb-saldos-edu" : "tb-saldos-luc";
  var tb = document.getElementById(id);
  if (!docs.length) {
    tb.innerHTML = '<tr><td colspan="2"><div class="empty">Sem registos.</div></td></tr>';
    return;
  }
  var sorted = docs.slice().sort(function(a,b) {
    return (b.data().dataManual||"").localeCompare(a.data().dataManual||"");
  });
  tb.innerHTML = "";
  sorted.forEach(function(doc) {
    var d = doc.data();
    var tr = document.createElement("tr");
    tr.innerHTML = '<td class="mono c-muted">' + fmtDate(d.dataManual) + '</td>' +
                   '<td class="mono c-green">+ ' + fmtVal(d.valor) + '</td>';
    tb.appendChild(tr);
  });
}

function renderDespesas(pessoa, docs) {
  var id = pessoa === "Eduardo" ? "tb-desp-edu" : "tb-desp-luc";
  var tb = document.getElementById(id);
  if (!docs.length) {
    tb.innerHTML = '<tr><td colspan="4"><div class="empty">Sem despesas.</div></td></tr>';
    return;
  }
  var grupos = {};
  docs.forEach(function(doc) {
    var d = doc.data();
    var key = (d.dataManual || "0000-00").substring(0,7);
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(d);
  });
  var meses = Object.keys(grupos).sort(function(a,b) { return b.localeCompare(a); });
  tb.innerHTML = "";
  meses.forEach(function(mes) {
    var lista = grupos[mes].sort(function(a,b) {
      return (b.dataManual||"").localeCompare(a.dataManual||"");
    });
    var total = lista.reduce(function(s,d) { return s + d.valor; }, 0);
    var trH = document.createElement("tr");
    trH.className = "month-row";
    trH.innerHTML = '<td colspan="4">📅 ' + fmtMes(mes) + '</td>';
    tb.appendChild(trH);
    lista.forEach(function(d) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td class="mono c-muted">' + fmtDate(d.dataManual) + '</td>' +
                     '<td>' + d.descricao + '</td>' +
                     '<td><span class="cat-badge">' + d.categoria + '</span></td>' +
                     '<td class="mono c-red">− ' + fmtVal(d.valor) + '</td>';
      tb.appendChild(tr);
    });
    var trT = document.createElement("tr");
    trT.className = "month-total-row";
    trT.innerHTML = '<td colspan="3">Total ' + fmtMes(mes) + '</td>' +
                    '<td class="mono c-red">− ' + fmtVal(total) + '</td>';
    tb.appendChild(trT);
  });
}

function guardarSaldo(pessoa) {
  var p = pessoa === "Eduardo" ? "edu" : "luc";
  var val  = parseFloat(document.getElementById(p + "-saldo-val").value);
  var data = document.getElementById(p + "-saldo-data").value;
  if (isNaN(val) || val <= 0) { alert("Insere um valor válido!"); return; }
  if (!data) { alert("Seleciona uma data!"); return; }
  db.collection("saldos").add({ valor: val, quem: pessoa, dataManual: data, data: new Date(data) })
    .then(function() {
      document.getElementById(p + "-saldo-val").value  = "";
      document.getElementById(p + "-saldo-data").value = today();
    })
    .catch(function(err) { alert("Erro: " + err.message); });
}

function adicionarDespesa(pessoa) {
  var p    = pessoa === "Eduardo" ? "edu" : "luc";
  var desc = document.getElementById(p + "-desc").value.trim();
  var val  = parseFloat(document.getElementById(p + "-val").value);
  var data = document.getElementById(p + "-data").value;
  var cat  = document.getElementById(p + "-cat").value;
  if (!desc)               { alert("Preenche a descrição!"); return; }
  if (isNaN(val) || val<=0){ alert("Insere um valor válido!"); return; }
  if (!data)               { alert("Seleciona uma data!"); return; }
  if (!cat)                { alert("Seleciona uma categoria!"); return; }
  db.collection("despesas").add({
    descricao: desc, valor: val, categoria: cat,
    quem: pessoa, dataManual: data, data: new Date(data)
  })
  .then(function() {
    document.getElementById(p + "-desc").value = "";
    document.getElementById(p + "-val").value  = "";
    document.getElementById(p + "-cat").value  = "";
    document.getElementById(p + "-data").value = today();
  })
  .catch(function(err) { alert("Erro: " + err.message); });
}

function pararListeners() {
  unsubscribers.forEach(function(u) { u(); });
  unsubscribers = [];
}

function iniciarApp() {
  pararListeners();
  ["edu-saldo-data","luc-saldo-data","edu-data","luc-data"].forEach(function(id) {
    document.getElementById(id).value = today();
  });
  ["Eduardo","Luciana"].forEach(function(pessoa) {
    var u1 = db.collection("saldos").where("quem","==",pessoa)
      .onSnapshot(function(snap) {
        renderSaldos(pessoa, snap.docs);
        recalcular(pessoa);
      });
    var u2 = db.collection("despesas").where("quem","==",pessoa)
      .onSnapshot(function(snap) {
        renderDespesas(pessoa, snap.docs);
        recalcular(pessoa);
      });
    unsubscribers.push(u1, u2);
  });
}
