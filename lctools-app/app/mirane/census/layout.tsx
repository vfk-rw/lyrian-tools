import React from "react"

export const metadata = {
  title: "Census",
}

export default function CensusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}