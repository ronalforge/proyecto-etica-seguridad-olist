import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const appearance = window.matchMedia('(prefers-color-scheme: dark)')
const applyAppearance = () => document.documentElement.classList.toggle('dark', appearance.matches)
applyAppearance()
appearance.addEventListener('change', applyAppearance)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
