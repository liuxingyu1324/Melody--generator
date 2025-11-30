export const metadata = {
  title: 'AI旋律画布',
  description: '智能音乐生成平台',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh" style={{
      margin: 0,
      padding: 0,
      height: '100%'
    }}>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {children}
      </body>
    </html>
  )
}
