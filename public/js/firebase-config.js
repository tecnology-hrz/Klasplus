                                                                                                                                                                            // Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración ofuscada de Firebase
const _0x4a2b = [
    'QUl6YVN5RG9yQVJndDctc2pHV2pkbU81RXcwY1pVanhydnZyYmdN',
    'a2xhc3BsdXMtMjE2MWYuZmlyZWJhc2VhcHAuY29t',
    'a2xhc3BsdXMtMjE2MWY=',
    'a2xhc3BsdXMtMjE2MWYuZmlyZWJhc2VzdG9yYWdlLmFwcA==',
    'NTA2MTEwNzAwMjA0',
    'MTo1MDYxMTA3MDAyMDQ6d2ViOjRhODFkZmY1MzQ4NzRkMDE1OGNkMDk=',
    'Ry1WV1I0MVRKRUU0'
];

const _decode = (str) => atob(str);

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: _decode(_0x4a2b[0]),
    authDomain: _decode(_0x4a2b[1]),
    projectId: _decode(_0x4a2b[2]),
    storageBucket: _decode(_0x4a2b[3]),
    messagingSenderId: _decode(_0x4a2b[4]),
    appId: _decode(_0x4a2b[5]),
    measurementId: _decode(_0x4a2b[6])
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc };
