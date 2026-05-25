import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import Head from "next/head"

function useCountdown() {
  const [seconds, setSeconds] = useState(900)
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s <= 1 ? 900 : s - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  const m = String(Math.floor(seconds / 60)).padStart(2, "0")
  const s = String(seconds % 60).padStart(2, "0")
  return m + ":" + s
}

function PromoBanner() {
  const [minimized, setMinimized] = useState(false)
  const timer = useCountdown()

  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #ff4e00, #ec9f05)", borderRadius: "30px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", zIndex: 999, boxShadow: "0 4px 20px rgba(255,78,0,0.4)" }}
      >
        <span style={{ fontSize: "14px" }}>🔥</span>
        <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px", fontFamily: "monospace" }}>{timer}</span>
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "440px", background: "linear-gradient(135deg, #ff4e00, #ec9f05)", borderRadius: "16px", padding: "14px 16px", zIndex: 999, boxShadow: "0 4px 24px rgba(255,78,0,0.45)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>🔥</span>
          <div>
            <div style={{ color: "#fff", fontWeight: "700", fontSize: "14px", lineHeight: 1.2 }}>Offre flash — toutes les photos a 1€</div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", marginTop: "2px" }}>
              Se termine dans <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "13px" }}>{timer}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMinimized(true)}
          style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "14px", flexShrink: 0 }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState({ name: "Victoria Babolat", bio: "Welcome to my exclusive content 💋", avatar_url: null, banner_url: null })
  const [carouselIndex, setCarouselIndex] = useState({})
  const [unlocked, setUnlocked] = useState({})
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetchPosts()
    fetchProfile()
    const saved = JSON.parse(localStorage.getItem("unlocked_posts") || "{}")
    setUnlocked(saved)
  }, [])

  async function fetchProfile() {
    const { data } = await supabase.from("profile").select("*").single()
    if (data) setProfile(data)
  }

  async function fetchPosts() {
    const { data } = await supabase.from("posts").select("*, photos(*)").order("created_at", { ascending: false })
    if (data) {
      setPosts(data.map(p => ({ ...p, photos: (p.photos || []).sort((a, b) => a.position - b.position) })))
    }
    setLoading(false)
  }

  function getUrl(url) {
    if (!url) return null
    if (url.startsWith("http")) return url
    return process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/photos/" + url
  }

  async function handleUnlock() {
    if (!modal || paying) return
    setPaying(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: modal.id, price: modal.price, caption: modal.caption })
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) { alert("Erreur de paiement") }
    setPaying(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "1") {
      const postId = params.get("post")
      if (postId) {
        const saved = JSON.parse(localStorage.getItem("unlocked_posts") || "{}")
        const newUnlocked = { ...saved, [postId]: true }
        localStorage.setItem("unlocked_posts", JSON.stringify(newUnlocked))
        setUnlocked(newUnlocked)
      }
      window.history.replaceState({}, "", "/")
    }
  }, [])

  const avatarUrl = getUrl(profile.avatar_url)
  const bannerUrl = getUrl(profile.banner_url)

  return (
    <>
      <Head>
        <title>{profile.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">
        <div className="hero">
          {bannerUrl ? <img src={bannerUrl} alt="banner" className="hero-img" /> : <div className="hero-gradient" />}
          <div className="hero-overlay" />
        </div>

        <div className="profile">
          <div className="avatar">
            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : profile.name[0]}
          </div>
          <h1 className="name">{profile.name}</h1>
          <p className="bio">{profile.bio}</p>
        </div>

        <div className="posts-label"><span>{posts.length} posts</span></div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty">Aucun post pour l instant</div>
        ) : (
          <div className="posts">
            {posts.map(post => {
              const idx = carouselIndex[post.id] || 0
              const isUnlocked = unlocked[post.id]
              const photos = post.photos || []
              return (
                <div key={post.id} className="post">
                  <div className="post-header">
                    <div className="post-avatar">
                      {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : profile.name[0]}
                    </div>
                    <span className="post-username">{profile.name}</span>
                  </div>
                  <Carousel
                    photos={photos}
                    idx={idx}
                    isUnlocked={isUnlocked}
                    getUrl={getUrl}
                    onSlide={(next) => setCarouselIndex(prev => ({ ...prev, [post.id]: next }))}
                    onUnlock={() => setModal(post)}
                    price={post.price}
                  />
                  <div className="post-footer">
                    <p className="caption">{post.caption}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modal && (
          <div className="modal-bg" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h2 className="modal-title">Unlock this post</h2>
              <p className="modal-sub">Acces a toutes les photos de ce set</p>
              <div className="modal-price">€{modal.price}</div>
              <button className="btn-pay" onClick={handleUnlock} disabled={paying}>
                {paying ? "Redirection..." : "Payer par carte"}
              </button>
              <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
            </div>
          </div>
        )}

        <PromoBanner />
      </div>

      <style jsx global>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #080808; color: #fff; font-family: sans-serif; }`}</style>
      <style jsx>{`
        .app { max-width: 480px; margin: 0 auto; min-height: 100vh; padding-bottom: 80px; }
        .hero { height: 260px; position: relative; overflow: hidden; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; }
        .hero-gradient { position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 40%, #3d1a4e 0%, #1a0a2e 50%, #080808 100%); }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, #080808 100%); }
        .profile { padding: 0 20px 20px; margin-top: -60px; position: relative; z-index: 2; }
        .avatar { width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, #c850c0, #4158d0); border: 3px solid #080808; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 600; margin-bottom: 14px; overflow: hidden; }
        .name { font-size: 26px; font-weight: 600; margin-bottom: 6px; }
        .bio { font-size: 14px; color: rgba(255,255,255,0.55); margin-bottom: 18px; white-space: pre-line; }
        .posts-label { padding: 12px 20px; font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; text-transform: uppercase; border-top: 0.5px solid rgba(255,255,255,0.08); }
        .loading { display: flex; justify-content: center; padding: 60px; }
        .spinner { width: 28px; height: 28px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3); font-size: 14px; }
        .post { margin-bottom: 1px; }
        .post-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; }
        .post-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #c850c0, #4158d0); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; overflow: hidden; }
        .post-username { font-size: 13px; font-weight: 500; }
        .post-footer { padding: 10px 16px 16px; }
        .caption { font-size: 13px; color: rgba(255,255,255,0.55); }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
        .modal { background: #141414; border-radius: 20px 20px 0 0; padding: 20px 20px 40px; width: 100%; max-width: 480px; }
        .modal-handle { width: 36px; height: 3px; background: rgba(255,255,255,0.15); border-radius: 2px; margin: 0 auto 20px; }
        .modal-title { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
        .modal-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
        .modal-price { font-size: 38px; font-weight: 600; margin-bottom: 24px; }
        .btn-pay { width: 100%; padding: 15px; background: #fff; color: #080808; border: none; border-radius: 14px; font-size: 15px; font-weight: 500; cursor: pointer; margin-bottom: 10px; }
        .btn-pay:disabled { opacity: 0.6; }
        .btn-cancel { width: 100%; padding: 12px; background: none; border: none; color: rgba(255,255,255,0.35); font-size: 14px; cursor: pointer; }
      `}</style>
    </>
  )
}

function Carousel({ photos, idx, isUnlocked, getUrl, onSlide, onUnlock, price }) {
  const touchStart = useRef(null)
  const touchEnd = useRef(null)

  function onTouchStart(e) { touchStart.current = e.targetTouches[0].clientX }
  function onTouchMove(e) { touchEnd.current = e.targetTouches[0].clientX }
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

  if (photos.length === 0) return null

  return (
    <div
      style={{ position: "relative", width: "100%", aspectRatio: "4/5", background: "#111", overflow: "hidden", userSelect: "none", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {photos.map((photo, i) => {
        const shouldBlur = photo.is_locked && !isUnlocked
        return (
          <div key={photo.id} style={{ position: "absolute", inset: 0, transition: "transform 0.3s ease", transform: "translateX(" + ((i - idx) * 100) + "%)" }}>
            <img
              src={getUrl(photo.url)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: shouldBlur ? "blur(14px)" : "none", transform: shouldBlur ? "scale(1.05)" : "none" }}
            />
            {shouldBlur && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)" }}>
                <button onClick={onUnlock} style={{ background: "rgba(255,255,255,0.92)", color: "#080808", border: "none", borderRadius: "50px", padding: "12px 22px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
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
            <button onClick={() => onSlide(idx - 1)} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", zIndex: 5 }}>&#8249;</button>
          )}
          {idx < photos.length - 1 && (
            <button onClick={() => onSlide(idx + 1)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", zIndex: 5 }}>&#8250;</button>
          )}
          <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", zIndex: 5 }}>
            {photos.map((_, i) => (
              <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,0.3)", transition: "background 0.2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}        localStorage.setItem("unlocked_posts", JSON.stringify(newUnlocked))
        setUnlocked(newUnlocked)
      }
      window.history.replaceState({}, "", "/")
    }
  }, [])

  const avatarUrl = getUrl(profile.avatar_url)
  const bannerUrl = getUrl(profile.banner_url)

  return (
    <>
      <Head>
        <title>{profile.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">
        <div className="hero">
          {bannerUrl ? <img src={bannerUrl} alt="banner" className="hero-img" /> : <div className="hero-gradient" />}
          <div className="hero-overlay" />
        </div>

        <div className="profile">
          <div className="avatar">
            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : profile.name[0]}
          </div>
          <h1 className="name">{profile.name}</h1>
          <p className="bio">{profile.bio}</p>
        </div>

        <div className="posts-label"><span>{posts.length} posts</span></div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty">Aucun post pour l instant</div>
        ) : (
          <div className="posts">
            {posts.map(post => {
              const idx = carouselIndex[post.id] || 0
              const isUnlocked = unlocked[post.id]
              const photos = post.photos || []
              return (
                <div key={post.id} className="post">
                  <div className="post-header">
                    <div className="post-avatar">
                      {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : profile.name[0]}
                    </div>
                    <span className="post-username">{profile.name}</span>
                  </div>
                  <Carousel
                    photos={photos}
                    idx={idx}
                    isUnlocked={isUnlocked}
                    getUrl={getUrl}
                    onSlide={(next) => setCarouselIndex(prev => ({ ...prev, [post.id]: next }))}
                    onUnlock={() => setModal(post)}
                    price={post.price}
                  />
                  <div className="post-footer">
                    <p className="caption">{post.caption}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modal && (
          <div className="modal-bg" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h2 className="modal-title">Unlock this post</h2>
              <p className="modal-sub">Acces a toutes les photos de ce set</p>
              <div className="modal-price">€{modal.price}</div>
              <button className="btn-pay" onClick={handleUnlock} disabled={paying}>
                {paying ? "Redirection..." : "Payer par carte"}
              </button>
              <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #080808; color: #fff; font-family: sans-serif; }`}</style>
      <style jsx>{`
        .app { max-width: 480px; margin: 0 auto; min-height: 100vh; }
        .hero { height: 260px; position: relative; overflow: hidden; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; }
        .hero-gradient { position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 40%, #3d1a4e 0%, #1a0a2e 50%, #080808 100%); }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, #080808 100%); }
        .profile { padding: 0 20px 20px; margin-top: -60px; position: relative; z-index: 2; }
        .avatar { width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, #c850c0, #4158d0); border: 3px solid #080808; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 600; margin-bottom: 14px; overflow: hidden; }
        .name { font-size: 26px; font-weight: 600; margin-bottom: 6px; }
        .bio { font-size: 14px; color: rgba(255,255,255,0.55); margin-bottom: 18px; white-space: pre-line; }
        .posts-label { padding: 12px 20px; font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; text-transform: uppercase; border-top: 0.5px solid rgba(255,255,255,0.08); }
        .loading { display: flex; justify-content: center; padding: 60px; }
        .spinner { width: 28px; height: 28px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3); font-size: 14px; }
        .post { margin-bottom: 1px; }
        .post-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; }
        .post-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #c850c0, #4158d0); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; overflow: hidden; }
        .post-username { font-size: 13px; font-weight: 500; }
        .post-footer { padding: 10px 16px 16px; }
        .caption { font-size: 13px; color: rgba(255,255,255,0.55); }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
        .modal { background: #141414; border-radius: 20px 20px 0 0; padding: 20px 20px 40px; width: 100%; max-width: 480px; }
        .modal-handle { width: 36px; height: 3px; background: rgba(255,255,255,0.15); border-radius: 2px; margin: 0 auto 20px; }
        .modal-title { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
        .modal-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
        .modal-price { font-size: 38px; font-weight: 600; margin-bottom: 24px; }
        .btn-pay { width: 100%; padding: 15px; background: #fff; color: #080808; border: none; border-radius: 14px; font-size: 15px; font-weight: 500; cursor: pointer; margin-bottom: 10px; }
        .btn-pay:disabled { opacity: 0.6; }
        .btn-cancel { width: 100%; padding: 12px; background: none; border: none; color: rgba(255,255,255,0.35); font-size: 14px; cursor: pointer; }
      `}</style>
    </>
  )
}

function Carousel({ photos, idx, isUnlocked, getUrl, onSlide, onUnlock, price }) {
  const touchStart = useRef(null)
  const touchEnd = useRef(null)

  function onTouchStart(e) { touchStart.current = e.targetTouches[0].clientX }
  function onTouchMove(e) { touchEnd.current = e.targetTouches[0].clientX }
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

  if (photos.length === 0) return null

  return (
    <div
      style={{ position: "relative", width: "100%", aspectRatio: "4/5", background: "#111", overflow: "hidden", userSelect: "none", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {photos.map((photo, i) => {
        const shouldBlur = photo.is_locked && !isUnlocked
        return (
          <div key={photo.id} style={{ position: "absolute", inset: 0, transition: "transform 0.3s ease", transform: "translateX(" + ((i - idx) * 100) + "%)" }}>
            <img
              src={getUrl(photo.url)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: shouldBlur ? "blur(20px)" : "none", transform: shouldBlur ? "scale(1.03)" : "none" }}
            />
            {shouldBlur && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)" }}>
                <button onClick={onUnlock} style={{ background: "rgba(255,255,255,0.92)", color: "#080808", border: "none", borderRadius: "50px", padding: "12px 22px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
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
            <button onClick={() => onSlide(idx - 1)} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", zIndex: 5 }}>&#8249;</button>
          )}
          {idx < photos.length - 1 && (
            <button onClick={() => onSlide(idx + 1)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", zIndex: 5 }}>&#8250;</button>
          )}
          <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", zIndex: 5 }}>
            {photos.map((_, i) => (
              <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,0.3)", transition: "background 0.2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
