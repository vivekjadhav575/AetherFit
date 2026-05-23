import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/firestore'

import type { AppSnapshot } from '@/types/models'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean)
}

let app: firebase.app.App | null = null

function initializeCompatApp(config: typeof firebaseConfig) {
  return firebase.apps.length ? firebase.app() : firebase.initializeApp(config)
}

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) return null
  if (!app) app = initializeCompatApp(firebaseConfig)
  return app
}

export function isFirebaseAvailable() {
  return Boolean(getFirebaseApp())
}

export function getFirebaseAuth() {
  const instance = getFirebaseApp()
  return instance ? instance.auth() : null
}

export function getFirebaseStore() {
  const instance = getFirebaseApp()
  return instance ? instance.firestore() : null
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase is not configured.')
  const provider = new firebase.auth.GoogleAuthProvider()
  const result = await auth.signInWithPopup(provider)
  return result.user ?? null
}

export async function signOutGoogle() {
  const auth = getFirebaseAuth()
  if (!auth) return
  await auth.signOut()
}

export function watchAuthState(callback: (user: firebase.User | null) => void) {
  const auth = getFirebaseAuth()
  if (!auth) {
    callback(null)
    return () => undefined
  }
  return auth.onAuthStateChanged(callback)
}

export async function fetchCloudSnapshot(uid: string) {
  const store = getFirebaseStore()
  if (!store) return null
  const snapshotDoc = await store.collection('fitnessUsers').doc(uid).get()
  return snapshotDoc.exists ? ((snapshotDoc.data()?.snapshot as AppSnapshot | undefined) ?? null) : null
}

export async function writeCloudSnapshot(uid: string, snapshot: AppSnapshot) {
  const store = getFirebaseStore()
  if (!store) throw new Error('Firebase is not configured.')
  await store.collection('fitnessUsers').doc(uid).set({ snapshot }, { merge: true })
}
