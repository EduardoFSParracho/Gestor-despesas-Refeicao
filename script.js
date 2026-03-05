// Inicializar Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDQ9mHgSYLmM1Bcp0MNttsRKNbZpLhxMM0",
  authDomain: "gestor-despesas-refeicao.firebaseapp.com",
  projectId: "gestor-despesas-refeicao",
  storageBucket: "gestor-despesas-refeicao.appspot.com",
  messagingSenderId: "770194270939",
  appId: "1:770194270939:web:5d34fab2d2350289c1fafe"
};

// Inicializar app
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Guardar saldo inicial
function guardarSaldo() {
  const saldo = parseFloat(document.getElementById("saldo").value);
  if (isNaN(saldo)) {
    alert("Insere um valor válido!");
    return;
  }
  db.collection("saldo").doc("usuario").set({ valor: saldo })
    .then(() => alert("Saldo guardado com sucesso!"))
    .catch(err => console.error("Erro ao guardar saldo:", err));
}

// Adicionar despesa à Firestore
function adicionarDespesa() {
  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const quem = document.getElementById("quem").value;

  if (!descricao || isNaN(valor)) {
    alert("Preenche todos os campos corretamente!");
    return;
  }

  db.collection("despesas").add({
    descricao,
    valor,
    quem,
    data: new Date()
  })
  .then(() => {
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
  })
  .catch(err => console.error("Erro ao adicionar despesa:", err));
}

// Mostrar despesas em tempo real
db.collection("despesas").orderBy("data").onSnapshot((snapshot) => {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  snapshot.forEach(doc => {
    const d = doc.data();
    const item = document.createElement("li");
    item.innerText = `${d.descricao} - ${d.valor}€ (${d.quem})`;
    lista.appendChild(item);
  });
});
