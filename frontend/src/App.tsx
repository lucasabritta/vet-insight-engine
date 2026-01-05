import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState<string>('Loading...')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        const data = await response.json()
        setStatus(`API Status: ${data.status}`)
      } catch (error) {
        setStatus('API is not available')
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Vet Insight Engine
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Document Processing for Veterinary Records
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-center text-blue-900 font-medium">{status}</p>
        </div>
      </div>
    </div>
  )
}

export default App
