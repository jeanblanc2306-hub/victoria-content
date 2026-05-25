import Head from "next/head"
import { useEffect, useState } from "react"

export default function Home() {
  const [timer, setTimer] = useState(900)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((s) => (s <= 1 ? 900 : s - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const minutes = String(Math.floor(timer / 60)).padStart(2, "0")
  const seconds = String(timer % 60).padStart(2, "0")

  return (
    <>
      <Head>
        <title>Victoria Babolat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          background: "#080808",
          color: "white",
          fontFamily: "Arial, sans-serif",
          maxWidth: "480px",
          margin: "0 auto",
          paddingBottom: "100px",
        }}
      >
        <section
          style={{
            height: "260px",
            background:
              "radial-gradient(ellipse at 60% 40%, #3d1a4e 0%, #1a0a2e 50%, #080808 100%)",
          }}
        />

        <section
          style={{
            padding: "0 20px 20px",
            marginTop: "-55px",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c850c0, #4158d0)",
              border: "3px solid #080808",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: "bold",
              marginBottom: "14px",
            }}
          >
            V
          </div>

          <h1 style={{ fontSize: "26px", margin: "0 0 6px" }}>
            Victoria Babolat
          </h1>

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
            Welcome to my exclusive content 💋
          </p>
        </section>

        <div
          style={{
            padding: "12px 20px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          0 posts
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Aucun post pour l&apos;instant
        </div>

        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "440px",
            background: "linear-gradient(135deg, #ff4e00, #ec9f05)",
            borderRadius: "16px",
            padding: "14px 16px",
            boxShadow: "0 4px 24px rgba(255,78,0,0.45)",
          }}
        >
          <strong>🔥 Offre flash — toutes les photos à 1€</strong>

          <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.85 }}>
            Se termine dans{" "}
            <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>
              {minutes}:{seconds}
            </span>
          </div>
        </div>
      </main>
    </>
  )
}
