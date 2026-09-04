import React, { useState, useEffect } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// --- Storage Utilities ---
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const load = (k, def) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : def } catch { return def } }

const App = () => {
  const [costs, setCosts] = useState(load('driver-costs', []))
  const [daily, setDaily] = useState(load('driver-daily', []))
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [kmInit, setKmInit] = useState('')
  const [kmFinal, setKmFinal] = useState('')
  const [uber, setUber] = useState('')
  const [pop99, setPop99] = useState('')
  const [hours, setHours] = useState('')
  const [expenses, setExpenses] = useState('')

  useEffect(() => save('driver-costs', costs), [costs])
  useEffect(() => save('driver-daily', daily), [daily])

  const kmRodado = (parseFloat(kmFinal) || 0) - (parseFloat(kmInit) || 0)
  const grossRev = (parseFloat(uber) || 0) + (parseFloat(pop99) || 0)
  const dailyExp = parseFloat(expenses) || 0
  const totalCosts = costs.reduce((s, c) => s + (c.amount || 0), 0) + dailyExp
  const netProfit = grossRev - totalCosts
  const profitPerKm = kmRodado > 0 ? (netProfit / kmRodado) : 0
  const profitPerHour = parseFloat(hours) ? (netProfit / parseFloat(hours)) : 0

  const handleAddDay = () => {
    if (!kmInit || !kmFinal || !uber || !pop99 || !hours) return
    const newDay = {
      id: Date.now(),
      date,
      kmInitial: parseFloat(kmInit),
      kmFinal: parseFloat(kmFinal),
      kmRodado,
      revenueUber: parseFloat(uber),
      revenue99: parseFloat(pop99),
      revenueTotal: grossRev,
      workedHours: parseFloat(hours),
      expenses: dailyExp,
      notes: ''
    }
    setDaily([...daily, newDay])
    setKmInit(''); setKmFinal(''); setUber(''); setPop99(''); setHours(''); setExpenses('')
  }

  const exportCSV = () => {
    const rows = [['Data', 'KM Inicial', 'KM Final', 'Rodado', 'Uber', '99', 'Total', 'Horas', 'Despesas', 'Lucro']]
    daily.forEach(d => {
      rows.push([d.date, d.kmInitial, d.kmFinal, d.kmRodado, d.revenueUber, d.revenue99, d.revenueTotal, d.workedHours, d.expenses, (d.revenueTotal - d.expenses).toFixed(2)])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'driver-control.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-800 text-white p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">🚗 Controlador de Motorista</h1>
        <p className="text-blue-200">Uber / 99 — Controle pessoal 100% privado no navegador</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs md:text-sm text-blue-300">
          <span className="bg-blue-900/50 px-3 py-1 rounded-full">LocalStorage Privado</span>
          <span className="bg-blue-900/50 px-3 py-1 rounded-full">Offline Ready</span>
          <span className="bg-blue-900/50 px-3 py-1 rounded-full">PWA Mobile</span>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-900/40 backdrop-blur rounded-2xl p-5 border border-blue-700/30">
          <p className="text-xs text-blue-200">Faturamento Bruto</p>
          <p className="text-2xl font-extrabold">R$ {grossRev.toFixed(2)}</p>
        </div>
        <div className="bg-blue-900/40 backdrop-blur rounded-2xl p-5 border border-blue-700/30">
          <p className="text-xs text-blue-200">Lucro Líquido</p>
          <p className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-green-300' : 'text-red-400'}`}>R$ {netProfit.toFixed(2)}</p>
        </div>
        <div className="bg-blue-900/40 backdrop-blur rounded-2xl p-5 border border-blue-700/30">
          <p className="text-xs text-blue-200">KM Rodado (hoje)</p>
          <p className="text-2xl font-extrabold">{kmRodado.toFixed(0)} km</p>
        </div>
        <div className="bg-blue-900/40 backdrop-blur rounded-2xl p-5 border border-blue-700/30">
          <p className="text-xs text-blue-200">Lucro / KM</p>
          <p className="text-2xl font-extrabold">R$ {profitPerKm.toFixed(2)}</p>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="max-w-6xl mx-auto mb-8 bg-blue-900/30 backdrop-blur rounded-2xl border border-blue-700/30 p-6">
        <h2 className="text-xl font-bold mb-4">📊 Lançar Novo Dia</h2>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-blue-950/50 border border-blue-700/40 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="KM Inicial" value={kmInit} onChange={e => setKmInit(e.target.value)} className="bg-blue-950/50 border border-blue-700/40 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="KM Final" value={kmFinal} onChange={e => setKmFinal(e.target.value)} className="bg-blue-950/50 border border-blue-700/40 rounded-lg px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="Fatur. Uber (R$)" value={uber} onChange={e => setUber(e.target.value)} className="bg-blue-950/50 border border-blue-700/40 rounded-lg px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="Fatur. 99 (R$)" value={pop99} onChange={e => setPop99(e.target.value)} className="bg-blue-950/50 border border-blue-700/40 rounded-lg px-3 py-2 text-sm" />
          <input type="number" step="0.1" placeholder="Horas" value={hours} onChange={e => setHours(e.target.value)} className="bg-blue-950/50 border border-blue-700/40 rounded-lg px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="Despesas (R$)" value={expenses} onChange={e => setExpenses(e.target.value)} className="bg-blue-950/50 border border-blue-700/40 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleAddDay} className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-2 rounded-xl transition shadow-lg shadow-blue-900/20">+ Adicionar Dia</button>
          <button onClick={exportCSV} className="bg-blue-800/60 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-xl transition border border-blue-700/40">📥 Exportar CSV</button>
        </div>
      </div>

      {/* Recent Records */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">📅 Registros Recentes</h2>
        <div className="bg-blue-900/20 backdrop-blur rounded-2xl border border-blue-700/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-800/40 text-blue-100">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">KM Inicial</th>
                <th className="text-left px-4 py-3">KM Final</th>
                <th className="text-left px-4 py-3">Rodado</th>
                <th className="text-left px-4 py-3">Uber</th>
                <th className="text-left px-4 py-3">99</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Lucro</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {daily.slice(-10).reverse().map(d => (
                <tr key={d.id} className="border-t border-blue-800/20 hover:bg-blue-800/20 transition">
                  <td className="px-4 py-2">{format(parseISO(d.date), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2">{d.kmInitial}</td>
                  <td className="px-4 py-2">{d.kmFinal}</td>
                  <td className="px-4 py-2">{d.kmRodado}</td>
                  <td className="px-4 py-2">R$ {d.revenueUber.toFixed(2)}</td>
                  <td className="px-4 py-2">R$ {d.revenue99.toFixed(2)}</td>
                  <td className="px-4 py-2 font-semibold">R$ {d.revenueTotal.toFixed(2)}</td>
                  <td className={`px-4 py-2 font-bold ${((d.revenueTotal - d.expenses) >= 0) ? 'text-green-300' : 'text-red-400'}`}>R$ {(d.revenueTotal - d.expenses).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => { setDaily(daily.filter(x => x.id !== d.id)) }} className="text-red-400 hover:text-red-300">✗</button>
                  </td>
                </tr>
              ))}
              {daily.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-blue-300">Nenhum registro ainda. Comece adicionando um dia acima.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Metrics Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 rounded-2xl p-5 border border-green-700/30">
            <h3 className="font-bold text-green-200">Meta Semanal</h3>
            <p className="text-3xl font-extrabold text-green-300 mt-2">R$ 500,00</p>
            <p className="text-xs text-green-400 mt-1">{Math.round((netProfit / 500) * 100) >= 100 ? 'Meta atingida ✅' : `Progresso: ${Math.round((netProfit / 500) * 100)}%`}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 rounded-2xl p-5 border border-blue-700/30">
            <h3 className="font-bold text-blue-200">KM Médio / Lucro</h3>
            <p className="text-3xl font-extrabold text-blue-300 mt-2">R$ {profitPerKm.toFixed(2)}</p>
            <p className="text-xs text-blue-400 mt-1">Por km rodado</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 rounded-2xl p-5 border border-purple-700/30">
            <h3 className="font-bold text-purple-200">Lucro / Hora</h3>
            <p className="text-3xl font-extrabold text-purple-300 mt-2">R$ {profitPerHour.toFixed(2)}</p>
            <p className="text-xs text-purple-400 mt-1">Por hora trabalhada</p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/30 rounded-2xl p-5 border border-amber-700/30">
            <h3 className="font-bold text-amber-200">Total Dias</h3>
            <p className="text-3xl font-extrabold text-amber-300 mt-2">{daily.length}</p>
            <p className="text-xs text-amber-400 mt-1">Registros no período</p>
          </div>
        </div>
      </div>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-blue-300/60 text-sm">
        <p>Controlador de Motorista — Todos os dados são privados e armazenados apenas no navegador.</p>
        <p className="mt-1">Nenhuma informação é enviada para servidores externos.</p>
      </footer>
    </div>
  )
}

export default App
