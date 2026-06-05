const hfApiUrl = import.meta.env.VITE_HF_API_URL || 'http://localhost:8000'

export const checkHealth = async () => {
  try {
    const response = await fetch(`${hfApiUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to ping model API health endpoint:', error)
    return { status: 'offline', error: error.message }
  }
}

export const classifyImage = async (imageFile) => {
  try {
    const formData = new FormData()
    formData.append('file', imageFile)

    const response = await fetch(`${hfApiUrl}/classify`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Classification failed:', error)
    throw error
  }
}
