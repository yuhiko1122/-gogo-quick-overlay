import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// Firebaseコンソール「プロジェクトの設定 > 全般 > マイアプリ」で取得した値に置き換える。
// apiKey / databaseURL 等はクライアント公開前提の値で、アクセス制御はRTDBのセキュリティルール側で行う。
const firebaseConfig = {
  apiKey: "AIzaSyDTqRPRYh1m_p4hUwXLdbsM5gwJtVKhMF8",
  authDomain: "gogo-mac.firebaseapp.com",
  databaseURL: "https://gogo-mac-default-rtdb.firebaseio.com",
  projectId: "gogo-mac",
  storageBucket: "gogo-mac.firebasestorage.app",
  messagingSenderId: "342749261109",
  appId: "1:342749261109:web:954a47beb16a7561c5307c"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
