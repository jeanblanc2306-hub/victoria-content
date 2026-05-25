import Head from "next/head"
import { useEffect, useRef, useState } from "react"

export default function Home() {
  const [timer, setTimer] = useState(900)
  const [current, setCurrent] = useState(0)

  const photos = [
    "https://picsum.photos/600/800?1",
    "https://picsum.photos/600/800?2",
    "https://picsum.photos/600/800?3",
  ]

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

      <div className="app">
        <div className="hero">
          <div className="hero-gradient" />
          <div className="hero-overlay" />
        </div>

        <div className="profile">
          <div className="avatar">V</div>

          <h1 className="name">Victoria Babolat</h1>

          <p className="bio">
            Welcome to my exclusive content 💋
          </p>
        </div>

        <div className="posts-label">
          <span>1 post</span>
        </div>

        <div className="post">
          <div className="post-header">
            <div className="post-avatar">V</div>

            <span className="post-username">
              Victoria Babolat
            </span>
          </div>

          <Carousel
            photos={photos}
            current={current}
            setCurrent={setCurrent}
          />

          <div className="post-footer">
            <p className="caption">
              Exclusive content 🔥
            </p>
          </div>
        </div>

        <div className="promo">
          <div className="promo-top">
            <div>
              <div className="promo-title">
                🔥 Offre flash — toutes les photos à 1€
              </div>

              <div className="promo-sub">
                Se termine dans{" "}
                <span className="timer">
                  {minutes}:{seconds}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .app {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background: #080808;
          color: white;
          font-family: Arial, sans-serif;
          padding-bottom: 120px;
        }

        .hero {
          height: 260px;
          position: relative;
          overflow: hidden;
        }

        .hero-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at 60% 40%,
            #3d1a4e 0%,
            #1a0a2e 50%,
            #080808 100%
          );
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 50%,
            #080808 100%
          );
        }

        .profile {
          padding: 0 20px 20px;
          margin-top: -60px;
          position: relative;
          z-index: 2;
        }

        .avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c850c0, #4158d0);
          border: 3px solid #080808;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          font-weight: bold;
          margin-bottom: 14px;
        }

        .name {
          font-size: 26px;
          margin-bottom: 6px;
        }

        .bio {
          font-size: 14px;
          color: rgba(255,255,255,0.55);
        }

        .posts-label {
          padding: 12px 20px;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
        }

        .post-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c850c0, #4158d0);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }

        .post-username {
          font-size: 13px;
          font-weight: 500;
        }

        .post-footer {
          padding: 10px 16px 16px;
        }

        .caption {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
        }

        .promo {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 440px;
          background: linear-gradient(
            135deg,
            #ff4e00,
            #ec9f05
          );
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 4px 24px rgba(255,78,0,0.45);
        }

        .promo-title {
          font-size: 14px;
          font-weight: bold;
        }

        .promo-sub {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.9;
        }

        .timer {
          font-family: monospace;
          font-weight: bold;
        }
      `}</style>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #080808;
        }
      `}</style>
    </>
  )
}

function Carousel({ photos, current, setCurrent }) {
  const touchStart = useRef(null)
  const touchEnd = useRef(null)

  function onTouchStart(e) {
    touchStart.current = e.targetTouches[0].clientX
  }

  function onTouchMove(e) {
    touchEnd.current = e.targetTouches[0].clientX
  }

  function onTouchEnd() {
    if (!touchStart.current || !touchEnd.current) return

    const diff = touchStart.current - touchEnd.current

    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < photos.length - 1) {
        setCurrent(current + 1)
      }

      if (diff < 0 && current > 0) {
        setCurrent(current - 1)
      }
    }

    touchStart.current = null
    touchEnd.current = null
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4/5",
        overflow: "hidden",
        background: "#111",
      }}
    >
      {photos.map((photo, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${(index - current) * 100}%)`,
            transition: "transform 0.3s ease",
          }}
        >
          <img
            src={photo}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ))}

      {current > 0 && (
        <button
          onClick={() => setCurrent(current - 1)}
          style={arrowStyle("left")}
        >
          ‹
        </button>
      )}

      {current < photos.length - 1 && (
        <button
          onClick={() => setCurrent(current + 1)}
          style={arrowStyle("right")}
        >
          ›
        </button>
      )}
    </div>
  )
}

function arrowStyle(side) {
  return {
    position: "absolute",
    [side]: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.85)",
    color: "#080808",
    fontSize: "24px",
    cursor: "pointer",
  }
}
