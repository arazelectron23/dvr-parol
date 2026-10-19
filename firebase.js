// Firebase SDK modulları
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// !!! Öz Firebase konsolunuzdan götürdüyünüz konfiqurasiyanı bura yazın !!!
const firebaseConfig = {
    apiKey: "AIzaSyCHMkPBlJw_vhCEiAqdvM-aM-kIqwVgW8k",
  authDomain: "dvr-parol.firebaseapp.com",
  projectId: "dvr-parol",
  storageBucket: "dvr-parol.firebasestorage.app",
  messagingSenderId: "90414663482",
  appId: "1:90414663482:web:4eb446e5fb789ea08fb203"
};

// Firebase-i işə salırıq
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp };