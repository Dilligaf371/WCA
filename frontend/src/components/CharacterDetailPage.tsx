import { useState, useEffect } from 'react'
import axios from 'axios'
import './CharacterDetailPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface CharacterDetail {
  id: string
  name: string
  class: string
  level: number
  race: string | null
  background: string | null
  alignment: string | null
  baseStats: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  derivedStats: {
    hp: number
    ac: number
    speed: number
    initiative: number
    proficiency: number
  }
  equipment: Array<{
    name: string
    quantity: number
    equipped: boolean
  }>
  spells?: Array<{
    name: string
    level: number
    school?: string
  }>
  syncStatus: string
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

interface CharacterDetailPageProps {
  characterId: string
  onBack: () => void
}

export default function CharacterDetailPage({ characterId, onBack }: CharacterDetailPageProps) {
  const [character, setCharacter] = useState<CharacterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCharacter()
  }, [characterId])

  const fetchCharacter = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_URL}/characters/${characterId}`)
      setCharacter(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement de la fiche')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="character-detail-page">
        <div className="loading-state">Chargement...</div>
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="character-detail-page">
        <button onClick={onBack} className="back-button">← Retour</button>
        <div className="error-banner">{error || 'Personnage non trouvé'}</div>
      </div>
    )
  }

  const getModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  return (
    <div className="character-detail-page">
      <header className="detail-header">
        <button onClick={onBack} className="back-button">
          ← Retour
        </button>
        <h1>{character.name}</h1>
        <div className="character-title">
          <span className="level-badge">Niveau {character.level}</span>
          {character.race && <span>{character.race}</span>}
          <span>{character.class}</span>
        </div>
      </header>

      <main className="detail-main">
        <div className="detail-grid">
          {/* Caractéristiques */}
          <section className="detail-section">
            <h2>Caractéristiques</h2>
            <div className="stats-grid-detail">
              <div className="stat-card">
                <div className="stat-name">FORCE</div>
                <div className="stat-score">{character.baseStats.str}</div>
                <div className="stat-modifier">{getModifier(character.baseStats.str)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-name">DEXTÉRITÉ</div>
                <div className="stat-score">{character.baseStats.dex}</div>
                <div className="stat-modifier">{getModifier(character.baseStats.dex)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-name">CONSTITUTION</div>
                <div className="stat-score">{character.baseStats.con}</div>
                <div className="stat-modifier">{getModifier(character.baseStats.con)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-name">INTELLIGENCE</div>
                <div className="stat-score">{character.baseStats.int}</div>
                <div className="stat-modifier">{getModifier(character.baseStats.int)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-name">SAGESSE</div>
                <div className="stat-score">{character.baseStats.wis}</div>
                <div className="stat-modifier">{getModifier(character.baseStats.wis)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-name">CHARISME</div>
                <div className="stat-score">{character.baseStats.cha}</div>
                <div className="stat-modifier">{getModifier(character.baseStats.cha)}</div>
              </div>
            </div>
          </section>

          {/* Statistiques de combat */}
          <section className="detail-section">
            <h2>Statistiques de combat</h2>
            <div className="combat-stats-detail">
              <div className="combat-stat-card">
                <div className="combat-label">Points de vie</div>
                <div className="combat-value-large">{character.derivedStats.hp}</div>
              </div>
              <div className="combat-stat-card">
                <div className="combat-label">Classe d'armure</div>
                <div className="combat-value-large">{character.derivedStats.ac}</div>
              </div>
              <div className="combat-stat-card">
                <div className="combat-label">Vitesse</div>
                <div className="combat-value">{character.derivedStats.speed} pi</div>
              </div>
              <div className="combat-stat-card">
                <div className="combat-label">Initiative</div>
                <div className="combat-value">{getModifier(character.derivedStats.initiative)}</div>
              </div>
              <div className="combat-stat-card">
                <div className="combat-label">Bonus de maîtrise</div>
                <div className="combat-value">+{character.derivedStats.proficiency}</div>
              </div>
            </div>
          </section>

          {/* Équipement */}
          {character.equipment && character.equipment.length > 0 && (
            <section className="detail-section">
              <h2>Équipement</h2>
              <div className="equipment-list">
                {character.equipment.map((item, index) => (
                  <div key={index} className={`equipment-item ${item.equipped ? 'equipped' : ''}`}>
                    <span className="item-name">{item.name}</span>
                    {item.quantity > 1 && <span className="item-quantity">x{item.quantity}</span>}
                    {item.equipped && <span className="equipped-badge">Équipé</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sorts */}
          {character.spells && character.spells.length > 0 && (
            <section className="detail-section">
              <h2>Sorts</h2>
              <div className="spells-list">
                {character.spells.map((spell, index) => (
                  <div key={index} className="spell-item">
                    <div className="spell-name">{spell.name}</div>
                    <div className="spell-details">
                      Niveau {spell.level}
                      {spell.school && ` • ${spell.school}`}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Informations générales */}
          <section className="detail-section">
            <h2>Informations</h2>
            <div className="info-list">
              {character.background && (
                <div className="info-item">
                  <span className="info-label">Historique:</span>
                  <span className="info-value">{character.background}</span>
                </div>
              )}
              {character.alignment && (
                <div className="info-item">
                  <span className="info-label">Alignement:</span>
                  <span className="info-value">{character.alignment}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Statut:</span>
                <span className="info-value">{character.syncStatus}</span>
              </div>
              {character.lastSyncAt && (
                <div className="info-item">
                  <span className="info-label">Dernière synchronisation:</span>
                  <span className="info-value">
                    {new Date(character.lastSyncAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
