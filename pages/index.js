import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [carouselIndex, setCarouselIndex] = useState({})
  const [unlocked, setUnlocked] = useState({})
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetchPosts()
    const saved = JSON.parse(localStorage.getItem('unlocked_posts') || '{}')
    setUnlocked(saved)
  }, [])

  async function fetchPosts() {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, photos(*)')
      .order('created_at', { ascending: false })

    if (postsData) {
      const sorted = postsData.map(p => ({
        ...p,
        photos: (p.photos || []).sort((a, b) => a.position - b.position)
      }))
      setPosts(sorted)
    }
    setLoading(false)
  }

  function getPhotoUrl(url) {
    if (url.startsWith('http')) return url
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${url}`
  }

  function slide(postId, dir) {
    const post = posts.find(p => p.id === postId)
    const current = carouselIndex[postId] || 0
    const next = Math.max(0, Math.min(post.photos.length - 1, current + dir))
    const photo = post.photos[next]
    if (photo?.is_locked && !unlocked[postId]) {
      setModal(post)
      return
    }
    setCarouselIndex(prev => ({ ...prev, [postId]: next }))
  }

  async function handleUnlock() {
    if (!modal || paying) return
    setPaying(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: modal.id, price: modal.price, caption: modal.caption })
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      alert('Erreur de paiement')
    }
    setPaying(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      const postId = params.get('post')
      if (postId) {
        const newUnlocked = { ...JSON.parse(localStorage.getItem('unlocked_posts') || '{}'), [postId]: true }
        localStorage.setItem('unlocked_posts', JSON.stringify(newUnlocked))
        setUnlocked(newUnlocked)
        setCarouselIndex(prev => ({ ...prev, [postId]: 1 }))
      }
      window.history.replaceState({}, '', '/')
    }
  }, [])

  return (
    <>
      <Head>
        <title>Victoria Babolat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">
        <div className="hero">
          <div className="hero-gradient" />
          <div className="hero-overlay" />
        </div>

        <div className="profile">
          <div className="avatar">V</div>
          <h1 className="name">Victoria Babolat</h1>
          <p className="bio">Welcome to my exclusive content 💋</p>
          <div className="profile-actions">
            <button className="btn-sub">Subscribe</button>
          </div>
        </div>

        <div className="posts-label">
          <span>{posts.length} posts</span>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : posts.length === 0 ? (
          <div className="empty">Aucun post pour l'instant</div>
        ) : (
          <div className="posts">
            {posts.map(post => {
              const idx = carouselIndex[post.id] || 0
              const isUnlocked = unlocked[post.id]
              const photos = post.photos || []

              return (
                <div key={post.id} className="post">
                  <div className="post-header">
                    <div className="post-avatar">V</div>
                    <span className="post-username">Victoria Babolat</span>
                  </div>

                  <div className="carousel">
                    {photos.length === 0 ? (
                      <div className="no-photo">Aucune photo</div>
                    ) : (
                      <>
                        <div className="slides-container">
                          {photos.map((photo, i) => {
                            const shouldBlur = photo.is_locked && !isUnlocked
                            return (
                              <div
                                key={photo.id}
                                className="slide"
                                style={{ transform: `translateX(${(i - idx) * 100}%)` }}
                              >
                                <img
                                  src={getPhotoUrl(photo.url)}
                                  alt=""
                                  className={shouldBlur ? 'blurred' : ''}
                                />
                                {shouldBlur && (
                                  <div className="lock-overlay">
                                    <button className="btn-unlock" onClick={() => setModal(post)}>
                                      🔒 Unlock for €{post.price}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {photos.length > 1 && (
                          <>
                            <button className="nav-btn prev" onClick={() => slide(post.id, -1)}>‹</button>
                            <button className="nav-btn next" onClick={() => slide(post.id, 1)}>›</button>
                            <div className="dots">
                              {photos.map((_, i) => (
                                <div key={i} className={`dot ${i === idx ? 'active' : ''}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

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
              <p className="modal-sub">Accès à toutes les photos de ce set</p>
              <div className="modal-price">€{modal.price}</div>
              <button className="btn-pay" onClick={handleUnlock} disabled={paying}>
                {paying ? 'Redirection...' : '💳 Payer par carte'}
              </button>
              <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #080808; color: #fff; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <style jsx>{`
        .app { max-width: 480px; margin: 0 auto; min-height: 100vh; }

        .hero { height: 260px; position: relative; overflow: hidden; }
        .hero-gradient { position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 40%, #3d1a4e 0%, #1a0a2e 50%, #080808 100%); }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, #080808 100%); }

        .profile { padding: 0 20px 20px; margin-top: -60px; position: relative; z-index: 2; }
        .avatar { width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, #c850c0, #4158d0); border: 3px solid #080808; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 600; margin-bottom: 14px; }
        .name { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 6px; }
        .bio { font-size: 14px; color: rgba(255,255,255,0.55); font-weight: 300; margin-bottom: 18px; }
        .profile-actions { display: flex; gap: 10px; }
        .btn-sub { flex: 1; padding: 13px; background: #fff; color: #080808; border: none; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; letter-spacing: 0.05em; }

        .posts-label { padding: 12px 20px; font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; text-transform: uppercase; border-top: 0.5px solid rgba(255,255,255,0.08); }

        .loading { display: flex; justify-content: center; padding: 60px; }
        .spinner { width: 28px; height: 28px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3); font-size: 14px; }

        .post { margin-bottom: 1px; }
        .post-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; }
        .post-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #c850c0, #4158d0); display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 600; flex-shrink: 0; }
        .post-username { font-size: 13px; font-weight: 500; }

        .carousel { position: relative; width: 100%; aspect-ratio: 4/5; background: #111; overflow: hidden; }
        .slides-container { position: relative; width: 100%; height: 100%; }
        .slide { position: absolute; inset: 0; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .slide img { width: 100%; height: 100%; object-fit: cover; }
        .slide img.blurred { filter: blur(24px); transform: scale(1.08); }
        .no-photo { display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.2); font-size: 13px; }

        .lock-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .btn-unlock { background: rgba(255,255,255,0.92); color: #080808; border: none; border-radius: 50px; padding: 12px 22px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; backdrop-filter: blur(4px); }

        .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.85); border: none; cursor: pointer; font-size: 20px; line-height: 1; display: flex; align-items: center; justify-content: center; color: #080808; z-index: 5; }
        .prev { left: 10px; }
        .next { right: 10px; }

        .dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; z-index: 5; }
        .dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.3); transition: background 0.2s; }
        .dot.active { background: #fff; }

        .post-footer { padding: 10px 16px 16px; }
        .caption { font-size: 13px; color: rgba(255,255,255,0.55); font-weight: 300; }

        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .modal { background: #141414; border-radius: 20px 20px 0 0; padding: 20px 20px 40px; width: 100%; max-width: 480px; }
        .modal-handle { width: 36px; height: 3px; background: rgba(255,255,255,0.15); border-radius: 2px; margin: 0 auto 20px; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; margin-bottom: 6px; }
        .modal-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
        .modal-price { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 600; margin-bottom: 24px; }
        .btn-pay { width: 100%; padding: 15px; background: #fff; color: #080808; border: none; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; margin-bottom: 10px; }
        .btn-pay:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel { width: 100%; padding: 12px; background: none; border: none; color: rgba(255,255,255,0.35); font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; }
      `}</style>
    </>
  )
}
