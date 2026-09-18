import { rows } from './components/list.js'

const saved = localStorage.getItem('visits')
const visits = saved === null ? 0 : Number(saved)
localStorage.setItem('visits', String(visits + 1))

document.getElementById('app').textContent = rows(visits).join(', ')
