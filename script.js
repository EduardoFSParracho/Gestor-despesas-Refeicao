let despesas = []

function adicionarDespesa(){

let descricao = document.getElementById("descricao").value
let valor = document.getElementById("valor").value
let quem = document.getElementById("quem").value

despesas.push({
descricao,
valor,
quem
})

mostrarDespesas()

}

function mostrarDespesas(){

let lista = document.getElementById("lista")

lista.innerHTML = ""

despesas.forEach(d => {

let item = document.createElement("li")

item.innerText = d.descricao + " - " + d.valor + "€ (" + d.quem + ")"

lista.appendChild(item)

})

}

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
