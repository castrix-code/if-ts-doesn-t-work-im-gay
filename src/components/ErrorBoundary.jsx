import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-white px-6">
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-4">{this.state.error?.message || 'Unknown error'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
