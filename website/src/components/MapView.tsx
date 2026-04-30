'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { DEFAULT_COLORS } from '@/lib/map-utils'

type Colors = typeof DEFAULT_COLORS

interface Props {
  initialRegions: Record<string, string>
  initialColors: Colors
  editable: boolean
  onSave?: (regions: Record<string, string>, colors: Colors) => void
  shareSlot?: React.ReactNode
}

const EXCLUDE = new Set(['840', '124'])

const STATUS_CYCLE  = ['unvisited', 'visited', 'lived']
const STATUS_LABELS: Record<string, string> = {
  unvisited: 'Unvisited',
  visited:   'Visited',
  lived:     'Lived here',
  home:      'Home',
}

export default function MapView({ initialRegions, initialColors, editable, onSave, shareSlot }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef   = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  // Mutable D3 state — mutations don't need re-renders
  const regionStatusRef = useRef<Record<string, string>>({ ...initialRegions })
  const homeRegionRef   = useRef<string | null>(null)
  const colorsRef       = useRef<Record<string, string>>({ unvisited: '#2a3a42', ...initialColors })
  const homeModeRef     = useRef(false)

  // Incremented on popstate to re-trigger D3 init after back navigation
  const [initKey, setInitKey] = useState(0)

  // React state — drives UI re-renders
  const [allColors, setAllColors] = useState<Record<string, string>>({ unvisited: '#2a3a42', ...initialColors })
  const [counts, setCounts] = useState({ visited: 0, lived: 0, home: 0 })
  const [total, setTotal]   = useState(0)
  const [homeMode, setHomeMode] = useState(false)
  const [cpOpen,   setCpOpen]   = useState(false)
  const [cpTarget, setCpTarget] = useState<string>('visited')
  const [cpValue,  setCpValue]  = useState('#1D9E75')

  // Keep homeModeRef in sync
  useEffect(() => { homeModeRef.current = homeMode }, [homeMode])

  // Re-initialize map after back navigation (Next.js preserves component from router cache)
  useEffect(() => {
    const handlePop = () => setInitKey(k => k + 1)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const updateCounts = useCallback(() => {
    const c = { visited: 0, lived: 0, home: 0 }
    for (const s of Object.values(regionStatusRef.current)) {
      if (s in c) c[s as keyof typeof c]++
    }
    setCounts(c)
  }, [])

  const repaintAll = useCallback((animate = true) => {
    gRef.current?.selectAll<SVGPathElement, unknown>('path[data-rid]').each(function () {
      const id = this.getAttribute('data-rid')
      if (!id) return
      const sel = d3.select(this)
      const fill = colorsRef.current[regionStatusRef.current[id] || 'unvisited']
      if (animate) sel.transition().duration(250).attr('fill', fill)
      else sel.attr('fill', fill)
    })
  }, [])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerSave = useCallback(() => {
    if (!onSave) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const { unvisited: _u, ...saveColors } = colorsRef.current
      onSave({ ...regionStatusRef.current }, saveColors as Colors)
    }, 800)
  }, [onSave])


  // Main D3 setup — runs once
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    let cancelled = false
    let currentK  = 1
    let isDragging   = false
    let dragStartPos: [number, number] | null = null

    const W = 1200, H = 520
    d3.select(svgEl).selectAll('*').remove()

    const svg        = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`)
    const projection = d3.geoNaturalEarth1().rotate([-10, 0]).scale(W / 6.3).translate([W / 2, H / 2])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geoPath    = d3.geoPath().projection(projection) as any

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 300])
      .translateExtent([[0, 0], [W, H]])
      // At 1x: single finger defers to CSS scroll. When zoomed in: single finger pans the map.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((ev: any) => {
        if (ev.touches) {
          if (ev.touches.length === 1) return currentK > 1
          return ev.touches.length >= 2
        }
        return !ev.ctrlKey && !ev.button
      })
      .on('start', (ev) => {
        isDragging = false
        if (ev.sourceEvent?.type === 'mousedown')
          dragStartPos = [ev.sourceEvent.clientX, ev.sourceEvent.clientY]
      })
      .on('zoom', (ev) => {
        const t = ev.transform
        currentK = t.k
        g.attr('transform', t.toString())
        g.selectAll('.country-path').attr('stroke-width', 0.5 / t.k)
        g.selectAll('.us-state-path').attr('stroke-width', 0.3 / t.k)
        g.selectAll('.ca-province-path').attr('stroke-width', 0.3 / t.k)
        const zb = document.getElementById('wmt-zoom')
        if (zb) zb.textContent = `${Math.round(t.k)}x`
        const rb = document.getElementById('wmt-res')
        if (rb) rb.style.display = t.k >= 4 ? 'block' : 'none'
        if (ev.sourceEvent && dragStartPos) {
          const dx = ev.sourceEvent.clientX - dragStartPos[0]
          const dy = ev.sourceEvent.clientY - dragStartPos[1]
          if (Math.sqrt(dx * dx + dy * dy) > 4) isDragging = true
        }
        // Hand touch control back to CSS when fully zoomed out, D3 when zoomed in
        svgEl.style.touchAction = t.k > 1 ? 'none' : 'pan-x pan-y'
      })
      .on('end', () => { setTimeout(() => { isDragging = false }, 50) })

    svg.call(zoom).on('dblclick.zoom', null)
    // D3 sets touch-action:none — restore pan so single-finger scrolls the container on mobile
    svgEl.style.touchAction = 'pan-x pan-y'
    zoomRef.current = zoom
    const g = svg.append('g')
    gRef.current = g

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function makePaths(sel: any, features: any[], idFn: (d: any) => string, nameFn: (d: any) => string, cls: string, sw: number) {
      sel.selectAll('.' + cls + '-path')
        .data(features, idFn)
        .join('path')
        .attr('class', cls + '-path')
        .attr('d', geoPath)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('fill', (d: any) => colorsRef.current[regionStatusRef.current[idFn(d)] || 'unvisited'])
        .attr('stroke', '#fff')
        .attr('stroke-width', sw / currentK)
        .attr('data-rid', idFn)
        .style('cursor', editable ? 'pointer' : 'default')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('mouseover', function (this: SVGPathElement, _ev: MouseEvent, d: any) {
          if (isDragging) return
          d3.select(this).raise().attr('stroke', '#222').attr('stroke-width', (sw * 3) / currentK)
          const tip = document.getElementById('wmt-tip')
          if (tip) {
            const status = regionStatusRef.current[idFn(d)] || 'unvisited'
            tip.innerHTML = `<strong>${nameFn(d)}</strong>&nbsp;&nbsp;<span style="color:#888">${STATUS_LABELS[status]}</span>`
            tip.style.opacity = '1'
          }
        })
        .on('mousemove', (ev: MouseEvent) => {
          if (isDragging) { const t = document.getElementById('wmt-tip'); if (t) t.style.opacity = '0'; return }
          const tip = document.getElementById('wmt-tip')
          if (tip) { tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY - 36}px` }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('mouseout', function (this: SVGPathElement) {
          d3.select(this).attr('stroke', '#fff').attr('stroke-width', sw / currentK)
          const tip = document.getElementById('wmt-tip')
          if (tip) tip.style.opacity = '0'
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('click', function (this: SVGPathElement, ev: MouseEvent, d: any) {
          if (!editable || isDragging) return
          ev.stopPropagation()
          const id   = idFn(d)
          const name = nameFn(d)

          if (homeModeRef.current) {
            if (homeRegionRef.current && homeRegionRef.current !== id) {
              regionStatusRef.current[homeRegionRef.current] = 'lived'
            }
            homeRegionRef.current = id
            regionStatusRef.current[id] = 'home'
            repaintAll()
            setHomeMode(false)
            updateCounts()
            triggerSave()
            const info = document.getElementById('wmt-info')
            if (info) info.textContent = `${name}: Home base set`
            return
          }

          const cur  = regionStatusRef.current[id] || 'unvisited'
          const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
          if (next === 'unvisited') delete regionStatusRef.current[id]
          else regionStatusRef.current[id] = next
          if (id === homeRegionRef.current && next !== 'home') homeRegionRef.current = null

          d3.select(this).transition().duration(250).attr('fill', colorsRef.current[next])
          const info = document.getElementById('wmt-info')
          if (info) info.textContent = `${name}: ${STATUS_LABELS[next]}`
          updateCounts()
          triggerSave()
        })
    }

    const loadingEl = document.getElementById('wmt-loading')

    Promise.all([
      d3.json('/topo/countries-110m.json'),
      d3.json('/topo/states-10m.json'),
      d3.json('/topo/canada-provinces.geojson'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]).then(([world, usStates, caProvinces]: any[]) => {
      if (cancelled) return
      if (loadingEl) loadingEl.style.display = 'none'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countries = (topojson.feature(world, world.objects.countries) as any).features
        .filter((d: any) => !EXCLUDE.has(String(d.id)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usF = (topojson.feature(usStates, usStates.objects.states) as any).features
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caF = caProvinces.features as any[]

      const gC = g.append('g').attr('class', 'layer-countries')
      const gU = g.append('g').attr('class', 'layer-us')
      const gCA = g.append('g').attr('class', 'layer-canada')

      makePaths(gC,  countries, d => 'c_'  + d.id,                       d => d.properties?.name || 'Country',  'country',   0.5)
      makePaths(gU,  usF,       d => 'us_' + d.id,                       d => d.properties?.name || 'State',    'us-state',  0.3)
      makePaths(gCA, caF,       d => 'ca_' + d.properties?.['hc-a2'],    d => d.properties?.name || 'Province', 'ca-province', 0.3)

      setTotal(countries.length + usF.length + caF.length)
      updateCounts()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d3.json('/topo/countries-50m.json').then((worldHi: any) => {
        if (cancelled || !worldHi) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        zoom.on('zoom.hires', (ev: any) => {
          if (ev.transform.k >= 4) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hi = (topojson.feature(worldHi, worldHi.objects.countries) as any).features
              .filter((d: any) => !EXCLUDE.has(String(d.id)))
            makePaths(g.select('.layer-countries'), hi, d => 'c_' + d.id, d => d.properties?.name || 'Country', 'country', 0.5)
            g.selectAll('.country-path').attr('stroke-width', 0.5 / currentK)
            zoom.on('zoom.hires', null)
          }
        })
      }).catch(() => {})
    }).catch((err) => {
      console.error('[MapView] failed to load map data:', err)
      if (loadingEl) loadingEl.textContent = 'Failed to load map.'
    })

    return () => {
      cancelled = true
      svg.on('.zoom', null)
      d3.select(svgEl).selectAll('*').remove()
    }
  // repaintAll, updateCounts, triggerSave are stable useCallback refs — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey])

  function handleOpenColorPicker(status: string) {
    if (cpOpen && cpTarget === status) { setCpOpen(false); return }
    setCpTarget(status)
    setCpValue(colorsRef.current[status])
    setCpOpen(true)
  }

  function handleApplyColor() {
    colorsRef.current[cpTarget] = cpValue
    setAllColors(prev => ({ ...prev, [cpTarget]: cpValue }))
    repaintAll()
    updateCounts()
    triggerSave()
    setCpOpen(false)
  }

  function handleResetZoom() {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(600)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }

  function handleClearAll() {
    regionStatusRef.current = {}
    homeRegionRef.current   = null
    repaintAll(false)
    updateCounts()
    triggerSave()
    const info = document.getElementById('wmt-info')
    if (info) info.textContent = ''
  }

  return (
    <>
      <div
        id="wmt-tip"
        style={{
          position: 'fixed', background: 'white', border: '0.5px solid #ccc',
          borderRadius: '8px', padding: '5px 11px', fontSize: '12px',
          pointerEvents: 'none', opacity: 0, transition: 'opacity 0.1s',
          zIndex: 100, whiteSpace: 'nowrap', color: '#111',
        }}
      />

      {/* Color key — always visible; interactive only when editable */}
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs text-white/40 uppercase tracking-wide">Color key:</span>
          {(['visited', 'lived', 'home'] as const).map(status => (
            editable ? (
              <button
                key={status}
                onClick={() => handleOpenColorPicker(status)}
                className="text-xs px-2.5 py-0.5 rounded-full cursor-pointer"
                style={{ background: allColors[status], color: 'white' }}
              >
                {status}
              </button>
            ) : (
              <span
                key={status}
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: allColors[status], color: 'white' }}
              >
                {status}
              </span>
            )
          ))}
          {editable && <span className="text-xs text-white/25">Click to recolor</span>}
        </div>
        <div className="flex gap-1.5 items-center">
          {shareSlot}
          {editable && (
            <>
              <button
                onClick={() => setHomeMode(m => !m)}
                className="text-xs px-2.5 py-1 rounded-md cursor-pointer"
                style={{
                  border: `1.5px solid ${allColors.home}`,
                  background: homeMode ? allColors.home : 'transparent',
                  color: homeMode ? 'white' : allColors.home,
                }}
              >
                Set home
              </button>
              <button
                onClick={handleResetZoom}
                className="text-xs px-2.5 py-1 rounded-lg border border-white/15 text-white/50 hover:bg-white/5 hover:text-white/80 cursor-pointer transition-colors"
              >
                Reset view
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs px-2.5 py-1 rounded-lg border border-white/15 text-white/50 hover:bg-white/5 hover:text-white/80 cursor-pointer transition-colors"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats — always visible */}
      <div className="grid grid-cols-4 gap-1.5 mb-2.5">
        {([
          ['Visited', counts.visited],
          ['Lived',   counts.lived],
          ['Home',    counts.home],
          ['Regions', total],
        ] as const).map(([label, value]) => (
          <div key={label} className="rounded-lg p-2 text-center" style={{ background: '#1e1e1f' }}>
            <div className="text-xs text-white/30 uppercase tracking-wide">{label}</div>
            <div className="text-xl font-medium text-white/80">{value}</div>
          </div>
        ))}
      </div>

      {editable && (
        <>
          {/* Color picker panel */}
          {cpOpen && (
            <div className="flex items-center gap-3 flex-wrap border border-[#383838] rounded-lg px-3.5 py-2.5 mb-2.5" style={{ background: '#1e1e1f' }}>
              <span className="text-xs text-white/40 uppercase tracking-wide">
                Color for: {STATUS_LABELS[cpTarget] ?? cpTarget}
              </span>
              <input
                type="color"
                value={cpValue}
                onChange={e => setCpValue(e.target.value)}
                className="w-9 h-7 rounded cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={cpValue}
                onChange={e => {
                  const v = e.target.value
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setCpValue(v)
                }}
                className="w-24 text-xs px-2 py-1 rounded-lg border border-[#383838] text-white/60 bg-transparent font-mono"
                spellCheck={false}
              />
              <button
                onClick={handleApplyColor}
                className="text-xs px-2.5 py-1 border border-white/15 rounded-lg text-white/50 hover:bg-white/5 hover:text-white/80 cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          {/* Home mode banner */}
          {homeMode && (
            <div className="rounded-lg px-3 py-1.5 mb-2.5 text-xs text-center" style={{ background: '#1d1d1e', border: `1px solid ${allColors.home}`, color: allColors.home }}>
              Home mode — click a region to set as your home base
            </div>
          )}
        </>
      )}

      {/* Map */}
      <div
        className="w-full overflow-x-auto rounded-lg cursor-grab active:cursor-grabbing"
        style={{ WebkitOverflowScrolling: 'touch', border: '1px solid #2a2a2b' } as React.CSSProperties}
      >
        <div
          style={{ minWidth: '900px', height: '520px', position: 'relative', background: '#1d1d1e' }}
        >
          <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <div
            id="wmt-loading"
            className="absolute inset-0 flex items-center justify-center text-sm text-gray-400"
            style={{ background: '#1d1d1e' }}
          >
            Loading map…
          </div>
          <div id="wmt-res" style={{ display: 'none', position: 'absolute', bottom: 8, right: 8, fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.8)', borderRadius: 10, color: '#555' }}>
            hi-res
          </div>
          <div id="wmt-zoom" style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.8)', borderRadius: 10, color: '#555' }}>
            1x
          </div>
        </div>
      </div>

      <div id="wmt-info" style={{ marginTop: 6, fontSize: 12, color: '#666', minHeight: 18, textAlign: 'center' }} />
    </>
  )
}
