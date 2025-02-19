const debug = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  console.log('Query:', req.query)
  console.log('Body:', req.body)
  
  // Capture the original send
  const originalSend = res.send
  res.send = function(data) {
    console.log('Response:', data)
    return originalSend.apply(res, arguments)
  }
  
  next()
}

module.exports = debug
