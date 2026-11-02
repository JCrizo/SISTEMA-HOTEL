import { Component } from 'react'

// Evita la pantalla en blanco: si una pantalla falla, muestra un aviso con reintento.
export default class LimiteErrores extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error en pantalla:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex items-center justify-center p-4 py-16">
        <div className="card p-6 max-w-md text-center">
          <h2 className="text-lg font-black text-gray-800 mb-1">Algo salió mal en esta pantalla</h2>
          <p className="text-sm text-gray-500 mb-5">El resto del sistema sigue funcionando. Puedes reintentar o volver al inicio.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary" onClick={() => this.setState({ error: null })}>Reintentar</button>
            <button className="btn btn-primary" onClick={() => { window.location.href = '/' }}>Ir al inicio</button>
          </div>
        </div>
      </div>
    )
  }
}
