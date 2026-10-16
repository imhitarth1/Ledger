import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'

const getToday = () => new Date().toISOString().split('T')[0]
const formatINR = (val) => `₹${Math.abs(val).toLocaleString('en-IN')}`


const CATEGORY_COLORS = [
  '#7777FF', // Brand purple
  '#ec4899', // Pink expense
  '#a855f7', // Violet
  '#38bdf8', // Sky cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#fb923c'  // Orange
]

function getCategoryColor(index) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

function DonutChart({ data, totalExpense }) {
  const [hoveredSlice, setHoveredSlice] = useState(null)

  const size = 260
  const center = size / 2
  const radius = 95
  const strokeWidth = 34
  const circumference = 2 * Math.PI * radius

  const donutData = useMemo(() => {
    const result = data.reduce((acc, item) => {
      const percent = item.amount / totalExpense
      const strokeDasharray = `${percent * circumference} ${circumference}`
      const strokeDashoffset = -acc.runningPercent * circumference
      acc.items.push({ ...item, percent, strokeDasharray, strokeDashoffset })
      acc.runningPercent += percent
      return acc
    }, { items: [], runningPercent: 0 })
    return result.items
  }, [data, totalExpense, circumference])

  if (totalExpense === 0 || data.length === 0) {
    return (
      <div className="analytics-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <p className="analytics-empty-title">No spending data</p>
        <p className="analytics-empty-desc">Add expense transactions to see your category breakdown.</p>
      </div>
    )
  }

  return (
    <div className="donut-chart-container">
      <div className="donut-svg-wrapper">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
          {donutData.map((item) => {
            const isHovered = hoveredSlice === item.category

            return (
              <circle
                key={item.category}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={item.strokeDasharray}
                strokeDashoffset={item.strokeDashoffset}
                className="donut-segment"
                onMouseEnter={() => setHoveredSlice(item.category)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            )
          })}
        </svg>
        <div className="donut-center-info">
          {hoveredSlice ? (
            (() => {
              const current = data.find(d => d.category === hoveredSlice)
              return (
                <>
                  <span className="donut-center-label">{current?.category}</span>
                  <span className="donut-center-value">{formatINR(current?.amount || 0)}</span>
                  <span className="donut-center-percent">
                    {Math.round(((current?.amount || 0) / totalExpense) * 100)}%
                  </span>
                </>
              )
            })()
          ) : (
            <>
              <span className="donut-center-label">Total Spent</span>
              <span className="donut-center-value">{formatINR(totalExpense)}</span>
              <span className="donut-center-percent">{data.length} categories</span>
            </>
          )}
        </div>
      </div>

      <div className="chart-legend">
        {data.map((item) => (
          <div
            key={item.category}
            className={`legend-item ${hoveredSlice === item.category ? 'highlighted' : ''}`}
            onMouseEnter={() => setHoveredSlice(item.category)}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div className="legend-bullet" style={{ backgroundColor: item.color }} />
            <div className="legend-info">
              <span className="legend-name" title={item.category}>{item.category}</span>
              <span className="legend-amount">{formatINR(item.amount)}</span>
            </div>
            <span className="legend-pct">
              {Math.round((item.amount / totalExpense) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthlyBarChart({ data }) {
  const [hoveredBar, setHoveredBar] = useState(null)

  const hasAnyExpense = data.some(m => m.expense > 0)

  if (!hasAnyExpense) {
    return (
      <div className="analytics-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <p className="analytics-empty-title">No recent monthly expense data</p>
        <p className="analytics-empty-desc">Add expense transactions across months to see your monthly spending trend.</p>
      </div>
    )
  }

  const svgWidth = 460
  const svgHeight = 220
  const paddingBottom = 32
  const paddingTop = 20
  const chartHeight = svgHeight - paddingBottom - paddingTop
  const maxExpense = Math.max(...data.map(d => d.expense), 1)

  const barCount = data.length
  const gap = 20
  const barWidth = Math.min(48, Math.max(28, (svgWidth - gap * (barCount + 1)) / barCount))
  const totalOccupiedWidth = barCount * barWidth + (barCount - 1) * gap
  const startX = (svgWidth - totalOccupiedWidth) / 2

  return (
    <div className="bar-chart-container">
      <div className="bar-svg-wrapper">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bar-svg" preserveAspectRatio="xMidYMid meet">
          {/* Subtle grid lines */}
          <line x1="10" y1={paddingTop} x2={svgWidth - 10} y2={paddingTop} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1="10" y1={paddingTop + chartHeight / 2} x2={svgWidth - 10} y2={paddingTop + chartHeight / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1="10" y1={svgHeight - paddingBottom} x2={svgWidth - 10} y2={svgHeight - paddingBottom} stroke="rgba(255,255,255,0.12)" />

          {data.map((item, index) => {
            const x = startX + index * (barWidth + gap)
            const barH = item.expense > 0 ? Math.max(4, (item.expense / maxExpense) * chartHeight) : 0
            const y = svgHeight - paddingBottom - barH
            const isHovered = hoveredBar === item.key

            return (
              <g
                key={item.key}
                className="bar-group"
                onMouseEnter={() => setHoveredBar(item.key)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Background hover hit target */}
                <rect
                  x={x - gap / 4}
                  y={paddingTop}
                  width={barWidth + gap / 2}
                  height={chartHeight + paddingBottom}
                  fill="transparent"
                />

                {item.expense > 0 ? (
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barH}
                    rx="6"
                    fill={isHovered ? 'var(--purple-primary)' : 'rgba(119, 119, 255, 0.7)'}
                    className="chart-bar"
                  />
                ) : (
                  <line
                    x1={x + 4}
                    y1={svgHeight - paddingBottom}
                    x2={x + barWidth - 4}
                    y2={svgHeight - paddingBottom}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* X axis month label */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className={`bar-label ${isHovered ? 'active' : ''}`}
                >
                  {item.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="bar-hover-summary">
        {hoveredBar ? (
          (() => {
            const current = data.find(d => d.key === hoveredBar)
            return (
              <span>
                <strong>{current?.fullLabel}:</strong> {formatINR(current?.expense || 0)} spent
              </span>
            )
          })()
        ) : (
          <span>Hover a bar to inspect monthly spending</span>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('Dashboard')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState(null)

  // Filter states
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')

  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    date: '',
    category: '',
    paymentMethod: 'UPI',
    description: ''
  })

  const [formError, setFormError] = useState('')

  const [openingBalance, setOpeningBalance] = useState(() => {
    const STORAGE_KEY = 'midnight_finance_opening_balance'
    const DEFAULT_OPENING_BALANCE = 2120450
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_OPENING_BALANCE
  })

  const [settingsOpeningBalanceInput, setSettingsOpeningBalanceInput] = useState(() => openingBalance.toString())
  const [settingsMessage, setSettingsMessage] = useState('')
  const [restoreFileError, setRestoreFileError] = useState('')
  const [pendingRestoreData, setPendingRestoreData] = useState(null)

  const validateBackupData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return 'Invalid JSON object format.'
    }
    if (typeof data.schemaVersion !== 'string' || !data.schemaVersion.trim()) {
      return 'Missing or invalid schema version.'
    }
    if (typeof data.openingBalance !== 'number' || !isFinite(data.openingBalance) || isNaN(data.openingBalance) || data.openingBalance < 0) {
      return 'Invalid opening balance value.'
    }
    if (!Array.isArray(data.transactions)) {
      return 'Invalid or missing transactions list.'
    }

    for (let i = 0; i < data.transactions.length; i++) {
      const tx = data.transactions[i]
      if (!tx || typeof tx !== 'object' || Array.isArray(tx)) {
        return `Transaction at index ${i} is invalid.`
      }
      if (typeof tx.id !== 'string' && typeof tx.id !== 'number') {
        return `Transaction at index ${i} has an invalid ID.`
      }
      if (typeof tx.name !== 'string' || typeof tx.category !== 'string' || typeof tx.paymentMethod !== 'string') {
        return `Transaction at index ${i} contains invalid text fields.`
      }
      if (tx.type !== 'income' && tx.type !== 'expense') {
        return `Transaction at index ${i} has an invalid type.`
      }
      if (typeof tx.rawAmount !== 'number' || !isFinite(tx.rawAmount) || isNaN(tx.rawAmount) || tx.rawAmount <= 0) {
        return `Transaction at index ${i} has an invalid amount.`
      }
      if (typeof tx.date !== 'string' || !tx.date.trim()) {
        return `Transaction at index ${i} has an invalid date.`
      }
    }

    return null
  }

  const handleFileChange = (e) => {
    setRestoreFileError('')
    setSettingsMessage('')
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        const error = validateBackupData(parsed)
        if (error) {
          setRestoreFileError(`Backup validation failed: ${error}`)
          return
        }
        setPendingRestoreData(parsed)
      } catch {
        setRestoreFileError('Invalid JSON file format.')
      }
    }
    reader.onerror = () => {
      setRestoreFileError('Failed to read file.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return
    const { openingBalance: newOpeningBalance, transactions: newTransactions } = pendingRestoreData
    setOpeningBalance(newOpeningBalance)
    setSettingsOpeningBalanceInput(newOpeningBalance.toString())
    setTransactions(newTransactions)
    setPendingRestoreData(null)
    setRestoreFileError('')
    setSettingsMessage('Data restored successfully from backup.')
  }

  useEffect(() => {
    try {
      localStorage.setItem('midnight_finance_opening_balance', openingBalance.toString())
    } catch {
      // Ignore
    }
  }, [openingBalance])

  const [transactions, setTransactions] = useState(() => {
    const STORAGE_KEY = 'midnight_finance_transactions'
    const INITIAL_TRANSACTIONS = [
      {
        id: 1,
        name: 'Starlight Design Corp',
        category: 'Freelance',
        paymentMethod: 'Bank Transfer',
        date: '2026-10-24',
        displayDate: '24 Oct 2026',
        rawAmount: 350000,
        amount: '₹3,50,000',
        type: 'income'
      },
      {
        id: 2,
        name: 'Nebula Cloud Services',
        category: 'Infrastructure',
        paymentMethod: 'Credit Card',
        date: '2026-10-22',
        displayDate: '22 Oct 2026',
        rawAmount: 12400,
        amount: '₹12,400',
        type: 'expense'
      }
    ]
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } catch {
      // Fallback to initial state if parsing fails
    }
    return INITIAL_TRANSACTIONS
  })

  useEffect(() => {
    try {
      localStorage.setItem('midnight_finance_transactions', JSON.stringify(transactions))
    } catch {
      // Ignore storage write errors
    }
  }, [transactions])

  const handleExportBackup = useCallback(() => {
    const backupData = {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      openingBalance,
      transactions
    }
    const jsonStr = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `midnight-finance-backup-${getToday()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [openingBalance, transactions])

  // Real Financial Calculations (Always based on ALL transactions)
  const selectedYearMonth = '2026-10' // Active month context matching "October 2026"

  const totalIncomeAllTime = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0)

  const totalExpenseAllTime = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0)

  const totalBalance = openingBalance + totalIncomeAllTime - totalExpenseAllTime

  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date && t.date.startsWith(selectedYearMonth))
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0)

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.date && t.date.startsWith(selectedYearMonth))
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0)

  // Category expense data for Donut chart (excluding income)
  const categoryExpenseData = useMemo(() => {
    const map = {}
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Other'
        map[cat] = (map[cat] || 0) + (t.rawAmount || 0)
      })

    const arr = Object.keys(map).map((cat, idx) => ({
      category: cat,
      amount: map[cat],
      color: getCategoryColor(idx)
    }))

    arr.sort((a, b) => b.amount - a.amount)
    return arr
  }, [transactions])

  // Recent monthly totals for Bar chart (excluding income, past 6 months)
  const [today] = useState(() => new Date())
  const recentMonthlyData = useMemo(() => {
    const result = []
    // Generate past 6 months including current month
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const yearMonth = `${year}-${month}`
      const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      const fullLabel = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

      const expenseSum = transactions
        .filter(t => t.type === 'expense' && t.date && t.date.startsWith(yearMonth))
        .reduce((sum, t) => sum + (t.rawAmount || 0), 0)

      result.push({
        key: yearMonth,
        label,
        fullLabel,
        expense: expenseSum
      })
    }
    return result
  }, [transactions, today])

  const handleOpenModal = (tx = null) => {
    if (tx) {
      setEditingId(tx.id)
      setFormData({
        type: tx.type,
        amount: tx.rawAmount ? tx.rawAmount.toString() : '',
        date: tx.date || getToday(),
        category: tx.category,
        paymentMethod: tx.paymentMethod || 'UPI',
        description: tx.name
      })
    } else {
      setEditingId(null)
      setFormData({
        type: 'income',
        amount: '',
        date: getToday(),
        category: '',
        paymentMethod: 'UPI',
        description: ''
      })
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormError('')
  }

  const handleSubmitTransaction = (e) => {
    e.preventDefault()
    const numericAmount = parseFloat(formData.amount)
    if (!formData.amount || isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive amount.')
      return
    }
    if (!formData.category.trim() || !formData.description.trim()) {
      setFormError('Please fill in all required fields.')
      return
    }

    const formattedDate = new Date(formData.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    const formattedAmount = `₹${numericAmount.toLocaleString('en-IN')}`
    const finalAmount = formData.type === 'income' ? `+${formattedAmount}` : `-${formattedAmount}`

    if (editingId) {
      setTransactions(transactions.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            name: formData.description.trim(),
            category: formData.category.trim(),
            paymentMethod: formData.paymentMethod,
            date: formData.date,
            displayDate: formattedDate,
            rawAmount: numericAmount,
            amount: finalAmount,
            type: formData.type
          }
        }
        return t
      }))
    } else {
      const newTx = {
        id: Date.now(),
        name: formData.description.trim(),
        category: formData.category.trim(),
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        displayDate: formattedDate,
        rawAmount: numericAmount,
        amount: finalAmount,
        type: formData.type
      }
      setTransactions([newTx, ...transactions])
    }

    handleCloseModal()
  }

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setTransactions(transactions.filter(t => t.id !== deletingId))
      setDeletingId(null)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (filterCategory.trim() && !tx.category.toLowerCase().includes(filterCategory.trim().toLowerCase())) return false
    if (filterDate && tx.date !== filterDate) return false
    return true
  })

  const exportSelectedTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (exportStartDate && tx.date < exportStartDate) return false
      if (exportEndDate && tx.date > exportEndDate) return false
      if (filterType !== 'all' && tx.type !== filterType) return false
      if (filterCategory.trim() && !tx.category.toLowerCase().includes(filterCategory.trim().toLowerCase())) return false
      if (filterDate && tx.date !== filterDate) return false
      return true
    })
  }, [transactions, exportStartDate, exportEndDate, filterType, filterCategory, filterDate])

  const handleExportCSV = () => {
    // 1. Calculate opening net effect of all transactions strictly before exportStartDate
    let runningBalance = openingBalance
    if (exportStartDate) {
      transactions.forEach(tx => {
        if (tx.date && tx.date < exportStartDate) {
          if (tx.type === 'income') {
            runningBalance += (tx.rawAmount || 0)
          } else if (tx.type === 'expense') {
            runningBalance -= (tx.rawAmount || 0)
          }
        }
      })
    }

    // 2. Index all transactions in range chronologically (dates oldest-first, same-date oldest-entered-first)
    const inRangeAll = transactions.filter(tx => {
      if (exportStartDate && tx.date < exportStartDate) return false
      if (exportEndDate && tx.date > exportEndDate) return false
      return true
    })

    const sortedInRangeAll = [...inRangeAll].reverse().sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return 0
    })

    // 3. Process each transaction in the selected date range chronologically to update running balance
    // Map transaction id/ref to calculated balance and keep track of export candidates
    const calculatedBalances = new Map()
    sortedInRangeAll.forEach(tx => {
      if (tx.type === 'income') {
        runningBalance += (tx.rawAmount || 0)
      } else if (tx.type === 'expense') {
        runningBalance -= (tx.rawAmount || 0)
      }
      calculatedBalances.set(tx, runningBalance)
    })

    // 4. Filter only transactions matching active filters
    const exportCandidateSet = new Set(exportSelectedTransactions)
    const sortedExportCandidates = sortedInRangeAll.filter(tx => exportCandidateSet.has(tx))

    const isTypeOrCategoryActive = (filterType !== 'all') || Boolean(filterCategory.trim())

    const headers = [
      'Date',
      'Transaction ID',
      'Type',
      'Payment Method',
      'Category',
      'Description',
      'Debit (INR)',
      'Credit (INR)'
    ]
    if (!isTypeOrCategoryActive) {
      headers.push('Running Balance (INR)')
    }

    const escapeCSV = (field) => {
      if (field === null || field === undefined) return ''
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = sortedExportCandidates.map(tx => {
      const debit = tx.type === 'expense' ? tx.rawAmount : ''
      const credit = tx.type === 'income' ? tx.rawAmount : ''
      const txRunningBalance = calculatedBalances.has(tx) ? calculatedBalances.get(tx) : ''

      const row = [
        escapeCSV(tx.date),
        escapeCSV(tx.id),
        escapeCSV(tx.type),
        escapeCSV(tx.paymentMethod),
        escapeCSV(tx.category),
        escapeCSV(tx.name),
        escapeCSV(debit),
        escapeCSV(credit)
      ]
      if (!isTypeOrCategoryActive) {
        row.push(escapeCSV(txRunningBalance))
      }

      return row.join(',')
    })

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-export-${getToday()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-container">
      {/* Collapsible Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon">L</div>
            <span className="logo-text">Ledger</span>
          </div>
          <button 
            className="collapse-btn" 
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle Sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={collapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}></polyline>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {['Dashboard', 'Transactions', 'Analytics', 'Settings'].map((item) => (
            <button
              key={item}
              className={`nav-item ${activeTab === item ? 'active' : ''}`}
              onClick={() => setActiveTab(item)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item === 'Dashboard' && <rect x="3" y="3" width="7" height="9" rx="1"></rect>}
                {item === 'Dashboard' && <rect x="14" y="3" width="7" height="5" rx="1"></rect>}
                {item === 'Dashboard' && <rect x="14" y="12" width="7" height="9" rx="1"></rect>}
                {item === 'Dashboard' && <rect x="3" y="16" width="7" height="5" rx="1"></rect>}

                {item === 'Transactions' && <line x1="12" y1="1" x2="12" y2="23"></line>}
                {item === 'Transactions' && <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>}

                {item === 'Analytics' && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>}

                {item === 'Settings' && <circle cx="12" cy="12" r="3"></circle>}
                {item === 'Settings' && <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>}
              </svg>
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Ledger</h1>
          </div>
          <div className="header-right">
            <div className="month-badge">October 2026</div>
            <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Transaction</button>
          </div>
        </header>

        <main className="dashboard-body">
          {activeTab === 'Settings' ? (
            <section className="transactions-section">
              <div className="section-header">
                <h2>Settings</h2>
              </div>
              <div className="modal-form" style={{ background: 'transparent', padding: '0', maxWidth: '500px' }}>
                {settingsMessage && <div className="form-error" style={{ color: settingsMessage.includes(' successfully') ? '#10b981' : undefined }}>{settingsMessage}</div>}
                {restoreFileError && <div className="form-error">{restoreFileError}</div>}
                
                <div className="form-group">
                  <label htmlFor="opening-balance-input">Opening Balance (INR ₹)</label>
                  <input 
                    id="opening-balance-input"
                    type="number" 
                    step="any"
                    placeholder="e.g. 2120450"
                    value={settingsOpeningBalanceInput}
                    onChange={(e) => {
                      setSettingsOpeningBalanceInput(e.target.value)
                      setSettingsMessage('')
                    }}
                  />
                </div>
                <div className="modal-actions" style={{ justifyContent: 'flex-start', marginBottom: '2rem' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => {
                      const val = parseFloat(settingsOpeningBalanceInput)
                      if (isNaN(val) || val < 0) {
                        setSettingsMessage('Please enter a valid non-negative amount.')
                        return
                      }
                      setOpeningBalance(val)
                      setSettingsMessage('Opening Balance updated successfully.')
                    }}
                  >
                    Save Opening Balance
                  </button>
                </div>

                <div className="form-group" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
                  <label>Backup & Restore</label>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem' }}>
                    Export your transactions and balance to a JSON backup file or restore from an existing backup.
                  </p>
                  <div className="modal-actions" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={handleExportBackup}
                    >
                      Export Backup (JSON)
                    </button>
                    <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: 0 }}>
                      Restore from Backup
                      <input 
                        type="file" 
                        accept=".json,application/json" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>
          ) : activeTab === 'Analytics' ? (
            <div className="analytics-view-container">
              <section className="transactions-section">
                <div className="section-header">
                  <h2>Expense Breakdown by Category</h2>
                </div>
                <DonutChart data={categoryExpenseData} totalExpense={totalExpenseAllTime} />
              </section>

              <section className="transactions-section">
                <div className="section-header">
                  <h2>Recent Monthly Expense Trend</h2>
                </div>
                <MonthlyBarChart data={recentMonthlyData} />
              </section>
            </div>
          ) : activeTab === 'Transactions' ? (
            <section className="transactions-section">
              <div className="section-header">
                <h2>All Transactions</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
                  <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Transaction</button>
                </div>
              </div>

              <div className="filters-bar">
                <div className="filter-item">
                  <label htmlFor="filter-type">Type</label>
                  <select 
                    id="filter-type"
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label htmlFor="filter-category">Category</label>
                  <input 
                    id="filter-category"
                    type="text" 
                    placeholder="Filter category..."
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  />
                </div>

                <div className="filter-item">
                  <label htmlFor="filter-date">Date</label>
                  <input 
                    id="filter-date"
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                <div className="filter-item">
                  <label htmlFor="export-start-date">Export Start Date</label>
                  <input 
                    id="export-start-date"
                    type="date" 
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                  />
                </div>

                <div className="filter-item">
                  <label htmlFor="export-end-date">Export End Date</label>
                  <input 
                    id="export-end-date"
                    type="date" 
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                  />
                </div>

                {(filterType !== 'all' || filterCategory || filterDate || exportStartDate || exportEndDate) && (
                  <button 
                    className="btn-clear-filters"
                    onClick={() => {
                      setFilterType('all')
                      setFilterCategory('')
                      setFilterDate('')
                      setExportStartDate('')
                      setExportEndDate('')
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="transactions-list">
                {filteredTransactions.length === 0 ? (
                  <div className="no-transactions">No transactions match the selected filters.</div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div key={tx.id} className="transaction-item">
                      <div className="transaction-left">
                        <div className={`transaction-icon ${tx.type}`}>
                          {tx.type === 'income' ? '↓' : '↑'}
                        </div>
                        <div className="transaction-info">
                          <span className="transaction-name">{tx.name}</span>
                          <span className="transaction-date">{tx.category} • {tx.paymentMethod} • {tx.displayDate}</span>
                        </div>
                      </div>
                      
                      <div className="transaction-right">
                        <div className={`transaction-amount ${tx.type}`}>
                          {tx.amount}
                        </div>
                        <div className="transaction-actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => handleOpenModal(tx)}
                            aria-label="Edit transaction"
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => setDeletingId(tx.id)}
                            aria-label="Delete transaction"
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <>
              {/* Cards Grid */}
              <div className="cards-grid">
                <div className="card">
                  <div className="card-header">
                    <span>Total Balance</span>
                    <div className="card-icon balance">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                  </div>
                  <div className="card-value">{formatINR(totalBalance)}</div>
                  <div className="card-subtext">Net calculated balance</div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span>Monthly Income</span>
                    <div className="card-icon income">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    </div>
                  </div>
                  <div className="card-value">{formatINR(monthlyIncome)}</div>
                  <div className="card-subtext">Received this month</div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span>Monthly Expenses</span>
                    <div className="card-icon expense">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                    </div>
                  </div>
                  <div className="card-value">{formatINR(monthlyExpenses)}</div>
                  <div className="card-subtext">Spent this month</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <section className="transactions-section">
                <div className="section-header">
                  <h2>Recent Transactions</h2>
                  <a href="#view-all" className="view-all" onClick={(e) => { e.preventDefault(); setActiveTab('Transactions'); }}>View All</a>
                </div>

                <div className="transactions-list">
                  {transactions.slice(0, 5).length === 0 ? (
                    <div className="no-transactions">No transactions found.</div>
                  ) : (
                    transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div className="transaction-left">
                          <div className={`transaction-icon ${tx.type}`}>
                            {tx.type === 'income' ? '↓' : '↑'}
                          </div>
                          <div className="transaction-info">
                            <span className="transaction-name">{tx.name}</span>
                            <span className="transaction-date">{tx.category} • {tx.paymentMethod} • {tx.displayDate}</span>
                          </div>
                        </div>
                        
                        <div className="transaction-right">
                          <div className={`transaction-amount ${tx.type}`}>
                            {tx.amount}
                          </div>
                          <div className="transaction-actions">
                            <button 
                              className="action-btn edit"
                              onClick={() => handleOpenModal(tx)}
                              aria-label="Edit transaction"
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button 
                              className="action-btn delete"
                              onClick={() => setDeletingId(tx.id)}
                              aria-label="Delete transaction"
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="modal-close" onClick={handleCloseModal} aria-label="Close modal">×</button>
            </div>
            
            <form onSubmit={handleSubmitTransaction} className="modal-form">
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label htmlFor="tx-type">Type</label>
                <select 
                  id="tx-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tx-amount">Amount (INR ₹)</label>
                <input 
                  id="tx-amount"
                  type="number" 
                  step="any"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tx-date">Date</label>
                <input 
                  id="tx-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tx-category">Category</label>
                <input 
                  id="tx-category"
                  type="text"
                  placeholder="e.g. Freelance, Food, Utilities"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tx-payment">Payment Method</label>
                <select 
                  id="tx-payment"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tx-desc">Description</label>
                <input 
                  id="tx-desc"
                  type="text"
                  placeholder="e.g. Client Web Project Payment"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Add Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {pendingRestoreData && (
        <div className="modal-overlay" onClick={() => setPendingRestoreData(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Restore</h2>
              <button className="modal-close" onClick={() => setPendingRestoreData(null)} aria-label="Close modal">×</button>
            </div>
            <p className="confirm-message">
              Are you sure you want to restore from backup? This will replace all current transactions ({transactions.length}) and opening balance ({formatINR(openingBalance)}) with {pendingRestoreData.transactions?.length || 0} transactions and an opening balance of {formatINR(pendingRestoreData.openingBalance || 0)}.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setPendingRestoreData(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleConfirmRestore}>Confirm Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="modal-close" onClick={() => setDeletingId(null)} aria-label="Close modal">×</button>
            </div>
            <p className="confirm-message">Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeletingId(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
