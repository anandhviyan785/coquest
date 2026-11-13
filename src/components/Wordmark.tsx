/** The plain-text CoQuest name used inside the app. */
export function Wordmark({ size = 30 }: { size?: number }) {
  return <span className="font-extrabold lowercase leading-none tracking-tight text-blue" style={{ fontSize: size }}>coquest</span>
}
