import { useState, useEffect } from 'react'
import axios from 'axios'
import AnimatedBackground from './AnimatedBackground'
import './CharactersPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface Character {
  id: string
  name: string
  class: string
  level: number
  race: string | null
  campaign?: string | null
  syncStatus: string
  lastSyncAt: string | null
  createdAt: string
  dndBeyondCharacterId?: string | null
  baseStats?: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  derivedStats?: {
    hp: number
    ac: number
    speed: number
    initiative: number
    proficiency: number
  }
  equipment?: Array<{
    name: string
    quantity: number
    equipped: boolean
  }>
}

interface CharactersPageProps {
  onBack: () => void
}

export default function CharactersPage({ onBack }: CharactersPageProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importJson, setImportJson] = useState('')
  const [importMode, setImportMode] = useState<'url' | 'json'>('url')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      console.log('[CharactersPage] Fetching characters, token exists:', !!token)
      console.log('[CharactersPage] Token preview:', token ? token.substring(0, 20) + '...' : 'none')
      const response = await axios.get(`${API_URL}/characters`)
      console.log('[CharactersPage] Response status:', response.status)
      console.log('[CharactersPage] Response data:', response.data)
      console.log('[CharactersPage] Fetched characters:', response.data.data)
      console.log('[CharactersPage] Characters count:', response.data.data?.length || 0)
      console.log('[CharactersPage] First character campaign:', response.data.data?.[0]?.campaign)
      setCharacters(response.data.data || [])
    } catch (err: any) {
      console.error('[CharactersPage] Error fetching characters:', err)
      console.error('[CharactersPage] Error status:', err.response?.status)
      console.error('[CharactersPage] Error data:', err.response?.data)
      console.error('[CharactersPage] Error headers:', err.response?.headers)
      setError(err.response?.data?.error || 'Error loading characters')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCharacter = async (characterId: string, characterName: string) => {
    if (!confirm(`Are you sure you want to delete the character "${characterName}"? This action is irreversible.`)) {
      return
    }

    try {
      await axios.delete(`${API_URL}/characters/${characterId}`)
      await fetchCharacters()
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error deleting character')
    }
  }

  const extractCharacterIdFromUrl = (url: string): string | null => {
    // D&D Beyond URL formats:
    // https://www.dndbeyond.com/profile/{username}/characters/{character_id}
    // https://www.dndbeyond.com/characters/{character_id}
    const match = url.match(/\/characters\/(\d+)/)
    return match ? match[1] : null
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Frontend] handleImport called, mode:', importMode)
    console.log('[Frontend] API_URL:', API_URL)
    setImporting(true)
    setError(null)

    try {
      if (importMode === 'json') {
        console.log('[Frontend] JSON import mode, JSON length:', importJson.length)
        // Import from JSON
        let jsonData
        try {
          jsonData = JSON.parse(importJson)
          console.log('[Frontend] JSON parsed successfully, keys:', Object.keys(jsonData))
        } catch (parseError) {
          console.error('[Frontend] JSON parse error:', parseError)
          setError('Invalid JSON. Please check the format.')
          setImporting(false)
          return
        }

        // D&D Beyond JSON can be wrapped in {success: true, data: {...}, id: ..., ...}
        // Extract the actual character ID from data.id if present, otherwise use root id
        const characterId = jsonData.data?.id || jsonData.id;
        
        if (!characterId) {
          console.error('[Frontend] No id in JSON data, keys:', Object.keys(jsonData))
          setError('The JSON must contain an "id" field with the D&D Beyond character ID (in "data.id" or at the root).')
          setImporting(false)
          return
        }

        console.log('[Frontend] Character ID found:', characterId)
        console.log('[Frontend] Sending POST request to:', `${API_URL}/characters/import`)
        console.log('[Frontend] Request payload:', {
          dndBeyondCharacterId: characterId,
          hasRawData: !!jsonData,
          rawDataKeys: Object.keys(jsonData)
        })
        const response = await axios.post(`${API_URL}/characters/import`, {
          dndBeyondCharacterId: characterId,
          rawData: jsonData,
        })

        console.log('[Frontend] Response received:', response.data)
        console.log('[Frontend] Response status:', response.status)
        console.log('[Frontend] Import success:', response.data.success)
        console.log('[Frontend] Character ID from response:', response.data.data?.characterId)

        if (response.data.success) {
          setShowImportModal(false)
          setImportJson('')
          await fetchCharacters()
        }
      } else {
        // Import from URL
        const characterId = extractCharacterIdFromUrl(importUrl)
        
        if (!characterId) {
          setError('Invalid URL. Expected format: https://www.dndbeyond.com/characters/{id}')
          setImporting(false)
          return
        }

        // Import character - backend will fetch the JSON
        const response = await axios.post(`${API_URL}/characters/import`, {
          dndBeyondCharacterId: characterId,
          characterUrl: importUrl,
        })

        if (response.data.success) {
          setShowImportModal(false)
          setImportUrl('')
          await fetchCharacters()
        }
      }
    } catch (err: any) {
      console.error('[Frontend] Import error:', err)
      console.error('[Frontend] Error response:', err.response?.data)
      console.error('[Frontend] Error status:', err.response?.status)
      setError(err.response?.data?.error || 'Error importing character')
    } finally {
      setImporting(false)
    }
  }

  // Background images - add your images to /public/backgrounds/ folder
  const backgroundImages = [
    '/backgrounds/bg1.jpg',
    '/backgrounds/bg2.jpg',
    '/backgrounds/bg3.jpg',
    '/backgrounds/bg4.jpg',
  ]

  return (
    <div className="characters-page">
      <AnimatedBackground images={backgroundImages} interval={5000} />
      <header className="characters-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h1>Characters</h1>
        <button 
          onClick={() => setShowImportModal(true)} 
          className="import-button"
        >
          + Import Character
        </button>
      </header>

      <main className="characters-main">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : characters.length === 0 ? (
          <div className="empty-state">
            <p>No characters imported</p>
            <button 
              onClick={() => setShowImportModal(true)} 
              className="primary-button"
            >
              Import your first character
            </button>
          </div>
        ) : (
          <div className="characters-grid">
            {characters.map((character) => {
              // Afficher tous les objets équipés (tous les objets avec equipped: true)
              // Pour D&D Beyond, on considère que les objets équipés sont les objets magiques/en usage
              const magicalItems = character.equipment?.filter(item => item.equipped === true) || [];
              
              // Log pour déboguer
              console.log('[CharactersPage] Character equipment:', {
                characterName: character.name,
                totalEquipment: character.equipment?.length || 0,
                magicalItemsCount: magicalItems.length,
                allEquipment: character.equipment,
                magicalItems: magicalItems
              });

              return (
                <div key={character.id} className="character-card">
                  <div className="character-header">
                    <h3>{character.name}</h3>
                    <div className="character-header-actions">
                      <span className="character-level">Level {character.level}</span>
                      <button
                        className="delete-character-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCharacter(character.id, character.name)
                        }}
                        title="Delete character"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="character-info">
                    <p><strong>Class:</strong> {character.class}</p>
                    {character.race && <p><strong>Race:</strong> {character.race}</p>}
                    <p><strong>Status:</strong> {character.syncStatus}</p>
                    {character.campaign && <p><strong>Campaign:</strong> {character.campaign}</p>}
                  </div>

                  {/* Characteristics */}
                  {character.baseStats && character.derivedStats && (
                    <div className="character-stats">
                      <div className="character-stats-section">
                        <h4>Characteristics</h4>
                        <div className="stats-grid">
                          <div className="stat-item">
                            <span className="stat-label">STR</span>
                            <span className="stat-value">{character.baseStats.str}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">DEX</span>
                            <span className="stat-value">{character.baseStats.dex}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">CON</span>
                            <span className="stat-value">{character.baseStats.con}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">INT</span>
                            <span className="stat-value">{character.baseStats.int}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">WIS</span>
                            <span className="stat-value">{character.baseStats.wis}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">CHA</span>
                            <span className="stat-value">{character.baseStats.cha}</span>
                          </div>
                        </div>
                      </div>
                      <div className="combat-stats">
                        <div className="combat-stat">
                          <span className="combat-label">HP:</span>
                          <span className="combat-value">{character.derivedStats.hp}</span>
                        </div>
                        <div className="combat-stat">
                          <span className="combat-label">AC:</span>
                          <span className="combat-value">{character.derivedStats.ac}</span>
                        </div>
                      </div>
                      
                      {/* Magical Items */}
                      {magicalItems.length > 0 && (
                        <div className="magical-items">
                          <h4>Magical Items</h4>
                          <ul className="items-list">
                            {magicalItems.map((item, index) => (
                              <li key={index}>
                                <span className="item-name">{item.name}</span>
                                {item.quantity > 1 && <span className="item-quantity"> (x{item.quantity})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    className="view-button"
                    onClick={() => {
                      if (character.dndBeyondCharacterId) {
                        window.open(`https://www.dndbeyond.com/characters/${character.dndBeyondCharacterId}`, '_blank')
                      }
                    }}
                    disabled={!character.dndBeyondCharacterId}
                  >
                    View Full Sheet
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => !importing && setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Import Character from D&D Beyond</h2>
            
            {/* Mode selector */}
            <div className="import-mode-selector">
              <button
                type="button"
                className={`mode-button ${importMode === 'url' ? 'active' : ''}`}
                onClick={() => setImportMode('url')}
                disabled={importing}
              >
                From URL
              </button>
              <button
                type="button"
                className={`mode-button ${importMode === 'json' ? 'active' : ''}`}
                onClick={() => setImportMode('json')}
                disabled={importing}
              >
                From JSON
              </button>
            </div>

            <p className="modal-description">
              {importMode === 'url' 
                ? 'Paste the D&D Beyond character sheet URL (the sheet must be public)'
                : 'Paste the character JSON exported from D&D Beyond'}
            </p>

            <form onSubmit={handleImport}>
              {importMode === 'url' ? (
                <div className="form-group">
                  <label htmlFor="character-url">Character Sheet URL</label>
                  <input
                    id="character-url"
                    type="url"
                    placeholder="https://www.dndbeyond.com/characters/12345678"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    required
                    disabled={importing}
                    className="url-input"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="character-json">Character JSON</label>
                  <textarea
                    id="character-json"
                    placeholder='{"id": "12345678", "name": "...", ...}'
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    required
                    disabled={importing}
                    className="json-textarea"
                    rows={10}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportUrl('')
                    setImportJson('')
                  }}
                  disabled={importing}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || (importMode === 'url' ? !importUrl : !importJson)}
                  className="submit-button"
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
