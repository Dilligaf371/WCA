import { useState, useEffect, useMemo } from 'react'
import './AnimatedBackground.css'

interface AnimatedBackgroundProps {
  images: string[]
  interval?: number // in milliseconds, default 5000 (5 seconds)
}

type ZoomDirection = 'zoom-in' | 'zoom-out'

export default function AnimatedBackground({ images, interval = 5000 }: AnimatedBackgroundProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Generate random zoom directions for each image (zoom-in or zoom-out)
  const zoomDirections = useMemo<ZoomDirection[]>(() => {
    return images.map(() => (Math.random() > 0.5 ? 'zoom-in' : 'zoom-out'))
  }, [images])

  useEffect(() => {
    if (images.length === 0) return

    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [images.length, interval])

  if (images.length === 0) {
    return null
  }

  // Preload images to avoid flickering
  useEffect(() => {
    images.forEach((image) => {
      const img = new Image()
      img.src = image
    })
  }, [images])

  return (
    <div className="animated-background">
      {images.map((image, index) => (
        <div
          key={index}
          className={`background-image ${index === currentImageIndex ? 'active' : ''} ${zoomDirections[index]}`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
    </div>
  )
}
