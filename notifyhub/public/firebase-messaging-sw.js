importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyC3sWza8FUoDWmXA0cYSHcyZVQ48MB75Q0",
    authDomain: "notifyhub-c6398.firebaseapp.com",
    projectId: "notifyhub-c6398",
    storageBucket: "notifyhub-c6398.firebasestorage.app",
    messagingSenderId: "915975507547",
    appId: "1:915975507547:web:8d0a85b6594ca2ad5d397e",
    measurementId: "G-8KPB0XM0RK"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
