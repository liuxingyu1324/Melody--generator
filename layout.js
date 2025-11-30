export const metadata = {
  title: 'AI音乐生成器',
  description: '智能调式识别与音乐生成工具',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui' }}>
        {children}
      </body>
    </html>
  )
}
