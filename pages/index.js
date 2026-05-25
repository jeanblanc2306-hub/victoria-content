import { useState, useEffect, useRef } from "react"
import Head from "next/head"
import { supabase } from "../lib/supabase"

export default function Home() {
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState({
    name: "Victoria Babolat",
    bio: "Welcome to my exclusive content 💋",
    avatar_url: null,
    banner_url: null,
  })
  const [carouselIndex, setCarouselIndex] = useState({})
  const [unlocked, setUnlocked] = useState({})
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetchPosts()
    fetchProfile()

    const saved = localStorage.getItem("unlocked_posts")
    if (saved) setUnlocked(JSON.parse(saved))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("success") === "1") {
      const postId = params.get("post")

      if (postId) {
        const saved = JSON.parse(localStorage.getItem("unlocked_posts") || "{}")
        const updated = { ...saved, [postId]: true }

        localStorage.setItem("unlocked_posts", JSON.stringify(updated))
        setUnlocked(updated)
      }

      window.history.replaceState({}, "", "/")
    }
  }, [])

  async function fetchProfile() {
    const { data } = await supabase.from("profile").select("*").single()
    if (data) setProfile(data)
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*, photos(*)")
      .order("created_at", { ascending: false })

    if (data) {
      setPosts(
        data.map((p) => ({
          ...p,
          photos: (p.photos || []).sort((a, b) => a.position - b.position),
        }))
      )
    }

    setLoading(false)
  }

  function getUrl(url) {
    if (!url) return null
    if (url.startsWith("http")) return url
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${url}`
  }

  async function handleUnlock() {
    if (!modal || paying) return

    setPaying(true)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: modal.id,
          price: modal.price,
          caption: modal.caption,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Erreur de paiement")
      }
    } catch {
      alert("Erreur de paiement")
    }

    setPaying(false)
  }

  const avatarUrl = getUrl(profile.avatar_url)
  const bannerUrl = getUrl(profile.banner_url)

  return (
    <>
      <Head>
        <title>{profile.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app">
        <div className="hero">
          {bannerUrl ? (
            <img src={bannerUrl} alt="banner" className="hero-img" />
          ) : (
            <div className="hero-gradient" />
          )}
          <div className="hero-overlay" />
        </div>

        <div className="profile">
          <div className="avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="round-img" />
            ) : (
              profile.name?.[0] || "V"
            )}
          </div>

          <h1>{profile.name}</h1>
          <p>{profile.bio}</p>
        </div>

        <div className="posts-label">{posts.length} posts</div>

        {loading ? (
          <div className="empty">Chargement...</div>
        ) : posts.length === 0 ? (
          <div className="empty">Aucun post pour l&apos;instant</div>
        ) : (
          posts.map((post) => {
            const idx = carouselIndex[post.id] || 0
            const isUnlocked = unlocked[post.id]

            return (
              <div key={post.id} className="post">
                <div className="post-header">
                  <div className="post-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="round-img" />
                    ) : (
                      profile.name?.[0] || "V"
                    )}
                  </div>
                  <span>{profile.name}</span>
                </div>

                <Carousel
                  photos={post.photos || []}
                  idx={idx}
                  isUnlocked={isUnlocked}
                  getUrl={getUrl}
                  price={post.price}
                  onUnlock={() => setModal(post)}
                  onSlide={(next) =>
                    setCarouselIndex((prev) => ({
                      ...prev,
                      [post.id]: next,
                    }))
                  }
                />

                <div className="caption">{post.caption}</div>
              </div>
            )
          })
        )}

        {modal && (
          <div className="modal-bg" onClick={() => setModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Unlock this post</h2>
              <p>Accès à toutes les photos de ce set</p>
              <div className="price">€{modal.price}</div>

              <button onClick={handleUnlock} disabled={paying}>
                {paying ? "Redirection..." : "Payer par carte"}
              </button>

              <button className="cancel" onClick={() => setModal(null)}>
                Annuler
              </button>
            </div>
          </div>
        )}

        <PromoBanner />
      </div>

      <style jsx>{`
        .app {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background: #080808;
          color: white;
          padding-bottom: 90px;
          font-family: Arial, sans-serif;
        }

        .hero {
          height: 260px;
          position: relative;
          overflow: hidden;
        }

        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, #3d1a4e, #080808);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 50%, #080808);
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
          overflow: hidden;
        }

        .round-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .profile h1 {
          font-size: 26px;
          margin: 14px 0 6px;
        }

        .profile p {
          color: rgba(255, 255, 255, 0.55);
          font-size: 14px;
        }

        .posts-label {
          padding: 12px 20px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .empty {
          padding: 60px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.35);
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
          overflow: hidden;
          background: linear-gradient(135deg, #c850c0, #4158d0);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .caption {
          padding: 10px 16px 16px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 480px;
          background: #141414;
          padding: 24px 20px 40px;
          border-radius: 20px 20px 0 0;
        }

        .modal h2 {
          margin-bottom: 6px;
        }

        .modal p {
          color: rgba(255, 255, 255, 0.45);
          font-size: 14px;
        }

        .price {
          font-size: 38px;
          font-weight: bold;
          margin: 20px 0;
        }

        .modal button {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: none;
          font-size: 15px;
          cursor: pointer;
        }

        .cancel {
          background: transparent !important;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 8px;
        }
      `}</style>

      <style jsx global>{`
        body {
          margin: 0;
          background: #080808;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  )
}

function Carousel({ photos, idx, isUnlocked, getUrl, onSlide, onUnlock, price }) {
  const touchStart = useRef(null)
  const touchEnd = useRef(null)

  if (!photos || photos.length === 0) return null

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
      if (diff > 0 && idx < photos.length - 1) onSlide(idx + 1)
      if (diff < 0 && idx > 0) onSlide(idx - 1)
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
        background: "#111",
        overflow: "hidden",
      }}
    >
      {photos.map((photo, i) => {
        const shouldBlur = photo.is_locked && !isUnlocked

        return (
          <div
            key={photo.id}
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${(i - idx) * 100}%)`,
              transition: "transform 0.3s ease",
            }}
          >
            <img
              src={getUrl(photo.url)}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: shouldBlur ? "blur(14px)" : "none",
                transform: shouldBlur ? "scale(1.05)" : "none",
              }}
            />

            {shouldBlur && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <button
                  onClick={onUnlock}
                  style={{
                    background: "white",
                    color: "#080808",
                    border: "none",
                    borderRadius: "50px",
                    padding: "12px 22px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Unlock for €{price}
                </button>
              </div>
            )}
          </div>
        )
      })}

      {photos.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={() => onSlide(idx - 1)}
              style={arrowStyle("left")}
            >
              ‹
            </button>
          )}

          {idx < photos.length - 1 && (
            <button
              onClick={() => onSlide(idx + 1)}
              style={arrowStyle("right")}
            >
              ›
            </button>
          )}
        </>
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
    zIndex: 5,
  }
}

function PromoBanner() {
  const [minimized, setMinimized] = useState(false)
  const [seconds, setSeconds] = useState(900)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 900 : s - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #ff4e00, #ec9f05)",
          borderRadius: 30,
          padding: "8px 16px",
          zIndex: 999,
          cursor: "pointer",
          color: "white",
          fontWeight: "bold",
        }}
      >
        🔥 {timer}
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 440,
        background: "linear-gradient(135deg, #ff4e00, #ec9f05)",
        borderRadius: 16,
        padding: 14,
        zIndex: 999,
        color: "white",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <strong>🔥 Offre flash — toutes les photos à 1€</strong>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Se termine dans <strong>{timer}</strong>
          </div>
        </div>

        <button
          onClick={() => setMinimized(true)}
          style={{
            border: "none",
            borderRadius: "50%",
            width: 26,
            height: 26,
            background: "rgba(255,255,255,0.25)",
            color: "white",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
