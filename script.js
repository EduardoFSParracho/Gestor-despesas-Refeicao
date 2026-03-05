// Configuração do Firebase
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

// Definir data de hoje por defeito
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("data").value = today;

  // Saldos em tempo real
  db.collection("saldos").onSnapshot((snapshot) => {
    let totalEduardo = 0;
    let totalLuciana = 0;
    snapshot.forEach(doc => {
      const d = doc.data();
      if (d.quem === "Eduardo") totalEduardo += d.valor;
      if (d.quem === "Luciana") totalLuciana += d.valor;
    });
    document.getElementById("saldoEduardo").innerText = totalEduardo.toFixed(2).replace(".", ",") + " €";
    document.getElementById("saldoLuciana").innerText = totalLuciana.toFixed(2).replace(".", ",") + " €";
  }, err => alert("Erro ao carregar saldos: " + err.message));

  // Despesas em tempo real
  db.collection("despesas").orderBy("data", "desc").onSnapshot((snapshot) => {
    const tbody = document.getElementById("tabelaDespesas");

    if (snapshot.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="icon">📭</div>
              Sem despesas registadas ainda.
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();

      // Formatar data
      let dataFormatada = "—";
      if (d.dataManual) {
        const parts = d.dataManual.split("-");
        dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (d.data && d.data.toDate) {
        dataFormatada = d.data.toDate().toLocaleDateString("pt-PT");
      }

      const badgeClass = d.quem === "Eduardo" ? "badge-eduardo" : "badge-luciana";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="date-cell">${dataFormatada}</td>
        <td>${d.descricao}</td>
        <td><span class="cat-badge">${d.categoria}</span></td>
        <td><span class="badge ${badgeClass}">${d.quem}</span></td>
        <td class="valor-cell">${parseFloat(d.valor).toFixed(2).replace(".", ",")} €</td>
      `;
      tbody.appendChild(tr);
    });
  }, err => alert("Erro ao carregar despesas: " + err.message));
});

// Guardar saldo
function guardarSaldo() {
  const valor = parseFloat(document.getElementById("saldo").value);
  const quem = document.getElementById("quemSaldo").value;
  if (isNaN(valor) || valor <= 0) {
    alert("Insere um valor válido!");
    return;
  }
  db.collection("saldos").add({ valor, quem, data: new Date() })
    .then(() => {
      document.getElementById("saldo").value = "";
      alert("Saldo guardado!");
    })
    .catch(err => alert("Erro: " + err.message));
}

// Adicionar despesa
function adicionarDespesa() {
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const quem = document.getElementById("quem").value;
  const dataManual = document.getElementById("data").value;

  if (!descricao || isNaN(valor) || !categoria || !dataManual) {
    alert("Preenche todos os campos corretamente!");
    return;
  }

  db.collection("despesas").add({
    descricao,
    valor,
    categoria,
    quem,
    dataManual,
    data: new Date(dataManual)
  })
  .then(() => {
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("categoria").value = "";
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("data").value = today;
    alert("Despesa adicionada!");
  })
  .catch(err => alert("Erro: " + err.message));
}
