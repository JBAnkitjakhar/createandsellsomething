import './globals.css'

export const metadata = {
  title: 'Marketplace dApp',
  description: 'A decentralized marketplace built with Next.js and Ethereum',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}