import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpeakWise Real - Pitch Coach',
  description: 'AI-powered pitch and communication coach',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

