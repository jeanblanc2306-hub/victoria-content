import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

export default function Admin() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState({ name: 'Victoria Babolat', bio: 'Welcome to my exclusive content 💋', avatar_url: null, banner_url: null })
  const [loading, setLoading] = useState(false)
  const [newCaption, setNewCaption] = useState('')
  const [newPrice, setNewPrice] = useState(3)
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('posts')
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)

  useEffect(() => { if (auth) { fetchPosts(); fetchProfile() } }, [auth])

  function handleLogin(e) {
    e.preventDefault()
    if (password === 'victoria2024') setAuth(true)
    else alert('Mot de passe incorrect')
  }

  async function fetchProfile() {
    const { data } = await supabase.from('profile').select('*').single()
    if (data) setProfile(data)
  }

  async function fetchPosts() {
    setLoading(true)
    const { data } = await supabase.from('posts').select('*, photos(*)').order('created_at', { ascending: false })
    if (data) setPosts(data.map(p => ({ ...p, photos: (p.photos || []).sort((a, b) => a.position - b.position) })))
    setLoading(false)
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    let updates = { name: profile.name, bio: profile.bio }

    if (avatarFile) {
      const fileName = `avatar_${Date.now()}_${avatarFile.name}`
      await supabase.storage.from('photos').upload(fileName, avatarFile)
      updates.avatar_url = fileName
    }
    if (bannerFile) {
      const fileName = `banner_${Date.now()}_${bannerFile.name}`
      await supabase.storage.from('photos').upload(fileName, bannerFile)
      updates.banner_url = fileName
    }

    await supabase.from('profile').update(updates).eq('id', 1)
    await fetchProfile()
    setAvatarFile(null)
    setBannerFile(null)
    setSavingProfile(false)
    alert('Profil sauvegardé !')
  }

  async function createPost(e) {
    e.preventDefault()
    if (!newCaption || uploadFiles.length === 0) { alert('Ajoute une caption et au moins une photo'); return }
    setUploading(true)
    const { data: post, error } = await supabase.from('posts').insert({ caption: newCaption, price: newPrice }).select().single()
    if (error) { alert('Erreur création post'); setUploading(false); return }
    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i]
      const fileName = `${post.id}_${i}_${Date.now()}_${file.name}`
      await supabase.storage.from('photos').upload(fileName, file)
      await supabase.from('photos').insert({ post_id: post.id, url: fileName, is_locked: i > 0, position: i })
    }
    setNewCaption(''); setNewPrice(3); setUploadFiles([])
    await fetchPosts()
    setUploading(false)
    setTab('posts')
  }

  async function deletePost(postId) {
    if (!confirm('Supprimer ce post ?')) return
    await supabase.from('posts').delete().eq('id', postId)
    await fetchPosts()
  }

  async function toggleLock(photoId, currentLocked) {
    await supabase.from('photos').update({ is_locked: !currentLocked }).eq('id', photoId)
    await fetchPosts()
  }

  async function deletePhoto(photoId, url) {
    await supabase.storage.from('photos').remove([url])
    await supabase.from('photos').delete().eq('id', photoId)
    await fetchPosts()
  }

  function getUrl(url) {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${url}`
  }

  const s = { input: { width: '100%', padding: '12px', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#fff', fontSize: '14px', marginBottom: '16px', outline: 'none' }, label: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' } }

  if (!auth) return (
    <>
      <Head><title>Admin</title></Head>
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <form onSubmit={handleLogin} style={{ background: '#141414', padding: '40px', borderRadius: '16px', width: '320px' }}>
          <h1 style={{ color: '#fff', fontSize: '20px', marginBottom: '24px', textAlign: 'center' }}>Admin</h1>
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} style={{ ...s.input, marginBottom: '16px' }} />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#fff', color: '#080808', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Connexion</button>
        </form>
      </div>
    </>
  )

  return (
    <>
      <Head><title>Admin — Victoria</title></Head>
      <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500' }}>Admin</h1>
          <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Voir le site</a>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['posts', 'nouveau', 'profil'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#080808' : 'rgba(255,255,255,0.5)', border: '1px solid ' + (tab === t ? '#fff' : 'rgba(255,255,255,0.15)'), borderRadius: '50px', fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'nouveau' ? '+ Nouveau post' : t === 'profil' ? '👤 Profil' : 'Mes posts'}
            </button>
          ))}
        </div>

        {tab === 'profil' && (
          <form onSubmit={saveProfile} style={{ background: '#141414', borderRadius: '16px', padding: '20px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: '400', color: 'rgba(255,255,255,0.7)' }}>Mon profil</h2>

            <label style={s.label}>Nom</label>
            <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={s.input} />

            <label style={s.label}>Bio</label>
            <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} style={{ ...s.input, resize: 'vertical' }} />

            <label style={s.label}>Photo de profil</label>
            {profile.avatar_url && <img src={getUrl(profile.avatar_url)} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px', display: 'block' }} />}
            <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ ...s.input, cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }} />

            <label style={s.label}>Bannière</label>
            {profile.banner_url && <img src={getUrl(profile.banner_url)} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />}
            <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files[0])} style={{ ...s.input, cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }} />

            <button type="submit" disabled={savingProfile} style={{ width: '100%', padding: '14px', background: savingProfile ? '#333' : '#fff', color: savingProfile ? 'rgba(255,255,255,0.4)' : '#080808', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: savingProfile ? 'not-allowed' : 'pointer' }}>
              {savingProfile ? 'Sauvegarde...' : 'Sauvegarder le profil'}
            </button>
          </form>
        )}

        {tab === 'nouveau' && (
          <form onSubmit={createPost} style={{ background: '#141414', borderRadius: '16px', padding: '20px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: '400', color: 'rgba(255,255,255,0.7)' }}>Créer un nouveau post</h2>
            <label style={s.label}>Caption</label>
            <input value={newCaption} onChange={e => setNewCaption(e.target.value)} placeholder="Description du post..." style={s.input} />
            <label style={s.label}>Prix pour débloquer (€)</label>
            <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} min="1" style={s.input} />
            <label style={s.label}>Photos (la 1ère est gratuite, les suivantes sont floutées)</label>
            <input type="file" multiple accept="image/*" onChange={e => setUploadFiles(Array.from(e.target.files))} style={{ ...s.input, cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }} />
            {uploadFiles.length > 0 && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>{uploadFiles.length} photo(s) — photo 1 visible, reste flouté</p>}
            <button type="submit" disabled={uploading} style={{ width: '100%', padding: '14px', background: uploading ? '#333' : '#fff', color: uploading ? 'rgba(255,255,255,0.4)' : '#080808', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: uploading ? 'not-allowed' : 'pointer' }}>
              {uploading ? 'Upload en cours...' : 'Publier le post'}
            </button>
          </form>
        )}

        {tab === 'posts' && (
          <div>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Chargement...</div>
            : posts.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Aucun post.</div>
            : posts.map(post => (
              <div key={post.id} style={{ background: '#141414', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontWeight: '500', marginBottom: '4px' }}>{post.caption}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>€{post.price} · {post.photos?.length || 0} photo(s)</p>
                  </div>
                  <button onClick={() => deletePost(post.id)} style={{ background: 'rgba(255,50,50,0.15)', color: '#ff6b6b', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>Supprimer</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(post.photos || []).map((photo, i) => (
                    <div key={photo.id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '2px solid ' + (photo.is_locked ? '#ff6b6b' : '#4caf50') }}>
                      <img src={getUrl(photo.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: photo.is_locked ? 'blur(4px)' : 'none' }} />
                      <div style={{ position: 'absolute', bottom: '2px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => toggleLock(photo.id, photo.is_locked)} style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }}>{photo.is_locked ? '🔒' : '🔓'}</button>
                        <button onClick={() => deletePhoto(photo.id, photo.url)} style={{ background: 'rgba(200,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                      </div>
                      <div style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '9px', color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: '3px', padding: '1px 3px' }}>{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
