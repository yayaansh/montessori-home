import { useEffect, useState } from 'react'
import type { Album, AlbumId } from '../../data/types'
import { ALBUM_IDS, flatten, loadAlbum, loadAllAlbums, type FlatNode } from '../../data/albums'

export function useAlbum(id: AlbumId | undefined) {
  const [album, setAlbum] = useState<Album | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!id || !ALBUM_IDS.includes(id)) {
      setError('Unknown album')
      return
    }
    let alive = true
    setAlbum(null)
    loadAlbum(id)
      .then((a) => alive && setAlbum(a))
      .catch((e) => alive && setError(String(e)))
    return () => {
      alive = false
    }
  }, [id])
  const flat = album ? flatten(album) : null
  return { album, flat, error }
}

export function useAllAlbums() {
  const [albums, setAlbums] = useState<Album[] | null>(null)
  useEffect(() => {
    let alive = true
    loadAllAlbums().then((a) => alive && setAlbums(a))
    return () => {
      alive = false
    }
  }, [])
  return albums
}

export function useNode(nodeId: string | undefined) {
  const albumId = nodeId ? (nodeId.split('.')[0] as AlbumId) : undefined
  const { album, flat, error } = useAlbum(albumId)
  const entry: FlatNode | undefined = flat && nodeId ? flat.byId.get(nodeId) : undefined
  return { album, flat, entry, error: error ?? (flat && !entry ? 'Lesson not found' : null) }
}
