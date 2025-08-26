'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseRadius: number
  opacity: number
  baseOpacity: number
  originalX: number
  originalY: number
}

const BackgroundNodes: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let currentNodes: Node[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createNodes = () => {
      const nodeCount = isMobile ? 15 : 25
      currentNodes = []
      
      for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const baseRadius = isMobile ? Math.random() * 2 + 1 : Math.random() * 3 + 2
        const baseOpacity = Math.random() * 0.3 + 0.4
        
        currentNodes.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: baseRadius,
          baseRadius,
          opacity: baseOpacity,
          baseOpacity,
          originalX: x,
          originalY: y
        })
      }
    }

    resizeCanvas()
    createNodes()

    const handleResize = () => {
      resizeCanvas()
      createNodes()
    }
    
    window.addEventListener('resize', handleResize)

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const mouseInfluenceRadius = isMobile ? 0 : 120
      const repelForce = 50 // Force of repulsion
      
      // Get CSS custom properties for colors
      const computedStyle = getComputedStyle(document.documentElement)
      const nodeColor = computedStyle.getPropertyValue('--node-color').trim() || '#dc267f'
      const lineColor = computedStyle.getPropertyValue('--node-line-color').trim() || '#dc267f'
      
      // Update and draw nodes
      currentNodes.forEach((node, i) => {
        // Mouse interaction - repel nodes
        if (!isMobile) {
          const dx = mouseRef.current.x - node.x
          const dy = mouseRef.current.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < mouseInfluenceRadius && distance > 0) {
            // Calculate repulsion force
            const force = (mouseInfluenceRadius - distance) / mouseInfluenceRadius
            const repelX = -(dx / distance) * force * repelForce
            const repelY = -(dy / distance) * force * repelForce
            
            // Apply repulsion to velocity
            node.vx += repelX * 0.01
            node.vy += repelY * 0.01
            
            // Enhanced visual effects when mouse is near
            node.radius = node.baseRadius + force * 3
            node.opacity = Math.min(node.baseOpacity + force * 0.5, 1)
          } else {
            // Return to normal state
            node.radius += (node.baseRadius - node.radius) * 0.05
            node.opacity += (node.baseOpacity - node.opacity) * 0.05
          }
        }
        
        // Add gentle drift back to original position (reduced for more free movement)
        const returnForce = 0.0005
        const dxToOriginal = node.originalX - node.x
        const dyToOriginal = node.originalY - node.y
        node.vx += dxToOriginal * returnForce
        node.vy += dyToOriginal * returnForce
        
        // Apply less damping to maintain movement
        node.vx *= 0.995
        node.vy *= 0.995
        
        // Add small random motion for continuous drift
        node.vx += (Math.random() - 0.5) * 0.01
        node.vy += (Math.random() - 0.5) * 0.01
        
        // Update position
        node.x += node.vx
        node.y += node.vy
        
        // Bounce off edges with some damping
        if (node.x <= 0 || node.x >= canvas.width) {
          node.vx *= -0.8
          node.x = Math.max(0, Math.min(canvas.width, node.x))
        }
        if (node.y <= 0 || node.y >= canvas.height) {
          node.vy *= -0.8
          node.y = Math.max(0, Math.min(canvas.height, node.y))
        }
        
        // Draw connections
        currentNodes.forEach((otherNode, j) => {
          if (i !== j) {
            const dx = node.x - otherNode.x
            const dy = node.y - otherNode.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const maxDistance = isMobile ? 100 : 150
            
            if (distance < maxDistance) {
              const opacity = (1 - distance / maxDistance) * (theme === 'light' ? 0.3 : 0.2)
              
              // Parse color and create rgba
              let r, g, b
              if (lineColor.startsWith('#')) {
                const hex = lineColor.slice(1)
                r = parseInt(hex.slice(0, 2), 16)
                g = parseInt(hex.slice(2, 4), 16)
                b = parseInt(hex.slice(4, 6), 16)
              } else {
                 // Fallback colors - always red
                 [r, g, b] = [220, 38, 127]
               }
              
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
              ctx.lineWidth = 0.8
              ctx.beginPath()
              ctx.moveTo(node.x, node.y)
              ctx.lineTo(otherNode.x, otherNode.y)
              ctx.stroke()
            }
          }
        })
        
        // Draw node
        let r, g, b
        if (nodeColor.startsWith('#')) {
          const hex = nodeColor.slice(1)
          r = parseInt(hex.slice(0, 2), 16)
          g = parseInt(hex.slice(2, 4), 16)
          b = parseInt(hex.slice(4, 6), 16)
        } else {
           // Fallback colors - always red
           [r, g, b] = [220, 38, 127]
         }
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${node.opacity})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Add glow effect when mouse is near
        if (node.radius > node.baseRadius) {
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`
          ctx.shadowBlur = node.radius * 2
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${node.opacity * 0.3})`
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('mousemove', handleMouseMove)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isMobile, theme, mounted])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}

export default BackgroundNodes