export const metadata = {
  title: 'AI旋律画布',
  description: '智能音乐生成平台',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        {children}
      </body>
    </html>
  )
}
