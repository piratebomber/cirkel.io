import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize messaging for push notifications
let messaging: any = null
if (typeof window !== 'undefined') {
  messaging = getMessaging(app)
}

// Initialize analytics
let analytics: any = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099')
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectStorageEmulator(storage, 'localhost', 9199)
    } catch (error) {
      console.log('Emulators already connected')
    }
  }
}

// Push notification helpers
export const requestNotificationPermission = async () => {
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      return token
    }
    return null
  } catch (error) {
    console.error('Error getting notification permission:', error)
    return null
  }
}

export const onMessageListener = () => {
  if (!messaging) return Promise.resolve()

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}

// Storage helpers
export const uploadToFirebase = async (file: File, path: string) => {
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
  
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  
  return {
    url: downloadURL,
    path: snapshot.ref.fullPath,
    size: snapshot.totalBytes,
  }
}

export const deleteFromFirebase = async (path: string) => {
  const { ref, deleteObject } = await import('firebase/storage')
  
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

// Firestore helpers
export const createDocument = async (collection: string, data: any, id?: string) => {
  const { doc, setDoc, addDoc, collection: firestoreCollection } = await import('firebase/firestore')
  
  if (id) {
    const docRef = doc(db, collection, id)
    await setDoc(docRef, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data }
  } else {
    const collectionRef = firestoreCollection(db, collection)
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: docRef.id, ...data }
  }
}

export const updateDocument = async (collection: string, id: string, data: any) => {
  const { doc, updateDoc } = await import('firebase/firestore')
  
  const docRef = doc(db, collection, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date(),
  })
}

export const deleteDocument = async (collection: string, id: string) => {
  const { doc, deleteDoc } = await import('firebase/firestore')
  
  const docRef = doc(db, collection, id)
  await deleteDoc(docRef)
}

export const getDocument = async (collection: string, id: string) => {
  const { doc, getDoc } = await import('firebase/firestore')
  
  const docRef = doc(db, collection, id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() }
  }
  return null
}

export const getDocuments = async (collection: string, queries: any[] = []) => {
  const { collection: firestoreCollection, getDocs, query } = await import('firebase/firestore')
  
  const collectionRef = firestoreCollection(db, collection)
  const q = queries.length > 0 ? query(collectionRef, ...queries) : collectionRef
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export const subscribeToDocument = (collection: string, id: string, callback: (data: any) => void) => {
  const { doc, onSnapshot } = require('firebase/firestore')
  
  const docRef = doc(db, collection, id)
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    } else {
      callback(null)
    }
  })
}

export const subscribeToCollection = (collection: string, queries: any[] = [], callback: (data: any[]) => void) => {
  const { collection: firestoreCollection, onSnapshot, query } = require('firebase/firestore')
  
  const collectionRef = firestoreCollection(db, collection)
  const q = queries.length > 0 ? query(collectionRef, ...queries) : collectionRef
  
  return onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(docs)
  })
}

// Analytics helpers
export const logEvent = (eventName: string, parameters?: any) => {
  if (analytics && typeof window !== 'undefined') {
    const { logEvent: firebaseLogEvent } = require('firebase/analytics')
    firebaseLogEvent(analytics, eventName, parameters)
  }
}

export const setUserProperties = (properties: any) => {
  if (analytics && typeof window !== 'undefined') {
    const { setUserProperties: firebaseSetUserProperties } = require('firebase/analytics')
    firebaseSetUserProperties(analytics, properties)
  }
}

// Real-time database helpers for live features
export const createRealtimeConnection = (path: string, callback: (data: any) => void) => {
  return subscribeToDocument(path, '', callback)
}

export const sendRealtimeUpdate = async (path: string, data: any) => {
  await updateDocument(path, '', data)
}

export { app, analytics, messaging }