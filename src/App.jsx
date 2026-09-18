import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ name: '', price: '', quantity: '' })
  const [editingId, setEditingId] = useState(null)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error(await res.text())
      setProducts(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }))
    fetchProducts()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const resetForm = () => {
    setForm({ name: '', price: '', quantity: '' })
    setEditingId(null)
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      quantity: Number(form.quantity) || 0,
    }
    if (!payload.name) return
    const url = editingId ? `/api/products/${editingId}` : '/api/products'
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      resetForm()
      fetchProducts()
    } else {
      setError(await res.text())
    }
  }

  const editProduct = (p) => {
    setEditingId(p.id)
    setForm({ name: p.name, price: String(p.price), quantity: String(p.quantity) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteProduct = async (id) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    fetchProducts()
  }

  const stockLevel = (quantity) => {
    if (quantity <= 0) return { label: 'Rupture', cls: 'stock-out' }
    if (quantity < 10) return { label: 'Stock faible', cls: 'stock-low' }
    return { label: 'En stock', cls: 'stock-ok' }
  }

  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0)
  const totalUnits = products.reduce((sum, p) => sum + Number(p.quantity), 0)
  const healthOk = health?.status === 'ok'

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Gestion de produits</h1>
          <p className="subtitle">Inventaire simple, rapide et efficace</p>
        </div>
        <span className={`badge ${healthOk ? 'badge-ok' : 'badge-err'}`}>
          <span className="dot" aria-hidden="true" />
          API {healthOk ? 'connectée' : 'hors ligne'}
        </span>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span className="stat-label">Produits</span>
          <span className="stat-value">{products.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Valeur du stock</span>
          <span className="stat-value">
            {totalValue.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            })}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Articles en stock</span>
          <span className="stat-value">{totalUnits}</span>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">
          {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>
        <form onSubmit={saveProduct} className="form">
          <div className="field">
            <label htmlFor="name">Nom</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex. : Clavier mécanique"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="price">Prix (€)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="0,00"
            />
          </div>
          <div className="field">
            <label htmlFor="quantity">Quantité</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              step="1"
              min="0"
              value={form.quantity}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2 className="card-title">Produits</h2>
        {products.length === 0 ? (
          <p className="empty">
            Aucun produit pour le moment. Ajoutez votre premier produit ci-dessus.
          </p>
        ) : (
          <div className="grid">
            {products.map((p) => {
              const stock = stockLevel(Number(p.quantity))
              const total = (Number(p.price) * Number(p.quantity)).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })
              return (
                <article key={p.id} className="product">
                  <div className="product-head">
                    <span className={`chip ${stock.cls}`}>{stock.label}</span>
                    <div className="product-actions">
                      <button
                        className="icon-btn"
                        onClick={() => editProduct(p)}
                        title="Modifier"
                        aria-label={`Modifier ${p.name}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => deleteProduct(p.id)}
                        title="Supprimer"
                        aria-label={`Supprimer ${p.name}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-price">
                    {Number(p.price).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                    <span className="product-total">{total} / lot</span>
                  </p>
                  <div className="product-qty">
                    <span>Stock</span>
                    <strong>{p.quantity}</strong>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <span>Projet Examen DevOps</span>
        <span className="footer-dot">•</span>
        <span>React + Express + PostgreSQL</span>
      </footer>
    </div>
  )
}

export default App