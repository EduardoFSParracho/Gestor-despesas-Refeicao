// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDQ9mHgSYLmM1Bcp0MNttsRKNbZpLhxMM0",
  authDomain: "gestor-despesas-refeicao.firebaseapp.com",
  projectId: "gestor-despesas-refeicao",
  storageBucket: "gestor-despesas-refeicao.appspot.com",
  messagingSenderId: "770194270939",
  appId: "1:770194270939:web:5d34fab2d2350289c1fafe"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Guardar saldo
function guardarSaldo() {
  const valor = parseFloat(document.getElementById("saldo").value);
  const quem = document.getElementById("quemSaldo").value;

  if (isNaN(valor) || valor <= 0) {
    alert("Insere um valor válido!");
    return;
  }

  db.collection("saldos").add({
    valor,
    quem,
    data: new Date()
  })
  .then(() => {
    document.getElementById("saldo").value = "";
    alert("Saldo guardado com sucesso!");
  })
  .catch(err => alert("Erro ao guardar saldo: " + err.message));
}

// Adicionar despesa
function adicionarDespesa() {
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const quem = document.getElementById("quem").value;

  if (!descricao || isNaN(valor) || !categoria) {
    alert("Preenche todos os campos corretamente, incluindo a categoria!");
    return;
  }

  db.collection("despesas").add({
    descricao,
    valor,
    categoria,
    quem,
    data: new Date()
  })
  .then(() => {
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("categoria").value = "";
    alert("Despesa adicionada!");
  })
  .catch(err => alert("Erro ao adicionar despesa: " + err.message));
}

// Atualizar tabela de saldos em tempo real
document.addEventListener("DOMContentLoaded", () => {

  db.collection("saldos").onSnapshot((snapshot) => {
    let totalEduardo = 0;
    let totalLuciana = 0;

    snapshot.forEach(doc => {
      const d = doc.data();
      if (d.quem === "Eduardo") totalEduardo += d.valor;
      if (d.quem === "Luciana") totalLuciana += d.valor;
    });

    document.getElementById("saldoEduardo").innerText = totalEduardo.toFixed(2) + " €";
    document.getElementById("saldoLuciana").innerText = totalLuciana.toFixed(2) + " €";
  }, err => alert("Erro ao carregar saldos: " + err.message));

  // Mostrar despesas em tempo real
  db.collection("despesas").orderBy("data").onSnapshot((snapshot) => {
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    snapshot.forEach(doc => {
      const d = doc.data();
      const item = document.createElement("li");
      item.innerText = `${d.descricao} - ${d.valor}€ | ${d.categoria} | ${d.quem}`;
      lista.appendChild(item);
    });
  }, err => alert("Erro ao carregar despesas: " + err.message));

});
